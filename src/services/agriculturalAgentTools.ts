import type { 
  Crop, 
  CropId, 
  RotationPlan, 
  FarmAssessmentInput, 
  NasaPowerClimateData, 
  SoilData 
} from '../types';
import { CROPS_DATABASE, CROP_NAMES_MAP } from '../data/crops';
import { retrieveScientificKnowledge, type ScientificPublication } from './scientificKnowledgeBase';

/**
 * Result of evaluating a proposed crop replacement in an active rotation plan.
 */
export interface CropReplacementEvaluation {
  isFeasible: boolean;
  feasibilityVerdict: 'infeasible' | 'conditionally_feasible' | 'feasible';
  verdictSummaryEn: string;
  verdictSummaryAr: string;
  targetCrop: Crop;
  replacementCrop: Crop;
  stepIndex: number;
  planTitleEn: string;
  planTitleAr: string;
  
  // Detailed dimension assessments
  seasonality: {
    targetSeason: string;
    replacementSeason: string;
    matches: boolean;
    analysisEn: string;
    analysisAr: string;
  };
  timeline: {
    targetSowingWindowEn: string;
    targetSowingWindowAr: string;
    replacementSowingWindowEn: string;
    replacementSowingWindowAr: string;
    harvestOverlapRisk: boolean;
    analysisEn: string;
    analysisAr: string;
  };
  waterBudget: {
    targetWaterMm: number;
    replacementWaterMm: number;
    deltaWaterMm: number;
    irrigationCompatible: boolean;
    analysisEn: string;
    analysisAr: string;
  };
  salinityTolerance: {
    soilECe: number;
    waterECw?: number;
    targetMaxECe: number;
    replacementMaxECe: number;
    salinityExceeded: boolean;
    analysisEn: string;
    analysisAr: string;
  };
  nitrogenAndSoilHealth: {
    targetNBalanceKg: number;
    replacementNBalanceKg: number;
    deltaNBalanceKg: number;
    monocultureRisk: boolean;
    analysisEn: string;
    analysisAr: string;
  };
  subsequentCropImpact: {
    nextCropId?: string;
    nextCropNameEn?: string;
    nextCropNameAr?: string;
    analysisEn: string;
    analysisAr: string;
  };
  missingInformation: string[];
  recommendedAlternatives: Array<{
    cropId: CropId;
    nameEn: string;
    nameAr: string;
    season: string;
    rationaleEn: string;
    rationaleAr: string;
  }>;
  relevantCitations: ScientificPublication[];
}

/**
 * Evaluates whether replacing a specific crop in a rotation plan with a proposed alternative is feasible.
 */
