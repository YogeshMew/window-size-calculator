/**
 * WindowMetrics — Window Area Calculation Engine
 *
 * Pure TypeScript geometry & area calculation engine.
 * Calculates single and multi-window area across 9 technical shapes:
 * Rectangle, Square, Circle, Half Circle, Triangle, Trapezoid, Arch, Ellipse, Quarter Circle.
 *
 * Provides conversions across:
 * - Square Meters (m²), Square Feet (sq ft), Square Inches (sq in), Square Centimeters (cm²), Acres, Hectares
 * - Net Glass Area, Film Area (with 1" trim margin), Frame Paint Area, Curtain & Blind Coverage Areas
 */

import type { MeasurementUnit } from '@/types/calculator.js';

export type WindowAreaShape =
  | 'rectangle'
  | 'square'
  | 'circle'
  | 'half-circle'
  | 'triangle'
  | 'trapezoid'
  | 'arch'
  | 'ellipse'
  | 'quarter-circle';

export type WindowAreaWarnLevel = 'error' | 'warning' | 'info';
export type WindowAreaConfidence = 'excellent' | 'good' | 'minor-adjustment' | 'custom-required';

export interface WindowAreaWarning {
  level: WindowAreaWarnLevel;
  code: string;
  message: string;
}

export interface WindowAreaInput {
  windowWidthMm: number;
  windowHeightMm: number;
  shape: WindowAreaShape;
  quantity: number;
  wastePct: number;
  topWidthMm?: number;
  sideHeightMm?: number;
}

export interface WindowAreaResult {
  shape: WindowAreaShape;
  singleAreaM2: number;
  singleAreaSqFt: number;
  singleAreaSqIn: number;
  singleAreaCm2: number;
  singlePerimeterM: number;
  singlePerimeterFt: number;

  totalAreaM2: number;
  totalAreaSqFt: number;
  totalAreaSqIn: number;
  totalAreaCm2: number;
  totalAreaAcres: number;
  totalAreaHectares: number;

  totalAreaWithWasteM2: number;
  totalAreaWithWasteSqFt: number;
  wasteAreaSqFt: number;

  totalPerimeterM: number;
  totalPerimeterFt: number;

  netGlassAreaSqFt: number;
  filmAreaSqFt: number; // includes 1" trimming border margin
  framePaintAreaSqFt: number; // 2" perimeter trim molding surface
  curtainCoverageAreaSqFt: number; // 1.5x width overlap factor
  blindCoverageAreaSqFt: number; // 3" border overlap

  confidence: WindowAreaConfidence;
  warnings: WindowAreaWarning[];
}

export const WINDOW_AREA_DEFAULTS = {
  MIN_DIMENSION_MM: 100, // 4"
  MAX_DIMENSION_MM: 10000, // 393"
  DEFAULT_WASTE_PCT: 10,
  FRAME_DEDUCTION_MM: 38.1, // 1.5" frame border deduction for net glass
  FILM_TRIM_MARGIN_MM: 25.4, // 1" border extension for trimming
  SQFT_TO_ACRES: 43560,
  M2_TO_HECTARES: 10000,
};

// ---------------------------------------------------------------------------
// Geometry Calculation Functions (Pure Math)
// ---------------------------------------------------------------------------

