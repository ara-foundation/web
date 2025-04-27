# Reflect Astro Extension
Reflect the [Astro Framework](https://astro.build/) website to represent the website as a JSON and vice-versa, to generate website code from JSON. ;)

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

Our installation process is ready. Before using the Reflect, we need to setup to tell about our website.

### Setup
Create a script in `src/scripts/reflect.ts`:

```typescript
import { Reflect } from "@ara-web/reflect"
import { ModuleCategory as BuiltInModuleCategory } from "@ara-web/reflect/nodejs-ext";
import { ReflectExtension, ModuleCategory } from "@ara-web/reflect-astro-ext"

const astroReflect = new ReflectExtension();
const reflect = new Reflect({extensions: [atroReflect]});

// Support the NodeJS modules to reflect
const nodeJs = import.meta.glob(["lodash", "react"], {eager: true})
reflect.postModules({[BuiltInModuleCategory.Nodejs]: nodeJs});

// Support the Astro Modules
const modules = import.meta.glob("src/**/*.{js|astro|jsx}");
reflect.postModules(astroReflect.getCategorizedModuleData(modules));

export default reflect;
```

We first create an instance of Reflect instance by passing Astro Reflect as its extension. 
This will add a support of Astro Framework including `.astro` files and Astro file structure for the Reflect.

Then, we let know Reflect about all of our modules in our website.
First, we post the `NodeJS` modules such as `lodash` and `react`.

Then, we let know about the Modules of the Astro Framework.

Once, Reflect knows about necessary modules, we expose it so that our website can use it.

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