import { expect, test } from "vitest";
import { JSDOM } from "jsdom";
import { NodeAdapter } from "./node-adapter"
import cssSelect from "css-select"
import { Debug, ModuleLink, ObjectLink } from "../src";

const moduleLink = ModuleLink.newFileURL("./test-app/src/components/Welcome.astro");
var html = "<main><div></div><div class=\"apple\"></div><span class=\"pear potato\"><strong id=\"cheese-burger\">Hello</strong>, <em>World!</em></span></main>";
var adapter = new NodeAdapter()

function getBody(html: string): HTMLBodyElement | null {
	return new JSDOM(html).window.document.querySelector("body");
}

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

})

test('Simply the node-adapter testing', async () => {
    var body = getBody(html);
    expect(adapter.isTag(body as Node)).toBe(true);

    // Exists one
    var divs = body!.querySelectorAll("div");
    var arr = Array.from(divs);

    var hasDiv = adapter.existsOne((node: HTMLElement) => {
		return node.classList.contains("apple");
	}, arr);

    Debug.log(`Has Div?`)
    Debug.log(hasDiv)

    expect(hasDiv !== null).toBe(true)
})

test(`Simply testing css-select with adapter`, async() => {
    const options = {adapter};
    const body = getBody(html)
    // get child
    let child = cssSelect("main > div", [body!], options);
    expect(child).toHaveLength(2);
})
