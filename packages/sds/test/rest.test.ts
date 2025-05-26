import { expect, test } from "vitest";
import { ModuleLink, ObjectNode, DataToObjectNode, Rest, RestDispatcher, RestTraits, RestOptions, Proxy } from "../src/index.js";

import { JSDOM } from "jsdom";
import { NodeAdapter } from "./node-adapter.js"
import cssSelect from "css-select"
import { nodeToObjectTree } from "./node-object-tree.js";
import { Debug, OkResult } from "@ara-web/p-hintjens";

var footerHtml = "<footer><div></div><div class=\"apple\"></div><a href=\"example.com\">link</a><span class=\"pear potato\"><strong id=\"cheese-burger\">Hello</strong>, <em>World!</em></span></footer>";
var secondHtml = `<div id="secondDiv">Hello and welcome</div>`
var navBar1Html = `<a href="google.com" id="google-link">google</a>`;
var navBar2Html = `<a href="ara.foundation" id="ara-link">ara</a>`;
var navBar3Html = `<a href="github.com" id="github-link">github</a>`;
var pageHtml = `<header>Here is the navigation<ul><li>menu</li></ul></header><section id="footer-section">bottom links</section>`
var adapter = new NodeAdapter()

export class RestBranchProxy<ElementType> extends Proxy implements RestTraits<ElementType> {
    protected _behindData?: Rest<ElementType>;
    private _root: ObjectNode<ElementType>;

    constructor(root: ObjectNode<ElementType>, moduleLink: ModuleLink) {
        super(moduleLink, ["post", "getAll"]);
        this._root = root;
    }

    public get objectToNodeTree(): DataToObjectNode<ElementType> {
        // Return a dummy function to satisfy the type
        return ((element: ElementType, parent?: ObjectNode<ElementType>, isRoot?: boolean) => {
            throw new Error("objectToNodeTree is not implemented in RestBranchProxy.");
        }) as DataToObjectNode<ElementType>;
    }

    public setRootNode(obj: ObjectNode<ElementType>) {
        if (this._root === undefined) {
            return;
        }
        this._root.children.forEach(child => child.setParent(obj));
        this._root = obj;
    }

    public get rootNode(): ObjectNode<ElementType>|undefined {
        return this._root;
    }

    public putBehindData?(behindData: Rest<ElementType>): void {
        this._behindData = behindData;
        this._behindData.setRootNode(this._root);
    }

    public async getAll?(selector: string): Promise<ObjectNode<ElementType>[]> {
        return await this._behindData!.getAll!(`${selector}`);
    }

    public async post?(selector: string, data: ElementType, options: Omit<RestOptions<ElementType>, "parent">): Promise<OkResult> {
        return await this._behindData!.post!.bind(this._behindData, `${selector}`, data, options)();
    }

    public get dispatchers(): Readonly<RestDispatcher>[] {
        return this._behindData!.dispatchers;
    }
}


function getBody(html: string, root = 'body'): HTMLBodyElement | null {
    return new JSDOM(html).window.document.querySelector(root);
}

class HTMLRestHandlers {
    packageLink: ModuleLink;
    objects: Record<string, ObjectNode<HTMLElement>> = {};

    constructor(packageLink: ModuleLink) {
        this.packageLink = packageLink;
        this.objects = {};
    }

    async handlePost<DataType>(parentOrBigBro: ObjectNode<DataType>, node: ObjectNode<DataType>, _options?: { lilBro?: boolean | undefined; }): Promise<OkResult> {
        if (this.objects === undefined) {
            this.objects = {}
        }
        const selector = `${parentOrBigBro.selector} > ${node.selector}`
        if (this.objects[selector] !== undefined) {
            return OkResult.fail(`Already posted`, `Can not import again`);
        } else {
            this.objects[selector] = node as ObjectNode<HTMLElement>;
        }
        return { isSuccess: true, isFailure: false };
    }

    public get count(): number {
        return Object.keys(this.objects).length;
    }
}

