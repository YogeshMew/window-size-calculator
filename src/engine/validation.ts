/**
 * WindowMetrics — Validation Engine
 *
 * RULE: Never show technical errors to users.
 * All messages should be helpful, human, and actionable.
 *
 * Validation operates on mm values (after unit conversion).
 */

import type { ValidationResult, Dimensions } from '@/types/calculator.js';

// ---------------------------------------------------------------------------
// Physical constraints
// ---------------------------------------------------------------------------

/** Minimum reasonable window dimension in mm (roughly 1 inch) */
const MIN_DIMENSION_MM = 25;

/** Maximum reasonable window dimension in mm (roughly 30 feet) */
const MAX_DIMENSION_MM = 9_144;

/** Maximum reasonable aspect ratio (width:height or height:width) */
const MAX_ASPECT_RATIO = 10;

// ---------------------------------------------------------------------------
// Validation functions
// ---------------------------------------------------------------------------

/**
 * Validate that a single dimension value is a usable number.
 * Checks for: NaN, negative, zero, out-of-range.
 *
 * @param valueMm  The value in millimeters
 * @param field    'width' or 'height' — used in error messages
 */
export function validateDimension(
  valueMm: number,
  field: 'width' | 'height',
): ValidationResult {
  const label = field === 'width' ? 'width' : 'height';

  if (isNaN(valueMm) || !isFinite(valueMm)) {
    return {
      valid: false,
      field,
      message: `Please enter a valid ${label} measurement.`,
    };
  }

  if (valueMm <= 0) {
    return {
      valid: false,
      field,
      message: `The ${label} must be greater than zero.`,
    };
  }

  if (valueMm < MIN_DIMENSION_MM) {
    return {
      valid: false,
      field,
      message: `The ${label} seems too small. Please check your measurement.`,
    };
  }

  if (valueMm > MAX_DIMENSION_MM) {
    return {
      valid: false,
      field,
      message: `The ${label} seems unusually large. Please check your measurement — the maximum supported is 30 feet (9,144 mm).`,
    };
  }

  return { valid: true };
}

/**
 * Validate both dimensions and their relationship.
 * Returns the first error encountered.
 */
export function validateDimensions(dimensions: Dimensions): ValidationResult {
  const widthResult = validateDimension(dimensions.widthMm, 'width');
  if (!widthResult.valid) return widthResult;

  const heightResult = validateDimension(dimensions.heightMm, 'height');
  if (!heightResult.valid) return heightResult;

  // Check aspect ratio — extreme proportions are likely input errors
  const ratio = dimensions.widthMm / dimensions.heightMm;
  if (ratio > MAX_ASPECT_RATIO || ratio < 1 / MAX_ASPECT_RATIO) {
    return {
      valid: false,
      field: 'general',
      message:
        'The proportions of this window seem unusual. Please double-check your width and height measurements.',
    };
  }

  return { valid: true };
}

/**
 * Validate a numeric range check.
 * Used for business-rule validation (e.g. egress minimums).
 */
export function validateRange(
  valueMm: number,
  minMm: number,
  maxMm: number,
): ValidationResult {
  if (valueMm < minMm) {
    return {
      valid: false,
      field: 'general',
      message: `This measurement is below the required minimum.`,
    };
  }

  if (valueMm > maxMm) {
    return {
      valid: false,
      field: 'general',
      message: `This measurement exceeds the allowed maximum.`,
    };
  }

  return { valid: true };
}

/**
 * Validate a fractional inch string before parsing.
 * Returns true if the string is parseable, false with friendly message if not.
 */
export function validateFractionString(str: string): ValidationResult {
  if (!str || str.trim() === '') {
    return {
      valid: false,
      field: 'general',
      message: 'Please enter a measurement.',
    };
  }

  // Allow: digits, spaces, periods, hyphens, forward-slash
  const allowedPattern = /^[\d\s./\-]+$/;
  if (!allowedPattern.test(str)) {
    return {
      valid: false,
      field: 'general',
      message:
        'Please enter a measurement as a number (e.g. "36", "36.5", or "36 1/2" for fractional inches).',
    };
  }

  // Check fraction format when slash is present
  if (str.includes('/')) {
    const fractionPattern = /^\d+(\s+\d+\/\d+|\s+-\d+\/\d+|\/\d+)?$/;
    if (!fractionPattern.test(str.trim())) {
      return {
        valid: false,
        field: 'general',
        message:
          'For fractional inches, use the format "34 1/2" (whole number, space, fraction).',
      };
    }
  }

  return { valid: true };
}
