import { Identifier as TsIdentifier, Node } from "ts-morph";
import { Result, ObjectTraits, AraLink } from "@ara-web/ts-enhancement";
import { ValueTypeString } from "./ast-node-data.js";
import { TsNode, type TsNodeValidator } from "./ts-node.js";
import type { TypedData } from "./ast-node.js";
import { type ValueLevelInterface } from "./value-level-interface.js";
import type { AstNodeContext } from "./AstNodeContext.js";
import { CodeLink } from "./CodeLink.js";
import { ValueLevel } from "./value-level/index.js";

/**
 * Literal class identifies the literal data such as "string", 123, false, true.
 */
@ObjectTraits.staticImplements<ValueLevelInterface>()   /* this statement implements both normal interface & static interface */
export class Identifier {
    public static get name(): string {
        return "Identifier"
    }

    public static isA: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof TsIdentifier;
    }

    public identifyValue = async (tsNode: TsNode, typedData?: TypedData, parentNodeContext?: AstNodeContext): Promise<Result<TypedData>> => {
        if (!Identifier.isA(tsNode)) {
            return Result.fail(`TS Node is not identifier`, 'Please pass the correct TS Node')
        }

        const identifier = parentNodeContext!.getIdentifier(tsNode.getText());
        if (identifier === undefined) {
            return Result.fail(`The identifier '${tsNode.getText()}' not found in the Ast Node Context`, 'Contact to Ara Web Maintainer to fix it')
        }

        if (identifier.data === undefined) {
            return Result.fail(`The identifier data is undefined`, `The make sure that AST Node parsed correctly`)
        }
        if (!(identifier.data instanceof AraLink)) {
            return Result.ok({data: identifier.data, dataType: identifier.dataType})
        }

        const exp = CodeLink.getExpressionResource(identifier.data);
        
        const astNodeContext = parentNodeContext?.clone(identifier.getAllMemoryData(), [identifier.identifier!])
        const identifiedExp = await ValueLevel.identifyValue(exp!, {dataType: ValueTypeString.default}, astNodeContext!)
        if (identifiedExp.isFailure) {
            return Result.fail(
                `ValueLevel.identifyValue(): ${identifiedExp.errorTitle}`,
                identifiedExp.errorDescription!
            )
        }

        // Type was given, then make sure the identifier has this type as well.
        if (typedData?.dataType !== undefined && typedData.dataType !== ValueTypeString.default) {
            return Result.fail(
                `typedData.dataType is not default`,
                `For now, Ara web supports custom data only`
            )
        }

        return Result.ok(identifiedExp.getValue())
    }
}