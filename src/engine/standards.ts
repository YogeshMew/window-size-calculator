/**
 * WindowMetrics — Standard Window Sizes Database
 *
 * This module is the single source of truth for all regional standard sizes.
 * Every calculator that needs a "nearest standard size" lookup imports from here.
 *
 * Internal representation:
 *   All sizes are stored in INCHES regardless of region.
 *   This makes Euclidean distance comparisons consistent across regions.
 *   Convert using toMm / fromMm when displaying.
 *
 * Data sources:
 *   US:  AAMA / WDMA residential standard sizes
 *   UK:  BS 6375-1:2009 and industry-common sizes
 *   CA:  NBC and industry-common sizes (similar to US)
 *   AU:  AS 2047:1999 and industry-common sizes
 *   EU:  EN 14351-1 and common European sizes
 */

import type { StandardSize, StandardSizeResult, StandardRegion } from '@/types/calculator.js';

// ---------------------------------------------------------------------------
// US Standard Sizes — AAMA / WDMA residential
// Source: ANSI/AAMA/WDMA 101/I.S. 2/NAFS residential window designations
// Units: inches
// ---------------------------------------------------------------------------

const US_STANDARD_SIZES: StandardSize[] = [
  // Single Hung / Double Hung
  { widthIn: 24, heightIn: 36,  type: 'Double Hung' },
  { widthIn: 24, heightIn: 48,  type: 'Double Hung' },
  { widthIn: 28, heightIn: 54,  type: 'Double Hung' },
  { widthIn: 30, heightIn: 36,  type: 'Double Hung' },
  { widthIn: 30, heightIn: 54,  type: 'Double Hung' },
  { widthIn: 32, heightIn: 54,  type: 'Double Hung' },
  { widthIn: 36, heightIn: 36,  type: 'Double Hung' },
  { widthIn: 36, heightIn: 48,  type: 'Double Hung' },
  { widthIn: 36, heightIn: 54,  type: 'Double Hung' },
  { widthIn: 36, heightIn: 60,  type: 'Double Hung' },
  { widthIn: 36, heightIn: 72,  type: 'Double Hung' },
  { widthIn: 40, heightIn: 54,  type: 'Double Hung' },
  { widthIn: 44, heightIn: 54,  type: 'Double Hung' },
  { widthIn: 48, heightIn: 54,  type: 'Double Hung' },
  { widthIn: 48, heightIn: 60,  type: 'Double Hung' },
  { widthIn: 48, heightIn: 72,  type: 'Double Hung' },
  // Sliding
  { widthIn: 60, heightIn: 48,  type: 'Sliding' },
  { widthIn: 60, heightIn: 54,  type: 'Sliding' },
  { widthIn: 60, heightIn: 60,  type: 'Sliding' },
  { widthIn: 72, heightIn: 48,  type: 'Sliding' },
  // Casement
  { widthIn: 18, heightIn: 36,  type: 'Casement' },
  { widthIn: 18, heightIn: 48,  type: 'Casement' },
  { widthIn: 18, heightIn: 60,  type: 'Casement' },
  { widthIn: 24, heightIn: 36,  type: 'Casement' },
  { widthIn: 24, heightIn: 48,  type: 'Casement' },
  // Awning
  { widthIn: 32, heightIn: 21,  type: 'Awning' },
  { widthIn: 36, heightIn: 24,  type: 'Awning' },
  { widthIn: 48, heightIn: 24,  type: 'Awning' },
  // Picture / Fixed
  { widthIn: 36, heightIn: 24,  type: 'Picture' },
  { widthIn: 48, heightIn: 36,  type: 'Picture' },
  { widthIn: 60, heightIn: 36,  type: 'Picture' },
];

// ---------------------------------------------------------------------------
// UK Standard Sizes — BS 6375-1 and industry common
// Source: BS 6375-1:2009 Performance of windows and doors.
// Note: widthIn / heightIn stored as inches converted from mm.
// ---------------------------------------------------------------------------

