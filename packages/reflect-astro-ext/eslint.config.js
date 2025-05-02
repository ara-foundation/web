import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig, globalIgnores } from "eslint/config";
import { Reflect } from "@ara-web/reflect";
import { ReflectEslintProxy } from "@ara-web/reflect-eslint-proxy"

const sdsLinterProxy = new ReflectEslintProxy()
const reflect = new Reflect({proxies: [sdsLinterProxy]});
const proxifiedResult = reflect.proxifyMe();
if (proxifiedResult.isFailure) {
  throw proxifiedResult;
}
const proxifedPlugin = await (proxifiedResult.getValue()).getPlugin();
export default defineConfig([
  globalIgnores(["dist/*", "test/*"]),
  { 
    files: ["src/**/*.{js,mjs,cjs,ts}"], 
    plugins: { js, "sds-linter": proxifedPlugin }, 
    extends: ["js/recommended"],  
    rules: {
      "sds-linter/sds-module-imports": "error"
    }, 
  },
  { files: ["src/**/*.{js,mjs,cjs,ts}"], languageOptions: { globals: globals.browser } },
  tseslint.configs.recommended,
]);