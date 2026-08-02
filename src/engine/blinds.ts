/**
 * Engine for blind size calculations.
 * All dimensions are in millimeters (mm).
 */

export type BlindType = 'roller' | 'venetian' | 'vertical' | 'roman' | 'cellular' | 'zebra' | 'mini-blind' | 'wood' | 'faux-wood';
export type BlindMountType = 'inside' | 'outside';
export type BlindControlSide = 'left' | 'right';
export type BlindsWarnLevel = 'error' | 'warning' | 'info';
export type BlindsConfidence = 'excellent' | 'good' | 'minor-adjustment' | 'custom-required';
export type BlindCostTier = '$' | '$$' | '$$$' | '$$$$';
export type BlindsOrderingRecommendation = 'exact' | 'next-stock' | 'trim' | 'custom';

export interface BlindsWarning {
  level: BlindsWarnLevel;
  code: string;
  message: string;
}

export interface BlindsInput {
  windowWidthMm: number;
  windowHeightMm: number;
  mountType: BlindMountType;
  blindType: BlindType;
  windowDepthMm: number;
  headrailWidthMm?: number;
  headrailHeightMm?: number;
  frameDepthMm?: number;
  controlSide: BlindControlSide;
}

export interface BlindsResult {
  finishedWidthMm: number;
  finishedHeightMm: number;
  manufacturingDeductionMm: number;
  overlapMm: number;
  minimumDepthMm: number;
  recommendedDepthMm: number;
  clearanceMm: number;
  isMountSuitable: boolean;
  suitableMount: 'inside' | 'outside' | 'either';
  installationDifficulty: 'easy' | 'moderate' | 'professional';
  confidence: BlindsConfidence;
  costTier: BlindCostTier;
  stockWidthSuggestions: number[];
  stockHeightSuggestions: number[];
  orderingRecommendation: BlindsOrderingRecommendation;
  warnings: BlindsWarning[];
}

export interface BlindTypeSpec {
  minDepthMm: number;
  deductionPerSideMm: number;
  minWidthMm: number;
  minHeightMm: number;
  costTier: BlindCostTier;
  displayName: string;
}

export const BLIND_DEFAULTS = {
  INSIDE_DEDUCTION_STANDARD_MM: 12.7,   // 0.5" per side
  INSIDE_DEDUCTION_CELLULAR_MM: 9.525,  // 0.375" per side
  INSIDE_DEDUCTION_MINI_MM: 6.35,       // 0.25" per side
  OUTSIDE_OVERLAP_MM: 76.2,             // 3" per side standard
  TOP_OVERLAP_MM: 50.8,                 // 2" above frame
  BOTTOM_OVERLAP_MM: 25.4,              // 1" below sill
  DEPTH_BUFFER_MM: 12.7,                // comfortable clearance buffer
  MIN_WINDOW_WIDTH_MM: 152.4,           // 6" minimum
  MIN_WINDOW_HEIGHT_MM: 152.4,
  MAX_WINDOW_WIDTH_MM: 4572,            // 180" maximum
};

