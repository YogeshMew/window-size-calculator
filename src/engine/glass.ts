/**
 * WindowMetrics — Window Glass Calculator Engine
 *
 * Calculates glass weight, area, handling requirements, and ordering quantities
 * for rectangular, square, circular, half-circular, and triangular glass panes.
 *
 * Design principles:
 *   - All inputs and internal calculations use millimeters (mm) for length
 *   - Weight is always kg; lbs are computed at output time
 *   - Constants are named and documented — no magic numbers
 *   - Every function is pure and testable in Node (no browser globals)
 *
 * Key standards referenced:
 *   - Glass density: 2,500 kg/m³ (ISO 11485-1, ASTM C1036 float glass)
 *   - PVB interlayer density: 1,060 kg/m³, nominal 0.76 mm thickness
 *   - IGU spacer/sealant: ~2.0 kg/m² per cavity (industry rule-of-thumb)
 *   - Safe manual handling: ≤ 25 kg (EU Directive 90/269/EEC)
 *   - Single-person practical limit: ≤ 15 kg (ISO 11228-1)
 *   - Shipping packing factor: 1.25 (25% for crating and protective padding)
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** Glass pane geometry. */
export type GlassShape =
  | 'rectangle'
  | 'square'
  | 'circle'
  | 'half-circle'
  | 'triangle';

/**
 * Glass product category.
 * - annealed:    Standard float glass. Cuttable. Not safety-rated.
 * - tempered:    Heat-treated, 4× stronger. NOT cuttable after tempering. Safety-rated.
 * - laminated:   Two glass plies + PVB interlayer. Safety-rated (holds together). Cuttable.
 * - double-pane: Insulated Glass Unit (IGU) — two panes + sealed spacer.
 * - triple-pane: IGU with three panes + two sealed spacers.
 * - low-e:       Low-emissivity coating on annealed or tempered glass. Same weight.
 */
export type GlassType =
  | 'annealed'
  | 'tempered'
  | 'laminated'
  | 'double-pane'
  | 'triple-pane'
  | 'low-e';

/** Surface finish on glass edges. */
export type EdgeFinish = 'raw' | 'polished' | 'beveled';

/** How many people (or equipment) are needed to handle one pane. */
export type HandlingClass = 'solo' | 'two-person' | 'mechanical';

/** Overall difficulty of self-installation. */
export type InstallDifficulty = 'easy' | 'moderate' | 'professional' | 'contractor';

/** Safety glass classification. */
export type SafetyClass = 'standard' | 'impact-resistant' | 'tempered-required';

export type GlassWarnLevel = 'warning' | 'error';

export interface GlassWarning {
  level: GlassWarnLevel;
  code: string;
  message: string;
}

export interface GlassRecommendation {
  title: string;
  body: string;
  tip?: string;
}

/** Buying guide entry for the selected glass type. */
export interface GlassBuyingGuide {
  typeName: string;
  description: string;
  pros: string[];
  cons: string[];
  typicalUses: string[];
  canCutAfterOrder: boolean;
  safetyRated: boolean;
}

/** All inputs to the glass calculator. */
export interface GlassInput {
  /** Width in mm (for circle/half-circle: diameter) */
  widthMm: number;
  /** Height in mm (ignored for square, circle, half-circle) */
  heightMm: number;
  /** Pane shape */
  shape: GlassShape;
  /** Glass product type */
  glassType: GlassType;
  /**
   * Nominal glass thickness in mm.
   * For IGU (double/triple pane), this is the thickness of each glass pane,
   * not the total unit thickness.
   */
  thicknessMm: number;
  /** Number of identical panes to order */
  quantity: number;
  /** Waste allowance as a percentage (0–20). Added to area for cutting/breakage. */
  wastePercent: number;
  /** Edge treatment */
  edgeFinish: EdgeFinish;
  /** Number of holes to cut (0 means none) */
  holeCount: number;
}

/** Full result from the glass calculator. */
export interface GlassResult {
  // ── Area ────────────────────────────────────────────────────────────────
  /** Net glass area for one pane (no waste), mm² */
  areaPerPieceMm2: number;
  /** Net glass area for one pane, m² */
  areaPerPieceM2: number;
  /** Net glass area for one pane, sq ft */
  areaPerPieceSqFt: number;
  /** Total net glass area for all panes, m² */
  totalAreaM2: number;
  /** Total area needed including waste allowance, m² */
  areaWithWasteM2: number;
  /** Perimeter of one pane, mm */
  perimeterMm: number;

