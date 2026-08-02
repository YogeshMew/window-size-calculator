/**
 * WindowMetrics — Window Film & Tint Calculation Engine
 *
 * Pure TypeScript implementation for window film width, height, roll sizing,
 * 1" trimming margins, total roll area, waste %, heat/UV ratings, thermal stress
 * double-pane warnings, and material costs.
 *
 * Rule: All internal calculations are performed in millimeters (mm).
 */

export type FilmType =
  | 'privacy'
  | 'frosted'
  | 'decorative'
  | 'reflective'
  | 'security'
  | 'uv-protection'
  | 'heat-control'
  | 'one-way-mirror';

export type FilmGlassType = 'single-pane' | 'double-pane' | 'triple-pane' | 'tempered' | 'laminated';
export type FilmInstallation = 'interior' | 'exterior';
export type FilmOrientation = 'north' | 'south' | 'east' | 'west';
export type FilmClimate = 'cold' | 'moderate' | 'hot';
export type FilmWarnLevel = 'error' | 'warning' | 'info';
export type FilmConfidence = 'excellent' | 'good' | 'minor-adjustment' | 'custom-required';
export type FilmCostTier = '$' | '$$' | '$$$' | '$$$$';
export type FilmOrderingRecommendation = 'exact' | 'next-stock' | 'trim' | 'custom';

export interface FilmWarning {
  level: FilmWarnLevel;
  code: string;
  message: string;
}

export interface FilmInput {
  windowWidthMm: number;
  windowHeightMm: number;
  filmType: FilmType;
  glassType: FilmGlassType;
  installation: FilmInstallation;
  orientation: FilmOrientation;
  climate: FilmClimate;
  rollWidthMm?: number;
}

export interface FilmTypeSpec {
  vltPercent: number;
  uvBlockPercent: number;
  heatReductionPercent: number;
  glareReductionPercent: number;
  privacyRating: number; // 0 to 10 scale
  costPerM2: number;
  expectedLifespanYears: number;
  displayName: string;
}

export interface FilmResult {
  filmWidthMm: number;
  filmHeightMm: number;
  filmAreaM2: number;
  filmAreaSqFt: number;
  requiredRollWidthMm: number;
  requiredRollLengthMm: number;
  totalFilmRequiredM2: number;
  totalFilmRequiredSqFt: number;
  wastePercent: number;
  materialCostEstimate: number;
  costTier: FilmCostTier;
  coveragePercent: number;
  uvProtectionPercent: number;
  heatReductionPercent: number;
  visibleLightTransmissionPercent: number;
  glareReductionPercent: number;
  privacyRating: number;
  installationDifficulty: 'easy' | 'moderate' | 'professional';
  confidence: FilmConfidence;
  stockRollSuggestions: number[];
  orderingRecommendation: FilmOrderingRecommendation;
  warnings: FilmWarning[];
}

export const FILM_DEFAULTS = {
  INSTALL_MARGIN_MM: 25.4, // 1 inch trimming margin per side (+2" total)
  STANDARD_ROLL_WIDTHS_MM: [457.2, 609.6, 762.0, 914.4, 1219.2, 1524.0], // 18", 24", 30", 36", 48", 60"
  MIN_WINDOW_WIDTH_MM: 152.4, // 6"
  MIN_WINDOW_HEIGHT_MM: 152.4, // 6"
  MAX_WINDOW_WIDTH_MM: 3048.0, // 120"
};

