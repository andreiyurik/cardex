/**
 * Calculator framework — shared types.
 *
 * A calculator is a single typed DATA object (CalculatorDefinition) from
 * which pages, SEO, forms, the sitemap and tests are derived. This keeps
 * clinical logic, provenance, input safety and verification in ONE place
 * per calculator instead of scattered across the UI.
 */

/** Clinical severity — drives color and semantics in the UI. */
export type Severity = 'low' | 'moderate' | 'high' | 'very-high';

// ─────────────────────────────────────────────────────────────────────
// Provenance (trust layer): where a formula comes from and who verified it
// ─────────────────────────────────────────────────────────────────────

export interface Citation {
  title: string;
  authors?: string;
  journal?: string;
  year: number;
  doi?: string;
  url?: string;
}

export interface Review {
  name: string;
  role: string;
  /** ISO date (YYYY-MM-DD). */
  date: string;
}

export type VerificationStatus = 'draft' | 'physician-verified';

export interface Provenance {
  sources: Citation[];
  status: VerificationStatus;
  /** Present once a practicing physician has signed off the coefficients. */
  reviewedBy?: Review;
  /** i18n key for extra caveats. */
  notesKey?: string;
}

// ─────────────────────────────────────────────────────────────────────
// Interpretation: map a score to a clinical band
// ─────────────────────────────────────────────────────────────────────

export interface InterpretationBand {
  id: string;
  severity: Severity;
  /** Inclusive lower bound (informational — used for the range label). */
  min: number;
  /** Inclusive upper bound; null = +Infinity. Matching uses `score <= max`. */
  max: number | null;
  /** i18n keys (resolved by the UI). */
  labelKey: string;
  summaryKey?: string;
}

/**
 * Find the band for a score. Bands MUST be ordered ascending by `max`
 * (the open-ended band, max = null, last). Matching is `score <= max`,
 * so fractional scores never fall into a gap.
 */
export function bandFor(
  score: number,
  bands: InterpretationBand[],
): InterpretationBand {
  for (const band of bands) {
    if (band.max === null || score <= band.max) return band;
  }
  return bands[bands.length - 1];
}

// ─────────────────────────────────────────────────────────────────────
// Result contract (enriched): a result is an interpretation + explanation
// ─────────────────────────────────────────────────────────────────────

/** One term of the "why this number" explanation. */
export interface Contribution {
  /** i18n key OR a pre-resolved label (labelKey wins if both set). */
  labelKey?: string;
  label?: string;
  value: number;
  detail?: string;
}

export interface CalcResult {
  score: number;
  /** id of the matched InterpretationBand. */
  bandId: string;
  /** Additive breakdown ("explain the score"); empty for formula-type calcs. */
  contributions: Contribution[];
  /** i18n key for the score unit (e.g. "ml/min"); omit for unitless scores. */
  unitKey?: string;
  /** Human-readable formula with substituted values (formula-type calcs). */
  formula?: string;
}

// ─────────────────────────────────────────────────────────────────────
// Input schema (standard tier): units + validation live in the data
// ─────────────────────────────────────────────────────────────────────

export interface UnitOption {
  id: string;
  /** Convert a value expressed in THIS unit to the canonical unit. */
  toCanonical: (v: number) => number;
  /** Convert a canonical value to THIS unit (for display). */
  fromCanonical: (v: number) => number;
}

export interface NumberField {
  kind: 'number';
  id: string;
  labelKey: string;
  /** Plausible physiologic range in CANONICAL units (hard validation). */
  min?: number;
  max?: number;
  step?: number;
  /** First entry is the default display unit; omit for unitless fields. */
  units?: UnitOption[];
  required?: boolean;
}

export interface SelectOption {
  id: string;
  labelKey: string;
}

export interface SelectField {
  kind: 'select';
  id: string;
  labelKey: string;
  options: SelectOption[];
  required?: boolean;
}

export interface BooleanField {
  kind: 'boolean';
  id: string;
  labelKey: string;
}

export type InputField = NumberField | SelectField | BooleanField;

/** Canonical-unit input record consumed by a standard calculator's compute(). */
export type StandardInput = Record<string, number | string | boolean>;

// ─────────────────────────────────────────────────────────────────────
// Golden cases: verification data that doubles as regression tests
// ─────────────────────────────────────────────────────────────────────

export interface GoldenCase<TInput = unknown> {
  id: string;
  input: TInput;
  expectedScore: number;
  expectedBandId: string;
  /**
   * 'verified'    — real published reference case (physician-checkable).
   * 'placeholder' — computed against unverified constants; guards against
   *                 regressions only, MUST be replaced after verification.
   */
  status: 'placeholder' | 'verified';
  source?: string;
}

// ─────────────────────────────────────────────────────────────────────
// Definition
// ─────────────────────────────────────────────────────────────────────

export interface CalculatorDefinition<
  TInput = any,
  TResult extends CalcResult = CalcResult,
> {
  slug: string;
  /** Formula version — bump when clinical constants change. */
  version: string;
  /**
   * 'standard'  — form-driven, rendered by the generic engine.
   * 'signature' — bespoke island (custom visual / future 3D).
   */
  tier: 'standard' | 'signature';
  /** Key into dictionaries[locale].calculators[i18nKey]. */
  i18nKey: string;
  /** schema.org: condition whose risk/measure this estimates. */
  estimatesRiskOf: string;
  bands: InterpretationBand[];
  provenance: Provenance;
  /** Present for the standard tier; signature tier drives its own island. */
  inputs?: InputField[];
  defaultInput: TInput;
  compute: (input: TInput) => TResult;
  goldenCases: GoldenCase<TInput>[];
}
