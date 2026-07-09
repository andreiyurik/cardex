<script lang="ts">
  /**
   * SYNTAX Score island (signature tier) — interactive coronary tree +
   * per-lesion cards. Renders UI only; all scoring comes from the pure
   * functions in src/lib/calculators/syntax.ts. Bands, labels and
   * provenance come from the definition + i18n dictionaries.
   *
   * Interaction model: every segment belongs to at most one lesion.
   *  • tap an unassigned segment      → new lesion (selected)
   *  • tap a segment of another lesion → select that lesion
   *  • "Add segment" on a card         → next tapped segment joins it
   */
  import {
    applicableSegments,
    calculateSyntaxScore,
    newLesion,
    syntaxDefinition,
    type Dominance,
    type Lesion,
    type MedinaType,
    type SegmentId,
  } from '../../lib/calculators/syntax';
  import { bandFor } from '../../lib/calculators/types';
  import { useTranslations, type Locale } from '../../i18n';
  import { severityText, severityBorder } from './severity';
  import { readParams, writeParams, copyCurrentUrl } from './url-state';
  import { CoronaryTree, HEART_SILHOUETTE } from './syntax-tree';

  let { locale }: { locale: Locale } = $props();

  const t = useTranslations(locale);
  const ts = t.syntaxCalc;
  const bandsText = t.calculators.syntax.bands;

  let idCounter = 0;
  const genId = () => `l${++idCounter}`;

  // ── State ──────────────────────────────────────────────────────────
  function initialState(): { dominance: Dominance; lesions: Lesion[] } {
    const params = readParams();
    const dominance: Dominance = params.get('d') === 'left' ? 'left' : 'right';
    const applicable = new Set(applicableSegments(dominance));
    const lesions: Lesion[] = [];
    const raw = params.get('s');
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) {
          const used = new Set<SegmentId>();
          for (const item of parsed) {
            const l = sanitizeLesion(item, applicable, used);
            if (l) lesions.push(l);
          }
        }
      } catch {
        /* malformed share link — ignore */
      }
    }
    return { dominance, lesions };
  }

  /** Coerce an untrusted share-link object into a valid lesion (or null). */
  function sanitizeLesion(
    item: unknown,
    applicable: Set<SegmentId>,
    used: Set<SegmentId>,
  ): Lesion | null {
    if (!item || typeof item !== 'object') return null;
    const o = item as Record<string, unknown>;
    const segs = Array.isArray(o.segments) ? o.segments : [];
    const segments = segs.filter(
      (s): s is SegmentId =>
        typeof s === 'string' &&
        applicable.has(s as SegmentId) &&
        !used.has(s as SegmentId),
    );
    if (segments.length === 0) return null;
    segments.forEach((s) => used.add(s));

    const l = newLesion(genId(), segments[0]);
    l.segments = segments;
    l.occlusion = !!o.occlusion;
    if (l.occlusion && o.totalOcclusion && typeof o.totalOcclusion === 'object') {
      const to = o.totalOcclusion as Record<string, unknown>;
      l.totalOcclusion = {
        ageOver3moOrUnknown: !!to.ageOver3moOrUnknown,
        bluntStump: !!to.bluntStump,
        bridgingCollaterals: !!to.bridgingCollaterals,
        nonVisibleSegments: clampInt(to.nonVisibleSegments, 0, 9),
        sideBranchAtOcclusion: !!to.sideBranchAtOcclusion,
      };
    }
    if (o.bifurcation && typeof o.bifurcation === 'object') {
      const b = o.bifurcation as Record<string, unknown>;
      if (typeof b.medina === 'string' && /^[01]{3}$/.test(b.medina) && b.medina !== '000') {
        l.bifurcation = {
          medina: b.medina as MedinaType,
          angulationUnder70: !!b.angulationUnder70,
        };
      }
    }
    l.trifurcationDiseased = clampInt(o.trifurcationDiseased, 0, 4) as Lesion['trifurcationDiseased'];
    l.aortoOstial = !!o.aortoOstial;
    l.severeTortuosity = !!o.severeTortuosity;
    l.lengthOver20mm = !!o.lengthOver20mm;
    l.heavyCalcification = !!o.heavyCalcification;
    l.thrombus = !!o.thrombus;
    l.diffuseSegments = clampInt(o.diffuseSegments, 0, 9);
    return l;
  }

  function clampInt(v: unknown, min: number, max: number): number {
    const n = Math.floor(Number(v));
    if (!Number.isFinite(n)) return min;
    return Math.min(max, Math.max(min, n));
  }

  const init = initialState();
  let dominance = $state<Dominance>(init.dominance);
  let lesions = $state<Lesion[]>(init.lesions);
  let selectedId = $state<string | null>(init.lesions.at(-1)?.id ?? null);
  let addingTo = $state<string | null>(null);

  const available = $derived(new Set(applicableSegments(dominance)));

  // Defensive: only score segments applicable to the current dominance.
  const scored = $derived(
    calculateSyntaxScore({
      dominance,
      lesions: lesions
        .map((l) => ({ ...l, segments: l.segments.filter((s) => available.has(s)) }))
        .filter((l) => l.segments.length > 0),
    }),
  );
  const band = $derived(bandFor(scored.score, syntaxDefinition.bands));

  const lesionOf = $derived.by(() => {
    const map = new Map<SegmentId, { lesion: Lesion; index: number }>();
    lesions.forEach((lesion, index) => {
      lesion.segments.forEach((s) => map.set(s, { lesion, index }));
    });
    return map;
  });

  const isDraft = syntaxDefinition.provenance.status === 'draft';

  // ── URL sync ───────────────────────────────────────────────────────
  $effect(() => {
    const params = new URLSearchParams();
    if (dominance !== 'right') params.set('d', dominance);
    if (lesions.length > 0) {
      params.set(
        's',
        JSON.stringify(
          lesions.map((l) => {
            const { id, ...rest } = l;
            return rest;
          }),
        ),
      );
    }
    writeParams(params);
  });

  // ── Diagram interaction ────────────────────────────────────────────
  function onSegmentTap(id: SegmentId) {
    if (!available.has(id)) return;
    const owner = lesionOf.get(id)?.lesion;

    if (addingTo) {
      const target = lesions.find((l) => l.id === addingTo);
      if (!target) {
        addingTo = null;
        return;
      }
      if (owner?.id === target.id) {
        if (target.segments.length > 1) {
          patch(target.id, { segments: target.segments.filter((s) => s !== id) });
        }
        return;
      }
      if (owner) return; // belongs to another lesion — leave it be
      patch(target.id, { segments: [...target.segments, id] });
      return;
    }

    if (owner) {
      selectedId = owner.id;
      return;
    }
    const l = newLesion(genId(), id);
    lesions = [...lesions, l];
    selectedId = l.id;
  }

  // ── Lesion mutations ───────────────────────────────────────────────
  function patch(id: string, changes: Partial<Lesion>) {
    lesions = lesions.map((l) => (l.id === id ? { ...l, ...changes } : l));
  }

  function removeLesion(id: string) {
    lesions = lesions.filter((l) => l.id !== id);
    if (selectedId === id) selectedId = lesions.at(-1)?.id ?? null;
    if (addingTo === id) addingTo = null;
  }

  function setOcclusion(l: Lesion, occ: boolean) {
    patch(
      l.id,
      occ
        ? {
            occlusion: true,
            totalOcclusion: l.totalOcclusion ?? {
              ageOver3moOrUnknown: false,
              bluntStump: false,
              bridgingCollaterals: false,
              nonVisibleSegments: 0,
              sideBranchAtOcclusion: false,
            },
          }
        : { occlusion: false },
    );
  }

  function patchTO(l: Lesion, changes: Partial<NonNullable<Lesion['totalOcclusion']>>) {
    const base = l.totalOcclusion ?? {
      ageOver3moOrUnknown: false,
      bluntStump: false,
      bridgingCollaterals: false,
      nonVisibleSegments: 0,
      sideBranchAtOcclusion: false,
    };
    patch(l.id, { totalOcclusion: { ...base, ...changes } });
  }

  function medinaBit(l: Lesion, pos: 0 | 1 | 2): boolean {
    return l.bifurcation ? l.bifurcation.medina[pos] === '1' : false;
  }

  function toggleMedina(l: Lesion, pos: 0 | 1 | 2) {
    const bits = [medinaBit(l, 0), medinaBit(l, 1), medinaBit(l, 2)];
    bits[pos] = !bits[pos];
    const code = bits.map((b) => (b ? '1' : '0')).join('');
    if (code === '000') {
      patch(l.id, { bifurcation: null });
    } else {
      patch(l.id, {
        bifurcation: {
          medina: code as MedinaType,
          angulationUnder70: l.bifurcation?.angulationUnder70 ?? false,
        },
      });
    }
  }

  function stepTO(l: Lesion, delta: number) {
    const cur = l.totalOcclusion?.nonVisibleSegments ?? 0;
    patchTO(l, { nonVisibleSegments: Math.min(9, Math.max(0, cur + delta)) });
  }

  function stepDiffuse(l: Lesion, delta: number) {
    patch(l.id, { diffuseSegments: Math.min(9, Math.max(0, l.diffuseSegments + delta)) });
  }

  function toggleAddMode(id: string) {
    addingTo = addingTo === id ? null : id;
    if (addingTo) selectedId = id;
  }

  function reset() {
    lesions = [];
    selectedId = null;
    addingTo = null;
  }

  function adverseCount(l: Lesion): number {
    return scored.lesions.find((s) => s.id === l.id)?.adverse ?? 0;
  }
  function lesionPoints(l: Lesion): number {
    return scored.lesions.find((s) => s.id === l.id)?.points ?? 0;
  }

  let copied = $state(false);
  async function share() {
    copied = await copyCurrentUrl();
    if (copied) setTimeout(() => (copied = false), 2000);
  }

  const trifOptions = [1, 2, 3, 4] as const;
  const medinaPositions = [
    { pos: 0 as const, key: 'medinaProximal' as const },
    { pos: 1 as const, key: 'medinaDistal' as const },
    { pos: 2 as const, key: 'medinaSide' as const },
  ];
