/**
 * Testing the Reflect proxibility
 */
import { Reflect } from "../src/reflect.js"
import { expect, test } from "vitest";
import { ModuleLink } from "@ara-web/p-hintjens";
import { SDSProxy } from "@ara-web/p-hintjens/sds";

class SampleProxy extends SDSProxy {
    protected _behindData?: Reflect;
    
    constructor(moduleLink: ModuleLink, description?: string) {
        super(moduleLink, ["helloWorld", "hasGetMethod"], description);
    }
    
    public putBehindData?(behindData: Reflect): void {
        this._behindData = behindData;
    }

    public helloWorld?(): string {
        const hasReflect = this._behindData !== undefined;
        const hasGet = hasReflect && this._behindData!.get !== undefined;
        return `Hello world from sample proxy, is reflect (${hasReflect}) behind has get method? ${hasGet}`;
    }

    public hasGetMethod?(): boolean {
        const hasReflect = this._behindData !== undefined;
        const hasGet = hasReflect && this._behindData!.get !== undefined;
        return hasGet;
    }
}

test('Simply creating a reflect proxy and trying to fetch data', async () => {
    const sampleLink = ModuleLink.newPackageURL(undefined, "sample-package");
    const sampleProxy = new SampleProxy(sampleLink);
    const reflect = new Reflect({proxies: [sampleProxy], packageLink: sampleLink});
    expect(reflect.get).toBeUndefined();
    

    const proxifiedReflect = reflect.proxifyMe<SampleProxy>();
    expect(proxifiedReflect.isSuccess).toBe(true);

    const helloWorld = proxifiedReflect.getValue().helloWorld!();
    expect(helloWorld.length).toBeGreaterThan(0);
    expect(proxifiedReflect.getValue().hasGetMethod!()).toBe(true);
});

test('Check that proxies chain returns the first proxy', async () => {
    const sampleLink1 = ModuleLink.newPackageURL(undefined, "sample-package-1");
    const sampleProxy1 = new SampleProxy(sampleLink1);
    const sampleLink2 = ModuleLink.newPackageURL(undefined, "sample-package-2");
    const sampleProxy2 = new SampleProxy(sampleLink2);
    const reflect = new Reflect({proxies: [sampleProxy1, sampleProxy2], packageLink: sampleLink1});
    expect(reflect.get).toBeUndefined();

    const proxifiedReflect = reflect.proxifyMe<SampleProxy>();
    expect(proxifiedReflect.isSuccess).toBe(true);

    const proxy1 = proxifiedReflect.getValue().packageLink.isEqual(sampleLink1);
    expect(proxy1).toBe(true);
    const proxy2 = proxifiedReflect.getValue().packageLink.isEqual(sampleLink2);
    expect(proxy2).toBe(false);
});

