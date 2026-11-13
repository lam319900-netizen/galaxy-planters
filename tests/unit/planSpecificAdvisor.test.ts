import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { 
  generateDynamicPlanQuestions,
  validatePlanQuestions,
  getDynamicPlanSuggestions,
  getPlanQuestionsCacheKey,
  clearPlanQuestionsCache,
  type QuickPromptSuggestion
} from '../../src/services/aiAssistantClient';
import { 
  buildAgronomicContext, 
  generateGroundedAssistantResponse, 
  buildSystemPrompt 
} from '../../src/services/aiAssistantService';
import { processAIAssistantRequest } from '../../server/aiAssistantHandler';
import { dbService } from '../../src/services/database';
import { CROPS_DATABASE } from '../../src/data/crops';
import type { 
  FarmAssessmentInput, 
  NasaPowerClimateData, 
  SoilData, 
  RotationPlan,
  SavedPlanRecord,
  UserProfile,
  ChatConversation
} from '../../src/types';

describe('SmartCrop AI Agricultural Advisor — Plan-Specific Intelligence & 9 Acceptance Tests', () => {

  const farmInputNormal: FarmAssessmentInput = {
    districtId: 'custom',
    latitude: 26.55,
    longitude: 31.70,
    locationName: 'Sohag Alluvial Farm (Nile Valley)',
    soilType: 'clay_loam',
    soilPh: 7.8,
    organicMatterPct: 1.6,
    soilSalinityEC: 1.4,
    irrigationAvailability: 'medium',
    irrigationMethod: 'surface_furrow',
    irrigationWaterSalinityECw: 0.9,
    farmerPriority: 'water_conservation',
    previousCrop: 'berseem'
  };

  const farmInputMissingECw: FarmAssessmentInput = {
    ...farmInputNormal,
    irrigationWaterSalinityECw: undefined
  };

  const farmInputHighSalinity: FarmAssessmentInput = {
    ...farmInputNormal,
    soilSalinityEC: 6.5,
    irrigationWaterSalinityECw: 3.8
  };

  const climateBaseline: NasaPowerClimateData = {
    latitude: 26.55,
    longitude: 31.70,
    hemisphere: 'northern',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    dataPointsCount: 366,
    avgTemperatureC: 24.5,
    maxTemperatureC: 43.5,
    minTemperatureC: 6.8,
    totalPrecipitationMm: 12.0,
    avgSolarRadiationMj: 21.4,
    estimatedGDD: 3820,
    summerAvgTempC: 33.0,
    winterAvgTempC: 16.2,
    avgRelativeHumidityPct: 38.5,
    summerAvgRhPct: 31.5,
    winterAvgRhPct: 47.5,
    highHumidityDaysCount: 0,
    referenceEt0Mm: 1950,
    sourceStatus: 'live_api',
    fetchedAt: new Date().toISOString()
  };

  const climateExtremeHeat: NasaPowerClimateData = {
    ...climateBaseline,
    avgTemperatureC: 29.5,
    maxTemperatureC: 47.2,
    summerAvgTempC: 37.8
  };

  // Plan A: Cereal-Oilseed Conservation Rotation (Wheat -> Sesame)
  const planA_WheatSesame: RotationPlan = {
    id: 'plan_wheat_sesame_v1',
    titleEn: 'Cereal-Oilseed Conservation Rotation',
    titleAr: 'دورة الحبوب والمحاصيل الزيتية المستدامة',
    taglineEn: 'Maximizes high-value sesame following winter wheat with low water demand',
    taglineAr: 'تعظيم العائد من السمسم عالي القيمة بعد قمح الخبز مع ترشيد الاستهلاك المائي',
    strategicFocusEn: 'Balanced agronomic succession with low water consumption',
    strategicFocusAr: 'تعاقب زراعي متوازن مع ترشيد استهلاك مياه الري',
    overallScore: 89,
    scoreBreakdown: {
      climateSuitability: 92,
      waterAlignment: 88,
      soilHealthIndex: 85,
      sequenceHarmony: 94,
      priorityAlignment: 89
    },
    steps: [
      {
        seasonLabelEn: 'Year 1 - Winter',
        seasonLabelAr: 'السنة الأولى - شتوي',
        seasonYear: 1,
        seasonType: 'winter',
        cropId: 'wheat',
        crop: CROPS_DATABASE.wheat,
        timeline: {
          plantingWindowEn: 'Nov 15 - Dec 05',
          plantingWindowAr: '15 نوفمبر - 5 ديسمبر',
          harvestWindowEn: 'April 20 - May 10',
          harvestWindowAr: '20 أبريل - 10 مايو',
          durationDays: 155,
          durationRangeEn: '145-165 days',
          durationRangeAr: '145-165 يوماً',
          seasonClassificationEn: 'Winter Cereal',
          seasonClassificationAr: 'حبوب شتوية',
          timingRationaleEn: 'Cool winter vegetative growth',
          timingRationaleAr: 'نمو خضري خلال برودة الشتاء'
        },
        waterEstimateMm: 460,
        nitrogenContributionKg: -45,
        roleInRotationEn: 'Primary food grain crop',
        roleInRotationAr: 'محصول استراتيجي رئيسي',
        varietyRecommendation: {
          varietyName: 'Giza 171',
          varietyNameAr: 'جيزة 171',
          scientificName: 'Triticum aestivum',
          breedingInstitute: 'Agricultural Research Center (ARC Egypt)',
          maturationDays: 155,
          stressTolerance: 'Rust resistant, heat tolerant',
          stressToleranceAr: 'مقاوم للأصداء ومتحمل للإجهاد الحراري'
        }
      },
      {
        seasonLabelEn: 'Year 1 - Summer',
        seasonLabelAr: 'السنة الأولى - صيفي',
        seasonYear: 1,
        seasonType: 'summer',
        cropId: 'sesame',
        crop: CROPS_DATABASE.sesame,
        timeline: {
          plantingWindowEn: 'May 10 - June 05',
          plantingWindowAr: '10 مايو - 5 يونيو',
          harvestWindowEn: 'Sept 01 - Sept 20',
          harvestWindowAr: '1 سبتمبر - 20 سبتمبر',
          durationDays: 110,
          durationRangeEn: '100-115 days',
          durationRangeAr: '100-115 يوماً',
          seasonClassificationEn: 'Summer Oilseed',
          seasonClassificationAr: 'محصول زيتي صيفي',
          timingRationaleEn: 'High heat tolerance during summer flowering',
          timingRationaleAr: 'تحمل فائق لدرجات الحرارة الصيفية أثناء التزهير'
        },
        waterEstimateMm: 380,
        nitrogenContributionKg: -20,
        roleInRotationEn: 'High-value summer cash crop',
        roleInRotationAr: 'محصول نقدى صيفي عالي القيمة',
        varietyRecommendation: {
          varietyName: 'Shandawil 3',
          varietyNameAr: 'شندويل 3',
          scientificName: 'Sesamum indicum',
          breedingInstitute: 'Agricultural Research Center (ARC Egypt)',
          maturationDays: 105,
          stressTolerance: 'Drought and heat tolerant, non-shattering pods',
          stressToleranceAr: 'متحمل للجفاف والحرارة وغير منفرط للقرون'
        }
      }
    ]
  };

  // Plan B: Salt-Tolerant Coarse Grain & Oilseed Rotation (Barley -> Sunflower)
  const planB_BarleySunflower: RotationPlan = {
    id: 'plan_barley_sunflower_v1',
    titleEn: 'Salt-Tolerant Grain & Oilseed Rotation',
    titleAr: 'دورة الشعير وعباد الشمس المتحملة للملوحة',
    taglineEn: 'Engineered for saline soils and resilient dryland farming',
    taglineAr: 'مصممة للأراضي المتأثرة بالملوحة والزراعة الجافة المرنة',
    strategicFocusEn: 'High salinity threshold and rapid root penetration',
    strategicFocusAr: 'أقصى تحمل لملوحة التربة ومياه الري مع تعمق جذري سريع',
    overallScore: 84,
    scoreBreakdown: {
      climateSuitability: 88,
      waterAlignment: 82,
      soilHealthIndex: 78,
      sequenceHarmony: 89,
      priorityAlignment: 85
    },
    steps: [
      {
        seasonLabelEn: 'Year 1 - Winter',
        seasonLabelAr: 'السنة الأولى - شتوي',
        seasonYear: 1,
        seasonType: 'winter',
        cropId: 'barley',
        crop: CROPS_DATABASE.barley,
        timeline: {
          plantingWindowEn: 'Nov 20 - Dec 15',
          plantingWindowAr: '20 نوفمبر - 15 ديسمبر',
          harvestWindowEn: 'April 05 - April 25',
          harvestWindowAr: '5 أبريل - 25 أبريل',
          durationDays: 135,
          durationRangeEn: '130-145 days',
          durationRangeAr: '130-145 يوماً',
          seasonClassificationEn: 'Winter Cereal',
          seasonClassificationAr: 'حبوب شتوية',
          timingRationaleEn: 'Early maturity avoiding spring dry winds',
          timingRationaleAr: 'نضج مبكر لتفادي رياح الخماسين الحارة'
        },
        waterEstimateMm: 390,
        nitrogenContributionKg: -35,
        roleInRotationEn: 'Salt-tolerant winter grain',
        roleInRotationAr: 'محصول حبوب شتوي متحمل للملوحة',
        varietyRecommendation: {
          varietyName: 'Giza 126',
          varietyNameAr: 'جيزة 126',
          scientificName: 'Hordeum vulgare',
          breedingInstitute: 'Agricultural Research Center (ARC Egypt) / ICARDA',
          maturationDays: 135,
          stressTolerance: 'Tolerates up to 8.0 dS/m soil salinity',
          stressToleranceAr: 'يتحمل ملوحة تربة حتى 8.0 ديسيمنز/متر'
        }
      },
      {
        seasonLabelEn: 'Year 1 - Summer',
        seasonLabelAr: 'السنة الأولى - صيفي',
        seasonYear: 1,
        seasonType: 'summer',
        cropId: 'sunflower',
        crop: CROPS_DATABASE.sunflower,
        timeline: {
          plantingWindowEn: 'May 01 - May 25',
          plantingWindowAr: '1 مايو - 25 مايو',
          harvestWindowEn: 'August 15 - Sept 05',
          harvestWindowAr: '15 أغسطس - 5 سبتمبر',
          durationDays: 95,
          durationRangeEn: '90-105 days',
          durationRangeAr: '90-105 يوماً',
          seasonClassificationEn: 'Summer Oilseed',
          seasonClassificationAr: 'محصول زيتي صيفي',
          timingRationaleEn: 'Deep taproot accessing deep residual soil moisture',
          timingRationaleAr: 'جذر وتدي متعمق يستغل الرطوبة الأرضية العميقة'
        },
        waterEstimateMm: 450,
        nitrogenContributionKg: -30,
        roleInRotationEn: 'Moderate salinity summer oilseed',
        roleInRotationAr: 'محصول زيتي صيفي متوسط التحمل للملوحة',
        varietyRecommendation: {
          varietyName: 'Sakha 53',
          varietyNameAr: 'سخا 53',
          scientificName: 'Helianthus annuus',
          breedingInstitute: 'Field Crops Research Institute (ARC)',
          maturationDays: 95,
          stressTolerance: 'Moderate salt and drought tolerance',
          stressToleranceAr: 'تحمل متوسط للملوحة والجفاف'
        }
      }
    ]
  };

  beforeEach(() => {
    clearPlanQuestionsCache();
  });

  // ==========================================================================
  // TEST 1: DIFFERENT PLANS
  // Switch between Plan A (Wheat-Sesame) and Plan B (Barley-Sunflower).
  // Questions must change completely and reflect the specific crops, sequence, scores, and risks.
  // ==========================================================================
  describe('Test 1 – Different plans (Plan A vs Plan B differentiation)', () => {
    it('generates completely distinct suggested questions tailored to each plan and its specific crops', () => {
      const questionsA = generateDynamicPlanQuestions(planA_WheatSesame, farmInputNormal, climateBaseline, 'en');
      const questionsB = generateDynamicPlanQuestions(planB_BarleySunflower, farmInputNormal, climateBaseline, 'en');

      assert.ok(questionsA.length >= 4 && questionsA.length <= 6, `Plan A must have 4-6 questions, got ${questionsA.length}`);
      assert.ok(questionsB.length >= 4 && questionsB.length <= 6, `Plan B must have 4-6 questions, got ${questionsB.length}`);

      // Plan A questions text
      const allTextA = questionsA.map(q => `${q.labelEn} ${q.promptEn}`).join(' ');
      // Plan B questions text
      const allTextB = questionsB.map(q => `${q.labelEn} ${q.promptEn}`).join(' ');

      // Plan A must contain Wheat and Sesame, and Giza 171
      assert.ok(allTextA.includes('Wheat'), 'Plan A questions must mention Wheat');
      assert.ok(allTextA.includes('Sesame'), 'Plan A questions must mention Sesame');
      assert.ok(allTextA.includes('Giza 171'), 'Plan A questions must mention Wheat cultivar Giza 171');
      assert.strictEqual(allTextA.includes('Barley'), false, 'Plan A questions must NOT mention Barley');
      assert.strictEqual(allTextA.includes('Sunflower'), false, 'Plan A questions must NOT mention Sunflower');

      // Plan B must contain Barley and Sunflower, and Giza 126
      assert.ok(allTextB.includes('Barley'), 'Plan B questions must mention Barley');
      assert.ok(allTextB.includes('Sunflower'), 'Plan B questions must mention Sunflower');
      assert.ok(allTextB.includes('Giza 126'), 'Plan B questions must mention Barley cultivar Giza 126');
      assert.strictEqual(allTextB.includes('Wheat'), false, 'Plan B questions must NOT mention Wheat');
      assert.strictEqual(allTextB.includes('Sesame'), false, 'Plan B questions must NOT mention Sesame');

      // Question IDs must not collide
      const idsA = new Set(questionsA.map(q => q.id));
      const idsB = new Set(questionsB.map(q => q.id));
      assert.strictEqual(idsA.has('plan_timeline_wheat'), true, 'Plan A has wheat timeline question');
      assert.strictEqual(idsB.has('plan_timeline_barley'), true, 'Plan B has barley timeline question');
      assert.strictEqual(idsA.has('plan_timeline_barley'), false, 'Plan A must not have barley timeline question');
    });

    it('tailors evaluation weakness question to each plan specific lowest scoring dimension', () => {
      // In Plan A, lowest score dimension is soilHealthIndex (85)
      const questionsA = generateDynamicPlanQuestions(planA_WheatSesame, farmInputNormal, climateBaseline, 'en');
      const weaknessA = questionsA.find(q => q.id.startsWith('plan_weakness_'));
      assert.ok(weaknessA, 'Plan A must have a weakness question');
      assert.ok(weaknessA.id.includes('soilHealthIndex'), 'Plan A lowest dimension should be soilHealthIndex');
      assert.ok(weaknessA.promptEn.includes('85/100'), 'Plan A weakness prompt should cite 85/100');

      // In Plan B, lowest score dimension is soilHealthIndex (78)
      const questionsB = generateDynamicPlanQuestions(planB_BarleySunflower, farmInputNormal, climateBaseline, 'en');
      const weaknessB = questionsB.find(q => q.id.startsWith('plan_weakness_'));
      assert.ok(weaknessB, 'Plan B must have a weakness question');
      assert.ok(weaknessB.id.includes('soilHealthIndex'), 'Plan B lowest dimension should be soilHealthIndex');
      assert.ok(weaknessB.promptEn.includes('78/100'), 'Plan B weakness prompt should cite 78/100');
    });
  });

  // ==========================================================================
  // TEST 2: CROP MODIFICATION
  // Modify a crop in a plan and verify suggested questions update to reflect the new crop,
  // eliminating references to the replaced crop.
  // ==========================================================================
  describe('Test 2 – Crop modification & Cache Invalidation', () => {
    it('regenerates questions featuring the new crop and completely eliminates the replaced crop', () => {
      // Initial state: Plan A with Wheat -> Sesame
      const initialSuggestions = getDynamicPlanSuggestions(planA_WheatSesame, farmInputNormal, climateBaseline, 'en');
      const initialText = initialSuggestions.map(q => `${q.labelEn} ${q.promptEn}`).join(' ');
      assert.ok(initialText.includes('Sesame'), 'Initial questions must feature Sesame');

      // Modify Step 1: Replace Sesame with Pearl Millet
      const modifiedPlan: RotationPlan = {
        ...planA_WheatSesame,
        id: 'plan_wheat_millet_v2',
        titleEn: 'Cereal-Millet Drought Resilient Rotation',
        titleAr: 'دورة القمح والدخن المقاومة للجفاف',
        steps: [
          planA_WheatSesame.steps[0],
          {
            seasonLabelEn: 'Year 1 - Summer',
            seasonLabelAr: 'السنة الأولى - صيفي',
            seasonYear: 1,
            seasonType: 'summer',
            cropId: 'millet',
            crop: CROPS_DATABASE.millet,
            timeline: {
              plantingWindowEn: 'May 15 - June 10',
              plantingWindowAr: '15 مايو - 10 يونيو',
              harvestWindowEn: 'August 25 - Sept 15',
              harvestWindowAr: '25 أغسطس - 15 سبتمبر',
              durationDays: 90,
              durationRangeEn: '85-95 days',
              durationRangeAr: '85-95 يوماً',
              seasonClassificationEn: 'Summer Cereal',
              seasonClassificationAr: 'حبوب صيفية',
              timingRationaleEn: 'Extreme heat resistance for midsummer grain filling',
              timingRationaleAr: 'مقاومة فائقة للحرارة أثناء امتلاء الحبوب في ذروة الصيف'
            },
            waterEstimateMm: 320,
            nitrogenContributionKg: -30,
            roleInRotationEn: 'Drought-hardy summer grain',
            roleInRotationAr: 'محصول صيفي شديد التحمل للجفاف',
            varietyRecommendation: {
              varietyName: 'Shandaweel 1',
              varietyNameAr: 'شندويل 1',
              scientificName: 'Pennisetum glaucum',
              breedingInstitute: 'Agricultural Research Center (ARC)',
              maturationDays: 85,
              stressTolerance: 'Extreme heat and drought tolerance',
              stressToleranceAr: 'تحمل فائق للحرارة والجفاف'
            }
          }
        ]
      };

      // Verify cache key changes
      const initialKey = getPlanQuestionsCacheKey(planA_WheatSesame, farmInputNormal, climateBaseline, 'en');
      const modifiedKey = getPlanQuestionsCacheKey(modifiedPlan, farmInputNormal, climateBaseline, 'en');
      assert.notStrictEqual(initialKey, modifiedKey, 'Cache key must differ when crops in sequence change');

      // Retrieve dynamic suggestions for the modified plan
      const updatedSuggestions = getDynamicPlanSuggestions(modifiedPlan, farmInputNormal, climateBaseline, 'en');
      const updatedText = updatedSuggestions.map(q => `${q.labelEn} ${q.promptEn}`).join(' ');

      // Must now contain Pearl Millet or Millet and ZERO references to Sesame
      assert.ok(updatedText.includes('Millet') || updatedText.includes('Pearl Millet'), 'Updated questions must mention Millet');
      assert.strictEqual(updatedText.includes('Sesame'), false, 'Updated questions must NOT contain any reference to replaced Sesame');

      // Verify substitution question references the new crop
      const subQuestion = updatedSuggestions.find(q => q.id.startsWith('plan_substitute_'));
      assert.ok(subQuestion, 'Must have a substitution question for the new crop');
      assert.ok(subQuestion.id.includes('millet'), 'Substitution target must be millet');
    });
  });

  // ==========================================================================
  // TEST 3: SOIL AND CLIMATE CHANGES
  // Modifying soil salinity or NASA temperature updates questions to reflect the new stress/risk.
  // ==========================================================================
  describe('Test 3 – Soil and climate changes (Salinity & Heat stress adaptation)', () => {
    it('generates leaching fraction questions when ECw is measured, but warns about unmeasured risk when ECw is missing', () => {
      // 3A: Measured ECe (1.4 dS/m) and measured ECw (0.9 dS/m)
      const questionsMeasured = generateDynamicPlanQuestions(planA_WheatSesame, farmInputNormal, climateBaseline, 'en');
      const validatedMeasured = validatePlanQuestions(questionsMeasured, planA_WheatSesame, farmInputNormal, climateBaseline);

      const lfQuestion = validatedMeasured.find(q => q.id === 'plan_salinity_lf_calculation');
      const unmeasuredQuestion = validatedMeasured.find(q => q.id === 'plan_salinity_unmeasured_ecw');

      assert.ok(lfQuestion, 'Must provide FAO-29 leaching fraction calculation when ECw is measured');
      assert.ok(lfQuestion.promptEn.includes('1.4 dS/m') && lfQuestion.promptEn.includes('0.9 dS/m'), 'Must quote exact measured soil and water EC');
      assert.strictEqual(unmeasuredQuestion, undefined, 'Must not ask unmeasured question when ECw is known');

      // 3B: Missing ECw (undefined)
      const questionsMissing = generateDynamicPlanQuestions(planA_WheatSesame, farmInputMissingECw, climateBaseline, 'en');
      const validatedMissing = validatePlanQuestions(questionsMissing, planA_WheatSesame, farmInputMissingECw, climateBaseline);

      const lfMissing = validatedMissing.find(q => q.id === 'plan_salinity_lf_calculation');
      const unmeasuredMissing = validatedMissing.find(q => q.id === 'plan_salinity_unmeasured_ecw');

      assert.strictEqual(lfMissing, undefined, 'Must NOT generate or validate LF calculation when ECw is missing');
      assert.ok(unmeasuredMissing, 'Must include on-farm EC meter testing question when ECw is unmeasured');
      assert.ok(unmeasuredMissing.promptEn.includes('EC meter testing'), 'Prompt must require EC meter measurement');
    });

    it('adapts climate sowing questions to extreme NASA peak temperatures', () => {
      // Under extreme heatwave climate (avg 29.5°C, max 47.2°C)
      const questionsHeat = generateDynamicPlanQuestions(planA_WheatSesame, farmInputNormal, climateExtremeHeat, 'en');
      const timelineQ = questionsHeat.find(q => q.id.startsWith('plan_timeline_'));

      assert.ok(timelineQ, 'Timeline question must exist');
      assert.ok(timelineQ.promptEn.includes('47.2°C'), 'Timeline prompt must reflect NASA extreme peak temperature of 47.2°C');
      assert.ok(timelineQ.promptEn.includes('terminal heatwaves'), 'Timeline prompt must address heatwave risk');
    });

    it('adapts variety inquiry to high soil salinity (6.5 dS/m)', () => {
      // Under high soil salinity (6.5 dS/m)
      const questionsSaline = generateDynamicPlanQuestions(planB_BarleySunflower, farmInputHighSalinity, climateBaseline, 'en');
      const varietyQ = questionsSaline.find(q => q.id.startsWith('plan_cultivar_'));

      assert.ok(varietyQ, 'Cultivar question must exist');
      assert.ok(varietyQ.promptEn.includes('Giza 126'), 'Cultivar prompt must identify salt-tolerant barley Giza 126');
      assert.ok(varietyQ.promptEn.includes('salinity'), 'Cultivar prompt must address high salinity tolerance');
    });
  });

  // ==========================================================================
  // TEST 4: PLAN-SPECIFIC CONSULTATION
  // Clicking the consultation button on a plan opens consultation with complete plan context.
  // ==========================================================================
  describe('Test 4 – Plan-specific consultation (Context assembly & Plan awareness)', () => {
    it('injects complete plan data, title, crop sequence, scores, and seed varieties into assistant context', () => {
      const context = buildAgronomicContext({
        messages: [{ role: 'user', content: 'What are the main strengths of this rotation?' }],
        language: 'en',
        farmInput: farmInputNormal,
        climateData: climateBaseline,
        currentPlan: planA_WheatSesame
      });

      assert.ok(context.includes('ACTIVE SELECTED AGRICULTURAL ROTATION PLAN'), 'Context must contain Plan section header');
      assert.ok(context.includes('Cereal-Oilseed Conservation Rotation'), 'Context must include English plan title');
      assert.ok(context.includes('plan_wheat_sesame_v1'), 'Context must include exact plan ID');
      assert.ok(context.includes('89/100'), 'Context must include overall score');
      assert.ok(context.includes('Wheat'), 'Context must include Step 1 crop');
      assert.ok(context.includes('Sesame'), 'Context must include Step 2 crop');
      assert.ok(context.includes('Giza 171'), 'Context must include Step 1 verified cultivar');
      assert.ok(context.includes('Shandawil 3'), 'Context must include Step 2 verified cultivar');
    });

    it('produces a grounded answer referencing the active plan without the farmer needing to restate it', () => {
      const response = generateGroundedAssistantResponse({
        messages: [{ role: 'user', content: 'What are the key management risks for my selected plan?' }],
        language: 'en',
        farmInput: farmInputNormal,
        climateData: climateBaseline,
        currentPlan: planA_WheatSesame
      });

      assert.ok(response.content.length > 100, 'Response must be detailed and substantial');
      assert.ok(response.content.includes('Wheat') || response.content.includes('wheat'), 'Must address Wheat from plan');
      assert.ok(response.content.includes('Sesame') || response.content.includes('sesame'), 'Must address Sesame from plan');
      assert.ok(response.sources.length > 0, 'Must cite scientific sources');
      assert.strictEqual(response.modelUsed, 'smartcrop-agri-grounded', 'Must use grounded model');
    });
  });

  // ==========================================================================
  // TEST 5: FOLLOW-UP QUESTIONS (Conversational continuity & Anaphora resolution)
  // Multi-turn conversation maintaining plan context across follow-up questions.
  // ==========================================================================
  describe('Test 5 – Follow-up questions (Multi-turn dialogue & Anaphoric pronoun resolution)', () => {
    it('maintains context and correctly identifies the subsequent crop when farmer asks "What should I plant after it?"', () => {
      // Turn 1: Farmer asks about wheat
      const turn1User = { role: 'user' as const, content: 'How should I fertilize wheat during tillering?' };
      const turn1Assistant = { 
        role: 'assistant' as const, 
        content: 'For wheat (variety Giza 171), apply nitrogen in split doses at crown root initiation and tillering, maintaining 75 kg N/feddan total.' 
      };

      // Turn 2: Follow-up with anaphora ("after it")
      const turn2User = { role: 'user' as const, content: 'What should I plant after it in this plan, and why?' };

      const responseTurn2 = generateGroundedAssistantResponse({
        messages: [turn1User, turn1Assistant, turn2User],
        language: 'en',
        farmInput: farmInputNormal,
        climateData: climateBaseline,
        currentPlan: planA_WheatSesame
      });

      // The assistant must recognize the next crop in the plan is Sesame
      assert.ok(responseTurn2.content.includes('Sesame') || responseTurn2.content.includes('sesame'), 'Follow-up must identify Sesame as the succeeding crop');
      assert.ok(
        responseTurn2.content.includes('rotation') || responseTurn2.content.includes('succession') || responseTurn2.content.includes('summer'),
        'Follow-up must explain the agronomic succession'
      );
      // Must not repeat raw coordinates or greetings
      assert.strictEqual(responseTurn2.content.includes('Latitude: 26.55'), false, 'Follow-up must not dump raw coordinates');
    });

    it('evaluates substitution when farmer asks "Can I replace it?"', () => {
      const turn1 = { role: 'user' as const, content: 'Tell me about the summer crop in this plan.' };
      const turn2 = { role: 'assistant' as const, content: 'The summer crop is Sesame (Shandawil 3), which requires low water (380 mm).' };
      const turn3 = { role: 'user' as const, content: 'Can I replace it with sunflower or maize?' };

      const responseTurn3 = generateGroundedAssistantResponse({
        messages: [turn1, turn2, turn3],
        language: 'en',
        farmInput: farmInputNormal,
        climateData: climateBaseline,
        currentPlan: planA_WheatSesame
      });

      assert.ok(responseTurn3.content.includes('Sunflower') || responseTurn3.content.includes('Maize') || responseTurn3.content.includes('sunflower'), 'Must evaluate requested substitute crops');
      assert.ok(responseTurn3.content.includes('water') || responseTurn3.content.includes('irrigation'), 'Must assess water budget impact of substitution');
    });
  });

  // ==========================================================================
  // TEST 6: SCIENTIFIC RELIABILITY
  // Verifies genuine citations, provenance hierarchy, and refuses to fabricate unmeasured data or chemical doses.
  // ==========================================================================
  describe('Test 6 – Scientific reliability (Provenance hierarchy & Zero hallucination)', () => {
    it('enforces 4-tier data provenance hierarchy in context assembly', () => {
      const context = buildAgronomicContext({
        messages: [{ role: 'user', content: 'What is my irrigation water salinity?' }],
        language: 'en',
        farmInput: farmInputMissingECw,
        climateData: climateBaseline,
        currentPlan: planA_WheatSesame
      });

      assert.ok(context.includes('=== 0. DATA SOURCE CLASSIFICATION & PROVENANCE HIERARCHY ==='), 'Must contain provenance hierarchy');
      assert.ok(context.includes('1. ACTUAL NASA POWER MEASUREMENTS'), 'Must list NASA measurements tier');
      assert.ok(context.includes('2. FARMER-PROVIDED INFORMATION'), 'Must list farmer input tier');
      assert.ok(context.includes('3. SCIENTIFIC REFERENCE VALUES'), 'Must list scientific standards tier');
      assert.ok(context.includes('4. AI-GENERATED ESTIMATES'), 'Must list AI estimates tier');
      assert.ok(context.includes('NOT SPECIFIED (MISSING)') || context.includes('ECw: NOT SPECIFIED'), 'Must label missing ECw explicitly');
    });

    it('refuses to guess irrigation salinity when ECw is unmeasured and advises on-farm testing', () => {
      const response = generateGroundedAssistantResponse({
        messages: [{ role: 'user', content: 'What is my exact water salinity and how much should I leach?' }],
        language: 'en',
        farmInput: farmInputMissingECw,
        climateData: climateBaseline,
        currentPlan: planA_WheatSesame
      });

      assert.ok(
        response.content.includes('not measured') || response.content.includes('EC meter') || response.content.includes('unmeasured') || response.content.includes('laboratory'),
        'Must admit water salinity is unmeasured and advise testing'
      );
    });

    it('cites authoritative publications and never attributes crop genetics to NASA POWER', () => {
      const response = generateGroundedAssistantResponse({
        messages: [{ role: 'user', content: 'Which wheat variety should I plant and what is its salt tolerance?' }],
        language: 'en',
        farmInput: farmInputNormal,
        climateData: climateBaseline,
        currentPlan: planA_WheatSesame
      });

      // Must cite legitimate institutions
      const citations = response.sources.map(s => s.organization).join(' ');
      assert.ok(
        citations.includes('ARC') || citations.includes('FAO') || citations.includes('ICARDA') || citations.includes('CIMMYT'),
        'Must cite ARC, FAO, ICARDA, or CIMMYT'
      );

      // NASA POWER must NEVER be cited as a breeding institute or variety source
      const varietySources = response.sources.filter(s => s.titleEn.toLowerCase().includes('variety') || s.titleEn.toLowerCase().includes('cultivar'));
      assert.strictEqual(
        varietySources.some(s => s.organization === 'NASA POWER'),
        false,
        'NASA POWER must never be cited as the authority for seed varieties or plant breeding'
      );
    });

    it('strictly forbids fabricating chemical pesticide doses in system prompt', () => {
      const promptEn = buildSystemPrompt('en');
      const promptAr = buildSystemPrompt('ar');

      assert.ok(promptEn.includes('Never fabricate chemical pesticide or fungicide dosages'), 'English prompt bans fabricated chemical doses');
      assert.ok(promptAr.includes('يُمنع منعاً باتاً اختراع أو وصف جرعات مبيدات'), 'Arabic prompt bans fabricated chemical doses');
    });
  });

  // ==========================================================================
  // TEST 7: FARMER ISOLATION
  // Verifies farmer profiles, saved plans, and AI consultation histories are strictly isolated between accounts.
  // ==========================================================================
  describe('Test 7 – Farmer isolation (Multi-tenant privacy & Data boundaries)', () => {
    const userA: UserProfile = {
      id: 'farmer_user_alpha_' + Date.now(),
      email: 'farmer.alpha@smartcrop.agr',
      fullName: 'Engineer Ahmed (Farmer A)',
      country: 'Egypt',
      city: 'Sohag',
      preferredLanguage: 'ar',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const userB: UserProfile = {
      id: 'farmer_user_beta_' + Date.now(),
      email: 'farmer.beta@smartcrop.agr',
      fullName: 'Mahmoud (Farmer B)',
      country: 'Egypt',
      city: 'Assiut',
      preferredLanguage: 'en',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    it('strictly prevents User B from accessing User A saved plans and chat histories', async () => {
      // 1. Create profiles
      await dbService.createProfile(userA);
      await dbService.createProfile(userB);

      // 2. User A saves a plan
      const planRecordA: Omit<SavedPlanRecord, 'id' | 'createdAt' | 'updatedAt'> = {
        userId: userA.id,
        farmId: 'farm_alpha_01',
        farmName: 'Sohag Nile Basin Plot',
        planName: 'Private Plan for Farmer A',
        userNotes: 'Classified commercial nitrogen allocation',
        planSnapshot: planA_WheatSesame,
        originalInputs: farmInputNormal,
        soilDataSnapshot: {
          soilType: 'clay_loam',
          ph: 7.8,
          organicMatterPct: 1.6,
          salinityEC: 1.4,
          source: 'user_specified',
          uncertaintyLevel: 'low'
        },
        climateDataSnapshot: climateBaseline,
        recommendationVersion: 'v2.1-global-fao56'
      };
      const savedA = await dbService.createSavedPlan(planRecordA);

      // 3. User A starts a private consultation conversation
      const conversationA: ChatConversation = {
        id: 'conv_alpha_private_' + Date.now(),
        userId: userA.id,
        title: 'Wheat Rust Management Consultation',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        messages: [
          {
            id: 'msg_1',
            role: 'user',
            content: 'How do I protect my Giza 171 wheat from stripe rust?',
            timestamp: new Date().toISOString()
          },
          {
            id: 'msg_2',
            role: 'assistant',
            content: 'Apply registered fungicides according to Ministry of Agriculture rates.',
            timestamp: new Date().toISOString()
          }
        ]
      };
      await dbService.saveConversation(userA.id, conversationA);

      // 4. Verify User A can access their own plan and conversation
      const userAPlans = await dbService.getSavedPlans(userA.id);
      assert.strictEqual(userAPlans.some(p => p.id === savedA.id), true, 'User A must see their own saved plan');

      const userAConvs = await dbService.getConversations(userA.id);
      assert.strictEqual(userAConvs.some(c => c.id === conversationA.id), true, 'User A must see their own consultation');

      // 5. ISOLATION CHECK: Verify User B CANNOT see User A plans
      const userBPlans = await dbService.getSavedPlans(userB.id);
      assert.strictEqual(
        userBPlans.some(p => p.id === savedA.id), 
        false, 
        'CRITICAL: User B must NOT see User A saved plan in plans list'
      );

      // 6. ISOLATION CHECK: Direct lookup of User A plan by User B must fail
      const illicitPlanAccess = await dbService.getSavedPlanById(userB.id, savedA.id);
      assert.strictEqual(
        illicitPlanAccess, 
        null, 
        'CRITICAL: Direct lookup of User A plan by User B must return null'
      );

      // 7. ISOLATION CHECK: Verify User B CANNOT see User A chat consultations
      const userBConvs = await dbService.getConversations(userB.id);
      assert.strictEqual(
        userBConvs.some(c => c.id === conversationA.id), 
        false, 
        'CRITICAL: User B must NOT see User A consultation in conversations list'
      );

      // 8. ISOLATION CHECK: Direct lookup of User A conversation by User B must return null
      const illicitConvAccess = await dbService.getConversation(userB.id, conversationA.id);
      assert.strictEqual(
        illicitConvAccess, 
        null, 
        'CRITICAL: Direct lookup of User A conversation by User B must return null'
      );

      // 9. ISOLATION CHECK: User B cannot delete User A plan
      await assert.rejects(
        async () => {
          await dbService.deleteSavedPlan(userB.id, savedA.id);
        },
        /Plan not found or unauthorized/,
        'CRITICAL: User B deletion attempt on User A plan must throw unauthorized error'
      );

      // Verify User A plan still exists intact
      const checkA = await dbService.getSavedPlanById(userA.id, savedA.id);
      assert.ok(checkA, 'User A plan must remain intact after unauthorized deletion attempt');
    });
  });

  // ==========================================================================
  // TEST 8: LANGUAGE SUPPORT (Arabic RTL & English LTR agronomic terminology)
  // ==========================================================================
  describe('Test 8 – Language support (Arabic authentic terminology & English precision)', () => {
    it('generates Arabic dynamic questions with authentic agronomic terms (العروة, البخر-نتح, التقاوي)', () => {
      const questionsAr = generateDynamicPlanQuestions(planA_WheatSesame, farmInputNormal, climateBaseline, 'ar');

      assert.ok(questionsAr.length >= 4, 'Must generate at least 4 Arabic questions');

      const allArLabels = questionsAr.map(q => q.labelAr).join(' ');
      const allArPrompts = questionsAr.map(q => q.promptAr).join(' ');
      const allAr = `${allArLabels} ${allArPrompts}`;

      // Check authentic Arabic terminology
      assert.ok(allAr.includes('قمح') || allAr.includes('القمح'), 'Must contain Arabic crop name قمح');
      assert.ok(allAr.includes('سمسم') || allAr.includes('السمسم'), 'Must contain Arabic crop name سمسم');
      assert.ok(allAr.includes('جيزة 171') || allAr.includes('الصنف'), 'Must contain cultivar reference');
      assert.ok(allAr.includes('النيتروجين') || allAr.includes('رصيد'), 'Must mention nitrogen balance');
      assert.ok(allAr.includes('العروة') || allAr.includes('التعاقب') || allAr.includes('دورة'), 'Must use authentic rotation terms');

      // Verify all labels and prompts have non-empty Arabic strings
      for (const q of questionsAr) {
        assert.ok(q.labelAr.length > 5, `Arabic label must not be empty: ${q.id}`);
        assert.ok(q.promptAr.length > 20, `Arabic prompt must not be empty: ${q.id}`);
      }
    });

    it('generates an Arabic grounded response with correct agricultural terminology', () => {
      const responseAr = generateGroundedAssistantResponse({
        messages: [{ role: 'user', content: 'ما هي مواعيد الزراعة المثالية للقمح والسمسم في هذه الخطة؟' }],
        language: 'ar',
        farmInput: farmInputNormal,
        climateData: climateBaseline,
        currentPlan: planA_WheatSesame
      });

      assert.ok(responseAr.content.includes('القمح') || responseAr.content.includes('قمح'), 'Response must discuss Wheat in Arabic');
      assert.ok(responseAr.content.includes('السمسم') || responseAr.content.includes('سمسم'), 'Response must discuss Sesame in Arabic');
      assert.ok(responseAr.content.includes('ناسا') || responseAr.content.includes('درجات الحرارة') || responseAr.content.includes('المناخ'), 'Response must reference climate');
    });

    it('generates English questions and responses with high agronomic precision', () => {
      const questionsEn = generateDynamicPlanQuestions(planA_WheatSesame, farmInputNormal, climateBaseline, 'en');
      assert.ok(questionsEn.length >= 4, 'Must generate at least 4 English questions');

      for (const q of questionsEn) {
        assert.ok(q.labelEn.length > 5, `English label must not be empty: ${q.id}`);
        assert.ok(q.promptEn.length > 20, `English prompt must not be empty: ${q.id}`);
      }

      const responseEn = generateGroundedAssistantResponse({
        messages: [{ role: 'user', content: 'What is the biological nitrogen benefit of this crop sequence?' }],
        language: 'en',
        farmInput: farmInputNormal,
        climateData: climateBaseline,
        currentPlan: planA_WheatSesame
      });

      assert.ok(responseEn.content.includes('nitrogen') || responseEn.content.includes('Nitrogen'), 'Response must address nitrogen');
      assert.ok(responseEn.sources.length > 0, 'Response must cite authoritative sources');
    });
  });

  // ==========================================================================
  // TEST 9: FAILURE HANDLING & GRACEFUL DEGRADATION
  // Telemetry unavailability, missing plan, and LLM failure fallback to local grounded engine.
  // ==========================================================================
  describe('Test 9 – Failure handling & Graceful degradation', () => {
    it('handles missing NASA climate telemetry gracefully using scientific agro-climatic defaults', () => {
      // Pass null/empty climate
      const contextNoClimate = buildAgronomicContext({
        messages: [{ role: 'user', content: 'Advise me on crop selection' }],
        language: 'en',
        farmInput: farmInputNormal,
        climateData: undefined,
        currentPlan: planA_WheatSesame
      });

      assert.ok(contextNoClimate.includes('Historical regional agro-climatic benchmark'), 'Context must gracefully handle missing climate');

      const questionsNoClimate = generateDynamicPlanQuestions(planA_WheatSesame, farmInputNormal, undefined, 'en');
      assert.ok(questionsNoClimate.length >= 4, 'Dynamic questions must generate safely even without live climate telemetry');
    });

    it('operates in General Farm Mode when no plan is attached without crashing', () => {
      const suggestions = getDynamicPlanSuggestions(null, farmInputNormal, climateBaseline, 'en');
      assert.ok(suggestions.length > 0, 'Must provide general farm suggestions when plan is null');

      const contextNoPlan = buildAgronomicContext({
        messages: [{ role: 'user', content: 'Hello, what should I plant?' }],
        language: 'en',
        farmInput: farmInputNormal,
        climateData: climateBaseline,
        currentPlan: undefined
      });

      assert.ok(contextNoPlan.includes('General Farm Consultation Mode'), 'Context must switch to General Farm Mode');
      assert.strictEqual(contextNoPlan.includes('=== 4. CURRENT ACTIVE CROP ROTATION PLAN ==='), false, 'Context must omit plan section');
    });

    it('safely validates and cleans malformed question objects', () => {
      const malformedQuestions: QuickPromptSuggestion[] = [
        {
          id: 'invalid_empty_labels',
          category: 'rotation',
          labelEn: '',
          labelAr: '   ',
          promptEn: 'Valid prompt',
          promptAr: 'سؤال صالح'
        },
        {
          id: 'plan_salinity_lf_calculation',
          category: 'salinity',
          labelEn: 'Salinity LF',
          labelAr: 'معامل الغسيل',
          promptEn: 'Calculate LF with ECw 2.0',
          promptAr: 'احسب معامل الغسيل'
        }
      ];

      // When ECw is missing in farmInput, validatePlanQuestions must reject both the empty-label item and the LF calculation item
      const cleaned = validatePlanQuestions(malformedQuestions, planA_WheatSesame, farmInputMissingECw, climateBaseline);
      assert.strictEqual(cleaned.length, 0, 'All invalid or inconsistent questions must be filtered out');
    });

    it('falls back seamlessly to local deterministic engine if external LLM API throws or fails', async () => {
      // Simulate backend call where no GEMINI_API_KEY is present
      const response = await processAIAssistantRequest({
        messages: [{ role: 'user', content: 'How do I handle soil compaction in clay loam?' }],
        language: 'en',
        farmInput: farmInputNormal,
        climateData: climateBaseline,
        currentPlan: planA_WheatSesame
      });

      assert.ok(response.content.length > 50, 'Fallback response must be informative');
      assert.ok(
        ['smartcrop-agri-grounded', 'gemini', 'openai'].includes(response.modelUsed),
        'Model used must be explicitly reported'
      );
      assert.ok(response.sources.length > 0, 'Sources must be provided even in fallback mode');
    });
  });

});
