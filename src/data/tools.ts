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
      'Find the nearest standard window size for replacement projects and get installation recommendations.',
    category: 'replacement',
    href: '/tools/replacement-window-calculator',
    icon: 'RefreshCw',
    status: 'planned',
    relatedSlugs: ['window-size-calculator', 'window-cost-estimator'],
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
    description: 'Calculate glass area, weight, and glazing requirements for single, double, or triple pane windows.',
    category: 'glass',
    href: '/tools/window-glass-calculator',
    icon: 'PanelTop',
    status: 'planned',
    relatedSlugs: ['window-size-calculator', 'window-weight-calculator'],
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
    description: 'Get the right curtain width, drop, and rod length for any window.',
    category: 'curtains',
    href: '/tools/curtain-size-calculator',
    icon: 'Blinds',
    status: 'planned',
    relatedSlugs: ['window-size-calculator', 'blind-size-calculator'],
  },
  {
    slug: 'blind-size-calculator',
    title: 'Blind Size Calculator',
    description: 'Calculate inside or outside mount blind dimensions with clearance recommendations.',
    category: 'blinds',
    href: '/tools/blind-size-calculator',
    icon: 'SlidersHorizontal',
    status: 'planned',
    relatedSlugs: ['window-size-calculator', 'curtain-size-calculator'],
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
    title: 'Window AC Size Calculator',
    description: 'Find the right BTU air conditioner for your room size and window dimensions.',
    category: 'ac',
    href: '/tools/window-ac-calculator',
    icon: 'AirVent',
    status: 'planned',
    relatedSlugs: ['btu-calculator', 'window-size-calculator'],
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
