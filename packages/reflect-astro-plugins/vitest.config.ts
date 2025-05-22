/// <reference types="vitest" />
import { getViteConfig } from 'astro/config'

export default getViteConfig({
    test: {
        typecheck: {
            tsconfig: "./tsconfig.test.json"
        }
    },
})

