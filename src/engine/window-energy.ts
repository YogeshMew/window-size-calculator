/**
 * WindowMetrics — Window Energy Savings Calculation Engine
 *
 * Pure TypeScript implementation for estimating building envelope thermal performance,
 * U-factor heat loss, Solar Heat Gain Coefficient (SHGC) heat gain, annual energy cost
 * reduction, carbon emission savings (CO₂), payback period, and 10-year ROI.
 *
 * Rule: All internal calculations use standard building physics units:
 * - U-Factor: BTU / (hr · ft² · °F) and W / (m² · K)
 * - Heat Flow: MMBtu and kWh
 * - Carbon Emissions: kg CO₂ / kWh
 */

import type { MeasurementUnit } from '@/types/calculator.js';

export type CurrentWindowType = 'single-pane' | 'double-pane' | 'triple-pane' | 'low-e' | 'gas-filled';
export type NewWindowType = 'double-pane' | 'triple-pane' | 'low-e' | 'argon' | 'krypton';
export type WindowEnergyFrameMaterial = 'vinyl' | 'aluminum' | 'wood' | 'fiberglass';
export type ClimateZone = 'cold' | 'mixed' | 'hot';
export type HeatingFuel = 'electricity' | 'gas' | 'oil' | 'heat-pump';
export type HomeType = 'apartment' | 'house' | 'office';

export type WindowEnergyWarnLevel = 'error' | 'warning' | 'info';
export type WindowEnergyConfidence = 'excellent' | 'good' | 'minor-adjustment' | 'custom-required';

export interface WindowEnergyWarning {
  level: WindowEnergyWarnLevel;
  code: string;
  message: string;
}

export interface WindowEnergyInput {
  windowWidthMm: number;
  windowHeightMm: number;
  numberOfWindows: number;
  currentWindow: CurrentWindowType;
  newWindow: NewWindowType;
  frameMaterial: WindowEnergyFrameMaterial;
  climateZone: ClimateZone;
  electricityCostPerKwh: number;
  heatingFuel: HeatingFuel;
  averageMonthlyBill: number;
  homeType: HomeType;
}

export interface WindowEnergyResult {
  glassAreaM2: number;
  glassAreaSqFt: number;
  totalWindowAreaSqFt: number;
  oldUFactorBtu: number;
  newUFactorBtu: number;
  oldShgc: number;
  newShgc: number;
  annualHeatLossKwh: number;
  annualHeatGainKwh: number;
  annualEnergyCostOld: number;
  annualEnergyCostNew: number;
  annualSavings: number;
  monthlySavings: number;
  lifetimeSavings: number; // 25-year estimate
  co2ReductionKg: number;
  energyEfficiencyScore: number; // 1 - 100
  estimatedPaybackPeriodYears: number;
  roiPercent: number; // 10-year ROI
  comfortRating: 'fair' | 'good' | 'great' | 'superior';
  confidence: WindowEnergyConfidence;
  warnings: WindowEnergyWarning[];
}

// ---------------------------------------------------------------------------
// Thermal physics constants & pricing tables (No magic numbers)
// ---------------------------------------------------------------------------

export const WINDOW_ENERGY_DEFAULTS = {
  MIN_WINDOW_WIDTH_MM: 152.4, // 6"
  MIN_WINDOW_HEIGHT_MM: 152.4, // 6"
  DEFAULT_ELECTRICITY_COST_KWH: 0.16, // $0.16 / kWh US national avg
  DEFAULT_GAS_COST_THERM: 1.25, // $1.25 / therm
  EXPECTED_WINDOW_LIFESPAN_YEARS: 25,
  KWH_TO_BTU: 3412.14,
  THERM_TO_BTU: 100000,
  CO2_KG_PER_KWH_GRID: 0.385, // US grid avg 0.85 lbs CO2 / kWh
  CO2_KG_PER_THERM_GAS: 5.3, // 5.3 kg CO2 per therm natural gas
};

