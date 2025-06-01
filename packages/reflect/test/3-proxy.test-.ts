/**
 * Testing the Reflect proxibility
 */
import { Reflect } from "../src/reflect.js"
import { expect, test } from "vitest";
import { Proxy, ModuleLink } from "@ara-web/sds";

class SampleProxy extends Proxy {
    protected _behindData?: Reflect;
    
    constructor(moduleLink: ModuleLink) {
        super(moduleLink, ["helloWorld", "hasGetMethod"]);
    }
    
    public putBehindData?(behindData: Reflect): void {
        this._behindData = behindData;
    }

    public helloWorld?(): string {
        const hasReflect = this._behindData !== undefined;
        const hasGet = hasReflect && this._behindData!.rest !== undefined;
        return `Hello world from sample proxy, is reflect (${hasReflect}) behind has get method? ${hasGet}`;
    }

    public hasGetMethod?(): boolean {
        const hasReflect = this._behindData !== undefined;
        const hasGet = hasReflect && this._behindData!.rest !== undefined;
        return hasGet;
    }
}

test('Simply creating a reflect proxy and trying to fetch data', async () => {
    const sampleLink = ModuleLink.newPackageLink(undefined, "sample-package");
    const sampleProxy = new SampleProxy(sampleLink);
    const reflect = new Reflect({proxies: [sampleProxy]});
    expect(reflect.rest).toBeUndefined();
    

    const proxifiedReflect = reflect.proxifyMe<SampleProxy>();
    expect(proxifiedReflect.isSuccess).toBe(true);

    const helloWorld = proxifiedReflect.getValue().helloWorld!();
    expect(helloWorld.length).toBeGreaterThan(0);
    expect(proxifiedReflect.getValue().hasGetMethod!()).toBe(true);
});

test('Check that proxies chain returns the first proxy', async () => {
    const sampleLink1 = ModuleLink.newPackageLink(undefined, "sample-package-1");
    const sampleProxy1 = new SampleProxy(sampleLink1);
    const sampleLink2 = ModuleLink.newPackageLink(undefined, "sample-package-2");
    const sampleProxy2 = new SampleProxy(sampleLink2);
    const reflect = new Reflect({proxies: [sampleProxy1, sampleProxy2]});
    expect(reflect.rest).toBeUndefined();

    const proxifiedReflect = reflect.proxifyMe<SampleProxy>();
    expect(proxifiedReflect.isSuccess).toBe(true);

    const proxy1 = proxifiedReflect.getValue().packageLink.isEqual(sampleLink1);
    expect(proxy1).toBe(true);
    const proxy2 = proxifiedReflect.getValue().packageLink.isEqual(sampleLink2);
    expect(proxy2).toBe(false);
});

