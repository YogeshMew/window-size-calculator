/**
 * WindowMetrics — Window Opening Calculation Engine
 *
 * Pure TypeScript construction calculation engine.
 * Calculates required rough opening, finished opening, required framing dimensions,
 * shim clearances (side, top, bottom), diagonal squareness tolerance, and installation difficulty.
 *
 * Standard Construction Standards:
 * - Rough Opening Width = Window Frame Width + Total Shim Gap (typically +0.5" / 12.7mm to +0.75" / 19.05mm)
 * - Rough Opening Height = Window Frame Height + Total Shim Gap + Sill Allowance (typically +0.5" to +0.75")
 * - Diagonal Tolerance: Max 1/8" (3.175mm) difference for squareness.
 */

import type { MeasurementUnit } from '@/types/calculator.js';

export type WindowOpeningInstallationType = 'replacement' | 'new-construction' | 'retrofit';
export type WindowOpeningFramingMaterial = 'wood' | 'steel' | 'concrete';
export type WindowOpeningStyle =
  | 'single-hung'
  | 'double-hung'
  | 'casement'
  | 'sliding'
  | 'picture'
  | 'awning'
  | 'bay'
  | 'bow';

export type WindowOpeningWarnLevel = 'error' | 'warning' | 'info';
export type WindowOpeningConfidence = 'excellent' | 'good' | 'minor-adjustment' | 'custom-required';
export type WindowOpeningToleranceRating = 'exact' | 'acceptable' | 'tight' | 'oversized';
export type WindowOpeningDifficulty = 'easy' | 'moderate' | 'professional';

export interface WindowOpeningWarning {
  level: WindowOpeningWarnLevel;
  code: string;
  message: string;
}

export interface WindowOpeningInput {
  windowWidthMm: number;
  windowHeightMm: number;
  installationType: WindowOpeningInstallationType;
  frameThicknessMm?: number;
  shimGapMm?: number;
  framingMaterial: WindowOpeningFramingMaterial;
  windowStyle: WindowOpeningStyle;
}

export interface WindowOpeningResult {
  finishedWidthMm: number;
  finishedHeightMm: number;

  roughOpeningWidthMm: number;
  roughOpeningHeightMm: number;
  roughOpeningWidthIn: number;
  roughOpeningHeightIn: number;

  sideClearanceMm: number;
  topClearanceMm: number;
  bottomClearanceMm: number;
  totalShimGapWidthMm: number;
  totalShimGapHeightMm: number;

  framingHeaderWidthMm: number;
  framingJackStudHeightMm: number;

  diagonalLengthMm: number;
  maxDiagonalDiffMm: number;
  squarenessToleranceNote: string;

  toleranceRating: WindowOpeningToleranceRating;
  installationDifficulty: WindowOpeningDifficulty;

  isOpeningTooSmall: boolean;
  isOpeningAcceptable: boolean;
  isOpeningOversized: boolean;
  frameAdjustmentRequired: boolean;
  additionalShimmingRequired: boolean;
  customFramingRequired: boolean;

  confidence: WindowOpeningConfidence;
  warnings: WindowOpeningWarning[];
}

// ---------------------------------------------------------------------------
// Construction Clearance Constants (No magic numbers)
// ---------------------------------------------------------------------------

export const WINDOW_OPENING_DEFAULTS = {
  MIN_WINDOW_WIDTH_MM: 152.4, // 6"
  MIN_WINDOW_HEIGHT_MM: 152.4, // 6"
  DEFAULT_SHIM_GAP_PER_SIDE_MM: 6.35, // 1/4" per side -> 1/2" total (12.7mm)
  DEFAULT_FRAME_THICKNESS_MM: 19.05, // 3/4" standard vinyl/wood frame profile
  MAX_SQUARENESS_DIAG_DIFF_MM: 3.175, // 1/8" max diagonal difference
  STUD_THICKNESS_MM: 38.1, // 1.5" standard 2x4 / 2x6 stud
  HEADER_DEPTH_MM: 88.9, // 3.5" double header
};

export const INSTALLATION_SHIM_ALLOWANCE_MM: Record<WindowOpeningInstallationType, { side: number; top: number; bottom: number }> = {
  'new-construction': { side: 6.35, top: 6.35, bottom: 6.35 }, // 1/2" total width & height
  replacement: { side: 4.76, top: 4.76, bottom: 4.76 },       // 3/8" tighter fit in existing pocket
  retrofit: { side: 9.525, top: 9.525, bottom: 9.525 },       // 3/4" extra expansion room for uneven frames
};

// ---------------------------------------------------------------------------
// Main calculation engine
// ---------------------------------------------------------------------------

