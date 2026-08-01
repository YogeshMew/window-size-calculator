/**
 * WindowMetrics — Share Module
 *
 * Provides three share strategies:
 *   1. Copy link — copies a shareable URL to the clipboard
 *   2. Copy summary — copies a human-readable text summary to the clipboard
 *   3. Native share — uses the Web Share API when supported (mobile browsers)
 *
 * All functions return a boolean indicating success so the caller can
 * provide appropriate UI feedback (e.g. "Copied!" toast).
 *
 * No vendor dependencies. All functions are SSR-safe.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Clipboard
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Copy text to the system clipboard.
 * Uses the modern `navigator.clipboard` API with a `document.execCommand`
 * fallback for older browsers.
 *
 * @param text  Text to copy
 * @returns     `true` on success, `false` otherwise
 */
export async function copyToClipboard(text: string): Promise<boolean> {
  if (typeof navigator === 'undefined') return false;

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }

    // Fallback: create a temporary textarea, select it, and use execCommand
    if (typeof document === 'undefined') return false;
    const ta = document.createElement('textarea');
    ta.value = text;
    ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
    document.body.appendChild(ta);
    ta.focus();
    ta.select();
    const ok = document.execCommand('copy');
    document.body.removeChild(ta);
    return ok;
  } catch {
    return false;
  }
}

/**
 * Copy a shareable calculator URL to the clipboard.
 *
 * @param url   Full URL to copy (use `buildShareUrl()` from url-state.ts)
 * @returns     `true` on success
 */
export async function copyLink(url: string): Promise<boolean> {
  return copyToClipboard(url);
}

/**
 * Copy a plain-text summary of calculation results to the clipboard.
 *
 * @param summary  Pre-formatted summary string (newline-separated key: value pairs)
 * @returns        `true` on success
 */
export async function copySummary(summary: string): Promise<boolean> {
  return copyToClipboard(summary);
}

// ─────────────────────────────────────────────────────────────────────────────
// Native share (Web Share API)
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Check whether the native Web Share API is available.
 * Returns `false` in non-browser environments and in most desktop browsers.
 */
export function isNativeShareSupported(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.share === 'function';
}

/**
 * Invoke the native OS share sheet (available on mobile browsers and some
 * desktop Chrome/Edge).
 *
 * @param data  Share data (title, text, url)
 * @returns     `true` if the user completed sharing, `false` if cancelled or unsupported
 */
export async function nativeShare(data: {
  title?: string;
  text?: string;
  url?: string;
}): Promise<boolean> {
  if (!isNativeShareSupported()) return false;

  try {
    await navigator.share(data);
    return true;
  } catch (err) {
    // AbortError = user dismissed the share sheet — not a real error
    if ((err as Error)?.name !== 'AbortError') {
      console.error('[Share] Native share failed:', err);
    }
    return false;
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Summary builder
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build a plain-text summary of results from a key-value map.
 * Used for "Copy summary" and download text.
 *
 * @param title    Calculator title (first line)
 * @param fields   Ordered array of [label, value] pairs
 * @param url      Optional shareable URL to append
 * @returns        Multi-line text string
 *
 * @example
 * buildSummary('Window Size Calculator', [
 *   ['Width', '36 in'],
 *   ['Height', '48 in'],
 *   ['Area', '1728 sq in'],
 * ], 'https://...')
 * // → "Window Size Calculator\n\nWidth: 36 in\nHeight: 48 in\nArea: 1728 sq in\n\nhttps://..."
 */
export function buildSummary(
  title: string,
  fields: [string, string][],
  url?: string,
): string {
  const lines: string[] = [title, ''];
  for (const [label, value] of fields) {
    lines.push(`${label}: ${value}`);
  }
  if (url) {
    lines.push('', url);
  }
  return lines.join('\n');
}
