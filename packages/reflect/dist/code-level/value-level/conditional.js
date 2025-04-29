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
import { Result } from "@ara-web/ts-enhancement/result";
import { TsNode } from "../ts-node.js";
import { ConditionalExpression, Node } from "ts-morph";
import {} from "./value-level-interface.js";
import { ValueLevel } from "../value-level.js";
import { ValueTypeString } from "../ast-node-data.js";
import { ObjectTraits } from "@ara-web/ts-enhancement/traits";
/**
 * Literal class identifies the literal data such as "string", 123, false, true.
 */
let Conditional = (() => {
    let _classDecorators = [ObjectTraits.staticImplements()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var Conditional = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            Conditional = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static get name() {
            return "Conditional";
        }
        static isA = (child) => {
            const node = child.getNode();
            return node instanceof ConditionalExpression;
        };
        identifyValue = async (tsNode, typedData, astNodeContext) => {
            if (!tsNode.isChildExist(4)) {
                return Result.fail(`The ts node must have four children at least`, `Parenthesized expression must have four children`);
            }
            const condition = tsNode.getChild(0);
            const trueExpression = tsNode.getChild(2);
            const falseExpression = tsNode.getChild(4);
            // Debug.push(`this.identifyValue('${condition.getText()}')`)
            const conditionResult = await ValueLevel.identifyValue(condition, { dataType: ValueTypeString.boolean }, astNodeContext);
            // Debug.pop();
            if (conditionResult.isFailure) {
                return Result.fail(`this.identifyValue('${condition.getText()}'): ${conditionResult.errorTitle}`, conditionResult.errorDescription);
            }
            if (conditionResult.getValue().data) {
                const res = await ValueLevel.identifyValue(trueExpression, { dataType: typedData?.dataType }, astNodeContext);
                if (res.isFailure) {
                    return Result.fail(`True: ValueLevel.identifyValue('${trueExpression.getText()}'): ${res.errorTitle}`, res.errorDescription);
                }
                return Result.ok(res.getValue());
            }
            else {
                const res = await ValueLevel.identifyValue(falseExpression, { dataType: typedData?.dataType }, astNodeContext);
                if (res.isFailure) {
                    return Result.fail(`False: ValueLevel.identifyValue('${falseExpression.getText()}'): ${res.errorTitle}`, res.errorDescription);
                }
                return Result.ok(res.getValue());
            }
        };
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return Conditional = _classThis;
})();
export { Conditional };
