import { describe, expect, it } from 'vitest';
import {
  DEFAULT_SCORING,
  DEFAULT_SEGMENT_WEIGHTS,
  SEGMENT_IDS,
  applicableSegments,
  bifurcationPoints,
  calculateSyntaxScore,
  interpretScore,
  lesionAdversePoints,
  newLesion,
  trifurcationPoints,
  type Lesion,
} from './syntax';

/** Build a fully-specified lesion, overriding only what a test cares about. */
function lesion(partial: Partial<Lesion> & Pick<Lesion, 'segments'>): Lesion {
  const base = newLesion('t', partial.segments[0]);
  return { ...base, ...partial };
}

describe('segment weights (Sianos 2005, Table 1)', () => {
  it('carries the published per-segment weights', () => {
    expect(DEFAULT_SEGMENT_WEIGHTS.s5.right).toBe(5);
    expect(DEFAULT_SEGMENT_WEIGHTS.s5.left).toBe(6);
    expect(DEFAULT_SEGMENT_WEIGHTS.s6.right).toBe(3.5);
    expect(DEFAULT_SEGMENT_WEIGHTS.s7.right).toBe(2.5);
    expect(DEFAULT_SEGMENT_WEIGHTS.s11.left).toBe(2.5);
    expect(DEFAULT_SEGMENT_WEIGHTS.s13.left).toBe(1.5);
  });

  it('makes the non-dominant RCA weight 0 (not null) in left dominance', () => {
    expect(DEFAULT_SEGMENT_WEIGHTS.s1.left).toBe(0);
    expect(DEFAULT_SEGMENT_WEIGHTS.s3.left).toBe(0);
  });
});

describe('calculateSyntaxScore — base scoring', () => {
  it('returns zero score and low risk with no lesions', () => {
    const result = calculateSyntaxScore({ dominance: 'right', lesions: [] });
    expect(result.score).toBe(0);
    expect(result.risk).toBe('low');
    expect(result.lesions).toEqual([]);
  });

  it('scores a single stenosis as summed weight × 2', () => {
    const result = calculateSyntaxScore({
      dominance: 'right',
      lesions: [lesion({ segments: ['s5'], occlusion: false })],
    });
    expect(result.score).toBe(10);
    expect(result.lesions[0]).toMatchObject({
      weight: 5,
      multiplier: 2,
      base: 10,
      adverse: 0,
      points: 10,
    });
  });

  it('scores a total occlusion as summed weight × 5', () => {
    const result = calculateSyntaxScore({
      dominance: 'right',
      lesions: [lesion({ segments: ['s5'], occlusion: true })],
    });
    expect(result.score).toBe(25);
  });

  it('sums segment weights for a multi-segment lesion', () => {
    // LAD prox (3.5) + LAD mid (2.5) as one stenotic lesion → 6 × 2 = 12
    const result = calculateSyntaxScore({
      dominance: 'right',
      lesions: [lesion({ segments: ['s6', 's7'], occlusion: false })],
    });
    expect(result.lesions[0].weight).toBe(6);
    expect(result.score).toBe(12);
  });

  it('uses dominance-specific weights', () => {
    const right = calculateSyntaxScore({
      dominance: 'right',
      lesions: [lesion({ segments: ['s5'] })],
    });
    const left = calculateSyntaxScore({
      dominance: 'left',
      lesions: [lesion({ segments: ['s5'] })],
    });
    expect(right.score).toBe(10); // 5 × 2
    expect(left.score).toBe(12); // 6 × 2
  });

  it('sums multiple lesions', () => {
    const result = calculateSyntaxScore({
      dominance: 'right',
      lesions: [
        lesion({ segments: ['s5'], occlusion: false }), // 5×2 = 10
        lesion({ segments: ['s6'], occlusion: true }), // 3.5×5 = 17.5
        lesion({ segments: ['s1'], occlusion: false }), // 1×2 = 2
      ],
    });
    expect(result.score).toBe(29.5);
    expect(result.lesions).toHaveLength(3);
  });
});

