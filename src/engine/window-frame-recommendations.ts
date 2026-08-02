/**
 * WindowMetrics — Window Frame Recommendations Engine
 *
 * Generates carpentry joinery notes, corner fastening advice, timber stock selection,
 * glazing rabbet specifications, and weather resistance guidance for window frames.
 */

import type {
  WindowFrameInput,
  WindowFrameResult,
} from './window-frame.js';

export interface WindowFrameRecommendationItem {
  title: string;
  body: string;
  tip?: string;
  type:
    | 'material'
    | 'joint'
    | 'profile'
    | 'waste'
    | 'strength'
    | 'weather';
}

export interface WindowFrameRecommendationSet {
  cutListSummaryNote: string;
  materialStockNote: string;
  items: WindowFrameRecommendationItem[];
}

export function buildWindowFrameRecommendations(
  input: WindowFrameInput,
  result: WindowFrameResult
): WindowFrameRecommendationSet {
  const items: WindowFrameRecommendationItem[] = [];

  const profWIn = (input.profileWidthMm / 25.4).toFixed(2);
  const profTIn = (input.profileThicknessMm / 25.4).toFixed(2);

  // 1. Material Choice & Timber Stock Selection
  if (input.frameMaterial === 'wood') {
    items.push({
      title: 'Hardwood vs Softwood Timber Selection',
      body: 'Select clear vertical-grain Western Red Cedar, Accoya, or White Oak for exterior frames. Softwoods require pressure-treatment and exterior primer coating on end-grain cuts.',
      tip: 'Seal all 4 miter or butt end-grain cuts with end-grain sealer before final frame assembly to prevent water rot.',
      type: 'material',
    });
  } else if (input.frameMaterial === 'vinyl') {
    items.push({
      title: 'Fusion-Welded Vinyl Profile Specification',
      body: 'Vinyl frames require 45° miter fusion welding at 240°C (464°F) with internal steel reinforcement channels in the sash rails for rigid structural stability.',
      type: 'material',
    });
  } else if (input.frameMaterial === 'fiberglass') {
    items.push({
      title: 'Pultruded Fiberglass Composite Profile',
      body: 'Pultruded fiberglass offers 8x the tensile strength of vinyl and zero thermal expansion mismatch with glass panes, eliminating perimeter seal failures.',
      type: 'material',
    });
  } else {
    items.push({
      title: 'Thermally-Broken Extruded Aluminum Profile',
      body: 'Ensure extruded aluminum profiles incorporate a 24mm polyamide thermal break barrier strip to isolate interior and exterior aluminum surfaces.',
      type: 'material',
    });
  }

  // 2. Corner Joint & Assembly Recommendation
  if (input.assemblyType === 'miter') {
    items.push({
      title: '45° Miter Corner Joinery & Biscuit / Pocket Screw Reinforcement',
      body: `Cut 4 rails/stiles with exact 45° miters (${result.outerWidthIn}" Top/Bottom, ${result.outerHeightIn}" Left/Right). Reinforced miters with waterproof D4 polyurethane adhesive and pocket screws or wooden biscuits.`,
      tip: 'Check 90° corner squareness across opposite diagonals before adhesive sets.',
      type: 'joint',
    });
  } else {
    items.push({
      title: '90° Mortise & Tenon or Lap Butt Joinery',
      body: `Top & Bottom Rails run full width (${result.outerWidthIn}"), while Left & Right Stiles are cut shorter to ${result.innerWidthIn + (input.profileWidthMm/25.4)*0} inches to fit between rails.`,
      tip: 'Mortise & tenon or half-lap joints provide superior rack-resistance compared to simple face-screwed butt joints.',
      type: 'joint',
    });
  }

  // 3. Profile & Glass Rabbet Recommendation
  items.push({
    title: `Profile Size: ${profWIn}" Face × ${profTIn}" Depth (Rabbet 1/2")`,
    body: `Your profile dimensions produce a daylight inner opening of ${result.innerWidthIn}" × ${result.innerHeightIn}". Glass pane size should be cut to ${result.glassOpeningWidthIn}" × ${result.glassOpeningHeightIn}" to sit in the 1/2" rabbet pocket.`,
    tip: 'Leave a 1/8" expansion gap between glass edge and wood rabbet to allow for thermal expansion.',
    type: 'profile',
  });

  // 4. Waste Reduction Advice
  items.push({
    title: `Order ${result.totalMaterialLengthWithWasteFt} ft Linear Stock (10% Waste)`,
    body: `Net frame profile length is ${result.totalMaterialLengthFt} ft (${result.totalMaterialLengthM} m). Ordering ${result.totalMaterialLengthWithWasteFt} ft allows for miter saw kerf cuts and stock knot defects.`,
    tip: 'Standard linear timber profiles come in 8 ft, 10 ft, and 12 ft lengths. Map cut items onto standard board lengths to minimize off-cuts.',
    type: 'waste',
  });

  // 5. Structural Strength & Hardware
  items.push({
    title: `Frame Weight: ${result.estimatedWeightLbs} lbs (${result.estimatedWeightKg} kg)`,
    body: `The empty frame unit weighs approximately ${result.estimatedWeightLbs} lbs before installing glass. Add 3.2 lbs/sq ft for double-pane glass weight during structural header sizing.`,
    type: 'strength',
  });

  // 6. Weather Resistance
  items.push({
    title: 'Glazing Bead & Drainage Weep Hole Requirement',
    body: 'Drill 3/8" sloped weep holes at the bottom rail rabbet base (spaced 12" apart) to prevent trapped rainwater from rotting lower corner joints.',
    tip: 'Use EPDM rubber glazing tape beneath glass setting blocks for waterproof seal.',
    type: 'weather',
  });

  const cutListSummaryNote = `4 Pieces: 2 Rails (${result.outerWidthIn}"), 2 Stiles (${input.assemblyType === 'miter' ? result.outerHeightIn : (result.outerHeightMm - 2*input.profileWidthMm)/25.4}")`;
  const materialStockNote = `Stock Needed: ${result.totalMaterialLengthWithWasteFt} linear ft (${input.frameMaterial.toUpperCase()})`;

  return {
    cutListSummaryNote,
    materialStockNote,
    items,
  };
}
