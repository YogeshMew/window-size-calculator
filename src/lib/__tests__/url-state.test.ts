// @vitest-environment jsdom
/**
 * Tests for the URL State Manager (src/lib/url-state.ts)
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  encodeUrlState,
  decodeUrlState,
  readUrlState,
  pushUrlState,
  buildShareUrl,
} from '../url-state.js';

// ─────────────────────────────────────────────────────────────────────────────
// encodeUrlState
// ─────────────────────────────────────────────────────────────────────────────

describe('encodeUrlState', () => {
  it('encodes a simple params object', () => {
    const qs = encodeUrlState({ width: '36', height: '48', unit: 'in' });
    expect(qs).toContain('width=36');
    expect(qs).toContain('height=48');
    expect(qs).toContain('unit=in');
  });

  it('omits empty-string values', () => {
    const qs = encodeUrlState({ width: '36', height: '', unit: 'in' });
    expect(qs).not.toContain('height=');
    expect(qs).toContain('width=36');
  });

  it('returns empty string for all-empty params', () => {
    expect(encodeUrlState({})).toBe('');
    expect(encodeUrlState({ width: '' })).toBe('');
  });

  it('URL-encodes special characters', () => {
    const qs = encodeUrlState({ label: 'hello world' });
    expect(qs).toBe('label=hello+world');
  });

  it('encodes decimal values correctly', () => {
    const qs = encodeUrlState({ width: '36.5', height: '48.375' });
    expect(qs).toContain('width=36.5');
    expect(qs).toContain('height=48.375');
  });

  it('handles all standard units', () => {
    for (const unit of ['mm', 'cm', 'm', 'in', 'ft']) {
      const qs = encodeUrlState({ unit });
      expect(qs).toContain(`unit=${unit}`);
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// decodeUrlState
// ─────────────────────────────────────────────────────────────────────────────

describe('decodeUrlState', () => {
  it('decodes a query string with leading ?', () => {
    const params = decodeUrlState('?width=36&height=48&unit=in');
    expect(params).toEqual({ width: '36', height: '48', unit: 'in' });
  });

  it('decodes a query string without leading ?', () => {
    const params = decodeUrlState('width=36&height=48');
    expect(params).toEqual({ width: '36', height: '48' });
  });

  it('returns an empty object for an empty string', () => {
    expect(decodeUrlState('')).toEqual({});
    expect(decodeUrlState('?')).toEqual({});
  });

  it('decodes URL-encoded characters', () => {
    const params = decodeUrlState('label=hello+world');
    expect(params.label).toBe('hello world');
  });

  it('is the inverse of encodeUrlState (round-trip)', () => {
    const original = { width: '36', height: '48', unit: 'in' };
    const encoded  = encodeUrlState(original);
    const decoded  = decodeUrlState(encoded);
    expect(decoded).toEqual(original);
  });

  it('handles fractional values with dots', () => {
    const params = decodeUrlState('width=36.5&height=48.375');
    expect(params.width).toBe('36.5');
    expect(params.height).toBe('48.375');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// readUrlState (in jsdom, window.location.search is settable via jsdom API)
// ─────────────────────────────────────────────────────────────────────────────

describe('readUrlState', () => {
  it('returns an empty object when there is no query string', () => {
    // jsdom default URL has no query string
    expect(readUrlState()).toEqual({});
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// pushUrlState
// ─────────────────────────────────────────────────────────────────────────────

describe('pushUrlState', () => {
  beforeEach(() => {
    // Reset the URL to clean state before each test
    window.history.replaceState({}, '', '/tools/window-size-calculator');
  });

  it('updates window.location.search with encoded params', () => {
    pushUrlState({ width: '36', height: '48', unit: 'in' });
    const params = decodeUrlState(window.location.search);
    expect(params.width).toBe('36');
    expect(params.height).toBe('48');
    expect(params.unit).toBe('in');
  });

  it('clears the query string when params is empty', () => {
    pushUrlState({ width: '36' });
    pushUrlState({});
    expect(window.location.search).toBe('');
  });

  it('omits empty values', () => {
    pushUrlState({ width: '36', height: '' });
    expect(window.location.search).not.toContain('height');
  });

  it('does not add a new browser history entry', () => {
    const before = window.history.length;
    pushUrlState({ width: '10' });
    // replaceState doesn't change history.length
    expect(window.history.length).toBe(before);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// buildShareUrl
// ─────────────────────────────────────────────────────────────────────────────

describe('buildShareUrl', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/tools/window-size-calculator');
  });

  it('builds a full URL with query params', () => {
    const url = buildShareUrl({ width: '36', height: '48', unit: 'in' });
    expect(url).toMatch(/^http/);
    expect(url).toContain('/tools/window-size-calculator');
    expect(url).toContain('width=36');
    expect(url).toContain('height=48');
    expect(url).toContain('unit=in');
  });

  it('returns URL without query string when params is empty', () => {
    const url = buildShareUrl({});
    expect(url).not.toContain('?');
    expect(url).toContain('/tools/window-size-calculator');
  });

  it('is parseable back to the original params (round-trip)', () => {
    const input = { width: '36', height: '48', unit: 'in' };
    const url = buildShareUrl(input);
    const qs = url.split('?')[1] ?? '';
    const decoded = decodeUrlState(qs);
    expect(decoded).toEqual(input);
  });

  it('includes the page origin', () => {
    const url = buildShareUrl({ width: '1' });
    // jsdom default origin is http://localhost
    expect(url).toMatch(/^https?:\/\//);
  });
});
