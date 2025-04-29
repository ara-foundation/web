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
import { ValueTypeString } from "../../ast-node-data.js";
import { TsNode } from "../../ts-node.js";
import { Node, ShorthandPropertyAssignment } from "ts-morph";
import {} from "../value-level-interface.js";
import { ValueLevel } from "../../value-level.js";
import { Identifier } from "../idenitifier.js";
import { ObjectTraits } from "@ara-web/ts-enhancement/traits";
/**
 * Property access such as Object.Property
 */
let ShorthandAccess = (() => {
    let _classDecorators = [ObjectTraits.staticImplements()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ShorthandAccess = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ShorthandAccess = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static get name() {
            return "object-level/ShorthandAccess";
        }
        static isA = (child) => {
            const node = child.getNode();
            return node instanceof ShorthandPropertyAssignment;
        };
        identifyValue = async (tsNode, _, astNodeContext) => {
            if (!tsNode.isChildExist(0)) {
                return Result.fail(`Method expects to have a children`, `Please update method access TS Node`);
            }
            const property = tsNode.getChild(0);
            if (!Identifier.isA(property)) {
                return Result.fail(`Property expected to be identifier`, `Please update ShorthandAccess.identifyValue() to support '${property.getText()}'`);
            }
            const obj = await ValueLevel.identifyValue(property, { dataType: ValueTypeString.default }, astNodeContext);
            if (obj.isFailure) {
                return Result.fail(`ValueLevel.identifyValue('${property.getText()}'): ${obj.errorTitle}`, obj.errorDescription);
            }
            let data = {
                [property.getText()]: obj.getValue().data
            };
            return Result.ok({ data: data, dataType: ValueTypeString.object });
        };
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ShorthandAccess = _classThis;
})();
export { ShorthandAccess };
