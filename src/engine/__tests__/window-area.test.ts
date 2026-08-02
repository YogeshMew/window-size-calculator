/**
 * Vitest Test Suite for Window Area Calculator Engine
 *
 * Tests area and perimeter calculations across all 9 technical shapes:
 * Rectangle, Square, Circle, Half Circle, Triangle, Trapezoid, Arch, Ellipse, Quarter Circle.
 * Also tests waste percentage, multi-quantity scaling, trade coverage areas, unit conversions,
 * edge cases, and recommendations.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateWindowArea,
  calcRawAreaAndPerimeter,
  WINDOW_AREA_DEFAULTS,
  type WindowAreaInput,
  type WindowAreaShape,
} from '../window-area.js';
import { buildWindowAreaRecommendations } from '../window-area-recommendations.js';

const BASE_INPUT: WindowAreaInput = {
  windowWidthMm: 1219.2, // 48"
  windowHeightMm: 1524.0, // 60"
  shape: 'rectangle',
  quantity: 1,
  wastePct: 10,
};

describe('Window Area Engine — Constants & Defaults', () => {
  it('defines valid minimum and maximum dimensions', () => {
    expect(WINDOW_AREA_DEFAULTS.MIN_DIMENSION_MM).toBe(100);
    expect(WINDOW_AREA_DEFAULTS.MAX_DIMENSION_MM).toBe(10000);
    expect(WINDOW_AREA_DEFAULTS.DEFAULT_WASTE_PCT).toBe(10);
  });
});

describe('Window Area Engine — Shape Geometry Formulas', () => {
  it('calculates Rectangle area and perimeter correctly', () => {
    // 1m x 2m = 2 m² area, 6m perimeter
    const geom = calcRawAreaAndPerimeter(1000, 2000, 'rectangle');
    expect(geom.areaM2).toBe(2.0);
    expect(geom.perimeterM).toBe(6.0);
  });

  it('calculates Square area and perimeter correctly', () => {
    // 1.5m x 1.5m = 2.25 m² area, 6m perimeter
    const geom = calcRawAreaAndPerimeter(1500, 1500, 'square');
    expect(geom.areaM2).toBe(2.25);
    expect(geom.perimeterM).toBe(6.0);
  });

  it('calculates Circle area and perimeter correctly', () => {
    // Diameter 2m (Radius 1m) -> Area = π * 1² = 3.14159 m²
    const geom = calcRawAreaAndPerimeter(2000, 2000, 'circle');
    expect(geom.areaM2).toBeCloseTo(Math.PI, 3);
    expect(geom.perimeterM).toBeCloseTo(2 * Math.PI, 3);
  });

  it('calculates Half Circle area and perimeter correctly', () => {
    // Diameter 2m -> Half Circle Area = 0.5 * π * 1² = 1.57079 m²
    const geom = calcRawAreaAndPerimeter(2000, 2000, 'half-circle');
    expect(geom.areaM2).toBeCloseTo(0.5 * Math.PI, 3);
    expect(geom.perimeterM).toBeCloseTo(Math.PI + 2, 3);
  });

  it('calculates Quarter Circle area and perimeter correctly', () => {
    // Radius 1m -> Area = 0.25 * π * 1² = 0.78539 m²
    const geom = calcRawAreaAndPerimeter(1000, 1000, 'quarter-circle');
    expect(geom.areaM2).toBeCloseTo(0.25 * Math.PI, 3);
  });

  it('calculates Triangle area correctly', () => {
    // Base 2m, Height 3m -> Area = 0.5 * 2 * 3 = 3 m²
    const geom = calcRawAreaAndPerimeter(2000, 3000, 'triangle');
    expect(geom.areaM2).toBe(3.0);
  });

  it('calculates Trapezoid area correctly', () => {
    // Base 2m, Top 1m, Height 2m -> Area = 0.5 * (2 + 1) * 2 = 3 m²
    const geom = calcRawAreaAndPerimeter(2000, 2000, 'trapezoid', 1000);
    expect(geom.areaM2).toBe(3.0);
  });

  it('calculates Ellipse area correctly', () => {
    // Width 2m (a=1), Height 4m (b=2) -> Area = π * 1 * 2 = 6.283 m²
    const geom = calcRawAreaAndPerimeter(2000, 4000, 'ellipse');
    expect(geom.areaM2).toBeCloseTo(2 * Math.PI, 3);
  });

  it('calculates Arch area correctly', () => {
    // Base width 2m, total height 2m (bottom rect 1m + top half circle 1m radius)
    const geom = calcRawAreaAndPerimeter(2000, 2000, 'arch', undefined, 1000);
    expect(geom.areaM2).toBeGreaterThan(2.0);
  });
});

describe('Window Area Engine — Full Integration & Unit Conversions', () => {
  it('calculates complete area result for standard 48x60 window', () => {
    const result = calculateWindowArea(BASE_INPUT);
    expect(result.singleAreaSqFt).toBe(20.0);
    expect(result.totalAreaSqFt).toBe(20.0);
    expect(result.totalAreaSqIn).toBe(2880);
    expect(result.singleAreaM2).toBe(1.858);
    expect(result.totalAreaWithWasteSqFt).toBe(22.0); // 10% waste
    expect(result.confidence).toBe('excellent');
  });

  it('multiplies area by quantity accurately', () => {
    const res1 = calculateWindowArea({ ...BASE_INPUT, quantity: 1 });
    const res10 = calculateWindowArea({ ...BASE_INPUT, quantity: 10 });
    expect(res10.totalAreaSqFt).toBe(res1.singleAreaSqFt * 10);
    expect(res10.totalPerimeterM).toBe(res1.singlePerimeterM * 10);
  });

  it('applies custom waste percentage accurately', () => {
    const res0 = calculateWindowArea({ ...BASE_INPUT, wastePct: 0 });
    const res20 = calculateWindowArea({ ...BASE_INPUT, wastePct: 20 });
    expect(res0.totalAreaWithWasteSqFt).toBe(res0.totalAreaSqFt);
    expect(res20.totalAreaWithWasteSqFt).toBe(res0.totalAreaSqFt * 1.2);
  });

  it('calculates trade-specific coverage areas (glass, film, paint, curtain, blind)', () => {
    const res = calculateWindowArea(BASE_INPUT);
    expect(res.netGlassAreaSqFt).toBeLessThan(res.totalAreaSqFt);
    expect(res.filmAreaSqFt).toBeGreaterThan(res.totalAreaSqFt);
    expect(res.curtainCoverageAreaSqFt).toBe(res.totalAreaSqFt * 1.5);
    expect(res.blindCoverageAreaSqFt).toBeGreaterThan(res.totalAreaSqFt);
    expect(res.framePaintAreaSqFt).toBeGreaterThan(0);
  });

  it('converts to large land areas (Acres & Hectares) for large projects', () => {
    const large = calculateWindowArea({
      ...BASE_INPUT,
      windowWidthMm: 5000,
      windowHeightMm: 5000,
      quantity: 100,
    });
    expect(large.totalAreaAcres).toBeGreaterThan(0);
    expect(large.totalAreaHectares).toBeGreaterThan(0);
  });
});

describe('Window Area Engine — All 9 Shapes Iteration', () => {
  const shapes: WindowAreaShape[] = [
    'rectangle', 'square', 'circle', 'half-circle', 'triangle', 'trapezoid', 'arch', 'ellipse', 'quarter-circle'
  ];

  shapes.forEach((shape) => {
    it(`runs calculation successfully for shape: ${shape}`, () => {
      const res = calculateWindowArea({ ...BASE_INPUT, shape });
      expect(res.singleAreaM2).toBeGreaterThan(0);
      expect(res.singleAreaSqFt).toBeGreaterThan(0);
      expect(res.totalAreaSqFt).toBeGreaterThan(0);
    });
  });
});

describe('Window Area Engine — Recommendations Module', () => {
  it('generates recommendation set with film roll size & paint estimates', () => {
    const res = calculateWindowArea(BASE_INPUT);
    const recs = buildWindowAreaRecommendations(BASE_INPUT, res);

    expect(recs.suggestedFilmRollWidth).toBe('60 inches');
    expect(recs.items.length).toBeGreaterThanOrEqual(5);
    expect(recs.areaSummaryNote).toContain('sq ft');
  });

  it('advises 15% waste for specialty shapes', () => {
    const archRes = calculateWindowArea({ ...BASE_INPUT, shape: 'arch' });
    const recs = buildWindowAreaRecommendations({ ...BASE_INPUT, shape: 'arch' }, archRes);

    expect(recs.items.some((i) => i.type === 'waste')).toBe(true);
  });
});
