import { expect, test } from "vitest";
import { ModulePartitioner } from "../src/module";
import cssSelect from "css-select"
import { AstroNodeAdapter, astroNodesToObjectNodes, AstroObjectNode } from "../src/astro-adapter";
import { Debug } from "@ara-web/p-hintjens";
import {NodeAdapter} from "../src/node-adapter";
import { JSDOM } from "jsdom";

var html = 
    "<main>" + 
        "<div></div>" + 
        "<div class=\"apple\"></div>" + 
        "<span class=\"pear potato\">" + 
            "<strong id=\"cheese-burger\">Hello</strong>, "+
            "<em>World!</em>" + 
        "</span>" + 
    "</main>";
const adapter = new AstroNodeAdapter()  // if it's ObjectAdapter, then returns wrong data
var nodeAdapter = new NodeAdapter()

function getBody(html: string): HTMLElement | null {
	return new JSDOM(html).window.document.querySelector("main");
}

function getParent(el: HTMLElement | ParentNode | null, tabs: string = '\t') {
    if (el === null) {
        Debug.log(`${tabs}Element is null`)
        return;
    }
    const parent1 = el.parentNode !== null && el.parentNode !== undefined;
    Debug.log(`${tabs}The ${el.nodeName} has parent? ${parent1}`)
    if (parent1) {
        getParent(el.parentNode, `${tabs}\t`);
    } else {
        Debug.log(el);
    }
}

function getAstroParent(el: AstroObjectNode | null, tabs: string = '\t') {
    if (el === null) {
        Debug.log(`${tabs}Element is null`)
        return;
    }
    const parent1 = el.parent !== null && el.parent !== undefined;
    Debug.log(`${tabs}The ${el.nodeName} has parent? ${parent1}`)
    if (parent1) {
        getAstroParent(el.parent as unknown as AstroObjectNode, `${tabs}\t`);
    } else {
        Debug.log(el);
    }
}

async function getAstroNodes(html: string): Promise<AstroObjectNode[]> {
    const {elements} = await ModulePartitioner.parseAstroSource(html);
    if (elements) {
        return astroNodesToObjectNodes(elements!); 
    }
    return [];
}

test(`Simply testing css-select with astro adapter`, async() => {
    const options = {adapter};
    const astroObjects = await getAstroNodes(html)

    let child = cssSelect("main > div", astroObjects, options);
    expect(child).toHaveLength(2);
})

test(`Simply testing css-select with node adapter`, async() => {
    const options = {adapter: nodeAdapter};
    const body = getBody(html)
    let child = cssSelect("main > div", [body!], options);
    expect(child).toHaveLength(2);
})
