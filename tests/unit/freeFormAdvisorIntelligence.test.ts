import test from 'node:test';
import assert from 'node:assert/strict';
import { 
  generateGroundedAssistantResponse,
  parseReplacementIntent,
  type AIAssistantRequest
} from '../../src/services/aiAssistantService.ts';
import {
  evaluateCropReplacement,
  evaluateCropComparison,
  auditMissingInformation,
  resolveCropFromIdentifier
} from '../../src/services/agriculturalAgentTools.ts';
import {
  AGRI_AGENT_TOOLS,
  executeToolCall
} from '../../server/aiAssistantHandler.ts';
import { CROPS_DATABASE } from '../../src/data/crops.ts';
import type { RotationPlan, FarmAssessmentInput, NasaPowerClimateData, SoilData } from '../../src/types/index.ts';

const mockFarmInput: FarmAssessmentInput = {
  districtId: 'sohag_center',
  latitude: 26.5569,
  longitude: 31.6948,
  locationName: 'Sohag Farm (Upper Egypt)',
  soilType: 'clay_loam',
  soilPh: 7.8,
  soilSalinityEC: 1.4,
  irrigationAvailability: 'medium',
  irrigationWaterSalinityECw: undefined, // Deliberately unmeasured
  farmerPriority: 'water_conservation'
};

const mockClimateData: NasaPowerClimateData = {
  avgTemperatureC: 24.2,
  maxTemperatureC: 43.5,
  minTemperatureC: 8.5,
  annualPrecipitationMm: 18.0,
  estimatedGDD: 3820,
  avgRelativeHumidityPct: 38.5,
  summerAvgRhPct: 31.0,
  winterAvgRhPct: 52.0,
  summerAvgTempC: 33.2,
  winterAvgTempC: 15.1,
  elevationMeters: 70
};

const mockSoilData: SoilData = {
  soilType: 'clay_loam',
  ph: 7.8,
  organicMatterPct: 1.6,
  salinityEC: 1.4,
  source: 'satellite_estimate',
  uncertaintyLevel: 'medium'
};

const mockFourStepPlan: RotationPlan = {
  id: 'plan_test_4step',
  titleEn: 'Chickpea ➔ Pearl Millet ➔ Wheat ➔ Sunflower Sustainable Rotation',
  titleAr: 'دورة الحمص ➔ دخن اللؤلؤ ➔ القمح ➔ دوار الشمس المستدامة',
  overallScore: 84,
  climateScore: 82,
  waterScore: 85,
  soilScore: 88,
  sequenceScore: 90,
  priorityScore: 80,
  totalWaterRequirementMm: 1540,
  netNitrogenBalanceKgPerHa: 35,
  steps: [
    {
      stepIndex: 0,
      cropId: 'chickpea',
      crop: CROPS_DATABASE['chickpea'],
      variety: {
        id: 'giza_531',
        cropId: 'chickpea',
        varietyName: 'Giza 531',
        varietyNameAr: 'جيزة 531',
        breedingInstitute: 'ARC Egypt',
        releaseYear: 2012,
        maturityDays: 115,
        waterRequirementCategory: 'low',
        heatTolerance: 'medium',
        salinityTolerance: 'medium',
        relativeHumidityRiskTolerance: 'high',
        targetEcosystems: ['Upper Egypt', 'Nile Valley'],
        explanationEn: 'Verified drought-hardy winter chickpea',
        explanationAr: 'صنف حمص شتوي معتمد مقاوم للجفاف'
      },
      waterEstimateMm: 310,
      nitrogenImpactKgPerHa: 45,
      timeline: {
        stepNumber: 1,
        season: 'winter',
        seasonAr: 'شتوي',
        plantingWindowEn: 'Mid Nov - Early Dec',
        plantingWindowAr: 'منتصف نوفمبر إلى أوائل ديسمبر',
        harvestWindowEn: 'March - April',
        harvestWindowAr: 'مارس إلى أبريل',
        durationRangeEn: '110-120 days',
        durationRangeAr: '110-120 يوماً'
      }
    },
    {
      stepIndex: 1,
      cropId: 'millet',
      crop: CROPS_DATABASE['millet'],
      waterEstimateMm: 460,
      nitrogenImpactKgPerHa: -25,
      timeline: {
        stepNumber: 2,
        season: 'summer',
        seasonAr: 'صيفي',
        plantingWindowEn: 'May - June',
        plantingWindowAr: 'مايو إلى يونيو',
        harvestWindowEn: 'August - September',
        harvestWindowAr: 'أغسطس إلى سبتمبر',
        durationRangeEn: '80-90 days',
        durationRangeAr: '80-90 يوماً'
      }
    },
    {
      stepIndex: 2,
      cropId: 'wheat',
      crop: CROPS_DATABASE['wheat'],
      waterEstimateMm: 450,
      nitrogenImpactKgPerHa: -35,
      timeline: {
        stepNumber: 3,
        season: 'winter',
        seasonAr: 'شتوي',
        plantingWindowEn: 'Nov 15 - Dec 10',
        plantingWindowAr: '15 نوفمبر إلى 10 ديسمبر',
        harvestWindowEn: 'April - May',
        harvestWindowAr: 'أبريل إلى مايو',
        durationRangeEn: '145-160 days',
        durationRangeAr: '145-160 يوماً'
      }
    },
    {
      stepIndex: 3,
      cropId: 'sunflower',
      crop: CROPS_DATABASE['sunflower'],
      waterEstimateMm: 420,
      nitrogenImpactKgPerHa: -15,
      timeline: {
        stepNumber: 4,
        season: 'summer',
        seasonAr: 'صيفي',
        plantingWindowEn: 'June - July',
        plantingWindowAr: 'يونيو إلى يوليو',
        harvestWindowEn: 'September - October',
        harvestWindowAr: 'سبتمبر إلى أكتوبر',
        durationRangeEn: '90-100 days',
        durationRangeAr: '90-100 يوماً'
      }
    }
  ]
};

