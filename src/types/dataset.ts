/**
 * WindowMetrics — Dataset Types
 *
 * Types for structured reference data: standard sizes, window types, glass specs.
 * These types define the shape of data — data itself lives in src/data/*.ts
 */

import type { WindowType } from './calculator.js';

// ---------------------------------------------------------------------------
// Standard Window Sizes
// ---------------------------------------------------------------------------

/** Region for standard size datasets */
export type SizeRegion = 'US' | 'UK' | 'CA' | 'AU' | 'EU';

/** A standard window size entry */
export interface StandardWindowSize {
  /** Width in mm */
  widthMm: number;
  /** Height in mm */
  heightMm: number;
  /** Human-readable label (e.g. "2030 × 1200") */
  label: string;
  /** Window types this size is common for */
  windowTypes: WindowType[];
  /** Whether this is a "common" size (shown first) */
  common: boolean;
  /** Region this standard applies to */
  region: SizeRegion;
}

// ---------------------------------------------------------------------------
// Window Type Data
// ---------------------------------------------------------------------------

/** Full reference data for a window type */
export interface WindowTypeData {
  type: WindowType;
  label: string;
  description: string;
  /** Typical width range in mm */
  widthMmRange: [min: number, max: number];
  /** Typical height range in mm */
  heightMmRange: [min: number, max: number];
  advantages: string[];
  disadvantages: string[];
  /** Recommended rooms */
  recommendedRooms: string[];
}

// ---------------------------------------------------------------------------
// Glass Specifications
// ---------------------------------------------------------------------------

/** Glass glazing type */
export type GlazingType = 'single' | 'double' | 'triple';

/** Glass specification entry */
export interface GlassSpec {
  glazing: GlazingType;
  label: string;
  /** Typical thickness in mm */
  thicknessMm: number;
  /** Density in kg/m² per mm of thickness */
  densityKgPerM2PerMm: number;
  /** U-value (thermal transmittance) in W/m²K */
  uValue?: number;
  /** Notes */
  notes?: string;
}

// ---------------------------------------------------------------------------
// Region
// ---------------------------------------------------------------------------

/** Geographic region for localized calculations */
export interface Region {
  code: string;
  label: string;
  /** Whether this region uses metric or imperial by default */
  unitSystem: 'metric' | 'imperial';
  /** Building code reference */
  buildingCode?: string;
}
