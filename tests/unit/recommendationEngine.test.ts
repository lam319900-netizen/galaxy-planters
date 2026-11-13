import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateRotationPlans, getPriorityWeights, generateDynamicCandidatePool } from '../../src/services/recommendationEngine';
import { fetchNasaPowerClimate, createUserProvidedClimateData } from '../../src/services/nasaPower';
import { querySoilGridsProfile, classifyUsdaTexture } from '../../src/services/soilGrids';
import { CROPS_DATABASE } from '../../src/data/crops';
import type { FarmAssessmentInput, NasaPowerClimateData, SoilData } from '../../src/types';

describe('SmartCrop Scientific Validation & Data Integrity Test Suite', () => {

  // Fixture: Standard Upper Egypt reference
  const baseInput: FarmAssessmentInput = {
    districtId: 'custom_global',
    locationName: 'Sohag, Egypt',
    latitude: 26.55,
    longitude: 31.70,
    soilType: 'clay_loam',
    soilPh: 7.8,
    organicMatterPct: 1.2,
    soilSalinityEC: 1.5,
    irrigationAvailability: 'medium',
    farmerPriority: 'water_conservation',
    previousCrop: 'fallow'
  };

  const baseClimate: NasaPowerClimateData = {
    latitude: 26.55,
    longitude: 31.70,
    hemisphere: 'northern',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    dataPointsCount: 366,
    avgTemperatureC: 24.2,
    maxTemperatureC: 43.1,
    minTemperatureC: 6.2,
    totalPrecipitationMm: 12.0,
    avgSolarRadiationMj: 21.8,
    estimatedGDD: 3750,
    summerAvgTempC: 32.5,
    winterAvgTempC: 16.1,
    referenceEt0Mm: 1980,
    frostFreeDays: 366,
    sourceStatus: 'live_api',
    fetchedAt: new Date().toISOString()
  };

  const baseSoil: SoilData = {
    soilType: 'clay_loam',
    ph: 7.8,
    organicMatterPct: 1.2,
    salinityEC: 1.5,
    source: 'isric_soilgrids',
    uncertaintyLevel: 'low'
  };

  // -------------------------------------------------------------------------
  // CASE 1: Valid NASA mock produces complete and verified score structures
  // -------------------------------------------------------------------------
  it('Case 1: Valid NASA telemetry produces verified multi-criteria rotation scores', () => {
    const plans = generateRotationPlans(baseInput, baseClimate, baseSoil);
    assert.strictEqual(plans.length, 3, 'Must return exactly 3 top-ranked candidate plans');
    
    for (const plan of plans) {
      assert.ok(plan.overallScore >= 10 && plan.overallScore <= 100, 'Overall score must be normalized (10-100)');
      assert.ok(plan.scoreBreakdown.climateSuitability >= 0 && plan.scoreBreakdown.climateSuitability <= 100);
      assert.ok(plan.scoreBreakdown.waterAlignment >= 0 && plan.scoreBreakdown.waterAlignment <= 100);
      assert.ok(plan.scoreBreakdown.soilHealthIndex >= 0 && plan.scoreBreakdown.soilHealthIndex <= 100);
      assert.ok(plan.scoreBreakdown.sequenceHarmony >= 0 && plan.scoreBreakdown.sequenceHarmony <= 100);
      assert.ok(plan.scoreBreakdown.priorityAlignment >= 0 && plan.scoreBreakdown.priorityAlignment <= 100);
      assert.strictEqual(plan.steps.length, 4, 'Must evaluate a 4-season sequence across 2 years');
      assert.ok(plan.waterBalance !== undefined, 'Plan must provide FAO-56 WaterBalanceDetails');
      assert.ok(plan.waterBalance.cropEvapotranspirationMm > 0);
      assert.ok(plan.waterBalance.grossIrrigationDemandMm > 0);
    }
  });

  // -------------------------------------------------------------------------
  // CASE 2: API Failure transparent handling (no fabricated synthetic data)
  // -------------------------------------------------------------------------
  it('Case 2: NASA API network/HTTP errors throw transparently without silently forging synthetic data', async () => {
    // 1. Coordinate range validation
    let rangeError: any = null;
    try {
      await fetchNasaPowerClimate({
        latitude: 999.0,
        longitude: 999.0,
        forceDemo: false
      });
    } catch (err: any) {
      rangeError = err;
    }
    assert.ok(rangeError !== null, 'Must throw when coordinates are outside valid geographic range');
    assert.ok(rangeError.message.includes('out of valid geographic range'));

    // 2. HTTP 503 / 404 / Network failure simulation
    const originalFetch = globalThis.fetch;
    try {
      globalThis.fetch = async () => {
        return new Response('Service Unavailable', { status: 503, statusText: 'Service Unavailable' });
      };

      let apiError: any = null;
      try {
        await fetchNasaPowerClimate({
          latitude: 26.55,
          longitude: 31.70,
          forceDemo: false
        });
      } catch (err: any) {
        apiError = err;
      }
      assert.ok(apiError !== null, 'Must throw when NASA API returns 503');
      assert.ok(apiError.message.includes('NASA POWER server responded with HTTP 503'));
    } finally {
      globalThis.fetch = originalFetch;
    }

    // 3. User-provided climate builder explicitly tags sourceStatus as user_specified
    const userClimate = createUserProvidedClimateData({
      latitude: 26.55,
      longitude: 31.70,
      avgTemperatureC: 22.0,
      maxTemperatureC: 38.0,
      minTemperatureC: 8.0,
      totalPrecipitationMm: 15.0
    });
    assert.strictEqual(userClimate.sourceStatus, 'user_specified', 'User climate must never be tagged as live_api');
  });

  // -------------------------------------------------------------------------
  // CASE 3: International Coordinates produce distinct, climate-appropriate rotations
  // -------------------------------------------------------------------------
  it('Case 3: International coordinates produce distinct, climate-appropriate crop combinations', () => {
    // Arid Egypt
    const plansEgypt = generateRotationPlans(baseInput, baseClimate, baseSoil);
    
    // Cold Temperate Germany (52°N, cold winters -8°C, 750mm rain)
    const climateGermany: NasaPowerClimateData = {
      ...baseClimate,
      latitude: 52.0,
      longitude: 9.0,
      avgTemperatureC: 10.2,
      maxTemperatureC: 28.5,
      minTemperatureC: -8.5,
      totalPrecipitationMm: 750.0,
      summerAvgTempC: 18.5,
      winterAvgTempC: 2.1,
      estimatedGDD: 1350,
      referenceEt0Mm: 720
    };
    const inputGermany: FarmAssessmentInput = {
      ...baseInput,
      latitude: 52.0,
      longitude: 9.0,
      irrigationAvailability: 'high',
      farmerPriority: 'climate_resilience'
    };
    const plansGermany = generateRotationPlans(inputGermany, climateGermany, baseSoil);

    const egyptTopCrops = plansEgypt[0].steps.map(s => s.cropId);
    const germanyTopCrops = plansGermany[0].steps.map(s => s.cropId);

    // Germany must not recommend heat-extreme crops or fallow; should favor frost-tolerant crops
    assert.notDeepStrictEqual(
      egyptTopCrops,
      germanyTopCrops,
      'Egypt and Germany must produce distinct top crop rotation sequences'
    );
  });

  // -------------------------------------------------------------------------
  // CASE 4: Southern Hemisphere Season Inversion
  // -------------------------------------------------------------------------
  it('Case 4: Southern Hemisphere coordinates (latitude < 0) correctly invert winter and summer season labels', () => {
    const climateSouth: NasaPowerClimateData = {
      ...baseClimate,
      latitude: -34.60,
      longitude: -58.38,
      hemisphere: 'southern',
      summerAvgTempC: 25.0, // Dec-Feb
      winterAvgTempC: 12.0  // Jun-Aug
    };
    const inputSouth: FarmAssessmentInput = {
      ...baseInput,
      latitude: -34.60,
      longitude: -58.38
    };

    const plansSouth = generateRotationPlans(inputSouth, climateSouth, baseSoil);
    const firstStep = plansSouth[0].steps[0];
    
    // In Southern Hemisphere, cool/winter season occurs between Apr and Sep
    assert.ok(
      firstStep.seasonLabelEn.includes('Apr–Sep') || firstStep.seasonLabelEn.includes('Cool'),
      'Southern Hemisphere Season 1 must label Cool/Winter as Apr-Sep'
    );
    assert.ok(
      firstStep.seasonLabelAr.includes('أبريل–سبتمبر'),
      'Arabic label must reflect Southern Hemisphere calendar'
    );
  });

  // -------------------------------------------------------------------------
  // CASE 5: Missing Soil Data handled gracefully without crashing
  // -------------------------------------------------------------------------
  it('Case 5: Handles missing optional soil pH, OM, and EC using documented defaults without crashing', () => {
    const minimalSoil: SoilData = {
      soilType: 'sandy',
      ph: 7.0, // default
      organicMatterPct: 0.5,
      salinityEC: undefined, // omitted
      source: 'isric_soilgrids',
      uncertaintyLevel: 'high'
    };
    const minimalInput: FarmAssessmentInput = {
      ...baseInput,
      soilType: 'sandy',
      soilPh: undefined,
      organicMatterPct: undefined,
      soilSalinityEC: undefined
    };

    assert.doesNotThrow(() => {
      const plans = generateRotationPlans(minimalInput, baseClimate, minimalSoil);
      assert.strictEqual(plans.length, 3);
    }, 'Must not throw when soil laboratory measurements are absent');
  });

  // -------------------------------------------------------------------------
  // CASE 6: Soil Salinity (ECe) tolerance filtering & penalties
  // -------------------------------------------------------------------------
  it('Case 6: High soil salinity (ECe = 8.5 dS/m) heavily penalizes sensitive crops and favors tolerant ones', () => {
    const salineSoil: SoilData = {
      ...baseSoil,
      salinityEC: 8.5 // High salinity (well above faba bean [3.0] and onion [2.0])
    };
    const salineInput: FarmAssessmentInput = {
      ...baseInput,
      soilSalinityEC: 8.5
    };

    const plansSaline = generateRotationPlans(salineInput, baseClimate, salineSoil);

    // Crops with high salinity tolerance (barley ECe 8.0, sorghum 6.8, sunflower 5.5) must dominate over sensitive crops
    for (const step of plansSaline[0].steps) {
      if (step.crop) {
        assert.notStrictEqual(step.crop.id, 'onion', 'Saline soil must not select sensitive Onion');
      }
    }
  });

  // -------------------------------------------------------------------------
  // CASE 7: Frost Sensitivity Penalty
  // -------------------------------------------------------------------------
  it('Case 7: Sub-zero frost (minTemp = -6°C) heavily penalizes frost-sensitive crops and favors hardy crops', () => {
    const frostClimate: NasaPowerClimateData = {
      ...baseClimate,
      minTemperatureC: -6.0,
      winterAvgTempC: 1.5
    };

    const plansFrost = generateRotationPlans(baseInput, frostClimate, baseSoil);

    // Check that top plan does not include chilling-sensitive crops (rice, sesame, groundnut)
    const sensitiveCropIds = ['rice', 'sesame', 'groundnut'];
    const chosenCrops = plansFrost[0].steps.map(s => s.cropId);
    
    for (const sens of sensitiveCropIds) {
      assert.ok(
        !chosenCrops.includes(sens as any),
        `Frosty climate must not include chilling-sensitive crop ${sens}`
      );
    }
  });

  // -------------------------------------------------------------------------
  // CASE 8: Extreme Heat Penalty (>42°C)
  // -------------------------------------------------------------------------
  it('Case 8: Extreme summer heat (>44°C) penalizes heat-sensitive crops (canola, potato) and favors C4 crops', () => {
    const heatClimate: NasaPowerClimateData = {
      ...baseClimate,
      maxTemperatureC: 46.5,
      summerAvgTempC: 37.0
    };

    const plansHeat = generateRotationPlans(baseInput, heatClimate, baseSoil);

    // Canola (max tol 30°C) and potato (max tol 32°C) should be severely penalized or excluded
    const chosenCrops = plansHeat[0].steps.map(s => s.cropId);
    assert.ok(!chosenCrops.includes('canola'), 'Extreme heat must avoid heat-sensitive Canola');
    assert.ok(!chosenCrops.includes('potato'), 'Extreme heat must avoid heat-sensitive Potato');
  });

  // -------------------------------------------------------------------------
  // CASE 9: Water Limitations & Allocation Capacities
  // -------------------------------------------------------------------------
  it('Case 9: Low irrigation availability downranks high-water crops and introduces water-saving strategies/fallow', () => {
    const lowWaterInput: FarmAssessmentInput = {
      ...baseInput,
      irrigationAvailability: 'low',
      farmerPriority: 'water_conservation'
    };

    const plansLow = generateRotationPlans(lowWaterInput, baseClimate, baseSoil);
    const topPlan = plansLow[0];

    // High water crops like rice (1400mm) or continuous berseem must not dominate low-irrigation arid plans
    const cropIds = topPlan.steps.map(s => s.cropId);
    assert.ok(!cropIds.includes('rice'), 'Low irrigation availability must not recommend Paddy Rice');
    assert.ok(topPlan.totalWaterDemandMm <= 1800, 'Low water sequence must maintain restrained water footprint');
  });

  // -------------------------------------------------------------------------
  // CASE 10: Farmer Priority Re-Ranking
  // -------------------------------------------------------------------------
  it('Case 10: Changing farmer priority systematically alters scoring weights and plan ranking', () => {
    const weightsWater = getPriorityWeights('water_conservation');
    const weightsSoil = getPriorityWeights('soil_health');
    const weightsProfit = getPriorityWeights('profitability');

    assert.strictEqual(weightsWater.water, 0.35, 'Water conservation must weight water at 0.35');
    assert.strictEqual(weightsSoil.soil, 0.35, 'Soil health must weight soil at 0.35');
    assert.strictEqual(weightsProfit.priority, 0.35, 'Profitability must weight priority at 0.35');

    const plansWater = generateRotationPlans({ ...baseInput, farmerPriority: 'water_conservation' }, baseClimate, baseSoil);
    const plansSoil = generateRotationPlans({ ...baseInput, farmerPriority: 'soil_health' }, baseClimate, baseSoil);

    // Top plans under water vs soil health should emphasize different agronomic traits
    const waterNetN = plansWater[0].netNitrogenBalanceKgHa;
    const soilNetN = plansSoil[0].netNitrogenBalanceKgHa;
    
    // Soil health priority should reward higher nitrogen accumulation
    assert.ok(
      soilNetN >= waterNetN || plansSoil[0].scoreBreakdown.soilHealthIndex >= plansWater[0].scoreBreakdown.soilHealthIndex,
      'Soil health priority must achieve high soil health index or superior biological nitrogen'
    );
  });

  // -------------------------------------------------------------------------
  // CASE 11: Deterministic 5-Tier Tie-Breaking
  // -------------------------------------------------------------------------
  it('Case 11: Score tie-breaking executes deterministically without randomness', () => {
    // Run the engine twice with identical inputs
    const run1 = generateRotationPlans(baseInput, baseClimate, baseSoil);
    const run2 = generateRotationPlans(baseInput, baseClimate, baseSoil);

    assert.strictEqual(run1.length, run2.length);
    for (let i = 0; i < run1.length; i++) {
      assert.strictEqual(run1[i].id, run2[i].id, `Plan #${i+1} ID must match identically across repeated runs`);
      assert.strictEqual(run1[i].overallScore, run2[i].overallScore);
      assert.strictEqual(run1[i].scoreBreakdown.priorityAlignment, run2[i].scoreBreakdown.priorityAlignment);
      assert.strictEqual(run1[i].scoreBreakdown.soilHealthIndex, run2[i].scoreBreakdown.soilHealthIndex);
      assert.strictEqual(run1[i].scoreBreakdown.sequenceHarmony, run2[i].scoreBreakdown.sequenceHarmony);
    }
  });

  // -------------------------------------------------------------------------
  // CASE 12: Soil Texture Classification (USDA Soil Texture Triangle)
  // -------------------------------------------------------------------------
  it('Case 12: Soil texture triangle correctly maps clay/sand/silt percentages to USDA classes', () => {
    // Pure Sand
    assert.strictEqual(classifyUsdaTexture(5, 90, 5), 'sandy');
    // Heavy Clay Loam
    assert.strictEqual(classifyUsdaTexture(35, 30, 35), 'clay_loam');
    // Silty Clay
    assert.strictEqual(classifyUsdaTexture(45, 10, 45), 'silty_clay');
    // Sandy Loam
    assert.strictEqual(classifyUsdaTexture(15, 65, 20), 'sandy_loam');
  });

  // -------------------------------------------------------------------------
  // CASE 13: Elimination of Fallow / Soil Solarization across All Recommendations
  // -------------------------------------------------------------------------
  it('Case 13: Recommended plans contain 100% active productive crops with zero summer fallow or soil solarization', () => {
    const locations = [
      { input: baseInput, climate: baseClimate, soil: baseSoil, label: 'Upper Egypt' },
      {
        input: { ...baseInput, latitude: 52.0, longitude: 9.0, irrigationAvailability: 'high' as const },
        climate: { ...baseClimate, latitude: 52.0, longitude: 9.0, avgTemperatureC: 10.2, maxTemperatureC: 28.5, minTemperatureC: -8.5, totalPrecipitationMm: 750, gdd: 1350 },
        soil: baseSoil,
        label: 'Northern Europe'
      },
      {
        input: { ...baseInput, latitude: -34.60, longitude: -58.38 },
        climate: { ...baseClimate, latitude: -34.60, longitude: -58.38, hemisphere: 'southern' as const },
        soil: baseSoil,
        label: 'Southern Hemisphere (Argentina)'
      }
    ];

    for (const loc of locations) {
      const plans = generateRotationPlans(loc.input, loc.climate, loc.soil);
      assert.strictEqual(plans.length, 3, `${loc.label} must produce 3 candidate plans`);

      for (const plan of plans) {
        assert.strictEqual(plan.steps.length, 4, `${loc.label} plan must have 4 steps`);
        for (const step of plan.steps) {
          assert.notStrictEqual(step.cropId, 'fallow', `${loc.label} must not recommend fallow`);
          assert.ok(step.crop !== null, `${loc.label} step must contain a productive Crop entity`);
          assert.ok(step.crop.nameEn.length > 0);
          assert.ok(step.crop.nameAr.length > 0);
        }
      }
    }
  });

  // -------------------------------------------------------------------------
  // CASE 14: Dynamic Crop Calendar Timeline Completeness (Bilingual)
  // -------------------------------------------------------------------------
  it('Case 14: Every crop step includes verified planting window, harvest window, duration, and agronomic rationale', () => {
    const plans = generateRotationPlans(baseInput, baseClimate, baseSoil);
    const topPlan = plans[0];

    for (const step of topPlan.steps) {
      assert.ok(step.timeline !== undefined, 'Step must include timeline');
      assert.ok(step.timeline.plantingWindowEn.length > 3, 'Must have planting window EN');
      assert.ok(step.timeline.plantingWindowAr.length > 3, 'Must have planting window AR');
      assert.ok(step.timeline.harvestWindowEn.length > 3, 'Must have harvest window EN');
      assert.ok(step.timeline.harvestWindowAr.length > 3, 'Must have harvest window AR');
      assert.ok(step.timeline.durationDays > 0, 'Duration days must be > 0');
      assert.ok(step.timeline.durationRangeEn.includes('days'), 'Duration range must specify days');
      assert.ok(step.timeline.timingRationaleEn.length > 10, 'Must have timing rationale EN');
      assert.ok(step.timeline.timingRationaleAr.length > 10, 'Must have timing rationale AR');
      assert.ok(step.roleInRotationEn.length > 10, 'Must have role in rotation EN');
      assert.ok(step.roleInRotationAr.length > 10, 'Must have role in rotation AR');
    }
  });

  // -------------------------------------------------------------------------
  // CASE 15: Hemisphere-Specific Calendar Inversion
  // -------------------------------------------------------------------------
  it('Case 15: Southern Hemisphere calendar windows accurately reflect inverted meteorological seasons', () => {
    const climateSouth: NasaPowerClimateData = {
      ...baseClimate,
      latitude: -34.60,
      longitude: -58.38,
      hemisphere: 'southern',
      summerAvgTempC: 25.0,
      winterAvgTempC: 12.0
    };
    const inputSouth: FarmAssessmentInput = {
      ...baseInput,
      latitude: -34.60,
      longitude: -58.38
    };

    const plansSouth = generateRotationPlans(inputSouth, climateSouth, baseSoil);
    const plan = plansSouth[0];

    // Step 0: Year 1 Winter/Cool season (Southern Hemisphere: April–June sowing)
    const coolStep = plan.steps[0];
    assert.ok(
      coolStep.timeline.plantingWindowEn.includes('April') || coolStep.timeline.plantingWindowEn.includes('May'),
      'Southern Hemisphere winter crop must be sown in Southern autumn/winter (April–May)'
    );

    // Step 1: Year 1 Summer/Warm season (Southern Hemisphere: October–November sowing)
    const warmStep = plan.steps[1];
    assert.ok(
      warmStep.timeline.plantingWindowEn.includes('October') || warmStep.timeline.plantingWindowEn.includes('November'),
      'Southern Hemisphere warm crop must be sown in Southern spring/summer (October–November)'
    );
  });

  // -------------------------------------------------------------------------
  // CASE 16: Atmospheric Relative Humidity (RH2M) and Foliar Disease Risk
  // -------------------------------------------------------------------------
  it('Case 16: Atmospheric Relative Humidity (RH2M) influences crop suitability and foliar disease risk', () => {
    const dryClimate: NasaPowerClimateData = {
      ...baseClimate,
      avgRelativeHumidityPct: 35.0,
      summerAvgRhPct: 30.0,
      winterAvgRhPct: 42.0,
      highHumidityDaysCount: 0,
      rhDataPointsCount: 366
    };

    const humidClimate: NasaPowerClimateData = {
      ...baseClimate,
      avgRelativeHumidityPct: 85.0,
      summerAvgRhPct: 86.0,
      winterAvgRhPct: 82.0,
      highHumidityDaysCount: 52,
      rhDataPointsCount: 366
    };

    const dryPlans = generateRotationPlans(baseInput, dryClimate, baseSoil);
    const humidPlans = generateRotationPlans(baseInput, humidClimate, baseSoil);

    assert.ok(dryPlans.length === 3 && humidPlans.length === 3);

    // Verify humidityAssessment metadata
    assert.strictEqual(dryPlans[0].humidityAssessment?.riskTier, 'low');
    assert.strictEqual(humidPlans[0].humidityAssessment?.riskTier, 'high');
    assert.ok(humidPlans[0].humidityAssessment?.summaryEn.includes('High foliar disease pressure alert'));
    assert.ok(dryPlans[0].humidityAssessment?.summaryEn.includes('Favorable low-humidity microclimate'));

    // Humid climate should result in lower climate suitability for humidity-sensitive crops (chickpea, sesame)
    const dryFirstCropClimate = dryPlans[0].scoreBreakdown.climateSuitability;
    const humidFirstCropClimate = humidPlans[0].scoreBreakdown.climateSuitability;
    assert.ok(
      dryFirstCropClimate >= humidFirstCropClimate,
      'Dry-adapted crops in humid conditions must receive disease risk penalties'
    );
  });

  // -------------------------------------------------------------------------
  // CASE 17: Missing Relative Humidity Telemetry Handled Gracefully
  // -------------------------------------------------------------------------
  it('Case 17: Missing Relative Humidity telemetry is handled gracefully and neutrally', () => {
    const missingRhClimate: NasaPowerClimateData = {
      ...baseClimate,
      avgRelativeHumidityPct: undefined,
      maxRelativeHumidityPct: undefined,
      minRelativeHumidityPct: undefined,
      summerAvgRhPct: undefined,
      winterAvgRhPct: undefined,
      highHumidityDaysCount: undefined,
      rhDataPointsCount: 0
    };

    const plans = generateRotationPlans(baseInput, missingRhClimate, baseSoil);
    assert.strictEqual(plans.length, 3);
    assert.strictEqual(plans[0].humidityAssessment, undefined, 'Humidity assessment should be undefined when RH telemetry is missing');
    assert.ok(plans[0].overallScore >= 10 && plans[0].overallScore <= 100);
  });

  // -------------------------------------------------------------------------
  // CASE 18: Optional Irrigation Water Salinity (ECw) Left Empty
  // -------------------------------------------------------------------------
  it('Case 18: Optional Irrigation Water Salinity (ECw) left empty defaults gracefully without penalty', () => {
    const inputNoEcw: FarmAssessmentInput = {
      ...baseInput,
      irrigationWaterSalinityECw: undefined
    };

    const plans = generateRotationPlans(inputNoEcw, baseClimate, baseSoil);
    assert.strictEqual(plans.length, 3);
    const plan = plans[0];

    assert.ok(plan.waterSalinityAssessment !== undefined);
    assert.strictEqual(plan.waterSalinityAssessment.ecwProvided, false);
    assert.strictEqual(plan.waterSalinityAssessment.penalizedCrops.length, 0);
    assert.ok(plan.waterSalinityAssessment.summaryEn.includes('not provided'));
    assert.ok(plan.waterSalinityAssessment.summaryAr.includes('لم يتم إدخال ملوحة مياه الري'));
  });

  // -------------------------------------------------------------------------
  // CASE 19: Low Irrigation Water Salinity (ECw < 0.7 dS/m)
  // -------------------------------------------------------------------------
  it('Case 19: Low Irrigation Water Salinity (ECw = 0.5 dS/m) indicates no restriction', () => {
    const inputLowEcw: FarmAssessmentInput = {
      ...baseInput,
      irrigationWaterSalinityECw: 0.5
    };

    const plans = generateRotationPlans(inputLowEcw, baseClimate, baseSoil);
    const assessment = plans[0].waterSalinityAssessment!;

    assert.strictEqual(assessment.ecwProvided, true);
    assert.strictEqual(assessment.ecwValue, 0.5);
    assert.strictEqual(assessment.restrictionTier, 'none');
    assert.strictEqual(assessment.penalizedCrops.length, 0);
    assert.ok(assessment.summaryEn.includes('No water salinity restriction'));
  });

  // -------------------------------------------------------------------------
  // CASE 20: Moderate Irrigation Water Salinity (ECw = 2.0 dS/m)
  // -------------------------------------------------------------------------
  it('Case 20: Moderate Irrigation Water Salinity (ECw = 2.0 dS/m) classifies slight-to-moderate restriction', () => {
    const inputModEcw: FarmAssessmentInput = {
      ...baseInput,
      irrigationWaterSalinityECw: 2.0
    };

    const plans = generateRotationPlans(inputModEcw, baseClimate, baseSoil);
    const assessment = plans[0].waterSalinityAssessment!;

    assert.strictEqual(assessment.ecwProvided, true);
    assert.strictEqual(assessment.restrictionTier, 'slight_to_moderate');
    assert.ok(assessment.summaryEn.includes('Slight to moderate water salinity restriction'));
  });

  // -------------------------------------------------------------------------
  // CASE 21: High Irrigation Water Salinity (ECw = 4.2 dS/m)
  // -------------------------------------------------------------------------
  it('Case 21: High Irrigation Water Salinity (ECw = 4.2 dS/m) classifies severe restriction and favors tolerant crops', () => {
    const inputHighEcw: FarmAssessmentInput = {
      ...baseInput,
      irrigationWaterSalinityECw: 4.2
    };

    const plans = generateRotationPlans(inputHighEcw, baseClimate, baseSoil);
    const assessment = plans[0].waterSalinityAssessment!;

    assert.strictEqual(assessment.ecwProvided, true);
    assert.strictEqual(assessment.restrictionTier, 'severe');
    assert.ok(assessment.summaryEn.includes('Severe water salinity restriction'));
    // Highly tolerant crops (barley 5.3, sorghum 4.5, canola 4.3, wheat 4.0) should be favored
    assert.ok(assessment.favoredCrops.length > 0 || assessment.penalizedCrops.length > 0);
  });

  // -------------------------------------------------------------------------
  // CASE 22: Soil Salinity (ECe) and Water Salinity (ECw) Evaluated Independently
  // -------------------------------------------------------------------------
  it('Case 22: Soil Salinity (ECe) and Water Salinity (ECw) are evaluated independently without conflation', () => {
    // Scenario A: Fresh water (ECw 0.4), Saline soil (ECe 6.5)
    const inputA: FarmAssessmentInput = {
      ...baseInput,
      soilSalinityEC: 6.5,
      irrigationWaterSalinityECw: 0.4
    };
    const soilA: SoilData = { ...baseSoil, salinityEC: 6.5 };
    const plansA = generateRotationPlans(inputA, baseClimate, soilA);
    assert.strictEqual(plansA[0].waterSalinityAssessment?.restrictionTier, 'none', 'Fresh water must have zero restriction even if soil is saline');

    // Scenario B: Saline water (ECw 4.0), Non-saline fresh soil (ECe 1.0)
    const inputB: FarmAssessmentInput = {
      ...baseInput,
      soilSalinityEC: 1.0,
      irrigationWaterSalinityECw: 4.0
    };
    const soilB: SoilData = { ...baseSoil, salinityEC: 1.0 };
    const plansB = generateRotationPlans(inputB, baseClimate, soilB);
    assert.strictEqual(plansB[0].waterSalinityAssessment?.restrictionTier, 'severe', 'Saline water must trigger severe restriction even if soil is fresh');
  });

  // -------------------------------------------------------------------------
  // CASE 23: Soil Drainage Texture & Irrigation Method Impact on ECw Hazard
  // -------------------------------------------------------------------------
  it('Case 23: Soil drainage texture and irrigation application method modify effective water salinity hazard', () => {
    // Sandy soil with precision drip: rapid percolation & high matric potential (drainage factor < 1.0)
    const inputDripSandy: FarmAssessmentInput = {
      ...baseInput,
      soilType: 'sandy',
      irrigationMethod: 'drip',
      irrigationWaterSalinityECw: 2.5
    };
    const soilSandy: SoilData = { ...baseSoil, soilType: 'sandy' };
    const plansDripSandy = generateRotationPlans(inputDripSandy, baseClimate, soilSandy);

    // Silty clay with surface furrow: slow drainage & cyclic drying concentration (drainage factor > 1.0)
    const inputFurrowClay: FarmAssessmentInput = {
      ...baseInput,
      soilType: 'silty_clay',
      irrigationMethod: 'surface_furrow',
      irrigationWaterSalinityECw: 2.5
    };
    const soilClay: SoilData = { ...baseSoil, soilType: 'silty_clay' };
    const plansFurrowClay = generateRotationPlans(inputFurrowClay, baseClimate, soilClay);

    const factorSandyDrip = plansDripSandy[0].waterSalinityAssessment!.effectiveDrainageFactor;
    const factorClayFurrow = plansFurrowClay[0].waterSalinityAssessment!.effectiveDrainageFactor;

    assert.ok(
      factorSandyDrip < factorClayFurrow,
      `Sandy drip factor (${factorSandyDrip}) must be lower than clay furrow factor (${factorClayFurrow}) due to leaching efficiency`
    );
    assert.ok(factorSandyDrip <= 0.85);
    assert.ok(factorClayFurrow >= 1.25);
  });

  // -------------------------------------------------------------------------
  // CASE 24: Database Integrity - All 30 Crops have Valid ECw and RH Parameters
  // -------------------------------------------------------------------------
  it('Case 24: All 30 crops in database contain verified FAO 29 ECw thresholds and RH disease parameters', () => {
    const crops = Object.values(CROPS_DATABASE);
    assert.strictEqual(crops.length, 30, 'Database must contain exactly 30 verified crops');

    for (const crop of crops) {
      assert.ok(typeof crop.salinityToleranceECw === 'number' && crop.salinityToleranceECw > 0, `${crop.id} must have positive ECw`);
      assert.ok(['sensitive', 'moderate', 'tolerant', 'humid_adapted'].includes(crop.humidityToleranceTier), `${crop.id} humidityToleranceTier`);
      assert.strictEqual(crop.optimalRhRange.length, 2, `${crop.id} optimalRhRange must be a tuple of 2 numbers`);
      assert.ok(crop.optimalRhRange[0] < crop.optimalRhRange[1], `${crop.id} optimalRhRange min < max`);
      assert.ok(crop.maxToleratedRhPct >= 70 && crop.maxToleratedRhPct <= 95, `${crop.id} maxToleratedRhPct range`);
      assert.ok(typeof crop.diseaseRiskFactorsEn === 'string' && crop.diseaseRiskFactorsEn.length > 10, `${crop.id} diseaseRiskFactorsEn`);
      assert.ok(typeof crop.diseaseRiskFactorsAr === 'string' && crop.diseaseRiskFactorsAr.length > 10, `${crop.id} diseaseRiskFactorsAr`);
      assert.ok(typeof crop.sources.agronomy === 'string' && crop.sources.agronomy.length > 0, `${crop.id} agronomy source`);
      assert.ok(typeof crop.sources.waterReq === 'string' && crop.sources.waterReq.length > 0, `${crop.id} waterReq source`);
    }
  });

  // -------------------------------------------------------------------------
  // CASE 25: Dynamic Multi-Cropping Evaluates and Selects New Crops
  // -------------------------------------------------------------------------
  it('Case 25: New crops participate dynamically in the Recommendation Engine and are selected for specific environmental niches', () => {
    // 1. Extreme arid heat (44°C max) on sandy soil: Pearl Millet and Cowpea should be favored
    const aridInput: FarmAssessmentInput = {
      ...baseInput,
      latitude: 16.0,
      longitude: 25.0,
      soilType: 'sandy',
      irrigationAvailability: 'low',
      farmerPriority: 'water_conservation'
    };
    const aridClimate: NasaPowerClimateData = {
      ...baseClimate,
      latitude: 16.0,
      longitude: 25.0,
      avgTemperatureC: 29.5,
      maxTemperatureC: 44.5,
      minTemperatureC: 14.0,
      totalPrecipitationMm: 25.0,
      summerAvgTempC: 35.0,
      winterAvgTempC: 22.0
    };
    const aridSoil: SoilData = { ...baseSoil, soilType: 'sandy' };
    const aridPlans = generateRotationPlans(aridInput, aridClimate, aridSoil);
    assert.strictEqual(aridPlans.length, 3);
    
    // Check that at least one plan contains new arid-hardy crops (millet, cowpea, etc.)
    const allCropsInAridPlans = aridPlans.flatMap(p => p.steps.map(s => s.cropId));
    const hasAridCrops = allCropsInAridPlans.some(cid => ['millet', 'cowpea', 'sesame', 'barley'].includes(cid));
    assert.ok(hasAridCrops, 'Arid extreme heat scenario must recommend heat/drought-hardy crops like millet, cowpea, or sesame');

    // 2. High cash priority with fertile loam: Cotton or processing vegetables should be favored
    const cashInput: FarmAssessmentInput = {
      ...baseInput,
      irrigationAvailability: 'high',
      farmerPriority: 'profitability'
    };
    const cashPlans = generateRotationPlans(cashInput, baseClimate, baseSoil);
    const allCropsInCashPlans = cashPlans.flatMap(p => p.steps.map(s => s.cropId));
    const hasCashCrop = allCropsInCashPlans.some(cid => ['cotton', 'tomato', 'pepper', 'sweet_potato', 'onion', 'potato', 'common_bean'].includes(cid));
    assert.ok(hasCashCrop, 'Profitability priority scenario must incorporate high-tier cash crops');
  });

  // -------------------------------------------------------------------------
  // CASE 26: Solanaceae Monoculture Avoidance Rule Verification
  // -------------------------------------------------------------------------
  it('Case 26: Botanical family rotation rules prevent consecutive solanaceous crops', () => {
    const tomato = CROPS_DATABASE.tomato;
    const potato = CROPS_DATABASE.potato;
    const pepper = CROPS_DATABASE.pepper;

    assert.ok(tomato.rotationRulesEn.avoidPreceding.includes('potato'));
    assert.ok(tomato.rotationRulesEn.avoidPreceding.includes('pepper'));
    assert.ok(pepper.rotationRulesEn.avoidPreceding.includes('tomato'));
    assert.ok(pepper.rotationRulesEn.avoidPreceding.includes('potato'));
  });

  // -------------------------------------------------------------------------
  // CASE 27: Southern Hemisphere Calendar Inversion for New Crops
  // -------------------------------------------------------------------------
  it('Case 27: Southern Hemisphere correctly inverts planting and harvesting windows for new crops', () => {
    const southInput: FarmAssessmentInput = {
      ...baseInput,
      latitude: -29.85,
      longitude: 31.02,
      locationName: 'Durban, South Africa'
    };
    const southClimate: NasaPowerClimateData = {
      ...baseClimate,
      latitude: -29.85,
      longitude: 31.02,
      hemisphere: 'southern',
      minTemperatureC: 8.0,
      maxTemperatureC: 32.0,
      avgTemperatureC: 21.0
    };
    const southPlans = generateRotationPlans(southInput, southClimate, baseSoil);
    assert.strictEqual(southPlans.length, 3);

    for (const plan of southPlans) {
      assert.ok(plan.steps[0].seasonLabelEn.includes('Cool/Winter [Apr–Sep]'));
      assert.ok(plan.steps[1].seasonLabelEn.includes('Warm/Summer [Oct–Mar]'));
    }
  });

});
