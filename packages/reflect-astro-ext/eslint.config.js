import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import { defineConfig } from "eslint/config";
import { Reflect } from "@ara-web/reflect";
import { EslintSDSLinterProxy } from "@ara-web/eslint-sds-linter"

const sdsLinterProxy = new EslintSDSLinterProxy()
const reflect = new Reflect({proxies: [sdsLinterProxy]});
const proxifiedResult = reflect.proxifyMe();
if (proxifiedResult.isFailure) {
  throw proxifiedResult;
}
const proxifedPlugin = await (proxifiedResult.getValue()).getPlugin();
console.log('proxified plugin:')
console.log(proxifedPlugin)
export default defineConfig([
  { 
    files: ["./src/**/*.{js,mjs,cjs,ts}"], 
    plugins: { js, "sds-linter": proxifedPlugin }, 
    extends: ["js/recommended"],  
    rules: {
      "sds-linter/sds-module-imports": "error"
    }
  },
  { files: ["./src/**/*.{js,mjs,cjs,ts}"], languageOptions: { globals: globals.browser } },
  tseslint.configs.recommended,
]);