import { Result } from "@ara-web/ts-enhancement";
import { VariableStatement } from "./variable-statement.js";
export class VariableLevel {
    static getVariableIdentifiers = async (tsNodes) => {
        const varStatements = tsNodes.filter((tsNode) => (VariableStatement.isVariableStatement(tsNode)));
        let identifiers = {};
        for (let tsNode of varStatements) {
            var varStatement = await VariableStatement.fromTsNode(tsNode);
            if (varStatement.isFailure) {
                return Result.fail(`VariableStatement.fromTsNode(tsNode: '${tsNode.getText()}'): ${varStatement.errorTitle}`, varStatement.errorDescription);
            }
            const varIdentifiers = varStatement.getValue().getAstIdentifiers();
            identifiers = { ...identifiers, ...varIdentifiers };
        }
        return Result.ok(identifiers);
    };
}