export function calcRawAreaAndPerimeter(
  wMm: number,
  hMm: number,
  shape: WindowAreaShape,
  topWMm?: number,
  sideHMm?: number
): { areaM2: number; perimeterM: number } {
  const wM = wMm / 1000;
  const hM = hMm / 1000;
  const rM = wM / 2;

  let areaM2 = 0;
  let perimeterM = 0;

  switch (shape) {
    case 'square':
      areaM2 = wM * wM;
      perimeterM = 4 * wM;
      break;

    case 'circle':
      areaM2 = Math.PI * Math.pow(rM, 2);
      perimeterM = 2 * Math.PI * rM;
      break;

    case 'half-circle':
      areaM2 = 0.5 * Math.PI * Math.pow(rM, 2);
      perimeterM = Math.PI * rM + 2 * rM;
      break;

    case 'quarter-circle':
      areaM2 = 0.25 * Math.PI * Math.pow(wM, 2);
      perimeterM = 0.5 * Math.PI * wM + 2 * wM;
      break;

    case 'ellipse':
      areaM2 = Math.PI * rM * (hM / 2);
      const a = rM;
      const b = hM / 2;
      // Ramanujan approximation for ellipse perimeter
      perimeterM = Math.PI * (3 * (a + b) - Math.sqrt((3 * a + b) * (a + 3 * b)));
      break;

    case 'triangle':
      areaM2 = 0.5 * wM * hM;
      const hypotenuseM = Math.sqrt(Math.pow(wM / 2, 2) + Math.pow(hM, 2));
      perimeterM = wM + 2 * hypotenuseM;
      break;

    case 'trapezoid':
      const tM = (topWMm ? topWMm : wMm * 0.7) / 1000;
      areaM2 = 0.5 * (wM + tM) * hM;
      const trapSideM = Math.sqrt(Math.pow((wM - tM) / 2, 2) + Math.pow(hM, 2));
      perimeterM = wM + tM + 2 * trapSideM;
      break;

    case 'arch':
      // Rectangular bottom + Half Circle top
      const baseHM = sideHMm ? sideHMm / 1000 : Math.max(0, hM - rM);
      const rectArea = wM * baseHM;
      const archArea = 0.5 * Math.PI * Math.pow(rM, 2);
      areaM2 = rectArea + archArea;
      perimeterM = wM + 2 * baseHM + Math.PI * rM;
      break;

    case 'rectangle':
    default:
      areaM2 = wM * hM;
      perimeterM = 2 * (wM + hM);
      break;
  }

  return { areaM2, perimeterM };
}

// ---------------------------------------------------------------------------
// Main calculation engine
// ---------------------------------------------------------------------------

