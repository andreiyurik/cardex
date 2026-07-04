<script lang="ts">
  /**
   * Generic standard-tier calculator engine. Renders a form from a
   * CalculatorDefinition's declarative input schema, converts inputs to
   * canonical units, validates ranges, and calls the pure compute().
   * Adding a standard calculator requires NO new UI code — just data.
   *
   * The definition is looked up from the registry by slug (its compute
   * and unit-conversion functions can't cross the island prop boundary,
   * which only carries JSON).
   */
  import { getCalculator } from '../../lib/calculators/registry';
  import { bandFor, type NumberField, type StandardInput } from '../../lib/calculators/types';
  import { useTranslations, type Locale } from '../../i18n';
  import { severityText, severityBorder } from './severity';
  import { readParams, writeParams, copyCurrentUrl } from './url-state';

  let { slug, locale }: { slug: string; locale: Locale } = $props();

  const def = getCalculator(slug);
  const t = useTranslations(locale);
  const tc = (t.calculators as Record<string, any>)[def.i18nKey];
  const fields = def.inputs ?? [];

  type FieldState = { value: string; unit: string };

  function initialState(): Record<string, FieldState> {
    const params = readParams();
    const state: Record<string, FieldState> = {};
    for (const f of fields) {
      const fromUrl = params.get(f.id);
      if (f.kind === 'number') {
        const unitId = params.get(`${f.id}__u`) ?? f.units?.[0]?.id ?? '';
        const canonical = def.defaultInput[f.id];
        const unit = f.units?.find((u) => u.id === unitId) ?? f.units?.[0];
        const shown =
          canonical != null
            ? unit
              ? unit.fromCanonical(Number(canonical))
              : Number(canonical)
            : '';
        state[f.id] = { value: fromUrl ?? String(shown), unit: unitId };
      } else if (f.kind === 'select') {
        state[f.id] = { value: fromUrl ?? String(def.defaultInput[f.id] ?? f.options[0].id), unit: '' };
      } else {
        const dflt = def.defaultInput[f.id] ? 'true' : 'false';
        state[f.id] = { value: fromUrl ?? dflt, unit: '' };
      }
    }
    return state;
  }

  let state = $state<Record<string, FieldState>>(initialState());

  // Canonical input record, or null if any required field is missing/invalid.
  const canonical = $derived.by<StandardInput | null>(() => {
    const out: StandardInput = {};
    for (const f of fields) {
      const st = state[f.id];
      if (f.kind === 'number') {
        if (st.value.trim() === '') {
          if (f.required) return null;
          continue;
        }
        const n = Number(st.value);
        if (Number.isNaN(n)) return null;
        const unit = f.units?.find((u) => u.id === st.unit);
        const c = unit ? unit.toCanonical(n) : n;
        if (f.min != null && c < f.min) return null;
        if (f.max != null && c > f.max) return null;
        out[f.id] = c;
      } else if (f.kind === 'select') {
        out[f.id] = st.value;
      } else {
        out[f.id] = st.value === 'true';
      }
    }
    return out;
  });

  const result = $derived(canonical ? def.compute(canonical) : null);

  const band = $derived(result ? bandFor(result.score, def.bands) : null);
  const bandLabel = $derived(band ? tc.bands[band.id]?.label ?? band.id : '');
  const bandSummary = $derived(band ? tc.bands[band.id]?.summary ?? '' : '');

  const isDraft = def.provenance.status === 'draft';

  // Sync state to the URL (shareable / bookmarkable).
  $effect(() => {
    const params = new URLSearchParams();
    for (const f of fields) {
      const st = state[f.id];
      if (st.value !== '') params.set(f.id, st.value);
      if (f.kind === 'number' && st.unit) params.set(`${f.id}__u`, st.unit);
    }
    writeParams(params);
  });

  let copied = $state(false);
  async function share() {
    copied = await copyCurrentUrl();
    if (copied) setTimeout(() => (copied = false), 2000);
  }

  function reset() {
    state = initialState();
  }

  function unitLabel(id: string): string {
    return (t.units as Record<string, string>)[id] ?? id;
  }
