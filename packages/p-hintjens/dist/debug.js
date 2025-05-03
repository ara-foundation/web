export class Debug {
    static _instance;
    lineCounter;
    stack;
    constructor() {
        this.lineCounter = 0;
        this.stack = [];
    }
    static get instance() {
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
    static log = (msg) => {
        Debug.instance._log(msg);
    };
    static push = (title, parameters) => {
        if (parameters === undefined) {
            Debug.instance._log(`---> '${title}'()`);
        }
        else {
            Debug.instance._log(`---> '${title}' with properties`);
            Debug.instance._log(parameters);
        }
        Debug.instance.stack.push(title);
    };
    // Delete the last
    static pop = () => {
        if (Debug.instance.stack.length === 0) {
            Debug.instance._log(`Calling pop() but no stack of pushed data`);
            return;
        }
        const needle = Debug.instance.stack.pop();
        Debug.instance._log(`<--- ${needle}`);
        if (Debug.instance.stack.length === 0) {
            Debug.instance.lineCounter = 0;
        }
    };
    static reset = () => {
        if (Debug.instance.stack.length > 0) {
            console.log(`Can not reset as there are ${Debug.instance.stack.length} objects in the stack:`);
            let padding = "";
            for (let i in Debug.instance.stack) {
                console.log(`${padding} ${i + 1}) ${Debug.instance.stack[i]}`);
                padding += "\t";
            }
            console.log(`Failed to reset, as uncleared stack '${Debug.instance.stack.join(' -> ')}' exists`);
            throw `stack is not empty`;
        }
    };
    static error = (errorTitle, errorDescription, additionalData) => {
        Debug.instance._error(errorTitle, errorDescription, additionalData);
        return { errorTitle, errorDescription };
    };
    //////////////////////////////////////////
    // 
    // Internal
    //
    ////////////////////////////////////////////
    _error = (title, description, additionalData) => {
        console.log(`ERROR at ${this.lineCounter})`);
        console.log(title);
        console.log(description);
        if (additionalData) {
            console.log(`Additional data to check`);
            console.log(additionalData);
            console.log(`\n\n`);
        }
        if (additionalData !== undefined)
            console.log(`The error stack trace:`);
        console.log(this.stack.join("\t->") + "\n\n");
    };
    _log = (msg) => {
        let nodeTree = this.stackNodeTree();
        if (nodeTree.length > 0) {
            nodeTree += ":";
        }
        if (typeof msg === "string") {
            console.log(`${this.lineCounter++}) ${nodeTree} ${msg}`);
        }
        else {
            console.log(`${this.lineCounter++}) ${nodeTree}:`);
            console.log(msg);
        }
    };
    stackNodeTree = () => {
        if (this.stack.length === 0) {
            return "";
        }
        const last = this.stack.pop();
        const nodeTree = this.stack.map(() => ("  ")).join("") + `${this.stack.length}> ${last}`;
        this.stack.push(last);
        return nodeTree;
    };
}
