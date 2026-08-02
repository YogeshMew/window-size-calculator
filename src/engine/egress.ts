/**
 * WindowMetrics — Egress Window Calculation Engine
 *
 * Pure TypeScript implementation for IRC Section R310 emergency escape & rescue building codes.
 * Computes net clear opening width, height, area (sq ft & m²), opening percentages,
 * Pass / Fail compliance status, area/width/height shortfalls, and recommended replacement dimensions.
 *
 * Rule: All internal calculations are performed in millimeters (mm).
 */

export type EgressWindowStyle = 'casement' | 'sliding' | 'single-hung' | 'double-hung' | 'awning' | 'hopper' | 'picture';
export type EgressMeasurementType = 'clear-opening' | 'existing-opening' | 'rough-opening';
export type EgressLocation = 'basement' | 'bedroom' | 'living-room' | 'other';
export type EgressWarnLevel = 'error' | 'warning' | 'info';
export type EgressConfidence = 'excellent' | 'good' | 'minor-adjustment' | 'custom-required';
export type EgressComplianceStatus = 'pass' | 'fail' | 'warning';

export interface EgressWarning {
  level: EgressWarnLevel;
  code: string;
  message: string;
}

export interface EgressInput {
  windowWidthMm: number;
  windowHeightMm: number;
  windowStyle: EgressWindowStyle;
  measurementType: EgressMeasurementType;
  location: EgressLocation;
  openingPercentage?: number;
  sillHeightMm?: number;
}

export interface EgressResult {
  netClearWidthMm: number;
  netClearHeightMm: number;
  openingAreaM2: number;
  openingAreaSqFt: number;
  openingPercentage: number;
  minRequiredAreaSqFt: number;
  minRequiredWidthMm: number;
  minRequiredHeightMm: number;
  complianceStatus: EgressComplianceStatus;
  pass: boolean;
  areaShortfallSqFt: number;
  widthShortfallMm: number;
  heightShortfallMm: number;
  recommendedWidthMm: number;
  recommendedHeightMm: number;
  recommendedWindowStyle: EgressWindowStyle;
  complianceScore: number;
  confidence: EgressConfidence;
  warnings: EgressWarning[];
}

export const IRC_EGRESS_DEFAULTS = {
  MIN_NET_CLEAR_AREA_SQFT_STANDARD: 5.7, // IRC R310.2.1 (529,547 mm²)
  MIN_NET_CLEAR_AREA_SQFT_GRADE: 5.0,    // IRC R310.2.1 Grade floor (464,515 mm²)
  MIN_NET_CLEAR_WIDTH_MM: 508.0,         // IRC R310.2.2 (20 inches)
  MIN_NET_CLEAR_HEIGHT_MM: 609.6,        // IRC R310.2.3 (24 inches)
  MAX_SILL_HEIGHT_MM: 1117.6,            // IRC R310.2.4 (44 inches)
  DEFAULT_SILL_HEIGHT_MM: 914.4,         // 36 inches default sill height
};

export const STYLE_OPENING_PERCENTAGES: Record<EgressWindowStyle, number> = {
  casement: 90,     // Hinge out achieves ~90% clear opening of frame width
  sliding: 45,      // Half slides over half = 45% clear opening
  'single-hung': 45, // Lower sash slides up = 45% clear opening
  'double-hung': 42, // Both sashes overlap = 42% clear opening
  awning: 75,       // Top hinge outward crank
  hopper: 80,       // Bottom hinge inward crank
  picture: 0,       // Non-operable fixed glass
};

export const MEASUREMENT_FACTORS: Record<EgressMeasurementType, number> = {
  'clear-opening': 1.0,    // Direct net clear measurement
  'existing-opening': 0.92, // Inside sash frame measurement
  'rough-opening': 0.85,    // Wall stud rough opening
};