export function calculateWindowArea(input: WindowAreaInput): WindowAreaResult {
  const warnings: WindowAreaWarning[] = [];

  const qty = Math.max(1, Math.round(input.quantity || 1));
  const wastePct = Math.max(0, Math.min(50, input.wastePct ?? WINDOW_AREA_DEFAULTS.DEFAULT_WASTE_PCT));
  const wMm = Math.max(WINDOW_AREA_DEFAULTS.MIN_DIMENSION_MM, input.windowWidthMm);
  const hMm = Math.max(WINDOW_AREA_DEFAULTS.MIN_DIMENSION_MM, input.windowHeightMm);

  if (wMm > WINDOW_AREA_DEFAULTS.MAX_DIMENSION_MM || hMm > WINDOW_AREA_DEFAULTS.MAX_DIMENSION_MM) {
    warnings.push({
      level: 'warning',
      code: 'LARGE_COMMERCIAL_DIMENSION',
      message: 'Dimensions exceed 10 meters. Field expansion joints or multi-pane mullion divisions required.',
    });
  }

  // 1. Core geometry calculations
  const { areaM2: singleAreaM2, perimeterM: singlePerimeterM } = calcRawAreaAndPerimeter(
    wMm,
    hMm,
    input.shape,
    input.topWidthMm,
    input.sideHeightMm
  );

  const singleAreaSqFt = singleAreaM2 * 10.76391;
  const singleAreaSqIn = singleAreaSqFt * 144;
  const singleAreaCm2 = singleAreaM2 * 10000;
  const singlePerimeterFt = singlePerimeterM * 3.28084;

  // 2. Multi-window totals
  const totalAreaM2 = singleAreaM2 * qty;
  const totalAreaSqFt = singleAreaSqFt * qty;
  const totalAreaSqIn = singleAreaSqIn * qty;
  const totalAreaCm2 = singleAreaCm2 * qty;
  const totalPerimeterM = singlePerimeterM * qty;
  const totalPerimeterFt = singlePerimeterFt * qty;

  const totalAreaAcres = totalAreaSqFt / WINDOW_AREA_DEFAULTS.SQFT_TO_ACRES;
  const totalAreaHectares = totalAreaM2 / WINDOW_AREA_DEFAULTS.M2_TO_HECTARES;

  // 3. Waste allowance
  const wasteMultiplier = 1 + wastePct / 100;
  const totalAreaWithWasteM2 = totalAreaM2 * wasteMultiplier;
  const totalAreaWithWasteSqFt = totalAreaSqFt * wasteMultiplier;
  const wasteAreaSqFt = totalAreaWithWasteSqFt - totalAreaSqFt;

  // 4. Practical trade-specific coverage areas
  // Net Glass Area (deduct 1.5" frame rim)
  const glassWMm = Math.max(50, wMm - 2 * WINDOW_AREA_DEFAULTS.FRAME_DEDUCTION_MM);
  const glassHMm = Math.max(50, hMm - 2 * WINDOW_AREA_DEFAULTS.FRAME_DEDUCTION_MM);
  const { areaM2: glassM2 } = calcRawAreaAndPerimeter(glassWMm, glassHMm, input.shape);
  const netGlassAreaSqFt = Math.round(glassM2 * 10.76391 * qty * 10) / 10;

  // Film Area (add 1" trimming border margin all around)
  const filmWMm = wMm + 2 * WINDOW_AREA_DEFAULTS.FILM_TRIM_MARGIN_MM;
  const filmHMm = hMm + 2 * WINDOW_AREA_DEFAULTS.FILM_TRIM_MARGIN_MM;
  const { areaM2: filmM2 } = calcRawAreaAndPerimeter(filmWMm, filmHMm, input.shape);
  const filmAreaSqFt = Math.round(filmM2 * 10.76391 * qty * 10) / 10;

  // Frame Paint Area (2" trim casing perimeter surface area)
  const trimWidthM = 0.0508; // 2 inches
  const framePaintAreaSqFt = Math.round(totalPerimeterM * trimWidthM * 10.76391 * 10) / 10;

  // Curtain Coverage Area (1.5x width overlap factor for full fullness gathers)
  const curtainCoverageAreaSqFt = Math.round(totalAreaSqFt * 1.5 * 10) / 10;

  // Blind Coverage Area (3" outside mount extension)
  const blindWMm = wMm + 76.2;
  const blindHMm = hMm + 76.2;
  const { areaM2: blindM2 } = calcRawAreaAndPerimeter(blindWMm, blindHMm, 'rectangle');
  const blindCoverageAreaSqFt = Math.round(blindM2 * 10.76391 * qty * 10) / 10;

  // 5. Confidence score
  let confidence: WindowAreaConfidence = 'excellent';
  if (['arch', 'trapezoid', 'ellipse', 'quarter-circle'].includes(input.shape)) {
    confidence = 'minor-adjustment';
  } else if (totalAreaSqFt > 500) {
    confidence = 'good';
  }

  return {
    shape: input.shape,
    singleAreaM2: Math.round(singleAreaM2 * 1000) / 1000,
    singleAreaSqFt: Math.round(singleAreaSqFt * 100) / 100,
    singleAreaSqIn: Math.round(singleAreaSqIn),
    singleAreaCm2: Math.round(singleAreaCm2),
    singlePerimeterM: Math.round(singlePerimeterM * 100) / 100,
    singlePerimeterFt: Math.round(singlePerimeterFt * 10) / 10,

    totalAreaM2: Math.round(totalAreaM2 * 100) / 100,
    totalAreaSqFt: Math.round(totalAreaSqFt * 100) / 100,
    totalAreaSqIn: Math.round(totalAreaSqIn),
    totalAreaCm2: Math.round(totalAreaCm2),
    totalAreaAcres: Math.round(totalAreaAcres * 10000) / 10000,
    totalAreaHectares: Math.round(totalAreaHectares * 10000) / 10000,

    totalAreaWithWasteM2: Math.round(totalAreaWithWasteM2 * 100) / 100,
    totalAreaWithWasteSqFt: Math.round(totalAreaWithWasteSqFt * 100) / 100,
    wasteAreaSqFt: Math.round(wasteAreaSqFt * 100) / 100,

    totalPerimeterM: Math.round(totalPerimeterM * 100) / 100,
    totalPerimeterFt: Math.round(totalPerimeterFt * 10) / 10,

    netGlassAreaSqFt,
    filmAreaSqFt,
    framePaintAreaSqFt,
    curtainCoverageAreaSqFt,
    blindCoverageAreaSqFt,

    confidence,
    warnings,
  };
}
