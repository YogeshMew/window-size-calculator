/**
 * WindowMetrics — Unit Conversion & Input Parsing Tests
 *
 * Tests: toMm, fromMm, parseFraction, normalizeInput, convertUnits,
 *        formatDimension, formatArea, isMetricUnit
 */

import { describe, it, expect } from 'vitest';
import {
  toMm,
  fromMm,
  parseFraction,
  normalizeInput,
  convertUnits,
  formatDimension,
  formatArea,
  isMetricUnit,
} from '../units.js';

// ---------------------------------------------------------------------------
// toMm
// ---------------------------------------------------------------------------

describe('toMm', () => {
  it('returns the value unchanged for mm', () => {
    expect(toMm(100, 'mm')).toBe(100);
  });

  it('converts inches to mm (1 in = 25.4 mm)', () => {
    expect(toMm(1, 'in')).toBe(25.4);
    expect(toMm(36, 'in')).toBeCloseTo(914.4, 2);
  });

  it('converts feet to mm (1 ft = 304.8 mm)', () => {
    expect(toMm(1, 'ft')).toBe(304.8);
    expect(toMm(4, 'ft')).toBeCloseTo(1219.2, 2);
  });

  it('converts cm to mm', () => {
    expect(toMm(100, 'cm')).toBe(1000);
    expect(toMm(30, 'cm')).toBe(300);
  });

  it('converts meters to mm', () => {
    expect(toMm(1, 'm')).toBe(1000);
    expect(toMm(1.5, 'm')).toBe(1500);
  });
});

// ---------------------------------------------------------------------------
// fromMm
// ---------------------------------------------------------------------------

describe('fromMm', () => {
  it('returns value unchanged for mm', () => {
    expect(fromMm(100, 'mm')).toBe(100);
  });

  it('converts mm to inches', () => {
    expect(fromMm(25.4, 'in')).toBeCloseTo(1, 5);
    expect(fromMm(914.4, 'in')).toBeCloseTo(36, 4);
  });

  it('converts mm to feet', () => {
    expect(fromMm(304.8, 'ft')).toBeCloseTo(1, 5);
    expect(fromMm(1219.2, 'ft')).toBeCloseTo(4, 4);
  });

  it('round-trips correctly via toMm → fromMm', () => {
    const val = 762;
    expect(fromMm(toMm(val, 'in'), 'in')).toBeCloseTo(val, 8);
    expect(fromMm(toMm(val, 'cm'), 'cm')).toBeCloseTo(val, 8);
  });
});

// ---------------------------------------------------------------------------
// parseFraction
// ---------------------------------------------------------------------------

describe('parseFraction', () => {
  it('parses plain integers', () => {
    expect(parseFraction('36')).toBe(36);
    expect(parseFraction('0')).toBe(0);
  });

  it('parses plain decimals', () => {
    expect(parseFraction('36.5')).toBeCloseTo(36.5, 5);
    expect(parseFraction('0.375')).toBeCloseTo(0.375, 5);
  });

  it('parses mixed fractions (whole + fraction)', () => {
    expect(parseFraction('36 1/2')).toBeCloseTo(36.5, 5);
    expect(parseFraction('48 3/8')).toBeCloseTo(48.375, 5);
    expect(parseFraction('0 3/4')).toBeCloseTo(0.75, 5);
    expect(parseFraction('12 1/4')).toBeCloseTo(12.25, 5);
  });

  it('parses pure fractions (no whole)', () => {
    expect(parseFraction('1/2')).toBeCloseTo(0.5, 5);
    expect(parseFraction('3/4')).toBeCloseTo(0.75, 5);
    expect(parseFraction('1/4')).toBeCloseTo(0.25, 5);
  });

  it('handles dash-separated fractions (36-1/2)', () => {
    expect(parseFraction('36-1/2')).toBeCloseTo(36.5, 5);
  });

  it('returns null for empty or non-string input', () => {
    expect(parseFraction('')).toBeNull();
    expect(parseFraction('   ')).toBeNull();
  });

  it('returns null for division by zero', () => {
    expect(parseFraction('36 1/0')).toBeNull();
    expect(parseFraction('1/0')).toBeNull();
  });

  it('returns null for purely alphabetic input', () => {
    expect(parseFraction('abc')).toBeNull();
  });

  it('parses the leading number from mixed input (parseFloat semantics)', () => {
    // parseFraction intentionally mirrors parseFloat for the leading-digit case.
    // Strict format validation is handled by validateFractionString().
    expect(parseFraction('36 abc')).toBe(36);
  });
});

