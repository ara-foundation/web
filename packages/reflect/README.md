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
# Architecture or how it works?
The primary reflection is exposed through `Reflect` class. 
To reflect your app, use the instance of `Reflect`, by calling `reflect.getPages()` or `reflect.getComponents()`.

## Globs

But globs are the raw files and their paths in the Vite's format. We need to convert them
into the apps code structure.

In order to reflect, pass to the Reflect the globs. 
Globs are the files retrieved by the Vite's file import's `import.meta.glob()` function.

> Requires Vite, or Vite dependent modules to use Reflect.


## Modules 
Generally, a code base is organized into the directories and source code files.
Optionally a code could include scripts, configurations and assets such as Audio, Graphical etc.

The Reflect uses the Javascript's convention to structurize the app code base.
In Javascript, a source code is treated as a single module.
So, Reflect also works with the modules instead of the source code files.

Instead of the directories, reflect uses the module types.

Modules are consisted of the 
- ModuleType (type of the module: 'Components', 'Page', etc.), 
- modulePath (path within the system), 
- loaded glob.

The Modules followed by the globs are the top level.

> If you want to support different directories, for example `Animation`, `Card` module types,
> Then, edit the `@src/module.ts`.
> If you want to support new forms of the modules, then update the module level.

## Memory
In the reflect, the modules are stored internally, since Reflect must know entire structure of the code upfront.

Therefore, before using the Reflect, set the Globs of all app code base that it could understand.
Optionally, you can set Reflect to automatically
update the modules by setting

`reflect.putAutoGlobsImport(() => ModuleGlobs)`

The Reflect will make sure if the file is deleted,
after the update, then it's cleaned in the cache.

If file isn't updated, then it's skipped. If file is updated or doesn't exist,
then, it will be recreated in the cache.

> Whenever you call the Reflect exposed methods such as `getComponents()`, `getPages()`,
> It will expose them from the Memory.

## UI Content
Some data, such as Scripts, or Components are simply provided by the Vite.
Those are not necessary to parse.
But for web pages, we need to structurize the code.

So it means, we need to decode the web page into the scripts, and the Page Elements.
Usually web pages are dynamic, and some data is received through the scripts.
That's why we need to decode the page into the scripts and Page Elements.

### Page Element
So, if the module has the web elements to show, then it's treated as the page elements. 
Since, we use the Astro as the only engine for now, then the page nodes are the Astro Nodes.

# Content retreival
Whenever you retreive data by `Reflect`, if it's the anything except the page,
then, reflect retreives the data automatically without anaylizing the internal structure.

But it's different for the pages modules.

## Page retreival
If Reflect is asked to retreive the page from the module,
Then it will create a `ui-content`.
And then, will try to convert each content's data into components.

### Page level
This is going in the `page-level.ts` module.
The UI level will analyze each element and convert them into the components,
if necessary, will parse it's dynamic data of the elements as well.

Once the elements converted into the recpetive parts, then 
UI level will put them in the page.

The UI goes in two stages. First it analyzes the components.
Then it if the components have a link to the javascript expression, then page level will evaluate them.

#### Element level 
The `page-level.ts` receiving the content, calls the `element-level` for each of it's element
by passing the Element. Elements match the components always, otherwise it won't work.
Therefore, the element's will return Components, RPC calls or layouts.

The `element-level` also parses the attributes of the element as well.

##### Attribute level
The `attribute-level` is analyzed the component's name, as well as the module of the component.
If the component has the attributes, then the parameters are passed to the component.

If the component has the dynamic data in the attributes, then it's called by the Ast from `code-level`.

#### Code Level
The code level evaluates the given piece of code from the source code and all modules that reflect has.
> Requires access to the memory for the Code Level.
> Pass through all elements.
The code level works with the AST. If it doesn't exist, then the AST will be generated.
It first, analyzes the imports such as dependency on other modules from list of registered modules.
Identifiers, etc.

Then, evaluates the code using.

---
# Components
The component is the basic UI web component that composes the web pages.

The layers of component extraction:

* Glob
* FileLevel
* Component

*TODO* Make sure to evaluate the component values.

# Reflect itself.
Let's say, I got a script that defines the Reflect instance.
Then, in one of the components I call the `reflect.instance`.

When a Reflect tries to reflect the page, it sees there is an import clause.
Import refers to the script where it was defined. But limitation is such, that Import clause
can not define itself.

```typescript
// src/scripts/reflect.ts
import { Reflect } from "@ara-web/reflect";

const reflect = new Reflect({import.meta.filename})
export default reflect;
```

Then, we have a script:
```typescript
// src/pages/index.astro
import reflect from "../scripts/reflect"

console.log(reflect.get());
```

Let's test that it works.