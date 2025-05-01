/**
 * Testing the Reflect itself
 */
import { expect, test } from "vitest";
import { ReflectLink } from "../src/code-level/ReflectLink.js";
import { AraLink, Debug } from "@ara-web/ts-enhancement";

test('Link to identifier and expression', async () => {
    const id = "varName";
    const link = ReflectLink.linkToIdentifier(id);
    expect(link.resource).toEqual(id);
    const exp = "1 + 2\nasd";
    const expLink = ReflectLink.linkToExpression(exp, {identifier: id});
    expect(expLink.resource).toEqual(id);
    expect(ReflectLink.getResourceAsExpression(expLink)).toEqual(exp);
    expect(ReflectLink.isIdentifierLink(link)).toBe(true)
    expect(ReflectLink.isIdentifierLink(expLink)).toBe(false)
    expect(ReflectLink.isExpressionLink(link)).toBe(false)
    expect(ReflectLink.isExpressionLink(expLink)).toBe(true)

    const expModuleLink = expLink.toModuleLink()

    const expModuleReverted = AraLink.fromModuleLink(expModuleLink);
    expect(ReflectLink.isExpressionLink(expModuleReverted)).toBe(true)
});