</script>

<div class="grid gap-6 lg:grid-cols-[1fr_22rem]">
  <!-- Diagram -->
  <div class="bg-base-200 border-base-300 rounded-box border p-4">
    <div class="mb-3 space-y-2">
      <div class="join grid grid-cols-2 sm:inline-flex">
        <button
          class="btn join-item {dominance === 'right' ? 'btn-primary' : 'btn-ghost'}"
          onclick={() => (dominance = 'right')}>{ts.dominanceRight}</button
        >
        <button
          class="btn join-item {dominance === 'left' ? 'btn-primary' : 'btn-ghost'}"
          onclick={() => (dominance = 'left')}>{ts.dominanceLeft}</button
        >
      </div>
      <p class="text-base-content/50 text-xs">
        {addingTo ? ts.treeHintActive : ts.treeHint}
      </p>
    </div>

    <svg
      viewBox="0 28 400 286"
      class="h-auto w-full select-none"
      role="group"
      aria-label="Coronary segment diagram"
    >
      <defs>
        <radialGradient id="heartFill" cx="46%" cy="36%" r="72%">
          <stop offset="0%" stop-color="var(--color-base-300)" stop-opacity="0.7" />
          <stop offset="100%" stop-color="var(--color-base-300)" stop-opacity="0.18" />
        </radialGradient>
        <linearGradient id="vessel" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="var(--color-base-content)" stop-opacity="0.44" />
          <stop offset="100%" stop-color="var(--color-base-content)" stop-opacity="0.22" />
        </linearGradient>
        <filter id="lesionGlow" x="-60%" y="-60%" width="220%" height="220%">
          <feGaussianBlur stdDeviation="3.2" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
      </defs>

      <!-- Myocardium silhouette behind the vessels (decorative). -->
      <path
        d={HEART_SILHOUETTE}
        fill="url(#heartFill)"
        stroke="var(--color-base-300)"
        stroke-width="1.5"
        stroke-opacity="0.6"
      />

      {#each CoronaryTree as seg (seg.id)}
        {@const isAvailable = available.has(seg.id)}
        {@const owner = lesionOf.get(seg.id)}
        {@const isMarked = isAvailable && !!owner}
        {@const isSelected = isMarked && owner?.lesion.id === selectedId}
        <g
          class={isAvailable ? 'cursor-pointer' : 'pointer-events-none opacity-15'}
          onclick={() => onSegmentTap(seg.id)}
          onkeydown={(e) => e.key === 'Enter' && onSegmentTap(seg.id)}
          role="button"
          tabindex={isAvailable ? 0 : -1}
          aria-pressed={isMarked}
          aria-label={ts.segments[seg.id]}
        >
          <!-- Invisible fat hit area for comfortable thumb tapping on mobile. -->
          <path d={seg.d} fill="none" stroke="transparent" stroke-width="28" stroke-linecap="round" />
          <!-- Vessel: gradient when idle; colored + glow when a lesion sits on it. -->
          <path
            d={seg.d}
            fill="none"
            stroke-linecap="round"
            stroke-linejoin="round"
            stroke-width={isMarked ? seg.width + 1.5 : seg.width}
            stroke={isMarked ? undefined : 'url(#vessel)'}
            filter={isMarked ? 'url(#lesionGlow)' : undefined}
            class={isMarked
              ? owner?.lesion.occlusion
                ? 'stroke-error'
                : 'stroke-warning'
              : 'transition-[stroke] hover:stroke-primary/70'}
          />
          <circle
            cx={seg.lx}
            cy={seg.ly}
            r={isSelected ? 10.5 : 9.5}
            class={isSelected
              ? 'fill-base-100 stroke-primary'
              : isMarked
                ? 'fill-base-100 stroke-base-content/20'
                : 'fill-base-200/90 stroke-base-content/15'}
            stroke-width={isSelected ? 2.5 : 1}
          />
          <text
            x={seg.lx}
            y={seg.ly}
            text-anchor="middle"
            dominant-baseline="central"
            class="fill-base-content pointer-events-none text-[10px] font-semibold"
          >
            {seg.label}
          </text>
        </g>
      {/each}
    </svg>
  </div>

  <!-- Result + lesion cards -->
  <div class="space-y-4">
    <div class="bg-base-200 rounded-box border p-4 text-center {severityBorder(band.severity)}">
      <div class="text-base-content/60 text-xs uppercase tracking-wide">
        {t.calculators.syntax.title}
      </div>
      <div class="text-primary my-1 text-5xl font-bold tabular-nums">
        {scored.score}
      </div>
      <div class="text-sm">
        <span class="text-base-content/60">{t.calc.category}: </span>
        <span class="font-semibold {severityText(band.severity)}"
          >{bandsText[band.id as 'low' | 'intermediate' | 'high'].label}</span
        >
      </div>
      <p class="text-base-content/60 mt-2 text-xs leading-snug">
        {bandsText[band.id as 'low' | 'intermediate' | 'high'].summary}
      </p>
    </div>

    {#if isDraft}
      <div class="border-warning/40 bg-warning/10 text-warning rounded-box border p-3 text-xs">
        <div class="mb-1 font-semibold">⚠ {t.calc.onReview}</div>
        <p class="text-warning/80 leading-snug">{t.calc.draftNote}</p>
      </div>
    {/if}

    <div class="bg-base-200 border-base-300 rounded-box border p-4">
      <div class="mb-3 flex items-center justify-between">
        <span class="text-sm font-semibold">{ts.lesionsTitle}</span>
        <div class="flex gap-1">
          <button class="btn btn-ghost btn-xs" onclick={share}>
            {copied ? t.calc.shared : t.calc.share}
          </button>
          {#if lesions.length > 0}
            <button class="btn btn-ghost btn-xs" onclick={reset}>{t.calc.reset}</button>
          {/if}
        </div>
      </div>

      {#if lesions.length === 0}
        <p class="text-base-content/50 text-sm">{ts.noLesions}</p>
      {:else}
        <div class="space-y-3">
          {#each lesions as lesion, i (lesion.id)}
            {@const selected = lesion.id === selectedId}
            <div
              class="rounded-box border p-3 transition-colors {selected
                ? 'border-primary/60 bg-base-100'
                : 'border-base-300 bg-base-100/40'}"
            >
              <!-- Header -->
              <div class="flex items-center justify-between gap-2">
                <button
                  class="min-w-0 flex-1 text-left"
                  onclick={() => (selectedId = lesion.id)}
                >
                  <span class="text-sm font-semibold">{ts.lesionLabel} {i + 1}</span>
                  <span class="text-base-content/50 ml-1 text-xs">
                    {lesion.segments.map((s) => ts.segments[s]).join(' · ')}
                  </span>
                </button>
                <span class="badge badge-sm badge-primary tabular-nums shrink-0">
                  {lesionPoints(lesion)}
                </span>
                <button
                  class="btn btn-ghost btn-xs btn-square shrink-0"
                  aria-label={ts.removeLesion}
                  onclick={() => removeLesion(lesion.id)}>✕</button
                >
              </div>

              <!-- Severity -->
              <div class="mt-2">
                <div class="join w-full">
                  <button
                    class="btn btn-sm join-item flex-1 {!lesion.occlusion
                      ? 'btn-warning'
                      : 'btn-ghost'}"
                    onclick={() => setOcclusion(lesion, false)}>{ts.stenosis}</button
                  >
                  <button
                    class="btn btn-sm join-item flex-1 {lesion.occlusion
                      ? 'btn-error'
                      : 'btn-ghost'}"
                    onclick={() => setOcclusion(lesion, true)}>{ts.occlusion}</button
                  >
                </div>
              </div>

              <!-- Add / remove segment -->
              <button
                class="btn btn-ghost btn-xs mt-2 w-full {addingTo === lesion.id
                  ? 'text-primary'
                  : ''}"
                onclick={() => toggleAddMode(lesion.id)}
              >
                {addingTo === lesion.id ? ts.addSegmentActive : `+ ${ts.addSegment}`}
              </button>

              <!-- Characteristics -->
              <details class="mt-1">
                <summary class="cursor-pointer list-none text-xs font-medium text-base-content/70 py-1">
                  {ts.characteristics}
                  {#if adverseCount(lesion) > 0}
                    <span class="badge badge-xs badge-ghost ml-1">+{adverseCount(lesion)}</span>
                  {/if}
                </summary>

                <div class="mt-2 space-y-3 text-xs">
                  {#if lesion.occlusion}
                    <fieldset class="border-base-300 rounded-md border p-2">
                      <legend class="px-1 font-medium">{ts.toTitle}</legend>
                      <div class="space-y-1.5">
                        <label class="flex items-center gap-2">
                          <input type="checkbox" class="checkbox checkbox-xs"
                            checked={lesion.totalOcclusion?.ageOver3moOrUnknown ?? false}
                            onchange={(e) => patchTO(lesion, { ageOver3moOrUnknown: e.currentTarget.checked })} />
                          {ts.toAge}
                        </label>
                        <label class="flex items-center gap-2">
                          <input type="checkbox" class="checkbox checkbox-xs"
                            checked={lesion.totalOcclusion?.bluntStump ?? false}
                            onchange={(e) => patchTO(lesion, { bluntStump: e.currentTarget.checked })} />
                          {ts.toBluntStump}
                        </label>
                        <label class="flex items-center gap-2">
                          <input type="checkbox" class="checkbox checkbox-xs"
                            checked={lesion.totalOcclusion?.bridgingCollaterals ?? false}
                            onchange={(e) => patchTO(lesion, { bridgingCollaterals: e.currentTarget.checked })} />
                          {ts.toBridging}
                        </label>
                        <label class="flex items-center gap-2">
                          <input type="checkbox" class="checkbox checkbox-xs"
                            checked={lesion.totalOcclusion?.sideBranchAtOcclusion ?? false}
                            onchange={(e) => patchTO(lesion, { sideBranchAtOcclusion: e.currentTarget.checked })} />
                          {ts.toSideBranch}
                        </label>
                        <div class="flex items-center justify-between gap-2 pt-0.5">
                          <span class="min-w-0 flex-1">
                            {ts.toNonVisible}
                            <span class="text-base-content/40 block">{ts.toNonVisibleHint}</span>
                          </span>
                          <div class="join shrink-0">
                            <button class="btn btn-xs join-item" onclick={() => stepTO(lesion, -1)} aria-label="−">−</button>
                            <span class="btn btn-xs join-item pointer-events-none tabular-nums">{lesion.totalOcclusion?.nonVisibleSegments ?? 0}</span>
                            <button class="btn btn-xs join-item" onclick={() => stepTO(lesion, 1)} aria-label="+">+</button>
                          </div>
                        </div>
                      </div>
                    </fieldset>
                  {/if}

                  <!-- Bifurcation -->
                  <fieldset class="border-base-300 rounded-md border p-2">
                    <legend class="px-1 font-medium">{ts.bifurcation}</legend>
                    <p class="text-base-content/40 mb-1.5">{ts.medinaHint}</p>
                    <div class="space-y-1.5">
                      {#each medinaPositions as mp (mp.pos)}
                        <label class="flex items-center gap-2">
                          <input type="checkbox" class="checkbox checkbox-xs"
                            checked={medinaBit(lesion, mp.pos)}
                            onchange={() => toggleMedina(lesion, mp.pos)} />
                          {ts[mp.key]}
                        </label>
                      {/each}
                      {#if lesion.bifurcation}
                        <label class="flex items-center gap-2 pt-0.5">
                          <input type="checkbox" class="checkbox checkbox-xs"
                            checked={lesion.bifurcation.angulationUnder70}
                            onchange={(e) => patch(lesion.id, { bifurcation: { medina: lesion.bifurcation!.medina, angulationUnder70: e.currentTarget.checked } })} />
                          {ts.angulation}
                        </label>
                      {/if}
                    </div>
                  </fieldset>

                  <!-- Trifurcation -->
                  <div>
                    <span class="mb-1 block font-medium">{ts.trifurcation}</span>
                    <div class="join">
                      <button
                        class="btn btn-xs join-item {lesion.trifurcationDiseased === 0 ? 'btn-primary' : 'btn-ghost'}"
                        onclick={() => patch(lesion.id, { trifurcationDiseased: 0 })}>{ts.trifNone}</button
                      >
                      {#each trifOptions as n (n)}
                        <button
                          class="btn btn-xs join-item {lesion.trifurcationDiseased === n ? 'btn-primary' : 'btn-ghost'}"
                          onclick={() => patch(lesion.id, { trifurcationDiseased: n })}>{n}</button
                        >
                      {/each}
                    </div>
                  </div>

                  <!-- Other adverse characteristics -->
                  <div class="space-y-1.5">
                    <label class="flex items-center gap-2">
                      <input type="checkbox" class="checkbox checkbox-xs"
                        checked={lesion.aortoOstial}
                        onchange={(e) => patch(lesion.id, { aortoOstial: e.currentTarget.checked })} />
                      {ts.aortoOstial}
                    </label>
                    <label class="flex items-center gap-2">
                      <input type="checkbox" class="checkbox checkbox-xs"
                        checked={lesion.severeTortuosity}
                        onchange={(e) => patch(lesion.id, { severeTortuosity: e.currentTarget.checked })} />
                      {ts.tortuosity}
                    </label>
                    <label class="flex items-center gap-2">
                      <input type="checkbox" class="checkbox checkbox-xs"
                        checked={lesion.lengthOver20mm}
                        onchange={(e) => patch(lesion.id, { lengthOver20mm: e.currentTarget.checked })} />
                      {ts.length}
                    </label>
                    <label class="flex items-center gap-2">
                      <input type="checkbox" class="checkbox checkbox-xs"
                        checked={lesion.heavyCalcification}
                        onchange={(e) => patch(lesion.id, { heavyCalcification: e.currentTarget.checked })} />
                      {ts.calcification}
                    </label>
                    <label class="flex items-center gap-2">
                      <input type="checkbox" class="checkbox checkbox-xs"
                        checked={lesion.thrombus}
                        onchange={(e) => patch(lesion.id, { thrombus: e.currentTarget.checked })} />
                      {ts.thrombus}
                    </label>
                    <div class="flex items-center justify-between gap-2 pt-0.5">
                      <span class="min-w-0 flex-1">
                        {ts.diffuse}
                        <span class="text-base-content/40 block">{ts.diffuseHint}</span>
                      </span>
                      <div class="join shrink-0">
                        <button class="btn btn-xs join-item" onclick={() => stepDiffuse(lesion, -1)} aria-label="−">−</button>
                        <span class="btn btn-xs join-item pointer-events-none tabular-nums">{lesion.diffuseSegments}</span>
                        <button class="btn btn-xs join-item" onclick={() => stepDiffuse(lesion, 1)} aria-label="+">+</button>
                      </div>
                    </div>
                  </div>
                </div>
              </details>
            </div>
          {/each}
        </div>
      {/if}
    </div>
  </div>
</div>
