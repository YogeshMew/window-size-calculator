/**
 * WindowMetrics — Validation Tests
 *
 * Tests: validateDimension, validateDimensions, validateRange, validateFractionString
 */

import { describe, it, expect } from 'vitest';
import {
  validateDimension,
  validateDimensions,
  validateRange,
  validateFractionString,
} from '../validation.js';

// ---------------------------------------------------------------------------
// validateDimension
// ---------------------------------------------------------------------------

describe('validateDimension', () => {
  it('returns valid for a normal dimension', () => {
    expect(validateDimension(914, 'width').valid).toBe(true);
    expect(validateDimension(1200, 'height').valid).toBe(true);
  });

  it('rejects NaN', () => {
    const r = validateDimension(NaN, 'width');
    expect(r.valid).toBe(false);
    expect(r.field).toBe('width');
    expect(r.message).toBeTruthy();
  });

  it('rejects Infinity', () => {
    expect(validateDimension(Infinity, 'height').valid).toBe(false);
    expect(validateDimension(-Infinity, 'width').valid).toBe(false);
  });

  it('rejects zero', () => {
    expect(validateDimension(0, 'width').valid).toBe(false);
  });

  it('rejects negative values', () => {
    expect(validateDimension(-100, 'height').valid).toBe(false);
  });

  it('rejects values below minimum (< 25 mm)', () => {
    expect(validateDimension(10, 'width').valid).toBe(false);
  });

  it('rejects values above maximum (> 9,144 mm = 30 ft)', () => {
    expect(validateDimension(10_000, 'height').valid).toBe(false);
  });

  it('error message includes the field name', () => {
    const r = validateDimension(-1, 'width');
    expect(r.message).toContain('width');
  });
});

// ---------------------------------------------------------------------------
// validateDimensions
// ---------------------------------------------------------------------------

describe('validateDimensions', () => {
  it('returns valid for normal dimensions', () => {
    expect(validateDimensions({ widthMm: 914, heightMm: 1219 }).valid).toBe(true);
  });

  it('returns invalid for bad width', () => {
    expect(validateDimensions({ widthMm: -10, heightMm: 1219 }).valid).toBe(false);
    expect(validateDimensions({ widthMm: -10, heightMm: 1219 }).field).toBe('width');
  });

  it('returns invalid for bad height', () => {
    expect(validateDimensions({ widthMm: 914, heightMm: 0 }).valid).toBe(false);
    expect(validateDimensions({ widthMm: 914, heightMm: 0 }).field).toBe('height');
  });

  it('rejects extreme aspect ratios (> 10:1)', () => {
    // width 10× height → ratio = 10
    const r = validateDimensions({ widthMm: 5000, heightMm: 100 });
    expect(r.valid).toBe(false);
    expect(r.message).toBeTruthy();
  });

  it('accepts near-limit aspect ratios (e.g. panoramic picture windows)', () => {
    // 9:1 ratio — unusual but within limit
    expect(validateDimensions({ widthMm: 4500, heightMm: 500 }).valid).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// validateRange
// ---------------------------------------------------------------------------

describe('validateRange', () => {
  it('passes for value within range', () => {
    expect(validateRange(500, 100, 1000).valid).toBe(true);
  });

  it('passes for value at exact boundaries', () => {
    expect(validateRange(100, 100, 1000).valid).toBe(true);
    expect(validateRange(1000, 100, 1000).valid).toBe(true);
  });

  it('fails for value below minimum', () => {
    const r = validateRange(50, 100, 1000);
    expect(r.valid).toBe(false);
    expect(r.message).toBeTruthy();
  });

  it('fails for value above maximum', () => {
    const r = validateRange(1500, 100, 1000);
    expect(r.valid).toBe(false);
    expect(r.message).toBeTruthy();
  });
});

// ---------------------------------------------------------------------------
// validateFractionString
// ---------------------------------------------------------------------------

describe('validateFractionString', () => {
  it('passes for plain numbers', () => {
    expect(validateFractionString('36').valid).toBe(true);
    expect(validateFractionString('36.5').valid).toBe(true);
  });

  it('passes for valid fractional strings', () => {
    expect(validateFractionString('36 1/2').valid).toBe(true);
    expect(validateFractionString('48 3/8').valid).toBe(true);
    expect(validateFractionString('1/2').valid).toBe(true);
  });

  it('fails for empty string', () => {
    expect(validateFractionString('').valid).toBe(false);
  });

  it('fails for whitespace-only string', () => {
    expect(validateFractionString('   ').valid).toBe(false);
  });

  it('fails for alphabetic input', () => {
    expect(validateFractionString('abc').valid).toBe(false);
  });

  it('fails for malformed fraction (missing denominator)', () => {
    expect(validateFractionString('36 1/').valid).toBe(false);
  });

  it('includes a human-readable message on failure', () => {
    const r = validateFractionString('xyz');
    expect(r.message).toBeTruthy();
    expect(typeof r.message).toBe('string');
  });
});
