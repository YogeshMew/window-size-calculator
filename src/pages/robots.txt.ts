/**
 * WindowMetrics — robots.txt
 * Route: /robots.txt
 */

import type { APIRoute } from 'astro';

const robotsTxt = `
User-agent: *
Allow: /

# Disallow admin or development paths
Disallow: /admin/
Disallow: /_astro/

# Sitemap
Sitemap: https://windowmetrics.com/sitemap.xml
`.trim();

export const GET: APIRoute = () => {
  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
    },
  });
};
