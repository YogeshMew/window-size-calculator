/**
 * WindowMetrics — Window Installation Recommendations Engine
 *
 * Generates ASTM E2112 installation sequencing, waterproofing lap order,
 * shim placement rules, sealant joint design, and common installation mistake preventions.
 */

import type {
  WindowInstallationInput,
  WindowInstallationResult,
} from './window-installation.js';

export interface WindowInstallationRecommendationItem {
  title: string;
  body: string;
  tip?: string;
  type:
    | 'sequence'
    | 'safety'
    | 'material'
    | 'waterproofing'
    | 'professional'
    | 'mistake';
}

export interface WindowInstallationRecommendationSet {
  installationSummaryNote: string;
  fastenerSpacingNote: string;
  items: WindowInstallationRecommendationItem[];
}

export function buildWindowInstallationRecommendations(
  input: WindowInstallationInput,
  result: WindowInstallationResult
): WindowInstallationRecommendationSet {
  const items: WindowInstallationRecommendationItem[] = [];

  const typeName = input.installationType === 'new-construction'
    ? 'New Construction (Nailing Flange)'
    : (input.installationType === 'insert' ? 'Pocket Insert Replacement' : 'Full-Frame Replacement');

  // 1. Installation Sequence (ASTM E2112 / AAMA Standard)
  items.push({
    title: `ASTM E2112 Standard Installation Sequence (${typeName})`,
    body: 'Step 1: Inspect rough opening & verify squareness (max 1/8" diagonal variance). Step 2: Install sloped sill pan & flashing tape. Step 3: Set window on sill shims. Step 4: Level, plumb & square with side shims. Step 5: Fasten jambs. Step 6: Apply low-expansion foam air seal. Step 7: Apply exterior elastomeric perimeter caulk.',
    tip: 'Always overlap flashing tape shingle-fashion (bottom-to-top) so water sheds outward over lower layers.',
    type: 'sequence',
  });

  // 2. Safety Advice
  items.push({
    title: 'Personal Safety & Heavy Glass Handling',
    body: 'Wear ANSI Z87.1 safety glasses and cut-resistant Kevlar gloves when handling glass units. Use dual-cup suction lifters when positioning large windows over 50 lbs.',
    tip: 'Never leave an un-fastened window unattended in a rough opening.',
    type: 'safety',
  });

  // 3. Low-Expansion Foam vs Standard Spray Foam
  if (input.useFoam !== false) {
    items.push({
      title: 'CRITICAL: Use Low-Expansion Window & Door Foam Only',
      body: 'Never use high-expansion minimal-expansion gap filler foam. Standard high-expansion foam generates excessive pressure that bows vinyl and wood jambs inward, binding window sashes.',
      tip: 'Fill perimeter gaps only 50% full with foam; low-expansion foam expands to fill the remaining cavity without pushing against jambs.',
      type: 'material',
    });
  }

  // 4. Waterproofing & Sill Pan Flashing
  items.push({
    title: 'Sloped Sill Pan & Backer Rod Air Seal',
    body: 'Install a pre-formed rigid sill pan or extend self-adhered flexible flashing tape 6" up side jambs. Leave the exterior bottom sill caulk joint un-sealed or install weep spacers to allow trapped moisture to drain.',
    tip: 'Do not seal the bottom exterior nailing flange or casing flush against the wall; water must escape out the sill.',
    type: 'waterproofing',
  });

  // 5. Professional Installer Tips (Shim Placement)
  items.push({
    title: 'Shim Placement at Fastener Anchor Points',
    body: `Place composite pairs of shims directly behind every fastener location (spaced every ${result.fastenerSpacingIn}" along jambs) to prevent over-tightening screws from bowing the window frame.`,
    tip: 'Always place shims 1" back from interior drywall to allow room for low-expansion foam air sealing.',
    type: 'professional',
  });

  // 6. Common Mistakes to Avoid
  items.push({
    title: 'Top 3 Window Installation Mistakes to Avoid',
    body: '1) Fastening through the bottom sill flange (creates water leaks). 2) Over-driven screws distorting the frame. 3) Skipping backer rod behind exterior caulk joints (causes 3-sided caulk adhesion failure).',
    type: 'mistake',
  });

  const installationSummaryNote = `Type: ${typeName} • Wall: ${input.wallType.toUpperCase()}`;
  const fastenerSpacingNote = `Anchors: ${result.fastenerCountTotal} Screws (Spaced every ${result.fastenerSpacingIn}")`;

  return {
    installationSummaryNote,
    fastenerSpacingNote,
    items,
  };
}
