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
import { parse as AstroParse } from "@astrojs/compiler";
import { parse as commentParse } from "comment-parser";
import { Debug, Result, EnumTraits, ObjectTraits } from "@ara-web/ts-enhancement";
import { FilePath, ModuleMemory } from "@ara-web/reflect";
import { FileExtension, ElementType } from "./ontology/index.js";
/**
 * Module Category to sort the modules.
 * By design module categories supposed to match the directory in the file system.
 * Although it's not required.
 */
export var ModuleCategory;
(function (ModuleCategory) {
    ModuleCategory["Script"] = "scripts";
    ModuleCategory["Component"] = "components";
    ModuleCategory["Page"] = "pages";
    ModuleCategory["Layout"] = "layouts";
})(ModuleCategory || (ModuleCategory = {}));
/**
 * Detects the module category. To detct, it must be in the src.
 * @param modulePath
 * @returns
 */
export const extractModuleCategory = (srcDir, modulePath) => {
    if (!modulePath.startsWith(srcDir)) {
        return Result.fail(`The Astro Framework records must be in the 'src' of the root directory`, `Please pass a module in '${srcDir}', not as '${modulePath}'`);
    }
    // Could be one of the pre-defined categories such as 'pages', 'components' etc.
    for (let moduleCategory of EnumTraits.enumValues(ModuleCategory)) {
        if (modulePath.startsWith(FilePath.join([srcDir, moduleCategory]))) {
            return Result.ok(moduleCategory);
        }
    }
    // User-made category
    const moduleSlugs = modulePath.substring(srcDir.length).split("/");
    if (moduleSlugs.length < 2) {
        return Result.fail(`The '${modulePath}' doesn't have a category`, `Are you sure its in the sub-directory of the src/?`);
    }
    return Result.ok(moduleSlugs[0]);
};
/**
 * Partition the Module into the UI elements and the source code
 */
export class ModulePartitioner {
    constructor() { }
    /**
     * Identifies the parts that the module has. Additionally, it also identifies the source code
     * @returns {Result<ModuleParts>}
     */
    static partition = async (moduleMemory) => {
        const uiContent = await this.getModuleParts(moduleMemory);
        if (uiContent.isFailure) {
            return Result.fail(`this.getModuleParts(): ${uiContent.errorTitle}`, uiContent.errorDescription);
        }
        return Result.ok(uiContent.getValue());
    };
    /**
     * Returns a page by it's path
     */
    getPageByUrl = async (url) => {
        if (url === undefined) {
            return undefined;
        }
        if (url.length === 0) {
            return undefined;
        }
        if (url[url.length - 1] === "/") {
            url = url.substring(0, url.length - 1);
        }
        return undefined;
    };
    //************************************************************** */
    //
    // Private methods of the pages
    //
    //************************************************************** */
    /**
     * Loads the module and returns the module parts such as which HTML elements it contains and source code.
     *
     * @param modulePath The module path is used to define the absolute path to the file
     * @param glob
     * @returns
     */
    static getModuleParts = async (moduleMemory) => {
        // const absoluteModulePath = absolutePath(modulePath, glob);
        const fileExtensionResult = FilePath.getFileExtension(moduleMemory.moduleLink.toFilePath, EnumTraits.enumValues(FileExtension));
        if (fileExtensionResult.isFailure) {
            return Result.fail(`getFileExtension('${moduleMemory.moduleLink.toFilePath}'): ${fileExtensionResult.errorTitle}`, fileExtensionResult.errorDescription);
        }
        const fileExtension = fileExtensionResult.getValue();
        const absolutePath = moduleMemory.moduleLink.toFilePath;
        const readResult = await FilePath.getFileContent(absolutePath);
        if (readResult.isFailure) {
            return Result.fail(`getFileContent(${absolutePath}): ${readResult.errorTitle}`, readResult.errorDescription);
        }
        const source = readResult.getValue();
        // If we start to support the TSX or JSX
        if (fileExtension !== FileExtension.Astro) {
            return Result.ok({ fileExtension, elements: [], source: `${source}` });
        }
        const fileContent = await this.parseAstroFile(source);
        return Result.ok(fileContent);
    };
    /**
     * Sets the code and nodes properties of the file content if it's an Astro file
     * @param astroSource through the file system we read the content of the file
     * @returns {Promise<ModuleParts>} fileContent with the `nodes` and `code` properties set
     */
    static parseAstroFile = async (astroSource) => {
        const result = await AstroParse(astroSource, {
            position: false, // defaults to `true`
        });
        const { frontmatterCode, componentNodes } = this.extractAstroComponents(result.ast);
        const fileContent = {
            source: frontmatterCode.length > 0 ? frontmatterCode : '',
            elements: componentNodes.length > 0 ? componentNodes : [],
            fileExtension: FileExtension.Astro,
        };
        return fileContent;
    };
    /**
     * Parses the Astro web page into the components and its frontmatter code.
     *
     * Supports:
     *  - Component
     *  - Element types.
     * The pure text components in the web pages are not considered.
     * @todo make sure to parse the components to the respected areas
     * @param ast A RootNode of the Astro Web Page
     * @returns Components and Frontmatter
     */
    static extractAstroComponents = (ast) => {
        const componentNodes = [];
        let frontmatterCode = "";
        for (let i = 0; i < ast.children.length; i++) {
            const child = ast.children[i];
            if (child.type === "text" ||
                child.type === "comment" ||
                child.type === "doctype") {
                continue;
            }
            if (child.type === "frontmatter") {
                frontmatterCode = child.value;
            }
            else if (child.type === "component") {
                componentNodes.push(child);
            }
            else if (child.type === "element") {
                componentNodes.push(child);
            }
            else {
                Debug.log(`The page has unsupported ${child.type} node, Update the MultiPartitioner.extractAstroComponents():`);
                Debug.log(child);
            }
        }
        return { componentNodes, frontmatterCode };
    };
}
/**
 * If Module is Script or Asset, basically anything that is not UI Level, but also
 * doesn't require identifying code structure, therefore not in Code Level too.
 *
 * Ontologically, `ModuleIdentifier` supports translation of modules into `Script` and `Asset` data
 */
