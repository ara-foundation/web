import { Result } from "@ara-web/p-hintjens";
import { ModuleMemory, ProjectMemory } from "@ara-web/reflect";
import { ModuleCategory, ModuleLink, type AstroExtensionInterface, type Page } from "@ara-web/reflect-astro-ext";

type ComponentCategory = {
    name: string,
    slug: string,
    description: string
}

const elementCategory: ComponentCategory = {
    name: "WWW",
    slug: "html",
    description: `The basic web component that composes the Web Elements also known as HTML`,
}

const expressionCategory: ComponentCategory = {
    name: "Expression",
    slug: "",
    description: `The expression is the dynamic components inserted by Astro Framework`
}

const layoutCategory: ComponentCategory = {
    name: "Layout",
    slug: "layouts/",
    description: "Components that used to build nested components for pages"
}

const generalCategory: ComponentCategory = {
    name: "General",
    slug: "components/",
    description: "General or global components"
}

export const componentCategories: ComponentCategory[] = [{
    name: "Authentication",
    slug: "components/auth",
    description: "Authentication made by google and ZK, which require the components specific for this"
}, {
    name: "Content",
    slug: "components/content",
    description: "Content usually means the central part of the web pages, components specifically for page content"
}, {
    name: "Header",
    slug: "components/header",
    description: "The components such as Ara, Notification and Ara services links (navigation), used in Web Ara"
}, {
    name: "Lungta",
    slug: "components/lungta",
    description: "The Lungta components are specific for Web Navigation on the Left Side of the web pages, " +
        "besides lungta navigation, it also holds components for Lungta Gift"
}, {
    name: "components/Resource",
    slug: "components/resource",
    description: "Components designed to represent the resources as the medium betwen JSON-AD and Web UI, here holds the components that answer to show it in Ara Web's Resource page"
}, {
    name: "UI (User Interface)",
    slug: "components/ui",
    description: "UI elements"
}, 
    layoutCategory, elementCategory, expressionCategory
];

export class AstroAraWebExtension implements AstroExtensionInterface  {
    private _packageLink: ModuleLink

    constructor() {
        this._packageLink = ModuleLink.newPackageURL("@ara-web", "astro-ara-web-ext");
    }

    public get packageLink(): ModuleLink {
        return this._packageLink;
    }

    public get description(): string {
        return `Astro Reflection's extension that twists the reflection to work specifically with Ara Web`;
    }

    public async getDescriptionByModuleLink?(moduleLink: ModuleLink): Promise<string> {
        for (const category of componentCategories) {
            if (moduleLink.toFilePath.indexOf(category.slug) > -1) {
                return category.description;
            }
        }
        return generalCategory.description;
    }
    
    public async afterPageLvlIdenfication?(moduleCategory: string, module: ModuleMemory<Page>, _: ProjectMemory): Promise<Result<ModuleMemory<Page>>> {
        if (moduleCategory !== ModuleCategory.Component && moduleCategory !== ModuleCategory.Layout) {
            return Result.ok(module);
        }
        if (this.getDescriptionByModuleLink === undefined) {
            return Result.ok(module);
        }
        if (module.content === undefined) {
            return Result.ok(module);
        }
        const description = await this.getDescriptionByModuleLink(module.moduleLink);
        module.content!.description = description;
        return Result.ok(module);
    }
}