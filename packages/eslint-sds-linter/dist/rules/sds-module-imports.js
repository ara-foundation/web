import { FilePath, ModulePath } from '@ara-web/reflect';
import { ESLintUtils } from '@typescript-eslint/utils';
import { builtinModules } from 'node:module';
const createRule = ESLintUtils.RuleCreator(name => `https://github.com/ara-foundation/web/tree/main/packages/eslint-sds-linter/docs/${name}.md`);
const messages = {
    notFamily: `This module is neither a sibling, a parent or a kid`,
    grandParent: `Please consider moving a code that calls this grandparent, to the the file in parent module.`,
    grandNamedParent: `Please consider calling parent's index only, named imports not allowed`,
    grandChild: `Please consider exposing a code thats's this grandchild, to the child's index file`,
    grandNamedChild: `Please consider calling child's index, named imports not allowed`,
    notNamedSibling: `Please consider calling siblings directly, not from index in the same directory`
};
export const getRule = (packageJson) => {
    return createRule({
        name: 'sds-module-imports',
        meta: {
            docs: {
                description: `SDS module imports. Check the github.com/ara-foundation/docs/sds/README.md for rules.`
            },
            messages,
            type: "problem",
            schema: [],
        },
        defaultOptions: [],
        create(context) {
            return {
                ImportDeclaration: (node) => {
                    let inPackageJson = packageJson.filter((packageURL) => node.source.value.startsWith(packageURL));
                    if (inPackageJson.length > 0) {
                        return;
                    }
                    const inBuiltInModules = builtinModules.filter((packageURL) => node.source.value === `node:${packageURL}`);
                    if (inBuiltInModules.length > 0) {
                        return;
                    }
                    const callingFilePath = FilePath.getFileAbsolutePath(context.filename, context.cwd);
                    const importFilePath = FilePath.getFileAbsolutePath(node.source.value, callingFilePath.toFilePath);
                    let importFilename = ModulePath.getFilenameOrIndex(importFilePath.toFilePath);
                    const lvl = ModulePath.getLevel(callingFilePath.toFilePath, importFilePath.toFilePath);
                    if (lvl !== undefined) {
                        if (lvl > 1) {
                            context.report({
                                messageId: 'grandChild',
                                node: node,
                            });
                        }
                        else if (lvl < -1) {
                            context.report({
                                messageId: 'grandParent',
                                node: node
                            });
                        }
                        else if (lvl === 1) {
                            if (importFilename !== "index") {
                                context.report({
                                    messageId: 'grandNamedChild',
                                    node: node
                                });
                            }
                        }
                        else if (lvl === -1) {
                            if (importFilename !== "index") {
                                context.report({
                                    messageId: 'grandNamedParent',
                                    node: node,
                                });
                            }
                        }
                        else if (lvl === 0) {
                            if (importFilename === "index") {
                                context.report({
                                    messageId: "notNamedSibling",
                                    node: node
                                });
                            }
                        }
                    }
                    else {
                        context.report({
                            messageId: "notFamily",
                            node: node,
                        });
                    }
                }
            };
        },
    });
};
