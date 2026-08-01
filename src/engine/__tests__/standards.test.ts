/**
 * WindowMetrics — Standard Size Database Tests
 *
 * Tests: findNearestStandardSize, getStandardSizes, isStandardSize
 */

import { describe, it, expect } from 'vitest';
import {
  findNearestStandardSize,
  getStandardSizes,
  isStandardSize,
} from '../standards.js';

// ---------------------------------------------------------------------------
// findNearestStandardSize — US
// ---------------------------------------------------------------------------

describe('findNearestStandardSize (US)', () => {
  it('returns an exact match for a known US standard size', () => {
    // 36" × 72" in mm
    const result = findNearestStandardSize(36 * 25.4, 72 * 25.4, 'US');
    expect(result.isExact).toBe(true);
    expect(result.nearest.widthIn).toBe(36);
    expect(result.nearest.heightIn).toBe(72);
    expect(result.distanceIn).toBeCloseTo(0, 1);
  });

  it('returns isClose for a dimension within 4 inches of a standard size', () => {
    // 35" × 70" — close to 36" × 72"
    const result = findNearestStandardSize(35 * 25.4, 70 * 25.4, 'US');
    expect(result.isExact).toBe(false);
    expect(result.isClose).toBe(true);
  });

  it('returns isClose = false for a dimension far from all standard sizes', () => {
    // 100" × 10" — completely non-standard
    const result = findNearestStandardSize(100 * 25.4, 10 * 25.4, 'US');
    expect(result.isExact).toBe(false);
    expect(result.isClose).toBe(false);
  });

  it('returns correct signed diff values', () => {
    // 35" × 70" nearest is 36" × 72"
    // diffWidth = 36 - 35 = +1, diffHeight = 72 - 70 = +2
    const result = findNearestStandardSize(35 * 25.4, 70 * 25.4, 'US');
    expect(result.diffWidthIn).toBeCloseTo(1, 0);
    expect(result.diffHeightIn).toBeCloseTo(2, 0);
  });

  it('always returns a result object with the required shape', () => {
    const result = findNearestStandardSize(914, 1219, 'US');
    expect(result).toHaveProperty('nearest');
    expect(result).toHaveProperty('distanceIn');
    expect(result).toHaveProperty('isExact');
    expect(result).toHaveProperty('isClose');
    expect(result).toHaveProperty('diffWidthIn');
    expect(result).toHaveProperty('diffHeightIn');
    expect(result.nearest).toHaveProperty('widthIn');
    expect(result.nearest).toHaveProperty('heightIn');
  });

  it('defaults to US region when no region is specified', () => {
    const withUS  = findNearestStandardSize(914.4, 1219.2, 'US');
    const withDef = findNearestStandardSize(914.4, 1219.2);
    expect(withUS.nearest.widthIn).toBe(withDef.nearest.widthIn);
    expect(withUS.nearest.heightIn).toBe(withDef.nearest.heightIn);
  });
});

// ---------------------------------------------------------------------------
// findNearestStandardSize — non-US regions
// ---------------------------------------------------------------------------

describe('findNearestStandardSize (UK)', () => {
  it('finds a UK standard size close to 630 × 1050 mm', () => {
    const result = findNearestStandardSize(630, 1050, 'UK');
    expect(result.isExact).toBe(true);
    expect(result.nearest.widthMm).toBe(630);
    expect(result.nearest.widthIn).toBe(25);
  });
});

describe('findNearestStandardSize (AU)', () => {
  it('finds an AU standard size close to 1200 × 1200 mm', () => {
    const result = findNearestStandardSize(1200, 1200, 'AU');
    expect(result.isExact).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// isStandardSize
// ---------------------------------------------------------------------------

describe('isStandardSize', () => {
  it('returns true for an exact US standard size', () => {
    expect(isStandardSize(36 * 25.4, 60 * 25.4, 'US')).toBe(true);
  });

  it('returns false for a non-standard size', () => {
    expect(isStandardSize(37 * 25.4, 61 * 25.4, 'US')).toBe(false);
  });

  it('defaults to US region', () => {
    expect(isStandardSize(36 * 25.4, 60 * 25.4)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// getStandardSizes
// ---------------------------------------------------------------------------

describe('getStandardSizes', () => {
  it('returns a non-empty array for all regions', () => {
    const regions = ['US', 'UK', 'CA', 'AU', 'EU'] as const;
    for (const region of regions) {
      const sizes = getStandardSizes(region);
      expect(sizes.length).toBeGreaterThan(0);
    }
  });

  it('returns sizes with widthIn and heightIn for all entries', () => {
    const sizes = getStandardSizes('US');
    for (const s of sizes) {
      expect(typeof s.widthIn).toBe('number');
      expect(typeof s.heightIn).toBe('number');
      expect(s.widthIn).toBeGreaterThan(0);
      expect(s.heightIn).toBeGreaterThan(0);
    }
  });

  it('defaults to US when no region specified', () => {
    const us  = getStandardSizes('US');
    const def = getStandardSizes();
    expect(us.length).toBe(def.length);
  });
});
