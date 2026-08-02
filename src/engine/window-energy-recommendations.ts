/**
 * WindowMetrics — Window Energy Recommendations Engine
 *
 * Generates tailored upgrade recommendations, glass & frame selection guidance,
 * climate optimizations, window film alternatives, and priority rankings based on
 * window energy savings calculations.
 */

import type {
  WindowEnergyInput,
  WindowEnergyResult,
  NewWindowType,
} from './window-energy.js';

export interface WindowEnergyRecommendationItem {
  title: string;
  body: string;
  tip?: string;
  type:
    | 'upgrade'
    | 'glass'
    | 'frame'
    | 'climate'
    | 'film'
    | 'priority'
    | 'roi';
}

export interface WindowEnergyRecommendationSet {
  recommendedGlass: NewWindowType;
  recommendedFrame: string;
  savingsNote: string;
  co2Note: string;
  items: WindowEnergyRecommendationItem[];
}

export function buildWindowEnergyRecommendations(
  input: WindowEnergyInput,
  result: WindowEnergyResult
): WindowEnergyRecommendationSet {
  const items: WindowEnergyRecommendationItem[] = [];

  // 1. Upgrade Advice
  if (input.currentWindow === 'single-pane') {
    items.push({
      title: 'High-Impact Single Pane Replacement',
      body: `Upgrading ${input.numberOfWindows} single-pane window(s) cuts thermal transmission by over 65%. Your annual savings of $${result.annualSavings.toLocaleString()}/yr will recoup your window investment quickly.`,
      tip: 'Single-pane windows account for up to 30% of total home heat loss in cold climate zones.',
      type: 'upgrade',
    });
  } else {
    items.push({
      title: 'Efficiency Boost & Thermal Comfort',
      body: `Replacing existing ${input.currentWindow.replace('-', ' ')} units with high-performance ${input.newWindow.replace('-', ' ')} glass reduces annual heat loss by ${result.annualHeatLossKwh.toLocaleString()} kWh and eliminates drafty cold spots near window glass.`,
      tip: 'Double and triple-pane windows significantly reduce exterior traffic and street noise.',
      type: 'upgrade',
    });
  }

  // 2. Best Glass Recommendation by Climate Zone
  let recommendedGlass: NewWindowType = 'low-e';
  if (input.climateZone === 'cold') {
    recommendedGlass = 'argon';
    items.push({
      title: 'Cold Climate: Low-E + Argon Gas Fill',
      body: 'In northern cold climates (High HDD), double or triple-pane glass with Low-E coating and Argon or Krypton gas fill provides an outstanding U-Factor of 0.20-0.24, trapping furnace heat indoors.',
      tip: 'Look for ENERGY STAR Northern Climate qualification with a U-factor ≤ 0.22.',
      type: 'glass',
    });
  } else if (input.climateZone === 'hot') {
    recommendedGlass = 'low-e';
    items.push({
      title: 'Hot Climate: Low SHGC Solar Control Glass',
      body: 'In southern hot climates (High CDD), prioritize a low Solar Heat Gain Coefficient (SHGC ≤ 0.25) to block infrared solar heat and reduce air conditioning compressor load.',
      tip: 'Spectrally-selective Low-E coatings block solar heat gain while letting in 70%+ visible daylight.',
      type: 'glass',
    });
  } else {
    recommendedGlass = 'low-e';
    items.push({
      title: 'Mixed Climate: Balanced Low-E Double Pane',
      body: 'For central climates with balanced heating and cooling seasons, a double-pane Low-E unit with SHGC ~0.30 to 0.35 delivers optimal year-round thermal equilibrium.',
      type: 'glass',
    });
  }

  // 3. Frame Recommendation
  if (input.frameMaterial === 'vinyl' || input.frameMaterial === 'fiberglass') {
    items.push({
      title: 'High-Insulation Frame Choice',
      body: `${input.frameMaterial.charAt(0).toUpperCase() + input.frameMaterial.slice(1)} window frames feature multi-chamber insulated air pockets that prevent frame thermal bridging and condensation buildup.`,
      tip: 'Fiberglass frames expand and contract at the exact same rate as glass, ensuring lifelong airtight seals.',
      type: 'frame',
    });
  } else if (input.frameMaterial === 'aluminum') {
    items.push({
      title: 'Thermal Break Aluminum Requirement',
      body: 'Standard aluminum frames readily conduct heat. Ensure your contractor specifies thermally-broken aluminum profiles with polyamide insulating barrier strips.',
      type: 'frame',
    });
  }

  // 4. Window Film Alternative
  if (input.currentWindow !== 'single-pane' && result.estimatedPaybackPeriodYears > 15) {
    items.push({
      title: 'Cost-Effective Low-E Window Film Alternative',
      body: 'If full window unit replacement is cost-prohibitive, applying professional solar control Low-E window film costs 80% less ($6–$12/sq ft) and yields 40–60% of the energy savings of new windows.',
      tip: 'Thermal window film is an excellent fast-payback option for south and west facing room windows.',
      type: 'film',
    });
  }

  // 5. Replacement Priority
  items.push({
    title: 'Phased Replacement Priority Plan',
    body: `Priority #1: Replace large living room & primary bedroom windows facing prevailing winter winds or summer sun. Priority #2: Single-pane basement & upper floor windows.`,
    tip: 'Replacing windows in clusters of 5+ lowers contractor labor cost per window by 15-20%.',
    type: 'priority',
  });

  // 6. Expected ROI & Environmental Impact
  items.push({
    title: `Carbon Footprint Reduction (${result.co2ReductionKg.toLocaleString()} kg CO₂/yr)`,
    body: `Your upgrade prevents approximately ${result.co2ReductionKg.toLocaleString()} kg of CO₂ emissions annually—equivalent to planting ${Math.max(1, Math.round(result.co2ReductionKg / 22))} trees or avoiding ${Math.round(result.co2ReductionKg * 2.4)} miles of driving every year.`,
    tip: 'Lifetime 25-year energy bill savings: $' + result.lifetimeSavings.toLocaleString(),
    type: 'roi',
  });

  const savingsNote = `$${result.annualSavings.toLocaleString()} / year ($${result.monthlySavings.toFixed(2)}/mo)`;
  const co2Note = `${result.co2ReductionKg.toLocaleString()} kg CO₂ saved annually`;

  return {
    recommendedGlass,
    recommendedFrame: input.frameMaterial,
    savingsNote,
    co2Note,
    items,
  };
}
