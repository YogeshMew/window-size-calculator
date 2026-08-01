/**
 * WindowMetrics — Export Module
 *
 * Provides four export strategies:
 *   1. Print / Save as PDF — opens the browser print dialog (PDF via print driver)
 *   2. Copy results — copies a plain-text summary to the clipboard
 *   3. Download JSON — downloads a structured JSON file of the result data
 *
 * Future calculators use this module without modification by passing their
 * own data and field labels.
 *
 * All functions are SSR-safe.
 */

import { copyToClipboard, buildSummary } from './share.js';
export { buildSummary } from './share.js';


// ─────────────────────────────────────────────────────────────────────────────
// Print / PDF
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Open the browser print dialog.
 * When the user selects "Save as PDF" in the dialog, the page is saved as a PDF.
 * Relies on the page having appropriate `@media print` CSS to hide non-essential UI.
 */
export function printPage(): void {
  if (typeof window === 'undefined') return;
  window.print();
}

// ─────────────────────────────────────────────────────────────────────────────
// Copy results
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Copy calculation results as a plain-text summary to the clipboard.
 *
 * @param title   Calculator name (e.g. "Window Size Calculator")
 * @param fields  Ordered [label, value] pairs for each result
 * @param url     Optional shareable URL appended at the end
 * @returns       `true` on clipboard success
 */
export async function copyResults(
  title: string,
  fields: [string, string][],
  url?: string,
): Promise<boolean> {
  const text = buildSummary(title, fields, url);
  return copyToClipboard(text);
}

// ─────────────────────────────────────────────────────────────────────────────
// JSON download
// ─────────────────────────────────────────────────────────────────────────────

/** Payload shape for downloadJSON. */
export interface ExportPayload {
  /** Calculator slug */
  calculator: string;
  /** ISO timestamp of when the export was created */
  exportedAt: string;
  /** Captured input values */
  inputs: Record<string, string>;
  /** Calculated result values */
  results: Record<string, string | number>;
}

/**
 * Trigger a browser download of the result data as a JSON file.
 *
 * @param payload   Structured export data
 * @param filename  Output filename (without extension); defaults to the calculator slug
 */
export function downloadJSON(payload: ExportPayload, filename?: string): void {
  if (typeof document === 'undefined') return;

  const json = JSON.stringify(payload, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href     = url;
  link.download = `${filename ?? payload.calculator}.json`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Build an ExportPayload from raw inputs and results.
 *
 * @param calculator  Calculator slug
 * @param inputs      Snapshot of input values
 * @param results     Snapshot of result values
 */
export function buildExportPayload(
  calculator: string,
  inputs: Record<string, string>,
  results: Record<string, string | number>,
): ExportPayload {
  return {
    calculator,
    exportedAt: new Date().toISOString(),
    inputs,
    results,
  };
}