</script>

<div class="grid gap-6 lg:grid-cols-[1fr_20rem]">
  <!-- Inputs -->
  <div class="bg-base-200 border-base-300 rounded-box space-y-4 border p-5">
    {#each fields as f (f.id)}
      <div class="form-control">
        <label class="label pb-1" for={`f-${f.id}`}>
          <span class="label-text font-medium">{tc.fields[f.id]}</span>
        </label>

        {#if f.kind === 'number'}
          <div class="join w-full">
            <input
              id={`f-${f.id}`}
              type="number"
              inputmode="decimal"
              step={(f as NumberField).step ?? 'any'}
              class="input input-bordered join-item w-full"
              bind:value={state[f.id].value}
            />
            {#if f.units && f.units.length > 1}
              <select class="select select-bordered join-item" bind:value={state[f.id].unit}>
                {#each f.units as u (u.id)}
                  <option value={u.id}>{unitLabel(u.id)}</option>
                {/each}
              </select>
            {:else if f.units && f.units.length === 1}
              <span class="btn btn-disabled join-item no-animation">{unitLabel(f.units[0].id)}</span>
            {/if}
          </div>
        {:else if f.kind === 'select'}
          <select id={`f-${f.id}`} class="select select-bordered w-full" bind:value={state[f.id].value}>
            {#each f.options as o (o.id)}
              <option value={o.id}>{tc.options[o.id]}</option>
            {/each}
          </select>
        {:else}
          <input
            id={`f-${f.id}`}
            type="checkbox"
            class="toggle toggle-primary"
            checked={state[f.id].value === 'true'}
            onchange={(e) => (state[f.id].value = e.currentTarget.checked ? 'true' : 'false')}
          />
        {/if}
      </div>
    {/each}

    <div class="flex gap-2 pt-2">
      <button class="btn btn-ghost btn-sm" onclick={reset}>{t.calc.reset}</button>
      <button class="btn btn-ghost btn-sm" onclick={share}>
        {copied ? t.calc.shared : t.calc.share}
      </button>
    </div>
  </div>

  <!-- Result -->
  <div class="space-y-4">
    <div class="bg-base-200 rounded-box border p-4 text-center {band ? severityBorder(band.severity) : 'border-base-300'}">
      <div class="text-base-content/60 text-xs uppercase tracking-wide">{t.calc.result}</div>
      {#if result}
        <div class="text-primary my-1 text-5xl font-bold tabular-nums">
          {result.score}
          {#if result.unitKey}
            <span class="text-base-content/50 text-base font-normal">{unitLabel(result.unitKey)}</span>
          {/if}
        </div>
        <div class="text-sm">
          <span class="text-base-content/60">{t.calc.category}: </span>
          <span class="font-semibold {band ? severityText(band.severity) : ''}">{bandLabel}</span>
        </div>
        {#if bandSummary}
          <p class="text-base-content/60 mt-2 text-xs leading-snug">{bandSummary}</p>
        {/if}
      {:else}
        <div class="text-base-content/40 my-4 text-sm">{t.calc.invalidInput}</div>
      {/if}
    </div>

    {#if isDraft}
      <div class="border-warning/40 bg-warning/10 text-warning rounded-box border p-3 text-xs">
        <div class="mb-1 font-semibold">⚠ {t.calc.notForClinicalUse}</div>
        <p class="text-warning/80 leading-snug">{t.calc.unverifiedNote}</p>
      </div>
    {/if}

    {#if result?.formula}
      <div class="bg-base-200 border-base-300 rounded-box border p-4">
        <div class="mb-2 text-sm font-semibold">{t.calc.explanation}</div>
        <code class="text-base-content/70 block break-words text-xs leading-relaxed">{result.formula}</code>
      </div>
    {/if}
  </div>
</div>
