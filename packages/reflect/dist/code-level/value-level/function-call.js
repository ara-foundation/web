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
import { Node, CallExpression } from "ts-morph";
import { Debug, Result, ObjectTraits } from "@ara-web/ts-enhancement";
import { TsNode, AstNodeContext, ValueLevel, ValueTypeString, Identifier } from "../index.js";
import { PropertyAccess } from "./property-access.js";
/**
 * Calls the function.
 */
let FunctionCall = (() => {
    let _classDecorators = [ObjectTraits.staticImplements()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var FunctionCall = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            FunctionCall = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static get name() {
            return "FunctionCall";
        }
        static isA = (child) => {
            const node = child.getNode();
            return node instanceof CallExpression;
        };
        identifyValue = async (tsNode, typedData, astNodeContext) => {
            if (!tsNode.isChildExist(0)) {
                return Result.fail(`The TS Node doesn't have any children`, `Please, update the TS Node`);
            }
            if (!tsNode.isChildExist(2)) {
                return Result.fail(`The TS Node doesn't have the syntax list`, `Please, update the TS Node`);
            }
            if (!TsNode.isSyntaxList(tsNode.getChild(2))) {
                return Result.fail(`The TS Node for function call expects syntax list`, `Please, update the FunctionCall.identifyValue() to support '${tsNode.getChild(2)?.getText()}'`);
            }
            const identifier = tsNode.getChild(0);
            let syntaxList = tsNode.getChild(2);
            const funcArgs = await this.getFuncArgs(syntaxList, astNodeContext);
            if (funcArgs.isFailure) {
                return Result.fail(`this.getFuncArgs(): ${funcArgs.errorTitle}`, funcArgs.errorDescription);
            }
            if (PropertyAccess.isA(identifier)) {
                // Debug.push(`this.identifyMethodCall()`, {'method': identifier.getText(), 'methodArgs': syntaxList.getText()})
                const res = await this.identifyMethodCall(identifier, funcArgs.getValue(), astNodeContext);
                // Debug.pop();
                if (res.isFailure) {
                    return Result.fail(`this.identifyMethodCall('${identifier.getText()}', syntaxList='[${syntaxList.getText()}]'): ${res.errorTitle}`, res.errorDescription);
                }
                return Result.ok(res.getValue());
            }
            else if (!Identifier.isA(identifier)) {
                const err = Debug.error(`The '${identifier.getText()}' unsupported`, `Ara Web supports Method Call or function name, update FunctionCall.identifyValue()`, identifier);
                return Result.fail(err);
            }
            const funcName = identifier.getText();
            const callResult = await this.identifyFunctionCall(funcName, funcArgs.getValue(), astNodeContext);
            if (callResult.isFailure) {
                return Result.fail(`this.identifyFunctionCall('${funcName}'): ${callResult.errorTitle}`, callResult.errorDescription);
            }
            if (typedData?.dataType !== ValueTypeString.default) {
                if (callResult.getValue().dataType !== typedData.dataType) {
                    return Result.fail(`Function returned data '${callResult.getValue().dataType}' not matching to '${typedData?.dataType}'`, `Please fix the your code, or update FunctionCall.identifyValue()`);
                }
            }
            return Result.ok(callResult.getValue());
        };
        getFuncArgs = async (syntaxList, astNodeContext) => {
            const funcArgs = [];
            const children = syntaxList.getChildren([], [TsNode.isNonImportant], [","]);
            for (let funcArg of children) {
                // Debug.push(`FuncArg: ValueLevel.identifyValue()`, {tsNode: funcArg.getText()});
                let result = await ValueLevel.identifyValue(funcArg, {}, astNodeContext);
                // Debug.pop();
                if (result.isFailure) {
                    return Result.fail(`ValueLevel.identifyValue(): ${result.errorTitle}`, result.errorDescription);
                }
                else {
                    funcArgs.push(result.getValue());
                }
            }
            return Result.ok(funcArgs);
        };
        /**
         *
         * @param method
         * @param methodArgs
         * @param memory
         * @returns
         */
        identifyMethodCall = async (methodAccess, funcArgs, astNodeContext) => {
            const propertyAccess = new PropertyAccess();
            const propertyValue = await propertyAccess.identifyValue(methodAccess, { dataType: ValueTypeString.default }, astNodeContext);
            if (propertyValue.isFailure) {
                return Result.fail(`propertyAccess.identifyValue('${methodAccess.getText()}'): ${propertyValue.errorTitle}`, propertyValue.errorDescription);
            }
            if (propertyValue.getValue().dataType !== "function") {
                return Result.fail(`The '${methodAccess.getText()}' expected to be function`, `Ara Web doesn't support to call '${propertyValue.getValue().dataType}'`);
            }
            let data = await propertyValue.getValue().data(...(funcArgs.map((typedData) => typedData.data)));
            const identifiedType = ValueLevel.getValueTypeStringByData(data);
            if (identifiedType.isFailure) {
                return Result.fail(`ValueLevel.getValueTypeStringByData(): ${identifiedType.isFailure}`, identifiedType.errorDescription);
            }
            return Result.ok({ data: data, dataType: identifiedType.getValue() });
        };
        /**
             * Call the function and return it's result
             * @param {string} funcName function literal
             * @param {any[]} funcArgs function argument
             * @returns {error?: string, data?: T}
         */
        identifyFunctionCall = async (funcName, funcArgs, astNodeContext) => {
            // Find the function
            const funcAstNode = astNodeContext.getIdentifier(funcName);
            if (funcAstNode === undefined) {
                return Result.fail(`astNodeContext.getIdentifier('${funcName}'): not found`, `Please post the function identity into the AstNodeContext`);
            }
            let data = await funcAstNode.data(...(funcArgs.map((typedData) => typedData.data)));
            const identifiedType = ValueLevel.getValueTypeStringByData(data);
            if (identifiedType.isFailure) {
                return Result.fail(`ValueLevel.getValueTypeStringByData(): ${identifiedType.isFailure}`, identifiedType.errorDescription);
            }
            return Result.ok({ data: data, dataType: identifiedType.getValue() });
        };
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return FunctionCall = _classThis;
})();
export { FunctionCall };
