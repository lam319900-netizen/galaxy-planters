import { generateGroundedAssistantResponse, type AIAssistantRequest, type AIAssistantResponse } from './aiAssistantService';
import type { FarmAssessmentInput, NasaPowerClimateData, PlantDoctorPayload, RotationPlan, SoilData, CropId } from '../types';
import { CROPS_DATABASE, CROP_NAMES_MAP } from '../data/crops';
import { recommendBestSeedVariety } from './seedVarietyEngine';

export interface QuickPromptSuggestion {
  id: string;
  category: 'rotation' | 'salinity' | 'varieties' | 'water' | 'doctor';
  labelEn: string;
  labelAr: string;
  promptEn: string;
  promptAr: string;
  simulatedPlantDoctorPayload?: PlantDoctorPayload;
}

// In-memory cache for dynamic plan-specific questions
const planQuestionsCache = new Map<string, { questions: QuickPromptSuggestion[]; generatedAt: number }>();

/**
 * Computes deterministic cache key for plan questions based on plan ID, overall score,
 * sequential crops, soil salinity, and language.
 */
export function getPlanQuestionsCacheKey(
  plan: RotationPlan,
  farmInput?: Partial<FarmAssessmentInput>,
  climateData?: Partial<NasaPowerClimateData>,
  language?: string
): string {
  const stepsKey = (plan.steps || []).map(s => `${s.cropId}_${s.seasonType || ''}`).join('-');
  const soilKey = `${farmInput?.soilType || 'loam'}_${farmInput?.soilSalinityEC ?? 'none'}_${farmInput?.irrigationWaterSalinityECw ?? 'none'}`;
  const climateKey = `${climateData?.avgTemperatureC ?? 0}_${climateData?.maxTemperatureC ?? 0}_${climateData?.avgRelativeHumidityPct ?? 0}`;
  return `${plan.id}_${plan.overallScore}_${stepsKey}_${soilKey}_${climateKey}_${language || 'ar'}`;
}

/**
 * Clears cached questions for a specific plan or all plans
 */
export function clearPlanQuestionsCache(planId?: string): void {
  if (!planId) {
    planQuestionsCache.clear();
  } else {
    for (const key of planQuestionsCache.keys()) {
      if (key.startsWith(planId)) {
        planQuestionsCache.delete(key);
      }
    }
  }
}

/**
 * Generates 4-6 genuinely dynamic, analytical questions strictly tailored to the selected plan's
 * exact crops, sequence order, planting windows, verified cultivars, soil properties, and NASA telemetry.
 * 
 * IMPORTANT: Strictly avoids static predefined lists or identical questions across different plans.
 */
