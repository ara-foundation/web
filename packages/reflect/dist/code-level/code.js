/**
 * The script that works with the code by turning it into the
 * AST (Abstract Syntax Tree)
 */
import { Project, SourceFile as TsSourceFile, Node } from "ts-morph";
import { Result, Debug } from "@ara-web/p-hintjens";
import { ModuleLink, ObjectNode } from "@ara-web/sds";
import { ModuleMemory, ProjectMemory, BuiltInIdentifiers, FilePath, codePieceOps, MODULE_SELECTOR } from "../index.js";
import { VariableLevel } from "./variable-level/index.js";
import { ImportLevel } from "./import-level/index.js";
import { TypeLevel } from "./type-level/index.js";
import { CodePiece, CodePieceType } from "./code-piece.js";
import { ValueTypeString } from "./code-piece-types.js";
import { AstNodeTraits } from "./ast-node-traits.js";
import { CodePieceContext } from "./code-piece-context.js";
import { ValueLevel } from "./value-level/index.js";
export class Code {
    _ast;
    _moduleLink; // Module that this code belong to
    code;
    project;
    tempCodeAmount;
    /********************************************************/
    /**
     * Convert the source code into the AST tree
     * @param source the typescript code
     */
    constructor(code, moduleLink, tempCodeAmount = 0) {
        this.tempCodeAmount = tempCodeAmount;
        this.code = code;
        this.project = new Project({
            useInMemoryFileSystem: true
        });
        this._moduleLink = moduleLink;
        this._ast = this.project.createSourceFile(`__temp.ts`, code);
    }
    /**
     * Gets from AST all child nodes.
     * AST's children at the root level are list of code pieces.
     * Instead parsing at the AST level, we check in the sub child level.
     * @param filters
     * @returns {Node[]}
     */
    getTsNodes = (filters) => {
        const nodes = [];
        for (let child of this._ast.getChildren()) {
            const children = AstNodeTraits.getChildren(child, filters);
            nodes.push(...children);
        }
        return nodes;
    };
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Import Declarations
    //
    /////////////////////////////////////////////////////////////////////////////////////////////
    /**
     * Parses the entire code for any import clauses. If any import clause,
     * then, using `./import-declarations.ts` will turn them into the import identifiers.
     *
     * This is the first function called by Reflect.
     * @returns AstIdentifiers
     */
    getImportedIdentifiers = async (projectMemory) => {
        let identifiers = [];
        const tsNodes = this.getTsNodes();
        for (let tsNode of tsNodes) {
            if (!ImportLevel.isImportDeclaration(tsNode)) {
                continue;
            }
            const importClause = await ImportLevel.getImportClause(tsNode);
            if (importClause.isFailure) {
                return Result.fail(`ImportDeclaration.fromTsNode(tsNode: '${tsNode.getText()}'): ${importClause.errorTitle}`, importClause.errorDescription);
            }
            const identifiedModuleLink = this.importClauseToModuleLink(importClause.getValue(), this._moduleLink, projectMemory);
            if (identifiedModuleLink.isFailure) {
                return Result.fail(`this.importClauseToModuleLink('${importClause.getValue()}', '${this._moduleLink.moduleURL}'): ${identifiedModuleLink.errorTitle}`, identifiedModuleLink.errorDescription);
            }
            let importIdentifiers = (await ImportLevel.getIdentifiers(tsNode)).getValue();
            const defaultIdentifier = (await ImportLevel.getDefaultIdentifier(tsNode)).getValue();
            importIdentifiers = this.setImportPaths(identifiedModuleLink.getValue(), defaultIdentifier, importIdentifiers);
            identifiers = [...identifiers, ...importIdentifiers];
        }
        return Result.ok(identifiers);
    };
    /**
     * Creates a link that this import declaration imports from.
     * @returns {AraLink<string>} Link to the import
     */
    importClauseToModuleLink = (importClause, callingModulePath, projectMemory) => {
        // Not a module link, then package link?
        const packageLink = ModuleLink.newPackageURLFromImportClause(importClause);
        const packageExists = projectMemory.isModuleExist(packageLink);
        if (packageExists) {
            return Result.ok(packageLink);
        }
        // First assuming the importClause is referencing to a file.
        const absoluteImportPath = FilePath.getFileAbsolutePath(importClause, callingModulePath.toFilePath);
        if (FilePath.isFileExist(absoluteImportPath)) {
            const moduleExists = projectMemory.isModuleExist(absoluteImportPath);
            if (moduleExists) {
                return Result.ok(absoluteImportPath);
            }
        }
        else {
            const filePaths = projectMemory.getModuleWithFileExtensions(absoluteImportPath);
            for (let filePath of filePaths) {
                const moduleExists = projectMemory.isModuleExist(filePath);
                if (moduleExists) {
                    return Result.ok(filePath);
                }
            }
        }
        return Result.fail(`Not found`, `The '${importClause}' is not a file module at '${absoluteImportPath}'. It's also not a package at '${packageLink.moduleURL}' in the project memory`);
    };
    setImportPaths = (importModuleLink, defaultIdentifier, astIdentifiers) => {
        for (let ast in astIdentifiers) {
            const astNode = astIdentifiers[ast];
            if (!(astNode instanceof CodePiece)) {
                continue;
            }
            astNode.importPath = importModuleLink;
            if (astNode.memoryDataLength() > 0) {
                const memoryData = astNode.getAllMemoryData();
                for (let memoryIndex = 0; memoryIndex < memoryData.length; memoryIndex++) {
                    memoryData[memoryIndex].importPath = importModuleLink;
                    astNode.postMemoryData(memoryIndex, memoryData[memoryIndex]);
                }
            }
            if (astNode.identifier === defaultIdentifier) {
                astIdentifiers[ast].data = importModuleLink;
            }
        }
        return astIdentifiers;
    };
    /**
     * Lint dependencies of the given module identified by type and path.
     *
     * @param moduleMemory
     * @param projectMemory {Lint from all modules}
     * @returns
     */
    getLintedImportIdentifiers = async (moduleMemory, projectMemory) => {
        const identifierNodes = moduleMemory.rest.getAll(MODULE_SELECTOR);
        const identifiers = identifierNodes.map(identifierNode => identifierNode.getElement()).filter(codePiece => codePiece !== null && CodePiece.isDefinedInOtherModule(codePiece));
        for (let identifier in identifiers) {
            let node = identifiers[identifier];
            const identifiedValue = await this.identifyImportedIdentifier(node, projectMemory);
            if (identifiedValue.isFailure) {
                return Result.fail(`identifyImportedIdentifier('${identifier}'): ${identifiedValue.errorTitle}`, identifiedValue.errorDescription);
            }
            if (identifiedValue.getValue().data === undefined) {
                const err = Debug.error(`The import identifier '${identifier}' of '${node.nodeType}' data is undefined`, `Update the lintImportedIndetifiers() to supported it, since the data returned as undefined`, { node, identifiedValue });
                return Result.fail(err);
            }
            identifiers[identifier] = identifiedValue.getValue();
        }
        return Result.ok(identifiers);
    };
    /**
     * If the node type is a Type, then it simply sets the {} empty object and leaves as it is.
     *
     * Otherwise, for all others, it will get the glob data and put it on the import.
     * @param identifiedNode
     * @requires identifiedNode.identifier
     * @requires idenfifiedNode.importPath
     * @limitation Make sure identifiedNode passes the AstNode.isDefinedInOtherModule() before calling this function.
     * @returns
     */
    identifyImportedIdentifier = async (identifiedNode, memory) => {
        if (identifiedNode.identifier === undefined) {
            return Result.fail(`The identifier property is missing`, `Set the identifier property before calling identifyImportedIdentifier()`);
        }
        if (identifiedNode.nodeType === CodePieceType.Type) {
            identifiedNode.data = {};
            return Result.ok(identifiedNode);
        }
        if (identifiedNode.importPath === undefined) {
            return Result.fail(`getImportModulePath(): '${identifiedNode.identifier}' module path is not found`, `Make sure this node is import node, or fix AstNode.getImportModulePath()`);
        }
        const identifiedMemory = memory.getModule(identifiedNode.importPath);
        if (identifiedMemory.isFailure) {
            return Result.fail(`memory.identifyModuleByPath(modulePath: '${identifiedNode.importPath.toString()}'): ${identifiedMemory.errorTitle}`, identifiedMemory.errorDescription);
        }
        const glob = identifiedMemory.getValue().glob;
        if (identifiedNode.memoryDataLength() > 0) {
            const memoryNode = identifiedNode.getMemoryData(0);
            const identifiedMemoryNode = await this.identifyImportedIdentifier(memoryNode, memory);
            if (identifiedMemoryNode.isFailure) {
                return Result.fail(`${identifiedNode.identifier}.getMemoryData(0): this.identifyImportedIdentifier('${memoryNode.identifier}'): ${identifiedMemoryNode.errorTitle}`, identifiedMemoryNode.errorDescription);
            }
            if (!identifiedNode.deleteMemoryData(0)) {
                return Result.fail(`identifiedNode.deleteMemoryData(0): failed`, `Please update the ast node class`);
            }
            identifiedNode.data = identifiedMemoryNode.getValue().data;
            identifiedNode.nodeType = identifiedMemoryNode.getValue().nodeType;
            identifiedNode.dataType = identifiedMemoryNode.getValue().dataType;
            return Result.ok(identifiedNode);
        }
        // If the import is default import, then data is AraLink.
        if (identifiedNode.data instanceof ModuleLink) {
            identifiedNode.data = glob.default;
        }
        else {
            let data = glob[identifiedNode.identifier];
            identifiedNode.data = data;
            identifiedNode.dataType = (typeof data);
            if (identifiedNode.dataType === ValueTypeString.number ||
                identifiedNode.dataType === ValueTypeString.boolean ||
                identifiedNode.dataType === ValueTypeString.string) {
                identifiedNode.nodeType = CodePieceType.Literal;
            }
        }
        if (typeof identifiedNode.data === "function") {
            identifiedNode.nodeType = CodePieceType.Function;
        }
        return Result.ok(identifiedNode);
    };
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Type Declarations
    //
    /////////////////////////////////////////////////////////////////////////////////////////////
    getLintedTypeIdentifiers = async (memory, projectMemory) => {
        const identifierNodes = memory.rest.getAll(MODULE_SELECTOR);
        const typesToLint = identifierNodes
            .map(identifierNode => identifierNode.getElement())
            .filter(codePiece => CodePiece.isDefinedInLocal(codePiece))
            .filter(codePiece => CodePiece.isTypeDeclaration(codePiece))
            .filter(codePiece => BuiltInIdentifiers.isNonBuiltInIdentifier(codePiece));
        const typesCount = typesToLint.length;
        if (typesCount == 0) {
            return Result.ok(memory.rest.getAll(MODULE_SELECTOR).map(node => node.getElement()));
        }
        typesToLint.forEach((node, index, arr) => {
            if (typeof node.data === "string") {
                arr[index].dataType = node.data;
                return;
            }
            const moduleIdentifiers = identifierNodes
                .map(identifierNode => identifierNode.getElement())
                .filter(codePiece => CodePiece.isTypeDeclaration(codePiece))
                .filter(codePiece => codePiece.identifier !== node.identifier);
            const memoryContext = new CodePieceContext([], moduleIdentifiers, projectMemory);
            const lintedNode = TypeLevel.lintType(node, memoryContext);
            if (lintedNode.isFailure) {
                return Result.fail(`TypeLevel.lintType(node: '${node.identifier}'): ${lintedNode.errorTitle}`, lintedNode.errorDescription);
            }
            arr[index] = lintedNode.getValue();
        });
        return Result.ok(typesToLint);
    };
    /**
     * Returns all the types defined in this code.
     * @param memory
     * @returns
     */
    getTypeIdentifiers = async () => {
        const tsNodes = this.getTsNodes();
        const typeDeclarations = await TypeLevel.getTypeIdentifiers(tsNodes);
        if (typeDeclarations.isFailure) {
            return Result.fail(`TypeLevel.getTypeIdentifiers(): ${typeDeclarations.errorTitle}`, typeDeclarations.errorDescription);
        }
        return Result.ok(typeDeclarations.getValue());
    };
    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Variable Declarations
    //
    /////////////////////////////////////////////////////////////////////////////////////////////
    getVariableIdentifiers = async () => {
        const tsNodes = this.getTsNodes();
        const identifiers = await VariableLevel.getVariableIdentifiers(tsNodes);
        if (identifiers.isFailure) {
            return Result.fail(`VariableLevel.getVariableIdentifiers(): ${identifiers.errorTitle}`, identifiers.errorDescription);
        }
        return Result.ok(identifiers.getValue());
    };
    getLintedVariableIdentifiers = async (memory, projectMemory) => {
        const identifierNodes = memory.rest.getAll(MODULE_SELECTOR);
        const varsToLint = identifierNodes
            .map(identifierNode => identifierNode.getElement())
            .filter(codePiece => CodePiece.isDefinedInLocal(codePiece))
            .filter(codePiece => CodePiece.isVariableDeclaration(codePiece))
            .filter(codePiece => BuiltInIdentifiers.isNonBuiltInIdentifier(codePiece));
        const typesCount = Object.keys(varsToLint).length;
        if (typesCount == 0) {
            return Result.ok(memory.rest.getAll(MODULE_SELECTOR).map(node => node.getElement()));
        }
        for (let identifier in varsToLint) {
            let node = varsToLint[identifier];
            if (typeof node.data === "string") {
                node.dataType = node.data;
                continue;
            }
            const identifierNodes = memory.rest.getAll(MODULE_SELECTOR);
            const moduleIdentifiers = identifierNodes
                .map(identifierNode => identifierNode.getElement())
                .filter(codePiece => codePiece.identifier !== identifier);
            const memoryContext = new CodePieceContext([], moduleIdentifiers, projectMemory);
            const lintedVariable = await ValueLevel.identifyAstNodeData(node, memoryContext);
            if (lintedVariable.isFailure) {
                return Result.fail(`ValueLevel.identifyAstNodeData(node: '${identifier}'): ${lintedVariable.errorTitle}`, lintedVariable.errorDescription);
            }
            else {
                if (lintedVariable.getValue().data === undefined) {
                    const err = Debug.error(`The variable '${identifier}' of '${node.nodeType}' data is undefined`, `Update the lintVariableIdentifiers() to supported it, since the data returned as undefined`, { node, lintedVariable });
                    return Result.fail(err);
                }
                varsToLint[identifier].data = lintedVariable.getValue().data;
                varsToLint[identifier].dataType = lintedVariable.getValue().dataType;
            }
        }
        return Result.ok(varsToLint);
    };
    /**
     * Find the result of the expression, by setting it as a variable declaration.
     * @param {string} exp a JS doc that after evaluating gives the result
     * @returns {T} the result of the expression
     */
    static identifyCodePiece = async (expression, projectMemory, optionalIdentifiers) => {
        const tempMemory = new ModuleMemory("__temp", ModuleLink.newFileURL(import.meta.filename), projectMemory);
        if (optionalIdentifiers !== undefined) {
            optionalIdentifiers.forEach((codePiece) => {
                tempMemory.rest.post('*', codePiece, {});
            });
        }
        const tempVarName = "__temp_var_";
        const code = new Code(`const ${tempVarName} = ${expression}`, tempMemory.moduleLink);
        const vars = await code.getVariableIdentifiers();
        if (vars.isFailure) {
            return Result.fail(`code.getVariableIdentifiers(): ${vars.errorTitle}`, vars.errorDescription);
        }
        else {
            vars.getValue().forEach((codePiece) => {
                tempMemory.rest.post('*', codePiece, {});
            });
            const tempVarValue = vars.getValue().find((codePiece) => codePiece.identifier === tempVarName);
            if (tempVarValue === undefined) {
                return Result.fail(`Failed to retreive temporary variable name`, `The expression '${expression}' is not a valid JS code`);
            }
        }
        const expressionIdentified = await code.getLintedVariableIdentifiers(tempMemory, projectMemory);
        if (expressionIdentified.isFailure) {
            return Result.fail(`code.getLintedVariableIdentifiers(): ${expressionIdentified.errorTitle}`, expressionIdentified.errorDescription);
        }
        const tempVar = expressionIdentified.getValue().find((codePiece) => codePiece.identifier === tempVarName);
        if (tempVar === undefined) {
            return Result.fail(`Failed to retreive temporary variable name`, `The expression '${expression}' is not a valid JS code`);
        }
        return Result.ok({ data: tempVar.data, dataType: tempVar.dataType });
    };
}
