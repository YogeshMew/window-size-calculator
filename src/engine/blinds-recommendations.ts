import type { BlindType, BlindsInput, BlindsResult } from './blinds.js';

export interface BlindsRecommendationItem {
  title: string;
  body: string;
  tip?: string;
  type: 'mount' | 'blind-type' | 'color' | 'control' | 'ordering' | 'installation';
}

export interface BlindsRecommendationSet {
  /** Which blind type is recommended for these dimensions */
  recommendedBlindType: BlindType;
  /** Which mount is recommended */
  mountRecommendation: 'inside' | 'outside';
  /** Cordless recommended for safety (child-safe) */
  cordlessRecommended: boolean;
  /** Motorized recommended for accessibility or very large window */
  motorizedRecommended: boolean;
  /** Short control side note */
  controlSideNote: string;
  /** Neutral color suggestion based on blind type */
  colorSuggestion: string;
  /** Short ordering action note */
  orderingNote: string;
  /** Full recommendation card items */
  items: BlindsRecommendationItem[];
}

export function suggestBlindType(windowWidthMm: number, windowHeightMm: number): BlindType {
  const aspectRatio = windowWidthMm / windowHeightMm;
  if (aspectRatio > 2.5 || windowWidthMm > 2286) return 'vertical';
  if (windowWidthMm < 508) return 'mini-blind';
  if (windowHeightMm > 1829) return 'roller';
  if (windowHeightMm < 762) return 'venetian';
  return 'roller';
}

export function buildBlindsRecommendations(input: BlindsInput, result: BlindsResult): BlindsRecommendationSet {
  const cordlessRecommended = input.windowHeightMm > 1829 || input.windowHeightMm < 914;
  const motorizedRecommended = input.windowWidthMm > 1524 || input.windowHeightMm > 2134;
  const recBlind = suggestBlindType(input.windowWidthMm, input.windowHeightMm);

  let colorSuggestion = 'Match your trim color for a seamless look';
  if (input.blindType === 'cellular') colorSuggestion = 'White or off-white for maximum light diffusion';
  else if (input.blindType === 'wood' || input.blindType === 'faux-wood') colorSuggestion = 'Natural wood tones or warm whites';
  else if (input.blindType === 'roller' || input.blindType === 'zebra') colorSuggestion = 'Light filtering in neutral tones';

  let orderingNote = 'Custom size required';
  let orderingTip = 'Specialty dimensions require custom order';
  if (result.orderingRecommendation === 'exact') {
    orderingNote = 'Order Exact Size';
    orderingTip = 'Standard factory size fits frame directly';
  } else if (result.orderingRecommendation === 'next-stock') {
    orderingNote = 'Order Next Stock Size';
    orderingTip = 'Fits with standard mounting brackets';
  } else if (result.orderingRecommendation === 'trim') {
    orderingNote = 'Trim Stock Blind to Fit';
    orderingTip = 'Stock size can be trimmed to exact width';
  }

  const mountText = result.suitableMount === 'either'
    ? (input.mountType === 'inside' ? 'Inside Mount' : 'Outside Mount')
    : (result.suitableMount === 'inside' ? 'Inside Mount' : 'Outside Mount');

  const mountTip = result.isMountSuitable
    ? (result.clearanceMm > 12.7 ? 'Best flush fit for this window' : 'Fits inside frame with minimal clearance')
    : 'Frame depth too shallow — outside mount recommended';

  const formatBlindName = (bt: string) => bt.split('-').map(s => s.charAt(0).toUpperCase() + s.slice(1)).join(' ');

  const blindTipMap: Record<string, string> = {
    'vertical': 'Ideal for wide windows and sliding glass doors',
    'mini-blind': 'Compact slim profile perfect for narrow windows',
    'roller': 'Clean modern aesthetic with smooth operation',
    'venetian': 'Versatile tilt control for precise room light',
    'cellular': 'Superior honeycomb insulation for energy efficiency',
    'roman': 'Elegant fabric folds for living rooms & bedrooms',
    'wood': 'Warm premium natural texture for dry living spaces',
    'faux-wood': 'Moisture-resistant durability for kitchens & baths',
    'zebra': 'Dual-layer alternating light filtering'
  };

  const difficultyMap: Record<string, string> = {
    easy: 'Easy DIY',
    moderate: 'Moderate DIY',
    professional: 'Professional Recommended'
  };

  const items: BlindsRecommendationItem[] = [
    {
      title: 'MOUNT',
      body: mountText,
      tip: mountTip,
      type: 'mount'
    },
    {
      title: 'BLIND TYPE',
      body: formatBlindName(input.blindType),
      tip: blindTipMap[input.blindType] ?? 'Smart fit for your window style',
      type: 'blind-type'
    },
    {
      title: 'INSTALLATION',
      body: difficultyMap[result.installationDifficulty] ?? 'Easy DIY',
      tip: result.installationDifficulty === 'easy' ? 'Standard bracket mounting' : 'Requires precise headrail alignment',
      type: 'installation'
    },
    {
      title: 'ORDERING',
      body: orderingNote,
      tip: orderingTip,
      type: 'ordering'
    }
  ];

  if (cordlessRecommended) {
    items.push({
      title: 'SAFETY',
      body: 'Cordless Lift Recommended',
      tip: 'Child & pet safe for tall accessible windows',
      type: 'control'
    });
  }

  if (motorizedRecommended) {
    items.push({
      title: 'AUTOMATION',
      body: 'Motorization Recommended',
      tip: 'Convenient push-button control for wide or high windows',
      type: 'control'
    });
  }

  return {
    recommendedBlindType: recBlind,
    mountRecommendation: result.suitableMount === 'either' ? input.mountType : result.suitableMount,
    cordlessRecommended,
    motorizedRecommended,
    controlSideNote: `Control side on ${input.controlSide} side`,
    colorSuggestion,
    orderingNote,
    items
  };
}

