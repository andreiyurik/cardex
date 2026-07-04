<script lang="ts">
  /**
   * SYNTAX Score island — interactive coronary segment picker.
   * Renders UI only; all scoring comes from src/lib/calculators/syntax.ts.
   */
  import {
    applicableSegments,
    calculateSyntaxScore,
    type Dominance,
    type LesionInput,
    type SegmentId,
  } from '../../lib/calculators/syntax';
  import { CoronaryTree } from './syntax-tree';

  interface Props {
    // Localized strings passed from the Astro page (no hardcoded UI text).
    t: {
      dominance: string;
      dominanceRight: string;
      dominanceLeft: string;
      treeHint: string;
      selectedLesions: string;
      noLesions: string;
      totalOcclusion: string;
      remove: string;
      reset: string;
      score: string;
      riskLabel: string;
      risk: { low: string; intermediate: string; high: string };
      unverifiedBadge: string;
      unverifiedNote: string;
      segments: Record<SegmentId, string>;
    };
  }

  let { t }: Props = $props();

  let dominance = $state<Dominance>('right');
  // Map segment id → lesion (presence = marked). totalOcclusion toggled per lesion.
  let lesions = $state<Map<SegmentId, LesionInput>>(new Map());

  const available = $derived(new Set(applicableSegments(dominance)));

  const result = $derived(
    calculateSyntaxScore({
      dominance,
      lesions: [...lesions.values()].filter((l) => available.has(l.segmentId)),
    }),
  );

  const riskClass = $derived(
    result.risk === 'low'
      ? 'text-success'
      : result.risk === 'intermediate'
        ? 'text-warning'
        : 'text-error',
  );

  const selectedList = $derived(
    [...lesions.values()].filter((l) => available.has(l.segmentId)),
  );

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

  function setDominance(d: Dominance) {
    dominance = d;
  }
</script>

<div class="grid gap-6 lg:grid-cols-[1fr_20rem]">
  <!-- Diagram -->
  <div class="bg-base-200 border-base-300 rounded-box border p-4">
    <div class="mb-3 flex items-center justify-between gap-3">
      <div class="join">
        <button
          class="btn btn-sm join-item {dominance === 'right' ? 'btn-primary' : 'btn-ghost'}"
          onclick={() => setDominance('right')}>{t.dominanceRight}</button
        >
        <button
          class="btn btn-sm join-item {dominance === 'left' ? 'btn-primary' : 'btn-ghost'}"
          onclick={() => setDominance('left')}>{t.dominanceLeft}</button
        >
      </div>
      <span class="text-base-content/50 text-xs">{t.treeHint}</span>
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
          aria-label={t.segments[seg.id]}
        >
          <line
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            stroke-width={isMarked ? 8 : 6}
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
            r="11"
            class={isMarked ? 'fill-base-100' : 'fill-transparent'}
          />
          <text
            x={(seg.x1 + seg.x2) / 2}
            y={(seg.y1 + seg.y2) / 2}
            text-anchor="middle"
            dominant-baseline="central"
            class="fill-base-content pointer-events-none text-[9px] font-semibold"
          >
            {seg.label}
          </text>
        </g>
      {/each}
    </svg>
  </div>

  <!-- Result + selected lesions -->
  <div class="space-y-4">
    <div class="bg-base-200 border-base-300 rounded-box border p-4 text-center">
      <div class="text-base-content/60 text-xs uppercase tracking-wide">
        {t.score}
      </div>
      <div class="text-primary my-1 text-5xl font-bold tabular-nums">
        {result.score}
      </div>
      <div class="text-sm">
        <span class="text-base-content/60">{t.riskLabel}: </span>
        <span class="font-semibold {riskClass}">{t.risk[result.risk]}</span>
      </div>
    </div>

    <div
      class="border-warning/40 bg-warning/10 text-warning rounded-box border p-3 text-xs"
    >
      <div class="mb-1 font-semibold">⚠ {t.unverifiedBadge}</div>
      <p class="text-warning/80 leading-snug">{t.unverifiedNote}</p>
    </div>

    <div class="bg-base-200 border-base-300 rounded-box border p-4">
      <div class="mb-2 flex items-center justify-between">
        <span class="text-sm font-semibold">{t.selectedLesions}</span>
        {#if selectedList.length > 0}
          <button class="btn btn-ghost btn-xs" onclick={reset}>{t.reset}</button>
        {/if}
      </div>
      {#if selectedList.length === 0}
        <p class="text-base-content/50 text-sm">{t.noLesions}</p>
      {:else}
        <ul class="space-y-2">
          {#each selectedList as lesion (lesion.segmentId)}
            <li class="flex items-center justify-between gap-2 text-sm">
              <span class="min-w-0 flex-1 truncate" title={t.segments[lesion.segmentId]}>
                {t.segments[lesion.segmentId]}
              </span>
              <label class="flex shrink-0 items-center gap-1 text-xs">
                <input
                  type="checkbox"
                  class="checkbox checkbox-xs checkbox-error"
                  checked={lesion.totalOcclusion}
                  onchange={() => toggleOcclusion(lesion.segmentId)}
                />
                {t.totalOcclusion}
              </label>
              <button
                class="btn btn-ghost btn-xs"
                aria-label={t.remove}
                onclick={() => toggleSegment(lesion.segmentId)}>✕</button
              >
            </li>
          {/each}
        </ul>
      {/if}
    </div>
  </div>
</div>
