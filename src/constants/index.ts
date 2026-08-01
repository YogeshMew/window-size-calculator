/**
 * WindowMetrics — Shared Constants
 *
 * Single import point for all constants used across calculator pages and components.
 * Engine-internal constants are re-exported here so consumers need only one import path.
 */

// ---------------------------------------------------------------------------
// Engine constants (re-exported for convenience)
// ---------------------------------------------------------------------------

export { MIN_DIMENSION_MM, MAX_DIMENSION_MM } from '@/engine/validation.js';

// ---------------------------------------------------------------------------
// UI advisory thresholds
// Not used for validation (that is handled by the engine).
// Used for informational warnings and copy shown to the user.
// ---------------------------------------------------------------------------

/** Windows wider or taller than this trigger a "large window" advisory (10 ft in mm) */
export const LARGE_WINDOW_ADVISORY_MM = 3_048;

/** Windows narrower or shorter than this trigger a "small window" advisory (6 in in mm) */
export const SMALL_WINDOW_ADVISORY_MM = 152;

// ---------------------------------------------------------------------------
// Curtain sizing ratios
// ---------------------------------------------------------------------------

/** Minimum fullness ratio for light coverage (1.5× window width) */
export const CURTAIN_OVERLAP_RATIO_MIN = 1.5;

/** Full-coverage ratio for luxurious drape (2× window width) */
export const CURTAIN_OVERLAP_RATIO_FULL = 2.0;

// ---------------------------------------------------------------------------
// Aspect ratio display
// ---------------------------------------------------------------------------

/** When neither side of a ratio simplifies to ≤ this value, fall back to decimal form */
export const ASPECT_RATIO_MAX_INTEGER = 20;
