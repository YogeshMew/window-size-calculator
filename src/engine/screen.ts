/**
 * WindowMetrics — Window Screen Calculation Engine
 *
 * Pure TypeScript implementation for window screen dimensions, frame perimeters,
 * 15% mesh area waste, spline channel lengths, frame weight, corner connectors,
 * and stock frame sizing matches.
 *
 * Rule: All internal calculations are performed in millimeters (mm).
 */

export type ScreenFrameType = 'aluminum' | 'vinyl' | 'fiberglass' | 'wood';
export type ScreenMeshType = 'fiberglass' | 'aluminum' | 'pet-screen' | 'solar-screen' | 'stainless-steel';
export type ScreenMountType = 'standard' | 'flush' | 'recessed';
export type ScreenFrameColor = 'white' | 'bronze' | 'silver' | 'black' | 'tan';
export type ScreenWarnLevel = 'error' | 'warning' | 'info';
export type ScreenConfidence = 'excellent' | 'good' | 'minor-adjustment' | 'custom-required';
export type ScreenCostTier = '$' | '$$' | '$$$' | '$$$$';
export type ScreenOrderingRecommendation = 'exact' | 'next-stock' | 'trim' | 'custom';

export interface ScreenWarning {
  level: ScreenWarnLevel;
  code: string;
  message: string;
}

export interface ScreenInput {
  windowWidthMm: number;
  windowHeightMm: number;
  frameType: ScreenFrameType;
  meshType: ScreenMeshType;
  mountType: ScreenMountType;
  frameThicknessMm?: number;
  splineDiameterMm?: number;
  frameColor?: ScreenFrameColor;
}

export interface ScreenFrameSpec {
  thicknessMm: number;
  minWidthMm: number;
  minHeightMm: number;
  weightPerM: number;
  costTier: ScreenCostTier;
  displayName: string;
}

export interface ScreenMeshSpec {
  costMultiplier: number;
  durability: 'standard' | 'high' | 'extreme' | 'maximum';
  solarBlockPercent: number;
  petProof: boolean;
  splineDiameterMm: number;
  displayName: string;
}

export interface ScreenResult {
  finishedWidthMm: number;
  finishedHeightMm: number;
  deductionMm: number;
  framePerimeterMm: number;
  meshAreaM2: number;
  meshAreaSqFt: number;
  splineLengthMm: number;
  framePiecesRequired: number;
  crossbarRequired: boolean;
  cornerConnectors: number;
  estimatedWeightKg: number;
  estimatedMaterialCost: number;
  costTier: ScreenCostTier;
  installationDifficulty: 'easy' | 'moderate' | 'professional';
  confidence: ScreenConfidence;
  stockWidthSuggestions: number[];
  stockHeightSuggestions: number[];
  orderingRecommendation: ScreenOrderingRecommendation;
  warnings: ScreenWarning[];
}

export const SCREEN_DEFAULTS = {
  STANDARD_MOUNT_DEDUCTION_MM: 9.525,  // 3/8" total deduction (3/16" per side)
  FLUSH_MOUNT_DEDUCTION_MM: 6.35,      // 1/4" total deduction
  RECESSED_MOUNT_DEDUCTION_MM: 12.7,   // 1/2" total deduction
  MESH_WASTE_FACTOR: 1.15,             // 15% extra mesh allowance for spline rolling
  SPLINE_BUFFER_FACTOR: 1.05,          // 5% extra spline length buffer
  CROSSBAR_HEIGHT_THRESHOLD_MM: 1219.2, // 48" height triggers crossbar requirement
  MIN_WINDOW_WIDTH_MM: 152.4,          // 6" min width
  MIN_WINDOW_HEIGHT_MM: 152.4,         // 6" min height
  MAX_WINDOW_WIDTH_MM: 2438.4,         // 96" max width
};

