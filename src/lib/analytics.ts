/**
 * WindowMetrics — Analytics Abstraction Layer
 *
 * Provides a vendor-agnostic event tracking system.
 *
 * Architecture:
 *   - All events are defined as a discriminated union (AnalyticsEvent)
 *   - `track()` dispatches a custom DOM event (`wm:analytics`) AND calls
 *     every registered plugin synchronously
 *   - `registerPlugin()` lets pages wire up GA4, Plausible, Fathom, etc.
 *     without touching the core modules
 *   - `onAnalyticsEvent()` lets any code observe events (useful for debugging)
 *
 * To integrate with Google Analytics 4:
 *   registerPlugin((event) => {
 *     gtag('event', event.type, event.properties);
 *   });
 *
 * No vendor SDKs are bundled. No network requests are made here.
 */

// ─────────────────────────────────────────────────────────────────────────────
// Event definitions
// ─────────────────────────────────────────────────────────────────────────────

/** All events that the WindowMetrics platform can emit. */
export type AnalyticsEvent =
  | {
      type: 'calculation_completed';
      properties: {
        slug: string;
        unit: string;
        inputs: Record<string, string>;
      };
    }
  | {
      type: 'unit_changed';
      properties: { slug: string; from: string; to: string };
    }
  | {
      type: 'share_clicked';
      properties: {
        slug: string;
        method: 'copy_link' | 'copy_summary' | 'native_share';
      };
    }
  | {
      type: 'export_clicked';
      properties: {
        slug: string;
        format: 'print' | 'pdf' | 'copy' | 'json';
      };
    }
  | {
      type: 'favorite_added';
      properties: { slug: string };
    }
  | {
      type: 'favorite_removed';
      properties: { slug: string };
    }
  | {
      type: 'history_restored';
      properties: { slug: string; entryId: string };
    }
  | {
      type: 'history_cleared';
      properties: { slug: string };
    };

// ─────────────────────────────────────────────────────────────────────────────
// Plugin registry
// ─────────────────────────────────────────────────────────────────────────────

/** A function that receives an analytics event and forwards it to a provider. */
export type AnalyticsPlugin = (event: AnalyticsEvent) => void;

const _plugins: AnalyticsPlugin[] = [];

/**
 * Register a plugin to receive all analytics events.
 * Can be called multiple times to register multiple providers.
 *
 * @param plugin  Function that forwards the event to an analytics provider
 *
 * @example
 * registerPlugin((event) => gtag('event', event.type, event.properties));
 */
export function registerPlugin(plugin: AnalyticsPlugin): void {
  _plugins.push(plugin);
}

/**
 * Remove all registered plugins.
 * Useful in tests to reset state between test cases.
 */
export function clearPlugins(): void {
  _plugins.length = 0;
}

// ─────────────────────────────────────────────────────────────────────────────
// Track
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Track an analytics event.
 *
 * 1. Dispatches a `wm:analytics` CustomEvent on `window` (for observers)
 * 2. Calls each registered plugin synchronously
 *
 * Safe to call from any context — no-ops gracefully if `window` is undefined.
 *
 * @param event  The analytics event to emit
 */
export function track(event: AnalyticsEvent): void {
  // Broadcast via DOM for any listener (e.g. debug overlay, tag managers)
  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent('wm:analytics', { detail: event, bubbles: false }),
    );
  }

  // Call all registered plugins
  for (const plugin of _plugins) {
    try {
      plugin(event);
    } catch (err) {
      console.error('[Analytics] Plugin error:', err);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// Observe
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Subscribe to all analytics events via the DOM event system.
 * Returns a cleanup function that removes the listener.
 *
 * @param handler  Callback that receives each event
 * @returns        Unsubscribe function
 *
 * @example
 * const unsubscribe = onAnalyticsEvent((event) => console.log(event));
 * // Later:
 * unsubscribe();
 */
export function onAnalyticsEvent(handler: AnalyticsPlugin): () => void {
  if (typeof window === 'undefined') return () => {};

  const listener = (e: Event) => {
    handler((e as CustomEvent<AnalyticsEvent>).detail);
  };

  window.addEventListener('wm:analytics', listener);
  return () => window.removeEventListener('wm:analytics', listener);
}
