/**
 * WindowMetrics — Display Utilities
 *
 * UI-layer helpers that encode opinionated rounding rules for human-readable
 * display. These intentionally differ from the engine's formatDimension() which
 * uses consistent decimal places for every unit. Here we strip trailing zeros
 * and apply the per-unit precision that matches the product's rounding spec:
 *
 *   mm  → integer (no decimals)
 *   cm  → 1 decimal
 *   m   → 3 decimals (strip trailing zeros)
 *   in  → 1 decimal (strip trailing zeros)
 *   ft  → 2 decimals (strip trailing zeros)
 *
 * These helpers have no DOM dependencies and can be imported in any context.
 */

import type { MeasurementUnit } from '@/types/calculator.js';
import { fromMm } from '@/engine/units.js';

// ---------------------------------------------------------------------------
// Display number (no unit suffix)
// ---------------------------------------------------------------------------

/**
 * Format a millimeter value as a clean display number in the given unit with
 * no unit suffix. Trailing zeros are stripped.
 *
 * Used for panel headers, reference dimension cards, and "Your window" / "Nearest
 * standard" comparison rows.
 *
 * @param mm    Value in millimeters
 * @param unit  Target display unit
 *
 * @example fmtVal(914.4,  'in') → '36'
 * @example fmtVal(914.4,  'mm') → '914'
 * @example fmtVal(914.4,  'cm') → '91.4'
 * @example fmtVal(914.4,  'm')  → '0.914'
 * @example fmtVal(914.4,  'ft') → '3'
 * @example fmtVal(1234.5, 'in') → '48.6'
 */
export function fmtVal(mm: number, unit: MeasurementUnit): string {
  const v = fromMm(mm, unit);
  if (unit === 'mm') return Math.round(v).toString();
  if (unit === 'cm') return parseFloat((Math.round(v * 10) / 10).toFixed(1)).toString();
  if (unit === 'm')  return parseFloat(v.toFixed(3)).toString();
  if (unit === 'ft') return parseFloat(v.toFixed(2)).toString();
  // in — 1 decimal, trailing zeros stripped
  return parseFloat(v.toFixed(1)).toString();
}

// ---------------------------------------------------------------------------
// Input field value (after unit switch)
// ---------------------------------------------------------------------------

/**
 * Format a millimeter value for writing back into a text input field after a
 * unit-switch. Unlike fmtVal this retains a minimum number of decimal places
 * to prevent unnecessary rounding on subsequent conversions.
 *
 * Examples:
 * - 914.4 mm → 'in' → '36' (no trailing .0 for a round number)
 * - 1234.95 mm → 'cm' → '123.5' (1 decimal preserved)
 *
 * @param mm    Value in millimeters
 * @param unit  Target display unit for the input field
 */
export function fmtInput(mm: number, unit: MeasurementUnit): string {
  const v = fromMm(mm, unit);
  if (unit === 'mm') return Math.round(v).toString();
  if (unit === 'cm') return (Math.round(v * 10) / 10).toFixed(1);
  if (unit === 'm')  return v.toFixed(3);
  // in / ft — strip trailing zeros for a natural-looking value
  return parseFloat(v.toFixed(2)).toString();
}

// ---------------------------------------------------------------------------
// Max-limit label for error messages
// ---------------------------------------------------------------------------

/**
 * Return a human-readable maximum dimension label in the active unit.
 * Used in "Width is too large — maximum supported is ___" error messages so
 * the limit is always expressed in the unit the user is currently working in.
 *
 * @param maxMm  Maximum dimension in millimeters
 * @param unit   Currently active measurement unit
 *
 * @example maxLimitLabel(9144, 'mm') → '9144 mm'
 * @example maxLimitLabel(9144, 'cm') → '914.4 cm'
 * @example maxLimitLabel(9144, 'm')  → '9.144 m'
 * @example maxLimitLabel(9144, 'in') → '360"'
 * @example maxLimitLabel(9144, 'ft') → "30'"
 */
export function maxLimitLabel(maxMm: number, unit: MeasurementUnit): string {
  const v = fromMm(maxMm, unit);
  if (unit === 'mm') return `${Math.round(v)} mm`;
  if (unit === 'cm') return `${v.toFixed(1)} cm`;
  if (unit === 'm')  return `${v.toFixed(3)} m`;
  if (unit === 'in') return `${Math.round(v)}"`;
  return `${v.toFixed(0)}'`;
}
