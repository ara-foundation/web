import { OkResult } from "@ara-web/p-hintjens";
import { ModuleLink, type ModuleURL } from "./links/module-link.js";
import { RestHandler as RestHandler, RestDispatcher, RestSynchronizer, type Restful } from "./rest.js";
import type { Meta, ExtensionOperator, ExtendableOperator, Setup, Extendable } from "./sds.js";
import { LinkTraits } from "./link-traits.js";
import { DOCUMENT_SELECTOR, ObjectNode } from "./tree.js";


export interface RestfulSetup extends Setup {
    rootNodeTag: string,
}

/**
 * Any Extension must implement the following interface
 */
export interface RestfulExtension extends Meta {
    restHandler?: RestHandler;
    extensionRestQueue?: RestSynchronizer;
}

/**
 * Wraps the ExtensionOperator to provide
 * the synchronization with the rest through RestSynchronizer and RestDispatcher.
 * 
 * Purpose is to allow an SDS Service to have a RESTful API
 * to manage the extensions in run-time.
 * 
 * It uses the RestDispatcher to handle the RESTful setters
 * and RestSynchronizer to synchronize the data with the rest when this object is updated.
 */
export class RestfulExtensionOperator implements ExtendableOperator {
    private _extensionOperator: ExtensionOperator;
    private _extDispatcher: RestHandler;
    // To register the extension's own restful data if extension has custom handler.
    private _restDispatcherOperator?: RestDispatcher<any>; 
    private _restSynchronizer?: RestSynchronizer;

    constructor(
        serviceLink: ModuleLink, 
        extTag: string = 'memop', 
        extOp: ExtensionOperator
    ) {
        if (!serviceLink.isPkgURL) {
            throw `Only package url is allowed as the service link`
        }
        this._extensionOperator = extOp;
        const restDispatcherLink = ModuleLink.fromModuleURL(serviceLink.url, {class: `SDSRestfulExtensionOperator`, tag: extTag}).getValue();
        this._extDispatcher = new RestHandler(restDispatcherLink, extTag);
        this._extDispatcher.handlePost = this.handleExtensionAddition.bind(this);
        this._extDispatcher.handlePut = this.handleExtensionUpdate.bind(this);
        this._extDispatcher.handleDelete = this.handleExtensionDeletion.bind(this);
    }

    public get restDispatcher(): RestHandler {
        return this._extDispatcher;
    }

    public async setRestDispatcherOperator(rest: Restful<any>): Promise<OkResult> {
        const documentElement = await rest.get!('*');
        if (documentElement === null) {
            return OkResult.fail(`No document element found, are you sure element exist?`, `Please make sure element exist`);
        }
        if (documentElement.selector !== DOCUMENT_SELECTOR) {
            return OkResult.fail(`The element isn't document selector`, `Can not put element node`);
        }
        this._restSynchronizer = new RestSynchronizer(documentElement!, rest.dataToObjectNode);
        this._restDispatcherOperator = rest.dispatcher;
        return OkResult.ok();
    }

    /*********************************************************************
     * 
     * Operator's public methods
     * 
     *********************************************************************/

    public get exts(): Readonly<RestfulExtension>[] {
        return this._extensionOperator.exts;
    }

    public get extensionAmount(): number {
        return this._extensionOperator.extensionAmount;
    }

