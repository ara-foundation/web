/**
 * The script that works with the code by turning it into the 
 * AST (Abstract Syntax Tree)
 * @todo Make the components nested to each other
 * @todo fix the parsing of all pages
 * @todo somehow we need to show on PageModal the meta components
 */
import { 
    Project, 
    SourceFile as TsSourceFile, 
    VariableDeclarationKind,
    VariableDeclaration
} from "ts-morph";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { Result, Debug } from "@ara-web/ts-enhancement";
import { ImportDeclaration } from "./import-declaration.js";
import { AstNode, type AstIdentifiers, AstNodeType } from "./ast-node.js";
import { 
    ValueTypeString, 
    type ValueType, 
} from "./ast-node-data.js";
import { ModuleMemory } from "../memory/ModuleMemory.js";
import type { ProjectMemory } from "../memory/ProjectMemory.js";
import { TypeDeclaration } from "./type-declaration.js";
import { TsNode, type TsNodeValidator } from "./ts-node.js";
import { VariableStatement } from "./variable-level/variable-statement.js";
import { EnabledNodejsModules } from "../reflect-nodejs-ext/enabled-nodejs-module.js";
import { AstNodeContext } from "../memory/AstNodeContext.js";

export type Object = {[key: string]: ValueType};


export class Code {
    private _ast: TsSourceFile;
    code: string;
    project: Project;
    tempCodeAmount: number;

    /********************************************************/

