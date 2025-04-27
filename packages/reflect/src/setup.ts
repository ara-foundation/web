export type ModuleData = {
    [key: string]: {                // Module path
        glob: unknown,
    }
}

export type CategorizedModules = {
    [key: string]: ModuleData;
};


