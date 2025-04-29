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
import { Debug } from "@ara-web/ts-enhancement/debug";
import { Result } from "@ara-web/ts-enhancement/result";
import { ObjectTraits, StringTraits } from "@ara-web/ts-enhancement/traits";
import { ValueTypeString } from "../ast-node-data.js";
import { TsNode } from "../ts-node.js";
import { NumericLiteral, StringLiteral, TrueLiteral, FalseLiteral, Node } from "ts-morph";
import {} from "./value-level-interface.js";
/**
 * Literal class identifies the literal data such as "string", 123, false, true.
 */
let Literal = (() => {
    let _classDecorators = [ObjectTraits.staticImplements()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var Literal = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            Literal = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static get name() {
            return "Literal";
        }
        static isStringLiteral = (child) => {
            const node = child.getNode();
            return node instanceof StringLiteral;
        };
        static isNumericLiteral = (child) => {
            const node = child.getNode();
            return node instanceof NumericLiteral;
        };
        static isBooleanLiteral = (child) => {
            const node = child.getNode();
            if (node instanceof TrueLiteral) {
                return true;
            }
            if (node instanceof FalseLiteral) {
                return true;
            }
            return false;
        };
        static isA = (child) => {
            return _classThis.isStringLiteral(child) || _classThis.isNumericLiteral(child) || _classThis.isBooleanLiteral(child);
        };
        static identifyStringLiteral = (tsNode) => {
            if (Literal.isStringLiteral(tsNode)) {
                return Result.ok({ data: StringTraits.unquote(tsNode.getText()), dataType: ValueTypeString.string });
            }
            const err = Debug.error(`The '${tsNode.getText()}' as a literal value not supported by Ara Web`, `Please pass the correct TS Node, or update identifyLiteralValue()`, tsNode);
            return Result.fail(err);
        };
        static identifyNumericLiteral = (tsNode) => {
            if (Literal.isNumericLiteral(tsNode)) {
                return Result.ok({ data: JSON.parse(tsNode.getText()), dataType: ValueTypeString.number });
            }
            const err = Debug.error(`The '${tsNode.getText()}' as a literal value not supported by Ara Web`, `Please pass the correct TS Node, or update identifyLiteralValue()`, tsNode);
            return Result.fail(err);
        };
        static identifyBooleanLiteral = (tsNode) => {
            if (Literal.isBooleanLiteral(tsNode)) {
                return Result.ok({ data: JSON.parse(tsNode.getText()), dataType: ValueTypeString.boolean });
            }
            const err = Debug.error(`The '${tsNode.getText()}' as a literal value not supported by Ara Web`, `Please pass the correct TS Node, or update identifyLiteralValue()`, tsNode);
            return Result.fail(err);
        };
        identifyValue = async (tsNode, _, __) => {
            if (Literal.isStringLiteral(tsNode)) {
                return Literal.identifyStringLiteral(tsNode);
            }
            else if (Literal.isNumericLiteral(tsNode)) {
                return Literal.identifyNumericLiteral(tsNode);
            }
            else if (Literal.isBooleanLiteral(tsNode)) {
                return Literal.identifyBooleanLiteral(tsNode);
            }
            const err = Debug.error(`The '${tsNode.getText()}' as a literal value not supported by Ara Web`, `Please pass the correct TS Node, or update identifyLiteralValue()`, tsNode);
            return Result.fail(err);
        };
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return Literal = _classThis;
})();
export { Literal };
