import { Result } from "@ara-web/ts-enhancement";
import { FileExtension as BaseExtension, ModuleMemory } from "@ara-web/reflect";
/**
 * List of file extensions Astro Framework Reflection could reflect.
 */
export var FileExtension;
(function (FileExtension) {
    FileExtension["Astro"] = ".astro";
    FileExtension["Svg"] = ".svg";
    FileExtension["Markdown"] = ".md";
    FileExtension["Tsx"] = ".tsx";
    FileExtension["Jsx"] = ".jsx";
    FileExtension["Typescript"] = ".ts";
    FileExtension["Javascript"] = ".js";
})(FileExtension || (FileExtension = {}));
export const DEFAULT_SLOT = 'default';
export var ElementType;
(function (ElementType) {
    ElementType[ElementType["Page"] = 0] = "Page";
    ElementType[ElementType["Layout"] = 1] = "Layout";
    ElementType[ElementType["Component"] = 2] = "Component";
    ElementType[ElementType["Expression"] = 3] = "Expression";
    ElementType[ElementType["Script"] = 4] = "Script";
    // For example Images, Markdown files
    ElementType[ElementType["Asset"] = 5] = "Asset";
})(ElementType || (ElementType = {}));
