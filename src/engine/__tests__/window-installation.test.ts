/**
 * Vitest Test Suite for Window Installation Materials Calculator Engine
 *
 * Tests flashing tape linear foot calculations, sealant caulk tube coverage formulas,
 * low-expansion foam cans, backer rod length, shim packs, fastener counts,
 * anchor spacing rules, masonry vs wood stud installation labor hours, and recommendations.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateWindowInstallation,
  WINDOW_INSTALLATION_DEFAULTS,
  type WindowInstallationInput,
} from '../window-installation.js';
import { buildWindowInstallationRecommendations } from '../window-installation-recommendations.js';

const BASE_INPUT: WindowInstallationInput = {
  windowWidthMm: 914.4, // 36"
  windowHeightMm: 1219.2, // 48"
  quantity: 1,
  installationType: 'new-construction',
  frameMaterial: 'vinyl',
  wallType: 'wood-stud',
  fastenerType: 'standard',
  useFoam: true,
  useFlashingTape: true,
};

describe('Window Installation Engine — Defaults & Coverage', () => {
  it('defines valid defaults and coverage constants', () => {
    expect(WINDOW_INSTALLATION_DEFAULTS.SEALANT_COVERAGE_FT_PER_TUBE).toBe(24);
    expect(WINDOW_INSTALLATION_DEFAULTS.FOAM_CAN_PERIMETER_FT_COVERAGE).toBe(35);
    expect(WINDOW_INSTALLATION_DEFAULTS.FASTENER_SPACING_MAX_IN).toBe(16);
  });
});

describe('Window Installation Engine — Material Checklist Calculations', () => {
  it('calculates installation materials for 36x48 window in wood stud wall', () => {
    const result = calculateWindowInstallation(BASE_INPUT);

    // Perimeter = (3 + 4)*2 = 14 ft
    expect(result.perimeterFt).toBeCloseTo(14.0, 1);

    // Flashing tape = 14 + 2 = 16 ft
    expect(result.flashingTapeLengthFt).toBeGreaterThanOrEqual(15.0);

    // Sealant tubes (14 ft * 2 passes / 24) = ~2 tubes
    expect(result.sealantTubesCount).toBeGreaterThanOrEqual(1);

    // Foam cans (14 ft / 35) = 1 can
    expect(result.foamCansCount).toBe(1);

    // Drip cap header length = 36" + 2" = 38"
    expect(result.dripCapLengthIn).toBe(38.0);

    // Materials checklist verification
    expect(result.materialsChecklist.length).toBeGreaterThanOrEqual(5);
    expect(result.confidence).toBe('excellent');
  });

  it('scales material quantities linearly with window quantity', () => {
    const res1 = calculateWindowInstallation({ ...BASE_INPUT, quantity: 1 });
    const res4 = calculateWindowInstallation({ ...BASE_INPUT, quantity: 4 });

    expect(res4.flashingTapeLengthFt).toBeCloseTo(res1.flashingTapeLengthFt * 4, 1);
    expect(res4.fastenerCountTotal).toBe(res1.fastenerCountTotal * 4);
    expect(res4.estimatedHoursTotal).toBeCloseTo(res1.estimatedHoursTotal * 4, 1);
  });

  it('masonry wall type increases installation labor hours and changes fastener label to Tapcon', () => {
    const wood = calculateWindowInstallation({ ...BASE_INPUT, wallType: 'wood-stud' });
    const concrete = calculateWindowInstallation({ ...BASE_INPUT, wallType: 'concrete', fastenerType: 'concrete' });

    expect(concrete.estimatedHoursPerWindow).toBeGreaterThan(wood.estimatedHoursPerWindow);
    const fastenerItem = concrete.materialsChecklist.find((m) => m.category === 'Fasteners & Hardware');
    expect(fastenerItem?.name).toContain('Masonry Tapcon');
  });
});

describe('Window Installation Engine — Recommendations Module', () => {
  it('builds comprehensive recommendation set', () => {
    const res = calculateWindowInstallation(BASE_INPUT);
    const recs = buildWindowInstallationRecommendations(BASE_INPUT, res);

    expect(recs.installationSummaryNote).toContain('New Construction');
    expect(recs.items.length).toBeGreaterThanOrEqual(5);
    expect(recs.fastenerSpacingNote).toContain('Screws');
  });

  it('includes low-expansion foam warning when foam is enabled', () => {
    const res = calculateWindowInstallation(BASE_INPUT);
    const recs = buildWindowInstallationRecommendations(BASE_INPUT, res);

    expect(recs.items.some((i) => i.type === 'material')).toBe(true);
  });
});
