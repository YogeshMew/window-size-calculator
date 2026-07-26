# WindowMetrics Shared Calculation Engine

## Goal

All calculators must share a single reusable calculation engine.

Never duplicate business logic.

Every calculation should exist in one place and be imported where required.

---

# Universal Measurement Engine

Internally store every dimension in millimeters.

UI may display:

- mm
- cm
- m
- inches
- feet

but calculations should always use millimeters.

---

# Shared Calculation Modules

Create reusable functions.

calculateArea()

calculatePerimeter()

calculateGlassArea()

calculateFrameArea()

calculateAspectRatio()

calculateClassification()

calculateNearestStandardSize()

calculateReplacementSize()

calculateRoughOpening()

calculateCurtainRecommendation()

calculateBlindRecommendation()

calculateGlassWeight()

calculateWindowACFit()

calculateBTU()

calculateEgress()

calculateCostEstimate()

calculateFilmArea()

calculateTrimLength()

Future calculators should never rewrite existing logic.

---

# Calculation Pipeline

Input

↓

Normalize units

↓

Validation

↓

Core calculations

↓

Recommendations

↓

Decision Engine

↓

Output Formatting

↓

SEO Content Generation

---

# Validation Engine

Check

negative values

zero values

impossible dimensions

incorrect fractions

unit mismatch

invalid combinations

Display friendly messages.

Never show technical errors.

---

# Decision Engine

Every calculator should answer

What is the result?

↓

What does it mean?

↓

Is it good?

↓

Should it be replaced?

↓

Nearest standard size?

↓

Recommended next calculator?

↓

Recommended guide?

↓

Suggested products?

The engine should guide users rather than stop after producing a number.

---

# Future Expansion

Support

Country-specific calculations

Building codes

Manufacturer rules

Project mode

Contractor mode

AI photo measurements