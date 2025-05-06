import { SDSProxy } from "@ara-web/p-hintjens/sds";
export declare class ReflectEslintProxy extends SDSProxy {
    private _version;
    private _cwd?;
    private _packageJsonFileName?;
    constructor(cwd?: string, packageJsonFileName?: string);
    /**
     *
     * @returns Returns the Plugin Object needed for the ESLint.
     */
    getPlugin?(): Promise<{
        configs: {
            readonly recommended: {
                plugins: {
                    "sds-linter": /*elided*/ any;
                };
                rules: {
                    "sds-module-imports": import("@typescript-eslint/utils/ts-eslint").RuleModule<string, [], import("./rules/sds-module-imports.js").SDSLinterEsPluginDocs, import("@typescript-eslint/utils/ts-eslint").RuleListener>;
                };
            };
        };
        meta: {
            name: string;
            version: string;
        };
        rules: {
            "sds-module-imports": import("@typescript-eslint/utils/ts-eslint").RuleModule<string, [], import("./rules/sds-module-imports.js").SDSLinterEsPluginDocs, import("@typescript-eslint/utils/ts-eslint").RuleListener>;
        };
    }>;
}
export default ReflectEslintProxy;
