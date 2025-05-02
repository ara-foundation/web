import { FilePath, ModuleLink, ReflectProxy } from "@ara-web/reflect";
import { getRule as getSdsModuleImportsRule } from "./rules/sds-module-imports.js";
const name = "eslint-sds-linter";
const namespace = "@ara-web";
const version = process.env.node_package_version || "0.0.1";
const desc = "If you don't want to have a nightmare trying to understand module dependencies. This linter forces you to build simple and easy to navigate imports";
export class EslintSDSLinterProxy extends ReflectProxy {
    _version;
    _cwd;
    _packageJsonFileName;
    constructor(cwd, packageJsonFileName) {
        super(desc, ModuleLink.newPackageURL(namespace, name));
        this._version = version;
        this._cwd = cwd;
        this._packageJsonFileName = packageJsonFileName;
    }
    /**
     *
     * @returns Returns the Plugin Object needed for the ESLint.
     */
    async getPlugin() {
        const cwd = this._cwd !== undefined ? this._cwd : FilePath.getCurrentWorkingDir();
        const dependencies = FilePath.getPackageJsonDependencies(cwd, this._packageJsonFileName);
        const sdsModuleImport = getSdsModuleImportsRule(dependencies);
        const rules = {
            "sds-module-imports": sdsModuleImport,
        };
        const plugin = {
            configs: {
                get recommended() {
                    return recommended;
                },
            },
            meta: {
                name: this.moduleLink.toPkgURL.name,
                version: this._version
            },
            rules,
        };
        const recommended = {
            plugins: {
                "sds-linter": plugin,
            },
            rules,
        };
        return plugin;
    }
}
export default EslintSDSLinterProxy;
