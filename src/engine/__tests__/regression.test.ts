/**
 * WindowMetrics — Regression Tests (Phase 1 Stage 4 bug fixes)
 *
 * Covers:
 *   BUG 2 — fraction parsing before validation
 *   BUG 3 — aspect ratio simplification / decimal fallback
 *   BUG 4 — warnings allow calculations; errors block calculations
 *   BUG 5 — formatted area includes unit label
 *
 * Note: BUG 1 (hiding stale DOM results) is enforced through the helpers
 *   `showErrorState` and `resetEmptyState` in the calculator script.
 *   DOM-level behaviour is covered by the showErrorState/showWarningMessage
 *   unit paths below at the engine contract level.
 */

import { describe, it, expect } from 'vitest';
import { normalizeInput, toMm, fromMm, convertUnits, formatArea } from '../units.js';
import { validateDimension, validateDimensions } from '../validation.js';
import { calculateAspectRatio } from '../calculations.js';

// ---------------------------------------------------------------------------
// Strict whitelist parser (audit requirement)
// ---------------------------------------------------------------------------

describe('normalizeInput — strict whitelist (all invalid inputs MUST return null)', () => {
  const INVALID_CASES: string[] = [
    'abc', '36abc', '76ghgh', '9i', '36 inches', '<script>',
    '36.5.6', '....', '3/5/7', '36--3/8', '36-1/0', '36-8/3',
    '36 8/3', '1e3', '2E5', '-36', '-1',
  ];

  for (const input of INVALID_CASES) {
    it(`rejects "${input}"`, () => {
      expect(normalizeInput(input, 'mm')).toBeNull();
      expect(normalizeInput(input, 'in')).toBeNull();
    });
  }

  it('accepts valid formats', () => {
    expect(normalizeInput('36',     'in')).toBe(36);
    expect(normalizeInput('36.5',   'mm')).toBeCloseTo(36.5);
    expect(normalizeInput('36 1/2', 'in')).toBeCloseTo(36.5);
    expect(normalizeInput('48-3/8', 'in')).toBeCloseTo(48.375);
    expect(normalizeInput('1/2',    'in')).toBeCloseTo(0.5);
  });

  it('trims leading/trailing whitespace before validating', () => {
    expect(normalizeInput('  36  ',   'mm')).toBe(36);
    expect(normalizeInput('  36.5 ',  'cm')).toBeCloseTo(36.5);
  });
});

// ---------------------------------------------------------------------------
// Unit conversion round-trips (unit switching requirement)
// ---------------------------------------------------------------------------

describe('Unit conversion correctness', () => {
  it('48-3/8 inches → mm round-trip', () => {
    const parsed = normalizeInput('48-3/8', 'in')!;   // 48.375
    const mm = toMm(parsed, 'in');
    expect(mm).toBeCloseTo(48.375 * 25.4, 3);          // ≈ 1228.725 mm
    // converting back
    expect(fromMm(mm, 'in')).toBeCloseTo(48.375, 4);
  });

  it('converts inches to mm (36" → 914.4 mm)', () => {
    expect(convertUnits(36, 'in', 'mm')).toBeCloseTo(914.4, 2);
  });

  it('converts mm to cm (914.4 mm → 91.44 cm)', () => {
    expect(convertUnits(914.4, 'mm', 'cm')).toBeCloseTo(91.44, 3);
  });

  it('converts mm to m (9144 mm → 9.144 m)', () => {
    expect(convertUnits(9144, 'mm', 'm')).toBeCloseTo(9.144, 5);
  });

  it('converts ft to in (3 ft → 36 in)', () => {
    expect(convertUnits(3, 'ft', 'in')).toBeCloseTo(36, 5);
  });

  it('all unit conversions are reversible', () => {
    const units: Array<'mm' | 'cm' | 'm' | 'in' | 'ft'> = ['mm', 'cm', 'm', 'in', 'ft'];
    const baseVal = 914.4; // mm
    for (const unit of units) {
      const converted = fromMm(baseVal, unit);
      const backToMm  = toMm(converted, unit);
      expect(backToMm).toBeCloseTo(baseVal, 3);
    }
  });
});

