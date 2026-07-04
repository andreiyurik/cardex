# Cardex — clinical calculators for interventional cardiology

Web app with visual, interactive clinical calculators for interventional
cardiologists (Russian market first, extensible to other specialties).
Frontend-first: all computation runs in the browser; no backend at MVP stage.

## Stack

- **Astro** (SSG + islands) — content/landing pages are static for SEO.
  No SSR/endpoints for now; add later only when actually needed.
- **Svelte 5 + TypeScript** (`@astrojs/svelte`) — islands ONLY for
  interactive widgets (calculators, future 3D viewer). Use runes
  (`$state`, `$derived`).
- **Tailwind CSS 4 + DaisyUI 5** — single visual layer. Tailwind is wired
  via the official `@tailwindcss/vite` plugin (not the deprecated
  `@astrojs/tailwind` integration). **Lucide** for icons.
- **Cloudflare Pages** (`@astrojs/cloudflare`) — deploy target.
- **Vitest** — tests (`npm test`).
- **i18n** — Astro built-in i18n routing: `ru` (default, unprefixed) +
  `en` (under `/en/`). All UI text goes through locale dictionaries in
  `src/i18n/` — never hardcode UI strings in components.

## Language conventions

- Code, identifiers, comments, docs — **English**.
- Product UI and content — **Russian** (primary), English secondary.

## Architecture principles

- ALL clinical logic (formulas, thresholds, interpretations) lives in
  `src/lib/calculators/` as pure, typed, fully Vitest-covered functions.
  This is the single source of truth. Islands only render UI and call
  these functions — they NEVER duplicate formulas in markup.
- Each calculator = (1) pure calculation function + tests,
  (2) static Astro page for SEO, (3) Svelte island for interactivity.
- Design tokens (colors, typography, spacing) are defined once in
  `src/styles/global.css` (Tailwind `@theme` + DaisyUI theme) and shared
  by all pages and islands. Dark, clean, premium clinical aesthetic;
  a single accent color.
- Clinical coefficients that have not been verified by a practicing
  physician MUST be marked with `TODO(clinical): verify with practicing
  physician` and listed in `docs/roadmap.md`. Never invent medical numbers.

## SEO

- Every calculator gets its own static URL with unique
  title/description/OG via the shared `Seo.astro` component.
- schema.org (`MedicalWebPage` / `MedicalRiskCalculator`) JSON-LD via
  `src/lib/seo/schema.ts`.
- `@astrojs/sitemap`, `public/robots.txt`, semantic HTML, minimal JS.

## Project structure

- `src/lib/calculators/` — clinical logic (pure TS + tests)
- `src/lib/seo/` — schema.org helpers
- `src/i18n/` — locale dictionaries and helpers
- `src/components/islands/` — Svelte islands
- `src/components/` — Astro components (Seo, header, footer)
- `src/layouts/` — BaseLayout (shell + SEO + header/footer)
- `src/pages/` — ru pages at root, en pages under `en/`
- `docs/` — architecture, ADRs, roadmap

## Development

When starting the dev server, use background mode:

```
astro dev --background
```

Manage the background server with `astro dev stop`, `astro dev status`, and `astro dev logs`.

Run tests with `npm test` (Vitest). Build with `npm run build`.

## Documentation

Full documentation: https://docs.astro.build

Consult these guides before working on related tasks:

- [Adding pages, dynamic routes, or middleware](https://docs.astro.build/en/guides/routing/)
- [Working with Astro components](https://docs.astro.build/en/basics/astro-components/)
- [Using React, Vue, Svelte, or other framework components](https://docs.astro.build/en/guides/framework-components/)
- [Adding or managing content](https://docs.astro.build/en/guides/content-collections/)
- [Adding styles or using Tailwind](https://docs.astro.build/en/guides/styling/)
- [Supporting multiple languages](https://docs.astro.build/en/guides/internationalization/)

Project docs: `docs/architecture.md`, `docs/decisions.md`, `docs/roadmap.md`.
