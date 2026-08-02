/**
 * WindowMetrics — Window Opening Recommendations Engine
 *
 * Generates framing notes, shim placement guidance, squareness tolerance checks,
 * sill pan flashing advice, and contractor recommendations for window rough openings.
 */

import type {
  WindowOpeningInput,
  WindowOpeningResult,
} from './window-opening.js';

export interface WindowOpeningRecommendationItem {
  title: string;
  body: string;
  tip?: string;
  type:
    | 'installation'
    | 'shim'
    | 'tolerance'
    | 'frame'
    | 'construction'
    | 'mistakes'
    | 'professional';
}

export interface WindowOpeningRecommendationSet {
  recommendedRoughOpeningNote: string;
  shimGuidanceNote: string;
  items: WindowOpeningRecommendationItem[];
}

export function buildWindowOpeningRecommendations(
  input: WindowOpeningInput,
  result: WindowOpeningResult
): WindowOpeningRecommendationSet {
  const items: WindowOpeningRecommendationItem[] = [];

  const roWidthIn = (result.roughOpeningWidthMm / 25.4).toFixed(2);
  const roHeightIn = (result.roughOpeningHeightMm / 25.4).toFixed(2);
  const sideClearanceIn = (result.sideClearanceMm / 25.4).toFixed(3);

  // 1. Installation Tips
  items.push({
    title: `Rough Opening Size: ${roWidthIn}" W × ${roHeightIn}" H`,
    body: `For a ${input.windowWidthMm / 25.4}" × ${input.windowHeightMm / 25.4}" window unit (${input.installationType.replace('-', ' ')}), frame the rough opening to exactly ${roWidthIn}" wide by ${roHeightIn}" high.`,
    tip: 'Leave a 1/4" (6.4mm) shim perimeter gap on sides and top for thermal expansion and low-expansion foam insulation.',
    type: 'installation',
  });

  // 2. Shim Guidance
  items.push({
    title: `Shim Placement: ${sideClearanceIn}" Perimeter Gap`,
    body: `Place composite or cedar shims directly beneath the window side jambs 4" from top and bottom corners, and near lock mechanisms. Ensure shims create a level sill support.`,
    tip: 'Never place shims under the center of the sill unless instructed by the manufacturer, as this can bow the sill upward.',
    type: 'shim',
  });

  // 3. Tolerance Explanation
  items.push({
    title: 'Plumb, Level & Square Diagonal Tolerance',
    body: `Measure diagonal corner-to-corner distance (${result.diagonalLengthMm}mm). The difference between both diagonals must not exceed 1/8" (3.2mm).`,
    tip: 'If diagonals differ by >1/8", cross-adjust the framing before inserting the window unit.',
    type: 'tolerance',
  });

  // 4. Frame & Flashing Recommendation
  if (input.installationType === 'new-construction') {
    items.push({
      title: 'Self-Adhered Flexible Flashing & Sloped Sill Pan',
      body: 'Apply a sloped sill pan or self-adhered flashing tape (e.g., DuPont Tyvek Flashing) over the sill trimmer stud before inserting the nailed-flange window unit.',
      tip: 'Overlap weather barrier paper over the top nail flange to ensure proper shingle-lap water shedding.',
      type: 'frame',
    });
  } else {
    items.push({
      title: 'Pocket Replacement Caulk & Sealant Protocol',
      body: 'Apply a continuous 3/8" bead of high-grade elastomeric silicone caulk along the interior blind stop before setting the replacement window in place.',
      type: 'frame',
    });
  }

  // 5. Framing Construction Notes
  items.push({
    title: `Header & Jack Stud Framing (${input.framingMaterial.toUpperCase()})`,
    body: `Header beam width should be ${result.framingHeaderWidthMm}mm (${(result.framingHeaderWidthMm / 25.4).toFixed(1)}"). Double 2×10 or 2×12 headers are standard for exterior load-bearing walls.`,
    tip: 'Ensure jack studs (trimmer studs) support the header directly down to the bottom wall plate.',
    type: 'construction',
  });

  // 6. Common Installation Mistakes
  items.push({
    title: 'Common Mistake: Over-tightening & High-Expansion Foam',
    body: 'Avoid using high-expansion spray foam, which can bow vinyl sashes and jam operating sashes. Use low-expansion window & door foam only.',
    tip: 'Test window sash operation (open, lock, slide) BEFORE fully driving final installation screws.',
    type: 'mistakes',
  });

  // 7. Professional Advice
  if (result.installationDifficulty === 'professional') {
    items.push({
      title: 'Professional Contractor Installation Advised',
      body: `Bay/Bow or heavy custom structural window openings require cantilever support brackets and professional structural engineering review.`,
      type: 'professional',
    });
  }

  const recommendedRoughOpeningNote = `${roWidthIn}" W × ${roHeightIn}" H (${result.roughOpeningWidthMm} × ${result.roughOpeningHeightMm} mm)`;
  const shimGuidanceNote = `${sideClearanceIn}" (${result.sideClearanceMm} mm) per side clearance gap`;

  return {
    recommendedRoughOpeningNote,
    shimGuidanceNote,
    items,
  };
}
