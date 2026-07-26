/**
 * WindowMetrics — Recommendation Engine
 *
 * Converts raw window dimensions into actionable, human-readable decisions.
 * All inputs are in millimeters. All outputs are in the types defined in
 * src/types/calculator.ts.
 *
 * Modules:
 *   - calculateCurtainRecommendations()
 *   - calculateBlindRecommendations()
 *   - calculateACBTURecommendation()
 *   - generateReplacementRecommendation()
 */

import type {
  Dimensions,
  CurtainRecommendation,
  BlindRecommendation,
  ACBTUResult,
  ReplacementRecommendation,
  StandardRegion,
} from '@/types/calculator.js';

import { findNearestStandardSize } from './standards.js';

// ---------------------------------------------------------------------------
// Curtains
// ---------------------------------------------------------------------------

/**
 * Calculate curtain sizing recommendations for a window.
 *
 * Industry standards used:
 * - Minimum coverage (1.5×): panels hang close to window without fullness
 * - Full/luxury coverage (2×): professional "gathered" look
 * - Rod length: window width + 150 mm (6") extension each side for hardware clearance
 * - Headrail allowance: 200 mm (8") above window frame — standard decorating practice
 *
 * @param dimensions  Window frame width and height in mm
 * @returns           Full curtain sizing recommendation
 *
 * @example
 * calculateCurtainRecommendations({ widthMm: 914.4, heightMm: 1219.2 })
 * // → { minWidthMm: 1371.6, fullWidthMm: 1828.8, dropMm: 1419.2, rodLengthMm: 1214.4, ... }
 */
export function calculateCurtainRecommendations(
  dimensions: Dimensions,
): CurtainRecommendation {
  const { widthMm, heightMm } = dimensions;

  /** 8 inches above the window frame for the rod and heading */
  const HEADRAIL_ALLOWANCE_MM = 200;

  /** 6 inches (152.4 mm) extension each side for curtain stack and hardware */
  const SIDE_EXTENSION_MM = 152.4;

  return {
    minWidthMm:          widthMm * 1.5,
    fullWidthMm:         widthMm * 2.0,
    dropMm:              heightMm + HEADRAIL_ALLOWANCE_MM,
    rodLengthMm:         widthMm + SIDE_EXTENSION_MM * 2,
    headrailAllowanceMm: HEADRAIL_ALLOWANCE_MM,
    sideExtensionMm:     SIDE_EXTENSION_MM,
  };
}

// ---------------------------------------------------------------------------
// Blinds
// ---------------------------------------------------------------------------

/**
 * Calculate blind sizing recommendations for inside or outside mount.
 *
 * Industry standards used:
 * - Inside mount deduction: 12.7 mm (0.5") per side = 25.4 mm total from width
 * - Outside mount addition: 76.2 mm (3") per side = 152.4 mm total to width
 * - Outside mount drop addition: 50.8 mm (2") for full light blockage at sill
 *
 * Note: Specific blind brands may have different deduction requirements.
 * These are standard starting measurements — always confirm with manufacturer specs.
 *
 * @param dimensions  Window frame width and height in mm
 * @returns           Inside and outside mount recommendations
 *
 * @example
 * calculateBlindRecommendations({ widthMm: 914.4, heightMm: 1219.2 })
 * // → { insideWidthMm: 889.0, outsideWidthMm: 1066.8, insideDropMm: 1219.2, outsideDropMm: 1270.0 }
 */
export function calculateBlindRecommendations(
  dimensions: Dimensions,
): BlindRecommendation {
  const { widthMm, heightMm } = dimensions;

  /** Standard inside-mount deduction: 0.5" per side = 1" total */
  const INSIDE_DEDUCTION_EACH_SIDE_MM = 6.35;

  /** Standard outside-mount extension: 3" per side */
  const OUTSIDE_EXTENSION_EACH_SIDE_MM = 76.2;

  /** Extra drop for outside mount to cover window sill */
  const OUTSIDE_DROP_ADDITION_MM = 50.8;

  return {
    insideWidthMm:  widthMm  - (INSIDE_DEDUCTION_EACH_SIDE_MM * 2),
    outsideWidthMm: widthMm  + (OUTSIDE_EXTENSION_EACH_SIDE_MM * 2),
    insideDropMm:   heightMm,
    outsideDropMm:  heightMm + OUTSIDE_DROP_ADDITION_MM,
  };
}

// ---------------------------------------------------------------------------
// Air Conditioning (BTU)
// ---------------------------------------------------------------------------

/**
 * Minimum window opening size for a standard 5,000 BTU window AC unit.
 * Most window units require a minimum opening of ~24" wide × 13" tall.
 */
const STANDARD_AC_MIN_OPENING_MM = { width: 609.6, height: 330.2 };

