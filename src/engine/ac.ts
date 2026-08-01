/**
 * WindowMetrics — Window AC BTU Calculator Engine
 *
 * Calculates the correct BTU cooling capacity for a room based on:
 *   • Room floor plan dimensions (width × length)
 *   • Ceiling height
 *   • Climate zone
 *   • Sun exposure / window orientation
 *   • Room type (affects heat load)
 *   • Insulation quality
 *   • Number of occupants
 *
 * Methodology:
 *   Base: Energy Star guideline — 20 BTU per square foot of conditioned floor area.
 *   Adjustments: multiplicative factors applied in sequence for climate, sun,
 *   room type, insulation, and ceiling height; additive for occupants.
 *   Result is snapped to the nearest standard window AC BTU tier.
 *
 * All dimension inputs are in millimeters (internal representation).
 * All exported calculation functions are pure and have no side effects.
 */

import type { MeasurementUnit } from '@/types/calculator.js';
import { fromMm } from './units.js';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Climate zone classification for cooling demand. */
export type ClimateZone =
  | 'very-cold'
  | 'cold'
  | 'moderate'
  | 'warm'
  | 'hot'
  | 'very-hot';

/** Window orientation or shading condition. */
export type SunExposure =
  | 'shade'
  | 'north'
  | 'east'
  | 'west'
  | 'south'
  | 'full-sun';

/** Room function — affects internal heat load assumptions. */
export type ACRoomType =
  | 'bedroom'
  | 'living-room'
  | 'kitchen'
  | 'office'
  | 'server-room';

/** Quality of wall/ceiling insulation. */
export type InsulationLevel = 'excellent' | 'average' | 'poor';

/**
 * Overall suitability assessment for window AC in this room.
 *   ideal          — well-suited, window AC handles it comfortably
 *   adequate       — window AC works but may run continuously in peak heat
 *   marginal       — window AC will struggle; a mini-split is worth considering
 *   not-recommended — room is too large or conditions too demanding for window AC
 */
export type CoolingSuitability =
  | 'ideal'
  | 'adequate'
  | 'marginal'
  | 'not-recommended';

/** All inputs required for the full BTU calculation. */
export interface ACCalculatorInput {
  /** Room width in mm */
  widthMm: number;
  /** Room length / depth in mm */
  lengthMm: number;
  /** Ceiling height in mm (default: DEFAULT_CEILING_HEIGHT_MM) */
  ceilingHeightMm: number;
  climate: ClimateZone;
  sunExposure: SunExposure;
  roomType: ACRoomType;
  insulation: InsulationLevel;
  /** Number of occupants (≥ 1) */
  occupants: number;
}

/** A structured recommendation card to show in the results panel. */
export interface ACRecommendation {
  title: string;
  value: string;
  note?: string;
  href?: string;
}

/** A warning or advisory attached to the result. */
export interface ACWarning {
  message: string;
  /** 'info' = neutral, 'warning' = amber, 'error' = red */
  level: 'info' | 'warning' | 'error';
}

/** Complete result returned by calculateACBTU(). */
export interface ACCalculatorResult {
  // Room dimensions
  roomAreaSqFt: number;
  roomAreaM2: number;
  roomVolumeCuFt: number;
  roomVolumeM3: number;

  // BTU calculation steps (for transparency)
  baseBTU: number;
  adjustedBTU: number;

  // Recommended sizing — snapped to a real AC tier
  recommendedBTU: number;
  recommendedBTUMin: number;  // one tier below
  recommendedBTUMax: number;  // one tier above

  // Standard AC sizing conversions
  recommendedTons: number;
  recommendedHP: number;

  // Energy efficiency estimates
  estimatedWatts: number;
  estimatedAnnualKWh: number;
  estimatedAnnualCostUSD: number;

  // Suitability
  coolingSuitability: CoolingSuitability;
  suitabilityNote: string;

