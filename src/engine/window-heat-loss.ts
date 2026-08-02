/**
 * WindowMetrics — Window Heat Loss Calculation Engine
 *
 * Pure TypeScript implementation for calculating conduction heat loss rate (BTU/hr & Watts),
 * daily, monthly, and annual thermal energy loss (kWh), temperature differential ΔT,
 * heating fuel cost impact, energy efficiency ratings, and thermal loss categories.
 *
 * Physics Equations:
 * - ΔT = T_indoor - T_outdoor (°F or °C)
 * - Heat Loss Rate Q (BTU/hr) = U_factor * Area_sqft * ΔT_fahrenheit
 * - Heat Loss Rate Q (Watts) = Q (BTU/hr) / 3.41214
 * - Daily Heat Loss (kWh) = (Q_watts * 24 hrs) / 1000
 */

import type { MeasurementUnit } from '@/types/calculator.js';

export type WindowHeatLossType = 'single-pane' | 'double-pane' | 'triple-pane' | 'low-e';
export type WindowHeatLossFrameMaterial = 'vinyl' | 'wood' | 'aluminum' | 'fiberglass';
export type WindowHeatLossClimate = 'cold' | 'moderate' | 'hot';
export type WindowHeatLossExposure = 'north' | 'south' | 'east' | 'west';

export type WindowHeatLossWarnLevel = 'error' | 'warning' | 'info';
export type WindowHeatLossConfidence = 'excellent' | 'good' | 'minor-adjustment' | 'custom-required';

export interface WindowHeatLossWarning {
  level: WindowHeatLossWarnLevel;
  code: string;
  message: string;
}

export interface WindowHeatLossInput {
  windowWidthMm: number;
  windowHeightMm: number;
  numberOfWindows: number;
  indoorTempF: number;
  outdoorTempF: number;
  windowType: WindowHeatLossType;
  frameMaterial: WindowHeatLossFrameMaterial;
  climate: WindowHeatLossClimate;
  exposure: WindowHeatLossExposure;
}

export interface WindowHeatLossResult {
  glassAreaM2: number;
  glassAreaSqFt: number;
  totalAreaSqFt: number;
  tempDifferenceF: number;
  tempDifferenceC: number;
  uFactorBtu: number; // BTU / (hr · ft² · °F)
  uFactorW: number;   // W / (m² · K)
  heatLossBtuHr: number;
  heatLossWatts: number;
  dailyHeatLossKwh: number;
  monthlyHeatLossKwh: number;
  annualHeatLossKwh: number;
  estimatedHeatingCostAnnual: number;
  estimatedHeatingCostMonthly: number;
  energyRating: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F';
  heatLossCategory: 'minimal' | 'moderate' | 'high' | 'severe';
  confidence: WindowHeatLossConfidence;
  warnings: WindowHeatLossWarning[];
}

// ---------------------------------------------------------------------------
// Thermal physics constants & pricing tables (No magic numbers)
// ---------------------------------------------------------------------------

export const WINDOW_HEAT_LOSS_DEFAULTS = {
  MIN_WINDOW_WIDTH_MM: 152.4, // 6"
  MIN_WINDOW_HEIGHT_MM: 152.4, // 6"
  BTU_HR_TO_WATTS: 3.41214,
  HEATING_DAYS_PER_YEAR: 180, // Average heating season days
  AVG_HEATING_COST_PER_KWH: 0.16, // $0.16 / kWh US national avg
};

/** U-Factors (BTU / hr·ft²·°F) by Glazing Type */
export const U_FACTORS_HEAT_LOSS: Record<WindowHeatLossType, number> = {
  'single-pane': 1.10,
  'double-pane': 0.48,
  'triple-pane': 0.22,
  'low-e': 0.30,
};

/** Frame thermal conduction modifier factor */
export const FRAME_CONDUCTIVITY_FACTOR: Record<WindowHeatLossFrameMaterial, number> = {
  vinyl: 1.0,
  fiberglass: 0.95,
  wood: 1.02,
  aluminum: 1.35, // Un-broken aluminum profile
};

/** Orientation exposure wind & solar loss multiplier */
export const EXPOSURE_LOSS_MULTIPLIER: Record<WindowHeatLossExposure, number> = {
  north: 1.15, // Cold wind exposure, zero winter solar heat gain
  west: 1.05,  // Afternoon wind exposure
  east: 1.0,   // Moderate morning exposure
  south: 0.90, // Beneficial winter solar heat gain offsets loss
};

// ---------------------------------------------------------------------------
// Main calculation engine
// ---------------------------------------------------------------------------

