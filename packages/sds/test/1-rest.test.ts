import { expect, test } from "vitest";
import { ModuleLink, Rest, RestHandler } from "../src/index.js";
import { NodeAdapter } from "./node-adapter.js"
import cssSelect from "css-select"
import { nodeToObjectTree } from "./node-object-tree.js";
import { HTMLRestHandler, htmlToDom, Navigation, RestfulHtml, restfulHtmlToObjectNode } from "./restful-html.js";
import { RestBranchProxy } from "./rest-branch-proxy.js";
import { Debug } from "@ara-web/p-hintjens";

var footerHtml = `
<footer>
    <div></div>
    <div class=\"apple\"></div>
    <a href=\"example.com\">link</a>
    <span class=\"pear potato\">
        <strong id=\"cheese-burger\">Hello</strong>, 
        <em>World!</em></span></footer>`;
var secondHtml = `<div id="secondDiv">Hello and welcome</div>`
var navBar1Html = `<a href="google.com" id="google-link">google</a>`;
var navBar2Html = `<a href="ara.foundation" id="ara-link">ara</a>`;
var navBar3Html = `<a href="github.com" id="github-link">github</a>`;
var pageHtml = `<header>Here is the navigation<ul><li>menu</li></ul></header><section id="footer-section">bottom links</section>`
var adapter = new NodeAdapter()

test(`Testing the rest with simple operations`, async() => {
    // Build the extension
    const options = {adapter};
    const footer = htmlToDom(footerHtml, 'footer');
    // get child
    let child = cssSelect("div", footer!, options);
    expect(child).toHaveLength(2);
    // Make sure it's parsing.
    // Add to the extensions the some modules
    // Make sure modules are the children of the element
    const rest = new Rest<HTMLElement>(nodeToObjectTree);
    const elems1 = await rest.getAll!('*');
    expect(elems1.length).toBe(1);

    // Post the body
    const bodyPosted = await rest.post!('*', footer!);
    expect(bodyPosted.isSuccess).toBe(true);
    const elems2 = await rest.getAll!('*');
    expect(elems2.length).toBe(8);

    const sameChild = await rest.get!('footer > div');
    expect(sameChild !== null).toBe(true);
    expect(sameChild?.data === child[0]).toBe(true);

    const secondChild = await rest.get!('footer > div.apple');
    expect(secondChild !== null).toBe(true);
    expect(secondChild?.data === child[1]).toBe(true);

    // Get document
    const a = rest.get!('footer a');
    expect(a !== null).toBe(true);

    const burger = rest.get!('#cheese-burger');
    expect(burger !== null).toBe(true);

    // Add a new div
    const second = htmlToDom(secondHtml, 'div');
    expect(second !== null).toBe(true);

    const secondPosted = await rest.post!('*', second!)
    expect(secondPosted.isSuccess).toBe(true);
    const secondFound = rest.get!('#secondDiv');
    expect(secondFound !== null).toBe(true);
})

test(`Testing the rest proxifying`, async() => {
    // Build the extension
    
    const options = {adapter};
    const footer = htmlToDom(footerHtml, 'footer');
    let footerFirstDiv = cssSelect("div", footer!, options);
    expect(footerFirstDiv).toHaveLength(2);

    const pageBody = htmlToDom(pageHtml, 'body');
    const pageRest = new Rest<HTMLElement>(nodeToObjectTree);
    const pageBodyPosted = await pageRest.post!('*', pageBody!);
    expect(pageBodyPosted.isSuccess).toBe(true);
    const contentBranch = await pageRest.get!('#footer-section');
    expect(contentBranch !== null).toBe(true);

    // Make sure it's parsing.
    // Add to the extensions the some modules
    // Make sure modules are the children of the element
    const proxy = new RestBranchProxy<HTMLElement>(contentBranch!, ModuleLink.newPackageLink('@ara-web', 'rest-branch-proxy'))
    const footerRestResult = new Rest<HTMLElement>(nodeToObjectTree, {proxies: [proxy], packageLink: ModuleLink.newPackageLink('@ara-web', 'rest-side')});
    const footerRest = footerRestResult.proxifyMe<RestBranchProxy<HTMLElement>>();
    expect(footerRest.isSuccess).toBe(true);

    // Post the body
    const footerPosted = await footerRest.getValue().post!('*', footer!);
    expect(footerPosted.isSuccess).toBe(true);

    // Add a data to footer from footerRest, it should be
    // fetchable from pageRest and footerRest
    const navBar1Body = htmlToDom(navBar1Html, 'a');
    expect(navBar1Body !== null).toBe(true);
    const navBar1Posted = await footerRest.getValue().post!('*', navBar1Body!);
    expect(navBar1Posted.isSuccess).toBe(true);
    const navBar1Arr = await footerRest.getValue().getAll!('#google-link');
    expect(navBar1Arr).toHaveLength(1);
    const pageNavBar1Arr = await pageRest.getAll!("#google-link");
    expect(pageNavBar1Arr).toHaveLength(1);
    expect(pageNavBar1Arr[0]).toEqual(navBar1Arr[0]);

    // Add element from the parent
    const navBar2Body = htmlToDom(navBar2Html, 'a');
    expect(navBar2Body !== null).toBe(true);
    const navBar2Posted = await pageRest.post!('footer', navBar2Body!);
    expect(navBar2Posted.isSuccess).toBe(true);
    const navBar2Arr = await footerRest.getValue().getAll!('#ara-link');
    expect(navBar2Arr).toHaveLength(1);
    const pageNavBar2Arr = await pageRest.getAll!("#ara-link");
    expect(pageNavBar2Arr).toHaveLength(1);
    expect(pageNavBar2Arr[0]).toEqual(navBar2Arr[0]);
    
    // Add after the first child
    const navBar3Body = htmlToDom(navBar3Html, 'a');
    expect(navBar3Body !== null).toBe(true);
    const navBar3Posted = await pageRest.post!('footer > a:last-child', navBar3Body!);
    expect(navBar3Posted.isSuccess).toBe(true);
    const navBar3Arr = await footerRest.getValue().getAll!('#github-link');
    expect(navBar3Arr).toHaveLength(1);
    const pageNavBar3Arr = await pageRest.getAll!("#github-link");
    expect(pageNavBar3Arr).toHaveLength(1);
    expect(pageNavBar3Arr[0]).toEqual(navBar3Arr[0]);
})

