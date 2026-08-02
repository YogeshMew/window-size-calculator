/**
 * WindowMetrics — Window Blinds Calculator Engine Tests
 */

import { describe, it, expect } from 'vitest';
import {
  calculateBlinds,
  calcInsideMount,
  calcOutsideMount,
  calcDepthCompatibility,
  calcInstallationDifficulty,
  calcConfidence,
  findClosestStockSizes,
  calcOrderingRecommendation,
  buildBlindsWarnings,
  validateBlindDimension,
  BLIND_DEFAULTS,
  BLIND_TYPE_DATA,
  BLIND_STOCK_WIDTHS_MM,
  BLIND_STOCK_HEIGHTS_MM,
  type BlindsInput,
} from '../blinds.js';
import {
  suggestBlindType,
  buildBlindsRecommendations,
} from '../blinds-recommendations.js';
import { toMm } from '../units.js';

const BASE_INPUT: BlindsInput = {
  windowWidthMm: 1219.2,
  windowHeightMm: 1524,
  mountType: 'inside',
  blindType: 'roller',
  windowDepthMm: 76.2,
  controlSide: 'left',
};

describe('BLIND_DEFAULTS constants', () => {
  it('standard inside deduction = 12.7 mm', () => {
    expect(BLIND_DEFAULTS.INSIDE_DEDUCTION_STANDARD_MM).toBeCloseTo(12.7, 2);
  });
  it('cellular inside deduction = 9.525 mm', () => {
    expect(BLIND_DEFAULTS.INSIDE_DEDUCTION_CELLULAR_MM).toBeCloseTo(9.525, 2);
  });
  it('mini blind deduction = 6.35 mm', () => {
    expect(BLIND_DEFAULTS.INSIDE_DEDUCTION_MINI_MM).toBeCloseTo(6.35, 2);
  });
  it('outside overlap = 76.2 mm', () => {
    expect(BLIND_DEFAULTS.OUTSIDE_OVERLAP_MM).toBeCloseTo(76.2, 2);
  });
  it('top overlap = 50.8 mm', () => {
    expect(BLIND_DEFAULTS.TOP_OVERLAP_MM).toBeCloseTo(50.8, 2);
  });
  it('bottom overlap = 25.4 mm', () => {
    expect(BLIND_DEFAULTS.BOTTOM_OVERLAP_MM).toBeCloseTo(25.4, 2);
  });
  it('depth buffer = 12.7 mm', () => {
    expect(BLIND_DEFAULTS.DEPTH_BUFFER_MM).toBeCloseTo(12.7, 2);
  });
  it('min window width = 152.4 mm', () => {
    expect(BLIND_DEFAULTS.MIN_WINDOW_WIDTH_MM).toBeCloseTo(152.4, 2);
  });
});

describe('BLIND_TYPE_DATA table', () => {
  it('roller: costTier=$$, minDepth=38.1mm', () => {
    expect(BLIND_TYPE_DATA['roller'].costTier).toBe('$$');
    expect(BLIND_TYPE_DATA['roller'].minDepthMm).toBeCloseTo(38.1, 2);
  });
  it('vertical: deductionPerSide=0', () => {
    expect(BLIND_TYPE_DATA['vertical'].deductionPerSideMm).toBe(0);
  });
  it('cellular: uses INSIDE_DEDUCTION_CELLULAR_MM', () => {
    expect(BLIND_TYPE_DATA['cellular'].deductionPerSideMm).toBeCloseTo(BLIND_DEFAULTS.INSIDE_DEDUCTION_CELLULAR_MM, 2);
  });
  it('mini-blind: costTier=$, minDepth=25.4mm', () => {
    expect(BLIND_TYPE_DATA['mini-blind'].costTier).toBe('$');
    expect(BLIND_TYPE_DATA['mini-blind'].minDepthMm).toBeCloseTo(25.4, 2);
  });
});

