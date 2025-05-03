import { Result } from "@ara-web/p-hintjens";
import type { AstIdentifiers, TsNode } from "../index.js";
import { VariableStatement } from "./variable-statement.js";

export class VariableLevel {
    public static getVariableIdentifiers = async (tsNodes: TsNode[]): Promise<Result<AstIdentifiers>> => {
        const varStatements = tsNodes.filter((tsNode) => (VariableStatement.isVariableStatement(tsNode)))
        let identifiers: AstIdentifiers = {};
            
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