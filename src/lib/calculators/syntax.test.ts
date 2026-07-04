import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SCORING,
  DEFAULT_SEGMENT_WEIGHTS,
  SEGMENT_IDS,
  applicableSegments,
  calculateSyntaxScore,
  interpretScore,
  type ScoringConstants,
  type SegmentWeights,
} from './syntax';

/**
 * Tests verify the scoring MECHANICS with injected constants, so they
 * stay valid when the placeholder clinical values are replaced with
 * physician-verified ones (see TODO(clinical) in syntax.ts).
 */

const testWeights: SegmentWeights = {
  ...DEFAULT_SEGMENT_WEIGHTS,
  s5: { right: 5, left: 6 }, // left main
  s6: { right: 3.5, left: 3.5 }, // LAD proximal
  s1: { right: 1, left: 1 },
};

const testScoring: ScoringConstants = {
  stenosisMultiplier: 2,
  occlusionMultiplier: 5,
  lowMax: 22,
  intermediateMax: 32,
};

describe('calculateSyntaxScore', () => {
  it('returns zero score and low risk with no lesions', () => {
    const result = calculateSyntaxScore({ dominance: 'right', lesions: [] });
    expect(result.score).toBe(0);
    expect(result.risk).toBe('low');
    expect(result.lesions).toEqual([]);
  });

  it('scores a single stenosis as weight × stenosis multiplier', () => {
    const result = calculateSyntaxScore(
      { dominance: 'right', lesions: [{ segmentId: 's5', totalOcclusion: false }] },
      { segmentWeights: testWeights, scoring: testScoring },
    );
    expect(result.score).toBe(5 * 2);
    expect(result.lesions[0]).toEqual({
      segmentId: 's5',
      weight: 5,
      multiplier: 2,
      points: 10,
    });
  });

  it('scores a total occlusion as weight × occlusion multiplier', () => {
    const result = calculateSyntaxScore(
      { dominance: 'right', lesions: [{ segmentId: 's5', totalOcclusion: true }] },
      { segmentWeights: testWeights, scoring: testScoring },
    );
    expect(result.score).toBe(5 * 5);
  });

  it('uses dominance-specific weights', () => {
    const right = calculateSyntaxScore(
      { dominance: 'right', lesions: [{ segmentId: 's5', totalOcclusion: false }] },
      { segmentWeights: testWeights, scoring: testScoring },
    );
    const left = calculateSyntaxScore(
      { dominance: 'left', lesions: [{ segmentId: 's5', totalOcclusion: false }] },
      { segmentWeights: testWeights, scoring: testScoring },
    );
    expect(right.score).toBe(10);
    expect(left.score).toBe(12);
  });

  it('sums multiple lesions', () => {
    const result = calculateSyntaxScore(
      {
        dominance: 'right',
        lesions: [
          { segmentId: 's5', totalOcclusion: false }, // 5×2 = 10
          { segmentId: 's6', totalOcclusion: true }, // 3.5×5 = 17.5
          { segmentId: 's1', totalOcclusion: false }, // 1×2 = 2
        ],
      },
      { segmentWeights: testWeights, scoring: testScoring },
    );
    expect(result.score).toBe(29.5);
    expect(result.lesions).toHaveLength(3);
  });

  it('throws for a segment not applicable in the given dominance', () => {
    // s15 (PDA from LCx) exists only in left-dominant systems
    expect(() =>
      calculateSyntaxScore({
        dominance: 'right',
        lesions: [{ segmentId: 's15', totalOcclusion: false }],
      }),
    ).toThrow(/not applicable/);
    // s4 and s16 exist only in right-dominant systems
    expect(() =>
      calculateSyntaxScore({
        dominance: 'left',
        lesions: [{ segmentId: 's16', totalOcclusion: false }],
      }),
    ).toThrow(/not applicable/);
  });

  it('throws on duplicate lesions for the same segment', () => {
    expect(() =>
      calculateSyntaxScore({
        dominance: 'right',
        lesions: [
          { segmentId: 's1', totalOcclusion: false },
          { segmentId: 's1', totalOcclusion: true },
        ],
      }),
    ).toThrow(/Duplicate/);
  });
});

describe('interpretScore — risk boundaries (thresholds 22 and 33)', () => {
  it.each([
    [0, 'low'],
    [22, 'low'], // upper boundary of low
    [22.5, 'intermediate'],
    [23, 'intermediate'], // lower boundary of intermediate
    [32, 'intermediate'], // upper boundary of intermediate
    [32.5, 'high'],
    [33, 'high'], // lower boundary of high
    [60, 'high'],
  ] as const)('score %d → %s', (score, expected) => {
    expect(interpretScore(score)).toBe(expected);
  });
});

describe('applicableSegments', () => {
  it('excludes left-dominant-only segments in right dominance', () => {
    const segments = applicableSegments('right');
    expect(segments).not.toContain('s15');
    expect(segments).toContain('s4');
    expect(segments).toContain('s16');
  });

  it('excludes right-dominant-only segments in left dominance', () => {
    const segments = applicableSegments('left');
    expect(segments).toContain('s15');
    expect(segments).not.toContain('s4');
    expect(segments).not.toContain('s16');
  });
});

describe('placeholder tables (until physician verification)', () => {
  it('every segment has a weight entry', () => {
    for (const id of SEGMENT_IDS) {
      expect(DEFAULT_SEGMENT_WEIGHTS[id]).toBeDefined();
    }
  });

  it('default thresholds match the published 22/33 bands', () => {
    expect(DEFAULT_SCORING.lowMax).toBe(22);
    expect(DEFAULT_SCORING.intermediateMax).toBe(32);
  });
});
