/**
 * WindowMetrics — Window Cost Calculation Engine
 *
 * Pure TypeScript implementation for estimating replacement and new window costs,
 * material costs, glass costs, professional vs DIY labor, regional cost factors,
 * optional upgrades, price per square foot, and budget tiers.
 *
 * Rule: All internal calculations are performed in millimeters (mm), square feet (sq ft),
 * and US Dollars ($).
 */

import type { MeasurementUnit } from '@/types/calculator.js';

export type WindowCostStyle =
  | 'single-hung'
  | 'double-hung'
  | 'casement'
  | 'sliding'
  | 'awning'
  | 'picture'
  | 'bay'
  | 'bow'
  | 'garden'
  | 'custom';

export type WindowCostMaterial =
  | 'vinyl'
  | 'aluminum'
  | 'wood'
  | 'fiberglass'
  | 'composite';

export type WindowCostGlassType =
  | 'single-pane'
  | 'double-pane'
  | 'triple-pane'
  | 'low-e'
  | 'laminated'
  | 'tempered';

export type WindowCostInstallation = 'diy' | 'professional';

export type WindowCostReplacementType = 'insert' | 'full-frame' | 'new-construction';

export type WindowCostRegion = 'low-cost' | 'average' | 'high-cost';

export type WindowCostFeature =
  | 'grids'
  | 'argon-gas'
  | 'uv-coating'
  | 'noise-reduction'
  | 'security-glass'
  | 'smart-glass';

export type WindowCostBudgetCategory = 'budget' | 'mid-range' | 'premium' | 'luxury';

export type WindowCostWarnLevel = 'error' | 'warning' | 'info';

export type WindowCostConfidence = 'excellent' | 'good' | 'minor-adjustment' | 'custom-required';

export interface WindowCostWarning {
  level: WindowCostWarnLevel;
  code: string;
  message: string;
}

export interface WindowCostInput {
  windowWidthMm: number;
  windowHeightMm: number;
  quantity: number;
  windowStyle: WindowCostStyle;
  frameMaterial: WindowCostMaterial;
  glassType: WindowCostGlassType;
  installation: WindowCostInstallation;
  replacementType: WindowCostReplacementType;
  region: WindowCostRegion;
  features: WindowCostFeature[];
}

export interface WindowCostResult {
  glassAreaM2: number;
  glassAreaSqFt: number;
  baseWindowCostPerUnit: number;
  materialCostPerUnit: number;
  glassCostPerUnit: number;
  featuresCostPerUnit: number;
  laborCostPerUnit: number;
  installationCostPerUnit: number;
  totalCostPerUnit: number;
  grandTotal: number;
  totalMaterialCost: number;
  totalGlassCost: number;
  totalLaborCost: number;
  totalInstallationCost: number;
  totalFeaturesCost: number;
  costPerSqFt: number;
  estimatedSavingsDiy: number;
  estimatedProjectDurationHours: number;
  estimatedProjectDurationDays: number;
  budgetCategory: WindowCostBudgetCategory;
  confidence: WindowCostConfidence;
  warnings: WindowCostWarning[];
}

// ---------------------------------------------------------------------------
// Pricing tables & constants (No magic numbers)
// ---------------------------------------------------------------------------

export const WINDOW_COST_DEFAULTS = {
  MIN_WINDOW_WIDTH_MM: 152.4, // 6"
  MIN_WINDOW_HEIGHT_MM: 152.4, // 6"
  MAX_WINDOW_WIDTH_MM: 4572.0, // 180"
  MAX_WINDOW_HEIGHT_MM: 4572.0,
  BASE_AREA_SQFT: 12.0, // Standard 3' x 4' window baseline area
  DIY_LABOR_SAVINGS_RATIO: 0.35, // Average labor portion of total job
};

/** Base unit cost by Window Style (for standard 12 sq ft baseline area) */
export const STYLE_BASE_COST: Record<WindowCostStyle, number> = {
  'single-hung': 250,
  'double-hung': 320,
  casement: 380,
  sliding: 280,
  awning: 360,
  picture: 220,
  bay: 1250,
  bow: 1500,
  garden: 950,
  custom: 650,
};

/** Frame material multiplier relative to standard vinyl */
export const MATERIAL_MULTIPLIER: Record<WindowCostMaterial, number> = {
  vinyl: 1.0,
  aluminum: 1.15,
  wood: 1.6,
  fiberglass: 1.45,
  composite: 1.35,
};

