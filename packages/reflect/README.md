# Reflect
Reflect package turns the website into the ontological JSON and vice versa in the real time to enable built-in Admin dashboards for websites.

> In computer science, reflective programming or reflection is the ability of a process to examine, introspect, and modify its own structure and behavior. [Wikipedia Article](https://en.wikipedia.org/wiki/Reflective_programming)

Testing from the reflect root:
> pnpm test -r ./

## Tutorial
For our tutorial, let's create a simple website by following [Astro's official documentation](https://docs.astro.build/en/install-and-setup/#add-integrations). Astro is one of the popular web frameworks.

```bash
pnpm create astro@latest ./sample-app
cd ./sample-app
```
Pick the options you wish during the interactive installation. 
Then, install *@ara-web/reflect* package:

```bash
pnpm add @ara-web/reflect @ara-web/reflect-astro-ext
```

The `Reflect` package knows how to reflect on typescript, javascript modules. Additionally we add `Astro Extension`, a reflect's plugin that
allows understanding astro's file structure, as well as
working with the `.astro` files. And for example we created the astro based sample website.

Our installation process is ready. 
Now, we need to setup Reflect, describing which modules
in the file system to change.

### Setup
Create a script at `src/scripts/setup-reflect.ts`:

```typescript
import { Reflect } from "@ara-web/reflect"
import { ReflectAstroFramework } from "@ara-web/reflect-astro-ext";

const astroReflect = new ReflectAstroFramework();
const reflect = new Reflect({extensions: [atroReflect]});

```
We create instance of `Reflect` class with the `ReflectAstroFramework` as it's extension. The extension will allow reflecting `.astro` files.
It also exposes the Astro Ontology.

Let's first packages that Reflect could analyze.

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
Here, we only support "@ara-web/reflect". Reflect has the 
built in `ReflectNodeJsExtension` extension. 
This extension supports typescript and javascript modules.
As well list of Nodejs features, modules that user could use.

Using built in nodejs extension, we tell to Reflect that
project uses the above packages. Otherwise, if Reflect during
parsing sees `import { data } from "another module"`,
then it will not know, what's that module, since you didn't tell him.

> Without your permission, it will never goes to the filesystem.
> So you need to give the permission explicitly.
> It guarantees the security.

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

For importing the bulk of data, we use Astro's built in feature, which 
in itself provided by `vite` plugin. The `glob` will load
modules that match the regular expression. We simply said
give me a list of all typescript, astro and SVG files in the `src` directory
recursively.

> Vite can not import the module where `import.meta.glob` called.
Therefore, we add it manually.

We then post the modules including the current file name. Reflect uses
the file you privded and builds the absolute path of the imports.

Finally, at the end of the script type: 

```typescript
export default reflect;
```

We can use our reflect in the page.

### Usage
> Test the entire tutorial by following the steps.

Let's open the page at `src/pages/index.astro`, and
add the following lines in the frontmatter's end.

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

The above example will print all the pages in your console as the JSON.

Done. Congratulations. Now, let's continue on showing the JSON on the browser.

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
