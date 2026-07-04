// Plain Vitest config (NOT Astro's getViteConfig: it loads the Cloudflare
// adapter's Vite plugin, which is incompatible with the Vitest server).
// Clinical logic under test is pure TypeScript and needs no Astro tooling.
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts'],
  },
});
