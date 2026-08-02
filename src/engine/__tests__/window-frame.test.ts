/**
 * Vitest Test Suite for Window Frame Calculator Engine
 *
 * Tests outer/inner frame dimensions, glass rabbet opening size, 4-piece cut list generation (mitred vs butt),
 * linear material lengths, profile volume, weight density formulas, waste allowances, and recommendations.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateWindowFrame,
  WINDOW_FRAME_DEFAULTS,
  MATERIAL_DENSITY_KG_M3,
  type WindowFrameInput,
} from '../window-frame.js';
import { buildWindowFrameRecommendations } from '../window-frame-recommendations.js';

const BASE_INPUT: WindowFrameInput = {
  openingWidthMm: 1219.2, // 48"
  openingHeightMm: 1524.0, // 60"
  frameMaterial: 'wood',
  profileWidthMm: 50.8, // 2"
  profileThicknessMm: 38.1, // 1.5"
  assemblyType: 'miter',
  wastePct: 10,
  quantity: 1,
};

describe('Window Frame Engine — Constants & Material Densities', () => {
  it('defines valid minimum opening dimensions & defaults', () => {
    expect(WINDOW_FRAME_DEFAULTS.MIN_OPENING_MM).toBe(152.4);
    expect(WINDOW_FRAME_DEFAULTS.DEFAULT_PROFILE_WIDTH_MM).toBe(50.8);
    expect(WINDOW_FRAME_DEFAULTS.GLASS_RABBET_DEPTH_MM).toBe(12.7);
  });

  it('defines valid material densities', () => {
    expect(MATERIAL_DENSITY_KG_M3.wood).toBe(550);
    expect(MATERIAL_DENSITY_KG_M3.aluminum).toBe(2700);
    expect(MATERIAL_DENSITY_KG_M3.vinyl).toBe(1400);
    expect(MATERIAL_DENSITY_KG_M3.fiberglass).toBe(1800);
  });
});

describe('Window Frame Engine — Miter Joint Assembly (45°)', () => {
  it('calculates 48x60 frame with 45° miter cuts', () => {
    const result = calculateWindowFrame(BASE_INPUT);
    expect(result.outerWidthIn).toBe(48.0);
    expect(result.outerHeightIn).toBe(60.0);

    // Inner daylight opening = 48 - 4 = 44" by 60 - 4 = 56"
    expect(result.innerWidthIn).toBe(44.0);
    expect(result.innerHeightIn).toBe(56.0);

    // Glass rabbet opening (+1" total for 1/2" pocket around inner opening) = 45" x 57"
    expect(result.glassOpeningWidthIn).toBe(45.0);
    expect(result.glassOpeningHeightIn).toBe(57.0);

    // Cut list verification
    expect(result.cutList.length).toBe(4);
    const topRail = result.cutList.find((c) => c.name === 'Top Rail');
    const leftStile = result.cutList.find((c) => c.name === 'Left Stile');

    expect(topRail?.lengthIn).toBe(48.0);
    expect(topRail?.miterAngleLeft).toBe(45);
    expect(leftStile?.lengthIn).toBe(60.0);
    expect(leftStile?.miterAngleLeft).toBe(45);

    expect(result.totalMaterialLengthFt).toBeCloseTo(18.0, 1);
    expect(result.totalMaterialLengthWithWasteFt).toBeCloseTo(19.8, 1);
    expect(result.confidence).toBe('excellent');
  });
});

describe('Window Frame Engine — Butt Joint Assembly (90°)', () => {
  it('calculates 48x60 frame with 90° butt joints (shortened stiles)', () => {
    const buttInput: WindowFrameInput = { ...BASE_INPUT, assemblyType: 'butt' };
    const result = calculateWindowFrame(buttInput);

    const topRail = result.cutList.find((c) => c.name === 'Top Rail');
    const leftStile = result.cutList.find((c) => c.name === 'Left Stile');

    expect(topRail?.lengthIn).toBe(48.0);
    expect(topRail?.miterAngleLeft).toBe(90);

    // Stile length = 60" - 2*(2") = 56"
    expect(leftStile?.lengthIn).toBe(56.0);
    expect(leftStile?.miterAngleLeft).toBe(90);

    // Total net material length = (48*2) + (56*2) = 208" = 17.33 ft
    expect(result.totalMaterialLengthFt).toBeCloseTo(17.3, 1);
  });
});

describe('Window Frame Engine — Material Weight & Volume', () => {
  it('aluminum frame weighs more than wood frame', () => {
    const wood = calculateWindowFrame({ ...BASE_INPUT, frameMaterial: 'wood' });
    const aluminum = calculateWindowFrame({ ...BASE_INPUT, frameMaterial: 'aluminum' });
    expect(aluminum.estimatedWeightKg).toBeGreaterThan(wood.estimatedWeightKg * 4);
  });

  it('scales material length and weight proportionally with quantity', () => {
    const res1 = calculateWindowFrame({ ...BASE_INPUT, quantity: 1 });
    const res5 = calculateWindowFrame({ ...BASE_INPUT, quantity: 5 });
    expect(res5.totalMaterialLengthFt).toBeCloseTo(res1.totalMaterialLengthFt * 5, 1);
    expect(res5.estimatedWeightLbs).toBeCloseTo(res1.estimatedWeightLbs * 5, 1);
  });
});

describe('Window Frame Engine — Recommendations Module', () => {
  it('builds comprehensive recommendation set', () => {
    const res = calculateWindowFrame(BASE_INPUT);
    const recs = buildWindowFrameRecommendations(BASE_INPUT, res);

    expect(recs.cutListSummaryNote).toContain('Rails');
    expect(recs.items.length).toBeGreaterThanOrEqual(5);
    expect(recs.materialStockNote).toContain('ft');
  });

  it('provides miter corner joinery advice for miter assembly', () => {
    const res = calculateWindowFrame(BASE_INPUT);
    const recs = buildWindowFrameRecommendations(BASE_INPUT, res);

    expect(recs.items.some((i) => i.type === 'joint')).toBe(true);
  });
});
