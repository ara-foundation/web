
export class Debug {
    static #instance: Debug;

    private lineCounter: number;
    private stack: string[];

    private constructor() {
        this.lineCounter = 0;
        this.stack = [];
    }

    private static get instance(): Debug {
        if (!Debug.#instance) {
            Debug.#instance = new Debug();
        }

        return Debug.#instance;
    }
    
    /////////////////////////////////////////
    //
    // public functions
    //
    /////////////////////////////////////////
    public static log = (msg: any) => {
        Debug.instance._log(msg);
    }

    public static push = (title: string) => {
        Debug.instance.stack.push(title);
    }

    // Delete the last
    public static pop = () => {
        Debug.instance.stack.pop();
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

    //////////////////////////////////////////
    // 
    // Internal
    //
    ////////////////////////////////////////////

    private _log = (msg: any) => {
        const nodeTree = this.stackNodeTree();
        if (typeof msg === "string") {
            console.log(`${this.lineCounter++}) ${nodeTree}: ${msg}\n`);
        } else {
            console.log(`${this.lineCounter++}) ${nodeTree}: Non string data:`)
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