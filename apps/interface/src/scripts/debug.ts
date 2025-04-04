
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
    public static log = (msg: string) => {
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

    //////////////////////////////////////////
    // 
    // Internal
    //
    ////////////////////////////////////////////

    private _log = (msg: string) => {
        // const date = new Date().toISOString()
        const nodeTree = this.stackNodeTree();
        console.log(`${this.lineCounter++}) ${nodeTree}: ${msg}\n`);
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