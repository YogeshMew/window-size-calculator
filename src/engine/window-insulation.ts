/**
 * WindowMetrics — Window Insulation Calculation Engine
 *
 * Pure TypeScript thermal insulation physics engine.
 * Calculates estimated U-Factor, thermal R-Value, heat transfer rate (Watts),
 * 1-100 Thermal Efficiency Score, Insulation Rating, Air Leakage Risk,
 * Condensation Risk, Draft Risk, and Upgrade Potential %.
 */

import type { MeasurementUnit } from '@/types/calculator.js';

export type WindowInsulationType =
  | 'single-pane'
  | 'double-pane'
  | 'triple-pane'
  | 'low-e'
  | 'argon'
  | 'krypton';

export type WindowInsulationFrameMaterial =
  | 'vinyl'
  | 'wood'
  | 'aluminum'
  | 'fiberglass'
  | 'composite';

export type WindowInsulationClimate = 'cold' | 'mixed' | 'hot';
export type WindowInsulationSealCondition = 'excellent' | 'good' | 'average' | 'poor';
export type WindowInsulationAge = '0-5' | '5-10' | '10-20' | '20+';
export type WindowInsulationCovering = 'none' | 'curtains' | 'blinds' | 'cellular-shades';

export type WindowInsulationWarnLevel = 'error' | 'warning' | 'info';
export type WindowInsulationConfidence = 'excellent' | 'good' | 'minor-adjustment' | 'custom-required';
export type WindowInsulationRating =
  | 'Superior'
  | 'Excellent'
  | 'Good'
  | 'Fair'
  | 'Poor'
  | 'Severe Thermal Leakage';

export interface WindowInsulationWarning {
  level: WindowInsulationWarnLevel;
  code: string;
  message: string;
}

export interface WindowInsulationInput {
  windowWidthMm: number;
  windowHeightMm: number;
  windowType: WindowInsulationType;
  frameMaterial: WindowInsulationFrameMaterial;
  climate: WindowInsulationClimate;
  sealCondition: WindowInsulationSealCondition;
  windowAge: WindowInsulationAge;
  windowCovering: WindowInsulationCovering;
}

export interface WindowInsulationResult {
  windowAreaM2: number;
  windowAreaSqFt: number;
  estimatedUFactor: number; // BTU / (hr · ft² · °F)
  estimatedUFactorW: number; // W / (m² · K)
  estimatedRValue: number;  // h · ft² · °F / BTU (R = 1/U)

  heatTransferRateW: number;
  thermalEfficiencyScore: number; // 1 to 100
  insulationRating: WindowInsulationRating;

  airLeakageRisk: 'low' | 'moderate' | 'high' | 'critical';
  condensationRisk: 'low' | 'moderate' | 'high' | 'critical';
  draftRisk: 'minimal' | 'noticeable' | 'drafty' | 'severe-drafts';
  upgradePotentialPercent: number;

  confidence: WindowInsulationConfidence;
  warnings: WindowInsulationWarning[];
}

// ---------------------------------------------------------------------------
// Thermal Insulation Constants & Modifiers (No magic numbers)
// ---------------------------------------------------------------------------

export const WINDOW_INSULATION_DEFAULTS = {
  MIN_WINDOW_WIDTH_MM: 152.4, // 6"
  MIN_WINDOW_HEIGHT_MM: 152.4, // 6"
  STANDARD_TEMP_DIFF_F: 40, // Standard indoor/outdoor 40°F winter differential
};

export const BASE_U_FACTORS: Record<WindowInsulationType, number> = {
  'single-pane': 1.10,
  'double-pane': 0.48,
  'low-e': 0.30,
  argon: 0.24,
  'triple-pane': 0.22,
  krypton: 0.18,
};

export const FRAME_THERMAL_MODIFIER: Record<WindowInsulationFrameMaterial, number> = {
  vinyl: 1.0,
  fiberglass: 0.95,
  composite: 0.98,
  wood: 1.02,
  aluminum: 1.35, // Un-broken aluminum profile
};

export const SEAL_CONDITION_DEGRADATION: Record<WindowInsulationSealCondition, number> = {
  excellent: 1.0,
  good: 1.05,
  average: 1.18,
  poor: 1.35,
};

export const AGE_DEGRADATION: Record<WindowInsulationAge, number> = {
  '0-5': 1.0,
  '5-10': 1.04,
  '10-20': 1.12,
  '20+': 1.25,
};

export const COVERING_R_BOOST: Record<WindowInsulationCovering, number> = {
  none: 0,
  blinds: 0.3,
  curtains: 0.8,
  'cellular-shades': 1.8, // Insulating honeycomb shades
};

// ---------------------------------------------------------------------------
// Main calculation engine
// ---------------------------------------------------------------------------

