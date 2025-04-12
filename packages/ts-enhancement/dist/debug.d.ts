export declare class Debug {
    private static _instance;
    private lineCounter;
    private stack;
    private constructor();
    private static get instance();
    static log: (msg: any) => void;
    static push: (title: string, parameters?: {
        [key: string]: string;
    }) => void;
    static pop: () => void;
    static reset: () => void;
    static error: (errorTitle: string, errorDescription: string, additionalData: any) => {
        errorTitle: string;
        errorDescription: string;
    };
    private _error;
    private _log;
    private stackNodeTree;
}
