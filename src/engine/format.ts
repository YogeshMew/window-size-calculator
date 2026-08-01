/**
 * WindowMetrics — Display Formatting Engine
 *
 * Pure formatting functions that convert numeric values into user-facing strings.
 * Every function is unit-aware and metric/imperial agnostic.
 *
 * All inputs use millimeters internally; inch-based inputs (diffIn, distIn) are
 * clearly annotated. No browser dependencies — fully testable in Node/Vitest.
 */

import type { MeasurementUnit } from '@/types/calculator.js';
import { fromMm, isMetricUnit } from './units.js';

// ---------------------------------------------------------------------------
// Standard-size comparison helpers
// ---------------------------------------------------------------------------

/**
 * Format a signed dimensional difference (given in inches) for the standard-size
 * comparison row. Returns the value in the active unit with a +/- sign prefix.
 *
 * Returns `'exact'` when the absolute difference is less than 0.05 inches.
 *
 * @param diffIn  Signed difference in inches (positive = user window is larger)
 * @param unit    Currently active measurement unit
 *
 * @example formatDifference(1.5, 'in')  → '+1.5"'
 * @example formatDifference(-1.5, 'mm') → '-38 mm'
 * @example formatDifference(0.01, 'cm') → 'exact'
 */
export function formatDifference(diffIn: number, unit: MeasurementUnit): string {
  if (Math.abs(diffIn) < 0.05) return 'exact';
  const sign  = diffIn > 0 ? '+' : '-';
  if (!isMetricUnit(unit)) return `${sign}${Math.abs(diffIn).toFixed(1)}"`;
  const absMm = Math.abs(diffIn) * 25.4;
  if (unit === 'mm') return `${sign}${Math.round(absMm)} mm`;
  if (unit === 'cm') return `${sign}${(absMm / 10).toFixed(1)} cm`;
  return `${sign}${(absMm / 1000).toFixed(3)} m`;
}

/**
 * Format an unsigned Euclidean distance (given in inches) for the standard-size
 * badge. Always positive.
 *
 * @param distIn  Distance in inches
 * @param unit    Currently active measurement unit
 *
 * @example formatDistance(1.2, 'in')  → '1.2"'
 * @example formatDistance(1.2, 'mm')  → '30 mm'
 * @example formatDistance(1.2, 'cm')  → '3.0 cm'
 */
export function formatDistance(distIn: number, unit: MeasurementUnit): string {
  if (!isMetricUnit(unit)) return `${distIn.toFixed(1)}"`;
  const distMm = distIn * 25.4;
  if (unit === 'mm') return `${Math.round(distMm)} mm`;
  if (unit === 'cm') return `${(distMm / 10).toFixed(1)} cm`;
  return `${(distMm / 1000).toFixed(3)} m`;
}

// ---------------------------------------------------------------------------
// Weight formatting
// ---------------------------------------------------------------------------

/**
 * Format a glass weight value. Uses kilograms for metric units, pounds for imperial.
 *
 * @param weightKg   Weight in kilograms (1 decimal place)
 * @param weightLbs  Weight in pounds (1 decimal place)
 * @param unit       Currently active measurement unit
 *
 * @example formatWeight(4.5, 9.9, 'mm') → '4.5 kg'
 * @example formatWeight(4.5, 9.9, 'in') → '9.9 lbs'
 */
export function formatWeight(
  weightKg: number,
  weightLbs: number,
  unit: MeasurementUnit,
): string {
  return isMetricUnit(unit)
    ? `${weightKg.toFixed(1)} kg`
    : `${weightLbs.toFixed(1)} lbs`;
}

// ---------------------------------------------------------------------------
// Ceiling-rounded dimension (curtain sizing)
// ---------------------------------------------------------------------------

/**
 * Format a millimeter value by rounding UP to the nearest whole unit then
 * appending the unit label. Used for curtain recommendations where partial
 * coverage must be avoided.
 *
 * @param mm    Value in millimeters
 * @param unit  Target display unit
 *
 * @example formatCeil(1219.2, 'mm') → '1220 mm'
 * @example formatCeil(1219.2, 'cm') → '122 cm'
 * @example formatCeil(1219.2, 'in') → '49"'
 * @example formatCeil(1219.2, 'ft') → "4.0'"
 * @example formatCeil(1219.2, 'm')  → '1.3 m'
 */
export function formatCeil(mm: number, unit: MeasurementUnit): string {
  if (unit === 'in') return `${Math.ceil(fromMm(mm, 'in'))}"`;
  if (unit === 'ft') {
    const ft = fromMm(mm, 'ft');
    return `${(Math.ceil(ft * 10) / 10).toFixed(1)}'`;
  }
  if (unit === 'cm') return `${Math.ceil(fromMm(mm, 'cm'))} cm`;
  if (unit === 'm') {
    const m = fromMm(mm, 'm');
    return `${(Math.ceil(m * 10) / 10).toFixed(1)} m`;
  }
  // mm
  return `${Math.ceil(mm)} mm`;
}

// ---------------------------------------------------------------------------
// Curtain allowance note
// ---------------------------------------------------------------------------

/**
 * Return a human-readable curtain headrail allowance string in the active unit.
 * The allowance is approximately 200 mm (8 inches).
 *
 * @param unit  Currently active measurement unit
 *
 * @example curtainAllowanceLabel('mm') → '~200 mm'
 * @example curtainAllowanceLabel('in') → '8"'
 * @example curtainAllowanceLabel('ft') → "~0.7'"
 */
export function curtainAllowanceLabel(unit: MeasurementUnit): string {
  if (unit === 'cm') return '~20 cm';
  if (unit === 'm')  return '~0.2 m';
  if (unit === 'ft') return "~0.7'";
  if (unit === 'mm') return '~200 mm';
  return '8"';
}
