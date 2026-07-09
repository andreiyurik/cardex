/**
 * SYNTAX Score I — anatomical complexity of coronary artery disease.
 * Signature-tier calculator (bespoke coronary-tree island).
 *
 * Single source of truth for the SYNTAX calculation. UI islands import
 * from here and NEVER duplicate formulas or thresholds.
 *
 * ─────────────────────────────────────────────────────────────────────
 * Clinical numbers below are transcribed VERBATIM from the primary
 * source and are documented in docs/research/syntax-score-spec.md:
 *
 *   Sianos G, Morel MA, Kappetein AP, et al. "The SYNTAX Score: an
 *   angiographic tool grading the complexity of coronary artery
 *   disease." EuroIntervention 2005;1(2):219–227 — Tables 1 (segment
 *   weights per dominance) and 2 (lesion adverse-characteristic points).
 *   Tertiles ≤22 / 23–32 / ≥33 from Serruys 2009 (SYNTAX trial).
 *
 * These are primary-source values, but per project policy they still
 * require sign-off by the practicing physician co-founder before the
 * calculator leaves `provenance.status: 'draft'`.
 *   TODO(clinical): confirm the Medina-bifurcation → +1/+2 grouping and
 *   review all adverse-characteristic definitions with the physician.
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

/**
 * Core 16 AHA/SYNTAX coronary segments used by the interactive diagram.
 * Sub-segments (9a, 10a, 12a/b, 14a/b, 16a/b/c) share their parent's
 * weight and are not individually tappable yet — see docs/roadmap.md.
 */
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
  's12', // Intermediate / obtuse marginal (OM)
  's13', // LCx distal
  's14', // Posterolateral branch of LCx
  's15', // PDA from LCx (left-dominant systems only)
  's16', // Posterolateral branch of RCA (right-dominant systems only)
] as const;

export type SegmentId = (typeof SEGMENT_IDS)[number];

/**
 * Per-segment weight by dominance. `null` means the segment does not
 * exist in that dominance and cannot carry a lesion. A weight of `0`
 * means the segment exists (a lesion may be documented) but contributes
 * no base points — e.g. the non-dominant RCA in a left-dominant system.
 */
export type SegmentWeights = Record<
  SegmentId,
  { right: number | null; left: number | null }
>;

/**
 * Official SYNTAX segment weights (Sianos 2005, Table 1). In left
 * dominance the RCA is non-dominant: segments 1–3 exist with weight 0,
 * and segments 4/16 do not exist (null); segment 15 (PDA from LCx)
 * exists only in left dominance.
 */
export const DEFAULT_SEGMENT_WEIGHTS: SegmentWeights = {
  s1: { right: 1, left: 0 },
  s2: { right: 1, left: 0 },
  s3: { right: 1, left: 0 },
  s4: { right: 1, left: null },
  s5: { right: 5, left: 6 },
  s6: { right: 3.5, left: 3.5 },
  s7: { right: 2.5, left: 2.5 },
  s8: { right: 1, left: 1 },
  s9: { right: 1, left: 1 },
  s10: { right: 0.5, left: 0.5 },
  s11: { right: 1.5, left: 2.5 },
  s12: { right: 1, left: 1 },
  s13: { right: 0.5, left: 1.5 },
  s14: { right: 0.5, left: 1 },
  s15: { right: null, left: 1 },
  s16: { right: 0.5, left: null },
};

export interface ScoringConstants {
  /** Multiplier applied to summed segment weights for a non-occlusive lesion. */
  stenosisMultiplier: number;
  /** Multiplier applied to summed segment weights for a total occlusion. */
  occlusionMultiplier: number;
  /** Score ≤ lowMax → 'low'; ≤ intermediateMax → 'intermediate'; else 'high'. */
  lowMax: number;
  intermediateMax: number;
}

/**
 * Multipliers and tertiles from the primary sources: ×2 significant
 * stenosis (50–99%), ×5 total occlusion; low ≤22 / intermediate 23–32 /
 * high ≥33.
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
  sources: [
    {
      title:
        'The SYNTAX Score: an angiographic tool grading the complexity of coronary artery disease',
      authors: 'Sianos G, Morel MA, Kappetein AP, et al.',
      journal: 'EuroIntervention',
      year: 2005,
      url: 'https://syntaxscore.org',
    },
    {
      title: 'Assessment of the SYNTAX score in the SYNTAX study',
      authors: 'Serruys PW, et al.',
      journal: 'EuroIntervention',
      year: 2009,
    },
  ],
  notesKey: 'notes',
};

// ─────────────────────────────────────────────────────────────────────
// Lesion model — a lesion spans one or more segments and carries a
// severity plus adverse morphological characteristics (Sianos Table 2).
// ─────────────────────────────────────────────────────────────────────

/**
 * Medina bifurcation classification (proximal main, distal main, side
 * branch). Side-branch ostium involved (third digit = 1) scores +2;
 * otherwise +1. Grouping per the online SYNTAX calculator.
 */
