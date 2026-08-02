import { describe, it, expect } from 'vitest';
import {
  calculateEgressWindow,
  calcNetClearDimensions,
  calcOpeningArea,
  checkEgressCompliance,
  calcComplianceScore,
  calcRecommendedDimensions,
  buildEgressWarnings,
  IRC_EGRESS_DEFAULTS,
  STYLE_OPENING_PERCENTAGES,
  MEASUREMENT_FACTORS,
  LOCATION_PROFILES,
  type EgressInput,
  type EgressWindowStyle,
  type EgressMeasurementType,
  type EgressLocation,
} from '../egress.js';

import { buildEgressRecommendations } from '../egress-recommendations.js';
import { toMm } from '../units.js';

const COMPLIANT_CASEMENT: EgressInput = {
  windowWidthMm: 914.4,  // 36 inches
  windowHeightMm: 1219.2, // 48 inches
  windowStyle: 'casement',
  measurementType: 'clear-opening',
  location: 'bedroom',
  sillHeightMm: 914.4, // 36 inches
};

const NON_COMPLIANT_SLIDING: EgressInput = {
  windowWidthMm: 914.4,  // 36 inches
  windowHeightMm: 914.4,  // 36 inches
  windowStyle: 'sliding',
  measurementType: 'clear-opening',
  location: 'bedroom',
  sillHeightMm: 914.4,
};

