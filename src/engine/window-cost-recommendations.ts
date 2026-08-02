/**
 * WindowMetrics — Window Cost Recommendations Engine
 *
 * Generates tailored recommendations, ROI estimates, energy savings,
 * material alternatives, and installation guidance based on window cost calculation.
 */

import type {
  WindowCostInput,
  WindowCostResult,
  WindowCostStyle,
} from './window-cost.js';

export interface WindowCostRecommendationItem {
  title: string;
  body: string;
  tip?: string;
  type:
    | 'budget'
    | 'alternative'
    | 'upgrade'
    | 'roi'
    | 'energy'
    | 'installation'
    | 'buying'
    | 'warranty';
}

export interface WindowCostRecommendationSet {
  recommendedStyle: WindowCostStyle;
  recommendedMaterial: string;
  budgetNote: string;
  roiNote: string;
  energySavingsEstAnnual: number;
  items: WindowCostRecommendationItem[];
}

export function buildWindowCostRecommendations(
  input: WindowCostInput,
  result: WindowCostResult
): WindowCostRecommendationSet {
  const items: WindowCostRecommendationItem[] = [];

  // 1. Budget Advice & Optimization
  if (result.budgetCategory === 'luxury' || result.budgetCategory === 'premium') {
    items.push({
      title: 'Premium Budget Tier Optimization',
      body: `Your estimated project cost of $${result.grandTotal.toLocaleString()} places this in the ${result.budgetCategory.toUpperCase()} tier. Consider vinyl frames or double-pane Low-E glass to save 20–35% without sacrificing thermal efficiency.`,
      tip: 'Mixing premium wood frames on front façade with matching vinyl on sides/rear can reduce overall project cost by up to 25%.',
      type: 'budget',
    });
  } else {
    items.push({
      title: 'Cost-Effective Value Tier',
      body: `At an average of $${result.totalCostPerUnit.toLocaleString()} per window ($${result.costPerSqFt}/sq ft), this is a solid cost-effective specification offering strong value and durability.`,
      tip: 'Look for volume installer discounts when replacing 5 or more windows simultaneously.',
      type: 'budget',
    });
  }

  // 2. Cheaper Alternatives
  if (input.frameMaterial === 'wood') {
    items.push({
      title: 'Wood-Look Vinyl or Composite Alternative',
      body: 'Real wood frames require painting/staining every 3–5 years and cost ~60% more than vinyl. Premium composite or wood-grain vinyl frames offer the classic timber aesthetic at lower upfront cost and zero maintenance.',
      tip: 'Fiberglass frames also match wood structural stiffness with superior thermal expansion stability.',
      type: 'alternative',
    });
  } else if (input.windowStyle === 'double-hung') {
    items.push({
      title: 'Single-Hung Cost Alternative',
      body: 'If upper sash ventilation is not required, switching to Single-Hung windows saves approximately $70–$100 per unit while improving air-tightness.',
      type: 'alternative',
    });
  }

  // 3. Premium Upgrades
  if (!input.features.includes('low-e' as any) && input.glassType !== 'low-e') {
    items.push({
      title: 'Low-E Glass & Argon Gas Upgrade',
      body: 'Low-Emissivity (Low-E) glass coating with argon gas fill adds ~$45–$75 per window but blocks up to 90% of UV rays and reduces HVAC heating/cooling bills by 12–18% annually.',
      tip: 'Low-E upgrades usually pay for themselves in energy savings within 3 to 5 years.',
      type: 'upgrade',
    });
  }

  // 4. ROI & Home Equity Impact
  const roiPct = input.replacementType === 'full-frame' ? 68 : 72;
  const equityRecaptured = Math.round(result.grandTotal * (roiPct / 100));
  items.push({
    title: `Resale Value & ROI (~${roiPct}% Return)`,
    body: `According to national remodeling cost vs. value data, window replacement returns an average of ${roiPct}% at home resale. This project is estimated to add ~$${equityRecaptured.toLocaleString()} directly to your home's equity.`,
    tip: 'ENERGY STAR certified window installations are a top feature requested by prospective homebuyers.',
    type: 'roi',
  });

  // 5. Energy Savings & Utility Rebates
  const estAnnualSavings = Math.round(result.grandTotal * 0.12);
  items.push({
    title: 'Energy Bill Savings & Inflation Shield',
    body: `Replacing single-pane or outdated double-pane windows with Energy Star certified units typically cuts annual home heating and cooling utility costs by $120–$450/year (approx. $${estAnnualSavings}/yr for this project).`,
    tip: 'Check local utility provider rebates for $50–$200 per window cash-back incentives on ENERGY STAR Most Efficient models.',
    type: 'energy',
  });

  // 6. DIY vs Professional Installation Guidance
  if (input.installation === 'diy') {
    items.push({
      title: `DIY Labor Savings ($${result.estimatedSavingsDiy.toLocaleString()})`,
      body: `Installing ${input.quantity} window(s) yourself saves ~$${result.estimatedSavingsDiy.toLocaleString()} in labor. Ensure exact opening measurement, level threshold, expanding foam seal, and exterior drip cap flashing.`,
      tip: 'Improper perimeter sealing is the #1 cause of DIY window draft and water damage complaints.',
      type: 'installation',
    });
  } else {
    items.push({
      title: 'Professional Installation & Warranty Protection',
      body: `Professional installation ensures airtight insulation, code compliance, and protects the manufacturer lifetime frame/glass warranty. Estimated installation duration: ${result.estimatedProjectDurationDays} day(s).`,
      tip: 'Verify installer is licensed, bonded, insured, and certified by AAMA/FGIA.',
      type: 'installation',
    });
  }

  // 7. Buying & Ordering Tips
  items.push({
    title: 'Ordering & Quotation Strategy',
    body: 'Get at least 3 written contractor quotes detailing window brand, frame material, glass U-factor, SHGC rating, installation labor, disposal fees, and warranty terms.',
    tip: 'Order replacement windows during late autumn or winter off-peak seasons for up to 10–15% contractor discounts.',
    type: 'buying',
  });

  // Recommended style/material synthesis
  const recommendedStyle: WindowCostStyle = input.windowStyle;
  const recommendedMaterial = input.frameMaterial === 'wood' ? 'Vinyl / Composite' : input.frameMaterial;
  const budgetNote = `$${result.totalCostPerUnit.toLocaleString()} / window ($${result.costPerSqFt}/sq ft)`;
  const roiNote = `~${roiPct}% ROI ($${equityRecaptured.toLocaleString()} equity added)`;

  return {
    recommendedStyle,
    recommendedMaterial,
    budgetNote,
    roiNote,
    energySavingsEstAnnual: estAnnualSavings,
    items,
  };
}
