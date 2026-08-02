/**
 * Vitest Test Suite for General BTU Calculator Engine
 *
 * Tests room area/volume calculations, cooling vs heating BTU loads, climate multipliers,
 * insulation ratings, window solar gains, occupant heat gains, tonnage snapping,
 * power consumption (kW), monthly electricity cost, and recommendations.
 */

import { describe, it, expect } from 'vitest';
import {
  calculateBTU,
  BTU_DEFAULTS,
  BASE_COOLING_BTU_PER_SQFT,
  BASE_HEATING_BTU_PER_SQFT,
  type BtuInput,
} from '../btu.js';
import { buildBtuRecommendations } from '../btu-recommendations.js';

const BASE_INPUT: BtuInput = {
  roomLengthMm: 4572, // 15 ft
  roomWidthMm: 6096,  // 20 ft
  ceilingHeightMm: 2438.4, // 8 ft
  purpose: 'both',
  roomType: 'living-room',
  climate: 'moderate',
  insulation: 'good',
  numberOfWindows: 2,
  windowType: 'double-pane',
  orientation: 'south',
  sunExposure: 'medium',
  occupants: 3,
  lighting: 'standard',
  appliances: 'medium',
};

describe('General BTU Engine — Defaults & Constants', () => {
  it('defines valid defaults and constants', () => {
    expect(BTU_DEFAULTS.BTU_PER_TON).toBe(12000);
    expect(BTU_DEFAULTS.SEER_RATING_STANDARD).toBe(14);
    expect(BASE_COOLING_BTU_PER_SQFT['living-room']).toBe(25);
    expect(BASE_HEATING_BTU_PER_SQFT['cold']).toBe(50);
  });
});

describe('General BTU Engine — Core Calculations', () => {
  it('calculates 300 sq ft room cooling & heating load', () => {
    const result = calculateBTU(BASE_INPUT);

    expect(result.roomAreaSqFt).toBeCloseTo(300, 0);
    expect(result.roomVolumeCuFt).toBeCloseTo(2400, 0);

    expect(result.adjustedCoolingBtu).toBeGreaterThan(6000);
    expect(result.adjustedHeatingBtu).toBeGreaterThan(8000);

    expect(result.recommendedTonnage).toBeGreaterThan(0.5);
    expect(result.estimatedPowerConsumptionKw).toBeGreaterThan(0);
    expect(result.confidence).toBe('excellent');
  });

  it('server room requires significantly higher cooling BTU than bedroom', () => {
    const bedroom = calculateBTU({ ...BASE_INPUT, roomType: 'bedroom' });
    const server = calculateBTU({ ...BASE_INPUT, roomType: 'server-room' });

    expect(server.adjustedCoolingBtu).toBeGreaterThan(bedroom.adjustedCoolingBtu * 2);
    expect(server.warnings.some((w) => w.code === 'SERVER_ROOM_HIGH_HEAT_LOAD')).toBe(true);
  });

  it('cold climate requires significantly higher heating load than hot climate', () => {
    const cold = calculateBTU({ ...BASE_INPUT, climate: 'cold', purpose: 'heating' });
    const hot = calculateBTU({ ...BASE_INPUT, climate: 'hot', purpose: 'heating' });

    expect(cold.adjustedHeatingBtu).toBeGreaterThan(hot.adjustedHeatingBtu * 2);
  });

  it('poor insulation increases required HVAC tonnage', () => {
    const good = calculateBTU({ ...BASE_INPUT, insulation: 'good' });
    const poor = calculateBTU({ ...BASE_INPUT, insulation: 'poor' });

    expect(poor.adjustedCoolingBtu).toBeGreaterThan(good.adjustedCoolingBtu);
  });
});

describe('General BTU Engine — Recommendations Module', () => {
  it('builds comprehensive recommendation set', () => {
    const res = calculateBTU(BASE_INPUT);
    const recs = buildBtuRecommendations(BASE_INPUT, res);

    expect(recs.hvacSizingNote).toContain('BTU');
    expect(recs.items.length).toBeGreaterThanOrEqual(5);
    expect(recs.powerConsumptionNote).toContain('kW');
  });
});
