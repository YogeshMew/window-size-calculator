/**
 * WindowMetrics — Calculator History Manager
 *
 * Stores the last 10 calculations per calculator in localStorage.
 * Each entry is a snapshot of all inputs with a timestamp and label.
 * Entries can be restored with one function call.
 *
 * All functions are SSR-safe: they check for `localStorage` availability
 * before accessing it, returning safe defaults in non-browser environments.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

export interface HistoryEntry<TInputs = Record<string, string>> {
  /** Unique ID for this entry (used for removal) */
  id: string;
  /** Slug of the calculator this entry belongs to */
  calculatorSlug: string;
  /** Unix timestamp in ms when the entry was saved */
  timestamp: number;
  /**
   * Human-readable label summarising the inputs, e.g. "12 × 14 ft"
   * Shown in the history panel.
   */
  label: string;
  /** Snapshot of the input values at calculation time */
  inputs: TInputs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Maximum number of history entries retained per calculator. */
export const HISTORY_MAX_ENTRIES = 10;

/** localStorage key prefix. Full key: `wm-history-{slug}` */
const STORAGE_PREFIX = 'wm-history-';

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

function storageKey(slug: string): string {
  return `${STORAGE_PREFIX}${slug}`;
}

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Add a new entry to this calculator's history.
 * If the history already has 10 entries, the oldest is dropped.
 *
 * @param slug    Calculator slug (e.g. 'window-size-calculator')
 * @param label   Short summary shown in history panel (e.g. "36 × 48 in")
 * @param inputs  Snapshot of all input values
 * @returns       The created HistoryEntry (useful for immediate UI updates)
 */
export function historyAdd<T extends Record<string, string>>(
  slug: string,
  label: string,
  inputs: T,
): HistoryEntry<T> {
  const entry: HistoryEntry<T> = {
    id: generateId(),
    calculatorSlug: slug,
    timestamp: Date.now(),
    label,
    inputs,
  };

  if (!isStorageAvailable()) return entry;

  const all = historyGetAll<T>(slug);
  // Deduplicate: if the same label already exists at the top, skip
  if (all.length > 0 && all[0].label === label) return all[0] as HistoryEntry<T>;

  const updated = [entry, ...all].slice(0, HISTORY_MAX_ENTRIES);

  try {
    localStorage.setItem(storageKey(slug), JSON.stringify(updated));
  } catch {
    // localStorage quota exceeded or private browsing
  }

  return entry;
}

/** Alias for historyAdd */
export const saveToHistory = historyAdd;


/**
 * Retrieve all history entries for a calculator, most recent first.
 *
 * @param slug  Calculator slug
 * @returns     Array of history entries, or [] if none / unavailable
 */
export function historyGetAll<T = Record<string, string>>(slug: string): HistoryEntry<T>[] {
  if (!isStorageAvailable()) return [];
  try {
    const raw = localStorage.getItem(storageKey(slug));
    if (!raw) return [];
    return JSON.parse(raw) as HistoryEntry<T>[];
  } catch {
    return [];
  }
}

/**
 * Remove a single entry from the history by ID.
 *
 * @param slug  Calculator slug
 * @param id    Entry ID to remove
 */
export function historyRemove(slug: string, id: string): void {
  if (!isStorageAvailable()) return;
  const updated = historyGetAll(slug).filter((e) => e.id !== id);
  try {
    localStorage.setItem(storageKey(slug), JSON.stringify(updated));
  } catch {}
}

/**
 * Clear all history entries for a calculator.
 *
 * @param slug  Calculator slug
 */
export function historyClear(slug: string): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.removeItem(storageKey(slug));
  } catch {}
}

/**
 * Format a timestamp as a human-readable relative time string.
 * Examples: "just now", "2 min ago", "1 hr ago", "3 days ago"
 *
 * @param timestamp  Unix timestamp in ms
 */
export function historyFormatTime(timestamp: number): string {
  const diffMs = Date.now() - timestamp;
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHr  = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHr / 24);

  if (diffSec < 30)  return 'just now';
  if (diffMin < 1)   return `${diffSec}s ago`;
  if (diffMin < 60)  return `${diffMin} min ago`;
  if (diffHr  < 24)  return `${diffHr} hr ago`;
  if (diffDay < 7)   return `${diffDay} day${diffDay !== 1 ? 's' : ''} ago`;

  return new Date(timestamp).toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
  });
}
