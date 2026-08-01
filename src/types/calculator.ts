/**
 * WindowMetrics — Calculator Types
 *
 * Core type system for all measurement, calculation, and decision engine operations.
 * Internally, all dimensions are stored in millimeters.
 */

// ---------------------------------------------------------------------------
// Units & Measurement
// ---------------------------------------------------------------------------

/** All supported display units. Internal storage is always mm. */
export type MeasurementUnit = 'mm' | 'cm' | 'm' | 'in' | 'ft';

/** Window type classifications */
export type WindowType =
  | 'single-hung'
  | 'double-hung'
  | 'sliding'
  | 'casement'
  | 'awning'
  | 'picture'
  | 'bay'
  | 'bow'
  | 'garden'
  | 'fixed'
  | 'custom';

/** Measurement context — determines instructions, outputs, and recommendations */
export type MeasurementProfile =
  | 'replacement'
  | 'curtains'
  | 'blinds'
  | 'glass'
  | 'area'
  | 'egress'
  | 'ac'
  | 'general';

/** Room type — affects egress checks and recommendations */
export type Room =
  | 'bedroom'
  | 'bathroom'
  | 'kitchen'
  | 'living-room'
  | 'basement'
  | 'garage'
  | 'office'
  | 'other';

/** Raw dimensions in mm (after unit conversion) */
export interface Dimensions {
  widthMm: number;
  heightMm: number;
}

/** Window classification by size */
export type WindowClassification = 'small' | 'medium' | 'large' | 'oversized' | 'custom';

// ---------------------------------------------------------------------------
// Calculator Input
// ---------------------------------------------------------------------------

/** Input to a calculator — before unit normalization */
export interface CalculatorInput {
  /** Raw width value as typed by user */
  width: number;
  /** Raw height value as typed by user */
  height: number;
  /** Display unit selected by user */
  unit: MeasurementUnit;
  /** What the user is trying to do */
  profile?: MeasurementProfile;
  /** Window type */
  windowType?: WindowType;
  /** Room location */
  room?: Room;
  /** Measurement tolerance in mm */
  toleranceMm?: number;
  /** Number of windows (for cost/glass estimates) */
  count?: number;
}

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

/** Result of validating user input */
export interface ValidationResult {
  valid: boolean;
  /** Human-friendly error message — never technical */
  message?: string;
  /** Which field has the error */
  field?: 'width' | 'height' | 'unit' | 'general';
  /**
   * Severity of the validation result.
   * - 'error'   → blocks calculation entirely; results panel is hidden
   * - 'warning' → allows calculation to continue; advisory shown alongside results
   * Omitted (undefined) for valid results and treated as 'error' when valid is false.
   */
  level?: 'error' | 'warning';
}

// ---------------------------------------------------------------------------
// Calculator Output
// ---------------------------------------------------------------------------

/** A single output value with formatted display strings */
export interface CalculationValue {
  /** Value in mm (raw) */
  valueMm: number;
  /** Formatted for display in the current unit */
  formatted: string;
  /** Label shown to user */
  label: string;
  /** Optional sub-label or explanation */
  sublabel?: string;
  /** Unit suffix for display */
  unit: string;
}

/** Result of a calculation — can be a single value or grouped results */
export interface CalculatorResult {
  /** Core dimensions (normalized) */
  dimensions: Dimensions;
  /** Display unit */
  displayUnit: MeasurementUnit;
  /** All computed output values */
  values: CalculationValue[];
  /** Window classification */
  classification?: WindowClassification;
  /** Aspect ratio as a string like "4:3" */
  aspectRatio?: string;
  /** Whether all calculations are valid */
  valid: boolean;
  /** Optional computation timestamp */
  computedAt?: Date;
}

// ---------------------------------------------------------------------------
// Decision Engine
// ---------------------------------------------------------------------------

/** A step in the decision chain — guides users to next action */
export interface DecisionStep {
  /** Short label */
  label: string;
  /** Explanation of what this means */
  description: string;
  /** Optional link to a tool or guide */
  href?: string;
  /** Icon name (lucide icon key) */
  icon?: string;
  /** Visual status */
  status?: 'pass' | 'fail' | 'info' | 'warning';
}

/** A recommendation card shown after calculations */
export interface Recommendation {
  title: string;
  description: string;
  href?: string;
  /** Tool slug or external URL */
  type: 'tool' | 'guide' | 'info';
}

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

/** FAQ item for structured data and UI rendering */
export interface FAQ {
  question: string;
  answer: string;
}

// ---------------------------------------------------------------------------
// Glass Calculation
// ---------------------------------------------------------------------------

/** Glass pane specification for weight and area calculations */
export interface GlassSpecification {
  /** Number of panes (1 = single, 2 = double, 3 = triple) */
  panes: 1 | 2 | 3;
  /** Thickness of each pane in mm (typically 4 for residential, 6 for commercial) */
  thicknessMmPerPane: number;
  /** Optional: frame deduction factor (0–1, default 0.9 meaning 10% is frame) */
  frameRatio?: number;
}