  // ── Weight ───────────────────────────────────────────────────────────────
  /** Weight per m² for this glass type and thickness */
  weightKgPerM2: number;
  /** Weight of one pane, kg */
  weightPerPieceKg: number;
  /** Weight of one pane, lbs */
  weightPerPieceLbs: number;
  /** Total weight for all panes, kg */
  totalWeightKg: number;
  /** Estimated shipping weight (glass + protective packing), kg */
  shippingWeightKg: number;

  // ── Glass specs ───────────────────────────────────────────────────────────
  /** Total unit thickness (pane only, or full IGU stack for double/triple pane), mm */
  totalThicknessMm: number;

  // ── Order planning ────────────────────────────────────────────────────────
  /** Quantity ordered including waste coverage (ceiling of quantity × (1 + waste/100)) */
  piecesNeededWithWaste: number;

  // ── Guidance ──────────────────────────────────────────────────────────────
  handlingClass: HandlingClass;
  handlingNote: string;
  installDifficulty: InstallDifficulty;
  safetyClass: SafetyClass;

  /** Engine-recommended minimum thickness for the given pane area (mm) */
  recommendedThicknessMm: number;
  /** Whether the user's thickness is below what's recommended */
  isTooThin: boolean;

  /** Whether a custom fabrication order is required (non-standard size/shape) */
  customFabRequired: boolean;
  /** Whether the glass can be cut to size after ordering */
  cuttableAfterOrder: boolean;