    /**
     * Registering a new extension in run-time.
     * If extension exists, then it throws error asking to use Put.
     * @param parentOrBigBro 
     * @param node 
     * @param options 
     * @returns 
     */
    public async addExtension(
        ext: RestfulExtension,
    ): Promise<OkResult> {
        if (this._restDispatcherOperator === undefined) {
            return OkResult.fail(`Please pass the rest dispatcher`, `call extensionOperator.setRestDispatcherOperator`);
        }

        const added = await this._extensionOperator.addExtension(ext);
        if (added.isFailure) {
            return OkResult.fail(`super.add(): ${added.errorTitle}`, added.errorDescription!);
        }

        if (ext.restHandler) {
            const added = await this._restDispatcherOperator.addExtension(ext.restHandler);
            if (added.isFailure) {
                return OkResult.fail(`restDispatcherOperator.create('${ext.restHandler.packageLink}'): ${added.errorTitle}`, added.errorDescription!);
            }
        }

        if (!this._restSynchronizer!.pendingKeys.has(ext.packageLink.url)) {
            // Very important line.
            // If it's given at the end, then when trying
            // to get the parent object node, it will
            // enter into an infinite cycle. get -> beforeAny -> get...
            this._restSynchronizer!.pendingKeys.add(ext.packageLink.url);
            const moduleElement = this._restSynchronizer!.objectToNodeTree!(this.getExtension(ext.packageLink.url)!, this._restSynchronizer!.rootNode!);
            this._restSynchronizer!.rootNode!.appendChild(moduleElement);
        }

        return OkResult.ok();
    }

    public getExtension(moduleURL: ModuleURL): RestfulExtension|undefined {
        return this._extensionOperator.getExtension(moduleURL);
    }

    public async updateExtension(
        ext: RestfulExtension
    ): Promise<OkResult> {
        const removed = await this.removeExtension([ext]);
        if (removed.isFailure) {
            return OkResult.fail(`delete('${ext.packageLink}'): ${removed.errorTitle}`, removed.errorDescription!);
        }
        const added = await this.addExtension(ext);
        if (added.isFailure) {
            return OkResult.fail(`delete('${ext.packageLink}'): ${added.errorTitle}`, added.errorDescription!);
        }

        return OkResult.ok();
    }

    public async removeExtension(
        exts: RestfulExtension[]
    ): Promise<OkResult> {
        if (this._restDispatcherOperator === undefined) {
            return OkResult.fail(`Please pass the rest dispatcher`, `call extensionOperator.setRestDispatcherOperator`);
        }
        for (const ext of exts) {
            // Remove the extension's rest dispatcher from rest
            if (ext.restHandler) {
                const removed = await this._restDispatcherOperator.removeExtension([ext.restHandler]);
                if (removed.isFailure) {
                    return OkResult.fail(`restDispatcherOperator.remove('${ext.restHandler.packageLink}'): ${removed.errorTitle}`, removed.errorDescription!);
                }
            }

            if (this._restSynchronizer!.pendingKeys.has(ext.packageLink.url)) {
                // Very important line.
                // If it's given at the end, then when trying
                // to get the parent object node, it will
                // enter into an infinite cycle. get -> beforeAny -> get...
                this._restSynchronizer!.pendingKeys.delete(ext.packageLink.url);
                const moduleElement = this._restSynchronizer!.objectToNodeTree!(this.getExtension(ext.packageLink.url)!, this._restSynchronizer!.rootNode!);
                this._restSynchronizer!.rootNode!.removeChild(moduleElement);
            }
        }

        const removed = await this._extensionOperator.removeExtension(exts);
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

        // Explicitly add pending keys, since rest already synchronized.
        // Because this function comes from the rest.
        this._restSynchronizer!.pendingKeys.add((ext! as unknown as RestfulExtension).packageLink.url)

        const added = await this.addExtension(ext! as unknown as RestfulExtension);
        if (added.isFailure) {
            const moduleURL = (ext! as unknown as RestfulExtension).packageLink.url;
            this._restSynchronizer!.pendingKeys.delete(moduleURL);
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

        return await this.updateExtension(data as unknown as RestfulExtension);
    }

    private async handleExtensionDeletion<DataType>(
        _selector: string, nodes: ObjectNode<DataType>[]
    ): Promise<OkResult> {
        const exts = nodes
            .filter(node => this._extDispatcher.isMatchingTag(node.selector))
            .map(node => node.data)
            .filter(el => el !== null)
            .map(el => el as unknown as Extendable)
            .filter(el => el.packageLink !== undefined);
        
        if (exts.length === 0) {
            return OkResult.ok();
        }
        const removed = await this.removeExtension(exts);
        if (removed.isFailure) {
            exts.forEach(ext => 
                this._restSynchronizer!.pendingKeys.add(ext.packageLink.url)
            );
        }
        return removed;
    }
}