    /**
     * Convert the source code into the AST tree
     * @param source the typescript code
     */
    constructor(code: string, tempCodeAmount = 0) {
        this.tempCodeAmount = tempCodeAmount;
        this.code = code;
        this.project = new Project({
            useInMemoryFileSystem: true
        })
        
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

    /**
     * Clone the Code with the new AST.
     * Used to evaluate various attributes by manipulating AST itself.
     * @returns {Code}
     */
    private clone = (): this => {
        const cloned = new (this.constructor as typeof Code)(this.code, this.tempCodeAmount) as this;
        return cloned;
    }

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
    public getImportedIdentifiers = (projectMemory: ProjectMemory): Result<AstIdentifiers> => {
        let identifiers: AstIdentifiers = {};
        const tsNodes = this.getTsNodes([ImportDeclaration.isImportDeclaration])

        for (let tsNode of tsNodes) {
            const importDeclaration = ImportDeclaration.fromTsNode(tsNode, projectMemory);
            
            if (importDeclaration.isFailure) {
                return Result.fail(
                    `ImportDeclaration.fromTsNode(tsNode: '${tsNode.getText()}'): ${importDeclaration.errorTitle}`,
                    importDeclaration.errorDescription!
                )
            }
        
            const importIdentifiers = importDeclaration.getValue().getIdentifiers();
            if (importIdentifiers.isFailure) {
                return Result.fail(
                    `importDeclaration.getIdentifiers('${tsNode.getText()}'): ${importIdentifiers.errorTitle}`,
                    importIdentifiers.errorDescription!
                )
            }
            identifiers = {...identifiers, ...importIdentifiers.getValue()};
        }

        return Result.ok(identifiers);
    }

    /**
     * Lint dependencies of the given module identified by type and path.
     * 
     * Fetches the import identifiers, and passes them into the lintImportedIdentifiers().
     * @param moduleMemory 
     * @param projectMemory {Lint from all modules}
     * @returns 
     */
    public getLintedImportIdentifiers = async <T>(moduleMemory: ModuleMemory<T>, projectMemory: ProjectMemory): Promise<Result<AstIdentifiers>> => {
        const identifiers  = moduleMemory.getIdentifiers([AstNode.isDefinedInOtherModule])

        const importIdentifiersCount = Object.keys(identifiers).length;
        if (importIdentifiersCount == 0) {
            return Result.ok(identifiers);
        }

        for (let identifier in identifiers) {
            let node = identifiers[identifier];

            if (node instanceof AraLink) {
                const refNode = moduleMemory.identifierByAraLink(node)
                if (refNode === undefined) {
                    return Result.fail(
                        `'${identifier}' is alias, but it's referenced data not found`
                    )
                }
                node = refNode;
            }

            // Debug.push(`this.identifyImportedIdentifier()`, {'identifiedNode': node.identifier!})
            const identifiedValue = await this.identifyImportedIdentifier(node, projectMemory)
            // Debug.pop();
            if (identifiedValue.isFailure) {
                return Result.fail(
                    `identifyImportedIdentifier(identifier='${identifier}'): ${identifiedValue.errorTitle}`,
                    identifiedValue.errorDescription!
                )
            }
            if (identifiedValue.getValue().data === undefined) {
                const err = Debug.error(
                    `The import identifier '${identifier}' of '${node.nodeType}' node type data couldn't be identified`,
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
            identifiedNode.importPath = undefined;
            identifiedNode.data = {};
            return Result.ok(identifiedNode);
        }

        if (identifiedNode.importPath === undefined) {
            return Result.fail(
                `getImportModulePath(): '${identifiedNode.identifier}' module path is not found`,
                `Make sure this node is import node, or fix AstNode.getImportModulePath()`
            )
        }

        // Debug.push(`memory.identifyModuleByPath()`, {modulePath})
        const identifiedMemory = memory.getModuleMemory(identifiedNode.importPath);
        // Debug.pop();
        if (identifiedMemory.isFailure) {
            return Result.fail(
                `memory.identifyModuleByPath(modulePath: '${identifiedNode.importPath.toString()}'): ${identifiedMemory.errorTitle}`,
                identifiedMemory.errorDescription!
            )
        }

        const glob = identifiedMemory.getValue().glob
        // If the import is default import, then data is AraLink.
        if (identifiedNode.data instanceof AraLink) {
            identifiedNode.data = (glob as any).default;
            identifiedNode.importPath = undefined;
        } else {
            let data = (glob as any)[identifiedNode.identifier]
            identifiedNode.data = data;
            identifiedNode.importPath = undefined;
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
            EnabledNodejsModules.isNonBuiltInIdentifier,
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
            // Debug.push(`TypeDeclaration.lintType()`, {node: identifier})
            const lintedNode = TypeDeclaration.lintType(node, memoryContext);
            // Debug.pop()
            if (lintedNode.isFailure) {
                return Result.fail(
                    `TypeDeclaration.lintType(node: '${identifier}'): ${lintedNode.errorTitle}`,
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
        let identifiers: AstIdentifiers = {};
        
        const tsNodes = this.getTsNodes([TypeDeclaration.isTypeDeclaration]);
        for (let tsNode of tsNodes) {
            const typeDeclaration = TypeDeclaration.fromTsNode(tsNode);
            if (typeDeclaration.isFailure) {
                return Result.fail(
                    `TypeDeclaration.fromTsNode(tsNode: '${tsNode.getText()}'): ${typeDeclaration.errorTitle}`,
                    typeDeclaration.errorDescription!
                )
            }

            // Debug.push(`getAstNode()`)
            const identifiedTypeDeclaration = await typeDeclaration.getValue().getAstNode();
            // Debug.pop();
            if (identifiedTypeDeclaration.isFailure) {
                return Result.fail(
                    `TypeDeclaration('${typeDeclaration.getValue().getText()}'): getAstNode(): ${identifiedTypeDeclaration.errorTitle}`,
                    identifiedTypeDeclaration.errorDescription!
                )
            }
            identifiers[identifiedTypeDeclaration.getValue().identifier!] = identifiedTypeDeclaration.getValue();
        }
            
        return Result.ok(identifiers);
    }


    /////////////////////////////////////////////////////////////////////////////////////////////
    //
    // Variable Declarations
    //
    /////////////////////////////////////////////////////////////////////////////////////////////

    public getVariableIdentifiers = async (): Promise<Result<AstIdentifiers>> => {
        let identifiers: AstIdentifiers = {};
        
        const varStatements = this.getTsNodes([VariableStatement.isVariableStatement])

        for (let tsNode of varStatements) {
            var varStatement = await VariableStatement.fromTsNode(tsNode);
            if (varStatement.isFailure) {
                return Result.fail(
                    `VariableStatement.fromTsNode(tsNode: '${tsNode.getText()}'): ${varStatement.errorTitle}`,
                    varStatement.errorDescription!
                )
            }
            
            const varIdentifiers = varStatement.getValue().getAstIdentifiers();
            identifiers = {...identifiers, ...varIdentifiers};
        }
    
        return Result.ok(identifiers);
    }

    /**
     * Find the result of the expression, by setting it as a variable declaration.
     * @param {string} exp a JS doc that after evaluating gives the result
     * @returns {T} the result of the expression
     */
    public identifyCodePiece = async <T>(exp: string): Promise<Result<T>> => {
        this.tempCodeAmount++;
        const varName = `__temp_var_${this.tempCodeAmount}`;
        let cloned = this.clone();
        const varStatement = cloned._ast.addVariableStatement({
            declarationKind: VariableDeclarationKind.Const, // defaults to "let"
            declarations: [{
              name: varName,
              type: "string",
              initializer: exp,
            }],
        });

                // If Attribute name is an identifier, get variable statements that define them:
        // For example `const v: number = 1`
        const varDeclaration = this.identifyVariableDeclaration(varName);
        if (varDeclaration.isFailure) {
            return Result.fail(
                `this.identifyVariableDeclaration(identifier='${varName}'): ${varDeclaration.errorTitle}`,
                varDeclaration.errorDescription!
            );
        }
        
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

    /**
     * Get the variable declaration AST tree for the variable
     * @param identifier The variable's name
     * @returns {Result<VariableDeclaration>}
     */
    private identifyVariableDeclaration = (identifier: string): Result<VariableDeclaration> => {
        const varDeclaration = this._ast.getVariableDeclaration(identifier);
        if (varDeclaration === undefined) {
            return Result.fail(
                `this.ast.getVariableDeclaration(identifier='${identifier}')`,
                `The '${identifier}' variable's declaration not found in the AST`
            );
        }

        return Result.ok(varDeclaration)
    }
    
}
