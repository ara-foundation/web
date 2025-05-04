import { Result } from "@ara-web/p-hintjens";
import { type AstroNode, type Attributes } from "../index.js";
import type { ModuleMemory } from "@ara-web/reflect";
import type { ProjectMemory } from "@ara-web/reflect";
export declare class AttributeLevel {
    static lintAttributes: (attributes: Attributes, moduleMemory: ModuleMemory<unknown>, projectMemory: ProjectMemory) => Promise<Result<Attributes>>;
    /**
     * Extracts and identifies attributes from an AstroNode.
     *
     * @param {AstroNode} node - The AstroNode containing attributes to process.
     * @returns {Result<Attributes>} A Result object containing the identified attributes
     * or an error if attribute identification fails.
     */
    static getNodeAttributes(node: AstroNode, name?: string): Result<Attributes>;
    /**
     * Find the page attribute's value of the component.
     * Expected to be called by `identifyComponent()`
     * @param {AttributeNode} attr expression in the attribute.
     * @param {string} kind - The expected kind of the attribute, for example `quoted` or `expression`.
     * @returns {Result<Attributes>} A Result object containing the identified attributes
     * or an error if attribute identification fails.
     * @throws {Error} If the attribute kind is not supported.
     * @throws {Error} If the attribute kind does not match the expected kind.
    */
    private static identifyAttributeNode;
}
