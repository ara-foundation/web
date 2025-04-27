import { Debug, enumValues, Result, type Page } from "@ara-web/ts-enhancement";
import { ModuleMemory } from "@ara-web/reflect/memory";
import { FileExtension } from "../../module.js";
import { getFileExtension } from "@ara-web/reflect";
import type { AstroNode } from "../../component.js";
import type { AstroInstance } from "astro";
import PathModule from "node:path"
import { readFile } from "node:fs/promises";
import { parse as AstroParse } from "@astrojs/compiler";
import type { RootNode } from "@astrojs/compiler/types";

