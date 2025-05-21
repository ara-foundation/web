# SDS
**SDS** module to convert your app into a plug-and-play  architecture. It lets others:
* **Extend, add Plugins to Your App**: Developers can write extensions (plugins) that add functionality without modifying your code.
* **Customize interface**: Use proxies to intercept the methods so that the service could be exposed as a different class. *For example: as a CLI, Http Web, Http API, or other interfaces separated from the core logic. Additionally, with proxy create validations, authentications.*
* **Modularize Code**: By separating the app into a main service with proxies and extensions, SDS creates a standard which makes your app as a framework open to community contributions.

In essence, SDS is intended for apps where you expect third parties or even for internal develoeprs to create plugins and extensions that build on top of your app functionality.

Check out the [Reflect](https://github.com/ara-foundation/web/tree/main/packages/reflect/README.md) for real-world implementation.

Additionally, SDS includes:
- 📝 **Ara Link** adds various types of links between objects.
    * Ara Link &ndash; A generic Link that could link to any resource, not only text value.
    * Module Link &ndash; either a file url or a Purl. Used to create module IDs.


### SDS Architecture
Modules such as scripting files has three rules. A module can:
* Import it's siblings in the same directory.
* Import it's children index.
* Importing child module other than index is prohibited.
* Importing sub children not allowed.
* Import it's parent index.
* Importing named parent module is prohibited.
* Importing grand parent is prohibited.

Group of modules is a package. A package interaction:
* If package is called by any module, then define it as NPM Package.
* Other packages must be either an extension or a proxy.

## Tutorial

By following this tutorial, you can build an app that is a plug-&-play, turning your application into a more dynamic and community-driven project.

### 1. Setting Up your App
Let's start with the app setup.
This setup contains details like the name of the app, description, a list of proxies and extensions that your app will have.

```typescript
import { PackageLink, SDSExtensionInterface, SDSProxy, SDSService, type SDSSetup } from "./src/sds";

const serviceText = "Hello from the service";
const proxyText = "Hello from the proxy";
const proxyText2 = "Hello from the proxy 2";

const serviceLink = PackageLink.newPackageURL("@ara-web", "p-hintjens-service");
const proxyLink = PackageLink.newPackageURL("@ara-web", "p-hintjens-proxy");
const proxyLink2 = PackageLink.newPackageURL("@ara-web", "p-hintjens-proxy-2");

const backgammonSetup: SDSSetup = {
    packageLink: serviceLink,
    description: "The backgammon game backend with the fair dices",
    proxies: [proxyLink, proxy2Link],
    extensions: [extLink, ext2Link],
}
```

### 2. Defining a Service
In SDS, each app is exposed as Objects. Create your apps' primary class by extending `SDSService`. 

```typescript
interface SampleExtensionInterface extends SDSExtensionInterface {
    getDouble(): number;
    getTriple(): number;
}

class SampleService extends SDSService<SampleExtensionInterface> {
    constructor(setup: SDSSetup<SampleExtensionInterface>) {
        super(setup, ["helloService", "getNumber"]);
    }

    public helloService?(): string {
        return serviceText;
    }

    // If an extension is provided, getNumber returns the value from that extension.
    public getNumber?(extIndex?: number): number {
        if (extIndex !== undefined && extIndex >= 0 && extIndex < this._extensions.length) {
            return this._extensions[extIndex].getDouble();
        }
        return 1;
    }
}
```

Before we setup our service, we define the possible Extensions interfaces.
Any plugin for our app will have to implement the extension interface we provided.

> Tip
> Don't try to define all extension methods upfront.
> My recommendation is to add the methods as they come to your needs.
> Initially, its better to start with the empty extension interface.

After declaring the extension interface, we define our app by extending SDS Service. Our app for this tutorial has `helloService` and `getNumber` methods.

Our app initialization in the constructor has two processes. Firstly, we initialize by SDSSetup. It tells our app what are the proxies and extensions that we have. Other initialization is keep track of all public methods that pass to SDSService constructor as the second argument.

```typescript
super(setup, ["helloService", "getNumber"])
```

> Note, the methods or properties that we pass to SDSService must be optional, which that ends with `?` mark. Or, a type should be a union of `string|undefined`. Otherwise, if the app is proxified, SDS wouldn't be able to hide the methods you passed.

### 3. Creating Proxies
Proxies wrap the service (a.k.a our app) to modify its interface.
Potentially, you may create a proxy that returns the web interface, another proxy that returns the CLI interface.

Proxies are also includable, which means you can create your own set of proxies. For example for web interface, we can also add another proxy that authorizes the user if he access from the web.

For the tutorial we create a one proxy that returns a custom greeting (via getDouble) and another proxy that overwrites the getDouble into a (getTriple). Create two proxy classes:

```typescript
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
        // Return double the result from the service's getNumber method.
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
        // Return triple the value by further decorating the result from the previous proxy.
        return this._behindData!.getDoubleNumber!() * 2;
    }
}

```

The `SDSProxyInterface` both optional `putBehindData?<Type>(proxifiedObject: T) => void` method. If you define it, then during the proxification, your service will be available to the proxy, so that proxy could manipulate the data.

### 4. Writing Extensions
Extensions add functionality to the service. In this example, two extensions are created that each implement getDouble and getTriple:
For our tutorial we create two extensions each implementing `getDouble` and `getTriple` methods:

```typescript
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
```

Now, let's use our service that setup with two extensions and two proxies:

```
console.log("Service helloService:", serviceWithExtensions.helloService!());
console.log("Service getNumber (default):", serviceWithExtensions.getNumber!());
console.log("Service getNumber with first extension:", serviceWithExtensions.getNumber!(0)); // should use Sample6Extension (6*2 = 12)
console.log("Service getNumber with second extension:", serviceWithExtensions.getNumber!(1)); // should use Sample42Extension (42*2 = 84)
```
## When & Why to use SDS
* **Plugin Architecture**: If you want your app to support plugins that can extend or override default behaviours, SDS provides a ready-made structure.
* **Dynamic Extensions**: When you need to hide internal methods and expose only a clean public API that can be customized via proxies.
* **Service Modularization**: Use SDS to create a distinct services with unique identifiers, making it easier to manage and update parts of your application separately.

Developers should use this module when want to build an ecosystem where outside contributions (extensions and proxies) can be safely integrated without interfering with internal implementations.

const proxifiedBackgammon = backgammon.proxifyMe<Express>();
if (proxifiedResult.isSuccess) {
    const proxifiedService = proxififedResult.getValue();
    proxifiedService.getExpressApp().listen();
}

Summary
* Purpose: SDS transforms your app into one that is plugin-friendly, enabling extensions and proxies.
* Usage: Choose SDSw when you want to offer a modular, extensible service architecture.
* Structure: SDS provides interfaces for metadata, proxies, and extensions, SDSService acts as the main service class, while SDSProxy lets you wrap and modify behaviour.
* Tutorial: The steps above guide you from defining a module setup, creating and proxyfying a backgammon game backend, to add web interface independent from the game logic.


# Roadmap
* Parse the id and serialize it in any rest that calls id.
* Create a script that can generate the SDS in interactive form through `pnpm create sds`.
* Create a vice-versa, from Object Tree, to Page, basically opposite through RestExtension.
* Make description addition as a later call from AI agent.
  The AI make will get the object id. Then will return back to the Reflect the Object ID and the REST operation to operate.
  For example, the AI extension might return `Rest.patch(ObjectLink("*[description]"), "description generated by Ara Web", ReflectExtension as REST, true)`

How to work with the REST?

```typescript
const pageRestProxy = new PageREST(target: Page);
const restSetup = {proxies: [pageRestProxy]};
const pageRest = new REST(restSetup).proxifyMe<PageREST>();

// Functions:
pageRest.put(selector: string, value?: Component | ValueType)
```

Or shorter version:

```typescript
REST.put<PageREST>(page, selector, value?);
```

---
Rest:
create document!
--
    Available as div -> hello
--
pass document as array to look for.
create new Rest!
pass the rest as parent of previous rest.

--
    Available as

    main -> []
    side -> div -> hello
--