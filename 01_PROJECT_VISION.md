BUILD PROMPT — WINDOWMETRICS.COM
ROLE

You are a Senior Product Designer, UX Designer, AstroJS Expert, SEO Architect, Frontend Engineer, Information Architect, and Technical Content Writer.

Your goal is NOT to build another calculator website.

Your goal is to build the internet's best platform for everything related to window measurements, dimensions, sizes, replacement planning, glass calculations, coverings, installation planning, and window buying decisions.

Think long-term.

We're building a company—not a single tool.

Every design, architecture, and technical decision should support a website that can eventually grow into 100+ highly interconnected tools and guides while maintaining excellent Core Web Vitals and topical authority.

IMPORTANT

Use:

astro-docs MCP
tailwind-4-docs skill
web-design-guidelines skill
@DESIGN.md

Follow Astro best practices.

Use modern Astro architecture.

Follow Tailwind v4 conventions.

Do not generate generic code.

WEBSITE

Brand

WindowMetrics

Domain

windowmetrics.com

Tagline

Measure.
Calculate.
Replace.
Everything about windows.

MISSION

Help homeowners, DIY users, contractors, architects, installers, builders, and interior designers accurately measure windows and make better decisions without visiting multiple websites.

Today users search separately for:

Standard window sizes
Window size chart
Window dimensions
Average window size
Window measurements
How to measure a window
Replacement window size
Window glass size
Window area
Window opening size
Curtain size
Blind size
Window AC size
Window weight
Window replacement cost

Each search sends them to different websites.

WindowMetrics should become the single platform that solves the entire workflow.

PRODUCT PHILOSOPHY

Do NOT build isolated calculators.

Build Decision Engines.

Every tool should answer:

What is my result?
What does it mean?
Is it good or bad?
What should I do next?
Which standard size is closest?
What products or calculations should I perform next?

Every tool should naturally lead users into the next relevant tool.

Instead of calculators,

Build workflows.

PROBLEM WE SOLVE

Current competitors calculate numbers.

We guide decisions.

Example:

Instead of

Area = 12 sq ft

WindowMetrics should output

✓ Area

✓ Perimeter

✓ Glass Area

✓ Nearest Standard Window Size

✓ Replacement Recommendation

✓ Rough Opening Size

✓ Curtain Recommendation

✓ Blind Recommendation

✓ Estimated Glass Weight

✓ Window Classification

✓ Aspect Ratio Analysis

✓ Egress Check (if applicable)

✓ Print Report

✓ Share URL

✓ Related Calculators

✓ Measurement Guide

TECH STACK

AstroJS

Tailwind CSS v4

TypeScript

MPA (Multi Page Application)

Static Generation wherever possible

Minimal client-side JavaScript

Progressive enhancement

Accessibility (WCAG AA)

Core Web Vitals optimized

Dark Mode

JSON-LD

Schema.org

SEO-first

Reusable architecture

DESIGN

Follow @DESIGN.md.

Visual style should feel similar in quality to Vercel:

Minimal
Professional
Clean
Spacious
Trustworthy
Excellent typography
Neutral color palette
Rounded cards
Soft shadows
No unnecessary gradients
High readability
Mobile-first
Extremely fast

Do NOT copy competitor UI.

WEBSITE ARCHITECTURE
/

Homepage

/tools

All calculators

/tools/window-size-calculator

/tools/window-area-calculator

/tools/window-glass-calculator

/tools/window-weight-calculator

/tools/window-opening-calculator

/tools/replacement-window-calculator

/tools/window-frame-calculator

/tools/window-screen-calculator

/tools/window-film-calculator

/tools/window-ac-calculator

/tools/btu-calculator

/tools/window-cost-estimator

/tools/window-trim-calculator

/tools/window-insulation-calculator

/tools/egress-window-calculator

/guides

/charts

/blog

/categories

/about

/contact

/privacy


Architecture must scale to 100+ future pages.

HOMEPAGE

Homepage is NOT a calculator.

Homepage introduces the platform.

Hero

Headline

Measure Any Window with Confidence

Subheading

Professional window calculators, measurement guides, standard size charts, replacement planning tools, and installation resources.

Primary CTA

Start Measuring

Secondary CTA

Browse Tools

Homepage sections

Hero

Popular Tools

Window Categories

Measurement Guides

Popular Size Charts

Replacement Resources

Latest Guides

Featured Calculators

FAQs

Categories

Internal Links

Newsletter

Footer

MAIN CATEGORIES

Window Measurement

Replacement

Glass

Curtains

Blinds

Screens

Window AC

Construction

Planning

Cost

Energy

Installation

Charts

Guides

CALCULATOR SYSTEM

Every calculator should follow the same architecture:

Hero

Interactive Calculator

Live Results

Interpretation

Recommendations

Visual Diagram

Measurement Instructions

Formula

Examples

Common Mistakes

FAQ

Related Tools

Related Guides

Internal Links

Structured Data

Author

Last Updated

Breadcrumbs

FIRST TOOL
Window Size Calculator

This is NOT simply Width × Height.

It should solve actual user problems.

INPUTS

Measurement Profile

I'm replacing a window
I'm buying curtains
I'm buying blinds
I'm buying glass
I'm estimating area
I'm checking egress
I'm choosing a window AC
General measurement

Changing the profile should dynamically change instructions, outputs, and recommendations.

Measurement Method

Existing Window
Rough Opening
Brick Opening
Masonry Opening
Frame
Glass Only
Interior Measurement
Exterior Measurement

Include tooltips explaining each option in plain language.

Window Type

Single Hung
Double Hung
Sliding
Casement
Awning
Picture
Bay
Bow
Garden
Fixed
Custom

