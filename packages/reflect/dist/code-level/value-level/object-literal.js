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
import { Node, ObjectLiteralExpression } from "ts-morph";
import { ObjectTraits, Result } from "@ara-web/p-hintjens";
import { AstNodeTraits, UserTypeDeclaration, IntersectedUnionType, UnionTypeDeclaration, ValueTypeString, CodePieceContext, ValueLevel, ReflectLink } from "../index.js";
/**
 * Literal class identifies the object literals
 */
let ObjectLiteral = (() => {
    let _classDecorators = [ObjectTraits.staticImplements()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ObjectLiteral = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ObjectLiteral = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        static get name() {
            return "ObjectLiteral";
        }
        static isA = (node) => {
            return node instanceof ObjectLiteralExpression;
        };
        identifyValue = async (tsNode, typedData, astNodeContext) => {
            const syntaxLists = AstNodeTraits.getChildren(tsNode, [AstNodeTraits.isSyntaxList]);
            if (syntaxLists.length !== 1) {
                return Result.fail(`tsNode.getChildren([Node.isSyntaxList]): expected 1 syntax list`, `There must be one syntax list, while node has ${syntaxLists.length}`);
            }
            const identified = await this.identifyObjectLiteral(typedData, syntaxLists[0], astNodeContext);
            if (identified.isFailure) {
                return Result.fail(`this.identifyObjectLiteral(): ${identified.errorTitle}`, identified.errorDescription);
            }
            else {
                const copied = ObjectTraits.deepCopy(identified.getValue().data);
                return Result.ok({ data: copied, dataType: identified.getValue().dataType });
            }
        };
        /**
             * ObjectLiteralExpression has three children:
             * @child {Node} '{'
             * @child {SyntaxList} anything
             * @child Node '}'
             */
        identifyObjectLiteral = async (typedData, syntaxList, astNodeContext) => {
            const syntaxListElements = AstNodeTraits.getChildren(syntaxList, [], [AstNodeTraits.isNonImportant], [","]);
            if (typedData.data === undefined) {
                const exactData = ValueLevel.exactValueByType(typedData);
                if (exactData.isFailure) {
                    return Result.fail(`ValueLevel.exactValueByType(): ${exactData.errorTitle}`, exactData.errorDescription);
                }
                else {
                    typedData.data = exactData.getValue();
                }
            }
            for (let i = 0; i < syntaxListElements.length; i++) {
                const element = syntaxListElements[i];
                const identifiedObjectElement = await ValueLevel.identifyValue(element, { dataType: ValueTypeString.default }, astNodeContext);
                if (identifiedObjectElement.isFailure) {
                    return Result.fail(`ValueLevel.identifyValue('${element.getText()}'): ${identifiedObjectElement.errorTitle}`, identifiedObjectElement.errorDescription);
                }
                if (typedData.dataType !== ValueTypeString.default &&
                    typedData.dataType !== ValueTypeString.object &&
                    !(typedData.dataType instanceof UnionTypeDeclaration) &&
                    !(typedData.dataType instanceof UserTypeDeclaration) &&
                    !(typedData.dataType instanceof IntersectedUnionType) &&
                    typeof typedData.dataType !== "object") {
                    return Result.fail(`For now, only default value string type supported`, `Please update the ObjectLiteral.identifyObjectLiteral to support '${typedData.dataType}'`);
                }
                if (typedData.data === undefined || ReflectLink.isTsNodeLink(typedData.data)) {
                    typedData.data = {};
                }
                typedData.data = { ...typedData.data, ...identifiedObjectElement.getValue().data };
            }
            if (typedData.dataType === ValueTypeString.default) {
                typedData.dataType = ValueTypeString.object;
            }
            return Result.ok({ ...typedData });
        };
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ObjectLiteral = _classThis;
})();
export { ObjectLiteral };
