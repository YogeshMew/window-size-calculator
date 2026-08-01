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
import type { StandardSize, StandardSizeResult, StandardRegion, MeasurementUnit } from '@/types/calculator.js';

// ---------------------------------------------------------------------------
// US Standard Sizes — AAMA / WDMA residential (Clean integers)
// ---------------------------------------------------------------------------

const US_STANDARD_SIZES: StandardSize[] = [
  { widthIn: 20, heightIn: 24, widthMm: 508,  heightMm: 610,  type: 'Double Hung' },
  { widthIn: 24, heightIn: 24, widthMm: 610,  heightMm: 610,  type: 'Double Hung' },
  { widthIn: 24, heightIn: 30, widthMm: 610,  heightMm: 762,  type: 'Double Hung' },
  { widthIn: 24, heightIn: 36, widthMm: 610,  heightMm: 914,  type: 'Double Hung' },
  { widthIn: 24, heightIn: 48, widthMm: 610,  heightMm: 1219, type: 'Double Hung' },
  { widthIn: 28, heightIn: 36, widthMm: 711,  heightMm: 914,  type: 'Double Hung' },
  { widthIn: 28, heightIn: 48, widthMm: 711,  heightMm: 1219, type: 'Double Hung' },
  { widthIn: 28, heightIn: 54, widthMm: 711,  heightMm: 1372, type: 'Double Hung' },
  { widthIn: 30, heightIn: 30, widthMm: 762,  heightMm: 762,  type: 'Double Hung' },
  { widthIn: 30, heightIn: 36, widthMm: 762,  heightMm: 914,  type: 'Double Hung' },
  { widthIn: 30, heightIn: 48, widthMm: 762,  heightMm: 1219, type: 'Double Hung' },
  { widthIn: 30, heightIn: 54, widthMm: 762,  heightMm: 1372, type: 'Double Hung' },
  { widthIn: 30, heightIn: 60, widthMm: 762,  heightMm: 1524, type: 'Double Hung' },
  { widthIn: 32, heightIn: 30, widthMm: 813,  heightMm: 762,  type: 'Double Hung' },
  { widthIn: 32, heightIn: 36, widthMm: 813,  heightMm: 914,  type: 'Double Hung' },
  { widthIn: 32, heightIn: 48, widthMm: 813,  heightMm: 1219, type: 'Double Hung' },
  { widthIn: 32, heightIn: 52, widthMm: 813,  heightMm: 1321, type: 'Double Hung' },
  { widthIn: 32, heightIn: 54, widthMm: 813,  heightMm: 1372, type: 'Double Hung' },
  { widthIn: 32, heightIn: 60, widthMm: 813,  heightMm: 1524, type: 'Double Hung' },
  { widthIn: 36, heightIn: 30, widthMm: 914,  heightMm: 762,  type: 'Double Hung' },
  { widthIn: 36, heightIn: 36, widthMm: 914,  heightMm: 914,  type: 'Double Hung' },
  { widthIn: 36, heightIn: 48, widthMm: 914,  heightMm: 1219, type: 'Double Hung' },
  { widthIn: 36, heightIn: 54, widthMm: 914,  heightMm: 1372, type: 'Double Hung' },
  { widthIn: 36, heightIn: 60, widthMm: 914,  heightMm: 1524, type: 'Double Hung' },
  { widthIn: 36, heightIn: 72, widthMm: 914,  heightMm: 1829, type: 'Double Hung' },
  { widthIn: 40, heightIn: 48, widthMm: 1016, heightMm: 1219, type: 'Double Hung' },
  { widthIn: 40, heightIn: 54, widthMm: 1016, heightMm: 1372, type: 'Double Hung' },
  { widthIn: 44, heightIn: 54, widthMm: 1118, heightMm: 1372, type: 'Double Hung' },
  { widthIn: 48, heightIn: 36, widthMm: 1219, heightMm: 914,  type: 'Double Hung' },
  { widthIn: 48, heightIn: 48, widthMm: 1219, heightMm: 1219, type: 'Double Hung' },
  { widthIn: 48, heightIn: 54, widthMm: 1219, heightMm: 1372, type: 'Double Hung' },
  { widthIn: 48, heightIn: 60, widthMm: 1219, heightMm: 1524, type: 'Double Hung' },
  { widthIn: 48, heightIn: 72, widthMm: 1219, heightMm: 1829, type: 'Double Hung' },
  { widthIn: 36, heightIn: 36, widthMm: 914,  heightMm: 914,  type: 'Sliding' },
  { widthIn: 48, heightIn: 36, widthMm: 1219, heightMm: 914,  type: 'Sliding' },
  { widthIn: 48, heightIn: 48, widthMm: 1219, heightMm: 1219, type: 'Sliding' },
  { widthIn: 60, heightIn: 36, widthMm: 1524, heightMm: 914,  type: 'Sliding' },
  { widthIn: 60, heightIn: 48, widthMm: 1524, heightMm: 1219, type: 'Sliding' },
  { widthIn: 60, heightIn: 54, widthMm: 1524, heightMm: 1372, type: 'Sliding' },
  { widthIn: 60, heightIn: 60, widthMm: 1524, heightMm: 1524, type: 'Sliding' },
  { widthIn: 72, heightIn: 48, widthMm: 1829, heightMm: 1219, type: 'Sliding' },
  { widthIn: 72, heightIn: 60, widthMm: 1829, heightMm: 1524, type: 'Sliding' },
  { widthIn: 18, heightIn: 36, widthMm: 457,  heightMm: 914,  type: 'Casement' },
  { widthIn: 18, heightIn: 48, widthMm: 457,  heightMm: 1219, type: 'Casement' },
  { widthIn: 18, heightIn: 60, widthMm: 457,  heightMm: 1524, type: 'Casement' },
  { widthIn: 24, heightIn: 36, widthMm: 610,  heightMm: 914,  type: 'Casement' },
  { widthIn: 24, heightIn: 48, widthMm: 610,  heightMm: 1219, type: 'Casement' },
  { widthIn: 24, heightIn: 60, widthMm: 610,  heightMm: 1524, type: 'Casement' },
  { widthIn: 30, heightIn: 48, widthMm: 762,  heightMm: 1219, type: 'Casement' },
  { widthIn: 30, heightIn: 60, widthMm: 762,  heightMm: 1524, type: 'Casement' },
  { widthIn: 32, heightIn: 21, widthMm: 813,  heightMm: 533,  type: 'Awning' },
  { widthIn: 36, heightIn: 24, widthMm: 914,  heightMm: 610,  type: 'Awning' },
  { widthIn: 48, heightIn: 24, widthMm: 1219, heightMm: 610,  type: 'Awning' },
  { widthIn: 24, heightIn: 24, widthMm: 610,  heightMm: 610,  type: 'Picture' },
  { widthIn: 36, heightIn: 24, widthMm: 914,  heightMm: 610,  type: 'Picture' },
  { widthIn: 36, heightIn: 36, widthMm: 914,  heightMm: 914,  type: 'Picture' },
  { widthIn: 48, heightIn: 36, widthMm: 1219, heightMm: 914,  type: 'Picture' },
  { widthIn: 48, heightIn: 48, widthMm: 1219, heightMm: 1219, type: 'Picture' },
  { widthIn: 60, heightIn: 36, widthMm: 1524, heightMm: 914,  type: 'Picture' },
  { widthIn: 60, heightIn: 48, widthMm: 1524, heightMm: 1219, type: 'Picture' },
];

