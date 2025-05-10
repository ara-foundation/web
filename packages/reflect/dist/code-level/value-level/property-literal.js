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
import { Node, PropertyAssignment } from "ts-morph";
import { ObjectTraits, Result, Debug } from "@ara-web/p-hintjens";
import { ValueTypeString, AstNodeContext, ValueLevel, Identifier, Literal, AstNodeTraits } from "../index.js";
/**
 * Property assignment such as Property: <expression> in the context of the object literals
 */
let PropertyLiteral = (() => {
    let _classDecorators = [ObjectTraits.staticImplements()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var PropertyLiteral = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PropertyLiteral = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static get name() {
            return "object-level/PropertyLiteral";
        }
        static isA = (node) => {
            return node instanceof PropertyAssignment;
        };
        identifyValue = async (tsNode, _, astNodeContext) => {
            if (!AstNodeTraits.isChildExist(tsNode, 0)) {
                return Result.fail(`Property assignment has no first value`, `Please pass the first element of property assignment`);
            }
            if (!AstNodeTraits.isChildExist(tsNode, 2)) {
                return Result.fail(`Property assignment has no third value`, `Please pass the third element of property assignment`);
            }
            const property = tsNode.getChildAtIndex(0);
            const value = tsNode.getChildAtIndex(2);
            if (!Identifier.isA(property) && !Literal.isStringLiteral(property)) {
                const err = Debug.error(`The property '${property.getText()}' is not identifier nor a string literal`, `Ara Web supports identifiers as the property for now, please update it.`, property);
                return Result.fail(err);
            }
            let propertyIdentifier = property.getText();
            if (Literal.isStringLiteral(property)) {
                const identifiedIdentifier = Literal.identifyStringLiteral(property);
                propertyIdentifier = identifiedIdentifier.getValue().data;
            }
            // Assigned value to the (data: T).object's property
            const res = await ValueLevel.identifyValue(value, { dataType: ValueTypeString.default }, astNodeContext);
            if (res.isFailure) {
                return Result.fail(`ValueLevel.identifyValue('${value.getText()}'): ${res.errorTitle}`, res.errorDescription);
            }
            const data = { [propertyIdentifier]: res.getValue().data };
            return Result.ok({ data: data, dataType: ValueTypeString.property });
        };
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return PropertyLiteral = _classThis;
})();
export { PropertyLiteral };
