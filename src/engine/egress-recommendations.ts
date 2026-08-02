import type { EgressWindowStyle, EgressInput, EgressResult } from './egress.js';

export interface EgressRecommendationItem {
  title: string;
  body: string;
  tip?: string;
  type: 'compliance' | 'opening' | 'style' | 'installation' | 'safety' | 'checklist';
}

export interface EgressRecommendationSet {
  complianceStatus: 'pass' | 'fail' | 'warning';
  complianceExplanation: string;
  whyPassFail: string;
  suggestedImprovements: string;
  recommendedReplacementSize: string;
  recommendedWindowStyle: EgressWindowStyle;
  installationNotes: string;
  safetyNotes: string;
  inspectionChecklist: string[];
  nextActions: string;
  items: EgressRecommendationItem[];
}

export function buildEgressRecommendations(input: EgressInput, result: EgressResult): EgressRecommendationSet {
  const isPass = result.pass;
  const areaSqFt = result.openingAreaSqFt.toFixed(2);
  const minArea = result.minRequiredAreaSqFt.toFixed(1);
  const widthIn = (result.netClearWidthMm / 25.4).toFixed(1);
  const heightIn = (result.netClearHeightMm / 25.4).toFixed(1);

  const complianceStatus = result.complianceStatus;

  let complianceExplanation = `Meets IRC R310 emergency escape requirements with ${areaSqFt} sq ft net clear opening area.`;
  let whyPassFail = `Passes all 4 criteria: Net clear area >= ${minArea} sq ft, width >= 20", height >= 24", sill height <= 44".`;
  let suggestedImprovements = 'No size changes required. Ensure window operates without keys or tools.';

  if (!isPass) {
    if (result.areaShortfallSqFt > 0) {
      whyPassFail = `Fails IRC R310 code: Opening area of ${areaSqFt} sq ft is ${result.areaShortfallSqFt.toFixed(2)} sq ft below required ${minArea} sq ft.`;
    } else if (result.widthShortfallMm > 0) {
      whyPassFail = `Fails IRC R310 code: Net clear width of ${widthIn}" is ${(result.widthShortfallMm / 25.4).toFixed(1)}" below 20.0" minimum.`;
    } else if (result.heightShortfallMm > 0) {
      whyPassFail = `Fails IRC R310 code: Net clear height of ${heightIn}" is ${(result.heightShortfallMm / 25.4).toFixed(1)}" below 24.0" minimum.`;
    } else {
      whyPassFail = `Fails IRC R310 code: Sill height exceeds 44.0" maximum above floor level.`;
    }

    if (input.windowStyle === 'sliding' || input.windowStyle === 'double-hung') {
      suggestedImprovements = 'Switching to a side-hinged Casement window style will double openable area in this opening without expanding wall studs.';
    } else {
      suggestedImprovements = `Enlarge rough opening width to at least ${(result.recommendedWidthMm / 25.4).toFixed(0)}" and height to ${(result.recommendedHeightMm / 25.4).toFixed(0)}" for compliant casement unit.`;
    }

    complianceExplanation = `Does NOT comply with IRC Section R310 emergency escape code. Replacement or style change required.`;
  }

  const recWidthIn = Math.round(result.recommendedWidthMm / 25.4);
  const recHeightIn = Math.round(result.recommendedHeightMm / 25.4);
  const recommendedReplacementSize = `${recWidthIn}" × ${recHeightIn}" Frame (${result.recommendedWindowStyle.toUpperCase()})`;

  const installationNotes = input.location === 'basement'
    ? 'Basement egress requires a window well (36" projection, 9 sq ft floor) and metal escape ladder if well depth exceeds 44".'
    : 'Frame installation requires flashing tape, 1/4" shim clearance, and egress hinges allowing 90° full opening.';

  const safetyNotes = 'IRC R310 requires emergency escape windows to open fully from inside without keys, tools, or special knowledge.';

  const inspectionChecklist = [
    `Net clear opening area >= ${minArea} sq ft (${areaSqFt} sq ft actual)`,
    `Net clear width >= 20.0 inches (${widthIn}" actual)`,
    `Net clear height >= 24.0 inches (${heightIn}" actual)`,
    `Sill height <= 44.0 inches above finished floor`,
    'Operable without keys, tools, or removable sashes',
    input.location === 'basement' ? 'Window well clear projection >= 36 inches with ladder' : 'Unobstructed path to outdoor grade',
  ];

  const nextActions = isPass
    ? 'Print code compliance report for local building inspector.'
    : 'Consult contractor to quote casement conversion or concrete wall cutting.';

  const items: EgressRecommendationItem[] = [
    {
      title: 'COMPLIANCE',
      body: isPass ? 'PASSES IRC SECTION R310' : 'FAILS IRC SECTION R310',
      tip: whyPassFail,
      type: 'compliance',
    },
    {
      title: 'OPENING AREA',
      body: `${areaSqFt} sq ft Net Clear`,
      tip: `Required: ${minArea} sq ft · Width: ${widthIn}" · Height: ${heightIn}"`,
      type: 'opening',
    },
    {
      title: 'WINDOW STYLE',
      body: input.windowStyle.toUpperCase(),
      tip: input.windowStyle === 'casement' ? 'Optimal 90% opening efficiency for egress' : '42-45% opening efficiency (Casement is 2x more efficient)',
      type: 'style',
    },
    {
      title: 'INSTALLATION',
      body: isPass ? 'Standard Fit' : 'Wall Alteration / Style Swap Needed',
      tip: suggestedImprovements,
      type: 'installation',
    },
    {
      title: 'SAFETY',
      body: 'Tool-Free Emergency Escape',
      tip: safetyNotes,
      type: 'safety',
    },
  ];

  return {
    complianceStatus,
    complianceExplanation,
    whyPassFail,
    suggestedImprovements,
    recommendedReplacementSize,
    recommendedWindowStyle: result.recommendedWindowStyle,
    installationNotes,
    safetyNotes,
    inspectionChecklist,
    nextActions,
    items,
  };
}