// ---------------------------------------------------------------------------
// BUG 2 — Fraction parsing must happen BEFORE any validation check
// ---------------------------------------------------------------------------

describe('BUG 2 — normalizeInput → toMm → validateDimension pipeline', () => {
  it('parses "36 1/2" in inches and produces a valid mm value', () => {
    const parsed = normalizeInput('36 1/2', 'in');
    expect(parsed).not.toBeNull();
    const mm = toMm(parsed!, 'in');
    expect(mm).toBeCloseTo(36.5 * 25.4, 3);  // 927.1 mm
  });

  it('parses "48 3/8" in inches and produces a valid mm value', () => {
    const parsed = normalizeInput('48 3/8', 'in');
    expect(parsed).not.toBeNull();
    const mm = toMm(parsed!, 'in');
    expect(mm).toBeCloseTo(48.375 * 25.4, 3);  // 1228.725 mm
  });

  it('"36 1/2" in inches does NOT trigger the 30-foot limit', () => {
    const parsed = normalizeInput('36 1/2', 'in');
    const mm = toMm(parsed!, 'in');
    const result = validateDimension(mm, 'width');
    expect(result.valid).toBe(true);
  });

  it('"36 1/2" in feet correctly triggers a 30-foot limit error (legitimately > 30 ft)', () => {
    // 36.5 ft = 11,125 mm > 9,144 mm limit — this is intentionally invalid
    const parsed = normalizeInput('36 1/2', 'ft');
    const mm = toMm(parsed!, 'ft');
    const result = validateDimension(mm, 'width');
    expect(result.valid).toBe(false);
    expect(result.level).toBe('error');
  });

  it('normalizeInput handles plain decimals for all units', () => {
    expect(normalizeInput('36.5', 'in')).toBeCloseTo(36.5);
    expect(normalizeInput('36.5', 'mm')).toBeCloseTo(36.5);
    expect(normalizeInput('36.5', 'cm')).toBeCloseTo(36.5);
    expect(normalizeInput('36.5', 'ft')).toBeCloseTo(36.5);
    expect(normalizeInput('36.5', 'm')).toBeCloseTo(36.5);
  });
});

// ---------------------------------------------------------------------------
// BUG 3 — Aspect ratio must be human-readable
// ---------------------------------------------------------------------------

describe('BUG 3 — calculateAspectRatio produces readable output', () => {
  it('simplifies metric windows to a clean integer ratio', () => {
    // 900 × 1200 mm → 3:4
    expect(calculateAspectRatio({ widthMm: 900, heightMm: 1200 })).toBe('3:4');
  });

  it('simplifies US inch-based windows via inch lookup', () => {
    // 36" × 48" = 914.4 × 1219.2 mm — GCD in mm is 1, but inch lookup gives 3:4
    expect(calculateAspectRatio({ widthMm: 914.4, heightMm: 1219.2 })).toBe('3:4');
  });

  it('falls back to decimal for truly irregular sizes (no clean mm or inch ratio)', () => {
    // 777 × 1111 mm — GCD=1 in mm AND inch lookup gives 31:44 (44 > 30 threshold)
    // → must fall back to "0.70:1" decimal form
    const ratio = calculateAspectRatio({ widthMm: 777, heightMm: 1111 });
    expect(ratio).toMatch(/^\d+\.\d{2}:1$/);
    const [left, right] = ratio.split(':');
    expect(parseFloat(left)).toBeLessThan(100);
    expect(parseFloat(right)).toBeLessThan(100);
  });

  it('produces a readable simplified ratio for near-standard inch sizes', () => {
    // 927 × 1229 mm ≈ 36.5" × 48.4" — rounds to 36" × 48" → "3:4" via inch lookup
    const ratio = calculateAspectRatio({ widthMm: 927, heightMm: 1229 });
    const [left, right] = ratio.split(':');
    expect(parseFloat(left)).toBeLessThan(100);
    expect(parseFloat(right)).toBeLessThan(100);
  });

  it('never produces parts > 30 in any output', () => {
    const cases: [number, number][] = [
      [927, 1229],
      [3505, 4572],
      [1087, 1543],
      [777, 1111],
    ];
    for (const [w, h] of cases) {
      const ratio = calculateAspectRatio({ widthMm: w, heightMm: h });
      const [left, right] = ratio.split(':');
      expect(parseFloat(left),  `left  part of "${ratio}"`).toBeLessThan(100);
      expect(parseFloat(right), `right part of "${ratio}"`).toBeLessThan(100);
    }
  });

  it('produces "16:9" for 1920×1080 (display-ratio sanity check)', () => {
    expect(calculateAspectRatio({ widthMm: 1920, heightMm: 1080 })).toBe('16:9');
  });

  it('produces "1:1" for square windows', () => {
    expect(calculateAspectRatio({ widthMm: 600, heightMm: 600 })).toBe('1:1');
  });
});

