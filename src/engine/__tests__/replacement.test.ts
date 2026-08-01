import { describe, it, expect } from 'vitest';
import {
  calculateReplacementWindow,
  REPLACEMENT_THRESHOLDS,
  SHIM_SPACE_FULL_FRAME_MM,
  SHIM_SPACE_INSERT_MM,
  SHIM_SPACE_NEW_CONST_MM,
} from '../replacement.js';
import { buildReplacementRecommendations } from '../replacement-recommendations.js';
import type { DetailedReplacementInput } from '@/types/calculator.js';

describe('Replacement Window Calculation Engine', () => {
  describe('Threshold Constants', () => {
    it('defines replacement threshold constants without magic numbers', () => {
      expect(REPLACEMENT_THRESHOLDS.EXCELLENT_MAX_DISTANCE_IN).toBe(0.5);
      expect(REPLACEMENT_THRESHOLDS.GOOD_MAX_DISTANCE_IN).toBe(2.0);
      expect(REPLACEMENT_THRESHOLDS.POSSIBLE_MAX_DISTANCE_IN).toBe(4.0);
      expect(REPLACEMENT_THRESHOLDS.CUSTOM_MIN_DISTANCE_IN).toBe(4.0);
      expect(REPLACEMENT_THRESHOLDS.MAX_MATCH_SCORE_DISTANCE_IN).toBe(12.0);
    });

    it('defines standard shim spaces in mm', () => {
      expect(SHIM_SPACE_INSERT_MM).toBe(6.35);
      expect(SHIM_SPACE_FULL_FRAME_MM).toBe(12.7);
      expect(SHIM_SPACE_NEW_CONST_MM).toBe(12.7);
    });
  });

  describe('calculateReplacementWindow — Exact & Near Matches', () => {
    it('identifies exact US standard size (36" × 60")', () => {
      const input: DetailedReplacementInput = {
        width: 36,
        height: 60,
        unit: 'in',
        region: 'US',
        measurementType: 'existing-window',
        windowType: 'double-hung',
        installationType: 'full-frame',
      };

      const result = calculateReplacementWindow(input);

      expect(result.standardMatch.nearest.widthIn).toBe(36);
      expect(result.standardMatch.nearest.heightIn).toBe(60);
      expect(result.distanceIn).toBeLessThan(0.1);
      expect(result.matchPercentage).toBeGreaterThanOrEqual(99);
      expect(result.confidence).toBe('excellent');
      expect(result.requiresCustomOrder).toBe(false);
      expect(result.costImpact).toBe('standard-lowest');
    });

    it('identifies near US match (36.3" × 60.1")', () => {
      const input: DetailedReplacementInput = {
        width: 36.3,
        height: 60.1,
        unit: 'in',
        region: 'US',
        measurementType: 'existing-window',
        windowType: 'double-hung',
        installationType: 'full-frame',
      };

      const result = calculateReplacementWindow(input);

      expect(result.standardMatch.nearest.widthIn).toBe(36);
      expect(result.standardMatch.nearest.heightIn).toBe(60);
      expect(result.distanceIn).toBeLessThanOrEqual(0.5);
      expect(result.confidence).toBe('excellent');
      expect(result.requiresCustomOrder).toBe(false);
    });
  });

  describe('calculateReplacementWindow — Custom Window Threshold', () => {
    it('requires custom window order when distance >= 4 inches', () => {
      // 53" × 83" is far from standard residential sizes
      const input: DetailedReplacementInput = {
        width: 53,
        height: 83,
        unit: 'in',
        region: 'US',
        measurementType: 'existing-window',
        windowType: 'custom',
        installationType: 'full-frame',
      };

      const result = calculateReplacementWindow(input);

      expect(result.distanceIn).toBeGreaterThanOrEqual(4.0);
      expect(result.confidence).toBe('custom-required');
      expect(result.requiresCustomOrder).toBe(true);
      expect(result.costImpact).toBe('custom-higher');
    });
  });

  describe('calculateReplacementWindow — All Supported Regions', () => {
    it('calculates replacement sizes for UK region (900mm × 1200mm)', () => {
      const input: DetailedReplacementInput = {
        width: 900,
        height: 1200,
        unit: 'mm',
        region: 'UK',
        measurementType: 'existing-window',
        windowType: 'casement',
        installationType: 'full-frame',
      };

      const result = calculateReplacementWindow(input);
      expect(result.region).toBe('UK');
      expect(result.standardMatch.nearest.widthMm).toBe(900);
      expect(result.standardMatch.nearest.heightMm).toBe(1200);
      expect(result.confidence).toBe('excellent');
    });

    it('calculates replacement sizes for Canada, Australia, and Europe', () => {
      const regions = ['CA', 'AU', 'EU'] as const;
      for (const reg of regions) {
        const input: DetailedReplacementInput = {
          width: 30,
          height: 50,
          unit: 'in',
          region: reg,
          measurementType: 'existing-window',
          windowType: 'single-hung',
          installationType: 'full-frame',
        };
        const result = calculateReplacementWindow(input);
        expect(result.region).toBe(reg);
        expect(result.standardMatch.nearest).toBeDefined();
      }
    });
  });

  describe('calculateReplacementWindow — Measurement Profiles & Installation Types', () => {
    it('adjusts net frame size when measuring rough opening', () => {
      const input: DetailedReplacementInput = {
        width: 37,
        height: 61,
        unit: 'in',
        region: 'US',
        measurementType: 'rough-opening',
        windowType: 'double-hung',
        installationType: 'full-frame',
      };

      const result = calculateReplacementWindow(input);
      // Rough opening 37" x 61" minus 1" shim = 36" x 60" frame
      expect(result.frameWidthMm).toBeLessThan(result.widthMm);
      expect(result.frameHeightMm).toBeLessThan(result.heightMm);
      expect(result.standardMatch.nearest.widthIn).toBe(36);
      expect(result.standardMatch.nearest.heightIn).toBe(60);
    });

    it('applies insert replacement shim space (6.35 mm per side)', () => {
      const input: DetailedReplacementInput = {
        width: 36,
        height: 54,
        unit: 'in',
        region: 'US',
        measurementType: 'existing-window',
        windowType: 'double-hung',
        installationType: 'insert',
      };

      const result = calculateReplacementWindow(input);
      expect(result.shimSpaceMm).toBe(6.35);
      expect(result.roughOpeningWidthMm).toBe(Math.round(result.frameWidthMm + 12.7));
    });

    it('applies new construction installation type and DIY difficulty', () => {
      const input: DetailedReplacementInput = {
        width: 36,
        height: 60,
        unit: 'in',
        region: 'US',
        measurementType: 'existing-window',
        windowType: 'picture',
        installationType: 'new-construction',
      };

      const result = calculateReplacementWindow(input);
      expect(result.installationType).toBe('new-construction');
      expect(result.diyDifficulty).toBe('professional-recommended');
    });
  });

  describe('buildReplacementRecommendations — UI Recommendation Builder', () => {
    it('generates complete recommendation set with trust explanation and star rating', () => {
      const input: DetailedReplacementInput = {
        width: 36,
        height: 60,
        unit: 'in',
        region: 'US',
        measurementType: 'existing-window',
        windowType: 'double-hung',
        installationType: 'full-frame',
      };

      const calcResult = calculateReplacementWindow(input);
      const recs = buildReplacementRecommendations(calcResult);

      expect(recs.whyThisSize).toContain('36" × 60"');
      expect(recs.starRating).toBe('★★★★★');
      expect(recs.starText).toBeDefined();
      expect(recs.frameRecommendation).toContain('Full-frame replacement');
      expect(recs.costImpactTitle).toContain('Standard');
      expect(recs.diyTitle).toBeDefined();
      expect(recs.cards.length).toBeGreaterThanOrEqual(3);
      expect(recs.installationNotes.length).toBeGreaterThanOrEqual(4);
    });

    it('generates custom order recommendation card when custom required', () => {
      const input: DetailedReplacementInput = {
        width: 53,
        height: 83,
        unit: 'in',
        region: 'US',
        measurementType: 'existing-window',
        windowType: 'custom',
        installationType: 'full-frame',
      };

      const calcResult = calculateReplacementWindow(input);
      const recs = buildReplacementRecommendations(calcResult);

      expect(recs.starRating).toBe('★★☆☆☆');
      expect(recs.costImpactTitle).toContain('Custom');
      const warningCard = recs.cards.find((c) => c.status === 'warning');
      expect(warningCard).toBeDefined();
      expect(warningCard?.title).toContain('Custom Factory Manufactured');
    });
  });
});
