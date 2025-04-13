# Reflect

> In computer science, reflective programming or reflection is the ability of a process to examine, introspect, and modify its own structure and behavior. [Wikipedia Article](https://en.wikipedia.org/wiki/Reflective_programming)

Reflect package turns the web pages into the files into the
ontological data and vice versa.

## Getting started
Since, Reflect is a separated package, but aims to reflect another package,
We need to let know reflect which package modules are available and which are not.

In the project that you want to reflect:

```typescript
import { Memory, ModuleType } from "@ara-web/reflect";

const pageGlobs = import.meta.glob("../pages/**/*.{js|astro|jsx}");
const componentGlobs = import.meta.glob("../components/**/*.{js|astro|jsx}")
const layutGlobs = import.meta.glob("../layouts/**/*.{js|astro|jsx}")
const nodeJsGlobs = import.meta.glob(["node_modules/package/index.cjs"])

Memory.cacheGlobs({
    ModuleType.Nodejs: nodeJsGlobs,
    // the remaining...
})

```

The `Memory.cacheGlobs()` static method keeps assigns the globs by their paths.

You could update it multiple times, which is recommended during the development. Since, Memory cache will remove the glob if it removed
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

# Components
The component is the basic UI web component that composes the web pages.

The layers of component extraction:

* Glob
* FileLevel
* Component

*TODO* Make sure to evaluate the component values.