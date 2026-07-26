/**
 * WindowMetrics — Content Collections Configuration
 *
 * Astro v6+ format: file must be at src/content.config.ts (not src/content/config.ts)
 * Each collection requires a `loader` definition.
 *
 * Collections:
 *   - guides:  How-to measurement and installation guides
 *   - charts:  Standard size charts and reference tables
 *   - blog:    News, tips, and updates
 */

import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

// ---------------------------------------------------------------------------
// Shared schemas
// ---------------------------------------------------------------------------

const authorSchema = z.object({
  name: z.string(),
  title: z.string().optional(),
  slug: z.string().optional(),
});

const baseContentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(1, 'Description is required'),
  publishedAt: z.coerce.date(),
  updatedAt: z.coerce.date().optional(),
  author: authorSchema.optional(),
  /** Exclude from build + sitemap */
  draft: z.boolean().default(false),
  /** OG image path (relative to /public) */
  ogImage: z.string().optional(),
  /** Related tool slugs */
  relatedTools: z.array(z.string()).default([]),
  /** Tags for filtering */
  tags: z.array(z.string()).default([]),
});

// ---------------------------------------------------------------------------
// Guides collection
// ---------------------------------------------------------------------------

const guides = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/guides' }),
  schema: baseContentSchema.extend({
    category: z
      .enum([
        'measurement',
        'replacement',
        'glass',
        'curtains',
        'blinds',
        'energy',
        'ac',
        'construction',
        'codes',
        'planning',
        'costs',
        'maintenance',
      ])
      .optional(),
    difficulty: z.enum(['beginner', 'intermediate', 'advanced']).default('beginner'),
    readingTime: z.number().int().positive().optional(),
    relatedCharts: z.array(z.string()).default([]),
  }),
});

// ---------------------------------------------------------------------------
// Charts collection
// ---------------------------------------------------------------------------

const charts = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/charts' }),
  schema: baseContentSchema.extend({
    region: z.enum(['US', 'UK', 'CA', 'AU', 'EU', 'global']).default('US'),
    windowType: z
      .enum([
        'single-hung',
        'double-hung',
        'sliding',
        'casement',
        'awning',
        'picture',
        'bay',
        'bow',
        'garden',
        'fixed',
        'custom',
        'all',
      ])
      .default('all'),
    relatedGuides: z.array(z.string()).default([]),
  }),
});

// ---------------------------------------------------------------------------
// Blog collection
// ---------------------------------------------------------------------------

const blog = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/blog' }),
  schema: baseContentSchema.extend({
    featured: z.boolean().default(false),
    excerpt: z.string().optional(),
  }),
});

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export const collections = {
  guides,
  charts,
  blog,
};
