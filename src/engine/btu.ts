/**
 * WindowMetrics — General BTU Calculation Engine
 *
 * Pure TypeScript HVAC heating & cooling load calculation engine.
 * Calculates room area, room volume, cooling BTU load, heating BTU load,
 * recommended HVAC tonnage, power consumption (kW), monthly electricity cost ($),
 * oversizing / undersizing risk assessment, and equipment sizing recommendations.
 *
 * Thermodynamics Rules:
 * - Base Cooling Load: ~20-30 BTU per sq ft (or ~2.5-3.5 BTU per cu ft)
 * - Base Heating Load: ~30-60 BTU per sq ft (depending on climate zone HDD)
 * - 1 Ton of Refrigeration = 12,000 BTU/hr
 * - 1 kW Power @ 14 SEER / COP 3.2 = 3,412 BTU/hr
 */

import type { MeasurementUnit } from '@/types/calculator.js';

export type BtuPurpose = 'cooling' | 'heating' | 'both';
export type BtuRoomType =
  | 'bedroom'
  | 'living-room'
  | 'kitchen'
  | 'office'
  | 'basement'
  | 'garage'
  | 'server-room'
  | 'commercial';

export type BtuClimate = 'cold' | 'moderate' | 'hot';
export type BtuInsulation = 'poor' | 'average' | 'good' | 'excellent';
export type BtuWindowType = 'single-pane' | 'double-pane' | 'triple-pane';
export type BtuOrientation = 'north' | 'south' | 'east' | 'west';
export type BtuSunExposure = 'low' | 'medium' | 'high';
export type BtuLighting = 'standard' | 'bright' | 'commercial';
export type BtuAppliances = 'low' | 'medium' | 'high';

export type BtuWarnLevel = 'error' | 'warning' | 'info';
export type BtuConfidence = 'excellent' | 'good' | 'minor-adjustment' | 'custom-required';

export interface BtuWarning {
  level: BtuWarnLevel;
  code: string;
  message: string;
}

export interface BtuInput {
  roomLengthMm: number;
  roomWidthMm: number;
  ceilingHeightMm: number;
  purpose: BtuPurpose;
  roomType: BtuRoomType;
  climate: BtuClimate;
  insulation: BtuInsulation;
  numberOfWindows: number;
  windowType: BtuWindowType;
  orientation: BtuOrientation;
  sunExposure: BtuSunExposure;
  occupants: number;
  lighting: BtuLighting;
  appliances: BtuAppliances;
}

export interface BtuResult {
  roomAreaM2: number;
  roomAreaSqFt: number;
  roomVolumeM3: number;
  roomVolumeCuFt: number;

  baseCoolingBtu: number;
  baseHeatingBtu: number;

  adjustedCoolingBtu: number;
  adjustedHeatingBtu: number;

  recommendedBtu: number;
  recommendedHvacSize: string; // e.g. "18,000 BTU (1.5 Tons)"
  recommendedTonnage: number; // Tons

  estimatedPowerConsumptionKw: number;
  estimatedMonthlyEnergyCost: number; // $

  efficiencyRating: string;
  oversizingRisk: 'low' | 'moderate' | 'high';
  undersizingRisk: 'low' | 'moderate' | 'high';

  confidence: BtuConfidence;
  warnings: BtuWarning[];
}

// ---------------------------------------------------------------------------
// HVAC Thermodynamics Constants (No magic numbers)
// ---------------------------------------------------------------------------

export const BTU_DEFAULTS = {
  MIN_ROOM_DIMENSION_MM: 1524, // 5 ft
  DEFAULT_CEILING_HEIGHT_MM: 2438.4, // 8 ft
  BTU_PER_TON: 12000,
  SEER_RATING_STANDARD: 14,
  HOURS_OPERATING_PER_DAY: 8,
  COST_PER_KWH: 0.16, // $0.16 / kWh US average
};

export const BASE_COOLING_BTU_PER_SQFT: Record<BtuRoomType, number> = {
  bedroom: 20,
  'living-room': 25,
  kitchen: 35, // High internal heat gains
  office: 25,
  basement: 18, // Cooler naturally
  garage: 30,
  'server-room': 60, // Heavy electronics heat
  commercial: 40,
};

