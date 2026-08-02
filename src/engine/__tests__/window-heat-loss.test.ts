/**
 * Vitest Test Suite for Window Heat Loss Calculator Engine
 *
 * Tests conduction heat loss rate (BTU/hr & Watts), temperature differential ΔT,
 * U-factors, exposure wind multipliers, daily/monthly/annual kWh loss,
 * energy ratings, categories, and recommendations.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateWindowHeatLoss,
  WINDOW_HEAT_LOSS_DEFAULTS,
  U_FACTORS_HEAT_LOSS,
  FRAME_CONDUCTIVITY_FACTOR,
  EXPOSURE_LOSS_MULTIPLIER,
  type WindowHeatLossInput,
} from '../window-heat-loss.js';
import { buildWindowHeatLossRecommendations } from '../window-heat-loss-recommendations.js';

const BASE_INPUT: WindowHeatLossInput = {
  windowWidthMm: 914.4, // 36"
  windowHeightMm: 1219.2, // 48"
  numberOfWindows: 10,
  indoorTempF: 70,
  outdoorTempF: 20,
  windowType: 'single-pane',
  frameMaterial: 'vinyl',
  climate: 'cold',
  exposure: 'north',
};

describe('Window Heat Loss Engine — Physics & Constants', () => {
  it('defines valid defaults & conversion ratios', () => {
    expect(WINDOW_HEAT_LOSS_DEFAULTS.MIN_WINDOW_WIDTH_MM).toBeGreaterThan(0);
    expect(WINDOW_HEAT_LOSS_DEFAULTS.BTU_HR_TO_WATTS).toBeCloseTo(3.41214, 4);
    expect(WINDOW_HEAT_LOSS_DEFAULTS.HEATING_DAYS_PER_YEAR).toBe(180);
  });

  it('defines valid U-Factors for all window types', () => {
    expect(U_FACTORS_HEAT_LOSS['single-pane']).toBe(1.10);
    expect(U_FACTORS_HEAT_LOSS['double-pane']).toBe(0.48);
    expect(U_FACTORS_HEAT_LOSS['triple-pane']).toBe(0.22);
    expect(U_FACTORS_HEAT_LOSS['low-e']).toBe(0.30);
  });

  it('defines frame conductivity factors', () => {
    expect(FRAME_CONDUCTIVITY_FACTOR.vinyl).toBe(1.0);
    expect(FRAME_CONDUCTIVITY_FACTOR.fiberglass).toBe(0.95);
    expect(FRAME_CONDUCTIVITY_FACTOR.aluminum).toBe(1.35);
  });

  it('defines exposure multipliers (North vs South)', () => {
    expect(EXPOSURE_LOSS_MULTIPLIER.north).toBe(1.15);
    expect(EXPOSURE_LOSS_MULTIPLIER.south).toBe(0.90);
  });
});

describe('Window Heat Loss Engine — Core Calculations', () => {
  it('calculates heat loss rate for 10 single-pane windows at 50°F ΔT', () => {
    const result = calculateWindowHeatLoss(BASE_INPUT);
    expect(result.glassAreaSqFt).toBe(12.0);
    expect(result.totalAreaSqFt).toBe(120.0);
    expect(result.tempDifferenceF).toBe(50);
    expect(result.heatLossBtuHr).toBeGreaterThan(6000);
    expect(result.heatLossWatts).toBeGreaterThan(1800);
    expect(result.dailyHeatLossKwh).toBeGreaterThan(40);
    expect(result.energyRating).toBe('F');
    expect(result.heatLossCategory).toBe('severe');
    expect(result.confidence).toBe('excellent');
  });

  it('calculates zero heat loss when outdoor temp equals indoor temp', () => {
    const res = calculateWindowHeatLoss({ ...BASE_INPUT, outdoorTempF: 70 });
    expect(res.tempDifferenceF).toBe(0);
    expect(res.heatLossBtuHr).toBe(0);
    expect(res.heatLossWatts).toBe(0);
    expect(res.warnings.some((w) => w.code === 'OUTDOOR_WARMER_THAN_INDOOR')).toBe(true);
  });

  it('triple-pane reduces heat loss significantly compared to single-pane', () => {
    const single = calculateWindowHeatLoss({ ...BASE_INPUT, windowType: 'single-pane' });
    const triple = calculateWindowHeatLoss({ ...BASE_INPUT, windowType: 'triple-pane' });
    expect(triple.heatLossWatts).toBeLessThan(single.heatLossWatts * 0.25);
    expect(triple.energyRating).toBe('A+');
  });

  it('north exposure has higher heat loss than south exposure', () => {
    const north = calculateWindowHeatLoss({ ...BASE_INPUT, exposure: 'north' });
    const south = calculateWindowHeatLoss({ ...BASE_INPUT, exposure: 'south' });
    expect(north.heatLossBtuHr).toBeGreaterThan(south.heatLossBtuHr);
  });

  it('un-broken aluminum frame increases heat loss rate', () => {
    const vinyl = calculateWindowHeatLoss({ ...BASE_INPUT, frameMaterial: 'vinyl' });
    const aluminum = calculateWindowHeatLoss({ ...BASE_INPUT, frameMaterial: 'aluminum' });
    expect(aluminum.heatLossBtuHr).toBeGreaterThan(vinyl.heatLossBtuHr);
  });

  it('accumulates daily, monthly, and annual kWh loss accurately', () => {
    const res = calculateWindowHeatLoss(BASE_INPUT);
    expect(res.monthlyHeatLossKwh).toBeCloseTo(res.dailyHeatLossKwh * 30, 0);
    expect(res.annualHeatLossKwh).toBeCloseTo(res.dailyHeatLossKwh * 180, 0);
    expect(res.estimatedHeatingCostAnnual).toBeGreaterThan(0);
  });
});

describe('Window Heat Loss Engine — Warnings & Edge Cases', () => {
  it('generates high heat loss warning for single-pane glass', () => {
    const res = calculateWindowHeatLoss(BASE_INPUT);
    expect(res.warnings.some((w) => w.code === 'HIGH_HEAT_LOSS_SINGLE_PANE')).toBe(true);
  });

  it('generates conductive frame warning for aluminum', () => {
    const res = calculateWindowHeatLoss({ ...BASE_INPUT, frameMaterial: 'aluminum' });
    expect(res.warnings.some((w) => w.code === 'CONDUCTIVE_ALUMINUM_FRAME')).toBe(true);
  });

  it('handles small window dimensions safely', () => {
    const res = calculateWindowHeatLoss({ ...BASE_INPUT, windowWidthMm: 200, windowHeightMm: 200 });
    expect(res.glassAreaSqFt).toBeGreaterThan(0);
    expect(res.heatLossWatts).toBeGreaterThan(0);
  });
});

describe('Window Heat Loss Engine — Recommendations Module', () => {
  it('builds comprehensive recommendation set', () => {
    const res = calculateWindowHeatLoss(BASE_INPUT);
    const recs = buildWindowHeatLossRecommendations(BASE_INPUT, res);

    expect(recs.recommendedGlazing).toBe('triple-pane');
    expect(recs.items.length).toBeGreaterThanOrEqual(5);
    expect(recs.heatLossNote).toContain('Watts');
    expect(recs.costImpactNote).toContain('$');
  });

  it('recommends thermal shrink-wrap film for severe heat loss', () => {
    const res = calculateWindowHeatLoss(BASE_INPUT);
    const recs = buildWindowHeatLossRecommendations(BASE_INPUT, res);

    expect(recs.items.some((i) => i.type === 'film')).toBe(true);
  });
});
