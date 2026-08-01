/**
 * WindowMetrics — Replacement Window Calculation Engine
 *
 * Pure mathematical computation module for replacement window sizing.
 * Converts user measurement inputs, measurement profile, installation type,
 * and region into exact geometric frame sizes, nearest standard size matches,
 * match percentages, distance scores, rough opening dimensions, shim spaces,
 * cost impact tiers, and DIY difficulty ratings.
 *
 * All distance thresholds are exported as constants — NO magic numbers.
 *
 * TODO: Future expansion for manufacturer-specific standard databases:
 * Andersen, Pella, Marvin, JELD-WEN, Milgard.
 */

import type {
  DetailedReplacementInput,
  ReplacementCalculationResult,
  ReplacementConfidence,
  CostImpactTier,
  DIYDifficulty,
} from '@/types/calculator.js';

import { toMm } from './units.js';
import { findNearestStandardSize, findTopStandardSizes } from './standards.js';

// ---------------------------------------------------------------------------
// Exported Threshold Constants (No Magic Numbers)
// ---------------------------------------------------------------------------

export const REPLACEMENT_THRESHOLDS = {
  /** Maximum Euclidean distance in inches for an Excellent match (<= 0.5") */
  EXCELLENT_MAX_DISTANCE_IN: 0.5,
  /** Maximum Euclidean distance in inches for a Good match (<= 2.0") */
  GOOD_MAX_DISTANCE_IN: 2.0,
  /** Maximum Euclidean distance in inches for a Possible match (<= 4.0") */
  POSSIBLE_MAX_DISTANCE_IN: 4.0,
  /** Minimum distance in inches that forces a Custom Window Order (>= 4.0") */
  CUSTOM_MIN_DISTANCE_IN: 4.0,
  /** Distance in inches where match score drops to 0% (12") */
  MAX_MATCH_SCORE_DISTANCE_IN: 12.0,
} as const;

/** Shim space per side in mm (0.5" per side = 12.7 mm) */
export const SHIM_SPACE_FULL_FRAME_MM = 12.7;

/** Shim space per side in mm for Insert Replacement (0.25" per side = 6.35 mm) */
export const SHIM_SPACE_INSERT_MM = 6.35;

/** Shim space per side in mm for New Construction (0.5" per side = 12.7 mm) */
export const SHIM_SPACE_NEW_CONST_MM = 12.7;

// ---------------------------------------------------------------------------
// Pure Engine Functions
// ---------------------------------------------------------------------------

/**
 * Perform pure mathematical replacement window calculations.
 *
 * @param input Detailed measurement and profile input
 * @returns Pure ReplacementCalculationResult (no UI text/cards)
 */
export function calculateReplacementWindow(
  input: DetailedReplacementInput,
): ReplacementCalculationResult {
  const {
    width,
    height,
    unit,
    region = 'US',
    measurementType = 'existing-window',
    windowType = 'double-hung',
    installationType = 'full-frame',
  } = input;

  // 1. Normalize user dimensions to mm
  const inputWidthMm  = toMm(width, unit);
  const inputHeightMm = toMm(height, unit);

  // 2. Adjust for measurement profile to derive true net window frame size
  let frameWidthMm  = inputWidthMm;
  let frameHeightMm = inputHeightMm;

  switch (measurementType) {
    case 'rough-opening':
      // Deduct shim allowance (12.7mm per side = 25.4mm total) to get frame size
      frameWidthMm  = Math.max(100, inputWidthMm  - 25.4);
      frameHeightMm = Math.max(100, inputHeightMm - 25.4);
      break;
    case 'glass-only':
      // Glass is roughly 85% of window frame dimension
      frameWidthMm  = inputWidthMm  / 0.85;
      frameHeightMm = inputHeightMm / 0.85;
      break;
    case 'existing-window':
    case 'frame-size':
    default:
      // Direct frame dimensions
      frameWidthMm  = inputWidthMm;
      frameHeightMm = inputHeightMm;
      break;
  }

  // 3. Find nearest regional standard size (using net frame size) & top 3 candidates
  const standardMatch = findNearestStandardSize(frameWidthMm, frameHeightMm, region);
  const topMatches    = findTopStandardSizes(frameWidthMm, frameHeightMm, region, 3);
  const distanceIn    = standardMatch.distanceIn;

  // 4. Calculate Standard Match Percentage Score (0–100%)
  const rawScore = 100 * (1 - distanceIn / REPLACEMENT_THRESHOLDS.MAX_MATCH_SCORE_DISTANCE_IN);
  const matchPercentage = Math.max(0, Math.min(100, Math.round(rawScore)));

  // 5. Determine Replacement Confidence rating tier
  let confidence: ReplacementConfidence = 'custom-required';
  if (distanceIn <= REPLACEMENT_THRESHOLDS.EXCELLENT_MAX_DISTANCE_IN) {
    confidence = 'excellent';
  } else if (distanceIn <= REPLACEMENT_THRESHOLDS.GOOD_MAX_DISTANCE_IN) {
    confidence = 'good';
  } else if (distanceIn <= REPLACEMENT_THRESHOLDS.POSSIBLE_MAX_DISTANCE_IN) {
    confidence = 'possible';
  } else {
    confidence = 'custom-required';
  }

  const requiresCustomOrder = confidence === 'custom-required';

  // 6. Calculate Recommended Rough Opening & Shim Space
  let shimSpaceMm = SHIM_SPACE_FULL_FRAME_MM;
  if (installationType === 'insert') {
    shimSpaceMm = SHIM_SPACE_INSERT_MM;
  } else if (installationType === 'new-construction') {
    shimSpaceMm = SHIM_SPACE_NEW_CONST_MM;
  }

  const roughOpeningWidthMm  = Math.round(frameWidthMm  + shimSpaceMm * 2);
  const roughOpeningHeightMm = Math.round(frameHeightMm + shimSpaceMm * 2);
  const clearanceMm          = Math.round(shimSpaceMm * 2);

  // 7. Cost Impact Classification
  let costImpact: CostImpactTier = 'standard-lowest';
  if (requiresCustomOrder) {
    costImpact = 'custom-higher';
  } else if (confidence === 'good' || confidence === 'possible') {
    costImpact = 'minor-customization';
  } else {
    costImpact = 'standard-lowest';
  }

  // 8. DIY Difficulty Estimation
  const frameAreaM2 = (frameWidthMm * frameHeightMm) / 1_000_000;
  let diyDifficulty: DIYDifficulty = 'easy';

  if (installationType === 'new-construction' || frameAreaM2 > 2.5) {
    diyDifficulty = 'professional-recommended';
  } else if (installationType === 'full-frame' || requiresCustomOrder || frameAreaM2 > 1.5) {
    diyDifficulty = 'moderate';
  } else {
    // Small to medium insert replacement
    diyDifficulty = 'easy';
  }

  return {
    widthMm: inputWidthMm,
    heightMm: inputHeightMm,
    displayUnit: unit,
    region,
    measurementType,
    windowType,
    installationType,
    frameWidthMm: Math.round(frameWidthMm),
    frameHeightMm: Math.round(frameHeightMm),
    standardMatch,
    topMatches,
    distanceIn,
    matchPercentage,
    confidence,
    requiresCustomOrder,
    roughOpeningWidthMm,
    roughOpeningHeightMm,
    shimSpaceMm,
    clearanceMm,
    costImpact,
    diyDifficulty,
  };
}