/** Result of glass area and weight calculations */
export interface GlassResult {
  /** Net glazing area in mm² (after frame deduction) */
  glazingAreaMm2: number;
  /** Net glazing area in square feet */
  glazingAreaSqFt: number;
  /** Glass density in kg per m² */
  weightKgPerM2: number;
  /** Total glass weight in kg */
  totalWeightKg: number;
  /** Total glass weight in lbs */
  totalWeightLbs: number;
  /** Glazing area with 10% cutting waste added (mm²) */
  cutAreaMm2: number;
}

// ---------------------------------------------------------------------------
// Standard Sizes
// ---------------------------------------------------------------------------

/** Supported standard-size regions */
export type StandardRegion = 'US' | 'UK' | 'CA' | 'AU' | 'EU';

/** A single entry in the standard-size database */
export interface StandardSize {
  /** Width in inches (US/CA) or mm (UK/AU/EU) */
  widthIn: number;
  /** Height in inches (US/CA) or mm (UK/AU/EU) */
  heightIn: number;
  /** Common window type for this size */
  type?: string;
  /** AAMA / BS / AS catalogue code if applicable */
  code?: string;
}

/** Result of a nearest-standard-size lookup */
export interface StandardSizeResult {
  /** The closest standard size found */
  nearest: StandardSize;
  /** Euclidean distance from input to nearest size, in inches */
  distanceIn: number;
  /** True if within 0.5" — effectively an exact match */
  isExact: boolean;
  /** True if within 4" — very close, likely a nominal size */
  isClose: boolean;
  /** Signed difference: standard − input, in inches */
  diffWidthIn: number;
  diffHeightIn: number;
}

// ---------------------------------------------------------------------------
// Recommendations
// ---------------------------------------------------------------------------

/** Curtain sizing recommendation */
export interface CurtainRecommendation {
  /** Minimum panel width for light coverage (width × 1.5), in mm */
  minWidthMm: number;
  /** Full coverage panel width (width × 2), in mm */
  fullWidthMm: number;
  /** Total drop including headrail allowance, in mm */
  dropMm: number;
  /** Rod length (window width + extension each side), in mm */
  rodLengthMm: number;
  /** Headrail allowance above window, in mm */
  headrailAllowanceMm: number;
  /** Extension beyond window frame, each side, in mm */
  sideExtensionMm: number;
}

/** Blind sizing recommendation */
export interface BlindRecommendation {
  /** Inside-mount width (window width minus 12.7 mm / 0.5" deduction per side), in mm */
  insideWidthMm: number;
  /** Outside-mount width (window width + 76.2 mm / 3" per side), in mm */
  outsideWidthMm: number;
  /** Inside-mount drop (exact window height), in mm */
  insideDropMm: number;
  /** Outside-mount drop (window height + 50.8 mm / 2" clearance), in mm */
  outsideDropMm: number;
}

/** AC BTU recommendation based on window dimensions */
export interface ACBTUResult {
  /** Window area used for the calculation, in m² */
  windowAreaM2: number;
  /**
   * Suggested BTU range.
   * These are conservative estimates — full BTU calc requires room dimensions.
   */
  suggestedBTUMin: number;
  suggestedBTUMax: number;
  /** Whether a standard window AC unit physically fits the opening */
  fitsStandardUnit: boolean;
  /** Human-readable context note */
  note: string;
}

/** Replacement planning recommendation */
export interface ReplacementRecommendation {
  /** Nearest standard size result */
  standardMatch: StandardSizeResult;
  /** Rough opening width (frame + 12.7 mm each side), in mm */
  roughOpeningWidthMm: number;
  /** Rough opening height (frame + 12.7 mm each side), in mm */
  roughOpeningHeightMm: number;
  /** Whether a standard replacement is likely available */
  isStandardAvailable: boolean;
  /** Whether a custom order is required */
  requiresCustomOrder: boolean;
  /** Shim space each side, in mm */
  shimSpaceMm: number;
  /** Human-readable notes */
  notes: string[];
}

// ---------------------------------------------------------------------------
// Warning System
// ---------------------------------------------------------------------------

/** Structured warning or advisory message for the shared warning engine */
export interface WarningMessage {
  message: string;
  level: 'info' | 'warning' | 'error' | 'success';
  /** When true, calculations are blocked and results are hidden */
  blocking: boolean;
  title?: string;
}

/** A labelled section in a results panel */
export interface SectionDefinition {
  id: string;
  label: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// SEO & Navigation
// ---------------------------------------------------------------------------

/** Breadcrumb item for navigation and JSON-LD */
export interface BreadcrumbItem {
  label: string;
  href: string;
  /** True for the current page (no link rendered) */
  current?: boolean;
}

/** Full SEO metadata for a page */
export interface SEOMetadata {
  title: string;
  description: string;
  canonical: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: string;
  twitterTitle?: string;
  twitterDescription?: string;
  noindex?: boolean;
  /** Schema.org JSON-LD objects to inject */
  jsonLd?: object[];
}
