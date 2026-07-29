/**
 * WindowMetrics — Unit Conversion Engine
 *
 * RULE: All calculations use millimeters internally.
 * This module is the single source of truth for unit conversion.
 *
 * Supports: mm, cm, m, inches (in), feet (ft)
 * Also handles fractional inch input: "34 1/2", "34-1/2", "34.5"
 */

import type { MeasurementUnit } from '@/types/calculator.js';

// ---------------------------------------------------------------------------
// Conversion constants — mm is the base unit
// ---------------------------------------------------------------------------

const MM_PER_UNIT: Record<MeasurementUnit, number> = {
  mm: 1,
  cm: 10,
  m: 1000,
  in: 25.4,
  ft: 304.8,
};

// ---------------------------------------------------------------------------
// Core conversion functions
// ---------------------------------------------------------------------------

/**
 * Convert a value in the given unit to millimeters.
 * @example toMm(36, 'in') → 914.4
 */
export function toMm(value: number, unit: MeasurementUnit): number {
  return value * MM_PER_UNIT[unit];
}

/**
 * Convert a value in millimeters to the given unit.
 * @example fromMm(914.4, 'in') → 36
 */
export function fromMm(valueMm: number, unit: MeasurementUnit): number {
  return valueMm / MM_PER_UNIT[unit];
}

// ---------------------------------------------------------------------------
// Fractional inch parsing
// ---------------------------------------------------------------------------

/**
 * Parse fractional inch strings into a decimal number.
 * Handles: "34 1/2", "34-1/2", "34 1/4", "0 3/8", "36"
 *
 * @returns decimal value in inches, or null if unparseable
 * @example parseFraction("34 1/2") → 34.5
 * @example parseFraction("0 3/8") → 0.375
 */
export function parseFraction(str: string): number | null {
  if (!str || typeof str !== 'string') return null;

  // Normalize separators: "34-1/2" → "34 1/2"
  const normalized = str.trim().replace(/-(\d+\/\d+)/, ' $1');

  // Try plain number first
  const plain = parseFloat(normalized);
  if (!isNaN(plain) && !normalized.includes('/')) {
    return plain;
  }

  // Match "whole fraction" pattern: "34 1/2" or "1/2"
  const fractionMatch = normalized.match(/^(\d+(?:\.\d+)?)\s+(\d+)\/(\d+)$|^(\d+)\/(\d+)$/);

  if (!fractionMatch) return null;

  if (fractionMatch[4] !== undefined) {
    // Pure fraction: "1/2"
    const num = parseInt(fractionMatch[4], 10);
    const den = parseInt(fractionMatch[5], 10);
    if (den === 0) return null;
    return num / den;
  }

  // Mixed number: "34 1/2"
  const whole = parseFloat(fractionMatch[1]);
  const num = parseInt(fractionMatch[2], 10);
  const den = parseInt(fractionMatch[3], 10);
  if (den === 0) return null;
  return whole + num / den;
}

// ---------------------------------------------------------------------------
// Display formatting
// ---------------------------------------------------------------------------

/** Precision by unit — how many decimal places to show */
const DISPLAY_PRECISION: Record<MeasurementUnit, number> = {
  mm: 0,
  cm: 1,
  m: 3,
  in: 2,
  ft: 2,
};

/** Unit suffix labels */
const UNIT_LABELS: Record<MeasurementUnit, string> = {
  mm: 'mm',
  cm: 'cm',
  m: 'm',
  in: '"',
  ft: "'",
};

/**
 * Format a mm value for display in the given unit.
 * @example formatDimension(914.4, 'in') → '36.00"'
 * @example formatDimension(300, 'mm') → '300 mm'
 */
export function formatDimension(valueMm: number, unit: MeasurementUnit): string {
  const converted = fromMm(valueMm, unit);
  const precision = DISPLAY_PRECISION[unit];
  const label = UNIT_LABELS[unit];
  const formatted = converted.toFixed(precision);

  // Inches and feet use symbol suffix directly, others use space
  if (unit === 'in' || unit === 'ft') {
    return `${formatted}${label}`;
  }
  return `${formatted} ${label}`;
}

/**
 * Format an area in mm² for display.
 * @example formatArea(0.093 * 1e6, 'ft') → '1.00 sq ft'
 */
export function formatArea(valueMm2: number, unit: MeasurementUnit): string {
  const conversionFactor = MM_PER_UNIT[unit] ** 2;
  const converted = valueMm2 / conversionFactor;
  const precision = unit === 'mm' ? 0 : 2;
  const label = unit === 'in' ? 'sq in' : unit === 'ft' ? 'sq ft' : `${unit}²`;
  return `${converted.toFixed(precision)} ${label}`;
}

/**
 * Get the unit label string.
 * @example getUnitLabel('in') → '"'
 */
export function getUnitLabel(unit: MeasurementUnit): string {
  return UNIT_LABELS[unit];
}

/**
 * Get the full unit name for accessibility.
 * @example getUnitName('in') → 'inches'
 */
export function getUnitName(unit: MeasurementUnit): string {
  const names: Record<MeasurementUnit, string> = {
    mm: 'millimeters',
    cm: 'centimeters',
    m: 'meters',
    in: 'inches',
    ft: 'feet',
  };
  return names[unit];
}

