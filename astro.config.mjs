// @ts-check
import { defineConfig } from 'astro/config';

import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  // TODO: replace with the production domain once connected in Cloudflare
  site: 'https://cardex.pages.dev',

  i18n: {
    defaultLocale: 'ru',
    locales: ['ru', 'en'],
    routing: {
      prefixDefaultLocale: false,
    },
  },

  // Keep the internal clinical-review page out of the public sitemap.
  integrations: [svelte(), sitemap({ filter: (page) => !page.includes('/review') })],

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: cloudflare(),
});
