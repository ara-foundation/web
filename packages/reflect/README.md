# Reflect
Reflect package turns the website into the ontological JSON and vice versa in the real time to enable built-in Admin dashboards for websites.

> In computer science, reflective programming or reflection is the ability of a process to examine, introspect, and modify its own structure and behavior. [Wikipedia Article](https://en.wikipedia.org/wiki/Reflective_programming)

Testing from the reflect root:
> pnpm test -r ./

## Getting started
Since, Reflect is a separated package, but aims to reflect another package,
We need to let know reflect which package modules are available and which are not.

In the project that you want to reflect:

```typescript
import { Reflect, ModuleType } from "@ara-web/reflect";

const pageGlobs = import.meta.glob("../pages/**/*.{js|astro|jsx}");
const componentGlobs = import.meta.glob("../components/**/*.{js|astro|jsx}")
const layutGlobs = import.meta.glob("../layouts/**/*.{js|astro|jsx}")
const nodeJsGlobs = import.meta.glob(["node_modules/package/index.cjs"])

Reflect.putGlobs({
    ModuleType.Nodejs: nodeJsGlobs,
    // the remaining...
})

```

The `Reflect.putGlobs()` static method registers all the files required for the Reflect package.

You could update it multiple times, which is recommended during the development stage. Since, Memory cache will remove the glob if it removed
in the directory. 

To make it consisted, Memory has an adapter that you can inject it too
which will update everytime whenever a necessary method is invoked.

```typescript
import { Memory, type ModuleGlobs } from "@ara-web/reflect";

Memory.setAutoGlobRetreiver(globImporter);

const globImporter = (): ModuleGlobs => {
    const pageGlobs = import.meta.glob("../pages/**/*.{js|astro|jsx}");
    const componentGlobs = import.meta.glob("../components/**/*.{js|astro|jsx}")
    const layutGlobs = import.meta.glob("../layouts/**/*.{js|astro|jsx}")
    const nodeJsGlobs = import.meta.glob(["node_modules/package/index.cjs"])

    const allGlobs: ModuleGlobs = {
        [ModuleType.Nodejs]: nodeJsGlobs,
        // the remaining...
    };

    return allGlobs;
}
```

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