export const FILM_TYPE_DATA: Record<FilmType, FilmTypeSpec> = {
  privacy: {
    vltPercent: 15,
    uvBlockPercent: 99,
    heatReductionPercent: 45,
    glareReductionPercent: 80,
    privacyRating: 9.0,
    costPerM2: 18.0,
    expectedLifespanYears: 10,
    displayName: 'Day/Night Privacy Tint',
  },
  frosted: {
    vltPercent: 60,
    uvBlockPercent: 99,
    heatReductionPercent: 25,
    glareReductionPercent: 50,
    privacyRating: 10.0,
    costPerM2: 15.0,
    expectedLifespanYears: 12,
    displayName: 'Matte Frosted Architectural Film',
  },
  decorative: {
    vltPercent: 50,
    uvBlockPercent: 98,
    heatReductionPercent: 20,
    glareReductionPercent: 40,
    privacyRating: 8.0,
    costPerM2: 22.0,
    expectedLifespanYears: 10,
    displayName: 'Patterned Decorative Stained Film',
  },
  reflective: {
    vltPercent: 18,
    uvBlockPercent: 99,
    heatReductionPercent: 75,
    glareReductionPercent: 85,
    privacyRating: 9.0,
    costPerM2: 24.0,
    expectedLifespanYears: 12,
    displayName: 'Reflective Silver Solar Mirror',
  },
  security: {
    vltPercent: 85,
    uvBlockPercent: 99,
    heatReductionPercent: 15,
    glareReductionPercent: 10,
    privacyRating: 2.0,
    costPerM2: 30.0,
    expectedLifespanYears: 15,
    displayName: 'Clear Safety & Security Armor (8 Mil)',
  },
  'uv-protection': {
    vltPercent: 70,
    uvBlockPercent: 99.9,
    heatReductionPercent: 40,
    glareReductionPercent: 30,
    privacyRating: 2.0,
    costPerM2: 20.0,
    expectedLifespanYears: 15,
    displayName: 'Clear Museum-Grade UV Shield',
  },
  'heat-control': {
    vltPercent: 35,
    uvBlockPercent: 99,
    heatReductionPercent: 70,
    glareReductionPercent: 65,
    privacyRating: 5.0,
    costPerM2: 26.0,
    expectedLifespanYears: 12,
    displayName: 'Dual-Reflective Sun Heat Control',
  },
  'one-way-mirror': {
    vltPercent: 10,
    uvBlockPercent: 99,
    heatReductionPercent: 78,
    glareReductionPercent: 90,
    privacyRating: 9.5,
    costPerM2: 28.0,
    expectedLifespanYears: 10,
    displayName: 'One-Way Daytime Mirror Film',
  },
};

export function calcFilmDimensions(
  windowWidthMm: number,
  windowHeightMm: number
): { filmWidthMm: number; filmHeightMm: number; filmAreaM2: number; filmAreaSqFt: number } {
  const filmWidthMm = windowWidthMm + 2 * FILM_DEFAULTS.INSTALL_MARGIN_MM;
  const filmHeightMm = windowHeightMm + 2 * FILM_DEFAULTS.INSTALL_MARGIN_MM;
  const filmAreaM2 = (filmWidthMm / 1000) * (filmHeightMm / 1000);
  const filmAreaSqFt = filmAreaM2 * 10.7639;
  return { filmWidthMm, filmHeightMm, filmAreaM2, filmAreaSqFt };
}

export function selectOptimalRollWidth(
  filmWidthMm: number,
  filmHeightMm: number,
  userRollWidthMm: number = 0
): { requiredRollWidthMm: number; requiredRollLengthMm: number; totalFilmRequiredM2: number } {
  if (userRollWidthMm > 0) {
    const requiredRollWidthMm = userRollWidthMm;
    const requiredRollLengthMm = filmWidthMm <= userRollWidthMm ? filmHeightMm : filmWidthMm;
    const totalFilmRequiredM2 = (requiredRollWidthMm / 1000) * (requiredRollLengthMm / 1000);
    return { requiredRollWidthMm, requiredRollLengthMm, totalFilmRequiredM2 };
  }

  const rolls = FILM_DEFAULTS.STANDARD_ROLL_WIDTHS_MM;
  const minDim = Math.min(filmWidthMm, filmHeightMm);
  const maxDim = Math.max(filmWidthMm, filmHeightMm);

  // Find smallest roll that covers min dimension (orient roll lengthwise)
  let fitRoll = rolls.find((r) => r >= minDim);
  let requiredRollLengthMm = maxDim;

  if (!fitRoll) {
    // If wider than max standard roll (60"), use 60" roll and seam length
    fitRoll = 1524.0;
    requiredRollLengthMm = maxDim;
  }

  const requiredRollWidthMm = fitRoll;
  const totalFilmRequiredM2 = (requiredRollWidthMm / 1000) * (requiredRollLengthMm / 1000);

  return { requiredRollWidthMm, requiredRollLengthMm, totalFilmRequiredM2 };
}

