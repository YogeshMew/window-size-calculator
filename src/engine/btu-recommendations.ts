/**
 * WindowMetrics — General BTU Recommendations Engine
 *
 * Generates HVAC sizing guidance, ductwork advice, inverter compressor benefits,
 * insulation improvements, thermostat programming tips, and energy cost optimizations.
 */

import type {
  BtuInput,
  BtuResult,
} from './btu.js';

export interface BtuRecommendationItem {
  title: string;
  body: string;
  tip?: string;
  type:
    | 'sizing'
    | 'insulation'
    | 'window'
    | 'thermostat'
    | 'energy'
    | 'climate';
}

export interface BtuRecommendationSet {
  hvacSizingNote: string;
  powerConsumptionNote: string;
  items: BtuRecommendationItem[];
}

export function buildBtuRecommendations(
  input: BtuInput,
  result: BtuResult
): BtuRecommendationSet {
  const items: BtuRecommendationItem[] = [];

  const btuFormatted = result.recommendedBtu.toLocaleString();
  const sqFt = Math.round(result.roomAreaSqFt);

  // 1. HVAC Sizing & Equipment Selection
  if (input.purpose === 'cooling') {
    items.push({
      title: `Recommended Cooling Capacity: ${btuFormatted} BTU (${result.recommendedTonnage} Tons)`,
      body: `For a ${sqFt} sq ft ${input.roomType.replace('-', ' ')} in a ${input.climate} climate, specify a ${result.recommendedTonnage} Ton mini-split or window AC unit.`,
      tip: 'Inverter variable-speed compressors automatically ramp down when room temperature is reached, saving up to 40% on electricity.',
      type: 'sizing',
    });
  } else if (input.purpose === 'heating') {
    items.push({
      title: `Recommended Heating Capacity: ${result.adjustedHeatingBtu.toLocaleString()} BTU`,
      body: `For heating a ${sqFt} sq ft room in a ${input.climate} climate zone, select a space heater, heat pump, or furnace rated for at least ${result.adjustedHeatingBtu.toLocaleString()} BTU/hr.`,
      tip: 'Cold-climate heat pumps (CCHP) maintain high heating capacity even when outdoor temperatures drop to -15°F (-26°C).',
      type: 'sizing',
    });
  } else {
    items.push({
      title: `Combined HVAC Sizing: ${result.recommendedHvacSize}`,
      body: `Your space requires ${result.adjustedCoolingBtu.toLocaleString()} BTU for summer cooling and ${result.adjustedHeatingBtu.toLocaleString()} BTU for winter heating. Specify a dual-fuel heat pump system rated for ${btuFormatted} BTU.`,
      tip: 'Dual-stage heat pumps automatically switch between heat pump and auxiliary furnace based on outdoor temperature.',
      type: 'sizing',
    });
  }

  // 2. Insulation Improvement
  if (input.insulation === 'poor' || input.insulation === 'average') {
    items.push({
      title: 'Attic & Wall Insulation Upgrade (20% Load Reduction)',
      body: `Upgrading wall and ceiling insulation to R-38 (attic) and R-13 (walls) reduces your required HVAC equipment size by up to 1/2 Ton, saving $400+ on equipment purchase costs.`,
      tip: 'Sealing attic bypass leaks around light fixtures and duct boots provides immediate heat loss reduction.',
      type: 'insulation',
    });
  }

  // 3. Window Solar Gain & Insulation
  if (input.numberOfWindows > 0 && input.windowType === 'single-pane') {
    items.push({
      title: 'Window Thermal Upgrade (Low-E Glass)',
      body: `Your ${input.numberOfWindows} single-pane window(s) add ${input.numberOfWindows * 1000} BTU of solar heat gain in summer and thermal heat loss in winter. Upgrading to double-pane Low-E glass cuts window heat gain by 60%.`,
      tip: 'Install cellular honeycomb shades over south and west-facing windows to block afternoon solar heat.',
      type: 'window',
    });
  }

  // 4. Thermostat & Energy Saving Tips
  items.push({
    title: 'Smart Programmable Thermostat Schedule',
    body: 'Set your thermostat to 78°F (25°C) in summer and 68°F (20°C) in winter. Every 1°F adjustment saves approximately 3% on monthly heating and cooling energy bills.',
    tip: 'Smart thermostats automatically adjust temperature 30 minutes before you arrive home from work.',
    type: 'thermostat',
  });

  // 5. Energy Cost & Power Consumption
  items.push({
    title: `Monthly Energy Operating Cost: ~$${result.estimatedMonthlyEnergyCost} / month`,
    body: `Estimated power draw is ${result.estimatedPowerConsumptionKw} kW (operating 8 hrs/day @ $0.16/kWh). High-efficiency 18+ SEER2 systems lower monthly operating costs by 22%.`,
    tip: 'Clean or replace HVAC air filters monthly to prevent restricted airflow and blower motor burn-out.',
    type: 'energy',
  });

  // 6. Regional Climate Guidance
  items.push({
    title: `${input.climate.toUpperCase()} Climate Zone Optimization`,
    body: input.climate === 'cold'
      ? 'In cold northern climates, ensure ductwork running through unheated attic or crawlspace is insulated to R-8 minimum.'
      : 'In hot humid climates, ensure your A/C unit is not oversized, as an oversized unit cools too fast without dehumidifying room air.',
    type: 'climate',
  });

  const hvacSizingNote = `${result.recommendedHvacSize}`;
  const powerConsumptionNote = `Est. Power: ${result.estimatedPowerConsumptionKw} kW (~$${result.estimatedMonthlyEnergyCost}/mo)`;

  return {
    hvacSizingNote,
    powerConsumptionNote,
    items,
  };
}
