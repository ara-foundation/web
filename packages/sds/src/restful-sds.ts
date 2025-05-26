import { OkResult } from "@ara-web/p-hintjens";
import type { ModuleLink, ModuleURL } from "./links/module-link.js";
import { Rest, RestDispatcher, RestQueue } from "./rest.js";
import type { Meta, ExtensionOperator, ExtensionOperatorTraits, Setup } from "./sds.js";
import { LinkTraits } from "./link-traits.js";
import { DOCUMENT_SELECTOR, ObjectNode } from "./tree.js";


export interface RestfulSetup extends Setup {
    tag: string,
}

/**
 * Any Extension must implement the following interface
 */
export interface RestfulExtension extends Meta {
    extensionRestDispatcher?: RestDispatcher;
    extensionRestQueue?: RestQueue;
}

export class RestfulExtensionOperator implements ExtensionOperatorTraits {
    private _extensionOperator: ExtensionOperator;
    private _extDispatcher: RestDispatcher;
    // Rest dispatcher. When extension is added,
    // It will register extension's rest handler in the service's rest dispatcher.
    private _restDispatcherOperator?: ExtensionOperator; 
    private _restQueue: RestQueue;

    constructor(serviceLink: ModuleLink, extTag: string = 'memop', extOp: ExtensionOperator) {
        this._extensionOperator = extOp;
        this._restQueue = new RestQueue();
        this._extDispatcher = new RestDispatcher(serviceLink, extTag);
        this._extDispatcher.posting = this.handleExtensionAddition.bind(this);
        this._extDispatcher.putting = this.handleExtensionUpdate.bind(this);
        this._extDispatcher.deleting = this.handleExtensionDeletion.bind(this);
    }

    public get restDispatcher(): RestDispatcher {
        return this._extDispatcher;
    }

    public async setRestDispatcherOperator(rest: Rest<any>): Promise<OkResult> {
        const documentElement = await rest.get!('*');
        if (documentElement === null) {
            return OkResult.fail(`No document element found, are you sure element exist?`, `Please make sure element exist`);
        }
        if (documentElement.selector !== DOCUMENT_SELECTOR) {
            return OkResult.fail(`The element isn't document selector`, `Can not put element node`);
        }
        this._restQueue.setAll(documentElement!, rest.objectToNodeTree);
        this._restDispatcherOperator = rest.extensionOperator as ExtensionOperator;
        return OkResult.ok();
    }

    /*********************************************************************
     * 
     * Operator's public methods
     * 
     *********************************************************************/

    public get all(): Readonly<RestfulExtension>[] {
        return this._extensionOperator.all;
    }

    public get count(): number {
        return this._extensionOperator.count;
    }

    /**
     * Registering a new extension in run-time.
     * If extension exists, then it throws error asking to use Put.
     * @param parentOrBigBro 
     * @param node 
     * @param options 
     * @returns 
     */
    public async create(
        ext: RestfulExtension,
    ): Promise<OkResult> {
        if (this._restDispatcherOperator === undefined) {
            return OkResult.fail(`Please pass the rest dispatcher`, `call extensionOperator.setRestDispatcherOperator`);
        }

        const added = await this._extensionOperator.create(ext);
        if (added.isFailure) {
            return OkResult.fail(`super.add(): ${added.errorTitle}`, added.errorDescription!);
        }

        if (ext.extensionRestDispatcher) {
            const added = await this._restDispatcherOperator.create(ext.extensionRestDispatcher);
            if (added.isFailure) {
                return OkResult.fail(`restDispatcherOperator.create('${ext.extensionRestDispatcher.packageLink}'): ${added.errorTitle}`, added.errorDescription!);
            }
        }

        if (!this._restQueue.isExist(ext.packageLink.moduleURL)) {
            // Very important line.
            // If it's given at the end, then when trying
            // to get the parent object node, it will
            // enter into an infinite cycle. get -> beforeAny -> get...
            this._restQueue.set(ext.packageLink.moduleURL);
            const moduleElement = this._restQueue.objectToNodeTree!(this.read(ext.packageLink.moduleURL)!, this._restQueue.parentNode!);
            this._restQueue.parentNode!.appendChild(moduleElement);
        }

        return OkResult.ok();
    }

    public read(moduleURL: ModuleURL): RestfulExtension|undefined {
        return this._extensionOperator.read(moduleURL);
    }

    public async update(
        ext: RestfulExtension
    ): Promise<OkResult> {
        const removed = await this.delete([ext]);
        if (removed.isFailure) {
            return OkResult.fail(`delete('${ext.packageLink}'): ${removed.errorTitle}`, removed.errorDescription!);
        }
        const added = await this.create(ext);
        if (added.isFailure) {
            return OkResult.fail(`delete('${ext.packageLink}'): ${added.errorTitle}`, added.errorDescription!);
        }

        return OkResult.ok();
    }

