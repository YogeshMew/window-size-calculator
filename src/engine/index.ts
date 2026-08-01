/**
 * WindowMetrics — Calculation Engine
 *
 * Single entry-point for all measurement, conversion, calculation, and
 * recommendation logic.
 *
 * Usage:
 *   import { normalizeInput, calculateArea, findNearestStandardSize } from '@/engine';
 *
 * Modules:
 *   units.ts           — Unit conversion, input normalization, display formatting
 *   validation.ts      — Dimension validation with human-readable messages
 *   calculations.ts    — Area, perimeter, diagonal, aspect ratio, glass weight
 *   standards.ts       — Standard size database (US, UK, CA, AU, EU) + nearest-size lookup
 *   recommendations.ts — Curtain, blind, AC BTU, replacement planning recommendations
 */

export * from './units.js';
export * from './validation.js';
export * from './calculations.js';
export * from './standards.js';
export * from './recommendations.js';
export * from './format.js';
export * from './ac.js';
export * from './curtain.js';
export * from './glass.js';
