import { describe, it, expect } from 'vitest';
import {
  formatDifference,
  formatDistance,
  formatWeight,
  formatCeil,
  curtainAllowanceLabel,
} from '../format.js';

// ---------------------------------------------------------------------------
// formatDifference
// ---------------------------------------------------------------------------

describe('formatDifference', () => {
  it('returns "exact" when absolute difference < 0.05 inches', () => {
    expect(formatDifference(0.04, 'in')).toBe('exact');
    expect(formatDifference(-0.04, 'mm')).toBe('exact');
    expect(formatDifference(0, 'ft')).toBe('exact');
  });

  it('formats positive inch difference with + sign', () => {
    expect(formatDifference(1.5, 'in')).toBe('+1.5"');
  });

  it('formats negative inch difference with - sign', () => {
    expect(formatDifference(-1.5, 'in')).toBe('-1.5"');
  });

  it('formats positive difference in mm (metric)', () => {
    // 1.5" = 38.1 mm → round to 38
    expect(formatDifference(1.5, 'mm')).toBe('+38 mm');
  });

  it('formats negative difference in mm (metric)', () => {
    expect(formatDifference(-1.5, 'mm')).toBe('-38 mm');
  });

  it('formats difference in cm (1 decimal)', () => {
    // 1.5" = 38.1 mm = 3.81 cm → 3.8 cm
    expect(formatDifference(1.5, 'cm')).toBe('+3.8 cm');
  });

  it('formats difference in m (3 decimals)', () => {
    // 1.5" = 0.0381 m
    expect(formatDifference(1.5, 'm')).toBe('+0.038 m');
  });

  it('formats feet like inches (imperial)', () => {
    expect(formatDifference(2.0, 'ft')).toBe('+2.0"');
  });

  it('handles threshold boundary exactly at 0.05', () => {
    // 0.05 is NOT below threshold — should NOT return 'exact'
    expect(formatDifference(0.05, 'in')).not.toBe('exact');
    // 0.049 should return 'exact'
    expect(formatDifference(0.049, 'in')).toBe('exact');
  });
});

// ---------------------------------------------------------------------------
// formatDistance
// ---------------------------------------------------------------------------

describe('formatDistance', () => {
  it('formats inch distance with 1 decimal', () => {
    expect(formatDistance(1.2, 'in')).toBe('1.2"');
  });

  it('formats foot distance with 1 decimal (treated as imperial)', () => {
    expect(formatDistance(2.5, 'ft')).toBe('2.5"');
  });

  it('formats mm distance (rounded to integer)', () => {
    // 1.2" = 30.48 mm → 30
    expect(formatDistance(1.2, 'mm')).toBe('30 mm');
  });

  it('formats cm distance (1 decimal)', () => {
    // 1.2" = 30.48 mm = 3.048 cm → 3.0 cm
    expect(formatDistance(1.2, 'cm')).toBe('3.0 cm');
  });

  it('formats m distance (3 decimals)', () => {
    // 1.2" = 0.03048 m
    expect(formatDistance(1.2, 'm')).toBe('0.030 m');
  });

  it('is always unsigned (no +/- sign)', () => {
    const result = formatDistance(3.0, 'mm');
    expect(result).not.toMatch(/^[+-]/);
  });
});

// ---------------------------------------------------------------------------
// formatWeight
// ---------------------------------------------------------------------------

describe('formatWeight', () => {
  it('uses kg for metric units', () => {
    expect(formatWeight(4.5, 9.9, 'mm')).toBe('4.5 kg');
    expect(formatWeight(4.5, 9.9, 'cm')).toBe('4.5 kg');
    expect(formatWeight(4.5, 9.9, 'm')).toBe('4.5 kg');
  });

  it('uses lbs for imperial units', () => {
    expect(formatWeight(4.5, 9.9, 'in')).toBe('9.9 lbs');
    expect(formatWeight(4.5, 9.9, 'ft')).toBe('9.9 lbs');
  });

  it('formats kg to 1 decimal place', () => {
    // 4.67 → toFixed(1) = '4.7'
    expect(formatWeight(4.67, 10.023, 'mm')).toBe('4.7 kg');
  });

  it('formats lbs to 1 decimal place', () => {
    expect(formatWeight(4.55, 10.023, 'in')).toBe('10.0 lbs');
  });

  it('handles zero weight', () => {
    expect(formatWeight(0, 0, 'mm')).toBe('0.0 kg');
    expect(formatWeight(0, 0, 'in')).toBe('0.0 lbs');
  });
});

// ---------------------------------------------------------------------------
// formatCeil
// ---------------------------------------------------------------------------

describe('formatCeil', () => {
  it('ceiling-rounds mm and appends mm label', () => {
    expect(formatCeil(1219.2, 'mm')).toBe('1220 mm');
    expect(formatCeil(1219.0, 'mm')).toBe('1219 mm');
  });

  it('ceiling-rounds cm to whole centimeter', () => {
    // 1219.2 mm / 10 = 121.92 cm → ceil = 122 cm
    expect(formatCeil(1219.2, 'cm')).toBe('122 cm');
  });

  it('ceiling-rounds inches', () => {
    // 1000 mm / 25.4 = 39.37 in → ceil = 40"
    expect(formatCeil(1000, 'in')).toBe('40"');
    // 1300 mm / 25.4 = 51.18 in → ceil = 52"
    expect(formatCeil(1300, 'in')).toBe('52"');
  });

  it('ceiling-rounds feet to 1 decimal', () => {
    // 1219.2 mm / 304.8 = 4.0 ft exactly → 4.0'
    expect(formatCeil(1219.2, 'ft')).toBe("4.0'");
    // 1250 mm / 304.8 = 4.101 ft → ceil at 1 decimal = 4.2'
    expect(formatCeil(1250, 'ft')).toBe("4.2'");
  });

  it('ceiling-rounds meters to 1 decimal', () => {
    // 1219.2 mm = 1.2192 m → ceil at 1 decimal = 1.3 m
    expect(formatCeil(1219.2, 'm')).toBe('1.3 m');
    // 1200 mm = 1.2 m → ceil at 1 decimal = 1.2 m
    expect(formatCeil(1200, 'm')).toBe('1.2 m');
  });

  it('always rounds up, never down', () => {
    // 914.4 mm = 3.0 ft exactly → 3.0'
    const result = formatCeil(914.4, 'ft');
    const value = parseFloat(result);
    expect(value).toBeGreaterThanOrEqual(914.4 / 304.8);
  });
});

// ---------------------------------------------------------------------------
// curtainAllowanceLabel
// ---------------------------------------------------------------------------

describe('curtainAllowanceLabel', () => {
  it('returns ~200 mm for mm', () => {
    expect(curtainAllowanceLabel('mm')).toBe('~200 mm');
  });

  it('returns ~20 cm for cm', () => {
    expect(curtainAllowanceLabel('cm')).toBe('~20 cm');
  });

  it('returns ~0.2 m for m', () => {
    expect(curtainAllowanceLabel('m')).toBe('~0.2 m');
  });

  it('returns 8" for in', () => {
    expect(curtainAllowanceLabel('in')).toBe('8"');
  });

  it("returns ~0.7' for ft", () => {
    expect(curtainAllowanceLabel('ft')).toBe("~0.7'");
  });
});