const UK_STANDARD_SIZES: StandardSize[] = [
  // Casement (mm → inches)
  { widthIn: 630  / 25.4, heightIn: 900  / 25.4, type: 'Casement' },
  { widthIn: 630  / 25.4, heightIn: 1050 / 25.4, type: 'Casement' },
  { widthIn: 780  / 25.4, heightIn: 900  / 25.4, type: 'Casement' },
  { widthIn: 780  / 25.4, heightIn: 1050 / 25.4, type: 'Casement' },
  { widthIn: 915  / 25.4, heightIn: 1050 / 25.4, type: 'Casement' },
  { widthIn: 1200 / 25.4, heightIn: 1050 / 25.4, type: 'Casement' },
  { widthIn: 1200 / 25.4, heightIn: 1200 / 25.4, type: 'Casement' },
  // Sash
  { widthIn: 900  / 25.4, heightIn: 1200 / 25.4, type: 'Sash' },
  { widthIn: 750  / 25.4, heightIn: 1200 / 25.4, type: 'Sash' },
  // Tilt & Turn
  { widthIn: 800  / 25.4, heightIn: 1000 / 25.4, type: 'Tilt & Turn' },
  { widthIn: 1000 / 25.4, heightIn: 1200 / 25.4, type: 'Tilt & Turn' },
  { widthIn: 1200 / 25.4, heightIn: 1400 / 25.4, type: 'Tilt & Turn' },
  // Fixed
  { widthIn: 600  / 25.4, heightIn: 900  / 25.4, type: 'Fixed' },
  { widthIn: 900  / 25.4, heightIn: 900  / 25.4, type: 'Fixed' },
];

// ---------------------------------------------------------------------------
// Canada Standard Sizes — NBC-aligned, industry common
// Similar to US but with some additional metric-derived sizes.
// ---------------------------------------------------------------------------

const CA_STANDARD_SIZES: StandardSize[] = [
  { widthIn: 24, heightIn: 36,  type: 'Double Hung' },
  { widthIn: 30, heightIn: 54,  type: 'Double Hung' },
  { widthIn: 32, heightIn: 54,  type: 'Double Hung' },
  { widthIn: 36, heightIn: 48,  type: 'Double Hung' },
  { widthIn: 36, heightIn: 60,  type: 'Double Hung' },
  { widthIn: 36, heightIn: 72,  type: 'Double Hung' },
  { widthIn: 48, heightIn: 60,  type: 'Double Hung' },
  { widthIn: 60, heightIn: 48,  type: 'Sliding' },
  { widthIn: 60, heightIn: 60,  type: 'Sliding' },
  { widthIn: 24, heightIn: 48,  type: 'Casement' },
  { widthIn: 32, heightIn: 60,  type: 'Casement' },
];

// ---------------------------------------------------------------------------
// Australia Standard Sizes — AS 2047:1999 and industry common
// ---------------------------------------------------------------------------

const AU_STANDARD_SIZES: StandardSize[] = [
  { widthIn: 600  / 25.4, heightIn: 900  / 25.4, type: 'Casement' },
  { widthIn: 900  / 25.4, heightIn: 900  / 25.4, type: 'Casement' },
  { widthIn: 1200 / 25.4, heightIn: 900  / 25.4, type: 'Casement' },
  { widthIn: 600  / 25.4, heightIn: 600  / 25.4, type: 'Awning' },
  { widthIn: 900  / 25.4, heightIn: 600  / 25.4, type: 'Awning' },
  { widthIn: 1200 / 25.4, heightIn: 600  / 25.4, type: 'Awning' },
  { widthIn: 1200 / 25.4, heightIn: 1200 / 25.4, type: 'Sliding' },
  { widthIn: 1500 / 25.4, heightIn: 1200 / 25.4, type: 'Sliding' },
  { widthIn: 1800 / 25.4, heightIn: 1200 / 25.4, type: 'Sliding' },
  { widthIn: 600  / 25.4, heightIn: 1200 / 25.4, type: 'Fixed' },
  { widthIn: 900  / 25.4, heightIn: 1200 / 25.4, type: 'Fixed' },
  { widthIn: 1200 / 25.4, heightIn: 1500 / 25.4, type: 'Fixed' },
];

// ---------------------------------------------------------------------------
// Europe Standard Sizes — EN 14351-1 and common European sizes
// ---------------------------------------------------------------------------

