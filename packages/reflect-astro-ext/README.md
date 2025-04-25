# Astro Reflection
This is the extension for the Reflect package to support reflecting websites written with Astro Framework.

## Getting Started
First, let's create a sample project by following [Astro's official documentation](https://docs.astro.build/en/install-and-setup/#add-integrations)

```bash
pnpm create astro@latest --add react ./sample-app
cd ./sample-app
```

In the project, install the reflect packages:

```bash
pnpm add @ara-web/reflect @ara-web/reflect-astro-ext
```

### Setup
Once, all the packages are installed, 
we need to create a script that let's know Reflect about our codebase.

Create a script in `src/scripts/reflect.ts`:

```typescript
import { Reflect } from "@ara-web/reflect"
import { ReflectExtension, ModuleCategory } from "@ara-web/reflect-astro-ext"

const reflect = new Reflect({extensions: [ReflectExtension]});

const pages = import.meta.glob("../pages/**/*.{js|astro|jsx}");
const components = import.meta.glob("../components/**/*.{js|astro|jsx}")
const layuts = import.meta.glob("../layouts/**/*.{js|astro|jsx}")
const scripts = import.meta.glob("../scripts/**/*.{js|ts}")
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

Once, Reflect knows that we use Astro, and knows which astro modules are
in our project, we create an instance and return it back.

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

### Development
Sometimes, during the development, we need to update the data in live.
For example, when we add a new component, we edited the page etc.

But Reflect doesn't know about any new files since it already loaded what we asked for.

To automatically update the Reflect's memory to match the filesystem,
Reflect has a useful function: `Reflect.postAutoImporter()`:

In the `src/scripts/reflect.ts` replace the

 `reflect.postModules()` with the following:

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

Whenever you call `reflect.get()` the reflect will automatically update the memory by reloading everything from the file structure.
