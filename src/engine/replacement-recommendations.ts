/**
 * WindowMetrics — Replacement Window Recommendation Builder
 *
 * Decoupled recommendation module for replacement windows.
 * Converts raw mathematical calculation results into human-friendly trust text,
 * star ratings, cost impact guidance, DIY difficulty ratings, and structured
 * UI recommendation cards explaining WHY decisions are made and WHAT to do next.
 */

import type {
  ReplacementCalculationResult,
  ReplacementRecommendationSet,
  ReplacementRecommendationCard,
} from '@/types/calculator.js';

import { formatStandardSize } from './standards.js';

/**
 * Build complete UI recommendations from raw calculation results.
 *
 * @param result Raw calculation result from calculateReplacementWindow()
 * @returns Complete UI recommendation set including trust text and card list
 */
export function buildReplacementRecommendations(
  result: ReplacementCalculationResult,
): ReplacementRecommendationSet {
  const {
    standardMatch,
    confidence,
    requiresCustomOrder,
    matchPercentage,
    costImpact,
    diyDifficulty,
    installationType,
    measurementType,
    roughOpeningWidthMm,
    roughOpeningHeightMm,
    shimSpaceMm,
    displayUnit,
    frameWidthMm,
    frameHeightMm,
    region,
  } = result;

  const { nearest, diffWidthIn, diffHeightIn, distanceIn } = standardMatch;
  const stdSizeFormatted = formatStandardSize(nearest, displayUnit, region);

  // 1. "Why this size?" Contextual Trust Explanation (Priority 4 & 11)
  const absW = Math.abs(diffWidthIn);
  const absH = Math.abs(diffHeightIn);
  
  const wDiffPhrase = diffWidthIn > 0 ? `${absW.toFixed(1)}" wider` : diffWidthIn < 0 ? `${absW.toFixed(1)}" narrower` : 'identical in width';
  const hDiffPhrase = diffHeightIn > 0 ? `${absH.toFixed(1)}" taller` : diffHeightIn < 0 ? `${absH.toFixed(1)}" shorter` : 'identical in height';

  let diffSummary = '';
  if (diffWidthIn === 0 && diffHeightIn === 0) {
    diffSummary = 'an exact dimensional match to your measurements';
  } else if (diffWidthIn === 0) {
    diffSummary = `identical in width and ${hDiffPhrase} than your measurements`;
  } else if (diffHeightIn === 0) {
    diffSummary = `${wDiffPhrase} and identical in height to your measurements`;
  } else {
    diffSummary = `${wDiffPhrase} and ${hDiffPhrase} than your measurements`;
  }

  let whyThisSize = `This is the closest standard factory size (${stdSizeFormatted}) available in the ${region} database. It is ${diffSummary}. `;
  if (confidence === 'excellent') {
    whyThisSize += 'Because it matches your opening within 0.5", a standard off-the-shelf window unit is strongly recommended.';
  } else if (confidence === 'good') {
    whyThisSize += 'Because it is within 2.0" of your opening, a standard factory unit can be easily installed using standard shims and insulation foam.';
  } else if (confidence === 'possible') {
    whyThisSize += 'Because it is within 4.0" of your opening, a standard factory unit can be installed with minor frame pocket or trim adaptation.';
  } else {
    whyThisSize += 'Because the size difference exceeds standard installation tolerances (4.0"), a custom-manufactured window unit is recommended.';
  }

  // 2. Star Rating & Confidence Text (Strictly mapped from confidence tier)
  let starRating = '★★★★★';
  let starText   = 'Excellent Match';
  let statusEmoji = '🟢';

  switch (confidence) {
    case 'excellent':
      starRating  = '★★★★★';
      starText    = 'Excellent Match';
      statusEmoji = '🟢';
      break;
    case 'good':
      starRating  = '★★★★☆';
      starText    = 'Good Match';
      statusEmoji = '🟡';
      break;
    case 'possible':
      starRating  = '★★★☆☆';
      starText    = 'Possible Match';
      statusEmoji = '🟠';
      break;
    case 'custom-required':
    default:
      starRating  = '★★☆☆☆';
      starText    = 'Custom Required';
      statusEmoji = '🔴';
      break;
  }

  // 3. Frame Recommendation Advice
  let frameRecommendation = '';
  if (installationType === 'insert') {
    frameRecommendation = 'Insert replacement is recommended: fits inside your existing sound wood frame without disturbing exterior trim.';
  } else if (installationType === 'full-frame') {
    frameRecommendation = 'Full-frame replacement is recommended: removes existing frame down to wall studs to fix water damage or out-of-square racking.';
  } else {
    frameRecommendation = 'New construction window with mounting flange is required for new wall openings, framing, or complete siding replacement.';
  }

  // 4. Cost Impact Guidance
  let costImpactTitle = `${statusEmoji} Standard Factory Pricing`;
  let costImpactNote  = 'Lowest expected cost. Standard sizes are stocked locally without custom factory manufacturing fees.';

  if (costImpact === 'custom-higher') {
    costImpactTitle = '🔴 Custom Factory Order Surcharge';
    costImpactNote  = 'Custom-manufactured units typically cost 25%–50% more than stock standard units and require 3–6 weeks lead time.';
  } else if (costImpact === 'minor-customization') {
    costImpactTitle = '🟡 Minor Installation Adaptation';
    costImpactNote  = 'Standard window unit price with minor shim, trim molding, or pocket filler adaptation required during installation.';
  }

  // 5. DIY Difficulty Guidance
  let diyTitle = 'DIY Friendly';
  let diyNote  = 'Can be installed in 2–4 hours with standard household tools and safety gear.';

  if (diyDifficulty === 'professional-recommended') {
    diyTitle = 'Professional Installation Recommended';
    diyNote  = 'Large opening or structural full-frame install. Professional crew ensures proper flashing and warranty coverage.';
  } else if (diyDifficulty === 'moderate') {
    diyTitle = 'Moderate DIY Project';
    diyNote  = 'Requires interior/exterior trim removal, window shimming, caulking, and perimeter insulation.';
  }

  // 6. Actionable UI Recommendation Cards
  const cards: ReplacementRecommendationCard[] = [];

  if (confidence === 'excellent') {
    cards.push({
      title: '🟢 Standard Stock Unit Recommended',
      description: `Your window matches standard ${region} factory dimensions (${stdSizeFormatted}). Standard off-the-shelf units are widely available.`,
      status: 'pass',
      icon: 'CheckCircle2',
      nextAction: 'View standard size details',
      href: '#result-standard-size',
    });
  } else if (confidence === 'good') {
    cards.push({
      title: '🟡 Standard Unit Fit with Minor Shimming',
      description: `Nearest standard size (${stdSizeFormatted}) is within ${distanceIn.toFixed(1)}" of your opening. Gaps are easily bridged with wood shims and foam.`,
      status: 'info',
      icon: 'AlertCircle',
      nextAction: 'View rough opening specs',
      href: '#install-specs',
    });
  } else if (confidence === 'possible') {
    cards.push({
      title: '🟠 Standard Fit Workable with Frame Adaptation',
      description: `Nearest standard unit (${stdSizeFormatted}) requires ${distanceIn.toFixed(1)}" frame pocket adjustment or trim extension during installation.`,
      status: 'info',
      icon: 'AlertCircle',
      nextAction: 'View rough opening specs',
      href: '#install-specs',
    });
  } else {
    cards.push({
      title: '🔴 Custom Factory Manufactured Unit Required',
      description: `Your measurements (${(frameWidthMm / 25.4).toFixed(1)}" × ${(frameHeightMm / 25.4).toFixed(1)}") are > 4" away from standard factory sizes. Order a custom-sized replacement unit.`,
      status: 'warning',
      icon: 'AlertTriangle',
      nextAction: 'Calculate custom glass area',
      href: '/tools/window-glass-calculator',
    });
  }

  // Card 2: Rough Opening & Installation Specs
  cards.push({
    title: `Rough Opening: ${Math.round(roughOpeningWidthMm / 25.4)}" × ${Math.round(roughOpeningHeightMm / 25.4)}"`,
    description: `Prepare a rough wall opening of ${roughOpeningWidthMm} mm × ${roughOpeningHeightMm} mm (${(roughOpeningWidthMm / 25.4).toFixed(1)}" × ${(roughOpeningHeightMm / 25.4).toFixed(1)}"). Includes ${shimSpaceMm} mm (${(shimSpaceMm / 25.4).toFixed(2)}") shim allowance on all sides.`,
    status: 'info',
    icon: 'Ruler',
    nextAction: 'Print installation summary',
    href: '#share-export',
  });

  // Card 3: Dynamic Next Action based on Size & Style
  const areaSqFt = (frameWidthMm * frameHeightMm) / 92_903; // mm² to sq ft
  if (areaSqFt > 15) {
    cards.push({
      title: 'Large Window: Plan for Window Coverings',
      description: `Large window opening (${areaSqFt.toFixed(1)} sq ft). Calculate curtain width and drop length for proper privacy and thermal efficiency.`,
      status: 'info',
      icon: 'Blinds',
      nextAction: 'Calculate Curtain Size →',
      href: '/tools/curtain-size-calculator',
    });
  } else {
    cards.push({
      title: 'Check AC Cooling Compatibility',
      description: 'Verify if your replacement window opening fits standard window air conditioner units.',
      status: 'info',
      icon: 'AirVent',
      nextAction: 'Check Window AC Sizing →',
      href: '/tools/window-ac-calculator',
    });
  }

  // 7. Step-by-Step Installation Notes
  const installationNotes: string[] = [
    `Measure diagonal width and height to confirm existing opening is square (within 1/8" / 3mm tolerance).`,
    `Recommended Rough Opening: ${roughOpeningWidthMm} mm × ${roughOpeningHeightMm} mm (${(roughOpeningWidthMm / 25.4).toFixed(1)}" W × ${(roughOpeningHeightMm / 25.4).toFixed(1)}" H).`,
    `Maintain ${shimSpaceMm} mm (${(shimSpaceMm / 25.4).toFixed(2)}") shim space at sill, jambs, and head.`,
    `Use low-expansion polyurethane window foam around perimeter to prevent frame bowing.`,
    `Apply self-adhering flashing tape at sill pan before placing window unit.`,
  ];

  return {
    whyThisSize,
    starRating,
    statusEmoji,
    starText,
    frameRecommendation,
    costImpactTitle,
    costImpactNote,
    diyTitle,
    diyNote,
    cards,
    installationNotes,
  };
}
