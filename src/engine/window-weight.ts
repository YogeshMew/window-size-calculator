/**
 * WindowMetrics — Window Weight Calculation Engine
 *
 * Pure TypeScript implementation for calculating glass area, glass volume, glass mass,
 * frame material weight, total window unit weight (kg & lbs), OSHA safe carrying crew sizes,
 * vacuum suction cup counts, and transportation categories.
 *
 * Rule: All internal calculations are performed in millimeters (mm) and kilograms (kg).
 */

export type WindowWeightShape = 'rectangle' | 'square' | 'circle' | 'half-circle' | 'triangle' | 'trapezoid';
export type WindowWeightGlassType = 'annealed' | 'tempered' | 'laminated' | 'double-glazed' | 'triple-glazed';
export type WindowWeightFrameMaterial = 'none' | 'aluminum' | 'vinyl' | 'wood' | 'fiberglass' | 'steel';
export type WindowWeightWarnLevel = 'error' | 'warning' | 'info';
export type WindowWeightConfidence = 'excellent' | 'good' | 'minor-adjustment' | 'custom-required';
export type WindowWeightFreightCategory = 'standard-courier' | 'freight-skid' | 'crated-freight' | 'heavy-crane';

export interface WindowWeightWarning {
  level: WindowWeightWarnLevel;
  code: string;
  message: string;
}

export interface WindowWeightInput {
  windowWidthMm: number;
  windowHeightMm: number;
  shape: WindowWeightShape;
  thicknessMm: number;
  glassType: WindowWeightGlassType;
  frameMaterial: WindowWeightFrameMaterial;
}

export interface WindowWeightResult {
  glassAreaM2: number;
  glassAreaSqFt: number;
  effectiveGlassThicknessMm: number;
  glassVolumeM3: number;
  glassWeightKg: number;
  glassWeightLbs: number;
  framePerimeterM: number;
  frameWeightKg: number;
  frameWeightLbs: number;
  totalWindowWeightKg: number;
  totalWindowWeightLbs: number;
  weightPerM2: number;
  weightPerSqFt: number;
  installersRequired: number;
  vacuumCupsRecommended: number;
  transportationCategory: WindowWeightFreightCategory;
  handlingDifficulty: 'easy' | 'moderate' | 'heavy' | 'extreme';
  confidence: WindowWeightConfidence;
  warnings: WindowWeightWarning[];
}

export const WINDOW_WEIGHT_DEFAULTS = {
  GLASS_DENSITY_KG_M3: 2500, // Standard soda-lime float glass density (2.5 kg/m²/mm)
  LAMINATED_PVB_EXTRA_MM: 0.76, // Standard 0.030" PVB interlayer thickness
  SINGLE_PERSON_MAX_KG: 25.0, // OSHA 55 lbs safe single-person carry limit
  TWO_PERSON_MAX_KG: 50.0, // 110 lbs two-person carry limit
  FOUR_PERSON_MAX_KG: 100.0, // 220 lbs four-person carry limit
  VACUUM_CUP_CAPACITY_KG: 50.0, // Standard 8" dual-cup suction lifting rating (110 lbs/cup)
  MIN_WINDOW_WIDTH_MM: 152.4, // 6"
  MIN_WINDOW_HEIGHT_MM: 152.4, // 6"
  MAX_WINDOW_WIDTH_MM: 4000.0,
};

export const FRAME_LINEAR_MASS_KG_M: Record<WindowWeightFrameMaterial, number> = {
  none: 0.0,
  aluminum: 1.2,  // Extruded aluminum profile
  vinyl: 1.5,     // Multi-chamber PVC vinyl profile
  wood: 2.2,      // Solid pine/oak timber frame
  fiberglass: 1.8, // Pultruded fiberglass composite
  steel: 3.8,     // Heavy structural steel frame
};

export function calcGlassArea(
  windowWidthMm: number,
  windowHeightMm: number,
  shape: WindowWeightShape
): { glassAreaM2: number; glassAreaSqFt: number } {
  const wM = windowWidthMm / 1000;
  const hM = windowHeightMm / 1000;
  let rawM2 = 0;

  switch (shape) {
    case 'square':
      rawM2 = wM * wM;
      break;
    case 'circle':
      rawM2 = Math.PI * Math.pow(wM / 2, 2);
      break;
    case 'half-circle':
      rawM2 = 0.5 * Math.PI * Math.pow(wM / 2, 2);
      break;
    case 'triangle':
      rawM2 = 0.5 * wM * hM;
      break;
    case 'trapezoid':
      rawM2 = 0.75 * wM * hM; // Average top/bottom width approximation
      break;
    case 'rectangle':
    default:
      rawM2 = wM * hM;
      break;
  }

  const glassAreaM2 = Math.max(0.01, Math.round(rawM2 * 10000) / 10000);
  const glassAreaSqFt = Math.round(glassAreaM2 * 10.7639 * 100) / 100;

  return { glassAreaM2, glassAreaSqFt };
}

