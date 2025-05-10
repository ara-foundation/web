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
import { Node, PrefixUnaryExpression } from "ts-morph";
import { Result, ObjectTraits } from "@ara-web/p-hintjens";
import { ValueTypeString, AstNodeContext, ValueLevel, AstNodeTraits } from "../index.js";
/**
 * Literal class identifies the literal data such as "string", 123, false, true.
 */
let PrefixUnary = (() => {
    let _classDecorators = [ObjectTraits.staticImplements()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var PrefixUnary = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PrefixUnary = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static get name() {
            return "PrefixUnary";
        }
        static isSupportedPrefix = (child) => {
            return ["!", "+", "-", "++", "--"].includes(child.getText());
        };
        static getPrefixType = (child) => {
            const prefix = child.getText();
            if (prefix === "!") {
                return ValueTypeString.boolean;
            }
            else if (prefix === "+" || prefix === "-" || prefix === "++" || prefix === "---") {
                return ValueTypeString.number;
            }
            return ValueTypeString.undefined;
        };
        /**
         * @param prefix {data: Prefix's text, dataType: PrefixUnary.getPrefixType()}
         * @param data
         * @returns
         */
        static applyPrefix = (prefix, data) => {
            if (prefix.dataType === ValueTypeString.boolean) {
                if (prefix.data !== "!") {
                    return Result.fail(`For now applying boolean prefix supports '!' only`, 'Pass correct data');
                }
                return Result.ok(!data);
            }
            if (prefix.dataType === ValueTypeString.number) {
                if (prefix.data === "+") {
                    return Result.ok(1 * data);
                }
                if (prefix.data === "-") {
                    return Result.ok(-1 * data);
                }
                if (prefix.data === "++") {
                    return Result.ok(1 + data);
                }
                if (prefix.data === "--") {
                    return Result.ok(data - 1);
                }
                return Result.fail(`For now applying a number prefix doesn't support '${prefix.data}'`, 'Please, pass the correct data');
            }
            return Result.fail(`For now applying '${prefix.dataType}' not supported`, `Please update PrefixUnary.applyPrefix() to support '${prefix.data}' prefix`);
        };
        static isExpectedType = (dataType, prefixType) => {
            if (dataType !== undefined && typeof dataType === prefixType || dataType === prefixType) {
                return Result.ok();
            }
            return Result.fail(`The '${dataType}' is not expected`, `Prefix for '${prefixType}' expected, pass correct code`);
        };
        static isPrefixUnary = (node) => {
            return node instanceof PrefixUnaryExpression;
        };
        static isA = (node) => {
            return _classThis.isPrefixUnary(node);
        };
        identifyValue = async (tsNode, _, astNodeContext) => {
            if (!PrefixUnary.isA(tsNode)) {
                return Result.fail(`The TS Node is not a prefix unary`, `Please pass the correct value instead '${tsNode.getText()}'`);
            }
            if (!AstNodeTraits.isChildExist(tsNode, 0)) {
                return Result.fail(`Prefix is missing`, `Please pass the first element of property assignment`);
            }
            if (!AstNodeTraits.isChildExist(tsNode, 1)) {
                return Result.fail(`Prefixed node is missing`, `Please pass the second element of property assignment`);
            }
            const prefix = tsNode.getChildAtIndex(0);
            const value = tsNode.getChildAtIndex(1);
            if (!PrefixUnary.isSupportedPrefix(prefix)) {
                return Result.fail(`The '${prefix.getText()}' not supported prefix`, `Please update PrefixUnary.identifyValue() to support new prefix type`);
            }
            const valueType = PrefixUnary.getPrefixType(prefix);
            if (valueType === ValueTypeString.undefined) {
                return Result.fail(`PrefixUnary.getPrefixType('${prefix.getText()}'): undefined`, `Update the PrefixUnary.getPrefixType() to fix the mistake`);
            }
            const identifiedValue = await ValueLevel.identifyValue(value, { dataType: valueType }, astNodeContext);
            if (identifiedValue.isFailure) {
                return Result.fail(`ValueLevel.identifyValue('${value.getText()}'): ${identifiedValue.errorTitle}`, identifiedValue.errorDescription);
            }
            const expectedType = PrefixUnary.isExpectedType(identifiedValue.getValue().dataType, valueType);
            if (expectedType.isFailure) {
                return Result.fail(`PrefixUnary.isExpectedType(): ${expectedType.errorTitle}`, expectedType.errorDescription);
            }
            const prefixApplied = PrefixUnary.applyPrefix({ data: prefix.getText(), dataType: valueType }, identifiedValue.getValue().data);
            if (prefixApplied.isFailure) {
                return Result.fail(`PrefixUnary.applyPrefix(): ${prefixApplied.errorTitle}`, prefixApplied.errorDescription);
            }
            return Result.ok({ data: prefixApplied.getValue(), dataType: valueType });
        };
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return PrefixUnary = _classThis;
})();
export { PrefixUnary };