describe('BLIND_STOCK_WIDTHS_MM', () => {
  it('contains 48" = 1219.2 mm', () => {
    expect(BLIND_STOCK_WIDTHS_MM).toContain(48 * 25.4);
  });
  it('is sorted ascending', () => {
    const sorted = [...BLIND_STOCK_WIDTHS_MM].sort((a, b) => a - b);
    expect(BLIND_STOCK_WIDTHS_MM).toEqual(sorted);
  });
});

describe('BLIND_STOCK_HEIGHTS_MM', () => {
  it('contains 60" = 1524 mm', () => {
    expect(BLIND_STOCK_HEIGHTS_MM).toContain(60 * 25.4);
  });
  it('is sorted ascending', () => {
    const sorted = [...BLIND_STOCK_HEIGHTS_MM].sort((a, b) => a - b);
    expect(BLIND_STOCK_HEIGHTS_MM).toEqual(sorted);
  });
});

describe('validateBlindDimension', () => {
  it('valid value — valid=true', () => {
    expect(validateBlindDimension(500, 'width').valid).toBe(true);
  });
  it('zero — valid=false', () => {
    expect(validateBlindDimension(0, 'width').valid).toBe(false);
  });
  it('negative — valid=false', () => {
    expect(validateBlindDimension(-100, 'height').valid).toBe(false);
  });
  it('below 152.4mm — valid=false', () => {
    expect(validateBlindDimension(50, 'width').valid).toBe(false);
  });
  it('valid depth — valid=true', () => {
    expect(validateBlindDimension(76.2, 'depth').valid).toBe(true);
  });
});

describe('calcInsideMount', () => {
  it('roller: 1219.2 - (12.7x2) = 1193.8 mm', () => {
    const r = calcInsideMount(1219.2, 1524, 'roller');
    expect(r.finishedWidthMm).toBeCloseTo(1193.8, 2);
    expect(r.finishedHeightMm).toBeCloseTo(1524, 2);
    expect(r.overlapMm).toBe(0);
  });
  it('cellular: 1219.2 - (9.525x2) = 1200.15 mm', () => {
    const r = calcInsideMount(1219.2, 1524, 'cellular');
    expect(r.finishedWidthMm).toBeCloseTo(1200.15, 2);
  });
  it('mini-blind: 1219.2 - (6.35x2) = 1206.5 mm', () => {
    const r = calcInsideMount(1219.2, 1524, 'mini-blind');
    expect(r.finishedWidthMm).toBeCloseTo(1206.5, 2);
  });
  it('vertical: deduction=0, finishedWidth = windowWidth', () => {
    const r = calcInsideMount(1219.2, 1524, 'vertical');
    expect(r.finishedWidthMm).toBeCloseTo(1219.2, 2);
    expect(r.manufacturingDeductionMm).toBe(0);
  });
});

describe('calcOutsideMount', () => {
  it('finishedWidth = 1219.2 + (76.2x2) = 1371.6 mm', () => {
    const r = calcOutsideMount(1219.2, 1524);
    expect(r.finishedWidthMm).toBeCloseTo(1371.6, 2);
  });
  it('finishedHeight = 1524 + 50.8 + 25.4 = 1600.2 mm', () => {
    const r = calcOutsideMount(1219.2, 1524);
    expect(r.finishedHeightMm).toBeCloseTo(1600.2, 2);
  });
  it('manufacturingDeductionMm = 0', () => {
    expect(calcOutsideMount(1219.2, 1524).manufacturingDeductionMm).toBe(0);
  });
  it('overlapMm = OUTSIDE_OVERLAP_MM per side (76.2 mm)', () => {
    // Engine stores per-side overlap, not total
    expect(calcOutsideMount(1219.2, 1524).overlapMm).toBeCloseTo(76.2, 2);
  });
});