export const LOCATION_PROFILES: Record<EgressLocation, { minAreaSqFt: number; requiresEmergencyEscape: boolean; requiresWindowWell: boolean }> = {
  basement: { minAreaSqFt: 5.7, requiresEmergencyEscape: true, requiresWindowWell: true },
  bedroom: { minAreaSqFt: 5.7, requiresEmergencyEscape: true, requiresWindowWell: false },
  'living-room': { minAreaSqFt: 5.0, requiresEmergencyEscape: false, requiresWindowWell: false },
  other: { minAreaSqFt: 5.0, requiresEmergencyEscape: false, requiresWindowWell: false },
};

export function calcNetClearDimensions(
  windowWidthMm: number,
  windowHeightMm: number,
  windowStyle: EgressWindowStyle,
  measurementType: EgressMeasurementType,
  customOpeningPct?: number
): { netClearWidthMm: number; netClearHeightMm: number; openingPercentage: number } {
  const basePct = customOpeningPct && customOpeningPct > 0
    ? customOpeningPct
    : (STYLE_OPENING_PERCENTAGES[windowStyle] ?? 45);

  const mFactor = MEASUREMENT_FACTORS[measurementType] ?? 1.0;
  const effPct = (basePct / 100) * mFactor;

  let netClearWidthMm = 0;
  let netClearHeightMm = 0;

  if (windowStyle === 'casement') {
    // Casement takes reduction on width only (height stays near full clear height)
    netClearWidthMm = windowWidthMm * effPct;
    netClearHeightMm = windowHeightMm * Math.min(0.95, mFactor);
  } else if (windowStyle === 'sliding') {
    // Sliding takes reduction on width (sash slides horizontally)
    netClearWidthMm = windowWidthMm * effPct;
    netClearHeightMm = windowHeightMm * Math.min(0.92, mFactor);
  } else if (windowStyle === 'single-hung' || windowStyle === 'double-hung') {
    // Hung windows take reduction on height (sash slides vertically)
    netClearWidthMm = windowWidthMm * Math.min(0.92, mFactor);
    netClearHeightMm = windowHeightMm * effPct;
  } else if (windowStyle === 'picture') {
    netClearWidthMm = 0;
    netClearHeightMm = 0;
  } else {
    // Awning / Hopper / Other
    netClearWidthMm = windowWidthMm * Math.sqrt(effPct);
    netClearHeightMm = windowHeightMm * Math.sqrt(effPct);
  }

  netClearWidthMm = Math.max(0, netClearWidthMm);
  netClearHeightMm = Math.max(0, netClearHeightMm);

  return { netClearWidthMm, netClearHeightMm, openingPercentage: basePct };
}

export function calcOpeningArea(
  netClearWidthMm: number,
  netClearHeightMm: number
): { openingAreaM2: number; openingAreaSqFt: number } {
  const openingAreaM2 = (netClearWidthMm / 1000) * (netClearHeightMm / 1000);
  const openingAreaSqFt = openingAreaM2 * 10.7639;
  return { openingAreaM2, openingAreaSqFt };
}

export function checkEgressCompliance(
  netClearWidthMm: number,
  netClearHeightMm: number,
  openingAreaSqFt: number,
  location: EgressLocation,
  sillHeightMm: number = IRC_EGRESS_DEFAULTS.DEFAULT_SILL_HEIGHT_MM
): { pass: boolean; complianceStatus: EgressComplianceStatus; minRequiredAreaSqFt: number } {
  const profile = LOCATION_PROFILES[location] ?? LOCATION_PROFILES.bedroom;
  const minRequiredAreaSqFt = profile.minAreaSqFt;

  const widthOk = netClearWidthMm >= IRC_EGRESS_DEFAULTS.MIN_NET_CLEAR_WIDTH_MM;
  const heightOk = netClearHeightMm >= IRC_EGRESS_DEFAULTS.MIN_NET_CLEAR_HEIGHT_MM;
  const areaOk = openingAreaSqFt >= minRequiredAreaSqFt;
  const sillOk = sillHeightMm <= IRC_EGRESS_DEFAULTS.MAX_SILL_HEIGHT_MM;

  const pass = widthOk && heightOk && areaOk && sillOk;

  let complianceStatus: EgressComplianceStatus = 'pass';
  if (!pass) {
    if (areaOk && (widthOk || heightOk)) complianceStatus = 'warning';
    else complianceStatus = 'fail';
  }

  return { pass, complianceStatus, minRequiredAreaSqFt };
}