// UK Standard Sizes — BS 6375-1:2009 (Native Metric Integers)
const UK_STANDARD_SIZES: StandardSize[] = [
  { widthIn: 24, heightIn: 35, widthMm: 600,  heightMm: 900,  type: 'Fixed' },
  { widthIn: 25, heightIn: 35, widthMm: 630,  heightMm: 900,  type: 'Casement' },
  { widthIn: 25, heightIn: 41, widthMm: 630,  heightMm: 1050, type: 'Casement' },
  { widthIn: 30, heightIn: 47, widthMm: 750,  heightMm: 1200, type: 'Sash' },
  { widthIn: 31, heightIn: 35, widthMm: 780,  heightMm: 900,  type: 'Casement' },
  { widthIn: 31, heightIn: 41, widthMm: 780,  heightMm: 1050, type: 'Casement' },
  { widthIn: 31, heightIn: 39, widthMm: 800,  heightMm: 1000, type: 'Tilt & Turn' },
  { widthIn: 35, heightIn: 35, widthMm: 900,  heightMm: 900,  type: 'Fixed' },
  { widthIn: 35, heightIn: 41, widthMm: 900,  heightMm: 1050, type: 'Casement' },
  { widthIn: 35, heightIn: 47, widthMm: 900,  heightMm: 1200, type: 'Sash' },
  { widthIn: 36, heightIn: 41, widthMm: 915,  heightMm: 1050, type: 'Casement' },
  { widthIn: 39, heightIn: 47, widthMm: 1000, heightMm: 1200, type: 'Tilt & Turn' },
  { widthIn: 47, heightIn: 41, widthMm: 1200, heightMm: 1050, type: 'Casement' },
  { widthIn: 47, heightIn: 47, widthMm: 1200, heightMm: 1200, type: 'Casement' },
  { widthIn: 47, heightIn: 55, widthMm: 1200, heightMm: 1400, type: 'Tilt & Turn' },
];

