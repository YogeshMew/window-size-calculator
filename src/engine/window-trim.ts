/**
 * WindowMetrics — Window Trim Calculation Engine
 *
 * Pure TypeScript finish carpentry calculation engine.
 * Calculates exact trim casing lengths, 4-piece or 5-piece cut list (Head Casing, Side Casings,
 * Window Stool, Apron, Extension Jambs), mitre vs square cut angles, total linear board feet,
 * waste allowances, and material cost estimates across Colonial, Modern, Craftsman, Ranch, and Victorian styles.
 */

import type { MeasurementUnit } from '@/types/calculator.js';

export type WindowTrimStyle = 'colonial' | 'modern' | 'craftsman' | 'ranch' | 'victorian';

export type WindowTrimWarnLevel = 'error' | 'warning' | 'info';
export type WindowTrimConfidence = 'excellent' | 'good' | 'minor-adjustment' | 'custom-required';

export interface WindowTrimWarning {
  level: WindowTrimWarnLevel;
  code: string;
  message: string;
}

export interface WindowTrimCutItem {
  name: string; // 'Head Casing' | 'Left Casing' | 'Right Casing' | 'Window Stool' | 'Apron' | 'Extension Jamb'
  lengthMm: number;
  lengthIn: number;
  cutLeft: string;  // '45° Miter' | '90° Square' | 'Horns/Notch'
  cutRight: string;
  quantity: number;
  note: string;
}

export interface WindowTrimInput {
  windowWidthMm: number;
  windowHeightMm: number;
  trimStyle: WindowTrimStyle;
  trimWidthMm: number;        // Casing width (e.g., 63.5mm / 2.5" or 88.9mm / 3.5")
  trimThicknessMm: number;    // Casing thickness (e.g., 19.05mm / 0.75")
  revealMm: number;           // Jamb margin reveal (default 6.35mm / 0.25")
  extensionJambDepthMm?: number;// 0 if standard wall depth, >0 if deep wall extension
  includeStool: boolean;
  includeApron: boolean;
  wastePct?: number;
  quantity?: number;
}

export interface WindowTrimResult {
  topTrimLengthMm: number;
  topTrimLengthIn: number;

  sideTrimLengthMm: number;
  sideTrimLengthIn: number;

  stoolLengthMm: number;
  stoolLengthIn: number;

  apronLengthMm: number;
  apronLengthIn: number;

  extensionJambLengthTotalFt: number;

  totalLinearLengthFt: number;
  totalLinearLengthWithWasteFt: number;
  wasteLinearLengthFt: number;

  trimAreaSqFt: number;
  estimatedMaterialCost: number;

  cutList: WindowTrimCutItem[];

  confidence: WindowTrimConfidence;
  warnings: WindowTrimWarning[];
}

// ---------------------------------------------------------------------------
// Trim Style Defaults & Pricing (No magic numbers)
// ---------------------------------------------------------------------------

export const WINDOW_TRIM_DEFAULTS = {
  MIN_WINDOW_MM: 152.4, // 6"
  MAX_WINDOW_MM: 6096,  // 240"
  DEFAULT_REVEAL_MM: 6.35, // 1/4" standard reveal margin
  DEFAULT_TRIM_WIDTH_MM: 63.5, // 2.5" casing profile
  DEFAULT_TRIM_THICKNESS_MM: 19.05, // 3/4" casing thickness
  STOOL_HORN_OVERHANG_MM: 38.1, // 1.5" stool horn extension beyond casing
  CRAFTSMAN_OVERHANG_MM: 25.4, // 1" head casing overhang for Craftsman style
  AVG_COST_PER_LINEAR_FT: 2.25, // $2.25 / linear ft primer MDF/pine casing
};

// ---------------------------------------------------------------------------
// Main calculation engine
// ---------------------------------------------------------------------------

