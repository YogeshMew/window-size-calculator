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