export function evaluateCropReplacement(params: {
  plan?: RotationPlan | null;
  targetCropIdentifier: string; // ID, name, or ordinal (e.g. 'chickpea', 'حمص', 'first crop', 'المحصول الأول')
  replacementCropIdentifier: string; // ID, name (e.g. 'maize', 'ذرة', 'ذرة شامية')
  farmInput?: Partial<FarmAssessmentInput>;
  climateData?: Partial<NasaPowerClimateData>;
  soilData?: Partial<SoilData>;
  language?: 'ar' | 'en';
}): CropReplacementEvaluation {
  const { plan, targetCropIdentifier, replacementCropIdentifier, farmInput, climateData: _climateData, soilData, language = 'en' } = params;

  // 1. Resolve Target Crop & Step Index in Plan
  let resolvedTargetCrop: Crop | null = null;
  let resolvedStepIndex = 0;

  // Check if target is an ordinal reference (e.g. 'first crop', 'المحصول الأول', 'step 3')
  const ordinalMatch = targetCropIdentifier.match(/(first|second|third|fourth|1st|2nd|3rd|4th|الأول|الثاني|الثالث|الرابع|step\s*([1-4])|المحصول\s*([1-4]))/i);
  if (ordinalMatch && plan?.steps && plan.steps.length > 0) {
    const rawOrd = ordinalMatch[0].toLowerCase();
    if (rawOrd.includes('1') || rawOrd.includes('first') || rawOrd.includes('الأول')) resolvedStepIndex = 0;
    else if (rawOrd.includes('2') || rawOrd.includes('second') || rawOrd.includes('الثاني')) resolvedStepIndex = 1;
    else if (rawOrd.includes('3') || rawOrd.includes('third') || rawOrd.includes('الثالث')) resolvedStepIndex = 2;
    else if (rawOrd.includes('4') || rawOrd.includes('fourth') || rawOrd.includes('الرابع')) resolvedStepIndex = 3;

    if (plan.steps[resolvedStepIndex]) {
      const step = plan.steps[resolvedStepIndex];
      resolvedTargetCrop = step.crop || (step.cropId && step.cropId !== 'fallow' ? CROPS_DATABASE[step.cropId as CropId] : null);
    }
  }

  // If not resolved by ordinal, match by crop name/ID
  if (!resolvedTargetCrop) {
    resolvedTargetCrop = resolveCropFromIdentifier(targetCropIdentifier);
    if (resolvedTargetCrop && plan?.steps) {
      const idx = plan.steps.findIndex(s => s.cropId.toLowerCase() === resolvedTargetCrop?.id.toLowerCase());
      if (idx !== -1) resolvedStepIndex = idx;
    }
  }

  // Default target crop fallback if missing
  if (!resolvedTargetCrop) {
    if (plan?.steps && plan.steps.length > 0) {
      resolvedStepIndex = 0;
      resolvedTargetCrop = plan.steps[0].crop || CROPS_DATABASE[plan.steps[0].cropId as CropId] || CROPS_DATABASE.chickpea;
    } else {
      resolvedTargetCrop = CROPS_DATABASE.chickpea;
    }
  }

  // 2. Resolve Replacement Crop
  const resolvedReplacementCrop = resolveCropFromIdentifier(replacementCropIdentifier) || CROPS_DATABASE.maize;

  // 3. Extract Farm & Climate Attributes
  const soilECe = farmInput?.soilSalinityEC ?? soilData?.salinityEC ?? 1.4;
  const waterECw = farmInput?.irrigationWaterSalinityECw;
  const soilType = farmInput?.soilType ?? 'clay_loam';
  const planTitleEn = plan?.titleEn || 'Active Rotation Plan';
  const planTitleAr = plan?.titleAr || 'الخطة الزراعية النشطة';

  // 4. Evaluate Growing Season Alignment
  const targetSeason = resolvedTargetCrop.season; // 'winter' | 'summer' | 'nili'
  const replacementSeason = resolvedReplacementCrop.season;
  
  // Seasonal compatibility rule
  const seasonsMatch = targetSeason === replacementSeason;

  const seasonality = {
    targetSeason,
    replacementSeason,
    matches: seasonsMatch,
    analysisEn: seasonsMatch
      ? `Both ${resolvedTargetCrop.nameEn} and ${resolvedReplacementCrop.nameEn} are suited for the ${targetSeason.toUpperCase()} cropping cycle.`
      : `Critical Seasonal Mismatch: ${resolvedTargetCrop.nameEn} is a ${targetSeason.toUpperCase()} crop, whereas ${resolvedReplacementCrop.nameEn} is a ${replacementSeason.toUpperCase()} crop. Planting ${resolvedReplacementCrop.nameEn} in the ${targetSeason} cycle leads to thermal dormancy, frost death, or vegetative failure.`,
    analysisAr: seasonsMatch
      ? `كلا المحصولين (${resolvedTargetCrop.nameAr} و ${resolvedReplacementCrop.nameAr}) ينتميان إلى نفس العروة الزراعية (${targetSeason === 'winter' ? 'الشتوية' : 'الصيفية'}).`
      : `عدم تطابق في العروة الموسمية: محصول ${resolvedTargetCrop.nameAr} محصول ${targetSeason === 'winter' ? 'شتوي' : 'صيفي'}، بينما ${resolvedReplacementCrop.nameAr} محصول ${replacementSeason === 'summer' ? 'صيفي' : 'شتوي'}. زراعة ${resolvedReplacementCrop.nameAr} في غير موسمه تؤدي إلى الفشل الخضري أو الموت بفعل البرودة.`
  };

  // 5. Evaluate Timeline & Harvest Overlap
  const targetStep = plan?.steps ? plan.steps[resolvedStepIndex] : null;
  const nextStep = plan?.steps && plan.steps.length > resolvedStepIndex + 1 ? plan.steps[resolvedStepIndex + 1] : null;
  const nextCrop = nextStep?.crop || (nextStep?.cropId ? CROPS_DATABASE[nextStep.cropId as CropId] : null);

  const targetSowingEn = targetStep?.timeline?.plantingWindowEn || resolvedTargetCrop.plantingMonthEn;
  const targetSowingAr = targetStep?.timeline?.plantingWindowAr || resolvedTargetCrop.plantingMonthAr;
  const replacementSowingEn = resolvedReplacementCrop.plantingMonthEn;
  const replacementSowingAr = resolvedReplacementCrop.plantingMonthAr;

  const harvestOverlapRisk = !seasonsMatch || (resolvedReplacementCrop.growingDays > resolvedTargetCrop.growingDays + 25);

  const timeline = {
    targetSowingWindowEn: targetSowingEn,
    targetSowingWindowAr: targetSowingAr,
    replacementSowingWindowEn: replacementSowingEn,
    replacementSowingWindowAr: replacementSowingAr,
    harvestOverlapRisk,
    analysisEn: harvestOverlapRisk
      ? `Timeline Clash: ${resolvedReplacementCrop.nameEn} requires ~${resolvedReplacementCrop.growingDays} days (${replacementSowingEn}), which delays physiological maturity and disrupts planting of the subsequent crop${nextCrop ? ` (${nextCrop.nameEn})` : ''}.`
      : `Timeline Compatible: ${resolvedReplacementCrop.nameEn} duration (~${resolvedReplacementCrop.growingDays} days) harmonizes within the designated rotational step.`,
    analysisAr: harvestOverlapRisk
      ? `تعارض زمني: يتطلب ${resolvedReplacementCrop.nameAr} دورة نمو تقارب ${resolvedReplacementCrop.growingDays} يوماً، مما يؤخر الحصاد ويعطل ميعاد زراعة المحصول التالي${nextCrop ? ` (${nextCrop.nameAr})` : ''}.`
      : `توافق زمني: فترة نمو ${resolvedReplacementCrop.nameAr} (~${resolvedReplacementCrop.growingDays} يوماً) تتناسب مع نافذة هذا الموسم.`
  };

  // 6. Evaluate Water Budget (FAO-56 ETc)
  const targetWater = targetStep?.waterEstimateMm ?? resolvedTargetCrop.waterRequirementMm;
  const replacementWater = resolvedReplacementCrop.waterRequirementMm;
  const deltaWater = replacementWater - targetWater;
  const irrigationCompatible = deltaWater <= 120 || farmInput?.irrigationAvailability === 'high';

  const waterBudget = {
    targetWaterMm: targetWater,
    replacementWaterMm: replacementWater,
    deltaWaterMm: deltaWater,
    irrigationCompatible,
    analysisEn: deltaWater > 0
      ? `Water Deficit Warning: ${resolvedReplacementCrop.nameEn} increases seasonal water consumption by +${deltaWater} mm ETc (${replacementWater} mm vs ${targetWater} mm), creating higher transpirational demand in your ${soilType} soil.`
      : `Water Conservation Benefit: ${resolvedReplacementCrop.nameEn} saves ${Math.abs(deltaWater)} mm ETc relative to ${resolvedTargetCrop.nameEn} (${replacementWater} mm vs ${targetWater} mm).`,
    analysisAr: deltaWater > 0
      ? `زيادة استهلاك المياه: يحتاج ${resolvedReplacementCrop.nameAr} إلى +${deltaWater} ملم مياه إضافية (${replacementWater} ملم مقارنة بـ ${targetWater} ملم)، مما يفرض ضغطاً إضافياً على مقننات الري.`
      : `توفير مائي: يوفر ${resolvedReplacementCrop.nameAr} حوالي ${Math.abs(deltaWater)} ملم مياه مقارنة بـ ${resolvedTargetCrop.nameAr}.`
  };

  // 7. Evaluate Soil & Salinity (FAO-29)
  const replacementMaxECe = resolvedReplacementCrop.salinityToleranceECe;
  const targetMaxECe = resolvedTargetCrop.salinityToleranceECe;
  const salinityExceeded = soilECe > replacementMaxECe || (waterECw !== undefined && waterECw > resolvedReplacementCrop.salinityToleranceECw);

  const salinityTolerance = {
    soilECe,
    waterECw,
    targetMaxECe,
    replacementMaxECe,
    salinityExceeded,
    analysisEn: salinityExceeded
      ? `Salinity Hazard: Current soil salinity (${soilECe} dS/m) exceeds the safe tolerance threshold of ${resolvedReplacementCrop.nameEn} (${replacementMaxECe} dS/m), risking root osmotic shock.`
      : `Salinity Safe: Soil salinity (${soilECe} dS/m) is safely below the maximum tolerance threshold of ${resolvedReplacementCrop.nameEn} (${replacementMaxECe} dS/m).`,
    analysisAr: salinityExceeded
      ? `تحذير الملوحة: ملوحة التربة (${soilECe} ديسيمنز/م) تتجاوز الحد الأقصى الآمن لتحمل ${resolvedReplacementCrop.nameAr} (${replacementMaxECe} ديسيمنز/م).`
      : `تحمل الملوحة آمن: ملوحة التربة (${soilECe} ديسيمنز/م) تقع ضمن النطاق المقبول لمحصول ${resolvedReplacementCrop.nameAr}.`
  };

  // 8. Evaluate Nitrogen Balance & Monoculture Penalties
  const isTargetLegume = resolvedTargetCrop.family.toLowerCase().includes('fabaceae') || resolvedTargetCrop.family.toLowerCase().includes('legume');
  const isReplacementLegume = resolvedReplacementCrop.family.toLowerCase().includes('fabaceae') || resolvedReplacementCrop.family.toLowerCase().includes('legume');
  const isReplacementCereal = resolvedReplacementCrop.family.toLowerCase().includes('poaceae') || resolvedReplacementCrop.family.toLowerCase().includes('gramineae');
  const isNextCereal = nextCrop ? (nextCrop.family.toLowerCase().includes('poaceae') || nextCrop.family.toLowerCase().includes('gramineae')) : false;

  const targetN = resolvedTargetCrop.nitrogenFixationKgPerHa;
  const replacementN = resolvedReplacementCrop.nitrogenFixationKgPerHa;
  const deltaN = replacementN - targetN;
  const monocultureRisk = (isReplacementCereal && isNextCereal) || (resolvedReplacementCrop.family.toLowerCase() === nextCrop?.family.toLowerCase());

  const nitrogenAndSoilHealth = {
    targetNBalanceKg: targetN,
    replacementNBalanceKg: replacementN,
    deltaNBalanceKg: deltaN,
    monocultureRisk,
    analysisEn: isTargetLegume && !isReplacementLegume
      ? `Biological Nitrogen Forfeiture: Replacing legume ${resolvedTargetCrop.nameEn} with ${resolvedReplacementCrop.nameEn} eliminates ~${targetN} kg N/ha in natural fixation and results in a net nitrogen loss of ${deltaN} kg N/ha.`
      : monocultureRisk
      ? `Disease & Pest Penalty: Replacing with ${resolvedReplacementCrop.nameEn} creates consecutive cultivation of ${resolvedReplacementCrop.family}, fostering root-rot pathogen buildup.`
      : `Soil Health Neutral/Positive: Rotational succession maintains diversity without monoculture penalties.`,
    analysisAr: isTargetLegume && !isReplacementLegume
      ? `خسارة النيتروجين الحيوي: استبدال البقولي ${resolvedTargetCrop.nameAr} بـ ${resolvedReplacementCrop.nameAr} يؤدي إلى حرمان التربة من رصيد التثبيت الحيوي (+${targetN} كجم N/هكتار) وتفريغ خصوبة الحقل.`
      : monocultureRisk
      ? `مخاطر الزراعة الأحادية: إدخال ${resolvedReplacementCrop.nameAr} يخلق تتابعاً متتالياً لنفس الفصيلة النباتية، مما يفاقم ممرضات وأعفان التربة.`
      : `صحة التربة متوازنة: لا توجد مخاطر زراعة أحادية متتالية.`
  };

  // 9. Evaluate Impact on Subsequent Crop
  const subsequentCropImpact = {
    nextCropId: nextCrop?.id,
    nextCropNameEn: nextCrop?.nameEn,
    nextCropNameAr: nextCrop?.nameAr,
    analysisEn: nextCrop
      ? `Impact on Step ${resolvedStepIndex + 2} (${nextCrop.nameEn}): ${
          isTargetLegume && isNextCereal
            ? `Subsequent ${nextCrop.nameEn} will require 25-35% more mineral nitrogen fertilizer because ${resolvedReplacementCrop.nameEn} does not leave a residual legume credit.`
            : `Succession with ${nextCrop.nameEn} remains manageable under adequate fertilizer scheduling.`
        }`
      : 'No subsequent crop scheduled in this plan.',
    analysisAr: nextCrop
      ? `الأثر على المحصول التالي (${nextCrop.nameAr}): ${
          isTargetLegume && isNextCereal
            ? `سيحتاج ${nextCrop.nameAr} إلى زيادة التسميد الأزوتي المعدني بنسبة 25-35% لتعويض غياب رصيد التثبيت الحيوي.`
            : `التعاقب مع ${nextCrop.nameAr} يظل قابلاً للإدارة مع ضبط برنامج التسميد.`
        }`
      : 'لا يوجد محصول لاحق مسجل في الخطة.'
  };

  // 10. Audit Missing Information
  const missingInformation: string[] = [];
  if (farmInput?.irrigationWaterSalinityECw === undefined) {
    missingInformation.push(
      language === 'ar'
        ? 'ملوحة مياه الري (ECw) غير مسجلة في ملف المزرعة ويجب قياسها بجهاز EC للتأكد التام من تحمل المحصول البديل.'
        : 'Irrigation water salinity (ECw) is not measured in your profile; an on-farm EC meter test is required to verify salinity tolerance.'
    );
  }
  if (farmInput?.soilPh === undefined) {
    missingInformation.push(
      language === 'ar'
        ? 'درجة حموضة التربة (pH) غير مسجلة معملياً (تم افتراض 7.8 قلوية).'
        : 'Soil pH is not verified by laboratory testing (assumed regional alkaline baseline 7.8).'
    );
  }

  // 11. Formulate Recommended Alternatives
  const recommendedAlternatives: Array<{
    cropId: CropId;
    nameEn: string;
    nameAr: string;
    season: string;
    rationaleEn: string;
    rationaleAr: string;
  }> = [];

  if (targetSeason === 'winter') {
    if (isTargetLegume) {
      recommendedAlternatives.push({
        cropId: 'faba_bean',
        nameEn: 'Faba Bean',
        nameAr: 'الفول البلدي',
        season: 'winter',
        rationaleEn: 'Matches the winter cycle, fixes +55 kg N/ha biological nitrogen, and consumes low water (~340 mm).',
        rationaleAr: 'يتوافق مع العروة الشتوية، ويثبت +55 كجم نيتروجين/هكتار، ويوفر في استهلاك المياه (~340 ملم).'
      });
      recommendedAlternatives.push({
        cropId: 'lentil',
        nameEn: 'Lentil',
        nameAr: 'العدس',
        season: 'winter',
        rationaleEn: 'Winter legume with minimal water footprint (~290 mm) and high drought resilience.',
        rationaleAr: 'بقولي شتوي باستهلاك مائي منخفض جداً (~290 ملم) ومقاومة عالية للجفاف.'
      });
    }
    recommendedAlternatives.push({
      cropId: 'barley',
      nameEn: 'Barley',
      nameAr: 'الشعير',
      season: 'winter',
      rationaleEn: 'Winter cereal with extreme salinity tolerance (up to 8.0 dS/m) and early maturity.',
      rationaleAr: 'حبوب شتوية ذات تحمل فائق للملوحة (حتى 8.0 ديسيمنز/م) ونضج مبكر.'
    });
  } else {
    // Summer target
    recommendedAlternatives.push({
      cropId: 'sunflower',
      nameEn: 'Sunflower',
      nameAr: 'دوار الشمس',
      season: 'summer',
      rationaleEn: 'Summer high-value oilseed with deep taproots and moderate heat endurance.',
      rationaleAr: 'محصول زيتي صيفي ذو جذور وتدية عميقة وتحمل ممتاز لحرارة الصيف.'
    });
    recommendedAlternatives.push({
      cropId: 'millet',
      nameEn: 'Pearl Millet',
      nameAr: 'دخن اللؤلؤ',
      season: 'summer',
      rationaleEn: 'Ultra-hardy C4 summer grain enduring extreme temperatures up to 44°C with low water demand.',
      rationaleAr: 'محصول حبوب وعلف صيفي C4 يتحمل الحرارة الشديدة حتى 44°م مع ترشيد فائق للري.'
    });
    recommendedAlternatives.push({
      cropId: 'sorghum',
      nameEn: 'Grain Sorghum',
      nameAr: 'الذرة الرفيعة',
      season: 'summer',
      rationaleEn: 'Summer grain crop with higher heat and drought tolerance than corn/maize.',
      rationaleAr: 'محصول حبوب صيفي يتحمل الحرارة والجفاف بدرجة أعلى من الذرة الشامية.'
    });
  }

  // 12. Determine Final Verdict
  let isFeasible = true;
  let feasibilityVerdict: 'infeasible' | 'conditionally_feasible' | 'feasible' = 'feasible';

  if (!seasonsMatch || salinityExceeded) {
    isFeasible = false;
    feasibilityVerdict = 'infeasible';
  } else if (monocultureRisk || deltaWater > 150 || harvestOverlapRisk) {
    isFeasible = false;
    feasibilityVerdict = 'conditionally_feasible';
  }

  const verdictSummaryEn = feasibilityVerdict === 'infeasible'
    ? `Agronomically Infeasible: ${resolvedReplacementCrop.nameEn} cannot directly replace ${resolvedTargetCrop.nameEn} in this rotation due to ${
        !seasonsMatch 
          ? `a severe growing season conflict (${resolvedTargetCrop.nameEn} is a ${targetSeason} crop, while ${resolvedReplacementCrop.nameEn} is a ${replacementSeason} crop)`
          : `salinity stress exceeding biological limits (${soilECe} dS/m vs threshold ${replacementMaxECe} dS/m)`
      }.`
    : feasibilityVerdict === 'conditionally_feasible'
    ? `Conditionally Feasible with Significant Trade-offs: Replacing ${resolvedTargetCrop.nameEn} with ${resolvedReplacementCrop.nameEn} requires substantial management adjustments (additional +${deltaWater} mm irrigation, loss of biological nitrogen credit, and adjusted fertilizer rates for subsequent crops).`
    : `Agronomically Feasible: ${resolvedReplacementCrop.nameEn} successfully matches the ${targetSeason} growing window, soil parameters, and water budgeting of ${resolvedTargetCrop.nameEn}.`;

  const verdictSummaryAr = feasibilityVerdict === 'infeasible'
    ? `غير مجدٍ زراعياً: لا يمكن استبدال ${resolvedTargetCrop.nameAr} بـ ${resolvedReplacementCrop.nameAr} في هذه الدورة بسبب ${
        !seasonsMatch
          ? `تعارض العروة الموسمية (${resolvedTargetCrop.nameAr} محصول ${targetSeason === 'winter' ? 'شتوي' : 'صيفي'} بينما ${resolvedReplacementCrop.nameAr} محصول ${replacementSeason === 'summer' ? 'صيفي' : 'شتوي'})`
          : `تجاوز ملوحة التربة للحد البيولوجي الآمن للمحصول (${soilECe} ديسيمنز مقابل حد أقصى ${replacementMaxECe} ديسيمنز)`
      }.`
    : feasibilityVerdict === 'conditionally_feasible'
    ? `ممكن بشروط وتعديلات مشددة: استبدال ${resolvedTargetCrop.nameAr} بـ ${resolvedReplacementCrop.nameAr} يتطلب توفير مقننات ري إضافية (+${deltaWater} ملم)، وتعويض رصيد النيتروجين الحيوي المفقود.`
    : `مجدٍ ومتوافق زراعياً: يتوافق ${resolvedReplacementCrop.nameAr} تماماً مع العروة الموسمية (${targetSeason === 'winter' ? 'الشتوية' : 'الصيفية'})، وخصائص التربة والميزانية المائية.`;

  // Retrieve relevant RAG citations
  const relevantCitations = retrieveScientificKnowledge({
    cropIds: [resolvedTargetCrop.id, resolvedReplacementCrop.id],
    topics: ['crop_substitution', 'cereal_legume_rotation', 'fao56'],
    limit: 3
  });

  return {
    isFeasible,
    feasibilityVerdict,
    verdictSummaryEn,
    verdictSummaryAr,
    targetCrop: resolvedTargetCrop,
    replacementCrop: resolvedReplacementCrop,
    stepIndex: resolvedStepIndex,
    planTitleEn,
    planTitleAr,
    seasonality,
    timeline,
    waterBudget,
    salinityTolerance,
    nitrogenAndSoilHealth,
    subsequentCropImpact,
    missingInformation,
    recommendedAlternatives,
    relevantCitations
  };
}

