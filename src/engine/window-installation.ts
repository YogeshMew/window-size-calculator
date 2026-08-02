/**
 * WindowMetrics — Window Installation Materials Calculation Engine
 *
 * Pure TypeScript window installation materials calculation engine.
 * Calculates exact flashing tape linear length, sealant caulk tubes, low-expansion foam cans,
 * backer rod, shim packs, fastener counts, anchor spacing, drip cap header flashing,
 * waterproof sill membrane area, estimated installation labor hours, and difficulty rating.
 */

import type { MeasurementUnit } from '@/types/calculator.js';

export type WindowInstallationType = 'insert' | 'replacement' | 'new-construction';
export type WindowInstallationFrameMaterial = 'wood' | 'vinyl' | 'aluminum' | 'fiberglass';
export type WindowInstallationWallType = 'wood-stud' | 'steel-stud' | 'concrete' | 'brick' | 'block';
export type WindowInstallationFastenerType = 'standard' | 'concrete' | 'structural';

export type WindowInstallationWarnLevel = 'error' | 'warning' | 'info';
export type WindowInstallationConfidence = 'excellent' | 'good' | 'minor-adjustment' | 'custom-required';

export interface WindowInstallationWarning {
  level: WindowInstallationWarnLevel;
  code: string;
  message: string;
}

export interface WindowInstallationMaterialItem {
  category: string; // 'Flashing & Waterproofing' | 'Sealants & Insulation' | 'Fasteners & Hardware' | 'Shims & Support'
  name: string;
  quantity: number;
  unit: string;
  description: string;
}

export interface WindowInstallationInput {
  windowWidthMm: number;
  windowHeightMm: number;
  quantity?: number;
  installationType: WindowInstallationType;
  frameMaterial: WindowInstallationFrameMaterial;
  wallType: WindowInstallationWallType;
  fastenerType: WindowInstallationFastenerType;
  useFoam?: boolean;
  useFlashingTape?: boolean;
}

export interface WindowInstallationResult {
  perimeterMm: number;
  perimeterFt: number;

  flashingTapeLengthFt: number;
  flashingTapeLengthM: number;

  sealantTubesCount: number; // 10.1 oz caulk tubes
  sealantLinearFt: number;

  foamCansCount: number; // 12 oz low-expansion foam cans
  backerRodLengthFt: number;

  shimPacksCount: number;
  shimPairsCount: number;

  fastenerCountTotal: number;
  fastenerSpacingIn: number;

  dripCapLengthIn: number;
  waterproofMembraneSqFt: number;

  estimatedHoursPerWindow: number;
  estimatedHoursTotal: number;
  difficultyRating: string;

  materialsChecklist: WindowInstallationMaterialItem[];

  confidence: WindowInstallationConfidence;
  warnings: WindowInstallationWarning[];
}

// ---------------------------------------------------------------------------
// Installation Constants & Material Coverage (No magic numbers)
// ---------------------------------------------------------------------------

export const WINDOW_INSTALLATION_DEFAULTS = {
  MIN_WINDOW_MM: 152.4, // 6"
  MAX_WINDOW_MM: 6096,  // 240"
  SEALANT_COVERAGE_FT_PER_TUBE: 24, // 10.1 oz tube @ 1/4" x 1/4" bead
  FOAM_CAN_PERIMETER_FT_COVERAGE: 35, // 12 oz low-expansion foam can (~35 ft @ 1/2" gap)
  FLASHING_SILL_OVERLAP_FT: 2.0, // Extra sill pan flap overlaps
  FASTENER_SPACING_MAX_IN: 16, // Maximum 16" between jamb fasteners
  SHIM_LOCATIONS_PER_SIDE: 3, // Top, Middle, Bottom per jamb side
};

// ---------------------------------------------------------------------------
// Main calculation engine
// ---------------------------------------------------------------------------