export const BASE_HEATING_BTU_PER_SQFT: Record<BtuClimate, number> = {
  cold: 50,    // High HDD
  moderate: 35, // Average HDD
  hot: 20,     // Low HDD
};

export const CLIMATE_COOLING_MULTIPLIER: Record<BtuClimate, number> = {
  hot: 1.20,
  moderate: 1.0,
  cold: 0.85,
};

export const INSULATION_MULTIPLIER: Record<BtuInsulation, number> = {
  poor: 1.25,
  average: 1.0,
  good: 0.90,
  excellent: 0.80,
};

export const SUN_EXPOSURE_MULTIPLIER: Record<BtuSunExposure, number> = {
  low: 0.90,
  medium: 1.0,
  high: 1.15,
};

export const STANDARD_HVAC_TONNAGE_TIERS = [
  0.5, 0.75, 1.0, 1.25, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 5.0
];

// ---------------------------------------------------------------------------
// Main calculation engine
// ---------------------------------------------------------------------------

export function calculateBTU(input: BtuInput): BtuResult {
  const warnings: BtuWarning[] = [];

  const lMm = Math.max(BTU_DEFAULTS.MIN_ROOM_DIMENSION_MM, input.roomLengthMm);
  const wMm = Math.max(BTU_DEFAULTS.MIN_ROOM_DIMENSION_MM, input.roomWidthMm);
  const hMm = Math.max(1828.8, input.ceilingHeightMm || BTU_DEFAULTS.DEFAULT_CEILING_HEIGHT_MM); // Min 6 ft height

  // 1. Room Area & Volume
  const roomAreaM2 = (lMm * wMm) / 1000000;
  const roomAreaSqFt = roomAreaM2 * 10.76391;

  const roomVolumeM3 = (roomAreaM2 * hMm) / 1000;
  const roomVolumeCuFt = roomVolumeM3 * 35.3147;

  // 2. Base Cooling & Heating Load
  const baseCoolingRate = BASE_COOLING_BTU_PER_SQFT[input.roomType] || 25;
  const baseHeatingRate = BASE_HEATING_BTU_PER_SQFT[input.climate] || 35;

  let baseCoolingBtu = Math.round(roomAreaSqFt * baseCoolingRate);
  let baseHeatingBtu = Math.round(roomAreaSqFt * baseHeatingRate);

  // Height adjustment: add 10% for every foot of ceiling height over 8 ft (2.44m)
  const ceilingHeightFt = hMm / 304.8;
  if (ceilingHeightFt > 8) {
    const heightFactor = 1 + (ceilingHeightFt - 8) * 0.10;
    baseCoolingBtu = Math.round(baseCoolingBtu * heightFactor);
    baseHeatingBtu = Math.round(baseHeatingBtu * heightFactor);
  }

  // 3. Environmental & Internal Load Modifiers
  const climateCoolMod = CLIMATE_COOLING_MULTIPLIER[input.climate] || 1.0;
  const insulMod = INSULATION_MULTIPLIER[input.insulation] || 1.0;
  const sunMod = SUN_EXPOSURE_MULTIPLIER[input.sunExposure] || 1.0;

  // Occupants: 600 BTU/hr per person over 2 people
  const occupantCount = Math.max(1, Math.round(input.occupants || 2));
  const occupantCoolingBtu = Math.max(0, occupantCount - 2) * 600;

  // Windows: Single pane (+1,000 BTU per window), Double (+400), Triple (+200)
  const winCount = Math.max(0, Math.round(input.numberOfWindows || 0));
  const winBtuPerUnit = input.windowType === 'single-pane' ? 1000 : (input.windowType === 'double-pane' ? 400 : 200);
  const windowBtu = winCount * winBtuPerUnit;

  // Lighting & Appliances heat gain
  const lightingBtu = input.lighting === 'bright' ? 1000 : (input.lighting === 'commercial' ? 3000 : 400);
  const applianceBtu = input.appliances === 'high' ? 4000 : (input.appliances === 'medium' ? 1500 : 400);

  // Adjusted Cooling BTU
  let adjustedCoolingBtu = Math.round(
    (baseCoolingBtu * climateCoolMod * insulMod * sunMod) + occupantCoolingBtu + windowBtu + lightingBtu + applianceBtu
  );

  // Adjusted Heating BTU
  let adjustedHeatingBtu = Math.round(baseHeatingBtu * insulMod);

  // 4. Purpose Selection (Cooling, Heating, or Both)
  let rawRecommendedBtu = adjustedCoolingBtu;
  if (input.purpose === 'heating') {
    rawRecommendedBtu = adjustedHeatingBtu;
  } else if (input.purpose === 'both') {
    rawRecommendedBtu = Math.max(adjustedCoolingBtu, adjustedHeatingBtu);
  }

  // Snap to standard HVAC Tonnage Tiers
  const exactTons = rawRecommendedBtu / BTU_DEFAULTS.BTU_PER_TON;
  let recommendedTonnage = STANDARD_HVAC_TONNAGE_TIERS.find((t) => t >= exactTons) || exactTons;
  recommendedTonnage = Math.round(recommendedTonnage * 100) / 100;

  const recommendedBtu = Math.round(recommendedTonnage * BTU_DEFAULTS.BTU_PER_TON);
  const recommendedHvacSize = `${recommendedBtu.toLocaleString()} BTU (${recommendedTonnage} Ton${recommendedTonnage > 1 ? 's' : ''})`;

  // 5. Power Consumption & Energy Cost
  // Power (kW) = BTU / (SEER * 1000)
  const estimatedPowerConsumptionKw = Math.round((recommendedBtu / (BTU_DEFAULTS.SEER_RATING_STANDARD * 1000)) * 100) / 100;

  const kwhPerDay = estimatedPowerConsumptionKw * BTU_DEFAULTS.HOURS_OPERATING_PER_DAY;
  const estimatedMonthlyEnergyCost = Math.round(kwhPerDay * 30 * BTU_DEFAULTS.COST_PER_KWH);

  // 6. Efficiency & Risk Ratings
  let efficiencyRating = '14 SEER (Standard Energy Star)';
  let oversizingRisk: BtuResult['oversizingRisk'] = 'low';
  let undersizingRisk: BtuResult['undersizingRisk'] = 'low';

  if (recommendedBtu > rawRecommendedBtu * 1.3) {
    oversizingRisk = 'high';
  } else if (recommendedBtu > rawRecommendedBtu * 1.15) {
    oversizingRisk = 'moderate';
  }

  if (recommendedBtu < rawRecommendedBtu * 0.95) {
    undersizingRisk = 'high';
  }

  // 7. Confidence & Warnings
  let confidence: BtuConfidence = 'excellent';
  if (input.roomType === 'server-room' || roomAreaSqFt > 1500) {
    confidence = 'minor-adjustment';
  }

  if (input.roomType === 'server-room') {
    warnings.push({
      level: 'warning',
      code: 'SERVER_ROOM_HIGH_HEAT_LOAD',
      message: 'Server rooms generate continuous high heat loads. Dedicated split-system A/C with redundant backup is strongly advised.',
    });
  }

  if (input.windowType === 'single-pane' && winCount >= 4) {
    warnings.push({
      level: 'info',
      code: 'SINGLE_PANE_WINDOW_GAIN',
      message: 'Multiple single-pane windows increase HVAC cooling load by up to 25%. Upgrade glass to reduce equipment size.',
    });
  }

  return {
    roomAreaM2: Math.round(roomAreaM2 * 100) / 100,
    roomAreaSqFt: Math.round(roomAreaSqFt * 10) / 10,
    roomVolumeM3: Math.round(roomVolumeM3 * 100) / 100,
    roomVolumeCuFt: Math.round(roomVolumeCuFt * 10) / 10,

    baseCoolingBtu,
    baseHeatingBtu,

    adjustedCoolingBtu,
    adjustedHeatingBtu,

    recommendedBtu,
    recommendedHvacSize,
    recommendedTonnage,

    estimatedPowerConsumptionKw,
    estimatedMonthlyEnergyCost,

    efficiencyRating,
    oversizingRisk,
    undersizingRisk,

    confidence,
    warnings,
  };
}
