import path from "node:path";
import tseslint from "typescript-eslint";
import { RuleTester } from "@typescript-eslint/rule-tester";
import * as vitest from "vitest";
import { getRule } from "../src/rules/sds-module-imports.js";
import { FilePath } from "@ara-web/reflect";

RuleTester.afterAll = vitest.afterAll;
RuleTester.it = vitest.it;
RuleTester.itOnly = vitest.it.only;
RuleTester.describe = vitest.describe;

const dependencies = FilePath.getPackageJsonDependencies();

const ruleTester = new RuleTester({
  languageOptions: {
    parser: tseslint.parser,
    parserOptions: {
      projectService: {
        allowDefaultProject: ["*.ts*"],
        defaultProject: "tsconfig.json",
      },
      tsconfigRootDir: path.join(__dirname, "../"),
    },
  }
});

// Make the rules but for index file.
ruleTester.run("sds-module-imports", getRule(dependencies), {
  valid: [
    // First, working with the directories, assuming index.js exists
    `import {data} from "./src"`,       // ./src/index.js is the unnamed child
    `import {data} from "./src/index.js"`,   // named child pass
    `import type {Type} from "../"`,    // is the unnamed parent.
    `import type {Type} from "../index.js"`,    // named parent pass
    `import data from "./hello-world.js"`,  // same directory

    // Following is done at the end, it needs some adjustments to the plugin.
    `import { Reflect } from "@ara-web/reflect"`, // it's on package.json, import it.
    `import PathModule from "node:path"`, // it's a built in
  ],
  invalid: [
    {
      code: `import {data} from "./src/sds-linter-proxy"`,
      errors: [
        {
          line: 1,
          messageId: "grandNamedChild",
        },
      ],
    },
    {
        code: `import {data} from "./src/sds-linter-proxy/index.js"`,
        errors: [
          {
            line: 1,
            endLine: 1,
            messageId: "grandChild",
          },
        ],
    },
    {
        code: `import {data} from "./sds-linter-proxy/child.js"`,
        errors: [
          {
            line: 1,
            endLine: 1,
            messageId: "grandNamedChild",   // should be ./sds-linter-proxy
          },
        ],
    },
    {
        code: `import {data} from "../src/sds-linter-proxy"`,
        errors: [
          {
            line: 1,
            endLine: 1,
            messageId: "grandParent",
          },
        ],
    },
    {
        code: `import {data} from "../sds-linter-proxy"`,
        errors: [
          {
            line: 1,
            endLine: 1,
            messageId: "grandNamedParent",
          },
        ],
    },
    {
        code: `import {data} from "../sds-linter-proxy/index.js"`,
        errors: [
          {
            line: 1,
            endLine: 1,
            messageId: "grandParent",
          },
        ],
    },
    {
          code: `import {data} from "../src/sds-linter-proxy/index.js"`,
          errors: [
            {
              line: 1,
              endLine: 1,
              messageId: "grandParent",
            },
          ],
    },
    {
        code: `import {data} from "./index.js"`,
        errors: [
          {
            line: 1,
            endLine: 1,
            messageId: "notNamedSibling",
          },
        ],
    },
    {
        code: `import {data} from "./"`,
        errors: [
          {
            line: 1,
            endLine: 1,
            messageId: "notNamedSibling",
          },
        ],
    },
    {
        code: `import {data} from "../../public/data/images"`,
        errors: [
          {
            line: 1,
            endLine: 1,
            messageId: "grandParent",
          },
        ],
    },
  ],
});