export function calculateWindowInsulation(input: WindowInsulationInput): WindowInsulationResult {
  const warnings: WindowInsulationWarning[] = [];

  const wMm = Math.max(WINDOW_INSULATION_DEFAULTS.MIN_WINDOW_WIDTH_MM, input.windowWidthMm);
  const hMm = Math.max(WINDOW_INSULATION_DEFAULTS.MIN_WINDOW_HEIGHT_MM, input.windowHeightMm);

  const windowAreaM2 = (wMm * hMm) / 1000000;
  const windowAreaSqFt = windowAreaM2 * 10.76391;

  // 1. Base U-Factor calculation with frame, seal & age modifiers
  const baseU = BASE_U_FACTORS[input.windowType] || 0.48;
  const frameMod = FRAME_THERMAL_MODIFIER[input.frameMaterial] || 1.0;
  const sealMod = SEAL_CONDITION_DEGRADATION[input.sealCondition] || 1.0;
  const ageMod = AGE_DEGRADATION[input.windowAge] || 1.0;

  const rawU = baseU * frameMod * sealMod * ageMod;
  const rawR = 1 / Math.max(0.01, rawU);

  // Add covering R-value boost
  const coveringBoost = COVERING_R_BOOST[input.windowCovering] || 0;
  const effectiveR = rawR + coveringBoost;
  const estimatedUFactor = Math.round((1 / effectiveR) * 100) / 100;
  const estimatedRValue = Math.round(effectiveR * 10) / 10;
  const estimatedUFactorW = Math.round(estimatedUFactor * 5.67826 * 100) / 100;

  // 2. Heat transfer rate (Watts) at standard ΔT=40°F
  const btuHrLoss = estimatedUFactor * windowAreaSqFt * WINDOW_INSULATION_DEFAULTS.STANDARD_TEMP_DIFF_F;
  const heatTransferRateW = Math.round(btuHrLoss / 3.41214);

  // 3. 1 to 100 Thermal Efficiency Score
  // Baseline: U=1.10 -> Score 15, U=0.18 -> Score 98
  let score = Math.round(100 - (estimatedUFactor / 1.10) * 85);
  score = Math.max(5, Math.min(100, score));

  // 4. Rating & Risk Tiers
  let insulationRating: WindowInsulationRating = 'Good';
  if (score >= 90) insulationRating = 'Superior';
  else if (score >= 80) insulationRating = 'Excellent';
  else if (score >= 65) insulationRating = 'Good';
  else if (score >= 50) insulationRating = 'Fair';
  else if (score >= 30) insulationRating = 'Poor';
  else insulationRating = 'Severe Thermal Leakage';

  let airLeakageRisk: WindowInsulationResult['airLeakageRisk'] = 'low';
  if (input.sealCondition === 'poor' || input.windowAge === '20+') airLeakageRisk = 'critical';
  else if (input.sealCondition === 'average' || input.windowAge === '10-20') airLeakageRisk = 'high';
  else if (input.sealCondition === 'good') airLeakageRisk = 'moderate';

  let condensationRisk: WindowInsulationResult['condensationRisk'] = 'low';
  if (input.windowType === 'single-pane' || input.frameMaterial === 'aluminum') condensationRisk = 'critical';
  else if (input.windowType === 'double-pane' && input.climate === 'cold') condensationRisk = 'high';
  else if (input.windowType === 'low-e') condensationRisk = 'moderate';

  let draftRisk: WindowInsulationResult['draftRisk'] = 'minimal';
  if (input.windowType === 'single-pane' || input.sealCondition === 'poor') draftRisk = 'severe-drafts';
  else if (input.sealCondition === 'average') draftRisk = 'drafty';
  else if (input.windowAge === '10-20') draftRisk = 'noticeable';

  // Upgrade potential score boost
  const targetTopScore = 95;
  const upgradePotentialPercent = Math.max(0, Math.min(85, targetTopScore - score));

  // 5. Confidence & Warnings
  let confidence: WindowInsulationConfidence = 'excellent';
  if (input.sealCondition === 'poor' && input.windowAge === '20+') confidence = 'minor-adjustment';

  if (input.windowType === 'single-pane') {
    warnings.push({
      level: 'warning',
      code: 'SINGLE_PANE_LOW_R_VALUE',
      message: 'Single-pane glass provides minimal R-0.9 insulation. Upgrading to Low-E glass boosts thermal R-value by 350%.',
    });
  }

  if (input.frameMaterial === 'aluminum') {
    warnings.push({
      level: 'info',
      code: 'ALUMINUM_THERMAL_BRIDGE',
      message: 'Standard aluminum frames create a thermal bridge that accelerates perimeter heat loss and glass condensation.',
    });
  }

  if (input.sealCondition === 'poor') {
    warnings.push({
      level: 'error',
      code: 'PERIMETER_SEAL_FAILURE',
      message: 'Degraded perimeter seals allow cold air infiltration. Weatherstripping replacement is urgently recommended.',
    });
  }

  return {
    windowAreaM2: Math.round(windowAreaM2 * 100) / 100,
    windowAreaSqFt: Math.round(windowAreaSqFt * 10) / 10,
    estimatedUFactor,
    estimatedUFactorW,
    estimatedRValue,

    heatTransferRateW,
    thermalEfficiencyScore: score,
    insulationRating,

    airLeakageRisk,
    condensationRisk,
    draftRisk,
    upgradePotentialPercent,

    confidence,
    warnings,
  };
}
