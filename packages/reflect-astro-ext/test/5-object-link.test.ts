import { expect, test } from "vitest";
import { ModulePartitioner } from "../src/module";
import cssSelect from "css-select"
import { astroToNodeTree } from "../src/astro-adapter";
import { CSSObjectAdapter, Debug, ObjectNode, Rest } from "@ara-web/p-hintjens";
import {NodeAdapter} from "../src/node-adapter";
import { JSDOM } from "jsdom";
import { AstroNode } from "../src";
import { AttributeNode } from "@astrojs/compiler/types";

var html = 
    "<main>" + 
        "<div></div>" + 
        "<div class=\"apple\"></div>" + 
        "<span class=\"pear potato\" dataLink=\"data exists\">" + 
            "<strong id=\"cheese-burger\">Hello</strong>, "+
            "<em>World!</em>" + 
        "</span>" + 
    "</main>";
var element = "<div class=\"banana\" id=\"fruit-id\"></div>"
const adapter = new CSSObjectAdapter<AstroNode>()
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

function getAstroParent(el: ObjectNode<AstroNode> | null, tabs: string = '\t') {
    if (el === null) {
        Debug.log(`${tabs}Element is null`)
        return;
    }
    const parent1 = el.parent !== null && el.parent !== undefined;
    Debug.log(`${tabs}The ${el.nodeName} has parent? ${parent1}`)
    if (parent1) {
        getAstroParent(el.parent as unknown as ObjectNode<AstroNode>, `${tabs}\t`);
    } else {
        Debug.log(el);
    }
}

async function getAstroNode(html: string): Promise<AstroNode|undefined> {
    const {elements} = await ModulePartitioner.parseAstroSource(html);
    if (elements) {
        return ({children: elements!} as AstroNode)
    }
    return undefined;
}

test(`Simply testing css-select with astro adapter`, async() => {
    const options = {adapter};
    const astroObject = await getAstroNode(html)

    let child = cssSelect("main > div", [astroToNodeTree(astroObject!, true)], options);
    expect(child).toHaveLength(2);
})

test(`Simply testing css-select with REST`, async() => {
    const astroObject = await getAstroNode(html)
    const rest = new Rest(astroObject!, astroToNodeTree);
    const child = rest.get!("main > div");
    expect(child !== null).toBe(true);

    const children = rest.getAll!("main > div");
    expect(children).toHaveLength(2)
    expect(children[0] === child).toBe(true);

    const lastChild = rest.get!("main > div:last-of-type")
    expect(lastChild !== null).toBe(true);
    expect(children[1] === lastChild).toBe(true);
    expect(lastChild?.children).toHaveLength(0);

    // Posting
    const bananaAstNode = (await getAstroNode(element))!.children[0];
    const bananaObject = astroToNodeTree(bananaAstNode, false);
    // First simply putting as the element in the main > div last of type
    const posted = rest.post!("main > div:last-of-type", bananaObject);
    expect(posted.isSuccess).toBe(true);
    const foundBanana = rest.get!("main > div:last-of-type > div.banana");
    expect(foundBanana !== null).toBe(true);
    expect(bananaObject == foundBanana).toBe(true);
    const childrenAfterUpdate = rest.getAll!("main > div");
    expect(childrenAfterUpdate).toHaveLength(2)
    
    // Posting as the sibling
    const bananaSiblingAstNode = (await getAstroNode(element))!.children[0];
    const bananaSiblingObject = astroToNodeTree(bananaSiblingAstNode, false);
    const lilBroPosted = rest.post!("main > div:last-of-type", bananaSiblingObject, {lilBro: true})
    expect(lilBroPosted.isSuccess).toBe(true);

    const childrenIncludingBanana = rest.getAll!("main > div");
    expect(childrenIncludingBanana).toHaveLength(3)
    expect(childrenIncludingBanana[0] === child).toBe(true);
    expect(childrenIncludingBanana[1] === lastChild).toBe(true);
    expect(childrenIncludingBanana[2] === bananaSiblingObject).toBe(true);

    const bananaSibling = rest.get!("main > div:last-of-type");
    expect(bananaSibling === bananaSiblingObject).toBe(true);

    // Put
    const spanElement = rest.get!('main > span');
    expect(spanElement !== null).toBe(true);
    expect(spanElement?.selector).toEqual("#document > main > span.pear.potato")
    const bananaToReplace = rest.get!('main > div:nth-child(3)');
    expect(bananaToReplace !== null).toBe(true);
    expect(bananaToReplace?.selector).toEqual("#document > main > div.banana#fruit-id")

    const bananaReplaced = rest.put!('main > div:nth-child(3)', spanElement!);
    expect(bananaReplaced.isSuccess).toBe(true);
    const removedBanana = rest.get!('main > div:nth-child(3)');
    expect(removedBanana === null).toBe(true);
    const spans = rest.getAll!('main > span');
    expect(spans).toHaveLength(2);
    expect(spans[0] === spanElement).toBe(true);
    expect(spans[1] === spanElement).toBe(true);

    // Patch
    const attrNonExist = rest.get!("main > span[astoNodeBuffer]");
    expect(attrNonExist === null).toBe(true)
    const secondSpan = rest.get!("main > span");
    expect(secondSpan !== null).toBe(true);
    const patched = rest.patch!<AttributeNode>("main > span[astoNodeBuffer]", {name: 'astoNodeBuffer', value: 'hello and welcome'} as AttributeNode)
    expect(patched.isSuccess).toBe(true);
    const attrPosted = rest.get!("main > span[astoNodeBuffer]");
    expect(attrPosted !== null).toBe(true);
    expect(attrPosted?.getAttribute("astoNodeBuffer")).toEqual("hello and welcome")
    expect(attrPosted?.getAttribute("dataLink")).toEqual("data exists")

    // Delete
    const spansToDelete = rest.getAll!("main > span");
    expect(spansToDelete).toHaveLength(2);
    const mainChildren = rest.getAll!("main > ");
    expect(mainChildren).toHaveLength(4);
    const deleted = rest.delete!("main > span");
    expect(deleted.isSuccess).toBe(true);
    const deletedSpans = rest.getAll!("main > span");
    expect(deletedSpans).toHaveLength(0);
    const mainChildrenWithoutSpans = rest.getAll!("main >");
    expect(mainChildrenWithoutSpans).toHaveLength(2);
})


test(`Simply testing css-select with node adapter`, async() => {
    const options = {adapter: nodeAdapter};
    const body = getBody(html)
    let child = cssSelect("main > div", [body!], options);
    expect(child).toHaveLength(2);

    let childWithAttr = cssSelect(`main > span[dataLink]`, [body!], options);
    expect(childWithAttr).toHaveLength(1);
})
