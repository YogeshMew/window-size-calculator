/**
 * WindowMetrics — Curtain Size Calculator Engine
 *
 * Calculates curtain dimensions, rod length, curtain drop, fabric needed, and
 * header height from window measurements and user preferences.
 *
 * Design principles:
 *   - All internal calculations use millimeters (mm)
 *   - Constants are named and documented — no magic numbers
 *   - Every public function is pure and testable
 *   - Warnings and recommendations are structured data (not strings)
 *
 * Industry standards referenced:
 *   - WCRA (Window Covering Resources Association) guidelines
 *   - Standard residential decorating practices (Pottery Barn, IKEA specs)
 *   - IDC (Interior Design Council) fabric fullness standards
 */

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────

/** How the curtain rod is mounted relative to the window frame. */
export type MountType = 'inside' | 'outside';

/** Heading style of the curtain, which determines header height and rod requirements. */
export type CurtainStyle =
  | 'standard'
  | 'grommet'
  | 'rod-pocket'
  | 'pinch-pleat'
  | 'eyelet';

/** Where the curtain bottom ends. */
export type FloorPosition = 'sill' | 'below-sill' | 'floor' | 'puddle';

/** Vertical position of the curtain rod above the window. */
export type RodPosition = 'above-window' | 'at-trim' | 'custom';

/** Severity of a curtain warning. */
export type CurtainWarnLevel = 'error' | 'warning';

export interface CurtainWarning {
  level: CurtainWarnLevel;
  code: string;
  message: string;
}

export interface CurtainRecommendationItem {
  title: string;
  body: string;
  tip?: string;
}

/** All inputs required by the curtain engine. */
export interface CurtainInput {
  /** Window frame width in mm */
  windowWidthMm: number;
  /** Window frame height in mm (floor to sill is NOT needed for sill-length curtains) */
  windowHeightMm: number;
  /** How the rod is anchored: inside the frame or outside */
  mountType: MountType;
  /** Heading style; affects header height and visual fullness */
  style: CurtainStyle;
  /** Fullness multiplier — industry minimum 1.5×, luxury 2.5–3× */
  fullness: number;
  /** Where the curtain bottom should fall */
  floorPosition: FloorPosition;
  /** How far above the window top the rod sits */
  rodPosition: RodPosition;
  /**
   * Custom rod offset above the window top, in mm.
   * Only used when `rodPosition === 'custom'`.
   * Defaults to ROD_ABOVE_WINDOW_MM.
   */
  rodCustomOffsetMm: number;
  /**
   * Distance from the rod to the floor, in mm.
   * Only used when `floorPosition === 'floor' | 'puddle'`.
   * Defaults to DEFAULT_ROD_TO_FLOOR_MM (84 in / 2134 mm).
   */
  rodToFloorMm: number;
  /** Number of curtain panels (1, 2, or 4). Most windows use 2 (one pair). */
  panelCount: 1 | 2 | 3 | 4;
}

/** Full output of a curtain size calculation. */
export interface CurtainResult {
  // ── Rod ──────────────────────────────────────────────────────────────────
  /** Total rod length including side extensions */
  rodLengthMm: number;
  /** How far the rod extends past the window on each side */
  sideExtensionMm: number;
  /** How far the rod sits above the window top */
  rodAboveWindowMm: number;

  // ── Curtain dimensions ────────────────────────────────────────────────────
  /** Total width of all curtain panels combined (before hems) */
  totalWidthMm: number;
  /** Width of each individual panel (before hems) */
  panelWidthMm: number;
  /** Total curtain drop: from top of ring/rod to bottom of hem */
  dropMm: number;

  // ── Width recommendations ─────────────────────────────────────────────────
  /** Minimum acceptable curtain width (1.5× rod length) */
  minWidthMm: number;
  /** Ideal curtain width for the selected fullness */
  idealWidthMm: number;
  /** Maximum curtain width (3× rod length) */
  maxWidthMm: number;

