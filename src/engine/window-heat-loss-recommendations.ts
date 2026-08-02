/**
 * WindowMetrics — Window Heat Loss Recommendations Engine
 *
 * Generates tailored recommendations, replacement glass choices, frame upgrades,
 * weatherstripping guidance, thermal film solutions, and priority rankings based on
 * window heat loss calculations.
 */

import type {
  WindowHeatLossInput,
  WindowHeatLossResult,
  WindowHeatLossType,
} from './window-heat-loss.js';

export interface WindowHeatLossRecommendationItem {
  title: string;
  body: string;
  tip?: string;
  type:
    | 'upgrade'
    | 'replacement'
    | 'frame'
    | 'weatherstripping'
    | 'film'
    | 'priority';
}

export interface WindowHeatLossRecommendationSet {
  recommendedGlazing: WindowHeatLossType;
  recommendedFrame: string;
  heatLossNote: string;
  costImpactNote: string;
  items: WindowHeatLossRecommendationItem[];
}

export function buildWindowHeatLossRecommendations(
  input: WindowHeatLossInput,
  result: WindowHeatLossResult
): WindowHeatLossRecommendationSet {
  const items: WindowHeatLossRecommendationItem[] = [];

  // 1. Upgrade Advice
  if (input.windowType === 'single-pane') {
    items.push({
      title: 'Critical Single-Pane Thermal Upgrade',
      body: `Your ${input.numberOfWindows} single-pane window(s) are losing ${result.heatLossWatts.toLocaleString()} Watts (${result.heatLossBtuHr.toLocaleString()} BTU/hr) of heating energy. Upgrading to Low-E double pane glass eliminates ~65% of this thermal loss.`,
      tip: 'Single-pane glass surface temperature drops near freezing in winter, causing uncomfortable cold room drafts.',
      type: 'upgrade',
    });
  } else {
    items.push({
      title: 'Thermal Envelope Performance',
      body: `Your current ${input.windowType.replace('-', ' ')} windows are operating at a U-Factor of ${result.uFactorBtu.toFixed(2)} (${result.energyRating} Rating). Annual thermal heat loss is estimated at ${result.annualHeatLossKwh.toLocaleString()} kWh ($${result.estimatedHeatingCostAnnual}/yr).`,
      tip: 'Adding Argon gas fill or upgrading to triple pane lowers U-factor to 0.18-0.22.',
      type: 'upgrade',
    });
  }

  // 2. Best Replacement Choice
  let recommendedGlazing: WindowHeatLossType = 'low-e';
  if (input.climate === 'cold' || input.outdoorTempF < 30) {
    recommendedGlazing = 'triple-pane';
    items.push({
      title: 'Best Replacement: Triple-Pane Insulated Glass',
      body: 'For cold climates with sub-freezing winter outdoor temperatures, triple-pane windows with Argon gas fill provide an outstanding U-Factor of 0.18–0.22, eliminating glass condensation and cold drafts.',
      tip: 'ENERGY STAR Most Efficient triple-pane windows keep interior glass surfaces warm to the touch.',
      type: 'replacement',
    });
  } else {
    recommendedGlazing = 'low-e';
    items.push({
      title: 'Best Replacement: Double-Pane Low-E Glass',
      body: 'Double-pane windows featuring Low-Emissivity (Low-E) microscopically-thin silver coating reflect indoor furnace heat back into the room while allowing natural sunlight daylight in.',
      type: 'replacement',
    });
  }

  // 3. Frame Suggestion
  if (input.frameMaterial === 'aluminum') {
    items.push({
      title: 'Frame Upgrade: Thermally-Broken Vinyl or Fiberglass',
      body: 'Un-broken aluminum frames conduct heat rapidly to the outside. Switching to multi-chamber vinyl or fiberglass frames reduces frame perimeter heat loss by up to 35%.',
      tip: 'Fiberglass frames expand and contract at the exact same rate as glass, ensuring lifelong seals.',
      type: 'frame',
    });
  } else {
    items.push({
      title: 'Frame Insulation Maintenance',
      body: `${input.frameMaterial.charAt(0).toUpperCase() + input.frameMaterial.slice(1)} frames offer excellent baseline thermal resistance. Ensure perimeter foam insulation is intact around the rough opening.`,
      type: 'frame',
    });
  }

  // 4. Weatherstripping Guidance
  items.push({
    title: 'Perimeter Weatherstripping & Air Leakage Seal',
    body: 'Air infiltration around sash edges can double effective heat loss. Inspect interlocking weatherstripping, bulb seals, and caulk exterior perimeter joints before winter.',
    tip: 'Replace worn compression weatherstripping strips every 5 to 7 years to maintain airtight seals.',
    type: 'weatherstripping',
  });

  // 5. Insulation Film Solution
  if (result.heatLossCategory === 'severe' || input.windowType === 'single-pane') {
    items.push({
      title: 'Immediate Fix: Shrink-Wrap Thermal Window Film',
      body: 'If full window replacement is delayed, applying clear interior shrink-wrap window insulation film creates a insulating dead-air space, cutting drafts by 40% for under $15 per window.',
      tip: 'Thermal shrink-wrap film applies in minutes with double-sided tape and a household hairdryer.',
      type: 'film',
    });
  }

  // 6. Replacement Priority Ranking
  const priorityExposure = input.exposure === 'north' ? 'North-Facing' : `${input.exposure.toUpperCase()}-Facing`;
  items.push({
    title: `Replacement Priority: ${priorityExposure} & Bedroom Windows`,
    body: `Priority #1: ${priorityExposure} windows exposed to prevailing cold winter winds with zero solar heat gain. Priority #2: Bedrooms and main living areas where cold glass drafts impact occupant comfort.`,
    tip: 'Focus winterization efforts on the coldest rooms first to maximize immediate energy savings.',
    type: 'priority',
  });

  const heatLossNote = `${result.heatLossWatts.toLocaleString()} W (${result.heatLossBtuHr.toLocaleString()} BTU/hr)`;
  const costImpactNote = `$${result.estimatedHeatingCostAnnual.toLocaleString()} / year heating loss cost`;

  return {
    recommendedGlazing,
    recommendedFrame: input.frameMaterial === 'aluminum' ? 'Vinyl / Fiberglass' : input.frameMaterial,
    heatLossNote,
    costImpactNote,
    items,
  };
}
