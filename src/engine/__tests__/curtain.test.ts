/**
 * Curtain Size Calculator Engine — Vitest coverage
 *
 * Tests for: src/engine/curtain.ts
 *
 * Coverage:
 *   - calcRodLength (inside/outside mount)
 *   - calcRodAbove (all rod positions)
 *   - calcDrop (all floor positions)
 *   - calcWidths (all fullness values, panel counts)
 *   - calcFabric (hem and seam allowances)
 *   - validateCurtainDimension (error/warning levels)
 *   - buildCurtainWarnings (all warning codes)
 *   - calculateCurtain (integration, round-trips)
 *   - Edge cases and extreme inputs
 */

import { describe, it, expect } from 'vitest';
import {
  calculateCurtain,
  calcRodLength,
  calcRodAbove,
  calcDrop,
  calcWidths,
  calcFabric,
  validateCurtainDimension,
  buildCurtainWarnings,
  buildCurtainRecommendations,
  OUTSIDE_MOUNT_SIDE_EXTENSION_MM,
  INSIDE_MOUNT_SIDE_EXTENSION_MM,
  ROD_ABOVE_WINDOW_MM,
  BELOW_SILL_EXTRA_MM,
  FLOOR_CLEARANCE_MM,
  PUDDLE_EXTRA_MM,
  DEFAULT_ROD_TO_FLOOR_MM,
  MIN_CURTAIN_WINDOW_MM,
  type CurtainInput,
  type CurtainResult,
} from '../curtain.js';

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const BASE_INPUT: CurtainInput = {
  windowWidthMm: 1219.2,    // 48 in
  windowHeightMm: 1524,     // 60 in
  mountType: 'outside',
  style: 'grommet',
  fullness: 2,
  floorPosition: 'sill',
  rodPosition: 'above-window',
  rodCustomOffsetMm: ROD_ABOVE_WINDOW_MM,
  rodToFloorMm: DEFAULT_ROD_TO_FLOOR_MM,
  panelCount: 2,
};

// ─────────────────────────────────────────────────────────────────────────────
// calcRodLength
// ─────────────────────────────────────────────────────────────────────────────

