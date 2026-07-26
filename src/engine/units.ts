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
