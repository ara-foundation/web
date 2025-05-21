/**
 * Testing the functions for the setup of the plugin into the website,
 * which means setting up shared modules.
 */

import { expect, test } from "vitest";
import { getImportRecords, getNewAstroReflect, getNewProjectMemory } from "./shared";
import { CodeLevel, Component, FileExtension, ModuleCategory, ModulePartitioner, Page, PageLevel, SlotElement } from "../src";
import { ModuleMemory } from "@ara-web/reflect";
import { LinkTraits, ObjectNodeInterface, ObjectNode, CSSObjectAdapter } from "@ara-web/sds";
import { pageToNodeTree } from "../src/page-level/page-css-object-tree";
import { Debug } from "@ara-web/p-hintjens";

test(`Make sure the that object links are correct`, async () => {
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
        const child = page.getValue().slots["default"][0] as Component;
        expect(child.link.getId()).toBe("container");
        for (let subChild of child.slots["default"]) {
            if (subChild.link.getId() === 'background') {
                const img = subChild as Component;
                expect(img.attributes["src"]).toBeDefined();
                break;
            }
        }
    }
})

test(`Make sure that slots are attributed`, async () => {
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
        if (moduleMemory.moduleCategory !== ModuleCategory.Page) {
            continue;
        }
        const identifiedSourceCode = await CodeLevel.identifySourceCode<Page>(moduleParts.getValue().source, moduleMemory as ModuleMemory<Page>, projectMemory);
        expect(identifiedSourceCode.isSuccess).toBe(true);
        // Test by using ObjectLinkSelector.
        // Uncomment to see the object links.
        const page = await PageLevel.identify<Page>(moduleParts.getValue(), identifiedSourceCode.getValue(), projectMemory);
        expect(page.isSuccess).toBe(true);
        const layout = page.getValue().slots["default"][0] as Component;
        const slotNames = Object.keys(layout.slots);
        expect(slotNames.length).toBe(3);
        
        expect(slotNames[0]).toBe("default");
        expect(slotNames[1]).toBe("content-left");
        expect(slotNames[2]).toBe("content-right");
        
        expect(layout.slots[slotNames[0]].length).toBeGreaterThan(0);
        expect(layout.slots[slotNames[1]].length).toBeGreaterThan(0);
        expect(layout.slots[slotNames[2]].length).toBeGreaterThan(0);
    }
})

test(`Make sure that object looking works and object linking components work`, async () => {
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
        if (moduleMemory.moduleCategory !== ModuleCategory.Page) {
            continue;
        }
        const identifiedSourceCode = await CodeLevel.identifySourceCode<Page>(moduleParts.getValue().source, moduleMemory as ModuleMemory<Page>, projectMemory);
        expect(identifiedSourceCode.isSuccess).toBe(true);
        // Test by using ObjectLinkSelector.
        // Uncomment to see the object links.
        const page = await PageLevel.identify<Page>(moduleParts.getValue(), identifiedSourceCode.getValue(), projectMemory);
        expect(page.isSuccess).toBe(true);
        const layout = page.getValue().slots["default"][0] as Component;
        const slotNames = Object.keys(layout.slots);
        expect(slotNames.length).toBe(3);
        
        expect(slotNames[0]).toBe("default");
        expect(slotNames[1]).toBe("content-left");
        expect(slotNames[2]).toBe("content-right");
        
        expect(layout.slots[slotNames[0]].length).toBeGreaterThan(0);
        const firstLayoutElement = layout.slots[slotNames[0]][0];
        // The selector of first element in the 'layout':
        // > Layout.astro>Welcome.astro
        // Test as returning Welcome:
        // Layout Welcome
        // Layout > Welcome
        // Layout > *
        // Layout > .astro
        // .astro > Welcome
        // .astro > .Welcome
        // const pageNodes = PageLevel.getPageObjectNodes(page.getValue());
        const pageObjectNodes = [pageToNodeTree({slots: page.getValue().slots} as SlotElement, undefined, true)];
        const query1 = LinkTraits.get<ObjectNodeInterface, ObjectNode<SlotElement>>('Layout', pageObjectNodes,
            {adapter: new CSSObjectAdapter<SlotElement>()}
        )
        expect(query1 !== null).toBe(true)

        const query2 = LinkTraits.get<ObjectNodeInterface, ObjectNode<SlotElement>>('Layout Welcome', pageObjectNodes,
            {adapter: new CSSObjectAdapter<SlotElement>()}
        )
        expect(query2 !== null).toBe(true)

        
        const query3 = LinkTraits.get<ObjectNodeInterface, ObjectNode<SlotElement>>('Layout > Welcome', pageObjectNodes,
            {adapter: new CSSObjectAdapter<SlotElement>()}
        )
        expect(query3 !== null).toBe(true)

        const query4 = LinkTraits.getAll<ObjectNodeInterface, ObjectNode<SlotElement>>('Layout li', pageObjectNodes,
            {adapter: new CSSObjectAdapter<SlotElement>()}
        )
        expect(query4).toHaveLength(4)

        const query5 = LinkTraits.get<ObjectNodeInterface, ObjectNode<SlotElement>>('Layout li:first-child', pageObjectNodes,
            {adapter: new CSSObjectAdapter<SlotElement>()}
        )
        expect(query5 === query4[0]).toBe(true)

        const query6 = LinkTraits.get<ObjectNodeInterface, ObjectNode<SlotElement>>('Layout > p > code', pageObjectNodes,
            {adapter: new CSSObjectAdapter<SlotElement>()}
        )
        expect(query6 !== null).toBe(true)
    }
})