/** Glass upgrade cost per sq ft */
export const GLASS_TYPE_COST_PER_SQFT: Record<WindowCostGlassType, number> = {
  'single-pane': 8,
  'double-pane': 18,
  'triple-pane': 35,
  'low-e': 24,
  laminated: 32,
  tempered: 28,
};

/** Replacement style labor complexity multiplier */
export const REPLACEMENT_TYPE_LABOR_MULTIPLIER: Record<WindowCostReplacementType, number> = {
  insert: 1.0,
  'full-frame': 1.45,
  'new-construction': 1.25,
};

/** Regional labor & material cost multiplier */
export const REGION_MULTIPLIER: Record<WindowCostRegion, number> = {
  'low-cost': 0.85,
  average: 1.0,
  'high-cost': 1.3,
};

/** Add-on feature cost per unit window */
export const FEATURE_COST_PER_UNIT: Record<WindowCostFeature, number> = {
  grids: 35,
  'argon-gas': 45,
  'uv-coating': 50,
  'noise-reduction': 85,
  'security-glass': 120,
  'smart-glass': 350,
};

/** Base professional installation labor per unit window */
export const BASE_LABOR_COST_PER_UNIT = 180;

// ---------------------------------------------------------------------------
// Main calculation engine
// ---------------------------------------------------------------------------

