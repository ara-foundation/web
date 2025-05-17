import { expect, test } from "vitest";
import { ModuleLink } from "../src"
import { SDSExtensionInterface, SDSProxy, SDSService, type SDSSetup } from "../src/sds";
import { Debug } from "@ara-web/p-hintjens";

const serviceText = "Hello from the service";
const proxyText = "Hello from the proxy";
const proxyText2 = "Hello from the proxy 2";
const serviceLink = ModuleLink.newPackageURL("@ara-web", "p-hintjens-service");
const proxyLink = ModuleLink.newPackageURL("@ara-web", "p-hintjens-proxy");
const proxyLink2 = ModuleLink.newPackageURL("@ara-web", "p-hintjens-proxy-2");

interface SampleExtensionInterface extends SDSExtensionInterface {
    getDouble(): number;
    getTriple(): number;
}

class SampleService extends SDSService<SampleService, SampleExtensionInterface> {
    constructor(setup: SDSSetup<SampleExtensionInterface>) {
        super(setup, ["helloService", "getNumber"]);
    }

    public helloService?(): string {
        return serviceText
    }

    public getNumber?(extIndex?: number): number {
        if (extIndex !== undefined && extIndex >= 0 && extIndex < this._extensions.length) {
            return this._extensions[extIndex].getDouble();
        }
        return 1;
    }
}

class SampleProxy extends SDSProxy {
    protected _behindData?: SampleService;

    constructor(moduleLink: ModuleLink, description?: string) {
        super(moduleLink, ["helloProxy", "getDoubleNumber"], description);
    }

    public putBehindData?(behindData: SampleService): void {
        this._behindData = behindData;
    }

    public helloProxy?(): string {
        return proxyText;
    }

    public getDoubleNumber?(): number {
        return this._behindData!.getNumber!() * 2;
    }
}

class SampleProxy2 extends SDSProxy {
    protected _behindData?: SampleProxy;

    constructor(moduleLink: ModuleLink, description?: string) {
        super(moduleLink, ["helloProxy2", "getTripleNumber"], description);
    }

    public putBehindData?(behindData: SampleProxy): void {
        this._behindData = behindData;
    }

    public helloProxy2?(): string {
        return proxyText2;
    }

    public getTripleNumber?(): number {
        return this._behindData!.getDoubleNumber!() * 2;
    }
}

class Sample42Extension implements SampleExtensionInterface {
    description?: string | undefined;
    packageLink: ModuleLink;
    private num: number = 42;
    
    constructor(moduleLink: ModuleLink, description: string) {
        this.description = description;
        this.packageLink = moduleLink;
    }
    getDouble(): number {
        return this.num * 2;
    }
    getTriple(): number {
        return this.num * 3;
    }
}

class Sample6Extension implements SampleExtensionInterface {
    description?: string | undefined;
    packageLink: ModuleLink;
    private num: number = 6;
    
    constructor(moduleLink: ModuleLink, description: string) {
        this.description = description;
        this.packageLink = moduleLink;
    }
    getDouble(): number {
        return this.num * 2;
    }
    getTriple(): number {
        return this.num * 3;
    }
}

test('Creating a proxy', async () => {
    const proxy = new SampleProxy(proxyLink, "This is a proxy");
    expect(proxy.description).toBe("This is a proxy");
    expect(proxy.packageLink).toBe(proxyLink);
    expect(proxy.publicMethods).toEqual(["helloProxy", "getDoubleNumber"]);
    expect(proxy.helloProxy).toBeDefined();
    expect(proxy.helloProxy!()).toBe(proxyText);

    const proxy2 = new SampleProxy2(proxyLink2, "This is a proxy 2");
    expect(proxy2.description).toBe("This is a proxy 2");
    expect(proxy2.packageLink).toBe(proxyLink2);
    expect(proxy2.publicMethods).toEqual(["helloProxy2", "getTripleNumber"]);
    expect(proxy2.helloProxy2).toBeDefined();
    expect(proxy2.helloProxy2!()).toBe(proxyText2);

    const service = new SampleService({
        packageLink: serviceLink,
        description: "This is a service",
        proxies: [proxy2, proxy],
        extensions: []
    });
    expect(service.description).toBe("This is a service");
    expect(service.packageLink).toBe(serviceLink);
    expect(service.publicMethods).toEqual(["helloService", "getNumber"]);
    expect(service.helloService).toBeUndefined();

    const proxified = service.proxifyMe<SampleProxy2>();
    expect(proxified.isSuccess).toBe(true);
    expect(proxified.getValue().helloProxy2!()).toBe(proxyText2);
    expect(proxified.getValue().getTripleNumber!()).toBe(4);
});

test(`Creating an extension`, async () => {
    const extension6 = new Sample6Extension(proxyLink, "This is an extension");
    expect(extension6.description).toBe("This is an extension");
    expect(extension6.packageLink).toBe(proxyLink);
    expect(extension6.getDouble()).toBe(12)

    const extension42 = new Sample42Extension(proxyLink, "This is an extension");
    expect(extension42.description).toBe("This is an extension");
    expect(extension42.packageLink).toBe(proxyLink);
    expect(extension42.getDouble()).toBe(84)

    const service = new SampleService({
        packageLink: serviceLink,
        description: "This is a service",
        proxies: [],
        extensions: [extension6, extension42]
    });
    expect(service.description).toBe("This is a service");
    expect(service.packageLink).toBe(serviceLink);
    expect(service.publicMethods).toEqual(["helloService", "getNumber"]);
    expect(service.helloService!()).toBe(serviceText);

    expect(service.getNumber!()).toBe(1);
    expect(service.getNumber!(0)).toBe(12);
    expect(service.getNumber!(1)).toBe(84);
});