// ---------------------------------------------------------------------------
// Input normalization
// ---------------------------------------------------------------------------

// Strict whitelisted patterns — must match the ENTIRE trimmed input.
// Anything else (letters, scientific notation, double-dots, double-slash, etc.)
// is rejected without attempting to extract a leading numeric portion.
const RE_INTEGER   = /^\d+$/;
const RE_DECIMAL   = /^\d+\.\d+$/;
const RE_PURE_FRAC = /^(\d+)\/([1-9]\d*)$/;           // e.g. "1/2", "3/4"
const RE_SPACE_MIX = /^(\d+)\s+(\d+)\/([1-9]\d*)$/;  // e.g. "36 1/2", "0 3/8"
const RE_HYPH_MIX  = /^(\d+)-(\d+)\/([1-9]\d*)$/;    // e.g. "48-3/8", "36-7/16"

/**
 * Parse a raw string input from the user into a decimal number in the given unit.
 *
 * **Strictly** accepts only these formats (all other inputs return null):
 * - Integer:          `36`
 * - Decimal:          `36.5`
 * - Pure fraction:    `1/2`
 * - Space fraction:   `36 1/2`
 * - Hyphen fraction:  `48-3/8`
 *
 * Rejected examples: `36abc`, `1e3`, `36.5.6`, `3/5/7`, `36-8/3`,
 * `36--3/8`, `36-1/0`, `-36`, `36 inches`, `<script>`.
 *
 * For mixed fractions the fractional part must be proper (numerator < denominator),
 * so `36-8/3` is rejected even though 8 and 3 are both valid numbers.
 *
 * Leading/trailing whitespace is trimmed before matching.
 *
 * @param raw   Raw string as typed by the user
 * @param _unit Unit context (reserved for future locale-aware parsing)
 * @returns     Decimal value in the given unit, or null if invalid
 *
 * @example normalizeInput("36 1/2", 'in') → 36.5
 * @example normalizeInput("48-3/8", 'in') → 48.375
 * @example normalizeInput("914.4",  'mm') → 914.4
 * @example normalizeInput("36abc",  'mm') → null
 * @example normalizeInput("1e3",    'mm') → null
 * @example normalizeInput("36-8/3", 'in') → null  (improper fraction component)
 */
export function normalizeInput(raw: string, _unit: MeasurementUnit): number | null {
  if (!raw || typeof raw !== 'string') return null;
  const s = raw.trim();
  if (!s) return null;

  // Reject scientific notation early (e.g. "1e3", "2E5")
  if (/[eE]/.test(s)) return null;

  // Integer
  if (RE_INTEGER.test(s)) return parseInt(s, 10);

  // Decimal (exactly one dot: "36.5" passes, "36.5.6" and ".5" do not)
  if (RE_DECIMAL.test(s)) return parseFloat(s);

  // Pure fraction: "1/2", "3/4" — any non-zero denominator allowed
  const pureFrac = RE_PURE_FRAC.exec(s);
  if (pureFrac) {
    const num = parseInt(pureFrac[1], 10);
    const den = parseInt(pureFrac[2], 10);
    return num / den;
  }

  // Space-separated mixed fraction: "36 1/2"
  // Require numerator < denominator (proper fraction component only)
  const spaceMix = RE_SPACE_MIX.exec(s);
  if (spaceMix) {
    const whole = parseInt(spaceMix[1], 10);
    const num   = parseInt(spaceMix[2], 10);
    const den   = parseInt(spaceMix[3], 10);
    if (num >= den) return null;          // e.g. "36 8/3" is not a valid fraction
    return whole + num / den;
  }

  // Hyphen-separated mixed fraction: "48-3/8"
  // Require numerator < denominator (proper fraction component only)
  const hyphMix = RE_HYPH_MIX.exec(s);
  if (hyphMix) {
    const whole = parseInt(hyphMix[1], 10);
    const num   = parseInt(hyphMix[2], 10);
    const den   = parseInt(hyphMix[3], 10);
    if (num >= den) return null;          // e.g. "36-8/3" is rejected
    return whole + num / den;
  }

  return null; // no recognised pattern — reject without silent extraction
}

/**
 * Convert a value from one unit to another.
 * Internally converts via millimeters.
 *
 * @param value  Numeric value in the source unit
 * @param from   Source unit
 * @param to     Target unit
 * @returns      Value in the target unit
 *
 * @example convertUnits(36, 'in', 'mm') → 914.4
 * @example convertUnits(1000, 'mm', 'm') → 1
 * @example convertUnits(1, 'ft', 'in') → 12
 */
export function convertUnits(
  value: number,
  from: MeasurementUnit,
  to: MeasurementUnit,
): number {
  if (from === to) return value;
  return fromMm(toMm(value, from), to);
}

/**
 * Determine if a unit is metric (mm, cm, m) or imperial (in, ft).
 * Used to select appropriate display formatting.
 *
 * @example isMetricUnit('mm') → true
 * @example isMetricUnit('in') → false
 */
export function isMetricUnit(unit: MeasurementUnit): boolean {
  return unit === 'mm' || unit === 'cm' || unit === 'm';
}
