import { expect, test } from "vitest";
import { JSDOM } from "jsdom";
import { NodeAdapter } from "./node-adapter"
import cssSelect from "css-select"
import { LinkTraits, ModuleLink, ObjectLink } from "../src";
import { Debug } from "@ara-web/p-hintjens";

const moduleLink = ModuleLink.newFileLink("./test-app/src/components/Welcome.astro");
var html = "<main><div></div><div class=\"apple\"></div><a href=\"example.com\">link</a><span class=\"pear potato\"><strong id=\"cheese-burger\">Hello</strong>, <em>World!</em></span></main>";
var adapter = new NodeAdapter()

function getBody(html: string): HTMLBodyElement | null {
	return new JSDOM(html).window.document.querySelector("body");
}

/*********************************************************
 * 
 * Object Links
 * 
 *********************************************************/

test('Simply creating an empty object', async () => {
    const emptyObjectLink = new ObjectLink(moduleLink);
    expect(emptyObjectLink.enumared).toBe(0);
    expect(emptyObjectLink.selector).toBe("*");
    expect(emptyObjectLink.moduleLink).toBe(moduleLink);
    expect(emptyObjectLink.resourceLink).toBeUndefined();
    expect(emptyObjectLink.getId()).toBeUndefined();
    expect(emptyObjectLink.toString().startsWith("obj://*?module-link=")).toBe(true);
    expect(emptyObjectLink.toString().endsWith("/test-app/src/components/Welcome.astro")).toBe(true);
});

test('Simply creating an enumareted and tagged', async () => {
    const emptyObjectLink = new ObjectLink(moduleLink);
    const child1 = emptyObjectLink.getEnumuratedChild("text");
    const child1_1 = child1.getTaggedChild("astro","Welcome");
    const child1_2 = child1.getTaggedChild("astro","Layout");
    const child2 = emptyObjectLink.getEnumuratedChild("text");
    expect(emptyObjectLink.enumared).toBe(2);

    expect(child1.enumared).toBe(0);
    expect(child1.getTag()).toBe("text");
    expect(child1.getId()).toBe(0);
    expect(child1.toString().startsWith("obj://text:nth-child(0)?module-link")).toBe(true);

    expect(child1_1.getTag()).toBe("astro");
    expect(child1_1.getId()).toBe("Welcome");
    expect(child1_1.toString().startsWith("obj://text:nth-child(0)>astro#Welcome?module-link")).toBe(true);

    expect(child1_2.getTag()).toBe("astro");
    expect(child1_2.getId()).toBe("Layout");
    expect(child1_2.toString().startsWith("obj://text:nth-child(0)>astro#Layout?module-link")).toBe(true);

    expect(child2.getTag()).toBe("text");
    expect(child2.getId()).toBe(1);
    expect(child2.toString().startsWith("obj://text:nth-child(1)?module-link")).toBe(true);

});

/*********************************************************
 * 
 * Adapters
 * 
 *********************************************************/

test('Simply the node-adapter testing', async () => {
    var body = getBody(html);
    expect(adapter.isTag(body as Node)).toBe(true);

    // Exists one
    var divs = body!.querySelectorAll("div");
    var arr = Array.from(divs);

    var hasDiv = adapter.existsOne((node: HTMLElement) => {
		return node.classList.contains("apple");
	}, arr);

    expect(hasDiv !== null).toBe(true)
})

test(`Simply testing css-select with adapter`, async() => {
    const options = {adapter};
    const body = getBody(html)
    // get child
    let child = cssSelect("main > div", [body!], options);
    expect(child).toHaveLength(2);
});

/*********************************************************
 * 
 * Testing CSS Select
 * 
 *********************************************************/

test(`Test fetching css selector by classes`, async() => {
    const options = {adapter};
    const body = getBody(html)

    let pears = cssSelect("main .pear", [body!], options);
    expect(pears).toHaveLength(1);
    let potatoes = cssSelect("main .potato", [body!], options);
    expect(potatoes).toHaveLength(1);

    expect(potatoes[0].isEqualNode(pears[0])).toBe(true);
    expect(potatoes[0].nodeName).toBe("SPAN");
})

test(`Test fetching css selector id`, async() => {
    const options = {adapter};
    const body = getBody(html)

    let burgers = cssSelect("main #cheese-burger", [body!], options);
    expect(burgers).toHaveLength(1);
})

test(`Test fetching css selector by attribute`, async() => {
    const options = {adapter};
    const body = getBody(html)
    let links = cssSelect("main [href]", [body!], options);
    expect(links).toHaveLength(1);
    let exactLinks = cssSelect("main [href=\"example.com\"]", [body!], options);
    expect(exactLinks).toHaveLength(1);
    let notExactLinks = cssSelect("main [href=\"no-website\"]", [body!], options);
    expect(notExactLinks).toHaveLength(0);
    let divs3 = cssSelect("main [class=\"pear potato\"]", [body!], options);
    expect(divs3).toHaveLength(1);
})

/*********************************************************
 * 
 * Testing the LintTraits
 * 
 *********************************************************/

test(`Test Selector Parser of LintTraits`, async() => {
    const query1 = `main > div:nth-child`;
    const queryForTag = `main > div#hey`;
    expect(LinkTraits.getTagName(queryForTag)).toEqual('div');

    const query2 = `main > div:nth-child(2) > div[data-link]`
    // const selectors2 = LinkTraits.parseSelector(query2);
    expect(LinkTraits.isAttributeSelector(query1)).toBe(false);
    expect(LinkTraits.isAttributeSelector(query2)).toBe(true);
    expect(LinkTraits.getAttributeName(query2)).toEqual('data-link');
    const trimmedAttr = LinkTraits.trimAttribute(query2);
    expect(trimmedAttr).toEqual(`main > div:nth-child(2) > div`)
})
