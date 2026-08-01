/**
 * WindowMetrics — Calculator UI Helpers
 *
 * Reusable DOM orchestration helpers used by every calculator page.
 * Each calculator declares a CalculatorUIRefs object pointing at its
 * specific DOM elements, then delegates all error/warning/empty-state
 * management to these shared functions.
 *
 * Accessibility: showCalculatorError / clearCalculatorError manage
 * aria-invalid and aria-describedby automatically so screen readers
 * announce field-level errors.
 *
 * No engine dependencies — this module only interacts with the DOM.
 */

// ---------------------------------------------------------------------------
// DOM reference contract
// ---------------------------------------------------------------------------

/**
 * The set of DOM elements that every calculator page must provide.
 * Passed to every state-management function so the helpers remain reusable
 * across different calculator pages that use different element IDs.
 */
export interface CalculatorUIRefs {
  /** Element that shows the error/warning message text */
  errorEl: HTMLElement;
  /** The empty-state placeholder panel (shown when no valid input exists) */
  resultsEmpty: HTMLElement;
  /** The results grid (hidden when input is invalid) */
  resultsGrid: HTMLElement;
  /** The recommendations section (hidden when input is invalid); may be null */
  recSection: HTMLElement | null;
  /** The width input — receives aria-invalid on width errors */
  widthInput: HTMLInputElement | null;
  /** The height input — receives aria-invalid on height errors */
  heightInput: HTMLInputElement | null;
}

// ---------------------------------------------------------------------------
// Generic DOM helpers
// ---------------------------------------------------------------------------

/**
 * Write a value and optional unit label into a ResultCard component.
 * Targets the `.result-value-text` and `.result-unit` descendants.
 *
 * @param el    The ResultCard container element (or null — safe no-op)
 * @param value Formatted number string
 * @param unit  Unit suffix string (empty string to clear)
 */
export function setResult(
  el: HTMLElement | null,
  value: string,
  unit = '',
): void {
  if (!el) return;
  const valueEl = el.querySelector('.result-value-text') as HTMLElement | null;
  const unitEl  = el.querySelector('.result-unit')       as HTMLElement | null;
  if (valueEl) valueEl.textContent = value;
  if (unitEl)  unitEl.textContent  = unit;
}

/**
 * Set the text content of any element by its ID.
 * Safe no-op when the element is not found.
 *
 * @param id    DOM element id
 * @param text  Text to set
 */
export function setText(id: string, text: string): void {
  const el = document.getElementById(id);
  if (el) el.textContent = text;
}

// ---------------------------------------------------------------------------
// Error / warning state management
// ---------------------------------------------------------------------------

/**
 * Transition the calculator into a blocking error state:
 * - Displays the error message in the error banner
 * - Shows the "Fix your input" empty-state placeholder
 * - Hides the results grid and recommendations section
 * - Marks the offending input with aria-invalid="true"
 * - Extends the input's aria-describedby to include the error element ID
 *
 * @param refs    DOM references for this calculator
 * @param message Human-readable error message to display
 * @param field   Which input triggered the error ('width' | 'height' | undefined)
 */
export function showCalculatorError(
  refs: CalculatorUIRefs,
  message: string,
  field?: 'width' | 'height',
): void {
  refs.errorEl.textContent = message;
  delete refs.errorEl.dataset.level;

  // Reset ARIA on both inputs first
  _clearInputAria(refs);

  // Apply ARIA to the offending field
  if (field === 'width' && refs.widthInput) {
    refs.widthInput.setAttribute('aria-invalid', 'true');
    const current = refs.widthInput.getAttribute('aria-describedby') ?? '';
    if (!current.includes('calc-error')) {
      refs.widthInput.setAttribute('aria-describedby', `${current} calc-error`.trim());
    }
  }
  if (field === 'height' && refs.heightInput) {
    refs.heightInput.setAttribute('aria-invalid', 'true');
    const current = refs.heightInput.getAttribute('aria-describedby') ?? '';
    if (!current.includes('calc-error')) {
      refs.heightInput.setAttribute('aria-describedby', `${current} calc-error`.trim());
    }
  }

  // Update empty state copy
  const titleEl = refs.resultsEmpty.querySelector('.empty-title') as HTMLElement | null;
  const subEl   = refs.resultsEmpty.querySelector('.empty-sub')   as HTMLElement | null;
  if (titleEl) titleEl.textContent = 'Fix your input';
  if (subEl)   subEl.textContent   = 'Fix the highlighted measurement(s) to see calculations.';

  // Show placeholder, hide results
  refs.resultsEmpty.hidden = false;
  refs.resultsGrid.hidden  = true;
  if (refs.recSection) refs.recSection.hidden = true;
}

/**
 * Show a non-blocking advisory warning.
 * The error banner is updated with a `data-level="warn"` marker that CSS
 * can style differently from hard errors. Calculations continue to run.
 *
 * @param refs    DOM references for this calculator
 * @param message Advisory message text
 */
export function showCalculatorWarning(
  refs: CalculatorUIRefs,
  message: string,
): void {
  refs.errorEl.textContent = message;
  refs.errorEl.dataset.level = 'warn';
}

/**
 * Clear all error and ARIA states — called at the start of every calculation
 * cycle before re-evaluating the inputs.
 *
 * @param refs  DOM references for this calculator
 */
export function clearCalculatorError(refs: CalculatorUIRefs): void {
  refs.errorEl.textContent = '';
  refs.errorEl.removeAttribute('data-level');
  _clearInputAria(refs);
}

/**
 * Reset the empty-state placeholder back to its default "Enter dimensions"
 * neutral copy. Called when both fields are empty (no error, no results).
 *
 * @param refs  DOM references for this calculator
 */
export function resetCalculatorEmpty(refs: CalculatorUIRefs): void {
  const titleEl = refs.resultsEmpty.querySelector('.empty-title') as HTMLElement | null;
  const subEl   = refs.resultsEmpty.querySelector('.empty-sub')   as HTMLElement | null;
  if (titleEl) titleEl.textContent = 'Enter dimensions';
  if (subEl)   subEl.textContent   = 'Results will appear here as you type';
}

// ---------------------------------------------------------------------------
// Private helpers
// ---------------------------------------------------------------------------

/**
 * Remove aria-invalid from both inputs and restore their aria-describedby
 * to the hint-only value (removing the calc-error reference).
 */
function _clearInputAria(refs: CalculatorUIRefs): void {
  if (refs.widthInput) {
    refs.widthInput.removeAttribute('aria-invalid');
    refs.widthInput.setAttribute('aria-describedby', 'input-width-hint');
  }
  if (refs.heightInput) {
    refs.heightInput.removeAttribute('aria-invalid');
    refs.heightInput.setAttribute('aria-describedby', 'input-height-hint');
  }
}
