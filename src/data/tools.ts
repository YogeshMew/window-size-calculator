/**
 * WindowMetrics — Tool Registry
 *
 * Single source of truth for all tools.
 * Every tool page, tool card, navigation, and sitemap references this data.
 *
 * Status guide:
 *   'live'         — page exists and calculator works
 *   'coming-soon'  — page exists with placeholder content
 *   'planned'      — not yet built, used for internal linking
 */

import type { Tool } from '@/types/content.js';

export const TOOLS: Tool[] = [
  // -------------------------------------------------------------------------
  // Measurement
  // -------------------------------------------------------------------------
  {
    slug: 'window-size-calculator',
    title: 'Window Size Calculator',
    description:
      'Calculate window area, perimeter, and get recommendations for replacement, curtains, blinds, and glass.',
    category: 'measurement',
    href: '/tools/window-size-calculator',
    icon: 'Ruler',
    status: 'live',
    useCases: ['Replacement', 'Curtains', 'Glass', 'Film', 'Energy'],
    benefits: [
      'Window area & perimeter',
      'Nearest standard size match',
      'Curtain & blind sizing',
      'Glass area & weight estimate',
      'Replacement planning',
    ],
    relatedSlugs: ['window-area-calculator', 'window-glass-calculator', 'replacement-window-calculator'],
    keywords: ['window size', 'window dimensions', 'window measurements', 'window area'],
  },
  {
    slug: 'window-area-calculator',
    title: 'Window Area Calculator',
    description: 'Calculate exact window area, perimeter, net glass coverage, film requirement, and waste percentage across 9 technical shapes.',
    longDescription: 'The definitive area-first window geometry calculator. Calculate precise surface area, perimeter, net daylight glass area, window film trimming area, frame paint coverage, curtain gather coverage, and blind overlap across Rectangle, Square, Circle, Half Circle, Triangle, Trapezoid, Arch, Ellipse, and Quarter Circle shapes with waste factor multipliers and multi-quantity scaling.',
    category: 'measurement',
    href: '/tools/window-area-calculator',
    icon: 'Square',
    status: 'live',
    useCases: ['Construction Area Estimation', 'Window Film Roll Sizing', 'Glazing & Glass Ordering', 'Paint & Trim Quantity', 'Curtain & Blind Coverage'],
    benefits: [
      'Single & total window area across 9 technical shapes',
      'Instant conversions: m², sq ft, sq in, cm², acres, hectares',
      'Waste percentage factor allowance (0% to 50%)',
      'Trade coverage areas: net glass, film trim, paint casing, curtains, blinds',
      'Interactive shape-specific technical SVG illustration',
      'Professional film roll width & trim paint quantity recommendations',
    ],
    keywords: [
      'window area calculator',
      'how to calculate window area',
      'window square footage calculator',
      'arch window area formula',
      'window film area calculator',
    ],
    relatedSlugs: ['window-size-calculator', 'window-glass-calculator', 'window-film-calculator', 'window-screen-calculator', 'replacement-window-calculator'],
  },
  {
    slug: 'window-opening-calculator',
    title: 'Window Opening Calculator',
    description: 'Calculate rough openings, finished openings, shim spacing, framing dimensions and installation tolerances for any window.',
    longDescription: 'The definitive construction rough opening and framing calculator. Calculate required rough opening dimensions, header framing sizes, side and top shim gaps, diagonal squareness tolerances, and installation difficulty across New Construction, Pocket Replacement, and Retrofit installations in Wood, Steel, and Concrete framing.',
    category: 'measurement',
    href: '/tools/window-opening-calculator',
    icon: 'Expand',
    status: 'live',
    useCases: ['Construction Framing', 'Rough Opening Calculation', 'Shim & Clearance Gap Check', 'Diagonal Squareness Check', 'Contractor Specification'],
    benefits: [
      'Required rough opening width & height (in & mm)',
      'Header framing width & jack stud height calculations',
      'Side, top, and bottom shim clearance gap verification',
      'Diagonal corner-to-corner squareness tolerance (1/8" max diff)',
      'Interactive wall framing & stud vector SVG illustration',
      'Framing notes, sill pan flashing, and shim placement guidance',
    ],
    keywords: [
      'window opening calculator',
      'window rough opening calculator',
      'how to calculate window rough opening',
      'rough opening for double hung window',
      'window shim gap calculator',
    ],
    relatedSlugs: ['window-size-calculator', 'replacement-window-calculator', 'window-weight-calculator'],
  },

  // -------------------------------------------------------------------------
  // Replacement
  // -------------------------------------------------------------------------
  {
    slug: 'replacement-window-calculator',
    title: 'Replacement Window Calculator',
    description:
      'Find the nearest standard window size, calculate exact rough openings, compare insert vs. full-frame installation, and check if a custom unit is required.',
    longDescription:
      'The definitive replacement window decision assistant. Instantly matches your window dimensions against US, UK, Canada, Australia, and European standard factory sizes. Calculates rough opening dimensions, shim allowances, 5-star match score, cost impact guidance, DIY difficulty, and supplier-ready print summaries.',
    category: 'replacement',
    href: '/tools/replacement-window-calculator',
    icon: 'RefreshCw',
    status: 'live',
    useCases: ['Replacement', 'Renovation', 'Installation', 'Sizing', 'Planning'],
    benefits: [
      'Nearest standard size match (US, UK, CA, AU, EU)',
      '5-Star match score & visual comparison diagram',
      'Rough opening & shim space calculator',
      'Insert vs. Full Frame vs. New Construction guide',
      'Cost impact & DIY installation difficulty guidance',
      'Printable supplier summary for Home Depot or local supplier',
    ],
    keywords: [
      'replacement window calculator',
      'standard window sizes',
      'rough opening calculator',
      'window replacement cost guide',
      'custom window vs standard',
    ],
    relatedSlugs: ['window-size-calculator', 'window-glass-calculator', 'curtain-size-calculator', 'window-ac-calculator'],
  },
  {
    slug: 'window-cost-estimator',
    title: 'Window Cost Estimator',
    description:
      'Estimate window replacement costs including materials, glass, and installation labor.',
    category: 'costs',
    href: '/tools/window-cost-estimator',
    icon: 'DollarSign',
    status: 'planned',
    relatedSlugs: ['replacement-window-calculator'],
  },

  // -------------------------------------------------------------------------
  // Glass
  // -------------------------------------------------------------------------
  {
    slug: 'window-glass-calculator',
    title: 'Window Glass Calculator',
    description: 'Calculate glass weight, area, and ordering quantity for any shape and glass type — with live SVG preview and smart handling guidance.',
    category: 'glass',
    href: '/tools/window-glass-calculator',
    icon: 'PanelTop',
    status: 'live',
    benefits: [
      'Glass area and weight for 5 shapes (rectangle, circle, triangle, and more)',
      'All glass types: annealed, tempered, laminated, double and triple pane',
      'Handles per piece and total with waste allowance',
      '"Can I carry it?" handling difficulty rating',
      'Thickness recommendation based on pane size',
      'Live SVG illustration with dimension arrows',
    ],
    relatedSlugs: ['window-size-calculator', 'curtain-size-calculator', 'window-ac-calculator'],
  },
  {
    slug: 'window-weight-calculator',
    title: 'Window Weight Calculator',
    description: 'Calculate total window weight, glass pane mass, frame weight, minimum required installers, and suction cup suction capacity for safe handling.',
    longDescription: 'The definitive window weight and glass mass estimator. Calculate total window unit weight, glass volume, frame material weight, OSHA safe lifting crew requirements, vacuum suction cup recommendations, and transportation freight categories across Annealed, Tempered, Laminated, Double, and Triple Glazed units.',
    category: 'glass',
    href: '/tools/window-weight-calculator',
    icon: 'Scale',
    status: 'live',
    useCases: ['Safe Lifting', 'Glass Transportation', 'Installer Crew Size', 'Suction Cup Selection', 'Window Replacement'],
    benefits: [
      'Total window weight (kg & lbs) with frame & glass breakdown',
      'Minimum required installers (OSHA 55 lb / 25 kg safe carry rule)',
      'Vacuum suction cup count & lifting capacity recommendation',
      'Glass weight per m² and sq ft for structural load checks',
      '6 Glass shapes (Rectangle, Square, Circle, Half-Circle, Triangle, Trapezoid)',
      'Frame materials: Aluminum, Vinyl, Wood, Fiberglass, Steel',
    ],
    keywords: [
      'window weight calculator',
      'how much does a window weigh',
      'glass weight calculator',
      'double pane window weight',
      'tempered glass weight per sq ft',
    ],
    relatedSlugs: ['window-glass-calculator', 'window-size-calculator', 'replacement-window-calculator'],
  },

  // -------------------------------------------------------------------------
  // Curtains & Blinds
  // -------------------------------------------------------------------------
  {
    slug: 'curtain-size-calculator',
    title: 'Curtain Size Calculator',
    description: 'Get the right curtain width, drop, rod length, and fabric needed for any window — with live illustration.',
    category: 'curtains',
    href: '/tools/curtain-size-calculator',
    icon: 'Blinds',
    status: 'live',
    benefits: [
      'Min, ideal, and max curtain width for any window',
      'Correct drop length for sill, floor, or puddle styling',
      'Rod length with side extension recommendation',
      'Total fabric needed with hem allowances',
      'Live SVG illustration that updates as you type',
    ],
    relatedSlugs: ['window-size-calculator', 'window-ac-calculator', 'window-blinds-calculator'],
  },
  {
    slug: 'window-blinds-calculator',
    title: 'Window Blinds Size Calculator',
    description: 'Calculate inside or outside mount blind dimensions with deduction, overlap, depth compatibility, and smart ordering recommendations for all blind types.',
    longDescription: 'The complete blind sizing assistant. Instantly calculates finished width and height for inside or outside mount installations across all blind types. Checks window depth compatibility, recommends the right mount, shows closest stock sizes, and generates a full ordering summary.',
    category: 'blinds',
    href: '/tools/window-blinds-calculator',
    icon: 'SlidersHorizontal',
    status: 'live',
    benefits: [
      'Inside & outside mount width and height',
      'Manufacturing deduction per blind type',
      'Window depth compatibility check',
      'Closest stock sizes (order without guessing)',
      'Confidence rating & ordering recommendation',
      'Smart blind type suggestion',
    ],
    relatedSlugs: ['window-size-calculator', 'curtain-size-calculator', 'replacement-window-calculator'],
  },
  {
    slug: 'window-film-calculator',
    title: 'Window Film & Tint Calculator',
    description: 'Calculate exact film roll width, length, roll area, 1" trimming waste, solar heat reduction, UV protection, and material costs for any window.',
    longDescription: 'The definitive window film and tint calculator. Calculate required roll width, roll length, total square footage with trimming margin, material cost estimates, solar heat reduction, glare block, UV protection, and glass thermal stress compatibility across Privacy, Reflective, Frosted, Solar, Decorative, Security, and One-Way Mirror films.',
    category: 'glass',
    href: '/tools/window-film-calculator',
    icon: 'Film',
    status: 'live',
    useCases: ['Solar Control', 'Privacy Tint', 'UV Protection', 'Security Film', 'Decorative Glass'],
    benefits: [
      'Exact film roll width & length with 1" trim margin',
      'Total film square footage & waste % calculation',
      'Solar heat reduction & UV protection %',
      'Glass thermal stress & double-pane safety check',
      'Material cost estimate & cost tier guidance',
      'Closest standard stock film roll size matches',
    ],
    keywords: [
      'window film calculator',
      'window tint roll size',
      'window film roll length',
      'solar film heat reduction',
      'privacy window film size',
    ],
    relatedSlugs: ['window-glass-calculator', 'window-size-calculator', 'window-screen-calculator', 'window-ac-calculator'],
  },

  // -------------------------------------------------------------------------
  // Energy & AC
  // -------------------------------------------------------------------------
  {
    slug: 'window-ac-calculator',
    title: 'Window AC BTU Calculator',
    description: 'Find the right BTU air conditioner for your room. Enter room size, climate, sun exposure, and insulation for a precise recommendation.',
    longDescription: 'Calculate the exact BTU cooling capacity your window AC unit needs. Takes into account room area, ceiling height, climate zone, sun exposure, room type, insulation quality, and occupant count to produce a precise, tier-snapped recommendation with energy cost estimates.',
    category: 'ac',
    href: '/tools/window-ac-calculator',
    icon: 'AirVent',
    status: 'live',
    benefits: [
      'Precise BTU recommendation for your room',
      'Climate, sun, and insulation adjustments',
      'Annual energy cost estimate',
      'Cooling suitability rating',
      'All units: ft, m, in supported',
    ],
    relatedSlugs: ['window-size-calculator', 'window-insulation-calculator', 'btu-calculator'],
    keywords: ['BTU calculator', 'AC sizing', 'window AC', 'air conditioner size', 'room cooling'],
    useCases: ['Cooling', 'Energy', 'Planning'],
  },
  {
    slug: 'btu-calculator',
    title: 'BTU Calculator',
    description: 'Calculate heating and cooling BTU requirements for any room or building using room size, insulation quality, windows, climate, and occupancy.',
    longDescription: 'The definitive general HVAC heating and cooling BTU load calculator. Calculate exact cooling BTU load, heating BTU load, recommended HVAC tonnage, power consumption (kW), monthly energy operating cost ($), oversizing/undersizing risk assessment, and equipment sizing recommendations for Bedrooms, Living Rooms, Kitchens, Offices, Basements, Garages, Server Rooms, and Commercial spaces.',
    category: 'ac',
    href: '/tools/btu-calculator',
    icon: 'Thermometer',
    status: 'live',
    useCases: ['HVAC Equipment Sizing', 'Heating & Cooling Load Calculations', 'Mini-Split & Heat Pump Selection', 'Monthly Energy Cost Estimation', 'Commercial & Server Room HVAC'],
    benefits: [
      'Both Cooling BTU and Heating BTU load calculations',
      'HVAC Tonnage recommendation snapped to standard equipment sizes',
      'Estimated power consumption in kW & monthly electricity cost ($)',
      'Adjustments for ceiling height, climate zone, insulation & sun exposure',
      'Interactive room layout, airflow distribution & solar gain SVG diagram',
      'HVAC equipment selection, thermostat scheduling & inverter compressor advice',
    ],
    keywords: [
      'BTU calculator',
      'heating and cooling btu calculator',
      'room btu calculator',
      'how many btu for room size',
      'hvac tonnage calculator',
    ],
    relatedSlugs: ['window-ac-calculator', 'window-energy-savings-calculator', 'window-insulation-calculator', 'window-size-calculator', 'window-cost-calculator'],
  },
  {
    slug: 'window-insulation-calculator',
    title: 'Window Insulation Calculator',
    description: 'Estimate window thermal insulation performance, U-factor, R-value, air leakage, draft risk, condensation risk, and upgrade recommendations.',
    longDescription: 'The definitive physical thermal insulation performance calculator. Calculate estimated U-factor, thermal R-value, heat transfer rate (Watts), 1-100 Thermal Efficiency Score, Insulation Rating, Air Leakage Risk, Condensation Risk, and Draft Risk across Single-Pane, Double-Pane, Triple-Pane, Low-E, Argon, and Krypton glass in Vinyl, Wood, Fiberglass, Composite, and Aluminum frames.',
    category: 'energy',
    href: '/tools/window-insulation-calculator',
    icon: 'Shield',
    status: 'live',
    useCases: ['Thermal Insulation Performance', 'R-Value & U-Factor Verification', 'Draft & Air Leakage Audit', 'Condensation Prevention', 'Insulating Shade Upgrade'],
    benefits: [
      '1 to 100 Thermal Efficiency Score & Insulation Rating tier',
      'Estimated U-Factor (BTU/hr·ft²·°F & W/m²·K) & R-Value',
      'Heat transfer rate in Watts at standard winter ΔT=40°F',
      'Air Leakage Risk, Condensation Risk, and Draft Risk assessment',
      'Interactive wall insulation & heat leakage vector SVG illustration',
      'Caulk, weatherstripping, cellular shade, and Low-E upgrade advice',
    ],
    keywords: [
      'window insulation calculator',
      'window r value calculator',
      'window u factor calculator',
      'how to insulate drafty windows',
      'window thermal efficiency score',
    ],
    relatedSlugs: ['window-energy-savings-calculator', 'window-heat-loss-calculator', 'replacement-window-calculator'],
  },

  // -------------------------------------------------------------------------
  // Construction
  // -------------------------------------------------------------------------
  {
    slug: 'window-frame-calculator',
    title: 'Window Frame Calculator',
    description: 'Calculate frame dimensions, 4-piece cut list, perimeter, material quantities, glass daylight opening, and weight for any window frame.',
    longDescription: 'The definitive carpentry and window frame manufacturing calculator. Calculate exact outer frame dimensions, daylight inner opening size, net glass rabbet pocket size, 4-piece cut list (Top Rail, Bottom Rail, Left Stile, Right Stile with 45° miter or 90° butt angles), linear material stock length, material volume, and frame weight across Wood, Aluminum, Vinyl, and Fiberglass profiles.',
    category: 'construction',
    href: '/tools/window-frame-calculator',
    icon: 'Frame',
    status: 'live',
    useCases: ['Carpentry & Joinery', 'Window Frame Fabrication', 'Cut List Generation', 'Material Stock Estimation', 'Glazing Rabbet Sizing'],
    benefits: [
      'Outer frame & daylight inner opening dimensions',
      'Glass rabbet pocket opening size calculation',
      'Complete 4-piece cut list (Rails & Stiles with 45°/90° angles)',
      'Total linear material length & 10% waste stock calculation',
      'Material volume & weight estimates by material density',
      'Interactive technical frame profile & cut list vector SVG illustration',
    ],
    keywords: [
      'window frame calculator',
      'window frame cut list',
      'how to build a window frame',
      'window rabbet glass size formula',
      'window frame material length',
    ],
    relatedSlugs: ['window-opening-calculator', 'replacement-window-calculator', 'window-glass-calculator', 'window-weight-calculator'],
  },
  {
    slug: 'window-trim-calculator',
    title: 'Window Trim Calculator',
    description: 'Calculate trim casing lengths, 4-piece or 5-piece cut list, stool horn length, apron size, extension jambs, and material requirements across Colonial, Modern, Craftsman, Ranch, and Victorian styles.',
    longDescription: 'The definitive finish carpentry window trim and casing calculator. Calculate precise head casing, side casing, window stool sill, apron, and deep wall extension jamb lengths across Colonial, Modern, Craftsman, Ranch, and Victorian trim styles with 45° miter and 90° square cut angles, linear board feet, waste factors, and material cost estimates.',
    category: 'construction',
    href: '/tools/window-trim-calculator',
    icon: 'Crop',
    status: 'live',
    useCases: ['Finish Carpentry Casing', 'Window Stool & Apron Sizing', 'Extension Jamb Box Calculation', 'Miter & Square Cut Lists', 'Lumber & Molding Ordering'],
    benefits: [
      'Top head casing, side casing, stool, and apron lengths (in & mm)',
      '5-piece finish carpentry cut list with 45° miter & 90° square cut angles',
      'Craftsman head casing overhang & window stool horn extension calculations',
      'Total linear board feet & 10% waste stock ordering estimates',
      'Interactive finish carpentry casing & stool vector SVG illustration',
      '18-gauge brad nail fastener guidance & painter’s caulk finishing advice',
    ],
    keywords: [
      'window trim calculator',
      'window casing length calculator',
      'window stool and apron size formula',
      'craftsman window trim cut list',
      'how much window trim do I need',
    ],
    relatedSlugs: ['window-frame-calculator', 'window-opening-calculator', 'replacement-window-calculator', 'window-cost-calculator'],
  },
  {
    slug: 'window-installation-calculator',
    title: 'Window Installation Materials Calculator',
    description: 'Calculate every material required for installing one or more windows: flashing tape, sealant, foam, shims, fasteners, drip cap, and installation time.',
    longDescription: 'The definitive window installation materials and hardware calculator. Calculate exact flashing tape linear length, sealant caulk tubes, low-expansion foam cans, backer rod, shim packs, fastener counts, anchor spacing, drip cap header flashing, waterproof sill membrane area, estimated installation labor hours, and difficulty rating across Wood Stud, Steel Stud, Concrete, Brick, and Block walls.',
    category: 'construction',
    href: '/tools/window-installation-calculator',
    icon: 'Hammer',
    status: 'live',
    useCases: ['Window Installation Planning', 'Material Takeoff & Hardware Checklist', 'Flashing Tape & Sealant Calculation', 'Masonry vs Wood Anchor Selection', 'Installer Labor Estimation'],
    benefits: [
      'Complete material takeoff checklist (Flashing, Sealant, Foam, Screws, Shims)',
      'Linear flashing tape & waterproof sill membrane area calculations',
      'Sealant caulk tube & low-expansion foam can coverage estimates',
      'Fastener count & anchor spacing by wall substrate (Wood, Steel, Concrete)',
      'Interactive window wall cross-section installation SVG illustration',
      'ASTM E2112 installation sequencing & low-expansion foam safety rules',
    ],
    keywords: [
      'window installation calculator',
      'window installation material list',
      'how much flashing tape for window',
      'how many caulk tubes for window installation',
      'window installation labor hours',
    ],
    relatedSlugs: ['window-frame-calculator', 'window-trim-calculator', 'replacement-window-calculator', 'window-weight-calculator', 'window-cost-calculator'],
  },
  {
    slug: 'window-screen-calculator',
    title: 'Window Screen Calculator',
    description: 'Calculate exact window screen dimensions, frame perimeter, mesh area with waste, spline length, and stock frame suggestions.',
    longDescription: 'The definitive window screen size and material calculator. Calculate finished screen frame dimensions, mesh roll area, spline channel lengths, frame weight, corner connectors, and DIY installation guidance for fiberglass, aluminum, pet screen, solar screen, and stainless steel mesh.',
    category: 'maintenance',
    href: '/tools/window-screen-calculator',
    icon: 'Grid2x2',
    status: 'live',
    useCases: ['Replacement', 'DIY Screen Frame', 'Insect Protection', 'Pet Screening', 'Solar Shading'],
    benefits: [
      'Finished screen width & height',
      'Frame perimeter & 15% mesh area waste calculation',
      'Spline diameter & length calculator',
      'Corner connector & crossbar requirements',
      'Mesh type comparison (Pet, Solar, Aluminum, Fiberglass)',
      'Closest standard stock screen frame matches',
    ],
    keywords: [
      'window screen calculator',
      'window screen replacement size',
      'screen frame calculator',
      'window screen spline size',
      'pet screen calculator',
    ],
    relatedSlugs: ['window-size-calculator', 'window-blinds-calculator', 'replacement-window-calculator'],
  },

  // -------------------------------------------------------------------------
  // Codes & Planning
  // -------------------------------------------------------------------------
  {
    slug: 'egress-window-calculator',
    title: 'Egress Window Calculator',
    description: 'Calculate net clear opening area, width, height, and IRC building code compliance for basement and bedroom emergency escape windows.',
    longDescription: 'The definitive egress window code compliance calculator. Verify IRC Section R310 emergency escape requirements: 5.7 sq ft net clear opening (5.0 sq ft grade floor), 20" minimum clear width, 24" minimum clear height, and 44" maximum sill height across Casement, Sliding, Single-Hung, and Double-Hung windows.',
    category: 'codes',
    href: '/tools/egress-window-calculator',
    icon: 'DoorOpen',
    status: 'live',
    useCases: ['IRC Code Compliance', 'Basement Finish', 'Bedroom Escape', 'Home Inspection', 'Window Replacement'],
    benefits: [
      'IRC Section R310 net clear opening area verification (5.7 sq ft)',
      'Minimum clear width (20") & height (24") check',
      'Pass / Fail compliance status & shortfall calculations',
      'Casement vs. Sliding vs. Double-Hung opening efficiency',
      'Basement window well & 44" maximum sill height guidance',
      'Printable inspector checklist & supplier ordering size',
    ],
    keywords: [
      'egress window calculator',
      'irc egress code requirements',
      'minimum egress window size',
      'basement egress window size',
      'net clear opening area',
    ],
    relatedSlugs: ['replacement-window-calculator', 'window-size-calculator', 'window-glass-calculator'],
  },
  {
    slug: 'window-weight-calculator',
    title: 'Window Weight & Lifting Calculator',
    description: 'Calculate total window unit mass, glass pane weight, frame weight, OSHA crew size requirements, and suction cup lifting needs for any window shape and glazing thickness.',
    longDescription: 'The definitive window weight and manual handling safety calculator. Calculate exact window unit weight, glass pane mass, perimeter frame profile weight, OSHA single vs. multi-person carry limits, vacuum suction cup quantities, and transport freight categories across annealed, tempered, laminated, double glazed, and triple glazed units.',
    category: 'construction',
    href: '/tools/window-weight-calculator',
    icon: 'Scale',
    status: 'live',
    useCases: ['OSHA Lifting Safety', 'Team Carry Planning', 'Vacuum Suction Cups', 'Glass Mass Calculation', 'Freight & Shipping'],
    benefits: [
      'Total window unit weight (kg & lbs)',
      'Glass pane mass & frame profile weight breakdown',
      'OSHA 55 lb (25 kg) safe single-person carry verification',
      'Vacuum suction cup quantity & capacity rating',
      'Interactive center-of-gravity vector diagram',
      'Freight category & handling difficulty assessment',
    ],
    keywords: [
      'window weight calculator',
      'glass weight calculator',
      'how much does a window weigh',
      'double pane glass weight',
      'osha window lifting limit',
    ],
    relatedSlugs: ['window-glass-calculator', 'window-size-calculator', 'replacement-window-calculator'],
  },
  {
    slug: 'window-cost-calculator',
    title: 'Window Cost & Replacement Estimator',
    description: 'Calculate total window replacement cost, material costs, glass upgrades, professional vs. DIY labor, regional cost factors, ROI, and energy savings.',
    longDescription: 'The comprehensive window replacement cost calculator. Estimate total per-unit and project costs across Single-Hung, Double-Hung, Casement, Sliding, Awning, Picture, Bay, Bow, and Custom windows. Accounts for Vinyl, Aluminum, Wood, Fiberglass, and Composite frames, single/double/triple pane and Low-E glass, regional labor multipliers, DIY savings, and home equity ROI.',
    category: 'planning',
    href: '/tools/window-cost-calculator',
    icon: 'DollarSign',
    status: 'live',
    useCases: ['Budget Planning', 'Replacement Estimating', 'DIY vs Pro Labor', 'ROI & Home Equity', 'Energy Bill Savings'],
    benefits: [
      'Grand total & per-window cost breakdown',
      'Material, glass, labor & add-on feature itemization',
      'DIY labor savings & installation duration estimate',
      'Regional labor cost adjustment (Low, Average, High cost areas)',
      'Home resale ROI & energy bill savings calculator',
      'Budget category & custom quote checklist',
    ],
    keywords: [
      'window cost calculator',
      'replacement window cost',
      'cost of double hung windows',
      'window installation cost',
      'window replacement estimate',
    ],
    relatedSlugs: ['replacement-window-calculator', 'window-size-calculator', 'window-glass-calculator'],
  },
  {
    slug: 'window-energy-savings-calculator',
    title: 'Window Energy Savings Calculator',
    description: 'Calculate annual heating and cooling bill savings, U-factor thermal loss, CO₂ carbon reduction, 10-year ROI, and payback period when upgrading home windows.',
    longDescription: 'The definitive window energy efficiency and utility bill savings calculator. Compare Single-Pane, Double-Pane, Triple-Pane, Low-E, Argon, and Krypton glass across Cold, Mixed, and Hot climate zones. Accounts for electric, gas, oil, and heat pump heating, regional kWh rates, solar heat gain, carbon footprint reduction, and 25-year lifetime savings.',
    category: 'energy',
    href: '/tools/window-energy-savings-calculator',
    icon: 'Zap',
    status: 'live',
    useCases: ['Energy Bill Reduction', 'Window Replacement ROI', 'Climate Zone Optimization', 'Carbon Footprint Reduction', 'Thermal Insulation Check'],
    benefits: [
      'Annual & monthly utility bill savings ($)',
      'Heat loss (HDD) & solar heat gain (CDD) physics calculations',
      'Estimated payback period (years) & 10-year ROI %',
      'Annual CO₂ carbon footprint reduction (kg CO₂)',
      'Energy efficiency score (1-100) & thermal comfort rating',
      'Interactive winter/summer heat flow diagram',
    ],
    keywords: [
      'window energy savings calculator',
      'window replacement energy savings',
      'double pane energy savings',
      'low-e glass energy bill savings',
      'window u-factor heat loss',
    ],
    relatedSlugs: ['window-cost-calculator', 'replacement-window-calculator', 'window-glass-calculator'],
  },
  {
    slug: 'window-heat-loss-calculator',
    title: 'Window Heat Loss Calculator',
    description: 'Calculate conduction heat loss rate in Watts and BTU/hr, daily/monthly/annual kWh thermal loss, temperature differential ΔT, heating cost impact, and energy efficiency ratings.',
    longDescription: 'The definitive window conduction heat loss and thermal energy calculator. Calculate heat loss rate (Watts & BTU/hr), temperature differential ΔT (°F & °C), daily, monthly, and annual kWh energy loss, estimated heating bill impact, and energy ratings across Single-Pane, Double-Pane, Triple-Pane, and Low-E glass in Vinyl, Wood, Fiberglass, and Aluminum frames.',
    category: 'energy',
    href: '/tools/window-heat-loss-calculator',
    icon: 'Flame',
    status: 'live',
    useCases: ['Thermal Loss Physics', 'Heating Bill Reduction', 'Winterization Planning', 'U-Factor Verification', 'Draft & Comfort Check'],
    benefits: [
      'Heat loss rate in Watts & BTU/hr',
      'Temperature differential ΔT (°F & °C) calculation',
      'Daily, monthly, and annual thermal loss in kWh',
      'Estimated annual & monthly heating bill cost impact ($)',
      'Energy efficiency rating (A+ to F) & loss category',
      'Interactive wall conduction & heat flow diagram',
    ],
    keywords: [
      'window heat loss calculator',
      'how much heat is lost through windows',
      'window btu heat loss formula',
      'single pane window heat loss',
      'u factor heat loss calculation',
    ],
    relatedSlugs: ['window-energy-savings-calculator', 'window-cost-calculator', 'replacement-window-calculator'],
  },
];

/** Look up a tool by its slug */
export function getToolBySlug(slug: string): Tool | undefined {
  return TOOLS.find((t) => t.slug === slug);
}

/** Get all tools in a given category */
export function getToolsByCategory(category: Tool['category']): Tool[] {
  return TOOLS.filter((t) => t.category === category);
}

/** Get live tools only */
export function getLiveTools(): Tool[] {
  return TOOLS.filter((t) => t.status === 'live');
}

/** Get tools related to a given slug */
export function getRelatedTools(slug: string, limit = 4): Tool[] {
  const tool = getToolBySlug(slug);
  if (!tool?.relatedSlugs) return [];
  return tool.relatedSlugs
    .map((s) => getToolBySlug(s))
    .filter((t): t is Tool => t !== undefined)
    .slice(0, limit);
}
