import { Node } from "ts-morph";
import { ModuleLink } from "@ara-web/sds";
import { Result } from "@ara-web/p-hintjens";
import { CodePieceType, type CodePiece, type CodePieceFilter, type GenericHandler } from "./code-piece.js";
import { ValueTypeString, type ValueType } from "./code-piece-types.js";
import { VariableLevel } from "./variable-level/index.js";
import { Code } from "./code.js";

// Array<type> receives the values of 1 length and then sets the value as the first element of the data
const arrayGenericHandler: GenericHandler = (astNode: CodePiece, values: ValueType[]): Result<CodePiece> => {
    if (values.length !== 1) {
        return Result.fail(
            `The Array Generic accepts only 1 argument`,
            `The Ara Web doesn't support ${values.length} elements, please fix the array's generic values`
        )
    }

    astNode.data = [values[0]];
    return Result.ok(astNode);
}

// Array<type> receives the values of 1 length and then sets the value as the first element of the data
const recordGenericHandler: GenericHandler = (astNode: CodePiece, values: ValueType[]): Result<CodePiece> => {
    if (values.length !== 2) {
        return Result.fail(
            `The Array Generic accepts only 2 argument`,
            `The Ara Web doesn't support ${values.length} elements, please fix the array's generic values`
        )
    }

    astNode.data = {
        key: values[0],
        value: values[1],
    }
    return Result.ok(astNode);
}

export class BuiltInIdentifiers {
    private static prefix = '';
    private static identifiers = ['Array', 'Record'];
    private static builtInSrc = `
        export const ${this.prefix}${this.identifiers[0]} = [];
        export const ${this.prefix}${this.identifiers[1]} = {key: '', value: {}};
    `;

    private static _identifiers: CodePiece[] = [];

    public static isBuiltInIdentifier: CodePieceFilter = (child: CodePiece): boolean => {
        if (child.identifier === undefined) {
            return false;
        }
        return this.identifiers.includes(child.identifier)
    }

    public static isNonBuiltInIdentifier: CodePieceFilter = (child: CodePiece): boolean => {
        return !this.isBuiltInIdentifier(child);
    }

    private static getVariableAstNode = async (identifier: string, tsNodes: Node[]): Promise<Result<CodePiece>> => {
        const varIdentifiers = await VariableLevel.getVariableIdentifiers(tsNodes);
        if (varIdentifiers.isFailure) {
            return Result.fail(
                `VariableLevel.getVariableIdentifiers(): ${varIdentifiers.errorTitle}`,
                varIdentifiers.errorDescription!
            )
        }
        const found = varIdentifiers.getValue().find(codePiece => codePiece.identifier === identifier)
        if (found !== undefined) {
            return Result.ok(found);
        }
    
        return Result.fail(
            `The '${identifier}' not found in the nodes list`,
            `Please make sure the code is valid or pass the correct identifier`
        )
    }

    public static getBuiltInIdentifiers = async (): Promise<Result<CodePiece[]>> => {
        if (this._identifiers.length > 0) {
            return Result.ok(this._identifiers);
        }
        let identifiers: CodePiece[] = [];
        const code = new Code(this.builtInSrc, ModuleLink.newFileLink(import.meta.filename));
    
        const varStatements = code.getTsNodes()
        const arrayAstNode = await this.identifyArrayAstNode(varStatements)
        if (arrayAstNode.isFailure) {
            return Result.fail(
                `identifyArrayAstNode(varStatements: '${varStatements.length} statements'): ${arrayAstNode.errorTitle}`,
                arrayAstNode.errorDescription!
            )
        } else {
            identifiers.push(arrayAstNode.getValue());
        }
    
        const recordAstNode = await this.identifyRecordAstNode(varStatements)
        if (recordAstNode.isFailure) {
            return Result.fail(
                `identifyRecordAstNode(varStatements: '${varStatements.length} statements'): ${recordAstNode.errorTitle}`,
                recordAstNode.errorDescription!
            )
        } else {
            identifiers.push(recordAstNode.getValue());
        }
    
        this._identifiers = identifiers;
        return Result.ok(identifiers);
    }
    

    //------------------------------------------------------------------
    //
    // NodeJS modules
    //
    //------------------------------------------------------------------


    private static identifyArrayAstNode = async (varStatements: Node[]): Promise<Result<CodePiece>> => {
        const astNode = await this.getVariableAstNode(this.prefix + this.identifiers[0], varStatements)
        if (astNode.isFailure) {
            return Result.fail(
                `getVariableAstNode(identifier: '${this.prefix + this.identifiers[0]}', varStatements: '${varStatements.length} statements'): ${astNode.errorTitle}`,
                astNode.errorDescription!
            )
        }

        astNode.getValue().identifier = this.identifiers[0];
        astNode.getValue().nodeType = CodePieceType.Type;
        astNode.getValue().data = [{}];
        astNode.getValue().public = true;
        astNode.getValue().constant = true;
        astNode.getValue().dataType = ValueTypeString.array;
        astNode.getValue().putGenericHandler(arrayGenericHandler);

        return Result.ok(astNode.getValue());
    }

    private static identifyRecordAstNode = async (varStatements: Node[]): Promise<Result<CodePiece>> => {
        const astNode = await this.getVariableAstNode(this.prefix + this.identifiers[1], varStatements)
        if (astNode.isFailure) {
            return Result.fail(
                `getVariableAstNode(identifier: '${this.prefix + this.identifiers[1]}', varStatements: '${varStatements.length} statements'): ${astNode.errorTitle}`,
                astNode.errorDescription!
            )
        }

        astNode.getValue().identifier = this.identifiers[1];
        astNode.getValue().nodeType = CodePieceType.Type;
        astNode.getValue().data = {key: "", value: {}};
        astNode.getValue().public = true;
        astNode.getValue().constant = true;
        astNode.getValue().dataType = ValueTypeString.object;
        astNode.getValue().putGenericHandler(recordGenericHandler);

        return Result.ok(astNode.getValue());
    }

    //------------------------------------------------------------------
    //
    // NodeJS modules
    //
    //------------------------------------------------------------------

    public static getNodejsModuleByPath = async (path: string): Promise<CodePiece|undefined> => {
        const nodeJsModules = await this.getBuiltInIdentifiers();
        for (let nodeJsModule in nodeJsModules.getValue()) {
            const exist = nodeJsModule.indexOf(path) > -1;
            if (exist) {
                return nodeJsModules.getValue()[nodeJsModule] as CodePiece;
            }
        }

        return undefined;
    }
}