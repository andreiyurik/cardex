# Roadmap

## Phase 0 — Foundation (this repo state)

- [x] Docs: architecture, ADRs, roadmap
- [x] Astro + Svelte 5 + Tailwind 4 + DaisyUI + Lucide + sitemap +
      Cloudflare adapter + Vitest
- [x] i18n routing ru/en, locale dictionaries, design tokens,
      SEO layout + schema.org helper, shared header/footer
- [x] `HeartViewer.svelte` stub (empty `<model-viewer>` wrapper, v2)

## Phase 1 — SYNTAX Score (reference vertical slice)

- [x] `src/lib/calculators/syntax.ts` — pure scoring function +
      interpretation (low / intermediate / high at 22 / 33) + Vitest
- [x] Static SEO pages (ru/en) with schema.org
- [x] Svelte island: interactive 2D SVG coronary tree
- [ ] **Clinical verification by practicing physician** (see below)

## Phase 2 — Risk calculators

- GRACE 2.0 (ACS risk)
- Mehran (contrast-induced nephropathy)
- PRECISE-DAPT (bleeding on DAPT)

Each follows the SYNTAX pattern: pure function + tests → static page →
island. Clinical constants enter the codebase only from primary sources,
verified by the physician co-founder.

## Phase 3 — Report generator

- Structured PCI report/conclusion builder reusing calculator results.
- Still frontend-only (print/PDF in browser) until persistence is needed.

## Phase 4 (v2) — Education & 3D

- 3D heart/coronary viewer (open-source models, `<model-viewer>` /
  Three.js — decide in a dedicated ADR). `HeartViewer.svelte` stub
  already reserves the slot.
- Educational content, case library.
- Backend (accounts, saved reports) — only if product traction demands.

---

## TODO(clinical) — items requiring physician verification

Single tracking list; every item is also marked in code with
`TODO(clinical)`.

1. **SYNTAX segment weights** (`syntax.ts` → `DEFAULT_SEGMENT_WEIGHTS`):
   all weights are `1` placeholders. Fill per-segment Leaman-based
   weights for right- and left-dominant systems from the official SYNTAX
   Score definition.
2. **SYNTAX lesion multipliers** (`syntax.ts` → `SCORING`):
   placeholder ×2 (non-occlusive) / ×5 (total occlusion) multipliers —
   verify against the official algorithm.
3. **SYNTAX adverse lesion characteristics**: the official score adds
   points for bifurcation/trifurcation, aorto-ostial lesion, severe
   tortuosity, length > 20 mm, heavy calcification, thrombus, diffuse
   disease, and total-occlusion details (age, blunt stump, bridging
   collaterals, first-segment-visualized, side-branch involvement).
   Currently NOT modeled — decide with the physician which to include
   and with what point values.
4. **Segment list completeness**: current tree uses 16 core segments
   (1–16). The official SYNTAX chart also includes subsegments
   16a/16b/16c, 9a, 10a, 12a, 12b, 14a, 14b — confirm the target set
   and dominance-dependent applicability of each.
5. **Interpretation thresholds** (≤22 low, 23–32 intermediate, ≥33
   high) — confirm wording of clinical recommendations shown to users
   (currently descriptive only, no treatment advice).
6. **Disclaimer text** (ru/en) — review medico-legal wording.