/** U-Factors (BTU / hr·ft²·°F) by Glazing Type */
export const U_FACTORS_BTU: Record<CurrentWindowType | NewWindowType, number> = {
  'single-pane': 1.10,
  'double-pane': 0.48,
  'triple-pane': 0.22,
  'low-e': 0.30,
  'gas-filled': 0.26,
  'argon': 0.24,
  'krypton': 0.18,
};

/** Solar Heat Gain Coefficient (SHGC 0.00 - 1.00) */
export const SHGC_VALUES: Record<CurrentWindowType | NewWindowType, number> = {
  'single-pane': 0.78,
  'double-pane': 0.65,
  'triple-pane': 0.35,
  'low-e': 0.38,
  'gas-filled': 0.40,
  'argon': 0.32,
  'krypton': 0.26,
};

/** Frame thermal conduction modifier factor */
export const FRAME_THERMAL_FACTOR: Record<WindowEnergyFrameMaterial, number> = {
  vinyl: 1.0,
  fiberglass: 0.95,
  wood: 1.02,
  aluminum: 1.35, // Aluminum conducts more heat without thermal break
};

/** Climate Zone Degree Days: HDD (Heating Degree Days) & CDD (Cooling Degree Days) */
export const CLIMATE_DEGREE_DAYS: Record<ClimateZone, { hdd: number; cdd: number; label: string }> = {
  cold: { hdd: 6200, cdd: 800, label: 'Cold / Northern Climate' },
  mixed: { hdd: 4200, cdd: 1800, label: 'Mixed / Central Climate' },
  hot: { hdd: 1200, cdd: 3400, label: 'Hot / Southern Climate' },
};

/** Heating fuel efficiency factors (AFUE / HSPF) */
export const FUEL_EFFICIENCY: Record<HeatingFuel, { efficiency: number; baseRate: number; unitLabel: string }> = {
  electricity: { efficiency: 1.0, baseRate: 0.16, unitLabel: '$/kWh' },
  'heat-pump': { efficiency: 2.8, baseRate: 0.16, unitLabel: '$/kWh' },
  gas: { efficiency: 0.85, baseRate: 1.25, unitLabel: '$/therm' },
  oil: { efficiency: 0.80, baseRate: 3.80, unitLabel: '$/gal' },
};

/** Home Type volume exposure multiplier */
export const HOME_TYPE_MULTIPLIER: Record<HomeType, number> = {
  apartment: 0.75,
  house: 1.0,
  office: 1.25,
};

// ---------------------------------------------------------------------------
// Main calculation engine
// ---------------------------------------------------------------------------