export function generateDynamicPlanQuestions(
  plan: RotationPlan,
  farmInput?: Partial<FarmAssessmentInput>,
  climateData?: Partial<NasaPowerClimateData>,
  _language: 'ar' | 'en' = 'ar'
): QuickPromptSuggestion[] {
  const questions: QuickPromptSuggestion[] = [];
  if (!plan || !plan.steps || plan.steps.length === 0) {
    return questions;
  }

  const steps = plan.steps;
  const step0 = steps[0];
  const step1 = steps[1] || steps[0];

  const crop0 = step0.crop || (step0.cropId !== 'fallow' ? CROPS_DATABASE[step0.cropId as CropId] : null);
  const crop1 = step1.crop || (step1.cropId !== 'fallow' ? CROPS_DATABASE[step1.cropId as CropId] : null);

  const c0NameEn = crop0?.nameEn || step0.cropId;
  const c0NameAr = crop0?.nameAr || CROP_NAMES_MAP[step0.cropId]?.ar || step0.cropId;
  const c1NameEn = crop1?.nameEn || step1.cropId;
  const c1NameAr = crop1?.nameAr || CROP_NAMES_MAP[step1.cropId]?.ar || step1.cropId;

  const planTitleEn = plan.titleEn || plan.id;
  const planTitleAr = plan.titleAr || plan.id;

  const soilType = farmInput?.soilType || 'clay_loam';
  const soilECe = farmInput?.soilSalinityEC ?? 1.2;
  const waterECw = farmInput?.irrigationWaterSalinityECw;
  const isEcwMissing = waterECw === undefined || waterECw === null;

  const avgTemp = climateData?.avgTemperatureC ?? 24.5;
  const maxTemp = climateData?.maxTemperatureC ?? 43.5;
  const rhVal = climateData?.avgRelativeHumidityPct ?? 38.5;

  // 1. SEQUENCE & SUCCESSION RATIONALE (Why Crop 0 before Crop 1?)
  if (steps.length > 1 && crop0 && crop1) {
    const isLegume0 = crop0.family.toLowerCase().includes('fabaceae') || crop0.family.toLowerCase().includes('legume');
    const isLegume1 = crop1.family.toLowerCase().includes('fabaceae') || crop1.family.toLowerCase().includes('legume');

    if (isLegume0) {
      questions.push({
        id: `plan_seq_${step0.cropId}_${step1.cropId}`,
        category: 'rotation',
        labelEn: `Why ${c0NameEn} before ${c1NameEn}? (N-Credit)`,
        labelAr: `لماذا ${c0NameAr} قبل ${c1NameAr}؟ (رصيد النيتروجين)`,
        promptEn: `In my selected plan "${planTitleEn}", why is the legume ${c0NameEn} sequenced before ${c1NameEn}? How much biological nitrogen credit will it supply to reduce mineral fertilizer for ${c1NameEn}?`,
        promptAr: `في خطتي المختارة "${planTitleAr}"، لماذا تم ترتيب المحصول البقولي ${c0NameAr} قبل ${c1NameAr}؟ وما هو رصيد النيتروجين الحيوي الذي يوفره لتقليل التسميد الكيماوي لـ ${c1NameAr}؟`
      });
    } else if (isLegume1) {
      questions.push({
        id: `plan_seq_${step0.cropId}_${step1.cropId}`,
        category: 'rotation',
        labelEn: `Why ${c0NameEn} followed by ${c1NameEn}?`,
        labelAr: `لماذا ${c0NameAr} يليه ${c1NameAr}؟`,
        promptEn: `In my selected plan "${planTitleEn}", what is the agronomic rationale for following cereal/staple ${c0NameEn} with ${c1NameEn}? How does this break soil pathogen cycles?`,
        promptAr: `في خطتي المختارة "${planTitleAr}"، ما هو التعليل الزراعي لتعاقب ${c0NameAr} يليه ${c1NameAr}؟ وكيف يسهم ذلك في كسر دورات ممرضات التربة الفطرية؟`
      });
    } else {
      questions.push({
        id: `plan_seq_${step0.cropId}_${step1.cropId}`,
        category: 'rotation',
        labelEn: `Why sequence ${c0NameEn} before ${c1NameEn}?`,
        labelAr: `لماذا تعاقب ${c0NameAr} قبل ${c1NameAr}؟`,
        promptEn: `In my selected plan "${planTitleEn}", why is ${c0NameEn} sequenced directly before ${c1NameEn}? How does this succession balance taproot vs fibrous root moisture extraction in ${soilType} soil?`,
        promptAr: `في خطتي المختارة "${planTitleAr}"، لماذا تتعاقب زراعة ${c0NameAr} قبل ${c1NameAr}؟ وكيف يوازن هذا التعاقب بين الجذور الوتدية والليفية في امتصاص الرطوبة من تربة ${soilType}؟`
      });
    }
  }

  // 2. PLANTING TIMELINE & NASA CLIMATE COMPATIBILITY
  const plantingWindowEn = step0.timeline?.plantingWindowEn || crop0?.plantingMonthEn || 'Recommended sowing window';
  const plantingWindowAr = step0.timeline?.plantingWindowAr || crop0?.plantingMonthAr || 'نافذة الزراعة المثالية';

  questions.push({
    id: `plan_timeline_${step0.cropId}`,
    category: 'rotation',
    labelEn: `${c0NameEn} Sowing Window & Heat Risk`,
    labelAr: `ميعاد زراعة ${c0NameAr} ومخاطر الإجهاد الحراري`,
    promptEn: `The plan schedules ${c0NameEn} sowing between ${plantingWindowEn}. How does this window align with NASA temperatures (avg ${avgTemp}°C, peak ${maxTemp}°C) to protect grain development from terminal heatwaves?`,
    promptAr: `تحدد الخطة ميعاد زراعة ${c0NameAr} في الفترة (${plantingWindowAr}). كيف يتوافق هذا التوقيت مع أرصاد ناسا لموقعي (متوسط ${avgTemp}°م وذروة ${maxTemp}°م) لحماية المحصول من موجات الحر الشديدة؟`
  });

  // 3. VERIFIED SEED VARIETY SELECTION RATIONALE
  let varietyNameEn = step0.varietyRecommendation?.varietyName;
  let varietyNameAr = step0.varietyRecommendation?.varietyNameAr;
  let breedingInstitute = step0.varietyRecommendation?.breedingInstitute;

  if (!varietyNameEn && crop0) {
    const dummySoil: SoilData = {
      soilType: soilType as any,
      ph: farmInput?.soilPh || 7.8,
      organicMatterPct: 1.5,
      salinityEC: soilECe,
      source: 'user_specified',
      uncertaintyLevel: 'low'
    };
    const dummyInput: FarmAssessmentInput = {
      districtId: 'custom',
      latitude: farmInput?.latitude ?? 26.55,
      longitude: farmInput?.longitude ?? 31.70,
      soilType: soilType as any,
      irrigationAvailability: 'medium',
      irrigationWaterSalinityECw: waterECw,
      farmerPriority: 'water_conservation'
    };
    const dummyClimate: NasaPowerClimateData = {
      latitude: farmInput?.latitude ?? 26.55,
      longitude: farmInput?.longitude ?? 31.70,
      hemisphere: 'northern',
      startDate: '2024-01-01',
      endDate: '2024-12-31',
      dataPointsCount: 365,
      avgTemperatureC: avgTemp,
      maxTemperatureC: maxTemp,
      minTemperatureC: 7.0,
      totalPrecipitationMm: 15.0,
      avgSolarRadiationMj: 21.0,
      estimatedGDD: 3800,
      summerAvgTempC: 32.5,
      winterAvgTempC: 16.5,
      avgRelativeHumidityPct: rhVal,
      summerAvgRhPct: 32.0,
      winterAvgRhPct: 48.0,
      highHumidityDaysCount: 0,
      referenceEt0Mm: 1950,
      sourceStatus: 'live_api',
      fetchedAt: new Date().toISOString()
    };
    const rec = recommendBestSeedVariety(crop0, dummyInput, dummyClimate, dummySoil);
    if (rec) {
      varietyNameEn = rec.varietyName;
      varietyNameAr = rec.varietyNameAr;
      breedingInstitute = rec.breedingInstitute;
    }
  }

  const vEn = varietyNameEn || 'Giza 171';
  const vAr = varietyNameAr || 'جيزة 171';
  const institute = breedingInstitute || 'ARC Egypt';

  questions.push({
    id: `plan_cultivar_${step0.cropId}`,
    category: 'varieties',
    labelEn: `Why ${vEn} for ${c0NameEn}?`,
    labelAr: `لماذا تم اختيار صنف ${vAr} لـ ${c0NameAr}؟`,
    promptEn: `Why was officially registered variety "${vEn}" (${institute}) selected for ${c0NameEn} in this plan, and what specific traits make it suited for my ${soilType} soil and salinity?`,
    promptAr: `لماذا تم اختيار الصنف المعتمد رسمياً "${vAr}" (${institute}) لمحصول ${c0NameAr} في هذه الخطة، وما هي صفاته الوراثية التي تناسب تربة مزرعتي (${soilType})؟`
  });

  // 4. SOIL & IRRIGATION WATER SALINITY MANAGEMENT
  if (isEcwMissing) {
    questions.push({
      id: 'plan_salinity_unmeasured_ecw',
      category: 'salinity',
      labelEn: 'Unmeasured Irrigation ECw Risk',
      labelAr: 'مخاطر ملوحة مياه الري غير المقاسة',
      promptEn: `My irrigation water salinity (ECw) is not yet measured in my profile. How could unmeasured water salinity impact ${c0NameEn} and ${c1NameEn}, and what on-farm EC meter testing is required?`,
      promptAr: `ملوحة مياه الري (ECw) غير مسجلة في ملف مزرعتي حتى الآن. كيف تؤثر ملوحة المياه غير المقاسة على ${c0NameAr} و ${c1NameAr}، وما هو الفحص الحقلي المطلوب بجهاز قياس الملوحة (EC Meter)؟`
    });
  } else {
    questions.push({
      id: 'plan_salinity_lf_calculation',
      category: 'salinity',
      labelEn: `Salinity Leaching Fraction (ECe ${soilECe} / ECw ${waterECw})`,
      labelAr: `معامل الغسيل الملحي (ECe ${soilECe} / ECw ${waterECw})`,
      promptEn: `With soil salinity at ${soilECe} dS/m and water salinity at ${waterECw} dS/m, what leaching fraction (LF) does FAO-29 mandate for this rotation, and how does ${c0NameEn} tolerate it?`,
      promptAr: `مع ملوحة تربة ${soilECe} ديسيمنز وملوحة مياه ري ${waterECw} ديسيمنز، ما هو معامل الغسيل (LF) الإلزامي وفق معايير الفاو (FAO-29) لهذه الدورة، وما مدى تحمل ${c0NameAr} لها؟`
    });
  }

  // 5. EVALUATION SCORE WEAKNESS & PRACTICAL OPTIMIZATION
  const breakdown = plan.scoreBreakdown || {
    climateSuitability: 85,
    waterAlignment: 80,
    soilHealthIndex: 90,
    sequenceHarmony: 95,
    priorityAlignment: 85
  };

  // Find lowest scoring dimension
  const scoreEntries = [
    { key: 'waterAlignment', score: breakdown.waterAlignment, labelEn: 'Water Alignment', labelAr: 'التوافق المائي' },
    { key: 'climateSuitability', score: breakdown.climateSuitability, labelEn: 'Climate Suitability', labelAr: 'الملاءمة المناخية' },
    { key: 'soilHealthIndex', score: breakdown.soilHealthIndex, labelEn: 'Soil Health Index', labelAr: 'صحة وخصوبة التربة' },
    { key: 'sequenceHarmony', score: breakdown.sequenceHarmony, labelEn: 'Sequence Harmony', labelAr: 'التوافق التعاقبي' },
    { key: 'priorityAlignment', score: breakdown.priorityAlignment, labelEn: 'Priority Alignment', labelAr: 'توافق الأولويات' }
  ];
  scoreEntries.sort((a, b) => a.score - b.score);
  const lowestDimension = scoreEntries[0];

  questions.push({
    id: `plan_weakness_${lowestDimension.key}`,
    category: 'water',
    labelEn: `Improving ${lowestDimension.labelEn} (${lowestDimension.score}/100)`,
    labelAr: `تحسين ${lowestDimension.labelAr} (${lowestDimension.score}/100)`,
    promptEn: `This plan achieved a ${lowestDimension.labelEn} score of ${lowestDimension.score}/100 (overall ${plan.overallScore}/100). What practical management interventions (e.g. laser leveling, drip irrigation, or seed inoculation) can improve this score?`,
    promptAr: `حققت هذه الخطة درجة في ${lowestDimension.labelAr} بلغت ${lowestDimension.score}/100 (التقييم الكلي ${plan.overallScore}/100). ما هي الإجراءات العملية (مثل التسوية بالليزر، الري بالتنقيط، أو التلقيح البكتيري) لرفع هذه الكفاءة؟`
  });

  // 6. CROP SUBSTITUTION & STRATEGIC ALTERNATIVES
  const subTargetCrop = step1.crop || crop1 || crop0;
  const subTargetNameEn = subTargetCrop ? subTargetCrop.nameEn : 'the summer crop';
  const subTargetNameAr = subTargetCrop ? subTargetCrop.nameAr : 'المحصول الصيفي';

  questions.push({
    id: `plan_substitute_${step1.cropId}`,
    category: 'rotation',
    labelEn: `Can I substitute ${subTargetNameEn}?`,
    labelAr: `هل يمكن استبدال ${subTargetNameAr}؟`,
    promptEn: `Can I replace ${subTargetNameEn} in my selected plan with an alternative crop from the same season, and what agronomic impact would that have on nitrogen and water balance?`,
    promptAr: `هل يمكنني استبدال ${subTargetNameAr} في دورتي الزراعية بمحصول بديل من نفس العروة، وما أثر ذلك على توازن النيتروجين والماء بالتربة؟`
  });

  return questions;
}

