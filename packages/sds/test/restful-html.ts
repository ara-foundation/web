import { ModuleLink, ObjectNode, SubRestfulHandler, RestfulHandler, LinkTraits, DataToObjectNode, DOCUMENT_SELECTOR, DataOperations, RestHandler } from "../src/index.js";
import { JSDOM } from "jsdom";
import { OkResult } from "@ara-web/p-hintjens";
import { elementOps } from "./node-object-tree.js";

export type RestfulHtml = HTMLElement | Navigation;

export const restfulHtmlToObjectNode: DataToObjectNode<RestfulHtml> = (data?: RestfulHtml, parent?: ObjectNode<RestfulHtml>): ObjectNode<RestfulHtml> => {
    if (data instanceof Navigation) {
        return new ObjectNode<RestfulHtml>(navOps, restfulHtmlToObjectNode, data, parent);
    }
    return new ObjectNode<RestfulHtml>(elementOps, restfulHtmlToObjectNode, data, parent);
}

const getNavigationName = (nav?: RestfulHtml): string => {
    return elementOps.getName(nav instanceof Navigation ? nav.element : nav);
}

const getNavigationChildren = (nav: RestfulHtml): RestfulHtml[] => {
    return elementOps.getChildren(nav instanceof Navigation ? nav.element : nav);
}

const getNavAttribute = (nav: Navigation | undefined, attrName: string): string | undefined => {
    return elementOps.getAttribute(nav instanceof Navigation ? nav.element : nav, attrName);
}

const setNavAttribute = <AttrType>(nav: RestfulHtml, attrName: string, attrValue: AttrType): OkResult => {
    return elementOps.setAttribute(nav instanceof Navigation ? nav.element : nav, attrName, attrValue);
}

export const navOps: DataOperations<RestfulHtml> = {
    getName: getNavigationName,
    getChildren: getNavigationChildren,
    getAttribute: getNavAttribute,
    setAttribute: setNavAttribute,
}

export class Navigation implements SubRestfulHandler {
    restHandler: RestHandler;
    element: HTMLElement;

    constructor(navHtml: string) {
        this.element = htmlToDom(navHtml, 'a')!;
        const id = crypto.randomUUID();
        const moduleLink = ModuleLink.newPackageLink('@ara-web', 'sds', 'navigation', {salt: id})
        this.restHandler = new RestHandler(moduleLink, 'a');
        this.restHandler.handlePatch = this.handlePatch.bind(this);
    }

    async handlePatch<DataType, AttrType>(selector: string, _: ObjectNode<DataType>, attrValue: AttrType): Promise<OkResult> {
        if (!this.restHandler.isMatchingTag(selector)) {
            return OkResult.ok();
        }
        this.element.setAttribute(LinkTraits.getAttributeName(selector)!, "example.com");
        
        return OkResult.ok();
    }
}

export function htmlToDom(html: string, root = 'body'): HTMLBodyElement | null {
    return new JSDOM(html).window.document.querySelector(root);
}

export class HTMLRestHandler implements RestfulHandler {
    packageLink: ModuleLink;
    objects: Record<string, ObjectNode<HTMLElement>> = {};

    readonly tag: string;
    isMatchingTag(selector: string): boolean {
        if (this.tag === '*') {
            return true;
        }
        return LinkTraits.getTagName(selector) === this.tag;
    }

    constructor(packageLink: ModuleLink, tag: string = '*') {
        this.packageLink = packageLink;
        this.objects = {};
        this.tag = tag;
    }

    async handlePost<DataType>(parent: ObjectNode<DataType>, node: ObjectNode<DataType>): Promise<OkResult> {
        if (this.objects === undefined) {
            this.objects = {}
        }
        const selector = `${parent.selector} > ${node.selector}`
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
