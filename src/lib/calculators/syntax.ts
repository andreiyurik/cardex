/**
 * SYNTAX Score — anatomical complexity of coronary artery disease.
 * Signature-tier calculator (bespoke coronary-tree island).
 *
 * Single source of truth for the SYNTAX calculation. UI islands import
 * from here and NEVER duplicate formulas or thresholds.
 *
 * ─────────────────────────────────────────────────────────────────────
 * TODO(clinical): verify with practicing physician.
 * All segment weights and lesion multipliers below are PLACEHOLDERS.
 * The scoring *mechanics* (weight × multiplier summation, dominance
 * handling, risk thresholds) are implemented and tested; the clinical
 * numbers must be filled in from the official SYNTAX Score definition
 * (Sianos et al., EuroIntervention 2005; syntaxscore.org) before any
 * clinical use. Adverse lesion characteristics (bifurcation, tortuosity,
 * calcification, thrombus, CTO details, etc.) are NOT modeled yet —
 * see docs/roadmap.md "TODO(clinical)". Provenance.status is 'draft'.
 * ─────────────────────────────────────────────────────────────────────
 */
import type {
  CalcResult,
  CalculatorDefinition,
  InterpretationBand,
  Provenance,
} from './types';

/** Coronary dominance determines which segments exist and their weights. */
export type Dominance = 'right' | 'left';

/** Modified AHA coronary segments used by the SYNTAX chart (core 16). */
export const SEGMENT_IDS = [
  's1', // RCA proximal
  's2', // RCA mid
  's3', // RCA distal
  's4', // Posterior descending artery (PDA from RCA)
  's5', // Left main
  's6', // LAD proximal
  's7', // LAD mid
  's8', // LAD apical
  's9', // First diagonal (D1)
  's10', // Second diagonal (D2)
  's11', // LCx proximal
  's12', // Obtuse marginal (OM)
  's13', // LCx distal
  's14', // Posterolateral branch of LCx
  's15', // PDA from LCx (left-dominant systems only)
  's16', // Posterolateral branch of RCA (right-dominant systems only)
] as const;

export type SegmentId = (typeof SEGMENT_IDS)[number];

/**
 * Per-segment weight by dominance. `null` means the segment does not
 * exist in that dominance type and cannot carry a lesion.
 */
export type SegmentWeights = Record<
  SegmentId,
  { right: number | null; left: number | null }
>;

/**
 * TODO(clinical): verify with practicing physician.
 * PLACEHOLDER weights — every applicable segment is weighted 1.
 * Replace with the official Leaman-based SYNTAX weights per dominance
 * (e.g. left main and proximal LAD carry the highest weights).
 */
export const DEFAULT_SEGMENT_WEIGHTS: SegmentWeights = {
  s1: { right: 1, left: 1 },
  s2: { right: 1, left: 1 },
  s3: { right: 1, left: 1 },
  s4: { right: 1, left: null }, // PDA from RCA absent in left dominance
  s5: { right: 1, left: 1 },
  s6: { right: 1, left: 1 },
  s7: { right: 1, left: 1 },
  s8: { right: 1, left: 1 },
  s9: { right: 1, left: 1 },
  s10: { right: 1, left: 1 },
  s11: { right: 1, left: 1 },
  s12: { right: 1, left: 1 },
  s13: { right: 1, left: 1 },
  s14: { right: 1, left: 1 },
  s15: { right: null, left: 1 }, // PDA from LCx exists only in left dominance
  s16: { right: 1, left: null }, // RCA posterolateral absent in left dominance
};

export interface ScoringConstants {
  /** Multiplier applied to segment weight for a non-occlusive lesion. */
  stenosisMultiplier: number;
  /** Multiplier applied to segment weight for a chronic total occlusion. */
  occlusionMultiplier: number;
  /** Score ≤ lowMax → 'low'; ≤ intermediateMax → 'intermediate'; else 'high'. */
  lowMax: number;
  intermediateMax: number;
}

/**
 * TODO(clinical): verify with practicing physician.
 * Multipliers are PLACEHOLDERS mirroring the published structure
 * (×2 significant stenosis 50–99%, ×5 total occlusion). Thresholds
 * 22/32 follow the published low ≤22 / intermediate 23–32 / high ≥33
 * bands — confirm wording and boundaries with the physician.
 */
export const DEFAULT_SCORING: ScoringConstants = {
  stenosisMultiplier: 2,
  occlusionMultiplier: 5,
  lowMax: 22,
  intermediateMax: 32,
};

/** Interpretation bands derived from the same thresholds as DEFAULT_SCORING. */
export const SYNTAX_BANDS: InterpretationBand[] = [
  {
    id: 'low',
    severity: 'low',
    min: 0,
    max: DEFAULT_SCORING.lowMax,
    labelKey: 'low.label',
    summaryKey: 'low.summary',
  },
  {
    id: 'intermediate',
    severity: 'moderate',
    min: DEFAULT_SCORING.lowMax + 1,
    max: DEFAULT_SCORING.intermediateMax,
    labelKey: 'intermediate.label',
    summaryKey: 'intermediate.summary',
  },
  {
    id: 'high',
    severity: 'high',
    min: DEFAULT_SCORING.intermediateMax + 1,
    max: null,
    labelKey: 'high.label',
    summaryKey: 'high.summary',
  },
];