describe('calcDepthCompatibility', () => {
  it('roller, 76.2mm: clearance=38.1mm, isMountSuitable=true, suitableMount=either', () => {
    const r = calcDepthCompatibility(76.2, 'roller');
    expect(r.clearanceMm).toBeCloseTo(38.1, 2);
    expect(r.isMountSuitable).toBe(true);
    expect(r.suitableMount).toBe('either');
  });
  it('roller, 25.4mm: too shallow', () => {
    const r = calcDepthCompatibility(25.4, 'roller');
    expect(r.isMountSuitable).toBe(false);
    expect(r.suitableMount).toBe('outside');
  });
  it('mini-blind at exact minimum 25.4mm: isMountSuitable=true', () => {
    const r = calcDepthCompatibility(25.4, 'mini-blind');
    expect(r.isMountSuitable).toBe(true);
    expect(r.minimumDepthMm).toBeCloseTo(25.4, 2);
  });
  it('recommendedDepthMm = minimumDepthMm + DEPTH_BUFFER_MM', () => {
    const r = calcDepthCompatibility(100, 'roller');
    expect(r.recommendedDepthMm).toBeCloseTo(r.minimumDepthMm + BLIND_DEFAULTS.DEPTH_BUFFER_MM, 2);
  });
});

describe('calcInstallationDifficulty', () => {
  it('vertical + inside = professional', () => {
    expect(calcInstallationDifficulty('inside', 'vertical', 50)).toBe('professional');
  });
  it('roman + inside = moderate', () => {
    expect(calcInstallationDifficulty('inside', 'roman', 50)).toBe('moderate');
  });
  it('roller + inside + tight clearance = moderate', () => {
    expect(calcInstallationDifficulty('inside', 'roller', 5)).toBe('moderate');
  });
  it('roller + outside = easy', () => {
    expect(calcInstallationDifficulty('outside', 'roller', 50)).toBe('easy');
  });
  it('roller + inside + comfortable clearance = easy', () => {
    expect(calcInstallationDifficulty('inside', 'roller', 25)).toBe('easy');
  });
});

describe('findClosestStockSizes', () => {
  it('returns n closest values sorted ascending by value (not by distance)', () => {
    // Engine: sorts by proximity then re-sorts ascending
    // 1210 closest: 1200 (d=10), 1300 (d=90), 1100 (d=110)
    // Final output sorted ascending: [1100, 1200, 1300]
    const sizes = [1000, 1100, 1200, 1300, 1400];
    const result = findClosestStockSizes(1210, sizes, 3);
    expect(result).toContain(1200); // nearest is included
    expect(result).toHaveLength(3);
    // Verify ascending sort
    expect(result[0]).toBeLessThan(result[1]);
    expect(result[1]).toBeLessThan(result[2]);
  });
  it('returns fewer items if stock list is smaller', () => {
    expect(findClosestStockSizes(500, [400, 600], 5)).toHaveLength(2);
  });
  it('exact stock match 48in returns 1219.2mm as first result', () => {
    const result = findClosestStockSizes(1219.2, BLIND_STOCK_WIDTHS_MM, 1);
    expect(result[0]).toBeCloseTo(1219.2, 0);
  });
});

describe('calcOrderingRecommendation', () => {
  it('within 0.5mm of stock = exact', () => {
    expect(calcOrderingRecommendation(1219.2, BLIND_STOCK_WIDTHS_MM, 0.5)).toBe('exact');
  });
  it('stock size larger within toleranceMm*2 = next-stock', () => {
    // finishedWidth=900, nearest larger stock=950: 950-900=50 <= 25.4*2=50.8
    expect(calcOrderingRecommendation(900, [950, 1000], 25.4)).toBe('next-stock');
  });
  it('finished larger than nearest stock by > toleranceMm*2 but within 25.4*2 = trim', () => {
    // finishedWidth=1270, nearest stock below=1219.2: 1219.2 < 1270 so no trim
    // Use: finishedWidth=960, stock=[900, 1000]: 1000-960=40 <= 50.8 => next-stock
    // For trim: stock must be larger than finished by 25.4*2 threshold
    // Actually trim: w > finishedWidthMm and w - finishedWidthMm <= 25.4*2
    // So: finishedWidth=900, stock=[950]: 950-900=50 <= 50.8 => trim? No, that's next-stock
    // To get trim, need delta > toleranceMm*2 but <= 50.8
    // With toleranceMm=5: 5*2=10; delta 30 > 10 but <= 50.8
    expect(calcOrderingRecommendation(970, [1000], 5)).toBe('trim');
  });
  it('no close stock found = custom', () => {
    expect(calcOrderingRecommendation(1350, [1219.2, 1524], 10)).toBe('custom');
  });
});

