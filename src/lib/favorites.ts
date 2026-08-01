/**
 * WindowMetrics — Favorites Manager
 *
 * Stores a user's favorited calculator slugs in localStorage.
 * Provides toggle, query, and enumeration functions for use by UI components.
 *
 * All functions are SSR-safe.
 */

const STORAGE_KEY = 'wm-favorites';

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

function loadFavorites(): string[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function saveFavorites(slugs: string[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slugs));
  } catch {}
}

// ─────────────────────────────────────────────────────────────────────────────
// Public API
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Return all favorited calculator slugs (in order they were added).
 * Returns an empty array in non-browser environments.
 */
export function getFavorites(): string[] {
  if (!isStorageAvailable()) return [];
  return loadFavorites();
}

/**
 * Check whether a calculator is currently favorited.
 *
 * @param slug  Calculator slug to check
 */
export function isFavorite(slug: string): boolean {
  if (!isStorageAvailable()) return false;
  return loadFavorites().includes(slug);
}

/**
 * Add a calculator to favorites. No-op if already favorited.
 *
 * @param slug  Calculator slug to add
 */
export function addFavorite(slug: string): void {
  if (!isStorageAvailable()) return;
  const favorites = loadFavorites();
  if (!favorites.includes(slug)) {
    saveFavorites([...favorites, slug]);
  }
}

/**
 * Remove a calculator from favorites. No-op if not favorited.
 *
 * @param slug  Calculator slug to remove
 */
export function removeFavorite(slug: string): void {
  if (!isStorageAvailable()) return;
  saveFavorites(loadFavorites().filter((s) => s !== slug));
}

/**
 * Toggle the favorite state for a calculator.
 *
 * @param slug  Calculator slug to toggle
 * @returns     `true` if the calculator is now favorited, `false` if un-favorited
 */
export function toggleFavorite(slug: string): boolean {
  if (isFavorite(slug)) {
    removeFavorite(slug);
    return false;
  }
  addFavorite(slug);
  return true;
}

/**
 * Clear all favorites.
 */
export function clearFavorites(): void {
  if (!isStorageAvailable()) return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