describe('calculateSyntaxScore — adverse characteristics', () => {
  it('adds total-occlusion detail points on top of the base', () => {
    const result = calculateSyntaxScore({
      dominance: 'right',
      lesions: [
        lesion({
          segments: ['s6'],
          occlusion: true,
          totalOcclusion: {
            ageOver3moOrUnknown: true, // +1
            bluntStump: true, // +1
            bridgingCollaterals: true, // +1
            nonVisibleSegments: 2, // +2
            sideBranchAtOcclusion: true, // +1
          },
        }),
      ],
    });
    // 3.5 × 5 = 17.5 base + 6 adders
    expect(result.lesions[0].base).toBe(17.5);
    expect(result.lesions[0].adverse).toBe(6);
    expect(result.score).toBe(23.5);
    expect(result.risk).toBe('intermediate');
  });

  it('ignores total-occlusion detail when the lesion is a stenosis', () => {
    const l = lesion({
      segments: ['s6'],
      occlusion: false,
      totalOcclusion: {
        ageOver3moOrUnknown: true,
        bluntStump: true,
        bridgingCollaterals: true,
        nonVisibleSegments: 5,
        sideBranchAtOcclusion: true,
      },
    });
    expect(lesionAdversePoints(l)).toBe(0);
  });

  it('scores every non-occlusion adverse adder', () => {
    const l = lesion({
      segments: ['s6'],
      bifurcation: { medina: '001', angulationUnder70: true }, // +2 +1
      aortoOstial: true, // +1
      severeTortuosity: true, // +2
      lengthOver20mm: true, // +1
      heavyCalcification: true, // +2
      thrombus: true, // +1
      diffuseSegments: 3, // +3
    });
    expect(lesionAdversePoints(l)).toBe(13);
  });

  it('maps Medina types: side-branch ostium involved → +2, else +1', () => {
    expect(bifurcationPoints('100')).toBe(1);
    expect(bifurcationPoints('010')).toBe(1);
    expect(bifurcationPoints('110')).toBe(1);
    expect(bifurcationPoints('001')).toBe(2);
    expect(bifurcationPoints('101')).toBe(2);
    expect(bifurcationPoints('111')).toBe(2);
  });

  it('maps trifurcation diseased-segment count to +3..+6', () => {
    expect(trifurcationPoints(0)).toBe(0);
    expect(trifurcationPoints(1)).toBe(3);
    expect(trifurcationPoints(2)).toBe(4);
    expect(trifurcationPoints(3)).toBe(5);
    expect(trifurcationPoints(4)).toBe(6);
  });
});

describe('calculateSyntaxScore — validation', () => {
  it('throws for a segment not applicable in the given dominance', () => {
    expect(() =>
      calculateSyntaxScore({
        dominance: 'right',
        lesions: [lesion({ segments: ['s15'] })], // PDA from LCx: left only
      }),
    ).toThrow(/not applicable/);
    expect(() =>
      calculateSyntaxScore({
        dominance: 'left',
        lesions: [lesion({ segments: ['s16'] })], // RCA posterolateral: right only
      }),
    ).toThrow(/not applicable/);
  });

  it('throws when a segment belongs to more than one lesion', () => {
    expect(() =>
      calculateSyntaxScore({
        dominance: 'right',
        lesions: [
          lesion({ segments: ['s6'], id: 'a' }),
          lesion({ segments: ['s6'], id: 'b' }),
        ],
      }),
    ).toThrow(/more than one lesion/);
  });

  it('throws for a lesion with no segments', () => {
    expect(() =>
      calculateSyntaxScore({
        dominance: 'right',
        lesions: [{ ...newLesion('a', 's6'), segments: [] }],
      }),
    ).toThrow(/no segments/);
  });
});

describe('interpretScore — risk boundaries (thresholds 22 and 32)', () => {
  it.each([
    [0, 'low'],
    [22, 'low'],
    [22.5, 'intermediate'],
    [23, 'intermediate'],
    [32, 'intermediate'],
    [32.5, 'high'],
    [33, 'high'],
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

  it('keeps the non-dominant RCA segments (weight 0, not null) in left dominance', () => {
    const segments = applicableSegments('left');
    expect(segments).toContain('s1');
    expect(segments).toContain('s3');
  });
});

describe('tables completeness', () => {
  it('every segment has a weight entry', () => {
    for (const id of SEGMENT_IDS) {
      expect(DEFAULT_SEGMENT_WEIGHTS[id]).toBeDefined();
    }
  });

  it('default thresholds match the published 22/32 bands', () => {
    expect(DEFAULT_SCORING.lowMax).toBe(22);
    expect(DEFAULT_SCORING.intermediateMax).toBe(32);
  });
});