export const FRAME_TYPE_DATA: Record<ScreenFrameType, ScreenFrameSpec> = {
  aluminum: {
    thicknessMm: 7.9375, // 5/16"
    minWidthMm: 152.4,
    minHeightMm: 152.4,
    weightPerM: 0.15,
    costTier: '$',
    displayName: 'Aluminum Frame',
  },
  vinyl: {
    thicknessMm: 11.1125, // 7/16"
    minWidthMm: 203.2,
    minHeightMm: 203.2,
    weightPerM: 0.20,
    costTier: '$$',
    displayName: 'Vinyl Frame',
  },
  fiberglass: {
    thicknessMm: 9.525, // 3/8"
    minWidthMm: 203.2,
    minHeightMm: 203.2,
    weightPerM: 0.18,
    costTier: '$$$',
    displayName: 'Composite Fiberglass',
  },
  wood: {
    thicknessMm: 19.05, // 3/4"
    minWidthMm: 254.0,
    minHeightMm: 254.0,
    weightPerM: 0.35,
    costTier: '$$',
    displayName: 'Traditional Wood Frame',
  },
};

export const MESH_TYPE_DATA: Record<ScreenMeshType, ScreenMeshSpec> = {
  fiberglass: {
    costMultiplier: 1.0,
    durability: 'standard',
    solarBlockPercent: 30,
    petProof: false,
    splineDiameterMm: 3.556, // 0.140"
    displayName: 'Standard Fiberglass Mesh',
  },
  aluminum: {
    costMultiplier: 1.3,
    durability: 'high',
    solarBlockPercent: 35,
    petProof: false,
    splineDiameterMm: 3.81, // 0.150"
    displayName: 'Heavy-Duty Aluminum Wire',
  },
  'pet-screen': {
    costMultiplier: 2.0,
    durability: 'extreme',
    solarBlockPercent: 45,
    petProof: true,
    splineDiameterMm: 3.175, // 0.125" (thicker vinyl coated mesh uses thinner spline)
    displayName: 'TuffScreen Pet-Resistant Mesh',
  },
  'solar-screen': {
    costMultiplier: 1.8,
    durability: 'high',
    solarBlockPercent: 80,
    petProof: false,
    splineDiameterMm: 3.556, // 0.140"
    displayName: 'Solar Sun-Blocking Shade Mesh',
  },
  'stainless-steel': {
    costMultiplier: 3.0,
    durability: 'maximum',
    solarBlockPercent: 50,
    petProof: true,
    splineDiameterMm: 3.556, // 0.140"
    displayName: 'Stainless Steel Security Mesh',
  },
};

export const SCREEN_STOCK_WIDTHS_MM = [
  457.2, 508.0, 609.6, 711.2, 762.0, 812.8, 914.4, 1066.8, 1219.2, 1371.6, 1524.0
]; // 18", 20", 24", 28", 30", 32", 36", 42", 48", 54", 60"

export const SCREEN_STOCK_HEIGHTS_MM = [
  609.6, 762.0, 914.4, 1066.8, 1219.2, 1371.6, 1524.0, 1828.8
]; // 24", 30", 36", 42", 48", 54", 60", 72"

export function calcFinishedScreenDimensions(
  windowWidthMm: number,
  windowHeightMm: number,
  mountType: ScreenMountType
): { finishedWidthMm: number; finishedHeightMm: number; deductionMm: number } {
  let deductionMm = SCREEN_DEFAULTS.STANDARD_MOUNT_DEDUCTION_MM;
  if (mountType === 'flush') {
    deductionMm = SCREEN_DEFAULTS.FLUSH_MOUNT_DEDUCTION_MM;
  } else if (mountType === 'recessed') {
    deductionMm = SCREEN_DEFAULTS.RECESSED_MOUNT_DEDUCTION_MM;
  }

  const finishedWidthMm = Math.max(0, windowWidthMm - deductionMm);
  const finishedHeightMm = Math.max(0, windowHeightMm - deductionMm);

  return { finishedWidthMm, finishedHeightMm, deductionMm };
}

export function calcMeshArea(
  finishedWidthMm: number,
  finishedHeightMm: number
): { meshAreaM2: number; meshAreaSqFt: number } {
  const widthM = finishedWidthMm / 1000;
  const heightM = finishedHeightMm / 1000;
  const rawM2 = widthM * heightM;
  const meshAreaM2 = rawM2 * SCREEN_DEFAULTS.MESH_WASTE_FACTOR;
  const meshAreaSqFt = meshAreaM2 * 10.7639;
  return { meshAreaM2, meshAreaSqFt };
}

