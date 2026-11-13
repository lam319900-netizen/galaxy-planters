import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { CROPS_DATABASE } from '../../src/data/crops';
import { SEED_VARIETIES_DATABASE, getSeedVarietiesForCrop } from '../../src/data/seedVarieties';
import { 
  resolveFarmLocationGeography, 
  recommendBestSeedVariety 
} from '../../src/services/seedVarietyEngine';
import { generateRotationPlans } from '../../src/services/recommendationEngine';
import type { 
  CropId, 
  FarmAssessmentInput, 
  NasaPowerClimateData, 
  SoilData 
} from '../../src/types';

// Fixture helpers
const mockSoilStandard: SoilData = {
  soilType: 'clay_loam',
  ph: 7.8,
  organicMatterPct: 1.8,
  salinityEC: 1.5,
  source: 'user_specified',
  uncertaintyLevel: 'low'
};

const mockClimateUpperEgypt: NasaPowerClimateData = {
  latitude: 26.5569,
  longitude: 31.6948,
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  dataPointsCount: 366,
  avgTemperatureC: 24.1,
  maxTemperatureC: 41.5,
  minTemperatureC: 8.5,
  summerAvgTempC: 32.5,
  winterAvgTempC: 16.0,
  totalPrecipitationMm: 18.2,
  avgSolarRadiationMj: 21.5,
  estimatedGDD: 3450,
  hemisphere: 'northern',
  sourceStatus: 'live_api',
  fetchedAt: new Date().toISOString(),
  avgRelativeHumidityPct: 40.0,
  minRelativeHumidityPct: 22.0,
  maxRelativeHumidityPct: 62.0,
  highHumidityDaysCount: 3
};

const mockInputSohag: FarmAssessmentInput = {
  districtId: 'custom_global',
  locationName: 'Sohag, Egypt',
  latitude: 26.5569,
  longitude: 31.6948,
  soilType: 'clay_loam',
  irrigationAvailability: 'medium',
  farmerPriority: 'water_conservation',
  previousCrop: 'fallow'
};

