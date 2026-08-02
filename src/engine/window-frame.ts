/**
 * WindowMetrics — Window Frame Calculation Engine
 *
 * Pure TypeScript carpentry and manufacturing calculation engine.
 * Calculates exact outer frame dimensions, inner daylight opening, net glass rabbet size,
 * 4-piece timber/profile cut list (Top Rail, Bottom Rail, Left Stile, Right Stile),
 * total linear material length, profile volume, material weight, and waste allowance.
 */

import type { MeasurementUnit } from '@/types/calculator.js';

export type WindowFrameMaterial = 'wood' | 'aluminum' | 'vinyl' | 'fiberglass';
export type WindowFrameAssemblyType = 'butt' | 'miter';

export type WindowFrameWarnLevel = 'error' | 'warning' | 'info';
export type WindowFrameConfidence = 'excellent' | 'good' | 'minor-adjustment' | 'custom-required';

export interface WindowFrameWarning {
  level: WindowFrameWarnLevel;
  code: string;
  message: string;
}

export interface WindowFrameCutItem {
  name: string; // 'Top Rail' | 'Bottom Rail' | 'Left Stile' | 'Right Stile'
  lengthMm: number;
  lengthIn: number;
  miterAngleLeft: number;  // e.g. 45 or 90
  miterAngleRight: number; // e.g. 45 or 90
  quantity: number;
  note: string;
}

export interface WindowFrameInput {
  openingWidthMm: number;
  openingHeightMm: number;
  frameMaterial: WindowFrameMaterial;
  profileWidthMm: number;     // Face profile width (e.g., 50.8mm / 2.0")
  profileThicknessMm: number; // Frame depth thickness (e.g., 38.1mm / 1.5")
  assemblyType: WindowFrameAssemblyType;
  glassThicknessMm?: number;  // Glazing rabbet allowance
  wastePct?: number;
  quantity?: number;
}

export interface WindowFrameResult {
  outerWidthMm: number;
  outerHeightMm: number;
  outerWidthIn: number;
  outerHeightIn: number;

  innerWidthMm: number;
  innerHeightMm: number;
  innerWidthIn: number;
  innerHeightIn: number;

  glassOpeningWidthMm: number;
  glassOpeningHeightMm: number;
  glassOpeningWidthIn: number;
  glassOpeningHeightIn: number;

  frameAreaM2: number;
  frameAreaSqFt: number;
  framePerimeterM: number;
  framePerimeterFt: number;

  totalMaterialLengthM: number;
  totalMaterialLengthFt: number;
  totalMaterialLengthWithWasteFt: number;

  materialVolumeM3: number;
  materialVolumeCuFt: number;

  estimatedWeightKg: number;
  estimatedWeightLbs: number;

  cutList: WindowFrameCutItem[];

  confidence: WindowFrameConfidence;
  warnings: WindowFrameWarning[];
}

// ---------------------------------------------------------------------------
// Material Density & Constants (No magic numbers)
// ---------------------------------------------------------------------------

export const WINDOW_FRAME_DEFAULTS = {
  MIN_OPENING_MM: 152.4, // 6"
  MAX_OPENING_MM: 6096,  // 240" (20 ft)
  DEFAULT_PROFILE_WIDTH_MM: 50.8,   // 2" face width
  DEFAULT_PROFILE_THICKNESS_MM: 38.1,// 1.5" frame depth
  GLASS_RABBET_DEPTH_MM: 12.7,      // 1/2" glass seating pocket depth
  DEFAULT_WASTE_PCT: 10,
};

/** Material density in kg/m³ for weight calculations */
export const MATERIAL_DENSITY_KG_M3: Record<WindowFrameMaterial, number> = {
  wood: 550,       // Pine/Fir softwood avg
  vinyl: 1400,     // Rigid PVC profile
  fiberglass: 1800,// Pultruded fiberglass composite
  aluminum: 2700,  // Standard extruded architectural aluminum
};

// ---------------------------------------------------------------------------
// Main calculation engine
// ---------------------------------------------------------------------------

