# Architecture Decision Records

Short-form ADRs. Status of all: **accepted** (2026-07).

## ADR-001: Astro as the framework

**Context.** The product is a set of content-heavy calculator pages that
must rank in search (Russian medical queries) and load instantly; only
the calculator widgets are interactive.

**Decision.** Astro with static output (SSG) and the islands
architecture.

**Consequences.** Zero-JS static pages by default → best-in-class SEO and
performance; interactivity is opt-in per widget. SSR and API endpoints
can be enabled later per-route without changing frameworks.

## ADR-002: Svelte 5 islands for interactive widgets only

**Context.** Calculators need reactive state (tap a segment → score
updates). A full SPA framework for the whole site would hurt SEO/payload.

**Decision.** Svelte 5 (runes) + TypeScript via `@astrojs/svelte`,
mounted as islands only on calculator/viewer widgets.

**Consequences.** Smallest runtime among mainstream frameworks, fine-
grained reactivity (`$state`/`$derived`) maps naturally onto
"inputs → derived score". Static content stays HTML-only.

## ADR-003: Clinical logic as a pure TypeScript package

**Context.** Formulas, thresholds and interpretations are the product's
core asset and its main correctness risk. They must be testable,
reviewable by a physician in one place, and reusable outside the UI.

**Decision.** All clinical logic lives in `src/lib/calculators/` as pure,
typed functions with full Vitest coverage. Islands only call these
functions. Unverified clinical constants are explicitly marked
`TODO(clinical)`.

**Consequences.** Single source of truth; UI bugs cannot corrupt
formulas; the same functions can later power server-side report
generation or a mobile app. Slight indirection cost in simple cases —
accepted.

## ADR-004: Tailwind CSS 4 + DaisyUI as the single visual layer

**Context.** One design language must span Astro pages and Svelte
islands without duplicated styles.

**Decision.** Tailwind 4 via the official `@tailwindcss/vite` plugin
(note: the old `@astrojs/tailwind` integration is deprecated — the
CSS-first Tailwind 4 setup is the current official approach), DaisyUI
for components/theming, all tokens in one `global.css` (`@theme` +
custom DaisyUI theme).

**Consequences.** Tokens are shared by construction; islands and pages
cannot drift apart visually. DaisyUI gives accessible form controls for
free.

## ADR-005: Cloudflare Pages for hosting

**Context.** Need cheap, fast global hosting for a static site, with a
path to server functions later; audience is in RU/CIS.

**Decision.** Cloudflare Pages with the `@astrojs/cloudflare` adapter
installed from day one.

**Consequences.** Free tier covers the MVP; git-push deploys and PR
previews; when a backend is needed, individual routes can opt into
on-demand rendering on Workers without replatforming. Caveat: Workers
runtime (not Node) for future server code — acceptable, we have none yet.

## ADR-006: No backend at MVP

**Context.** All MVP features are deterministic calculations on
user-entered values. Accounts, storage and PDF export are v2 ideas.

**Decision.** Ship frontend-only. No database, no API, no auth.

**Consequences.** Radically less to build, secure and operate; no
patient data is transmitted or stored → minimal regulatory surface.
Revisit when features genuinely require persistence (ADR to be added).

## ADR-007: Astro built-in i18n (ru default, en secondary)

**Context.** Russian market first; English broadens reach and future
partnerships. UI text must not be hardcoded.

**Decision.** Astro's built-in i18n routing (`ru` unprefixed at `/`,
`en` under `/en/`) + typed dictionaries in `src/i18n/`.

**Consequences.** No extra dependency; per-locale static pages with
correct `hreflang`. Content pages are duplicated per locale (acceptable
at this scale; revisit with content collections if page count grows).
