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

  integrations: [svelte(), sitemap()],

  vite: {
    plugins: [tailwindcss()],
  },

  adapter: cloudflare(),
});