export function calculateWindowFrame(input: WindowFrameInput): WindowFrameResult {
  const warnings: WindowFrameWarning[] = [];

  const qty = Math.max(1, Math.round(input.quantity || 1));
  const wastePct = Math.max(0, Math.min(50, input.wastePct ?? WINDOW_FRAME_DEFAULTS.DEFAULT_WASTE_PCT));
  const wMm = Math.max(WINDOW_FRAME_DEFAULTS.MIN_OPENING_MM, input.openingWidthMm);
  const hMm = Math.max(WINDOW_FRAME_DEFAULTS.MIN_OPENING_MM, input.openingHeightMm);

  const profW = Math.max(12.7, input.profileWidthMm || WINDOW_FRAME_DEFAULTS.DEFAULT_PROFILE_WIDTH_MM);
  const profT = Math.max(12.7, input.profileThicknessMm || WINDOW_FRAME_DEFAULTS.DEFAULT_PROFILE_THICKNESS_MM);

  // 1. Outer Frame & Inner Daylight Opening Dimensions
  const outerWidthMm = wMm;
  const outerHeightMm = hMm;

  const innerWidthMm = Math.max(50, outerWidthMm - 2 * profW);
  const innerHeightMm = Math.max(50, outerHeightMm - 2 * profW);

  const outerWidthIn = Math.round((outerWidthMm / 25.4) * 100) / 100;
  const outerHeightIn = Math.round((outerHeightMm / 25.4) * 100) / 100;
  const innerWidthIn = Math.round((innerWidthMm / 25.4) * 100) / 100;
  const innerHeightIn = Math.round((innerHeightMm / 25.4) * 100) / 100;

  // 2. Glass Rabbet Opening Size (+1/2" seating pocket around inner opening)
  const rabbetDepth = WINDOW_FRAME_DEFAULTS.GLASS_RABBET_DEPTH_MM;
  const glassOpeningWidthMm = innerWidthMm + 2 * rabbetDepth;
  const glassOpeningHeightMm = innerHeightMm + 2 * rabbetDepth;
  const glassOpeningWidthIn = Math.round((glassOpeningWidthMm / 25.4) * 100) / 100;
  const glassOpeningHeightIn = Math.round((glassOpeningHeightMm / 25.4) * 100) / 100;

  // 3. Perimeter & Area
  const outerM = (outerWidthMm + outerHeightMm) * 2 / 1000;
  const outerSqM = (outerWidthMm * outerHeightMm) / 1000000;
  const innerSqM = (innerWidthMm * innerHeightMm) / 1000000;

  const frameAreaM2 = (outerSqM - innerSqM) * qty;
  const frameAreaSqFt = frameAreaM2 * 10.76391;

  const framePerimeterM = outerM * qty;
  const framePerimeterFt = framePerimeterM * 3.28084;

  // 4. Cut List Generation
  const cutList: WindowFrameCutItem[] = [];

  if (input.assemblyType === 'miter') {
    // 45° Miter Joints — All 4 pieces match full outer length
    cutList.push({
      name: 'Top Rail',
      lengthMm: outerWidthMm,
      lengthIn: outerWidthIn,
      miterAngleLeft: 45,
      miterAngleRight: 45,
      quantity: qty,
      note: '45° miter cut on both ends',
    });
    cutList.push({
      name: 'Bottom Rail',
      lengthMm: outerWidthMm,
      lengthIn: outerWidthIn,
      miterAngleLeft: 45,
      miterAngleRight: 45,
      quantity: qty,
      note: '45° miter cut on both ends',
    });
    cutList.push({
      name: 'Left Stile',
      lengthMm: outerHeightMm,
      lengthIn: outerHeightIn,
      miterAngleLeft: 45,
      miterAngleRight: 45,
      quantity: qty,
      note: '45° miter cut on both ends',
    });
    cutList.push({
      name: 'Right Stile',
      lengthMm: outerHeightMm,
      lengthIn: outerHeightIn,
      miterAngleLeft: 45,
      miterAngleRight: 45,
      quantity: qty,
      note: '45° miter cut on both ends',
    });
  } else {
    // 90° Butt Joints — Rails run full width, Stiles fit between rails (Height - 2 * ProfileWidth)
    const stileLengthMm = outerHeightMm - 2 * profW;
    const stileLengthIn = Math.round((stileLengthMm / 25.4) * 100) / 100;

    cutList.push({
      name: 'Top Rail',
      lengthMm: outerWidthMm,
      lengthIn: outerWidthIn,
      miterAngleLeft: 90,
      miterAngleRight: 90,
      quantity: qty,
      note: 'Square 90° butt cut',
    });
    cutList.push({
      name: 'Bottom Rail',
      lengthMm: outerWidthMm,
      lengthIn: outerWidthIn,
      miterAngleLeft: 90,
      miterAngleRight: 90,
      quantity: qty,
      note: 'Square 90° butt cut',
    });
    cutList.push({
      name: 'Left Stile',
      lengthMm: stileLengthMm,
      lengthIn: stileLengthIn,
      miterAngleLeft: 90,
      miterAngleRight: 90,
      quantity: qty,
      note: 'Shortened stile between rails',
    });
    cutList.push({
      name: 'Right Stile',
      lengthMm: stileLengthMm,
      lengthIn: stileLengthIn,
      miterAngleLeft: 90,
      miterAngleRight: 90,
      quantity: qty,
      note: 'Shortened stile between rails',
    });
  }

  // 5. Total Material Length & Weight
  const netMaterialLengthMm = cutList.reduce((acc, item) => acc + item.lengthMm * item.quantity, 0);
  const totalMaterialLengthM = netMaterialLengthMm / 1000;
  const totalMaterialLengthFt = totalMaterialLengthM * 3.28084;
  const totalMaterialLengthWithWasteFt = totalMaterialLengthFt * (1 + wastePct / 100);

  // Profile Volume (Length * Profile Cross-Section Area)
  const profileCrossSectionM2 = (profW / 1000) * (profT / 1000);
  const materialVolumeM3 = totalMaterialLengthM * profileCrossSectionM2;
  const materialVolumeCuFt = materialVolumeM3 * 35.3147;

  // Weight (Volume * Density)
  const density = MATERIAL_DENSITY_KG_M3[input.frameMaterial] || 550;
  const estimatedWeightKg = Math.round(materialVolumeM3 * density * 10) / 10;
  const estimatedWeightLbs = Math.round(estimatedWeightKg * 2.20462 * 10) / 10;

  // 6. Confidence & Warnings
  let confidence: WindowFrameConfidence = 'excellent';
  if (wMm > 3048 || hMm > 3048) {
    confidence = 'minor-adjustment';
    warnings.push({
      level: 'warning',
      code: 'LARGE_FRAME_CORNER_CORNER_BRACING',
      message: 'Frame dimensions exceed 10 ft. Internal steel reinforcing bars or corner angle brackets required.',
    });
  }

  if (input.frameMaterial === 'aluminum' && input.assemblyType === 'butt') {
    warnings.push({
      level: 'info',
      code: 'ALUMINUM_CORNER_KEY_MITER',
      message: 'Aluminum extrusions typically utilize 45° miter joints with internal corner key cleats.',
    });
  }

  return {
    outerWidthMm,
    outerHeightMm,
    outerWidthIn,
    outerHeightIn,

    innerWidthMm,
    innerHeightMm,
    innerWidthIn,
    innerHeightIn,

    glassOpeningWidthMm,
    glassOpeningHeightMm,
    glassOpeningWidthIn,
    glassOpeningHeightIn,

    frameAreaM2: Math.round(frameAreaM2 * 100) / 100,
    frameAreaSqFt: Math.round(frameAreaSqFt * 10) / 10,
    framePerimeterM: Math.round(framePerimeterM * 100) / 100,
    framePerimeterFt: Math.round(framePerimeterFt * 10) / 10,

    totalMaterialLengthM: Math.round(totalMaterialLengthM * 100) / 100,
    totalMaterialLengthFt: Math.round(totalMaterialLengthFt * 10) / 10,
    totalMaterialLengthWithWasteFt: Math.round(totalMaterialLengthWithWasteFt * 10) / 10,

    materialVolumeM3: Math.round(materialVolumeM3 * 10000) / 10000,
    materialVolumeCuFt: Math.round(materialVolumeCuFt * 100) / 100,

    estimatedWeightKg,
    estimatedWeightLbs,

    cutList,

    confidence,
    warnings,
  };
}