Width

Supports:

Fractions (34 1/2)
Decimal
Inches
Feet
Millimeters
Centimeters
Meters

Height

Same support.

Room

Optional

Bedroom

Bathroom

Kitchen

Living Room

Basement

Garage

Office

Other

Tolerance

2mm

5mm

10mm

15mm

20mm

Number of Windows

Useful for glass area, cost, and replacement estimation.

LIVE SVG VISUALIZATION

As the user types,

show a proportional SVG window.

Display

Width

Height

Frame

Glass

Opening

Dimension lines

Labels

Optional human silhouette for scale comparison.

Hovering over frame parts should explain their names.

OUTPUTS

Area

Perimeter

Glass Area

Frame Area

Aspect Ratio

Nearest Standard Size

Standard Size Match %

Custom Size Warning

Replacement Size

Recommended Rough Opening

Recommended Frame Size

Recommended Shim Space

Sealant Gap

Curtain Recommendation

Blind Recommendation

Estimated Glass Weight

Window Classification

Small

Medium

Large

Oversized

Custom

DECISION ENGINE

Instead of stopping after calculations,

continue.

Example

Your size

↓

Nearest Standard Size

↓

Replacement Recommendation

↓

Estimated Cost Range

↓

Curtain Size

↓

Blind Size

↓

Glass Weight

↓

Related Tools

This creates an entire workflow.

MEASUREMENT ASSISTANT

Instead of asking for one width,

guide users.

Top Width

Middle Width

Bottom Width

Automatically recommend

Use the smallest measurement.

Same for height.

Provide measurement confidence score.

Example

Measurement Confidence

92%

Top and bottom differ by 7mm.

Consider measuring again.

EGRESS CHECK

If Bedroom or Basement selected

Automatically check

Minimum opening

Minimum width

Minimum height

Clear opening area

Pass / Fail

Explain why in simple language.

UNIVERSAL MEASUREMENT ENGINE

Internally store everything in millimeters.

Convert to all units automatically.

Output

mm

cm

m

inches

feet

SHARE

Copy URL

Use query parameters

Never localStorage.

Example

?width=36&height=48&unit=in

EXPORT

Print

Copy Results

Download PDF (future-ready)

PROJECT MODE (Future-ready)

Allow adding multiple windows.

Kitchen

Bedroom

Bathroom

Living Room

Generate project summary.

Architecture should support this later.

SEO CONTENT

Every calculator page must contain original content.

Never filler.

Sections

Introduction

Who this calculator is for

How to use

Measurement Guide

Formula

Worked Examples

Common Mistakes

Tips

FAQs

Related Calculators

Related Guides

Related Charts

FAQ SCHEMA

Generate JSON-LD.

Include SoftwareApplication schema.

Breadcrumb schema.

FAQ schema.

Article schema where appropriate.

INTERNAL LINKING

Every page should naturally link to

Related Tools

Related Guides

Related Charts

Related Categories

Do not create isolated pages.

FUTURE ROADMAP

Design reusable architecture for:

Window Area Calculator

Replacement Window Calculator

Window Opening Calculator

Window Glass Calculator

Window Weight Calculator

Window Screen Calculator

Window Frame Calculator

Curtain Size Calculator

Blind Size Calculator

Window Film Calculator

Window AC Size Calculator

BTU Calculator

Window Cost Estimator

Window Trim Calculator

Window Insulation Calculator

Window Energy Calculator

Egress Window Calculator

Bay Window Calculator

Casement Window Calculator

Sliding Window Calculator

Double Hung Window Calculator

Window Comparison Tool

Window Size Chart Generator

Every future calculator should reuse the same shared components and calculation engine where applicable.

COMPETITOR ANALYSIS

Analyze but NEVER copy.

Calculator Academy

Weaknesses

Generic calculator
Outdated UI
No visualization
No workflow
No recommendations
Thin content
No decision support

Andersen

Weaknesses

Brand-specific
Complex
Assumes construction knowledge
No educational guidance
No visual explanation

Vishay

Weaknesses

Extremely niche
Confusing interface
Poor UX
Not homeowner-friendly

Our advantage

Beginner-friendly
Professional enough for contractors
Interactive visual guidance
Decision support
Better mobile experience
Better accessibility
Better SEO architecture
Personalized outputs
Print-ready reports
Shareable URLs
Cross-tool workflows
Comprehensive educational content
SEO STRATEGY

Do NOT build pages around individual keywords.

Build topic clusters.

Example:

Window Size (Pillar)

├── Window Size Calculator

├── Standard Window Sizes

├── Average Window Sizes

├── Window Size Chart

├── Bedroom Window Sizes

├── Bathroom Window Sizes

├── Kitchen Window Sizes

├── Living Room Window Sizes

├── Bay Window Sizes

├── Casement Window Sizes

├── Double Hung Window Sizes

├── Egress Window Sizes

├── Replacement Window Sizes

├── Window Measurement Guide

├── Window Measurement FAQs

Each supporting page should link back to the pillar and to related tools.

PERFORMANCE

Target

LCP < 1.5s

CLS near 0

Minimal JavaScript

Optimized SVGs

Optimized fonts

Semantic HTML

Static rendering wherever possible

Responsive images

Lazy loading

Excellent accessibility

SUCCESS METRIC

Build WindowMetrics as a platform—not a calculator site.

Every visitor should leave with:

Accurate measurements
Confidence in their decisions
Recommendations for what to do next
A printable/shareable report
Clear educational guidance
Links to the next logical tool

The experience should make it unnecessary to visit multiple websites.

The codebase should be scalable, modular, production-ready, and capable of supporting 100+ tools, guides, charts, and educational resources without requiring architectural changes.