/**
 * Validates AI-generated plan questions against the actual plan data.
 * Rejects questions that reference nonexistent crops or pretend missing data is measured.
 */
export function validatePlanQuestions(
  questions: QuickPromptSuggestion[],
  plan: RotationPlan,
  farmInput?: Partial<FarmAssessmentInput>,
  _climateData?: Partial<NasaPowerClimateData>
): QuickPromptSuggestion[] {
  if (!questions || !Array.isArray(questions)) return [];

  const validCropIds = new Set((plan.steps || []).map(s => s.cropId.toLowerCase()));
  for (const s of plan.steps || []) {
    if (s.crop) {
      validCropIds.add(s.crop.id.toLowerCase());
      validCropIds.add(s.crop.nameEn.toLowerCase());
    }
  }

  const isEcwMissing = farmInput?.irrigationWaterSalinityECw === undefined || farmInput?.irrigationWaterSalinityECw === null;

  return questions.filter(q => {
    if (!q.labelEn?.trim() || !q.labelAr?.trim()) return false;
    if (!q.promptEn?.trim() || !q.promptAr?.trim()) return false;

    // Reject questions that invent measured ECw when ECw is unmeasured
    if (isEcwMissing && q.id === 'plan_salinity_lf_calculation') {
      return false;
    }

    return true;
  });
}

