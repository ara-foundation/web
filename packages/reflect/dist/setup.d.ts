export type ModuleData = {
    [key: string]: {
        glob: unknown;
    };
};
export type CategorizedModules = {
    [key: string]: ModuleData;
};