describe('calcRodLength', () => {
  it('adds 2× side extension for outside mount', () => {
    const { rodLengthMm, sideExtensionMm } = calcRodLength(1219.2, 'outside');
    expect(sideExtensionMm).toBeCloseTo(OUTSIDE_MOUNT_SIDE_EXTENSION_MM, 1);
    expect(rodLengthMm).toBeCloseTo(1219.2 + OUTSIDE_MOUNT_SIDE_EXTENSION_MM * 2, 1);
  });

  it('equals window width for inside mount (no extension)', () => {
    const { rodLengthMm, sideExtensionMm } = calcRodLength(914.4, 'inside');
    expect(sideExtensionMm).toBe(0);
    expect(rodLengthMm).toBe(914.4);
  });

  it('outside rod is always longer than window width', () => {
    const { rodLengthMm } = calcRodLength(914.4, 'outside');
    expect(rodLengthMm).toBeGreaterThan(914.4);
  });

  it('handles very narrow window', () => {
    const { rodLengthMm } = calcRodLength(304.8, 'outside');
    expect(rodLengthMm).toBeGreaterThan(304.8);
  });

  it('handles very wide window', () => {
    const { rodLengthMm } = calcRodLength(3048, 'outside');
    expect(rodLengthMm).toBeCloseTo(3048 + OUTSIDE_MOUNT_SIDE_EXTENSION_MM * 2, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcRodAbove
// ─────────────────────────────────────────────────────────────────────────────

describe('calcRodAbove', () => {
  it('returns standard offset for "above-window"', () => {
    expect(calcRodAbove('above-window', 0)).toBe(ROD_ABOVE_WINDOW_MM);
  });

  it('returns 0 for "at-trim"', () => {
    expect(calcRodAbove('at-trim', 200)).toBe(0);
  });

  it('returns custom offset for "custom"', () => {
    expect(calcRodAbove('custom', 203.2)).toBeCloseTo(203.2, 1);
  });

  it('returns 0 for negative custom offset', () => {
    expect(calcRodAbove('custom', -50)).toBe(0);
  });

  it('ignores custom offset for non-custom positions', () => {
    expect(calcRodAbove('above-window', 999)).toBe(ROD_ABOVE_WINDOW_MM);
    expect(calcRodAbove('at-trim', 999)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcDrop
// ─────────────────────────────────────────────────────────────────────────────

describe('calcDrop', () => {
  const windowH = 1219.2; // 48 in
  const rodAbove = ROD_ABOVE_WINDOW_MM; // 127 mm
  const floorDist = 2133.6; // 84 in

  it('"sill" drop = rodAbove + windowHeight', () => {
    const drop = calcDrop(windowH, rodAbove, 'sill', floorDist);
    expect(drop).toBeCloseTo(rodAbove + windowH, 1);
  });

  it('"below-sill" drop = rodAbove + windowHeight + 152.4mm', () => {
    const drop = calcDrop(windowH, rodAbove, 'below-sill', floorDist);
    expect(drop).toBeCloseTo(rodAbove + windowH + BELOW_SILL_EXTRA_MM, 1);
  });

  it('"floor" drop = rodToFloor - 12.7mm clearance', () => {
    const drop = calcDrop(windowH, rodAbove, 'floor', floorDist);
    expect(drop).toBeCloseTo(floorDist - FLOOR_CLEARANCE_MM, 1);
  });

  it('"puddle" drop = rodToFloor + 152.4mm puddle', () => {
    const drop = calcDrop(windowH, rodAbove, 'puddle', floorDist);
    expect(drop).toBeCloseTo(floorDist + PUDDLE_EXTRA_MM, 1);
  });

  it('"sill" drop is shortest of all positions', () => {
    const sill = calcDrop(windowH, rodAbove, 'sill', floorDist);
    const below = calcDrop(windowH, rodAbove, 'below-sill', floorDist);
    const floor = calcDrop(windowH, rodAbove, 'floor', floorDist);
    const puddle = calcDrop(windowH, rodAbove, 'puddle', floorDist);
    expect(sill).toBeLessThan(below);
    expect(sill).toBeLessThan(floor);
    expect(sill).toBeLessThan(puddle);
  });

  it('"puddle" drop is longest of all positions', () => {
    const floor = calcDrop(windowH, rodAbove, 'floor', floorDist);
    const puddle = calcDrop(windowH, rodAbove, 'puddle', floorDist);
    expect(puddle).toBeGreaterThan(floor);
  });

  it('"below-sill" is between "sill" and "floor"', () => {
    const sill  = calcDrop(windowH, rodAbove, 'sill',       floorDist);
    const below = calcDrop(windowH, rodAbove, 'below-sill', floorDist);
    const floor = calcDrop(windowH, rodAbove, 'floor',      floorDist);
    expect(below).toBeGreaterThan(sill);
    expect(below).toBeLessThan(floor);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcWidths
// ─────────────────────────────────────────────────────────────────────────────

describe('calcWidths', () => {
  const rodLength = 1422.4; // 56 in

  it('totalWidthMm = rodLength × fullness', () => {
    const { totalWidthMm } = calcWidths(rodLength, 2, 2);
    expect(totalWidthMm).toBeCloseTo(rodLength * 2, 1);
  });

  it('panelWidthMm = totalWidthMm / panelCount', () => {
    const { totalWidthMm, panelWidthMm } = calcWidths(rodLength, 2, 2);
    expect(panelWidthMm).toBeCloseTo(totalWidthMm / 2, 1);
  });

  it('minWidthMm = rodLength × 1.5', () => {
    const { minWidthMm } = calcWidths(rodLength, 2, 2);
    expect(minWidthMm).toBeCloseTo(rodLength * 1.5, 1);
  });

  it('maxWidthMm = rodLength × 3.0', () => {
    const { maxWidthMm } = calcWidths(rodLength, 2, 2);
    expect(maxWidthMm).toBeCloseTo(rodLength * 3.0, 1);
  });

  it('idealWidthMm = rodLength × fullness', () => {
    const { idealWidthMm } = calcWidths(rodLength, 2.5, 2);
    expect(idealWidthMm).toBeCloseTo(rodLength * 2.5, 1);
  });

  it('fullnessRatio equals the requested fullness', () => {
    const { fullnessRatio } = calcWidths(rodLength, 2, 2);
    expect(fullnessRatio).toBeCloseTo(2, 3);
  });

  it('4 panels produce narrower individual panels than 2', () => {
    const two  = calcWidths(rodLength, 2, 2);
    const four = calcWidths(rodLength, 2, 4);
    expect(four.panelWidthMm).toBeCloseTo(two.panelWidthMm / 2, 1);
  });

  it('fullness 3.0 gives max-width curtain', () => {
    const { totalWidthMm, maxWidthMm } = calcWidths(rodLength, 3.0, 2);
    expect(totalWidthMm).toBeCloseTo(maxWidthMm, 1);
  });

  it('fullness 1.5 gives min-width curtain', () => {
    const { totalWidthMm, minWidthMm } = calcWidths(rodLength, 1.5, 2);
    expect(totalWidthMm).toBeCloseTo(minWidthMm, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcFabric
// ─────────────────────────────────────────────────────────────────────────────

describe('calcFabric', () => {
  const panelW = 711.2; // 28 in
  const drop   = 1651;  // 65 in
  const header = 44.45; // 1.75 in
  const panels = 2;

  it('fabricWidthPerPanelMm > panelWidthMm (hems added)', () => {
    const { fabricWidthPerPanelMm } = calcFabric(panelW, drop, header, panels);
    expect(fabricWidthPerPanelMm).toBeGreaterThan(panelW);
  });

  it('fabricDropMm > dropMm (hems added)', () => {
    const { fabricDropMm } = calcFabric(panelW, drop, header, panels);
    expect(fabricDropMm).toBeGreaterThan(drop);
  });

  it('totalFabricWidthMm = fabricWidthPerPanel × panelCount', () => {
    const { fabricWidthPerPanelMm, totalFabricWidthMm } = calcFabric(panelW, drop, header, panels);
    expect(totalFabricWidthMm).toBeCloseTo(fabricWidthPerPanelMm * panels, 1);
  });

  it('4-panel total fabric is 2× the 2-panel total', () => {
    const two  = calcFabric(panelW, drop, header, 2);
    const four = calcFabric(panelW, drop, header, 4);
    expect(four.totalFabricWidthMm).toBeCloseTo(two.totalFabricWidthMm * 2, 1);
  });

  it('header height is included in fabricDropMm', () => {
    const noHeader = calcFabric(panelW, drop, 0, panels);
    const withHeader = calcFabric(panelW, drop, header, panels);
    expect(withHeader.fabricDropMm - noHeader.fabricDropMm).toBeCloseTo(header, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// validateCurtainDimension
// ─────────────────────────────────────────────────────────────────────────────

describe('validateCurtainDimension', () => {
  it('returns valid for normal width', () => {
    expect(validateCurtainDimension(1219.2, 'width').valid).toBe(true);
  });

  it('returns valid for normal height', () => {
    expect(validateCurtainDimension(1524, 'height').valid).toBe(true);
  });

  it('returns error for zero width', () => {
    const r = validateCurtainDimension(0, 'width');
    expect(r.valid).toBe(false);
    expect(r.level).toBe('error');
  });

  it('returns error for negative height', () => {
    const r = validateCurtainDimension(-100, 'height');
    expect(r.valid).toBe(false);
    expect(r.level).toBe('error');
  });

  it('returns error for width below minimum', () => {
    const r = validateCurtainDimension(MIN_CURTAIN_WINDOW_MM - 1, 'width');
    expect(r.valid).toBe(false);
    expect(r.level).toBe('error');
  });

  it('returns warning (not error) for very wide window', () => {
    const r = validateCurtainDimension(5000, 'width');
    expect(r.valid).toBe(false);
    expect(r.level).toBe('warning');
  });

  it('returns error for NaN', () => {
    const r = validateCurtainDimension(NaN, 'width');
    expect(r.valid).toBe(false);
    expect(r.level).toBe('error');
  });

  it('returns error for Infinity', () => {
    const r = validateCurtainDimension(Infinity, 'width');
    expect(r.valid).toBe(false);
    expect(r.level).toBe('error');
  });

  it('includes the field name in the result', () => {
    const r = validateCurtainDimension(-1, 'height');
    expect(r.field).toBe('height');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildCurtainWarnings
// ─────────────────────────────────────────────────────────────────────────────

describe('buildCurtainWarnings', () => {
  it('produces no warnings for a standard setup', () => {
    const result = calculateCurtain(BASE_INPUT);
    const nonSeverity = result.warnings.filter(w => w.level === 'error');
    expect(nonSeverity).toHaveLength(0);
  });

  it('warns for very small window width', () => {
    const result = calculateCurtain({ ...BASE_INPUT, windowWidthMm: 200 });
    const codes = result.warnings.map(w => w.code);
    expect(codes).toContain('VERY_SMALL_WINDOW');
  });

  it('warns for very wide window', () => {
    const result = calculateCurtain({ ...BASE_INPUT, windowWidthMm: 2500 });
    const codes = result.warnings.map(w => w.code);
    expect(codes).toContain('WIDE_WINDOW');
  });

  it('warns for extremely wide window', () => {
    const result = calculateCurtain({ ...BASE_INPUT, windowWidthMm: 5000 });
    const codes = result.warnings.map(w => w.code);
    expect(codes).toContain('OVERSIZED_WINDOW');
  });

  it('warns for very long drop', () => {
    const result = calculateCurtain({
      ...BASE_INPUT,
      floorPosition: 'puddle',
      rodToFloorMm: 3200,
    });
    const codes = result.warnings.map(w => w.code);
    expect(codes).toContain('VERY_LONG_DROP');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateCurtain — integration
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateCurtain', () => {
  it('returns a complete result for the base input', () => {
    const result = calculateCurtain(BASE_INPUT);
    expect(result).toHaveProperty('rodLengthMm');
    expect(result).toHaveProperty('dropMm');
    expect(result).toHaveProperty('panelWidthMm');
    expect(result).toHaveProperty('fabricWidthPerPanelMm');
    expect(result).toHaveProperty('fabricDropMm');
    expect(result).toHaveProperty('headerHeightMm');
    expect(result).toHaveProperty('recommendations');
    expect(result).toHaveProperty('warnings');
  });

  it('outside mount rod is longer than inside mount rod', () => {
    const outside = calculateCurtain({ ...BASE_INPUT, mountType: 'outside' });
    const inside  = calculateCurtain({ ...BASE_INPUT, mountType: 'inside' });
    expect(outside.rodLengthMm).toBeGreaterThan(inside.rodLengthMm);
  });

  it('puddle curtains are longer than floor curtains', () => {
    const floor  = calculateCurtain({ ...BASE_INPUT, floorPosition: 'floor' });
    const puddle = calculateCurtain({ ...BASE_INPUT, floorPosition: 'puddle' });
    expect(puddle.dropMm).toBeGreaterThan(floor.dropMm);
  });

  it('floor curtains are longer than sill curtains', () => {
    const sill  = calculateCurtain({ ...BASE_INPUT, floorPosition: 'sill' });
    const floor = calculateCurtain({ ...BASE_INPUT, floorPosition: 'floor' });
    expect(floor.dropMm).toBeGreaterThan(sill.dropMm);
  });

  it('3× fullness gives more fabric than 1.5×', () => {
    const low  = calculateCurtain({ ...BASE_INPUT, fullness: 1.5 });
    const high = calculateCurtain({ ...BASE_INPUT, fullness: 3.0 });
    expect(high.totalWidthMm).toBeGreaterThan(low.totalWidthMm);
    expect(high.totalFabricWidthMm).toBeGreaterThan(low.totalFabricWidthMm);
  });

  it('4 panels have narrower individual widths than 2 panels', () => {
    const two  = calculateCurtain({ ...BASE_INPUT, panelCount: 2 });
    const four = calculateCurtain({ ...BASE_INPUT, panelCount: 4 });
    expect(four.panelWidthMm).toBeLessThan(two.panelWidthMm);
    expect(four.totalWidthMm).toBeCloseTo(two.totalWidthMm, 1);
  });

  it('custom rod above-window uses the provided offset', () => {
    const custom = calculateCurtain({
      ...BASE_INPUT,
      rodPosition: 'custom',
      rodCustomOffsetMm: 200,
    });
    expect(custom.rodAboveWindowMm).toBe(200);
  });

  it('"at-trim" rod has 0 above window offset', () => {
    const atTrim = calculateCurtain({ ...BASE_INPUT, rodPosition: 'at-trim' });
    expect(atTrim.rodAboveWindowMm).toBe(0);
  });

  it('fabric drop is greater than curtain drop (hems included)', () => {
    const result = calculateCurtain(BASE_INPUT);
    expect(result.fabricDropMm).toBeGreaterThan(result.dropMm);
  });

  it('fabric width per panel is greater than panel width (hems included)', () => {
    const result = calculateCurtain(BASE_INPUT);
    expect(result.fabricWidthPerPanelMm).toBeGreaterThan(result.panelWidthMm);
  });

  it('fullnessRatio equals requested fullness', () => {
    const result = calculateCurtain({ ...BASE_INPUT, fullness: 2.5 });
    expect(result.fullnessRatio).toBeCloseTo(2.5, 3);
  });

  it('produces recommendations', () => {
    const result = calculateCurtain(BASE_INPUT);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('each recommendation has a title and body', () => {
    const result = calculateCurtain(BASE_INPUT);
    result.recommendations.forEach((rec) => {
      expect(rec).toHaveProperty('title');
      expect(rec).toHaveProperty('body');
      expect(typeof rec.title).toBe('string');
      expect(typeof rec.body).toBe('string');
    });
  });

  it('each warning has a level, code, and message', () => {
    const result = calculateCurtain({ ...BASE_INPUT, windowWidthMm: 200 });
    result.warnings.forEach((w) => {
      expect(w).toHaveProperty('level');
      expect(w).toHaveProperty('code');
      expect(w).toHaveProperty('message');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Style-specific header heights
// ─────────────────────────────────────────────────────────────────────────────

describe('header heights by style', () => {
  const styles = ['standard', 'grommet', 'rod-pocket', 'pinch-pleat', 'eyelet'] as const;

  for (const style of styles) {
    it(`style "${style}" has a positive header height`, () => {
      const result = calculateCurtain({ ...BASE_INPUT, style });
      expect(result.headerHeightMm).toBeGreaterThan(0);
    });
  }

  it('pinch-pleat has the tallest header', () => {
    const headers = styles.map((s) => calculateCurtain({ ...BASE_INPUT, style: s }).headerHeightMm);
    const pinch = calculateCurtain({ ...BASE_INPUT, style: 'pinch-pleat' }).headerHeightMm;
    expect(pinch).toBe(Math.max(...headers));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Mount type interaction
// ─────────────────────────────────────────────────────────────────────────────

describe('mount type', () => {
  it('inside mount: sideExtension is 0', () => {
    const result = calculateCurtain({ ...BASE_INPUT, mountType: 'inside' });
    expect(result.sideExtensionMm).toBe(0);
  });

  it('outside mount: sideExtension equals OUTSIDE_MOUNT_SIDE_EXTENSION_MM', () => {
    const result = calculateCurtain({ ...BASE_INPUT, mountType: 'outside' });
    expect(result.sideExtensionMm).toBeCloseTo(OUTSIDE_MOUNT_SIDE_EXTENSION_MM, 1);
  });

  it('inside mount rod length equals window width', () => {
    const result = calculateCurtain({ ...BASE_INPUT, mountType: 'inside' });
    expect(result.rodLengthMm).toBeCloseTo(BASE_INPUT.windowWidthMm, 1);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('single panel: panel width equals total width', () => {
    const result = calculateCurtain({ ...BASE_INPUT, panelCount: 1 });
    expect(result.panelWidthMm).toBeCloseTo(result.totalWidthMm, 1);
  });

  it('at-trim rod + sill position: drop equals window height', () => {
    const result = calculateCurtain({
      ...BASE_INPUT,
      rodPosition: 'at-trim',
      floorPosition: 'sill',
    });
    expect(result.dropMm).toBeCloseTo(BASE_INPUT.windowHeightMm, 1);
  });

  it('custom rod offset of 0: same as at-trim', () => {
    const atTrim = calculateCurtain({ ...BASE_INPUT, rodPosition: 'at-trim' });
    const custom = calculateCurtain({ ...BASE_INPUT, rodPosition: 'custom', rodCustomOffsetMm: 0 });
    expect(custom.rodAboveWindowMm).toBe(atTrim.rodAboveWindowMm);
  });

  it('standard 48" × 84" window gives plausible results', () => {
    const result = calculateCurtain({
      ...BASE_INPUT,
      windowWidthMm: 1219.2,   // 48"
      windowHeightMm: 2133.6,  // 84"
      floorPosition: 'floor',
      rodToFloorMm: 2438.4,    // 96" (8ft ceiling)
    });
    expect(result.rodLengthMm).toBeGreaterThan(1219.2);
    expect(result.dropMm).toBeGreaterThan(2000);
    expect(result.panelWidthMm).toBeGreaterThan(0);
    expect(result.fabricDropMm).toBeGreaterThan(result.dropMm);
  });

  it('min-width and max-width bracket the ideal width', () => {
    const result = calculateCurtain({ ...BASE_INPUT, fullness: 2 });
    expect(result.minWidthMm).toBeLessThanOrEqual(result.idealWidthMm);
    expect(result.idealWidthMm).toBeLessThanOrEqual(result.maxWidthMm);
  });
});