// Canada Standard Sizes (NBC-aligned)
const CA_STANDARD_SIZES: StandardSize[] = US_STANDARD_SIZES;

// Australia Standard Sizes — AS 2047:1999 (Native Metric Integers)
const AU_STANDARD_SIZES: StandardSize[] = [
  { widthIn: 24, heightIn: 24, widthMm: 600,  heightMm: 600,  type: 'Awning' },
  { widthIn: 24, heightIn: 35, widthMm: 600,  heightMm: 900,  type: 'Casement' },
  { widthIn: 24, heightIn: 47, widthMm: 600,  heightMm: 1200, type: 'Fixed' },
  { widthIn: 35, heightIn: 24, widthMm: 900,  heightMm: 600,  type: 'Awning' },
  { widthIn: 35, heightIn: 35, widthMm: 900,  heightMm: 900,  type: 'Casement' },
  { widthIn: 35, heightIn: 47, widthMm: 900,  heightMm: 1200, type: 'Fixed' },
  { widthIn: 47, heightIn: 24, widthMm: 1200, heightMm: 600,  type: 'Awning' },
  { widthIn: 47, heightIn: 35, widthMm: 1200, heightMm: 900,  type: 'Casement' },
  { widthIn: 47, heightIn: 47, widthMm: 1200, heightMm: 1200, type: 'Sliding' },
  { widthIn: 47, heightIn: 59, widthMm: 1200, heightMm: 1500, type: 'Fixed' },
  { widthIn: 59, heightIn: 47, widthMm: 1500, heightMm: 1200, type: 'Sliding' },
  { widthIn: 71, heightIn: 47, widthMm: 1800, heightMm: 1200, type: 'Sliding' },
];

// Europe Standard Sizes — EN 14351-1 (Native Metric Integers)
const EU_STANDARD_SIZES: StandardSize[] = [
  { widthIn: 24, heightIn: 35, widthMm: 600,  heightMm: 900,  type: 'Fixed' },
  { widthIn: 24, heightIn: 39, widthMm: 600,  heightMm: 1000, type: 'Casement' },
  { widthIn: 31, heightIn: 39, widthMm: 800,  heightMm: 1000, type: 'Tilt & Turn' },
  { widthIn: 35, heightIn: 43, widthMm: 900,  heightMm: 1100, type: 'Casement' },
  { widthIn: 35, heightIn: 47, widthMm: 900,  heightMm: 1200, type: 'Tilt & Turn' },
  { widthIn: 39, heightIn: 47, widthMm: 1000, heightMm: 1200, type: 'Tilt & Turn' },
  { widthIn: 47, heightIn: 47, widthMm: 1200, heightMm: 1200, type: 'Tilt & Turn' },
  { widthIn: 47, heightIn: 55, widthMm: 1200, heightMm: 1400, type: 'Tilt & Turn' },
  { widthIn: 47, heightIn: 59, widthMm: 1200, heightMm: 1500, type: 'Fixed' },
  { widthIn: 59, heightIn: 59, widthMm: 1500, heightMm: 1500, type: 'Fixed' },
  { widthIn: 94, heightIn: 83, widthMm: 2400, heightMm: 2100, type: 'Sliding' },
];

// Registry
const STANDARD_SIZE_REGISTRY: Record<StandardRegion, StandardSize[]> = {
  US: US_STANDARD_SIZES,
  UK: UK_STANDARD_SIZES,
  CA: CA_STANDARD_SIZES,
  AU: AU_STANDARD_SIZES,
  EU: EU_STANDARD_SIZES,
};