export type MedinaType = '100' | '010' | '110' | '111' | '101' | '011' | '001';

export const BIFURCATION_MEDINA_TYPES: MedinaType[] = [
  '100',
  '010',
  '110',
  '111',
  '101',
  '011',
  '001',
];

/** Adverse detail specific to a chronic total occlusion (Sianos Table 2). */
export interface TotalOcclusionDetail {
  /** Occlusion age > 3 months or unknown. +1 */
  ageOver3moOrUnknown: boolean;
  /** Blunt stump (no tapered entry). +1 */
  bluntStump: boolean;
  /** Bridging collaterals across the occlusion. +1 */
  bridgingCollaterals: boolean;
  /**
   * Number of segments distal to the occlusion NOT visualised (by
   * antegrade/retrograde filling). +1 per non-visualised segment.
   */
  nonVisibleSegments: number;
  /** Side branch < 1.5 mm at the occlusion site. +1 */
  sideBranchAtOcclusion: boolean;
}

export interface Lesion {
  /** Stable id for UI/URL state (not used by scoring). */
  id: string;
  /** One or more segments the lesion spans (weights are summed). */
  segments: SegmentId[];
  /** Total occlusion (100%, TIMI 0); otherwise significant stenosis 50–99%. */
  occlusion: boolean;
  /** Present only when `occlusion` is true. */
  totalOcclusion?: TotalOcclusionDetail;
  /** Bifurcation lesion — Medina type; null/undefined = not a bifurcation. */
  bifurcation?: { medina: MedinaType; angulationUnder70: boolean } | null;
  /** Trifurcation with N diseased segments (1–4 → +3/+4/+5/+6); 0 = none. */
  trifurcationDiseased: 0 | 1 | 2 | 3 | 4;
  /** Aorto-ostial stenosis (within 3 mm of the aortic origin). +1 */
  aortoOstial: boolean;
  /** Severe tortuosity proximal to the lesion. +2 */
  severeTortuosity: boolean;
  /** Lesion length > 20 mm. +1 */
  lengthOver20mm: boolean;
  /** Heavy calcification. +2 */
  heavyCalcification: boolean;
  /** Thrombus. +1 */
  thrombus: boolean;
  /** Diffuse disease / small vessels — number of involved segments. +1 each */
  diffuseSegments: number;
}

/** Factory for a fresh lesion on the given segment (UI convenience). */
export function newLesion(id: string, segment: SegmentId): Lesion {
  return {
    id,
    segments: [segment],
    occlusion: false,
    trifurcationDiseased: 0,
    aortoOstial: false,
    severeTortuosity: false,
    lengthOver20mm: false,
    heavyCalcification: false,
    thrombus: false,
    diffuseSegments: 0,
  };
}

export interface SyntaxInput {
  dominance: Dominance;
  lesions: Lesion[];
}

export type RiskCategory = 'low' | 'intermediate' | 'high';

/** Points for a Medina bifurcation type: side branch involved → +2 else +1. */
export function bifurcationPoints(medina: MedinaType): number {
  return medina.endsWith('1') ? 2 : 1;
}

/** Points for a trifurcation by number of diseased segments (1→+3 … 4→+6). */
export function trifurcationPoints(diseased: 0 | 1 | 2 | 3 | 4): number {
  return diseased === 0 ? 0 : diseased + 2;
}

