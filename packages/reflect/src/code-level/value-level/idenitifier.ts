import { Debug, Result, StringTraits } from "@ara-web/ts-enhancement";
import { ValueTypeString } from "../ast-node-data.js";
import { TsNode, type TsNodeValidator } from "../ts-node.js";
import { Identifier as TsIdentifier, Node } from "ts-morph";
import type { TypedData } from "../ast-node.js";
import { staticImplements, type ValueLevelInterface } from "./value-level-interface.js";
import type { AstNodeContext } from "../../memory/AstNodeContext.js";
import { AraLink } from "@ara-web/ts-enhancement/ara-link";
import { ReflectAraLink } from "../../ara-link/ReflectAraLink.js";
import { ValueLevel } from "../value-level.js";

/**
 * Literal class identifies the literal data such as "string", 123, false, true.
 */
@staticImplements<ValueLevelInterface>()   /* this statement implements both normal interface & static interface */
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

        Debug.log(`Identify value of '${tsNode.getText()}'`);
        Debug.log(identifier)
        const exp = ReflectAraLink.getExpressionResource(identifier.data);
        Debug.log(`The identifier data link`);
        Debug.log(identifier.data)
        Debug.log(`The identifier exp ${exp?.getText()}:`)
        Debug.log(exp)
        
        const astNodeContext = parentNodeContext?.clone(identifier.getAllMemoryData(), [identifier.identifier!])
        Debug.log(`The ast nodes:`);
        Debug.log(astNodeContext)
        Debug.log(`The expression:`);
        Debug.log(exp?.getText())
        const identifiedExp = await ValueLevel.identifyValue(exp!, {dataType: ValueTypeString.default}, astNodeContext!)
        Debug.log(`The identified expression of the identifier:`);
        Debug.log(identifiedExp)
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