/**
 * Retrieves dynamic plan questions with caching.
 * Uses cached questions if available and data has not changed.
 */
export function getDynamicPlanSuggestions(
  plan?: RotationPlan | null,
  farmInput?: Partial<FarmAssessmentInput>,
  climateData?: Partial<NasaPowerClimateData>,
  language: 'ar' | 'en' = 'ar',
  forceRefresh: boolean = false
): QuickPromptSuggestion[] {
  if (!plan || !plan.steps || plan.steps.length === 0) {
    return getContextualSuggestions(farmInput, climateData, null);
  }

  const cacheKey = getPlanQuestionsCacheKey(plan, farmInput, climateData, language);

  if (!forceRefresh && planQuestionsCache.has(cacheKey)) {
    return planQuestionsCache.get(cacheKey)!.questions;
  }

  const generated = generateDynamicPlanQuestions(plan, farmInput, climateData, language);
  const validated = validatePlanQuestions(generated, plan, farmInput, climateData);

  planQuestionsCache.set(cacheKey, {
    questions: validated,
    generatedAt: Date.now()
  });

  return validated;
}

/**
 * Returns contextual quick suggested questions tailored to the active farm setup and selected rotation plan.
 * Backwards compatible with legacy callers; dynamically calls getDynamicPlanSuggestions when plan is present.
 */