// ---------------------------------------------------------------------------
// normalizeInput
// ---------------------------------------------------------------------------

describe('normalizeInput', () => {
  it('parses plain numbers for any unit', () => {
    expect(normalizeInput('914.4', 'mm')).toBeCloseTo(914.4, 3);
    expect(normalizeInput('36', 'in')).toBe(36);
    expect(normalizeInput('1.5', 'm')).toBeCloseTo(1.5, 5);
  });

  it('parses fractional inch strings', () => {
    expect(normalizeInput('36 1/2', 'in')).toBeCloseTo(36.5, 5);
    expect(normalizeInput('48 3/8', 'in')).toBeCloseTo(48.375, 5);
  });

  it('returns null for empty input', () => {
    expect(normalizeInput('', 'in')).toBeNull();
    expect(normalizeInput('   ', 'mm')).toBeNull();
  });

  it('returns null for text that cannot be parsed', () => {
    expect(normalizeInput('abc', 'mm')).toBeNull();
    expect(normalizeInput('--', 'in')).toBeNull();
  });

  it('works for fractional feet too', () => {
    expect(normalizeInput('3 1/2', 'ft')).toBeCloseTo(3.5, 5);
  });
});

// ---------------------------------------------------------------------------
// convertUnits
// ---------------------------------------------------------------------------

describe('convertUnits', () => {
  it('returns value unchanged when from === to', () => {
    expect(convertUnits(36, 'in', 'in')).toBe(36);
    expect(convertUnits(500, 'mm', 'mm')).toBe(500);
  });

  it('converts inches to mm', () => {
    expect(convertUnits(36, 'in', 'mm')).toBeCloseTo(914.4, 2);
  });

  it('converts mm to inches', () => {
    expect(convertUnits(914.4, 'mm', 'in')).toBeCloseTo(36, 3);
  });

  it('converts feet to inches', () => {
    expect(convertUnits(1, 'ft', 'in')).toBeCloseTo(12, 5);
  });

  it('converts cm to m', () => {
    expect(convertUnits(100, 'cm', 'm')).toBeCloseTo(1, 5);
  });

  it('is reversible (round-trip)', () => {
    const original = 914.4;
    const converted = convertUnits(convertUnits(original, 'mm', 'in'), 'in', 'mm');
    expect(converted).toBeCloseTo(original, 3);
  });
});

// ---------------------------------------------------------------------------
// formatDimension
// ---------------------------------------------------------------------------

describe('formatDimension', () => {
  it('formats inches with symbol suffix', () => {
    expect(formatDimension(914.4, 'in')).toBe('36.00"');
  });

  it('formats feet with symbol suffix', () => {
    expect(formatDimension(304.8, 'ft')).toBe("1.00'");
  });

  it('formats mm with no decimals', () => {
    expect(formatDimension(914, 'mm')).toBe('914 mm');
  });

  it('formats cm with 1 decimal', () => {
    expect(formatDimension(914.4, 'cm')).toBe('91.4 cm');
  });

  it('formats meters with 3 decimals', () => {
    expect(formatDimension(1000, 'm')).toBe('1.000 m');
  });
});

// ---------------------------------------------------------------------------
// formatArea
// ---------------------------------------------------------------------------

describe('formatArea', () => {
  it('formats sq in for imperial', () => {
    // 36" × 48" = 1728 sq in → as mm²: 1728 × 25.4² = 1_114_838.08
    const mm2 = 36 * 48 * 25.4 * 25.4;
    expect(formatArea(mm2, 'in')).toBe('1728.00 sq in');
  });

  it('formats sq ft', () => {
    const mm2 = 1 * 304.8 * 304.8; // 1 sq ft in mm²
    expect(formatArea(mm2, 'ft')).toBe('1.00 sq ft');
  });

  it('formats mm² with no decimals', () => {
    expect(formatArea(100000, 'mm')).toBe('100000 mm²');
  });
});

// ---------------------------------------------------------------------------
// isMetricUnit
// ---------------------------------------------------------------------------

describe('isMetricUnit', () => {
  it('returns true for mm, cm, m', () => {
    expect(isMetricUnit('mm')).toBe(true);
    expect(isMetricUnit('cm')).toBe(true);
    expect(isMetricUnit('m')).toBe(true);
  });

  it('returns false for in, ft', () => {
    expect(isMetricUnit('in')).toBe(false);
    expect(isMetricUnit('ft')).toBe(false);
  });
});
