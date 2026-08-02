/**
 * Vitest Test Suite for Window Opening Calculator Engine
 *
 * Tests rough opening calculations, finished opening sizes, shim clearance gaps,
 * diagonal squareness tolerances, header framing dimensions, installation difficulties,
 * edge cases, and recommendations.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateWindowOpening,
  WINDOW_OPENING_DEFAULTS,
  INSTALLATION_SHIM_ALLOWANCE_MM,
  type WindowOpeningInput,
} from '../window-opening.js';
import { buildWindowOpeningRecommendations } from '../window-opening-recommendations.js';

const BASE_INPUT: WindowOpeningInput = {
  windowWidthMm: 1219.2, // 48"
  windowHeightMm: 1524.0, // 60"
  installationType: 'new-construction',
  frameThicknessMm: 19.05,
  shimGapMm: 12.7, // 1/2" total width gap (1/4" per side)
  framingMaterial: 'wood',
  windowStyle: 'double-hung',
};

describe('Window Opening Engine — Defaults & Constants', () => {
  it('defines valid minimum dimensions & stud thickness', () => {
    expect(WINDOW_OPENING_DEFAULTS.MIN_WINDOW_WIDTH_MM).toBe(152.4);
    expect(WINDOW_OPENING_DEFAULTS.STUD_THICKNESS_MM).toBe(38.1);
    expect(WINDOW_OPENING_DEFAULTS.MAX_SQUARENESS_DIAG_DIFF_MM).toBe(3.175);
  });

  it('defines valid shim allowances per installation type', () => {
    expect(INSTALLATION_SHIM_ALLOWANCE_MM['new-construction'].side).toBe(6.35);
    expect(INSTALLATION_SHIM_ALLOWANCE_MM.replacement.side).toBe(4.76);
  });
});

describe('Window Opening Engine — Rough Opening Calculations', () => {
  it('calculates 48x60 window rough opening with 1/2" shim gap', () => {
    const result = calculateWindowOpening(BASE_INPUT);
    expect(result.finishedWidthMm).toBe(1219.2);
    expect(result.finishedHeightMm).toBe(1524.0);

    // Rough opening = 48.5" x 60.5"
    expect(result.roughOpeningWidthMm).toBe(1219.2 + 12.7);
    expect(result.roughOpeningHeightMm).toBe(1524.0 + 12.7);
    expect(result.roughOpeningWidthIn).toBe(48.5);
    expect(result.roughOpeningHeightIn).toBe(60.5);

    expect(result.sideClearanceMm).toBe(6.35);
    expect(result.toleranceRating).toBe('exact');
    expect(result.isOpeningAcceptable).toBe(true);
    expect(result.confidence).toBe('excellent');
  });

  it('calculates header width including double 2x studs', () => {
    const res = calculateWindowOpening(BASE_INPUT);
    // Header width = rough opening (1231.9) + 2 * 38.1 = 1308.1mm
    expect(res.framingHeaderWidthMm).toBe(1231.9 + 76.2);
  });

  it('evaluates diagonal squareness length', () => {
    const res = calculateWindowOpening(BASE_INPUT);
    expect(res.diagonalLengthMm).toBeGreaterThan(1500);
    expect(res.maxDiagonalDiffMm).toBe(3.175);
  });

  it('detects tight opening when shim gap is under 1/8"', () => {
    const res = calculateWindowOpening({ ...BASE_INPUT, shimGapMm: 2.0 });
    expect(res.isOpeningTooSmall).toBe(true);
    expect(res.toleranceRating).toBe('tight');
    expect(res.warnings.some((w) => w.code === 'ROUGH_OPENING_TOO_TIGHT')).toBe(true);
  });

  it('detects oversized opening when shim gap exceeds 1"', () => {
    const res = calculateWindowOpening({ ...BASE_INPUT, shimGapMm: 30.0 });
    expect(res.isOpeningOversized).toBe(true);
    expect(res.toleranceRating).toBe('oversized');
    expect(res.warnings.some((w) => w.code === 'ROUGH_OPENING_OVERSIZED')).toBe(true);
  });

  it('rates installation difficulty for Bay and Bow windows as professional', () => {
    const bay = calculateWindowOpening({ ...BASE_INPUT, windowStyle: 'bay' });
    expect(bay.installationDifficulty).toBe('professional');
  });
});

describe('Window Opening Engine — Recommendations Module', () => {
  it('builds comprehensive recommendation set', () => {
    const res = calculateWindowOpening(BASE_INPUT);
    const recs = buildWindowOpeningRecommendations(BASE_INPUT, res);

    expect(recs.recommendedRoughOpeningNote).toContain('48.5"');
    expect(recs.items.length).toBeGreaterThanOrEqual(5);
    expect(recs.shimGuidanceNote).toContain('0.25"');
  });

  it('includes flashing tape guidance for new construction', () => {
    const res = calculateWindowOpening(BASE_INPUT);
    const recs = buildWindowOpeningRecommendations(BASE_INPUT, res);

    expect(recs.items.some((i) => i.type === 'frame')).toBe(true);
  });
});