describe('Global Seed Variety Recommendation System', () => {

  // =========================================================================
  // 1. Database Completeness & Scientific Integrity
  // =========================================================================
  describe('Database Integrity across all 30 Crops', () => {
    const allCropIds = Object.keys(CROPS_DATABASE) as CropId[];

    it('should include at least 1 verified variety for every single crop in the 30-crop database', () => {
      assert.strictEqual(allCropIds.length, 30, 'Crops database must contain exactly 30 crops');

      for (const cropId of allCropIds) {
        const varieties = getSeedVarietiesForCrop(cropId);
        assert.ok(
          varieties.length >= 1, 
          `Crop "${cropId}" must have at least one verified seed variety (found ${varieties.length})`
        );
      }
    });

    it('should have authentic and complete metadata for all seed variety records', () => {
      assert.ok(SEED_VARIETIES_DATABASE.length >= 50, `Must have at least 50 verified varieties (found ${SEED_VARIETIES_DATABASE.length})`);

      for (const v of SEED_VARIETIES_DATABASE) {
        assert.ok(v.id && v.id.length > 0, 'Variety ID must not be empty');
        assert.ok(v.nameEn && v.nameEn.length > 0, `Variety ${v.id} must have an English name`);
        assert.ok(v.nameAr && v.nameAr.length > 0, `Variety ${v.id} must have an Arabic name`);
        assert.ok(v.breedingInstitute && v.breedingInstitute.length > 0, `Variety ${v.id} must have breeding institute`);
        assert.ok(v.countryOfOrigin && v.countryOfOrigin.length > 0, `Variety ${v.id} must have country of origin`);
        assert.ok(Array.isArray(v.countriesRegistered) && v.countriesRegistered.length > 0, `Variety ${v.id} must have registered countries`);
        assert.ok(v.optimalTempRangeC[0] < v.optimalTempRangeC[1], `Variety ${v.id} temp range must be valid`);
        assert.ok(v.maxToleratedTempC > v.optimalTempRangeC[0], `Variety ${v.id} max tolerated temp must be valid`);
        assert.ok(v.salinityToleranceECe > 0, `Variety ${v.id} salinity tolerance ECe must be > 0`);
        assert.ok(v.salinityToleranceECw > 0, `Variety ${v.id} salinity tolerance ECw must be > 0`);
        assert.ok(v.toleratedSoilTypes.length > 0, `Variety ${v.id} must list tolerated soil types`);
        assert.ok(v.sources.length > 0, `Variety ${v.id} must have authoritative citations`);
        assert.strictEqual(v.dataVerificationStatus, 'verified', `Variety ${v.id} must be marked as verified`);
      }
    });
  });

  // =========================================================================
  // 2. Geographic Profile & Location Resolution
  // =========================================================================
  describe('Geographic Resolution (resolveFarmLocationGeography)', () => {
    it('correctly identifies Upper Egypt (Sohag)', () => {
      const geo = resolveFarmLocationGeography(26.5569, 31.6948, 'Sohag, Egypt');
      assert.strictEqual(geo.countryCode, 'EG');
      assert.strictEqual(geo.isEgyptUpperNile, true);
      assert.strictEqual(geo.climateZone, 'arid');
      assert.strictEqual(geo.isSouthernHemisphere, false);
    });

    it('correctly identifies Nile Delta (Lower Egypt)', () => {
      const geo = resolveFarmLocationGeography(31.0, 30.5, 'Tanta, Egypt');
      assert.strictEqual(geo.countryCode, 'EG');
      assert.strictEqual(geo.isEgyptUpperNile, false);
      assert.strictEqual(geo.climateZone, 'arid');
    });

    it('correctly identifies North America (USA)', () => {
      const geo = resolveFarmLocationGeography(40.5, -98.2, 'Nebraska, USA');
      assert.strictEqual(geo.countryCode, 'US');
      assert.strictEqual(geo.climateZone, 'temperate');
      assert.strictEqual(geo.isSouthernHemisphere, false);
    });

    it('correctly identifies Southern Europe (Spain / Mediterranean)', () => {
      const geo = resolveFarmLocationGeography(37.38, -5.98, 'Seville, Spain');
      assert.strictEqual(geo.countryCode, 'ES');
      assert.strictEqual(geo.climateZone, 'mediterranean');
    });

    it('correctly identifies Western Europe (France)', () => {
      const geo = resolveFarmLocationGeography(48.85, 2.35, 'Paris Basin, France');
      assert.strictEqual(geo.countryCode, 'FR');
      assert.strictEqual(geo.climateZone, 'temperate');
    });

    it('correctly identifies South Asia (India)', () => {
      const geo = resolveFarmLocationGeography(28.61, 77.20, 'Punjab, India');
      assert.strictEqual(geo.countryCode, 'IN');
    });

    it('correctly identifies Australia (Southern Hemisphere Grain Belt)', () => {
      const geo = resolveFarmLocationGeography(-31.95, 115.86, 'Perth, Australia');
      assert.strictEqual(geo.countryCode, 'AU');
      assert.strictEqual(geo.isSouthernHemisphere, true);
    });

    it('correctly identifies South America (Brazil)', () => {
      const geo = resolveFarmLocationGeography(-15.78, -47.92, 'Goias, Brazil');
      assert.strictEqual(geo.countryCode, 'BR');
      assert.strictEqual(geo.isSouthernHemisphere, true);
    });
  });

  // =========================================================================
  // 3. Multi-Criteria Matching & Local Registration Priority
  // =========================================================================
  describe('Variety Recommendation Algorithm (recommendBestSeedVariety)', () => {
    it('prioritizes locally registered Egyptian wheat varieties in Sohag', () => {
      const crop = CROPS_DATABASE['wheat'];
      const rec = recommendBestSeedVariety(crop, mockInputSohag, mockClimateUpperEgypt, mockSoilStandard);

      assert.ok(rec !== null, 'Recommendation must not be null');
      assert.strictEqual(rec.isLocallyRegistered, true, 'Variety must be officially registered in Egypt');
      assert.ok(
        rec.varietyName.includes('Giza') || rec.varietyName.includes('Sids') || rec.varietyName.includes('Misr') || rec.varietyName.includes('Sakha'),
        `Expected an Egyptian registered cultivar, got ${rec.varietyName}`
      );
      assert.ok(rec.explanationEn.length > 15, 'Must provide an English explanation');
      assert.ok(rec.explanationAr.length > 15, 'Must provide an Arabic explanation');
    });

    it('prioritizes US-registered wheat variety when farm is in North America', () => {
      const crop = CROPS_DATABASE['wheat'];
      const usInput: FarmAssessmentInput = {
        districtId: 'custom_global',
        locationName: 'Kansas, USA',
        latitude: 38.5,
        longitude: -98.0,
        soilType: 'silty_clay',
        irrigationAvailability: 'medium',
        farmerPriority: 'water_conservation'
      };
      const usClimate: NasaPowerClimateData = {
        ...mockClimateUpperEgypt,
        latitude: 38.5,
        longitude: -98.0,
        totalPrecipitationMm: 650,
        avgTemperatureC: 13.5,
        summerAvgTempC: 26.0,
        winterAvgTempC: 1.5,
        maxTemperatureC: 36.0,
        minTemperatureC: -12.0
      };
      const usSoil: SoilData = {
        soilType: 'silty_clay',
        ph: 6.8,
        organicMatterPct: 2.8,
        salinityEC: 0.8,
        source: 'user_specified',
        uncertaintyLevel: 'low'
      };

      const rec = recommendBestSeedVariety(crop, usInput, usClimate, usSoil);
      assert.ok(rec !== null, 'US recommendation must not be null');
      assert.strictEqual(rec.isLocallyRegistered, true);
      assert.ok(rec.varietyName.includes('Karl') || rec.varietyName.includes('Jagger'), `Expected US cultivar, got ${rec.varietyName}`);
    });

    it('prioritizes European CPVO-registered wheat variety when farm is in France/EU', () => {
      const crop = CROPS_DATABASE['wheat'];
      const frInput: FarmAssessmentInput = {
        districtId: 'custom_global',
        locationName: 'Beauce, France',
        latitude: 48.5,
        longitude: 1.8,
        soilType: 'clay_loam',
        irrigationAvailability: 'medium',
        farmerPriority: 'water_conservation'
      };
      const frClimate: NasaPowerClimateData = {
        ...mockClimateUpperEgypt,
        latitude: 48.5,
        longitude: 1.8,
        totalPrecipitationMm: 720,
        avgTemperatureC: 11.2,
        summerAvgTempC: 20.5,
        winterAvgTempC: 4.0,
        maxTemperatureC: 32.0,
        minTemperatureC: -6.0
      };
      const frSoil: SoilData = {
        soilType: 'clay_loam',
        ph: 7.2,
        organicMatterPct: 2.5,
        salinityEC: 0.6,
        source: 'user_specified',
        uncertaintyLevel: 'low'
      };

      const rec = recommendBestSeedVariety(crop, frInput, frClimate, frSoil);
      assert.ok(rec !== null, 'France recommendation must not be null');
      assert.strictEqual(rec.isLocallyRegistered, true);
      assert.ok(
        rec.varietyName.includes('KWS Extase') || rec.varietyName.includes('Apache') || rec.varietyName.includes('Nogal'),
        `Expected European cultivar, got ${rec.varietyName}`
      );
    });

    // =======================================================================
    // 4. Salinity Stress Adaptation
    // =======================================================================
    it('adapts to high soil salinity (ECe = 7.5 dS/m) by selecting salt-tolerant variety (Sids 14 for wheat)', () => {
      const crop = CROPS_DATABASE['wheat'];
      const salineSoil: SoilData = {
        ...mockSoilStandard,
        salinityEC: 7.5
      };

      const rec = recommendBestSeedVariety(crop, mockInputSohag, mockClimateUpperEgypt, salineSoil);
      assert.ok(rec !== null);
      // Sids 14 has ECe tolerance 7.5 dS/m
      assert.strictEqual(rec.varietyName, 'Sids 14', 'Should pick high salt-tolerant Sids 14 over sensitive varieties');
      assert.ok(rec.explanationEn.toLowerCase().includes('salinity') || rec.explanationEn.toLowerCase().includes('ece'), 'Explanation should highlight salinity');
      assert.ok(rec.explanationAr.includes('الملوحة') || rec.explanationAr.includes('ديسيمنز'), 'Arabic explanation should highlight salinity');
    });

    it('adapts barley variety selection under extreme saline condition (ECe = 9.0 dS/m)', () => {
      const crop = CROPS_DATABASE['barley'];
      const severeSalineSoil: SoilData = {
        ...mockSoilStandard,
        salinityEC: 9.0
      };

      const rec = recommendBestSeedVariety(crop, mockInputSohag, mockClimateUpperEgypt, severeSalineSoil);
      assert.ok(rec !== null);
      assert.ok(
        rec.varietyName.includes('Giza 123') || rec.varietyName.includes('Giza 126'),
        `Expected salt-tolerant barley, got ${rec.varietyName}`
      );
    });

    // =======================================================================
    // 5. Thermal Stress Adaptation
    // =======================================================================
    it('adapts to severe summer heat (Tmax >= 43°C) by recommending heat-tolerant cultivars', () => {
      const crop = CROPS_DATABASE['sorghum'];
      const scorchingClimate: NasaPowerClimateData = {
        ...mockClimateUpperEgypt,
        maxTemperatureC: 44.5,
        summerAvgTempC: 36.0
      };

      const rec = recommendBestSeedVariety(crop, mockInputSohag, scorchingClimate, mockSoilStandard);
      assert.ok(rec !== null);
      assert.ok(
        rec.varietyName.includes('Dorado') || rec.varietyName.includes('Shandawil') || rec.varietyName.includes('Giza 15'),
        `Expected Upper Egypt heat-hardy sorghum cultivar, got ${rec.varietyName}`
      );
      assert.ok(rec.explanationEn.toLowerCase().includes('heat') || rec.explanationEn.toLowerCase().includes('45°c'), 'Explanation should highlight heat tolerance');
    });

    // =======================================================================
    // 6. High Relative Humidity & Foliar Rust Resistance
    // =======================================================================
    it('highlights foliar disease resistance under high relative humidity (>75%)', () => {
      const crop = CROPS_DATABASE['wheat'];
      const humidClimate: NasaPowerClimateData = {
        ...mockClimateUpperEgypt,
        avgRelativeHumidityPct: 80.0,
        highHumidityDaysCount: 35
      };

      const rec = recommendBestSeedVariety(crop, mockInputSohag, humidClimate, mockSoilStandard);
      assert.ok(rec !== null);
      assert.ok(
        rec.explanationEn.toLowerCase().includes('rust') || rec.explanationEn.toLowerCase().includes('disease'),
        'Explanation should cite rust or disease defense under high RH'
      );
      assert.ok(
        rec.explanationAr.includes('الصدأ') || rec.explanationAr.includes('مقاومة'),
        'Arabic explanation should cite disease defense under high RH'
      );
    });

    // =======================================================================
    // 7. Low Water Availability & Drought Avoidance
    // =======================================================================
    it('prioritizes drought-tolerant / early-maturing cultivars when irrigation is low', () => {
      const crop = CROPS_DATABASE['sesame'];
      const droughtInput: FarmAssessmentInput = {
        ...mockInputSohag,
        irrigationAvailability: 'low'
      };

      const rec = recommendBestSeedVariety(crop, droughtInput, mockClimateUpperEgypt, mockSoilStandard);
      assert.ok(rec !== null);
      assert.ok(
        rec.explanationEn.toLowerCase().includes('drought') || rec.explanationEn.toLowerCase().includes('irrigation'),
        'Explanation should cite drought endurance or irrigation footprint'
      );
    });

    // =======================================================================
    // 8. Minimum Evidence Threshold Fallback
    // =======================================================================
    it('returns null when conditions exceed biological limits for all varieties of a crop', () => {
      const crop = CROPS_DATABASE['cotton'];
      // Uninhabitable temperatures (Tmax = 70°C, freezing winter Tmin = -30°C)
      const extremeClimate: NasaPowerClimateData = {
        ...mockClimateUpperEgypt,
        maxTemperatureC: 70.0,
        minTemperatureC: -30.0,
        summerAvgTempC: 58.0
      };

      const rec = recommendBestSeedVariety(crop, mockInputSohag, extremeClimate, mockSoilStandard);
      assert.strictEqual(rec, null, 'Must return null when score falls below the minimum evidence threshold');
    });
  });

  // =========================================================================
  // 9. Integration with Crop Rotation Plans
  // =========================================================================
  describe('Full Recommendation Engine Plan Integration', () => {
    it('embeds verified seed variety recommendations into every step of generated rotation plans', () => {
      const plans = generateRotationPlans(mockInputSohag, mockClimateUpperEgypt, mockSoilStandard);
      assert.ok(plans.length >= 2, 'Should generate at least 2 distinct rotation plans');

      for (const plan of plans) {
        assert.ok(plan.steps.length >= 2, `Plan ${plan.id} should have multiple steps`);
        for (const step of plan.steps) {
          if (step.cropId === 'fallow') {
            // Fallow has no seed variety
            continue;
          }
          assert.ok(
            step.varietyRecommendation !== undefined, 
            `Plan step ${step.stepNumber} (${step.cropId}) must have varietyRecommendation defined`
          );
          if (step.varietyRecommendation) {
            assert.ok(step.varietyRecommendation.varietyName.length > 0);
            assert.ok(step.varietyRecommendation.varietyNameAr.length > 0);
            assert.ok(step.varietyRecommendation.breedingInstitute.length > 0);
            assert.ok(step.varietyRecommendation.explanationEn.length > 0);
            assert.ok(step.varietyRecommendation.explanationAr.length > 0);
            assert.strictEqual(step.varietyRecommendation.evidenceSupported, true);
          }
        }
      }
    });
  });
});
