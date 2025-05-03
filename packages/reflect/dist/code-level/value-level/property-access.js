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
import { Node, PropertyAccessExpression } from "ts-morph";
import { Result, ObjectTraits } from "@ara-web/p-hintjens";
import { ValueTypeString, TsNode, AstNodeContext, ValueLevel, Identifier } from "../index.js";
/**
 * Property access such as Object.Property
 */
let PropertyAccess = (() => {
    let _classDecorators = [ObjectTraits.staticImplements()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var PropertyAccess = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PropertyAccess = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static get name() {
            return "object-level/PropertyAccess";
        }
        static isA = (child) => {
            const node = child.getNode();
            return node instanceof PropertyAccessExpression;
        };
        identifyValue = async (tsNode, _, astNodeContext) => {
            if (!tsNode.isChildExist(0)) {
                return Result.fail(`Method expects to have a children`, `Please update method access TS Node`);
            }
            if (!tsNode.isChildExist(2)) {
                return Result.fail(`Method expects to have the third child`, `Please update method access TS Node`);
            }
            const objIdentifier = tsNode.getChild(0);
            const property = tsNode.getChild(2);
            if (!Identifier.isA(property)) {
                return Result.fail(`Property expected to be identifier`, `Please update ProperyAccess.identifyValue() to support '${property.getText()}'`);
            }
            const obj = await ValueLevel.identifyValue(objIdentifier, { dataType: ValueTypeString.default }, astNodeContext);
            if (obj.isFailure) {
                return Result.fail(`ValueLevel.identifyValue('${objIdentifier.getText()}'): ${obj.errorTitle}`, obj.errorDescription);
            }
            if (obj.getValue().dataType !== ValueTypeString.object) {
                return Result.fail(`The method data type is not an object`, `Did not expect '${obj.getValue().dataType}', please update ObjectLiteral.identifyValue to return correct data`);
            }
            const propertyType = typeof (obj.getValue().data[property.getText()]);
            if (propertyType === "undefined") {
                return Result.fail(`Property '${property.getText()}' is undefined in '${objIdentifier.getText()}'`);
            }
            let data = (obj.getValue().data[property.getText()]);
            return Result.ok({ data: data, dataType: propertyType });
            // const varIdentifier = exp.getChildAtIndex(0);
            //         const propertyIdentifier = exp.getChildAtIndex(2);
            //         Debug.push(`exp as PropertyAccess()`, {var: varIdentifier.getText(), property: propertyIdentifier.getText()})
            //         Debug.push(`this.identifyIdentifierRecursively()`, {identifier: varIdentifier.getText()})
            //         // Attempt to find the variable's value within this script            
            //         const identified = await this.identifyIdentifierRecursively(varIdentifier.getText(), memory);
            //         Debug.pop();
            //         if (identified.isFailure) {
            //             Debug.pop();
            //             return Result.fail(
            //                 `propertyAccessExpression('${exp.getText()}')/this.identifyIdentifierRecursively(varIdentifier='${varIdentifier.getText()}'): ${identified.errorTitle}`,
            //                 identified.errorDescription!
            //             )
            //         }
            //         if (identified.getValue().nodeType === AstNodeType.Enum) {
            //             let identifiedData = identified.getValue().data as EnumMembers;
            //             Debug.pop();
            //             if (propertyIdentifier.getText() in identifiedData) {
            //                 return Result.ok(identifiedData[propertyIdentifier.getText()] as ValueType)
            //             } else {
            //                 return Result.fail(
            //                     `Invalid enum`,
            //                     `The '${identifier}' is identified as property access to the Enum ${varIdentifier}. But this enum doesn't have '${propertyIdentifier.getText()}' member`
            //                 )
            //             }
            //         } else if (identified.getValue().nodeType === AstNodeType.Object) {
            //             let identifiedData = identified.getValue().data as Object;
            //             Debug.pop();
            //             if (propertyIdentifier.getText() in identifiedData) {
            //                 return Result.ok(identifiedData[propertyIdentifier.getText()] as ValueType)
            //             } else {
            //                 return Result.fail(
            //                     `Invalid enum`,
            //                     `The '${identifier}' is identified as property access to the Enum ${varIdentifier}. But this enum doesn't have '${propertyIdentifier.getText()}' member`
            //                 )
            //             }
            //         } else {
            //             Debug.log(`The identified data is not an enum nor a variable with object, then how to use it:`);
            //             Debug.log(identified)
            //             Debug.pop();
            //         }
        };
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return PropertyAccess = _classThis;
})();
export { PropertyAccess };
