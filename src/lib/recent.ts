/**
 * WindowMetrics — Recent Calculators Tracker
 *
 * Tracks the last 8 calculator pages visited by the user.
 * Stored in localStorage as an ordered array of slugs (most recent first).
 * Used on the homepage and sidebar to show "Recently used" shortcuts.
 *
 * All functions are SSR-safe.
 */

const STORAGE_KEY  = 'wm-recent';
const MAX_RECENT   = 8;

// ─────────────────────────────────────────────────────────────────────────────
// Storage helpers
// ─────────────────────────────────────────────────────────────────────────────

function isStorageAvailable(): boolean {
  try {
    return typeof localStorage !== 'undefined' && localStorage !== null;
  } catch {
    return false;
  }
}

function loadRecent(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveRecent(slugs: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Record a calculator page visit.
 * The slug is moved to the front of the list (deduplication).
 * List is capped at MAX_RECENT entries.
 *
 * @param slug  Calculator slug that was just visited
 */
export function recordVisit(slug: string): void {
  if (!isStorageAvailable()) return;
  const recent = loadRecent().filter((s) => s !== slug);
  saveRecent([slug, ...recent].slice(0, MAX_RECENT));
}

/**
 * Retrieve recently visited calculator slugs (most recent first).
 *
 * @param limit  Maximum number of entries to return (default: MAX_RECENT)
 */
export function getRecent(limit = MAX_RECENT): string[] {
  if (!isStorageAvailable()) return [];
  return loadRecent().slice(0, limit);
}

/**
 * Clear all recent-visit history.
 */
export function clearRecent(): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}

/** The maximum number of recent entries that will be tracked. */
export { MAX_RECENT };