export const SYNTAX_PROVENANCE: Provenance = {
  status: 'draft',
  // TODO(clinical): confirm the canonical citation(s) with the physician.
  sources: [
    {
      title:
        'The SYNTAX Score: an angiographic tool grading the complexity of coronary artery disease',
      authors: 'Sianos G, et al.',
      journal: 'EuroIntervention',
      year: 2005,
      url: 'https://syntaxscore.org',
    },
  ],
  notesKey: 'notes',
};

export interface LesionInput {
  segmentId: SegmentId;
  /** Chronic total occlusion (100%); otherwise significant stenosis. */
  totalOcclusion: boolean;
}

export interface SyntaxInput {
  dominance: Dominance;
  lesions: LesionInput[];
}

export type RiskCategory = 'low' | 'intermediate' | 'high';

export interface LesionScore {
  segmentId: SegmentId;
  weight: number;
  multiplier: number;
  points: number;
}

export interface SyntaxResult extends CalcResult {
  /** Convenience alias of bandId (kept for readability at call sites). */
  risk: RiskCategory;
  lesions: LesionScore[];
}

export interface SyntaxOptions {
  segmentWeights?: SegmentWeights;
  scoring?: ScoringConstants;
}

/** Segments applicable for the given dominance (weight not null). */
export function applicableSegments(
  dominance: Dominance,
  weights: SegmentWeights = DEFAULT_SEGMENT_WEIGHTS,
): SegmentId[] {
  return SEGMENT_IDS.filter((id) => weights[id][dominance] !== null);
}

export function interpretScore(
  score: number,
  scoring: ScoringConstants = DEFAULT_SCORING,
): RiskCategory {
  if (score <= scoring.lowMax) return 'low';
  if (score <= scoring.intermediateMax) return 'intermediate';
  return 'high';
}

/**
 * Calculate the SYNTAX score for a set of lesions.
 *
 * Pure function: same input → same output, no side effects.
 * Lesions on segments not applicable for the given dominance throw —
 * the UI must not offer them.
 */
export function calculateSyntaxScore(
  input: SyntaxInput,
  options: SyntaxOptions = {},
): SyntaxResult {
  const weights = options.segmentWeights ?? DEFAULT_SEGMENT_WEIGHTS;
  const scoring = options.scoring ?? DEFAULT_SCORING;

  const seen = new Set<SegmentId>();
  const lesions: LesionScore[] = input.lesions.map((lesion) => {
    if (seen.has(lesion.segmentId)) {
      throw new Error(`Duplicate lesion for segment ${lesion.segmentId}`);
    }
    seen.add(lesion.segmentId);

    const weight = weights[lesion.segmentId][input.dominance];
    if (weight === null) {
      throw new Error(
        `Segment ${lesion.segmentId} is not applicable in ${input.dominance} dominance`,
      );
    }
    const multiplier = lesion.totalOcclusion
      ? scoring.occlusionMultiplier
      : scoring.stenosisMultiplier;
    return {
      segmentId: lesion.segmentId,
      weight,
      multiplier,
      points: weight * multiplier,
    };
  });

  const score = lesions.reduce((sum, l) => sum + l.points, 0);
  const risk = interpretScore(score, scoring);
  return {
    score,
    bandId: risk,
    risk,
    lesions,
    contributions: lesions.map((l) => ({
      label: l.segmentId,
      value: l.points,
      detail: `${l.weight} × ${l.multiplier}`,
    })),
  };
}

export const syntaxDefinition: CalculatorDefinition<SyntaxInput, SyntaxResult> = {
  slug: 'syntax',
  version: '0.1.0-draft',
  tier: 'signature',
  i18nKey: 'syntax',
  estimatesRiskOf: 'Coronary artery disease',
  bands: SYNTAX_BANDS,
  provenance: SYNTAX_PROVENANCE,
  defaultInput: { dominance: 'right', lesions: [] },
  compute: (input) => calculateSyntaxScore(input),
  // TODO(clinical): replace with real published reference cases once the
  // segment weights are verified. These guard the placeholder mechanics only.
  goldenCases: [
    {
      id: 'no-lesions',
      input: { dominance: 'right', lesions: [] },
      expectedScore: 0,
      expectedBandId: 'low',
      status: 'placeholder',
      source: 'mechanics regression (placeholder weights = 1)',
    },
    {
      id: 'single-stenosis-lad-prox',
      input: { dominance: 'right', lesions: [{ segmentId: 's6', totalOcclusion: false }] },
      expectedScore: 2,
      expectedBandId: 'low',
      status: 'placeholder',
      source: 'mechanics regression (placeholder weights = 1)',
    },
    {
      id: 'single-cto-rca-prox',
      input: { dominance: 'right', lesions: [{ segmentId: 's1', totalOcclusion: true }] },
      expectedScore: 5,
      expectedBandId: 'low',
      status: 'placeholder',
      source: 'mechanics regression (placeholder weights = 1)',
    },
  ],
};
