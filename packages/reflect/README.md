# Reflect
The Reflect is an NPM package that creates and manipulates the ontological data of the website.

With Reflect
- Edit your website as a json.
- Give the JSON to the AI agents to have context of the website in a cheaper way.
- Edit any nodejs based websites right in the browser.
- Provide Admin panel/CMS for your websites without creating it.

> In computer science, reflective programming or reflection is the ability of a process to examine, introspect, and modify its own structure and behavior. [Wikipedia Article](https://en.wikipedia.org/wiki/Reflective_programming)

**Follow us to know Reflect release**
--
*Subscribe to our [Telegram Channel](t.me/arafoundation) to keep up with the release. Or follow our [@ara_foundation_](twitter.com/ara_foundation_) ex-twitter account.*

## Tutorial
Lets reflect on the a simple website by following [Astro's official documentation](https://docs.astro.build/en/install-and-setup/#add-integrations). Astro is one of the popular web frameworks. After completing the tutorial, you would know how to apply Reflect for other frameworks as well.

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
## More Links
* [Architecture](ARCHITECTURE.md)
* [Writing through extensions and proxies](REFLECT-SDS.md)

# Roadmap
For variable declarations
* Check the variable updates
* Check the functions that update the variable?

* **BUG** cancelSlug when identifying !cancelSlug is not working. As its the infinite recursive loop `(!cancelSlug -> cancelSlug -> !cancelSlug` by `updateFunction`. Therefore, identify the variables in the module, then, identify their assignment.