describe('Egress Window Engine', () => {
  describe('IRC_EGRESS_DEFAULTS & Constants', () => {
    it('defines standard minimum net clear opening area as 5.7 sq ft', () => {
      expect(IRC_EGRESS_DEFAULTS.MIN_NET_CLEAR_AREA_SQFT_STANDARD).toBe(5.7);
    });

    it('defines grade floor minimum net clear opening area as 5.0 sq ft', () => {
      expect(IRC_EGRESS_DEFAULTS.MIN_NET_CLEAR_AREA_SQFT_GRADE).toBe(5.0);
    });

    it('defines minimum net clear opening width as 20.0 inches (508.0 mm)', () => {
      expect(IRC_EGRESS_DEFAULTS.MIN_NET_CLEAR_WIDTH_MM).toBeCloseTo(508.0, 1);
    });

    it('defines minimum net clear opening height as 24.0 inches (609.6 mm)', () => {
      expect(IRC_EGRESS_DEFAULTS.MIN_NET_CLEAR_HEIGHT_MM).toBeCloseTo(609.6, 1);
    });

    it('defines maximum sill height as 44.0 inches (1117.6 mm)', () => {
      expect(IRC_EGRESS_DEFAULTS.MAX_SILL_HEIGHT_MM).toBeCloseTo(1117.6, 1);
    });

    it('has valid opening percentage for casement (90%)', () => {
      expect(STYLE_OPENING_PERCENTAGES.casement).toBe(90);
    });

    it('has valid opening percentage for sliding (45%)', () => {
      expect(STYLE_OPENING_PERCENTAGES.sliding).toBe(45);
    });

    it('has valid opening percentage for single-hung (45%)', () => {
      expect(STYLE_OPENING_PERCENTAGES['single-hung']).toBe(45);
    });

    it('has valid opening percentage for double-hung (42%)', () => {
      expect(STYLE_OPENING_PERCENTAGES['double-hung']).toBe(42);
    });

    it('has valid opening percentage for awning (75%)', () => {
      expect(STYLE_OPENING_PERCENTAGES.awning).toBe(75);
    });

    it('has valid opening percentage for hopper (80%)', () => {
      expect(STYLE_OPENING_PERCENTAGES.hopper).toBe(80);
    });

    it('has valid opening percentage for picture (0%)', () => {
      expect(STYLE_OPENING_PERCENTAGES.picture).toBe(0);
    });

    it('has valid measurement factors for all 3 types', () => {
      expect(MEASUREMENT_FACTORS['clear-opening']).toBe(1.0);
      expect(MEASUREMENT_FACTORS['existing-opening']).toBe(0.92);
      expect(MEASUREMENT_FACTORS['rough-opening']).toBe(0.85);
    });

    it('has valid location profile for basement', () => {
      expect(LOCATION_PROFILES.basement.minAreaSqFt).toBe(5.7);
      expect(LOCATION_PROFILES.basement.requiresEmergencyEscape).toBe(true);
      expect(LOCATION_PROFILES.basement.requiresWindowWell).toBe(true);
    });

    it('has valid location profile for bedroom', () => {
      expect(LOCATION_PROFILES.bedroom.minAreaSqFt).toBe(5.7);
      expect(LOCATION_PROFILES.bedroom.requiresEmergencyEscape).toBe(true);
    });

    it('has valid location profile for living-room', () => {
      expect(LOCATION_PROFILES['living-room'].minAreaSqFt).toBe(5.0);
    });

    it('has valid location profile for other', () => {
      expect(LOCATION_PROFILES.other.minAreaSqFt).toBe(5.0);
    });
  });

  describe('calcNetClearDimensions', () => {
    it('calculates casement net clear dimensions (~90% width efficiency)', () => {
      const { netClearWidthMm, netClearHeightMm } = calcNetClearDimensions(1000, 1500, 'casement', 'clear-opening');
      expect(netClearWidthMm).toBeCloseTo(900, 1);
      expect(netClearHeightMm).toBeCloseTo(1425, 1);
    });

    it('calculates sliding net clear dimensions (~45% width efficiency)', () => {
      const { netClearWidthMm, netClearHeightMm } = calcNetClearDimensions(1000, 1500, 'sliding', 'clear-opening');
      expect(netClearWidthMm).toBeCloseTo(450, 1);
      expect(netClearHeightMm).toBeCloseTo(1380, 1);
    });

    it('calculates single-hung net clear dimensions (~45% height efficiency)', () => {
      const { netClearWidthMm, netClearHeightMm } = calcNetClearDimensions(1000, 1500, 'single-hung', 'clear-opening');
      expect(netClearWidthMm).toBeCloseTo(920, 1);
      expect(netClearHeightMm).toBeCloseTo(675, 1);
    });

    it('calculates double-hung net clear dimensions (~42% height efficiency)', () => {
      const { netClearWidthMm, netClearHeightMm } = calcNetClearDimensions(1000, 1500, 'double-hung', 'clear-opening');
      expect(netClearWidthMm).toBeCloseTo(920, 1);
      expect(netClearHeightMm).toBeCloseTo(630, 1);
    });

    it('calculates awning net clear dimensions (~75% efficiency)', () => {
      const { netClearWidthMm, netClearHeightMm } = calcNetClearDimensions(1000, 1500, 'awning', 'clear-opening');
      expect(netClearWidthMm).toBeGreaterThan(0);
      expect(netClearHeightMm).toBeGreaterThan(0);
    });

    it('calculates hopper net clear dimensions (~80% efficiency)', () => {
      const { netClearWidthMm, netClearHeightMm } = calcNetClearDimensions(1000, 1500, 'hopper', 'clear-opening');
      expect(netClearWidthMm).toBeGreaterThan(0);
      expect(netClearHeightMm).toBeGreaterThan(0);
    });

    it('returns 0 net clear for picture windows', () => {
      const { netClearWidthMm, netClearHeightMm } = calcNetClearDimensions(1000, 1500, 'picture', 'clear-opening');
      expect(netClearWidthMm).toBe(0);
      expect(netClearHeightMm).toBe(0);
    });

    it('applies existing-opening measurement factor (0.92)', () => {
      const clear = calcNetClearDimensions(1000, 1500, 'casement', 'clear-opening');
      const existing = calcNetClearDimensions(1000, 1500, 'casement', 'existing-opening');
      expect(existing.netClearWidthMm).toBeLessThan(clear.netClearWidthMm);
    });

    it('applies rough-opening measurement factor (0.85)', () => {
      const clear = calcNetClearDimensions(1000, 1500, 'casement', 'clear-opening');
      const rough = calcNetClearDimensions(1000, 1500, 'casement', 'rough-opening');
      expect(rough.netClearWidthMm).toBeLessThan(clear.netClearWidthMm);
    });

    it('supports custom opening percentage override', () => {
      const custom = calcNetClearDimensions(1000, 1500, 'sliding', 'clear-opening', 60);
      expect(custom.openingPercentage).toBe(60);
    });
  });

  describe('calcOpeningArea', () => {
    it('calculates opening area in m² and sq ft', () => {
      const { openingAreaM2, openingAreaSqFt } = calcOpeningArea(1000, 1000);
      expect(openingAreaM2).toBe(1.0);
      expect(openingAreaSqFt).toBeCloseTo(10.7639, 2);
    });

    it('handles 0x0 dimensions', () => {
      const { openingAreaM2, openingAreaSqFt } = calcOpeningArea(0, 0);
      expect(openingAreaM2).toBe(0);
      expect(openingAreaSqFt).toBe(0);
    });
  });

  describe('checkEgressCompliance', () => {
    it('passes for compliant 36x48 in casement window', () => {
      const { pass, complianceStatus } = checkEgressCompliance(822.9, 1158.2, 10.27, 'bedroom', 914.4);
      expect(pass).toBe(true);
      expect(complianceStatus).toBe('pass');
    });

    it('fails when opening area is below 5.7 sq ft', () => {
      const { pass, complianceStatus } = checkEgressCompliance(600, 600, 3.87, 'bedroom', 914.4);
      expect(pass).toBe(false);
      expect(complianceStatus).toBe('fail');
    });

    it('fails when net clear width is below 20 inches (508 mm)', () => {
      const { pass } = checkEgressCompliance(450, 1500, 7.26, 'bedroom', 914.4);
      expect(pass).toBe(false);
    });

    it('fails when net clear height is below 24 inches (609.6 mm)', () => {
      const { pass } = checkEgressCompliance(1000, 500, 5.38, 'bedroom', 914.4);
      expect(pass).toBe(false);
    });

    it('fails when sill height exceeds 44 inches (1117.6 mm)', () => {
      const { pass } = checkEgressCompliance(800, 1000, 8.61, 'bedroom', 1200);
      expect(pass).toBe(false);
    });

    it('uses 5.0 sq ft minimum for living room / ground floor', () => {
      const { minRequiredAreaSqFt } = checkEgressCompliance(800, 800, 5.2, 'living-room', 914.4);
      expect(minRequiredAreaSqFt).toBe(5.0);
    });

    it('assigns warning compliance status when area passes but width/height is borderline', () => {
      const { complianceStatus } = checkEgressCompliance(500, 1200, 6.0, 'bedroom', 914.4);
      expect(complianceStatus).toBe('warning');
    });
  });

  describe('calcComplianceScore', () => {
    it('returns 100 for fully compliant egress opening', () => {
      const score = calcComplianceScore(800, 1000, 8.61, 'bedroom', 914.4);
      expect(score).toBe(100);
    });

    it('returns proportional score for partial openings', () => {
      const score = calcComplianceScore(400, 500, 2.5, 'bedroom', 914.4);
      expect(score).toBeGreaterThan(0);
      expect(score).toBeLessThan(100);
    });

    it('penalizes score when sill height exceeds 44 inches', () => {
      const normalScore = calcComplianceScore(800, 1000, 8.61, 'bedroom', 914.4);
      const highSillScore = calcComplianceScore(800, 1000, 8.61, 'bedroom', 1200);
      expect(highSillScore).toBeLessThan(normalScore);
    });
  });

  describe('calcRecommendedDimensions', () => {
    it('recommends 24x48 in frame for casement window', () => {
      const rec = calcRecommendedDimensions('casement', 'bedroom');
      expect(rec.recommendedWidthMm).toBeCloseTo(609.6, 1);
      expect(rec.recommendedHeightMm).toBeCloseTo(1219.2, 1);
    });

    it('recommends 48x48 in frame for sliding window', () => {
      const rec = calcRecommendedDimensions('sliding', 'bedroom');
      expect(rec.recommendedWidthMm).toBeCloseTo(1219.2, 1);
    });

    it('recommends 36x60 in frame for double-hung window', () => {
      const rec = calcRecommendedDimensions('double-hung', 'bedroom');
      expect(rec.recommendedWidthMm).toBeCloseTo(914.4, 1);
      expect(rec.recommendedHeightMm).toBeCloseTo(1524.0, 1);
    });
  });

  describe('buildEgressWarnings', () => {
    it('generates error for picture window', () => {
      const input: EgressInput = { ...COMPLIANT_CASEMENT, windowStyle: 'picture' };
      const warnings = buildEgressWarnings(input, { netClearWidthMm: 0, netClearHeightMm: 0, openingAreaSqFt: 0 });
      expect(warnings.some((w) => w.code === 'PICTURE_WINDOW_NON_OPERABLE')).toBe(true);
    });

    it('generates error for width below 20 inches', () => {
      const warnings = buildEgressWarnings(COMPLIANT_CASEMENT, { netClearWidthMm: 450 });
      expect(warnings.some((w) => w.code === 'WIDTH_TOO_NARROW')).toBe(true);
    });

    it('generates error for height below 24 inches', () => {
      const warnings = buildEgressWarnings(COMPLIANT_CASEMENT, { netClearHeightMm: 500 });
      expect(warnings.some((w) => w.code === 'HEIGHT_TOO_SHORT')).toBe(true);
    });

    it('generates error for area below 5.7 sq ft', () => {
      const warnings = buildEgressWarnings(COMPLIANT_CASEMENT, { openingAreaSqFt: 4.5, minRequiredAreaSqFt: 5.7 });
      expect(warnings.some((w) => w.code === 'AREA_TOO_SMALL')).toBe(true);
    });

    it('generates warning for sill height > 44 inches', () => {
      const input: EgressInput = { ...COMPLIANT_CASEMENT, sillHeightMm: 1200 };
      const warnings = buildEgressWarnings(input, {});
      expect(warnings.some((w) => w.code === 'SILL_TOO_HIGH')).toBe(true);
    });

    it('generates info suggesting casement style for failed sliding window', () => {
      const warnings = buildEgressWarnings(NON_COMPLIANT_SLIDING, { pass: false });
      expect(warnings.some((w) => w.code === 'CASEMENT_RECOMMENDED')).toBe(true);
    });

    it('generates info for basement window well requirement', () => {
      const input: EgressInput = { ...COMPLIANT_CASEMENT, location: 'basement' };
      const warnings = buildEgressWarnings(input, {});
      expect(warnings.some((w) => w.code === 'WINDOW_WELL_REQUIRED')).toBe(true);
    });
  });

  describe('calculateEgressWindow integration', () => {
    it('calculates complete EgressResult for compliant 36x48 in casement', () => {
      const result = calculateEgressWindow(COMPLIANT_CASEMENT);

      expect(result.pass).toBe(true);
      expect(result.complianceStatus).toBe('pass');
      expect(result.netClearWidthMm).toBeGreaterThan(508);
      expect(result.netClearHeightMm).toBeGreaterThan(609.6);
      expect(result.openingAreaSqFt).toBeGreaterThan(5.7);
      expect(result.areaShortfallSqFt).toBe(0);
      expect(result.widthShortfallMm).toBe(0);
      expect(result.heightShortfallMm).toBe(0);
      expect(result.complianceScore).toBe(100);
      expect(result.confidence).toBe('excellent');
    });

    it('calculates complete EgressResult for non-compliant 36x36 in sliding window', () => {
      const result = calculateEgressWindow(NON_COMPLIANT_SLIDING);

      expect(result.pass).toBe(false);
      expect(result.complianceStatus).toBe('fail');
      expect(result.areaShortfallSqFt).toBeGreaterThan(0);
      expect(result.confidence).toBe('custom-required');
    });

    it('runs across all 7 window styles without error', () => {
      const styles: EgressWindowStyle[] = ['casement', 'sliding', 'single-hung', 'double-hung', 'awning', 'hopper', 'picture'];
      styles.forEach((st) => {
        const result = calculateEgressWindow({ ...COMPLIANT_CASEMENT, windowStyle: st });
        expect(result.openingPercentage).toBeDefined();
      });
    });

    it('runs across all 3 measurement types without error', () => {
      const types: EgressMeasurementType[] = ['clear-opening', 'existing-opening', 'rough-opening'];
      types.forEach((mt) => {
        const result = calculateEgressWindow({ ...COMPLIANT_CASEMENT, measurementType: mt });
        expect(result.netClearWidthMm).toBeGreaterThan(0);
      });
    });

    it('runs across all 4 locations without error', () => {
      const locations: EgressLocation[] = ['basement', 'bedroom', 'living-room', 'other'];
      locations.forEach((loc) => {
        const result = calculateEgressWindow({ ...COMPLIANT_CASEMENT, location: loc });
        expect(result.minRequiredAreaSqFt).toBeGreaterThan(0);
      });
    });
  });

  describe('Recommendations Module', () => {
    it('builds recommendation set for compliant window', () => {
      const result = calculateEgressWindow(COMPLIANT_CASEMENT);
      const recs = buildEgressRecommendations(COMPLIANT_CASEMENT, result);

      expect(recs.complianceStatus).toBe('pass');
      expect(recs.inspectionChecklist).toHaveLength(6);
      expect(recs.items.length).toBeGreaterThanOrEqual(5);
    });

    it('builds recommendation set for non-compliant window explaining shortfall', () => {
      const result = calculateEgressWindow(NON_COMPLIANT_SLIDING);
      const recs = buildEgressRecommendations(NON_COMPLIANT_SLIDING, result);

      expect(recs.complianceStatus).toBe('fail');
      expect(recs.whyPassFail).toContain('Fails IRC R310');
      expect(recs.suggestedImprovements).toContain('Casement');
    });
  });

  describe('UNIT CONVERSION REGRESSION TEST', () => {
    it('produces mathematically identical net clear dimensions across input units', () => {
      const inW = 36, inH = 48;
      const mmW = toMm(inW, 'in'); // 914.4 mm
      const mmH = toMm(inH, 'in'); // 1219.2 mm
      const cmW = toMm(inW * 2.54, 'cm');
      const cmH = toMm(inH * 2.54, 'cm');
      const mW = toMm(inW * 0.0254, 'm');
      const mH = toMm(inH * 0.0254, 'm');

      const resIn = calculateEgressWindow({ ...COMPLIANT_CASEMENT, windowWidthMm: toMm(inW, 'in'), windowHeightMm: toMm(inH, 'in') });
      const resMm = calculateEgressWindow({ ...COMPLIANT_CASEMENT, windowWidthMm: mmW, windowHeightMm: mmH });
      const resCm = calculateEgressWindow({ ...COMPLIANT_CASEMENT, windowWidthMm: cmW, windowHeightMm: cmH });
      const resM = calculateEgressWindow({ ...COMPLIANT_CASEMENT, windowWidthMm: mW, windowHeightMm: mH });

      expect(resIn.netClearWidthMm).toBeCloseTo(resMm.netClearWidthMm, 3);
      expect(resIn.netClearHeightMm).toBeCloseTo(resMm.netClearHeightMm, 3);
      expect(resCm.netClearWidthMm).toBeCloseTo(resMm.netClearWidthMm, 3);
      expect(resCm.netClearHeightMm).toBeCloseTo(resMm.netClearHeightMm, 3);
      expect(resM.netClearWidthMm).toBeCloseTo(resMm.netClearWidthMm, 3);
      expect(resM.netClearHeightMm).toBeCloseTo(resMm.netClearHeightMm, 3);
    });
  });
});