export function calcSplineLength(framePerimeterMm: number): number {
  return framePerimeterMm * SCREEN_DEFAULTS.SPLINE_BUFFER_FACTOR;
}

export function calcScreenWeight(
  framePerimeterMm: number,
  meshAreaM2: number,
  frameType: ScreenFrameType
): number {
  const frameSpec = FRAME_TYPE_DATA[frameType] ?? FRAME_TYPE_DATA.aluminum;
  const frameWeightKg = (framePerimeterMm / 1000) * frameSpec.weightPerM;
  const meshWeightKg = meshAreaM2 * 0.25; // average mesh weight ~ 250g/m²
  return frameWeightKg + meshWeightKg;
}

export function calcScreenMaterialCost(
  framePerimeterMm: number,
  meshAreaM2: number,
  frameType: ScreenFrameType,
  meshType: ScreenMeshType
): { estimatedMaterialCost: number; costTier: ScreenCostTier } {
  const frameSpec = FRAME_TYPE_DATA[frameType] ?? FRAME_TYPE_DATA.aluminum;
  const meshSpec = MESH_TYPE_DATA[meshType] ?? MESH_TYPE_DATA.fiberglass;

  const frameCost = (framePerimeterMm / 1000) * 4.50; // ~$4.50/m base frame rail cost
  const meshCost = meshAreaM2 * 12.00 * meshSpec.costMultiplier; // ~$12/m² base mesh cost
  const hardwareCost = 6.00; // corner connectors & spline pack

  const totalCost = Math.round((frameCost + meshCost + hardwareCost) * 100) / 100;

  let costTier: ScreenCostTier = '$';
  if (totalCost > 60) costTier = '$$$$';
  else if (totalCost > 40) costTier = '$$$';
  else if (totalCost > 25) costTier = '$$';

  return { estimatedMaterialCost: totalCost, costTier };
}

export function calcInstallationDifficulty(
  frameType: ScreenFrameType,
  meshType: ScreenMeshType,
  crossbarRequired: boolean
): 'easy' | 'moderate' | 'professional' {
  if (meshType === 'stainless-steel' || frameType === 'wood') return 'professional';
  if (meshType === 'pet-screen' || meshType === 'solar-screen' || crossbarRequired) return 'moderate';
  return 'easy';
}

export function calcConfidence(
  result: Pick<ScreenResult, 'orderingRecommendation' | 'finishedWidthMm' | 'warnings'>,
  input: ScreenInput
): ScreenConfidence {
  const hasError = result.warnings.some(w => w.level === 'error');
  if (hasError) return 'custom-required';

  if (result.orderingRecommendation === 'exact') return 'excellent';
  if (result.orderingRecommendation === 'next-stock') return 'good';
  if (result.orderingRecommendation === 'trim') return 'minor-adjustment';
  return 'custom-required';
}

export function findClosestStockSizes(valueMm: number, stockSizes: number[], count: number = 3): number[] {
  const sorted = [...stockSizes].sort((a, b) => Math.abs(a - valueMm) - Math.abs(b - valueMm));
  return sorted.slice(0, count).sort((a, b) => a - b);
}

export function calcOrderingRecommendation(
  finishedWidthMm: number,
  stockWidths: number[],
  toleranceMm: number = 2.0
): ScreenOrderingRecommendation {
  const exactMatch = stockWidths.find(s => Math.abs(s - finishedWidthMm) <= toleranceMm);
  if (exactMatch) return 'exact';

  const nextLarger = stockWidths.find(s => s > finishedWidthMm && s - finishedWidthMm <= 25.4);
  if (nextLarger) return 'next-stock';

  const trimmable = stockWidths.find(s => s > finishedWidthMm && s - finishedWidthMm <= 76.2);
  if (trimmable) return 'trim';

  return 'custom';
}

