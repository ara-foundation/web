# Reflect
Reflect package turns the website into the ontological JSON and vice versa in the real time to enable built-in Admin dashboards for websites.

> In computer science, reflective programming or reflection is the ability of a process to examine, introspect, and modify its own structure and behavior. [Wikipedia Article](https://en.wikipedia.org/wiki/Reflective_programming)

## Tutorial
For our tutorial, let's create a simple website by following [Astro's official documentation](https://docs.astro.build/en/install-and-setup/#add-integrations). Astro is one of the popular web frameworks. After completing the tutorial, you would know how to apply Reflect for other frameworks as well.

```bash
pnpm create astro@latest ./sample-app
cd ./sample-app
```
Pick the options you wish during the interactive installation. 
Then, install *@ara-web/reflect* package:

```bash
pnpm add @ara-web/reflect 
pnpm add @ara-web/reflect-astro-ext
```

The `Reflect` package only works with the typescript, javascript modules. We also install the `Astro Extension`, that extends the Reflect to support `.astro` files and framework's file structure. 

We set the basic website and installed necessary packages. To start to use Reflect, we need to setup the server in our website.

### Setup
Create the `src/scripts/setup-reflect.ts` script. Here is the code too add:

```typescript
import { Reflect } from "@ara-web/reflect"
import { ReflectAstroFramework } from "@ara-web/reflect-astro-ext";

const astroReflect = new ReflectAstroFramework();
const reflect = new Reflect({extensions: [atroReflect]});

```
We create instance of `Reflect` class with the `ReflectAstroFramework` as it's extension. 

Now, we need to permit Reflect to work with the packages and modules. Because Reflect itself due to security reasons doesn't access to the files.
We have to put them manually.

And firstly, let's grant permission to recognize some node.js packages that we use in our website.

Reflect has the built in extension that extends it to support Nodejs environment. To support custom files or packages, we have to use the built in extension which is available as `reflect.nodeJsExt`:

```typescript
// Letting know about NodeJS modules to digest by Reflect.
let importModuleClause = "@ara-web/reflect";
let module = await import(importModuleClause);
let importLink = await reflect.nodeJsExt.putPackage({importModuleClause, module});
console.log(`Reflect link:`)
console.log(importLink);

importModuleClause = "@ara-web/reflect-astro-ext";
module = await import(importModuleClause);
importLink = await reflect.nodeJsExt.putPackage({importModuleClause, module});
console.log(`Astro Framework Reflect link:`)
console.log(importLink);

```

Using built in nodejs extension, we tell to Reflect that
project uses the above packages. Otherwise, if Reflect during
parsing sees `import { data } from "another module"`,
then it will not know, what's that module, since you didn't tell him.

> And without your permission, Reflect will not dare to look in the filesystem.

Then, we need to know the Astro Reflecting extension about
Astro's data in our filesystem, so let's continue adding the next piece of code into our setup script.

```typescript
// Support the Astro Modules
const records = import.meta.glob("../**/*.{ts,astro,svg}", {eager: true});
records["./setup-reflect.ts"] = await import("./setup-reflect")
const importMetaFilename = import.meta.filename;
const importedModules = await astroReflect.putModules({
    records, importMetaFilename
})
console.log(`The imported modules:`)
console.log(importedModules)

```

For importing the bulk of modules, we use Astro's built in `import.meta.glob`, which 
in itself provided by `vite` plugin. It uses the  `glob` pattern to find all files that match the regular expression.
give me a list of all typescript, astro and SVG files in the `src` directory
recursively.

Note, after `import.meta.glob` we also import the reflect-setup script itself, since Vite's glob pattern doesn't recognize the script where import function is called. We add it manually as well.
> Vite can not import the module where `import.meta.glob` called.
Therefore, we add it manually.

We then post the modules as relative to the `setup-reflect.ts` script into the Astro Extension. Astro Extension will handle it and expose necessary information to the `Reflect`.

Finally, at the end of the script type: 

```typescript
export default reflect;
```

We can use our reflect in the page.

### Usage
Let's open the page at `src/pages/index.astro`, and
add the following lines in the end of frontmatter.

> Frontmatter is the Typescript code between `---` and `---`.

```typescript
// ... top of frontmatter
import type { Page } from '@ara-web/reflect-astro-ext';
import Reflect from "../scripts/setup-reflect"

const pages = await Reflect.get<Page>("pages");
console.log(`Loaded pages from reflect:`)
console.log(pages);
---
<Layout>
	<Welcome />
</Layout>

```

The above example will print all the pages in your console as the JSON. You see your website's data.

Now, let's continue on showing the JSON on the browser.

### Auto Module Imports
Sometimes, during the development, we need to update the data in live.
For example, when we add a new component, we edited the page etc.

But Reflect doesn't know about any new files since it already loaded what we asked for.

To automatically update the Reflect's memory to match the filesystem,
Reflect has a useful function: `Reflect.postAutoImporter()`:

In the `src/scripts/reflect.ts` replace the following:

```typescript
const modules = import.meta.glob("src/**/*.{js|astro|jsx}");
reflect.postModules(astroReflect.getCategorizedModuleData(modules));
```

With the auto importer:

```typescript
import { CategorizedModules } from "@ara-web/reflect"

const astroImporter = (): Record<string, unknown> => {
    return import.meta.glob("src/**/*.{js|astro|jsx}");
}

reflect.postAutoImporter({recordsGetter: astroImporter, categorizer: astroReflect});
```

Whenever you call `reflect.get()` the reflect will automatically update the memory by reloading everything from the file system.
Including addition of the new files, removing deleted files, or updating
the files if its updated.

---
# Architecture or how it works?
The primary reflection is exposed through `Reflect` class. 
To reflect your app, use the instance of `Reflect`, then by calling `reflect.get()` or `reflect.put()`.

## Structure between Reflect, Ara Web and Ara.
Reflect package is based on `SDS` architecture modelling.

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

# Extending

## Adding an extension
Create a package that extends `ExtensionInterface` from `@ara-web/reflect`.
The example of built in reflect extension is in the `src/reflect-nodejs-ext`.

The extensions's could add support of new modules, to use AI to generate description.
Or to save the data outside.

## Proxy
Create a proxy by extending `ReflectProxy` class from `@ara-web/reflect`.

Proxies, are similar to midldeware, but proxies hide the Reflect behind proxy interface.
Reflect proxies may add new methods, over-write the Reflect's own methods, or return absolutely new data. For example, through the proxy,
reflect could be converted into a middleware of another program, into a CLI project, into an HTTP Endpoints etc.

Once you published your own Reflect proxy on NPM,
or found another proxy made by other internet peeps, you need to
add it as the proxy of Reflect and then proxify the Reflect itself:

```typescript
import { Reflect } from "@ara-web/reflect";
import { YourOwnProxy } from "@org.com/your-own-proxy";

const yourOwnProxy = new YourOwnProxy();
const reflect = new Reflect({proxies: [yourOwnProxy]});
```

*Trying to call `reflect.get` will fail, since proxy hided it*.
Instead, we need to call `reflect.proxifyMe`:

```typescript
const proxifiedReflect = reflect.proxifyMe<YourOwnProxy>();
```
Now, we can interact with our Proxy instance that internally may access into Reflect.

Follow the tutorial to create your proxy: [Create Reflect Proxy Tutorial](./PROXY.md)

----
# Terminology

## Modules 
The Reflect uses the Javascript's convention to structurize the app code base. In Javascript, a source code is treated as a single module.
So, Reflect also works with the modules instead of the source code files.

> Module = a single file.

In the file system, files are grouped by directories. In
Reflect instead directories we use `module category`.

The types of modules, which also means types of files are defined by the reflect extensions. For example `reflect-svelte` will allow `.svelte` module interaction, `reflect-react` will support React components.

## Memory
In the reflect, the modules are stored internally, since Reflect must know entire structure of the code upfront.

Therefore, before using the Reflect, set the modules that reflect must know
by calling `reflectExtension.putModules`.

Optionally, you can set Reflect to automatically
update the modules by setting.

> The Reflect will make sure if the file is deleted,
after the update, then it's cleaned in the cache.
> Not available yet. :( I forgot to add it.

If file isn't updated, then it's skipped. If file is updated or doesn't exist,
then, it will be recreated in the cache.
> Not available yet. :(

## Module Parts
Module data added into Reflect internally converted into module parts
that differentiate various parts, primarily the scripting part, and
Web elements.

Reflect will first create the `Code` from the module's scripting part
and identify all declared values, all imported modules and update the
module's memory with the result of script.

After the code, Reflect will parse the module as the JSON using the `UI-level` modules.
For example, in astro, it first converts all modules into `Page`.
Then pages are converting `Component`, while component itself 
converts the `Attribute`.

At the end, when all data is pre-defined, the module will make sure
to lint the data between modules.

# Roadmap
For variable declarations
* Check the variable updates
* Check the functions that update the variable?

* **BUG** cancelSlug when identifying !cancelSlug is not working. As its the infinite recursive loop `(!cancelSlug -> cancelSlug -> !cancelSlug` by `updateFunction`. Therefore, identify the variables in the module, then, identify their assignment.
