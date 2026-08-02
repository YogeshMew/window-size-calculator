import { describe, it, expect } from 'vitest';
import {
  calculateScreen,
  calcFinishedScreenDimensions,
  calcMeshArea,
  calcSplineLength,
  calcScreenWeight,
  calcScreenMaterialCost,
  calcInstallationDifficulty,
  calcConfidence,
  findClosestStockSizes,
  calcOrderingRecommendation,
  buildScreenWarnings,
  SCREEN_DEFAULTS,
  FRAME_TYPE_DATA,
  MESH_TYPE_DATA,
  SCREEN_STOCK_WIDTHS_MM,
  SCREEN_STOCK_HEIGHTS_MM,
  type ScreenInput,
  type ScreenFrameType,
  type ScreenMeshType,
  type ScreenMountType,
} from '../screen.js';

import {
  suggestMeshType,
  suggestFrameType,
  buildScreenRecommendations,
} from '../screen-recommendations.js';

import { toMm } from '../units.js';

const BASE_INPUT: ScreenInput = {
  windowWidthMm: 1219.2,  // 48 inches
  windowHeightMm: 1524.0,  // 60 inches
  frameType: 'aluminum',
  meshType: 'fiberglass',
  mountType: 'standard',
  frameColor: 'white',
};

describe('Window Screen Engine', () => {
  describe('SCREEN_DEFAULTS & Specs', () => {
    it('defines standard mount deduction as 9.525 mm (3/8 in)', () => {
      expect(SCREEN_DEFAULTS.STANDARD_MOUNT_DEDUCTION_MM).toBeCloseTo(9.525, 3);
    });

    it('defines flush mount deduction as 6.35 mm (1/4 in)', () => {
      expect(SCREEN_DEFAULTS.FLUSH_MOUNT_DEDUCTION_MM).toBeCloseTo(6.35, 3);
    });

    it('defines recessed mount deduction as 12.7 mm (1/2 in)', () => {
      expect(SCREEN_DEFAULTS.RECESSED_MOUNT_DEDUCTION_MM).toBeCloseTo(12.7, 3);
    });

    it('defines 15% mesh area waste factor', () => {
      expect(SCREEN_DEFAULTS.MESH_WASTE_FACTOR).toBe(1.15);
    });

    it('defines 5% spline buffer factor', () => {
      expect(SCREEN_DEFAULTS.SPLINE_BUFFER_FACTOR).toBe(1.05);
    });

    it('has valid frame type spec data for aluminum', () => {
      expect(FRAME_TYPE_DATA.aluminum.thicknessMm).toBeCloseTo(7.9375, 3);
      expect(FRAME_TYPE_DATA.aluminum.costTier).toBe('$');
    });

    it('has valid frame type spec data for vinyl', () => {
      expect(FRAME_TYPE_DATA.vinyl.thicknessMm).toBeCloseTo(11.1125, 3);
      expect(FRAME_TYPE_DATA.vinyl.costTier).toBe('$$');
    });

    it('has valid frame type spec data for fiberglass', () => {
      expect(FRAME_TYPE_DATA.fiberglass.thicknessMm).toBeCloseTo(9.525, 3);
      expect(FRAME_TYPE_DATA.fiberglass.costTier).toBe('$$$');
    });

    it('has valid frame type spec data for wood', () => {
      expect(FRAME_TYPE_DATA.wood.thicknessMm).toBeCloseTo(19.05, 3);
      expect(FRAME_TYPE_DATA.wood.costTier).toBe('$$');
    });

    it('has valid mesh type spec data for fiberglass', () => {
      expect(MESH_TYPE_DATA.fiberglass.costMultiplier).toBe(1.0);
      expect(MESH_TYPE_DATA.fiberglass.petProof).toBe(false);
    });

    it('has valid mesh type spec data for aluminum', () => {
      expect(MESH_TYPE_DATA.aluminum.costMultiplier).toBe(1.3);
    });

    it('has valid mesh type spec data for pet-screen', () => {
      expect(MESH_TYPE_DATA['pet-screen'].petProof).toBe(true);
      expect(MESH_TYPE_DATA['pet-screen'].durability).toBe('extreme');
    });

    it('has valid mesh type spec data for solar-screen', () => {
      expect(MESH_TYPE_DATA['solar-screen'].solarBlockPercent).toBe(80);
    });

    it('has valid mesh type spec data for stainless-steel', () => {
      expect(MESH_TYPE_DATA['stainless-steel'].petProof).toBe(true);
      expect(MESH_TYPE_DATA['stainless-steel'].costMultiplier).toBe(3.0);
    });
  });

  describe('calcFinishedScreenDimensions', () => {
    it('calculates standard mount deduction correctly', () => {
      const { finishedWidthMm, finishedHeightMm, deductionMm } = calcFinishedScreenDimensions(1000, 1500, 'standard');
      expect(deductionMm).toBeCloseTo(9.525, 3);
      expect(finishedWidthMm).toBeCloseTo(1000 - 9.525, 3);
      expect(finishedHeightMm).toBeCloseTo(1500 - 9.525, 3);
    });

    it('calculates flush mount deduction correctly', () => {
      const { finishedWidthMm, finishedHeightMm, deductionMm } = calcFinishedScreenDimensions(1000, 1500, 'flush');
      expect(deductionMm).toBeCloseTo(6.35, 3);
      expect(finishedWidthMm).toBeCloseTo(1000 - 6.35, 3);
      expect(finishedHeightMm).toBeCloseTo(1500 - 6.35, 3);
    });

    it('calculates recessed mount deduction correctly', () => {
      const { finishedWidthMm, finishedHeightMm, deductionMm } = calcFinishedScreenDimensions(1000, 1500, 'recessed');
      expect(deductionMm).toBeCloseTo(12.7, 3);
      expect(finishedWidthMm).toBeCloseTo(1000 - 12.7, 3);
      expect(finishedHeightMm).toBeCloseTo(1500 - 12.7, 3);
    });

    it('prevents negative finished dimensions for very small inputs', () => {
      const { finishedWidthMm, finishedHeightMm } = calcFinishedScreenDimensions(5, 5, 'standard');
      expect(finishedWidthMm).toBe(0);
      expect(finishedHeightMm).toBe(0);
    });

    it('handles zero width input gracefully', () => {
      const { finishedWidthMm } = calcFinishedScreenDimensions(0, 1000, 'standard');
      expect(finishedWidthMm).toBe(0);
    });

    it('handles zero height input gracefully', () => {
      const { finishedHeightMm } = calcFinishedScreenDimensions(1000, 0, 'standard');
      expect(finishedHeightMm).toBe(0);
    });
  });

  describe('calcMeshArea', () => {
    it('calculates mesh area in m² and sq ft including 15% waste', () => {
      const { meshAreaM2, meshAreaSqFt } = calcMeshArea(1000, 1000);
      expect(meshAreaM2).toBeCloseTo(1.15, 2);
      expect(meshAreaSqFt).toBeCloseTo(1.15 * 10.7639, 2);
    });

    it('scales linearly with screen size', () => {
      const small = calcMeshArea(500, 500);
      const large = calcMeshArea(1000, 1000);
      expect(large.meshAreaM2).toBeCloseTo(small.meshAreaM2 * 4, 2);
    });

    it('handles 0x0 dimensions', () => {
      const { meshAreaM2, meshAreaSqFt } = calcMeshArea(0, 0);
      expect(meshAreaM2).toBe(0);
      expect(meshAreaSqFt).toBe(0);
    });
  });

  describe('calcSplineLength', () => {
    it('calculates spline length with 5% buffer from perimeter', () => {
      const splineLen = calcSplineLength(4000);
      expect(splineLen).toBeCloseTo(4200, 2);
    });

    it('handles 0 perimeter', () => {
      expect(calcSplineLength(0)).toBe(0);
    });
  });

  describe('calcScreenWeight', () => {
    it('calculates screen weight combining frame perimeter and mesh area', () => {
      const weight = calcScreenWeight(4000, 1.15, 'aluminum');
      expect(weight).toBeGreaterThan(0);
    });

    it('reflects heavier wood frame compared to aluminum', () => {
      const alumWeight = calcScreenWeight(4000, 1.15, 'aluminum');
      const woodWeight = calcScreenWeight(4000, 1.15, 'wood');
      expect(woodWeight).toBeGreaterThan(alumWeight);
    });

    it('reflects vinyl frame weight', () => {
      const vinylWeight = calcScreenWeight(4000, 1.15, 'vinyl');
      expect(vinylWeight).toBeGreaterThan(calcScreenWeight(4000, 1.15, 'aluminum'));
    });

    it('reflects fiberglass frame weight', () => {
      const fgWeight = calcScreenWeight(4000, 1.15, 'fiberglass');
      expect(fgWeight).toBeGreaterThan(calcScreenWeight(4000, 1.15, 'aluminum'));
    });
  });

  describe('calcScreenMaterialCost', () => {
    it('returns material cost and cost tier for standard aluminum fiberglass screen', () => {
      const { estimatedMaterialCost, costTier } = calcScreenMaterialCost(4000, 1.15, 'aluminum', 'fiberglass');
      expect(estimatedMaterialCost).toBeGreaterThan(0);
      expect(['$', '$$', '$$$', '$$$$']).toContain(costTier);
    });

    it('assigns higher cost tier to stainless steel security mesh', () => {
      const standard = calcScreenMaterialCost(4000, 1.15, 'aluminum', 'fiberglass');
      const security = calcScreenMaterialCost(4000, 1.15, 'aluminum', 'stainless-steel');
      expect(security.estimatedMaterialCost).toBeGreaterThan(standard.estimatedMaterialCost);
    });

    it('assigns higher cost to pet screen than fiberglass', () => {
      const fg = calcScreenMaterialCost(4000, 1.15, 'aluminum', 'fiberglass');
      const pet = calcScreenMaterialCost(4000, 1.15, 'aluminum', 'pet-screen');
      expect(pet.estimatedMaterialCost).toBeGreaterThan(fg.estimatedMaterialCost);
    });

    it('assigns higher cost to solar screen than fiberglass', () => {
      const fg = calcScreenMaterialCost(4000, 1.15, 'aluminum', 'fiberglass');
      const solar = calcScreenMaterialCost(4000, 1.15, 'aluminum', 'solar-screen');
      expect(solar.estimatedMaterialCost).toBeGreaterThan(fg.estimatedMaterialCost);
    });

    it('assigns higher cost to aluminum wire than fiberglass', () => {
      const fg = calcScreenMaterialCost(4000, 1.15, 'aluminum', 'fiberglass');
      const alumWire = calcScreenMaterialCost(4000, 1.15, 'aluminum', 'aluminum');
      expect(alumWire.estimatedMaterialCost).toBeGreaterThan(fg.estimatedMaterialCost);
    });
  });

  describe('calcInstallationDifficulty', () => {
    it('rates standard aluminum fiberglass screen as easy', () => {
      expect(calcInstallationDifficulty('aluminum', 'fiberglass', false)).toBe('easy');
    });

    it('rates vinyl fiberglass screen as easy', () => {
      expect(calcInstallationDifficulty('vinyl', 'fiberglass', false)).toBe('easy');
    });

    it('rates pet screen as moderate', () => {
      expect(calcInstallationDifficulty('aluminum', 'pet-screen', false)).toBe('moderate');
    });

    it('rates solar screen as moderate', () => {
      expect(calcInstallationDifficulty('aluminum', 'solar-screen', false)).toBe('moderate');
    });

    it('rates crossbar requirement as moderate', () => {
      expect(calcInstallationDifficulty('aluminum', 'fiberglass', true)).toBe('moderate');
    });

    it('rates stainless steel mesh as professional', () => {
      expect(calcInstallationDifficulty('aluminum', 'stainless-steel', false)).toBe('professional');
    });

    it('rates wood frame as professional', () => {
      expect(calcInstallationDifficulty('wood', 'fiberglass', false)).toBe('professional');
    });
  });

  describe('calcConfidence', () => {
    it('returns excellent for exact ordering recommendation', () => {
      const conf = calcConfidence({ orderingRecommendation: 'exact', finishedWidthMm: 914.4, warnings: [] }, BASE_INPUT);
      expect(conf).toBe('excellent');
    });

    it('returns good for next-stock ordering recommendation', () => {
      const conf = calcConfidence({ orderingRecommendation: 'next-stock', finishedWidthMm: 900, warnings: [] }, BASE_INPUT);
      expect(conf).toBe('good');
    });

    it('returns minor-adjustment for trim ordering recommendation', () => {
      const conf = calcConfidence({ orderingRecommendation: 'trim', finishedWidthMm: 850, warnings: [] }, BASE_INPUT);
      expect(conf).toBe('minor-adjustment');
    });

    it('returns custom-required when warnings contain error level', () => {
      const conf = calcConfidence({
        orderingRecommendation: 'exact',
        finishedWidthMm: 100,
        warnings: [{ level: 'error', code: 'WIDTH_TOO_SMALL', message: 'Too small' }],
      }, BASE_INPUT);
      expect(conf).toBe('custom-required');
    });
  });

  describe('findClosestStockSizes', () => {
    it('returns requested count of closest stock sizes sorted ascending', () => {
      const stock = [100, 200, 300, 400, 500];
      const closest = findClosestStockSizes(280, stock, 3);
      expect(closest).toHaveLength(3);
      expect(closest).toEqual([200, 300, 400]);
    });

    it('returns 1 closest size when count=1', () => {
      const stock = [100, 200, 300, 400, 500];
      const closest = findClosestStockSizes(280, stock, 1);
      expect(closest).toEqual([300]);
    });
  });

  describe('calcOrderingRecommendation', () => {
    it('returns exact when finished width is within tolerance', () => {
      expect(calcOrderingRecommendation(914.4, SCREEN_STOCK_WIDTHS_MM, 2.0)).toBe('exact');
    });

    it('returns next-stock when next larger size is within 25.4mm', () => {
      expect(calcOrderingRecommendation(900, SCREEN_STOCK_WIDTHS_MM, 2.0)).toBe('next-stock');
    });

    it('returns trim when stock size is within 76.2mm', () => {
      expect(calcOrderingRecommendation(850, SCREEN_STOCK_WIDTHS_MM, 2.0)).toBe('trim');
    });

    it('returns custom when no close stock match exists', () => {
      expect(calcOrderingRecommendation(2000, SCREEN_STOCK_WIDTHS_MM, 2.0)).toBe('custom');
    });
  });

  describe('buildScreenWarnings', () => {
    it('generates error warning for width below minimum', () => {
      const input: ScreenInput = { ...BASE_INPUT, windowWidthMm: 100 };
      const warnings = buildScreenWarnings(input, {});
      expect(warnings.some(w => w.code === 'WIDTH_TOO_SMALL')).toBe(true);
    });

    it('generates error warning for height below minimum', () => {
      const input: ScreenInput = { ...BASE_INPUT, windowHeightMm: 100 };
      const warnings = buildScreenWarnings(input, {});
      expect(warnings.some(w => w.code === 'HEIGHT_TOO_SMALL')).toBe(true);
    });

    it('generates warning for very wide window', () => {
      const input: ScreenInput = { ...BASE_INPUT, windowWidthMm: 2500 };
      const warnings = buildScreenWarnings(input, {});
      expect(warnings.some(w => w.code === 'VERY_WIDE_WINDOW')).toBe(true);
    });

    it('generates info warning for height > 48 in requiring crossbar', () => {
      const input: ScreenInput = { ...BASE_INPUT, windowHeightMm: 1524 }; // 60"
      const warnings = buildScreenWarnings(input, {});
      expect(warnings.some(w => w.code === 'CROSSBAR_RECOMMENDED')).toBe(true);
    });

    it('generates info warning for pet screen spline diameter', () => {
      const input: ScreenInput = { ...BASE_INPUT, meshType: 'pet-screen', frameType: 'aluminum' };
      const warnings = buildScreenWarnings(input, {});
      expect(warnings.some(w => w.code === 'PET_SCREEN_SPLINE_NOTE')).toBe(true);
    });

    it('returns no warnings for standard valid window', () => {
      const input: ScreenInput = { ...BASE_INPUT, windowWidthMm: 914.4, windowHeightMm: 914.4 };
      const warnings = buildScreenWarnings(input, {});
      expect(warnings.filter(w => w.level === 'error' || w.level === 'warning')).toHaveLength(0);
    });
  });

  describe('calculateScreen integration', () => {
    it('calculates complete ScreenResult for standard 48x60 in screen', () => {
      const result = calculateScreen(BASE_INPUT);

      expect(result.finishedWidthMm).toBeCloseTo(1219.2 - 9.525, 2);
      expect(result.finishedHeightMm).toBeCloseTo(1524.0 - 9.525, 2);
      expect(result.framePerimeterMm).toBeGreaterThan(0);
      expect(result.meshAreaM2).toBeGreaterThan(0);
      expect(result.splineLengthMm).toBeGreaterThan(0);
      expect(result.crossbarRequired).toBe(true);
      expect(result.framePiecesRequired).toBe(5);
      expect(result.cornerConnectors).toBe(4);
      expect(result.estimatedWeightKg).toBeGreaterThan(0);
      expect(result.estimatedMaterialCost).toBeGreaterThan(0);
      expect(result.stockWidthSuggestions).toHaveLength(3);
      expect(result.stockHeightSuggestions).toHaveLength(3);
    });

    it('triggers 4 frame pieces when height is below crossbar threshold', () => {
      const smallInput: ScreenInput = { ...BASE_INPUT, windowHeightMm: 914.4 }; // 36"
      const result = calculateScreen(smallInput);
      expect(result.crossbarRequired).toBe(false);
      expect(result.framePiecesRequired).toBe(4);
    });

    it('calculates flush mount integration correctly', () => {
      const flushInput: ScreenInput = { ...BASE_INPUT, mountType: 'flush' };
      const result = calculateScreen(flushInput);
      expect(result.deductionMm).toBeCloseTo(6.35, 3);
    });

    it('calculates recessed mount integration correctly', () => {
      const recessedInput: ScreenInput = { ...BASE_INPUT, mountType: 'recessed' };
      const result = calculateScreen(recessedInput);
      expect(result.deductionMm).toBeCloseTo(12.7, 3);
    });

    it('runs across all 4 frame types without error', () => {
      const frameTypes: ScreenFrameType[] = ['aluminum', 'vinyl', 'fiberglass', 'wood'];
      frameTypes.forEach((f) => {
        const result = calculateScreen({ ...BASE_INPUT, frameType: f });
        expect(result.finishedWidthMm).toBeGreaterThan(0);
      });
    });

    it('runs across all 5 mesh types without error', () => {
      const meshTypes: ScreenMeshType[] = ['fiberglass', 'aluminum', 'pet-screen', 'solar-screen', 'stainless-steel'];
      meshTypes.forEach((m) => {
        const result = calculateScreen({ ...BASE_INPUT, meshType: m });
        expect(result.finishedWidthMm).toBeGreaterThan(0);
      });
    });
  });

  describe('Recommendations Module', () => {
    it('suggests pet screen mesh for large windows', () => {
      expect(suggestMeshType(1600, 2000)).toBe('pet-screen');
    });

    it('suggests fiberglass mesh for standard windows', () => {
      expect(suggestMeshType(800, 1000)).toBe('fiberglass');
    });

    it('suggests fiberglass frame for extra wide spans', () => {
      expect(suggestFrameType(2000, 1000)).toBe('fiberglass');
    });

    it('suggests aluminum frame for standard spans', () => {
      expect(suggestFrameType(1000, 1000)).toBe('aluminum');
    });

    it('builds comprehensive recommendation set with required fields', () => {
      const result = calculateScreen(BASE_INPUT);
      const recs = buildScreenRecommendations(BASE_INPUT, result);

      expect(recs.recommendedMesh).toBeDefined();
      expect(recs.recommendedFrame).toBeDefined();
      expect(recs.petFriendly).toBe(false);
      expect(recs.items).toBeDefined();
      expect(recs.items.length).toBeGreaterThanOrEqual(4);
    });

    it('sets petFriendly to true for pet-screen mesh', () => {
      const petInput: ScreenInput = { ...BASE_INPUT, meshType: 'pet-screen' };
      const result = calculateScreen(petInput);
      const recs = buildScreenRecommendations(petInput, result);
      expect(recs.petFriendly).toBe(true);
      expect(recs.items.some(i => i.title === 'SAFETY')).toBe(true);
    });

    it('sets petFriendly to true for stainless-steel mesh', () => {
      const steelInput: ScreenInput = { ...BASE_INPUT, meshType: 'stainless-steel' };
      const result = calculateScreen(steelInput);
      const recs = buildScreenRecommendations(steelInput, result);
      expect(recs.petFriendly).toBe(true);
    });
  });

  describe('UNIT CONVERSION REGRESSION TEST', () => {
    it('produces mathematically identical finished dimensions across input units', () => {
      const inW = 48, inH = 60;
      const mmW = toMm(inW, 'in'); // 1219.2 mm
      const mmH = toMm(inH, 'in'); // 1524 mm
      const cmW = toMm(inW * 2.54, 'cm');
      const cmH = toMm(inH * 2.54, 'cm');
      const mW = toMm(inW * 0.0254, 'm');
      const mH = toMm(inH * 0.0254, 'm');

      const resIn = calculateScreen({ ...BASE_INPUT, windowWidthMm: toMm(inW, 'in'), windowHeightMm: toMm(inH, 'in') });
      const resMm = calculateScreen({ ...BASE_INPUT, windowWidthMm: mmW, windowHeightMm: mmH });
      const resCm = calculateScreen({ ...BASE_INPUT, windowWidthMm: cmW, windowHeightMm: cmH });
      const resM = calculateScreen({ ...BASE_INPUT, windowWidthMm: mW, windowHeightMm: mH });

      expect(resIn.finishedWidthMm).toBeCloseTo(resMm.finishedWidthMm, 3);
      expect(resIn.finishedHeightMm).toBeCloseTo(resMm.finishedHeightMm, 3);
      expect(resCm.finishedWidthMm).toBeCloseTo(resMm.finishedWidthMm, 3);
      expect(resCm.finishedHeightMm).toBeCloseTo(resMm.finishedHeightMm, 3);
      expect(resM.finishedWidthMm).toBeCloseTo(resMm.finishedWidthMm, 3);
      expect(resM.finishedHeightMm).toBeCloseTo(resMm.finishedHeightMm, 3);
    });
  });
});
