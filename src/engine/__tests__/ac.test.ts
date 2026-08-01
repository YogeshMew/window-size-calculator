/**
 * WindowMetrics — AC BTU Engine Tests
 *
 * Covers:
 *  - Room area and volume calculations
 *  - Base BTU from area
 *  - Adjusted BTU for all factor combinations
 *  - BTU tier snapping
 *  - Energy estimates
 *  - Unit conversions (tons, HP)
 *  - Cooling suitability assessment
 *  - Warning generation
 *  - Recommendation generation
 *  - Validation functions (room dimension, ceiling, occupants)
 *  - calculateACBTU() end-to-end
 *  - Display formatting helpers
 *  - Edge cases (minimum room, maximum room, extreme climate, server room, etc.)
 */

import { describe, it, expect } from 'vitest';
import {
  // Validation
  validateRoomDimension,
  validateCeilingHeight,
  validateOccupants,
  // Area & volume
  calcRoomArea,
  calcRoomVolume,
  // BTU
  calcBaseBTU,
  calcAdjustedBTU,
  snapToTier,
  // Energy
  calcEnergyEstimate,
  // Conversions
  btuToTons,
  btuToHP,
  // Suitability
  assessCoolingSuitability,
  // Warnings
  buildACWarnings,
  // Main entry point
  calculateACBTU,
  // Format helpers
  formatBTU,
  formatTons,
  formatHP,
  formatWatts,
  formatAnnualKWh,
  formatSqFt,
  formatM2,
  formatRoomArea,
  formatRoomVolume,
  climateLabel,
  sunExposureLabel,
  roomTypeLabel,
  insulationLabel,
  suitabilityDataType,
  // Constants
  DEFAULT_CEILING_HEIGHT_MM,
  MIN_ROOM_DIMENSION_MM,
  MAX_ROOM_DIMENSION_MM,
  MIN_CEILING_HEIGHT_MM,
} from '../ac.js';
import type { ACCalculatorInput } from '../ac.js';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** A standard 12 × 14 ft bedroom in a warm moderate climate — the baseline test case. */
const STANDARD_INPUT: ACCalculatorInput = {
  widthMm:        3_657.6,  // 12 ft
  lengthMm:       4_267.2,  // 14 ft
  ceilingHeightMm: DEFAULT_CEILING_HEIGHT_MM, // 8 ft
  climate:        'moderate',
  sunExposure:    'east',
  roomType:       'bedroom',
  insulation:     'average',
  occupants:      2,
};

// ─────────────────────────────────────────────────────────────────────────────
// Validation — validateRoomDimension
// ─────────────────────────────────────────────────────────────────────────────

