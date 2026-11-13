import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { 
  buildAgronomicContext, 
  buildSystemPrompt, 
  generateGroundedAssistantResponse, 
  AUTHORITATIVE_SOURCES 
} from '../../src/services/aiAssistantService';
import { processAIAssistantRequest } from '../../server/aiAssistantHandler';
import { dbService } from '../../src/services/database';
import { retrieveScientificKnowledge } from '../../src/services/scientificKnowledgeBase';
import { askAssistant } from '../../src/services/aiAssistantClient';
import { CROPS_DATABASE } from '../../src/data/crops';
import type { 
  FarmAssessmentInput, 
  NasaPowerClimateData, 
  SoilData, 
  RotationPlan, 
  ChatConversation, 
  ChatMessage, 
  PlantDoctorPayload,
  SavedPlanRecord 
} from '../../src/types';

describe('SmartCrop AI Agricultural Advisor — Complete Verification & 12 Scenarios', () => {

  const dummyFarmInput: FarmAssessmentInput = {
    districtId: 'custom',
    latitude: 26.55,
    longitude: 31.70,
    locationName: 'Sohag Test Farm (Nile Valley)',
    soilType: 'clay_loam',
    soilPh: 7.8,
    organicMatterPct: 1.5,
    soilSalinityEC: 2.2,
    irrigationAvailability: 'medium',
    irrigationMethod: 'surface_furrow',
    irrigationWaterSalinityECw: 1.8,
    farmerPriority: 'water_conservation',
    previousCrop: 'berseem'
  };

  const dummyClimate: NasaPowerClimateData = {
    latitude: 26.55,
    longitude: 31.70,
    hemisphere: 'northern',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    dataPointsCount: 366,
    avgTemperatureC: 24.8,
    maxTemperatureC: 43.5,
    minTemperatureC: 6.5,
    totalPrecipitationMm: 8.5,
    avgSolarRadiationMj: 21.6,
    estimatedGDD: 3820,
    summerAvgTempC: 32.8,
    winterAvgTempC: 16.4,
    avgRelativeHumidityPct: 38.5,
    summerAvgRhPct: 32.0,
    winterAvgRhPct: 48.0,
    highHumidityDaysCount: 0,
    referenceEt0Mm: 1950,
    sourceStatus: 'live_api',
    fetchedAt: new Date().toISOString()
  };

  const dummySoil: SoilData = {
    soilType: 'clay_loam',
    ph: 7.8,
    organicMatterPct: 1.5,
    salinityEC: 2.2,
    source: 'user_specified',
    uncertaintyLevel: 'low'
  };

  // Plan A: Wheat -> Maize rotation
  const dummyPlanA: RotationPlan = {
    id: 'plan_wheat_maize',
    titleEn: 'Cereal-Grain Sustainable Rotation',
    titleAr: 'دورة الحبوب والحبوب المستدامة',
    taglineEn: 'Optimized for high yield and caloric output',
    taglineAr: 'محسنة لتعظيم الإنتاجية والعائد الغذائي',
    strategicFocusEn: 'Balanced cereal production with controlled water budgeting',
    strategicFocusAr: 'إنتاج متوازن للحبوب مع ضبط الميزانية المائية',
    overallScore: 88,
    scoreBreakdown: {
      climateSuitability: 85,
      waterAlignment: 90,
      soilHealthIndex: 88,
      sequenceHarmony: 92,
      priorityAlignment: 88
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
          plantingWindowEn: 'Nov 15 - Dec 10',
          plantingWindowAr: '15 نوفمبر - 10 ديسمبر',
          harvestWindowEn: 'April 20 - May 10',
          harvestWindowAr: '20 أبريل - 10 مايو',
          durationDays: 155,
          durationRangeEn: '145-165 days',
          durationRangeAr: '145-165 يوماً',
          seasonClassificationEn: 'Winter Cereal',
          seasonClassificationAr: 'حبوب شتوية',
          timingRationaleEn: 'Aligns grain filling with cool February-March temperatures',
          timingRationaleAr: 'توافق طور امتلاء الحبوب مع برودة شهري فبراير ومارس'
        },
        waterEstimateMm: 480,
        nitrogenContributionKg: -40,
        roleInRotationEn: 'Primary staple cereal',
        roleInRotationAr: 'محصول حبوب رئيسي',
        agronomicRationaleEn: 'High yield potential under alluvial clay loam soils',
        agronomicRationaleAr: 'إنتاجية مرتفعة في الأراضي الطميية الطينية',
        importantNotesEn: 'Monitor yellow rust under high humidity',
        importantNotesAr: 'متابعة الصدأ الأصفر في فترات الرطوبة'
      },
      {
        seasonLabelEn: 'Year 1 - Summer',
        seasonLabelAr: 'السنة الأولى - صيفي',
        seasonYear: 1,
        seasonType: 'summer',
        cropId: 'maize',
        crop: CROPS_DATABASE.maize,
        timeline: {
          plantingWindowEn: 'May 15 - June 15',
          plantingWindowAr: '15 مايو - 15 يونيو',
          harvestWindowEn: 'Sept 1 - Sept 25',
          harvestWindowAr: '1 سبتمبر - 25 سبتمبر',
          durationDays: 110,
          durationRangeEn: '100-120 days',
          durationRangeAr: '100-120 يوماً',
          seasonClassificationEn: 'Summer Cereal',
          seasonClassificationAr: 'حبوب صيفية',
          timingRationaleEn: 'Optimal thermal accumulation for C4 photosynthetic pathway',
          timingRationaleAr: 'تراكم حراري مثالي لمسار البناء الضوئي الرباعي'
        },
        waterEstimateMm: 620,
        nitrogenContributionKg: -60,
        roleInRotationEn: 'Secondary summer grain',
        roleInRotationAr: 'محصول حبوب صيفي ثانٍ',
        agronomicRationaleEn: 'Utilizes high summer solar radiation',
        agronomicRationaleAr: 'استغلال أمثل للإشعاع الشمسي الصيفي المرتفع',
        importantNotesEn: 'Requires disciplined furrow or drip irrigation during pollination',
        importantNotesAr: 'يتطلب انتظام الري أثناء التزهير وطرد الحريرة'
      }
    ]
  };

  // Plan B: Chickpea -> Pearl Millet rotation
  const dummyPlanB: RotationPlan = {
    id: 'plan_chickpea_millet',
    titleEn: 'Resilient Dryland Legume-Millet Rotation',
    titleAr: 'دورة الحمص والدخن المرنة للمناطق الجافة',
    taglineEn: 'Maximum biological nitrogen fixation and extreme heat tolerance',
    taglineAr: 'تثبيت نيتروجيني حيوي أقصى وتحمل فائق للحرارة',
    strategicFocusEn: 'Low water footprint and soil enrichment',
    strategicFocusAr: 'استهلاك مائي منخفض وإثراء خصوبة التربة',
    overallScore: 92,
    scoreBreakdown: {
      climateSuitability: 95,
      waterAlignment: 94,
      soilHealthIndex: 96,
      sequenceHarmony: 95,
      priorityAlignment: 92
    },
    steps: [
      {
        seasonLabelEn: 'Year 1 - Winter',
        seasonLabelAr: 'السنة الأولى - شتوي',
        seasonYear: 1,
        seasonType: 'winter',
        cropId: 'chickpea',
        crop: CROPS_DATABASE.chickpea,
        timeline: {
          plantingWindowEn: 'Nov 1 - Nov 25',
          plantingWindowAr: '1 نوفمبر - 25 نوفمبر',
          harvestWindowEn: 'March 20 - April 15',
          harvestWindowAr: '20 مارس - 15 أبريل',
          durationDays: 140,
          durationRangeEn: '130-150 days',
          durationRangeAr: '130-150 يوماً',
          seasonClassificationEn: 'Winter Legume',
          seasonClassificationAr: 'بقوليات شتوية',
          timingRationaleEn: 'Avoids excessive vegetative frost and matures before hot desiccating winds',
          timingRationaleAr: 'تفادي الصقيع في النمو الخضري والنضج قبل رياح الصيف الحارة'
        },
        waterEstimateMm: 310,
        nitrogenContributionKg: 50,
        roleInRotationEn: 'Nitrogen-fixing grain legume',
        roleInRotationAr: 'بقوليات مثبتة للنيتروجين',
        agronomicRationaleEn: 'Builds organic nitrogen and breaks cereal monoculture disease cycles',
        agronomicRationaleAr: 'بناء النيتروجين العضوي وكسر دورة أمراض الحبوب',
        importantNotesEn: 'Ensure good field drainage to avoid root rot',
        importantNotesAr: 'ضمان صرف الحقل الجيد لتجنب أعفان الجذور'
      },
      {
        seasonLabelEn: 'Year 1 - Summer',
        seasonLabelAr: 'السنة الأولى - صيفي',
        seasonYear: 1,
        seasonType: 'summer',
        cropId: 'pearl_millet',
        crop: CROPS_DATABASE.pearl_millet,
        timeline: {
          plantingWindowEn: 'June 1 - June 30',
          plantingWindowAr: '1 يونيو - 30 يونيو',
          harvestWindowEn: 'Sept 10 - Oct 5',
          harvestWindowAr: '10 سبتمبر - 5 أكتوبر',
          durationDays: 95,
          durationRangeEn: '85-105 days',
          durationRangeAr: '85-105 يوماً',
          seasonClassificationEn: 'Summer C4 Grain',
          seasonClassificationAr: 'حبوب صيفية C4',
          timingRationaleEn: 'Extreme thermal endurance up to 45C',
          timingRationaleAr: 'تحمل فائق للحرارة الشديدة حتى 45°م'
        },
        waterEstimateMm: 350,
        nitrogenContributionKg: -25,
        roleInRotationEn: 'Drought-hardy summer grain',
        roleInRotationAr: 'حبوب صيفية متحملة للجفاف',
        agronomicRationaleEn: 'Minimal water requirement in arid climates',
        agronomicRationaleAr: 'احتياج مائي ضئيل في المناخات الجافة',
        importantNotesEn: 'Tolerates low fertility soils',
        importantNotesAr: 'يتحمل الأراضي منخفضة الخصوبة'
      }
    ]
  };

  // --------------------------------------------------------------------------
  // Scenario 1: Asking about a crop included in selected plan
  // --------------------------------------------------------------------------
  describe('Scenario 1: Asking about a crop included in selected plan', () => {
    it('grounds response in active plan, details seasonal window, water demands and rotation role', () => {
      const response = generateGroundedAssistantResponse({
        messages: [{ role: 'user', content: 'Tell me about the wheat in my selected plan' }],
        language: 'en',
        farmInput: dummyFarmInput,
        climateData: dummyClimate,
        currentPlan: dummyPlanA
      });

      assert.ok(response.content.includes('Wheat'), 'Response should discuss Wheat');
      assert.ok(response.content.includes('480 mm') || response.content.includes('480mm'), 'Should state water estimate');
      assert.ok(response.content.includes('FAO-56'), 'Should cite FAO-56 standards');
      assert.ok(response.sources.some(s => s.referenceCode === 'FAO-56'), 'Must cite FAO-56');
      assert.strictEqual(response.modelUsed, 'smartcrop-agri-grounded');
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 2: Asking about next crop's planting date
  // --------------------------------------------------------------------------
  describe("Scenario 2: Asking about next crop's planting date", () => {
    it('identifies the subsequent crop in rotation, states sowing window and duration', () => {
      const response = generateGroundedAssistantResponse({
        messages: [{ role: 'user', content: 'When should I plant the next crop in my rotation?' }],
        language: 'en',
        farmInput: dummyFarmInput,
        climateData: dummyClimate,
        currentPlan: dummyPlanA
      });

      assert.ok(response.content.includes('Maize') || response.content.includes('maize'), 'Must identify second crop Maize');
      assert.ok(response.content.includes('May 15') || response.content.includes('May') || response.content.includes('June'), 'Should cite sowing window');
      assert.ok(response.content.includes('110 days') || response.content.includes('100-120 days') || response.content.includes('days'), 'Should mention duration');
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 3: Asking why a seed variety was selected
  // --------------------------------------------------------------------------
  describe('Scenario 3: Asking why a seed variety was selected', () => {
    it('explains breeding institute, heat/disease traits, and NEVER cites NASA for varieties', () => {
      const response = generateGroundedAssistantResponse({
        messages: [{ role: 'user', content: 'What is the best seed variety for wheat on my farm, and why was it selected?' }],
        language: 'en',
        farmInput: dummyFarmInput,
        climateData: dummyClimate,
        currentPlan: dummyPlanA
      });

      assert.ok(response.content.includes('Giza') || response.content.includes('Sakha') || response.content.includes('Misr') || response.content.includes('Sids'), 'Must recommend verified cultivar');
      assert.ok(response.sources.some(s => s.organization === 'ARC Egypt' || s.organization === 'CIMMYT'), 'Must cite ARC Egypt or CIMMYT for variety breeding');
      assert.strictEqual(
        response.sources.some(s => s.organization === 'NASA POWER' && s.supportedSubject?.includes('seed_varieties')),
        false,
        'NASA POWER must NEVER be cited as an authority for seed varieties'
      );
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 4: Climate conditions impact on plan
  // --------------------------------------------------------------------------
  describe('Scenario 4: Climate conditions impact on plan', () => {
    it('analyzes NASA relative humidity (RH2M) and temperature thresholds on rotation', () => {
      const response = generateGroundedAssistantResponse({
        messages: [{ role: 'user', content: 'How do relative humidity and summer temperatures affect my rotation plan?' }],
        language: 'en',
        farmInput: dummyFarmInput,
        climateData: dummyClimate,
        currentPlan: dummyPlanA
      });

      assert.ok(response.content.includes('38.5%') || response.content.includes('RH2M'), 'Should analyze RH2M humidity');
      assert.ok(response.content.includes('FAO-56') || response.content.includes('Evapotranspiration'), 'Should connect humidity to ETc');
      assert.ok(response.content.includes('heat') || response.content.includes('temperature'), 'Should evaluate thermal impact');
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 5: Irrigation salinity when ECw is missing (NO guessing)
  // --------------------------------------------------------------------------
  describe('Scenario 5: Irrigation salinity when ECw is missing', () => {
    it('explicitly states ECw is unmeasured, strictly refuses to guess, and advises testing', () => {
      const inputWithoutEcw: FarmAssessmentInput = {
        ...dummyFarmInput,
        irrigationWaterSalinityECw: undefined // Intentionally missing
      };

      const response = generateGroundedAssistantResponse({
        messages: [{ role: 'user', content: 'What is my irrigation water salinity and how will it affect my crops?' }],
        language: 'en',
        farmInput: inputWithoutEcw,
        climateData: dummyClimate,
        currentPlan: dummyPlanA
      });

      assert.ok(
        response.content.includes('unmeasured') || response.content.includes('not provided') || response.content.includes('Not Specified'),
        'Must explicitly state that ECw is unmeasured / not provided'
      );
      assert.ok(
        response.content.includes('prohibited to assume') || response.content.includes('NEVER assume') || response.content.includes('cannot be assumed'),
        'Must strictly clarify that ECw cannot be assumed or guessed'
      );
      assert.ok(
        response.content.includes('EC meter') || response.content.includes('water testing laboratory') || response.content.includes('laboratory'),
        'Must recommend on-farm EC meter or laboratory test'
      );
      assert.ok(response.sources.some(s => s.referenceCode === 'FAO-29'), 'Must cite FAO-29 salinity guidelines');
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 6: Knowledge base insufficient info handling
  // --------------------------------------------------------------------------
  describe('Scenario 6: Knowledge base insufficient info handling', () => {
    it('handles unsupported or unverified inquiries cleanly without hallucinations', () => {
      const response = generateGroundedAssistantResponse({
        messages: [{ role: 'user', content: 'Can I apply unsupported quantum crypto blockchain powder to increase wheat yield?' }],
        language: 'en',
        farmInput: dummyFarmInput,
        climateData: dummyClimate,
        currentPlan: dummyPlanA
      });

      assert.ok(
        response.content.includes('Insufficient Scientific Evidence') || response.content.includes('no verified scientific literature'),
        'Must state lack of scientific evidence'
      );
      assert.ok(
        response.content.includes('refrains from generating unverified') || response.content.includes('SmartCrop strictly prioritizes scientific accuracy'),
        'Must state commitment to verified evidence'
      );
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 7: Follow-up without repeating previous context
  // --------------------------------------------------------------------------
  describe('Scenario 7: Follow-up without repeating previous context', () => {
    it('resolves anaphoric references (replacing it) from conversation history and avoids duplicate greetings', () => {
      const multiTurnMessages: Array<{ role: 'user' | 'assistant'; content: string }> = [
        { role: 'user', content: 'Tell me about wheat.' },
        { role: 'assistant', content: 'Wheat is the primary winter cereal in your rotation requiring 480mm of water.' },
        { role: 'user', content: 'Can I replace it with an alternative crop?' }
      ];

      const response = generateGroundedAssistantResponse({
        messages: multiTurnMessages,
        language: 'en',
        farmInput: dummyFarmInput,
        climateData: dummyClimate,
        currentPlan: dummyPlanA
      });

      assert.ok(response.content.includes('Wheat') || response.content.includes('wheat'), 'Must resolve that "it" refers to wheat');
      assert.ok(
        response.content.includes('Substitution') || response.content.includes('replace') || response.content.includes('Alternative'),
        'Must address crop substitution'
      );
      assert.strictEqual(
        response.content.includes('Welcome to the SmartCrop AI Agricultural Advisor!'),
        false,
        'Must NOT repeat initial welcome greeting on follow-up turns'
      );
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 8: Changing selected agricultural plan updates assistant context
  // --------------------------------------------------------------------------
  describe('Scenario 8: Changing selected agricultural plan updates assistant context', () => {
    it('dynamically adapts recommendations when the user switches from Plan A to Plan B', () => {
      // Query under Plan A (Wheat-Maize)
      const resPlanA = generateGroundedAssistantResponse({
        messages: [{ role: 'user', content: 'Why did you sequence the crops in my rotation in this order?' }],
        language: 'en',
        farmInput: dummyFarmInput,
        climateData: dummyClimate,
        currentPlan: dummyPlanA
      });

      assert.ok(resPlanA.content.includes('Wheat') || resPlanA.content.includes('Maize'), 'Plan A response must refer to Wheat/Maize');

      // Query under Plan B (Chickpea-Millet)
      const resPlanB = generateGroundedAssistantResponse({
        messages: [{ role: 'user', content: 'Why did you sequence the crops in my rotation in this order?' }],
        language: 'en',
        farmInput: dummyFarmInput,
        climateData: dummyClimate,
        currentPlan: dummyPlanB
      });

      assert.ok(resPlanB.content.includes('Chickpea') || resPlanB.content.includes('Millet'), 'Plan B response must refer to Chickpea/Millet');
      assert.ok(resPlanB.content.includes('biological nitrogen fixation') || resPlanB.content.includes('Nitrogen') || resPlanB.content.includes('legume'), 'Must explain legume nitrogen fixation in Plan B');
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 9: Attempting to access another user's agricultural plan
  // --------------------------------------------------------------------------
  describe("Scenario 9: Attempting to access another user's agricultural plan", () => {
    it('strictly isolates saved plans and prevents cross-user access', async () => {
      const ownerId = 'farmer_alpha_' + Date.now();
      const intruderId = 'farmer_beta_' + Date.now();

      // 1. Owner saves plan
      const createdPlan = await dbService.createSavedPlan({
        userId: ownerId,
        farmId: 'farm_01',
        farmName: 'Alpha North Farm',
        planName: 'Alpha Confidential Rotation',
        userNotes: 'Confidential private yield targets',
        planSnapshot: dummyPlanA,
        originalInputs: dummyFarmInput,
        soilDataSnapshot: dummySoil,
        climateDataSnapshot: dummyClimate,
        recommendationVersion: 'v2.1'
      });

      // 2. Owner can read it
      const ownerPlan = await dbService.getSavedPlan(ownerId, createdPlan.id);
      assert.ok(ownerPlan !== null, 'Owner must have access');
      assert.strictEqual(ownerPlan?.planName, 'Alpha Confidential Rotation');

      // 3. Intruder CANNOT access it
      const intruderPlan = await dbService.getSavedPlan(intruderId, createdPlan.id);
      assert.strictEqual(intruderPlan, null, 'Intruder must NOT be able to access another user plan');

      // 4. Intruder cannot list it
      const intruderList = await dbService.getSavedPlans(intruderId);
      assert.strictEqual(intruderList.some(p => p.id === createdPlan.id), false, 'Intruder cannot see plan in list');

      // 5. Intruder cannot delete it (throws unauthorized or returns false)
      let deleteBlocked = false;
      try {
        await dbService.deleteSavedPlan(intruderId, createdPlan.id);
      } catch (err: any) {
        deleteBlocked = err.message.includes('unauthorized') || err.message.includes('not found');
      }
      assert.strictEqual(deleteBlocked, true, 'Intruder deletion of another user plan must be blocked');
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 10: Arabic and English conversations
  // --------------------------------------------------------------------------
  describe('Scenario 10: Arabic and English conversations', () => {
    it('produces fluent Arabic with authentic agricultural terms (العروة، البخر-نتح، التقاوي)', () => {
      const responseAr = generateGroundedAssistantResponse({
        messages: [{ role: 'user', content: 'ما هي مواعيد زراعة القمح وأفضل صنف معتمد لأرضي؟' }],
        language: 'ar',
        farmInput: dummyFarmInput,
        climateData: dummyClimate,
        currentPlan: dummyPlanA
      });

      assert.ok(responseAr.content.includes('القمح'), 'Must contain Arabic crop name');
      assert.ok(responseAr.content.includes('عروة') || responseAr.content.includes('الشتوية'), 'Must contain seasonal terminology');
      assert.ok(responseAr.content.includes('صنف') || responseAr.content.includes('تقاوي'), 'Must contain seed cultivar terminology');
      assert.ok(responseAr.sources.length > 0, 'Must include citations');
      assert.ok(responseAr.sources.some(s => s.titleAr.length > 5), 'Must have Arabic publication titles');
    });

    it('produces rigorous English with precise agronomic terminology', () => {
      const responseEn = generateGroundedAssistantResponse({
        messages: [{ role: 'user', content: 'What are the optimal planting dates and Kc water factors for wheat?' }],
        language: 'en',
        farmInput: dummyFarmInput,
        climateData: dummyClimate,
        currentPlan: dummyPlanA
      });

      assert.ok(responseEn.content.includes('Wheat'), 'Must contain English crop name');
      assert.ok(responseEn.content.includes('FAO-56'), 'Must cite FAO-56');
      assert.ok(responseEn.content.includes('Kc') || responseEn.content.includes('evapotranspiration') || responseEn.content.includes('ETc'), 'Must contain agronomic water metrics');
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 11: Malformed or unavailable scientific references
  // --------------------------------------------------------------------------
  describe('Scenario 11: Malformed or unavailable scientific references', () => {
    it('safely handles empty or malformed retrieval parameters without crashing', () => {
      // 1. Empty call
      const res1 = retrieveScientificKnowledge();
      assert.ok(Array.isArray(res1), 'Must return array on empty call');

      // 2. Malformed query with strange symbols
      const res2 = retrieveScientificKnowledge({
        query: '??***@@@$$$%%%^^^&&&',
        limit: 2
      });
      assert.ok(Array.isArray(res2), 'Must return array on malformed query');

      // 3. Ensure NASA is never returned when filtering exclusively for variety topics
      const resVariety = retrieveScientificKnowledge({
        topics: ['seed_varieties'],
        limit: 5
      });
      assert.strictEqual(
        resVariety.some(p => p.institution === 'NASA POWER'),
        false,
        'NASA POWER must NEVER be returned for seed variety topics'
      );
    });
  });

  // --------------------------------------------------------------------------
  // Scenario 12: Unavailable AI API services & fallback
  // --------------------------------------------------------------------------
  describe('Scenario 12: Unavailable AI API services & fallback', () => {
    it('falls back seamlessly to local deterministic grounded engine when API is unavailable', async () => {
      // Test the local fallback directly through processAIAssistantRequest without keys
      const response = await processAIAssistantRequest({
        messages: [{ role: 'user', content: 'How to manage soil salinity in my farm?' }],
        language: 'en',
        farmInput: dummyFarmInput,
        climateData: dummyClimate,
        currentPlan: dummyPlanA
      });

      assert.ok(response.content.length > 50, 'Fallback must produce detailed response');
      assert.ok(['gemini', 'openai', 'smartcrop-agri-grounded'].includes(response.modelUsed), 'modelUsed must be transparent');
      assert.ok(response.sources.length > 0, 'Sources must be present even in fallback');
    });
  });

  // --------------------------------------------------------------------------
  // Additional: Context Assembly, System Prompt Safety, and Plant Doctor Review
  // --------------------------------------------------------------------------
  describe('Context Assembly & Safety Rules', () => {
    it('enforces mandatory notice distinguishing historical NASA observations from live forecasts', () => {
      const context = buildAgronomicContext({
        messages: [{ role: 'user', content: 'Tell me about the weather' }],
        language: 'en',
        climateData: dummyClimate
      });

      assert.ok(context.includes('NOT a live weather forecast'), 'Context must clarify NASA data is historical reanalysis');
      assert.ok(context.includes('38.5%'), 'Should include NASA relative humidity (RH2M)');
    });

    it('strictly forbids fabricated chemical dosages in both languages', () => {
      const promptEn = buildSystemPrompt('en');
      const promptAr = buildSystemPrompt('ar');

      assert.ok(promptEn.includes('Never fabricate chemical pesticide or fungicide dosages'), 'English prompt prohibits fabricated chemical doses');
      assert.ok(promptAr.includes('يُمنع منعاً باتاً اختراع'), 'Arabic prompt prohibits fabricated chemical doses');
    });

    it('processes Plant Doctor diagnosis handover with IPM safety advisory', () => {
      const doctorPayload: PlantDoctorPayload = {
        plantCropId: 'wheat',
        cropCommonNameEn: 'Bread Wheat',
        cropCommonNameAr: 'قمح الخبز',
        symptoms: ['Yellow foliar stripes and orange pustules'],
        suspectedPathogenOrPest: 'Yellow Rust (Puccinia striiformis)',
        confidencePct: 92,
        severityLevel: 'moderate'
      };

      const response = generateGroundedAssistantResponse({
        messages: [{ role: 'user', content: 'Help me treat this wheat disease' }],
        language: 'en',
        farmInput: dummyFarmInput,
        climateData: dummyClimate,
        plantDoctorPayload: doctorPayload
      });

      assert.ok(response.content.includes('Plant Doctor') || response.content.includes('Agronomic Diagnostic Advisory'), 'Acknowledges diagnosis');
      assert.ok(response.content.includes('Yellow / Stripe Rust') || response.content.includes('Yellow Rust'), 'References pathogen');
      assert.ok(response.content.includes('Integrated Pest Management') || response.content.includes('IPM'), 'Suggests IPM');
      assert.ok(response.content.includes('certified plant pathology laboratory') || response.content.includes('extension agronomist'), 'Advises lab verification');
      assert.ok(response.plantDoctorReview?.handled === true, 'Plant doctor review handled flag set');
    });
  });

});