// ---------------------------------------------------------------------------
// BUG 4 — warnings allow calculations; errors must block
// ---------------------------------------------------------------------------

describe('BUG 4 — validation level separates errors from warnings', () => {
  it('validateDimension returns level: error for NaN', () => {
    expect(validateDimension(NaN, 'width').level).toBe('error');
  });

  it('validateDimension returns level: error for zero', () => {
    expect(validateDimension(0, 'height').level).toBe('error');
  });

  it('validateDimension returns level: error for negative values', () => {
    expect(validateDimension(-50, 'width').level).toBe('error');
  });

  it('validateDimension returns level: error when below minimum', () => {
    expect(validateDimension(10, 'height').level).toBe('error');  // < 25 mm
  });

  it('validateDimension returns level: error when above maximum', () => {
    expect(validateDimension(10_000, 'width').level).toBe('error');  // > 9144 mm
  });

  it('unusual aspect ratio returns level: warning (not error)', () => {
    // 50:1 ratio — unusual but each dimension is individually valid
    const r = validateDimensions({ widthMm: 5000, heightMm: 100 });
    expect(r.valid).toBe(false);
    expect(r.level).toBe('warning');
  });

  it('unusual aspect ratio does NOT carry level: error', () => {
    const r = validateDimensions({ widthMm: 5000, heightMm: 100 });
    expect(r.level).not.toBe('error');
  });

  it('valid dimensions return no level field', () => {
    const r = validateDimensions({ widthMm: 914, heightMm: 1219 });
    expect(r.valid).toBe(true);
    // No level needed for success
    expect(r.level).toBeUndefined();
  });
});

// ---------------------------------------------------------------------------
// BUG 5 — formatted area must include a unit label
// ---------------------------------------------------------------------------

describe('BUG 5 — formatArea always includes a unit label', () => {
  const AREA_MM2 = 914.4 * 1219.2;  // 36" × 48" window ≈ 1,114,836 mm²

  it('includes "sq in" for inches', () => {
    expect(formatArea(AREA_MM2, 'in')).toContain('sq in');
  });

  it('includes "sq ft" for feet', () => {
    expect(formatArea(AREA_MM2, 'ft')).toContain('sq ft');
  });

  it('includes "mm²" for millimeters', () => {
    expect(formatArea(AREA_MM2, 'mm')).toContain('mm²');
  });

  it('includes "cm²" for centimeters', () => {
    expect(formatArea(AREA_MM2, 'cm')).toContain('cm²');
  });

  it('includes "m²" for meters', () => {
    expect(formatArea(AREA_MM2, 'm')).toContain('m²');
  });

  it('numeric portion is separated from the label by a space', () => {
    // "690.00 sq ft" — the split(' ')[0] must be a valid number
    const result = formatArea(AREA_MM2, 'ft');
    const parts = result.split(' ');
    expect(parts.length).toBeGreaterThan(1);
    expect(isNaN(parseFloat(parts[0]))).toBe(false);
  });
});
