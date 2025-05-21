import { expect, test } from "vitest";
import { ModulePartitioner } from "../src/module";
import cssSelect from "css-select"
import { astroToNodeTree } from "../src/astro-adapter";
import { Debug } from "@ara-web/p-hintjens";
import { CSSObjectAdapter, ObjectNode, Rest } from "@ara-web/sds";
import {NodeAdapter} from "../src/node-adapter";
import { JSDOM } from "jsdom";
import { AstroNode, CodeLevel, FileExtension, ModuleCategory, Page, PageLevel } from "../src";
import { AttributeNode } from "@astrojs/compiler/types";
import { getImportRecords, getNewAstroReflect, getNewProjectMemory } from "./shared";
import { ModuleMemory } from "@ara-web/reflect";

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
    const astroNodes = [astroToNodeTree(astroObject!, undefined, true)];
    let child = cssSelect("main > div", astroNodes, options);
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
    // First simply putting as the element in the main > div last of type
    const posted = rest.post!("main > div:last-of-type", bananaAstNode);
    expect(posted.isSuccess).toBe(true);
    
    const foundBanana = rest.get!("main > div:last-of-type > div.banana");
    expect(foundBanana !== null).toBe(true);
    const childrenAfterUpdate = rest.getAll!("main > div");
    expect(childrenAfterUpdate).toHaveLength(2)
    
    // Posting as the sibling
    const bananaSiblingAstNode = (await getAstroNode(element))!.children[0];
    const lilBroPosted = rest.post!("main > div:last-of-type", bananaSiblingAstNode, {lilBro: true})
    expect(lilBroPosted.isSuccess).toBe(true);

    const childrenIncludingBanana = rest.getAll!("main > div");
    expect(childrenIncludingBanana).toHaveLength(3)
    expect(childrenIncludingBanana[0] === child).toBe(true);
    expect(childrenIncludingBanana[1] === lastChild).toBe(true);

    const bananaSibling = rest.get!("main > div:last-of-type");
    expect(bananaSibling !== null).toBe(true);

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

test(`Page's Rest operations work`, async () => {
    const modules = getImportRecords()
      
    const reflectExtension = await getNewAstroReflect();
    const validated = await reflectExtension.putModules(modules);
    expect(validated.isSuccess).toBe(true);
    // Make sure they are all no content moduled
    const projectMemory = getNewProjectMemory(reflectExtension);
    
    const moduleMemories = projectMemory.getModules();
    expect(Object.keys(moduleMemories).length).toBeGreaterThan(0);
    for (let moduleMemory of moduleMemories) {
        if (!([
                ModuleCategory.Component, 
                ModuleCategory.Layout,
                ModuleCategory.Page
            ].includes(moduleMemory.moduleCategory as ModuleCategory))) {
            continue;
        }
        const moduleParts = await ModulePartitioner.partition(moduleMemory);
        expect(moduleParts.isSuccess).toBe(true);
    
        if (moduleParts.getValue().fileExtension !== FileExtension.Astro) {
            continue;
        } 
        // Only Component
        if (moduleMemory.moduleCategory !== ModuleCategory.Component) {
            continue;
        }
        
        if (moduleMemory.moduleLink.toFilePath.indexOf("Welcome") === -1) {
            continue;
        }

        const identifiedSourceCode = await CodeLevel.identifySourceCode<Page>(moduleParts.getValue().source, moduleMemory as ModuleMemory<Page>, projectMemory);
        expect(identifiedSourceCode.isSuccess).toBe(true);
        // Test by using ObjectLinkSelector.
        // Uncomment to see the object links.
        const page = await PageLevel.identify<Page>(moduleParts.getValue(), identifiedSourceCode.getValue(), projectMemory);
        expect(page.isSuccess).toBe(true);
        const pageRest = PageLevel.rest(page.getValue());
        
        const query1 = pageRest.get!('#container')
        expect(query1 !== null).toBe(true)

        const query2 = pageRest.getAll!('[id="container"]')
        expect(query2).toHaveLength(1)

        const query4 = pageRest.getAll!('.htme#container> img[src]')
        expect(query4).toHaveLength(1)
        expect(query4[0].getAttribute("src")).toBeDefined();

        const query5 = pageRest.getAll!('.htme#container .astro')
        expect(query5).toHaveLength(1)

        const query6 = pageRest.getAll!('a.htme')
        expect(query6).toHaveLength(4)

        const query7 = pageRest.get!("#subcomponent")
        expect(query7 !== null).toBe(true)

        const query8 = pageRest.get!("#subcomponent[noAttr]")
        expect(query8 === null).toBe(true)

        const query9 = pageRest.get!("#subcomponent[text]")
        expect(query9 !== null).toBe(true)

        const query10 = pageRest.get!(".astro[text=\"hello-world\"]")
        expect(query10 !== null).toBe(true)
        expect(query10 === query9).toBe(true);

        // Manipulation
        const patched = pageRest.patch!<string>("#subcomponent[text]", "updated-value");
        expect(patched.isSuccess).toBe(true);
        const query11 = pageRest.get!(".astro[text]");
        expect(query11 !== null).toBe(true);
        expect(query11?.getAttribute("text")).toEqual("updated-value")
    }
})