export const BLIND_TYPE_DATA: Record<BlindType, BlindTypeSpec> = {
  'roller': { minDepthMm: 38.1, deductionPerSideMm: BLIND_DEFAULTS.INSIDE_DEDUCTION_STANDARD_MM, minWidthMm: 152.4, minHeightMm: 304.8, costTier: '$$', displayName: 'Roller' },
  'venetian': { minDepthMm: 57.15, deductionPerSideMm: BLIND_DEFAULTS.INSIDE_DEDUCTION_STANDARD_MM, minWidthMm: 254, minHeightMm: 304.8, costTier: '$$', displayName: 'Venetian' },
  'vertical': { minDepthMm: 63.5, deductionPerSideMm: 0, minWidthMm: 508, minHeightMm: 457.2, costTier: '$$', displayName: 'Vertical' },
  'roman': { minDepthMm: 63.5, deductionPerSideMm: BLIND_DEFAULTS.INSIDE_DEDUCTION_STANDARD_MM, minWidthMm: 203.2, minHeightMm: 304.8, costTier: '$$$', displayName: 'Roman' },
  'cellular': { minDepthMm: 57.15, deductionPerSideMm: BLIND_DEFAULTS.INSIDE_DEDUCTION_CELLULAR_MM, minWidthMm: 152.4, minHeightMm: 304.8, costTier: '$$$', displayName: 'Cellular' },
  'zebra': { minDepthMm: 57.15, deductionPerSideMm: BLIND_DEFAULTS.INSIDE_DEDUCTION_STANDARD_MM, minWidthMm: 254, minHeightMm: 304.8, costTier: '$$$', displayName: 'Zebra' },
  'mini-blind': { minDepthMm: 25.4, deductionPerSideMm: BLIND_DEFAULTS.INSIDE_DEDUCTION_MINI_MM, minWidthMm: 152.4, minHeightMm: 304.8, costTier: '$', displayName: 'Mini Blind' },
  'wood': { minDepthMm: 57.15, deductionPerSideMm: BLIND_DEFAULTS.INSIDE_DEDUCTION_STANDARD_MM, minWidthMm: 254, minHeightMm: 304.8, costTier: '$$$', displayName: 'Wood' },
  'faux-wood': { minDepthMm: 57.15, deductionPerSideMm: BLIND_DEFAULTS.INSIDE_DEDUCTION_STANDARD_MM, minWidthMm: 254, minHeightMm: 304.8, costTier: '$$', displayName: 'Faux Wood' }
};

const stockWidthsInches = [18,19,20,21,22,23,24,25,26,27,28,29,30,31,32,33,34,35,36,38,40,42,44,46,48,54,60,66,72];
export const BLIND_STOCK_WIDTHS_MM = stockWidthsInches.map(w => w * 25.4);

const stockHeightsInches = [36,42,48,54,60,64,72,78,84];
export const BLIND_STOCK_HEIGHTS_MM = stockHeightsInches.map(h => h * 25.4);

export function validateBlindDimension(mm: number, field: 'width' | 'height' | 'depth'): { valid: boolean; level: BlindsWarnLevel; message?: string } {
    if (mm <= 0) return { valid: false, level: 'error', message: `Invalid ${field}` };
    if (field === 'width') {
        if (mm < BLIND_DEFAULTS.MIN_WINDOW_WIDTH_MM) return { valid: false, level: 'error', message: 'Width is below minimum' };
        if (mm > BLIND_DEFAULTS.MAX_WINDOW_WIDTH_MM) return { valid: false, level: 'error', message: 'Width exceeds maximum' };
    }
    if (field === 'height' && mm < BLIND_DEFAULTS.MIN_WINDOW_HEIGHT_MM) return { valid: false, level: 'error', message: 'Height is below minimum' };
    return { valid: true, level: 'info' };
}

export function calcInsideMount(windowWidthMm: number, windowHeightMm: number, blindType: BlindType) {
    const spec = BLIND_TYPE_DATA[blindType];
    const deduction = spec.deductionPerSideMm * 2;
    return {
        finishedWidthMm: windowWidthMm - deduction,
        finishedHeightMm: windowHeightMm,
        manufacturingDeductionMm: deduction,
        overlapMm: 0 as const,
    };
}

export function calcOutsideMount(windowWidthMm: number, windowHeightMm: number) {
    const overlapW = BLIND_DEFAULTS.OUTSIDE_OVERLAP_MM * 2;
    const overlapH = BLIND_DEFAULTS.TOP_OVERLAP_MM + BLIND_DEFAULTS.BOTTOM_OVERLAP_MM;
    return {
        finishedWidthMm: windowWidthMm + overlapW,
        finishedHeightMm: windowHeightMm + overlapH,
        manufacturingDeductionMm: 0 as const,
        overlapMm: BLIND_DEFAULTS.OUTSIDE_OVERLAP_MM,
    };
}

