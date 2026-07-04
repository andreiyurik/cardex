import type { SegmentId } from '../../lib/calculators/syntax';

/**
 * Schematic 2D layout of coronary segments for the SVG diagram.
 * These are DRAWING coordinates only — not clinical data. The short
 * `label` is the on-diagram segment number; full names come from i18n.
 * Left branches on the left, right coronary on the right of the 400×320
 * canvas. A future revision can replace this with an anatomically
 * faithful path set without touching the scoring logic.
 */
export interface SegmentGeometry {
  id: SegmentId;
  label: string;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
}

export const CoronaryTree: SegmentGeometry[] = [
  // Left main + LAD (left side, running down)
  { id: 's5', label: '5', x1: 150, y1: 40, x2: 150, y2: 80 }, // Left main
  { id: 's6', label: '6', x1: 150, y1: 80, x2: 130, y2: 130 }, // LAD prox
  { id: 's7', label: '7', x1: 130, y1: 130, x2: 115, y2: 190 }, // LAD mid
  { id: 's8', label: '8', x1: 115, y1: 190, x2: 105, y2: 250 }, // LAD apical
  { id: 's9', label: '9', x1: 130, y1: 130, x2: 70, y2: 150 }, // D1
  { id: 's10', label: '10', x1: 115, y1: 190, x2: 55, y2: 210 }, // D2
  // LCx (left side, curving)
  { id: 's11', label: '11', x1: 150, y1: 80, x2: 185, y2: 120 }, // LCx prox
  { id: 's12', label: '12', x1: 185, y1: 120, x2: 230, y2: 120 }, // OM
  { id: 's13', label: '13', x1: 185, y1: 120, x2: 195, y2: 180 }, // LCx distal
  { id: 's14', label: '14', x1: 195, y1: 180, x2: 175, y2: 235 }, // PL of LCx
  { id: 's15', label: '15', x1: 195, y1: 180, x2: 215, y2: 240 }, // PDA from LCx (left dom)
  // RCA (right side, running down and around)
  { id: 's1', label: '1', x1: 320, y1: 45, x2: 330, y2: 105 }, // RCA prox
  { id: 's2', label: '2', x1: 330, y1: 105, x2: 320, y2: 170 }, // RCA mid
  { id: 's3', label: '3', x1: 320, y1: 170, x2: 290, y2: 220 }, // RCA distal
  { id: 's4', label: '4', x1: 290, y1: 220, x2: 265, y2: 265 }, // PDA from RCA (right dom)
  { id: 's16', label: '16', x1: 290, y1: 220, x2: 320, y2: 265 }, // PL of RCA (right dom)
];