const EU_STANDARD_SIZES: StandardSize[] = [
  { widthIn: 600  / 25.4, heightIn: 900  / 25.4, type: 'Fixed' },
  { widthIn: 800  / 25.4, heightIn: 1000 / 25.4, type: 'Tilt & Turn' },
  { widthIn: 900  / 25.4, heightIn: 1200 / 25.4, type: 'Tilt & Turn' },
  { widthIn: 1000 / 25.4, heightIn: 1200 / 25.4, type: 'Tilt & Turn' },
  { widthIn: 1200 / 25.4, heightIn: 1400 / 25.4, type: 'Tilt & Turn' },
  { widthIn: 1200 / 25.4, heightIn: 1500 / 25.4, type: 'Fixed' },
  { widthIn: 1500 / 25.4, heightIn: 1500 / 25.4, type: 'Fixed' },
  { widthIn: 600  / 25.4, heightIn: 1000 / 25.4, type: 'Casement' },
  { widthIn: 900  / 25.4, heightIn: 1100 / 25.4, type: 'Casement' },
  { widthIn: 2400 / 25.4, heightIn: 2100 / 25.4, type: 'Sliding' },
];

// ---------------------------------------------------------------------------
// Registry
// ---------------------------------------------------------------------------

const STANDARD_SIZE_REGISTRY: Record<StandardRegion, StandardSize[]> = {
  US: US_STANDARD_SIZES,
  UK: UK_STANDARD_SIZES,
  CA: CA_STANDARD_SIZES,
  AU: AU_STANDARD_SIZES,
  EU: EU_STANDARD_SIZES,
};

// ---------------------------------------------------------------------------
// findNearestStandardSize
// ---------------------------------------------------------------------------

/**
 * Find the nearest standard window size for a given opening.
 *
 * Uses Euclidean distance on (width, height) pairs in inches.
 * This is region-aware — pass 'UK', 'AU', 'EU', or 'CA' for non-US sizes.
 *
 * @param widthMm   Opening width in mm
 * @param heightMm  Opening height in mm
 * @param region    Standard size region (default: 'US')
 * @returns         Nearest size, distance, and match quality flags
 *
 * @example
 * findNearestStandardSize(914.4, 1219.2, 'US')
 * // → { nearest: { widthIn: 36, heightIn: 48 }, distanceIn: 0, isExact: true, ... }
 *
 * @example
 * findNearestStandardSize(940, 1250, 'US')
 * // → { nearest: { widthIn: 36, heightIn: 48 }, distanceIn: ~1.4, isExact: false, isClose: true, ... }
 */
export function findNearestStandardSize(
  widthMm: number,
  heightMm: number,
  region: StandardRegion = 'US',
): StandardSizeResult {
  const sizes = STANDARD_SIZE_REGISTRY[region];

  // Convert input to inches for comparison
  const widthIn  = widthMm  / 25.4;
  const heightIn = heightMm / 25.4;

  let nearest = sizes[0];
  let minDist = Infinity;

  for (const size of sizes) {
    const dist = Math.sqrt(
      (size.widthIn  - widthIn)  ** 2 +
      (size.heightIn - heightIn) ** 2,
    );
    if (dist < minDist) {
      minDist  = dist;
      nearest  = size;
    }
  }

  const distanceIn = Math.round(minDist * 10) / 10;

  return {
    nearest,
    distanceIn,
    isExact:      distanceIn < 0.5,
    isClose:      distanceIn < 4,
    diffWidthIn:  Math.round((nearest.widthIn  - widthIn)  * 10) / 10,
    diffHeightIn: Math.round((nearest.heightIn - heightIn) * 10) / 10,
  };
}

/**
 * Get all standard sizes for a region.
 * Useful for displaying charts or building selection UIs.
 *
 * @param region  Target region (default: 'US')
 * @returns       Array of standard sizes in the region
 */
export function getStandardSizes(region: StandardRegion = 'US'): StandardSize[] {
  return STANDARD_SIZE_REGISTRY[region];
}

/**
 * Check whether given dimensions match a US standard size exactly (within 0.5").
 * Shorthand for findNearestStandardSize().isExact.
 *
 * @param widthMm   Width in mm
 * @param heightMm  Height in mm
 * @param region    Region (default: 'US')
 */
export function isStandardSize(
  widthMm: number,
  heightMm: number,
  region: StandardRegion = 'US',
): boolean {
  return findNearestStandardSize(widthMm, heightMm, region).isExact;
}
  