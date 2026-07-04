import type { SegmentId } from '../../lib/calculators/syntax';

/**
 * Stylized 2D coronary tree for the SVG diagram. Vessels are curved,
 * tapering SVG paths (proximal wider, distal narrower) laid out to evoke
 * the coronary anatomy — DRAWING data only, not clinical data. `label` is
 * the on-diagram segment number; full names come from i18n; `lx/ly` place
 * the numbered node. A future revision can swap in an anatomically faithful
 * illustration without touching the scoring logic.
 */
export interface SegmentGeometry {
  id: SegmentId;
  label: string;
  /** SVG path (curved vessel). */
  d: string;
  /** Stroke width — vessels taper distally. */
  width: number;
  /** Numbered-node position. */
  lx: number;
  ly: number;
}

export const CoronaryTree: SegmentGeometry[] = [
  // Left main + LAD (anterior, center) tapering toward the apex
  { id: 's5', label: '5', d: 'M150 40 Q149 60 150 80', width: 12, lx: 150, ly: 58 },
  { id: 's6', label: '6', d: 'M150 80 Q142 106 130 130', width: 10, lx: 139, ly: 104 },
  { id: 's7', label: '7', d: 'M130 130 Q120 160 115 190', width: 8, lx: 120, ly: 160 },
  { id: 's8', label: '8', d: 'M115 190 Q108 221 105 250', width: 6, lx: 108, ly: 221 },
  { id: 's9', label: '9', d: 'M130 130 Q100 135 70 150', width: 7, lx: 99, ly: 135 },
  { id: 's10', label: '10', d: 'M115 190 Q85 197 55 210', width: 6, lx: 83, ly: 199 },
  // Left circumflex + marginals (curving down the left AV groove)
  { id: 's11', label: '11', d: 'M150 80 Q172 96 185 120', width: 9, lx: 169, ly: 99 },
  { id: 's12', label: '12', d: 'M185 120 Q208 112 230 120', width: 7, lx: 208, ly: 114 },
  { id: 's13', label: '13', d: 'M185 120 Q196 150 195 180', width: 7, lx: 193, ly: 150 },
  { id: 's14', label: '14', d: 'M195 180 Q190 210 175 235', width: 6, lx: 182, ly: 209 },
  { id: 's15', label: '15', d: 'M195 180 Q212 210 215 240', width: 6, lx: 208, ly: 210 },
  // Right coronary artery sweeping down and around to the crux
  { id: 's1', label: '1', d: 'M322 44 Q334 74 330 105', width: 11, lx: 328, ly: 74 },
  { id: 's2', label: '2', d: 'M330 105 Q336 138 320 170', width: 9, lx: 330, ly: 138 },
  { id: 's3', label: '3', d: 'M320 170 Q312 199 290 220', width: 8, lx: 307, ly: 196 },
  { id: 's4', label: '4', d: 'M290 220 Q279 243 265 265', width: 6, lx: 274, ly: 244 },
  { id: 's16', label: '16', d: 'M290 220 Q306 240 320 265', width: 6, lx: 306, ly: 240 },
];

/** Soft heart/myocardium silhouette behind the vessels (drawing only). */
export const HEART_SILHOUETTE =
  'M210 46 C302 44 364 108 356 190 C349 258 300 300 214 306 ' +
  'C168 309 118 300 94 248 C70 196 74 108 210 46 Z';
