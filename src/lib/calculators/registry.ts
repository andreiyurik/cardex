/**
 * Calculator registry — the single list every page, the home catalog,
 * the sitemap and the golden-case test harness iterate over. Adding a
 * calculator is one import + one array entry; no new pages required.
 */
import type { CalculatorDefinition } from './types';
import { syntaxDefinition } from './syntax';
import { cha2ds2VascDefinition } from './cha2ds2-vasc';
import { hasBledDefinition } from './has-bled';
import { graceDefinition } from './grace';
import { mehranDefinition } from './mehran';
import { creatinineClearanceDefinition } from './creatinine-clearance';

export const calculators: CalculatorDefinition[] = [
  syntaxDefinition,
  cha2ds2VascDefinition,
  hasBledDefinition,
  graceDefinition,
  mehranDefinition,
  creatinineClearanceDefinition,
];

export function getCalculator(slug: string): CalculatorDefinition {
  const found = calculators.find((c) => c.slug === slug);
  if (!found) throw new Error(`Unknown calculator: ${slug}`);
  return found;
}
