/**
 * The script that works with the code by turning it into the 
 * AST (Abstract Syntax Tree)
 * @todo Make the components nested to each other
 * @todo fix the parsing of all pages
 * @todo somehow we need to show on PageModal the meta components
 */
import { Project, SourceFile as TsSourceFile } from "ts-morph";
import { AraLink, Result, Debug, ModuleLink } from "@ara-web/ts-enhancement";

import { 
    ModuleMemory, 
    ProjectMemory,
    BuiltInIdentifiers,
    FilePath
} from "../index.js";

import { VariableLevel } from "./variable-level/index.js";
import { ImportLevel } from "./import-level/index.js";
import { TypeLevel } from "./type-level/index.js";

import { AstNode, type AstIdentifiers, AstNodeType } from "./ast-node.js";
import { ValueTypeString, type ValueType } from "./ast-node-data.js";
import { TsNode, type TsNodeValidator } from "./ts-node.js";
import { AstNodeContext } from "./AstNodeContext.js";

export type Object = {[key: string]: ValueType};


export class Code {
    private _ast: TsSourceFile;
    private _moduleLink: ModuleLink;    // Module that this code belong to
    code: string;
    project: Project;
    tempCodeAmount: number;

    /********************************************************/

    /**
     * Convert the source code into the AST tree
     * @param source the typescript code
     */
    constructor(code: string, moduleLink: ModuleLink, tempCodeAmount = 0) {
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
     * @returns {TsNode[]}
     */
    public getTsNodes = (filters?: TsNodeValidator[]): TsNode[] => {
        const nodes: TsNode[] = [];
        for (let child of this._ast.getChildren()) {
            const children = new TsNode(child).getChildren(filters);
            
            nodes.push(...children)
        }

        return nodes;
    }

    // /**
    //  * Clone the Code with the new AST.
    //  * Used to evaluate various attributes by manipulating AST itself.
    //  * @returns {Code}
    //  */
    // private clone = (): this => {
    //     const cloned = new (this.constructor as typeof Code)(this.code, this.tempCodeAmount) as this;
    //     return cloned;
    // }

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
    public getImportedIdentifiers = async (projectMemory: ProjectMemory): Promise<Result<AstIdentifiers>> => {
        let identifiers: AstIdentifiers = {};
        const tsNodes = this.getTsNodes()

        for (let tsNode of tsNodes) {
            if (!ImportLevel.isImportDeclaration(tsNode)) {
                continue;
            }
            const importClause = await ImportLevel.getImportClause(tsNode);
            
            if (importClause.isFailure) {
                return Result.fail(
                    `ImportDeclaration.fromTsNode(tsNode: '${tsNode.getText()}'): ${importClause.errorTitle}`,
                    importClause.errorDescription!
                )
            }

            const identifiedModuleLink = this.importClauseToModuleLink(importClause.getValue(), this._moduleLink, projectMemory);
            if (identifiedModuleLink.isFailure) {
                return Result.fail(
                    `this.importClauseToModuleLink('${importClause.getValue()}', '${this._moduleLink.moduleURL}'): ${identifiedModuleLink.errorTitle}`,
                    identifiedModuleLink.errorDescription!
                )
            }

            let importIdentifiers = (await ImportLevel.getIdentifiers(tsNode)).getValue();
            const defaultIdentifier = (await ImportLevel.getDefaultIdentifier(tsNode)).getValue();
            
            importIdentifiers = this.setImportPaths(identifiedModuleLink.getValue(), defaultIdentifier, importIdentifiers)
            identifiers = {...identifiers, ...importIdentifiers};
        }

        return Result.ok(identifiers);
    }

    /**
     * Creates a link that this import declaration imports from.
     * @returns {AraLink<string>} Link to the import
     */
    private importClauseToModuleLink = (importClause: string, callingModulePath: ModuleLink, projectMemory: ProjectMemory): Result<ModuleLink> => {
        // Not a module link, then package link?
        const packageLink = ModuleLink.newPackageURLFromImportClause(importClause);
        const packageExists = projectMemory.isModuleExist(packageLink);
        if (packageExists) {
            return Result.ok(packageLink);
        }

        // First assuming the importClause is referencing to a file.
        const absoluteImportPath = FilePath.getFileAbsolutePath(importClause, callingModulePath.toFilePath)
        if (FilePath.isFileExist(absoluteImportPath)) {
            const moduleExists = projectMemory.isModuleExist(absoluteImportPath)
            if (moduleExists) {
                return Result.ok(absoluteImportPath);
            }
        } else {
                const filePaths = projectMemory.getModuleWithFileExtensions(absoluteImportPath);
                for (let filePath of filePaths) {
                    const moduleExists = projectMemory.isModuleExist(filePath)
                    if (moduleExists) {
                        return Result.ok(filePath);
                    }       
                }
        }
        
        return Result.fail(
            `Not found`,
            `The '${importClause}' is not a file module at '${absoluteImportPath}'. It's also not a package at '${packageLink.moduleURL}' in the project memory`
        )
    }

    private setImportPaths = (importModuleLink: ModuleLink, defaultIdentifier: string|undefined, astIdentifiers: AstIdentifiers): AstIdentifiers => {
        for (let ast in astIdentifiers) {
            const astNode = astIdentifiers[ast];
            if (!(astNode instanceof AstNode)) {
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
                (astIdentifiers[ast] as AstNode).data = importModuleLink;
            }
        }

        return astIdentifiers;
    }

    /**
     * Lint dependencies of the given module identified by type and path.
     * 
     * @param moduleMemory 
     * @param projectMemory {Lint from all modules}
     * @returns 
     */
    public getLintedImportIdentifiers = async <T>(moduleMemory: ModuleMemory<T>, projectMemory: ProjectMemory): Promise<Result<AstIdentifiers>> => {
        const identifiers  = moduleMemory.getIdentifiers([AstNode.isDefinedInOtherModule])

        for (let identifier in identifiers) {
            let node = identifiers[identifier];

            const identifiedValue = await this.identifyImportedIdentifier(node, projectMemory)
            if (identifiedValue.isFailure) {
                return Result.fail(
                    `identifyImportedIdentifier('${identifier}'): ${identifiedValue.errorTitle}`,
                    identifiedValue.errorDescription!
                )
            }
            if (identifiedValue.getValue().data === undefined) {
                const err = Debug.error(
                    `The import identifier '${identifier}' of '${node.nodeType}' data is undefined`,
                    `Update the lintImportedIndetifiers() to supported it, since the data returned as undefined`,
                    {node, identifiedValue},
                )
                return Result.fail(err)
            }
            
            identifiers[identifier] = identifiedValue.getValue();
        }

        return Result.ok(identifiers);
    }

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
    private identifyImportedIdentifier = async(identifiedNode: AstNode, memory: ProjectMemory): Promise<Result<AstNode>> => {
        if (identifiedNode.identifier === undefined) {
            return Result.fail(
                `The identifier property is missing`,
                `Set the identifier property before calling identifyImportedIdentifier()`,
            )
        }

        if (identifiedNode.nodeType === AstNodeType.Type) {
            identifiedNode.data = {};
            return Result.ok(identifiedNode);
        }

        if (identifiedNode.importPath === undefined) {
            return Result.fail(
                `getImportModulePath(): '${identifiedNode.identifier}' module path is not found`,
                `Make sure this node is import node, or fix AstNode.getImportModulePath()`
            )
        }

        const identifiedMemory = memory.getModule(identifiedNode.importPath);
        if (identifiedMemory.isFailure) {
            return Result.fail(
                `memory.identifyModuleByPath(modulePath: '${identifiedNode.importPath.toString()}'): ${identifiedMemory.errorTitle}`,
                identifiedMemory.errorDescription!
            )
        }
        const glob = identifiedMemory.getValue().glob;

        if (identifiedNode.memoryDataLength() > 0) {
            const memoryNode = identifiedNode.getMemoryData(0)!;
            const identifiedMemoryNode = await this.identifyImportedIdentifier(memoryNode, memory);
            if (identifiedMemoryNode.isFailure) {
                return Result.fail(
                    `${identifiedNode.identifier}.getMemoryData(0): this.identifyImportedIdentifier('${memoryNode.identifier}'): ${identifiedMemoryNode.errorTitle}`,
                    identifiedMemoryNode.errorDescription!
                )
            }
            if (!identifiedNode.deleteMemoryData(0)) {
                return Result.fail(
                    `identifiedNode.deleteMemoryData(0): failed`,
                    `Please update the ast node class`
                )
            }
            identifiedNode.data = identifiedMemoryNode.getValue().data;
            identifiedNode.nodeType = identifiedMemoryNode.getValue().nodeType;
            identifiedNode.dataType = identifiedMemoryNode.getValue().dataType;

            return Result.ok(identifiedNode)
        }

        // If the import is default import, then data is AraLink.
        if (identifiedNode.data instanceof ModuleLink) {
            identifiedNode.data = (glob as any).default;
        } else {
            let data = (glob as any)[identifiedNode.identifier]
            identifiedNode.data = data;
            identifiedNode.dataType = ((typeof data) as ValueTypeString);
            if (identifiedNode.dataType === ValueTypeString.number || 
                identifiedNode.dataType === ValueTypeString.boolean ||
                identifiedNode.dataType === ValueTypeString.string
            ) {
                identifiedNode.nodeType = AstNodeType.Literal;
            }
        }
        if (typeof identifiedNode.data === "function") {
            identifiedNode.nodeType = AstNodeType.Function;
        }
        
        return Result.ok(identifiedNode);
    }

    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Type Declarations
    //
    /////////////////////////////////////////////////////////////////////////////////////////////

    public getLintedTypeIdentifiers = async <T>(memory: ModuleMemory<T>, projectMemory: ProjectMemory): Promise<Result<AstIdentifiers>> => {
        const localTypeFilters = [
            AstNode.isDefinedInLocal, 
            AstNode.isTypeDeclaration,
            BuiltInIdentifiers.isNonBuiltInIdentifier,
        ]
        const typesToLint  = memory.getIdentifiers(localTypeFilters)
        const typesCount = Object.keys(typesToLint).length;
        if (typesCount == 0) {
            return Result.ok(memory.getIdentifiers());
        }
        
        const moduleTypeFilters = [
            AstNode.isDefinedInLocal,
            AstNode.isTypeDeclaration,
        ]

        for (let identifier in typesToLint) {
            let node = typesToLint[identifier];
            if (!(node instanceof AraLink) && typeof (node as AstNode).data === "string") {
                node.dataType = (node as AstNode).data as ValueTypeString;
                continue;
            }
            const moduleIdentifiers = memory.getIdentifiers(moduleTypeFilters, [identifier])
            const memoryContext = new AstNodeContext([], moduleIdentifiers, projectMemory);
            const lintedNode = TypeLevel.lintType(node, memoryContext);
            if (lintedNode.isFailure) {
                return Result.fail(
                    `TypeLevel.lintType(node: '${identifier}'): ${lintedNode.errorTitle}`,
                    lintedNode.errorDescription!
                )
            }
        }
        return Result.ok(typesToLint);
    }

    /**
     * Returns all the types defined in this code.
     * @param memory 
     * @returns 
     */
    public getTypeIdentifiers = async (): Promise<Result<AstIdentifiers>> => {
        const tsNodes = this.getTsNodes();
        const typeDeclarations = await TypeLevel.getTypeIdentifiers(tsNodes);
        if (typeDeclarations.isFailure) {
            return Result.fail(
            `TypeLevel.getTypeIdentifiers(): ${typeDeclarations.errorTitle}`,
            typeDeclarations.errorDescription!
            )
        }
            
        return Result.ok(typeDeclarations.getValue());
    }


    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Variable Declarations
    //
    /////////////////////////////////////////////////////////////////////////////////////////////

    public getVariableIdentifiers = async (): Promise<Result<AstIdentifiers>> => {
        const tsNodes = this.getTsNodes();
        const identifiers = await VariableLevel.getVariableIdentifiers(tsNodes);
        if (identifiers.isFailure) {
            return Result.fail(
                `VariableLevel.getVariableIdentifiers(): ${identifiers.errorTitle}`,
                identifiers.errorDescription!
            )
        }

        return Result.ok(identifiers.getValue());
    }

    /**
     * Find the result of the expression, by setting it as a variable declaration.
     * @param {string} exp a JS doc that after evaluating gives the result
     * @returns {T} the result of the expression
     */
    public identifyCodePiece = async <T>(_exp: string): Promise<Result<T>> => {
        // this.tempCodeAmount++;
        // const varName = `__temp_var_${this.tempCodeAmount}`;
        // let cloned = this.clone();
        // const varStatement = cloned._ast.addVariableStatement({
        //     declarationKind: VariableDeclarationKind.Const, // defaults to "let"
        //     declarations: [{
        //       name: varName,
        //       type: "string",
        //       initializer: exp,
        //     }],
        // });

        //         // If Attribute name is an identifier, get variable statements that define them:
        // // For example `const v: number = 1`
        // const varDeclaration = this.identifyVariableDeclaration(varName);
        // if (varDeclaration.isFailure) {
        //     return Result.fail(
        //         `this.identifyVariableDeclaration(identifier='${varName}'): ${varDeclaration.errorTitle}`,
        //         varDeclaration.errorDescription!
        //     );
        // }
        
        return Result.errorCode501(['Code'], 'identifyCodePiece')

        // Debug.push(`identifyVariable(varName='${varName}', update=false)`)
        // // It may be not only identifier so clone and put it in the ast
        // var variable = await cloned.identifyVariable<T>(varName, false);
        // Debug.pop()
        // Debug.log(`${varName} identified value = ${JSON.stringify(variable)}.`)
        // // Once the _ara_web_exp is turned into the statement, get it's value.
        // Debug.pop();
        // Debug.reset();

        // if (variable.isFailure) {
        //     return Result.fail(
        //         `cloned.identifyVariable(varName=${varName}): ${variable.errorTitle}`,
        //         variable.errorDescription!
        //     )
        // }

        // return Result.ok(variable.getValue() as T)
    }

}
