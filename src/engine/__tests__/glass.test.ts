/**
 * Window Glass Calculator Engine — Vitest coverage
 *
 * Tests for: src/engine/glass.ts
 *
 * Coverage:
 *   - calculateGlassArea (all 5 shapes)
 *   - calculateGlassPerimeter (all 5 shapes)
 *   - calcGlassWeightPerM2 (all glass types)
 *   - calcTotalThickness (pane + IGU stack)
 *   - recommendedThickness (area tiers)
 *   - calcHandling (weight thresholds)
 *   - calcInstallDifficulty
 *   - calcSafetyClass
 *   - isCustomFab (all triggers)
 *   - validateGlassDimension (error/warning levels)
 *   - buildGlassWarnings (all warning codes)
 *   - calculateGlass (integration, round-trips)
 *   - Edge cases and extreme inputs
 */

import { describe, it, expect } from 'vitest';
import {
  calculateGlass,
  calculateGlassArea,
  calculateGlassPerimeter,
  calcGlassWeightPerM2,
  calcTotalThickness,
  recommendedThickness,
  calcHandling,
  calcInstallDifficulty,
  calcSafetyClass,
  isCustomFab,
  validateGlassDimension,
  buildGlassWarnings,
  GLASS_DENSITY_KG_M3,
  PVB_WEIGHT_PER_M2,
  IGU_SPACER_WEIGHT_KG_M2,
  SHIPPING_PACKING_FACTOR,
  SOLO_LIFT_KG,
  TWO_PERSON_LIFT_KG,
  MAX_STANDARD_SHEET_MM,
  MIN_GLASS_DIM_MM,
  type GlassInput,
} from '../glass.js';

// ─────────────────────────────────────────────────────────────────────────────
// Fixtures
// ─────────────────────────────────────────────────────────────────────────────

const BASE_INPUT: GlassInput = {
  widthMm:      914.4,   // 36"
  heightMm:     1219.2,  // 48"
  shape:        'rectangle',
  glassType:    'annealed',
  thicknessMm:  6,
  quantity:     1,
  wastePercent: 10,
  edgeFinish:   'raw',
  holeCount:    0,
};