/**
 * Evaluates a side-by-side comparison between two crops for farm-specific conditions.
 */
export function evaluateCropComparison(params: {
  cropAIdentifier: string;
  cropBIdentifier: string;
  farmInput?: Partial<FarmAssessmentInput>;
  climateData?: Partial<NasaPowerClimateData>;
  language?: 'ar' | 'en';
}) {
  const cropA = resolveCropFromIdentifier(params.cropAIdentifier) || CROPS_DATABASE.wheat;
  const cropB = resolveCropFromIdentifier(params.cropBIdentifier) || CROPS_DATABASE.barley;
  const soilECe = params.farmInput?.soilSalinityEC ?? 1.4;
  const waterECw = params.farmInput?.irrigationWaterSalinityECw;

  const waterDelta = cropA.waterRequirementMm - cropB.waterRequirementMm;
  const salinityAdvantage = cropB.salinityToleranceECe > cropA.salinityToleranceECe ? cropB : cropA;

  return {
    cropA,
    cropB,
    waterComparison: {
      cropAWater: cropA.waterRequirementMm,
      cropBWater: cropB.waterRequirementMm,
      delta: Math.abs(waterDelta),
      thriftyCrop: waterDelta > 0 ? cropB : cropA,
    },
    salinityComparison: {
      cropAMaxECe: cropA.salinityToleranceECe,
      cropBMaxECe: cropB.salinityToleranceECe,
      farmSoilECe: soilECe,
      farmWaterECw: waterECw,
      moreTolerantCrop: salinityAdvantage
    },
    nitrogenComparison: {
      cropANitrogen: cropA.nitrogenFixationKgPerHa,
      cropBNitrogen: cropB.nitrogenFixationKgPerHa
    },
    temperatureComparison: {
      cropAMaxTemp: cropA.maxToleratedTempC,
      cropBMaxTemp: cropB.maxToleratedTempC
    }
  };
}