export function calculateWindowHeatLoss(input: WindowHeatLossInput): WindowHeatLossResult {
  const warnings: WindowHeatLossWarning[] = [];

  const qty = Math.max(1, Math.round(input.numberOfWindows || 1));
  const wMm = Math.max(WINDOW_HEAT_LOSS_DEFAULTS.MIN_WINDOW_WIDTH_MM, input.windowWidthMm);
  const hMm = Math.max(WINDOW_HEAT_LOSS_DEFAULTS.MIN_WINDOW_HEIGHT_MM, input.windowHeightMm);

  // 1. Area calculations
  const singleAreaSqFt = (wMm * hMm) / 92903.04;
  const singleAreaM2 = (wMm * hMm) / 1000000;
  const totalAreaSqFt = singleAreaSqFt * qty;

  // 2. Temperature Differential ΔT
  const indoorF = input.indoorTempF || 70;
  const outdoorF = input.outdoorTempF !== undefined ? input.outdoorTempF : 20;
  const tempDifferenceF = Math.max(0, indoorF - outdoorF);
  const tempDifferenceC = Math.round((tempDifferenceF / 1.8) * 10) / 10;

  if (tempDifferenceF <= 0) {
    warnings.push({
      level: 'info',
      code: 'OUTDOOR_WARMER_THAN_INDOOR',
      message: 'Outdoor temperature is equal to or warmer than indoor temperature. No conduction heat loss occurring.',
    });
  }

  // 3. U-Factor lookup
  const frameFactor = FRAME_CONDUCTIVITY_FACTOR[input.frameMaterial] || 1.0;
  const exposureFactor = EXPOSURE_LOSS_MULTIPLIER[input.exposure] || 1.0;
  const uFactorBtu = (U_FACTORS_HEAT_LOSS[input.windowType] || 0.50) * frameFactor;
  const uFactorW = Math.round(uFactorBtu * 5.67826 * 100) / 100; // 1 BTU/hr·ft²·°F = 5.67826 W/m²·K

  // 4. Instantaneous Heat Loss Rate (Q = U * A * ΔT)
  const heatLossBtuHr = Math.round(uFactorBtu * totalAreaSqFt * tempDifferenceF * exposureFactor);
  const heatLossWatts = Math.round(heatLossBtuHr / WINDOW_HEAT_LOSS_DEFAULTS.BTU_HR_TO_WATTS);

  // 5. Periodic Heat Loss Accumulation (kWh)
  const dailyHeatLossKwh = Math.round(((heatLossWatts * 24) / 1000) * 10) / 10;
  const monthlyHeatLossKwh = Math.round(dailyHeatLossKwh * 30);
  const annualHeatLossKwh = Math.round(dailyHeatLossKwh * WINDOW_HEAT_LOSS_DEFAULTS.HEATING_DAYS_PER_YEAR);

  // 6. Heating Cost Impact ($)
  const costRateKwh = WINDOW_HEAT_LOSS_DEFAULTS.AVG_HEATING_COST_PER_KWH;
  const estimatedHeatingCostAnnual = Math.round(annualHeatLossKwh * costRateKwh);
  const estimatedHeatingCostMonthly = Math.round((estimatedHeatingCostAnnual / 12) * 100) / 100;

  // 7. Energy Efficiency Rating & Category
  let energyRating: WindowHeatLossResult['energyRating'] = 'B';
  if (uFactorBtu <= 0.22) energyRating = 'A+';
  else if (uFactorBtu <= 0.30) energyRating = 'A';
  else if (uFactorBtu <= 0.45) energyRating = 'B';
  else if (uFactorBtu <= 0.65) energyRating = 'C';
  else if (uFactorBtu <= 0.90) energyRating = 'D';
  else energyRating = 'F';

  let heatLossCategory: WindowHeatLossResult['heatLossCategory'] = 'moderate';
  if (heatLossWatts > 1500 || uFactorBtu >= 1.0) heatLossCategory = 'severe';
  else if (heatLossWatts > 750 || uFactorBtu >= 0.6) heatLossCategory = 'high';
  else if (heatLossWatts > 250) heatLossCategory = 'moderate';
  else heatLossCategory = 'minimal';

  // 8. Confidence
  let confidence: WindowHeatLossConfidence = 'excellent';
  if (qty > 35 || singleAreaSqFt > 40) confidence = 'minor-adjustment';

  if (input.windowType === 'single-pane') {
    warnings.push({
      level: 'warning',
      code: 'HIGH_HEAT_LOSS_SINGLE_PANE',
      message: 'Single-pane glass allows severe thermal heat loss. Upgrade to double-pane Low-E to reduce heat loss by ~65%.',
    });
  }

  if (input.frameMaterial === 'aluminum') {
    warnings.push({
      level: 'info',
      code: 'CONDUCTIVE_ALUMINUM_FRAME',
      message: 'Aluminum frames without a thermal break increase perimeter heat conduction by up to 35%.',
    });
  }

  return {
    glassAreaM2: Math.round(singleAreaM2 * 100) / 100,
    glassAreaSqFt: Math.round(singleAreaSqFt * 10) / 10,
    totalAreaSqFt: Math.round(totalAreaSqFt * 10) / 10,
    tempDifferenceF,
    tempDifferenceC,
    uFactorBtu: Math.round(uFactorBtu * 100) / 100,
    uFactorW,
    heatLossBtuHr,
    heatLossWatts,
    dailyHeatLossKwh,
    monthlyHeatLossKwh,
    annualHeatLossKwh,
    estimatedHeatingCostAnnual,
    estimatedHeatingCostMonthly,
    energyRating,
    heatLossCategory,
    confidence,
    warnings,
  };
}