test(`Testing the rest with simple operations`, async() => {
    // Build the extension
    const options = {adapter};
    const footer = getBody(footerHtml, 'footer');
    // get child
    let child = cssSelect("div", footer!, options);
    expect(child).toHaveLength(2);

    // Make sure it's parsing.
    // Add to the extensions the some modules
    // Make sure modules are the children of the element
    const rest = new Rest<HTMLElement>(footer!, nodeToObjectTree);
    const elems1 = await rest.getAll!('*');
    expect(elems1).toHaveLength(1);

    // Post the body
    const bodyPosted = await rest.post!('*', footer!, {});
    expect(bodyPosted.isSuccess).toBe(true);

    const sameChild = await rest.get!('footer > div');
    expect(sameChild !== null).toBe(true);
    expect(sameChild?.data === child[0]).toBe(true);

    const secondChild = await rest.get!('footer > div.apple');
    expect(secondChild !== null).toBe(true);
    expect(secondChild?.data === child[1]).toBe(true);

    // Get document
    const a = rest.get!('footer a');
    expect(a !== null).toBe(true);

    const burger = rest.get!('#cheese-burger');
    expect(burger !== null).toBe(true);

    // Add a new div
    const second = getBody(secondHtml, 'div');
    expect(second !== null).toBe(true);

    const secondPosted = await rest.post!('*', second!, {})
    expect(secondPosted.isSuccess).toBe(true);
    const secondFound = rest.get!('#secondDiv');
    expect(secondFound !== null).toBe(true);
})

test(`Testing the rest proxifying`, async() => {
    // Build the extension
    
    const options = {adapter};
    const footer = getBody(footerHtml, 'footer');
    let footerFirstDiv = cssSelect("div", footer!, options);
    expect(footerFirstDiv).toHaveLength(2);

    const pageBody = getBody(pageHtml, 'body');
    const pageRest = new Rest<HTMLElement>(pageBody!, nodeToObjectTree);
    const pageBodyPosted = await pageRest.post!('*', pageBody!, {});
    expect(pageBodyPosted.isSuccess).toBe(true);
    const contentBranch = await pageRest.get!('#footer-section');
    expect(contentBranch !== null).toBe(true);

    // Make sure it's parsing.
    // Add to the extensions the some modules
    // Make sure modules are the children of the element
    const proxy = new RestBranchProxy<HTMLElement>(contentBranch!, ModuleLink.newPackageURL('@ara-web', 'rest-branch-proxy'))
    const footerRestResult = new Rest<HTMLElement>(footer!, nodeToObjectTree, {proxies: [proxy], packageLink: ModuleLink.newPackageURL('@ara-web', 'rest-side')});
    const footerRest = footerRestResult.proxifyMe<RestBranchProxy<HTMLElement>>();
    expect(footerRest.isSuccess).toBe(true);

    // Post the body
    const footerPosted = await footerRest.getValue().post!('*', footer!, {});
    expect(footerPosted.isSuccess).toBe(true);

    // Add a data to footer from footerRest, it should be
    // fetchable from pageRest and footerRest
    const navBar1Body = getBody(navBar1Html, 'a');
    expect(navBar1Body !== null).toBe(true);
    const navBar1Posted = await footerRest.getValue().post!('*', navBar1Body!, {});
    expect(navBar1Posted.isSuccess).toBe(true);
    const navBar1Arr = await footerRest.getValue().getAll!('#google-link');
    expect(navBar1Arr).toHaveLength(1);
    const pageNavBar1Arr = await pageRest.getAll!("#google-link");
    expect(pageNavBar1Arr).toHaveLength(1);
    expect(pageNavBar1Arr[0]).toEqual(navBar1Arr[0]);

    // Add element from the parent
    const navBar2Body = getBody(navBar2Html, 'a');
    expect(navBar2Body !== null).toBe(true);
    const navBar2Posted = await pageRest.post!('footer', navBar2Body!, {});
    expect(navBar2Posted.isSuccess).toBe(true);
    const navBar2Arr = await footerRest.getValue().getAll!('#ara-link');
    expect(navBar2Arr).toHaveLength(1);
    const pageNavBar2Arr = await pageRest.getAll!("#ara-link");
    expect(pageNavBar2Arr).toHaveLength(1);
    expect(pageNavBar2Arr[0]).toEqual(navBar2Arr[0]);
    
    // Add after the first child
    const navBar3Body = getBody(navBar3Html, 'a');
    expect(navBar3Body !== null).toBe(true);
    const navBar3Posted = await pageRest.post!('footer > a:last-child', navBar3Body!, {lilBro: true});
    expect(navBar3Posted.isSuccess).toBe(true);
    const navBar3Arr = await footerRest.getValue().getAll!('#github-link');
    expect(navBar3Arr).toHaveLength(1);
    const pageNavBar3Arr = await pageRest.getAll!("#github-link");
    expect(pageNavBar3Arr).toHaveLength(1);
    expect(pageNavBar3Arr[0]).toEqual(navBar3Arr[0]);
})