export function calcComplianceScore(
  netClearWidthMm: number,
  netClearHeightMm: number,
  openingAreaSqFt: number,
  location: EgressLocation,
  sillHeightMm: number = IRC_EGRESS_DEFAULTS.DEFAULT_SILL_HEIGHT_MM
): number {
  const profile = LOCATION_PROFILES[location] ?? LOCATION_PROFILES.bedroom;
  const reqArea = profile.minAreaSqFt;

  const areaScore = Math.min(1.0, openingAreaSqFt / reqArea) * 40;
  const widthScore = Math.min(1.0, netClearWidthMm / IRC_EGRESS_DEFAULTS.MIN_NET_CLEAR_WIDTH_MM) * 30;
  const heightScore = Math.min(1.0, netClearHeightMm / IRC_EGRESS_DEFAULTS.MIN_NET_CLEAR_HEIGHT_MM) * 30;

  let score = Math.round(areaScore + widthScore + heightScore);
  if (sillHeightMm > IRC_EGRESS_DEFAULTS.MAX_SILL_HEIGHT_MM) {
    score = Math.max(0, score - 20);
  }

  return Math.min(100, Math.max(0, score));
}

export function suggestCompliantStyle(windowWidthMm: number, windowHeightMm: number): EgressWindowStyle {
  // Casement is the most space-efficient for egress (needs smaller frame)
  if (windowWidthMm < 914.4) return 'casement';
  return 'casement';
}

export function calcRecommendedDimensions(
  windowStyle: EgressWindowStyle,
  location: EgressLocation
): { recommendedWidthMm: number; recommendedHeightMm: number } {
  // Minimum frame size for casement to achieve 5.7 sq ft (20" clear width x 41" clear height)
  if (windowStyle === 'casement') {
    return { recommendedWidthMm: 609.6, recommendedHeightMm: 1219.2 }; // 24" x 48" frame
  }
  // Sliding / Double-hung need larger frame (e.g. 48" x 48" or 36" x 60")
  if (windowStyle === 'sliding') {
    return { recommendedWidthMm: 1219.2, recommendedHeightMm: 1219.2 }; // 48" x 48" frame
  }
  return { recommendedWidthMm: 914.4, recommendedHeightMm: 1524.0 }; // 36" x 60" frame
}

export function buildEgressWarnings(input: EgressInput, result: Partial<EgressResult>): EgressWarning[] {
  const warnings: EgressWarning[] = [];

  if (input.windowStyle === 'picture') {
    warnings.push({
      level: 'error',
      code: 'PICTURE_WINDOW_NON_OPERABLE',
      message: 'Picture (fixed) windows do not open and cannot serve as emergency egress windows.',
    });
  }

  if (result.netClearWidthMm !== undefined && result.netClearWidthMm < IRC_EGRESS_DEFAULTS.MIN_NET_CLEAR_WIDTH_MM) {
    warnings.push({
      level: 'error',
      code: 'WIDTH_TOO_NARROW',
      message: `Net clear opening width is ${(result.netClearWidthMm / 25.4).toFixed(1)}" — below IRC 20.0" minimum requirement.`,
    });
  }

  if (result.netClearHeightMm !== undefined && result.netClearHeightMm < IRC_EGRESS_DEFAULTS.MIN_NET_CLEAR_HEIGHT_MM) {
    warnings.push({
      level: 'error',
      code: 'HEIGHT_TOO_SHORT',
      message: `Net clear opening height is ${(result.netClearHeightMm / 25.4).toFixed(1)}" — below IRC 24.0" minimum requirement.`,
    });
  }

  if (result.openingAreaSqFt !== undefined && result.openingAreaSqFt < (result.minRequiredAreaSqFt ?? 5.7)) {
    warnings.push({
      level: 'error',
      code: 'AREA_TOO_SMALL',
      message: `Opening area is ${result.openingAreaSqFt.toFixed(2)} sq ft — below IRC ${(result.minRequiredAreaSqFt ?? 5.7).toFixed(1)} sq ft minimum.`,
    });
  }

  if (input.sillHeightMm && input.sillHeightMm > IRC_EGRESS_DEFAULTS.MAX_SILL_HEIGHT_MM) {
    warnings.push({
      level: 'warning',
      code: 'SILL_TOO_HIGH',
      message: `Sill height is ${(input.sillHeightMm / 25.4).toFixed(1)}" above floor — exceeds IRC 44.0" maximum limit. Step/ladder required.`,
    });
  }

  if (input.windowStyle === 'sliding' || input.windowStyle === 'double-hung') {
    if (result.pass === false) {
      warnings.push({
        level: 'info',
        code: 'CASEMENT_RECOMMENDED',
        message: 'Switching from Sliding/Double-Hung to a Casement window style will double your openable egress area in the same opening.',
      });
    }
  }

  if (input.location === 'basement') {
    warnings.push({
      level: 'info',
      code: 'WINDOW_WELL_REQUIRED',
      message: 'Below-grade basement egress windows require a window well with at least 9 sq ft clear floor space and a built-in ladder if deeper than 44 inches.',
    });
  }

  return warnings;
}