describe('buildBlindsWarnings', () => {
  it('depth way below roller minimum = TOO_SHALLOW_INSIDE', () => {
    const w = buildBlindsWarnings({ ...BASE_INPUT, windowDepthMm: 10 }, {});
    expect(w.some((x) => x.code === 'TOO_SHALLOW_INSIDE')).toBe(true);
  });
  it('depth at minimum with no buffer triggers TIGHT_DEPTH when clearanceMm passed', () => {
    // Engine checks result.clearanceMm when defined; 40mm depth, roller minDepth=38.1 => clearance=1.9mm < DEPTH_BUFFER_MM=12.7
    const clearanceMm = 40 - BLIND_TYPE_DATA['roller'].minDepthMm; // ~1.9mm
    const w = buildBlindsWarnings(
      { ...BASE_INPUT, windowDepthMm: 40 },
      { clearanceMm }, // pass clearanceMm so the warning fires
    );
    expect(w.some((x) => x.code === 'TIGHT_DEPTH')).toBe(true);
  });
  it('very small window width = VERY_SMALL_WINDOW', () => {
    const w = buildBlindsWarnings({ ...BASE_INPUT, windowWidthMm: 200 }, {});
    expect(w.some((x) => x.code === 'VERY_SMALL_WINDOW')).toBe(true);
  });
  it('standard 48x60 roller 3in depth = no error-level warnings', () => {
    const w = buildBlindsWarnings(BASE_INPUT, {});
    expect(w.filter((x) => x.level === 'error')).toHaveLength(0);
  });
  it('width > MAX_WINDOW_WIDTH_MM = VERY_WIDE_WINDOW', () => {
    const w = buildBlindsWarnings({ ...BASE_INPUT, windowWidthMm: BLIND_DEFAULTS.MAX_WINDOW_WIDTH_MM + 100 }, {});
    expect(w.some((x) => x.code === 'VERY_WIDE_WINDOW')).toBe(true);
  });
});

describe('calculateBlinds integration', () => {
  it('48x60 roller inside 3in = finishedWidth 1193.8, finishedHeight 1524', () => {
    const r = calculateBlinds(BASE_INPUT);
    expect(r.finishedWidthMm).toBeCloseTo(1193.8, 2);
    expect(r.finishedHeightMm).toBeCloseTo(1524, 2);
    expect(r.manufacturingDeductionMm).toBeCloseTo(25.4, 2);
  });
  it('48x60 roller outside = finishedWidth 1371.6, finishedHeight 1600.2', () => {
    const r = calculateBlinds({ ...BASE_INPUT, mountType: 'outside' });
    expect(r.finishedWidthMm).toBeCloseTo(1371.6, 2);
    expect(r.finishedHeightMm).toBeCloseTo(1600.2, 2);
  });
  it('20x48 mini-blind inside 2in = correct deduction', () => {
    const r = calculateBlinds({ ...BASE_INPUT, windowWidthMm: 508, windowHeightMm: 1219.2, blindType: 'mini-blind', windowDepthMm: 50.8 });
    expect(r.finishedWidthMm).toBeCloseTo(508 - 2 * 6.35, 2);
  });
  it('72x60 vertical inside = professional, no deduction', () => {
    const r = calculateBlinds({ ...BASE_INPUT, windowWidthMm: 1828.8, blindType: 'vertical' });
    expect(r.installationDifficulty).toBe('professional');
    expect(r.finishedWidthMm).toBeCloseTo(1828.8, 2);
  });
  it('36x48 cellular inside 2.25in = TIGHT_DEPTH warning', () => {
    const r = calculateBlinds({ ...BASE_INPUT, windowWidthMm: 914.4, windowHeightMm: 1219.2, blindType: 'cellular', windowDepthMm: 57.15 });
    expect(r.warnings.some((w) => w.code === 'TIGHT_DEPTH')).toBe(true);
  });
  it('returns 3 stock width and 3 height suggestions', () => {
    const r = calculateBlinds(BASE_INPUT);
    expect(r.stockWidthSuggestions).toHaveLength(3);
    expect(r.stockHeightSuggestions).toHaveLength(3);
  });
  it('confidence is a valid value', () => {
    const r = calculateBlinds(BASE_INPUT);
    expect(['excellent', 'good', 'minor-adjustment', 'custom-required']).toContain(r.confidence);
  });
  it('costTier matches blind type data (roller = $$)', () => {
    expect(calculateBlinds(BASE_INPUT).costTier).toBe('$$');
  });
  it('orderingRecommendation is a valid value', () => {
    const r = calculateBlinds(BASE_INPUT);
    expect(['exact', 'next-stock', 'trim', 'custom']).toContain(r.orderingRecommendation);
  });
});

