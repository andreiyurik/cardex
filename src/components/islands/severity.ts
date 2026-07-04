import type { Severity } from '../../lib/calculators/types';

/** Tailwind text-color class for a clinical severity. */
export function severityText(s: Severity): string {
  switch (s) {
    case 'low':
      return 'text-success';
    case 'moderate':
      return 'text-warning';
    default:
      return 'text-error'; // high, very-high
  }
}

/** Tailwind border-color class for a clinical severity. */
export function severityBorder(s: Severity): string {
  switch (s) {
    case 'low':
      return 'border-success/40';
    case 'moderate':
      return 'border-warning/40';
    default:
      return 'border-error/40';
  }
}