export function calcEffectiveThickness(
  thicknessMm: number,
  glassType: WindowWeightGlassType
): number {
  switch (glassType) {
    case 'double-glazed':
      return thicknessMm * 2;
    case 'triple-glazed':
      return thicknessMm * 3;
    case 'laminated':
      return thicknessMm + WINDOW_WEIGHT_DEFAULTS.LAMINATED_PVB_EXTRA_MM;
    case 'annealed':
    case 'tempered':
    default:
      return thicknessMm;
  }
}

export function calcGlassMass(
  glassAreaM2: number,
  effectiveThicknessMm: number
): { glassVolumeM3: number; glassWeightKg: number; glassWeightLbs: number } {
  const glassVolumeM3 = glassAreaM2 * (effectiveThicknessMm / 1000);
  const glassWeightKg = Math.round(glassVolumeM3 * WINDOW_WEIGHT_DEFAULTS.GLASS_DENSITY_KG_M3 * 100) / 100;
  const glassWeightLbs = Math.round(glassWeightKg * 2.20462 * 100) / 100;
  return { glassVolumeM3, glassWeightKg, glassWeightLbs };
}

export function calcFramePerimeter(
  windowWidthMm: number,
  windowHeightMm: number,
  shape: WindowWeightShape
): number {
  const wM = windowWidthMm / 1000;
  const hM = windowHeightMm / 1000;

  switch (shape) {
    case 'circle':
      return Math.PI * wM;
    case 'half-circle':
      return (Math.PI * wM / 2) + wM;
    case 'triangle':
      return wM + 2 * Math.sqrt(Math.pow(wM / 2, 2) + Math.pow(hM, 2));
    case 'trapezoid':
      return wM * 2.8;
    case 'square':
      return 4 * wM;
    case 'rectangle':
    default:
      return 2 * (wM + hM);
  }
}

export function calcFrameMass(
  framePerimeterM: number,
  frameMaterial: WindowWeightFrameMaterial
): { frameWeightKg: number; frameWeightLbs: number } {
  const linearMass = FRAME_LINEAR_MASS_KG_M[frameMaterial] ?? 0;
  const frameWeightKg = Math.round(framePerimeterM * linearMass * 100) / 100;
  const frameWeightLbs = Math.round(frameWeightKg * 2.20462 * 100) / 100;
  return { frameWeightKg, frameWeightLbs };
}

export function calcHandlingMetrics(
  totalWeightKg: number,
  glassWeightKg: number
): {
  installersRequired: number;
  vacuumCupsRecommended: number;
  transportationCategory: WindowWeightFreightCategory;
  handlingDifficulty: 'easy' | 'moderate' | 'heavy' | 'extreme';
} {
  // Installers required based on OSHA 25kg (55lb) limit per person
  const installersRequired = Math.max(1, Math.ceil(totalWeightKg / WINDOW_WEIGHT_DEFAULTS.SINGLE_PERSON_MAX_KG));

  // Vacuum suction cups (min 2 cups for glass > 20kg for dual-point stability)
  let vacuumCupsRecommended = 0;
  if (glassWeightKg >= 20.0) {
    vacuumCupsRecommended = Math.max(2, Math.ceil(glassWeightKg / WINDOW_WEIGHT_DEFAULTS.VACUUM_CUP_CAPACITY_KG));
  }

  // Freight transportation category
  let transportationCategory: WindowWeightFreightCategory = 'standard-courier';
  if (totalWeightKg > 150.0) transportationCategory = 'heavy-crane';
  else if (totalWeightKg > 80.0) transportationCategory = 'crated-freight';
  else if (totalWeightKg > 35.0) transportationCategory = 'freight-skid';

  // Handling difficulty
  let handlingDifficulty: 'easy' | 'moderate' | 'heavy' | 'extreme' = 'easy';
  if (totalWeightKg > 100.0) handlingDifficulty = 'extreme';
  else if (totalWeightKg > 50.0) handlingDifficulty = 'heavy';
  else if (totalWeightKg > 25.0) handlingDifficulty = 'moderate';

  return { installersRequired, vacuumCupsRecommended, transportationCategory, handlingDifficulty };
}

