import { expect, test } from "vitest";
import { Debug, ModuleLink, ObjectLink } from "../src";

const moduleLink = ModuleLink.newFileURL("./test-app/src/components/Welcome.astro");

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