export function calculateWindowCost(input: WindowCostInput): WindowCostResult {
  const warnings: WindowCostWarning[] = [];

  // Input validation & clamping
  const qty = Math.max(1, Math.round(input.quantity || 1));
  const wMm = Math.max(WINDOW_COST_DEFAULTS.MIN_WINDOW_WIDTH_MM, input.windowWidthMm);
  const hMm = Math.max(WINDOW_COST_DEFAULTS.MIN_WINDOW_HEIGHT_MM, input.windowHeightMm);

  if (input.windowWidthMm > WINDOW_COST_DEFAULTS.MAX_WINDOW_WIDTH_MM) {
    warnings.push({
      level: 'warning',
      code: 'VERY_WIDE_WINDOW',
      message: 'Window width exceeds 15 feet. Special structural reinforcement or crating may be required.',
    });
  }

  if (input.windowHeightMm > WINDOW_COST_DEFAULTS.MAX_WINDOW_HEIGHT_MM) {
    warnings.push({
      level: 'warning',
      code: 'VERY_TALL_WINDOW',
      message: 'Window height exceeds 15 feet. High-elevation scaffolding labor required.',
    });
  }

  // 1. Area calculation
  const areaM2 = (wMm * hMm) / 1000000;
  const areaSqFt = (wMm * hMm) / 92903.04;

  // 2. Base window cost with non-linear scaling for area
  const areaFactor = Math.pow(areaSqFt / WINDOW_COST_DEFAULTS.BASE_AREA_SQFT, 0.75);
  const baseCostRaw = STYLE_BASE_COST[input.windowStyle] * areaFactor;

  // 3. Material & Glass cost breakdown
  const materialMultiplier = MATERIAL_MULTIPLIER[input.frameMaterial];
  const materialCostPerUnit = baseCostRaw * materialMultiplier * 0.45;
  const glassCostPerUnit = areaSqFt * GLASS_TYPE_COST_PER_SQFT[input.glassType];
  const baseWindowCostPerUnit = Math.round(baseCostRaw * materialMultiplier);

  // 4. Feature costs
  const featuresCostPerUnit = input.features.reduce((sum, f) => sum + (FEATURE_COST_PER_UNIT[f] || 0), 0);

  // 5. Labor & Installation cost
  const isPro = input.installation === 'professional';
  const laborMultiplier = REPLACEMENT_TYPE_LABOR_MULTIPLIER[input.replacementType];
  const regionMultiplier = REGION_MULTIPLIER[input.region];

  let laborCostPerUnit = 0;
  if (isPro) {
    const sizeLaborMultiplier = areaSqFt > 24 ? 1.35 : areaSqFt > 15 ? 1.15 : 1.0;
    const styleLaborMultiplier = ['bay', 'bow', 'custom'].includes(input.windowStyle) ? 1.5 : 1.0;
    laborCostPerUnit = BASE_LABOR_COST_PER_UNIT * laborMultiplier * regionMultiplier * sizeLaborMultiplier * styleLaborMultiplier;
  }

  const installationCostPerUnit = laborCostPerUnit;

  // 6. Unit total & Grand total
  const rawUnitTotal = (baseWindowCostPerUnit + glassCostPerUnit + featuresCostPerUnit + laborCostPerUnit) * regionMultiplier;
  const totalCostPerUnit = Math.round(rawUnitTotal);
  const grandTotal = Math.round(totalCostPerUnit * qty);

  // 7. Total breakdowns across project
  const totalMaterialCost = Math.round(materialCostPerUnit * qty * regionMultiplier);
  const totalGlassCost = Math.round(glassCostPerUnit * qty * regionMultiplier);
  const totalLaborCost = Math.round(laborCostPerUnit * qty);
  const totalInstallationCost = totalLaborCost;
  const totalFeaturesCost = Math.round(featuresCostPerUnit * qty * regionMultiplier);

  // 8. Cost per sq ft
  const totalAreaSqFt = areaSqFt * qty;
  const costPerSqFt = totalAreaSqFt > 0 ? Math.round((grandTotal / totalAreaSqFt) * 100) / 100 : 0;

  // 9. DIY Savings estimate
  const proLaborEquiv = BASE_LABOR_COST_PER_UNIT * laborMultiplier * regionMultiplier;
  const estimatedSavingsDiy = isPro ? 0 : Math.round(proLaborEquiv * qty);

  // 10. Estimated duration
  const hoursPerUnit = (isPro ? 2.0 : 4.0) * laborMultiplier * (['bay', 'bow'].includes(input.windowStyle) ? 2.0 : 1.0);
  const estimatedProjectDurationHours = Math.round(hoursPerUnit * qty * 10) / 10;
  const estimatedProjectDurationDays = Math.max(1, Math.ceil(estimatedProjectDurationHours / 8));

  // 11. Budget category
  const costPerWindowNet = grandTotal / qty;
  let budgetCategory: WindowCostBudgetCategory = 'mid-range';
  if (costPerWindowNet < 400) budgetCategory = 'budget';
  else if (costPerWindowNet < 850) budgetCategory = 'mid-range';
  else if (costPerWindowNet < 1600) budgetCategory = 'premium';
  else budgetCategory = 'luxury';

  // 12. Confidence score
  let confidence: WindowCostConfidence = 'excellent';
  if (['bay', 'bow', 'custom'].includes(input.windowStyle) || input.features.includes('smart-glass')) {
    confidence = 'minor-adjustment';
  } else if (areaSqFt > 35 || qty > 25) {
    confidence = 'custom-required';
  } else if (input.frameMaterial === 'wood' || input.glassType === 'triple-pane') {
    confidence = 'good';
  }

  // Warnings
  if (input.installation === 'diy' && ['bay', 'bow'].includes(input.windowStyle)) {
    warnings.push({
      level: 'warning',
      code: 'DIY_COMPLEX_STYLE',
      message: 'Bay and Bow windows require specialized structural head & seat support. Professional installation is strongly recommended.',
    });
  }

  if (input.installation === 'diy' && input.replacementType === 'full-frame') {
    warnings.push({
      level: 'info',
      code: 'DIY_FULL_FRAME',
      message: 'Full-frame replacement involves removing exterior trim & siding. Ensure proper flashing and waterproofing.',
    });
  }

  return {
    glassAreaM2: Math.round(areaM2 * 100) / 100,
    glassAreaSqFt: Math.round(areaSqFt * 10) / 10,
    baseWindowCostPerUnit: Math.round(baseWindowCostPerUnit),
    materialCostPerUnit: Math.round(materialCostPerUnit),
    glassCostPerUnit: Math.round(glassCostPerUnit),
    featuresCostPerUnit: Math.round(featuresCostPerUnit),
    laborCostPerUnit: Math.round(laborCostPerUnit),
    installationCostPerUnit: Math.round(installationCostPerUnit),
    totalCostPerUnit,
    grandTotal,
    totalMaterialCost,
    totalGlassCost,
    totalLaborCost,
    totalInstallationCost,
    totalFeaturesCost,
    costPerSqFt,
    estimatedSavingsDiy,
    estimatedProjectDurationHours,
    estimatedProjectDurationDays,
    budgetCategory,
    confidence,
    warnings,
  };
}
