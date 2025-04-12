export class Debug {
    private static _instance: Debug;

    private lineCounter: number;
    private stack: string[];

    private constructor() {
        this.lineCounter = 0;
        this.stack = [];
    }

    private static get instance(): Debug {
        if (!Debug._instance) {
            Debug._instance = new Debug();
        }

        return Debug._instance;
    }
    
    /////////////////////////////////////////
    //
    // public functions
    //
    /////////////////////////////////////////
    public static log = (msg: any) => {
        Debug.instance._log(msg);
    }

    public static push = (title: string, parameters?: {[key: string]: string}) => {
        if (parameters === undefined) {
            Debug.instance._log(`---> '${title}'()`)
        } else {
            let flattened: string[] = [];
            for (let key in parameters) {
                flattened.push(`${key}: '${parameters[key]}'`)
            }
            Debug.instance._log(`---> '${title}'(${flattened.join(",")})`)
        }
        Debug.instance.stack.push(title);
    }

    // Delete the last
    public static pop = () => {
        if (Debug.instance.stack.length === 0) {
            Debug.instance._log(`Calling pop() but no stack of pushed data`);
            return;
        }
        const needle = Debug.instance.stack.pop();
        Debug.instance._log(`<--- ${needle}`)
        if (Debug.instance.stack.length === 0) {
            Debug.instance.lineCounter = 0;
        }
    }

    public static reset = () => {
        if (Debug.instance.stack.length > 0) {
            console.log(`Can not reset as there are ${Debug.instance.stack.length} objects in the stack:`);
            let padding = ""
            let i 
            for (let i in Debug.instance.stack) {
                console.log(`${padding} ${i+1}) ${Debug.instance.stack[i]}`);
                padding += "\t"
            }
            console.log(`Failed to reset, as uncleared stack '${Debug.instance.stack.join(' -> ')}' exists`);
            throw `stack is not empty`
        }
    }

    public static error = (errorTitle: string, errorDescription: string, additionalData: any): {errorTitle: string, errorDescription: string} => {
        Debug.instance._error(errorTitle, errorDescription, additionalData)
        return {errorTitle, errorDescription}
    }

    //////////////////////////////////////////
    // 
    // Internal
    //
    ////////////////////////////////////////////

    private _error = (title: string, description: string, additionalData: any): void => {
        console.log(`${this.lineCounter}) Encountered an error: ${title}`);
        console.log(`${description}`)
        console.log(`The error stack trace:`)
        console.log(this.stack.join("\t->"))
    }

    private _log = (msg: any) => {
        let nodeTree = this.stackNodeTree();
        if (nodeTree.length > 0) {
            nodeTree += ":"
        }
        if (typeof msg === "string") {
            console.log(`${this.lineCounter++}) ${nodeTree} ${msg}`);
        } else {
            console.log(`${this.lineCounter++}) ${nodeTree} non string data:`)
            console.log(msg);
        }
    }

    private stackNodeTree = (): string => {
        if (this.stack.length === 0) {
            return "";
        }
        const last = this.stack.pop();
        const nodeTree: string = this.stack.map(() => ("  ")).join("") + `${this.stack.length}> ${last}`
        this.stack.push(last!);
        return nodeTree;
    }
}