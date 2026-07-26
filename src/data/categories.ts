/**
 * WindowMetrics — Category Registry
 *
 * 12 primary content categories matching the information architecture.
 */

import type { Category } from '@/types/content.js';

export const CATEGORIES: Category[] = [
  {
    slug: 'measurement',
    title: 'Window Measurement',
    description: 'Accurately measure any window for replacement, coverings, or construction projects.',
    href: '/categories/measurement',
    icon: 'Ruler',
    toolSlugs: ['window-size-calculator', 'window-area-calculator', 'window-opening-calculator'],
  },
  {
    slug: 'replacement',
    title: 'Window Replacement',
    description: 'Find the right replacement window, plan your installation, and estimate costs.',
    href: '/categories/replacement',
    icon: 'RefreshCw',
    toolSlugs: ['replacement-window-calculator', 'window-cost-estimator'],
  },
  {
    slug: 'glass',
    title: 'Glass & Glazing',
    description: 'Calculate glass area, weight, and glazing specifications.',
    href: '/categories/glass',
    icon: 'PanelTop',
    toolSlugs: ['window-glass-calculator', 'window-weight-calculator', 'window-film-calculator'],
  },
  {
    slug: 'curtains',
    title: 'Curtains',
    description: 'Get the right curtain size, width, and drop for any window.',
    href: '/categories/curtains',
    icon: 'Blinds',
    toolSlugs: ['curtain-size-calculator'],
  },
  {
    slug: 'blinds',
    title: 'Blinds & Shades',
    description: 'Calculate inside or outside mount blind dimensions with proper clearance.',
    href: '/categories/blinds',
    icon: 'SlidersHorizontal',
    toolSlugs: ['blind-size-calculator'],
  },
  {
    slug: 'energy',
    title: 'Energy & Insulation',
    description: 'Estimate heat loss, insulation performance, and energy savings.',
    href: '/categories/energy',
    icon: 'Zap',
    toolSlugs: ['window-insulation-calculator'],
  },
  {
    slug: 'ac',
    title: 'Window Air Conditioning',
    description: 'Size your window AC unit and calculate the BTUs you need.',
    href: '/categories/ac',
    icon: 'AirVent',
    toolSlugs: ['window-ac-calculator', 'btu-calculator'],
  },
  {
    slug: 'construction',
    title: 'Construction & Installation',
    description: 'Calculate frames, trim, and material quantities for window installations.',
    href: '/categories/construction',
    icon: 'Hammer',
    toolSlugs: ['window-frame-calculator', 'window-trim-calculator'],
  },
  {
    slug: 'codes',
    title: 'Building Codes',
    description: 'Check egress requirements and building code compliance.',
    href: '/categories/codes',
    icon: 'ClipboardCheck',
    toolSlugs: ['egress-window-calculator'],
  },
  {
    slug: 'planning',
    title: 'Planning & Design',
    description: 'Plan your window layout, sizes, and configurations.',
    href: '/categories/planning',
    icon: 'LayoutDashboard',
    toolSlugs: [],
  },
  {
    slug: 'costs',
    title: 'Cost Estimation',
    description: 'Estimate window costs including materials, glass, and labor.',
    href: '/categories/costs',
    icon: 'DollarSign',
    toolSlugs: ['window-cost-estimator'],
  },
  {
    slug: 'maintenance',
    title: 'Maintenance & Repairs',
    description: 'Calculate screen dimensions and find repair resources.',
    href: '/categories/maintenance',
    icon: 'Wrench',
    toolSlugs: ['window-screen-calculator'],
  },
];

/** Get a category by slug */
export function getCategoryBySlug(slug: string): Category | undefined {
  return CATEGORIES.find((c) => c.slug === slug);
}
