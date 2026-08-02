/**
 * WindowMetrics — Tool Registry
 *
 * Single source of truth for all tools.
 * Every tool page, tool card, navigation, and sitemap references this data.
 *
 * Status guide:
 *   'live'         — page exists and calculator works
 *   'coming-soon'  — page exists with placeholder content
 *   'planned'      — not yet built, used for internal linking
 */

import type { Tool } from '@/types/content.js';

export const TOOLS: Tool[] = [
  // -------------------------------------------------------------------------
  // Measurement
  // -------------------------------------------------------------------------
  {
    slug: 'window-size-calculator',
    title: 'Window Size Calculator',
    description:
      'Calculate window area, perimeter, and get recommendations for replacement, curtains, blinds, and glass.',
    category: 'measurement',
    href: '/tools/window-size-calculator',
    icon: 'Ruler',
    status: 'live',
    useCases: ['Replacement', 'Curtains', 'Glass', 'Film', 'Energy'],
    benefits: [
      'Window area & perimeter',
      'Nearest standard size match',
      'Curtain & blind sizing',
      'Glass area & weight estimate',
      'Replacement planning',
    ],
    relatedSlugs: ['window-area-calculator', 'window-glass-calculator', 'replacement-window-calculator'],
    keywords: ['window size', 'window dimensions', 'window measurements', 'window area'],
  },
  {
    slug: 'window-area-calculator',
    title: 'Window Area Calculator',
    description: 'Calculate the exact area of any window for glass, film, and covering projects.',
    category: 'measurement',
    href: '/tools/window-area-calculator',
    icon: 'Square',
    status: 'planned',
    relatedSlugs: ['window-size-calculator', 'window-film-calculator'],
  },
  {
    slug: 'window-opening-calculator',
    title: 'Window Opening Calculator',
    description: 'Calculate rough opening, frame size, and shim space for new window installations.',
    category: 'measurement',
    href: '/tools/window-opening-calculator',
    icon: 'Expand',
    status: 'planned',
    relatedSlugs: ['window-size-calculator', 'replacement-window-calculator'],
  },

  // -------------------------------------------------------------------------
  // Replacement
  // -------------------------------------------------------------------------
  {
    slug: 'replacement-window-calculator',
    title: 'Replacement Window Calculator',
    description:
      'Find the nearest standard window size, calculate exact rough openings, compare insert vs. full-frame installation, and check if a custom unit is required.',
    longDescription:
      'The definitive replacement window decision assistant. Instantly matches your window dimensions against US, UK, Canada, Australia, and European standard factory sizes. Calculates rough opening dimensions, shim allowances, 5-star match score, cost impact guidance, DIY difficulty, and supplier-ready print summaries.',
    category: 'replacement',
    href: '/tools/replacement-window-calculator',
    icon: 'RefreshCw',
    status: 'live',
    useCases: ['Replacement', 'Renovation', 'Installation', 'Sizing', 'Planning'],
    benefits: [
      'Nearest standard size match (US, UK, CA, AU, EU)',
      '5-Star match score & visual comparison diagram',
      'Rough opening & shim space calculator',
      'Insert vs. Full Frame vs. New Construction guide',
      'Cost impact & DIY installation difficulty guidance',
      'Printable supplier summary for Home Depot or local supplier',
    ],
    keywords: [
      'replacement window calculator',
      'standard window sizes',
      'rough opening calculator',
      'window replacement cost guide',
      'custom window vs standard',
    ],
    relatedSlugs: ['window-size-calculator', 'window-glass-calculator', 'curtain-size-calculator', 'window-ac-calculator'],
  },
  {
    slug: 'window-cost-estimator',
    title: 'Window Cost Estimator',
    description:
      'Estimate window replacement costs including materials, glass, and installation labor.',
    category: 'costs',
    href: '/tools/window-cost-estimator',
    icon: 'DollarSign',
    status: 'planned',
    relatedSlugs: ['replacement-window-calculator'],
  },

  // -------------------------------------------------------------------------
  // Glass
  // -------------------------------------------------------------------------
  {
    slug: 'window-glass-calculator',
    title: 'Window Glass Calculator',
    description: 'Calculate glass weight, area, and ordering quantity for any shape and glass type — with live SVG preview and smart handling guidance.',
    category: 'glass',
    href: '/tools/window-glass-calculator',
    icon: 'PanelTop',
    status: 'live',
    benefits: [
      'Glass area and weight for 5 shapes (rectangle, circle, triangle, and more)',
      'All glass types: annealed, tempered, laminated, double and triple pane',
      'Handles per piece and total with waste allowance',
      '"Can I carry it?" handling difficulty rating',
      'Thickness recommendation based on pane size',
      'Live SVG illustration with dimension arrows',
    ],
    relatedSlugs: ['window-size-calculator', 'curtain-size-calculator', 'window-ac-calculator'],
  },
  {
    slug: 'window-weight-calculator',
    title: 'Window Weight Calculator',
    description: 'Estimate the total weight of a window including glass, frame, and hardware.',
    category: 'glass',
    href: '/tools/window-weight-calculator',
    icon: 'Scale',
    status: 'planned',
    relatedSlugs: ['window-glass-calculator'],
  },

  // -------------------------------------------------------------------------
  // Curtains & Blinds
  // -------------------------------------------------------------------------
  {
    slug: 'curtain-size-calculator',
    title: 'Curtain Size Calculator',
    description: 'Get the right curtain width, drop, rod length, and fabric needed for any window — with live illustration.',
    category: 'curtains',
    href: '/tools/curtain-size-calculator',
    icon: 'Blinds',
    status: 'live',
    benefits: [
      'Min, ideal, and max curtain width for any window',
      'Correct drop length for sill, floor, or puddle styling',
      'Rod length with side extension recommendation',
      'Total fabric needed with hem allowances',
      'Live SVG illustration that updates as you type',
    ],
    relatedSlugs: ['window-size-calculator', 'window-ac-calculator', 'window-blinds-calculator'],
  },
  {
    slug: 'window-blinds-calculator',
    title: 'Window Blinds Size Calculator',
    description: 'Calculate inside or outside mount blind dimensions with deduction, overlap, depth compatibility, and smart ordering recommendations for all blind types.',
    longDescription: 'The complete blind sizing assistant. Instantly calculates finished width and height for inside or outside mount installations across all blind types. Checks window depth compatibility, recommends the right mount, shows closest stock sizes, and generates a full ordering summary.',
    category: 'blinds',
    href: '/tools/window-blinds-calculator',
    icon: 'SlidersHorizontal',
    status: 'live',
    benefits: [
      'Inside & outside mount width and height',
      'Manufacturing deduction per blind type',
      'Window depth compatibility check',
      'Closest stock sizes (order without guessing)',
      'Confidence rating & ordering recommendation',
      'Smart blind type suggestion',
    ],
    relatedSlugs: ['window-size-calculator', 'curtain-size-calculator', 'replacement-window-calculator'],
  },
  {
    slug: 'window-film-calculator',
    title: 'Window Film Calculator',
    description: 'Calculate how much window film or tint you need for any window.',
    category: 'glass',
    href: '/tools/window-film-calculator',
    icon: 'Film',
    status: 'planned',
    relatedSlugs: ['window-area-calculator'],
  },

  // -------------------------------------------------------------------------
  // Energy & AC
  // -------------------------------------------------------------------------
  {
    slug: 'window-ac-calculator',
    title: 'Window AC BTU Calculator',
    description: 'Find the right BTU air conditioner for your room. Enter room size, climate, sun exposure, and insulation for a precise recommendation.',
    longDescription: 'Calculate the exact BTU cooling capacity your window AC unit needs. Takes into account room area, ceiling height, climate zone, sun exposure, room type, insulation quality, and occupant count to produce a precise, tier-snapped recommendation with energy cost estimates.',
    category: 'ac',
    href: '/tools/window-ac-calculator',
    icon: 'AirVent',
    status: 'live',
    benefits: [
      'Precise BTU recommendation for your room',
      'Climate, sun, and insulation adjustments',
      'Annual energy cost estimate',
      'Cooling suitability rating',
      'All units: ft, m, in supported',
    ],
    relatedSlugs: ['window-size-calculator', 'window-insulation-calculator', 'btu-calculator'],
    keywords: ['BTU calculator', 'AC sizing', 'window AC', 'air conditioner size', 'room cooling'],
    useCases: ['Cooling', 'Energy', 'Planning'],
  },
  {
    slug: 'btu-calculator',
    title: 'BTU Calculator',
    description: 'Calculate the BTU cooling capacity needed for any room.',
    category: 'ac',
    href: '/tools/btu-calculator',
    icon: 'Thermometer',
    status: 'planned',
    relatedSlugs: ['window-ac-calculator'],
  },
  {
    slug: 'window-insulation-calculator',
    title: 'Window Insulation Calculator',
    description: 'Estimate heat loss and energy savings from window insulation upgrades.',
    category: 'energy',
    href: '/tools/window-insulation-calculator',
    icon: 'Shield',
    status: 'planned',
    relatedSlugs: ['window-glass-calculator'],
  },

  // -------------------------------------------------------------------------
  // Construction
  // -------------------------------------------------------------------------
  {
    slug: 'window-frame-calculator',
    title: 'Window Frame Calculator',
    description: 'Calculate frame dimensions, material quantities, and trim lengths.',
    category: 'construction',
    href: '/tools/window-frame-calculator',
    icon: 'Frame',
    status: 'planned',
    relatedSlugs: ['window-trim-calculator'],
  },
  {
    slug: 'window-trim-calculator',
    title: 'Window Trim Calculator',
    description: 'Calculate trim and casing lengths for window finishing.',
    category: 'construction',
    href: '/tools/window-trim-calculator',
    icon: 'Crop',
    status: 'planned',
    relatedSlugs: ['window-frame-calculator'],
  },
  {
    slug: 'window-screen-calculator',
    title: 'Window Screen Calculator',
    description: 'Calculate screen dimensions and material for window screens and replacements.',
    category: 'maintenance',
    href: '/tools/window-screen-calculator',
    icon: 'Grid2x2',
    status: 'planned',
    relatedSlugs: ['window-size-calculator'],
  },

  // -------------------------------------------------------------------------
  // Codes & Planning
  // -------------------------------------------------------------------------
  {
    slug: 'egress-window-calculator',
    title: 'Egress Window Calculator',
    description:
      'Check if your basement or bedroom window meets IRC egress code requirements.',
    category: 'codes',
    href: '/tools/egress-window-calculator',
    icon: 'DoorOpen',
    status: 'planned',
    benefits: [
      'IRC code compliance check',
      'Minimum opening area verification',
      'Clear height & width check',
      'State-specific code notes',
    ],
    relatedSlugs: ['window-size-calculator', 'window-opening-calculator'],
  },
];

/** Look up a tool by its slug */
export function getToolBySlug(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

/** Get all tools in a given category */
export function getToolsByCategory(category: Tool['category']): Tool[] {
  return TOOLS.filter((t) => t.category === category);
}

/** Get live tools only */
export function getLiveTools(): Tool[] {
  return TOOLS.filter((t) => t.status === 'live');
}

/** Get tools related to a given slug */
export function getRelatedTools(slug: string, limit = 4): Tool[] {
  const tool = getToolBySlug(slug);
  if (!tool?.relatedSlugs) return [];
  return tool.relatedSlugs
    .map((s) => getToolBySlug(s))
    .filter((t): t is Tool => t !== undefined)
    .slice(0, limit);
}