describe('suggestBlindType', () => {
  it('aspect > 2.5 = vertical', () => {
    expect(suggestBlindType(2500, 900)).toBe('vertical');
  });
  it('width > 2286mm = vertical', () => {
    expect(suggestBlindType(2400, 1500)).toBe('vertical');
  });
  it('width < 508mm = mini-blind', () => {
    expect(suggestBlindType(400, 1000)).toBe('mini-blind');
  });
  it('height > 1829mm = roller', () => {
    expect(suggestBlindType(1000, 2000)).toBe('roller');
  });
  it('height < 762mm = venetian', () => {
    expect(suggestBlindType(1000, 600)).toBe('venetian');
  });
  it('standard = roller', () => {
    expect(suggestBlindType(1219.2, 1524)).toBe('roller');
  });
});

describe('buildBlindsRecommendations', () => {
  it('returns all required fields', () => {
    const r = calculateBlinds(BASE_INPUT);
    const recs = buildBlindsRecommendations(BASE_INPUT, r);
    expect(recs).toHaveProperty('recommendedBlindType');
    expect(recs).toHaveProperty('mountRecommendation');
    expect(recs).toHaveProperty('cordlessRecommended');
    expect(recs).toHaveProperty('motorizedRecommended');
    expect(recs).toHaveProperty('controlSideNote');
    expect(recs).toHaveProperty('colorSuggestion');
    expect(recs).toHaveProperty('orderingNote');
    expect(Array.isArray(recs.items)).toBe(true);
  });
  it('low sill window = cordlessRecommended=true', () => {
    const input = { ...BASE_INPUT, windowHeightMm: 800 };
    const recs = buildBlindsRecommendations(input, calculateBlinds(input));
    expect(recs.cordlessRecommended).toBe(true);
  });
  it('standard height = cordlessRecommended=false', () => {
    const recs = buildBlindsRecommendations(BASE_INPUT, calculateBlinds(BASE_INPUT));
    expect(recs.cordlessRecommended).toBe(false);
  });
  it('very wide window = motorizedRecommended=true', () => {
    const input = { ...BASE_INPUT, windowWidthMm: 1828.8 };
    const recs = buildBlindsRecommendations(input, calculateBlinds(input));
    expect(recs.motorizedRecommended).toBe(true);
  });
  it('very tall window = motorizedRecommended=true', () => {
    const input = { ...BASE_INPUT, windowHeightMm: 2200 };
    const recs = buildBlindsRecommendations(input, calculateBlinds(input));
    expect(recs.motorizedRecommended).toBe(true);
  });
  it('items has at least 2 entries each with title, body, type', () => {
    const recs = buildBlindsRecommendations(BASE_INPUT, calculateBlinds(BASE_INPUT));
    expect(recs.items.length).toBeGreaterThanOrEqual(2);
    recs.items.forEach((item) => {
      expect(item).toHaveProperty('title');
      expect(item).toHaveProperty('body');
      expect(item).toHaveProperty('type');
    });
  });
});

