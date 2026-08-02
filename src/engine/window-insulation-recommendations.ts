/**
 * WindowMetrics — Window Insulation Recommendations Engine
 *
 * Generates thermal insulation recommendations, seal repair steps, weatherstripping choices,
 * glass upgrade priorities, insulating shade suggestions, and expected performance gains.
 */

import type {
  WindowInsulationInput,
  WindowInsulationResult,
} from './window-insulation.js';

export interface WindowInsulationRecommendationItem {
  title: string;
  body: string;
  tip?: string;
  type:
    | 'seal'
    | 'weatherstripping'
    | 'glass'
    | 'frame'
    | 'curtain'
    | 'film'
    | 'replacement'
    | 'improvement';
}

export interface WindowInsulationRecommendationSet {
  targetRValueNote: string;
  expectedImprovementNote: string;
  items: WindowInsulationRecommendationItem[];
}

export function buildWindowInsulationRecommendations(
  input: WindowInsulationInput,
  result: WindowInsulationResult
): WindowInsulationRecommendationSet {
  const items: WindowInsulationRecommendationItem[] = [];

  // 1. Seal Improvement & Repair
  if (input.sealCondition === 'poor' || input.sealCondition === 'average') {
    items.push({
      title: 'Perimeter Seal Caulk & Foam Restoration',
      body: 'Recaulk exterior perimeter frame joints with high-grade silicone elastomeric sealant and inject low-expansion foam into rough opening gaps to stop perimeter air infiltration.',
      tip: 'Sealing perimeter air leaks can boost thermal performance by 15% without replacing the window unit.',
      type: 'seal',
    });
  } else {
    items.push({
      title: 'Airtight Seal Maintenance',
      body: 'Your window perimeter seals are in good condition. Inspect sash lock compression annually to maintain an airtight seal.',
      type: 'seal',
    });
  }

  // 2. Weatherstripping Recommendation
  if (input.draftRisk === 'severe-drafts' || input.draftRisk === 'drafty') {
    items.push({
      title: 'High-Performance Interlocking Weatherstripping',
      body: 'Replace worn felt or foam compression weatherstripping with V-strip polypropylene or EPDM rubber bulb seals to eliminate winter drafts.',
      tip: 'Compression bulb seals create a positive pressure barrier against driving winter wind.',
      type: 'weatherstripping',
    });
  }

  // 3. Glass Upgrade Recommendation
  if (input.windowType === 'single-pane') {
    items.push({
      title: 'High-Impact Low-E Argon Glass Upgrade',
      body: 'Upgrading single-pane glass to Double-Pane Low-E glass with Argon gas fill increases thermal insulation from R-0.9 to R-4.2 (a 360% R-value improvement).',
      tip: 'ENERGY STAR Low-E coating reflects indoor radiant furnace heat back into your living space.',
      type: 'glass',
    });
  } else if (input.windowType === 'double-pane' && input.climate === 'cold') {
    items.push({
      title: 'Triple-Pane Krypton Glass Upgrade',
      body: 'In northern cold climate zones, upgrading from standard double-pane to triple-pane Krypton-filled glass boosts thermal resistance to R-5.5+.',
      type: 'glass',
    });
  }

  // 4. Frame Material Recommendation
  if (input.frameMaterial === 'aluminum') {
    items.push({
      title: 'Thermally-Broken Vinyl or Fiberglass Frame Upgrade',
      body: 'Replace conductive aluminum frames with multi-chamber vinyl or composite fiberglass frames to prevent thermal bridging and eliminate glass edge condensation.',
      tip: 'Fiberglass frames offer the lowest thermal expansion coefficient of all window framing materials.',
      type: 'frame',
    });
  }

  // 5. Insulating Shades & Curtains
  if (input.windowCovering === 'none' || input.windowCovering === 'blinds') {
    items.push({
      title: 'Cellular / Honeycomb Insulating Shades (+R-1.8 Boost)',
      body: 'Installing double-cell honeycomb insulating shades creates dead-air pockets over the glass, adding +R-1.8 to your window insulation performance.',
      tip: 'Close cellular shades at dusk during winter nights to trap room heat inside.',
      type: 'curtain',
    });
  }

  // 6. Thermal Window Film Option
  if (result.thermalEfficiencyScore < 60) {
    items.push({
      title: 'Cost-Effective Shrink-Wrap Thermal Window Film',
      body: 'Apply interior shrink-wrap thermal window film during winter months. It costs under $15 per window and adds +R-1.0 insulation while blocking room drafts.',
      type: 'film',
    });
  }

  // 7. Expected Improvement Summary
  const targetR = input.windowType === 'single-pane' ? 'R-4.2 (Low-E Argon)' : 'R-5.5 (Triple Pane)';
  items.push({
    title: `Expected Target Performance: ${targetR}`,
    body: `Upgrading your current ${input.windowType.replace('-', ' ')} window will raise your Thermal Efficiency Score from ${result.thermalEfficiencyScore}/100 to 90+/100, reducing window heat transfer by up to ${result.upgradePotentialPercent}%.`,
    type: 'improvement',
  });

  const targetRValueNote = `Target: ${targetR} (Score: ${result.thermalEfficiencyScore}/100)`;
  const expectedImprovementNote = `+${result.upgradePotentialPercent}% Potential Thermal Improvement`;

  return {
    targetRValueNote,
    expectedImprovementNote,
    items,
  };
}
