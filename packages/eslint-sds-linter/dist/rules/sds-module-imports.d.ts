import { ESLintUtils } from '@typescript-eslint/utils';
export interface SDSLinterEsPluginDocs {
    description: string;
    recommended?: boolean;
    requiresTypeChecking?: boolean;
}
export declare const getRule: (packageJson: string[]) => ESLintUtils.RuleModule<string, [], SDSLinterEsPluginDocs, ESLintUtils.RuleListener>;
