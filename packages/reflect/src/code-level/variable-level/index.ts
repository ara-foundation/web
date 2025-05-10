import { Node } from "ts-morph";
import { Result } from "@ara-web/p-hintjens";
import type { CodePieceRecord } from "../index.js";
import { VariableStatement } from "./variable-statement.js";

export class VariableLevel {
    public static getVariableIdentifiers = async (tsNodes: Node[]): Promise<Result<CodePieceRecord>> => {
        const varStatements = tsNodes.filter((tsNode) => (VariableStatement.isVariableStatement(tsNode)))
        let identifiers: CodePieceRecord = {};
            
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
}