export function calculateEgressWindow(input: EgressInput): EgressResult {
  const { netClearWidthMm, netClearHeightMm, openingPercentage } = calcNetClearDimensions(
    input.windowWidthMm,
    input.windowHeightMm,
    input.windowStyle,
    input.measurementType,
    input.openingPercentage
  );

  const { openingAreaM2, openingAreaSqFt } = calcOpeningArea(netClearWidthMm, netClearHeightMm);
  const sillHeightMm = input.sillHeightMm ?? IRC_EGRESS_DEFAULTS.DEFAULT_SILL_HEIGHT_MM;

  const { pass, complianceStatus, minRequiredAreaSqFt } = checkEgressCompliance(
    netClearWidthMm,
    netClearHeightMm,
    openingAreaSqFt,
    input.location,
    sillHeightMm
  );

  const areaShortfallSqFt = Math.max(0, Math.round((minRequiredAreaSqFt - openingAreaSqFt) * 100) / 100);
  const widthShortfallMm = Math.max(0, IRC_EGRESS_DEFAULTS.MIN_NET_CLEAR_WIDTH_MM - netClearWidthMm);
  const heightShortfallMm = Math.max(0, IRC_EGRESS_DEFAULTS.MIN_NET_CLEAR_HEIGHT_MM - netClearHeightMm);

  const { recommendedWidthMm, recommendedHeightMm } = calcRecommendedDimensions(input.windowStyle, input.location);
  const recommendedWindowStyle = suggestCompliantStyle(input.windowWidthMm, input.windowHeightMm);

  const complianceScore = calcComplianceScore(netClearWidthMm, netClearHeightMm, openingAreaSqFt, input.location, sillHeightMm);

  const warnings = buildEgressWarnings(input, {
    netClearWidthMm,
    netClearHeightMm,
    openingAreaSqFt,
    minRequiredAreaSqFt,
    pass,
  });

  let confidence: EgressConfidence = 'excellent';
  if (!pass) {
    confidence = complianceStatus === 'warning' ? 'minor-adjustment' : 'custom-required';
  }

  return {
    netClearWidthMm,
    netClearHeightMm,
    openingAreaM2,
    openingAreaSqFt,
    openingPercentage,
    minRequiredAreaSqFt,
    minRequiredWidthMm: IRC_EGRESS_DEFAULTS.MIN_NET_CLEAR_WIDTH_MM,
    minRequiredHeightMm: IRC_EGRESS_DEFAULTS.MIN_NET_CLEAR_HEIGHT_MM,
    complianceStatus,
    pass,
    areaShortfallSqFt,
    widthShortfallMm,
    heightShortfallMm,
    recommendedWidthMm,
    recommendedHeightMm,
    recommendedWindowStyle,
    complianceScore,
    confidence,
    warnings,
  };
}