test(`Testing the rest branching without proxifying`, async() => {
    const footer = htmlToDom(footerHtml, 'footer');

    const pageBody = htmlToDom(pageHtml, 'body');
    const pageRest = new Rest<HTMLElement>(nodeToObjectTree);
    const pageBodyPosted = await pageRest.post!('*', pageBody!);
    expect(pageBodyPosted.isSuccess).toBe(true);
    const contentBranch = await pageRest.get!('#footer-section');
    expect(contentBranch !== null).toBe(true);

    // Make sure it's parsing.
    // Add to the extensions the some modules
    // Make sure modules are the children of the element
    const footerPkgLink = ModuleLink.newPackageLink('@ara-web', 'footer-pkg-link');
    const sampleHandler = new HTMLRestHandler(footerPkgLink);
    const sampleDispatcher = new RestHandler(footerPkgLink, "a");
    sampleDispatcher.handlePost = sampleHandler.handlePost!;
    const footerRestOptions = {
        packageLink: footerPkgLink, 
        extensions: [sampleDispatcher]
    };
    const footerRest = new Rest<HTMLElement>(nodeToObjectTree, footerRestOptions);
    footerRest.setRootNode(contentBranch!)

    // Post the body
    const footerPosted = await footerRest.post!('*', footer!);
    expect(footerPosted.isSuccess).toBe(true);

    // Add a data to footer from footerRest, it should be
    // fetchable from pageRest and footerRest
    const navBar1Body = htmlToDom(navBar1Html, 'a');
    expect(navBar1Body !== null).toBe(true);
    const navBar1Posted = await footerRest.post!('*', navBar1Body!);
    expect(navBar1Posted.isSuccess).toBe(true);
    const navBar1Arr = await footerRest.getAll!('#google-link');
    expect(navBar1Arr).toHaveLength(1);
    const pageNavBar1Arr = await pageRest.getAll!("#google-link");
    expect(pageNavBar1Arr).toHaveLength(1);
    expect(pageNavBar1Arr[0]).toEqual(navBar1Arr[0]);

    // Add element from the parent
    const navBar2Body = htmlToDom(navBar2Html, 'a');
    expect(navBar2Body !== null).toBe(true);
    const navBar2Posted = await pageRest.post!('footer', navBar2Body!);
    expect(navBar2Posted.isSuccess).toBe(true);
    const navBar2Arr = await footerRest.getAll!('#ara-link');
    expect(navBar2Arr).toHaveLength(1);
    const pageNavBar2Arr = await pageRest.getAll!("#ara-link");
    expect(pageNavBar2Arr).toHaveLength(1);
    expect(pageNavBar2Arr[0]).toEqual(navBar2Arr[0]);
    
    // Add after the first child
    const navBar3Body = htmlToDom(navBar3Html, 'a');
    expect(navBar3Body !== null).toBe(true);
    const navBar3Posted = await pageRest.post!('footer > a:last-child', navBar3Body!);
    expect(navBar3Posted.isSuccess).toBe(true);
    const navBar3Arr = await footerRest.getAll!('#github-link');
    expect(navBar3Arr).toHaveLength(1);
    const pageNavBar3Arr = await pageRest.getAll!("#github-link");
    expect(pageNavBar3Arr).toHaveLength(1);
    expect(pageNavBar3Arr[0]).toEqual(navBar3Arr[0]);
})

