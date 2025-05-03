import { BinaryExpression, Node } from "ts-morph";
import { Result, ObjectTraits } from "@ara-web/p-hintjens";
import {
    TsNode, 
    type TsNodeValidator,
    AstNodeContext,
    ValueLevel,
    ValueTypeString, 
    type ValueType,
    type TypedData,
    type ValueLevelInterface
} from "../index.js";

/**
 * Literal class identifies the literal data such as "string", 123, false, true.
 */
@ObjectTraits.staticImplements<ValueLevelInterface>()   /* this statement implements both normal interface & static interface */
export class BinarialOperation {
    public static get name(): string {
        return "BinarialOperation"
    }

    private static isSupportedOperation: TsNodeValidator = (child: TsNode): boolean => {
        const op = child.getText();
        return this.isBooleanOperation(op) || 
            this.isArithmeticOperation(op);
    }
    
    private static getBinarialType = (child: TsNode): ValueTypeString => {
        const op = child.getText();
        if (this.isBooleanOperation(op)) {
            return ValueTypeString.boolean;
        } else if (this.isArithmeticOperation(op)) {
            return ValueTypeString.number
        }
    
        return ValueTypeString.undefined
    }
    
        /**
         * @param prefix {data: Prefix's text, dataType: PrefixUnary.getPrefixType()}
         * @param data 
         * @returns 
         */
    private static applyOperation = (op: TypedData, left: ValueType, right: ValueType): Result<ValueType> => {
        if (this.isBooleanOperation(op.data! as string)) {
            const res = this.identifyConditionValue(left, op.data! as string, right);
            return Result.ok(res)
        } else if (this.isArithmeticOperation(op.data! as string)) {
            const res = this.identifyArithmeticValue(left as number, op.data! as string, right as number);
            return Result.ok(res)
        }
        return Result.fail(`For now applying '${op.dataType}' not supported`, `Please update BinarialOperation() to support '${op.data}' prefix`)
    }
    
    private static identifyConditionValue = (leftSide: any, condition: string, rightSide: any): boolean => {
        if (condition.indexOf("!") > -1) {
            return leftSide != rightSide;
        } else if (condition.indexOf(">=") > -1) {
            return leftSide >= rightSide;
        } else if (condition.indexOf("<=") > -1) {
            return leftSide <= rightSide;
        } else if (condition.indexOf(">") > -1) {
            return leftSide > rightSide;
        } else if (condition.indexOf("<") > -1) {
            return leftSide < rightSide;
        } else {
            return leftSide == rightSide;
        }
    }
        
    private static identifyArithmeticValue = (leftSide: number, condition: string, rightSide: number): number => {
        if (condition.indexOf("+") > -1) {
            return leftSide + rightSide;
        } else if (condition.indexOf("-") > -1) {
            return leftSide - rightSide;
        } else if (condition.indexOf("/") > -1) {
            return leftSide / rightSide;
        } else if (condition.indexOf("*") > -1) {
            return leftSide * rightSide;
        } else {
            // Modulo
            return leftSide % rightSide;
        }
    }
        
    private static isBooleanOperation = (op: string): boolean => {
                if (op.indexOf("!=") > -1 || 
                    op.indexOf(">=") > -1 ||
                    op.indexOf("<=") > -1 ||
                    op === "==" || 
                    op === "==="
                ) {
                    return true;
                }
                return false;
    }
        
    private static isArithmeticOperation = (op: string): boolean => {
                if (op.indexOf("+") > -1 ||
                op.indexOf("-") > -1 ||
                op.indexOf("/") > -1 ||
                op.indexOf("*") > -1 ||
                op.indexOf("%")) {
                    return true;
                }
        
                return false;
    }

    public static isA: TsNodeValidator = (child: TsNode): boolean => {
        const node = child.getNode<Node>();
        return node instanceof BinaryExpression;
    }

    public identifyValue = async (tsNode: TsNode, _?: TypedData, astNodeContext?: AstNodeContext): Promise<Result<TypedData>> => {
        if (!tsNode.isChildExist(2)) {
            return Result.fail(
                `The ts node must have three children at least`,
                `TsNode must have children`,
            )    
        }

        const op = tsNode.getChild(1)!;
        if (!BinarialOperation.isSupportedOperation(op)) {
            return Result.fail(`BinarialOperation.isSupportedOperation('${op.getText()}'): false`, `Unsupported operation, update Ara Web to support the operation`)
        }

        const opType = BinarialOperation.getBinarialType(op);

        const leftSide = tsNode.getChild(0)!;
        const rightSide = tsNode.getChild(2)!;
                
        // Debug.push(`Left: this.identifyValue('${leftSide.getText()}')`)
        const leftValue = await ValueLevel.identifyValue(leftSide, {dataType: ValueTypeString.default}, astNodeContext!);
        // Debug.pop();
        if (leftValue.isFailure) {
            return Result.fail(
                `Left: this.identifyValue('${leftSide.getText()}'): ${leftValue.errorTitle}`,
                leftValue.errorDescription!
            )
        }

        // const leftTypeValidated = BinarialOperation.isExpectedType(leftValue.getValue().dataType, opType);
        // if (leftTypeValidated.isFailure) {
        //     return Result.fail(
        //         `Left: BinarialOperation.isExpectedType(): ${leftTypeValidated.errorTitle}`,
        //         leftTypeValidated.errorDescription!
        //     )
        // }

        // Debug.push(`Right: this.identifyValue('${rightSide.getText()}')`)
        const rightValue = await ValueLevel.identifyValue(rightSide, {dataType: ValueTypeString.default}, astNodeContext!);
        // Debug.pop();
        if (rightValue.isFailure) {
            return Result.fail(
                `Right: this.identifyValue('${rightSide.getText()}'): ${rightValue.errorTitle}`,
                rightValue.errorDescription!
            )
        }

        // const rightTypeValidated = BinarialOperation.isExpectedType(rightValue.getValue().dataType, opType);
        // if (rightTypeValidated.isFailure) {
        //     return Result.fail(
        //         `Right: BinarialOperation.isExpectedType(): ${rightTypeValidated.errorTitle}`,
        //         rightTypeValidated.errorDescription!
        //     )
        // }
        
        const value = BinarialOperation.applyOperation({data: op.getText(), dataType: opType}, leftValue.getValue().data!, rightValue.getValue().data!)
        if (value.isFailure) {
            return Result.fail(
                `BinarialOperation.applyOperation(): ${value.errorTitle}`,
                value.errorDescription!
            );
        }
        return Result.ok({data: value.getValue(), dataType: opType})
    }
}