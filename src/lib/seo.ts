/**
 * WindowMetrics — SEO Metadata Helpers
 *
 * Utilities for building page-level SEO: canonical URLs, OG meta, Twitter meta.
 */

const SITE_URL = 'https://windowmetrics.com';
const SITE_NAME = 'WindowMetrics';
const DEFAULT_OG_IMAGE = '/og-default.png';
const TWITTER_HANDLE = '@windowmetrics';

// ---------------------------------------------------------------------------
// Canonical URL
// ---------------------------------------------------------------------------

/**
 * Build the canonical URL for a given path.
 * @example getCanonical('/tools/window-size-calculator') → 'https://windowmetrics.com/tools/window-size-calculator'
 */
export function getCanonical(path: string): string {
  // Ensure single leading slash, no trailing slash except for root
  const normalized = path.startsWith('/') ? path : `/${path}`;
  const withoutTrailing = normalized.endsWith('/') && normalized !== '/'
    ? normalized.slice(0, -1)
    : normalized;
  return `${SITE_URL}${withoutTrailing}`;
}

// ---------------------------------------------------------------------------
// Page Title
// ---------------------------------------------------------------------------

/**
 * Build a full page title with site name suffix.
 * @example buildTitle('Window Size Calculator') → 'Window Size Calculator — WindowMetrics'
 */
export function buildTitle(pageTitle: string): string {
  if (!pageTitle) return SITE_NAME;
  return `${pageTitle} — ${SITE_NAME}`;
}

// ---------------------------------------------------------------------------
// Open Graph Meta
// ---------------------------------------------------------------------------

interface OGMetaInput {
  title: string;
  description: string;
  url: string;
  image?: string;
  type?: 'website' | 'article';
}

export interface OGMeta {
  property: string;
  content: string;
}

/**
 * Build Open Graph meta tag objects.
 */
export function buildOGMeta(input: OGMetaInput): OGMeta[] {
  return [
    { property: 'og:site_name', content: SITE_NAME },
    { property: 'og:type', content: input.type ?? 'website' },
    { property: 'og:title', content: input.title },
    { property: 'og:description', content: input.description },
    { property: 'og:url', content: input.url },
    { property: 'og:image', content: `${SITE_URL}${input.image ?? DEFAULT_OG_IMAGE}` },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:locale', content: 'en_US' },
  ];
}

// ---------------------------------------------------------------------------
// Twitter Card Meta
// ---------------------------------------------------------------------------

interface TwitterMetaInput {
  title: string;
  description: string;
  image?: string;
}

export interface TwitterMeta {
  name: string;
  content: string;
}

/**
 * Build Twitter Card meta tag objects.
 */
export function buildTwitterMeta(input: TwitterMetaInput): TwitterMeta[] {
  return [
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: TWITTER_HANDLE },
    { name: 'twitter:title', content: input.title },
    { name: 'twitter:description', content: input.description },
    { name: 'twitter:image', content: `${SITE_URL}${input.image ?? DEFAULT_OG_IMAGE}` },
  ];
}
