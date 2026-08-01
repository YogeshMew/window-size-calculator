/**
 * WindowMetrics — Core Calculation Tests
 *
 * Tests: calculateArea, calculatePerimeter, calculateDiagonal,
 *        calculateAspectRatio, calculateNetGlassArea, calculateGlassWeight
 */

import { describe, it, expect } from 'vitest';
import {
  calculateArea,
  calculatePerimeter,
  calculateDiagonal,
  calculateAspectRatio,
  calculateNetGlassArea,
  calculateGlassWeight,
} from '../calculations.js';

// ---------------------------------------------------------------------------
// calculateArea
// ---------------------------------------------------------------------------

describe('calculateArea', () => {
  it('calculates area in mm²', () => {
    // 36" × 48" → 914.4 mm × 1219.2 mm = 1,114,836.48 mm²
    expect(calculateArea({ widthMm: 914.4, heightMm: 1219.2 })).toBeCloseTo(1_114_836.48, 0);
  });

  it('returns zero for zero dimensions', () => {
    expect(calculateArea({ widthMm: 0, heightMm: 1000 })).toBe(0);
  });

  it('is commutative (w×h === h×w)', () => {
    const r1 = calculateArea({ widthMm: 300, heightMm: 500 });
    const r2 = calculateArea({ widthMm: 500, heightMm: 300 });
    expect(r1).toBe(r2);
  });

  it('handles equal dimensions (square window)', () => {
    expect(calculateArea({ widthMm: 600, heightMm: 600 })).toBe(360_000);
  });
});

// ---------------------------------------------------------------------------
// calculatePerimeter
// ---------------------------------------------------------------------------

describe('calculatePerimeter', () => {
  it('calculates perimeter in mm', () => {
    // 36" × 48" → 2 × (914.4 + 1219.2) = 4_267.2 mm
    expect(calculatePerimeter({ widthMm: 914.4, heightMm: 1219.2 })).toBeCloseTo(4_267.2, 1);
  });

  it('is 4 × side for a square', () => {
    expect(calculatePerimeter({ widthMm: 500, heightMm: 500 })).toBe(2000);
  });

  it('handles wide-format windows', () => {
    expect(calculatePerimeter({ widthMm: 1524, heightMm: 914 })).toBeCloseTo(4876, 0);
  });
});

// ---------------------------------------------------------------------------
// calculateDiagonal
// ---------------------------------------------------------------------------

describe('calculateDiagonal', () => {
  it('calculates diagonal using Pythagorean theorem', () => {
    // 3-4-5 right triangle scaled: 300 × 400 → diagonal = 500
    expect(calculateDiagonal({ widthMm: 300, heightMm: 400 })).toBeCloseTo(500, 5);
  });

  it('returns correct diagonal for 36" × 48" window', () => {
    // 914.4² + 1219.2² = 836,846.76 + 1,486,488.64 = 2,323,335.4 → √ = 1524 mm (exactly 60")
    expect(calculateDiagonal({ widthMm: 914.4, heightMm: 1219.2 })).toBeCloseTo(1524, 1);
  });

  it('returns side × √2 for a square', () => {
    const side = 1000;
    expect(calculateDiagonal({ widthMm: side, heightMm: side })).toBeCloseTo(side * Math.SQRT2, 5);
  });
});

// ---------------------------------------------------------------------------
// calculateAspectRatio
// ---------------------------------------------------------------------------