  // ── Fullness ──────────────────────────────────────────────────────────────
  /** Effective fullness ratio (totalWidth / rodLength) */
  fullnessRatio: number;
  /** Recommended fullness for the selected style */
  recommendedFullness: number;

  // ── Fabric ────────────────────────────────────────────────────────────────
  /** Fabric width per panel (curtain width + seam allowances) */
  fabricWidthPerPanelMm: number;
  /** Fabric drop per panel (curtain drop + top & bottom hem allowances) */
  fabricDropMm: number;
  /** Total fabric width for all panels */
  totalFabricWidthMm: number;

  // ── Header ───────────────────────────────────────────────────────────────
  /** Recommended header height for the selected style */
  headerHeightMm: number;

  // ── Structured output ─────────────────────────────────────────────────────
  warnings: CurtainWarning[];
  recommendations: CurtainRecommendationItem[];
}

// ─────────────────────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────────────────────

/** Standard outside-mount side extension: 4 in (101.6 mm) per side.
 *  Allows stack-back clearance and prevents light gaps. */
export const OUTSIDE_MOUNT_SIDE_EXTENSION_MM = 101.6;

/** Inside-mount rod clearance: 0 (rod sits flush inside frame).
 *  For inside mounts, the rod length equals the window width. */
export const INSIDE_MOUNT_SIDE_EXTENSION_MM = 0;

/** Standard rod position: 5 in (127 mm) above window top.
 *  Raises apparent ceiling height and allows full drop coverage. */
export const ROD_ABOVE_WINDOW_MM = 127;

/** Extra drop below window sill for "below sill" position: 6 in (152.4 mm). */
export const BELOW_SILL_EXTRA_MM = 152.4;

/** Clearance from floor for floor-length curtains: 0.5 in (12.7 mm). */
export const FLOOR_CLEARANCE_MM = 12.7;

/** Extra length below floor for puddle curtains: 6 in (152.4 mm). */
export const PUDDLE_EXTRA_MM = 152.4;

/** Default rod-to-floor distance when not provided: 84 in (2133.6 mm).
 *  Represents a rod at 7 ft in an 8 ft ceiling room. */
export const DEFAULT_ROD_TO_FLOOR_MM = 2133.6;

/** Minimum valid window dimension: 6 in (152.4 mm). */
export const MIN_CURTAIN_WINDOW_MM = 152.4;

/** Maximum single-rod window width: 180 in (4572 mm = 15 ft).
 *  Beyond this, multiple rods or a commercial track are recommended. */
export const MAX_CURTAIN_WINDOW_MM = 4572;

/** Side hem allowance per panel (both sides): 4 in (101.6 mm).
 *  2 in double-fold hem on each side of each panel. */
const SIDE_HEM_PER_PANEL_MM = 101.6;

/** Bottom hem allowance: 4 in (101.6 mm) double-fold hem. */
const BOTTOM_HEM_MM = 101.6;

/** Top seam allowance: 1 in (25.4 mm). */
const TOP_SEAM_MM = 25.4;

/** Recommended fullness by style (minimum/ideal). */
const STYLE_FULLNESS: Record<CurtainStyle, number> = {
  'standard':    2.0,
  'grommet':     2.0,
  'rod-pocket':  2.5,
  'pinch-pleat': 2.5,
  'eyelet':      2.0,
};

/** Recommended header heights by style (mm).
 *  Header = the portion of fabric above the top of the window opening. */
const HEADER_HEIGHTS_MM: Record<CurtainStyle, number> = {
  'standard':    76.2,   // 3 in
  'grommet':     44.5,   // 1.75 in
  'rod-pocket':  57.15,  // 2.25 in
  'pinch-pleat': 88.9,   // 3.5 in
  'eyelet':      50.8,   // 2 in
};

// ─────────────────────────────────────────────────────────────────────────────
// Validation
// ─────────────────────────────────────────────────────────────────────────────

export interface CurtainDimensionValidation {
  valid: boolean;
  level: CurtainWarnLevel;
  field?: 'width' | 'height';
  message?: string;
}