export function calcDepthCompatibility(windowDepthMm: number, blindType: BlindType): {
  minimumDepthMm: number;
  recommendedDepthMm: number;
  clearanceMm: number;
  isMountSuitable: boolean;
  suitableMount: 'inside' | 'outside' | 'either';
} {
    const spec = BLIND_TYPE_DATA[blindType];
    const recommendedDepthMm = spec.minDepthMm + BLIND_DEFAULTS.DEPTH_BUFFER_MM;
    const clearanceMm = windowDepthMm - spec.minDepthMm;
    const isMountSuitable = clearanceMm >= 0;
    
    let suitableMount: 'inside' | 'outside' | 'either' = 'either';
    if (!isMountSuitable) {
        suitableMount = 'outside';
    }
    
    return {
        minimumDepthMm: spec.minDepthMm,
        recommendedDepthMm,
        clearanceMm,
        isMountSuitable,
        suitableMount
    };
}

export function calcInstallationDifficulty(mountType: BlindMountType, blindType: BlindType, clearanceMm: number): 'easy' | 'moderate' | 'professional' {
    if (blindType === 'vertical' && mountType === 'inside') return 'professional';
    if (mountType === 'inside' && clearanceMm < 6.35) return 'moderate';
    if (blindType === 'roman' && mountType === 'inside') return 'moderate';
    if (mountType === 'outside') return 'easy';
    return 'easy';
}

export function calcConfidence(
  result: Pick<BlindsResult, 'isMountSuitable' | 'clearanceMm' | 'orderingRecommendation' | 'finishedWidthMm' | 'suitableMount'>, 
  input: BlindsInput
): BlindsConfidence {
    if (!result.isMountSuitable && input.mountType === 'inside') return 'custom-required';
    if (result.orderingRecommendation === 'custom') return 'custom-required';
    if (result.suitableMount === 'outside' && input.mountType === 'inside') return 'minor-adjustment';
    if (result.orderingRecommendation === 'trim') return 'minor-adjustment';
    
    if (result.isMountSuitable && result.clearanceMm >= BLIND_DEFAULTS.DEPTH_BUFFER_MM && 
        (result.orderingRecommendation === 'exact' || result.orderingRecommendation === 'next-stock')) {
        return 'excellent';
    }
    
    if (result.isMountSuitable && result.clearanceMm >= 0) {
        return 'good';
    }
    
    return 'good';
}

export function findClosestStockSizes(valueMm: number, stockSizes: number[], count: number): number[] {
    const sorted = [...stockSizes].sort((a, b) => Math.abs(a - valueMm) - Math.abs(b - valueMm));
    return sorted.slice(0, count).sort((a, b) => a - b);
}

export function calcOrderingRecommendation(finishedWidthMm: number, stockWidths: number[], toleranceMm: number): BlindsOrderingRecommendation {
    const exactMatch = stockWidths.find(w => Math.abs(w - finishedWidthMm) <= toleranceMm);
    if (exactMatch) return 'exact';
    const nextStock = stockWidths.find(w => w > finishedWidthMm && w - finishedWidthMm <= toleranceMm * 2);
    if (nextStock) return 'next-stock';
    const trimable = stockWidths.find(w => w > finishedWidthMm && w - finishedWidthMm <= 25.4 * 2);
    if (trimable) return 'trim';
    return 'custom';
}

