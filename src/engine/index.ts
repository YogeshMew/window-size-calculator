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
 *   calculations.ts    — Area, perimeter, diagonal, aspect ratio, net glass area, glass weight
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
export * from './replacement.js';
export * from './replacement-recommendations.js';
export * from './blinds.js';
export * from './blinds-recommendations.js';
export * from './screen.js';
export * from './screen-recommendations.js';
export * from './film.js';
export * from './film-recommendations.js';
export * from './egress.js';
export * from './egress-recommendations.js';
export * from './window-weight.js';
export * from './window-weight-recommendations.js';
export * from './window-cost.js';
export * from './window-cost-recommendations.js';
export * from './window-energy.js';
export * from './window-energy-recommendations.js';
export * from './window-heat-loss.js';
export * from './window-heat-loss-recommendations.js';
export * from './window-area.js';
export * from './window-area-recommendations.js';
export * from './window-opening.js';
export * from './window-opening-recommendations.js';
export * from './window-insulation.js';
export * from './window-insulation-recommendations.js';
export * from './window-frame.js';
export * from './window-frame-recommendations.js';
export * from './window-trim.js';
export * from './window-trim-recommendations.js';
export * from './btu.js';
export * from './btu-recommendations.js';
export * from './window-installation.js';
export * from './window-installation-recommendations.js';
