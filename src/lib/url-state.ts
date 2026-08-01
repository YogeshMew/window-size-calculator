/**
 * WindowMetrics — URL State Manager
 *
 * Persists calculator input values as URL query parameters.
 * Enables shareable links, browser back/forward navigation, and
 * automatic restoration of state after a page refresh.
 *
 * Design:
 * - Only string values are stored (all inputs serialise to strings)
 * - Empty / null / undefined values are omitted from the URL
 * - Uses `history.replaceState` so the URL updates silently without adding
 *   a new browser history entry
 *
 * All functions are SSR-safe.
 */

export type UrlParams = Record<string, string>;

// ─────────────────────────────────────────────────────────────────────────────
// Encode / decode
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Encode a params object into a query string (without the leading `?`).
 * Empty-string values are omitted.
 *
 * @param params  Key-value pairs to encode
 * @returns       Query string, e.g. `width=36&height=48&unit=in`
 *
 * @example
 * encodeUrlState({ width: '36', height: '48', unit: 'in' })
 * // → 'width=36&height=48&unit=in'
 */
export function encodeUrlState(params: UrlParams): string {
  const qs = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== '' && value !== null && value !== undefined) {
      qs.set(key, value);
    }
  }
  return qs.toString();
}

/**
 * Decode a query string (with or without the leading `?`) into a params object.
 *
 * @param search  Query string, e.g. `?width=36&height=48` or `width=36&height=48`
 * @returns       Params object
 *
 * @example
 * decodeUrlState('?width=36&height=48&unit=in')
 * // → { width: '36', height: '48', unit: 'in' }
 */
export function decodeUrlState(search: string): UrlParams {
  const params: UrlParams = {};
  const qs = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  qs.forEach((value, key) => {
    params[key] = value;
  });
  return params;
}

// ─────────────────────────────────────────────────────────────────────────────
// Browser URL management
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Read the current page's URL query parameters.
 * Returns an empty object in non-browser environments.
 */
export function readUrlState(): UrlParams {
  if (typeof window === 'undefined') return {};
  return decodeUrlState(window.location.search);
}

/**
 * Write params to the URL using `history.replaceState` (no page reload).
 * Clears the query string when `params` is empty.
 *
 * @param params  Current input state to persist
 */
export function pushUrlState(params: UrlParams): void {
  if (typeof window === 'undefined') return;
  const qs = encodeUrlState(params);
  const newUrl = `${window.location.pathname}${qs ? '?' + qs : ''}`;
  window.history.replaceState({}, '', newUrl);
}

/**
 * Build a full shareable URL using the given params and the current page origin.
 *
 * @param params  Input state to encode
 * @returns       Absolute URL string, or '' in SSR
 *
 * @example
 * // When page is https://example.com/tools/window-size-calculator
 * buildShareUrl({ width: '36', height: '48', unit: 'in' })
 * // → 'https://example.com/tools/window-size-calculator?width=36&height=48&unit=in'
 */
export function buildShareUrl(params: UrlParams): string {
  if (typeof window === 'undefined') return '';
  const qs = encodeUrlState(params);
  return `${window.location.origin}${window.location.pathname}${qs ? '?' + qs : ''}`;
}
