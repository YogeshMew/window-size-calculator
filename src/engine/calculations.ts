/**
 * WindowMetrics — Core Calculations
 *
 * RULE: All inputs and outputs are in millimeters.
 * Formatting for display is handled by src/engine/units.ts.
 * Recommendation logic lives in src/engine/recommendations.ts.
 * Standard-size lookups live in src/engine/standards.ts.
 */

import type { Dimensions, GlassSpecification, GlassResult } from '@/types/calculator.js';

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

/**
 * Calculate the area of a window opening in mm².
 *
 * @param dimensions  Width and height in mm
 * @returns Area in mm²
 *
 * @example calculateArea({ widthMm: 914.4, heightMm: 1219.2 }) → 1_114_838.08
 */
export function calculateArea(dimensions: Dimensions): number {
  return dimensions.widthMm * dimensions.heightMm;
}

/**
 * Calculate the perimeter of a window opening in mm.
 *
 * @param dimensions  Width and height in mm
 * @returns Perimeter in mm
 *
 * @example calculatePerimeter({ widthMm: 914.4, heightMm: 1219.2 }) → 4_267.2
 */
export function calculatePerimeter(dimensions: Dimensions): number {
  return 2 * (dimensions.widthMm + dimensions.heightMm);
}

/**
 * Calculate the diagonal of a window opening (corner-to-corner) in mm.
 * Useful for verifying squareness and for frame ordering.
 *
 * @param dimensions  Width and height in mm
 * @returns Diagonal in mm (Pythagorean theorem)
 *
 * @example calculateDiagonal({ widthMm: 914.4, heightMm: 1219.2 }) → 1524.0
 */
export function calculateDiagonal(dimensions: Dimensions): number {
  return Math.sqrt(dimensions.widthMm ** 2 + dimensions.heightMm ** 2);
}

/**
 * Calculate the aspect ratio of a window as a simplified integer ratio string.
 *
 * @param dimensions  Width and height in mm
 * @returns Aspect ratio string like "3:4" or "1:1"
 *
 * @example calculateAspectRatio({ widthMm: 900, heightMm: 1200 }) → "3:4"
 */
export function calculateAspectRatio(dimensions: Dimensions): string {
  const { widthMm, heightMm } = dimensions;

  function gcd(a: number, b: number): number {
    a = Math.round(a);
    b = Math.round(b);
    return b === 0 ? a : gcd(b, a % b);
  }

  // Work in integer millimeters for a clean simplified ratio
  const w = Math.round(widthMm);
  const h = Math.round(heightMm);
  const divisor = gcd(w, h);

  return `${w / divisor}:${h / divisor}`;
}

// ---------------------------------------------------------------------------
// Glass
// ---------------------------------------------------------------------------

/**
 * Calculate the glazing area of a window in mm².
 *
 * The glazing area is the glass surface — smaller than the frame opening.
 * The `frameRatio` accounts for the frame eating into the opening.
 * Standard residential frames leave 85–92% as visible glass; 0.9 is the default.
 *
 * @param dimensions  Frame opening width and height in mm
 * @param frameRatio  Proportion of opening that is glass (default 0.9)
 * @returns           Net glazing area in mm²
 *
 * @example calculateGlassArea({ widthMm: 914.4, heightMm: 1219.2 }) → 1_003_354.27
 */
export function calculateGlassArea(dimensions: Dimensions, frameRatio = 0.9): number {
  return dimensions.widthMm * dimensions.heightMm * frameRatio;
}

/**
 * Calculate the glass weight and area metrics for a window.
 *
 * Glass density reference:
 * - 4 mm glass: ~10.4 kg/m² (~2.13 lbs/sq ft) — standard single pane
 * - 6 mm glass: ~15.6 kg/m² (~3.20 lbs/sq ft) — heavy single pane
 * - Double pane (2×4mm): ~20.8 kg/m²
 * - Triple pane (3×4mm): ~31.2 kg/m²
 *
 * @param glazingAreaMm2  Net glazing area in mm² (from calculateGlassArea)
 * @param spec            Glass specification (panes, thickness per pane)
 * @returns               Full glass result including weights and area conversions
 *
 * @example
 * const area = calculateGlassArea({ widthMm: 914.4, heightMm: 1219.2 });
 * calculateGlassWeight(area, { panes: 1, thicknessMmPerPane: 4 })
 * // → { glazingAreaSqFt: ~10.8, totalWeightKg: ~11.2, totalWeightLbs: ~24.8, ... }
 */
export function calculateGlassWeight(
  glazingAreaMm2: number,
  spec: GlassSpecification = { panes: 1, thicknessMmPerPane: 4 },
): GlassResult {
  // 2.5 kg per m² per mm of thickness (industry standard for float glass)
  const KG_PER_M2_PER_MM = 2.5;
  const totalThicknessMm = spec.panes * spec.thicknessMmPerPane;
  const weightKgPerM2 = KG_PER_M2_PER_MM * totalThicknessMm;

  const areaM2 = glazingAreaMm2 / 1_000_000;
  const areaSqFt = glazingAreaMm2 / (304.8 ** 2);

  const totalWeightKg = areaM2 * weightKgPerM2;
  const totalWeightLbs = totalWeightKg * 2.20462;

  return {
    glazingAreaMm2,
    glazingAreaSqFt: areaSqFt,
    weightKgPerM2,
    totalWeightKg,
    totalWeightLbs,
    // 10% cutting waste allowance (standard glass trade practice)
    cutAreaMm2: glazingAreaMm2 * 1.1,
  };
}
