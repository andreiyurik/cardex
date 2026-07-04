# Cardex

Visual, interactive clinical calculators for interventional cardiology
(endovascular surgery / РЭВХ). Russian-first UI, English secondary.
Frontend-only: all calculations run in the browser — no patient data ever
leaves the device.

**Status: MVP in progress.** First calculator: SYNTAX Score.
Clinical coefficients are placeholders pending physician verification —
see `docs/roadmap.md`. **Not for clinical use yet.**

## Stack

Astro (SSG + islands) · Svelte 5 + TypeScript · Tailwind CSS 4 + DaisyUI ·
Lucide icons · Cloudflare Pages · Vitest · Astro built-in i18n (ru/en).

See `docs/architecture.md` and `docs/decisions.md` for the reasoning.

## Local development

Requires Node ≥ 22.12.

```sh
npm install
npm run dev        # dev server at http://localhost:4321
npm test           # Vitest — clinical logic tests
npm run build      # static build to ./dist
npm run preview    # preview the production build
```

## Deploy (Cloudflare Pages)

The site is a static build with the `@astrojs/cloudflare` adapter.

1. Push the repo to GitHub/GitLab.
2. In the Cloudflare dashboard: **Workers & Pages → Create → Pages →
   Connect to Git**, pick the repo.
3. Build settings: framework preset **Astro**, build command
   `npm run build`, output directory `dist`.
4. Set the production domain, then update `site` in `astro.config.mjs`
   so canonical URLs and the sitemap are correct.

Every push to `main` deploys automatically; PRs get preview deployments.

## Project docs

- `docs/architecture.md` — layers, calculator pattern, data flow
- `docs/decisions.md` — architecture decision records
- `docs/roadmap.md` — phases + clinical verification TODOs
