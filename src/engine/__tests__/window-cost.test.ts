/**
 * Vitest Test Suite for Window Cost Calculator Engine
 *
 * Tests all pricing formulas, region multipliers, material multipliers,
 * glass upgrade costs, labor costs, DIY savings, feature add-ons,
 * budget categories, confidence ratings, and recommendation outputs.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateWindowCost,
  WINDOW_COST_DEFAULTS,
  STYLE_BASE_COST,
  MATERIAL_MULTIPLIER,
  GLASS_TYPE_COST_PER_SQFT,
  REPLACEMENT_TYPE_LABOR_MULTIPLIER,
  REGION_MULTIPLIER,
  FEATURE_COST_PER_UNIT,
  BASE_LABOR_COST_PER_UNIT,
  type WindowCostInput,
} from '../window-cost.js';
import { buildWindowCostRecommendations } from '../window-cost-recommendations.js';

const BASE_INPUT: WindowCostInput = {
  windowWidthMm: 914.4, // 36"
  windowHeightMm: 1219.2, // 48"
  quantity: 1,
  windowStyle: 'double-hung',
  frameMaterial: 'vinyl',
  glassType: 'double-pane',
  installation: 'professional',
  replacementType: 'insert',
  region: 'average',
  features: [],
};

describe('Window Cost Engine — Constants & Defaults', () => {
  it('defines valid defaults and constants', () => {
    expect(WINDOW_COST_DEFAULTS.MIN_WINDOW_WIDTH_MM).toBeGreaterThan(0);
    expect(WINDOW_COST_DEFAULTS.MIN_WINDOW_HEIGHT_MM).toBeGreaterThan(0);
    expect(WINDOW_COST_DEFAULTS.BASE_AREA_SQFT).toBe(12.0);
    expect(BASE_LABOR_COST_PER_UNIT).toBe(180);
  });

  it('defines style base costs for all 10 styles', () => {
    expect(STYLE_BASE_COST['single-hung']).toBe(250);
    expect(STYLE_BASE_COST['double-hung']).toBe(320);
    expect(STYLE_BASE_COST['casement']).toBe(380);
    expect(STYLE_BASE_COST['sliding']).toBe(280);
    expect(STYLE_BASE_COST['awning']).toBe(360);
    expect(STYLE_BASE_COST['picture']).toBe(220);
    expect(STYLE_BASE_COST['bay']).toBe(1250);
    expect(STYLE_BASE_COST['bow']).toBe(1500);
    expect(STYLE_BASE_COST['garden']).toBe(950);
    expect(STYLE_BASE_COST['custom']).toBe(650);
  });

  it('defines material multipliers relative to vinyl = 1.0', () => {
    expect(MATERIAL_MULTIPLIER.vinyl).toBe(1.0);
    expect(MATERIAL_MULTIPLIER.aluminum).toBe(1.15);
    expect(MATERIAL_MULTIPLIER.wood).toBe(1.6);
    expect(MATERIAL_MULTIPLIER.fiberglass).toBe(1.45);
    expect(MATERIAL_MULTIPLIER.composite).toBe(1.35);
  });

  it('defines glass type costs per sq ft', () => {
    expect(GLASS_TYPE_COST_PER_SQFT['single-pane']).toBe(8);
    expect(GLASS_TYPE_COST_PER_SQFT['double-pane']).toBe(18);
    expect(GLASS_TYPE_COST_PER_SQFT['triple-pane']).toBe(35);
    expect(GLASS_TYPE_COST_PER_SQFT['low-e']).toBe(24);
    expect(GLASS_TYPE_COST_PER_SQFT['laminated']).toBe(32);
    expect(GLASS_TYPE_COST_PER_SQFT['tempered']).toBe(28);
  });

  it('defines labor multipliers for replacement styles', () => {
    expect(REPLACEMENT_TYPE_LABOR_MULTIPLIER.insert).toBe(1.0);
    expect(REPLACEMENT_TYPE_LABOR_MULTIPLIER['full-frame']).toBe(1.45);
    expect(REPLACEMENT_TYPE_LABOR_MULTIPLIER['new-construction']).toBe(1.25);
  });

  it('defines region multipliers', () => {
    expect(REGION_MULTIPLIER['low-cost']).toBe(0.85);
    expect(REGION_MULTIPLIER.average).toBe(1.0);
    expect(REGION_MULTIPLIER['high-cost']).toBe(1.3);
  });

  it('defines feature costs per unit', () => {
    expect(FEATURE_COST_PER_UNIT.grids).toBe(35);
    expect(FEATURE_COST_PER_UNIT['argon-gas']).toBe(45);
    expect(FEATURE_COST_PER_UNIT['uv-coating']).toBe(50);
    expect(FEATURE_COST_PER_UNIT['noise-reduction']).toBe(85);
    expect(FEATURE_COST_PER_UNIT['security-glass']).toBe(120);
    expect(FEATURE_COST_PER_UNIT['smart-glass']).toBe(350);
  });
});

describe('Window Cost Engine — Core Calculations', () => {
  it('calculates standard 36x48 double-hung vinyl window cost', () => {
    const result = calculateWindowCost(BASE_INPUT);
    expect(result.glassAreaSqFt).toBe(12.0);
    expect(result.grandTotal).toBeGreaterThan(500);
    expect(result.grandTotal).toBeLessThan(1200);
    expect(result.totalCostPerUnit).toBe(result.grandTotal);
    expect(result.confidence).toBe('excellent');
  });

  it('multiplies cost by quantity accurately', () => {
    const input1 = { ...BASE_INPUT, quantity: 1 };
    const input5 = { ...BASE_INPUT, quantity: 5 };
    const res1 = calculateWindowCost(input1);
    const res5 = calculateWindowCost(input5);
    expect(res5.grandTotal).toBe(res1.totalCostPerUnit * 5);
  });

  it('applies region multipliers (Low vs High cost regions)', () => {
    const lowRegion = calculateWindowCost({ ...BASE_INPUT, region: 'low-cost' });
    const highRegion = calculateWindowCost({ ...BASE_INPUT, region: 'high-cost' });
    expect(highRegion.grandTotal).toBeGreaterThan(lowRegion.grandTotal);
    expect(Math.round(highRegion.grandTotal / lowRegion.grandTotal * 100) / 100).toBeCloseTo(1.3 / 0.85, 1);
  });

  it('applies material multipliers (Vinyl vs Wood)', () => {
    const vinylCost = calculateWindowCost({ ...BASE_INPUT, frameMaterial: 'vinyl' });
    const woodCost = calculateWindowCost({ ...BASE_INPUT, frameMaterial: 'wood' });
    expect(woodCost.grandTotal).toBeGreaterThan(vinylCost.grandTotal);
  });

  it('applies glass type upgrades (Single Pane vs Triple Pane)', () => {
    const singlePane = calculateWindowCost({ ...BASE_INPUT, glassType: 'single-pane' });
    const triplePane = calculateWindowCost({ ...BASE_INPUT, glassType: 'triple-pane' });
    expect(triplePane.grandTotal).toBeGreaterThan(singlePane.grandTotal);
    expect(triplePane.glassCostPerUnit).toBeGreaterThan(singlePane.glassCostPerUnit);
  });

  it('calculates DIY installation savings (Zero labor cost for DIY)', () => {
    const pro = calculateWindowCost({ ...BASE_INPUT, installation: 'professional' });
    const diy = calculateWindowCost({ ...BASE_INPUT, installation: 'diy' });
    expect(diy.laborCostPerUnit).toBe(0);
    expect(pro.laborCostPerUnit).toBeGreaterThan(0);
    expect(diy.estimatedSavingsDiy).toBeGreaterThan(0);
    expect(pro.estimatedSavingsDiy).toBe(0);
    expect(pro.grandTotal).toBeGreaterThan(diy.grandTotal);
  });

  it('adds optional features correctly to total unit cost', () => {
    const noFeatures = calculateWindowCost({ ...BASE_INPUT, features: [] });
    const withFeatures = calculateWindowCost({
      ...BASE_INPUT,
      features: ['argon-gas', 'grids', 'uv-coating'],
    });
    expect(withFeatures.featuresCostPerUnit).toBe(35 + 45 + 50);
    expect(withFeatures.grandTotal).toBeGreaterThan(noFeatures.grandTotal);
  });

  it('categorizes budgets into budget, mid-range, premium, and luxury', () => {
    const budget = calculateWindowCost({
      ...BASE_INPUT,
      windowStyle: 'picture',
      frameMaterial: 'vinyl',
      glassType: 'single-pane',
      installation: 'diy',
    });
    expect(budget.budgetCategory).toBe('budget');

    const luxury = calculateWindowCost({
      ...BASE_INPUT,
      windowStyle: 'bow',
      frameMaterial: 'wood',
      glassType: 'triple-pane',
      features: ['smart-glass', 'security-glass'],
      installation: 'professional',
    });
    expect(['premium', 'luxury']).toContain(luxury.budgetCategory);
  });
});

describe('Window Cost Engine — Window Styles & Area Scaling', () => {
  const styles: WindowCostInput['windowStyle'][] = [
    'single-hung', 'double-hung', 'casement', 'sliding', 'awning', 'picture', 'bay', 'bow', 'garden', 'custom'
  ];

  styles.forEach((style) => {
    it(`calculates cost correctly for window style: ${style}`, () => {
      const res = calculateWindowCost({ ...BASE_INPUT, windowStyle: style });
      expect(res.grandTotal).toBeGreaterThan(0);
      expect(res.totalCostPerUnit).toBeGreaterThan(0);
    });
  });

  it('handles bay and bow windows with higher labor and unit cost', () => {
    const doubleHung = calculateWindowCost({ ...BASE_INPUT, windowStyle: 'double-hung' });
    const bay = calculateWindowCost({ ...BASE_INPUT, windowStyle: 'bay' });
    expect(bay.grandTotal).toBeGreaterThan(doubleHung.grandTotal * 2);
  });

  it('scales cost non-linearly with area', () => {
    const small = calculateWindowCost({ ...BASE_INPUT, windowWidthMm: 609.6, windowHeightMm: 609.6 }); // 4 sq ft
    const large = calculateWindowCost({ ...BASE_INPUT, windowWidthMm: 1828.8, windowHeightMm: 1219.2 }); // 24 sq ft
    expect(large.grandTotal).toBeGreaterThan(small.grandTotal);
    expect(large.costPerSqFt).toBeLessThan(small.costPerSqFt);
  });
});

describe('Window Cost Engine — Replacement Types & Labor Complexity', () => {
  it('full-frame replacement has higher labor cost than insert replacement', () => {
    const insert = calculateWindowCost({ ...BASE_INPUT, replacementType: 'insert' });
    const fullFrame = calculateWindowCost({ ...BASE_INPUT, replacementType: 'full-frame' });
    expect(fullFrame.laborCostPerUnit).toBeGreaterThan(insert.laborCostPerUnit);
  });

  it('new construction has intermediate labor cost', () => {
    const insert = calculateWindowCost({ ...BASE_INPUT, replacementType: 'insert' });
    const newConst = calculateWindowCost({ ...BASE_INPUT, replacementType: 'new-construction' });
    expect(newConst.laborCostPerUnit).toBeGreaterThan(insert.laborCostPerUnit);
  });
});

describe('Window Cost Engine — Warnings & Confidence', () => {
  it('generates warning for DIY Bay/Bow window installation', () => {
    const res = calculateWindowCost({
      ...BASE_INPUT,
      windowStyle: 'bay',
      installation: 'diy',
    });
    expect(res.warnings.some((w) => w.code === 'DIY_COMPLEX_STYLE')).toBe(true);
  });

  it('generates info warning for DIY full-frame replacement', () => {
    const res = calculateWindowCost({
      ...BASE_INPUT,
      replacementType: 'full-frame',
      installation: 'diy',
    });
    expect(res.warnings.some((w) => w.code === 'DIY_FULL_FRAME')).toBe(true);
  });

  it('generates warning for very wide window', () => {
    const res = calculateWindowCost({
      ...BASE_INPUT,
      windowWidthMm: 5000,
    });
    expect(res.warnings.some((w) => w.code === 'VERY_WIDE_WINDOW')).toBe(true);
  });

  it('sets confidence to minor-adjustment for bay/bow or smart glass', () => {
    const bayRes = calculateWindowCost({ ...BASE_INPUT, windowStyle: 'bay' });
    expect(bayRes.confidence).toBe('minor-adjustment');

    const smartRes = calculateWindowCost({ ...BASE_INPUT, features: ['smart-glass'] });
    expect(smartRes.confidence).toBe('minor-adjustment');
  });
});

describe('Window Cost Engine — Recommendations Module', () => {
  it('builds comprehensive recommendation items', () => {
    const res = calculateWindowCost(BASE_INPUT);
    const recs = buildWindowCostRecommendations(BASE_INPUT, res);

    expect(recs.recommendedStyle).toBe('double-hung');
    expect(recs.items.length).toBeGreaterThanOrEqual(5);
    expect(recs.energySavingsEstAnnual).toBeGreaterThan(0);
    expect(recs.budgetNote).toContain('$');
  });

  it('suggests wood-look vinyl for wood frame selections', () => {
    const woodInput = { ...BASE_INPUT, frameMaterial: 'wood' as const };
    const res = calculateWindowCost(woodInput);
    const recs = buildWindowCostRecommendations(woodInput, res);

    expect(recs.items.some((i) => i.type === 'alternative')).toBe(true);
  });

  it('includes Low-E recommendation when not selected', () => {
    const res = calculateWindowCost(BASE_INPUT);
    const recs = buildWindowCostRecommendations(BASE_INPUT, res);
    expect(recs.items.some((i) => i.type === 'upgrade')).toBe(true);
  });
});