  // ── Structured output ─────────────────────────────────────────────────────
  warnings: GlassWarning[];
  recommendations: GlassRecommendation[];
  buyingGuide: GlassBuyingGuide;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Float glass density (ISO 11485-1). Same for annealed, tempered, and low-E. */
export const GLASS_DENSITY_KG_M3 = 2500;

/** Effective density for laminated glass (glass + PVB, averaged). */
export const LAMINATED_DENSITY_KG_M3 = 2480;

/** PVB interlayer nominal thickness (standard safety laminate), mm. */
const PVB_THICKNESS_MM = 0.76;

/** PVB density, kg/m³. */
const PVB_DENSITY_KG_M3 = 1060;

/** Extra weight per m² for one PVB interlayer, kg/m². */
export const PVB_WEIGHT_PER_M2 = (PVB_THICKNESS_MM / 1000) * PVB_DENSITY_KG_M3; // ≈ 0.806 kg/m²

/** Extra weight per m² for one IGU spacer cavity (aluminum spacer + desiccant + sealant). */
export const IGU_SPACER_WEIGHT_KG_M2 = 2.0;

/** Nominal spacer gap in a standard IGU (air or argon), mm. */
const IGU_GAP_MM = 12;

/** Packing overhead multiplier for shipping weight calculation (25% for crating). */
export const SHIPPING_PACKING_FACTOR = 1.25;

/** Maximum standard sheet size — panes larger than this need custom order. mm per side. */
export const MAX_STANDARD_SHEET_MM = 3048; // 120 in / 10 ft

/** Minimum glass thickness available, mm. */
export const MIN_THICKNESS_MM = 3;

/** Maximum glass thickness available as stock sheet, mm. */
export const MAX_THICKNESS_MM = 19;

/** Minimum valid pane dimension, mm. */
export const MIN_GLASS_DIM_MM = 50;

/** Maximum single-pane practical dimension, mm. */
export const MAX_GLASS_DIM_MM = 6000;

/** Single-person safe lift limit, kg (ISO 11228-1 / ergonomic standard). */
export const SOLO_LIFT_KG = 20;

/** Two-person safe lift limit, kg. */
export const TWO_PERSON_LIFT_KG = 40;

// ─────────────────────────────────────────────────────────────────────────────
// Shape calculations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the net area of a glass pane for a given shape, in mm².
 *
 * For circle and half-circle, widthMm is the diameter.
 * For triangle, it is a right triangle (the two legs are widthMm and heightMm).
 *
 * @param shape     Pane geometry
 * @param widthMm   Width in mm (or diameter for circle shapes)
 * @param heightMm  Height in mm (ignored for square, circle, half-circle)
 */
export function calculateGlassArea(
  shape: GlassShape,
  widthMm: number,
  heightMm: number,
): number {
  switch (shape) {
    case 'rectangle':
      return widthMm * heightMm;
    case 'square':
      return widthMm * widthMm;
    case 'circle': {
      const r = widthMm / 2;
      return Math.PI * r * r;
    }
    case 'half-circle': {
      const r = widthMm / 2;
      return (Math.PI * r * r) / 2;
    }
    case 'triangle':
      return (widthMm * heightMm) / 2;
  }
}

/**
 * Calculate the perimeter of a glass pane for a given shape, in mm.
 *
 * Perimeter determines the edge-finish material length needed for pricing.
 *
 * For circle: circumference.
 * For half-circle: arc + diameter.
 * For triangle: right triangle — w, h, and hypotenuse.
 *
 * @param shape     Pane geometry
 * @param widthMm   Width in mm (or diameter for circle shapes)
 * @param heightMm  Height in mm (ignored for square, circle, half-circle)
 */
export function calculateGlassPerimeter(
  shape: GlassShape,
  widthMm: number,
  heightMm: number,
): number {
  switch (shape) {
    case 'rectangle':
      return 2 * (widthMm + heightMm);
    case 'square':
      return 4 * widthMm;
    case 'circle':
      return Math.PI * widthMm; // circumference = π × diameter
    case 'half-circle': {
      const r = widthMm / 2;
      return Math.PI * r + widthMm; // arc + straight edge
    }
    case 'triangle': {
      const hyp = Math.sqrt(widthMm ** 2 + heightMm ** 2);
      return widthMm + heightMm + hyp;
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Glass type weight calculation
// ─────────────────────────────────────────────────────────────────────────────

/** Weight multiplier data per glass type. */
interface GlassTypeSpec {
  /** Weight in kg per m² per mm of glass thickness */
  kgPerM2PerMm: number;
  /** Extra flat weight added regardless of thickness (e.g., IGU spacer) */
  extraKgPerM2: number;
  /** Total unit thickness formula for reference (vs. just glass thickness) */
  extraThicknessMm: number;
  /** Whether this type is safety-rated */
  safetyRated: boolean;
  /** Whether the glass can be cut after manufacture */
  cuttable: boolean;
}

const GLASS_TYPE_SPECS: Record<GlassType, GlassTypeSpec> = {
  'annealed':    { kgPerM2PerMm: 2.5, extraKgPerM2: 0,                          extraThicknessMm: 0,           safetyRated: false, cuttable: true  },
  'tempered':    { kgPerM2PerMm: 2.5, extraKgPerM2: 0,                          extraThicknessMm: 0,           safetyRated: true,  cuttable: false },
  'low-e':       { kgPerM2PerMm: 2.5, extraKgPerM2: 0,                          extraThicknessMm: 0,           safetyRated: false, cuttable: true  },
  'laminated':   { kgPerM2PerMm: 2.5, extraKgPerM2: PVB_WEIGHT_PER_M2,          extraThicknessMm: PVB_THICKNESS_MM, safetyRated: true,  cuttable: true  },
  'double-pane': { kgPerM2PerMm: 2.5, extraKgPerM2: IGU_SPACER_WEIGHT_KG_M2,    extraThicknessMm: IGU_GAP_MM,  safetyRated: false, cuttable: false },
  'triple-pane': { kgPerM2PerMm: 2.5, extraKgPerM2: IGU_SPACER_WEIGHT_KG_M2 * 2, extraThicknessMm: IGU_GAP_MM * 2, safetyRated: false, cuttable: false },
};

/**
 * Calculate the weight per m² for a given glass type and nominal thickness.
 *
 * For double and triple pane, the weight includes all glass plies plus spacer weight.
 * The `thicknessMm` parameter is the thickness of each individual glass pane.
 *
 * @param glassType    Glass product category
 * @param thicknessMm  Nominal thickness of one glass pane in mm
 * @returns            Total weight in kg per m²
 */
export function calcGlassWeightPerM2(glassType: GlassType, thicknessMm: number): number {
  const spec = GLASS_TYPE_SPECS[glassType];
  const glassPanes = glassType === 'double-pane' ? 2 : glassType === 'triple-pane' ? 3 : 1;
  return glassPanes * thicknessMm * spec.kgPerM2PerMm + spec.extraKgPerM2;
}

/**
 * Calculate the total physical thickness of the glass unit (for reference).
 *
 * For IGU, this is the total stack height (glass + spacer + glass).
 * For laminated, this includes the PVB interlayer.
 *
 * @param glassType    Glass product category
 * @param thicknessMm  Nominal thickness of one glass pane in mm
 * @returns            Total unit thickness in mm
 */
export function calcTotalThickness(glassType: GlassType, thicknessMm: number): number {
  const spec = GLASS_TYPE_SPECS[glassType];
  const glassPanes = glassType === 'double-pane' ? 2 : glassType === 'triple-pane' ? 3 : 1;
  return glassPanes * thicknessMm + spec.extraThicknessMm;
}

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

export interface GlassDimValidation {
  valid: boolean;
  level: GlassWarnLevel;
  field?: 'width' | 'height';
  message?: string;
}

/**
 * Validate a glass pane dimension.
 *
 * @param mm    Dimension in millimeters
 * @param field Which dimension ('width' | 'height')
 */
export function validateGlassDimension(mm: number, field: 'width' | 'height'): GlassDimValidation {
  if (!isFinite(mm) || mm <= 0) {
    return { valid: false, level: 'error', field, message: `Enter a positive ${field}.` };
  }
  if (mm < MIN_GLASS_DIM_MM) {
    return {
      valid: false, level: 'error', field,
      message: `${field === 'width' ? 'Width' : 'Height'} is too small (minimum ${MIN_GLASS_DIM_MM} mm).`,
    };
  }
  if (mm > MAX_GLASS_DIM_MM) {
    return {
      valid: false, level: 'error', field,
      message: `${field === 'width' ? 'Width' : 'Height'} exceeds ${(MAX_GLASS_DIM_MM / 1000).toFixed(1)} m — likely a unit error.`,
    };
  }
  return { valid: true, level: 'warning' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Thickness recommendation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Minimum recommended glass thickness for a given pane area.
 *
 * These are conservative residential guidelines only.
 * Structural verification (wind load, ASTM E1300 / EN 16612) is required for
 * facades, skylights, and commercial applications.
 *
 * @param areaM2  Pane area in m²
 * @returns       Recommended minimum thickness in mm
 */
export function recommendedThickness(areaM2: number): number {
  if (areaM2 <= 0.09)  return 3;   // up to 300×300 mm
  if (areaM2 <= 0.25)  return 4;   // up to ~500×500 mm
  if (areaM2 <= 0.6)   return 5;   // up to ~775×775 mm
  if (areaM2 <= 1.5)   return 6;   // up to 1200×1200 mm
  if (areaM2 <= 3.0)   return 8;   // up to 1730×1730 mm
  if (areaM2 <= 6.0)   return 10;  // up to 2450×2450 mm
  if (areaM2 <= 12.0)  return 12;  // up to 3460×3460 mm
  return 15;                        // very large panes
}

// ─────────────────────────────────────────────────────────────────────────────
// Handling and installation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determine handling class and note based on piece weight.
 *
 * EU Directive 90/269/EEC recommends single-person limit of 25 kg for
 * trained workers; practical DIY limit is lower (~15 kg).
 */
export function calcHandling(
  weightKg: number,
): { handlingClass: HandlingClass; handlingNote: string } {
  if (weightKg <= SOLO_LIFT_KG) {
    return {
      handlingClass: 'solo',
      handlingNote: `${weightKg.toFixed(1)} kg — one person can handle this pane safely.`,
    };
  }
  if (weightKg <= TWO_PERSON_LIFT_KG) {
    return {
      handlingClass: 'two-person',
      handlingNote: `${weightKg.toFixed(1)} kg — two people required. Use suction cups or gloves for grip.`,
    };
  }
  return {
    handlingClass: 'mechanical',
    handlingNote: `${weightKg.toFixed(1)} kg — mechanical lifting equipment (glass vacuum lifter or crane) is required. Do not attempt to carry manually.`,
  };
}

/**
 * Determine installation difficulty based on weight and whether custom fabrication is needed.
 */
export function calcInstallDifficulty(
  weightKg: number,
  customFab: boolean,
  holeCount: number,
): InstallDifficulty {
  if (customFab || holeCount > 0) return 'contractor';
  if (weightKg <= SOLO_LIFT_KG)   return 'easy';
  if (weightKg <= TWO_PERSON_LIFT_KG) return 'moderate';
  return 'professional';
}

// ─────────────────────────────────────────────────────────────────────────────
// Safety class
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determine safety class for the selected glass type.
 */
export function calcSafetyClass(glassType: GlassType): SafetyClass {
  if (glassType === 'tempered') return 'tempered-required';
  if (glassType === 'laminated') return 'impact-resistant';
  return 'standard';
}

// ─────────────────────────────────────────────────────────────────────────────
// Custom fabrication check
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Determine if the given configuration requires custom fabrication.
 *
 * Standard sheet glass is only available as flat rectangles/squares.
 * Circles, half-circles, and triangles are always custom cut.
 * Very large panes exceed standard stock sheet sizes.
 * Holes are drilled to order.
 * Edge finishes beyond raw require factory work.
 *
 * Note: tempered glass is always custom because it must be cut BEFORE tempering.
 */
export function isCustomFab(
  shape: GlassShape,
  glassType: GlassType,
  widthMm: number,
  heightMm: number,
  edgeFinish: EdgeFinish,
  holeCount: number,
): boolean {
  if (shape !== 'rectangle' && shape !== 'square') return true;
  if (widthMm > MAX_STANDARD_SHEET_MM || heightMm > MAX_STANDARD_SHEET_MM) return true;
  if (edgeFinish === 'polished' || edgeFinish === 'beveled') return true;
  if (holeCount > 0) return true;
  if (glassType === 'tempered' || glassType === 'laminated') return true;
  if (glassType === 'double-pane' || glassType === 'triple-pane') return true;
  return false;
}

// ─────────────────────────────────────────────────────────────────────────────
// Warnings
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build all applicable warnings for a glass configuration.
 */
export function buildGlassWarnings(
  input: GlassInput,
  areaM2: number,
  weightKg: number,
  isTooThin: boolean,
  recThicknessMm: number,
): GlassWarning[] {
  const warnings: GlassWarning[] = [];
  const { glassType, thicknessMm, widthMm, heightMm, shape } = input;

  if (isTooThin) {
    warnings.push({
      level: 'warning',
      code: 'GLASS_TOO_THIN',
      message: `${thicknessMm} mm may be too thin for a ${areaM2.toFixed(2)} m² pane. Minimum recommended: ${recThicknessMm} mm. Thinner glass risks breakage during installation or from wind pressure.`,
    });
  }

  if (weightKg > TWO_PERSON_LIFT_KG) {
    warnings.push({
      level: 'warning',
      code: 'HEAVY_GLASS',
      message: `${weightKg.toFixed(1)} kg per pane — mechanical lifting equipment required. Standard glass vacuum lifters handle up to 400 kg.`,
    });
  } else if (weightKg > SOLO_LIFT_KG) {
    warnings.push({
      level: 'warning',
      code: 'TWO_PERSON_LIFT',
      message: `${weightKg.toFixed(1)} kg per pane — two people needed for safe handling. Use suction cup handles for a secure grip.`,
    });
  }

  if (areaM2 >= 1.0 && glassType === 'annealed') {
    warnings.push({
      level: 'warning',
      code: 'SAFETY_GLASS_RECOMMENDED',
      message: `Panes over 1 m² (${areaM2.toFixed(2)} m²) are often subject to safety glazing codes in residential settings. Tempered or laminated glass may be required — check your local building code.`,
    });
  }

  if ((widthMm > MAX_STANDARD_SHEET_MM || (shape !== 'circle' && shape !== 'half-circle' && heightMm > MAX_STANDARD_SHEET_MM))) {
    warnings.push({
      level: 'warning',
      code: 'OVERSIZED_PANEL',
      message: `One or more dimensions exceed ${(MAX_STANDARD_SHEET_MM / 25.4).toFixed(0)}" (${(MAX_STANDARD_SHEET_MM / 1000).toFixed(2)} m) — beyond standard stock sheet size. Custom manufacturing required; longer lead time and higher cost expected.`,
    });
  }

  if (glassType === 'tempered') {
    warnings.push({
      level: 'warning',
      code: 'TEMPERED_NOT_CUTTABLE',
      message: 'Tempered glass cannot be cut after manufacture. Confirm final dimensions before ordering. Any cutting, drilling, or grinding must be done on annealed glass before tempering.',
    });
  }

  if ((glassType === 'double-pane' || glassType === 'triple-pane') && areaM2 > 4.0) {
    warnings.push({
      level: 'warning',
      code: 'LARGE_IGU',
      message: `Very large IGU (${areaM2.toFixed(2)} m²). Maximum standard IGU panel is approximately 4 m². Consult your glazier for structural and seal integrity requirements.`,
    });
  }

  const maxDim = Math.max(widthMm, shape === 'rectangle' || shape === 'triangle' ? heightMm : widthMm);
  if (maxDim / thicknessMm > 400) {
    warnings.push({
      level: 'warning',
      code: 'HIGH_ASPECT_RATIO',
      message: `Very high pane-size-to-thickness ratio (${Math.round(maxDim / thicknessMm)}:1). This pane may be flexible or prone to vibration. Consider increasing thickness.`,
    });
  }

  return warnings;
}

// ─────────────────────────────────────────────────────────────────────────────
// Recommendations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate structured recommendations for the glass configuration.
 */
export function buildGlassRecommendations(
  input: GlassInput,
  areaM2: number,
  weightKg: number,
  recThicknessMm: number,
  customFab: boolean,
): GlassRecommendation[] {
  const recs: GlassRecommendation[] = [];
  const { glassType, thicknessMm, wastePercent, quantity, shape, edgeFinish } = input;

  // Thickness advice
  if (thicknessMm < recThicknessMm) {
    recs.push({
      title: `Consider upgrading to ${recThicknessMm} mm glass`,
      body: `For a ${areaM2.toFixed(2)} m² pane, ${recThicknessMm} mm is the recommended minimum thickness for residential applications. ${thicknessMm} mm glass may flex noticeably and is at higher risk of breakage from wind pressure or thermal stress.`,
      tip: `Tip: The extra cost of thicker glass is far less than the cost of replacing a broken pane.`,
    });
  } else {
    recs.push({
      title: `${thicknessMm} mm is a good choice for this pane size`,
      body: `${thicknessMm} mm glass is appropriate for a ${areaM2.toFixed(2)} m² pane. The minimum recommended for this area is ${recThicknessMm} mm.`,
    });
  }

  // Waste advice
  if (wastePercent === 0 && (shape !== 'rectangle' && shape !== 'square')) {
    recs.push({
      title: 'Add waste allowance for non-rectangular cuts',
      body: `${shape.replace('-', ' ')} glass requires cutting from a rectangular sheet. At least 10–15% waste is typical. Ordering with 0% allowance risks coming up short.`,
      tip: 'Tip: Order at least one extra piece when cutting complex shapes.',
    });
  } else if (wastePercent > 0) {
    recs.push({
      title: `${wastePercent}% waste allowance included`,
      body: `The total area ordered accounts for ${wastePercent}% extra material (${((areaM2 * wastePercent) / 100).toFixed(3)} m² per piece) to cover cutting waste and breakage during installation. This is ${wastePercent < 10 ? 'below the industry-standard 10% — consider increasing for complex cuts' : 'a reasonable allowance for most projects'}.`,
    });
  }

  // Glass type guidance
  const typeNotes: Record<GlassType, string> = {
    'annealed':    'Annealed glass is the standard, most affordable option. It can be cut on-site and is suitable for most residential glazing. If it breaks, it forms large sharp shards — avoid in high-traffic areas.',
    'tempered':    'Tempered glass is the right choice for large panes, entry doors, shower enclosures, and anywhere safety glazing is required. It\'s 4× stronger than annealed and shatters into small, blunt pieces. It must be sized before tempering — no on-site cutting.',
    'laminated':   'Laminated glass is the safest option for overhead glazing, skylights, and hurricane zones. When it breaks, the PVB interlayer holds fragments in place. It can be cut with a special scorer but is more complex than annealed.',
    'double-pane': 'Double-pane IGU provides excellent thermal insulation (typically U-value 1.2–1.6 W/m²K) and reduces condensation. It must be factory-assembled — no site cutting. Match the spacer to the frame design.',
    'triple-pane': 'Triple-pane IGU gives the highest insulation (U-value 0.5–0.8 W/m²K) but adds significant weight. Recommended in cold climates where heating costs are high. Ensure your frame is rated for the extra weight.',
    'low-e':       'Low-E (low-emissivity) glass blocks infrared radiation, reducing summer heat gain and winter heat loss. It looks the same as standard glass but can reduce energy bills by 20–30%. Usually combined with IGU for best results.',
  };
  recs.push({ title: `About ${glassType} glass`, body: typeNotes[glassType] });

  // Handling
  if (weightKg > SOLO_LIFT_KG) {
    recs.push({
      title: 'Safe handling',
      body: `Each pane weighs ${weightKg.toFixed(1)} kg. ${weightKg > TWO_PERSON_LIFT_KG ? 'Plan for mechanical lifting equipment.' : 'Plan for two people.'} Use suction cup glass handles — available to rent at most tool hire shops. Never carry glass on a windy day.`,
      tip: 'Tip: Transport glass vertically (on edge), never flat. Flat glass under its own weight can flex and crack.',
    });
  }

  // Custom fab
  if (customFab) {
    recs.push({
      title: 'Custom fabrication required',
      body: `This configuration requires a custom order from a glass fabricator or glazier. ${glassType === 'tempered' ? 'Tempered glass must be cut and drilled before tempering.' : ''} ${shape !== 'rectangle' && shape !== 'square' ? `${shape.replace('-', ' ').charAt(0).toUpperCase() + shape.replace('-', ' ').slice(1)} shapes are cut to order.` : ''} ${edgeFinish !== 'raw' ? `${edgeFinish.charAt(0).toUpperCase() + edgeFinish.slice(1)} edge finish requires factory work.` : ''}`,
      tip: 'Tip: Get at least two quotes from local glass suppliers. Prices vary significantly for custom work.',
    });
  }

  // Order advice
  if (quantity > 1) {
    recs.push({
      title: `Ordering ${quantity} pieces`,
      body: `Total order: ${quantity} panes. Order an extra 1–2 pieces for complex shapes or precision cutting. Stock glass is generally cheaper in bulk; ask your supplier about quantity discounts.`,
    });
  }

  return recs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Buying guide
// ─────────────────────────────────────────────────────────────────────────────

/** Per-type buying guide data. */
const BUYING_GUIDES: Record<GlassType, GlassBuyingGuide> = {
  'annealed': {
    typeName:    'Annealed (Float) Glass',
    description: 'Standard clear float glass — the most common and affordable type. Not safety-rated, but suitable for most residential glazing in frames.',
    pros:        ['Lowest cost', 'Cuttable on-site', 'Widely available in stock sheets', 'Easy to glaze'],
    cons:        ['Not safety-rated (sharp shards on breakage)', 'Not suitable for safety glazing requirements', 'Weakest of all types'],
    typicalUses: ['Interior windows', 'Picture frames', 'Greenhouse glazing', 'Small residential windows'],
    canCutAfterOrder: true,
    safetyRated: false,
  },
  'tempered': {
    typeName:    'Tempered (Toughened) Glass',
    description: 'Heat-treated to be 4–5× stronger than annealed. Shatters into small, blunt granules rather than sharp shards. Required by code in many applications.',
    pros:        ['4× stronger than annealed', 'Safety-rated (granular breakage)', 'Handles thermal stress well', 'Required by code for many applications'],
    cons:        ['Cannot be cut, drilled, or ground after tempering', 'Custom order only', 'Higher cost', 'Longer lead time (2–5 business days typical)'],
    typicalUses: ['Entry doors', 'Shower enclosures', 'Patio doors', 'Large residential windows (>0.5 m²)', 'Furniture glass', 'Balustrades'],
    canCutAfterOrder: false,
    safetyRated: true,
  },
  'laminated': {
    typeName:    'Laminated Safety Glass',
    description: 'Two or more glass plies bonded with a PVB or SGP interlayer. When broken, the interlayer holds fragments in place — providing fall-through protection.',
    pros:        ['Highest safety rating', 'Fragment retention (interlayer holds glass in place)', 'Sound-dampening properties', 'Can be cut with special tools', 'UV filtering (PVB blocks ~99% UV)'],
    cons:        ['Heavier than single pane', 'Higher cost', 'Requires specialist cutter', 'May show slight greenish tint (standard PVB)'],
    typicalUses: ['Skylights and overhead glazing', 'Hurricane zones', 'Laminated windscreens', 'Museum display cases', 'Security glazing', 'Acoustic partitions'],
    canCutAfterOrder: true,
    safetyRated: true,
  },
  'double-pane': {
    typeName:    'Double-Pane Insulated Glass Unit (IGU)',
    description: 'Two glass panes separated by a sealed spacer filled with air or argon gas. Provides excellent thermal and acoustic insulation.',
    pros:        ['Good thermal insulation (U-value ~1.2–1.6 W/m²K)', 'Reduces condensation', 'Better sound dampening', 'Standard for modern windows'],
    cons:        ['Cannot be cut or modified after assembly', 'Seal failure ("fogging") can occur over 20–30 years', 'Much heavier than single pane', 'Higher cost'],
    typicalUses: ['Residential windows and doors', 'Commercial storefronts', 'Replacement window glazing', 'Conservatories'],
    canCutAfterOrder: false,
    safetyRated: false,
  },
  'triple-pane': {
    typeName:    'Triple-Pane Insulated Glass Unit (IGU)',
    description: 'Three glass panes with two sealed gas-filled cavities. Highest insulation performance. Common in Passive House and cold-climate construction.',
    pros:        ['Highest thermal performance (U-value ~0.5–0.8 W/m²K)', 'Excellent sound insulation', 'Near-elimination of condensation on interior surface'],
    cons:        ['Heaviest glass type — structural frame must be rated for extra load', 'Most expensive', 'Thicker than double-pane (requires wider frames)', 'Cannot be cut or modified'],
    typicalUses: ['Cold climate construction (Canada, Scandinavia, Northern Europe)', 'Passive House buildings', 'High-end residential projects'],
    canCutAfterOrder: false,
    safetyRated: false,
  },
  'low-e': {
    typeName:    'Low-Emissivity (Low-E) Glass',
    description: 'Standard glass with a thin metallic coating (silver or tin oxide) that reflects infrared radiation. Reduces solar heat gain in summer and heat loss in winter.',
    pros:        ['Reduces heating/cooling costs by 20–30%', 'Looks identical to clear glass', 'Available in cuttable form (soft-coat)', 'Reduces UV fade on furniture'],
    cons:        ['Slightly higher cost than clear glass', 'Hard-coat (pyrolytic) is cuttable; soft-coat is not', 'Some types have slight colour tint', 'Best used with IGU, not alone'],
    typicalUses: ['Modern replacement windows', 'South-facing windows in hot climates', 'North-facing windows in cold climates', 'High-efficiency homes'],
    canCutAfterOrder: true,  // hard-coat low-e is cuttable; simplification here
    safetyRated: false,
  },
};

// ─────────────────────────────────────────────────────────────────────────────
// Main calculation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate complete glass sizing from user inputs.
 *
 * @param input  All glass calculator inputs
 * @returns      Full glass result including weights, areas, guidance, and recommendations
 *
 * @example
 * calculateGlass({
 *   widthMm: 914.4,     // 36"
 *   heightMm: 1219.2,   // 48"
 *   shape: 'rectangle',
 *   glassType: 'annealed',
 *   thicknessMm: 6,
 *   quantity: 2,
 *   wastePercent: 10,
 *   edgeFinish: 'raw',
 *   holeCount: 0,
 * })
 */
export function calculateGlass(input: GlassInput): GlassResult {
  const {
    widthMm, heightMm, shape, glassType, thicknessMm,
    quantity, wastePercent, edgeFinish, holeCount,
  } = input;

  // ── Area ───────────────────────────────────────────────────────────────────
  const areaPerPieceMm2  = calculateGlassArea(shape, widthMm, heightMm);
  const areaPerPieceM2   = areaPerPieceMm2 / 1_000_000;
  const areaPerPieceSqFt = areaPerPieceMm2 / (304.8 ** 2);
  const totalAreaM2      = areaPerPieceM2 * quantity;
  const areaWithWasteM2  = areaPerPieceM2 * (1 + wastePercent / 100);

  // ── Perimeter ─────────────────────────────────────────────────────────────
  const perimeterMm = calculateGlassPerimeter(shape, widthMm, heightMm);

  // ── Weight ─────────────────────────────────────────────────────────────────
  const weightKgPerM2    = calcGlassWeightPerM2(glassType, thicknessMm);
  const weightPerPieceKg = weightKgPerM2 * areaPerPieceM2;
  const weightPerPieceLbs = weightPerPieceKg * 2.20462;
  const totalWeightKg    = weightPerPieceKg * quantity;
  const shippingWeightKg = totalWeightKg * SHIPPING_PACKING_FACTOR;

  // ── Total unit thickness ───────────────────────────────────────────────────
  const totalThicknessMm = calcTotalThickness(glassType, thicknessMm);

  // ── Order planning ─────────────────────────────────────────────────────────
  const piecesNeededWithWaste = Math.ceil(quantity * (1 + wastePercent / 100));

  // ── Guidance ───────────────────────────────────────────────────────────────
  const recThicknessMm  = recommendedThickness(areaPerPieceM2);
  const isTooThin       = thicknessMm < recThicknessMm;
  const customFab       = isCustomFab(shape, glassType, widthMm, heightMm, edgeFinish, holeCount);
  const cuttableAfterOrder = GLASS_TYPE_SPECS[glassType].cuttable && !customFab;
  const safetyClass     = calcSafetyClass(glassType);

  const { handlingClass, handlingNote } = calcHandling(weightPerPieceKg);
  const installDifficulty               = calcInstallDifficulty(weightPerPieceKg, customFab, holeCount);

  // ── Warnings & recommendations ─────────────────────────────────────────────
  const warnings        = buildGlassWarnings(input, areaPerPieceM2, weightPerPieceKg, isTooThin, recThicknessMm);
  const recommendations = buildGlassRecommendations(input, areaPerPieceM2, weightPerPieceKg, recThicknessMm, customFab);
  const buyingGuide     = BUYING_GUIDES[glassType];

  return {
    areaPerPieceMm2,
    areaPerPieceM2,
    areaPerPieceSqFt,
    totalAreaM2,
    areaWithWasteM2,
    perimeterMm,
    weightKgPerM2,
    weightPerPieceKg,
    weightPerPieceLbs,
    totalWeightKg,
    shippingWeightKg,
    totalThicknessMm,
    piecesNeededWithWaste,
    recommendedThicknessMm: recThicknessMm,
    isTooThin,
    customFabRequired: customFab,
    cuttableAfterOrder,
    handlingClass,
    handlingNote,
    installDifficulty,
    safetyClass,
    warnings,
    recommendations,
    buyingGuide,
  };
}