test('Free-Form Agricultural Advisor Intelligence & Reasoning Test Suite', async (t) => {

  await t.test('Scenario 1: Evaluates "Can I replace chickpea with maize?" without dumping raw crop profile', () => {
    const request: AIAssistantRequest = {
      messages: [{ role: 'user', content: 'Can I replace chickpea with maize in my selected crop rotation?' }],
      language: 'en',
      farmInput: mockFarmInput,
      climateData: mockClimateData,
      soilData: mockSoilData,
      currentPlan: mockFourStepPlan
    };

    const response = generateGroundedAssistantResponse(request);

    // 1. Must directly answer that replacement is agronomically infeasible
    assert.match(response.content, /infeasible|cannot replace/i);
    assert.match(response.content, /chickpea/i);
    assert.match(response.content, /maize/i);

    // 2. Must evaluate seasonal mismatch (chickpea is winter, maize is summer)
    assert.match(response.content, /winter/i);
    assert.match(response.content, /summer/i);

    // 3. Must evaluate water consumption increase (+300 mm ETc)
    assert.match(response.content, /water/i);
    assert.match(response.content, /mm/i);

    // 4. Must evaluate biological nitrogen loss (chickpea fixes +45 kg N/ha, maize consumes)
    assert.match(response.content, /nitrogen/i);

    // 5. Must evaluate subsequent crop impact (pearl millet / next step)
    assert.match(response.content, /subsequent|pearl millet|fertilizer/i);

    // 6. Must audit missing information (unmeasured ECw)
    assert.match(response.content, /salinity|ECw|meter/i);

    // 7. Must provide verified winter alternatives (Faba Bean, Lentil, Barley)
    assert.match(response.content, /faba bean|barley|lentil/i);

    // 8. CRITICAL: Must NOT dump chickpea's raw database profile
    assert.doesNotMatch(response.content, /### الملف الفني المعتمد لمحصول/);
    assert.doesNotMatch(response.content, /### Technical Agronomic Profile for/);
  });

  await t.test('Scenario 2: Multi-turn Follow-up Continuity: "What about sorghum instead?"', () => {
    const request: AIAssistantRequest = {
      messages: [
        { role: 'user', content: 'Can I replace chickpea with maize in my selected crop rotation?' },
        { role: 'assistant', content: 'Agronomically Infeasible: Maize is a summer crop...' },
        { role: 'user', content: 'What about sorghum instead?' }
      ],
      language: 'en',
      farmInput: mockFarmInput,
      climateData: mockClimateData,
      soilData: mockSoilData,
      currentPlan: mockFourStepPlan
    };

    const response = generateGroundedAssistantResponse(request);

    // 1. Must identify sorghum as candidate replacement
    assert.match(response.content, /sorghum/i);

    // 2. Must remember previous target crop (chickpea) from dialogue history
    assert.match(response.content, /chickpea/i);

    // 3. Must evaluate sorghum as infeasible for the winter slot despite superior drought tolerance
    assert.match(response.content, /infeasible|cannot|summer/i);

    // 4. Must recommend verified cool-season alternatives
    assert.match(response.content, /barley|faba bean|lentil/i);
  });

  await t.test('Scenario 3: Sequence Rationale: "Why did you recommend chickpea before pearl millet?"', () => {
    const request: AIAssistantRequest = {
      messages: [{ role: 'user', content: 'Why did you recommend chickpea before pearl millet?' }],
      language: 'en',
      farmInput: mockFarmInput,
      climateData: mockClimateData,
      soilData: mockSoilData,
      currentPlan: mockFourStepPlan
    };

    const response = generateGroundedAssistantResponse(request);

    // 1. Mentions both crops explicitly
    assert.match(response.content, /chickpea/i);
    assert.match(response.content, /pearl millet/i);

    // 2. Mentions biological nitrogen fixation (BNF) residue feeding the cereal
    assert.match(response.content, /nitrogen/i);
    assert.match(response.content, /rhizobium|legume/i);

    // 3. Mentions root architecture diversification (taproot vs fibrous roots)
    assert.match(response.content, /root/i);

    // 4. Mentions pathogen cycle interruption
    assert.match(response.content, /pathogen|disease|break/i);
  });

  await t.test('Scenario 4: Delayed Planting Risk: "Can I delay wheat planting by one month?"', () => {
    const request: AIAssistantRequest = {
      messages: [{ role: 'user', content: 'Can I delay wheat planting by one month?' }],
      language: 'en',
      farmInput: mockFarmInput,
      climateData: mockClimateData,
      soilData: mockSoilData,
      currentPlan: mockFourStepPlan
    };

    const response = generateGroundedAssistantResponse(request);

    // 1. Directly states documented yield loss penalty (15% to 30%)
    assert.match(response.content, /15%|30%|penalty|loss/i);

    // 2. Explains terminal heat stress in spring and reduced tillering
    assert.match(response.content, /terminal heat|tillering/i);

    // 3. Recommends early-maturing cultivars (Sids 14) and seeding rate increase
    assert.match(response.content, /sids 14|seeding rate/i);
  });

  await t.test('Scenario 5: Salinity What-If: "What happens if irrigation water salinity increases?"', () => {
    const request: AIAssistantRequest = {
      messages: [{ role: 'user', content: 'What happens if irrigation water salinity increases?' }],
      language: 'en',
      farmInput: mockFarmInput,
      climateData: mockClimateData,
      soilData: mockSoilData,
      currentPlan: mockFourStepPlan
    };

    const response = generateGroundedAssistantResponse(request);

    // 1. Direct answer explains osmotic stress and physiological drought
    assert.match(response.content, /osmotic|drought|burn/i);

    // 2. Explains vulnerability differences across plan steps (legumes sensitive at >1.5 dS/m, wheat moderate, barley tolerant)
    assert.match(response.content, /sensitive|tolerant|chickpea|faba bean|barley/i);

    // 3. Explains Leaching Fraction (LF) formula and gypsum application
    assert.match(response.content, /leaching fraction|gypsum|caso4/i);
  });

  await t.test('Scenario 6: Heat Sensitivity Ranking: "Which crop in my selected plan is most sensitive to heat?"', () => {
    const request: AIAssistantRequest = {
      messages: [{ role: 'user', content: 'Which crop in my selected plan is most sensitive to heat?' }],
      language: 'en',
      farmInput: mockFarmInput,
      climateData: mockClimateData,
      soilData: mockSoilData,
      currentPlan: mockFourStepPlan
    };

    const response = generateGroundedAssistantResponse(request);

    // 1. Names Chickpea as most sensitive to heat stress
    assert.match(response.content, /chickpea/i);

    // 2. Explains reproductive threshold (30-32°C pollen abortion)
    assert.match(response.content, /30|pollen|abortion|reproductive/i);

    // 3. Contrasts with heat-tolerant C4 crops (Pearl Millet / Sorghum tolerant up to 42-44°C)
    assert.match(response.content, /pearl millet|c4|tolerant/i);
  });

  await t.test('Scenario 7: Ordinal Crop Replacement: "Can I replace the third crop without affecting the fourth?"', () => {
    const request: AIAssistantRequest = {
      messages: [{ role: 'user', content: 'Can I replace the third crop without affecting the fourth?' }],
      language: 'en',
      farmInput: mockFarmInput,
      climateData: mockClimateData,
      soilData: mockSoilData,
      currentPlan: mockFourStepPlan
    };

    const response = generateGroundedAssistantResponse(request);

    // 1. Identifies Step 3 as Wheat and Step 4 as Sunflower
    assert.match(response.content, /wheat|step 3/i);
    assert.match(response.content, /sunflower|step 4/i);

    // 2. Explains conditions to preserve Step 4 (harvest timing, botanical family break, nitrogen)
    assert.match(response.content, /window|family|rotation|nitrogen/i);

    // 3. Recommends verified replacements for Step 3 (Barley, Faba Bean)
    assert.match(response.content, /barley|faba bean/i);
  });

  await t.test('Scenario 8: Missing Information Audit: "What information is missing before you can confirm this recommendation?"', () => {
    const request: AIAssistantRequest = {
      messages: [{ role: 'user', content: 'What information is missing before you can confirm this recommendation?' }],
      language: 'en',
      farmInput: mockFarmInput,
      climateData: mockClimateData,
      soilData: mockSoilData,
      currentPlan: mockFourStepPlan
    };

    const response = generateGroundedAssistantResponse(request);

    // 1. Identifies unmeasured irrigation water salinity (ECw)
    assert.match(response.content, /irrigation water salinity|ECw/i);

    // 2. Prohibits guessing under FAO-29 and advises EC meter test
    assert.match(response.content, /cannot be guessed|meter/i);

    // 3. Identifies soil pH based on satellite rather than lab test
    assert.match(response.content, /soil pH|laboratory/i);
  });

  await t.test('Scenario 9: Egyptian Colloquial Arabic Intelligence', async (subT) => {

    await subT.test('9a: "أقدر أزرع ذرة مكان الحمص في خطتي؟"', () => {
      const request: AIAssistantRequest = {
        messages: [{ role: 'user', content: 'أقدر أزرع ذرة مكان الحمص في خطتي؟' }],
        language: 'ar',
        farmInput: mockFarmInput,
        climateData: mockClimateData,
        soilData: mockSoilData,
        currentPlan: mockFourStepPlan
      };

      const response = generateGroundedAssistantResponse(request);

      assert.match(response.content, /غير مجدٍ|لا يمكنك/);
      assert.match(response.content, /الحمص/);
      assert.match(response.content, /الذرة/);
      assert.match(response.content, /شتوي/);
      assert.match(response.content, /صيفي/);
      assert.match(response.content, /النيتروجين/);
      assert.match(response.content, /الفول البلدي|الشعير|العدس/);
    });

    await subT.test('9b: Follow-up "طب ماذا عن الذرة الرفيعة بدلاً منه؟"', () => {
      const request: AIAssistantRequest = {
        messages: [
          { role: 'user', content: 'أقدر أزرع ذرة مكان الحمص في خطتي؟' },
          { role: 'assistant', content: 'غير مجدٍ زراعياً: الذرة محصول صيفي...' },
          { role: 'user', content: 'طب ماذا عن الذرة الرفيعة بدلاً منه؟' }
        ],
        language: 'ar',
        farmInput: mockFarmInput,
        climateData: mockClimateData,
        soilData: mockSoilData,
        currentPlan: mockFourStepPlan
      };

      const response = generateGroundedAssistantResponse(request);

      assert.match(response.content, /الذرة الرفيعة/);
      assert.match(response.content, /الحمص/);
      assert.match(response.content, /صيفي/);
      assert.match(response.content, /الشعير|الفول البلدي/);
    });

    await subT.test('9c: "ليه اقترحت الحمص قبل الدخن؟"', () => {
      const request: AIAssistantRequest = {
        messages: [{ role: 'user', content: 'ليه اقترحت الحمص قبل الدخن؟' }],
        language: 'ar',
        farmInput: mockFarmInput,
        climateData: mockClimateData,
        soilData: mockSoilData,
        currentPlan: mockFourStepPlan
      };

      const response = generateGroundedAssistantResponse(request);

      assert.match(response.content, /الحمص/);
      assert.match(response.content, /دخن|الدخن/);
      assert.match(response.content, /التثبيت الحيوي للنيتروجين/);
      assert.match(response.content, /الجذور/);
    });

    await subT.test('9d: "ينفع أأخر زراعة القمح شهر؟"', () => {
      const request: AIAssistantRequest = {
        messages: [{ role: 'user', content: 'ينفع أأخر زراعة القمح شهر؟' }],
        language: 'ar',
        farmInput: mockFarmInput,
        climateData: mockClimateData,
        soilData: mockSoilData,
        currentPlan: mockFourStepPlan
      };

      const response = generateGroundedAssistantResponse(request);

      assert.match(response.content, /15%|30%|خسارة/);
      assert.match(response.content, /الإجهاد الحراري|سدس 14/);
    });

    await subT.test('9e: "إيه اللي هيحصل لو ملوحة مية الري زادت؟"', () => {
      const request: AIAssistantRequest = {
        messages: [{ role: 'user', content: 'إيه اللي هيحصل لو ملوحة مية الري زادت؟' }],
        language: 'ar',
        farmInput: mockFarmInput,
        climateData: mockClimateData,
        soilData: mockSoilData,
        currentPlan: mockFourStepPlan
      };

      const response = generateGroundedAssistantResponse(request);

      assert.match(response.content, /أسموزي|جفاف فسيولوجي|احتراق/);
      assert.match(response.content, /معامل الغسيل|جبس زراعي/);
    });

    await subT.test('9f: "أنهي محصول في خطتي أكتر حساسية للحرارة؟"', () => {
      const request: AIAssistantRequest = {
        messages: [{ role: 'user', content: 'أنهي محصول في خطتي أكتر حساسية للحرارة؟' }],
        language: 'ar',
        farmInput: mockFarmInput,
        climateData: mockClimateData,
        soilData: mockSoilData,
        currentPlan: mockFourStepPlan
      };

      const response = generateGroundedAssistantResponse(request);

      assert.match(response.content, /الحمص/);
      assert.match(response.content, /عقم|تزهير/);
      assert.match(response.content, /دخن اللؤلؤ|C4/);
    });

    await subT.test('9g: "أقدر أغير المحصول التالت من غير ما أأثر على الرابع؟"', () => {
      const request: AIAssistantRequest = {
        messages: [{ role: 'user', content: 'أقدر أغير المحصول التالت من غير ما أأثر على الرابع؟' }],
        language: 'ar',
        farmInput: mockFarmInput,
        climateData: mockClimateData,
        soilData: mockSoilData,
        currentPlan: mockFourStepPlan
      };

      const response = generateGroundedAssistantResponse(request);

      assert.match(response.content, /القمح|المحصول الثالث/);
      assert.match(response.content, /دوار الشمس|المحصول الرابع/);
      assert.match(response.content, /الشعير|الفول البلدي/);
    });

    await subT.test('9h: "إيه البيانات الناقصة قبل ما تأكد التوصية دي؟"', () => {
      const request: AIAssistantRequest = {
        messages: [{ role: 'user', content: 'إيه البيانات الناقصة قبل ما تأكد التوصية دي؟' }],
        language: 'ar',
        farmInput: mockFarmInput,
        climateData: mockClimateData,
        soilData: mockSoilData,
        currentPlan: mockFourStepPlan
      };

      const response = generateGroundedAssistantResponse(request);

      assert.match(response.content, /ملوحة مياه الري|ECw/);
      assert.match(response.content, /يُمنع منعاً باتاً افتراض/);
      assert.match(response.content, /جهاز قياس الموصلية|EC Meter/);
    });
  });

  await t.test('Scenario 10: Side-by-side Crop Comparison: "Compare wheat and barley in terms of water and salinity"', () => {
    const request: AIAssistantRequest = {
      messages: [{ role: 'user', content: 'Compare wheat and barley in terms of water and salinity' }],
      language: 'en',
      farmInput: mockFarmInput,
      climateData: mockClimateData,
      soilData: mockSoilData,
      currentPlan: mockFourStepPlan
    };

    const response = generateGroundedAssistantResponse(request);

    assert.match(response.content, /barley/i);
    assert.match(response.content, /wheat/i);
    assert.match(response.content, /water/i);
    assert.match(response.content, /salinity/i);
    assert.match(response.content, /8\.0|more tolerant/i);
  });

  await t.test('Scenario 11: Server Tool Calling Schema & Deterministic Tool Execution', () => {
    // 1. Verify AGRI_AGENT_TOOLS includes evaluate_crop_replacement, compare_crops, audit_missing_information
    const toolNames = AGRI_AGENT_TOOLS.map(t => t.function.name);
    assert.ok(toolNames.includes('evaluate_crop_replacement'));
    assert.ok(toolNames.includes('compare_crops'));
    assert.ok(toolNames.includes('audit_missing_information'));
    assert.ok(toolNames.includes('get_selected_plan'));
    assert.ok(toolNames.includes('get_farm_context'));
    assert.ok(toolNames.includes('get_climate_context'));
    assert.ok(toolNames.includes('search_agricultural_knowledge'));

    // 2. Test executeToolCall for evaluate_crop_replacement
    const replacementResult = executeToolCall('evaluate_crop_replacement', {
      target_crop: 'chickpea',
      replacement_crop: 'maize'
    }, {
      messages: [],
      language: 'en',
      farmInput: mockFarmInput,
      climateData: mockClimateData,
      soilData: mockSoilData,
      currentPlan: mockFourStepPlan
    });

    assert.equal(replacementResult.feasibilityVerdict, 'infeasible');
    assert.equal(replacementResult.targetCrop.id, 'chickpea');
    assert.equal(replacementResult.replacementCrop.id, 'maize');
    assert.equal(replacementResult.seasonality.matches, false);
    assert.ok(replacementResult.waterBudget.deltaWaterMm > 0);
    assert.ok(replacementResult.recommendedAlternatives.length >= 2);

    // 3. Test executeToolCall for compare_crops
    const compareResult = executeToolCall('compare_crops', {
      crop_a: 'wheat',
      crop_b: 'barley'
    }, {
      messages: [],
      language: 'en',
      farmInput: mockFarmInput,
      climateData: mockClimateData
    });

    assert.equal(compareResult.cropA.id, 'wheat');
    assert.equal(compareResult.cropB.id, 'barley');
    assert.equal(compareResult.waterComparison.thriftyCrop.id, 'barley');

    // 4. Test executeToolCall for audit_missing_information
    const auditResult = executeToolCall('audit_missing_information', {}, {
      messages: [],
      language: 'en',
      farmInput: mockFarmInput,
      soilData: mockSoilData
    });

    assert.ok(Array.isArray(auditResult));
    assert.ok(auditResult.some((i: any) => i.category === 'water_salinity'));
  });

  await t.test('Scenario 12: Crop Resolver correctly parses Egyptian Arabic Colloquial Aliases', () => {
    assert.equal(resolveCropFromIdentifier('ذرة شامي')?.id, 'maize');
    assert.equal(resolveCropFromIdentifier('ذرة عويجة')?.id, 'sorghum');
    assert.equal(resolveCropFromIdentifier('غلة')?.id, 'wheat');
    assert.equal(resolveCropFromIdentifier('قوطة')?.id, 'tomato');
    assert.equal(resolveCropFromIdentifier('فول بلدي')?.id, 'faba_bean');
    assert.equal(resolveCropFromIdentifier('برسيم مصري')?.id, 'berseem');
  });
});