export function calculateWindowEnergy(input: WindowEnergyInput): WindowEnergyResult {
  const warnings: WindowEnergyWarning[] = [];

  const qty = Math.max(1, Math.round(input.numberOfWindows || 1));
  const wMm = Math.max(WINDOW_ENERGY_DEFAULTS.MIN_WINDOW_WIDTH_MM, input.windowWidthMm);
  const hMm = Math.max(WINDOW_ENERGY_DEFAULTS.MIN_WINDOW_HEIGHT_MM, input.windowHeightMm);

  // 1. Area calculations
  const singleAreaSqFt = (wMm * hMm) / 92903.04;
  const singleAreaM2 = (wMm * hMm) / 1000000;
  const totalWindowAreaSqFt = singleAreaSqFt * qty;

  // 2. Thermal U-Factors & SHGC lookup
  const frameFactor = FRAME_THERMAL_FACTOR[input.frameMaterial] || 1.0;
  const oldUFactorBtu = (U_FACTORS_BTU[input.currentWindow] || 0.50) * frameFactor;
  const newUFactorBtu = (U_FACTORS_BTU[input.newWindow] || 0.25) * frameFactor;
  const oldShgc = SHGC_VALUES[input.currentWindow] || 0.60;
  const newShgc = SHGC_VALUES[input.newWindow] || 0.35;

  // 3. Degree Days & Heat Loss/Gain Physics
  const climate = CLIMATE_DEGREE_DAYS[input.climateZone] || CLIMATE_DEGREE_DAYS.mixed;
  const homeMult = HOME_TYPE_MULTIPLIER[input.homeType] || 1.0;

  // Conduction Heat Loss = U * Area * HDD * 24 hrs / 1,000 (in kBTU) -> convert to kWh
  const oldHeatLossKbtu = oldUFactorBtu * totalWindowAreaSqFt * climate.hdd * 24 / 1000;
  const newHeatLossKbtu = newUFactorBtu * totalWindowAreaSqFt * climate.hdd * 24 / 1000;
  const annualHeatLossKwh = Math.round((newHeatLossKbtu * 1000) / WINDOW_ENERGY_DEFAULTS.KWH_TO_BTU);

  // Solar Heat Gain = SHGC * Area * CDD * 20 hrs / 1,000
  const oldHeatGainKbtu = oldShgc * totalWindowAreaSqFt * climate.cdd * 20 / 1000;
  const newHeatGainKbtu = newShgc * totalWindowAreaSqFt * climate.cdd * 20 / 1000;
  const annualHeatGainKwh = Math.round((newHeatGainKbtu * 1000) / WINDOW_ENERGY_DEFAULTS.KWH_TO_BTU);

  // 4. Energy Cost Calculations
  const elecRate = Math.max(0.05, input.electricityCostPerKwh || WINDOW_ENERGY_DEFAULTS.DEFAULT_ELECTRICITY_COST_KWH);
  const fuel = FUEL_EFFICIENCY[input.heatingFuel] || FUEL_EFFICIENCY.electricity;

  // Heating cost portion
  const heatingSavingsKbtu = Math.max(0, oldHeatLossKbtu - newHeatLossKbtu);
  let heatingSavingsDollar = 0;
  if (input.heatingFuel === 'gas') {
    const thermsSaved = (heatingSavingsKbtu * 1000) / (WINDOW_ENERGY_DEFAULTS.THERM_TO_BTU * fuel.efficiency);
    heatingSavingsDollar = thermsSaved * fuel.baseRate;
  } else if (input.heatingFuel === 'oil') {
    const galSaved = (heatingSavingsKbtu * 1000) / (138500 * fuel.efficiency);
    heatingSavingsDollar = galSaved * fuel.baseRate;
  } else {
    // Electric or Heat Pump
    const kwhSaved = (heatingSavingsKbtu * 1000) / (WINDOW_ENERGY_DEFAULTS.KWH_TO_BTU * fuel.efficiency);
    heatingSavingsDollar = kwhSaved * elecRate;
  }

  // Cooling cost portion (AC uses electricity)
  const coolingSavingsKbtu = Math.max(0, oldHeatGainKbtu - newHeatGainKbtu);
  const coolingKwhSaved = (coolingSavingsKbtu * 1000) / (WINDOW_ENERGY_DEFAULTS.KWH_TO_BTU * 3.5); // SEER 12 avg COP 3.5
  const coolingSavingsDollar = coolingKwhSaved * elecRate;

  // Combined Annual Savings
  const rawAnnualSavings = (heatingSavingsDollar + coolingSavingsDollar) * homeMult;

  // Cap savings reasonably relative to average monthly bill if user provided it
  let annualSavings = Math.round(rawAnnualSavings);
  if (input.averageMonthlyBill > 0) {
    const annualBillTotal = input.averageMonthlyBill * 12;
    const maxPossibleSavings = annualBillTotal * 0.35; // Windows rarely account for >35% of entire energy bill
    annualSavings = Math.min(annualSavings, Math.round(maxPossibleSavings));
  }
  annualSavings = Math.max(25, annualSavings);

  const monthlySavings = Math.round((annualSavings / 12) * 100) / 100;
  const lifetimeSavings = Math.round(annualSavings * WINDOW_ENERGY_DEFAULTS.EXPECTED_WINDOW_LIFESPAN_YEARS);

  // Baseline cost estimates
  const annualEnergyCostOld = Math.round(annualSavings * 2.8);
  const annualEnergyCostNew = Math.max(0, annualEnergyCostOld - annualSavings);

  // 5. Carbon Emissions (CO2)
  const co2FromCooling = coolingKwhSaved * WINDOW_ENERGY_DEFAULTS.CO2_KG_PER_KWH_GRID;
  const co2FromHeating = (heatingSavingsKbtu * 1000 / WINDOW_ENERGY_DEFAULTS.KWH_TO_BTU) * WINDOW_ENERGY_DEFAULTS.CO2_KG_PER_KWH_GRID;
  const co2ReductionKg = Math.round(co2FromCooling + co2FromHeating);

  // 6. Investment, Payback Period & ROI
  const estCostPerWindow = newUFactorBtu <= 0.22 ? 650 : 450;
  const estProjectCost = estCostPerWindow * qty;
  const estimatedPaybackPeriodYears = Math.round((estProjectCost / Math.max(1, annualSavings)) * 10) / 10;
  const tenYearSavings = annualSavings * 10;
  const roiPercent = Math.round(((tenYearSavings - estProjectCost) / Math.max(1, estProjectCost)) * 100);

  // 7. Energy Efficiency Score (1 - 100)
  const uDeltaPct = Math.min(1.0, (oldUFactorBtu - newUFactorBtu) / oldUFactorBtu);
  const energyEfficiencyScore = Math.min(99, Math.max(45, Math.round(50 + uDeltaPct * 45)));

  // 8. Comfort Rating
  let comfortRating: WindowEnergyResult['comfortRating'] = 'good';
  if (energyEfficiencyScore >= 90) comfortRating = 'superior';
  else if (energyEfficiencyScore >= 75) comfortRating = 'great';
  else if (energyEfficiencyScore >= 60) comfortRating = 'good';
  else comfortRating = 'fair';

  // 9. Confidence
  let confidence: WindowEnergyConfidence = 'excellent';
  if (qty > 35 || singleAreaSqFt > 40) confidence = 'minor-adjustment';
  if (input.currentWindow === input.newWindow as any) {
    confidence = 'good';
    warnings.push({
      level: 'info',
      code: 'SAME_WINDOW_TYPE',
      message: 'New window type matches current window type. Upgrade to Low-E or Triple Pane for greater energy savings.',
    });
  }

  if (input.frameMaterial === 'aluminum') {
    warnings.push({
      level: 'info',
      code: 'ALUMINUM_FRAME_CONDUCTIVITY',
      message: 'Unbroken aluminum frames conduct heat rapidly. Ensure new windows feature a thermally-broken aluminum frame.',
    });
  }

  return {
    glassAreaM2: Math.round(singleAreaM2 * 100) / 100,
    glassAreaSqFt: Math.round(singleAreaSqFt * 10) / 10,
    totalWindowAreaSqFt: Math.round(totalWindowAreaSqFt * 10) / 10,
    oldUFactorBtu: Math.round(oldUFactorBtu * 100) / 100,
    newUFactorBtu: Math.round(newUFactorBtu * 100) / 100,
    oldShgc: Math.round(oldShgc * 100) / 100,
    newShgc: Math.round(newShgc * 100) / 100,
    annualHeatLossKwh,
    annualHeatGainKwh,
    annualEnergyCostOld,
    annualEnergyCostNew,
    annualSavings,
    monthlySavings,
    lifetimeSavings,
    co2ReductionKg,
    energyEfficiencyScore,
    estimatedPaybackPeriodYears,
    roiPercent,
    comfortRating,
    confidence,
    warnings,
  };
}
