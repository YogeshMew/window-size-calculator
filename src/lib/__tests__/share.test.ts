// @vitest-environment jsdom
/**
 * Tests for the Share Module (src/lib/share.ts)
 * and URL share-URL generation (src/lib/url-state.ts).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  copyToClipboard,
  copyLink,
  copySummary,
  isNativeShareSupported,
  nativeShare,
  buildSummary,
} from '../share.js';
import { buildShareUrl, encodeUrlState, decodeUrlState } from '../url-state.js';

// ─────────────────────────────────────────────────────────────────────────────
// buildSummary
// ─────────────────────────────────────────────────────────────────────────────

describe('buildSummary', () => {
  it('builds a multi-line text summary', () => {
    const summary = buildSummary('Window Size Calculator', [
      ['Width', '36 in'],
      ['Height', '48 in'],
      ['Area', '1,728 sq in'],
    ]);
    expect(summary).toContain('Window Size Calculator');
    expect(summary).toContain('Width: 36 in');
    expect(summary).toContain('Height: 48 in');
    expect(summary).toContain('Area: 1,728 sq in');
  });

  it('appends URL at the end when provided', () => {
    const summary = buildSummary(
      'My Calculator',
      [['Result', '42']],
      'https://example.com?x=1',
    );
    const lines = summary.split('\n');
    expect(lines[lines.length - 1]).toBe('https://example.com?x=1');
  });

  it('does not include a trailing URL line when not provided', () => {
    const summary = buildSummary('Calc', [['A', 'B']]);
    expect(summary).not.toContain('http');
  });

  it('separates title and fields with an empty line', () => {
    const summary = buildSummary('Title', [['Field', 'Value']]);
    expect(summary.startsWith('Title\n\n')).toBe(true);
  });

  it('handles an empty fields array', () => {
    const summary = buildSummary('Empty', []);
    expect(summary.trim()).toBe('Empty');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// copyToClipboard — mocked in jsdom
// ─────────────────────────────────────────────────────────────────────────────

describe('copyToClipboard', () => {
  beforeEach(() => {
    // Mock the clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('returns true when clipboard write succeeds', async () => {
    const result = await copyToClipboard('hello world');
    expect(result).toBe(true);
  });

  it('calls navigator.clipboard.writeText with the text', async () => {
    await copyToClipboard('test text');
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith('test text');
  });

  it('returns false when clipboard throws', async () => {
    vi.mocked(navigator.clipboard.writeText).mockRejectedValueOnce(new Error('Denied'));
    const result = await copyToClipboard('test');
    expect(result).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// copyLink / copySummary
// ─────────────────────────────────────────────────────────────────────────────

describe('copyLink', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('copies the URL to clipboard', async () => {
    const url = 'https://example.com?width=36&height=48';
    const result = await copyLink(url);
    expect(result).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(url);
  });
});

describe('copySummary', () => {
  beforeEach(() => {
    Object.assign(navigator, {
      clipboard: { writeText: vi.fn().mockResolvedValue(undefined) },
    });
  });

  it('copies the summary text to clipboard', async () => {
    const text = 'Window Size Calculator\n\nWidth: 36 in';
    const result = await copySummary(text);
    expect(result).toBe(true);
    expect(navigator.clipboard.writeText).toHaveBeenCalledWith(text);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// isNativeShareSupported
// ─────────────────────────────────────────────────────────────────────────────

describe('isNativeShareSupported', () => {
  it('returns false when navigator.share is not available (jsdom default)', () => {
    // jsdom does not implement navigator.share by default
    expect(isNativeShareSupported()).toBe(false);
  });

  it('returns true when navigator.share exists', () => {
    const originalShare = navigator.share;
    try {
      Object.defineProperty(navigator, 'share', {
        value: vi.fn(),
        configurable: true,
        writable: true,
      });
      expect(isNativeShareSupported()).toBe(true);
    } finally {
      // Restore
      Object.defineProperty(navigator, 'share', {
        value: originalShare,
        configurable: true,
        writable: true,
      });
    }
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// nativeShare
// ─────────────────────────────────────────────────────────────────────────────

describe('nativeShare', () => {
  it('returns false when native share is not supported', async () => {
    // jsdom doesn't implement navigator.share
    const result = await nativeShare({ title: 'Test', url: 'https://example.com' });
    expect(result).toBe(false);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Share URL generation (url-state integration)
// ─────────────────────────────────────────────────────────────────────────────

describe('share URL generation', () => {
  beforeEach(() => {
    window.history.replaceState({}, '', '/tools/window-size-calculator');
  });

  it('generates a valid shareable URL for window size calculator', () => {
    const url = buildShareUrl({ width: '48.375', height: '36.5', unit: 'in' });
    expect(url).toContain('width=48.375');
    expect(url).toContain('height=36.5');
    expect(url).toContain('unit=in');
    expect(url).toMatch(/^https?:\/\//);
  });

  it('generates a valid shareable URL for AC calculator', () => {
    window.history.replaceState({}, '', '/tools/window-ac-calculator');
    const url = buildShareUrl({
      width: '12', length: '14', unit: 'ft',
      climate: 'moderate', sun: 'east', room: 'bedroom',
      insulation: 'average', occupants: '2',
    });
    expect(url).toContain('width=12');
    expect(url).toContain('length=14');
    expect(url).toContain('climate=moderate');
  });

  it('round-trips correctly: build URL → decode params', () => {
    const original = { width: '36', height: '48', unit: 'in' };
    const url = buildShareUrl(original);
    const qs = url.includes('?') ? url.split('?')[1] : '';
    const decoded = decodeUrlState(qs);
    expect(decoded).toEqual(original);
  });

  it('produces an empty URL when no params are provided', () => {
    const url = buildShareUrl({});
    expect(url).not.toContain('?');
  });

  it('encodeUrlState produces stable output for the same input', () => {
    const a = encodeUrlState({ width: '36', height: '48' });
    const b = encodeUrlState({ width: '36', height: '48' });
    expect(a).toBe(b);
  });
});
