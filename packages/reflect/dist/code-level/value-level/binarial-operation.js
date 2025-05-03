var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
import { BinaryExpression, Node } from "ts-morph";
import { Result, ObjectTraits } from "@ara-web/p-hintjens";
import { TsNode, AstNodeContext, ValueLevel, ValueTypeString } from "../index.js";
/**
 * Literal class identifies the literal data such as "string", 123, false, true.
 */
let BinarialOperation = (() => {
    let _classDecorators = [ObjectTraits.staticImplements()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var BinarialOperation = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            BinarialOperation = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static get name() {
            return "BinarialOperation";
        }
        static isSupportedOperation = (child) => {
            const op = child.getText();
            return _classThis.isBooleanOperation(op) ||
                _classThis.isArithmeticOperation(op);
        };
        static getBinarialType = (child) => {
            const op = child.getText();
            if (_classThis.isBooleanOperation(op)) {
                return ValueTypeString.boolean;
            }
            else if (_classThis.isArithmeticOperation(op)) {
                return ValueTypeString.number;
            }
            return ValueTypeString.undefined;
        };
        /**
         * @param prefix {data: Prefix's text, dataType: PrefixUnary.getPrefixType()}
         * @param data
         * @returns
         */
        static applyOperation = (op, left, right) => {
            if (_classThis.isBooleanOperation(op.data)) {
                const res = _classThis.identifyConditionValue(left, op.data, right);
                return Result.ok(res);
            }
            else if (_classThis.isArithmeticOperation(op.data)) {
                const res = _classThis.identifyArithmeticValue(left, op.data, right);
                return Result.ok(res);
            }
            return Result.fail(`For now applying '${op.dataType}' not supported`, `Please update BinarialOperation() to support '${op.data}' prefix`);
        };
        static identifyConditionValue = (leftSide, condition, rightSide) => {
            if (condition.indexOf("!") > -1) {
                return leftSide != rightSide;
            }
            else if (condition.indexOf(">=") > -1) {
                return leftSide >= rightSide;
            }
            else if (condition.indexOf("<=") > -1) {
                return leftSide <= rightSide;
            }
            else if (condition.indexOf(">") > -1) {
                return leftSide > rightSide;
            }
            else if (condition.indexOf("<") > -1) {
                return leftSide < rightSide;
            }
            else {
                return leftSide == rightSide;
            }
        };
        static identifyArithmeticValue = (leftSide, condition, rightSide) => {
            if (condition.indexOf("+") > -1) {
                return leftSide + rightSide;
            }
            else if (condition.indexOf("-") > -1) {
                return leftSide - rightSide;
            }
            else if (condition.indexOf("/") > -1) {
                return leftSide / rightSide;
            }
            else if (condition.indexOf("*") > -1) {
                return leftSide * rightSide;
            }
            else {
                // Modulo
                return leftSide % rightSide;
            }
        };
        static isBooleanOperation = (op) => {
            if (op.indexOf("!=") > -1 ||
                op.indexOf(">=") > -1 ||
                op.indexOf("<=") > -1 ||
                op === "==" ||
                op === "===") {
                return true;
            }
            return false;
        };
        static isArithmeticOperation = (op) => {
            if (op.indexOf("+") > -1 ||
                op.indexOf("-") > -1 ||
                op.indexOf("/") > -1 ||
                op.indexOf("*") > -1 ||
                op.indexOf("%")) {
                return true;
            }
            return false;
        };
        static isA = (child) => {
            const node = child.getNode();
            return node instanceof BinaryExpression;
        };
        identifyValue = async (tsNode, _, astNodeContext) => {
            if (!tsNode.isChildExist(2)) {
                return Result.fail(`The ts node must have three children at least`, `TsNode must have children`);
            }
            const op = tsNode.getChild(1);
            if (!BinarialOperation.isSupportedOperation(op)) {
                return Result.fail(`BinarialOperation.isSupportedOperation('${op.getText()}'): false`, `Unsupported operation, update Ara Web to support the operation`);
            }
            const opType = BinarialOperation.getBinarialType(op);
            const leftSide = tsNode.getChild(0);
            const rightSide = tsNode.getChild(2);
            // Debug.push(`Left: this.identifyValue('${leftSide.getText()}')`)
            const leftValue = await ValueLevel.identifyValue(leftSide, { dataType: ValueTypeString.default }, astNodeContext);
            // Debug.pop();
            if (leftValue.isFailure) {
                return Result.fail(`Left: this.identifyValue('${leftSide.getText()}'): ${leftValue.errorTitle}`, leftValue.errorDescription);
            }
            // const leftTypeValidated = BinarialOperation.isExpectedType(leftValue.getValue().dataType, opType);
            // if (leftTypeValidated.isFailure) {
            //     return Result.fail(
            //         `Left: BinarialOperation.isExpectedType(): ${leftTypeValidated.errorTitle}`,
            //         leftTypeValidated.errorDescription!
            //     )
            // }
            // Debug.push(`Right: this.identifyValue('${rightSide.getText()}')`)
            const rightValue = await ValueLevel.identifyValue(rightSide, { dataType: ValueTypeString.default }, astNodeContext);
            // Debug.pop();
            if (rightValue.isFailure) {
                return Result.fail(`Right: this.identifyValue('${rightSide.getText()}'): ${rightValue.errorTitle}`, rightValue.errorDescription);
            }
            // const rightTypeValidated = BinarialOperation.isExpectedType(rightValue.getValue().dataType, opType);
            // if (rightTypeValidated.isFailure) {
            //     return Result.fail(
            //         `Right: BinarialOperation.isExpectedType(): ${rightTypeValidated.errorTitle}`,
            //         rightTypeValidated.errorDescription!
            //     )
            // }
            const value = BinarialOperation.applyOperation({ data: op.getText(), dataType: opType }, leftValue.getValue().data, rightValue.getValue().data);
            if (value.isFailure) {
                return Result.fail(`BinarialOperation.applyOperation(): ${value.errorTitle}`, value.errorDescription);
            }
            return Result.ok({ data: value.getValue(), dataType: opType });
        };
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return BinarialOperation = _classThis;
})();
export { BinarialOperation };
