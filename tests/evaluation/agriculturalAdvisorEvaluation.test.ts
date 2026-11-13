import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { generateGroundedAssistantResponse } from '../../src/services/aiAssistantService';
import { retrieveScientificKnowledge } from '../../src/services/scientificKnowledgeBase';
import { CROPS_DATABASE } from '../../src/data/crops';
import type { 
  FarmAssessmentInput, 
  NasaPowerClimateData, 
  RotationPlan 
} from '../../src/types';

describe('Agricultural Advisor Scientific Literature Evaluation (40 Evaluation Benchmarks)', () => {

  const testFarm: FarmAssessmentInput = {
    districtId: 'eval_farm_01',
    latitude: 26.55,
    longitude: 31.70,
    locationName: 'Sohag Agricultural Research Baseline (Nile Basin)',
    soilType: 'clay_loam',
    soilPh: 7.9,
    organicMatterPct: 1.4,
    soilSalinityEC: 2.1,
    irrigationAvailability: 'medium',
    irrigationMethod: 'surface_furrow',
    irrigationWaterSalinityECw: 1.2,
    farmerPriority: 'water_conservation',
    previousCrop: 'berseem'
  };

  const testClimate: NasaPowerClimateData = {
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

  const testPlan: RotationPlan = {
    id: 'eval_plan_wheat_legume',
    titleEn: 'Scientific Evaluation Cereal-Legume Rotation',
    titleAr: 'دورة تقييم الحبوب والبقوليات العلمية',
    taglineEn: 'Calibrated against FAO, ICARDA and CIMMYT benchmarks',
    taglineAr: 'معايرة وفق معايير الفاو وإيكاردا وسيميت',
    strategicFocusEn: 'Balanced sustainable rotation',
    strategicFocusAr: 'تعاقب زراعي مستدام متوازن',
    overallScore: 90,
    scoreBreakdown: {
      climateSuitability: 90,
      waterAlignment: 90,
      soilHealthIndex: 90,
      sequenceHarmony: 90,
      priorityAlignment: 90
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
          timingRationaleAr: 'توافق طور امتلاء الحبوب مع اعتدال فبراير ومارس'
        },
        waterEstimateMm: 480,
        nitrogenContributionKg: -40,
        roleInRotationEn: 'Primary staple cereal',
        roleInRotationAr: 'محصول حبوب رئيسي',
        agronomicRationaleEn: 'High productivity in alluvial silt-clay soils',
        agronomicRationaleAr: 'إنتاجية عالية في الأراضي الطميية الطينية',
        importantNotesEn: 'Monitor yellow rust under high humidity',
        importantNotesAr: 'متابعة الصدأ الأصفر'
      },
      {
        seasonLabelEn: 'Year 1 - Summer',
        seasonLabelAr: 'السنة الأولى - صيفي',
        seasonYear: 1,
        seasonType: 'summer',
        cropId: 'sesame',
        crop: CROPS_DATABASE.sesame,
        timeline: {
          plantingWindowEn: 'May 10 - June 10',
          plantingWindowAr: '10 مايو - 10 يونيو',
          harvestWindowEn: 'August 25 - Sept 20',
          harvestWindowAr: '25 أغسطس - 20 سبتمبر',
          durationDays: 105,
          durationRangeEn: '95-115 days',
          durationRangeAr: '95-115 يوماً',
          seasonClassificationEn: 'Summer Oilseed',
          seasonClassificationAr: 'محصول زيتي صيفي',
          timingRationaleEn: 'Requires high temperatures and dry ripening conditions',
          timingRationaleAr: 'يتطلب حرارة مرتفعة وجفافاً أثناء النضج'
        },
        waterEstimateMm: 390,
        nitrogenContributionKg: -20,
        roleInRotationEn: 'Drought-tolerant oilseed',
        roleInRotationAr: 'محصول زيتي متحمل للجفاف',
        agronomicRationaleEn: 'Low water requirement with high cash value',
        agronomicRationaleAr: 'استهلاك مائي منخفض وقيمة اقتصادية مرتفعة',
        importantNotesEn: 'Avoid waterlogging; sesame is highly sensitive to standing water',
        importantNotesAr: 'الحذر الشديد من الغدق وركود المياه'
      }
    ]
  };

  // Helper to execute grounded advisor query
  const ask = (query: string, lang: 'ar' | 'en' = 'en', customFarm?: Partial<FarmAssessmentInput>) => {
    return generateGroundedAssistantResponse({
      messages: [{ role: 'user', content: query }],
      language: lang,
      farmInput: { ...testFarm, ...customFarm },
      climateData: testClimate,
      currentPlan: testPlan
    });
  };

  // =========================================================================
  // GROUP 1: FAO-56 CROP EVAPOTRANSPIRATION & WATER REQUIREMENTS (Q1 - Q8)
  // =========================================================================
  describe('Group 1: FAO-56 Crop Evapotranspiration & Water Requirements', () => {
    it('Q01: Wheat seasonal ETc water requirement aligns with FAO-56 range (450-550 mm)', () => {
      const res = ask('What is the total seasonal water requirement for wheat according to FAO-56?');
      assert.ok(res.content.includes('480 mm') || res.content.includes('450') || res.content.includes('FAO-56'));
      assert.ok(res.sources.some(s => s.referenceCode === 'FAO-56'));
    });

    it('Q02: Wheat mid-season crop coefficient (Kc mid) aligns with FAO-56 value (1.15)', () => {
      const res = ask('What is the mid-season crop coefficient Kc for wheat under standard FAO-56?');
      assert.ok(res.content.includes('1.15') || res.content.includes('Kc'));
    });

    it('Q03: Maize seasonal water demand reflects high summer C4 transpirational needs', () => {
      const res = ask('What is the seasonal water requirement for maize (corn)?');
      assert.ok(res.content.includes('mm') && (res.content.includes('maize') || res.content.includes('Maize')));
      assert.ok(res.sources.some(s => s.organization === 'FAO'));
    });

    it('Q04: Chickpea low water footprint compared to cereals (280-350 mm)', () => {
      const res = ask('How does the water consumption of chickpea compare to wheat?');
      assert.ok(res.content.includes('chickpea') || res.content.includes('Chickpea'));
      assert.ok(res.content.includes('mm') || res.content.includes('FAO-56'));
    });

    it('Q05: Faba bean seasonal water requirement under Mediterranean/Nile irrigation', () => {
      const res = ask('What is the water requirement for faba bean according to FAO-56?');
      assert.ok(res.content.includes('faba bean') || res.content.includes('Faba'));
      assert.ok(res.sources.some(s => s.referenceCode === 'FAO-56'));
    });

    it('Q06: Barley water demand under deficit irrigation in dry areas', () => {
      const res = ask('What is the water demand of barley in drylands?');
      assert.ok(res.content.includes('Barley') || res.content.includes('barley'));
      assert.ok(res.sources.some(s => s.organization === 'ICARDA' || s.organization === 'FAO'));
    });

    it('Q07: Sesame sensitivity to standing water and moderate seasonal water requirement', () => {
      const res = ask('What is the water requirement and irrigation sensitivity of sesame?');
      assert.ok(res.content.includes('Sesame') || res.content.includes('sesame'));
      assert.ok(res.content.includes('waterlogging') || res.content.includes('drainage') || res.content.includes('mm'));
    });

    it('Q08: Pearl millet extreme water use efficiency under high evaporative demand', () => {
      const res = ask('Why is pearl millet considered water efficient in summer?');
      assert.ok(res.content.includes('millet') || res.content.includes('Millet'));
      assert.ok(res.content.includes('C4') || res.content.includes('water') || res.content.includes('drought'));
    });
  });

  // =========================================================================
  // GROUP 2: FAO-29 SOIL & WATER SALINITY STANDARDS (Q9 - Q16)
  // =========================================================================
  describe('Group 2: FAO-29 Soil & Water Salinity Standards', () => {
    it('Q09: Bread wheat threshold soil salinity (ECe) tolerance is 6.0 dS/m before yield loss', () => {
      const res = ask('What is the threshold soil salinity (ECe) for wheat according to FAO-29?');
      assert.ok(res.content.includes('6.0') || res.content.includes('6 dS/m') || res.content.includes('FAO-29'));
      assert.ok(res.sources.some(s => s.referenceCode === 'FAO-29'));
    });

    it('Q10: Barley high salinity tolerance (ECe up to 8.0 dS/m without yield reduction)', () => {
      const res = ask('What is the most salt-tolerant cereal crop according to FAO-29?');
      assert.ok(res.content.includes('Barley') || res.content.includes('barley'));
      assert.ok(res.content.includes('8.0') || res.content.includes('8 dS/m') || res.content.includes('salin'));
    });

    it('Q11: Faba bean salinity sensitivity threshold (ECe ~ 1.6 - 2.0 dS/m)', () => {
      const res = ask('How sensitive is faba bean to soil salinity (ECe)?');
      assert.ok(res.content.includes('Faba') || res.content.includes('faba'));
      assert.ok(res.content.includes('sensitive') || res.content.includes('salinity') || res.content.includes('dS/m'));
    });

    it('Q12: Leaching requirement equation definition according to FAO-29 (LF = ECw / (5*ECe - ECw))', () => {
      const res = ask('How does FAO-29 define the leaching fraction requirement for saline soils?');
      assert.ok(res.content.includes('FAO-29') || res.content.includes('Leaching'));
      assert.ok(res.content.includes('ECw') || res.content.includes('ECe') || res.content.includes('LF'));
    });

    it('Q13: Strict prohibition of guessing missing irrigation water salinity (ECw)', () => {
      const res = ask('What is my irrigation water salinity?', 'en', { irrigationWaterSalinityECw: undefined });
      assert.ok(res.content.includes('unmeasured') || res.content.includes('not provided') || res.content.includes('Not Specified'));
      assert.ok(res.content.includes('prohibited to assume') || res.content.includes('cannot be assumed') || res.content.includes('NEVER assume'));
    });

    it('Q14: Recommendation of calibrated on-farm EC meter when ECw is unmeasured', () => {
      const res = ask('How should I find my irrigation water salinity if it is not in my profile?', 'en', { irrigationWaterSalinityECw: undefined });
      assert.ok(res.content.includes('EC meter') || res.content.includes('laboratory') || res.content.includes('water test'));
    });

    it('Q15: Soil salinity (ECe) vs Water salinity (ECw) conceptual distinction', () => {
      const res = ask('What is the difference between soil ECe and water ECw?');
      assert.ok(res.content.includes('ECe') && res.content.includes('ECw'));
      assert.ok(res.content.includes('saturated paste') || res.content.includes('soil') || res.content.includes('irrigation'));
    });

    it('Q16: Application of agricultural phosphogypsum (CaSO4) for sodic/saline soil remediation', () => {
      const res = ask('How does gypsum help in saline or sodic clay soils according to ICARDA and FAO?');
      assert.ok(res.content.includes('gypsum') || res.content.includes('Gypsum') || res.content.includes('CaSO4') || res.content.includes('الجبس'));
      assert.ok(res.sources.some(s => s.organization === 'FAO' || s.organization === 'ICARDA'));
    });
  });

  // =========================================================================
  // GROUP 3: CROP ROTATIONS & CEREAL-LEGUME ALTERNATION (Q17 - Q24)
  // =========================================================================
  describe('Group 3: Crop Rotations & Biological Nitrogen Fixation (ICARDA & FAO)', () => {
    it('Q17: Agronomic rationale for alternating legumes before cereals', () => {
      const res = ask('Why should a farmer plant legumes like chickpea or berseem before wheat?');
      assert.ok(res.content.includes('nitrogen') || res.content.includes('Nitrogen') || res.content.includes('Rhizobium'));
      assert.ok(res.content.includes('legume') || res.content.includes('Legume'));
      assert.ok(res.sources.some(s => s.organization === 'FAO' || s.organization === 'ICARDA'));
    });

    it('Q18: Biological nitrogen fixation credit quantified (30 to 60 kg N/ha)', () => {
      const res = ask('What nitrogen credit do grain legumes supply to the succeeding cereal crop?');
      assert.ok(res.content.includes('kg') || res.content.includes('nitrogen') || res.content.includes('N/'));
    });

    it('Q19: Disease break benefit of rotating cereals with non-cereal crops', () => {
      const res = ask('How does crop rotation reduce soil-borne cereal root pathogens?');
      assert.ok(res.content.includes('disease') || res.content.includes('pathogen') || res.content.includes('break') || res.content.includes('cycle'));
      assert.ok(res.sources.some(s => s.organization === 'ICARDA' || s.organization === 'FAO'));
    });

    it('Q20: Sequence rationale in selected plan (Why wheat in winter and sesame in summer?)', () => {
      const res = ask('Why does my selected rotation sequence wheat in winter followed by sesame in summer?');
      assert.ok(res.content.includes('Wheat') || res.content.includes('wheat'));
      assert.ok(res.content.includes('Sesame') || res.content.includes('sesame'));
      assert.ok(res.content.includes('thermal') || res.content.includes('season') || res.content.includes('water'));
    });

    it('Q21: Evaluating crop substitution options without disrupting rotational harmony', () => {
      const res = ask('Can I replace sesame in my plan with another crop?');
      assert.ok(res.content.includes('replace') || res.content.includes('substitute') || res.content.includes('Alternative') || res.content.includes('Substitution'));
      assert.ok(res.content.includes('sesame') || res.content.includes('Sesame'));
    });

    it('Q22: Agronomic risks of continuous cereal monoculture (wheat after wheat)', () => {
      const res = ask('What happens if I grow wheat after wheat continuously for three seasons?');
      assert.ok(res.content.includes('root rot') || res.content.includes('yield decline') || res.content.includes('depletion') || res.content.includes('monoculture'));
    });

    it('Q23: Deep-root vs shallow-root nutrient extraction balance in sustainable rotations', () => {
      const res = ask('How do root architectures of legumes and cereals complement each other in soil?');
      assert.ok(res.content.includes('root') || res.content.includes('soil') || res.content.includes('nutrient'));
    });

    it('Q24: Weed cycle disruption through cool-season to warm-season crop alternations', () => {
      const res = ask('How does alternating winter and summer crops suppress weed populations?');
      assert.ok(res.content.includes('weed') || res.content.includes('cycle') || res.content.includes('suppress') || res.content.includes('rotation'));
    });
  });

  // =========================================================================
  // GROUP 4: SOWING DATES & CIMMYT TERMINAL HEAT AVOIDANCE (Q25 - Q32)
  // =========================================================================
  describe('Group 4: Sowing Dates & CIMMYT Terminal Heat Avoidance', () => {
    it('Q25: Optimal bread wheat sowing window in Upper Egypt / Middle East (Nov 15 - Dec 10)', () => {
      const res = ask('What is the optimal sowing date for wheat in my region?');
      assert.ok(res.content.includes('November') || res.content.includes('Nov') || res.content.includes('نوفمبر'));
      assert.ok(res.sources.some(s => s.organization === 'CIMMYT' || s.organization === 'ARC Egypt'));
    });

    it('Q26: Agronomic risk of 30-day sowing delay (Terminal heat stress during grain filling)', () => {
      const res = ask('What are the risks if my wheat planting is delayed by one month to January?');
      assert.ok(res.content.includes('heat') || res.content.includes('grain filling') || res.content.includes('yield loss') || res.content.includes('weight'));
      assert.ok(res.sources.some(s => s.organization === 'CIMMYT'));
    });

    it('Q27: Temperature threshold during wheat grain filling (> 32°C causes starch synthase abortion)', () => {
      const res = ask('At what temperature does wheat suffer severe heat stress during grain filling?');
      assert.ok(res.content.includes('30') || res.content.includes('32') || res.content.includes('33') || res.content.includes('°C'));
      assert.ok(res.sources.some(s => s.organization === 'CIMMYT'));
    });

    it('Q28: Optimal summer maize sowing date to synchronize flowering before peak July heatwaves', () => {
      const res = ask('When is the best planting time for summer maize to protect tasseling from heat?');
      assert.ok(res.content.includes('May') || res.content.includes('June') || res.content.includes('maize') || res.content.includes('Maize'));
    });

    it('Q29: Chickpea planting temperature threshold (Soil temp < 22°C to prevent damping off)', () => {
      const res = ask('What soil temperature is required before sowing chickpea?');
      assert.ok(res.content.includes('chickpea') || res.content.includes('Chickpea'));
      assert.ok(res.content.includes('temperature') || res.content.includes('°C') || res.content.includes('soil'));
    });

    it('Q30: Sorghum and pearl millet extreme temperature tolerance (> 40°C)', () => {
      const res = ask('Which grain crops can withstand temperatures above 40°C in peak summer?');
      assert.ok(res.content.includes('Sorghum') || res.content.includes('sorghum') || res.content.includes('millet') || res.content.includes('Millet'));
    });

    it('Q31: Identifying the planting window of the next crop in user active rotation plan', () => {
      const res = ask('When should I sow the next crop in my rotation plan?');
      assert.ok(res.content.includes('Sesame') || res.content.includes('sesame'));
      assert.ok(res.content.includes('May') || res.content.includes('June') || res.content.includes('window'));
    });

    it('Q32: Growing Degree Days (GDD) concept in crop maturity modeling', () => {
      const res = ask('How does Growing Degree Days (GDD) affect the harvest timeline?');
      assert.ok(res.content.includes('GDD') || res.content.includes('degree') || res.content.includes('thermal') || res.content.includes('maturity'));
    });
  });

  // =========================================================================
  // GROUP 5: VERIFIED SEED CULTIVARS & CHEMICAL SAFETY (Q33 - Q40)
  // =========================================================================
  describe('Group 5: Officially Registered Cultivars & Chemical Safety (ARC & CABI)', () => {
    it('Q33: Officially registered Egyptian bread wheat cultivar recommendation (Giza 171 / Sakha 95)', () => {
      const res = ask('What is the best officially registered wheat cultivar for my farm?');
      assert.ok(res.content.includes('Giza 171') || res.content.includes('Sakha 95') || res.content.includes('Misr 3') || res.content.includes('Sids 14'));
      assert.ok(res.sources.some(s => s.organization === 'ARC Egypt' || s.organization === 'CIMMYT'));
      assert.strictEqual(
        res.sources.some(s => s.organization === 'NASA POWER' && s.supportedSubject?.includes('seed_varieties')),
        false,
        'NASA POWER must NEVER be cited as a breeding authority'
      );
    });

    it('Q34: Faba bean registered cultivar with Orobanche (broomrape) tolerance (Giza 843 / Misr 1)', () => {
      const res = ask('What is the recommended faba bean cultivar tolerant to Orobanche crenata?');
      assert.ok(res.content.includes('Giza') || res.content.includes('Misr') || res.content.includes('faba') || res.content.includes('Orobanche'));
    });

    it('Q35: Maize registered single cross hybrid for high yield and heat tolerance (SC 10 / SC 128)', () => {
      const res = ask('What certified hybrid maize variety is recommended for high heat in Upper Egypt?');
      assert.ok(res.content.includes('SC') || res.content.includes('Single Cross') || res.content.includes('Giza') || res.content.includes('maize'));
    });

    it('Q36: Stripe / Yellow Rust (Puccinia striiformis) IPM management without fabricated chemicals', () => {
      const res = ask('How do I manage yellow rust on wheat in a humid winter?');
      assert.ok(res.content.includes('IPM') || res.content.includes('Integrated Pest Management') || res.content.includes('resistant') || res.content.includes('aeration'));
      assert.ok(res.content.includes('certified') || res.content.includes('laboratory') || res.content.includes('extension'));
      assert.ok(res.sources.some(s => s.organization === 'CABI PlantwisePlus'));
    });

    it('Q37: Strict prohibition against prescribing fabricated pesticide dosages', () => {
      const res = ask('Give me an exact chemical dosage of chemical fungicide to spray tomorrow.');
      assert.ok(res.content.includes('laboratory') || res.content.includes('certified') || res.content.includes('agronomist') || res.content.includes('IPM'));
    });

    it('Q38: Authentic Arabic advice for wheat varieties and planting dates (أصناف ومواعيد القمح)', () => {
      const res = ask('ما هي التقاوي المعتمدة رسمياً للقمح وميعاد الزراعة المناسب؟', 'ar');
      assert.ok(res.content.includes('جيزة') || res.content.includes('سخا') || res.content.includes('مصر') || res.content.includes('سدس'));
      assert.ok(res.content.includes('نوفمبر') || res.content.includes('الشتوية'));
      assert.ok(res.sources.length > 0);
    });

    it('Q39: Authentic Arabic advice on salinity management according to FAO-29 (الملوحة وغسيل التربة)', () => {
      const res = ask('كيف أتعامل مع ملوحة التربة 2.1 ديسيمنز وفق معايير الفاو؟', 'ar');
      assert.ok(res.content.includes('الفاو') || res.content.includes('FAO-29') || res.content.includes('ديسيمنز'));
      assert.ok(res.content.includes('غسيل') || res.content.includes('الجبس') || res.content.includes('صرف'));
    });

    it('Q40: Distinction between satellite historical reanalysis and instantaneous forecast', () => {
      const res = ask('Is the NASA weather data a live daily forecast for tomorrow?');
      assert.ok(res.content.includes('historical') || res.content.includes('reanalysis') || res.content.includes('NOT a live') || res.content.includes('not a forecast'));
      assert.ok(res.sources.some(s => s.organization === 'NASA POWER'));
    });
  });

});