describe('Unit Conversion Regression', () => {
  it('inside mount: in / mm / cm / m produce identical finishedWidthMm and finishedHeightMm', () => {
    const wIn = toMm(48, 'in');
    const hIn = toMm(60, 'in');
    const wMm = 1219.2;
    const hMm = 1524;
    const wCm = toMm(121.92, 'cm');
    const hCm = toMm(152.4, 'cm');
    const wM = toMm(1.2192, 'm');
    const hM = toMm(1.524, 'm');

    const rIn = calculateBlinds({ ...BASE_INPUT, windowWidthMm: wIn, windowHeightMm: hIn });
    const rMm = calculateBlinds({ ...BASE_INPUT, windowWidthMm: wMm, windowHeightMm: hMm });
    const rCm = calculateBlinds({ ...BASE_INPUT, windowWidthMm: wCm, windowHeightMm: hCm });
    const rM = calculateBlinds({ ...BASE_INPUT, windowWidthMm: wM, windowHeightMm: hM });

    expect(rIn.finishedWidthMm).toBeCloseTo(rMm.finishedWidthMm, 3);
    expect(rCm.finishedWidthMm).toBeCloseTo(rMm.finishedWidthMm, 3);
    expect(rM.finishedWidthMm).toBeCloseTo(rMm.finishedWidthMm, 3);
    expect(rIn.finishedHeightMm).toBeCloseTo(rMm.finishedHeightMm, 3);
    expect(rCm.finishedHeightMm).toBeCloseTo(rMm.finishedHeightMm, 3);
    expect(rM.finishedHeightMm).toBeCloseTo(rMm.finishedHeightMm, 3);
  });

  it('outside mount: in / mm / cm / m produce identical results', () => {
    const base = { ...BASE_INPUT, mountType: 'outside' as const };
    const wIn = toMm(48, 'in');
    const hIn = toMm(60, 'in');
    const wMm = 1219.2;
    const hMm = 1524;
    const wCm = toMm(121.92, 'cm');
    const hCm = toMm(152.4, 'cm');
    const wM = toMm(1.2192, 'm');
    const hM = toMm(1.524, 'm');

    const rIn = calculateBlinds({ ...base, windowWidthMm: wIn, windowHeightMm: hIn });
    const rMm = calculateBlinds({ ...base, windowWidthMm: wMm, windowHeightMm: hMm });
    const rCm = calculateBlinds({ ...base, windowWidthMm: wCm, windowHeightMm: hCm });
    const rM = calculateBlinds({ ...base, windowWidthMm: wM, windowHeightMm: hM });

    expect(rIn.finishedWidthMm).toBeCloseTo(rMm.finishedWidthMm, 3);
    expect(rCm.finishedWidthMm).toBeCloseTo(rMm.finishedWidthMm, 3);
    expect(rM.finishedWidthMm).toBeCloseTo(rMm.finishedWidthMm, 3);
    expect(rIn.finishedHeightMm).toBeCloseTo(rMm.finishedHeightMm, 3);
    expect(rCm.finishedHeightMm).toBeCloseTo(rMm.finishedHeightMm, 3);
    expect(rM.finishedHeightMm).toBeCloseTo(rMm.finishedHeightMm, 3);
  });

  it('ft unit: 4ft x 5ft produces same result as 1219.2mm x 1524mm', () => {
    const rFt = calculateBlinds({ ...BASE_INPUT, windowWidthMm: toMm(4, 'ft'), windowHeightMm: toMm(5, 'ft') });
    const rMm = calculateBlinds({ ...BASE_INPUT, windowWidthMm: 1219.2, windowHeightMm: 1524 });
    expect(rFt.finishedWidthMm).toBeCloseTo(rMm.finishedWidthMm, 3);
    expect(rFt.finishedHeightMm).toBeCloseTo(rMm.finishedHeightMm, 3);
  });
});