test(`Linking page components by the classes`, async () => {
    const options = {adapter: new CSSObjectAdapter<SlotElement>()}
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
        if (moduleMemory.moduleCategory !== ModuleCategory.Page) {
            continue;
        }
        const identifiedSourceCode = await CodeLevel.identifySourceCode<Page>(moduleParts.getValue().source, moduleMemory as ModuleMemory<Page>, projectMemory);
        expect(identifiedSourceCode.isSuccess).toBe(true);
        // Test by using ObjectLinkSelector.
        // Uncomment to see the object links.
        const page = await PageLevel.identify<Page>(moduleParts.getValue(), identifiedSourceCode.getValue(), projectMemory);
        expect(page.isSuccess).toBe(true);
        const layout = page.getValue().slots["default"][0] as Component;
        const slotNames = Object.keys(layout.slots);
        expect(slotNames.length).toBe(3);
        
        expect(layout.slots[slotNames[0]].length).toBeGreaterThan(0);
        const firstLayoutElement = layout.slots[slotNames[0]][0];

        const pageObjectNodes = [pageToNodeTree({slots: page.getValue().slots} as SlotElement, undefined, true)];
        const query1 = LinkTraits.get<ObjectNodeInterface, ObjectNode<SlotElement>>('Layout.astro', pageObjectNodes, options)
        expect(query1 !== null).toBe(true)

        const query2 = LinkTraits.getAll<ObjectNodeInterface, ObjectNode<SlotElement>>('.astro', pageObjectNodes, options)
        expect(query2).toHaveLength(2)

        const query3 = LinkTraits.getAll<ObjectNodeInterface, ObjectNode<SlotElement>>('.astro > ul > li', pageObjectNodes, options)
        expect(query3).toHaveLength(4)
    }
})

test(`Linking page components by the attributes and id`, async () => {
    const options = {adapter: new CSSObjectAdapter<SlotElement>()}
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
        const layout = page.getValue().slots["default"][0] as Component;
        
        const pageObjectNodes = [pageToNodeTree({slots: page.getValue().slots} as SlotElement, undefined, true)];
        const query1 = LinkTraits.get<ObjectNodeInterface, ObjectNode<SlotElement>>('#container', pageObjectNodes, options)
        expect(query1 !== null).toBe(true)

        const query2 = LinkTraits.getAll<ObjectNodeInterface, ObjectNode<SlotElement>>('[id="container"]', pageObjectNodes, options)
        expect(query2).toHaveLength(1)

        const query4 = LinkTraits.getAll<ObjectNodeInterface, ObjectNode<SlotElement>>('.htme#container> img[src]', pageObjectNodes, options)
        expect(query4).toHaveLength(1)
        expect(query4[0].getAttribute("src")).toBeDefined();

        const query5 = LinkTraits.getAll<ObjectNodeInterface, ObjectNode<SlotElement>>('.htme#container .astro', pageObjectNodes, options)
        expect(query5).toHaveLength(1)

        const query6 = LinkTraits.getAll<ObjectNodeInterface, ObjectNode<SlotElement>>('a.htme', pageObjectNodes, options)
        expect(query6).toHaveLength(4)

        const query7 = LinkTraits.get<ObjectNodeInterface, ObjectNode<SlotElement>>("#subcomponent", pageObjectNodes, options)
        expect(query7 !== null).toBe(true)

        const query8 = LinkTraits.get<ObjectNodeInterface, ObjectNode<SlotElement>>("#subcomponent[noAttr]", pageObjectNodes, options)
        expect(query8 === null).toBe(true)

        const query9 = LinkTraits.get<ObjectNodeInterface, ObjectNode<SlotElement>>("#subcomponent[text]", pageObjectNodes, options)
        expect(query9 !== null).toBe(true)

        const query10 = LinkTraits.get<ObjectNodeInterface, ObjectNode<SlotElement>>(".astro[text=\"hello-world\"]", pageObjectNodes, options)
        expect(query10 !== null).toBe(true)
        expect(query10 === query9).toBe(true);
    }
})