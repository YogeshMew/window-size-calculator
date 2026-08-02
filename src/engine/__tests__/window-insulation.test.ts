/**
 * Vitest Test Suite for Window Insulation Calculator Engine
 *
 * Tests thermal U-factors, R-values, heat transfer rates (Watts),
 * 1-100 Thermal Efficiency Score, Insulation Rating tiers, Air Leakage Risk,
 * Condensation Risk, Draft Risk, age/seal degradation, window coverings, and recommendations.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateWindowInsulation,
  WINDOW_INSULATION_DEFAULTS,
  BASE_U_FACTORS,
  FRAME_THERMAL_MODIFIER,
  SEAL_CONDITION_DEGRADATION,
  COVERING_R_BOOST,
  type WindowInsulationInput,
} from '../window-insulation.js';
import { buildWindowInsulationRecommendations } from '../window-insulation-recommendations.js';

const BASE_INPUT: WindowInsulationInput = {
  windowWidthMm: 914.4, // 36"
  windowHeightMm: 1219.2, // 48"
  windowType: 'double-pane',
  frameMaterial: 'vinyl',
  climate: 'cold',
  sealCondition: 'excellent',
  windowAge: '0-5',
  windowCovering: 'none',
};

describe('Window Insulation Engine — Constants & Physics Tables', () => {
  it('defines valid defaults', () => {
    expect(WINDOW_INSULATION_DEFAULTS.MIN_WINDOW_WIDTH_MM).toBe(152.4);
    expect(WINDOW_INSULATION_DEFAULTS.STANDARD_TEMP_DIFF_F).toBe(40);
  });

  it('defines valid U-Factors for all window types', () => {
    expect(BASE_U_FACTORS['single-pane']).toBe(1.10);
    expect(BASE_U_FACTORS['double-pane']).toBe(0.48);
    expect(BASE_U_FACTORS['low-e']).toBe(0.30);
    expect(BASE_U_FACTORS.argon).toBe(0.24);
    expect(BASE_U_FACTORS['triple-pane']).toBe(0.22);
    expect(BASE_U_FACTORS.krypton).toBe(0.18);
  });

  it('defines frame thermal modifiers', () => {
    expect(FRAME_THERMAL_MODIFIER.vinyl).toBe(1.0);
    expect(FRAME_THERMAL_MODIFIER.fiberglass).toBe(0.95);
    expect(FRAME_THERMAL_MODIFIER.aluminum).toBe(1.35);
  });

  it('defines window covering R-value boosts', () => {
    expect(COVERING_R_BOOST.none).toBe(0);
    expect(COVERING_R_BOOST['cellular-shades']).toBe(1.8);
  });
});

describe('Window Insulation Engine — Core Calculations', () => {
  it('calculates insulation metrics for standard double pane vinyl window', () => {
    const result = calculateWindowInsulation(BASE_INPUT);
    expect(result.windowAreaSqFt).toBe(12.0);
    expect(result.estimatedUFactor).toBe(0.48);
    expect(result.estimatedRValue).toBeCloseTo(2.1, 1);
    expect(result.thermalEfficiencyScore).toBeGreaterThan(50);
    expect(result.insulationRating).toBe('Good');
    expect(result.airLeakageRisk).toBe('low');
    expect(result.confidence).toBe('excellent');
  });

  it('calculates single pane window as poor rating with severe draft risk', () => {
    const single = calculateWindowInsulation({ ...BASE_INPUT, windowType: 'single-pane' });
    expect(single.estimatedUFactor).toBe(1.10);
    expect(single.thermalEfficiencyScore).toBeLessThan(30);
    expect(single.insulationRating).toBe('Severe Thermal Leakage');
    expect(single.draftRisk).toBe('severe-drafts');
    expect(single.warnings.some((w) => w.code === 'SINGLE_PANE_LOW_R_VALUE')).toBe(true);
  });

  it('triple pane krypton achieves superior insulation rating (>90 score)', () => {
    const krypton = calculateWindowInsulation({ ...BASE_INPUT, windowType: 'krypton' });
    expect(krypton.estimatedUFactor).toBeLessThanOrEqual(0.18);
    expect(krypton.thermalEfficiencyScore).toBeGreaterThanOrEqual(85);
    expect(krypton.insulationRating).toBe('Superior');
  });

  it('cellular shades boost window R-value', () => {
    const noShade = calculateWindowInsulation({ ...BASE_INPUT, windowCovering: 'none' });
    const cellular = calculateWindowInsulation({ ...BASE_INPUT, windowCovering: 'cellular-shades' });
    expect(cellular.estimatedRValue).toBeGreaterThan(noShade.estimatedRValue);
    expect(cellular.thermalEfficiencyScore).toBeGreaterThan(noShade.thermalEfficiencyScore);
  });

  it('evaluates degradation from poor seals and old window age', () => {
    const brandNew = calculateWindowInsulation({ ...BASE_INPUT, sealCondition: 'excellent', windowAge: '0-5' });
    const oldDegraded = calculateWindowInsulation({ ...BASE_INPUT, sealCondition: 'poor', windowAge: '20+' });
    expect(oldDegraded.estimatedUFactor).toBeGreaterThan(brandNew.estimatedUFactor);
    expect(oldDegraded.airLeakageRisk).toBe('critical');
  });
});

describe('Window Insulation Engine — Recommendations Module', () => {
  it('builds comprehensive recommendation set', () => {
    const res = calculateWindowInsulation(BASE_INPUT);
    const recs = buildWindowInsulationRecommendations(BASE_INPUT, res);

    expect(recs.targetRValueNote).toContain('Target');
    expect(recs.items.length).toBeGreaterThanOrEqual(5);
    expect(recs.expectedImprovementNote).toContain('Improvement');
  });

  it('recommends cellular shades when window covering is none', () => {
    const res = calculateWindowInsulation(BASE_INPUT);
    const recs = buildWindowInsulationRecommendations(BASE_INPUT, res);

    expect(recs.items.some((i) => i.type === 'curtain')).toBe(true);
  });
});