  // Structured output for the UI
  recommendations: ACRecommendation[];
  warnings: ACWarning[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Dimension constants
// ─────────────────────────────────────────────────────────────────────────────

/** Minimum valid room dimension: 3 ft / 914 mm. Smaller = closet, not a room. */
export const MIN_ROOM_DIMENSION_MM = 914.4;

/** Maximum valid room dimension: 100 ft / 30,480 mm. */
export const MAX_ROOM_DIMENSION_MM = 30_480;

/** Minimum valid ceiling height: 6 ft / 1,829 mm. */
export const MIN_CEILING_HEIGHT_MM = 1_828.8;

/** Maximum valid ceiling height: 30 ft / 9,144 mm. */
export const MAX_CEILING_HEIGHT_MM = 9_144;

/** Standard residential ceiling height: 8 ft / 2,438.4 mm. */
export const DEFAULT_CEILING_HEIGHT_MM = 2_438.4;

// ─────────────────────────────────────────────────────────────────────────────
// BTU calculation constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Base BTU requirement per square foot of conditioned floor area.
 * Source: Energy Star window AC sizing guidelines (20 BTU/sqft is the standard
 * residential recommendation for average conditions in a moderate climate).
 */
const BASE_BTU_PER_SQFT = 20;

/**
 * Standard window AC BTU tiers available in the US market.
 * Snapping to these ensures the recommendation matches a real purchasable unit.
 */
const STANDARD_BTU_TIERS = [
  5_000,
  6_000,
  8_000,
  10_000,
  12_000,
  14_000,
  15_000,
  18_000,
  24_000,
] as const;

/**
 * Climate zone multipliers applied to base BTU.
 * Source: ASHRAE Handbook — Fundamentals, climate correction factors adapted
 * for residential window AC sizing.
 *   very-cold: 0.85 — low ambient heat load, minimal cooling needed
 *   cold:      0.90
 *   moderate:  1.00 — baseline (temperate climate, summer highs ~85°F / 29°C)
 *   warm:      1.10 — summer highs ~90°F / 32°C
 *   hot:       1.20 — summer highs ~95°F / 35°C
 *   very-hot:  1.35 — summer highs > 100°F / 38°C (desert / tropical)
 */
const CLIMATE_MULTIPLIER: Record<ClimateZone, number> = {
  'very-cold': 0.85,
  'cold':      0.90,
  'moderate':  1.00,
  'warm':      1.10,
  'hot':       1.20,
  'very-hot':  1.35,
};

/**
 * Sun exposure adjustment multipliers.
 * Source: Energy Star recommends +10% for sunny rooms, -10% for shaded rooms.
 *   shade:    0.85 — heavily shaded all day (trees, north-facing in high latitudes)
 *   north:    0.92 — receives little to no direct sun in the Northern Hemisphere
 *   east:     1.00 — morning sun, moderate overall heat gain
 *   west:     1.05 — afternoon sun is hotter; western exposures accumulate more heat
 *   south:    1.10 — receives the most sun throughout the day in the Northern Hemisphere
 *   full-sun: 1.18 — south or west facing with no shade and large window area
 */
const SUN_EXPOSURE_MULTIPLIER: Record<SunExposure, number> = {
  'shade':    0.85,
  'north':    0.92,
  'east':     1.00,
  'west':     1.05,
  'south':    1.10,
  'full-sun': 1.18,
};

/**
 * Room type heat-load multipliers.
 * Different room uses generate different amounts of internal heat.
 *   bedroom:     1.00 — baseline, minimal equipment heat
 *   living-room: 1.05 — TVs, gaming equipment, more occupant activity
 *   kitchen:     1.25 — cooking appliances generate substantial heat
 *   office:      1.12 — computers, monitors, printers add significant heat
 *   server-room: 1.60 — IT equipment is the primary heat source; specialized cooling advised
 */
const ROOM_TYPE_MULTIPLIER: Record<ACRoomType, number> = {
  'bedroom':     1.00,
  'living-room': 1.05,
  'kitchen':     1.25,
  'office':      1.12,
  'server-room': 1.60,
};

/**
 * Insulation quality multipliers.
 * Source: ACCA Manual J residential load calculations adapted for window AC sizing.
 *   excellent: 0.90 — modern double/triple-pane windows, well-sealed walls and attic
 *   average:   1.00 — typical construction, standard windows
 *   poor:      1.18 — single-pane windows, drafty construction, poor attic insulation
 */
const INSULATION_MULTIPLIER: Record<InsulationLevel, number> = {
  'excellent': 0.90,
  'average':   1.00,
  'poor':      1.18,
};

/**
 * Additional BTU per occupant above the baseline of 2 people.
 * Source: ACCA Manual J — each occupant contributes approximately 600 BTU/hr
 * of sensible heat load (body heat at rest / light activity).
 */
const BTU_PER_EXTRA_OCCUPANT = 600;

/** Baseline occupant count assumed in the base BTU calculation (standard for residential). */
const BASELINE_OCCUPANTS = 2;

/**
 * Standard ceiling height used for the base BTU calculation.
 * When the actual ceiling is higher, BTU requirements scale with the ratio.
 */
const STANDARD_CEILING_HEIGHT_FT = 8;

// ─────────────────────────────────────────────────────────────────────────────
// Energy efficiency constants
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Energy Efficiency Ratio for a modern Energy Star certified window AC unit.
 * EER = BTU per watt-hour. Energy Star minimum is 10; typical modern units: 10–12.
 * We use 11 as a representative Energy Star value.
 */
const ENERGY_STAR_EER = 11;

/**
 * Estimated annual usage hours for a window AC unit.
 * Based on: ~5 months cooling season × ~10 hours/day average use (US residential).
 * Source: US EIA residential energy usage data.
 */
const ANNUAL_USAGE_HOURS = 1_500;

/**
 * US average residential electricity price per kilowatt-hour (2024).
 * Source: US Energy Information Administration (EIA) monthly average.
 */
const ELECTRICITY_COST_USD_PER_KWH = 0.16;

// ─────────────────────────────────────────────────────────────────────────────
// Warning thresholds
// ─────────────────────────────────────────────────────────────────────────────

/** Rooms smaller than this are unlikely to need air conditioning (sqft). */
const VERY_SMALL_ROOM_SQFT = 80;

/**
 * At this size, a window AC unit may run continuously without reaching setpoint.
 * Multiple units or a mini-split are worth considering above this threshold.
 */
const LARGE_ROOM_SQFT = 500;

/**
 * Above this size, a window AC is not recommended; central AC or mini-split advised.
 * Matches typical upper-tier window AC coverage of ~700 sqft at 18,000 BTU.
 */
const VERY_LARGE_ROOM_SQFT = 700;

/** Ceiling above this triggers a height advisory (ft). */
const HIGH_CEILING_FT = 10;

/** Commercial-scale room area threshold that suggests a professional HVAC system (sqft). */
const COMMERCIAL_SCALE_SQFT = 600;

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

/** Result of a single room-dimension or ceiling-height validation. */
export interface RoomValidationResult {
  valid: boolean;
  message?: string;
  level?: 'error' | 'warning';
  field?: 'width' | 'length' | 'ceiling' | 'occupants';
}

/**
 * Validate a room width or length in millimeters.
 * Uses wider limits than window validation since rooms can be larger than 30 ft.
 */
export function validateRoomDimension(
  mm: number,
  field: 'width' | 'length',
): RoomValidationResult {
  if (!isFinite(mm) || isNaN(mm)) {
    return { valid: false, level: 'error', field, message: `Enter a valid ${field}.` };
  }
  if (mm <= 0) {
    return { valid: false, level: 'error', field, message: `${field === 'width' ? 'Width' : 'Length'} must be greater than zero.` };
  }
  if (mm < MIN_ROOM_DIMENSION_MM) {
    return {
      valid: false, level: 'error', field,
      message: `Room ${field} is too small. Minimum is 3 ft / 914 mm.`,
    };
  }
  if (mm > MAX_ROOM_DIMENSION_MM) {
    return {
      valid: false, level: 'error', field,
      message: `Room ${field} exceeds the supported maximum of 100 ft / 30,480 mm.`,
    };
  }
  return { valid: true };
}

/**
 * Validate ceiling height in millimeters.
 * Returns a warning (not an error) for unusually high ceilings to allow
 * the calculation to proceed while informing the user.
 */
export function validateCeilingHeight(mm: number): RoomValidationResult {
  if (!isFinite(mm) || isNaN(mm) || mm <= 0) {
    return { valid: false, level: 'error', field: 'ceiling', message: 'Enter a valid ceiling height.' };
  }
  if (mm < MIN_CEILING_HEIGHT_MM) {
    return {
      valid: false, level: 'error', field: 'ceiling',
      message: 'Ceiling height is too low. Minimum is 6 ft / 1,829 mm.',
    };
  }
  if (mm > MAX_CEILING_HEIGHT_MM) {
    return {
      valid: false, level: 'error', field: 'ceiling',
      message: 'Ceiling height exceeds the supported maximum of 30 ft / 9,144 mm.',
    };
  }
  return { valid: true };
}

/**
 * Validate occupant count. Must be a positive integer between 1 and 50.
 */
export function validateOccupants(count: number): RoomValidationResult {
  if (!Number.isInteger(count) || count < 1) {
    return { valid: false, level: 'error', field: 'occupants', message: 'Number of occupants must be at least 1.' };
  }
  if (count > 50) {
    return { valid: false, level: 'error', field: 'occupants', message: 'For more than 50 occupants, consult a commercial HVAC professional.' };
  }
  return { valid: true };
}

// ─────────────────────────────────────────────────────────────────────────────
// Area and volume
// ─────────────────────────────────────────────────────────────────────────────

/** Convert mm² to square feet. */
function mm2ToSqFt(mm2: number): number {
  return mm2 / 92_903.04; // 1 sqft = 92,903.04 mm²
}

/** Convert mm² to square meters. */
function mm2ToM2(mm2: number): number {
  return mm2 / 1_000_000;
}

/** Room area in mm², sq ft, and m². */
export function calcRoomArea(widthMm: number, lengthMm: number): {
  areaMm2: number;
  areaSqFt: number;
  areaM2: number;
} {
  const areaMm2 = widthMm * lengthMm;
  return {
    areaMm2,
    areaSqFt: mm2ToSqFt(areaMm2),
    areaM2:   mm2ToM2(areaMm2),
  };
}

/** Room volume in cubic feet and cubic meters. */
export function calcRoomVolume(
  widthMm: number,
  lengthMm: number,
  ceilingHeightMm: number,
): {
  volumeCuFt: number;
  volumeM3: number;
} {
  const volumeMm3 = widthMm * lengthMm * ceilingHeightMm;
  return {
    volumeCuFt: volumeMm3 / 28_316_846.6, // 1 cu ft = 28,316,846.6 mm³
    volumeM3:   volumeMm3 / 1_000_000_000,
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// BTU calculation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate base BTU from room area alone (no adjustments applied).
 * Base = 20 BTU × area in square feet.
 */
export function calcBaseBTU(areaSqFt: number): number {
  return areaSqFt * BASE_BTU_PER_SQFT;
}

/**
 * Apply all environmental and usage adjustments to the base BTU.
 *
 * Adjustment order:
 *   1. Climate zone multiplier
 *   2. Sun exposure multiplier
 *   3. Room type multiplier
 *   4. Insulation multiplier
 *   5. Ceiling height ratio (volume adjustment above standard 8 ft)
 *   6. Additive occupant adjustment (600 BTU × occupants above 2)
 *
 * @param baseBTU     Raw BTU from area calculation
 * @param input       Full calculator input
 * @param ceilingFt   Ceiling height in feet (derived from mm)
 */
export function calcAdjustedBTU(
  baseBTU: number,
  input: ACCalculatorInput,
  ceilingFt: number,
): number {
  const climateFactor   = CLIMATE_MULTIPLIER[input.climate];
  const sunFactor       = SUN_EXPOSURE_MULTIPLIER[input.sunExposure];
  const roomTypeFactor  = ROOM_TYPE_MULTIPLIER[input.roomType];
  const insulationFactor = INSULATION_MULTIPLIER[input.insulation];

  // Ceiling height scaling: if ceiling is taller than standard 8 ft, the
  // volume of air to cool is proportionally larger.
  const ceilingFactor = ceilingFt / STANDARD_CEILING_HEIGHT_FT;

  let adjusted = baseBTU
    * climateFactor
    * sunFactor
    * roomTypeFactor
    * insulationFactor
    * ceilingFactor;

  // Additional BTU for each occupant above the 2-person baseline
  const extraOccupants = Math.max(0, input.occupants - BASELINE_OCCUPANTS);
  adjusted += extraOccupants * BTU_PER_EXTRA_OCCUPANT;

  return adjusted;
}

/**
 * Snap an adjusted BTU value to the nearest standard window AC tier.
 * Returns the matched tier, the tier below, and the tier above.
 */
export function snapToTier(btu: number): {
  recommended: number;
  min: number;
  max: number;
} {
  const tiers = [...STANDARD_BTU_TIERS];

  // Find the closest tier
  let closestIdx = 0;
  let minDiff = Infinity;
  for (let i = 0; i < tiers.length; i++) {
    const diff = Math.abs(tiers[i] - btu);
    if (diff < minDiff) { minDiff = diff; closestIdx = i; }
  }

  const recommended = tiers[closestIdx];
  const min = tiers[Math.max(0, closestIdx - 1)];
  const max = tiers[Math.min(tiers.length - 1, closestIdx + 1)];

  return { recommended, min, max };
}

// ─────────────────────────────────────────────────────────────────────────────
// Energy estimates
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Estimate energy consumption and annual running cost.
 *
 * @param recommendedBTU  Snapped BTU recommendation
 * @returns Watts drawn, annual kWh, and annual USD cost
 */
export function calcEnergyEstimate(recommendedBTU: number): {
  watts: number;
  annualKWh: number;
  annualCostUSD: number;
} {
  const watts = recommendedBTU / ENERGY_STAR_EER;
  const annualKWh = (watts * ANNUAL_USAGE_HOURS) / 1000;
  const annualCostUSD = annualKWh * ELECTRICITY_COST_USD_PER_KWH;
  return { watts, annualKWh, annualCostUSD };
}

// ─────────────────────────────────────────────────────────────────────────────
// Unit conversions for display
// ─────────────────────────────────────────────────────────────────────────────

/** BTU to refrigeration tons. 1 ton = 12,000 BTU/hr. */
export function btuToTons(btu: number): number {
  return btu / 12_000;
}

/**
 * BTU to horsepower (HVAC rule of thumb).
 * 1 HP ≈ 9,000 BTU/hr for window AC (compressor efficiency ~3.5 COP).
 * Note: This is a residential approximation — actual HP varies by model.
 */
export function btuToHP(btu: number): number {
  return btu / 9_000;
}

// ─────────────────────────────────────────────────────────────────────────────
// Cooling suitability assessment
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Assess whether a window AC is suitable for this room and return a note.
 * Assessment is based on adjusted BTU requirements and room type.
 */
export function assessCoolingSuitability(
  adjustedBTU: number,
  areaSqFt: number,
  roomType: ACRoomType,
): { suitability: CoolingSuitability; note: string } {
  // Server rooms always get a "not-recommended" — they need precision cooling
  if (roomType === 'server-room') {
    return {
      suitability: 'not-recommended',
      note: 'Server rooms require precision cooling (CRAC/CRAH units). A window AC cannot maintain the temperature and humidity control that IT equipment requires.',
    };
  }

  // Assess by cooling load
  if (adjustedBTU > 24_000 || areaSqFt > VERY_LARGE_ROOM_SQFT) {
    return {
      suitability: 'not-recommended',
      note: 'This room exceeds the practical limit for window AC. Consider a mini-split, ducted system, or multiple units.',
    };
  }
  if (adjustedBTU > 18_000 || areaSqFt > LARGE_ROOM_SQFT) {
    return {
      suitability: 'marginal',
      note: 'A window AC can cool this room but may run near continuously in peak heat. A mini-split system would be more efficient and comfortable.',
    };
  }
  if (adjustedBTU > 12_000) {
    return {
      suitability: 'adequate',
      note: 'A window AC will keep this room cool, though it may take time to reach setpoint on very hot days.',
    };
  }
  return {
    suitability: 'ideal',
    note: 'This room is well-suited for a window AC unit. Correct sizing will provide efficient, comfortable cooling.',
  };
}

// ─────────────────────────────────────────────────────────────────────────────
// Recommendations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build the array of structured recommendations based on the result.
 * Each recommendation is suitable for display in a RecommendationCard.
 */
export function buildACRecommendations(
  result: Omit<ACCalculatorResult, 'recommendations' | 'warnings'>,
  input: ACCalculatorInput,
): ACRecommendation[] {
  const recs: ACRecommendation[] = [];

  // Primary: BTU recommendation
  const { recommendedBTU, recommendedBTUMin, recommendedBTUMax, recommendedTons } = result;
  const tierLabel = recommendedBTUMin === recommendedBTUMax
    ? `${(recommendedBTU / 1000).toFixed(0)},000 BTU`
    : `${(recommendedBTUMin / 1000).toFixed(0)},000–${(recommendedBTUMax / 1000).toFixed(0)},000 BTU`;

  recs.push({
    title: 'Recommended BTU range',
    value: tierLabel,
    note: `For this room, look for window AC units rated ${(recommendedBTU / 1000).toFixed(0)},000 BTU. The range accounts for minor environmental variation.`,
  });

  // Tonnage / sizing class
  const tonLabel =
    recommendedTons < 0.5  ? '< 0.5 ton (small room unit)' :
    recommendedTons < 1.0  ? '0.5–1 ton (standard window AC)' :
    recommendedTons < 1.5  ? '1–1.5 ton (large window AC)' :
    recommendedTons < 2.0  ? '1.5–2 ton (high-capacity window AC)' :
                             '2 ton+ (consider mini-split)';
  recs.push({
    title: 'Sizing class',
    value: tonLabel,
    note: '1 ton = 12,000 BTU. Window AC units typically top out at 2 tons (24,000 BTU).',
  });

  // Energy efficiency recommendation
  const { estimatedAnnualCostUSD, estimatedAnnualKWh } = result;
  recs.push({
    title: 'Estimated annual running cost',
    value: `$${estimatedAnnualCostUSD.toFixed(0)} / year`,
    note: `≈ ${estimatedAnnualKWh.toFixed(0)} kWh/year at $${ELECTRICITY_COST_USD_PER_KWH}/kWh. Based on ${ANNUAL_USAGE_HOURS.toLocaleString()} hrs of use and an EER of ${ENERGY_STAR_EER}.`,
  });

  // Insulation tip
  if (input.insulation === 'poor') {
    recs.push({
      title: 'Insulation improvement',
      value: 'Up to 15% savings',
      note: 'Sealing air gaps and upgrading to double-pane windows can reduce cooling needs by up to 15% — potentially dropping you one BTU tier.',
    });
  }

  // Kitchen tip
  if (input.roomType === 'kitchen') {
    recs.push({
      title: 'Kitchen heat management',
      value: 'Use exhaust fan when cooking',
      note: 'Running an exhaust or range hood fan while cooking can remove 30–40% of kitchen heat before the AC has to work against it.',
    });
  }

  // Sun shading tip
  if (input.sunExposure === 'south' || input.sunExposure === 'full-sun') {
    recs.push({
      title: 'Window shading',
      value: 'Reduces BTU need by up to 15%',
      note: 'Exterior shades, awnings, or solar film on south-facing windows can significantly reduce heat gain before it enters the room.',
    });
  }

  return recs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Warnings
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate advisory warnings based on room characteristics.
 * Warnings inform the user without blocking the calculation.
 */
export function buildACWarnings(
  areaSqFt: number,
  ceilingFt: number,
  roomType: ACRoomType,
  adjustedBTU: number,
): ACWarning[] {
  const warnings: ACWarning[] = [];

  if (areaSqFt < VERY_SMALL_ROOM_SQFT) {
    warnings.push({
      level: 'info',
      message: `This is a very small room (${areaSqFt.toFixed(0)} sq ft). A window AC may be oversized — a portable fan or small tower fan might be sufficient.`,
    });
  }

  if (areaSqFt > VERY_LARGE_ROOM_SQFT) {
    warnings.push({
      level: 'warning',
      message: `Large room (${areaSqFt.toFixed(0)} sq ft). Window AC units typically cover up to 700 sq ft. Consider a mini-split or multiple units.`,
    });
  } else if (areaSqFt > LARGE_ROOM_SQFT) {
    warnings.push({
      level: 'info',
      message: `This room (${areaSqFt.toFixed(0)} sq ft) is on the larger side for a window AC. Correct placement and sealing the room are important for efficiency.`,
    });
  }

  if (ceilingFt > HIGH_CEILING_FT) {
    warnings.push({
      level: 'info',
      message: `High ceiling (${ceilingFt.toFixed(1)} ft). Your ceiling is taller than the standard 8 ft, increasing the air volume that needs cooling. The BTU estimate accounts for this.`,
    });
  }

  if (roomType === 'server-room') {
    warnings.push({
      level: 'warning',
      message: 'Server rooms require precision cooling with humidity control. A standard window AC is not designed for IT environments — consider a dedicated CRAC unit.',
    });
  }

  if (roomType !== 'server-room' && areaSqFt >= COMMERCIAL_SCALE_SQFT) {
    warnings.push({
      level: 'info',
      message: `At ${areaSqFt.toFixed(0)} sq ft, this may be a commercial-scale space. For offices or retail, consult an HVAC professional for a Manual J load calculation.`,
    });
  }

  if (adjustedBTU > 24_000) {
    warnings.push({
      level: 'warning',
      message: 'Calculated load exceeds the maximum available window AC capacity (24,000 BTU). A ductless mini-split or central air system is recommended.',
    });
  }

  return warnings;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main calculation entry point
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the complete AC BTU recommendation for a room.
 *
 * This is the primary API. All individual sub-functions are also exported
 * for unit testing and incremental calculations.
 *
 * @param input   All room and environmental parameters (dimensions in mm)
 * @returns       Complete result including BTU, energy estimates, warnings, recommendations
 *
 * @example
 * calculateACBTU({
 *   widthMm: 3657.6,   // 12 ft
 *   lengthMm: 4267.2,  // 14 ft
 *   ceilingHeightMm: 2438.4,  // 8 ft
 *   climate: 'warm',
 *   sunExposure: 'south',
 *   roomType: 'bedroom',
 *   insulation: 'average',
 *   occupants: 2,
 * })
 */
export function calculateACBTU(input: ACCalculatorInput): ACCalculatorResult {
  // 1. Room dimensions
  const { areaSqFt, areaM2 } = calcRoomArea(input.widthMm, input.lengthMm);
  const { volumeCuFt, volumeM3 } = calcRoomVolume(
    input.widthMm, input.lengthMm, input.ceilingHeightMm,
  );

  // 2. Ceiling height in feet for adjustment calculation
  const ceilingFt = fromMm(input.ceilingHeightMm, 'ft');

  // 3. BTU calculation
  const baseBTU = calcBaseBTU(areaSqFt);
  const adjustedBTU = calcAdjustedBTU(baseBTU, input, ceilingFt);
  const { recommended, min, max } = snapToTier(adjustedBTU);

  // 4. Unit conversions
  const recommendedTons = btuToTons(recommended);
  const recommendedHP   = btuToHP(recommended);

  // 5. Energy estimates
  const { watts, annualKWh, annualCostUSD } = calcEnergyEstimate(recommended);

  // 6. Suitability
  const { suitability, note: suitabilityNote } = assessCoolingSuitability(
    adjustedBTU, areaSqFt, input.roomType,
  );

  // 7. Assemble partial result (before recommendations — they reference the result)
  const partialResult = {
    roomAreaSqFt:         areaSqFt,
    roomAreaM2:           areaM2,
    roomVolumeCuFt:       volumeCuFt,
    roomVolumeM3:         volumeM3,
    baseBTU,
    adjustedBTU,
    recommendedBTU:       recommended,
    recommendedBTUMin:    min,
    recommendedBTUMax:    max,
    recommendedTons,
    recommendedHP,
    estimatedWatts:       watts,
    estimatedAnnualKWh:   annualKWh,
    estimatedAnnualCostUSD: annualCostUSD,
    coolingSuitability:   suitability,
    suitabilityNote,
  };

  // 8. Build recommendations and warnings
  const recommendations = buildACRecommendations(partialResult, input);
  const warnings        = buildACWarnings(areaSqFt, ceilingFt, input.roomType, adjustedBTU);

  return { ...partialResult, recommendations, warnings };
}

// ─────────────────────────────────────────────────────────────────────────────
// Display helpers
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Format a BTU value for display (e.g. 12000 → "12,000 BTU").
 * Rounds to the nearest hundred for large values.
 */
export function formatBTU(btu: number): string {
  return `${btu.toLocaleString('en-US')} BTU`;
}

/**
 * Format tons for display (e.g. 1.5 → "1.5 ton").
 * Uses 1 decimal place.
 */
export function formatTons(tons: number): string {
  return `${tons.toFixed(1)} ton`;
}

/**
 * Format horsepower for display (e.g. 1.33 → "1.3 HP").
 * Uses 1 decimal place.
 */
export function formatHP(hp: number): string {
  return `${hp.toFixed(1)} HP`;
}

/**
 * Format watts for display (e.g. 1090.9 → "1,091 W").
 */
export function formatWatts(watts: number): string {
  return `${Math.round(watts).toLocaleString('en-US')} W`;
}

/**
 * Format annual kWh for display (e.g. 1636.4 → "1,636 kWh").
 */
export function formatAnnualKWh(kwh: number): string {
  return `${Math.round(kwh).toLocaleString('en-US')} kWh`;
}

/**
 * Format an area in sq ft (e.g. 168.0 → "168 sq ft").
 */
export function formatSqFt(sqft: number): string {
  return `${sqft.toFixed(0)} sq ft`;
}

/**
 * Format an area in m² (e.g. 15.6 → "15.6 m²").
 */
export function formatM2(m2: number): string {
  return `${m2.toFixed(1)} m²`;
}

/**
 * Format a room area for display in the appropriate unit system.
 * Uses sq ft for imperial, m² for metric.
 */
export function formatRoomArea(sqFt: number, m2: number, unit: MeasurementUnit): string {
  const isMetric = unit === 'mm' || unit === 'cm' || unit === 'm';
  return isMetric ? formatM2(m2) : formatSqFt(sqFt);
}

/**
 * Format a room volume for display (cu ft or m³).
 */
export function formatRoomVolume(cuFt: number, m3: number, unit: MeasurementUnit): string {
  const isMetric = unit === 'mm' || unit === 'cm' || unit === 'm';
  return isMetric
    ? `${m3.toFixed(1)} m³`
    : `${cuFt.toFixed(0)} cu ft`;
}

/**
 * Get a human-readable label for a climate zone.
 */
export function climateLabel(zone: ClimateZone): string {
  const labels: Record<ClimateZone, string> = {
    'very-cold': 'Very Cold',
    'cold':      'Cold',
    'moderate':  'Moderate',
    'warm':      'Warm',
    'hot':       'Hot',
    'very-hot':  'Very Hot',
  };
  return labels[zone];
}

/**
 * Get a human-readable label for sun exposure.
 */
export function sunExposureLabel(exposure: SunExposure): string {
  const labels: Record<SunExposure, string> = {
    'shade':    'Shade',
    'north':    'North',
    'east':     'East',
    'west':     'West',
    'south':    'South',
    'full-sun': 'Full Sun',
  };
  return labels[exposure];
}

/**
 * Get a human-readable label for room type.
 */
export function roomTypeLabel(type: ACRoomType): string {
  const labels: Record<ACRoomType, string> = {
    'bedroom':     'Bedroom',
    'living-room': 'Living Room',
    'kitchen':     'Kitchen',
    'office':      'Office',
    'server-room': 'Server Room',
  };
  return labels[type];
}

/**
 * Get a human-readable label for insulation level.
 */
export function insulationLabel(level: InsulationLevel): string {
  const labels: Record<InsulationLevel, string> = {
    'excellent': 'Excellent',
    'average':   'Average',
    'poor':      'Poor',
  };
  return labels[level];
}

/**
 * Get a display color class / data attribute value for the suitability level.
 */
export function suitabilityDataType(suitability: CoolingSuitability): string {
  const map: Record<CoolingSuitability, string> = {
    'ideal':           'exact',
    'adequate':        'close',
    'marginal':        'close',
    'not-recommended': 'far',
  };
  return map[suitability];
}