export function buildScreenWarnings(input: ScreenInput, result: Partial<ScreenResult>): ScreenWarning[] {
  const warnings: ScreenWarning[] = [];

  if (input.windowWidthMm < SCREEN_DEFAULTS.MIN_WINDOW_WIDTH_MM) {
    warnings.push({
      level: 'error',
      code: 'WIDTH_TOO_SMALL',
      message: 'Window width is below minimum 6 inches (152 mm).',
    });
  }

  if (input.windowHeightMm < SCREEN_DEFAULTS.MIN_WINDOW_HEIGHT_MM) {
    warnings.push({
      level: 'error',
      code: 'HEIGHT_TOO_SMALL',
      message: 'Window height is below minimum 6 inches (152 mm).',
    });
  }

  if (input.windowWidthMm > SCREEN_DEFAULTS.MAX_WINDOW_WIDTH_MM) {
    warnings.push({
      level: 'warning',
      code: 'VERY_WIDE_WINDOW',
      message: 'Screen width exceeds 96 inches. Heavy-duty aluminum frame recommended.',
    });
  }

  if (input.windowHeightMm > SCREEN_DEFAULTS.CROSSBAR_HEIGHT_THRESHOLD_MM) {
    warnings.push({
      level: 'info',
      code: 'CROSSBAR_RECOMMENDED',
      message: 'Window height exceeds 48 inches. Center crossbar recommended to prevent frame bowing.',
    });
  }

  if (input.meshType === 'pet-screen' && input.frameType === 'aluminum') {
    warnings.push({
      level: 'info',
      code: 'PET_SCREEN_SPLINE_NOTE',
      message: 'TuffScreen pet mesh is thicker. Use 0.125" spline diameter for smooth installation.',
    });
  }

  return warnings;
}

export function calculateScreen(input: ScreenInput): ScreenResult {
  const { finishedWidthMm, finishedHeightMm, deductionMm } = calcFinishedScreenDimensions(
    input.windowWidthMm,
    input.windowHeightMm,
    input.mountType
  );

  const framePerimeterMm = 2 * (finishedWidthMm + finishedHeightMm);
  const { meshAreaM2, meshAreaSqFt } = calcMeshArea(finishedWidthMm, finishedHeightMm);
  const splineLengthMm = calcSplineLength(framePerimeterMm);

  const crossbarRequired = input.windowHeightMm > SCREEN_DEFAULTS.CROSSBAR_HEIGHT_THRESHOLD_MM;
  const framePiecesRequired = crossbarRequired ? 5 : 4;
  const cornerConnectors = 4;

  const estimatedWeightKg = calcScreenWeight(framePerimeterMm, meshAreaM2, input.frameType);
  const { estimatedMaterialCost, costTier } = calcScreenMaterialCost(
    framePerimeterMm,
    meshAreaM2,
    input.frameType,
    input.meshType
  );

  const installationDifficulty = calcInstallationDifficulty(input.frameType, input.meshType, crossbarRequired);
  const stockWidthSuggestions = findClosestStockSizes(finishedWidthMm, SCREEN_STOCK_WIDTHS_MM, 3);
  const stockHeightSuggestions = findClosestStockSizes(finishedHeightMm, SCREEN_STOCK_HEIGHTS_MM, 3);
  const orderingRecommendation = calcOrderingRecommendation(finishedWidthMm, SCREEN_STOCK_WIDTHS_MM, 2.0);

  const warnings = buildScreenWarnings(input, { finishedWidthMm, finishedHeightMm });
  const confidence = calcConfidence({ orderingRecommendation, finishedWidthMm, warnings }, input);

  return {
    finishedWidthMm,
    finishedHeightMm,
    deductionMm,
    framePerimeterMm,
    meshAreaM2,
    meshAreaSqFt,
    splineLengthMm,
    framePiecesRequired,
    crossbarRequired,
    cornerConnectors,
    estimatedWeightKg,
    estimatedMaterialCost,
    costTier,
    installationDifficulty,
    confidence,
    stockWidthSuggestions,
    stockHeightSuggestions,
    orderingRecommendation,
    warnings,
  };
}