/**
 * Calculate an AC BTU recommendation based on window dimensions.
 *
 * IMPORTANT: A full BTU calculation requires room area, ceiling height, sun
 * exposure, and insulation. This function provides a window-based estimate
 * based on Energy Star cooling capacity guidelines.
 *
 * Approach:
 * - A 100 sq ft room requires ~5,000 BTU
 * - Window area in sq ft is used as a proxy for room size (assumes window is
 *   ~8% of floor area — typical residential ratio)
 * - Suggest ±1 BTU tier for sun exposure adjustment
 *
 * @param dimensions  Window opening width and height in mm
 * @returns           BTU recommendation with context
 *
 * @example
 * calculateACBTURecommendation({ widthMm: 914.4, heightMm: 1219.2 })
 * // → { suggestedBTUMin: 5000, suggestedBTUMax: 8000, fitsStandardUnit: true, ... }
 */
export function calculateACBTURecommendation(
  dimensions: Dimensions,
): ACBTUResult {
  const { widthMm, heightMm } = dimensions;

  const windowAreaM2 = (widthMm * heightMm) / 1_000_000;
  const windowAreaSqFt = windowAreaM2 * 10.764;

  // Typical residential ratio: window area ≈ 8% of floor area
  const estimatedRoomSqFt = windowAreaSqFt / 0.08;

  // Energy Star BTU guideline: 20 BTU per sq ft of cooled area
  const baseBTU = estimatedRoomSqFt * 20;

  // Round to nearest 1,000 BTU tier
  const roundedBTU = Math.max(5000, Math.round(baseBTU / 1000) * 1000);

  // Determine if a standard window AC unit physically fits the opening
  const fitsStandardUnit =
    widthMm >= STANDARD_AC_MIN_OPENING_MM.width &&
    heightMm >= STANDARD_AC_MIN_OPENING_MM.height;

  // Suggested range: ±1 tier from base (for sun/shade/insulation variation)
  const suggestedBTUMin = Math.max(5000,  roundedBTU - 2000);
  const suggestedBTUMax = roundedBTU + 2000;

  const note = fitsStandardUnit
    ? 'Opening fits standard window AC units. For accuracy, measure your room area.'
    : 'Opening may be too small for a standard window AC unit (typically needs 24" × 13" minimum).';

  return {
    windowAreaM2,
    suggestedBTUMin,
    suggestedBTUMax,
    fitsStandardUnit,
    note,
  };
}

// ---------------------------------------------------------------------------
// Replacement Planning
// ---------------------------------------------------------------------------

/**
 * Generate a replacement window planning recommendation.
 *
 * Key calculations:
 * - Rough opening = frame dimensions + 12.7 mm (0.5") each side per industry practice
 * - A custom order is required when the window is more than 4" from any standard size
 *
 * @param dimensions  Measured frame width and height in mm
 * @param region      Standard size region for comparison (default: 'US')
 * @returns           Full replacement recommendation including rough opening
 *
 * @example
 * generateReplacementRecommendation({ widthMm: 914.4, heightMm: 1219.2 }, 'US')
 * // → {
 * //     standardMatch: { nearest: { widthIn: 36, heightIn: 48 }, isExact: true, ... },
 * //     roughOpeningWidthMm: 939.8,
 * //     roughOpeningHeightMm: 1244.6,
 * //     isStandardAvailable: true,
 * //     requiresCustomOrder: false,
 * //     shimSpaceMm: 12.7,
 * //     notes: [...],
 * //   }
 */
export function generateReplacementRecommendation(
  dimensions: Dimensions,
  region: StandardRegion = 'US',
): ReplacementRecommendation {
  const { widthMm, heightMm } = dimensions;

  /** 0.5" shim space per side — standard replacement installation practice */
  const SHIM_SPACE_MM = 12.7;

  const standardMatch = findNearestStandardSize(widthMm, heightMm, region);

  const roughOpeningWidthMm  = widthMm  + SHIM_SPACE_MM * 2;
  const roughOpeningHeightMm = heightMm + SHIM_SPACE_MM * 2;

  const isStandardAvailable = standardMatch.isClose;
  const requiresCustomOrder  = !standardMatch.isClose;

  const notes: string[] = [];

  if (standardMatch.isExact) {
    notes.push(
      `Your window matches ${standardMatch.nearest.widthIn}" × ${standardMatch.nearest.heightIn}" — a standard US size. Stock replacements are widely available.`,
    );
  } else if (standardMatch.isClose) {
    const { diffWidthIn, diffHeightIn } = standardMatch;
    notes.push(
      `Nearest standard is ${standardMatch.nearest.widthIn}" × ${standardMatch.nearest.heightIn}" (${diffWidthIn > 0 ? '+' : ''}${diffWidthIn}" W, ${diffHeightIn > 0 ? '+' : ''}${diffHeightIn}" H). This may fit with shimming.`,
    );
  } else {
    notes.push(
      `No close standard size found. A custom-ordered replacement or rough opening modification will be needed.`,
    );
  }

  notes.push(`Rough opening: ${Math.round(roughOpeningWidthMm)}" × ${Math.round(roughOpeningHeightMm)}" (frame + 0.5" each side for shimming).`);

  return {
    standardMatch,
    roughOpeningWidthMm,
    roughOpeningHeightMm,
    isStandardAvailable,
    requiresCustomOrder,
    shimSpaceMm: SHIM_SPACE_MM,
    notes,
  };
}
