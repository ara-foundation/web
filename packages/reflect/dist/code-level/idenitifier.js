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
import { Identifier as TsIdentifier, Node } from "ts-morph";
import { Result, ObjectTraits, AraLink } from "@ara-web/p-hintjens";
import { ValueTypeString } from "./ast-node-data.js";
import { TsNode } from "./ts-node.js";
import {} from "./value-level-interface.js";
import { ReflectLink } from "./ReflectLink.js";
import { ValueLevel } from "./value-level/index.js";
/**
 * Literal class identifies the literal data such as "string", 123, false, true.
 */
let Identifier = (() => {
    let _classDecorators = [ObjectTraits.staticImplements()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var Identifier = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            Identifier = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static get name() {
            return "Identifier";
        }
        static isA = (child) => {
            const node = child.getNode();
            return node instanceof TsIdentifier;
        };
        identifyValue = async (tsNode, typedData, parentNodeContext) => {
            if (!Identifier.isA(tsNode)) {
                return Result.fail(`TS Node is not identifier`, 'Please pass the correct TS Node');
            }
            const identifier = parentNodeContext.getIdentifier(tsNode.getText());
            if (identifier === undefined) {
                return Result.fail(`The identifier '${tsNode.getText()}' not found in the Ast Node Context`, 'Contact to Ara Web Maintainer to fix it');
            }
            if (identifier.data === undefined) {
                return Result.fail(`The identifier data is undefined`, `The make sure that AST Node parsed correctly`);
            }
            if (!(identifier.data instanceof AraLink)) {
                return Result.ok({ data: identifier.data, dataType: identifier.dataType });
            }
            const exp = ReflectLink.getResourceAsTsNode(identifier.data);
            const astNodeContext = parentNodeContext?.clone(identifier.getAllMemoryData(), [identifier.identifier]);
            const identifiedExp = await ValueLevel.identifyValue(exp, { dataType: ValueTypeString.default }, astNodeContext);
            if (identifiedExp.isFailure) {
                return Result.fail(`ValueLevel.identifyValue(): ${identifiedExp.errorTitle}`, identifiedExp.errorDescription);
            }
            // Type was given, then make sure the identifier has this type as well.
            if (typedData?.dataType !== undefined && typedData.dataType !== ValueTypeString.default) {
                return Result.fail(`typedData.dataType is not default`, `For now, Ara web supports custom data only`);
            }
            return Result.ok(identifiedExp.getValue());
        };
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return Identifier = _classThis;
})();
export { Identifier };
