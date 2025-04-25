export var ModuleCategory;
(function (ModuleCategory) {
    ModuleCategory["Untracked"] = "untracked";
})(ModuleCategory || (ModuleCategory = {}));
export var FileExtension;
(function (FileExtension) {
    FileExtension["Tsx"] = ".tsx";
    FileExtension["Jsx"] = ".jsx";
    FileExtension["Typescript"] = ".ts";
    FileExtension["Javascript"] = ".js";
})(FileExtension || (FileExtension = {}));
/**
 * Removes any special character prefixes:
 *  `./`
 *  `../`
 *  `@`
 * @param module path
 */
export const trimPath = (path) => {
    return path.replace("./", "").replace("../", "").replace("@", "/src/");
};