describe('validateRoomDimension', () => {
  it('returns valid for a normal room width', () => {
    const result = validateRoomDimension(3_657.6, 'width'); // 12 ft
    expect(result.valid).toBe(true);
  });

  it('returns valid for minimum room dimension', () => {
    const result = validateRoomDimension(MIN_ROOM_DIMENSION_MM, 'width');
    expect(result.valid).toBe(true);
  });

  it('returns valid for maximum room dimension', () => {
    const result = validateRoomDimension(MAX_ROOM_DIMENSION_MM, 'length');
    expect(result.valid).toBe(true);
  });

  it('returns error for zero width', () => {
    const result = validateRoomDimension(0, 'width');
    expect(result.valid).toBe(false);
    expect(result.level).toBe('error');
    expect(result.field).toBe('width');
  });

  it('returns error for negative dimension', () => {
    const result = validateRoomDimension(-100, 'length');
    expect(result.valid).toBe(false);
    expect(result.level).toBe('error');
  });

  it('returns error for dimension below minimum', () => {
    const result = validateRoomDimension(500, 'width'); // < 914 mm
    expect(result.valid).toBe(false);
    expect(result.level).toBe('error');
    expect(result.message).toMatch(/too small/i);
  });

  it('returns error for dimension above maximum', () => {
    const result = validateRoomDimension(31_000, 'length'); // > 30,480 mm
    expect(result.valid).toBe(false);
    expect(result.level).toBe('error');
  });

  it('returns error for NaN', () => {
    const result = validateRoomDimension(NaN, 'width');
    expect(result.valid).toBe(false);
    expect(result.level).toBe('error');
  });

  it('includes the field name in the result', () => {
    const resultW = validateRoomDimension(0, 'width');
    const resultL = validateRoomDimension(0, 'length');
    expect(resultW.field).toBe('width');
    expect(resultL.field).toBe('length');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Validation — validateCeilingHeight
// ─────────────────────────────────────────────────────────────────────────────

describe('validateCeilingHeight', () => {
  it('returns valid for standard 8 ft ceiling', () => {
    expect(validateCeilingHeight(DEFAULT_CEILING_HEIGHT_MM).valid).toBe(true);
  });

  it('returns valid for minimum ceiling height', () => {
    expect(validateCeilingHeight(MIN_CEILING_HEIGHT_MM).valid).toBe(true);
  });

  it('returns valid for a 10 ft ceiling', () => {
    expect(validateCeilingHeight(3_048).valid).toBe(true);
  });

  it('returns error for zero or negative ceiling', () => {
    expect(validateCeilingHeight(0).valid).toBe(false);
    expect(validateCeilingHeight(-100).valid).toBe(false);
  });

  it('returns error for ceiling below minimum', () => {
    const result = validateCeilingHeight(1_500); // < 1829 mm (6 ft)
    expect(result.valid).toBe(false);
    expect(result.level).toBe('error');
    expect(result.message).toMatch(/too low/i);
  });

  it('returns error for ceiling above maximum', () => {
    const result = validateCeilingHeight(10_000); // > 9144 mm (30 ft)
    expect(result.valid).toBe(false);
    expect(result.level).toBe('error');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Validation — validateOccupants
// ─────────────────────────────────────────────────────────────────────────────

describe('validateOccupants', () => {
  it('returns valid for 1 occupant', () => {
    expect(validateOccupants(1).valid).toBe(true);
  });

  it('returns valid for 2 occupants (baseline)', () => {
    expect(validateOccupants(2).valid).toBe(true);
  });

  it('returns valid for 10 occupants', () => {
    expect(validateOccupants(10).valid).toBe(true);
  });

  it('returns error for 0 occupants', () => {
    const result = validateOccupants(0);
    expect(result.valid).toBe(false);
    expect(result.level).toBe('error');
  });

  it('returns error for negative occupants', () => {
    expect(validateOccupants(-1).valid).toBe(false);
  });

  it('returns error for more than 50 occupants', () => {
    const result = validateOccupants(51);
    expect(result.valid).toBe(false);
    expect(result.message).toMatch(/commercial/i);
  });

  it('returns error for non-integer occupants', () => {
    expect(validateOccupants(1.5).valid).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Area and volume calculations
// ─────────────────────────────────────────────────────────────────────────────

describe('calcRoomArea', () => {
  it('calculates area for a 12 × 14 ft room', () => {
    const { areaSqFt } = calcRoomArea(3_657.6, 4_267.2);
    expect(areaSqFt).toBeCloseTo(168, 0); // 12 × 14 = 168 sq ft
  });

  it('calculates m² for a 3 × 4 m room', () => {
    const { areaM2 } = calcRoomArea(3_000, 4_000);
    expect(areaM2).toBeCloseTo(12, 1); // 3 × 4 = 12 m²
  });

  it('is commutative (width × length = length × width)', () => {
    const a = calcRoomArea(3_000, 4_000);
    const b = calcRoomArea(4_000, 3_000);
    expect(a.areaSqFt).toBeCloseTo(b.areaSqFt, 5);
    expect(a.areaM2).toBeCloseTo(b.areaM2, 5);
  });

  it('returns zero area for zero dimensions', () => {
    const { areaSqFt } = calcRoomArea(0, 0);
    expect(areaSqFt).toBe(0);
  });

  it('returns a non-zero mm² value', () => {
    const { areaMm2 } = calcRoomArea(3_000, 4_000);
    expect(areaMm2).toBe(12_000_000);
  });
});

describe('calcRoomVolume', () => {
  it('calculates volume for a 12 × 14 × 8 ft room', () => {
    const { volumeCuFt } = calcRoomVolume(3_657.6, 4_267.2, 2_438.4);
    expect(volumeCuFt).toBeCloseTo(1_344, 0); // 12 × 14 × 8 = 1,344 cu ft
  });

  it('calculates m³ for a 3 × 4 × 2.5 m room', () => {
    const { volumeM3 } = calcRoomVolume(3_000, 4_000, 2_500);
    expect(volumeM3).toBeCloseTo(30, 0); // 3 × 4 × 2.5 = 30 m³
  });

  it('scales linearly with ceiling height', () => {
    const v8ft = calcRoomVolume(3_000, 4_000, 2_438.4);
    const v10ft = calcRoomVolume(3_000, 4_000, 3_048);
    expect(v10ft.volumeCuFt / v8ft.volumeCuFt).toBeCloseTo(10 / 8, 3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BTU calculation
// ─────────────────────────────────────────────────────────────────────────────

describe('calcBaseBTU', () => {
  it('returns 20 BTU per square foot', () => {
    expect(calcBaseBTU(100)).toBe(2_000);
    expect(calcBaseBTU(200)).toBe(4_000);
    expect(calcBaseBTU(500)).toBe(10_000);
  });

  it('returns 0 for 0 sq ft', () => {
    expect(calcBaseBTU(0)).toBe(0);
  });
});

describe('calcAdjustedBTU', () => {
  it('returns base BTU for all-neutral conditions', () => {
    // moderate climate × east exposure × bedroom × average insulation × 8 ft × 2 occupants = 1.0
    const input = STANDARD_INPUT;
    const baseBTU = calcBaseBTU(168); // 12×14 ft room
    const adjusted = calcAdjustedBTU(baseBTU, input, 8);
    // east (1.0) × bedroom (1.0) × average (1.0) × moderate (1.0) × ceiling(8/8=1.0) = 1.0
    expect(adjusted).toBeCloseTo(baseBTU, 0);
  });

  it('increases BTU for hot climate', () => {
    const base = calcBaseBTU(168);
    const moderate = calcAdjustedBTU(base, { ...STANDARD_INPUT, climate: 'moderate' }, 8);
    const hot = calcAdjustedBTU(base, { ...STANDARD_INPUT, climate: 'hot' }, 8);
    expect(hot).toBeGreaterThan(moderate);
  });

  it('decreases BTU for cold climate', () => {
    const base = calcBaseBTU(168);
    const moderate = calcAdjustedBTU(base, { ...STANDARD_INPUT, climate: 'moderate' }, 8);
    const cold = calcAdjustedBTU(base, { ...STANDARD_INPUT, climate: 'cold' }, 8);
    expect(cold).toBeLessThan(moderate);
  });

  it('increases BTU for full sun vs shade', () => {
    const base = calcBaseBTU(168);
    const shade = calcAdjustedBTU(base, { ...STANDARD_INPUT, sunExposure: 'shade' }, 8);
    const fullSun = calcAdjustedBTU(base, { ...STANDARD_INPUT, sunExposure: 'full-sun' }, 8);
    expect(fullSun).toBeGreaterThan(shade);
  });

  it('increases BTU significantly for kitchen vs bedroom', () => {
    const base = calcBaseBTU(168);
    const bedroom = calcAdjustedBTU(base, { ...STANDARD_INPUT, roomType: 'bedroom' }, 8);
    const kitchen = calcAdjustedBTU(base, { ...STANDARD_INPUT, roomType: 'kitchen' }, 8);
    expect(kitchen / bedroom).toBeCloseTo(1.25, 2);
  });

  it('increases BTU massively for server room', () => {
    const base = calcBaseBTU(168);
    const bedroom = calcAdjustedBTU(base, { ...STANDARD_INPUT, roomType: 'bedroom' }, 8);
    const server = calcAdjustedBTU(base, { ...STANDARD_INPUT, roomType: 'server-room' }, 8);
    expect(server / bedroom).toBeCloseTo(1.60, 2);
  });

  it('decreases BTU for excellent insulation', () => {
    const base = calcBaseBTU(168);
    const avg = calcAdjustedBTU(base, { ...STANDARD_INPUT, insulation: 'average' }, 8);
    const excellent = calcAdjustedBTU(base, { ...STANDARD_INPUT, insulation: 'excellent' }, 8);
    expect(excellent).toBeLessThan(avg);
    expect(avg / excellent).toBeCloseTo(1.0 / 0.90, 2);
  });

  it('increases BTU for poor insulation', () => {
    const base = calcBaseBTU(168);
    const avg = calcAdjustedBTU(base, { ...STANDARD_INPUT, insulation: 'average' }, 8);
    const poor = calcAdjustedBTU(base, { ...STANDARD_INPUT, insulation: 'poor' }, 8);
    expect(poor / avg).toBeCloseTo(1.18, 2);
  });

  it('scales with ceiling height above standard', () => {
    const base = calcBaseBTU(168);
    const at8ft = calcAdjustedBTU(base, STANDARD_INPUT, 8);
    const at10ft = calcAdjustedBTU(base, STANDARD_INPUT, 10);
    expect(at10ft / at8ft).toBeCloseTo(10 / 8, 3);
  });

  it('adds 600 BTU per occupant above 2', () => {
    const base = calcBaseBTU(168);
    const two = calcAdjustedBTU(base, { ...STANDARD_INPUT, occupants: 2 }, 8);
    const four = calcAdjustedBTU(base, { ...STANDARD_INPUT, occupants: 4 }, 8);
    expect(four - two).toBeCloseTo(2 * 600, 0);
  });

  it('does not subtract BTU for fewer than 2 occupants', () => {
    const base = calcBaseBTU(168);
    const one = calcAdjustedBTU(base, { ...STANDARD_INPUT, occupants: 1 }, 8);
    const two = calcAdjustedBTU(base, { ...STANDARD_INPUT, occupants: 2 }, 8);
    // 1 occupant should not add negative adjustment
    expect(one).toBeCloseTo(two, 0); // same — no penalty for < 2
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// BTU tier snapping
// ─────────────────────────────────────────────────────────────────────────────

describe('snapToTier', () => {
  it('snaps 5,200 BTU to the 5,000 tier', () => {
    const { recommended } = snapToTier(5_200);
    expect(recommended).toBe(5_000);
  });

  it('snaps 5,600 BTU to the 6,000 tier', () => {
    const { recommended } = snapToTier(5_600);
    expect(recommended).toBe(6_000);
  });

  it('snaps exactly to 8,000 BTU tier', () => {
    const { recommended } = snapToTier(8_000);
    expect(recommended).toBe(8_000);
  });

  it('snaps 11,500 BTU to the 12,000 tier', () => {
    const { recommended } = snapToTier(11_500);
    expect(recommended).toBe(12_000);
  });

  it('returns min tier one step below recommended', () => {
    const { recommended, min } = snapToTier(10_000);
    expect(recommended).toBe(10_000);
    expect(min).toBe(8_000);
  });

  it('returns max tier one step above recommended', () => {
    const { recommended, max } = snapToTier(10_000);
    expect(recommended).toBe(10_000);
    expect(max).toBe(12_000);
  });

  it('min does not go below 5,000 BTU for very small rooms', () => {
    const { min } = snapToTier(100);
    expect(min).toBe(5_000);
  });

  it('max does not exceed 24,000 BTU', () => {
    const { max } = snapToTier(30_000);
    expect(max).toBe(24_000);
  });

  it('returns all three fields', () => {
    const result = snapToTier(8_500);
    expect(result).toHaveProperty('recommended');
    expect(result).toHaveProperty('min');
    expect(result).toHaveProperty('max');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Energy estimates
// ─────────────────────────────────────────────────────────────────────────────

describe('calcEnergyEstimate', () => {
  it('calculates watts from BTU at EER 11', () => {
    // 12,000 BTU / 11 EER = 1,090.9 W
    const { watts } = calcEnergyEstimate(12_000);
    expect(watts).toBeCloseTo(12_000 / 11, 2);
  });

  it('calculates annual kWh', () => {
    const { watts, annualKWh } = calcEnergyEstimate(12_000);
    expect(annualKWh).toBeCloseTo((watts * 1_500) / 1000, 1);
  });

  it('calculates annual cost at $0.16/kWh', () => {
    const { annualKWh, annualCostUSD } = calcEnergyEstimate(12_000);
    expect(annualCostUSD).toBeCloseTo(annualKWh * 0.16, 2);
  });

  it('scales linearly with BTU', () => {
    const a = calcEnergyEstimate(10_000);
    const b = calcEnergyEstimate(20_000);
    expect(b.watts / a.watts).toBeCloseTo(2, 5);
    expect(b.annualKWh / a.annualKWh).toBeCloseTo(2, 5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Unit conversions
// ─────────────────────────────────────────────────────────────────────────────

describe('btuToTons', () => {
  it('12,000 BTU = 1 ton', () => {
    expect(btuToTons(12_000)).toBe(1);
  });

  it('6,000 BTU = 0.5 tons', () => {
    expect(btuToTons(6_000)).toBe(0.5);
  });

  it('24,000 BTU = 2 tons', () => {
    expect(btuToTons(24_000)).toBe(2);
  });
});

describe('btuToHP', () => {
  it('9,000 BTU = 1 HP', () => {
    expect(btuToHP(9_000)).toBe(1);
  });

  it('18,000 BTU = 2 HP', () => {
    expect(btuToHP(18_000)).toBe(2);
  });

  it('HP is proportional to BTU', () => {
    expect(btuToHP(12_000)).toBeCloseTo(12_000 / 9_000, 5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Cooling suitability
// ─────────────────────────────────────────────────────────────────────────────

describe('assessCoolingSuitability', () => {
  it('returns "ideal" for a small/moderate room load', () => {
    const { suitability } = assessCoolingSuitability(8_000, 200, 'bedroom');
    expect(suitability).toBe('ideal');
  });

  it('returns "adequate" for a 13,000 BTU load', () => {
    const { suitability } = assessCoolingSuitability(13_000, 350, 'bedroom');
    expect(suitability).toBe('adequate');
  });

  it('returns "marginal" for a large room load', () => {
    const { suitability } = assessCoolingSuitability(19_000, 550, 'living-room');
    expect(suitability).toBe('marginal');
  });

  it('returns "not-recommended" for oversized rooms', () => {
    const { suitability } = assessCoolingSuitability(26_000, 800, 'office');
    expect(suitability).toBe('not-recommended');
  });

  it('always returns "not-recommended" for server rooms', () => {
    // Even a small server room
    const { suitability } = assessCoolingSuitability(5_000, 100, 'server-room');
    expect(suitability).toBe('not-recommended');
  });

  it('returns a non-empty note with all suitability levels', () => {
    const levels = [
      assessCoolingSuitability(5_000, 100, 'bedroom'),
      assessCoolingSuitability(13_000, 350, 'bedroom'),
      assessCoolingSuitability(19_000, 550, 'bedroom'),
      assessCoolingSuitability(26_000, 800, 'bedroom'),
      assessCoolingSuitability(5_000, 100, 'server-room'),
    ];
    for (const level of levels) {
      expect(level.note.length).toBeGreaterThan(10);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Warning generation
// ─────────────────────────────────────────────────────────────────────────────

describe('buildACWarnings', () => {
  it('returns no warnings for a normal bedroom', () => {
    const warnings = buildACWarnings(168, 8, 'bedroom', 10_000);
    expect(warnings).toHaveLength(0);
  });

  it('warns for a very small room (< 80 sq ft)', () => {
    const warnings = buildACWarnings(60, 8, 'bedroom', 5_000);
    expect(warnings.some(w => w.message.match(/very small/i))).toBe(true);
    expect(warnings.some(w => w.level === 'info')).toBe(true);
  });

  it('warns for a large room (> 500 sq ft)', () => {
    const warnings = buildACWarnings(600, 8, 'living-room', 12_000);
    expect(warnings.some(w => w.level === 'info' || w.level === 'warning')).toBe(true);
  });

  it('warns (warning level) for a very large room (> 700 sq ft)', () => {
    const warnings = buildACWarnings(800, 8, 'office', 24_000);
    expect(warnings.some(w => w.level === 'warning' && w.message.match(/large/i))).toBe(true);
  });

  it('warns for high ceiling (> 10 ft)', () => {
    const warnings = buildACWarnings(200, 12, 'bedroom', 8_000);
    expect(warnings.some(w => w.message.match(/high ceiling|ceiling/i))).toBe(true);
  });

  it('warns for server room', () => {
    const warnings = buildACWarnings(150, 8, 'server-room', 8_000);
    expect(warnings.some(w => w.message.match(/server/i))).toBe(true);
  });

  it('warns when adjusted BTU exceeds 24,000', () => {
    const warnings = buildACWarnings(400, 8, 'office', 25_000);
    expect(warnings.some(w => w.message.match(/24,000/i))).toBe(true);
  });

  it('does NOT warn for normal rooms within expected parameters', () => {
    const warnings = buildACWarnings(200, 8, 'bedroom', 10_000);
    expect(warnings).toHaveLength(0);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Main entry point — calculateACBTU()
// ─────────────────────────────────────────────────────────────────────────────

describe('calculateACBTU', () => {
  it('returns all required result fields', () => {
    const result = calculateACBTU(STANDARD_INPUT);
    expect(result).toHaveProperty('roomAreaSqFt');
    expect(result).toHaveProperty('roomAreaM2');
    expect(result).toHaveProperty('roomVolumeCuFt');
    expect(result).toHaveProperty('roomVolumeM3');
    expect(result).toHaveProperty('baseBTU');
    expect(result).toHaveProperty('adjustedBTU');
    expect(result).toHaveProperty('recommendedBTU');
    expect(result).toHaveProperty('recommendedBTUMin');
    expect(result).toHaveProperty('recommendedBTUMax');
    expect(result).toHaveProperty('recommendedTons');
    expect(result).toHaveProperty('recommendedHP');
    expect(result).toHaveProperty('estimatedWatts');
    expect(result).toHaveProperty('estimatedAnnualKWh');
    expect(result).toHaveProperty('estimatedAnnualCostUSD');
    expect(result).toHaveProperty('coolingSuitability');
    expect(result).toHaveProperty('suitabilityNote');
    expect(result).toHaveProperty('recommendations');
    expect(result).toHaveProperty('warnings');
  });

  it('calculates correct room area for 12 × 14 ft room', () => {
    const result = calculateACBTU(STANDARD_INPUT);
    expect(result.roomAreaSqFt).toBeCloseTo(168, 0);
  });

  it('calculates correct room volume for 12 × 14 × 8 ft room', () => {
    const result = calculateACBTU(STANDARD_INPUT);
    expect(result.roomVolumeCuFt).toBeCloseTo(1_344, 0);
  });

  it('returns a recommended BTU in a standard tier', () => {
    const standardTiers = [5_000, 6_000, 8_000, 10_000, 12_000, 14_000, 15_000, 18_000, 24_000];
    const result = calculateACBTU(STANDARD_INPUT);
    expect(standardTiers).toContain(result.recommendedBTU);
  });

  it('recommendedBTU is consistent with recommended tons', () => {
    const result = calculateACBTU(STANDARD_INPUT);
    expect(result.recommendedTons).toBeCloseTo(result.recommendedBTU / 12_000, 5);
  });

  it('recommendedBTU is consistent with recommended HP', () => {
    const result = calculateACBTU(STANDARD_INPUT);
    expect(result.recommendedHP).toBeCloseTo(result.recommendedBTU / 9_000, 5);
  });

  it('returns at least one recommendation', () => {
    const result = calculateACBTU(STANDARD_INPUT);
    expect(result.recommendations.length).toBeGreaterThan(0);
  });

  it('returns zero warnings for a standard bedroom', () => {
    const result = calculateACBTU(STANDARD_INPUT);
    expect(result.warnings).toHaveLength(0);
  });

  it('returns "not-recommended" suitability for server room', () => {
    const result = calculateACBTU({ ...STANDARD_INPUT, roomType: 'server-room' });
    expect(result.coolingSuitability).toBe('not-recommended');
    expect(result.warnings.some(w => w.message.match(/server/i))).toBe(true);
  });

  it('higher BTU for a very large room', () => {
    const smallRoom = calculateACBTU({ ...STANDARD_INPUT, widthMm: 2_438.4, lengthMm: 3_048 }); // 8×10 ft
    const largeRoom = calculateACBTU({ ...STANDARD_INPUT, widthMm: 6_096, lengthMm: 7_620 });  // 20×25 ft
    expect(largeRoom.recommendedBTU).toBeGreaterThan(smallRoom.recommendedBTU);
  });

  it('very hot climate produces higher BTU than very cold', () => {
    const cold = calculateACBTU({ ...STANDARD_INPUT, climate: 'very-cold' });
    const hot  = calculateACBTU({ ...STANDARD_INPUT, climate: 'very-hot' });
    expect(hot.recommendedBTU).toBeGreaterThanOrEqual(cold.recommendedBTU);
  });

  it('full sun produces higher BTU than shade', () => {
    const shade   = calculateACBTU({ ...STANDARD_INPUT, sunExposure: 'shade' });
    const fullSun = calculateACBTU({ ...STANDARD_INPUT, sunExposure: 'full-sun' });
    expect(fullSun.recommendedBTU).toBeGreaterThanOrEqual(shade.recommendedBTU);
  });

  it('poor insulation produces higher BTU than excellent', () => {
    const excellent = calculateACBTU({ ...STANDARD_INPUT, insulation: 'excellent' });
    const poor      = calculateACBTU({ ...STANDARD_INPUT, insulation: 'poor' });
    expect(poor.recommendedBTU).toBeGreaterThanOrEqual(excellent.recommendedBTU);
  });

  it('annual cost is positive', () => {
    const result = calculateACBTU(STANDARD_INPUT);
    expect(result.estimatedAnnualCostUSD).toBeGreaterThan(0);
  });

  it('annual kWh is positive', () => {
    const result = calculateACBTU(STANDARD_INPUT);
    expect(result.estimatedAnnualKWh).toBeGreaterThan(0);
  });

  it('estimated watts matches BTU / EER', () => {
    const result = calculateACBTU(STANDARD_INPUT);
    expect(result.estimatedWatts).toBeCloseTo(result.recommendedBTU / 11, 1);
  });

  it('BTU range: min <= recommended <= max', () => {
    const result = calculateACBTU(STANDARD_INPUT);
    expect(result.recommendedBTUMin).toBeLessThanOrEqual(result.recommendedBTU);
    expect(result.recommendedBTU).toBeLessThanOrEqual(result.recommendedBTUMax);
  });

  it('produces warnings for a large room', () => {
    const bigRoom = calculateACBTU({
      ...STANDARD_INPUT,
      widthMm: 7_620,   // 25 ft
      lengthMm: 9_144,  // 30 ft
    });
    expect(bigRoom.warnings.length).toBeGreaterThan(0);
  });

  it('produces warnings for a very small room', () => {
    const tinyRoom = calculateACBTU({
      ...STANDARD_INPUT,
      widthMm: 1_524, // 5 ft
      lengthMm: 1_828.8, // 6 ft
    });
    expect(tinyRoom.warnings.some(w => w.message.match(/small/i))).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Display formatting helpers
// ─────────────────────────────────────────────────────────────────────────────

describe('formatBTU', () => {
  it('formats 12,000 BTU with comma separator', () => {
    expect(formatBTU(12_000)).toBe('12,000 BTU');
  });

  it('formats 5,000 BTU', () => {
    expect(formatBTU(5_000)).toBe('5,000 BTU');
  });
});

describe('formatTons', () => {
  it('formats 1 ton with 1 decimal', () => {
    expect(formatTons(1)).toBe('1.0 ton');
  });

  it('formats 1.5 tons', () => {
    expect(formatTons(1.5)).toBe('1.5 ton');
  });
});

describe('formatHP', () => {
  it('formats 1.33 HP to 1 decimal', () => {
    expect(formatHP(1.3333)).toBe('1.3 HP');
  });

  it('formats 2 HP', () => {
    expect(formatHP(2)).toBe('2.0 HP');
  });
});

describe('formatWatts', () => {
  it('rounds to integer and adds W', () => {
    expect(formatWatts(1090.9)).toBe('1,091 W');
  });

  it('formats a round number', () => {
    expect(formatWatts(1000)).toBe('1,000 W');
  });
});

describe('formatAnnualKWh', () => {
  it('rounds to integer and adds kWh', () => {
    expect(formatAnnualKWh(1636.4)).toBe('1,636 kWh');
  });
});

describe('formatSqFt', () => {
  it('formats area in sq ft', () => {
    expect(formatSqFt(168.0)).toBe('168 sq ft');
  });
});

describe('formatM2', () => {
  it('formats area in m² with 1 decimal', () => {
    expect(formatM2(15.6)).toBe('15.6 m²');
  });
});

describe('formatRoomArea', () => {
  it('uses sq ft for imperial units', () => {
    expect(formatRoomArea(168, 15.6, 'in')).toBe('168 sq ft');
    expect(formatRoomArea(168, 15.6, 'ft')).toBe('168 sq ft');
  });

  it('uses m² for metric units', () => {
    expect(formatRoomArea(168, 15.6, 'mm')).toBe('15.6 m²');
    expect(formatRoomArea(168, 15.6, 'cm')).toBe('15.6 m²');
    expect(formatRoomArea(168, 15.6, 'm')).toBe('15.6 m²');
  });
});

describe('formatRoomVolume', () => {
  it('uses cu ft for imperial units', () => {
    expect(formatRoomVolume(1344, 38.1, 'in')).toBe('1344 cu ft');
  });

  it('uses m³ for metric units', () => {
    expect(formatRoomVolume(1344, 38.1, 'mm')).toBe('38.1 m³');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Label helpers
// ─────────────────────────────────────────────────────────────────────────────

describe('label helpers', () => {
  it('climateLabel returns correct labels', () => {
    expect(climateLabel('very-cold')).toBe('Very Cold');
    expect(climateLabel('moderate')).toBe('Moderate');
    expect(climateLabel('very-hot')).toBe('Very Hot');
  });

  it('sunExposureLabel returns correct labels', () => {
    expect(sunExposureLabel('shade')).toBe('Shade');
    expect(sunExposureLabel('full-sun')).toBe('Full Sun');
    expect(sunExposureLabel('north')).toBe('North');
  });

  it('roomTypeLabel returns correct labels', () => {
    expect(roomTypeLabel('bedroom')).toBe('Bedroom');
    expect(roomTypeLabel('server-room')).toBe('Server Room');
    expect(roomTypeLabel('kitchen')).toBe('Kitchen');
  });

  it('insulationLabel returns correct labels', () => {
    expect(insulationLabel('excellent')).toBe('Excellent');
    expect(insulationLabel('average')).toBe('Average');
    expect(insulationLabel('poor')).toBe('Poor');
  });

  it('suitabilityDataType maps to badge types', () => {
    expect(suitabilityDataType('ideal')).toBe('exact');
    expect(suitabilityDataType('adequate')).toBe('close');
    expect(suitabilityDataType('marginal')).toBe('close');
    expect(suitabilityDataType('not-recommended')).toBe('far');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Edge cases
// ─────────────────────────────────────────────────────────────────────────────

describe('edge cases', () => {
  it('handles minimum valid room (just above 3 ft × 3 ft)', () => {
    const result = calculateACBTU({
      ...STANDARD_INPUT,
      widthMm: MIN_ROOM_DIMENSION_MM,
      lengthMm: MIN_ROOM_DIMENSION_MM,
    });
    expect(result.recommendedBTU).toBe(5_000); // minimum tier
  });

  it('returns 5,000 BTU minimum for tiny rooms', () => {
    const result = calculateACBTU({
      ...STANDARD_INPUT,
      widthMm: 1_000,
      lengthMm: 1_000,
    });
    expect(result.recommendedBTU).toBe(5_000);
  });

  it('handles a 1-occupant room (single person)', () => {
    const result = calculateACBTU({ ...STANDARD_INPUT, occupants: 1 });
    expect(result.recommendedBTU).toBeGreaterThan(0);
  });

  it('handles 10 occupants without crashing', () => {
    const result = calculateACBTU({ ...STANDARD_INPUT, occupants: 10 });
    // 8 extra occupants × 600 BTU = 4,800 BTU added
    expect(result.adjustedBTU - calculateACBTU(STANDARD_INPUT).adjustedBTU).toBeCloseTo(8 * 600, 0);
  });

  it('very hot climate + full sun + poor insulation + kitchen stacks correctly', () => {
    // 20 × 25 ft = 500 sq ft kitchen under worst-case environmental factors
    const result = calculateACBTU({
      widthMm:        6_096,       // 20 ft
      lengthMm:       7_620,       // 25 ft
      ceilingHeightMm: DEFAULT_CEILING_HEIGHT_MM,
      climate:        'very-hot',
      sunExposure:    'full-sun',
      roomType:       'kitchen',
      insulation:     'poor',
      occupants:      4,
    });
    // 500 sqft × 20 BTU × 1.35 × 1.18 × 1.25 × 1.18 + 1,200 ≈ 26,000+ BTU → snaps to 24,000 cap
    expect(result.recommendedBTU).toBeGreaterThanOrEqual(18_000);
  });

  it('very cold climate + shade + excellent insulation gives smallest recommendation', () => {
    const result = calculateACBTU({
      widthMm:        3_048,   // 10 ft
      lengthMm:       3_048,   // 10 ft
      ceilingHeightMm: DEFAULT_CEILING_HEIGHT_MM,
      climate:        'very-cold',
      sunExposure:    'shade',
      roomType:       'bedroom',
      insulation:     'excellent',
      occupants:      1,
    });
    expect(result.recommendedBTU).toBe(5_000); // minimum tier
  });

  it('recommendations array contains at least 3 entries for standard input', () => {
    const result = calculateACBTU(STANDARD_INPUT);
    expect(result.recommendations.length).toBeGreaterThanOrEqual(3);
  });

  it('each recommendation has title and value', () => {
    const result = calculateACBTU(STANDARD_INPUT);
    for (const rec of result.recommendations) {
      expect(rec.title.length).toBeGreaterThan(0);
      expect(rec.value.length).toBeGreaterThan(0);
    }
  });
});