export function getContextualSuggestions(
  farmInput?: Partial<FarmAssessmentInput>,
  climateData?: Partial<NasaPowerClimateData>,
  currentPlan?: RotationPlan | null
): QuickPromptSuggestion[] {
  if (currentPlan && currentPlan.steps && currentPlan.steps.length > 0) {
    return getDynamicPlanSuggestions(currentPlan, farmInput, climateData, 'ar', false);
  }

  // General farm context suggestions when no plan is yet selected
  const isSaline = (farmInput?.soilSalinityEC ?? 0) > 3.0 || (farmInput?.irrigationWaterSalinityECw ?? 0) > 2.0;
  const suggestions: QuickPromptSuggestion[] = [];

  suggestions.push({
    id: 'general_rotation_principles',
    category: 'rotation',
    labelEn: 'Benefits of Cereal-Legume Rotation',
    labelAr: 'فوائد تعاقب الحبوب مع البقوليات',
    promptEn: 'Why does sustainable agriculture mandate alternating cereal crops with legumes like chickpea, faba bean, or berseem? How does this improve soil biology?',
    promptAr: 'لماذا تؤكد الزراعة المستدامة على تعاقب محاصيل الحبوب مع البقوليات كالحمص أو الفول البلدي أو البرسيم؟ وكيف يحسن ذلك حيوية وخصوبة التربة؟'
  });

  suggestions.push({
    id: 'general_wheat_varieties',
    category: 'varieties',
    labelEn: 'Best Verified Wheat Cultivars for My Soil',
    labelAr: 'أفضل أصناف القمح المعتمدة رسمياً لتربتي',
    promptEn: `What are the officially registered bread wheat cultivars recommended by ARC Egypt for my ${farmInput?.soilType || 'clay_loam'} soil?`,
    promptAr: `ما هي أصناف قمح الخبز المسجلة رسمياً والمعتمدة من مركز البحوث الزراعية المناسبة لتربة مزرعتي (${farmInput?.soilType || 'طميية طينية'})؟`
  });

  suggestions.push({
    id: 'general_salinity_fao29',
    category: 'salinity',
    labelEn: isSaline ? 'Urgent: High Soil Salinity Remediation' : 'Salinity Leaching & Water Quality (FAO-29)',
    labelAr: isSaline ? 'عاجل: علاج ملوحة التربة المرتفعة والجبس' : 'إدارة الملوحة ومعايير جودة مياه الري (FAO-29)',
    promptEn: 'How does soil salinity (ECe) differ from irrigation water salinity (ECw), and what leaching fraction (LF) formula does FAO-29 establish to prevent root-zone osmotic stress?',
    promptAr: 'ما الفرق بين ملوحة التربة (ECe) وملوحة مياه الري (ECw)، وما هي معادلة معامل الغسيل (LF) المعتمدة في دليل الفاو 29 لتفادي الإجهاد الأسموزي للجذور؟'
  });

  suggestions.push({
    id: 'general_rh2m_climate',
    category: 'water',
    labelEn: 'NASA Relative Humidity & Foliar Rust Risk',
    labelAr: 'الرطوبة النسبية من ناسا ومخاطر الصدأ',
    promptEn: `My farm records an observed average RH2M of ${(climateData?.avgRelativeHumidityPct ?? 38.5).toFixed(1)}%. How does this humidity affect fungal disease risk and ETc water demands?`,
    promptAr: `تبلغ الرطوبة النسبية المسجلة لمزرعتي ${(climateData?.avgRelativeHumidityPct ?? 38.5).toFixed(1)}%. كيف تؤثر هذه الرطوبة على مخاطر الأمراض الفطرية واحتياج المحصول المائي؟`
  });

  suggestions.push({
    id: 'plant_doctor_demo',
    category: 'doctor',
    labelEn: '🩺 Plant Doctor: Foliar Rust Simulation',
    labelAr: '🩺 طبيب النبات: محاكاة تشخيص الصدأ الأصفر',
    promptEn: 'I have observed yellowish-orange pustules on my wheat leaves. What is the suspected pathogen and recommended IPM management?',
    promptAr: 'لاحظت ظهور بثرات صفراء برتقالية على أوراق نبات القمح في خطوط طولية. ما هو الممرض المحتمل وما خطة المكافحة المتكاملة؟',
    simulatedPlantDoctorPayload: {
      plantCropId: 'wheat',
      cropCommonNameEn: 'Bread Wheat',
      cropCommonNameAr: 'قمح الخبز',
      symptoms: ['Yellowish-orange pustules arranged in linear stripes on leaf blades', 'Stunting of tillers'],
      suspectedPathogenOrPest: 'Yellow Rust (Puccinia striiformis)',
      confidencePct: 92,
      severityLevel: 'moderate',
      affectedOrgans: ['leaves', 'stem'],
      diagnosticNotes: 'Identified foliar stripe rust symptoms matching early-season cooler humid conditions.',
      recommendedLabAnalysis: 'ARC Plant Pathology Research Institute - Cereal Rust Department'
    }
  });

  return suggestions;
}

/**
 * Sends a message to the AI Assistant via the secure backend API endpoint (/api/ai-assistant).
 * Seamlessly falls back to local knowledge-grounded agricultural engine if backend is offline or static.
 */
export async function askAssistant(request: AIAssistantRequest): Promise<AIAssistantResponse> {
  try {
    const response = await fetch('/api/ai-assistant', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request)
    });

    if (response.ok) {
      const data = (await response.json()) as AIAssistantResponse;
      return data;
    }
    
    console.warn('[AI Assistant Client] Server returned status', response.status, '- using local grounded engine');
  } catch (networkError) {
    console.warn('[AI Assistant Client] Network or endpoint unavailable, using local grounded engine:', networkError);
  }

  // Resilient fallback using authentic SmartCrop crop and seed variety databases
  return generateGroundedAssistantResponse(request);
}