/**
 * Validate a window dimension for curtain sizing.
 *
 * @param mm     Dimension in millimeters
 * @param field  Which dimension ('width' | 'height')
 */
export function validateCurtainDimension(
  mm: number,
  field: 'width' | 'height',
): CurtainDimensionValidation {
  if (!isFinite(mm) || mm <= 0) {
    return { valid: false, level: 'error', field, message: `Enter a positive ${field} value.` };
  }
  if (mm < MIN_CURTAIN_WINDOW_MM) {
    return {
      valid: false,
      level: 'error',
      field,
      message: `${field === 'width' ? 'Width' : 'Height'} is too small (minimum ${MIN_CURTAIN_WINDOW_MM.toFixed(0)} mm / 6 in).`,
    };
  }
  if (field === 'width' && mm > MAX_CURTAIN_WINDOW_MM) {
    return {
      valid: false,
      level: 'warning',
      field,
      message: `Window wider than ${(MAX_CURTAIN_WINDOW_MM / 25.4).toFixed(0)}" — consider multiple rods or a custom curtain track.`,
    };
  }
  return { valid: true, level: 'warning' };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component calculations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate the curtain rod length and side extension.
 *
 * @param windowWidthMm  Window frame width
 * @param mountType      Inside or outside mount
 */
export function calcRodLength(
  windowWidthMm: number,
  mountType: MountType,
): { rodLengthMm: number; sideExtensionMm: number } {
  const ext = mountType === 'outside' ? OUTSIDE_MOUNT_SIDE_EXTENSION_MM : INSIDE_MOUNT_SIDE_EXTENSION_MM;
  return {
    rodLengthMm: windowWidthMm + ext * 2,
    sideExtensionMm: ext,
  };
}

/**
 * Calculate the distance the rod sits above the window top.
 *
 * @param rodPosition         Preset or custom rod position
 * @param rodCustomOffsetMm   Only used when rodPosition === 'custom'
 */
export function calcRodAbove(
  rodPosition: RodPosition,
  rodCustomOffsetMm: number,
): number {
  switch (rodPosition) {
    case 'above-window': return ROD_ABOVE_WINDOW_MM;
    case 'at-trim':      return 0;
    case 'custom':       return Math.max(0, rodCustomOffsetMm);
  }
}

/**
 * Calculate the curtain drop (from rod/ring top to bottom hem).
 *
 * @param windowHeightMm   Window frame height
 * @param rodAboveMm       How far the rod is above the window top
 * @param floorPosition    Where the curtain bottom ends
 * @param rodToFloorMm     Distance from rod to floor (used for floor/puddle only)
 */
export function calcDrop(
  windowHeightMm: number,
  rodAboveMm: number,
  floorPosition: FloorPosition,
  rodToFloorMm: number,
): number {
  switch (floorPosition) {
    case 'sill':
      return rodAboveMm + windowHeightMm;
    case 'below-sill':
      return rodAboveMm + windowHeightMm + BELOW_SILL_EXTRA_MM;
    case 'floor':
      return Math.max(rodAboveMm + windowHeightMm, rodToFloorMm - FLOOR_CLEARANCE_MM);
    case 'puddle':
      return Math.max(rodAboveMm + windowHeightMm, rodToFloorMm + PUDDLE_EXTRA_MM);
  }
}

/**
 * Calculate total curtain width, panel width, and width recommendation range.
 *
 * @param rodLengthMm  Length of the curtain rod
 * @param fullness     Fullness multiplier (1.5–3.0)
 * @param panelCount   Number of panels
 */
export function calcWidths(
  rodLengthMm: number,
  fullness: number,
  panelCount: number,
): {
  totalWidthMm: number;
  panelWidthMm: number;
  minWidthMm: number;
  idealWidthMm: number;
  maxWidthMm: number;
  fullnessRatio: number;
} {
  const totalWidthMm   = rodLengthMm * fullness;
  const panelWidthMm   = totalWidthMm / panelCount;
  const minWidthMm     = rodLengthMm * 1.5;
  const idealWidthMm   = rodLengthMm * fullness;
  const maxWidthMm     = rodLengthMm * 3.0;
  const fullnessRatio  = totalWidthMm / rodLengthMm;

  return { totalWidthMm, panelWidthMm, minWidthMm, idealWidthMm, maxWidthMm, fullnessRatio };
}

/**
 * Calculate the fabric needed per panel (with seam and hem allowances).
 *
 * @param panelWidthMm   Finished panel width (before hems)
 * @param dropMm         Finished curtain drop (before hems)
 * @param headerMm       Header height (added to top of fabric)
 * @param panelCount     Number of panels (for total fabric width)
 */
export function calcFabric(
  panelWidthMm: number,
  dropMm: number,
  headerMm: number,
  panelCount: number,
): {
  fabricWidthPerPanelMm: number;
  fabricDropMm: number;
  totalFabricWidthMm: number;
} {
  const fabricWidthPerPanelMm  = panelWidthMm + SIDE_HEM_PER_PANEL_MM;
  const fabricDropMm           = dropMm + headerMm + BOTTOM_HEM_MM + TOP_SEAM_MM;
  const totalFabricWidthMm     = fabricWidthPerPanelMm * panelCount;

  return { fabricWidthPerPanelMm, fabricDropMm, totalFabricWidthMm };
}

// ─────────────────────────────────────────────────────────────────────────────
// Warnings
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Generate all applicable warnings for the current curtain configuration.
 */
export function buildCurtainWarnings(
  input: CurtainInput,
  result: Pick<CurtainResult, 'rodLengthMm' | 'totalWidthMm' | 'dropMm'>,
): CurtainWarning[] {
  const warnings: CurtainWarning[] = [];
  const { windowWidthMm, windowHeightMm, mountType, floorPosition } = input;
  const { rodLengthMm, totalWidthMm, dropMm } = result;

  if (windowWidthMm < 304.8) {
    warnings.push({
      level: 'warning',
      code: 'VERY_SMALL_WINDOW',
      message: 'Very small window — standard curtain panels may not be available narrower than 12 in. Consider a single-panel or café curtain.',
    });
  }

  if (windowWidthMm > 2438.4) {
    warnings.push({
      level: 'warning',
      code: 'WIDE_WINDOW',
      message: 'Wide window (over 8 ft). Consider two curtain rods side-by-side or a heavy-duty curtain track to prevent rod sag.',
    });
  }

  if (windowWidthMm > MAX_CURTAIN_WINDOW_MM) {
    warnings.push({
      level: 'warning',
      code: 'OVERSIZED_WINDOW',
      message: 'Very wide window (over 15 ft) — standard hardware will sag at this span. Custom curtain tracks or ceiling-mounted systems are recommended.',
    });
  }

  if (totalWidthMm < rodLengthMm * 1.5) {
    warnings.push({
      level: 'warning',
      code: 'CURTAIN_TOO_NARROW',
      message: 'Curtain width is below the minimum 1.5× fullness. The panels will look sparse and may not provide adequate coverage.',
    });
  }

  if (mountType === 'inside' && windowWidthMm < 304.8) {
    warnings.push({
      level: 'warning',
      code: 'INSIDE_MOUNT_TIGHT',
      message: 'Inside mount on a narrow window — ensure brackets and rod hardware fit within the frame depth (typically need 1–2 in).',
    });
  }

  if (floorPosition === 'floor' || floorPosition === 'puddle') {
    if (input.rodToFloorMm < rodLengthMm) {
      warnings.push({
        level: 'warning',
        code: 'ROD_TOO_HIGH',
        message: 'The rod-to-floor distance entered is less than the rod length. Double-check your measurement.',
      });
    }
  }

  if (dropMm > 3048) {
    warnings.push({
      level: 'warning',
      code: 'VERY_LONG_DROP',
      message: 'Very long curtain drop (over 10 ft). Standard ready-made panels are typically 84, 96, or 108 in. Custom fabrication will likely be needed.',
    });
  }

  return warnings;
}

// ─────────────────────────────────────────────────────────────────────────────
// Recommendations
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Build structured recommendations for the curtain configuration.
 */
export function buildCurtainRecommendations(
  input: CurtainInput,
  result: Pick<CurtainResult, 'rodLengthMm' | 'sideExtensionMm' | 'totalWidthMm' | 'fullnessRatio' | 'headerHeightMm'>,
): CurtainRecommendationItem[] {
  const recs: CurtainRecommendationItem[] = [];
  const { style, fullness, mountType, panelCount } = input;
  const { sideExtensionMm, fullnessRatio, headerHeightMm } = result;

  // Fullness advice
  if (fullness <= 1.5) {
    recs.push({
      title: 'Increase fullness for a better look',
      body: `At 1.5× fullness, curtains sit flat and won't look gathered when closed. For the ${style.replace('-', ' ')} style, ${STYLE_FULLNESS[style]}× fullness (${(STYLE_FULLNESS[style] * 100 - 100).toFixed(0)}% extra fabric) gives the best drape.`,
      tip: 'Tip: Order curtain panels rated for 2–2.5× fullness to have fabric to spare.',
    });
  } else if (fullnessRatio >= 2.5) {
    recs.push({
      title: 'Luxury fullness selected',
      body: `At ${fullnessRatio.toFixed(1)}× fullness, your curtains will have a rich, gathered appearance. This is the preferred look for formal rooms and pinch-pleat or rod-pocket headings.`,
    });
  } else {
    recs.push({
      title: 'Good fullness ratio',
      body: `${fullnessRatio.toFixed(1)}× fullness gives a neat, professional appearance that works well for most rooms. The panels will gently fold when closed and stack neatly when open.`,
    });
  }

  // Rod extension advice
  if (mountType === 'outside') {
    const extIn = (sideExtensionMm / 25.4).toFixed(1);
    recs.push({
      title: `Rod extends ${extIn}" past the window on each side`,
      body: 'Extending the rod past the window frame lets curtain panels stack behind the glass when open — maximising daylight and making the window appear wider.',
      tip: 'For a wider look, extend the rod 6–8 in past each side. For a light-blocking bedroom, 3–4 in is sufficient.',
    });
  } else {
    recs.push({
      title: 'Inside mount selected',
      body: 'Inside-mount curtains sit inside the window frame for a clean, tailored look. This style works best when the window recess is at least 2 in deep to accommodate brackets.',
      tip: 'Inside mount curtains cannot block light at the frame edges. For a blackout effect, use outside mount.',
    });
  }

  // Style-specific header advice
  const headerIn = (headerHeightMm / 25.4).toFixed(1);
  const styleAdvice: Record<CurtainStyle, string> = {
    'standard':    `Standard (rod/back-tab) curtains need a ${headerIn} in header. Ensure the top of the panel is sewn straight for a professional finish.`,
    'grommet':     `Grommet curtains hang from metal rings — no header tape required. The ${headerIn} in heading height is built into the panel. Choose grommets in brass or matte black to complement hardware.`,
    'rod-pocket':  `Rod-pocket curtains slide directly onto the rod. The ${headerIn} in pocket accommodates most 1–1.5 in diameter rods. Allow extra fabric for gathering.`,
    'pinch-pleat': `Pinch-pleat curtains require a ${headerIn} in header and pleat tape or hooks. They provide the most structured, formal look and hold their shape when opened.`,
    'eyelet':      `Eyelet curtains have punched metal rings — similar to grommets. The ${headerIn} in header is reinforced. Choose a rod that fits through the eyelet opening (typically 1–1.5 in rod).`,
  };
  recs.push({
    title: `${style.charAt(0).toUpperCase() + style.slice(1).replace('-', ' ')} header: ${headerIn} in`,
    body: styleAdvice[style],
  });

  // Panel count advice
  if (panelCount === 1) {
    recs.push({
      title: 'Single panel (café style)',
      body: 'A single panel works well for café-style coverage on narrow windows or as a decorative accent. For full coverage and symmetry, two panels are recommended for most windows.',
    });
  } else if (panelCount === 4) {
    recs.push({
      title: 'Four-panel configuration',
      body: 'Four panels provide the richest, fullest look and allow flexible light control — open the outer two for ventilation while keeping the inner two closed for privacy.',
      tip: 'When stacked open, four panels create a very thick stack. Ensure your rod has enough room on each side.',
    });
  }

  // Common mistakes
  recs.push({
    title: 'Common buying mistakes to avoid',
    body: [
      `• Don't measure the glass — measure the full window frame (${(input.windowWidthMm / 25.4).toFixed(1)}" wide).`,
      '• Always order panels longer than you need — you can hem, but you cannot add length.',
      '• Check the panel width listed is per panel, not per pair.',
      '• Pre-wash fabric before measuring and cutting to account for shrinkage.',
    ].join('\n'),
  });

  return recs;
}

// ─────────────────────────────────────────────────────────────────────────────
// Main calculation
// ─────────────────────────────────────────────────────────────────────────────

/**
 * Calculate complete curtain sizing from window dimensions and preferences.
 *
 * @param input  All curtain inputs (dimensions, mount type, style, etc.)
 * @returns      Full curtain result including dimensions, fabric, and recommendations
 *
 * @example
 * calculateCurtain({
 *   windowWidthMm: 1219.2,   // 48"
 *   windowHeightMm: 1524,    // 60"
 *   mountType: 'outside',
 *   style: 'grommet',
 *   fullness: 2,
 *   floorPosition: 'floor',
 *   rodPosition: 'above-window',
 *   rodCustomOffsetMm: 127,
 *   rodToFloorMm: 2133.6,
 *   panelCount: 2,
 * })
 */
export function calculateCurtain(input: CurtainInput): CurtainResult {
  const {
    windowWidthMm,
    windowHeightMm,
    mountType,
    style,
    fullness,
    floorPosition,
    rodPosition,
    rodCustomOffsetMm,
    rodToFloorMm,
    panelCount,
  } = input;

  // ── Rod geometry ─────────────────────────────────────────────────────────
  const { rodLengthMm, sideExtensionMm } = calcRodLength(windowWidthMm, mountType);
  const rodAboveWindowMm = calcRodAbove(rodPosition, rodCustomOffsetMm);

  // ── Drop ─────────────────────────────────────────────────────────────────
  const dropMm = calcDrop(windowHeightMm, rodAboveWindowMm, floorPosition, rodToFloorMm);

  // ── Widths ────────────────────────────────────────────────────────────────
  const {
    totalWidthMm,
    panelWidthMm,
    minWidthMm,
    idealWidthMm,
    maxWidthMm,
    fullnessRatio,
  } = calcWidths(rodLengthMm, fullness, panelCount);

  // ── Header & fabric ───────────────────────────────────────────────────────
  const headerHeightMm = HEADER_HEIGHTS_MM[style];
  const {
    fabricWidthPerPanelMm,
    fabricDropMm,
    totalFabricWidthMm,
  } = calcFabric(panelWidthMm, dropMm, headerHeightMm, panelCount);

  const recommendedFullness = STYLE_FULLNESS[style];

  // ── Warnings & recommendations ────────────────────────────────────────────
  const partialResult = { rodLengthMm, totalWidthMm, dropMm, sideExtensionMm, fullnessRatio, headerHeightMm };
  const warnings        = buildCurtainWarnings(input, partialResult);
  const recommendations = buildCurtainRecommendations(input, partialResult);

  return {
    rodLengthMm,
    sideExtensionMm,
    rodAboveWindowMm,
    totalWidthMm,
    panelWidthMm,
    dropMm,
    minWidthMm,
    idealWidthMm,
    maxWidthMm,
    fullnessRatio,
    recommendedFullness,
    fabricWidthPerPanelMm,
    fabricDropMm,
    totalFabricWidthMm,
    headerHeightMm,
    warnings,
    recommendations,
  };
}