/**
 * Audits what information is missing before confirming an agronomic recommendation.
 */
export function auditMissingInformation(params: {
  farmInput?: Partial<FarmAssessmentInput>;
  soilData?: Partial<SoilData>;
  plan?: RotationPlan | null;
  language?: 'ar' | 'en';
}) {
  const { farmInput, soilData, language: _language = 'en' } = params;
  const items: Array<{ category: string; descriptionEn: string; descriptionAr: string; priority: 'high' | 'medium' | 'low' }> = [];

  // 1. Irrigation Water Salinity (ECw)
  if (farmInput?.irrigationWaterSalinityECw === undefined || farmInput?.irrigationWaterSalinityECw === null) {
    items.push({
      category: 'water_salinity',
      descriptionEn: 'Irrigation water salinity (ECw) is not measured in your farm profile. Without an on-farm EC meter or lab test, exact leaching fractions and salinity risk thresholds cannot be confirmed.',
      descriptionAr: 'ملوحة مياه الري (ECw) غير مسجلة في ملف مزرعتك. بدون قياس بجهاز EC أو تحليل معملي لمياه البئر/الترعة، لا يمكن تأكيد معاملات الغسيل أو أمان المحاصيل الحساسة.',
      priority: 'high'
    });
  }

  // 2. Soil pH Laboratory Measurement
  if (!soilData || (soilData.source as any) !== 'laboratory') {
    items.push({
      category: 'soil_ph',
      descriptionEn: 'Soil pH is based on regional satellite estimates rather than a certified laboratory soil test.',
      descriptionAr: 'درجة حموضة التربة (pH) مبنية على تقديرات إقليمية وليست نتيجة تحليل معملي معتمد لعينات التربة.',
      priority: 'medium'
    });
  }

  // 3. Local Disease Pressure
  items.push({
    category: 'phytosanitary_status',
    descriptionEn: 'Local pest and foliar disease history for this specific parcel is unverified; periodic field scouting is required.',
    descriptionAr: 'السجل الوبائي للآفات وأمراض الأوراق في هذه القطعة بالتحديد غير موثق ميدانياً؛ يتطلب الأمر كشفاً دورياً.',
    priority: 'low'
  });

  return items;
}

