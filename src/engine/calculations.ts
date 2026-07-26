/**
 * WindowMetrics — Core Calculations
 *
 * Minimal Phase 1 implementation: area and perimeter.
 * Future calculators will add to this file, never duplicate logic.
 *
 * RULE: All inputs and outputs are in millimeters.
 * Formatting for display is handled by src/engine/units.ts.
 */

import type { Dimensions } from '@/types/calculator.js';

// ---------------------------------------------------------------------------
// Phase 1: Area & Perimeter
// ---------------------------------------------------------------------------

/**
 * Calculate the area of a window opening in mm².
 *
 * @param dimensions  Width and height in mm
 * @returns Area in mm²
 *
 * @example
 * calculateArea({ widthMm: 914.4, heightMm: 1219.2 }) → 1_114_838.08
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
 * @example
 * calculatePerimeter({ widthMm: 914.4, heightMm: 1219.2 }) → 4_267.2
 */
export function calculatePerimeter(dimensions: Dimensions): number {
  return 2 * (dimensions.widthMm + dimensions.heightMm);
}

/**
 * Calculate the aspect ratio of a window as a simplified string.
 *
 * @param dimensions  Width and height in mm
 * @returns Aspect ratio string like "3:4" or "1:1"
 *
 * @example
 * calculateAspectRatio({ widthMm: 900, heightMm: 1200 }) → "3:4"
 */
export function calculateAspectRatio(dimensions: Dimensions): string {
  const { widthMm, heightMm } = dimensions;

  function gcd(a: number, b: number): number {
    a = Math.round(a);
    b = Math.round(b);
    return b === 0 ? a : gcd(b, a % b);
  }

  // Work in integer millimeters
  const w = Math.round(widthMm);
  const h = Math.round(heightMm);
  const divisor = gcd(w, h);

  return `${w / divisor}:${h / divisor}`;
}

// ---------------------------------------------------------------------------
// Phase 1+: Stubs for future calculators
// These are intentionally NOT implemented yet — added when each calculator
// is built, following the project principle of no premature implementation.
// ---------------------------------------------------------------------------

/*
 * FUTURE — add when building window-glass-calculator:
 *   export function calculateGlassArea(dimensions, frameWidthMm) { ... }
 *   export function calculateGlassWeight(dimensions, glassSpec) { ... }
 *
 * FUTURE — add when building replacement-window-calculator:
 *   export function calculateNearestStandardSize(dimensions, region) { ... }
 *   export function calculateRoughOpening(dimensions) { ... }
 *   export function calculateReplacementSize(dimensions, tolerance) { ... }
 *
 * FUTURE — add when building curtain/blind calculators:
 *   export function calculateCurtainRecommendation(dimensions) { ... }
 *   export function calculateBlindRecommendation(dimensions, mountType) { ... }
 *
 * FUTURE — add when building egress-window-calculator:
 *   export function calculateEgress(dimensions, code) { ... }
 *
 * FUTURE — add when building window-ac-calculator:
 *   export function calculateBTU(roomArea, climate) { ... }
 *   export function calculateWindowACFit(dimensions) { ... }
 *
 * FUTURE — add when building cost calculators:
 *   export function calculateCostEstimate(dimensions, material, region) { ... }
 */