export function calcWastePercent(
  windowWidthMm: number,
  windowHeightMm: number,
  totalFilmRequiredM2: number
): number {
  const windowAreaM2 = (windowWidthMm / 1000) * (windowHeightMm / 1000);
  if (totalFilmRequiredM2 <= 0) return 0;
  const wasteM2 = Math.max(0, totalFilmRequiredM2 - windowAreaM2);
  return Math.round((wasteM2 / totalFilmRequiredM2) * 1000) / 10;
}

export function calcFilmCost(
  totalFilmRequiredM2: number,
  filmType: FilmType
): { materialCostEstimate: number; costTier: FilmCostTier } {
  const spec = FILM_TYPE_DATA[filmType] ?? FILM_TYPE_DATA.privacy;
  const rawCost = totalFilmRequiredM2 * spec.costPerM2 + 5.0; // $5 application kit allowance
  const materialCostEstimate = Math.round(rawCost * 100) / 100;

  let costTier: FilmCostTier = '$';
  if (materialCostEstimate > 75) costTier = '$$$$';
  else if (materialCostEstimate > 45) costTier = '$$$';
  else if (materialCostEstimate > 25) costTier = '$$';

  return { materialCostEstimate, costTier };
}

export function calcAdjustedHeatReduction(
  baseHeatRed: number,
  orientation: FilmOrientation,
  climate: FilmClimate
): number {
  let adj = baseHeatRed;
  if (orientation === 'south' || orientation === 'west') adj += 5;
  if (climate === 'hot') adj += 5;
  return Math.min(95, adj);
}

export function calcInstallationDifficulty(
  filmType: FilmType,
  installation: FilmInstallation,
  windowWidthMm: number,
  windowHeightMm: number
): 'easy' | 'moderate' | 'professional' {
  if (filmType === 'security' || installation === 'exterior' || windowWidthMm > 1828 || windowHeightMm > 1828) {
    return 'professional';
  }
  if (filmType === 'reflective' || filmType === 'one-way-mirror' || filmType === 'heat-control') {
    return 'moderate';
  }
  return 'easy';
}

export function calcConfidence(
  result: Pick<FilmResult, 'orderingRecommendation' | 'warnings'>,
  input: FilmInput
): FilmConfidence {
  const hasError = result.warnings.some((w) => w.level === 'error');
  if (hasError) return 'custom-required';

  if (result.orderingRecommendation === 'exact') return 'excellent';
  if (result.orderingRecommendation === 'next-stock') return 'good';
  if (result.orderingRecommendation === 'trim') return 'minor-adjustment';
  return 'custom-required';
}

export function findClosestStockRollWidths(valueMm: number, count: number = 3): number[] {
  const stock = FILM_DEFAULTS.STANDARD_ROLL_WIDTHS_MM;
  const sorted = [...stock].sort((a, b) => Math.abs(a - valueMm) - Math.abs(b - valueMm));
  return sorted.slice(0, count).sort((a, b) => a - b);
}

export function calcOrderingRecommendation(
  filmWidthMm: number,
  stockWidths: number[] = FILM_DEFAULTS.STANDARD_ROLL_WIDTHS_MM
): FilmOrderingRecommendation {
  const exact = stockWidths.find((s) => Math.abs(s - filmWidthMm) <= 2.0);
  if (exact) return 'exact';

  const nextLarger = stockWidths.find((s) => s > filmWidthMm && s - filmWidthMm <= 50.8); // 2" trim
  if (nextLarger) return 'next-stock';

  const trimmable = stockWidths.find((s) => s > filmWidthMm && s - filmWidthMm <= 152.4); // 6" trim
  if (trimmable) return 'trim';

  return 'custom';
}