export function calculateWindowTrim(input: WindowTrimInput): WindowTrimResult {
  const warnings: WindowTrimWarning[] = [];

  const qty = Math.max(1, Math.round(input.quantity || 1));
  const wastePct = Math.max(0, Math.min(50, input.wastePct ?? 10));
  const wMm = Math.max(WINDOW_TRIM_DEFAULTS.MIN_WINDOW_MM, input.windowWidthMm);
  const hMm = Math.max(WINDOW_TRIM_DEFAULTS.MIN_WINDOW_MM, input.windowHeightMm);

  const trimW = Math.max(25.4, input.trimWidthMm || WINDOW_TRIM_DEFAULTS.DEFAULT_TRIM_WIDTH_MM);
  const trimT = Math.max(9.5, input.trimThicknessMm || WINDOW_TRIM_DEFAULTS.DEFAULT_TRIM_THICKNESS_MM);
  const reveal = input.revealMm !== undefined ? Math.max(0, input.revealMm) : WINDOW_TRIM_DEFAULTS.DEFAULT_REVEAL_MM;
  const extDepth = Math.max(0, input.extensionJambDepthMm || 0);

  // 1. Reveal-adjusted Opening (Distance between inner casing edges)
  const revealWidthMm = wMm + 2 * reveal;
  const revealHeightMm = hMm + 2 * reveal;

  // 2. Piece Length Calculations by Style
  let topTrimLengthMm = 0;
  let sideTrimLengthMm = 0;
  let stoolLengthMm = 0;
  let apronLengthMm = 0;

  const isCraftsman = input.trimStyle === 'craftsman';

  if (input.includeStool) {
    // 3-Sided Casing with Stool & Apron
    // Side casings sit on top of stool
    sideTrimLengthMm = revealHeightMm + trimW; // Runs from top reveal corner down to stool top
    stoolLengthMm = revealWidthMm + 2 * trimW + 2 * WINDOW_TRIM_DEFAULTS.STOOL_HORN_OVERHANG_MM;
    apronLengthMm = revealWidthMm + 2 * trimW;

    if (isCraftsman) {
      // Craftsman style: Thick 5/4 head casing with 1" side overhang
      topTrimLengthMm = revealWidthMm + 2 * trimW + 2 * WINDOW_TRIM_DEFAULTS.CRAFTSMAN_OVERHANG_MM;
    } else {
      // 45° Miter top
      topTrimLengthMm = revealWidthMm + 2 * trimW;
    }
  } else {
    // 4-Sided Picture-Frame Casing (Full Miter surround)
    topTrimLengthMm = revealWidthMm + 2 * trimW;
    sideTrimLengthMm = revealHeightMm + 2 * trimW;
    stoolLengthMm = 0;
    apronLengthMm = 0;
  }

  const topTrimLengthIn = Math.round((topTrimLengthMm / 25.4) * 100) / 100;
  const sideTrimLengthIn = Math.round((sideTrimLengthMm / 25.4) * 100) / 100;
  const stoolLengthIn = Math.round((stoolLengthMm / 25.4) * 100) / 100;
  const apronLengthIn = Math.round((apronLengthMm / 25.4) * 100) / 100;

  // 3. Cut List Generation
  const cutList: WindowTrimCutItem[] = [];

  // Head Casing
  cutList.push({
    name: 'Head Casing (Top)',
    lengthMm: topTrimLengthMm,
    lengthIn: topTrimLengthIn,
    cutLeft: isCraftsman ? '90° Square' : '45° Miter',
    cutRight: isCraftsman ? '90° Square' : '45° Miter',
    quantity: qty,
    note: isCraftsman ? 'Square cut with 1" overhang' : '45° miter both ends',
  });

  // Side Casings
  cutList.push({
    name: 'Left Casing',
    lengthMm: sideTrimLengthMm,
    lengthIn: sideTrimLengthIn,
    cutLeft: isCraftsman ? '90° Square' : '45° Miter Top',
    cutRight: input.includeStool ? '90° Square Bottom' : '45° Miter Bottom',
    quantity: qty,
    note: input.includeStool ? 'Miter top, square bottom on stool' : '45° miter both ends',
  });

  cutList.push({
    name: 'Right Casing',
    lengthMm: sideTrimLengthMm,
    lengthIn: sideTrimLengthIn,
    cutLeft: isCraftsman ? '90° Square' : '45° Miter Top',
    cutRight: input.includeStool ? '90° Square Bottom' : '45° Miter Bottom',
    quantity: qty,
    note: input.includeStool ? 'Miter top, square bottom on stool' : '45° miter both ends',
  });

  if (input.includeStool) {
    // Window Stool
    cutList.push({
      name: 'Window Stool (Sill)',
      lengthMm: stoolLengthMm,
      lengthIn: stoolLengthIn,
      cutLeft: 'Notched Horn',
      cutRight: 'Notched Horn',
      quantity: qty,
      note: 'Notch 1.5" horns around side wall jambs',
    });

    if (input.includeApron) {
      // Apron
      cutList.push({
        name: 'Apron (Under Stool)',
        lengthMm: apronLengthMm,
        lengthIn: apronLengthIn,
        cutLeft: input.trimStyle === 'victorian' ? '45° Return' : '90° Square',
        cutRight: input.trimStyle === 'victorian' ? '45° Return' : '90° Square',
        quantity: qty,
        note: 'Square cut under stool',
      });
    }
  } else {
    // Bottom Casing (Picture Frame)
    cutList.push({
      name: 'Bottom Casing',
      lengthMm: topTrimLengthMm,
      lengthIn: topTrimLengthIn,
      cutLeft: '45° Miter',
      cutRight: '45° Miter',
      quantity: qty,
      note: '45° miter both ends',
    });
  }

  // Extension Jamb Box Pieces (if deep wall depth)
  let extensionJambLengthTotalFt = 0;
  if (extDepth > 0) {
    const extHeadMm = revealWidthMm;
    const extSideMm = revealHeightMm;
    const extTotalMm = (extHeadMm * 2 + extSideMm * 2) * qty;
    extensionJambLengthTotalFt = Math.round((extTotalMm / 304.8) * 10) / 10;

    cutList.push({
      name: 'Extension Jamb Box (4 pcs)',
      lengthMm: extHeadMm,
      lengthIn: Math.round((extHeadMm / 25.4) * 10) / 10,
      cutLeft: '90° Square',
      cutRight: '90° Square',
      quantity: 4 * qty,
      note: `Ripped to ${Math.round((extDepth/25.4)*10)/10}" depth extension`,
    });
  }

  // 4. Linear Length & Material Calculations
  const netCasingLengthMm = cutList.reduce((acc, item) => acc + item.lengthMm * item.quantity, 0);
  const totalLinearLengthFt = Math.round((netCasingLengthMm / 304.8) * 10) / 10;

  const wasteMultiplier = 1 + wastePct / 100;
  const totalLinearLengthWithWasteFt = Math.round(totalLinearLengthFt * wasteMultiplier * 10) / 10;
  const wasteLinearLengthFt = Math.round((totalLinearLengthWithWasteFt - totalLinearLengthFt) * 10) / 10;

  const trimAreaSqFt = Math.round(((totalLinearLengthFt * (trimW / 304.8))) * 10) / 10;
  const estimatedMaterialCost = Math.round(totalLinearLengthWithWasteFt * WINDOW_TRIM_DEFAULTS.AVG_COST_PER_LINEAR_FT);

  // 5. Confidence & Warnings
  let confidence: WindowTrimConfidence = 'excellent';
  if (isCraftsman || input.trimStyle === 'victorian') {
    confidence = 'good';
  }

  if (extDepth > 152.4) { // > 6" deep extension jambs
    warnings.push({
      level: 'info',
      code: 'DEEP_EXTENSION_JAMB',
      message: 'Wall depth exceeds 6 inches. Pre-assemble extension jamb box with pocket screws before casing attachment.',
    });
  }

  return {
    topTrimLengthMm,
    topTrimLengthIn,
    sideTrimLengthMm,
    sideTrimLengthIn,
    stoolLengthMm,
    stoolLengthIn,
    apronLengthMm,
    apronLengthIn,

    extensionJambLengthTotalFt,
    totalLinearLengthFt,
    totalLinearLengthWithWasteFt,
    wasteLinearLengthFt,

    trimAreaSqFt,
    estimatedMaterialCost,

    cutList,

    confidence,
    warnings,
  };
}