let ModuleIdentifier = (() => {
    let _classDecorators = [ObjectTraits.staticImplements()];
    let _classDescriptor;
    let _classExtraInitializers = [];
    let _classThis;
    var ModuleIdentifier = class {
        static { _classThis = this; }
        static {
            const _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            __esDecorate(null, _classDescriptor = { value: _classThis }, _classDecorators, { kind: "class", name: _classThis.name, metadata: _metadata }, null, _classExtraInitializers);
            ModuleIdentifier = _classThis = _classDescriptor.value;
            if (_metadata) Object.defineProperty(_classThis, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        }
        /**
         * Checks is the following a script, which are the files that ends with TS and JS.
         * @param fileExtension
         */
        static isScript = (fileExtension) => {
            return ([
                FileExtension.Javascript,
                FileExtension.Typescript,
            ]).includes(fileExtension);
        };
        static isAsset = (fileExtension) => {
            return (fileExtension !== FileExtension.Astro && !_classThis.isScript(fileExtension));
        };
        /**
         * Converts the module `parts` and module `rawMemory` into `Script` or `Asset`.
         * Detects the identification by the module link.
         * @param parts
         * @param rawMemory
         * @returns
         */
        static identify = async (parts, rawMemory) => {
            const filePath = rawMemory.moduleLink.toFilePath;
            const fileExtensionResult = FilePath.getFileExtension(filePath, EnumTraits.enumValues(FileExtension));
            if (fileExtensionResult.isFailure) {
                return Result.fail(`FilePath.getFileExtension('${filePath}, [${EnumTraits.enumValues(FileExtension).join(", ")}]): ${fileExtensionResult.errorTitle}`, fileExtensionResult.errorDescription);
            }
            const fileExtension = fileExtensionResult.getValue();
            const title = await FilePath.getFileName(filePath);
            if (title.isFailure) {
                return Result.fail(`FilePath.getFileName('${filePath}'): ${title.errorTitle}`, title.errorDescription);
            }
            const description = _classThis.getDescriptionFromComment(parts.source);
            if (_classThis.isScript(fileExtension)) {
                const data = {
                    title: title.getValue(),
                    description,
                    moduleLink: rawMemory.moduleLink,
                    fileExtension: fileExtension,
                    glob: rawMemory.glob,
                    type: ElementType.Script,
                    source: parts.source, // Source code of the script as it is.
                };
                return Result.ok(data);
            }
            else if (_classThis.isAsset(fileExtension)) {
                const data = {
                    title: title.getValue(),
                    description,
                    moduleLink: rawMemory.moduleLink,
                    fileExtension: fileExtension,
                    glob: rawMemory.glob,
                    type: ElementType.Asset,
                    source: parts.source ? parts.source : undefined,
                };
                return Result.ok(data);
            }
            return Result.errorCode404(['module', 'Module Identifier'], 'identify', `The '${filePath}' file extension is neither for assets nor for scripts`);
        };
        /**
             * Extracts the Description from the Component Meta.
             * Returns an empty string if no comment.
            */
        static getDescriptionFromComment = (source) => {
            let description = '';
            const parsed = commentParse(source);
            if (parsed.length === 0) {
                return description;
            }
            for (let block of parsed) {
                description = block.description;
                for (let tag of block.tags) {
                    if (tag.tag === "param") {
                        if (tag.type !== "string") {
                            continue;
                        }
                        if (tag.name === "Description") {
                            if (tag.description.length > 0) {
                                return tag.description;
                            }
                        }
                    }
                }
            }
            return description;
        };
        static {
            __runInitializers(_classThis, _classExtraInitializers);
        }
    };
    return ModuleIdentifier = _classThis;
})();
export { ModuleIdentifier };
