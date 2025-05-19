import { expect, test } from "vitest";
import { ModuleLink, ObjectNode, Rest, RestBranchProxy, RestOptions, SDSProxy } from "../src/index.js";
import { OkResult } from "@ara-web/p-hintjens";

import { JSDOM } from "jsdom";
import { NodeAdapter } from "./node-adapter"
import cssSelect from "css-select"
import { nodeToObjectTree } from "./node-object-tree.js";

var footerHtml = "<footer><div></div><div class=\"apple\"></div><a href=\"example.com\">link</a><span class=\"pear potato\"><strong id=\"cheese-burger\">Hello</strong>, <em>World!</em></span></footer>";
var secondHtml = `<div id="secondDiv">Hello and welcome</div>`
var navBar1Html = `<a href="google.com" id="google-link">google</a>`;
var navBar2Html = `<a href="ara.foundation" id="ara-link">ara</a>`;
var navBar3Html = `<a href="github.com" id="github-link">github</a>`;
var pageHtml = `<header>Here is the navigation<ul><li>menu</li></ul></header><section id="footer-section">bottom links</section>`
var adapter = new NodeAdapter()

function getBody(html: string, root = 'body'): HTMLBodyElement | null {
    return new JSDOM(html).window.document.querySelector(root);
}

test(`Testing the rest with simple operations`, async() => {
    // Build the extension
    const options = {adapter};
    const footer = getBody(footerHtml, 'footer');
    // get child
    let child = cssSelect("div", footer!, options);
    expect(child).toHaveLength(2);

    // Make sure it's parsing.
    // Add to the extensions the some modules
    // Make sure modules are the children of the element
    const rest = new Rest<HTMLElement>(footer!, nodeToObjectTree);
    const elems1 = rest.getAll!('*');
    expect(elems1).toHaveLength(1);

    // Post the body
    const bodyPosted = rest.post!('*', footer!, {});
    expect(bodyPosted.isSuccess).toBe(true);

    const sameChild = rest.get!('footer > div');
    expect(sameChild !== null).toBe(true);
    expect(sameChild?.getElement() === child[0]).toBe(true);

    const secondChild = rest.get!('footer > div.apple');
    expect(secondChild !== null).toBe(true);
    expect(secondChild?.getElement() === child[1]).toBe(true);

    // Get document
    const a = rest.get!('footer a');
    expect(a !== null).toBe(true);

    const burger = rest.get!('#cheese-burger');
    expect(burger !== null).toBe(true);

    // Add a new div
    const second = getBody(secondHtml, 'div');
    expect(second !== null).toBe(true);

    const secondPosted = rest.post!('*', second!, {})
    expect(secondPosted.isSuccess).toBe(true);
    const secondFound = rest.get!('#secondDiv');
    expect(secondFound !== null).toBe(true);
})

test(`Testing the rest proxifying`, async() => {
    // Build the extension
    
    const options = {adapter};
    const footer = getBody(footerHtml, 'footer');
    let footerFirstDiv = cssSelect("footer > div", footer!, options);

    const pageBody = getBody(pageHtml, 'body');
    const pageRest = new Rest<HTMLElement>(pageBody!, nodeToObjectTree);
    const pageBodyPosted = pageRest.post!('*', pageBody!, {});
    expect(pageBodyPosted.isSuccess).toBe(true);
    const contentBranch = pageRest.get!('#footer-section');
    expect(contentBranch !== null).toBe(true);

    // Make sure it's parsing.
    // Add to the extensions the some modules
    // Make sure modules are the children of the element
    const proxy = new RestBranchProxy<HTMLElement>(contentBranch!, ModuleLink.newPackageURL('@ara-web', 'rest-branch-proxy'))
    const footerRestResult = new Rest<HTMLElement>(footer!, nodeToObjectTree, {proxies: [proxy], packageLink: ModuleLink.newPackageURL('@ara-web', 'rest-side')});
    const footerRest = footerRestResult.proxifyMe<RestBranchProxy<HTMLElement>>();
    expect(footerRest.isSuccess).toBe(true);

    // Post the body
    const footerPosted = footerRest.getValue().post!('*', footer!, {});
    expect(footerPosted.isSuccess).toBe(true);

    // Add a data to footer from footerRest, it should be
    // fetchable from pageRest and footerRest
    const navBar1Body = getBody(navBar1Html, 'a');
    expect(navBar1Body !== null).toBe(true);
    const navBar1Posted = footerRest.getValue().post!('*', navBar1Body!, {});
    expect(navBar1Posted.isSuccess).toBe(true);
    const navBar1Arr = footerRest.getValue().getAll!('#google-link');
    expect(navBar1Arr).toHaveLength(1);
    const pageNavBar1Arr = pageRest.getAll!("#google-link");
    expect(pageNavBar1Arr).toHaveLength(1);
    expect(pageNavBar1Arr[0]).toEqual(navBar1Arr[0]);

    // Add element from the parent
    const navBar2Body = getBody(navBar2Html, 'a');
    expect(navBar2Body !== null).toBe(true);
    const navBar2Posted = pageRest.post!('footer', navBar2Body!, {});
    expect(navBar2Posted.isSuccess).toBe(true);
    const navBar2Arr = footerRest.getValue().getAll!('#ara-link');
    expect(navBar2Arr).toHaveLength(1);
    const pageNavBar2Arr = pageRest.getAll!("#ara-link");
    expect(pageNavBar2Arr).toHaveLength(1);
    expect(pageNavBar2Arr[0]).toEqual(navBar2Arr[0]);
    
    // Add after the first child
    const navBar3Body = getBody(navBar3Html, 'a');
    expect(navBar3Body !== null).toBe(true);
    const navBar3Posted = pageRest.post!('footer > a:last-child', navBar3Body!, {lilBro: true});
    expect(navBar3Posted.isSuccess).toBe(true);
    const navBar3Arr = footerRest.getValue().getAll!('#github-link');
    expect(navBar3Arr).toHaveLength(1);
    const pageNavBar3Arr = pageRest.getAll!("#github-link");
    expect(pageNavBar3Arr).toHaveLength(1);
    expect(pageNavBar3Arr[0]).toEqual(navBar3Arr[0]);
})