export function calculateWindowInstallation(input: WindowInstallationInput): WindowInstallationResult {
  const warnings: WindowInstallationWarning[] = [];

  const qty = Math.max(1, Math.round(input.quantity || 1));
  const wMm = Math.max(WINDOW_INSTALLATION_DEFAULTS.MIN_WINDOW_MM, input.windowWidthMm);
  const hMm = Math.max(WINDOW_INSTALLATION_DEFAULTS.MIN_WINDOW_MM, input.windowHeightMm);

  const wIn = wMm / 25.4;
  const hIn = hMm / 25.4;

  // 1. Perimeter Calculation
  const perimeterMm = (wMm + hMm) * 2;
  const perimeterM = perimeterMm / 1000;
  const perimeterFt = perimeterM * 3.28084;
  const totalPerimeterFt = perimeterFt * qty;

  // 2. Flashing Tape & Drip Cap Header
  const useFlashing = input.useFlashingTape !== false && input.installationType !== 'insert';
  let flashingTapeLengthFt = 0;
  let waterproofMembraneSqFt = 0;

  if (useFlashing) {
    // Flashing tape covers sill pan, left jamb, right jamb, and head flashing
    const singleFlashingFt = perimeterFt + WINDOW_INSTALLATION_DEFAULTS.FLASHING_SILL_OVERLAP_FT;
    flashingTapeLengthFt = Math.round(singleFlashingFt * qty * 10) / 10;
    waterproofMembraneSqFt = Math.round(((wIn * 12 / 144) * qty) * 10) / 10; // Sill pan area
  }

  const flashingTapeLengthM = Math.round((flashingTapeLengthFt / 3.28084) * 10) / 10;
  const dripCapLengthIn = Math.round((wIn + 2.0) * 10) / 10; // 1" overhang on each side

  // 3. Sealant, Foam, and Backer Rod
  // Exterior primary perimeter seal + interior air seal = 2 passes of sealant
  const sealantPasses = input.installationType === 'new-construction' ? 2 : 1.5;
  const sealantLinearFt = totalPerimeterFt * sealantPasses;
  const sealantTubesCount = Math.max(1, Math.ceil(sealantLinearFt / WINDOW_INSTALLATION_DEFAULTS.SEALANT_COVERAGE_FT_PER_TUBE));

  const useFoam = input.useFoam !== false;
  const foamCansCount = useFoam ? Math.max(1, Math.ceil(totalPerimeterFt / WINDOW_INSTALLATION_DEFAULTS.FOAM_CAN_PERIMETER_FT_COVERAGE)) : 0;
  const backerRodLengthFt = Math.round(totalPerimeterFt * 10) / 10;

  // 4. Shims & Fasteners
  // Shims: 2 at bottom corners + 2 at middle sill + 2 at top corners + 4 along jambs = 10 pairs per window
  const shimPairsCount = 10 * qty;
  const shimPacksCount = Math.max(1, Math.ceil(shimPairsCount / 12)); // 12 pairs per composite pack

  // Fasteners: Spaced max 12"-16" along left, right, top jambs (min 2 per side + corners)
  const verticalFastenersPerSide = Math.max(3, Math.ceil(hIn / WINDOW_INSTALLATION_DEFAULTS.FASTENER_SPACING_MAX_IN) + 1);
  const horizontalFastenersHead = Math.max(2, Math.ceil(wIn / WINDOW_INSTALLATION_DEFAULTS.FASTENER_SPACING_MAX_IN) + 1);
  const fastenersPerWindow = (verticalFastenersPerSide * 2) + horizontalFastenersHead;
  const fastenerCountTotal = fastenersPerWindow * qty;
  const fastenerSpacingIn = Math.round((hIn / (verticalFastenersPerSide - 1)) * 10) / 10;

  // 5. Labor Hours & Difficulty Rating
  let baseHoursPerWindow = 2.0; // Standard replacement in wood stud wall
  if (input.installationType === 'new-construction') baseHoursPerWindow = 1.5;
  if (input.installationType === 'insert') baseHoursPerWindow = 1.25;

  if (input.wallType === 'masonry' || input.wallType === 'brick' || input.wallType === 'concrete' || input.wallType === 'block') {
    baseHoursPerWindow += 1.0; // Masonry anchors and tapcon drilling
  }

  const estimatedHoursPerWindow = Math.round(baseHoursPerWindow * 10) / 10;
  const estimatedHoursTotal = Math.round(estimatedHoursPerWindow * qty * 10) / 10;

  let difficultyRating = 'DIY / Moderate (2-3 Hours)';
  if (input.wallType === 'concrete' || input.wallType === 'brick' || input.wallType === 'block') {
    difficultyRating = 'Advanced DIY / Contractor (Masonry Anchors)';
  } else if (input.installationType === 'new-construction') {
    difficultyRating = 'Moderate (Exterior Siding Removal & Flashing)';
  }

  // 6. Materials Checklist Generation
  const materialsChecklist: WindowInstallationMaterialItem[] = [];

  if (flashingTapeLengthFt > 0) {
    materialsChecklist.push({
      category: 'Flashing & Waterproofing',
      name: '4" Self-Adhered Flashing Tape',
      quantity: flashingTapeLengthFt,
      unit: 'linear ft',
      description: 'Butyl or acrylic self-adhered waterproofing membrane roll',
    });
  }

  materialsChecklist.push({
    category: 'Flashing & Waterproofing',
    name: 'Aluminum Head Drip Cap',
    quantity: qty,
    unit: 'pieces',
    description: `${dripCapLengthIn}" Z-bar rigid metal head flashing`,
  });

  materialsChecklist.push({
    category: 'Sealants & Insulation',
    name: 'High-Grade Exterior Elastomeric Sealant',
    quantity: sealantTubesCount,
    unit: '10.1 oz tubes',
    description: 'ASTM C920 Class 25/50 silicone or polyurethane caulk',
  });

  if (useFoam) {
    materialsChecklist.push({
      category: 'Sealants & Insulation',
      name: 'Low-Expansion Window & Door Foam',
      quantity: foamCansCount,
      unit: '12 oz cans',
      description: 'Closed-cell non-bowing polyurethane expansion foam',
    });
  }

  materialsChecklist.push({
    category: 'Sealants & Insulation',
    name: '3/8" Closed-Cell Backer Rod',
    quantity: backerRodLengthFt,
    unit: 'linear ft',
    description: 'Flexible foam rod for deep perimeter sealant joint backing',
  });

  materialsChecklist.push({
    category: 'Shims & Support',
    name: 'Composite / Cedar Shims',
    quantity: shimPacksCount,
    unit: 'packs',
    description: `${shimPairsCount} pairs for frame leveling & diagonal squareness`,
  });

  const fastenerLabel = input.fastenerType === 'concrete'
    ? '3/16" × 2-3/4" Masonry Tapcon Screws'
    : (input.fastenerType === 'structural' ? '#10 × 3" Stainless Steel Structural Screws' : '#8 × 2-1/2" Exterior Wood Screws');

  materialsChecklist.push({
    category: 'Fasteners & Hardware',
    name: fastenerLabel,
    quantity: fastenerCountTotal,
    unit: 'screws',
    description: `Spaced every ${fastenerSpacingIn}" along side & head jambs`,
  });

  // 7. Confidence & Warnings
  let confidence: WindowInstallationConfidence = 'excellent';
  if (input.wallType === 'concrete' || input.wallType === 'brick' || input.wallType === 'block') {
    confidence = 'good';
    warnings.push({
      level: 'warning',
      code: 'MASONRY_ANCHOR_PREDRILL',
      message: 'Masonry installations require hammer drilling 3/16" pilot holes and embedding screws min 1-1/4" into masonry.',
    });
  }

  if (!useFoam) {
    warnings.push({
      level: 'info',
      code: 'NO_FOAM_INSULATION_WARNING',
      message: 'Omitting low-expansion foam can increase perimeter air leakage by up to 25%. Ensure backer rod is packed tightly.',
    });
  }

  return {
    perimeterMm,
    perimeterFt: Math.round(perimeterFt * 10) / 10,

    flashingTapeLengthFt,
    flashingTapeLengthM,

    sealantTubesCount,
    sealantLinearFt: Math.round(sealantLinearFt * 10) / 10,

    foamCansCount,
    backerRodLengthFt,

    shimPacksCount,
    shimPairsCount,

    fastenerCountTotal,
    fastenerSpacingIn,

    dripCapLengthIn,
    waterproofMembraneSqFt,

    estimatedHoursPerWindow,
    estimatedHoursTotal,
    difficultyRating,

    materialsChecklist,

    confidence,
    warnings,
  };
}
