# Building a New Calculator — Developer Guide

Everything you need to add a calculator to WindowMetrics in under an hour.

---

## Table of contents

1. [Folder structure](#1-folder-structure)
2. [Step-by-step walkthrough](#2-step-by-step-walkthrough)
3. [Calculator registry](#3-calculator-registry)
4. [Shared components](#4-shared-components)
5. [Engine API reference](#5-engine-api-reference)
6. [Utility API reference](#6-utility-api-reference)
7. [Shared types and constants](#7-shared-types-and-constants)
8. [Testing requirements](#8-testing-requirements)
9. [Checklist](#9-checklist)

---

## 1. Folder structure

```
src/
├── pages/
│   └── tools/
│       └── my-calculator.astro          ← Your calculator page (route)
│
├── engine/                              ← Shared calculation engine (do not duplicate logic here)
│   ├── units.ts                         ← normalizeInput, toMm, fromMm, formatDimension, formatArea
│   ├── validation.ts                    ← validateDimension, validateDimensions
│   ├── calculations.ts                  ← calculateArea, calculatePerimeter, calculateAspectRatio
│   ├── standards.ts                     ← findNearestStandardSize
│   ├── recommendations.ts               ← calculateCurtainRecommendations, calculateBlindRecommendations, etc.
│   ├── format.ts                        ← formatDifference, formatDistance, formatWeight, formatCeil
│   └── index.ts                         ← barrel file — import everything from here
│
├── utils/
│   ├── display.ts                       ← fmtVal, fmtInput, maxLimitLabel  (UI formatting)
│   └── calculator-ui.ts                 ← CalculatorUIRefs, setResult, showCalculatorError, etc.
│
├── constants/
│   └── index.ts                         ← MIN_DIMENSION_MM, MAX_DIMENSION_MM, advisory thresholds
│
├── components/
│   └── calculator/
│       ├── CalculatorLayout.astro        ← Two-panel dashboard layout  ← USE THIS
│       ├── EmptyState.astro              ← Empty / invalid state panel
│       ├── WarningBanner.astro           ← Error / advisory banner
│       ├── RecommendationCard.astro      ← Smart recommendation block
│       ├── RelatedTools.astro            ← Sidebar related-tools widget
│       ├── MeasurementInput.astro        ← Labeled input with ARIA pre-wired
│       ├── ValidationMessage.astro       ← Per-field inline validation
│       ├── InputCard.astro               ← Card wrapper for any form field
│       ├── UnitSelector.astro            ← Unit toggle (in / ft / mm / cm / m)
│       ├── ResultCard.astro              ← Single result metric display
│       └── SectionHeading.astro          ← Titled section with optional subtitle
│
├── data/
│   └── tools.ts                         ← Calculator registry — add your entry here
│
├── types/
│   ├── calculator.ts                    ← MeasurementUnit, ValidationResult, WarningMessage, …
│   └── content.ts                       ← Tool, Category, FAQ, NavigationItem, …
│
└── layouts/
    └── ToolLayout.astro                 ← Page layout with sidebar, breadcrumbs, SEO
```

---

## 2. Step-by-step walkthrough

### Step 1 — Register the calculator

Add an entry to `src/data/tools.ts` inside the `TOOLS` array:

```typescript
{
  slug: 'my-calculator',
  title: 'My Calculator',
  description: 'Short description for cards and meta tags.',
  longDescription: 'Longer description shown on tool detail pages.',
  category: 'measurement',          // see ToolCategory in src/types/content.ts
  href: '/tools/my-calculator',
  icon: 'Ruler',                    // Lucide icon name
  status: 'live',
  relatedSlugs: ['window-size-calculator'],
  keywords: ['keyword one', 'keyword two'],
  useCases: ['Replacement', 'Curtains'],
  benefits: ['Instant results', 'All units'],
},
```

The registry powers: navigation, related-tools sidebar, sitemap, and SEO.

### Step 2 — Create the page file

```
src/pages/tools/my-calculator.astro
```

Minimum frontmatter:

```astro
---
import ToolLayout from '@/layouts/ToolLayout.astro';
import CalculatorLayout from '@/components/calculator/CalculatorLayout.astro';
import UnitSelector from '@/components/calculator/UnitSelector.astro';
import MeasurementInput from '@/components/calculator/MeasurementInput.astro';
import WarningBanner from '@/components/calculator/WarningBanner.astro';
import EmptyState from '@/components/calculator/EmptyState.astro';
import ResultCard from '@/components/calculator/ResultCard.astro';
import RecommendationCard from '@/components/calculator/RecommendationCard.astro';
import RelatedTools from '@/components/calculator/RelatedTools.astro';

import { getToolBySlug, getRelatedTools } from '@/data/tools.js';
import type { BreadcrumbItem } from '@/types/calculator.js';

const tool = getToolBySlug('my-calculator')!;
const related = getRelatedTools('my-calculator');

const breadcrumbs: BreadcrumbItem[] = [
  { label: 'Home', href: '/' },
  { label: 'Tools', href: '/tools' },
  { label: tool.title, href: tool.href, current: true },
];
---
```

### Step 3 — Build the HTML using shared components

```astro
<ToolLayout tool={tool} breadcrumbs={breadcrumbs}>

  <CalculatorLayout
    inputsLabel="Dimensions"
    inputsHint="All units supported"
    resultsLabel="Results"
    resultsHintId="results-unit-display"
  >
    <!-- Left panel -->
    <Fragment slot="inputs">
      <div class="unit-row">
        <span class="unit-row-label">Unit</span>
        <UnitSelector selected="in" id="unit-selector" name="unit" />
      </div>
      <MeasurementInput id="input-width" label="Width" hint="e.g. 36 or 36 1/2" placeholder="36" required />
      <MeasurementInput id="input-height" label="Height" hint="e.g. 48 or 48 3/8" placeholder="48" required />
      <WarningBanner />
    </Fragment>

    <!-- Right panel -->
    <Fragment slot="results">
      <EmptyState />
      <div id="results-grid" hidden>
        <ResultCard id="result-area" label="Area" value="—" unit="" highlight />
      </div>
    </Fragment>

    <Fragment slot="recommendations">
      <div id="rec-section" hidden>
        <RecommendationCard label="Next step">
          <!-- inner content here -->
        </RecommendationCard>
      </div>
    </Fragment>
  </CalculatorLayout>

  <!-- Sidebar -->
  <RelatedTools
    slot="sidebar"
    heading="Related calculators"
    links={related.map(t => ({ title: t.title, description: t.description, href: t.href }))}
  />

</ToolLayout>
```

### Step 4 — Write the calculator script

Add a `<script>` block after `</ToolLayout>`:

```typescript
import {
  normalizeInput, toMm, validateDimensions, calculateArea, formatArea,
} from '@/engine/index.js';
import { fmtVal } from '@/utils/display.js';
import {
  type CalculatorUIRefs, setResult, showCalculatorError,
  clearCalculatorError, resetCalculatorEmpty,
} from '@/utils/calculator-ui.js';
import type { MeasurementUnit } from '@/types/calculator.js';

let currentUnit: MeasurementUnit = 'in';

const widthInput   = document.getElementById('input-width')   as HTMLInputElement;
const heightInput  = document.getElementById('input-height')  as HTMLInputElement;
const errorMsg     = document.getElementById('calc-error')    as HTMLElement;
const resultsEmpty = document.getElementById('results-empty') as HTMLElement;
const resultsGrid  = document.getElementById('results-grid')  as HTMLElement;

const refs: CalculatorUIRefs = { errorEl: errorMsg, resultsEmpty, resultsGrid, recSection: null, widthInput, heightInput };

function calculate() {
  const rawW = widthInput.value.trim();
  const rawH = heightInput.value.trim();

  clearCalculatorError(refs);

  if (!rawW || !rawH) { resetCalculatorEmpty(refs); return; }

  const w = normalizeInput(rawW, currentUnit);
  const h = normalizeInput(rawH, currentUnit);
  if (w === null) { showCalculatorError(refs, `"${rawW}" is not a valid width.`, 'width'); return; }
  if (h === null) { showCalculatorError(refs, `"${rawH}" is not a valid height.`, 'height'); return; }

  const wMm = toMm(w, currentUnit);
  const hMm = toMm(h, currentUnit);
  const validation = validateDimensions(wMm, hMm);
  if (!validation.valid && validation.level !== 'warning') {
    showCalculatorError(refs, validation.message ?? 'Invalid dimensions.', validation.field as 'width' | 'height' | undefined);
    return;
  }

  const areaMm2 = calculateArea(wMm, hMm);
  setResult(document.getElementById('result-area'), formatArea(areaMm2, currentUnit));

  resultsEmpty.hidden = true;
  resultsGrid.hidden  = false;
}

widthInput.addEventListener('input', calculate);
heightInput.addEventListener('input', calculate);

document.getElementById('unit-selector')?.addEventListener('unitchange', (e) => {
  currentUnit = (e as CustomEvent<{ unit: MeasurementUnit }>).detail.unit;
  calculate();
});

calculate();
```

### Step 5 — Add tests

Create `src/engine/__tests__/my-calculator.test.ts` for any custom engine logic.
Do NOT test the Astro page itself — test pure functions only.

```typescript
import { describe, it, expect } from 'vitest';
import { myCustomFunction } from '@/engine/my-module.js';

describe('myCustomFunction', () => {
  it('returns the expected result', () => {
    expect(myCustomFunction(100, 200)).toBe(20_000);
  });
});
```

Run: `npx vitest run`

---

## 3. Calculator registry

**File:** `src/data/tools.ts`

| Function | Returns | Use for |
|---|---|---|
| `getToolBySlug(slug)` | `Tool \| undefined` | Load current page's metadata |
| `getRelatedTools(slug)` | `Tool[]` | Populate RelatedTools sidebar |
| `getToolsByCategory(cat)` | `Tool[]` | Category pages |
| `getAllTools()` | `Tool[]` | Sitemap, search |
| `getLiveTools()` | `Tool[]` | Navigation, index pages |

All tools are typed with the `Tool` interface from `src/types/content.ts`.

---

## 4. Shared components

### `CalculatorLayout.astro`
Two-panel dashboard (inputs left, results right). Use for every new calculator.

| Prop | Type | Default | Description |
|---|---|---|---|
| `inputsLabel` | `string` | `'Dimensions'` | Left panel heading |
| `inputsHint` | `string` | `'All units supported'` | Left panel subheading |
| `resultsLabel` | `string` | `'Results'` | Right panel heading |
| `resultsHintId` | `string` | `'results-unit-display'` | ID for JS to write current unit |

**Slots:** `inputs`, `guide`, `results`, `recommendations`

---

### `EmptyState.astro`
Placeholder shown before any input is entered.

| Prop | Type | Default |
|---|---|---|
| `id` | `string` | `'results-empty'` |
| `title` | `string` | `'Enter dimensions'` |
| `sub` | `string` | `'Results will appear here as you type'` |
| `icon` | `'window' \| 'ruler' \| 'search'` | `'window'` |

---

### `WarningBanner.astro`
Error and warning banner. Populated entirely by JS — renders empty by default.

| Prop | Type | Default |
|---|---|---|
| `id` | `string` | `'calc-error'` |

JS API (from `src/utils/calculator-ui.ts`):
- `showCalculatorError(refs, message, field?)` — red state, hides results
- `showCalculatorWarning(refs, message)` — amber state, results remain visible
- `clearCalculatorError(refs)` — clears message and styling

---

### `MeasurementInput.astro`
Full labeled input field with ARIA pre-wired.

| Prop | Type | Required |
|---|---|---|
| `id` | `string` | yes |
| `label` | `string` | yes |
| `hint` | `string` | no |
| `placeholder` | `string` | no |
| `unit` | `string` | no — shows suffix inside field |
| `error` | `string` | no — marks field `aria-invalid` |
| `required` | `boolean` | no |

---

### `ResultCard.astro`
Single metric display card.

| Prop | Type | Description |
|---|---|---|
| `id` | `string` | JS uses this to update value |
| `label` | `string` | Metric name |
| `value` | `string` | Initial value (default: `'—'`) |
| `unit` | `string` | Unit suffix |
| `sublabel` | `string` | Secondary note |
| `highlight` | `boolean` | Primary metric styling |
| `usedFor` | `string[]` | Chip tags |

---

### `RecommendationCard.astro`
A block inside the "Smart recommendations" section.

| Prop | Type | Description |
|---|---|---|
| `label` | `string` | Section label (mono uppercase) |
| `badgeId` | `string` | ID for JS-populated badge span |
| `noteId` | `string` | ID for JS-updated footer note |
| `noteText` | `string` | Static footer note text |
| `variant` | `'default' \| 'next-step'` | Layout variant |

**Slots:** `badge` (optional header badge), default (inner content), `note` (optional footer)

---

### `RelatedTools.astro`
Sidebar related-tools widget.

| Prop | Type | Description |
|---|---|---|
| `heading` | `string` | Section heading |
| `links` | `ToolLink[]` | Array of `{ title, description, href, ariaLabel? }` |
| `tip` | `{ label, text }` | Optional "Pro tip" card |
| `guide` | `{ label, href, text }` | Optional guide link |

---

### `UnitSelector.astro`
Unit toggle button group. Dispatches `CustomEvent<{ unit: MeasurementUnit }>` on `unitchange`.

```typescript
document.getElementById('unit-selector')?.addEventListener('unitchange', (e) => {
  currentUnit = (e as CustomEvent<{ unit: MeasurementUnit }>).detail.unit;
  calculate();
});
```

---

### `ValidationMessage.astro`
Per-field inline validation message (decoupled from WarningBanner).

| Prop | Type | Default |
|---|---|---|
| `id` | `string` | — |
| `message` | `string` | — |
| `level` | `'error' \| 'warning' \| 'info' \| 'success'` | `'error'` |

---

## 5. Engine API reference

**Import everything from `@/engine/index.js`.**

### Parsing & conversion

| Function | Signature | Description |
|---|---|---|
| `normalizeInput` | `(raw: string, unit: MeasurementUnit) => number \| null` | Strict whitelist parser. Returns `null` for invalid input. Always call this first. |
| `toMm` | `(value: number, unit: MeasurementUnit) => number` | Convert display-unit value to mm |
| `fromMm` | `(mm: number, unit: MeasurementUnit) => number` | Convert mm to display-unit value |
| `convertUnits` | `(value: number, from: MeasurementUnit, to: MeasurementUnit) => number` | Direct unit conversion |

### Validation

| Function | Signature | Description |
|---|---|---|
| `validateDimension` | `(mm: number, field?: string) => ValidationResult` | Validate a single dimension in mm |
| `validateDimensions` | `(wMm: number, hMm: number) => ValidationResult` | Validate both dimensions; checks aspect ratio and returns `level: 'warning'` for extremes |

`ValidationResult.level`:
- `'error'` → block calculations, hide results
- `'warning'` → show advisory, continue calculating

### Calculations

| Function | Signature | Description |
|---|---|---|
| `calculateArea` | `(wMm, hMm) => number` | Area in mm² |
| `calculatePerimeter` | `(wMm, hMm) => number` | Perimeter in mm |
| `calculateDiagonal` | `(wMm, hMm) => number` | Diagonal in mm |
| `calculateAspectRatio` | `(wMm, hMm) => string` | Human-readable ratio (e.g. `"16:9"`, `"1.33:1"`) |
| `calculateGlassArea` | `(wMm, hMm, spec?) => GlassResult` | Glazing area and cutting waste |
| `calculateGlassWeight` | `(wMm, hMm, spec?) => GlassResult` | Glass weight in kg and lbs |

### Standard sizes

| Function | Signature | Description |
|---|---|---|
| `findNearestStandardSize` | `(wMm, hMm, region?) => StandardSizeResult` | Nearest catalogued size. Region: `'US' \| 'UK' \| 'CA' \| 'AU' \| 'EU'` |

### Recommendations

| Function | Signature | Description |
|---|---|---|
| `calculateCurtainRecommendations` | `(wMm, hMm) => CurtainRecommendation` | Curtain widths, drop, rod length |
| `calculateBlindRecommendations` | `(wMm, hMm) => BlindRecommendation` | Inside and outside mount sizing |
| `calculateACBTURecommendation` | `(wMm, hMm) => ACBTUResult` | BTU range and fit check |
| `generateReplacementRecommendation` | `(wMm, hMm, region?) => ReplacementRecommendation` | Rough opening and standard match |

### Formatting

| Function | Description |
|---|---|
| `formatArea(mm2, unit)` | Area with unit label, e.g. `"690 sq ft"` |
| `formatDimension(mm, unit)` | Dimension with unit suffix, e.g. `"36"` or `"914 mm"` |
| `formatDifference(diffIn, unit)` | Signed difference or `"exact"`, in display unit |
| `formatDistance(distIn, unit)` | Unsigned distance in display unit |
| `formatWeight(kg, lbs, unit)` | Weight in kg or lbs based on unit |
| `formatCeil(mm, unit)` | Ceiling-rounded value for allowances |
| `curtainAllowanceLabel(unit)` | Headrail allowance label string |

---

## 6. Utility API reference

### `src/utils/display.ts` — UI formatting

| Function | Description |
|---|---|
| `fmtVal(mm, unit)` | Format a mm value in the display unit, with unit-appropriate decimal precision |
| `fmtInput(mm, unit)` | Format a mm value for prefilling an `<input>` (stripped trailing zeros) |
| `maxLimitLabel(maxMm, unit)` | Format a max-dimension limit for error messages |

### `src/utils/calculator-ui.ts` — DOM orchestration

```typescript
interface CalculatorUIRefs {
  errorEl:      HTMLElement;
  resultsEmpty: HTMLElement;
  resultsGrid:  HTMLElement;
  recSection:   HTMLElement | null;
  widthInput:   HTMLInputElement | null;
  heightInput:  HTMLInputElement | null;
}
```

| Function | Description |
|---|---|
| `setResult(el, value, unit?)` | Write value into `.result-value-text` and `.result-unit` inside `el` |
| `setText(id, text)` | Set `textContent` of element by ID |
| `showCalculatorError(refs, message, field?)` | Show error banner, mark input `aria-invalid`, hide results |
| `showCalculatorWarning(refs, message)` | Show amber warning banner, keep results visible |
| `clearCalculatorError(refs)` | Clear banner, remove `aria-invalid` |
| `resetCalculatorEmpty(refs)` | Reset all result fields to `'—'` |

---

## 7. Shared types and constants

### Types (`src/types/calculator.ts`)

Key types for calculator pages:

```typescript
type MeasurementUnit = 'mm' | 'cm' | 'm' | 'in' | 'ft';

interface ValidationResult {
  valid: boolean;
  message?: string;
  field?: 'width' | 'height' | 'unit' | 'general';
  level?: 'error' | 'warning';
}

interface WarningMessage {
  message: string;
  level: 'info' | 'warning' | 'error' | 'success';
  blocking: boolean;
  title?: string;
}
```

Content types for the registry are in `src/types/content.ts` (`Tool`, `Category`, `FAQ`).

### Constants (`src/constants/index.ts`)

```typescript
import {
  MIN_DIMENSION_MM,        // 25 mm — absolute minimum
  MAX_DIMENSION_MM,        // 9,144 mm — 30 feet
  LARGE_WINDOW_ADVISORY_MM, // 3,048 mm — 10 feet advisory threshold
  SMALL_WINDOW_ADVISORY_MM, // 152 mm — 6 inches advisory threshold
  CURTAIN_OVERLAP_RATIO_MIN,  // 1.5
  CURTAIN_OVERLAP_RATIO_FULL, // 2.0
} from '@/constants/index.js';
```

---

## 8. Testing requirements

### What to test

- All custom engine functions (pure functions only)
- Unit-conversion edge cases
- Validation boundary conditions
- Recommendation calculations

### What NOT to test

- Astro component rendering (no DOM access in Vitest)
- CSS output
- Functions already covered by existing tests

### Where to put tests

```
src/engine/__tests__/my-module.test.ts
```

### Running tests

```powershell
npx vitest run           # run once
npx vitest               # watch mode
npx vitest run --reporter=verbose  # detailed output
```

All 226 existing tests must continue passing after any change.

---

## 9. Checklist

Use this before marking a calculator as `status: 'live'`:

- [ ] Entry added to `src/data/tools.ts` with all required fields
- [ ] Page file created at `src/pages/tools/[slug].astro`
- [ ] `ToolLayout` used with `tool`, `breadcrumbs` props
- [ ] `CalculatorLayout` used for the two-panel dashboard
- [ ] `UnitSelector` dispatching `unitchange` events handled in script
- [ ] `normalizeInput` called before any validation or calculation
- [ ] `validateDimensions` used; `level: 'warning'` allows calculations to continue
- [ ] `WarningBanner` used for errors and warnings
- [ ] `EmptyState` shown when inputs are empty
- [ ] `ResultCard` used for each output metric
- [ ] `RelatedTools` in the sidebar slot populated with related slugs
- [ ] All engine calculations return identical results to any prior implementation
- [ ] Tests written and passing for custom engine logic
- [ ] `npx vitest run` passes all 226+ tests with zero failures
