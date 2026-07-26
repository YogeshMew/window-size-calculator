/**
 * WindowMetrics — Recommendations Engine Tests
 *
 * Tests: calculateCurtainRecommendations, calculateBlindRecommendations,
 *        calculateACBTURecommendation, generateReplacementRecommendation
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCurtainRecommendations,
  calculateBlindRecommendations,
  calculateACBTURecommendation,
  generateReplacementRecommendation,
} from '../recommendations.js';

// 36" × 48" window — common test fixture
const DIMS_36x48 = { widthMm: 36 * 25.4, heightMm: 48 * 25.4 };

// ---------------------------------------------------------------------------
// calculateCurtainRecommendations
// ---------------------------------------------------------------------------

describe('calculateCurtainRecommendations', () => {
  it('minWidthMm is 1.5× window width', () => {
    const r = calculateCurtainRecommendations(DIMS_36x48);
    expect(r.minWidthMm).toBeCloseTo(DIMS_36x48.widthMm * 1.5, 3);
  });

  it('fullWidthMm is 2× window width', () => {
    const r = calculateCurtainRecommendations(DIMS_36x48);
    expect(r.fullWidthMm).toBeCloseTo(DIMS_36x48.widthMm * 2.0, 3);
  });

  it('dropMm includes 200 mm headrail allowance', () => {
    const r = calculateCurtainRecommendations(DIMS_36x48);
    expect(r.dropMm).toBeCloseTo(DIMS_36x48.heightMm + 200, 3);
    expect(r.headrailAllowanceMm).toBe(200);
  });

  it('rodLengthMm extends window width by 2× side extension', () => {
    const r = calculateCurtainRecommendations(DIMS_36x48);
    expect(r.rodLengthMm).toBeCloseTo(DIMS_36x48.widthMm + r.sideExtensionMm * 2, 3);
  });

  it('fullWidthMm > minWidthMm', () => {
    const r = calculateCurtainRecommendations(DIMS_36x48);
    expect(r.fullWidthMm).toBeGreaterThan(r.minWidthMm);
  });

  it('returns all expected keys', () => {
    const r = calculateCurtainRecommendations(DIMS_36x48);
    expect(r).toHaveProperty('minWidthMm');
    expect(r).toHaveProperty('fullWidthMm');
    expect(r).toHaveProperty('dropMm');
    expect(r).toHaveProperty('rodLengthMm');
    expect(r).toHaveProperty('headrailAllowanceMm');
    expect(r).toHaveProperty('sideExtensionMm');
  });
});

// ---------------------------------------------------------------------------
// calculateBlindRecommendations
// ---------------------------------------------------------------------------

describe('calculateBlindRecommendations', () => {
  it('insideWidthMm is window width minus 12.7 mm deduction (0.5" each side)', () => {
    const r = calculateBlindRecommendations(DIMS_36x48);
    expect(r.insideWidthMm).toBeCloseTo(DIMS_36x48.widthMm - 12.7, 2);
  });

  it('outsideWidthMm is window width plus 152.4 mm (3" each side)', () => {
    const r = calculateBlindRecommendations(DIMS_36x48);
    expect(r.outsideWidthMm).toBeCloseTo(DIMS_36x48.widthMm + 152.4, 2);
  });

  it('insideDropMm equals window height exactly', () => {
    const r = calculateBlindRecommendations(DIMS_36x48);
    expect(r.insideDropMm).toBe(DIMS_36x48.heightMm);
  });

  it('outsideDropMm adds 50.8 mm (2") to window height', () => {
    const r = calculateBlindRecommendations(DIMS_36x48);
    expect(r.outsideDropMm).toBeCloseTo(DIMS_36x48.heightMm + 50.8, 3);
  });

  it('outsideWidthMm > insideWidthMm', () => {
    const r = calculateBlindRecommendations(DIMS_36x48);
    expect(r.outsideWidthMm).toBeGreaterThan(r.insideWidthMm);
  });

  it('outsideDropMm > insideDropMm', () => {
    const r = calculateBlindRecommendations(DIMS_36x48);
    expect(r.outsideDropMm).toBeGreaterThan(r.insideDropMm);
  });
});

// ---------------------------------------------------------------------------
// calculateACBTURecommendation
// ---------------------------------------------------------------------------

describe('calculateACBTURecommendation', () => {
  it('returns a positive BTU recommendation', () => {
    const r = calculateACBTURecommendation(DIMS_36x48);
    expect(r.suggestedBTUMin).toBeGreaterThan(0);
    expect(r.suggestedBTUMax).toBeGreaterThanOrEqual(r.suggestedBTUMin);
  });

  it('marks standard-size opening as fitting a standard AC unit', () => {
    // 36" × 48" → 914 × 1219 mm — both well above AC minimum
    const r = calculateACBTURecommendation(DIMS_36x48);
    expect(r.fitsStandardUnit).toBe(true);
  });

  it('marks small opening as not fitting a standard AC unit', () => {
    // 10" × 10" — too small
    const tiny = { widthMm: 10 * 25.4, heightMm: 10 * 25.4 };
    const r = calculateACBTURecommendation(tiny);
    expect(r.fitsStandardUnit).toBe(false);
  });

  it('windowAreaM2 matches expected area', () => {
    const r = calculateACBTURecommendation(DIMS_36x48);
    const expected = (DIMS_36x48.widthMm * DIMS_36x48.heightMm) / 1_000_000;
    expect(r.windowAreaM2).toBeCloseTo(expected, 6);
  });

  it('minimum BTU is at least 5,000', () => {
    const r = calculateACBTURecommendation(DIMS_36x48);
    expect(r.suggestedBTUMin).toBeGreaterThanOrEqual(5000);
  });

  it('provides a note string', () => {
    const r = calculateACBTURecommendation(DIMS_36x48);
    expect(typeof r.note).toBe('string');
    expect(r.note.length).toBeGreaterThan(10);
  });
});

// ---------------------------------------------------------------------------
// generateReplacementRecommendation
// ---------------------------------------------------------------------------

describe('generateReplacementRecommendation', () => {
  it('returns isStandardAvailable = true for a standard-size window', () => {
    // 36" × 60" is a US standard size
    const r = generateReplacementRecommendation({ widthMm: 36 * 25.4, heightMm: 60 * 25.4 }, 'US');
    expect(r.isStandardAvailable).toBe(true);
    expect(r.requiresCustomOrder).toBe(false);
  });

  it('returns requiresCustomOrder = true for a non-standard window', () => {
    // 100" × 120" is far from all standard sizes
    const r = generateReplacementRecommendation({ widthMm: 100 * 25.4, heightMm: 120 * 25.4 }, 'US');
    expect(r.requiresCustomOrder).toBe(true);
    expect(r.isStandardAvailable).toBe(false);
  });

  it('rough opening adds 12.7 mm to each dimension on each side', () => {
    const dims = { widthMm: 914.4, heightMm: 1219.2 };
    const r = generateReplacementRecommendation(dims, 'US');
    // Each side adds shimSpaceMm, total = shimSpace × 2
    expect(r.roughOpeningWidthMm).toBeCloseTo(dims.widthMm + r.shimSpaceMm * 2, 2);
    expect(r.roughOpeningHeightMm).toBeCloseTo(dims.heightMm + r.shimSpaceMm * 2, 2);
  });

  it('shimSpaceMm is 12.7 mm (0.5 inch)', () => {
    const r = generateReplacementRecommendation(DIMS_36x48, 'US');
    expect(r.shimSpaceMm).toBe(12.7);
  });

  it('includes at least one note', () => {
    const r = generateReplacementRecommendation(DIMS_36x48, 'US');
    expect(r.notes.length).toBeGreaterThan(0);
  });

  it('includes a standardMatch result', () => {
    const r = generateReplacementRecommendation(DIMS_36x48, 'US');
    expect(r.standardMatch).toHaveProperty('nearest');
    expect(r.standardMatch).toHaveProperty('isExact');
  });

  it('defaults to US region', () => {
    const withUS  = generateReplacementRecommendation(DIMS_36x48, 'US');
    const withDef = generateReplacementRecommendation(DIMS_36x48);
    expect(withUS.isStandardAvailable).toBe(withDef.isStandardAvailable);
  });
});
