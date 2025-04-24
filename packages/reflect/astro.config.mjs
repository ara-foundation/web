import { defineConfig } from "astro/config";
import { CONFIG } from "./src/config.js";

import react from "@astrojs/react";

export default defineConfig({
  base: "/",
  site: CONFIG.site_url,
  integrations: [react({
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