/**
 * Resolves a crop entity from arbitrary identifier (crop ID, common English name, Arabic name, partial alias).
 */
export function resolveCropFromIdentifier(identifier: string): Crop | null {
  if (!identifier) return null;
  const raw = identifier.trim().toLowerCase();

  // 1. Exact ID match
  if (CROPS_DATABASE[raw as CropId]) {
    return CROPS_DATABASE[raw as CropId];
  }

  // 2. Direct name map matches (e.g. 'wheat', 'chickpea', 'maize', 'القمح', 'الحمص', 'الذرة')
  for (const [id, names] of Object.entries(CROP_NAMES_MAP)) {
    if (raw === id.toLowerCase() || raw === names.en.toLowerCase() || raw === names.ar) {
      return CROPS_DATABASE[id as CropId];
    }
  }

  // 3. Common agricultural aliases in Arabic and English
  const aliases: Record<string, CropId> = {
    // English aliases
    'corn': 'maize',
    'sweetcorn': 'maize',
    'field corn': 'maize',
    'garbanzo': 'chickpea',
    'garbanzo bean': 'chickpea',
    'gram': 'chickpea',
    'bengal gram': 'chickpea',
    'bread wheat': 'wheat',
    'durum': 'wheat',
    'durum wheat': 'wheat',
    'faba': 'faba_bean',
    'broad bean': 'faba_bean',
    'horse bean': 'faba_bean',
    'clover': 'berseem',
    'egyptian clover': 'berseem',
    'peanut': 'groundnut',
    'peanuts': 'groundnut',
    'pearl millet': 'millet',
    'bajra': 'millet',
    'milo': 'sorghum',
    'grain sorghum': 'sorghum',
    'rapeseed': 'canola',
    'sesame seed': 'sesame',
    'paddy': 'rice',
    'paddy rice': 'rice',

    // Arabic aliases (including Egyptian colloquial forms)
    'حمص': 'chickpea',
    'الحمص': 'chickpea',
    'حمص الشام': 'chickpea',
    'ذرة': 'maize',
    'الذرة': 'maize',
    'ذرة شامي': 'maize',
    'ذرة شامية': 'maize',
    'الذرة الشامية': 'maize',
    'ذرة رفيعة': 'sorghum',
    'الذرة الرفيعة': 'sorghum',
    'ذرة عويجة': 'sorghum',
    'دخن': 'millet',
    'الدخن': 'millet',
    'دخن اللؤلؤ': 'millet',
    'قمح': 'wheat',
    'القمح': 'wheat',
    'غلة': 'wheat',
    'الغلة': 'wheat',
    'برسيم': 'berseem',
    'البرسيم': 'berseem',
    'برسيم مصري': 'berseem',
    'فول': 'faba_bean',
    'الفول': 'faba_bean',
    'فول بلدي': 'faba_bean',
    'فول سوداني': 'groundnut',
    'سوداني': 'groundnut',
    'فول صويا': 'soybean',
    'صويا': 'soybean',
    'سمسم': 'sesame',
    'السمسم': 'sesame',
    'شعير': 'barley',
    'الشعير': 'barley',
    'دوار شمس': 'sunflower',
    'عباد شمس': 'sunflower',
    'دوار الشمس': 'sunflower',
    'عباد الشمس': 'sunflower',
    'بصل': 'onion',
    'البصل': 'onion',
    'أرز': 'rice',
    'الأرز': 'rice',
    'بطاطس': 'potato',
    'البطاطس': 'potato',
    'طماطم': 'tomato',
    'الطماطم': 'tomato',
    'قوطة': 'tomato',
    'كانولا': 'canola',
    'سلجم': 'canola',
    'عدس': 'lentil',
    'العدس': 'lentil',
    'لوبيا': 'cowpea',
    'اللوبيا': 'cowpea',
    'فاصوليا': 'common_bean',
    'الفاصوليا': 'common_bean',
    'ترمس': 'lupin',
    'الترمس': 'lupin',
    'كتان': 'flax',
    'الكتان': 'flax'
  };

  if (aliases[raw]) {
    return CROPS_DATABASE[aliases[raw]];
  }

  // 4. Substring check in database
  for (const crop of Object.values(CROPS_DATABASE)) {
    if (raw.includes(crop.id.toLowerCase()) || 
        crop.nameEn.toLowerCase().includes(raw) || 
        crop.nameAr.includes(raw) ||
        raw.includes(crop.nameAr)) {
      return crop;
    }
  }

  return null;
}
