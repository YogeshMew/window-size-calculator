// @vitest-environment jsdom
/**
 * Tests for the Analytics Abstraction Layer (src/lib/analytics.ts)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  track,
  registerPlugin,
  clearPlugins,
  onAnalyticsEvent,
  type AnalyticsEvent,
  type AnalyticsPlugin,
} from '../analytics.js';

beforeEach(() => {
  clearPlugins();
});

// ─────────────────────────────────────────────────────────────────────────────
// registerPlugin / track
// ─────────────────────────────────────────────────────────────────────────────

describe('registerPlugin + track', () => {
  it('calls a registered plugin with the correct event', () => {
    const plugin: AnalyticsPlugin = vi.fn();
    registerPlugin(plugin);

    track({
      type: 'calculation_completed',
      properties: { slug: 'window-size-calculator', unit: 'in', inputs: { width: '36' } },
    });

    expect(plugin).toHaveBeenCalledOnce();
    const call = vi.mocked(plugin).mock.calls[0][0] as AnalyticsEvent;
    expect(call.type).toBe('calculation_completed');
    expect((call.properties as { slug: string }).slug).toBe('window-size-calculator');
  });

  it('calls multiple registered plugins', () => {
    const plugin1: AnalyticsPlugin = vi.fn();
    const plugin2: AnalyticsPlugin = vi.fn();
    registerPlugin(plugin1);
    registerPlugin(plugin2);

    track({ type: 'unit_changed', properties: { slug: 'calc', from: 'in', to: 'mm' } });

    expect(plugin1).toHaveBeenCalledOnce();
    expect(plugin2).toHaveBeenCalledOnce();
  });

  it('does not throw if a plugin throws', () => {
    const badPlugin: AnalyticsPlugin = vi.fn(() => { throw new Error('plugin error'); });
    registerPlugin(badPlugin);

    expect(() => track({
      type: 'unit_changed',
      properties: { slug: 'calc', from: 'in', to: 'mm' },
    })).not.toThrow();
  });

  it('dispatches a wm:analytics DOM event', () => {
    const listener = vi.fn();
    window.addEventListener('wm:analytics', listener);

    track({ type: 'favorite_added', properties: { slug: 'my-calc' } });

    expect(listener).toHaveBeenCalledOnce();
    const event = listener.mock.calls[0][0] as CustomEvent<AnalyticsEvent>;
    expect(event.detail.type).toBe('favorite_added');

    window.removeEventListener('wm:analytics', listener);
  });

  it('passes the full event to the DOM listener', () => {
    const received: AnalyticsEvent[] = [];
    window.addEventListener('wm:analytics', (e) => {
      received.push((e as CustomEvent<AnalyticsEvent>).detail);
    });

    const event: AnalyticsEvent = {
      type: 'share_clicked',
      properties: { slug: 'calc', method: 'copy_link' },
    };
    track(event);

    expect(received).toHaveLength(1);
    expect(received[0]).toEqual(event);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// clearPlugins
// ─────────────────────────────────────────────────────────────────────────────

describe('clearPlugins', () => {
  it('removes all registered plugins', () => {
    const plugin: AnalyticsPlugin = vi.fn();
    registerPlugin(plugin);
    clearPlugins();

    track({ type: 'favorite_removed', properties: { slug: 'calc' } });

    expect(plugin).not.toHaveBeenCalled();
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// onAnalyticsEvent
// ─────────────────────────────────────────────────────────────────────────────

describe('onAnalyticsEvent', () => {
  it('calls the handler when an event is tracked', () => {
    const handler: AnalyticsPlugin = vi.fn();
    const unsubscribe = onAnalyticsEvent(handler);

    track({ type: 'history_cleared', properties: { slug: 'calc' } });

    expect(handler).toHaveBeenCalledOnce();
    expect(vi.mocked(handler).mock.calls[0][0].type).toBe('history_cleared');

    unsubscribe();
  });

  it('stops receiving events after unsubscribe', () => {
    const handler: AnalyticsPlugin = vi.fn();
    const unsubscribe = onAnalyticsEvent(handler);

    track({ type: 'favorite_added', properties: { slug: 'calc' } });
    unsubscribe();
    track({ type: 'favorite_added', properties: { slug: 'calc' } });

    expect(handler).toHaveBeenCalledOnce();
  });

  it('returns a no-op in non-browser environments (graceful)', () => {
    // onAnalyticsEvent should never throw — it guards with typeof window check
    // In jsdom this is fine; we just verify it returns a function
    const unsub = onAnalyticsEvent(vi.fn());
    expect(typeof unsub).toBe('function');
    unsub(); // should not throw
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// All event types — type exhaustiveness check
// ─────────────────────────────────────────────────────────────────────────────

describe('all event types', () => {
  const events: AnalyticsEvent[] = [
    { type: 'calculation_completed', properties: { slug: 'c', unit: 'in', inputs: {} } },
    { type: 'unit_changed',          properties: { slug: 'c', from: 'in', to: 'mm' } },
    { type: 'share_clicked',         properties: { slug: 'c', method: 'copy_link' } },
    { type: 'export_clicked',        properties: { slug: 'c', format: 'print' } },
    { type: 'favorite_added',        properties: { slug: 'c' } },
    { type: 'favorite_removed',      properties: { slug: 'c' } },
    { type: 'history_restored',      properties: { slug: 'c', entryId: 'abc' } },
    { type: 'history_cleared',       properties: { slug: 'c' } },
  ];

  for (const event of events) {
    it(`can track "${event.type}" events`, () => {
      const plugin: AnalyticsPlugin = vi.fn();
      registerPlugin(plugin);
      expect(() => track(event)).not.toThrow();
      expect(plugin).toHaveBeenCalledWith(event);
      clearPlugins();
    });
  }
});
