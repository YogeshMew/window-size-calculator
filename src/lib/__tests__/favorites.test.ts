// @vitest-environment jsdom
/**
 * Tests for the Favorites Manager (src/lib/favorites.ts)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  getFavorites,
  isFavorite,
  addFavorite,
  removeFavorite,
  toggleFavorite,
  clearFavorites,
} from '../favorites.js';

beforeEach(() => {
  localStorage.clear();
});

// ─────────────────────────────────────────────────────────────────────────────
// getFavorites
// ─────────────────────────────────────────────────────────────────────────────

describe('getFavorites', () => {
  it('returns an empty array when no favorites exist', () => {
    expect(getFavorites()).toEqual([]);
  });

  it('returns all favorited slugs', () => {
    addFavorite('window-size-calculator');
    addFavorite('window-ac-calculator');
    const favorites = getFavorites();
    expect(favorites).toContain('window-size-calculator');
    expect(favorites).toContain('window-ac-calculator');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isFavorite
// ─────────────────────────────────────────────────────────────────────────────

describe('isFavorite', () => {
  it('returns false when no favorites exist', () => {
    expect(isFavorite('window-size-calculator')).toBe(false);
  });

  it('returns true for a favorited calculator', () => {
    addFavorite('window-size-calculator');
    expect(isFavorite('window-size-calculator')).toBe(true);
  });

  it('returns false for an un-favorited calculator', () => {
    addFavorite('window-size-calculator');
    expect(isFavorite('other-calculator')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// addFavorite
// ─────────────────────────────────────────────────────────────────────────────

describe('addFavorite', () => {
  it('adds a calculator to favorites', () => {
    addFavorite('window-size-calculator');
    expect(isFavorite('window-size-calculator')).toBe(true);
  });

  it('does not duplicate if already favorited', () => {
    addFavorite('window-size-calculator');
    addFavorite('window-size-calculator');
    const favorites = getFavorites();
    expect(favorites.filter(s => s === 'window-size-calculator')).toHaveLength(1);
  });

  it('can add multiple different calculators', () => {
    addFavorite('calc-a');
    addFavorite('calc-b');
    addFavorite('calc-c');
    expect(getFavorites()).toHaveLength(3);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// removeFavorite
// ─────────────────────────────────────────────────────────────────────────────

describe('removeFavorite', () => {
  it('removes a favorited calculator', () => {
    addFavorite('window-size-calculator');
    removeFavorite('window-size-calculator');
    expect(isFavorite('window-size-calculator')).toBe(false);
  });

  it('is a no-op for an un-favorited calculator', () => {
    addFavorite('calc-a');
    removeFavorite('non-existent');
    expect(getFavorites()).toHaveLength(1);
  });

  it('does not remove other favorites', () => {
    addFavorite('calc-a');
    addFavorite('calc-b');
    removeFavorite('calc-a');
    expect(isFavorite('calc-b')).toBe(true);
    expect(isFavorite('calc-a')).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// toggleFavorite
// ─────────────────────────────────────────────────────────────────────────────

describe('toggleFavorite', () => {
  it('returns true when adding a favorite', () => {
    const result = toggleFavorite('window-size-calculator');
    expect(result).toBe(true);
    expect(isFavorite('window-size-calculator')).toBe(true);
  });

  it('returns false when removing a favorite', () => {
    addFavorite('window-size-calculator');
    const result = toggleFavorite('window-size-calculator');
    expect(result).toBe(false);
    expect(isFavorite('window-size-calculator')).toBe(false);
  });

  it('can toggle multiple times', () => {
    expect(toggleFavorite('calc')).toBe(true);
    expect(toggleFavorite('calc')).toBe(false);
    expect(toggleFavorite('calc')).toBe(true);
    expect(isFavorite('calc')).toBe(true);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// clearFavorites
// ─────────────────────────────────────────────────────────────────────────────

describe('clearFavorites', () => {
  it('removes all favorites', () => {
    addFavorite('calc-a');
    addFavorite('calc-b');
    clearFavorites();
    expect(getFavorites()).toEqual([]);
  });

  it('is a no-op if already empty', () => {
    expect(() => clearFavorites()).not.toThrow();
    expect(getFavorites()).toEqual([]);
  });
});
