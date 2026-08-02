/**
 * WindowMetrics — Window Trim Recommendations Engine
 *
 * Generates finish carpentry notes, trim style matching, material selection,
 * 18-gauge brad nail fastener guidance, and installation sequencing.
 */

import type {
  WindowTrimInput,
  WindowTrimResult,
} from './window-trim.js';

export interface WindowTrimRecommendationItem {
  title: string;
  body: string;
  tip?: string;
  type:
    | 'style'
    | 'material'
    | 'paint'
    | 'sequence'
    | 'waste'
    | 'fastener';
}

export interface WindowTrimRecommendationSet {
  trimStyleNote: string;
  boardStockNote: string;
  items: WindowTrimRecommendationItem[];
}

export function buildWindowTrimRecommendations(
  input: WindowTrimInput,
  result: WindowTrimResult
): WindowTrimRecommendationSet {
  const items: WindowTrimRecommendationItem[] = [];

  const casingWIn = (input.trimWidthMm / 25.4).toFixed(2);
  const revealIn = (input.revealMm / 25.4).toFixed(2);

  // 1. Trim Style Guidance
  if (input.trimStyle === 'craftsman') {
    items.push({
      title: 'Craftsman / Farmhouse Style Joinery',
      body: 'Craftsman casing features 90° butt joints with a prominent 5/4" head casing, 1" side overhangs, and a fillet/cap moulding strip on top of the head casing.',
      tip: 'Use 1x4 side casing boards with a 5/4x6 head board for authentic Craftsman proportions.',
      type: 'style',
    });
  } else if (input.trimStyle === 'colonial') {
    items.push({
      title: 'Classic Colonial Mitered Profile',
      body: 'Colonial casing features traditional multi-bead moulded contours with precision 45° miter corners and a 1/4" reveal setback margin on jamb edges.',
      type: 'style',
    });
  } else if (input.trimStyle === 'modern') {
    items.push({
      title: 'Modern Minimalist Flat Stock Casing',
      body: 'Modern casing uses square-edged 1x3 or 1x4 S4S boards with crisp 45° miters or 90° butt joints and minimal reveal margins.',
      type: 'style',
    });
  } else {
    items.push({
      title: `${input.trimStyle.charAt(0).toUpperCase() + input.trimStyle.slice(1)} Casing Profile`,
      body: `Traditional ${input.trimStyle} profile with ${casingWIn}" face width casing and ${revealIn}" reveal setback.`,
      type: 'style',
    });
  }

  // 2. Material Recommendation
  items.push({
    title: 'Primed MDF vs. Finger-Jointed Pine vs. Solid Hardwood',
    body: 'Use Primed MDF or Finger-Jointed Pine for painted trim (smooth, defect-free, warp-resistant). Use solid Oak, Maple, or Walnut for stain-grade wood trim.',
    tip: 'Coat end-grain cuts with primer or wood glue before installation to prevent paint absorption.',
    type: 'material',
  });

  // 3. Fastener & Nail Gun Specification
  items.push({
    title: '18-Gauge Brad Nails & 15-Gauge Finish Nails',
    body: 'Use 1-1/2" 18-gauge brad nails to secure inner casing edges to window jambs. Use 2-1/2" 15-gauge finish nails into wall studs through drywall.',
    tip: 'Nail into studs at 16" vertical intervals, keeping nails 1/2" back from outer casing edges.',
    type: 'fastener',
  });

  // 4. Installation Sequencing
  items.push({
    title: 'Finish Carpentry Installation Order',
    body: 'Step 1: Install extension jamb box (if required). Step 2: Level & notch window stool sill. Step 3: Install head casing. Step 4: Fit side casings to stool. Step 5: Install apron under stool.',
    tip: 'Mark a continuous 1/4" reveal pencil line around all three jamb edges using a combination square before attaching trim.',
    type: 'sequence',
  });

  // 5. Paint & Caulk Preparation
  items.push({
    title: 'Painter’s Caulk & Acrylic Enamel Paint Finish',
    body: 'Fill nail holes with lightweight spackle or wood putty. Apply a thin bead of paintable acrylic latex caulk along wall and jamb seam lines, then apply 2 coats of semi-gloss acrylic enamel.',
    type: 'paint',
  });

  // 6. Waste & Stock Board Purchase
  items.push({
    title: `Purchase ${result.totalLinearLengthWithWasteFt} Linear Ft Stock (10% Waste)`,
    body: `Net trim length is ${result.totalLinearLengthFt} ft. Standard trim boards are sold in 8 ft and 12 ft lengths. Buy 8 ft or 12 ft boards to minimize cutting scrap.`,
    tip: 'Check trim boards for straightness before leaving the lumber yard.',
    type: 'waste',
  });

  const trimStyleNote = `${input.trimStyle.toUpperCase()} Style • ${casingWIn}" Casing Width`;
  const boardStockNote = `Stock Needed: ${result.totalLinearLengthWithWasteFt} linear ft (Est. Cost: $${result.estimatedMaterialCost})`;

  return {
    trimStyleNote,
    boardStockNote,
    items,
  };
}
