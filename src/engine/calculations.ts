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
 * Calculate the aspect ratio of a window as a human-readable ratio string.
 *
 * Strategy:
 * 1. Try to reduce integer millimeters — works for metric windows (900×1200 → 3:4).
 * 2. Try to reduce integer inches — works for US inch-based sizes (914.4×1219.2 mm = 36"×48" → 3:4).
 * 3. Fall back to a decimal "W:1" ratio (e.g. "0.75:1") when no clean integer ratio exists.
 *    Both parts of the integer ratio must be ≤ 30 to be considered "readable".
 *
 * @param dimensions  Width and height in mm
 * @returns Aspect ratio string like "3:4", "16:9", or "0.75:1"
 *
 * @example calculateAspectRatio({ widthMm: 900, heightMm: 1200 }) → "3:4"
 * @example calculateAspectRatio({ widthMm: 914.4, heightMm: 1219.2 }) → "3:4"
 * @example calculateAspectRatio({ widthMm: 927, heightMm: 1229 }) → "0.75:1"
 */
export function calculateAspectRatio(dimensions: Dimensions): string {
  const { widthMm, heightMm } = dimensions;

  function gcd(a: number, b: number): number {
    return b === 0 ? a : gcd(b, a % b);
  }

  /**
   * Try to express w:h as a simplified integer ratio.
   * Returns the ratio string only if both simplified parts are ≤ 30 (readable).
   */
  function tryIntegerRatio(w: number, h: number): string | null {
    const rw = Math.round(w);
    const rh = Math.round(h);
    if (rw <= 0 || rh <= 0) return null;
    const d = gcd(rw, rh);
    const sw = rw / d;
    const sh = rh / d;
    return sw <= 30 && sh <= 30 ? `${sw}:${sh}` : null;
  }

  // Pass 1: integer millimeters (e.g. 900×1200 mm → 3:4)
  const mmRatio = tryIntegerRatio(widthMm, heightMm);
  if (mmRatio) return mmRatio;

  // Pass 2: integer inches (e.g. 914.4×1219.2 mm = 36"×48" → 3:4)
  const inchRatio = tryIntegerRatio(widthMm / 25.4, heightMm / 25.4);
  if (inchRatio) return inchRatio;

  // Pass 3: decimal W:1 ratio — always readable (e.g. "0.75:1", "1.33:1")
  return `${(widthMm / heightMm).toFixed(2)}:1`;
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
 * @example calculateNetGlassArea({ widthMm: 914.4, heightMm: 1219.2 }) → 1_003_354.27
 */
export function calculateNetGlassArea(dimensions: Dimensions, frameRatio = 0.9): number {
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
 * @param glazingAreaMm2  Net glazing area in mm² (from calculateNetGlassArea)
 * @param spec            Glass specification (panes, thickness per pane)
 * @returns               Full glass result including weights and area conversions
 *
 * @example
 * const area = calculateNetGlassArea({ widthMm: 914.4, heightMm: 1219.2 });
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