test(`Forwarding SDS Extension receiver from rest`, async() => {
    const footer = htmlToDom(footerHtml, 'footer');

    const pageBody = htmlToDom(pageHtml, 'body');
    const pageNode = nodeToObjectTree(pageBody!, undefined);
    const footerNode = nodeToObjectTree(footer!, pageNode);
    let navBar1Body = htmlToDom(navBar1Html, 'a');
    navBar1Body = Object.assign(navBar1Body!, {packageLink: ModuleLink.newPackageLink('ara-web', 'nav-bar-1')});
    const navBar1Node = nodeToObjectTree(navBar1Body!, pageNode);
    const sdsExtReceiver = new HTMLRestHandler(ModuleLink.newPackageLink(`@ara-web`, `sds-ext-receiver`));
    expect((await sdsExtReceiver.handlePost(
        footerNode!,
        navBar1Node!,
    )).isSuccess).toBe(true);
    expect(sdsExtReceiver.count).toBe(1);
    
    const posted = await sdsExtReceiver.handlePost(
        pageNode!,
        navBar1Node!,
    );
    expect(posted.isSuccess).toBe(true);
    expect(sdsExtReceiver.count).toBe(2);
    
    expect((await sdsExtReceiver.handlePost!(
        pageNode!,
        navBar1Node!,
    )).isFailure).toBe(true);
})

test(`Make sure sub rest handlers added`, async() => {
    const footerDom = htmlToDom(footerHtml, 'footer');
    const navBar1 = new Navigation(navBar1Html);
    
    // get child
    // Make sure it's parsing.
    // Add to the extensions the some modules
    // Make sure modules are the children of the element
    const rest = new Rest<RestfulHtml>(restfulHtmlToObjectNode);
    const elems1 = await rest.getAll!('*');
    expect(elems1.length).toBe(1);

    // Post the body
    const bodyPosted = await rest.post!('*', footerDom!);
    expect(bodyPosted.isSuccess).toBe(true);
    const elems2 = await rest.getAll!('*');
    expect(elems2.length).toBe(8);

    const firstDiv = await rest.get!('footer > div');
    expect(firstDiv !== null).toBe(true);
    expect(firstDiv?.children.length).toBe(0);

    // Before adding the navigation, we have only one link
    const links1 = await rest.getAll!('a');
    expect(links1).toHaveLength(1);
    const exampleLinks = await rest.getAll!('a[href="example.com"]');
    expect(exampleLinks).toHaveLength(1);

    //
    // Adding the navigation
    //
    expect(rest.dispatcher.extensionAmount).toBe(0);
    const navBarPosted = await rest.post!('footer > div', navBar1);
    expect(navBarPosted.isSuccess).toBe(true);
    expect(rest.dispatcher.extensionAmount).toBe(1);
    Debug.log(`The navigation rest handler url: ${rest.dispatcher.extensions[0].packageLink.url}`)

    //
    // Make sure patch handler works
    //
    const links2 = await rest.getAll!('a');
    expect(links2).toHaveLength(2);
    const exampleLinks2 = await rest.getAll!('a[href="example.com"]');
    expect(exampleLinks2).toHaveLength(1);
    const googleLinks = await rest.getAll!('a[href="google.com"]');
    expect(googleLinks).toHaveLength(1);

    // Patching must call the rest handler of the navigation
    const patched = await rest.patch!('a[href="google.com"]', 'ara.foundation');
    expect(patched.isSuccess).toBe(true);
    // Rest handler of navigation must overwrite the attribute by 'example.com'
    const exampleLinks3 = await rest.getAll!('a[href="example.com"]');
    expect(exampleLinks3.length).toBe(2);
    const googleLinks1 = await rest.getAll!('a[href="google.com"]');
    expect(googleLinks1).toHaveLength(0);

    // Removing the navigation must remove the navigation's rest handler from rest dispatcher
    const deleted = await rest.delete!('footer > div > a');
    expect(deleted.isSuccess).toBe(true);
    expect(rest.dispatcher.extensionAmount).toBe(0);

    // Get document
    const a = rest.get!('footer a');
    expect(a !== null).toBe(true);

    const burger = rest.get!('#cheese-burger');
    expect(burger !== null).toBe(true);

    // Add a new div
    const second = htmlToDom(secondHtml, 'div');
    expect(second !== null).toBe(true);

    const secondPosted = await rest.post!('*', second!)
    expect(secondPosted.isSuccess).toBe(true);
    const secondFound = rest.get!('#secondDiv');
    expect(secondFound !== null).toBe(true);
});