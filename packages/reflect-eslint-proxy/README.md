# Reflect Eslint Proxy
An eslint plugin for large codebases ensuring you avoid module dependency mess.

Adds the rules that makes sure your module will not import from non-familiar modules...

It's largely based on the SDS Architecture.

## Getting started
In the `eslint.config.mjs` add the following:

```javascript
import { Reflect } from "@ara-web/reflect";
import { EslintSDSLinterProxy } from "@ara-web/eslint-sds-linter";

const eslintSDSLinterProxy = new EslintSDSLinterProxy();
const reflect = new Reflect({proxies: eslintSDSLinterProxy});

const reflectSDSLinter = reflect.proxifyMe();
const eslintPlugin = await (reflectSDSLinter.getValue().getPlugin());

export default defineConfig([
  {
    // ... 
    plugins: { "sds-linter": proxifedPlugin }, 
    rules: {
      "sds-linter/sds-module-imports": "error"
    }
  }
```

# Roadmap
Files
* Make sure to import all the files including `.astro`.
* Make sure that file extension is supported by the extensions.

Rules
* Add a rule `sds-module-imports-order.ts`
* Add a rule `sds-proxify-me-called.ts` that ensures if a module has passed proxies into the Proxy receiver, then proxy receiver has call `proxifyMe`.
* Add a rule `sds-behind-proxy.ts` that ensures that if object recieved a user is not calling proxified methods nor arguments that is in the proxified object property from `proxified.publicMethods` list.
