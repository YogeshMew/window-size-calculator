/**
 * WindowMetrics — Content Types
 *
 * Types for tools, categories, guides, FAQs, authors, and navigation.
 */

// ---------------------------------------------------------------------------
// Tool
// ---------------------------------------------------------------------------

/** Primary category a tool belongs to */
export type ToolCategory =
  | 'measurement'
  | 'replacement'
  | 'glass'
  | 'curtains'
  | 'blinds'
  | 'energy'
  | 'ac'
  | 'construction'
  | 'codes'
  | 'planning'
  | 'costs'
  | 'maintenance';

/** Status of tool implementation */
export type ToolStatus = 'live' | 'coming-soon' | 'planned';

/** A WindowMetrics tool or calculator */
export interface Tool {
  /** URL-safe slug (e.g. "window-size-calculator") */
  slug: string;
  /** Full display title */
  title: string;
  /** Short description for cards and meta */
  description: string;
  /** Longer description for tool detail pages */
  longDescription?: string;
  /** Primary category */
  category: ToolCategory;
  /** URL path (e.g. "/tools/window-size-calculator") */
  href: string;
  /** Lucide icon name */
  icon: string;
  /** Implementation status */
  status: ToolStatus;
  /** Related tool slugs (for "Related Tools" sections) */
  relatedSlugs?: string[];
  /** Keywords for internal SEO */
  keywords?: string[];
  /** Short use-case tags shown on tool cards (e.g. ["Replacement", "Curtains"]) */
  useCases?: string[];
  /** Benefit bullet points shown as checkmarks on tool cards */
  benefits?: string[];
}

// ---------------------------------------------------------------------------
// Category
// ---------------------------------------------------------------------------

/** A top-level content category */
export interface Category {
  /** URL-safe slug */
  slug: ToolCategory;
  /** Display title */
  title: string;
  /** Short description */
  description: string;
  /** URL path */
  href: string;
  /** Lucide icon name */
  icon: string;
  /** Tool slugs in this category */
  toolSlugs: string[];
}

// ---------------------------------------------------------------------------
// Content (Guides, Charts, Blog)
// ---------------------------------------------------------------------------

/** Author of a guide or blog post */
export interface Author {
  name: string;
  title?: string;
  bio?: string;
  /** URL-safe slug */
  slug: string;
}

/** A FAQ item */
export interface FAQ {
  question: string;
  answer: string;
}

/** Related content reference */
export interface RelatedContent {
  type: 'tool' | 'guide' | 'chart' | 'blog';
  title: string;
  href: string;
  description?: string;
}

// ---------------------------------------------------------------------------
// Navigation
// ---------------------------------------------------------------------------

/** A navigation item (header, footer) */
export interface NavigationItem {
  label: string;
  href: string;
  /** Lucide icon name */
  icon?: string;
  /** Child items for dropdown */
  children?: NavigationItem[];
  /** Whether this is an external link */
  external?: boolean;
}