export interface LesionScore {
  id: string;
  segments: SegmentId[];
  /** Sum of segment weights. */
  weight: number;
  multiplier: number;
  /** weight × multiplier. */
  base: number;
  /** Sum of adverse-characteristic adders. */
  adverse: number;
  /** base + adverse. */
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

/** Sum of the adverse-characteristic adders for a single lesion. */
export function lesionAdversePoints(lesion: Lesion): number {
  let points = 0;

  if (lesion.occlusion && lesion.totalOcclusion) {
    const to = lesion.totalOcclusion;
    if (to.ageOver3moOrUnknown) points += 1;
    if (to.bluntStump) points += 1;
    if (to.bridgingCollaterals) points += 1;
    points += Math.max(0, Math.floor(to.nonVisibleSegments));
    if (to.sideBranchAtOcclusion) points += 1;
  }

  if (lesion.bifurcation) {
    points += bifurcationPoints(lesion.bifurcation.medina);
    if (lesion.bifurcation.angulationUnder70) points += 1;
  }

  points += trifurcationPoints(lesion.trifurcationDiseased);

  if (lesion.aortoOstial) points += 1;
  if (lesion.severeTortuosity) points += 2;
  if (lesion.lengthOver20mm) points += 1;
  if (lesion.heavyCalcification) points += 2;
  if (lesion.thrombus) points += 1;
  points += Math.max(0, Math.floor(lesion.diffuseSegments));

  return points;
}

/**
 * Calculate the SYNTAX score for a set of lesions.
 *
 * Pure function: same input → same output, no side effects.
 * Lesions referencing a segment not applicable for the given dominance,
 * an empty lesion, or a segment used by two lesions all throw — the UI
 * must not construct such inputs.
 */
export function calculateSyntaxScore(
  input: SyntaxInput,
  options: SyntaxOptions = {},
): SyntaxResult {
  const weights = options.segmentWeights ?? DEFAULT_SEGMENT_WEIGHTS;
  const scoring = options.scoring ?? DEFAULT_SCORING;

  const usedSegments = new Set<SegmentId>();
  const lesions: LesionScore[] = input.lesions.map((lesion) => {
    if (lesion.segments.length === 0) {
      throw new Error(`Lesion ${lesion.id} has no segments`);
    }

    let weight = 0;
    for (const segmentId of lesion.segments) {
      if (usedSegments.has(segmentId)) {
        throw new Error(`Segment ${segmentId} belongs to more than one lesion`);
      }
      usedSegments.add(segmentId);

      const w = weights[segmentId][input.dominance];
      if (w === null) {
        throw new Error(
          `Segment ${segmentId} is not applicable in ${input.dominance} dominance`,
        );
      }
      weight += w;
    }

    const multiplier = lesion.occlusion
      ? scoring.occlusionMultiplier
      : scoring.stenosisMultiplier;
    const base = weight * multiplier;
    const adverse = lesionAdversePoints(lesion);
    return {
      id: lesion.id,
      segments: lesion.segments,
      weight,
      multiplier,
      base,
      adverse,
      points: base + adverse,
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
      label: l.segments.join('+'),
      value: l.points,
      detail:
        l.adverse > 0
          ? `${l.weight} × ${l.multiplier} + ${l.adverse}`
          : `${l.weight} × ${l.multiplier}`,
    })),
  };
}

export const syntaxDefinition: CalculatorDefinition<SyntaxInput, SyntaxResult> = {
  slug: 'syntax',
  version: '1.0.0-draft',
  tier: 'signature',
  i18nKey: 'syntax',
  estimatesRiskOf: 'Coronary artery disease',
  bands: SYNTAX_BANDS,
  provenance: SYNTAX_PROVENANCE,
  defaultInput: { dominance: 'right', lesions: [] },
  compute: (input) => calculateSyntaxScore(input),
  goldenCases: [
    {
      id: 'no-lesions',
      input: { dominance: 'right', lesions: [] },
      expectedScore: 0,
      expectedBandId: 'low',
      status: 'verified',
      source: 'trivial (no disease)',
    },
    {
      // Sianos 2005 worked example: isolated significant LM lesion = 5 × 2.
      id: 'isolated-lm-stenosis-right',
      input: {
        dominance: 'right',
        lesions: [{ ...newLesion('a', 's5'), occlusion: false }],
      },
      expectedScore: 10,
      expectedBandId: 'low',
      status: 'verified',
      source: 'Sianos 2005 worked example (LM 5 × 2 = 10)',
    },
    {
      // Left dominance raises the left-main weight to 6 (Table 1).
      id: 'isolated-lm-stenosis-left',
      input: {
        dominance: 'left',
        lesions: [{ ...newLesion('a', 's5'), occlusion: false }],
      },
      expectedScore: 12,
      expectedBandId: 'low',
      status: 'verified',
      source: 'Sianos 2005 Table 1 (LM left-dominant weight 6 × 2 = 12)',
    },
    {
      // Mechanics regression: CTO of proximal LAD with three TO adders.
      id: 'lad-prox-cto-with-adders',
      input: {
        dominance: 'right',
        lesions: [
          {
            ...newLesion('a', 's6'),
            occlusion: true,
            totalOcclusion: {
              ageOver3moOrUnknown: true,
              bluntStump: true,
              bridgingCollaterals: true,
              nonVisibleSegments: 0,
              sideBranchAtOcclusion: false,
            },
          },
        ],
      },
      // 3.5 × 5 = 17.5 base + 3 adders = 20.5
      expectedScore: 20.5,
      expectedBandId: 'low',
      status: 'verified',
      source: 'primary-source weights + Table 2 adders (hand-computed)',
    },
  ],
};
