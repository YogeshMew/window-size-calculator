/**
 * Vitest Test Suite for Window Energy Savings Calculator Engine
 *
 * Tests all thermal U-factors, SHGC values, climate degree days, heating fuel efficiencies,
 * annual energy savings, CO2 reduction, payback period, and recommendations.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateWindowEnergy,
  WINDOW_ENERGY_DEFAULTS,
  U_FACTORS_BTU,
  SHGC_VALUES,
  FRAME_THERMAL_FACTOR,
  CLIMATE_DEGREE_DAYS,
  FUEL_EFFICIENCY,
  HOME_TYPE_MULTIPLIER,
  type WindowEnergyInput,
} from '../window-energy.js';
import { buildWindowEnergyRecommendations } from '../window-energy-recommendations.js';

const BASE_INPUT: WindowEnergyInput = {
  windowWidthMm: 914.4, // 36"
  windowHeightMm: 1219.2, // 48"
  numberOfWindows: 10,
  currentWindow: 'single-pane',
  newWindow: 'low-e',
  frameMaterial: 'vinyl',
  climateZone: 'cold',
  electricityCostPerKwh: 0.16,
  heatingFuel: 'gas',
  averageMonthlyBill: 200,
  homeType: 'house',
};

describe('Window Energy Engine — Constants & Physics Tables', () => {
  it('defines valid defaults', () => {
    expect(WINDOW_ENERGY_DEFAULTS.MIN_WINDOW_WIDTH_MM).toBeGreaterThan(0);
    expect(WINDOW_ENERGY_DEFAULTS.DEFAULT_ELECTRICITY_COST_KWH).toBe(0.16);
    expect(WINDOW_ENERGY_DEFAULTS.EXPECTED_WINDOW_LIFESPAN_YEARS).toBe(25);
  });

  it('defines valid U-Factors for all window types', () => {
    expect(U_FACTORS_BTU['single-pane']).toBe(1.10);
    expect(U_FACTORS_BTU['double-pane']).toBe(0.48);
    expect(U_FACTORS_BTU['triple-pane']).toBe(0.22);
    expect(U_FACTORS_BTU['argon']).toBe(0.24);
    expect(U_FACTORS_BTU['krypton']).toBe(0.18);
  });

  it('defines valid SHGC values for all window types', () => {
    expect(SHGC_VALUES['single-pane']).toBe(0.78);
    expect(SHGC_VALUES['double-pane']).toBe(0.65);
    expect(SHGC_VALUES['triple-pane']).toBe(0.35);
    expect(SHGC_VALUES['krypton']).toBe(0.26);
  });

  it('defines frame thermal factors', () => {
    expect(FRAME_THERMAL_FACTOR.vinyl).toBe(1.0);
    expect(FRAME_THERMAL_FACTOR.fiberglass).toBe(0.95);
    expect(FRAME_THERMAL_FACTOR.aluminum).toBe(1.35);
  });

  it('defines degree days for Cold, Mixed, Hot climate zones', () => {
    expect(CLIMATE_DEGREE_DAYS.cold.hdd).toBe(6200);
    expect(CLIMATE_DEGREE_DAYS.mixed.hdd).toBe(4200);
    expect(CLIMATE_DEGREE_DAYS.hot.cdd).toBe(3400);
  });

  it('defines fuel efficiency factors', () => {
    expect(FUEL_EFFICIENCY.electricity.efficiency).toBe(1.0);
    expect(FUEL_EFFICIENCY['heat-pump'].efficiency).toBe(2.8);
    expect(FUEL_EFFICIENCY.gas.efficiency).toBe(0.85);
  });
});

describe('Window Energy Engine — Core Calculations', () => {
  it('calculates energy savings for upgrading single-pane to Low-E in cold climate', () => {
    const result = calculateWindowEnergy(BASE_INPUT);
    expect(result.glassAreaSqFt).toBe(12.0);
    expect(result.totalWindowAreaSqFt).toBe(120.0);
    expect(result.oldUFactorBtu).toBe(1.10);
    expect(result.newUFactorBtu).toBe(0.30);
    expect(result.annualSavings).toBeGreaterThan(100);
    expect(result.monthlySavings).toBeGreaterThan(10);
    expect(result.co2ReductionKg).toBeGreaterThan(50);
    expect(result.energyEfficiencyScore).toBeGreaterThan(70);
    expect(result.confidence).toBe('excellent');
  });

  it('scales savings proportionally with number of windows', () => {
    const input1 = { ...BASE_INPUT, numberOfWindows: 1, averageMonthlyBill: 0 };
    const input5 = { ...BASE_INPUT, numberOfWindows: 5, averageMonthlyBill: 0 };
    const res1 = calculateWindowEnergy(input1);
    const res5 = calculateWindowEnergy(input5);
    expect(res5.annualSavings).toBeGreaterThan(res1.annualSavings * 4);
  });

  it('calculates higher heat loss in cold climate than hot climate', () => {
    const cold = calculateWindowEnergy({ ...BASE_INPUT, climateZone: 'cold', averageMonthlyBill: 0 });
    const hot = calculateWindowEnergy({ ...BASE_INPUT, climateZone: 'hot', averageMonthlyBill: 0 });
    expect(cold.annualHeatLossKwh).toBeGreaterThan(hot.annualHeatLossKwh);
    expect(hot.annualHeatGainKwh).toBeGreaterThan(cold.annualHeatGainKwh);
  });

  it('calculates triple-pane as more efficient than double-pane', () => {
    const doublePane = calculateWindowEnergy({ ...BASE_INPUT, newWindow: 'double-pane', averageMonthlyBill: 0 });
    const triplePane = calculateWindowEnergy({ ...BASE_INPUT, newWindow: 'triple-pane', averageMonthlyBill: 0 });
    expect(triplePane.annualSavings).toBeGreaterThan(doublePane.annualSavings);
    expect(triplePane.energyEfficiencyScore).toBeGreaterThan(doublePane.energyEfficiencyScore);
  });

  it('calculates CO2 reduction correctly', () => {
    const result = calculateWindowEnergy(BASE_INPUT);
    expect(result.co2ReductionKg).toBeGreaterThan(0);
    expect(result.lifetimeSavings).toBe(result.annualSavings * 25);
  });

  it('evaluates comfort rating tiers', () => {
    const resHigh = calculateWindowEnergy({ ...BASE_INPUT, currentWindow: 'single-pane', newWindow: 'triple-pane' });
    expect(['great', 'superior']).toContain(resHigh.comfortRating);
  });
});

describe('Window Energy Engine — Heating Fuels & Home Types', () => {
  const fuels: WindowEnergyInput['heatingFuel'][] = ['electricity', 'gas', 'oil', 'heat-pump'];

  fuels.forEach((fuel) => {
    it(`calculates savings correctly for heating fuel: ${fuel}`, () => {
      const res = calculateWindowEnergy({ ...BASE_INPUT, heatingFuel: fuel, averageMonthlyBill: 0 });
      expect(res.annualSavings).toBeGreaterThan(0);
      expect(res.monthlySavings).toBeGreaterThan(0);
    });
  });

  it('apartment has lower thermal volume multiplier than house', () => {
    const apt = calculateWindowEnergy({ ...BASE_INPUT, homeType: 'apartment', averageMonthlyBill: 0 });
    const house = calculateWindowEnergy({ ...BASE_INPUT, homeType: 'house', averageMonthlyBill: 0 });
    expect(house.annualSavings).toBeGreaterThan(apt.annualSavings);
  });
});

describe('Window Energy Engine — Warnings & Edge Cases', () => {
  it('generates info warning when current window equals new window type', () => {
    const res = calculateWindowEnergy({
      ...BASE_INPUT,
      currentWindow: 'double-pane',
      newWindow: 'double-pane' as any,
    });
    expect(res.warnings.some((w) => w.code === 'SAME_WINDOW_TYPE')).toBe(true);
  });

  it('generates warning for un-broken aluminum frames', () => {
    const res = calculateWindowEnergy({
      ...BASE_INPUT,
      frameMaterial: 'aluminum',
    });
    expect(res.warnings.some((w) => w.code === 'ALUMINUM_FRAME_CONDUCTIVITY')).toBe(true);
  });

  it('clamps minimum window dimensions safely', () => {
    const res = calculateWindowEnergy({
      ...BASE_INPUT,
      windowWidthMm: 10,
      windowHeightMm: 10,
    });
    expect(res.glassAreaSqFt).toBeGreaterThan(0);
  });
});

describe('Window Energy Engine — Recommendations Module', () => {
  it('generates recommendation set with climate guidance', () => {
    const res = calculateWindowEnergy(BASE_INPUT);
    const recs = buildWindowEnergyRecommendations(BASE_INPUT, res);

    expect(recs.recommendedGlass).toBe('argon');
    expect(recs.items.length).toBeGreaterThanOrEqual(5);
    expect(recs.savingsNote).toContain('$');
    expect(recs.co2Note).toContain('kg CO₂');
  });

  it('recommends solar control glass for hot climates', () => {
    const hotInput = { ...BASE_INPUT, climateZone: 'hot' as const };
    const res = calculateWindowEnergy(hotInput);
    const recs = buildWindowEnergyRecommendations(hotInput, res);

    expect(recs.recommendedGlass).toBe('low-e');
    expect(recs.items.some((i) => i.type === 'glass')).toBe(true);
  });
});