export function calculateWindowOpening(input: WindowOpeningInput): WindowOpeningResult {
  const warnings: WindowOpeningWarning[] = [];

  const wMm = Math.max(WINDOW_OPENING_DEFAULTS.MIN_WINDOW_WIDTH_MM, input.windowWidthMm);
  const hMm = Math.max(WINDOW_OPENING_DEFAULTS.MIN_WINDOW_HEIGHT_MM, input.windowHeightMm);

  const defaults = INSTALLATION_SHIM_ALLOWANCE_MM[input.installationType] || INSTALLATION_SHIM_ALLOWANCE_MM['new-construction'];

  // 1. Shim clearances
  const sideClearanceMm = input.shimGapMm !== undefined ? input.shimGapMm / 2 : defaults.side;
  const topClearanceMm = input.shimGapMm !== undefined ? input.shimGapMm / 2 : defaults.top;
  const bottomClearanceMm = input.shimGapMm !== undefined ? input.shimGapMm / 2 : defaults.bottom;

  const totalShimGapWidthMm = sideClearanceMm * 2;
  const totalShimGapHeightMm = topClearanceMm + bottomClearanceMm;

  // 2. Finished Opening (exact window unit dimensions)
  const finishedWidthMm = wMm;
  const finishedHeightMm = hMm;

  // 3. Required Rough Opening
  const roughOpeningWidthMm = finishedWidthMm + totalShimGapWidthMm;
  const roughOpeningHeightMm = finishedHeightMm + totalShimGapHeightMm;

  const roughOpeningWidthIn = Math.round((roughOpeningWidthMm / 25.4) * 100) / 100;
  const roughOpeningHeightIn = Math.round((roughOpeningHeightMm / 25.4) * 100) / 100;

  // 4. Required Framing Dimensions (Header & Jack Studs)
  const framingHeaderWidthMm = roughOpeningWidthMm + 2 * WINDOW_OPENING_DEFAULTS.STUD_THICKNESS_MM;
  const framingJackStudHeightMm = roughOpeningHeightMm;

  // 5. Diagonal Squareness & Tolerance
  const diagonalLengthMm = Math.round(Math.sqrt(Math.pow(roughOpeningWidthMm, 2) + Math.pow(roughOpeningHeightMm, 2)));
  const maxDiagonalDiffMm = WINDOW_OPENING_DEFAULTS.MAX_SQUARENESS_DIAG_DIFF_MM; // 1/8" max
  const squarenessToleranceNote = 'Max 1/8" (3.2mm) diagonal difference permitted for plumb & square opening.';

  // 6. Checks & Status Evaluation
  let toleranceRating: WindowOpeningToleranceRating = 'exact';
  if (totalShimGapWidthMm < 6.35) {
    toleranceRating = 'tight';
  } else if (totalShimGapWidthMm > 25.4) {
    toleranceRating = 'oversized';
  } else if (totalShimGapWidthMm >= 12.7 && totalShimGapWidthMm <= 19.05) {
    toleranceRating = 'exact';
  } else {
    toleranceRating = 'acceptable';
  }

  let installationDifficulty: WindowOpeningDifficulty = 'easy';
  if (input.windowStyle === 'bay' || input.windowStyle === 'bow') {
    installationDifficulty = 'professional';
  } else if (input.installationType === 'retrofit' || input.framingMaterial === 'concrete') {
    installationDifficulty = 'moderate';
  } else if (input.installationType === 'new-construction') {
    installationDifficulty = 'easy';
  }

  const isOpeningTooSmall = totalShimGapWidthMm < 3.175; // Less than 1/8" total gap
  const isOpeningOversized = totalShimGapWidthMm > 25.4;  // Greater than 1" total gap
  const isOpeningAcceptable = !isOpeningTooSmall && !isOpeningOversized;

  const frameAdjustmentRequired = isOpeningTooSmall;
  const additionalShimmingRequired = isOpeningOversized;
  const customFramingRequired = input.windowStyle === 'bay' || input.windowStyle === 'bow' || isOpeningTooSmall;

  // 7. Confidence & Warnings
  let confidence: WindowOpeningConfidence = 'excellent';
  if (isOpeningTooSmall || isOpeningOversized) {
    confidence = 'minor-adjustment';
  }

  if (isOpeningTooSmall) {
    warnings.push({
      level: 'error',
      code: 'ROUGH_OPENING_TOO_TIGHT',
      message: 'Rough opening is too tight (<1/8" gap). Frame expanders or stud trimming required to fit unit.',
    });
  }

  if (isOpeningOversized) {
    warnings.push({
      level: 'warning',
      code: 'ROUGH_OPENING_OVERSIZED',
      message: 'Rough opening is oversized (>1" gap). Add 2x4 furring strips or double shims for structural backing.',
    });
  }

  if (input.framingMaterial === 'concrete') {
    warnings.push({
      level: 'info',
      code: 'CONCRETE_MASONRY_OPENING',
      message: 'Concrete/CMU masonry openings require treated wood bucking (1x or 2x lumber) before window installation.',
    });
  }

  return {
    finishedWidthMm,
    finishedHeightMm,
    roughOpeningWidthMm,
    roughOpeningHeightMm,
    roughOpeningWidthIn,
    roughOpeningHeightIn,

    sideClearanceMm: Math.round(sideClearanceMm * 100) / 100,
    topClearanceMm: Math.round(topClearanceMm * 100) / 100,
    bottomClearanceMm: Math.round(bottomClearanceMm * 100) / 100,
    totalShimGapWidthMm: Math.round(totalShimGapWidthMm * 100) / 100,
    totalShimGapHeightMm: Math.round(totalShimGapHeightMm * 100) / 100,

    framingHeaderWidthMm: Math.round(framingHeaderWidthMm * 10) / 10,
    framingJackStudHeightMm: Math.round(framingJackStudHeightMm * 10) / 10,

    diagonalLengthMm,
    maxDiagonalDiffMm,
    squarenessToleranceNote,

    toleranceRating,
    installationDifficulty,

    isOpeningTooSmall,
    isOpeningAcceptable,
    isOpeningOversized,
    frameAdjustmentRequired,
    additionalShimmingRequired,
    customFramingRequired,

    confidence,
    warnings,
  };
}