    public async delete(
        exts: RestfulExtension[]
    ): Promise<OkResult> {
        if (this._restDispatcherOperator === undefined) {
            return OkResult.fail(`Please pass the rest dispatcher`, `call extensionOperator.setRestDispatcherOperator`);
        }
        for (const ext of exts) {
            // Remove the extension's rest dispatcher from rest
            if (ext.extensionRestDispatcher) {
                const removed = await this._restDispatcherOperator.delete([ext.extensionRestDispatcher]);
                if (removed.isFailure) {
                    return OkResult.fail(`restDispatcherOperator.remove('${ext.extensionRestDispatcher.packageLink}'): ${removed.errorTitle}`, removed.errorDescription!);
                }
            }

            if (this._restQueue.isExist(ext.packageLink.moduleURL)) {
                // Very important line.
                // If it's given at the end, then when trying
                // to get the parent object node, it will
                // enter into an infinite cycle. get -> beforeAny -> get...
                this._restQueue.set(ext.packageLink.moduleURL);
                const moduleElement = this._restQueue.objectToNodeTree!(this.read(ext.packageLink.moduleURL)!, this._restQueue.parentNode!);
                this._restQueue.parentNode!.removeChild(moduleElement);
            }
        }

        const removed = await this._extensionOperator.delete(exts);
        if (removed.isFailure) {
            return OkResult.fail(`super.delete(): ${removed.errorTitle}`, removed.errorDescription!);
        }

        return OkResult.ok();
    }

    /***************************************************
     * 
     * Rest dispatching methods
     * 
     ***************************************************/

    /**
     * Registering a new extension in run-time.
     * If extension exists, then it throws error asking to use Put.
     * @param parentOrBigBro 
     * @param node 
     * @param options 
     * @returns 
     */
    private async handleExtensionAddition<DataType>(
        parentOrBigBro: ObjectNode<DataType>,
        node: ObjectNode<DataType>,
        options?: { lilBro?: boolean }
    ): Promise<OkResult> {
        if (options?.lilBro) {
            const bigBroTagName = LinkTraits.getTagName(parentOrBigBro.selector);
            if (bigBroTagName !== this._extDispatcher.tag) {
                return OkResult.ok();
            }
        } else {
            if (parentOrBigBro.selector !== DOCUMENT_SELECTOR) {
                return OkResult.ok();
            }
        }

        // Now, let's make sure it exists
        if (!this._extDispatcher.isMatchingTag(node.selector)) {
            return OkResult.fail(`The node is in the root, but it's tag isn't ${this._extDispatcher.tag}`, `The ${node.selector} expected to be an extension`);
        }

        const ext = node.data!;
        if (ext === null) {
            return OkResult.fail(`The packageLink attribute doesn't exist in the data`, `Please update it`);
         } else if (!("packageLink" in (ext! as unknown as RestfulExtension))) {
            return OkResult.fail(`The packageLink attribute doesn't exist in the data`, `Please update it`);
        }

        this._restQueue.set((ext! as unknown as RestfulExtension).packageLink.moduleURL)
        const added = await this.create(ext! as unknown as RestfulExtension);
        if (added.isSuccess) {
            const moduleURL = (ext! as unknown as RestfulExtension).packageLink.moduleURL;
            this._restQueue.set(moduleURL);
        }
        return added;
    }

    private async handleExtensionUpdate<DataType>(
        _selector: string,
        node: ObjectNode<DataType>,
        data: DataType
    ): Promise<OkResult> {
        // Only children of DOCUMENT_SELECTOR are considered to be extensions.
        if (node.parent === undefined || node.parent?.selector !== DOCUMENT_SELECTOR) {
            return OkResult.ok();
        }
        // Now, let's make sure it exists
        if (!this._extDispatcher.isMatchingTag(node.selector)) {
            return OkResult.fail(`The node is in the root, but it's tag isn't ${this._extDispatcher.tag}`, `The ${node.selector} expected to be an extension`);
        }
        
        const ext = node.data!
        if (ext === null) {
            return OkResult.fail(`The element is null`, `Please update the node argument`);
        } else if (!("packageLink" in (ext as unknown as RestfulExtension))) {
            return OkResult.fail(`The packageLink attribute doesn't exist in the node element`, `Please update the node argument`);
        }
        if (!("packageLink" in (data as unknown as RestfulExtension))) {
            return OkResult.fail(`The packageLink in the putting data`, `Please update the 'data' argument`);
        }
        const dataPkgLink = (data as unknown as RestfulExtension).packageLink;
        const extPkgLink = (ext as unknown as RestfulExtension).packageLink;
        if (extPkgLink.isEqual(dataPkgLink)) {
            return OkResult.fail(
                `The data that you are trying to put has incorrect module url`,
                `The extension you are trying to implement has '${extPkgLink}', while data to put has '${dataPkgLink}', please update your data's package link.`
            )
        }

        return await this.update(data as unknown as RestfulExtension);
    }

    private async handleExtensionDeletion<DataType>(
        _selector: string, nodes: ObjectNode<DataType>[]
    ): Promise<OkResult> {
        const exts = nodes
            .filter(node => this._extDispatcher.isMatchingTag(node.selector))
            .map(node => node.data)
            .filter(el => el !== null && ("packageLink" in (el as unknown as RestfulExtension)));
        if (exts.length === 0) {
            return OkResult.ok();
        }
        const removed = await this.delete(exts as unknown[] as RestfulExtension[]);
        if (removed.isSuccess) {
            exts.forEach(ext => 
                this._restQueue.set((ext as unknown as RestfulExtension).packageLink.moduleURL)
            );
        }
        return removed;
    }
}