describe('calculateAspectRatio', () => {
  it('returns simplified ratio', () => {
    expect(calculateAspectRatio({ widthMm: 900, heightMm: 1200 })).toBe('3:4');
  });

  it('returns 1:1 for a square', () => {
    expect(calculateAspectRatio({ widthMm: 600, heightMm: 600 })).toBe('1:1');
  });

  it('returns 1:2 for a 2× tall window', () => {
    expect(calculateAspectRatio({ widthMm: 500, heightMm: 1000 })).toBe('1:2');
  });

  it('handles non-round GCD values — falls back to inch lookup or decimal (BUG 3)', () => {
    // 914 × 1219 mm ≈ 36" × 48" → inch lookup should give "3:4"
    const ratio = calculateAspectRatio({ widthMm: 914, heightMm: 1219 });
    expect(ratio).toBeTruthy();
    expect(ratio).toContain(':');
    // Must never produce unreadable numbers like "914:1219"
    const [left, right] = ratio.split(':');
    expect(parseFloat(left)).toBeLessThan(100);
    expect(parseFloat(right)).toBeLessThan(100);
  });

  it('produces readable decimal ratio for truly irregular sizes (BUG 3)', () => {
    // 927 × 1229 mm — no clean integer ratio in mm or inches
    const ratio = calculateAspectRatio({ widthMm: 927, heightMm: 1229 });
    expect(ratio).toContain(':');
    const [left, right] = ratio.split(':');
    expect(parseFloat(left)).toBeLessThan(100);
    expect(parseFloat(right)).toBeLessThan(100);
  });
});

// ---------------------------------------------------------------------------
// calculateNetGlassArea
// ---------------------------------------------------------------------------

describe('calculateNetGlassArea', () => {
  it('returns 90% of frame area by default', () => {
    const frame = calculateArea({ widthMm: 914.4, heightMm: 1219.2 });
    expect(calculateNetGlassArea({ widthMm: 914.4, heightMm: 1219.2 })).toBeCloseTo(frame * 0.9, 2);
  });

  it('respects a custom frame ratio', () => {
    const frame = calculateArea({ widthMm: 1000, heightMm: 1000 });
    expect(calculateNetGlassArea({ widthMm: 1000, heightMm: 1000 }, 0.85)).toBeCloseTo(frame * 0.85, 2);
  });

  it('returns exactly full area with frameRatio 1.0', () => {
    const dims = { widthMm: 600, heightMm: 900 };
    expect(calculateNetGlassArea(dims, 1.0)).toBe(calculateArea(dims));
  });
});

// ---------------------------------------------------------------------------
// calculateGlassWeight
// ---------------------------------------------------------------------------

describe('calculateGlassWeight', () => {
  const SINGLE_PANE_4MM = { panes: 1 as const, thicknessMmPerPane: 4 };
  const DOUBLE_PANE_4MM = { panes: 2 as const, thicknessMmPerPane: 4 };

  it('calculates correct weight for single 4mm pane (10 kg/m² density)', () => {
    // 1 m² of 4mm glass: 2.5 × 4 = 10 kg/m²
    const result = calculateGlassWeight(1_000_000, SINGLE_PANE_4MM);
    expect(result.weightKgPerM2).toBe(10);
    expect(result.totalWeightKg).toBeCloseTo(10, 5);
    expect(result.totalWeightLbs).toBeCloseTo(22.046, 2);
  });

  it('double-pane weighs twice single-pane', () => {
    const areaM2 = 1_000_000; // 1 m²
    const single = calculateGlassWeight(areaM2, SINGLE_PANE_4MM);
    const double = calculateGlassWeight(areaM2, DOUBLE_PANE_4MM);
    expect(double.totalWeightKg).toBeCloseTo(single.totalWeightKg * 2, 5);
  });

  it('includes 10% cutting waste in cutAreaMm2', () => {
    const area = 500_000;
    const result = calculateGlassWeight(area, SINGLE_PANE_4MM);
    expect(result.cutAreaMm2).toBeCloseTo(area * 1.1, 2);
  });

  it('glazingAreaSqFt converts correctly', () => {
    // 1 m² = 10.764 sq ft
    const result = calculateGlassWeight(1_000_000, SINGLE_PANE_4MM);
    expect(result.glazingAreaSqFt).toBeCloseTo(10.764, 2);
  });

  it('uses 4mm single pane as default', () => {
    const result = calculateGlassWeight(1_000_000);
    expect(result.weightKgPerM2).toBe(10);
  });
});
