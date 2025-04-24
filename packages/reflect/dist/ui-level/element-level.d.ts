import { Result } from "@ara-web/ts-enhancement";
import type { Page, IdentifiedComponent } from "@ara-web/ts-enhancement";
import { type UiContent } from "./ui-content.js";
import { type AstroNode } from "@ara-web/component-engine";
import type { ModuleMemory } from "../memory/ModuleMemory.js";
export declare const componentName: (component: AstroNode | IdentifiedComponent) => string;
/**
 * Identifies what kind of component and it's value.
 * @param element Node that we need to identify
 * @returns {IdentifiedComponent}
 */
export declare const identifyComponent: <T>(page: Page, uiContent: UiContent, memory: ModuleMemory<T>, element: AstroNode) => Promise<Result<IdentifiedComponent>>;