export function buildFilmWarnings(input: FilmInput, result: Partial<FilmResult>): FilmWarning[] {
  const warnings: FilmWarning[] = [];

  if (input.windowWidthMm < FILM_DEFAULTS.MIN_WINDOW_WIDTH_MM) {
    warnings.push({
      level: 'error',
      code: 'WIDTH_TOO_SMALL',
      message: 'Window width is below minimum 6 inches (152 mm).',
    });
  }

  if (input.windowHeightMm < FILM_DEFAULTS.MIN_WINDOW_HEIGHT_MM) {
    warnings.push({
      level: 'error',
      code: 'HEIGHT_TOO_SMALL',
      message: 'Window height is below minimum 6 inches (152 mm).',
    });
  }

  // Thermal stress warning for double-pane glass + reflective/dark solar film
  if (input.glassType === 'double-pane' && (input.filmType === 'reflective' || input.filmType === 'one-way-mirror')) {
    warnings.push({
      level: 'warning',
      code: 'DOUBLE_PANE_THERMAL_STRESS',
      message:
        'Reflective film on interior of double-pane glass increases heat absorption between panes. Verify seal warranty or use exterior film.',
    });
  }

  if (input.installation === 'exterior') {
    warnings.push({
      level: 'info',
      code: 'EXTERIOR_INSTALL_WEATHER',
      message: 'Exterior film requires hard-coat weather treatment and sealant edge sealing.',
    });
  }

  if (input.windowWidthMm > 1524 || input.windowHeightMm > 1524) {
    warnings.push({
      level: 'info',
      code: 'LARGE_WINDOW_SEAM',
      message: 'Window exceeds 60 inches. Installation will require a clean vertical seam join.',
    });
  }

  return warnings;
}

export function calculateFilm(input: FilmInput): FilmResult {
  const { filmWidthMm, filmHeightMm, filmAreaM2, filmAreaSqFt } = calcFilmDimensions(
    input.windowWidthMm,
    input.windowHeightMm
  );

  const { requiredRollWidthMm, requiredRollLengthMm, totalFilmRequiredM2 } = selectOptimalRollWidth(
    filmWidthMm,
    filmHeightMm,
    input.rollWidthMm
  );

  const totalFilmRequiredSqFt = totalFilmRequiredM2 * 10.7639;
  const wastePercent = calcWastePercent(input.windowWidthMm, input.windowHeightMm, totalFilmRequiredM2);

  const spec = FILM_TYPE_DATA[input.filmType] ?? FILM_TYPE_DATA.privacy;
  const { materialCostEstimate, costTier } = calcFilmCost(totalFilmRequiredM2, input.filmType);
  const heatReductionPercent = calcAdjustedHeatReduction(spec.heatReductionPercent, input.orientation, input.climate);

  const installationDifficulty = calcInstallationDifficulty(
    input.filmType,
    input.installation,
    input.windowWidthMm,
    input.windowHeightMm
  );

  const stockRollSuggestions = findClosestStockRollWidths(filmWidthMm, 3);
  const orderingRecommendation = calcOrderingRecommendation(filmWidthMm, FILM_DEFAULTS.STANDARD_ROLL_WIDTHS_MM);

  const warnings = buildFilmWarnings(input, { filmWidthMm, filmHeightMm });
  const confidence = calcConfidence({ orderingRecommendation, warnings }, input);

  return {
    filmWidthMm,
    filmHeightMm,
    filmAreaM2,
    filmAreaSqFt,
    requiredRollWidthMm,
    requiredRollLengthMm,
    totalFilmRequiredM2,
    totalFilmRequiredSqFt,
    wastePercent,
    materialCostEstimate,
    costTier,
    coveragePercent: 100,
    uvProtectionPercent: spec.uvBlockPercent,
    heatReductionPercent,
    visibleLightTransmissionPercent: spec.vltPercent,
    glareReductionPercent: spec.glareReductionPercent,
    privacyRating: spec.privacyRating,
    installationDifficulty,
    confidence,
    stockRollSuggestions,
    orderingRecommendation,
    warnings,
  };
}