export function calcConfidence(
  result: Pick<WindowWeightResult, 'warnings' | 'totalWindowWeightKg'>,
  input: WindowWeightInput
): WindowWeightConfidence {
  const hasError = result.warnings.some((w) => w.level === 'error');
  if (hasError) return 'custom-required';

  if (result.totalWindowWeightKg <= 50.0) return 'excellent';
  if (result.totalWindowWeightKg <= 100.0) return 'good';
  return 'minor-adjustment';
}

export function buildWindowWeightWarnings(
  input: WindowWeightInput,
  result: Partial<WindowWeightResult>
): WindowWeightWarning[] {
  const warnings: WindowWeightWarning[] = [];

  if (input.windowWidthMm < WINDOW_WEIGHT_DEFAULTS.MIN_WINDOW_WIDTH_MM) {
    warnings.push({
      level: 'error',
      code: 'WIDTH_TOO_SMALL',
      message: 'Window width is below minimum 6 inches (152 mm).',
    });
  }

  if (input.windowHeightMm < WINDOW_WEIGHT_DEFAULTS.MIN_WINDOW_HEIGHT_MM) {
    warnings.push({
      level: 'error',
      code: 'HEIGHT_TOO_SMALL',
      message: 'Window height is below minimum 6 inches (152 mm).',
    });
  }

  if (result.totalWindowWeightKg && result.totalWindowWeightKg > 50.0) {
    warnings.push({
      level: 'warning',
      code: 'OSHA_TWO_PERSON_LIFT',
      message: `Total weight is ${result.totalWindowWeightKg.toFixed(1)} kg (${(result.totalWindowWeightKg * 2.20462).toFixed(1)} lbs) — exceeds single-person 25 kg carry limit. Minimum 2-person lift required.`,
    });
  }

  if (result.totalWindowWeightKg && result.totalWindowWeightKg > 100.0) {
    warnings.push({
      level: 'warning',
      code: 'MECHANICAL_HOIST_RECOMMENDED',
      message: 'Total weight exceeds 100 kg (220 lbs). Mechanical hoist or suction crane recommended for installation.',
    });
  }

  if (input.glassType === 'triple-glazed') {
    warnings.push({
      level: 'info',
      code: 'TRIPLE_GLAZED_LOAD_BEARING',
      message: 'Triple glazed unit is heavy. Verify wall header and shim load bearing capacity before mounting.',
    });
  }

  return warnings;
}

export function calculateWindowWeight(input: WindowWeightInput): WindowWeightResult {
  const { glassAreaM2, glassAreaSqFt } = calcGlassArea(input.windowWidthMm, input.windowHeightMm, input.shape);
  const effectiveGlassThicknessMm = calcEffectiveThickness(input.thicknessMm, input.glassType);
  const { glassVolumeM3, glassWeightKg, glassWeightLbs } = calcGlassMass(glassAreaM2, effectiveGlassThicknessMm);

  const framePerimeterM = calcFramePerimeter(input.windowWidthMm, input.windowHeightMm, input.shape);
  const { frameWeightKg, frameWeightLbs } = calcFrameMass(framePerimeterM, input.frameMaterial);

  const totalWindowWeightKg = Math.round((glassWeightKg + frameWeightKg) * 100) / 100;
  const totalWindowWeightLbs = Math.round((glassWeightLbs + frameWeightLbs) * 100) / 100;

  const weightPerM2 = Math.round((totalWindowWeightKg / glassAreaM2) * 100) / 100;
  const weightPerSqFt = Math.round((totalWindowWeightLbs / glassAreaSqFt) * 100) / 100;

  const { installersRequired, vacuumCupsRecommended, transportationCategory, handlingDifficulty } = calcHandlingMetrics(
    totalWindowWeightKg,
    glassWeightKg
  );

  const warnings = buildWindowWeightWarnings(input, { totalWindowWeightKg });
  const confidence = calcConfidence({ warnings, totalWindowWeightKg }, input);

  return {
    glassAreaM2,
    glassAreaSqFt,
    effectiveGlassThicknessMm,
    glassVolumeM3,
    glassWeightKg,
    glassWeightLbs,
    framePerimeterM,
    frameWeightKg,
    frameWeightLbs,
    totalWindowWeightKg,
    totalWindowWeightLbs,
    weightPerM2,
    weightPerSqFt,
    installersRequired,
    vacuumCupsRecommended,
    transportationCategory,
    handlingDifficulty,
    confidence,
    warnings,
  };
}
