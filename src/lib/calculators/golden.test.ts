import { describe, expect, it } from 'vitest';
import { calculators } from './registry';
import { bandFor } from './types';

/**
 * Generic verification harness: runs every calculator's golden cases
 * through its own compute(). These cases double as the physician's
 * sign-off artifact — a 'verified' case is a real published reference
 * result; a 'placeholder' case only guards mechanics until clinical
 * constants are verified (see TODO(clinical) in each calculator).
 */
for (const def of calculators) {
  describe(`golden cases: ${def.slug} (v${def.version})`, () => {
    it('has at least one golden case', () => {
      expect(def.goldenCases.length).toBeGreaterThan(0);
    });

    for (const gc of def.goldenCases) {
      it(`${gc.id} [${gc.status}] → ${gc.expectedScore} / ${gc.expectedBandId}`, () => {
        const result = def.compute(gc.input);
        expect(result.score).toBeCloseTo(gc.expectedScore, 5);
        expect(result.bandId).toBe(gc.expectedBandId);
        // The computed band id must be one the definition actually declares.
        expect(def.bands.map((b) => b.id)).toContain(result.bandId);
      });
    }

    it('bands are ordered ascending with a single open end', () => {
      const maxes = def.bands.map((b) => b.max);
      expect(maxes[maxes.length - 1]).toBeNull();
      const finite = maxes.slice(0, -1) as number[];
      expect(finite.every((m) => m !== null)).toBe(true);
      expect([...finite].sort((a, b) => a - b)).toEqual(finite);
    });

    it('bandFor resolves fractional scores without gaps', () => {
      const result = bandFor(def.bands[0].max ?? 0 + 0.5, def.bands);
      expect(def.bands).toContain(result);
    });
  });
}
