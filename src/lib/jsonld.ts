/**
 * WindowMetrics — JSON-LD Schema Builders
 *
 * Generates Schema.org structured data for all page types.
 * Every function returns a plain object ready for JSON.stringify().
 *
 * References:
 *   - https://schema.org/WebSite
 *   - https://schema.org/SoftwareApplication
 *   - https://schema.org/FAQPage
 *   - https://schema.org/BreadcrumbList
 *   - https://schema.org/Article
 *   - https://schema.org/Organization
 */

import type { BreadcrumbItem, FAQ } from '@/types/calculator.js';
import type { Tool } from '@/types/content.js';

const SITE_URL = 'https://windowmetrics.com';
const SITE_NAME = 'WindowMetrics';

// ---------------------------------------------------------------------------
// WebSite Schema
// ---------------------------------------------------------------------------

/** Schema for the website itself — inject on all pages */
export function buildWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description:
      'Professional window calculators, measurement guides, standard size charts, and replacement planning tools.',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/tools?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  };
}

// ---------------------------------------------------------------------------
// Organization Schema
// ---------------------------------------------------------------------------

/** Schema for the organization — inject on homepage and about page */
export function buildOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: SITE_NAME,
    url: SITE_URL,
    description:
      'WindowMetrics provides professional window measurement calculators, guides, and replacement planning tools.',
    sameAs: [],
  };
}

// ---------------------------------------------------------------------------
// BreadcrumbList Schema
// ---------------------------------------------------------------------------

/**
 * Schema for breadcrumb navigation.
 * @param items  Array of breadcrumb items (label + href)
 */
export function buildBreadcrumbSchema(items: BreadcrumbItem[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.label,
      item: item.current ? undefined : `${SITE_URL}${item.href}`,
    })),
  };
}

// ---------------------------------------------------------------------------
// SoftwareApplication Schema
// ---------------------------------------------------------------------------

/**
 * Schema for a calculator/tool page.
 * @param tool     The tool data
 * @param pageUrl  Full URL of this page (e.g. "/tools/window-size-calculator")
 */
export function buildSoftwareApplicationSchema(tool: Tool, pageUrl: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.title,
    description: tool.description,
    url: `${SITE_URL}${pageUrl}`,
    applicationCategory: 'UtilitiesApplication',
    operatingSystem: 'Web',
    offers: {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
    },
    provider: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

// ---------------------------------------------------------------------------
// FAQPage Schema
// ---------------------------------------------------------------------------

/**
 * Schema for a FAQ section.
 * @param faqs  Array of question/answer pairs
 */
export function buildFAQSchema(faqs: FAQ[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map((faq) => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer,
      },
    })),
  };
}

// ---------------------------------------------------------------------------
// Article Schema
// ---------------------------------------------------------------------------

interface ArticleSchemaInput {
  title: string;
  description: string;
  url: string;
  publishedAt: Date;
  updatedAt?: Date;
  authorName?: string;
}

/**
 * Schema for guide and blog post pages.
 */
export function buildArticleSchema(article: ArticleSchemaInput) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: article.title,
    description: article.description,
    url: `${SITE_URL}${article.url}`,
    datePublished: article.publishedAt.toISOString(),
    dateModified: (article.updatedAt ?? article.publishedAt).toISOString(),
    author: article.authorName
      ? {
          '@type': 'Person',
          name: article.authorName,
        }
      : {
          '@type': 'Organization',
          name: SITE_NAME,
        },
    publisher: {
      '@type': 'Organization',
      name: SITE_NAME,
      url: SITE_URL,
    },
  };
}

// ---------------------------------------------------------------------------
// Serialization helper
// ---------------------------------------------------------------------------

/**
 * Convert one or more schema objects to a JSON-LD script tag string.
 * Use with `set:html` in Astro: `<script set:html={toJsonLd(schema)} />`
 */
export function toJsonLd(schema: object | object[]): string {
  const data = Array.isArray(schema) ? schema : [schema];
  return data
    .map((s) => `<script type="application/ld+json">${JSON.stringify(s)}</script>`)
    .join('\n');
}
