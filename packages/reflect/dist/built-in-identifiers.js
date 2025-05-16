import { Node } from "ts-morph";
import { ModuleLink } from "@ara-web/sds";
import { Result } from "@ara-web/p-hintjens";
import { CodePiece, CodePieceType, ValueTypeString, Code, VariableLevel } from "./code-level/index.js";
// Array<type> receives the values of 1 length and then sets the value as the first element of the data
const arrayGenericHandler = (astNode, values) => {
    if (values.length !== 1) {
        return Result.fail(`The Array Generic accepts only 1 argument`, `The Ara Web doesn't support ${values.length} elements, please fix the array's generic values`);
    }
    astNode.data = [values[0]];
    return Result.ok(astNode);
};
// Array<type> receives the values of 1 length and then sets the value as the first element of the data
const recordGenericHandler = (astNode, values) => {
    if (values.length !== 2) {
        return Result.fail(`The Array Generic accepts only 2 argument`, `The Ara Web doesn't support ${values.length} elements, please fix the array's generic values`);
    }
    astNode.data = {
        key: values[0],
        value: values[1],
    };
    return Result.ok(astNode);
};
export class BuiltInIdentifiers {
    static prefix = '_';
    static identifiers = ['Array', 'Record'];
    static builtInSrc = `
        export const ${this.prefix}${this.identifiers[0]} = [];
        export const ${this.prefix}${this.identifiers[1]} = {key: '', value: {}};
    `;
    static _identifiers = undefined;
    static isBuiltInIdentifier = (child) => {
        if (child.identifier === undefined) {
            return false;
        }
        return this.identifiers.includes(child.identifier);
    };
    static isNonBuiltInIdentifier = (child) => {
        return !this.isBuiltInIdentifier(child);
    };
    static getVariableAstNode = async (identifier, tsNodes) => {
        const varIdentifiers = await VariableLevel.getVariableIdentifiers(tsNodes);
        if (varIdentifiers.isFailure) {
            return Result.fail(`VariableLevel.getVariableIdentifiers(): ${varIdentifiers.errorTitle}`, varIdentifiers.errorDescription);
        }
        for (let _identifier in varIdentifiers.getValue()) {
            if (_identifier === identifier) {
                // We are sure, that the returned data is CodePiece, not a link,
                // Since the script is here as well.
                return Result.ok(varIdentifiers.getValue()[_identifier]);
            }
        }
        return Result.fail(`The '${identifier}' not found in the nodes list`, `Please make sure the code is valid or pass the correct identifier`);
    };
    static getBuiltInIdentifiers = async () => {
        if (this._identifiers !== undefined) {
            return Result.ok(this._identifiers);
        }
        let identifiers = {};
        const code = new Code(this.builtInSrc, ModuleLink.newFileURL(import.meta.filename));
        const varStatements = code.getTsNodes();
        const arrayAstNode = await this.identifyArrayAstNode(varStatements);
        if (arrayAstNode.isFailure) {
            return Result.fail(`identifyArrayAstNode(varStatements: '${varStatements.length} statements'): ${arrayAstNode.errorTitle}`, arrayAstNode.errorDescription);
        }
        else {
            identifiers[this.identifiers[0]] = arrayAstNode.getValue();
        }
        const recordAstNode = await this.identifyRecordAstNode(varStatements);
        if (recordAstNode.isFailure) {
            return Result.fail(`identifyRecordAstNode(varStatements: '${varStatements.length} statements'): ${recordAstNode.errorTitle}`, recordAstNode.errorDescription);
        }
        else {
            identifiers[this.identifiers[1]] = recordAstNode.getValue();
        }
        this._identifiers = identifiers;
        return Result.ok(identifiers);
    };
    //------------------------------------------------------------------
    //
    // NodeJS modules
    //
    //------------------------------------------------------------------
    static identifyArrayAstNode = async (varStatements) => {
        const astNode = await this.getVariableAstNode(this.prefix + this.identifiers[0], varStatements);
        if (astNode.isFailure) {
            return Result.fail(`getVariableAstNode(identifier: '${this.prefix + this.identifiers[0]}', varStatements: '${varStatements.length} statements'): ${astNode.errorTitle}`, astNode.errorDescription);
        }
        astNode.getValue().identifier = this.identifiers[0];
        astNode.getValue().nodeType = CodePieceType.Type;
        astNode.getValue().data = [{}];
        astNode.getValue().public = true;
        astNode.getValue().constant = true;
        astNode.getValue().dataType = ValueTypeString.array;
        astNode.getValue().putGenericHandler(arrayGenericHandler);
        return Result.ok(astNode.getValue());
    };
    static identifyRecordAstNode = async (varStatements) => {
        const astNode = await this.getVariableAstNode(this.prefix + this.identifiers[1], varStatements);
        if (astNode.isFailure) {
            return Result.fail(`getVariableAstNode(identifier: '${this.prefix + this.identifiers[1]}', varStatements: '${varStatements.length} statements'): ${astNode.errorTitle}`, astNode.errorDescription);
        }
        astNode.getValue().identifier = this.identifiers[1];
        astNode.getValue().nodeType = CodePieceType.Type;
        astNode.getValue().data = { key: "", value: {} };
        astNode.getValue().public = true;
        astNode.getValue().constant = true;
        astNode.getValue().dataType = ValueTypeString.object;
        astNode.getValue().putGenericHandler(recordGenericHandler);
        return Result.ok(astNode.getValue());
    };
    //------------------------------------------------------------------
    //
    // NodeJS modules
    //
    //------------------------------------------------------------------
    static getNodejsModuleByPath = async (path) => {
        const nodeJsModules = await this.getBuiltInIdentifiers();
        for (let nodeJsModule in nodeJsModules.getValue()) {
            const exist = nodeJsModule.indexOf(path) > -1;
            if (exist) {
                return nodeJsModules.getValue()[nodeJsModule];
            }
        }
        return undefined;
    };
}
