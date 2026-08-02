/**
 * WindowMetrics — Window Area Recommendations Engine
 *
 * Generates trade-specific material estimates, ordering advice, roll sizing,
 * cleaning time estimates, and waste factor guidance based on window area calculations.
 */

import type {
  WindowAreaInput,
  WindowAreaResult,
} from './window-area.js';

export interface WindowAreaRecommendationItem {
  title: string;
  body: string;
  tip?: string;
  type:
    | 'film'
    | 'glass'
    | 'cleaning'
    | 'paint'
    | 'ordering'
    | 'waste'
    | 'measurement';
}

export interface WindowAreaRecommendationSet {
  suggestedFilmRollWidth: string;
  paintGallonsEst: number;
  cleaningTimeMinutesEst: number;
  areaSummaryNote: string;
  items: WindowAreaRecommendationItem[];
}

export function buildWindowAreaRecommendations(
  input: WindowAreaInput,
  result: WindowAreaResult
): WindowAreaRecommendationSet {
  const items: WindowAreaRecommendationItem[] = [];

  // 1. Film Sizing & Roll Selection
  const wInches = input.windowWidthMm / 25.4;
  let suggestedFilmRollWidth = '36 inches';
  if (wInches > 60) suggestedFilmRollWidth = '72 inches';
  else if (wInches > 48) suggestedFilmRollWidth = '60 inches';
  else if (wInches > 36) suggestedFilmRollWidth = '48 inches';
  else if (wInches > 24) suggestedFilmRollWidth = '36 inches';
  else suggestedFilmRollWidth = '24 inches';

  items.push({
    title: `Window Film Roll Size: ${suggestedFilmRollWidth}`,
    body: `To cover ${input.quantity} window(s) totaling ${result.filmAreaSqFt} sq ft of film (including 1" trim margin), select a ${suggestedFilmRollWidth} wide stock film roll.`,
    tip: 'Always allow 1" of extra film overlap on all 4 sides for clean razor trimming against the window gasket.',
    type: 'film',
  });

  // 2. Glass Ordering & Weight Guidance
  const estGlassWeightLbs = Math.round(result.netGlassAreaSqFt * 3.2); // 3mm glass ~3.2 lbs/sq ft
  items.push({
    title: 'Replacement Glass Area & Weight',
    body: `Net daylight glass area is ${result.netGlassAreaSqFt} sq ft. Total glass pane weight is estimated at ~${estGlassWeightLbs} lbs (${Math.round(estGlassWeightLbs * 0.453592)} kg) for standard double-pane glass.`,
    tip: 'Provide exact daylight net opening dimensions to your glass fabricator.',
    type: 'glass',
  });

  // 3. Professional Window Cleaning Time Estimate
  // 1.5 minutes per sq ft for interior + exterior pro squeegee cleaning
  const cleaningTimeMinutesEst = Math.max(5, Math.round(result.totalAreaSqFt * 0.35));
  items.push({
    title: `Professional Cleaning Estimate (~${cleaningTimeMinutesEst} mins)`,
    body: `Cleaning ${input.quantity} window(s) (${result.totalAreaSqFt} sq ft total glass surface) takes approximately ${cleaningTimeMinutesEst} minutes for both interior and exterior sides.`,
    tip: 'Commercial window washers typically charge $5 to $10 per window pane or $0.35/sq ft.',
    type: 'cleaning',
  });

  // 4. Frame & Trim Paint Quantity
  // 1 gallon covers 350 sq ft of trim
  const paintGallonsEst = Math.max(0.1, Math.round((result.framePaintAreaSqFt / 350) * 100) / 100);
  items.push({
    title: `Trim Paint Quantity (~${paintGallonsEst > 0.5 ? '1 Gallon' : '1 Quart'})`,
    body: `Painting the perimeter trim casing (${result.framePaintAreaSqFt} sq ft of molding surface) requires approximately ${paintGallonsEst} gallon(s) of semi-gloss acrylic enamel paint.`,
    tip: 'Apply 2 coats of exterior-grade semi-gloss paint to protect wood trim from moisture rot.',
    type: 'paint',
  });

  // 5. Waste Factor Guidance
  if (['circle', 'arch', 'triangle', 'trapezoid', 'ellipse'].includes(input.shape)) {
    items.push({
      title: 'Specialty Shape 15% Waste Margin Advised',
      body: `Curved or angled shapes (${input.shape.toUpperCase()}) produce higher off-cut scrap. A 15% to 20% waste margin is factored into your calculation (${result.totalAreaWithWasteSqFt} sq ft with waste).`,
      tip: 'Order extra roll length when cutting curved film or solar screen mesh.',
      type: 'waste',
    });
  } else {
    items.push({
      title: 'Standard 10% Material Waste Factor',
      body: `A standard 10% material waste factor adds ${result.wasteAreaSqFt} sq ft to your total, bringing ordering area to ${result.totalAreaWithWasteSqFt} sq ft.`,
      type: 'waste',
    });
  }

  // 6. Ordering & Measurement Tips
  items.push({
    title: 'Precision Measurement Protocol',
    body: 'Measure window width at top, middle, and bottom, and height at left, center, and right. Use the smallest measurement for inside-mount blinds and net replacement glass.',
    tip: 'Record all measurements in millimeters or 1/16th inches for exact fabricator accuracy.',
    type: 'measurement',
  });

  const areaSummaryNote = `${result.totalAreaSqFt} sq ft (${result.totalAreaM2} m²) total area`;

  return {
    suggestedFilmRollWidth,
    paintGallonsEst,
    cleaningTimeMinutesEst,
    areaSummaryNote,
    items,
  };
}
