<script lang="ts">
  /**
   * SYNTAX Score island (signature tier) — interactive coronary segment
   * picker. Renders UI only; all scoring comes from the pure functions in
   * src/lib/calculators/syntax.ts. Bands, labels and provenance come from
   * the definition + i18n dictionaries.
   */
  import {
    applicableSegments,
    calculateSyntaxScore,
    syntaxDefinition,
    type Dominance,
    type LesionInput,
    type SegmentId,
  } from '../../lib/calculators/syntax';
  import { bandFor } from '../../lib/calculators/types';
  import { useTranslations, type Locale } from '../../i18n';
  import { severityText, severityBorder } from './severity';
  import { readParams, writeParams, copyCurrentUrl } from './url-state';
  import { CoronaryTree } from './syntax-tree';

  let { locale }: { locale: Locale } = $props();

  const t = useTranslations(locale);
  const ts = t.syntaxCalc;
  const bandsText = t.calculators.syntax.bands;

  function initialState(): { dominance: Dominance; lesions: Map<SegmentId, LesionInput> } {
    const params = readParams();
    const dominance: Dominance = params.get('d') === 'left' ? 'left' : 'right';
    const lesions = new Map<SegmentId, LesionInput>();
    const raw = params.get('l');
    if (raw) {
      for (const token of raw.split(',')) {
        const totalOcclusion = token.endsWith('!');
        const id = (totalOcclusion ? token.slice(0, -1) : token) as SegmentId;
        if (CoronaryTree.some((s) => s.id === id)) {
          lesions.set(id, { segmentId: id, totalOcclusion });
        }
      }
    }
    return { dominance, lesions };
  }

  const init = initialState();
  let dominance = $state<Dominance>(init.dominance);
  let lesions = $state<Map<SegmentId, LesionInput>>(init.lesions);

  const available = $derived(new Set(applicableSegments(dominance)));

  const result = $derived(
    calculateSyntaxScore({
      dominance,
      lesions: [...lesions.values()].filter((l) => available.has(l.segmentId)),
    }),
  );

  const band = $derived(bandFor(result.score, syntaxDefinition.bands));
  const selectedList = $derived(
    [...lesions.values()].filter((l) => available.has(l.segmentId)),
  );

  const isDraft = syntaxDefinition.provenance.status === 'draft';
  const hasPlaceholders = syntaxDefinition.goldenCases.some((c) => c.status === 'placeholder');

  $effect(() => {
    const params = new URLSearchParams();
    if (dominance !== 'right') params.set('d', dominance);
    const active = selectedList
      .map((l) => `${l.segmentId}${l.totalOcclusion ? '!' : ''}`)
      .join(',');
    if (active) params.set('l', active);
    writeParams(params);
  });

  function toggleSegment(id: SegmentId) {
    if (!available.has(id)) return;
    const next = new Map(lesions);
    if (next.has(id)) next.delete(id);
    else next.set(id, { segmentId: id, totalOcclusion: false });
    lesions = next;
  }

  function toggleOcclusion(id: SegmentId) {
    const current = lesions.get(id);
    if (!current) return;
    const next = new Map(lesions);
    next.set(id, { ...current, totalOcclusion: !current.totalOcclusion });
    lesions = next;
  }

  function reset() {
    lesions = new Map();
  }

  let copied = $state(false);
  async function share() {
    copied = await copyCurrentUrl();
    if (copied) setTimeout(() => (copied = false), 2000);
  }
</script>

