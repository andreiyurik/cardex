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

## ADR-008: A calculator is a typed data object (registry + two tiers)

**Context.** Writing each calculator as bespoke UI is expensive to
generate, drifts visually, and scatters clinical data across components.

**Decision.** Model every calculator as one `CalculatorDefinition` (pure
`compute`, `bands`, `provenance`, optional declarative `inputs`, golden
cases). A `registry` lists them; pages, the home catalog, the sitemap and
tests derive from it. Two tiers: **standard** calculators are rendered by
one generic form engine (`StandardCalculator.svelte`); **signature**
calculators get a bespoke island (SYNTAX).

**Consequences.** Adding a standard calculator = data only (no UI, no new
page files) → cheap to generate, no drift. Design effort concentrates on
a few signature calculators for differentiation. Slight indirection for
the generic engine — accepted.

## ADR-009: Provenance and verification are first-class

**Context.** For a medical tool, trust (correct numbers, known sources,
physician sign-off) matters more than features. It must be visible and
auditable.

**Decision.** Every definition carries `Provenance` (source citations with
DOI, formula `version`, `status` draft/physician-verified, optional
`reviewedBy`). Rendered server-side (`Provenance.astro`) for SEO and
no-JS users, and emitted into schema.org `citation`.

**Consequences.** The physician co-founder's sign-off becomes a visible
product asset and audit record; unverified calculators are clearly
flagged. Minor authoring overhead per calculator — the point of the tool.

## ADR-010: Units and validation live in the input schema

**Context.** Medical calculators fail on units (mg/dL vs µmol/L) and
implausible inputs.

**Decision.** `InputField` carries unit options (with canonical
conversions) and physiologic ranges. The generic engine converts to
canonical units and withholds a result for out-of-range/missing values —
once, for all standard calculators.

**Consequences.** Unit and range safety by construction, not re-coded per
calculator. Hard range validation may occasionally be stricter than
desired — revisit as soft warnings if needed.

## ADR-011: Golden cases as verification data + regression tests

**Context.** Clinical correctness is the core risk and needs a physician
sign-off artifact.

**Decision.** Attach `GoldenCase[]` (published reference results) to each
definition; a generic harness runs them through `compute()`. `verified`
cases are checkable sign-off; `placeholder` cases guard mechanics until
constants are verified.

**Consequences.** Verification and regression testing are the same
artifact. Placeholder cases must be replaced with real ones as clinical
values land (tracked in roadmap).

## ADR-012: Registry-driven dynamic routes

**Context.** Per-locale, per-calculator page files duplicate boilerplate
and grow linearly.

**Decision.** One dynamic route per locale
(`calculators/[slug].astro`) enumerates the registry via
`getStaticPaths`; SEO, schema.org and provenance derive from the
definition.

**Consequences.** Adding a calculator adds zero page files. Still fully
static (prerendered per slug). Two route files (ru/en) remain to keep ru
unprefixed under Astro i18n — acceptable.

## ADR-013: Offline-first (PWA) over the static site

**Context.** Clinicians often work without reliable signal (cath lab,
bedside). The site is fully static, so offline is nearly free.

**Decision.** A hand-written service worker (cache-first for hashed
assets, network-first with cache fallback for navigations) + web
manifest; registered in production only. No build-time precache manifest.

**Consequences.** Works offline after first visit; a genuine bedside
differentiator; survives content updates without a precache list. No
heavy PWA plugin dependency. SW disabled on localhost to avoid stale dev
caches.

## ADR-014: URL-encoded calculator state

**Context.** Sharing/bookmarking a filled calculation is useful and, for a
frontend-only app, must not require a backend.

**Decision.** Islands mirror input state to the URL query string and
restore from it on load.

**Consequences.** Shareable/bookmarkable calculations with zero backend;
also lays groundwork for the future report generator. State shape is
per-island (encoding owned by each island).
