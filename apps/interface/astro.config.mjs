import { defineConfig } from "astro/config";
import { CONFIG } from "./src/config.js";
import sitemap from "@astrojs/sitemap";
import mdx from "@astrojs/mdx";
import tailwindcss from "@tailwindcss/vite";

import playformCompress from "@playform/compress";

import react from "@astrojs/react";

export default defineConfig({
  base: "/",
  site: CONFIG.site_url,
  integrations: [sitemap(), mdx(), playformCompress(), react({
    experimentalReactChildren: true,
  })],
  markdown: {
    shikiConfig: {
      theme: "material-theme-darker",
      langs: [],
    },
  },
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      exclude: ["@noir-lang/noirc_abi", "@noir-lang/acvm_js"],
      esbuildOptions: {
        target: "esnext",
      },
    },
    build: {
      target: "esnext",
    },
    esbuild: {
      target: "esnext"
    }
  },
});