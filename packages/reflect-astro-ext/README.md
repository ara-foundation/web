# Reflect Astro Extension
Reflect the [Astro Framework](https://astro.build/) website to convert the website into a form of JSON and vice-versa. ;)

Possible use case:
- Edit the web pages, add new pages right on the website.
- The cheapest AI interface for your web page, since AI works with the JSON representation
- Clean code, less code since admin panel is just made with the few NPM packages.

> Requires `@ara-web/reflect`

## Tutorial
For our tutorial, let's create a simple website by following [Astro's official documentation](https://docs.astro.build/en/install-and-setup/#add-integrations)

```bash
pnpm create astro@latest --add react ./sample-app
cd ./sample-app
```

In the project, install *@ara-web/reflect* packages:

```bash
pnpm add @ara-web/reflect @ara-web/reflect-astro-ext
```

Our installation process is ready. Before using the Reflect, let's set up the package.

### Setup
Create a script in `src/scripts/reflect.ts`:

```typescript
import { Reflect } from "@ara-web/reflect"
import { ReflectExtension, ModuleCategory } from "@ara-web/reflect-astro-ext"

const reflect = new Reflect({extensions: [new ReflectExtension()]});

const pages = import.meta.glob("src/pages/**/*.{js|astro|jsx}");
const components = import.meta.glob("src/components/**/*.{js|astro|jsx}")
const layuts = import.meta.glob("src/layouts/**/*.{js|astro|jsx}")
const scripts = import.meta.glob("src/scripts/**/*.{js|ts}")
const nodeJs = import.meta.glob(["node_modules/package/index.cjs"])

reflect.postModules({
    ModuleCategory.Page: pages,
    ModuleCategory.Layout: layouts,
    ModuleCategory.Component: components,
    ModuleCategory.Script: scripts,
    ModuleCategory.Nodejs: nodeJs,
});

export default reflect;
```

We first, register the Astro Framework as the Reflect's extension.
This will add a support of Astro Parameters.

Then, we load all the modules that Reflect will need, by each Astro
Framework's categories.

Once, Reflect knows that we use Astro, we can analyze the website as the JSON.

### Usage
> Test the entire tutorial by following the steps.

Let's create a new page at `src/pages/reflect.astro`:

```typescript
---
import reflect from "scripts/reflect.ts";

const pages = await reflect.get(reflect.moduleCategory.Page);

console.log(pages);
---

<div>Pages shown in the console</div>
```

The above example will print all the pages in your console as the JSON.

### Auto Module Imports
Sometimes, during the development, we need to update the data in live.
For example, when we add a new component, we edited the page etc.

But Reflect doesn't know about any new files since it already loaded what we asked for.

To automatically update the Reflect's memory to match the filesystem,
Reflect has a useful function: `Reflect.postAutoImporter()`:

In the `src/scripts/reflect.ts` replace the following:

```typescript
reflect.postModules({
    ModuleCategory.Page: pages,
    ModuleCategory.Layout: layouts,
    ModuleCategory.Component: components,
    ModuleCategory.Script: scripts,
    ModuleCategory.NodeJs: nodeJs,
});
```

With the auto importer:

```typescript
import { CategorizedModules } from "@ara-web/reflect"

const importModules = (): CategorizedModules => {
    return  {
        [ModuleCategory.NodeJs]: nodeJs;
        [ModuleCategory.Page]: pages;
        [ModuleCategory.Layout]: layouts;
        [ModuleCategory.Component]: components;
        [ModuleCategory.Script]: scripts;
    } as CategorizedModules;
}

reflect.postAutoImporter(importModules);
```

Whenever you call `reflect.get()` the reflect will automatically update the memory by reloading everything from the file system.


# Optimize the loading for each importer.
Listing all the modules that Astro understands is tiresome.
Is there a way to run it faster? There is not but we can create it
by adding auto-importer into the extensions.

Add to the extension interface:

`getCategorizedModuleData(records: Record<string, unknown>) => CategorizedModules`

Then:

```typescript
import { Reflect } from "@ara-web/reflect";
import AstroReflectExt from "@ara-web/reflect-astro-ext";

const astroReflect = new AstroReflectExt();

const astroModuleRecords = import.meta.glob("src/**/*.{js|ts|astro|tsx|jsx}");
const astroModules = astroReflect.getCategorizedModuleData(astroModuleRecords);

const reflect = new Reflect({extensions: [astroReflect]});
reflect.postModules(astroModules);

```

---
In order to update automatically:

```typescript
const getAstroRecords = () => {
    return import.meta.glob("src/**/*.{js|ts|astro|tsx|jsx}");
}

const astroAutoImporter = ({recordsGetter: getAstroRecords, categorizer: astroReflect})
reflect.postAutoImporter(astroAutoImporter)

// Allow access to some node_modules packages
const getNodeJsRecords = () => {
    return import.meta.glob("@fontawesome/free-svg-icons")
}
const fontAwesomeImporter = ({records: getNodejsRecords, categorizer: reflect.nodeJsExt})
```

The reflect package comes with the included extension that deals with the NodeJS Environment. This extension also allows using the features of the typescript such as `Array`, `Record` generics.