// ─────────────────────────────────────────────────────────────────────────────
// calculateGlassArea — shape-by-shape
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateGlassArea', () => {
  it('rectangle: w × h', () => {
    const a = calculateGlassArea('rectangle', 1000, 2000);
    expect(a).toBeCloseTo(1000 * 2000, 0);
  });

  it('square: w × w (height ignored)', () => {
    const a = calculateGlassArea('square', 1000, 999);
    expect(a).toBeCloseTo(1000 * 1000, 0);
  });

  it('circle: π × r² (width = diameter)', () => {
    const a = calculateGlassArea('circle', 1000, 0);
    expect(a).toBeCloseTo(Math.PI * 500 * 500, 3);
  });

  it('half-circle: π × r² / 2', () => {
    const a = calculateGlassArea('half-circle', 1000, 0);
    expect(a).toBeCloseTo(Math.PI * 500 * 500 / 2, 3);
  });

  it('triangle: w × h / 2', () => {
    const a = calculateGlassArea('triangle', 1000, 2000);
    expect(a).toBeCloseTo(1000 * 2000 / 2, 0);
  });

  it('circle is smaller than rectangle with same width/height', () => {
    const rect = calculateGlassArea('rectangle', 1000, 1000);
    const circ = calculateGlassArea('circle', 1000, 1000);
    expect(circ).toBeLessThan(rect);
  });

  it('half-circle is half of full circle', () => {
    const full = calculateGlassArea('circle', 800, 0);
    const half = calculateGlassArea('half-circle', 800, 0);
    expect(half).toBeCloseTo(full / 2, 5);
  });

  it('triangle is half the rectangle', () => {
    const rect = calculateGlassArea('rectangle', 800, 600);
    const tri  = calculateGlassArea('triangle',  800, 600);
    expect(tri).toBeCloseTo(rect / 2, 5);
  });

  it('returns 0 for zero dimensions', () => {
    expect(calculateGlassArea('rectangle', 0, 1000)).toBe(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateGlassPerimeter — shape-by-shape
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateGlassPerimeter', () => {
  it('rectangle: 2(w + h)', () => {
    expect(calculateGlassPerimeter('rectangle', 1000, 2000)).toBeCloseTo(2 * (1000 + 2000), 0);
  });

  it('square: 4w', () => {
    expect(calculateGlassPerimeter('square', 1000, 0)).toBeCloseTo(4000, 0);
  });

  it('circle: π × diameter', () => {
    expect(calculateGlassPerimeter('circle', 1000, 0)).toBeCloseTo(Math.PI * 1000, 3);
  });

  it('half-circle: π × r + diameter', () => {
    const r = 500;
    expect(calculateGlassPerimeter('half-circle', 1000, 0)).toBeCloseTo(Math.PI * r + 1000, 3);
  });

  it('triangle: w + h + hypotenuse', () => {
    const hyp = Math.sqrt(1000 ** 2 + 2000 ** 2);
    expect(calculateGlassPerimeter('triangle', 1000, 2000)).toBeCloseTo(1000 + 2000 + hyp, 3);
  });

  it('circle perimeter is less than rectangle perimeter with same w', () => {
    const circ = calculateGlassPerimeter('circle', 1000, 0);
    const rect = calculateGlassPerimeter('rectangle', 1000, 1000);
    expect(circ).toBeLessThan(rect);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcGlassWeightPerM2 — glass types
// ─────────────────────────────────────────────────────────────────────────────

describe('calcGlassWeightPerM2', () => {
  it('annealed: thickness × 2.5', () => {
    expect(calcGlassWeightPerM2('annealed', 6)).toBeCloseTo(6 * 2.5, 5);
  });

  it('tempered has same weight as annealed', () => {
    expect(calcGlassWeightPerM2('tempered', 6)).toBeCloseTo(calcGlassWeightPerM2('annealed', 6), 5);
  });

  it('low-e has same weight as annealed', () => {
    expect(calcGlassWeightPerM2('low-e', 6)).toBeCloseTo(calcGlassWeightPerM2('annealed', 6), 5);
  });

  it('laminated is heavier than annealed by PVB weight', () => {
    const ann = calcGlassWeightPerM2('annealed', 6);
    const lam = calcGlassWeightPerM2('laminated', 6);
    expect(lam - ann).toBeCloseTo(PVB_WEIGHT_PER_M2, 3);
  });

  it('double-pane is roughly 2× annealed + spacer', () => {
    const ann   = calcGlassWeightPerM2('annealed', 4);
    const dbl   = calcGlassWeightPerM2('double-pane', 4);
    expect(dbl).toBeCloseTo(2 * ann + IGU_SPACER_WEIGHT_KG_M2, 3);
  });

  it('triple-pane is roughly 3× annealed + 2× spacer', () => {
    const ann = calcGlassWeightPerM2('annealed', 4);
    const tri = calcGlassWeightPerM2('triple-pane', 4);
    expect(tri).toBeCloseTo(3 * ann + IGU_SPACER_WEIGHT_KG_M2 * 2, 3);
  });

  it('triple-pane is heavier than double-pane', () => {
    expect(calcGlassWeightPerM2('triple-pane', 4))
      .toBeGreaterThan(calcGlassWeightPerM2('double-pane', 4));
  });

  it('heavier for larger thickness', () => {
    expect(calcGlassWeightPerM2('annealed', 10))
      .toBeGreaterThan(calcGlassWeightPerM2('annealed', 6));
  });

  it('4 mm annealed ≈ 10 kg/m²', () => {
    expect(calcGlassWeightPerM2('annealed', 4)).toBeCloseTo(10, 5);
  });

  it('6 mm annealed ≈ 15 kg/m²', () => {
    expect(calcGlassWeightPerM2('annealed', 6)).toBeCloseTo(15, 5);
  });

  it('12 mm annealed ≈ 30 kg/m²', () => {
    expect(calcGlassWeightPerM2('annealed', 12)).toBeCloseTo(30, 5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcTotalThickness
// ─────────────────────────────────────────────────────────────────────────────

describe('calcTotalThickness', () => {
  it('annealed: equals pane thickness', () => {
    expect(calcTotalThickness('annealed', 6)).toBe(6);
  });

  it('tempered: equals pane thickness', () => {
    expect(calcTotalThickness('tempered', 6)).toBe(6);
  });

  it('laminated: pane + PVB thickness', () => {
    const t = calcTotalThickness('laminated', 6);
    expect(t).toBeGreaterThan(6);
  });

  it('double-pane: 2 panes + gap', () => {
    // e.g., 4-12-4 = 20mm
    const t = calcTotalThickness('double-pane', 4);
    expect(t).toBeGreaterThan(4 * 2); // more than just two panes
  });

  it('triple-pane > double-pane at same thickness', () => {
    expect(calcTotalThickness('triple-pane', 4))
      .toBeGreaterThan(calcTotalThickness('double-pane', 4));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// recommendedThickness
// ─────────────────────────────────────────────────────────────────────────────

describe('recommendedThickness', () => {
  it('returns 3 for very small pane (< 0.09 m²)', () => {
    expect(recommendedThickness(0.05)).toBe(3);
  });

  it('returns 4 for small pane (0.1–0.25 m²)', () => {
    expect(recommendedThickness(0.16)).toBe(4);
  });

  it('returns 6 for medium-large pane (0.6–1.5 m²)', () => {
    expect(recommendedThickness(1.0)).toBe(6);
  });

  it('returns 8 for large pane (1.5–3 m²)', () => {
    expect(recommendedThickness(2.0)).toBe(8);
  });

  it('returns 10 for very large pane (3–6 m²)', () => {
    expect(recommendedThickness(4.0)).toBe(10);
  });

  it('returns 12 for huge pane (6–12 m²)', () => {
    expect(recommendedThickness(9.0)).toBe(12);
  });

  it('returns 15 for extreme pane (> 12 m²)', () => {
    expect(recommendedThickness(15.0)).toBe(15);
  });

  it('recommendation increases monotonically with area', () => {
    const areas = [0.05, 0.2, 0.5, 1.0, 2.5, 5.0, 10.0, 15.0];
    const thicknesses = areas.map(recommendedThickness);
    for (let i = 1; i < thicknesses.length; i++) {
      expect(thicknesses[i]).toBeGreaterThanOrEqual(thicknesses[i - 1]);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcHandling
// ─────────────────────────────────────────────────────────────────────────────

describe('calcHandling', () => {
  it('"solo" for weight ≤ SOLO_LIFT_KG', () => {
    const { handlingClass } = calcHandling(SOLO_LIFT_KG);
    expect(handlingClass).toBe('solo');
  });

  it('"two-person" for weight between thresholds', () => {
    const mid = (SOLO_LIFT_KG + TWO_PERSON_LIFT_KG) / 2;
    const { handlingClass } = calcHandling(mid);
    expect(handlingClass).toBe('two-person');
  });

  it('"mechanical" for weight > TWO_PERSON_LIFT_KG', () => {
    const { handlingClass } = calcHandling(TWO_PERSON_LIFT_KG + 1);
    expect(handlingClass).toBe('mechanical');
  });

  it('includes weight in the handling note', () => {
    const { handlingNote } = calcHandling(12);
    expect(handlingNote).toContain('12.0 kg');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcInstallDifficulty
// ─────────────────────────────────────────────────────────────────────────────

describe('calcInstallDifficulty', () => {
  it('"easy" for light glass, no custom fab, no holes', () => {
    expect(calcInstallDifficulty(10, false, 0)).toBe('easy');
  });

  it('"moderate" for two-person weight glass, no custom fab', () => {
    expect(calcInstallDifficulty(30, false, 0)).toBe('moderate');
  });

  it('"professional" for very heavy glass, no custom fab', () => {
    expect(calcInstallDifficulty(50, false, 0)).toBe('professional');
  });

  it('"contractor" when custom fab required', () => {
    expect(calcInstallDifficulty(5, true, 0)).toBe('contractor');
  });

  it('"contractor" when holes are needed', () => {
    expect(calcInstallDifficulty(5, false, 2)).toBe('contractor');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calcSafetyClass
// ─────────────────────────────────────────────────────────────────────────────

describe('calcSafetyClass', () => {
  it('annealed → standard', () => {
    expect(calcSafetyClass('annealed')).toBe('standard');
  });

  it('tempered → tempered-required', () => {
    expect(calcSafetyClass('tempered')).toBe('tempered-required');
  });

  it('laminated → impact-resistant', () => {
    expect(calcSafetyClass('laminated')).toBe('impact-resistant');
  });

  it('double-pane → standard', () => {
    expect(calcSafetyClass('double-pane')).toBe('standard');
  });

  it('low-e → standard', () => {
    expect(calcSafetyClass('low-e')).toBe('standard');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isCustomFab
// ─────────────────────────────────────────────────────────────────────────────

describe('isCustomFab', () => {
  it('false for basic annealed rectangle', () => {
    expect(isCustomFab('rectangle', 'annealed', 1000, 1000, 'raw', 0)).toBe(false);
  });

  it('true for circle shape', () => {
    expect(isCustomFab('circle', 'annealed', 500, 0, 'raw', 0)).toBe(true);
  });

  it('true for half-circle shape', () => {
    expect(isCustomFab('half-circle', 'annealed', 500, 0, 'raw', 0)).toBe(true);
  });

  it('true for triangle shape', () => {
    expect(isCustomFab('triangle', 'annealed', 500, 500, 'raw', 0)).toBe(true);
  });

  it('true when width exceeds standard sheet', () => {
    expect(isCustomFab('rectangle', 'annealed', MAX_STANDARD_SHEET_MM + 1, 1000, 'raw', 0)).toBe(true);
  });

  it('true for tempered glass', () => {
    expect(isCustomFab('rectangle', 'tempered', 1000, 1000, 'raw', 0)).toBe(true);
  });

  it('true for laminated glass', () => {
    expect(isCustomFab('rectangle', 'laminated', 1000, 1000, 'raw', 0)).toBe(true);
  });

  it('true for double-pane IGU', () => {
    expect(isCustomFab('rectangle', 'double-pane', 1000, 1000, 'raw', 0)).toBe(true);
  });

  it('true for polished edge', () => {
    expect(isCustomFab('rectangle', 'annealed', 1000, 1000, 'polished', 0)).toBe(true);
  });

  it('true for beveled edge', () => {
    expect(isCustomFab('rectangle', 'annealed', 1000, 1000, 'beveled', 0)).toBe(true);
  });

  it('true when holes are requested', () => {
    expect(isCustomFab('rectangle', 'annealed', 1000, 1000, 'raw', 2)).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// validateGlassDimension
// ─────────────────────────────────────────────────────────────────────────────

describe('validateGlassDimension', () => {
  it('valid for normal dimension', () => {
    expect(validateGlassDimension(1000, 'width').valid).toBe(true);
  });

  it('error for zero', () => {
    const r = validateGlassDimension(0, 'width');
    expect(r.valid).toBe(false);
    expect(r.level).toBe('error');
  });

  it('error for negative', () => {
    const r = validateGlassDimension(-100, 'height');
    expect(r.valid).toBe(false);
    expect(r.level).toBe('error');
  });

  it('error for dimension below minimum', () => {
    const r = validateGlassDimension(MIN_GLASS_DIM_MM - 1, 'width');
    expect(r.valid).toBe(false);
    expect(r.level).toBe('error');
  });

  it('error for unrealistically large dimension', () => {
    const r = validateGlassDimension(7000, 'width');
    expect(r.valid).toBe(false);
    expect(r.level).toBe('error');
  });

  it('error for NaN', () => {
    const r = validateGlassDimension(NaN, 'width');
    expect(r.valid).toBe(false);
    expect(r.level).toBe('error');
  });

  it('error for Infinity', () => {
    const r = validateGlassDimension(Infinity, 'width');
    expect(r.valid).toBe(false);
    expect(r.level).toBe('error');
  });

  it('includes the field name in result', () => {
    const r = validateGlassDimension(-1, 'height');
    expect(r.field).toBe('height');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildGlassWarnings
// ─────────────────────────────────────────────────────────────────────────────

describe('buildGlassWarnings', () => {
  const mockInput: GlassInput = { ...BASE_INPUT };

  it('no warnings for a standard small pane', () => {
    const result = calculateGlass({ ...BASE_INPUT, thicknessMm: 6, widthMm: 600, heightMm: 900 });
    const codes = result.warnings.map(w => w.code);
    expect(codes).not.toContain('GLASS_TOO_THIN');
    expect(codes).not.toContain('HEAVY_GLASS');
  });

  it('warns GLASS_TOO_THIN when thickness below recommendation', () => {
    const result = calculateGlass({ ...BASE_INPUT, thicknessMm: 3, widthMm: 2000, heightMm: 2000 });
    const codes = result.warnings.map(w => w.code);
    expect(codes).toContain('GLASS_TOO_THIN');
  });

  it('warns HEAVY_GLASS for very large pane', () => {
    const result = calculateGlass({
      ...BASE_INPUT,
      widthMm: 2500, heightMm: 2500, thicknessMm: 12, glassType: 'annealed',
    });
    const codes = result.warnings.map(w => w.code);
    expect(codes).toContain('HEAVY_GLASS');
  });

  it('warns TWO_PERSON_LIFT for moderately heavy pane', () => {
    // 800×1000mm, 12mm annealed: area = 0.8 m², weight = 30 × 0.8 = 24 kg (> 15 solo, < 40 two-person)
    const result = calculateGlass({
      ...BASE_INPUT,
      widthMm: 800, heightMm: 1000, thicknessMm: 12, glassType: 'annealed', quantity: 1,
    });
    const codes = result.warnings.map(w => w.code);
    expect(codes).toContain('TWO_PERSON_LIFT');
  });

  it('warns SAFETY_GLASS_RECOMMENDED for large annealed pane', () => {
    const result = calculateGlass({
      ...BASE_INPUT,
      widthMm: 1200, heightMm: 1200, thicknessMm: 6, glassType: 'annealed',
    });
    const codes = result.warnings.map(w => w.code);
    expect(codes).toContain('SAFETY_GLASS_RECOMMENDED');
  });

  it('does NOT warn safety glass for tempered', () => {
    const result = calculateGlass({
      ...BASE_INPUT,
      widthMm: 1200, heightMm: 1200, thicknessMm: 6, glassType: 'tempered',
    });
    const codes = result.warnings.map(w => w.code);
    expect(codes).not.toContain('SAFETY_GLASS_RECOMMENDED');
  });

  it('warns TEMPERED_NOT_CUTTABLE for tempered glass', () => {
    const result = calculateGlass({ ...BASE_INPUT, glassType: 'tempered' });
    const codes = result.warnings.map(w => w.code);
    expect(codes).toContain('TEMPERED_NOT_CUTTABLE');
  });

  it('warns OVERSIZED_PANEL for large pane', () => {
    const result = calculateGlass({
      ...BASE_INPUT,
      widthMm: MAX_STANDARD_SHEET_MM + 100, heightMm: 1000,
    });
    const codes = result.warnings.map(w => w.code);
    expect(codes).toContain('OVERSIZED_PANEL');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// calculateGlass — integration
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateGlass integration', () => {
  it('returns a complete result for the base input', () => {
    const r = calculateGlass(BASE_INPUT);
    expect(r).toHaveProperty('areaPerPieceM2');
    expect(r).toHaveProperty('weightPerPieceKg');
    expect(r).toHaveProperty('totalWeightKg');
    expect(r).toHaveProperty('shippingWeightKg');
    expect(r).toHaveProperty('handlingClass');
    expect(r).toHaveProperty('recommendations');
    expect(r).toHaveProperty('warnings');
    expect(r).toHaveProperty('buyingGuide');
  });

  it('area per piece ≈ 914.4 × 1219.2 mm² in m²', () => {
    const r = calculateGlass(BASE_INPUT);
    expect(r.areaPerPieceM2).toBeCloseTo((914.4 * 1219.2) / 1_000_000, 4);
  });

  it('weight per piece = area × 6 × 2.5', () => {
    const r = calculateGlass(BASE_INPUT);
    const expectedKg = r.areaPerPieceM2 * 6 * 2.5;
    expect(r.weightPerPieceKg).toBeCloseTo(expectedKg, 4);
  });

  it('shipping weight = total weight × SHIPPING_PACKING_FACTOR', () => {
    const r = calculateGlass(BASE_INPUT);
    expect(r.shippingWeightKg).toBeCloseTo(r.totalWeightKg * SHIPPING_PACKING_FACTOR, 4);
  });

  it('total weight scales with quantity', () => {
    const one  = calculateGlass({ ...BASE_INPUT, quantity: 1 });
    const five = calculateGlass({ ...BASE_INPUT, quantity: 5 });
    expect(five.totalWeightKg).toBeCloseTo(one.totalWeightKg * 5, 4);
  });

  it('total area scales with quantity', () => {
    const one  = calculateGlass({ ...BASE_INPUT, quantity: 1 });
    const four = calculateGlass({ ...BASE_INPUT, quantity: 4 });
    expect(four.totalAreaM2).toBeCloseTo(one.totalAreaM2 * 4, 4);
  });

  it('area with waste > area without waste when wastePercent > 0', () => {
    const r = calculateGlass({ ...BASE_INPUT, wastePercent: 10 });
    expect(r.areaWithWasteM2).toBeGreaterThan(r.areaPerPieceM2);
  });

  it('area with waste = area when wastePercent = 0', () => {
    const r = calculateGlass({ ...BASE_INPUT, wastePercent: 0 });
    expect(r.areaWithWasteM2).toBeCloseTo(r.areaPerPieceM2, 6);
  });

  it('piecesNeededWithWaste >= quantity', () => {
    const r = calculateGlass({ ...BASE_INPUT, quantity: 5, wastePercent: 10 });
    expect(r.piecesNeededWithWaste).toBeGreaterThanOrEqual(5);
  });

  it('piecesNeededWithWaste = quantity when wastePercent = 0', () => {
    const r = calculateGlass({ ...BASE_INPUT, quantity: 3, wastePercent: 0 });
    expect(r.piecesNeededWithWaste).toBe(3);
  });

  it('weight in lbs ≈ kg × 2.20462', () => {
    const r = calculateGlass(BASE_INPUT);
    expect(r.weightPerPieceLbs).toBeCloseTo(r.weightPerPieceKg * 2.20462, 3);
  });

  it('cuttableAfterOrder false for tempered', () => {
    const r = calculateGlass({ ...BASE_INPUT, glassType: 'tempered' });
    expect(r.cuttableAfterOrder).toBe(false);
  });

  it('customFabRequired true for tempered', () => {
    const r = calculateGlass({ ...BASE_INPUT, glassType: 'tempered' });
    expect(r.customFabRequired).toBe(true);
  });

  it('customFabRequired false for basic annealed rectangle', () => {
    const r = calculateGlass({ ...BASE_INPUT, glassType: 'annealed', edgeFinish: 'raw', holeCount: 0, shape: 'rectangle' });
    expect(r.customFabRequired).toBe(false);
  });

  it('buyingGuide has typeName, pros, cons, typicalUses', () => {
    const r = calculateGlass(BASE_INPUT);
    expect(r.buyingGuide.typeName).toBeTruthy();
    expect(Array.isArray(r.buyingGuide.pros)).toBe(true);
    expect(Array.isArray(r.buyingGuide.cons)).toBe(true);
    expect(Array.isArray(r.buyingGuide.typicalUses)).toBe(true);
  });

  it('recommendations array is non-empty', () => {
    const r = calculateGlass(BASE_INPUT);
    expect(r.recommendations.length).toBeGreaterThan(0);
  });

  it('each recommendation has title and body', () => {
    const r = calculateGlass(BASE_INPUT);
    r.recommendations.forEach(rec => {
      expect(typeof rec.title).toBe('string');
      expect(typeof rec.body).toBe('string');
    });
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Shape area round-trips
// ─────────────────────────────────────────────────────────────────────────────

describe('shape round-trips', () => {
  const shapes = ['rectangle', 'square', 'circle', 'half-circle', 'triangle'] as const;

  for (const shape of shapes) {
    it(`${shape}: area is positive for valid dimensions`, () => {
      const r = calculateGlass({ ...BASE_INPUT, shape });
      expect(r.areaPerPieceM2).toBeGreaterThan(0);
    });

    it(`${shape}: perimeter is positive`, () => {
      const r = calculateGlass({ ...BASE_INPUT, shape });
      expect(r.perimeterMm).toBeGreaterThan(0);
    });

    it(`${shape}: weight per piece is positive`, () => {
      const r = calculateGlass({ ...BASE_INPUT, shape });
      expect(r.weightPerPieceKg).toBeGreaterThan(0);
    });
  }

  it('circle area < rectangle with same width', () => {
    const circ = calculateGlass({ ...BASE_INPUT, shape: 'circle' });
    const rect = calculateGlass({ ...BASE_INPUT, shape: 'rectangle' });
    expect(circ.areaPerPieceM2).toBeLessThan(rect.areaPerPieceM2);
  });

  it('square area ≠ rectangle area when width ≠ height', () => {
    const sq   = calculateGlass({ ...BASE_INPUT, shape: 'square' });
    const rect = calculateGlass({ ...BASE_INPUT, shape: 'rectangle' });
    expect(sq.areaPerPieceM2).not.toBeCloseTo(rect.areaPerPieceM2, 3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Glass type round-trips
// ─────────────────────────────────────────────────────────────────────────────

describe('glass type round-trips', () => {
  const types = ['annealed', 'tempered', 'laminated', 'double-pane', 'triple-pane', 'low-e'] as const;

  for (const glassType of types) {
    it(`${glassType}: returns a complete valid result`, () => {
      const r = calculateGlass({ ...BASE_INPUT, glassType });
      expect(r.weightPerPieceKg).toBeGreaterThan(0);
      expect(r.areaPerPieceM2).toBeGreaterThan(0);
      expect(r.buyingGuide.typeName).toBeTruthy();
    });
  }

  it('triple-pane is heaviest per m²', () => {
    const weights = types.map(t => calculateGlass({ ...BASE_INPUT, glassType: t }).weightKgPerM2);
    const tripleWeight = calculateGlass({ ...BASE_INPUT, glassType: 'triple-pane' }).weightKgPerM2;
    expect(tripleWeight).toBe(Math.max(...weights));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('very small pane (100×100mm, 3mm annealed) has solo handling', () => {
    const r = calculateGlass({ ...BASE_INPUT, widthMm: 100, heightMm: 100, thicknessMm: 3, glassType: 'annealed' });
    expect(r.handlingClass).toBe('solo');
  });

  it('large triple-pane likely requires mechanical handling', () => {
    const r = calculateGlass({
      ...BASE_INPUT, widthMm: 2000, heightMm: 2000, thicknessMm: 6, glassType: 'triple-pane',
    });
    expect(r.handlingClass).toBe('mechanical');
  });

  it('isTooThin true when 3mm for 2×2m pane', () => {
    const r = calculateGlass({ ...BASE_INPUT, widthMm: 2000, heightMm: 2000, thicknessMm: 3 });
    expect(r.isTooThin).toBe(true);
  });

  it('isTooThin false when thickness equals recommendation', () => {
    // Small pane: 200×200 = 0.04m², recommended = 3mm
    const r = calculateGlass({ ...BASE_INPUT, widthMm: 200, heightMm: 200, thicknessMm: 3 });
    expect(r.isTooThin).toBe(false);
  });

  it('safetyClass changes with glass type', () => {
    const ann = calculateGlass({ ...BASE_INPUT, glassType: 'annealed' });
    const tem = calculateGlass({ ...BASE_INPUT, glassType: 'tempered' });
    const lam = calculateGlass({ ...BASE_INPUT, glassType: 'laminated' });
    expect(ann.safetyClass).toBe('standard');
    expect(tem.safetyClass).toBe('tempered-required');
    expect(lam.safetyClass).toBe('impact-resistant');
  });
});
