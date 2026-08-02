import { describe, it, expect } from 'vitest';
import {
  calculateFilm,
  calcFilmDimensions,
  selectOptimalRollWidth,
  calcWastePercent,
  calcFilmCost,
  calcAdjustedHeatReduction,
  calcInstallationDifficulty,
  calcConfidence,
  findClosestStockRollWidths,
  calcOrderingRecommendation,
  buildFilmWarnings,
  FILM_DEFAULTS,
  FILM_TYPE_DATA,
  type FilmInput,
  type FilmType,
  type FilmGlassType,
  type FilmInstallation,
  type FilmOrientation,
  type FilmClimate,
} from '../film.js';

import {
  suggestFilmType,
  buildFilmRecommendations,
} from '../film-recommendations.js';

import { toMm } from '../units.js';

const BASE_INPUT: FilmInput = {
  windowWidthMm: 1219.2, // 48 inches
  windowHeightMm: 1524.0, // 60 inches
  filmType: 'privacy',
  glassType: 'single-pane',
  installation: 'interior',
  orientation: 'south',
  climate: 'moderate',
};

describe('Window Film Engine', () => {
  describe('FILM_DEFAULTS & Specs', () => {
    it('defines 1 inch (25.4mm) installation margin', () => {
      expect(FILM_DEFAULTS.INSTALL_MARGIN_MM).toBe(25.4);
    });

    it('contains 6 standard roll widths from 18 to 60 inches', () => {
      expect(FILM_DEFAULTS.STANDARD_ROLL_WIDTHS_MM).toHaveLength(6);
      expect(FILM_DEFAULTS.STANDARD_ROLL_WIDTHS_MM[0]).toBeCloseTo(457.2, 1); // 18"
      expect(FILM_DEFAULTS.STANDARD_ROLL_WIDTHS_MM[5]).toBeCloseTo(1524.0, 1); // 60"
    });

    it('has valid spec data for privacy film', () => {
      expect(FILM_TYPE_DATA.privacy.vltPercent).toBe(15);
      expect(FILM_TYPE_DATA.privacy.uvBlockPercent).toBe(99);
      expect(FILM_TYPE_DATA.privacy.privacyRating).toBe(9.0);
    });

    it('has valid spec data for frosted film', () => {
      expect(FILM_TYPE_DATA.frosted.privacyRating).toBe(10.0);
      expect(FILM_TYPE_DATA.frosted.vltPercent).toBe(60);
    });

    it('has valid spec data for decorative film', () => {
      expect(FILM_TYPE_DATA.decorative.costPerM2).toBe(22.0);
    });

    it('has valid spec data for reflective film', () => {
      expect(FILM_TYPE_DATA.reflective.heatReductionPercent).toBe(75);
    });

    it('has valid spec data for security film', () => {
      expect(FILM_TYPE_DATA.security.vltPercent).toBe(85);
      expect(FILM_TYPE_DATA.security.costPerM2).toBe(30.0);
    });

    it('has valid spec data for uv-protection film', () => {
      expect(FILM_TYPE_DATA['uv-protection'].uvBlockPercent).toBe(99.9);
    });

    it('has valid spec data for heat-control film', () => {
      expect(FILM_TYPE_DATA['heat-control'].heatReductionPercent).toBe(70);
    });

    it('has valid spec data for one-way-mirror film', () => {
      expect(FILM_TYPE_DATA['one-way-mirror'].vltPercent).toBe(10);
      expect(FILM_TYPE_DATA['one-way-mirror'].privacyRating).toBe(9.5);
    });
  });

  describe('calcFilmDimensions', () => {
    it('adds 1 inch margin to all 4 edges (+2 inches / 50.8mm total per dimension)', () => {
      const { filmWidthMm, filmHeightMm, filmAreaM2 } = calcFilmDimensions(1000, 1500);
      expect(filmWidthMm).toBeCloseTo(1000 + 50.8, 1);
      expect(filmHeightMm).toBeCloseTo(1500 + 50.8, 1);
      expect(filmAreaM2).toBeGreaterThan(1.5);
    });

    it('calculates film area in sq ft', () => {
      const { filmAreaM2, filmAreaSqFt } = calcFilmDimensions(1000, 1000);
      expect(filmAreaSqFt).toBeCloseTo(filmAreaM2 * 10.7639, 2);
    });

    it('handles 0x0 input gracefully', () => {
      const { filmWidthMm, filmHeightMm } = calcFilmDimensions(0, 0);
      expect(filmWidthMm).toBe(50.8);
      expect(filmHeightMm).toBe(50.8);
    });
  });

  describe('selectOptimalRollWidth', () => {
    it('selects smallest roll width that covers film min dimension', () => {
      // Film width = 1000 + 50.8 = 1050.8 mm, Film height = 1500 + 50.8 = 1550.8 mm
      const { requiredRollWidthMm, requiredRollLengthMm } = selectOptimalRollWidth(1050.8, 1550.8);
      expect(requiredRollWidthMm).toBe(1219.2); // 48" roll covers 1050.8mm min dimension
      expect(requiredRollLengthMm).toBe(1550.8);
    });

    it('respects custom user roll width override', () => {
      const { requiredRollWidthMm } = selectOptimalRollWidth(1000, 1500, 1524.0); // 60" roll
      expect(requiredRollWidthMm).toBe(1524.0);
    });

    it('defaults to 60 inch roll for extra wide window film', () => {
      const { requiredRollWidthMm } = selectOptimalRollWidth(2000, 2500);
      expect(requiredRollWidthMm).toBe(1524.0);
    });
  });

  describe('calcWastePercent', () => {
    it('calculates waste percentage comparing roll area to window area', () => {
      const waste = calcWastePercent(1000, 1000, 1.5);
      expect(waste).toBeGreaterThan(0);
    });

    it('returns 0 when total roll area is zero', () => {
      expect(calcWastePercent(1000, 1000, 0)).toBe(0);
    });
  });

  describe('calcFilmCost', () => {
    it('returns material cost estimate and cost tier for privacy film', () => {
      const { materialCostEstimate, costTier } = calcFilmCost(2.0, 'privacy');
      expect(materialCostEstimate).toBeGreaterThan(0);
      expect(['$', '$$', '$$$', '$$$$']).toContain(costTier);
    });

    it('returns higher cost for security film than frosted film', () => {
      const frosted = calcFilmCost(2.0, 'frosted');
      const security = calcFilmCost(2.0, 'security');
      expect(security.materialCostEstimate).toBeGreaterThan(frosted.materialCostEstimate);
    });
  });

  describe('calcAdjustedHeatReduction', () => {
    it('adds 5% bonus for south or west orientation', () => {
      const south = calcAdjustedHeatReduction(50, 'south', 'moderate');
      const north = calcAdjustedHeatReduction(50, 'north', 'moderate');
      expect(south).toBe(north + 5);
    });

    it('adds 5% bonus for hot climate', () => {
      const hot = calcAdjustedHeatReduction(50, 'north', 'hot');
      const mod = calcAdjustedHeatReduction(50, 'north', 'moderate');
      expect(hot).toBe(mod + 5);
    });

    it('caps heat reduction at 95%', () => {
      const capped = calcAdjustedHeatReduction(92, 'south', 'hot');
      expect(capped).toBe(95);
    });
  });

  describe('calcInstallationDifficulty', () => {
    it('rates standard interior privacy film as easy', () => {
      expect(calcInstallationDifficulty('privacy', 'interior', 1000, 1200)).toBe('easy');
    });

    it('rates reflective film as moderate', () => {
      expect(calcInstallationDifficulty('reflective', 'interior', 1000, 1200)).toBe('moderate');
    });

    it('rates security film or exterior install as professional', () => {
      expect(calcInstallationDifficulty('security', 'interior', 1000, 1200)).toBe('professional');
      expect(calcInstallationDifficulty('privacy', 'exterior', 1000, 1200)).toBe('professional');
    });

    it('rates extra large window (>72 in) as professional', () => {
      expect(calcInstallationDifficulty('privacy', 'interior', 2000, 2000)).toBe('professional');
    });
  });

  describe('calcConfidence', () => {
    it('returns excellent for exact ordering recommendation', () => {
      const conf = calcConfidence({ orderingRecommendation: 'exact', warnings: [] }, BASE_INPUT);
      expect(conf).toBe('excellent');
    });

    it('returns good for next-stock ordering recommendation', () => {
      const conf = calcConfidence({ orderingRecommendation: 'next-stock', warnings: [] }, BASE_INPUT);
      expect(conf).toBe('good');
    });

    it('returns minor-adjustment for trim ordering recommendation', () => {
      const conf = calcConfidence({ orderingRecommendation: 'trim', warnings: [] }, BASE_INPUT);
      expect(conf).toBe('minor-adjustment');
    });

    it('returns custom-required when warnings contain error level', () => {
      const conf = calcConfidence({
        orderingRecommendation: 'exact',
        warnings: [{ level: 'error', code: 'WIDTH_TOO_SMALL', message: 'Error' }],
      }, BASE_INPUT);
      expect(conf).toBe('custom-required');
    });
  });

  describe('findClosestStockRollWidths', () => {
    it('returns closest 3 stock roll widths sorted ascending', () => {
      const closest = findClosestStockRollWidths(700, 3);
      expect(closest).toHaveLength(3);
      expect(closest).toEqual([609.6, 762.0, 914.4]);
    });
  });

  describe('calcOrderingRecommendation', () => {
    it('returns exact when film width matches stock roll width', () => {
      expect(calcOrderingRecommendation(914.4)).toBe('exact');
    });

    it('returns next-stock when roll width is within 2 inches (50.8mm)', () => {
      expect(calcOrderingRecommendation(900)).toBe('next-stock');
    });

    it('returns trim when roll width is within 6 inches (152.4mm)', () => {
      expect(calcOrderingRecommendation(800)).toBe('trim');
    });

    it('returns custom when no close stock roll width exists', () => {
      expect(calcOrderingRecommendation(2500)).toBe('custom');
    });
  });

  describe('buildFilmWarnings', () => {
    it('generates error warning for width below minimum', () => {
      const input: FilmInput = { ...BASE_INPUT, windowWidthMm: 100 };
      const warnings = buildFilmWarnings(input, {});
      expect(warnings.some((w) => w.code === 'WIDTH_TOO_SMALL')).toBe(true);
    });

    it('generates error warning for height below minimum', () => {
      const input: FilmInput = { ...BASE_INPUT, windowHeightMm: 100 };
      const warnings = buildFilmWarnings(input, {});
      expect(warnings.some((w) => w.code === 'HEIGHT_TOO_SMALL')).toBe(true);
    });

    it('generates thermal stress warning for double-pane glass with reflective film', () => {
      const input: FilmInput = { ...BASE_INPUT, glassType: 'double-pane', filmType: 'reflective' };
      const warnings = buildFilmWarnings(input, {});
      expect(warnings.some((w) => w.code === 'DOUBLE_PANE_THERMAL_STRESS')).toBe(true);
    });

    it('generates weathering warning for exterior installation', () => {
      const input: FilmInput = { ...BASE_INPUT, installation: 'exterior' };
      const warnings = buildFilmWarnings(input, {});
      expect(warnings.some((w) => w.code === 'EXTERIOR_INSTALL_WEATHER')).toBe(true);
    });

    it('generates seam warning for window > 60 inches', () => {
      const input: FilmInput = { ...BASE_INPUT, windowWidthMm: 1800 };
      const warnings = buildFilmWarnings(input, {});
      expect(warnings.some((w) => w.code === 'LARGE_WINDOW_SEAM')).toBe(true);
    });
  });

  describe('calculateFilm integration', () => {
    it('calculates complete FilmResult for standard 48x60 in window', () => {
      const result = calculateFilm(BASE_INPUT);

      expect(result.filmWidthMm).toBeCloseTo(1219.2 + 50.8, 1);
      expect(result.filmHeightMm).toBeCloseTo(1524.0 + 50.8, 1);
      expect(result.requiredRollWidthMm).toBeGreaterThan(0);
      expect(result.requiredRollLengthMm).toBeGreaterThan(0);
      expect(result.totalFilmRequiredM2).toBeGreaterThan(0);
      expect(result.totalFilmRequiredSqFt).toBeGreaterThan(0);
      expect(result.wastePercent).toBeGreaterThan(0);
      expect(result.materialCostEstimate).toBeGreaterThan(0);
      expect(result.coveragePercent).toBe(100);
      expect(result.stockRollSuggestions).toHaveLength(3);
    });

    it('runs across all 8 film types without error', () => {
      const types: FilmType[] = [
        'privacy',
        'frosted',
        'decorative',
        'reflective',
        'security',
        'uv-protection',
        'heat-control',
        'one-way-mirror',
      ];
      types.forEach((ft) => {
        const result = calculateFilm({ ...BASE_INPUT, filmType: ft });
        expect(result.materialCostEstimate).toBeGreaterThan(0);
      });
    });

    it('runs across all 5 glass types without error', () => {
      const glassTypes: FilmGlassType[] = ['single-pane', 'double-pane', 'triple-pane', 'tempered', 'laminated'];
      glassTypes.forEach((gt) => {
        const result = calculateFilm({ ...BASE_INPUT, glassType: gt });
        expect(result.filmWidthMm).toBeGreaterThan(0);
      });
    });

    it('runs across all 4 orientations without error', () => {
      const orientations: FilmOrientation[] = ['north', 'south', 'east', 'west'];
      orientations.forEach((o) => {
        const result = calculateFilm({ ...BASE_INPUT, orientation: o });
        expect(result.heatReductionPercent).toBeGreaterThan(0);
      });
    });

    it('runs across all 3 climates without error', () => {
      const climates: FilmClimate[] = ['cold', 'moderate', 'hot'];
      climates.forEach((c) => {
        const result = calculateFilm({ ...BASE_INPUT, climate: c });
        expect(result.heatReductionPercent).toBeGreaterThan(0);
      });
    });
  });

  describe('Recommendations Module', () => {
    it('suggests heat-control film for south-facing hot climate double-pane window', () => {
      const rec = suggestFilmType('south', 'hot', 'double-pane');
      expect(rec).toBe('heat-control');
    });

    it('suggests reflective film for south-facing hot climate single-pane window', () => {
      const rec = suggestFilmType('south', 'hot', 'single-pane');
      expect(rec).toBe('reflective');
    });

    it('suggests uv-protection film for north-facing window in moderate climate', () => {
      const rec = suggestFilmType('north', 'moderate', 'single-pane');
      expect(rec).toBe('uv-protection');
    });

    it('builds comprehensive recommendation set', () => {
      const result = calculateFilm(BASE_INPUT);
      const recs = buildFilmRecommendations(BASE_INPUT, result);

      expect(recs.recommendedFilmType).toBeDefined();
      expect(recs.recommendedRollWidth).toBeDefined();
      expect(recs.installationAdvice).toBeDefined();
      expect(recs.items).toBeDefined();
      expect(recs.items.length).toBeGreaterThanOrEqual(5);
    });
  });

  describe('UNIT CONVERSION REGRESSION TEST', () => {
    it('produces mathematically identical film dimensions across input units', () => {
      const inW = 48, inH = 60;
      const mmW = toMm(inW, 'in'); // 1219.2 mm
      const mmH = toMm(inH, 'in'); // 1524 mm
      const cmW = toMm(inW * 2.54, 'cm');
      const cmH = toMm(inH * 2.54, 'cm');
      const mW = toMm(inW * 0.0254, 'm');
      const mH = toMm(inH * 0.0254, 'm');

      const resIn = calculateFilm({ ...BASE_INPUT, windowWidthMm: toMm(inW, 'in'), windowHeightMm: toMm(inH, 'in') });
      const resMm = calculateFilm({ ...BASE_INPUT, windowWidthMm: mmW, windowHeightMm: mmH });
      const resCm = calculateFilm({ ...BASE_INPUT, windowWidthMm: cmW, windowHeightMm: cmH });
      const resM = calculateFilm({ ...BASE_INPUT, windowWidthMm: mW, windowHeightMm: mH });

      expect(resIn.filmWidthMm).toBeCloseTo(resMm.filmWidthMm, 3);
      expect(resIn.filmHeightMm).toBeCloseTo(resMm.filmHeightMm, 3);
      expect(resCm.filmWidthMm).toBeCloseTo(resMm.filmWidthMm, 3);
      expect(resCm.filmHeightMm).toBeCloseTo(resMm.filmHeightMm, 3);
      expect(resM.filmWidthMm).toBeCloseTo(resMm.filmWidthMm, 3);
      expect(resM.filmHeightMm).toBeCloseTo(resMm.filmHeightMm, 3);
    });
  });
});
