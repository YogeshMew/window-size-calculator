import { describe, it, expect } from 'vitest';
import {
  calculateWindowWeight,
  calcGlassArea,
  calcEffectiveThickness,
  calcGlassMass,
  calcFramePerimeter,
  calcFrameMass,
  calcHandlingMetrics,
  calcConfidence,
  buildWindowWeightWarnings,
  WINDOW_WEIGHT_DEFAULTS,
  FRAME_LINEAR_MASS_KG_M,
  type WindowWeightInput,
  type WindowWeightShape,
  type WindowWeightGlassType,
  type WindowWeightFrameMaterial,
} from '../window-weight.js';

import { buildWindowWeightRecommendations } from '../window-weight-recommendations.js';
import { toMm } from '../units.js';

const BASE_INPUT: WindowWeightInput = {
  windowWidthMm: 1219.2, // 48 inches
  windowHeightMm: 1524.0, // 60 inches
  shape: 'rectangle',
  thicknessMm: 4,
  glassType: 'double-glazed',
  frameMaterial: 'vinyl',
};

describe('Window Weight Engine', () => {
  describe('WINDOW_WEIGHT_DEFAULTS & Constants', () => {
    it('defines glass density as 2500 kg/m³', () => {
      expect(WINDOW_WEIGHT_DEFAULTS.GLASS_DENSITY_KG_M3).toBe(2500);
    });

    it('defines single person safe carry limit as 25 kg (55 lbs)', () => {
      expect(WINDOW_WEIGHT_DEFAULTS.SINGLE_PERSON_MAX_KG).toBe(25.0);
    });

    it('defines two person carry limit as 50 kg (110 lbs)', () => {
      expect(WINDOW_WEIGHT_DEFAULTS.TWO_PERSON_MAX_KG).toBe(50.0);
    });

    it('defines four person carry limit as 100 kg (220 lbs)', () => {
      expect(WINDOW_WEIGHT_DEFAULTS.FOUR_PERSON_MAX_KG).toBe(100.0);
    });

    it('defines suction cup capacity as 50 kg per cup', () => {
      expect(WINDOW_WEIGHT_DEFAULTS.VACUUM_CUP_CAPACITY_KG).toBe(50.0);
    });

    it('defines frame linear mass for none (0.0)', () => {
      expect(FRAME_LINEAR_MASS_KG_M.none).toBe(0.0);
    });

    it('defines frame linear mass for aluminum (1.2)', () => {
      expect(FRAME_LINEAR_MASS_KG_M.aluminum).toBe(1.2);
    });

    it('defines frame linear mass for vinyl (1.5)', () => {
      expect(FRAME_LINEAR_MASS_KG_M.vinyl).toBe(1.5);
    });

    it('defines frame linear mass for wood (2.2)', () => {
      expect(FRAME_LINEAR_MASS_KG_M.wood).toBe(2.2);
    });

    it('defines frame linear mass for fiberglass (1.8)', () => {
      expect(FRAME_LINEAR_MASS_KG_M.fiberglass).toBe(1.8);
    });

    it('defines frame linear mass for steel (3.8)', () => {
      expect(FRAME_LINEAR_MASS_KG_M.steel).toBe(3.8);
    });
  });

  describe('calcGlassArea', () => {
    it('calculates rectangle area correctly', () => {
      const { glassAreaM2, glassAreaSqFt } = calcGlassArea(1000, 2000, 'rectangle');
      expect(glassAreaM2).toBe(2.0);
      expect(glassAreaSqFt).toBeCloseTo(21.53, 1);
    });

    it('calculates square area correctly', () => {
      const { glassAreaM2 } = calcGlassArea(1500, 1500, 'square');
      expect(glassAreaM2).toBe(2.25);
    });

    it('calculates circle area correctly', () => {
      const { glassAreaM2 } = calcGlassArea(1000, 1000, 'circle');
      expect(glassAreaM2).toBeCloseTo(Math.PI * 0.25, 2);
    });

    it('calculates half-circle area correctly', () => {
      const { glassAreaM2 } = calcGlassArea(1000, 1000, 'half-circle');
      expect(glassAreaM2).toBeCloseTo(0.5 * Math.PI * 0.25, 2);
    });

    it('calculates triangle area correctly', () => {
      const { glassAreaM2 } = calcGlassArea(1000, 2000, 'triangle');
      expect(glassAreaM2).toBe(1.0);
    });

    it('calculates trapezoid area correctly', () => {
      const { glassAreaM2 } = calcGlassArea(1000, 2000, 'trapezoid');
      expect(glassAreaM2).toBe(1.5);
    });
  });

  describe('calcEffectiveThickness', () => {
    it('returns thickness as-is for annealed glass', () => {
      expect(calcEffectiveThickness(6, 'annealed')).toBe(6);
    });

    it('returns thickness as-is for tempered glass', () => {
      expect(calcEffectiveThickness(6, 'tempered')).toBe(6);
    });

    it('adds 0.76mm PVB interlayer for laminated glass', () => {
      expect(calcEffectiveThickness(6, 'laminated')).toBe(6.76);
    });

    it('doubles thickness for double-glazed units', () => {
      expect(calcEffectiveThickness(4, 'double-glazed')).toBe(8);
    });

    it('triples thickness for triple-glazed units', () => {
      expect(calcEffectiveThickness(4, 'triple-glazed')).toBe(12);
    });
  });

  describe('calcGlassMass', () => {
    it('calculates glass volume and weight in kg and lbs', () => {
      const { glassVolumeM3, glassWeightKg, glassWeightLbs } = calcGlassMass(1.0, 10.0);
      expect(glassVolumeM3).toBe(0.01);
      expect(glassWeightKg).toBe(25.0);
      expect(glassWeightLbs).toBeCloseTo(55.11, 1);
    });
  });

  describe('calcFramePerimeter & Mass', () => {
    it('calculates rectangle frame perimeter and weight', () => {
      const p = calcFramePerimeter(1000, 2000, 'rectangle');
      expect(p).toBe(6.0);
      const { frameWeightKg } = calcFrameMass(p, 'aluminum');
      expect(frameWeightKg).toBe(7.2);
    });

    it('calculates square frame perimeter', () => {
      const p = calcFramePerimeter(1000, 1000, 'square');
      expect(p).toBe(4.0);
    });

    it('calculates circle frame perimeter', () => {
      const p = calcFramePerimeter(1000, 1000, 'circle');
      expect(p).toBeCloseTo(Math.PI, 2);
    });

    it('calculates half-circle frame perimeter', () => {
      const p = calcFramePerimeter(1000, 1000, 'half-circle');
      expect(p).toBeGreaterThan(2.0);
    });

    it('calculates triangle frame perimeter', () => {
      const p = calcFramePerimeter(1000, 1000, 'triangle');
      expect(p).toBeGreaterThan(3.0);
    });

    it('calculates trapezoid frame perimeter', () => {
      const p = calcFramePerimeter(1000, 1000, 'trapezoid');
      expect(p).toBeCloseTo(2.8, 1);
    });

    it('returns zero frame mass when material is none', () => {
      const { frameWeightKg } = calcFrameMass(5.0, 'none');
      expect(frameWeightKg).toBe(0);
    });
  });

  describe('calcHandlingMetrics', () => {
    it('requires 1 installer for weight <= 25 kg', () => {
      const { installersRequired } = calcHandlingMetrics(20.0, 15.0);
      expect(installersRequired).toBe(1);
    });

    it('requires 2 installers for weight > 25 kg and <= 50 kg', () => {
      const { installersRequired } = calcHandlingMetrics(45.0, 30.0);
      expect(installersRequired).toBe(2);
    });

    it('requires 3 installers for weight > 50 kg and <= 75 kg', () => {
      const { installersRequired } = calcHandlingMetrics(70.0, 50.0);
      expect(installersRequired).toBe(3);
    });

    it('requires 4+ installers for weight > 75 kg', () => {
      const { installersRequired } = calcHandlingMetrics(90.0, 70.0);
      expect(installersRequired).toBe(4);
    });

    it('recommends 0 vacuum cups for glass < 20 kg', () => {
      const { vacuumCupsRecommended } = calcHandlingMetrics(20.0, 15.0);
      expect(vacuumCupsRecommended).toBe(0);
    });

    it('recommends at least 2 vacuum cups for glass >= 20 kg', () => {
      const { vacuumCupsRecommended } = calcHandlingMetrics(45.0, 30.0);
      expect(vacuumCupsRecommended).toBeGreaterThanOrEqual(2);
    });

    it('snaps transportation category to standard-courier for lightweight windows', () => {
      const { transportationCategory } = calcHandlingMetrics(20.0, 15.0);
      expect(transportationCategory).toBe('standard-courier');
    });

    it('snaps transportation category to freight-skid for medium windows', () => {
      const { transportationCategory } = calcHandlingMetrics(50.0, 40.0);
      expect(transportationCategory).toBe('freight-skid');
    });

    it('snaps transportation category to crated-freight for heavy windows', () => {
      const { transportationCategory } = calcHandlingMetrics(90.0, 70.0);
      expect(transportationCategory).toBe('crated-freight');
    });

    it('snaps transportation category to heavy-crane for extra heavy windows', () => {
      const { transportationCategory } = calcHandlingMetrics(160.0, 120.0);
      expect(transportationCategory).toBe('heavy-crane');
    });

    it('snaps handling difficulty to easy for weight <= 25 kg', () => {
      const { handlingDifficulty } = calcHandlingMetrics(20.0, 15.0);
      expect(handlingDifficulty).toBe('easy');
    });

    it('snaps handling difficulty to moderate for weight <= 50 kg', () => {
      const { handlingDifficulty } = calcHandlingMetrics(40.0, 30.0);
      expect(handlingDifficulty).toBe('moderate');
    });

    it('snaps handling difficulty to heavy for weight <= 100 kg', () => {
      const { handlingDifficulty } = calcHandlingMetrics(80.0, 60.0);
      expect(handlingDifficulty).toBe('heavy');
    });

    it('snaps handling difficulty to extreme for weight > 100 kg', () => {
      const { handlingDifficulty } = calcHandlingMetrics(120.0, 90.0);
      expect(handlingDifficulty).toBe('extreme');
    });
  });

  describe('calcConfidence', () => {
    it('returns excellent for total weight <= 50 kg', () => {
      const conf = calcConfidence({ warnings: [], totalWindowWeightKg: 40.0 }, BASE_INPUT);
      expect(conf).toBe('excellent');
    });

    it('returns good for total weight <= 100 kg', () => {
      const conf = calcConfidence({ warnings: [], totalWindowWeightKg: 80.0 }, BASE_INPUT);
      expect(conf).toBe('good');
    });

    it('returns minor-adjustment for total weight > 100 kg', () => {
      const conf = calcConfidence({ warnings: [], totalWindowWeightKg: 120.0 }, BASE_INPUT);
      expect(conf).toBe('minor-adjustment');
    });

    it('returns custom-required when warnings contain error level', () => {
      const conf = calcConfidence(
        { warnings: [{ level: 'error', code: 'WIDTH_TOO_SMALL', message: 'Error' }], totalWindowWeightKg: 10.0 },
        BASE_INPUT
      );
      expect(conf).toBe('custom-required');
    });
  });

  describe('buildWindowWeightWarnings', () => {
    it('generates error warning for width below minimum', () => {
      const input: WindowWeightInput = { ...BASE_INPUT, windowWidthMm: 100 };
      const warnings = buildWindowWeightWarnings(input, {});
      expect(warnings.some((w) => w.code === 'WIDTH_TOO_SMALL')).toBe(true);
    });

    it('generates error warning for height below minimum', () => {
      const input: WindowWeightInput = { ...BASE_INPUT, windowHeightMm: 100 };
      const warnings = buildWindowWeightWarnings(input, {});
      expect(warnings.some((w) => w.code === 'HEIGHT_TOO_SMALL')).toBe(true);
    });

    it('generates warning for weight > 50 kg requiring 2-person lift', () => {
      const warnings = buildWindowWeightWarnings(BASE_INPUT, { totalWindowWeightKg: 60.0 });
      expect(warnings.some((w) => w.code === 'OSHA_TWO_PERSON_LIFT')).toBe(true);
    });

    it('generates warning for weight > 100 kg requiring mechanical hoist', () => {
      const warnings = buildWindowWeightWarnings(BASE_INPUT, { totalWindowWeightKg: 120.0 });
      expect(warnings.some((w) => w.code === 'MECHANICAL_HOIST_RECOMMENDED')).toBe(true);
    });

    it('generates info for triple-glazed load bearing', () => {
      const input: WindowWeightInput = { ...BASE_INPUT, glassType: 'triple-glazed' };
      const warnings = buildWindowWeightWarnings(input, {});
      expect(warnings.some((w) => w.code === 'TRIPLE_GLAZED_LOAD_BEARING')).toBe(true);
    });
  });

  describe('calculateWindowWeight integration matrix', () => {
    it('calculates complete WindowWeightResult for standard 48x60 in double-pane window', () => {
      const result = calculateWindowWeight(BASE_INPUT);

      expect(result.glassAreaM2).toBeGreaterThan(1.5);
      expect(result.glassAreaSqFt).toBeGreaterThan(15);
      expect(result.glassWeightKg).toBeGreaterThan(0);
      expect(result.frameWeightKg).toBeGreaterThan(0);
      expect(result.totalWindowWeightKg).toBeGreaterThan(result.glassWeightKg);
      expect(result.installersRequired).toBeGreaterThanOrEqual(1);
      expect(result.weightPerM2).toBeGreaterThan(0);
      expect(result.weightPerSqFt).toBeGreaterThan(0);
    });

    const shapes: WindowWeightShape[] = ['rectangle', 'square', 'circle', 'half-circle', 'triangle', 'trapezoid'];
    shapes.forEach((s) => {
      it(`calculates weight correctly for shape: ${s}`, () => {
        const result = calculateWindowWeight({ ...BASE_INPUT, shape: s });
        expect(result.totalWindowWeightKg).toBeGreaterThan(0);
      });
    });

    const thicknesses = [3, 4, 5, 6, 8, 10, 12, 15, 19];
    thicknesses.forEach((t) => {
      it(`calculates weight correctly for thickness: ${t}mm`, () => {
        const result = calculateWindowWeight({ ...BASE_INPUT, thicknessMm: t });
        expect(result.effectiveGlassThicknessMm).toBeGreaterThan(0);
      });
    });

    const glassTypes: WindowWeightGlassType[] = ['annealed', 'tempered', 'laminated', 'double-glazed', 'triple-glazed'];
    glassTypes.forEach((gt) => {
      it(`calculates weight correctly for glass type: ${gt}`, () => {
        const result = calculateWindowWeight({ ...BASE_INPUT, glassType: gt });
        expect(result.glassWeightKg).toBeGreaterThan(0);
      });
    });

    const frameMaterials: WindowWeightFrameMaterial[] = ['none', 'aluminum', 'vinyl', 'wood', 'fiberglass', 'steel'];
    frameMaterials.forEach((fm) => {
      it(`calculates weight correctly for frame material: ${fm}`, () => {
        const result = calculateWindowWeight({ ...BASE_INPUT, frameMaterial: fm });
        expect(result.totalWindowWeightKg).toBeGreaterThan(0);
      });
    });
  });

  describe('Recommendations Module', () => {
    it('builds comprehensive recommendation set', () => {
      const result = calculateWindowWeight(BASE_INPUT);
      const recs = buildWindowWeightRecommendations(BASE_INPUT, result);

      expect(recs.handlingAdvice).toBeDefined();
      expect(recs.transportationAdvice).toBeDefined();
      expect(recs.recommendedInstallers).toBeDefined();
      expect(recs.items.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('UNIT CONVERSION REGRESSION TEST', () => {
    it('produces mathematically identical window weight across input units', () => {
      const inW = 48, inH = 60;
      const mmW = toMm(inW, 'in'); // 1219.2 mm
      const mmH = toMm(inH, 'in'); // 1524 mm
      const cmW = toMm(inW * 2.54, 'cm');
      const cmH = toMm(inH * 2.54, 'cm');
      const mW = toMm(inW * 0.0254, 'm');
      const mH = toMm(inH * 0.0254, 'm');

      const resIn = calculateWindowWeight({ ...BASE_INPUT, windowWidthMm: toMm(inW, 'in'), windowHeightMm: toMm(inH, 'in') });
      const resMm = calculateWindowWeight({ ...BASE_INPUT, windowWidthMm: mmW, windowHeightMm: mmH });
      const resCm = calculateWindowWeight({ ...BASE_INPUT, windowWidthMm: cmW, windowHeightMm: cmH });
      const resM = calculateWindowWeight({ ...BASE_INPUT, windowWidthMm: mW, windowHeightMm: mH });

      expect(resIn.totalWindowWeightKg).toBeCloseTo(resMm.totalWindowWeightKg, 3);
      expect(resCm.totalWindowWeightKg).toBeCloseTo(resMm.totalWindowWeightKg, 3);
      expect(resM.totalWindowWeightKg).toBeCloseTo(resMm.totalWindowWeightKg, 3);
    });
  });
});
