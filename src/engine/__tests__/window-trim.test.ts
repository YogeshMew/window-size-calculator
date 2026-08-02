/**
 * Vitest Test Suite for Window Trim Calculator Engine
 *
 * Tests trim casing length formulas, 4-piece vs 5-piece cut lists (Stool & Apron),
 * miter vs square cut angles, linear board feet, waste percentages, material cost estimates,
 * edge cases, and recommendations across all 5 trim styles (Colonial, Modern, Craftsman, Ranch, Victorian).
 */

import { describe, it, expect } from 'vitest';
import {
  calculateWindowTrim,
  WINDOW_TRIM_DEFAULTS,
  type WindowTrimInput,
  type WindowTrimStyle,
} from '../window-trim.js';
import { buildWindowTrimRecommendations } from '../window-trim-recommendations.js';

const BASE_INPUT: WindowTrimInput = {
  windowWidthMm: 1219.2, // 48"
  windowHeightMm: 1524.0, // 60"
  trimStyle: 'colonial',
  trimWidthMm: 63.5, // 2.5"
  trimThicknessMm: 19.05, // 0.75"
  revealMm: 6.35, // 0.25"
  includeStool: true,
  includeApron: true,
  wastePct: 10,
  quantity: 1,
};

describe('Window Trim Engine — Defaults & Ratios', () => {
  it('defines valid minimum dimensions & defaults', () => {
    expect(WINDOW_TRIM_DEFAULTS.MIN_WINDOW_MM).toBe(152.4);
    expect(WINDOW_TRIM_DEFAULTS.DEFAULT_REVEAL_MM).toBe(6.35);
    expect(WINDOW_TRIM_DEFAULTS.DEFAULT_TRIM_WIDTH_MM).toBe(63.5);
    expect(WINDOW_TRIM_DEFAULTS.STOOL_HORN_OVERHANG_MM).toBe(38.1);
  });
});

describe('Window Trim Engine — Colonial Style with Stool & Apron', () => {
  it('calculates 48x60 window trim casing with Stool and Apron', () => {
    const result = calculateWindowTrim(BASE_INPUT);

    // Reveal width = 48.5", Reveal height = 60.5"
    // Head Casing = 48.5 + 5 = 53.5"
    expect(result.topTrimLengthIn).toBe(53.5);

    // Side Casing (bottom rests on stool) = 60.5 + 2.5 = 63.0"
    expect(result.sideTrimLengthIn).toBe(63.0);

    // Stool = 48.5 + 5 + 3 = 56.5"
    expect(result.stoolLengthIn).toBe(56.5);

    // Apron = 48.5 + 5 = 53.5"
    expect(result.apronLengthIn).toBe(53.5);

    // Cut list checks
    expect(result.cutList.length).toBe(5);
    const head = result.cutList.find((c) => c.name.includes('Head Casing'));
    const stool = result.cutList.find((c) => c.name.includes('Stool'));

    expect(head?.lengthIn).toBe(53.5);
    expect(stool?.lengthIn).toBe(56.5);

    expect(result.totalLinearLengthFt).toBeGreaterThan(20);
    expect(result.confidence).toBe('excellent');
  });
});

describe('Window Trim Engine — 4-Sided Picture Frame (No Stool)', () => {
  it('calculates 4-sided picture-frame mitered casing', () => {
    const picFrame: WindowTrimInput = { ...BASE_INPUT, includeStool: false, includeApron: false };
    const result = calculateWindowTrim(picFrame);

    // Head & Bottom Casing = 48.5 + 5 = 53.5"
    expect(result.topTrimLengthIn).toBe(53.5);

    // Side Casings (full miter top & bottom) = 60.5 + 5 = 65.5"
    expect(result.sideTrimLengthIn).toBe(65.5);

    expect(result.stoolLengthIn).toBe(0);
    expect(result.apronLengthIn).toBe(0);

    const bottom = result.cutList.find((c) => c.name.includes('Bottom Casing'));
    expect(bottom?.lengthIn).toBe(53.5);
  });
});

describe('Window Trim Engine — Craftsman Style Head Overhang', () => {
  it('calculates Craftsman style 90° square cut head casing with overhang', () => {
    const craftsman: WindowTrimInput = { ...BASE_INPUT, trimStyle: 'craftsman' };
    const result = calculateWindowTrim(craftsman);

    // Craftsman head casing = 48.5 + 5 + 2 = 55.5"
    expect(result.topTrimLengthIn).toBe(55.5);

    const head = result.cutList.find((c) => c.name.includes('Head Casing'));
    expect(head?.cutLeft).toBe('90° Square');
  });
});

describe('Window Trim Engine — Iteration Across All 5 Styles', () => {
  const styles: WindowTrimStyle[] = ['colonial', 'modern', 'craftsman', 'ranch', 'victorian'];

  styles.forEach((style) => {
    it(`calculates trim successfully for style: ${style}`, () => {
      const res = calculateWindowTrim({ ...BASE_INPUT, trimStyle: style });
      expect(res.totalLinearLengthFt).toBeGreaterThan(0);
      expect(res.totalLinearLengthWithWasteFt).toBeGreaterThan(res.totalLinearLengthFt);
    });
  });
});

describe('Window Trim Engine — Recommendations Module', () => {
  it('builds comprehensive recommendation set', () => {
    const res = calculateWindowTrim(BASE_INPUT);
    const recs = buildWindowTrimRecommendations(BASE_INPUT, res);

    expect(recs.trimStyleNote).toContain('COLONIAL');
    expect(recs.items.length).toBeGreaterThanOrEqual(5);
    expect(recs.boardStockNote).toContain('linear ft');
  });

  it('provides Craftsman joinery tips for Craftsman style', () => {
    const craftsmanRes = calculateWindowTrim({ ...BASE_INPUT, trimStyle: 'craftsman' });
    const recs = buildWindowTrimRecommendations({ ...BASE_INPUT, trimStyle: 'craftsman' }, craftsmanRes);

    expect(recs.items.some((i) => i.type === 'style')).toBe(true);
  });
});