test(`Testing the rest branching without proxifying`, async() => {
    const footer = getBody(footerHtml, 'footer');

    const pageBody = getBody(pageHtml, 'body');
    const pageRest = new Rest<HTMLElement>(pageBody!, nodeToObjectTree);
    const pageBodyPosted = await pageRest.post!('*', pageBody!, {});
    expect(pageBodyPosted.isSuccess).toBe(true);
    const contentBranch = await pageRest.get!('#footer-section');
    expect(contentBranch !== null).toBe(true);

    // Make sure it's parsing.
    // Add to the extensions the some modules
    // Make sure modules are the children of the element
    const footerPkgLink = ModuleLink.newPackageURL('@ara-web', 'footer-pkg-link');
    const sampleHandler = new HTMLRestHandlers(footerPkgLink);
    const sampleDispatcher = new RestDispatcher(footerPkgLink, "a");
    sampleDispatcher.posting = sampleHandler.handlePost!;
    const footerRestOptions = {
        packageLink: footerPkgLink, 
        extensions: [sampleDispatcher]
    };
    const footerRest = new Rest<HTMLElement>(footer!, nodeToObjectTree, footerRestOptions);
    footerRest.setRootNode(contentBranch!)

    // Post the body
    const footerPosted = await footerRest.post!('*', footer!, {});
    expect(footerPosted.isSuccess).toBe(true);

    // Add a data to footer from footerRest, it should be
    // fetchable from pageRest and footerRest
    const navBar1Body = getBody(navBar1Html, 'a');
    expect(navBar1Body !== null).toBe(true);
    const navBar1Posted = await footerRest.post!('*', navBar1Body!, {});
    expect(navBar1Posted.isSuccess).toBe(true);
    const navBar1Arr = await footerRest.getAll!('#google-link');
    expect(navBar1Arr).toHaveLength(1);
    const pageNavBar1Arr = await pageRest.getAll!("#google-link");
    expect(pageNavBar1Arr).toHaveLength(1);
    expect(pageNavBar1Arr[0]).toEqual(navBar1Arr[0]);

    // Add element from the parent
    const navBar2Body = getBody(navBar2Html, 'a');
    expect(navBar2Body !== null).toBe(true);
    const navBar2Posted = await pageRest.post!('footer', navBar2Body!, {});
    expect(navBar2Posted.isSuccess).toBe(true);
    const navBar2Arr = await footerRest.getAll!('#ara-link');
    expect(navBar2Arr).toHaveLength(1);
    const pageNavBar2Arr = await pageRest.getAll!("#ara-link");
    expect(pageNavBar2Arr).toHaveLength(1);
    expect(pageNavBar2Arr[0]).toEqual(navBar2Arr[0]);
    
    // Add after the first child
    const navBar3Body = getBody(navBar3Html, 'a');
    expect(navBar3Body !== null).toBe(true);
    const navBar3Posted = await pageRest.post!('footer > a:last-child', navBar3Body!, {lilBro: true});
    expect(navBar3Posted.isSuccess).toBe(true);
    const navBar3Arr = await footerRest.getAll!('#github-link');
    expect(navBar3Arr).toHaveLength(1);
    const pageNavBar3Arr = await pageRest.getAll!("#github-link");
    expect(pageNavBar3Arr).toHaveLength(1);
    expect(pageNavBar3Arr[0]).toEqual(navBar3Arr[0]);
})

test(`Testing the forwarding SDS Extension receiver from rest`, async() => {
    const footer = getBody(footerHtml, 'footer');

    const pageBody = getBody(pageHtml, 'body');
    const pageNode = nodeToObjectTree(pageBody!, undefined, true);
    const footerNode = nodeToObjectTree(footer!, pageNode, false);
    let navBar1Body = getBody(navBar1Html, 'a');
    navBar1Body = Object.assign(navBar1Body!, {packageLink: ModuleLink.newPackageURL('ara-web', 'nav-bar-1')});
    const navBar1Node = nodeToObjectTree(navBar1Body!, pageNode, false);
    const sdsExtReceiver = new HTMLRestHandlers(ModuleLink.newPackageURL(`@ara-web`, `sds-ext-receiver`));
    expect((await sdsExtReceiver.handlePost(
        footerNode!,
        navBar1Node!,
    )).isSuccess).toBe(true);
    expect(sdsExtReceiver.count).toBe(1);
    
    const posted = await sdsExtReceiver.handlePost(
        pageNode!,
        navBar1Node!,
    );
    expect(posted.isSuccess).toBe(true);
    expect(sdsExtReceiver.count).toBe(2);
    
    expect((await sdsExtReceiver.handlePost!(
        pageNode!,
        navBar1Node!,
    )).isFailure).toBe(true);
})