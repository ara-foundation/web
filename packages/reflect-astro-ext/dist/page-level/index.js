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
import { parse as commentParse } from "comment-parser";
import { OkResult, Result, ObjectTraits, Debug } from "@ara-web/ts-enhancement";
import { FileExtension, DEFAULT_SLOT } from "../index.js";
import { ComponentLevel } from "../component-level/index.js";
/**
 * Ontologically, `PageLevel` supports translation of modules into `Page` data
 */
let PageLevel = (() => {
    let _classDecorators = [ObjectTraits.staticImplements()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var PageLevel = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            PageLevel = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        /**
         * Generates the UI Page from the module `parts` and `memory`.
         * @param {Parts} parts
         * @returns {Component}
         */
        static identify = async (parts, rawMemory) => {
            const validated = _classThis.validateModuleParts(parts);
            if (validated.isFailure) {
                return Result.fail(`this.validateParts(): ${validated.errorTitle}`, validated.errorDescription);
            }
            const meta = _classThis.getMetaFromComment(parts.source);
            const memory = rawMemory;
            const slots = await _classThis.identifySlots(parts, memory);
            if (slots.isFailure) {
                return Result.fail(`this.identifySlots(): ${slots.errorTitle}`, slots.errorDescription);
            }
            const page = {
                moduleLink: memory.moduleLink,
                get: memory.glob,
                slots: slots.getValue(),
                fileExtension: parts.fileExtension,
                source: parts.source,
                ...meta
            };
            return Result.ok(page);
        };
        static validateModuleParts = (parts) => {
            if (parts.fileExtension !== FileExtension.Astro) {
                return OkResult.fail("Unsupported page type", "Only .astro files should be in the pages");
            }
            // Identifying the page title and description needs the source code.
            if (parts.source === undefined) {
                return OkResult.fail("Missing scripts in astro frontmatter", "Please include the astro scripts even if its empty");
            }
            if (parts.elements === undefined) {
                return OkResult.fail("Missing any component", "Please include the any component even if its empty");
            }
            return OkResult.ok();
        };
        /**
         * Extracts the Title, Description from the Page Meta.
         * Returns true if extraction was successful. Otherwise returns false and
         * the error message will be set in the page.title and page.description
         */
        static getMetaFromComment = (source) => {
            const componentMeta = {
                title: "",
                description: "",
            };
            const parsed = commentParse(source);
            if (parsed.length === 0) {
                return componentMeta;
            }
            for (let block of parsed) {
                for (let tag of block.tags) {
                    if (tag.tag === "param") {
                        if (tag.type !== "string") {
                            continue;
                        }
                        if (tag.name === "Title") {
                            if (tag.description.length > 0) {
                                componentMeta.title = tag.description;
                            }
                        }
                        else if (tag.name === "Description") {
                            if (tag.description.length > 0) {
                                componentMeta.description = tag.description;
                            }
                        }
                    }
                }
            }
            return componentMeta;
        };
        /**
         * Identify each component within the page. All data of the page are represented as the components.
         * @returns {Result<AraPage>}
         */
        static identifySlots = async (uiContent, memory) => {
            const slots = {
                [DEFAULT_SLOT]: []
            };
            for (let componentNode of uiContent.elements) {
                const identificationResult = await ComponentLevel.identifyAstroNode(uiContent, memory, componentNode);
                if (identificationResult.isFailure) {
                    const err = Debug.error(`ComponentLevel.identifyAstroNode(): ${identificationResult.errorTitle}`, identificationResult.errorDescription, componentNode);
                    return Result.fail(err);
                }
                Debug.log(`Make sure to detect the slots and put the data in accordance in identifySlots() PageLevel`);
                slots[DEFAULT_SLOT].push(identificationResult.getValue());
                //         // Let's detect the ComponentType
                //         if (identifiedComponent.id === ComponentIdentity.Undeclared) {
                //             return Result.fail(`code.identifyComponent(componentNode='${componentName(componentNode)}'): error`, 'The component type is not supported by Ara Web')
                //         } else if (identifiedComponent.id === ComponentIdentity.Component || 
                //             identifiedComponent.id === ComponentIdentity.Expression) {
                //             pageTraits.page.metaComponents?.push(identifiedComponent);
                //             continue;
                //         } else if (identifiedComponent.id === ComponentIdentity.Rpc) {
                //             if (pageTraits.page.rpcs === undefined) {
                //                 pageTraits.page.rpcs = {};
                //             }
                //             const componentData = identifiedComponent as RpcCallType;
                //             if (componentData.rpcType === RpcType.Extension) {
                //                 if (pageTraits.page.rpcs.extension === undefined) {
                //                     pageTraits.page.rpcs.extension = [];
                //                 }
                //                 pageTraits.page.rpcs.extension.push(componentData)
                //             } else if (componentData.rpcType === RpcType.Independent) {
                //                 if (pageTraits.page.rpcs.independent === undefined) {
                //                     pageTraits.page.rpcs.independent = [];
                //                 }
                //                 pageTraits.page.rpcs.independent.push(componentData)
                //             } else if (componentData.rpcType === RpcType.Proxy) {
                //                 if (pageTraits.page.rpcs.proxy === undefined) {
                //                     pageTraits.page.rpcs.proxy = [];
                //                 }
                //                 pageTraits.page.rpcs.proxy.push(componentData)
                //             }
                //             continue;
                //         } else if (identifiedComponent.id === ComponentIdentity.Layout) {
                //             const identificationResult = await identifyLayoutComponents(pageTraits, componentNode);
                //             if (identificationResult.isFailure) {
                //                 return Result.fail(
                //                     `this.identifyLayoutComponents(componentNode='${componentName(componentNode)}'): ${identificationResult.errorTitle}`,
                //                     identificationResult.errorDescription!
                //                 )
                //             }
                //             continue;
                //         } else {
                //             console.log(`Component ${componentName(componentNode)} was not identified. It's neither Layout, nor Component nor RPC Call`);
                //         }
            }
            return Result.ok(slots);
        };
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return PageLevel = _classThis;
})();
export { PageLevel };