<div class="grid gap-6 lg:grid-cols-[1fr_20rem]">
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
      <p class="text-base-content/50 text-xs">{ts.treeHint}</p>
    </div>

    <svg
      viewBox="0 0 400 320"
      class="h-auto w-full select-none"
      role="group"
      aria-label="Coronary segment diagram"
    >
      {#each CoronaryTree as seg (seg.id)}
        {@const isAvailable = available.has(seg.id)}
        {@const lesion = lesions.get(seg.id)}
        {@const isMarked = isAvailable && !!lesion}
        <g
          class={isAvailable ? 'cursor-pointer' : 'pointer-events-none opacity-20'}
          onclick={() => toggleSegment(seg.id)}
          onkeydown={(e) => e.key === 'Enter' && toggleSegment(seg.id)}
          role="button"
          tabindex={isAvailable ? 0 : -1}
          aria-pressed={isMarked}
          aria-label={ts.segments[seg.id]}
        >
          <!-- Invisible fat hit area for comfortable thumb tapping on mobile. -->
          <line
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            stroke="transparent"
            stroke-width="30"
            stroke-linecap="round"
          />
          <line
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            stroke-width={isMarked ? 9 : 7}
            stroke-linecap="round"
            class={isMarked
              ? lesion?.totalOcclusion
                ? 'stroke-error'
                : 'stroke-warning'
              : 'stroke-base-content/30 hover:stroke-primary/60'}
          />
          <circle
            cx={(seg.x1 + seg.x2) / 2}
            cy={(seg.y1 + seg.y2) / 2}
            r="13"
            class={isMarked ? 'fill-base-100' : 'fill-transparent'}
          />
          <text
            x={(seg.x1 + seg.x2) / 2}
            y={(seg.y1 + seg.y2) / 2}
            text-anchor="middle"
            dominant-baseline="central"
            class="fill-base-content pointer-events-none text-[11px] font-semibold"
          >
            {seg.label}
          </text>
        </g>
      {/each}
    </svg>
  </div>

  <!-- Result + selected lesions -->
  <div class="space-y-4">
    <div class="bg-base-200 rounded-box border p-4 text-center {severityBorder(band.severity)}">
      <div class="text-base-content/60 text-xs uppercase tracking-wide">
        {t.calculators.syntax.title}
      </div>
      <div class="text-primary my-1 text-5xl font-bold tabular-nums">
        {result.score}
      </div>
      <div class="text-sm">
        <span class="text-base-content/60">{t.calc.category}: </span>
        <span class="font-semibold {severityText(band.severity)}">{bandsText[band.id as 'low' | 'intermediate' | 'high'].label}</span>
      </div>
      <p class="text-base-content/60 mt-2 text-xs leading-snug">
        {bandsText[band.id as 'low' | 'intermediate' | 'high'].summary}
      </p>
    </div>

    {#if isDraft}
      <div class="border-warning/40 bg-warning/10 text-warning rounded-box border p-3 text-xs">
        <div class="mb-1 font-semibold">
          ⚠ {hasPlaceholders ? t.calc.notForClinicalUse : t.calc.onReview}
        </div>
        <p class="text-warning/80 leading-snug">
          {hasPlaceholders ? t.calc.unverifiedNote : t.calc.draftNote}
        </p>
      </div>
    {/if}

    <div class="bg-base-200 border-base-300 rounded-box border p-4">
      <div class="mb-2 flex items-center justify-between">
        <span class="text-sm font-semibold">{ts.selectedLesions}</span>
        <div class="flex gap-1">
          <button class="btn btn-ghost btn-xs" onclick={share}>
            {copied ? t.calc.shared : t.calc.share}
          </button>
          {#if selectedList.length > 0}
            <button class="btn btn-ghost btn-xs" onclick={reset}>{t.calc.reset}</button>
          {/if}
        </div>
      </div>
      {#if selectedList.length === 0}
        <p class="text-base-content/50 text-sm">{ts.noLesions}</p>
      {:else}
        <ul class="divide-base-300/60 divide-y">
          {#each selectedList as lesion (lesion.segmentId)}
            <li class="flex flex-col gap-1.5 py-2 first:pt-0 last:pb-0">
              <div class="flex items-center justify-between gap-2">
                <span class="min-w-0 flex-1 text-sm">{ts.segments[lesion.segmentId]}</span>
                <button
                  class="btn btn-ghost btn-sm btn-square shrink-0"
                  aria-label={ts.remove}
                  onclick={() => toggleSegment(lesion.segmentId)}>✕</button
                >
              </div>
              <label class="flex items-center gap-2 text-xs">
                <input
                  type="checkbox"
                  class="checkbox checkbox-sm checkbox-error"
                  checked={lesion.totalOcclusion}
                  onchange={() => toggleOcclusion(lesion.segmentId)}
                />
                {ts.totalOcclusion}
              </label>
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</div>