/**
 * Format a standard factory size for display without floating-point artifacts.
 */
export function formatStandardSize(
  size: StandardSize,
  unit: MeasurementUnit = 'in',
  region: StandardRegion = 'US',
): string {
  if (unit === 'mm') {
    return `${Math.round(size.widthMm)} × ${Math.round(size.heightMm)} mm`;
  }
  if (unit === 'cm') {
    const wCm = (size.widthMm / 10).toFixed(1).replace(/\.0$/, '');
    const hCm = (size.heightMm / 10).toFixed(1).replace(/\.0$/, '');
    return `${wCm} × ${hCm} cm`;
  }
  if (unit === 'm') {
    const wM = (size.widthMm / 1000).toFixed(2);
    const hM = (size.heightMm / 1000).toFixed(2);
    return `${wM} × ${hM} m`;
  }
  if (unit === 'ft') {
    const wFt = (size.widthIn / 12).toFixed(1);
    const hFt = (size.heightIn / 12).toFixed(1);
    return `${wFt}′ × ${hFt}′`;
  }
  // Default 'in'
  if (['UK', 'AU', 'EU'].includes(region)) {
    return `${Math.round(size.widthMm)} mm (${Math.round(size.widthIn)}" × ${Math.round(size.heightIn)}")`;
  }
  return `${Math.round(size.widthIn)}" × ${Math.round(size.heightIn)}"`;
}

/**
 * Find the nearest standard window size for a given opening.
 * Distance is computed in base millimeters for unit-independence.
 */
export function findNearestStandardSize(
  widthMm: number,
  heightMm: number,
  region: StandardRegion = 'US',
): StandardSizeResult {
  const sizes = STANDARD_SIZE_REGISTRY[region];

  let nearest = sizes[0];
  let minDistMm = Infinity;

  for (const size of sizes) {
    const dist = Math.sqrt(
      (size.widthMm  - widthMm)  ** 2 +
      (size.heightMm - heightMm) ** 2,
    );
    if (dist < minDistMm) {
      minDistMm = dist;
      nearest   = size;
    }
  }

  const distanceIn = Math.round((minDistMm / 25.4) * 10) / 10;
  const diffWidthIn = Math.round(((nearest.widthMm - widthMm) / 25.4) * 10) / 10;
  const diffHeightIn = Math.round(((nearest.heightMm - heightMm) / 25.4) * 10) / 10;

  return {
    nearest,
    distanceIn,
    isExact:      distanceIn < 0.5,
    isClose:      distanceIn < 4,
    diffWidthIn,
    diffHeightIn,
  };
}

/**
 * Find the top N nearest standard window sizes for a given opening.
 */
export function findTopStandardSizes(
  widthMm: number,
  heightMm: number,
  region: StandardRegion = 'US',
  limit = 3,
): StandardSizeResult[] {
  const sizes = STANDARD_SIZE_REGISTRY[region];

  const seen = new Set<string>();
  const scored: { size: StandardSize; distMm: number }[] = [];

  for (const size of sizes) {
    const key = `${size.widthMm}x${size.heightMm}`;
    if (seen.has(key)) continue;
    seen.add(key);

    const distMm = Math.sqrt(
      (size.widthMm  - widthMm)  ** 2 +
      (size.heightMm - heightMm) ** 2,
    );
    scored.push({ size, distMm });
  }

  scored.sort((a, b) => a.distMm - b.distMm);

  return scored.slice(0, limit).map(({ size, distMm }) => {
    const distanceIn = Math.round((distMm / 25.4) * 10) / 10;
    const diffWidthIn = Math.round(((size.widthMm - widthMm) / 25.4) * 10) / 10;
    const diffHeightIn = Math.round(((size.heightMm - heightMm) / 25.4) * 10) / 10;

    return {
      nearest: size,
      distanceIn,
      isExact:      distanceIn < 0.5,
      isClose:      distanceIn < 4,
      diffWidthIn,
      diffHeightIn,
    };
  });
}

export function getStandardSizes(region: StandardRegion = 'US'): StandardSize[] {
  return STANDARD_SIZE_REGISTRY[region];
}

export function isStandardSize(
  widthMm: number,
  heightMm: number,
  region: StandardRegion = 'US',
): boolean {
  return findNearestStandardSize(widthMm, heightMm, region).isExact;
}