export function buildBlindsWarnings(input: BlindsInput, result: Partial<BlindsResult>): BlindsWarning[] {
    const warnings: BlindsWarning[] = [];
    if (input.windowDepthMm < BLIND_TYPE_DATA[input.blindType].minDepthMm && input.mountType === 'inside') {
        warnings.push({ level: 'error', code: 'TOO_SHALLOW_INSIDE', message: 'Window is too shallow for inside mount.' });
    } else if (result.clearanceMm !== undefined && result.clearanceMm < BLIND_DEFAULTS.DEPTH_BUFFER_MM && input.mountType === 'inside') {
        warnings.push({ level: 'warning', code: 'TIGHT_DEPTH', message: 'Depth is tight, check hardware clearance.' });
    }
    if (!input.windowDepthMm) {
        warnings.push({ level: 'warning', code: 'DEPTH_NOT_PROVIDED', message: 'Depth not provided.' });
    }
    if (input.windowWidthMm < 300) {
        warnings.push({ level: 'info', code: 'VERY_SMALL_WINDOW', message: 'Very narrow window.' });
    }
    if (input.windowWidthMm > 3000) {
        warnings.push({ level: 'warning', code: 'VERY_WIDE_WINDOW', message: 'Very wide window.' });
    }
    if (input.blindType === 'vertical' && input.windowWidthMm < 1000) {
        warnings.push({ level: 'warning', code: 'VERTICAL_WIDE_ONLY', message: 'Vertical blinds are best for wide windows.' });
    }
    if (result.orderingRecommendation === 'custom') {
        warnings.push({ level: 'info', code: 'CUSTOM_WIDTH_REQUIRED', message: 'Custom width required.' });
    }
    if (result.orderingRecommendation === 'exact') {
        warnings.push({ level: 'info', code: 'STANDARD_SIZE_AVAILABLE', message: 'Standard size available.' });
    }
    return warnings;
}

export function calculateBlinds(input: BlindsInput): BlindsResult {
    let finishedWidthMm = 0;
    let finishedHeightMm = 0;
    let manufacturingDeductionMm = 0;
    let overlapMm = 0;

    if (input.mountType === 'inside') {
        const res = calcInsideMount(input.windowWidthMm, input.windowHeightMm, input.blindType);
        finishedWidthMm = res.finishedWidthMm;
        finishedHeightMm = res.finishedHeightMm;
        manufacturingDeductionMm = res.manufacturingDeductionMm;
        overlapMm = res.overlapMm;
    } else {
        const res = calcOutsideMount(input.windowWidthMm, input.windowHeightMm);
        finishedWidthMm = res.finishedWidthMm;
        finishedHeightMm = res.finishedHeightMm;
        manufacturingDeductionMm = res.manufacturingDeductionMm;
        overlapMm = res.overlapMm;
    }

    const depthComp = calcDepthCompatibility(input.windowDepthMm, input.blindType);
    const difficulty = calcInstallationDifficulty(input.mountType, input.blindType, depthComp.clearanceMm);
    const stockWidthSuggestions = findClosestStockSizes(finishedWidthMm, BLIND_STOCK_WIDTHS_MM, 3);
    const stockHeightSuggestions = findClosestStockSizes(finishedHeightMm, BLIND_STOCK_HEIGHTS_MM, 3);
    const orderingRecommendation = calcOrderingRecommendation(finishedWidthMm, BLIND_STOCK_WIDTHS_MM, 2);

    const costTier = BLIND_TYPE_DATA[input.blindType].costTier;

    const baseResult: Omit<BlindsResult, 'confidence' | 'warnings'> = {
        finishedWidthMm,
        finishedHeightMm,
        manufacturingDeductionMm,
        overlapMm,
        minimumDepthMm: depthComp.minimumDepthMm,
        recommendedDepthMm: depthComp.recommendedDepthMm,
        clearanceMm: depthComp.clearanceMm,
        isMountSuitable: depthComp.isMountSuitable,
        suitableMount: depthComp.suitableMount,
        installationDifficulty: difficulty,
        costTier,
        stockWidthSuggestions,
        stockHeightSuggestions,
        orderingRecommendation,
    };

    const confidence = calcConfidence(baseResult, input);
    const warnings = buildBlindsWarnings(input, baseResult);

    return {
        ...baseResult,
        confidence,
        warnings
    };
}
