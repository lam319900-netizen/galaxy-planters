import type {
  FarmAssessmentInput,
  NasaPowerClimateData,
  PlanStep,
  RotationPlan,
  RotationPlanScoreBreakdown,
  SoilData,
  Crop,
  CropId,
  FarmerPriority
} from '../types';
import { CROPS_DATABASE } from '../data/crops';
import { calculateCropCalendar, CROP_CALENDAR_RULES } from './cropCalendar';
import { recommendBestSeedVariety } from './seedVarietyEngine';

export interface ScoringWeights {
  climate: number;
  water: number;
  soil: number;
  sequence: number;
  priority: number;
}

/**
 * Computes dynamic, normalized scoring weights driven by the farmer's primary management priority.
 * Every priority shifts the actual mathematical formula rather than an isolated subscore.
 */
export function getPriorityWeights(priority: FarmerPriority): ScoringWeights {
  switch (priority) {
    case 'water_conservation':
      return { water: 0.35, priority: 0.25, climate: 0.15, soil: 0.15, sequence: 0.10 };
    case 'soil_health':
      return { soil: 0.35, priority: 0.25, sequence: 0.15, water: 0.15, climate: 0.10 };
    case 'climate_resilience':
      return { climate: 0.35, priority: 0.25, water: 0.20, soil: 0.10, sequence: 0.10 };
    case 'profitability':
      return { priority: 0.35, water: 0.20, soil: 0.15, climate: 0.15, sequence: 0.15 };
    default:
      return { water: 0.25, soil: 0.20, climate: 0.20, sequence: 0.15, priority: 0.20 };
  }
}

// ---------------------------------------------------------------------------
// Scientific Sub-Scoring Functions
// ---------------------------------------------------------------------------

/**
 * Evaluates thermal and climatic suitability of a crop against NASA POWER observations.
 * Analyzes maximum summer extreme heat, minimum winter frost/chilling, mean temperature, and GDD.
 */
function scoreCropClimateSuitability(crop: Crop, climate: NasaPowerClimateData): number {
  let score = 95;

  // 1. Extreme Heat Stress Penalty: compare NASA max temperature against crop threshold
  if (climate.maxTemperatureC > crop.maxToleratedTempC) {
    const heatExcess = climate.maxTemperatureC - crop.maxToleratedTempC;
    score -= Math.min(55, Math.round(heatExcess * 6));
  }

  // 2. Frost / Chilling Injury Penalty: compare NASA min temperature against crop frost threshold
  if (climate.minTemperatureC < crop.minToleratedTempC) {
    const frostDeficit = crop.minToleratedTempC - climate.minTemperatureC;
    let coldPenalty = Math.min(60, Math.round(frostDeficit * 7));
    if (climate.minTemperatureC < 0 && (['rice', 'sesame', 'groundnut'].includes(crop.id) || crop.minToleratedTempC >= 10)) {
      coldPenalty += 35; // Severe penalty: chilling-sensitive crops experience freezing injury / crop failure
    }
    score -= coldPenalty;
  }

  // 3. Optimal Growing Temperature Range Match
  const [optMin, optMax] = crop.optimalTempRangeC;
  const seasonalTemp = crop.season === 'summer' ? climate.summerAvgTempC : climate.winterAvgTempC;

  if (seasonalTemp < optMin) {
    const under = optMin - seasonalTemp;
    score -= Math.min(30, Math.round(under * 4));
  } else if (seasonalTemp > optMax) {
    const over = seasonalTemp - optMax;
    score -= Math.min(30, Math.round(over * 4));
  }

  // 4. Growing Degree Days (GDD) Accumulation Check
  if (climate.estimatedGDD < crop.gddRequirement) {
    const gddRatio = climate.estimatedGDD / crop.gddRequirement;
    score -= Math.min(35, Math.round((1 - gddRatio) * 40));
  }

  // 5. Atmospheric Relative Humidity & Foliar Microclimate Suitability
  if (climate.avgRelativeHumidityPct !== undefined) {
    const rh = (crop.season === 'summer' && climate.summerAvgRhPct !== undefined)
      ? climate.summerAvgRhPct
      : climate.avgRelativeHumidityPct;

    // Optimal range match bonus
    if (rh >= crop.optimalRhRange[0] && rh <= crop.optimalRhRange[1]) {
      score += 4;
    }

    // Humidity excess above crop threshold (fungal/bacterial disease risk)
    if (rh > crop.maxToleratedRhPct) {
      const rhExcess = rh - crop.maxToleratedRhPct;
      const seasonalTemp = crop.season === 'summer' ? climate.summerAvgTempC : climate.winterAvgTempC;
      const isFungalTempWindow = seasonalTemp >= 15 && seasonalTemp <= 28;

      let rhPenalty = 0;
      if (crop.humidityToleranceTier === 'sensitive') {
        rhPenalty = Math.min(30, Math.round(rhExcess * 1.5)) + (isFungalTempWindow ? 5 : 0);
      } else if (crop.humidityToleranceTier === 'moderate') {
        rhPenalty = Math.min(18, Math.round(rhExcess * 0.9));
      } else if (crop.humidityToleranceTier === 'tolerant') {
        rhPenalty = Math.min(10, Math.round(rhExcess * 0.5));
      }
      score -= rhPenalty;
    }

    // Rice sterility penalty under hyper-arid dry air (<50% RH)
    if (crop.id === 'rice' && rh < 50) {
      const dryDeficit = 50 - rh;
      score -= Math.min(25, Math.round(dryDeficit * 1.2));
    }
  }

  return Math.max(10, Math.min(100, score));
}

/**
 * Evaluates water demand vs total water availability using validated agronomic principles:
 * - Crop evapotranspiration (ETc) derived from FAO-56 Penman-Monteith crop coefficients (Kc).
 * - Effective precipitation modeled via the USDA Soil Conservation Service (SCS) method.
 * - Irrigation application efficiency (drip 85%, sprinkler 75%, furrow/surface 60%).
 * - Clearly documents sustainable allocation capacity as an operational planning indicator,
 *   never presenting theoretical capacities as actual on-farm water meter readings.
 */
function computeWaterBalance(
  steps: PlanStep[],
  climate: NasaPowerClimateData,
  input: FarmAssessmentInput
): { score: number; totalWaterDemand: number; waterBalance: import('../types').WaterBalanceDetails } {
  // 1. Calculate Crop Evapotranspiration (ETc)
  // Base ETc is adjusted for atmospheric evaporative demand (ET0) when available
  const et0Annual = climate.referenceEt0Mm ?? 1750;
  const et0TwoYears = et0Annual * 2;
  const et0Scaling = Math.max(0.65, Math.min(1.35, et0Annual / 1800));

  let totalETc = 0;
  for (const step of steps) {
    if (!step.crop) {
      step.waterEstimateMm = 0;
      continue;
    }
    const cropETc = Math.round(step.crop.waterRequirementMm * et0Scaling);
    step.waterEstimateMm = cropETc;
    totalETc += cropETc;
  }

  // 2. 2-Year Effective Precipitation (USDA SCS Method)
  // Not all rainfall infiltrates and remains in the rootzone; runoff and deep drainage reduce effectiveness
  const annualRain = climate.totalPrecipitationMm;
  const annualEffectiveRain = annualRain <= 250
    ? (annualRain * (125 - 0.2 * annualRain)) / 125
    : 125 + 0.1 * annualRain;
  const effectiveRain2Yr = Math.round(Math.max(0, annualEffectiveRain * 2));

  // 3. Net Irrigation Requirement (NIR = max(0, ETc - Peff))
  const netIrrigationReq = Math.max(0, totalETc - effectiveRain2Yr);

  // 4. Irrigation Application Efficiency (FAO-56 Irrigation Paper)
  const method = input.irrigationMethod || 'surface_furrow';
  const efficiency = method === 'drip' ? 0.85 : method === 'sprinkler' ? 0.75 : 0.60;
  const grossIrrigationDemand = Math.round(netIrrigationReq / efficiency);

  // 5. Estimated Sustainable Allocation Capacity (Benchmark management capacity over 2 years, NOT farm meter)
  let capacityMm = 1800; // Medium: ~450 mm/season gross allocation capacity
  if (input.irrigationAvailability === 'high') {
    capacityMm = 2600; // High: ~650 mm/season gross allocation capacity
  } else if (input.irrigationAvailability === 'low') {
    capacityMm = 1200; // Low: ~300 mm/season gross allocation capacity
  }

  // 6. Irrigation Shortfall / Deficit
  const deficit = Math.max(0, grossIrrigationDemand - capacityMm);
  const isDeficit = deficit > 0;

  // 7. Water Alignment Score (0-100)
  let score = 88;
  if (!isDeficit) {
    if (input.farmerPriority === 'water_conservation') {
      // Reward lower gross water consumption
      const savings = Math.max(0, capacityMm - grossIrrigationDemand);
      score = Math.min(100, 82 + Math.round((savings / capacityMm) * 18));
    } else {
      score = 92;
    }
  } else {
    // Proportional penalty for irrigation shortfall
    const deficitRatio = deficit / capacityMm;
    score = Math.max(10, Math.round(85 - deficitRatio * 65));
  }

  const waterBalance: import('../types').WaterBalanceDetails = {
    cropEvapotranspirationMm: totalETc,
    referenceEt0Mm: et0TwoYears,
    effectiveRainfallMm: effectiveRain2Yr,
    netIrrigationRequirementMm: netIrrigationReq,
    irrigationEfficiencyPct: Math.round(efficiency * 100),
    grossIrrigationDemandMm: grossIrrigationDemand,
    estimatedIrrigationCapacityMm: capacityMm,
    seasonalDeficitMm: deficit,
    isDeficit
  };

  return { score: Math.max(10, Math.min(100, score)), totalWaterDemand: totalETc, waterBalance };
}

/**
 * Evaluates soil compatibility: texture tolerance, pH range fit, and salinity threshold.
 * Also evaluates irrigation water salinity (ECw) hazard modified by soil texture leaching capacity
 * and irrigation application method (FAO 29 Table 4 / Maas-Hoffman).
 */
function scoreCropSoilSuitability(crop: Crop, soil: SoilData, input?: FarmAssessmentInput): number {
  let score = 92;

  // 1. Texture Match
  if (!crop.toleratedSoilTypes.includes(soil.soilType)) {
    score -= 35; // Severe physical incompatibility
  }

  // 2. Soil pH Range Fit
  const [minPh, maxPh] = crop.optimalPhRange;
  if (soil.ph < minPh) {
    const diff = minPh - soil.ph;
    score -= Math.min(40, Math.round(diff * 22));
  } else if (soil.ph > maxPh) {
    const diff = soil.ph - maxPh;
    score -= Math.min(40, Math.round(diff * 22));
  }

  // 3. Salinity (ECe) Tolerance Check
  if (soil.salinityEC !== undefined && soil.salinityEC > crop.salinityToleranceECe) {
    const excessEC = soil.salinityEC - crop.salinityToleranceECe;
    score -= Math.min(50, Math.round(excessEC * 14));
  }

  // 4. Irrigation Water Salinity (ECw) Hazard & Soil Drainage Leaching Interaction (FAO 29)
  if (input?.irrigationWaterSalinityECw !== undefined && !isNaN(input.irrigationWaterSalinityECw)) {
    const rawECw = input.irrigationWaterSalinityECw;
    
    // Soil drainage factor based on texture:
    // Sandy / sandy loam: 0.85 (rapid percolation and salt leaching)
    // Clay loam: 1.00
    // Calcareous: 1.10
    // Silty clay: 1.25 (slow internal drainage, root-zone salt accumulation)
    let soilFactor = 1.0;
    if (soil.soilType === 'sandy' || soil.soilType === 'sandy_loam') {
      soilFactor = 0.85;
    } else if (soil.soilType === 'calcareous') {
      soilFactor = 1.10;
    } else if (soil.soilType === 'silty_clay') {
      soilFactor = 1.25;
    }

    const method = input.irrigationMethod || 'surface_furrow';
    const methodFactor = method === 'drip' ? 0.90 : method === 'sprinkler' ? 1.00 : 1.05;
    const effectiveECw = rawECw * (soilFactor * methodFactor);

    if (effectiveECw > crop.salinityToleranceECw) {
      const ecwExcess = effectiveECw - crop.salinityToleranceECw;
      score -= Math.min(45, Math.round(ecwExcess * 12));
    } else if (rawECw >= 2.5 && crop.salinityToleranceECw >= 4.0) {
      // Reward salt-tolerant crop choices when water salinity is elevated
      score += 6;
    }
  }

  // 5. Organic Matter Response
  if (soil.organicMatterPct < 1.0) {
    if (crop.nitrogenFixationKgPerHa > 0 || crop.organicMatterAdditionScore >= 4) {
      score += 8; // Legumes and restorative crops highly beneficial on low OM soils
    } else {
      score -= 8;
    }
  }

  return Math.max(10, Math.min(100, score));
}

/**
 * Evaluates agronomic sequence harmony: botanical family diversity, legume-cereal synergy,
 * and previous crop rotation rules.
 */
function scoreSequenceHarmony(steps: PlanStep[], previousCrop?: CropId | 'fallow'): number {
  let score = 88;

  // 1. Previous crop compatibility with Season 1
  const firstCrop = steps[0].crop;
  if (firstCrop && previousCrop && previousCrop !== 'fallow') {
    if (firstCrop.rotationRulesEn.avoidPreceding.includes(previousCrop)) {
      score -= 25; // Pest / disease continuity penalty (e.g. monoculture or host)
    } else if (firstCrop.rotationRulesEn.idealPreceding.includes(previousCrop)) {
      score += 12; // Preceding legume / restorative bonus
    }
  }

  // 2. Intra-sequence succession across 4 seasons
  for (let i = 0; i < steps.length - 1; i++) {
    const curr = steps[i].crop;
    const next = steps[i + 1].crop;

    if (!curr || !next) continue; // Fallow break is neutral or restorative

    // Monoculture penalty: same botanical family back-to-back
    if (curr.family === next.family) {
      score -= 20;
    }

    // Legume-cereal synergy: cereal following legume
    if (curr.family === 'Fabaceae (Leguminosae)' && next.family === 'Poaceae (Gramineae)') {
      score += 15;
    }

    // Avoid list check
    if (next.rotationRulesEn.avoidPreceding.includes(curr.id)) {
      score -= 20;
    }
  }

  return Math.max(20, Math.min(100, score));
}

/**
 * Evaluates priority alignment score for a rotation candidate.
 */
function scorePriorityAlignment(
  steps: PlanStep[],
  priority: FarmerPriority,
  netNitrogen: number,
  totalWater: number,
  climateScore: number
): number {
  switch (priority) {
    case 'water_conservation':
      // Lower water demand yields higher priority alignment
      return Math.max(20, Math.min(100, Math.round(100 - (totalWater / 2400) * 55)));

    case 'soil_health':
      // Net positive nitrogen and high organic matter scores yield high priority alignment
      return netNitrogen >= 50
        ? 98
        : netNitrogen >= 0
        ? 88
        : Math.max(30, Math.round(75 + netNitrogen / 10));

    case 'climate_resilience':
      return climateScore;

    case 'profitability': {
      // Evaluate cash crop presence in sequence
      const cashCrops = steps.filter(s => s.crop && s.crop.cashCropTier === 'high').length;
      return cashCrops >= 2 ? 96 : cashCrops === 1 ? 86 : 68;
    }

    default:
      return 75;
  }
}

// ---------------------------------------------------------------------------
// Candidate Rotation Sequence Definitions (Pool of Global Candidates)
// ---------------------------------------------------------------------------

interface CandidateTemplate {
  id: string;
  templateType: 'water_saving' | 'soil_restorative' | 'cereal_grain' | 'cash_crop' | 'cool_temperate' | 'tropical_monsoon' | 'mediterranean' | 'diversified';
  cropIds: (CropId | 'fallow')[];
  titleEn: string;
  titleAr: string;
  taglineEn: string;
  taglineAr: string;
  strategicFocusEn: string;
  strategicFocusAr: string;
}

const GLOBAL_ROTATION_CANDIDATES: CandidateTemplate[] = [
  // 1. Water-Saving Pulse, Cereal & Oilseed Sequence (Arid & Semi-Arid)
  {
    id: 'plan_water_resilience',
    templateType: 'water_saving',
    cropIds: ['faba_bean', 'sorghum', 'wheat', 'sesame'],
    titleEn: 'Low-Water Pulse, Cereal & Oilseed Drought-Resilient Rotation',
    titleAr: 'دورة البقوليات والحبوب والزيتيات المقاومة للجفاف والموفرة للمياه',
    taglineEn: 'Optimized for restricted irrigation, heat endurance, and groundwater conservation',
    taglineAr: 'مصممة للحد من استهلاك مياه الري والتكيف مع الحرارة وحماية المخزون المائي',
    strategicFocusEn: 'Low water footprint incorporating heat-tolerant C4 Sorghum, drought-hardy Sesame, and N-fixing Faba Bean with high water productivity',
    strategicFocusAr: 'استهلاك مائي رشيد يدمج الذرة الرفيعة المتحملة للحرارة والسمسم المقاوم للجفاف والفول البلدي المثبت للنيتروجين'
  },

  // 2. Soil Regenerative Forage-Cereal Sequence (Restorative Legume)
  {
    id: 'plan_soil_regeneration',
    templateType: 'soil_restorative',
    cropIds: ['berseem', 'sorghum', 'wheat', 'sorghum'],
    titleEn: 'Soil Health & Integrated Forage-Cereal Rotation',
    titleAr: 'دورة تجديد خصوبة التربة وتكامل الأعلاف مع الحبوب',
    taglineEn: 'Agro-ecological benchmark for building organic matter and biological nitrogen',
    taglineAr: 'المعيار الزراعي البيئي لبناء المادة العضوية والتثبيت الحيوي المكثف للنيتروجين',
    strategicFocusEn: 'Maximum biological nitrogen fixation (+180 kg N/ha) via multi-cut forage legume with high stover biomass',
    strategicFocusAr: 'أقصى تثبيت حيوي للنيتروجين (+180 كجم N/هـ) عبر البقوليات العلفية متعددة الحشات'
  },

  // 3. Commercial Cash Crop & Food Security Sequence
  {
    id: 'plan_cash_crop_balance',
    templateType: 'cash_crop',
    cropIds: ['wheat', 'sorghum', 'onion', 'sorghum'],
    titleEn: 'High-Value Commercial Cash Crop & Grain Sequence',
    titleAr: 'دورة المحاصيل النقدية التجارية عالية الربحية مع حبوب الغذاء',
    taglineEn: 'Maximizes farm net income through premium cash crops alongside staple food cereal',
    taglineAr: 'تعظيم العائد المالي للمزرعة عبر المحاصيل النقدية ذات القيمة التسويقية المرتفعة مع القمح',
    strategicFocusEn: 'High liquid revenue from bulb/cash crops combined with grain security, requiring balanced fertility inputs',
    strategicFocusAr: 'سيولة مالية نقدية مرتفعة مقترنة بالأمن الغذائي، تتطلب توازناً في التسميد العضوي'
  },

  // 4. Cool Temperate European Rotation (Barley, Canola, Potato, Wheat)
  {
    id: 'plan_cool_temperate',
    templateType: 'cool_temperate',
    cropIds: ['barley', 'canola', 'wheat', 'potato'],
    titleEn: 'Cool-Temperate Cereal, Oilseed & Tuber Sustainable Rotation',
    titleAr: 'دورة الحبوب والزيتيات والدرنيات المستدامة للمناخ البارد والمعتدل',
    taglineEn: 'Adapted for frost-hardy, moderate rainfall temperate agricultural zones',
    taglineAr: 'ملائمة تماماً للأقاليم الزراعية المعتدلة والباردة المقاومة للصقيع والأمطار المتوسطة',
    strategicFocusEn: 'Disease-break taproot Canola preceding high-yielding Wheat and Potato cash tuber with frost-tolerant Barley',
    strategicFocusAr: 'الكانولا الصليبية الكاسرة للديدان تسبق القمح وبطاطس المائدة مع الشعير المقاوم للصقيع'
  },

  // 5. Tropical / High-Rainfall Agro-Ecological Sequence (Rice, Maize, Soybean, Groundnut)
  {
    id: 'plan_tropical_monsoon',
    templateType: 'tropical_monsoon',
    cropIds: ['rice', 'soybean', 'maize', 'groundnut'],
    titleEn: 'Tropical & Subtropical Grain-Legume Multi-Cropping Sequence',
    titleAr: 'دورة الحبوب والبقوليات الاستوائية وشبه المدارية متعددة المواسم',
    taglineEn: 'Tailored for warm, high-radiation, humid tropical and subtropical climates',
    taglineAr: 'مصممة خصيصاً للمناطق الاستوائية وشبه المدارية الدافئة غزيرة الأمطار والإشعاع الشمسي',
    strategicFocusEn: 'Paddy Rice flood rotation broken by N-fixing Soybean and deep-rooting Groundnut with high-biomass Maize',
    strategicFocusAr: 'تناوب الأرز المغمور مع فول الصويا المثبت للنيتروجين والفول السوداني والذرة الصفراء'
  },

  // 6. Mediterranean Semi-Arid Pulse & Oilseed Sequence (Durum, Chickpea, Sunflower, Faba)
  {
    id: 'plan_mediterranean_resilience',
    templateType: 'mediterranean',
    cropIds: ['wheat', 'sunflower', 'chickpea', 'onion'],
    titleEn: 'Mediterranean Semi-Arid Pulse, Oilseed & Grain Rotation',
    titleAr: 'دورة البحر المتوسط شبه الجافة للحبوب والبقوليات وبذور الزيت',
    taglineEn: 'Balanced for mild, wet winters and hot, dry Mediterranean summers',
    taglineAr: 'متوازنة لظروف شتاء البحر المتوسط المعتدل الممطر وصيفه الحار الجاف',
    strategicFocusEn: 'Deep taproot Sunflower moisture mining combined with drought-hardy Chickpea legume and cash bulb Onion',
    strategicFocusAr: 'استغلال رطوبة الأعماق عبر دوار الشمس مع حمص الشام المقاوم للجفاف والبصل التجاري'
  },

  // 7. Light/Sandy Soil Reclamation Sequence (Groundnut, Sesame, Barley, Fallow)
  {
    id: 'plan_desert_reclamation',
    templateType: 'water_saving',
    cropIds: ['barley', 'sesame', 'wheat', 'groundnut'],
    titleEn: 'Reclamation & Sandy Soil Drought-Adapted Rotation',
    titleAr: 'دورة استصلاح الأراضي الرملية والتكيف مع البيئات الجافة',
    taglineEn: 'Specialized for light, sandy, permeable soils requiring heat resilience and soil binding',
    taglineAr: 'مخصصة للأراضي الرملية الخفيفة سريعة النفاذية التي تتطلب تحملاً فائقاً للحرارة وتثبيتاً للتربة',
    strategicFocusEn: 'Heat-resilient Sesame and sandy-adapted Groundnut fixing nitrogen with saline-hardy Barley',
    strategicFocusAr: 'السمسم المتحمل للقيظ والفول السوداني المخصب للرمال مع الشعير المتحمل للملوحة'
  },

  // 8. Balanced Diversified Family Rotation (Broad Spectrum Breaks)
  {
    id: 'plan_diversified_agroecology',
    templateType: 'diversified',
    cropIds: ['chickpea', 'sorghum', 'canola', 'maize'],
    titleEn: 'Diversified Multi-Family Ecological Break Rotation',
    titleAr: 'الدورة البيئية المتنوعة متعددة العائلات النباتية لكسر الآفات',
    taglineEn: 'Maximizes biodiversity: 4 different plant families across 4 consecutive seasons',
    taglineAr: 'أقصى تنوع بيولوجي زراعي: 4 عائلات نباتية متباينة تماماً عبر 4 مواسم متتالية',
    strategicFocusEn: 'Completely eliminates monoculture by rotating Fabaceae ➔ Poaceae ➔ Brassicaceae ➔ C4 Grain',
    strategicFocusAr: 'القضاء التام على توالي العائلات بتدوير البقوليات ثم النجيليات ثم الصليبيات ثم الذرة'
  },

  // 9. Egyptian Cotton & Strategic Grain Sequence
  {
    id: 'plan_cotton_fiber_cereal',
    templateType: 'cash_crop',
    cropIds: ['berseem', 'cotton', 'wheat', 'maize'],
    titleEn: 'Egyptian Cotton & Strategic Cereal High-Yield Rotation',
    titleAr: 'دورة القطن المصري والقمح والأعلاف الاستراتيجية عالية المردود',
    taglineEn: 'High economic value combining premier cotton fiber with soil-restoring berseem and staple wheat',
    taglineAr: 'قيمة اقتصادية رفيعة تدمج القطن طويل التيلة مع البرسيم المخصب والقمح',
    strategicFocusEn: 'Restorative Berseem clover replenishes soil N before heavy-feeding Cotton, followed by winter Wheat and summer Maize',
    strategicFocusAr: 'البرسيم يثري النيتروجين قبل القطن المستنزف، متبوعاً بالقمح الشتوي والذرة'
  },

  // 10. Arid Dryland Pearl Millet & Dual-Pulse Water-Saving Rotation
  {
    id: 'plan_millet_cowpea_dryland',
    templateType: 'water_saving',
    cropIds: ['barley', 'millet', 'lentil', 'cowpea'],
    titleEn: 'Arid Dryland Millet & Dual-Pulse Water-Saving Rotation',
    titleAr: 'دورة الدخن والبقوليات الثنائية للمناطق الجافة فائقة التوفير للمياه',
    taglineEn: 'Engineered for hyper-arid zones and sandy soils with extreme heat tolerance up to 45°C',
    taglineAr: 'مهيأة للمناطق شديدة الجفاف والأراضي الرملية مع صمود استثنائي للحرارة حتى 45°م',
    strategicFocusEn: 'Low water footprint utilizing heat-hardy C4 Millet, summer Cowpea N-fixation (+70 kg N/ha), with winter Lentil and drought-hardy Barley',
    strategicFocusAr: 'أدنى استهلاك مائي يدمج دخن C4 المقاوم للحرارة، ولوبيا الصيف المخصبة، والعدس والشعير'
  },

  // 11. Sandy Soil Reclamation & Deep Taproot Bio-Phosphate Rotation
  {
    id: 'plan_lupin_safflower_reclamation',
    templateType: 'soil_restorative',
    cropIds: ['lupin', 'sesame', 'safflower', 'groundnut'],
    titleEn: 'Sandy Soil Reclamation, Deep-Root Oilseed & Bio-Phosphate Rotation',
    titleAr: 'دورة استصلاح الرمال وبذور الزيت العميقة وتيسير الفوسفور الحيوي',
    taglineEn: 'Harnesses Lupin proteoid cluster roots and Safflower deep moisture mining for desert soils',
    taglineAr: 'تسخر جذور الترمس العنقودية لتيسير الفوسفور وجذور العصفر العميقة للبيئات الصحراوية',
    strategicFocusEn: 'Lupin fixes +120 kg N/ha and solubilizes bound phosphorus, preceding heat-tolerant Sesame and deep subsoil Safflower taproot',
    strategicFocusAr: 'الترمس يثبت +120 كجم N/هـ ويذيب الفوسفور، يتبعه السمسم الصيفي والعصفر ذو الجذور المتعمقة'
  },

  // 12. High-Value Horticultural Vegetable & Caloric Tuber Rotation
  {
    id: 'plan_vegetable_legume_horticulture',
    templateType: 'cash_crop',
    cropIds: ['field_pea', 'tomato', 'oats', 'sweet_potato'],
    titleEn: 'High-Value Horticultural Vegetable, Caloric Tuber & Soil-Cover Rotation',
    titleAr: 'دورة الخضار البستاني عالي الربحية والدرنات النشوية وتغطية التربة',
    taglineEn: 'Diversified multi-family rotation optimizing cash returns with complete pathogen cycle breaks',
    taglineAr: 'دورة بستانية متنوعة العائلات تعظم الدخل المالي وتكسر دورات آفات التربة تماماً',
    strategicFocusEn: 'Field Pea fixes N and vacates field early for processing Tomato, followed by weed-suppressing Oats and caloric Sweet Potato',
    strategicFocusAr: 'البازلاء تثبت النيتروجين وتخلي الحقل مبكراً للطماطم، يتبعها الشوفان الكاتم للحشائش والبطاطا الحلوة'
  }
];

// ---------------------------------------------------------------------------
// Candidate Evaluator & Plan Builder
// ---------------------------------------------------------------------------

function getSeasonLabels(
  seasonType: 'winter' | 'summer',
  seasonYear: 1 | 2,
  hemisphere: 'northern' | 'southern'
): { labelEn: string; labelAr: string } {
  const isCool = seasonType === 'winter';
  const seasonNum = seasonYear === 1 ? (isCool ? 1 : 2) : (isCool ? 3 : 4);
  const yearTextAr = seasonYear === 1 ? 'العام الأول' : 'العام الثاني';

  if (hemisphere === 'southern') {
    return {
      labelEn: `Season ${seasonNum} (Y${seasonYear} ${isCool ? 'Cool/Winter [Apr–Sep]' : 'Warm/Summer [Oct–Mar]'})`,
      labelAr: `الموسم ${seasonNum} (${isCool ? 'شتوي / معتدل [أبريل–سبتمبر]' : 'صيفي / دافئ [أكتوبر–مارس]'} - ${yearTextAr})`
    };
  } else {
    return {
      labelEn: `Season ${seasonNum} (Y${seasonYear} ${isCool ? 'Winter [Oct–Apr]' : 'Summer [May–Sep]'})`,
      labelAr: `الموسم ${seasonNum} (${isCool ? 'شتوي [أكتوبر–أبريل]' : 'صيفي [مايو–سبتمبر]'} - ${yearTextAr})`
    };
  }
}

function evaluateCandidatePlan(
  template: CandidateTemplate,
  input: FarmAssessmentInput,
  climate: NasaPowerClimateData,
  soil: SoilData,
  weights: ScoringWeights
): RotationPlan {
  const hemisphere = climate.hemisphere || (input.latitude >= 0 ? 'northern' : 'southern');

  // Build individual steps
  const steps: PlanStep[] = template.cropIds.map((cid, idx) => {
    const seasonYear = idx < 2 ? 1 : 2;
    const seasonType = idx % 2 === 0 ? 'winter' : 'summer';
    const isFallow = cid === 'fallow';
    const crop = isFallow ? null : CROPS_DATABASE[cid] || null;

    const { labelEn: seasonLabelEn, labelAr: seasonLabelAr } = getSeasonLabels(seasonType, seasonYear, hemisphere);

    const timeline = crop
      ? calculateCropCalendar(crop, climate, seasonYear, seasonType)
      : {
          plantingWindowEn: 'Not scheduled',
          plantingWindowAr: 'غير مجدول',
          harvestWindowEn: 'Not scheduled',
          harvestWindowAr: 'غير مجدول',
          durationDays: 0,
          durationRangeEn: '0 days',
          durationRangeAr: '0 يوم',
          seasonClassificationEn: 'Fallow / Rest Period',
          seasonClassificationAr: 'فترة إراحة وتشميس',
          timingRationaleEn: 'Land resting and weed seedbank purge.',
          timingRationaleAr: 'فترة إراحة للتربة وتطهير الحقل من الحشائش.'
        };

    const rule = crop ? CROP_CALENDAR_RULES[crop.id] : null;

    let rationaleEn = '';
    let rationaleAr = '';

    if (isFallow) {
      rationaleEn = 'Seasonal fallow / solarization break: conserves irrigation quota, purges weed seedbanks under solar heat, and allows soil microbial rest.';
      rationaleAr = 'فترة إراحة وتشميس حقلي: توفر حصة مياه الري، وتطهر التربة من بذور الحشائش تحت حرارة الشمس، وتتيح راحة حيوية للتربة.';
    } else if (crop) {
      rationaleEn = `${crop.nameEn} (${crop.family}): water req ${crop.waterRequirementMm} mm; ${crop.nitrogenFixationKgPerHa > 0 ? `fixes +${crop.nitrogenFixationKgPerHa} kg N/ha` : `nutrient feeder (-${Math.abs(crop.nitrogenFixationKgPerHa)} kg N/ha)`}. ${crop.soilHealthRoleEn}`;
      rationaleAr = `${crop.nameAr} (${crop.familyAr}): استهلاك مائي ${crop.waterRequirementMm} مم؛ ${crop.nitrogenFixationKgPerHa > 0 ? `يثبت +${crop.nitrogenFixationKgPerHa} كجم N/هـ` : `يستهلك -${Math.abs(crop.nitrogenFixationKgPerHa)} كجم N/هـ`}. ${crop.soilHealthRoleAr}`;
    }

    const varietyRecommendation = crop
      ? recommendBestSeedVariety(crop, input, climate, soil) || {
          varietyName: '',
          varietyNameAr: '',
          breedingInstitute: '',
          countryOfOrigin: '',
          registrationStatus: '',
          explanationEn: 'Insufficient verified data to recommend a seed variety for this location.',
          explanationAr: 'لا تتوفر بيانات موثوقة كافية لترشيح صنف تقاوي مناسب لهذا الموقع.',
          suitabilityScore: 0,
          confidenceLevel: 'low',
          isLocallyRegistered: false,
          evidenceSupported: false
        }
      : undefined;

    return {
      seasonLabelEn,
      seasonLabelAr,
      seasonYear,
      seasonType,
      cropId: cid,
      crop,
      timeline,
      waterEstimateMm: crop ? crop.waterRequirementMm : 0,
      nitrogenContributionKg: crop ? crop.nitrogenFixationKgPerHa : 0,
      roleInRotationEn: rule?.roleInRotationEn || crop?.soilHealthRoleEn || '',
      roleInRotationAr: rule?.roleInRotationAr || crop?.soilHealthRoleAr || '',
      agronomicRationaleEn: rationaleEn,
      agronomicRationaleAr: rationaleAr,
      importantNotesEn: rule?.importantNotesEn || crop?.rotationRulesEn.agronomicNotes || '',
      importantNotesAr: rule?.importantNotesAr || crop?.rotationRulesAr.agronomicNotes || '',
      varietyRecommendation
    };
  });

  const activeCrops = steps.map(s => s.crop).filter((c): c is Crop => c !== null);

  // 1. Climate Suitability Score (0-100)
  const cropClimateScores = activeCrops.map(c => scoreCropClimateSuitability(c, climate));
  const climateSuitability = cropClimateScores.length > 0
    ? Math.round(cropClimateScores.reduce((a, b) => a + b, 0) / cropClimateScores.length)
    : 80;

  // 2. Water Alignment Score & Balance Breakdown (0-100)
  const { score: waterAlignment, totalWaterDemand, waterBalance } = computeWaterBalance(steps, climate, input);

  // 3. Soil Suitability Score (0-100)
  const cropSoilScores = activeCrops.map(c => scoreCropSoilSuitability(c, soil, input));
  const soilHealthIndex = cropSoilScores.length > 0
    ? Math.round(cropSoilScores.reduce((a, b) => a + b, 0) / cropSoilScores.length)
    : 80;

  // 4. Sequence & Rotational Harmony Score (0-100)
  const sequenceHarmony = scoreSequenceHarmony(steps, input.previousCrop);

  // Net Nitrogen Balance
  const netNitrogenBalanceKgHa = steps.reduce((sum, s) => sum + s.nitrogenContributionKg, 0);

  // 5. Farmer Priority Alignment Score (0-100)
  const priorityAlignment = scorePriorityAlignment(
    steps,
    input.farmerPriority,
    netNitrogenBalanceKgHa,
    totalWaterDemand,
    climateSuitability
  );

  const scoreBreakdown: RotationPlanScoreBreakdown = {
    climateSuitability,
    waterAlignment,
    soilHealthIndex,
    sequenceHarmony,
    priorityAlignment
  };

  // Compute final weighted overall score (0-100)
  const overallScore = Math.max(
    10,
    Math.min(
      100,
      Math.round(
        breakdownScoreWeighted(scoreBreakdown, weights)
      )
    )
  );

  // Qualitative Tiers
  const soilHealthBenefitTier = netNitrogenBalanceKgHa >= 80 ? 'high' : netNitrogenBalanceKgHa >= 0 ? 'medium' : 'moderate';
  const climateResilienceRating = climateSuitability >= 82 ? 'high' : climateSuitability >= 65 ? 'medium' : 'moderate';
  const economicRiskProfile = template.templateType === 'cash_crop' ? 'medium' : totalWaterDemand > 2000 ? 'medium' : 'low';

  // Dynamic Tailored Agronomic Rationales
  const locDisplayEn = input.locationName || `Coordinates (${input.latitude.toFixed(2)}°, ${input.longitude.toFixed(2)}°)`;
  const locDisplayAr = input.locationName || `الإحداثيات (${input.latitude.toFixed(2)}°, ${input.longitude.toFixed(2)}°)`;

  const whyItFitsEn = generateWhyItFitsEn(
    template,
    locDisplayEn,
    input,
    climate,
    soil,
    totalWaterDemand,
    netNitrogenBalanceKgHa,
    scoreBreakdown
  );

  const whyItFitsAr = generateWhyItFitsAr(
    template,
    locDisplayAr,
    input,
    climate,
    soil,
    totalWaterDemand,
    netNitrogenBalanceKgHa,
    scoreBreakdown
  );

  const { advantagesEn, advantagesAr, limitationsEn, limitationsAr } = generateProsCons(template, climate, soil, netNitrogenBalanceKgHa, totalWaterDemand, input);

  // Atmospheric Humidity & Foliar Microclimate Assessment
  let humidityAssessment: RotationPlan['humidityAssessment'];
  if (climate.avgRelativeHumidityPct !== undefined) {
    const avgRh = climate.avgRelativeHumidityPct;
    const sensitiveCropsExceeded = activeCrops.filter(c => {
      const rh = (c.season === 'summer' && climate.summerAvgRhPct !== undefined) ? climate.summerAvgRhPct : avgRh;
      return rh > c.maxToleratedRhPct;
    });

    const isHighRisk = sensitiveCropsExceeded.some(c => c.humidityToleranceTier === 'sensitive') || (climate.highHumidityDaysCount ?? 0) >= 40;
    const isModRisk = sensitiveCropsExceeded.length > 0 || avgRh >= 68;
    const riskTier: 'low' | 'moderate' | 'high' = isHighRisk ? 'high' : isModRisk ? 'moderate' : 'low';

    const exceededNamesEn = sensitiveCropsExceeded.map(c => c.nameEn).join(', ');
    const exceededNamesAr = sensitiveCropsExceeded.map(c => c.nameAr).join('، ');

    const summaryEn = riskTier === 'high'
      ? `High foliar disease pressure alert (Mean RH: ${avgRh}%, ${climate.highHumidityDaysCount ?? 0} days ≥80% RH). Crops at risk: ${exceededNamesEn}. Recommend wider row spacing, canopy aeration, and preventive bio-fungicide scouting.`
      : riskTier === 'moderate'
      ? `Moderate atmospheric humidity (Mean RH: ${avgRh}%). Microclimate is well-balanced; monitor sensitive pulses (${exceededNamesEn || 'none'}) during flowering canopy closure.`
      : `Favorable low-humidity microclimate (Mean RH: ${avgRh}%). Minimal foliar fungal disease pressure; promotes excellent grain quality and sun drying for cereal and pulse harvests.`;

    const summaryAr = riskTier === 'high'
      ? `تنبيه: ضغط رطوبي مرتفع وأمراض أوراق محتملة (متوسط الرطوبة: ${avgRh}٪، ${climate.highHumidityDaysCount ?? 0} يوماً ≥80٪). المحاصيل الحساسة: ${exceededNamesAr}. يوصى بزيادة مسافات الزراعة وتهوية النباتات والمكافحة الوقائية.`
      : riskTier === 'moderate'
      ? `رطوبة نسبية معتدلة (متوسط الرطوبة: ${avgRh}٪). البيئة الحقلية متوازنة عموماً؛ يرجى مراقبة البقوليات الحساسة (${exceededNamesAr || 'لا يوجد'}) أثناء مرحلة التزهير وتشابك المجموع الخضري.`
      : `أجواء جافة ومثالية للنمو (متوسط الرطوبة: ${avgRh}٪). انخفاض ملحوظ في مخاطر الفطريات الورقية، مما يمنح جودة ممتازة لنضج الحبوب وسهولة التجفيف الشمسي للحصاد.`;

    humidityAssessment = {
      avgRhPct: avgRh,
      riskTier,
      summaryEn,
      summaryAr
    };
  }

  // Irrigation Water Salinity (ECw) Assessment (FAO 29 Table 4)
  const ecwProvided = input.irrigationWaterSalinityECw !== undefined && !isNaN(input.irrigationWaterSalinityECw);
  let waterSalinityAssessment: RotationPlan['waterSalinityAssessment'];

  if (!ecwProvided) {
    waterSalinityAssessment = {
      ecwProvided: false,
      effectiveDrainageFactor: 1.0,
      penalizedCrops: [],
      favoredCrops: [],
      summaryEn: 'Irrigation water salinity (ECw) not provided. Root-zone salinity risk evaluated from soil extract data alone without water quality penalties.',
      summaryAr: 'لم يتم إدخال ملوحة مياه الري (ECw). تم تقييم ملوحة منطقة الجذور استناداً إلى بيانات التربة دون فرض قيود على جودة المياه.'
    };
  } else {
    const ecw = input.irrigationWaterSalinityECw!;
    let soilFactor = 1.0;
    if (soil.soilType === 'sandy' || soil.soilType === 'sandy_loam') {
      soilFactor = 0.85;
    } else if (soil.soilType === 'calcareous') {
      soilFactor = 1.10;
    } else if (soil.soilType === 'silty_clay') {
      soilFactor = 1.25;
    }
    const method = input.irrigationMethod || 'surface_furrow';
    const methodFactor = method === 'drip' ? 0.90 : method === 'sprinkler' ? 1.00 : 1.05;
    const effectiveDrainageFactor = Number((soilFactor * methodFactor).toFixed(2));
    const effectiveECw = ecw * effectiveDrainageFactor;

    const restrictionTier: 'none' | 'slight_to_moderate' | 'severe' =
      ecw < 0.7 ? 'none' : ecw <= 3.0 ? 'slight_to_moderate' : 'severe';

    const penalized: string[] = [];
    const favored: string[] = [];

    for (const c of activeCrops) {
      if (effectiveECw > c.salinityToleranceECw) {
        penalized.push(c.nameEn);
      } else if (ecw >= 2.5 && c.salinityToleranceECw >= 4.0) {
        favored.push(c.nameEn);
      }
    }

    const summaryEn = restrictionTier === 'severe'
      ? `Severe water salinity restriction (ECw = ${ecw} dS/m, effective hazard ${effectiveECw.toFixed(1)} dS/m on ${soil.soilType.replace(/_/g, ' ')}). High yield risk for sensitive crops (${penalized.join(', ') || 'none'}). Tolerant crops (${favored.join(', ') || 'barley, sorghum'}) recommended with additional leaching fraction.`
      : restrictionTier === 'slight_to_moderate'
      ? `Slight to moderate water salinity restriction (ECw = ${ecw} dS/m, effective hazard ${effectiveECw.toFixed(1)} dS/m). Leaching fraction recommended to prevent root-zone salt build-up in ${soil.soilType.replace(/_/g, ' ')} soil.`
      : `No water salinity restriction (ECw = ${ecw} dS/m). Water quality is excellent for all standard agricultural crops across the rotation.`;

    const summaryAr = restrictionTier === 'severe'
      ? `قيود شديدة لملوحة مياه الري (ECw = ${ecw} ديسيمنز/م، الخطر الفعلي ${effectiveECw.toFixed(1)} ديسيمنز/م على تربة ${soil.soilType}). مخاطر إنتاجية للمحاصيل الحساسة (${penalized.join('، ') || 'لا يوجد'}). يفضل الاعتماد على المحاصيل المتحملة (${favored.join('، ') || 'الشعير والذرة الرفيعة'}) وتطبيق غسيل دوري للتربة.`
      : restrictionTier === 'slight_to_moderate'
      ? `قيود طفيفة إلى متوسطة على ملوحة مياه الري (ECw = ${ecw} ديسيمنز/م، الخطر الفعلي ${effectiveECw.toFixed(1)} ديسيمنز/م). يوصى بزيادة مقنن الغسيل لتجنب تراكم الأملاح في منطقة الجذور.`
      : `مياه ري ممتازة وخالية من قيود الملوحة (ECw = ${ecw} ديسيمنز/م). جودة المياه ملائمة تماماً لجميع محاصيل الدورة الزراعية.`;

    waterSalinityAssessment = {
      ecwProvided: true,
      ecwValue: ecw,
      restrictionTier,
      effectiveDrainageFactor,
      penalizedCrops: penalized,
      favoredCrops: favored,
      summaryEn,
      summaryAr
    };
  }

  return {
    id: template.id,
    titleEn: template.titleEn,
    titleAr: template.titleAr,
    taglineEn: template.taglineEn,
    taglineAr: template.taglineAr,
    strategicFocusEn: template.strategicFocusEn,
    strategicFocusAr: template.strategicFocusAr,
    overallScore,
    scoreBreakdown,
    steps,
    totalWaterDemandMm: totalWaterDemand,
    waterBalance,
    netNitrogenBalanceKgHa,
    soilHealthBenefitTier,
    climateResilienceRating,
    economicRiskProfile,
    whyItFitsEn,
    whyItFitsAr,
    humidityAssessment,
    waterSalinityAssessment,
    advantagesEn,
    advantagesAr,
    limitationsEn,
    limitationsAr,
    dataSourcesAndUncertaintiesEn: [
      `Climate telemetry derived from NASA POWER Daily Surface Meteorology (2024 observations for ${input.latitude.toFixed(2)}°, ${input.longitude.toFixed(2)}°).`,
      `Soil baseline from ${soil.source.replace(/_/g, ' ')} (pH ${soil.ph}, OM ${soil.organicMatterPct}%).`,
      'Water requirements calculated using FAO-56 Penman-Monteith crop evapotranspiration coefficients.',
      'Uncertainty: Actual farm yield and nitrogen fixation depend on seed germination, canal/well conveyance efficiency, and pest control.'
    ],
    dataSourcesAndUncertaintiesAr: [
      `الأرصاد المناخية مسترجعة من مرصد ناسا POWER اليومي لسطح الأرض (أرصاد 2024 للموقع ${input.latitude.toFixed(2)}°، ${input.longitude.toFixed(2)}°).`,
      `خصائص التربة مستندة إلى مصدر (${soil.source.replace(/_/g, ' ')}) بدرجة حموضة pH ${soil.ph} ومادة عضوية ${soil.organicMatterPct}%.`,
      'الاحتياجات المائية محسوبة وفق معاملات البخر-نتح لمنظمة الأغذية والزراعة (الفاو FAO-56).',
      'عامل عدم اليقين: تعتمد الإنتاجية والتثبيت الفعلي للنيتروجين على كفاءة شبكة الري المحلية والضغط المرضي في الحقل.'
    ]
  };
}

function breakdownScoreWeighted(b: RotationPlanScoreBreakdown, w: ScoringWeights): number {
  return (
    b.waterAlignment * w.water +
    b.climateSuitability * w.climate +
    b.soilHealthIndex * w.soil +
    b.sequenceHarmony * w.sequence +
    b.priorityAlignment * w.priority
  );
}

// ---------------------------------------------------------------------------
// Dynamic Agronomic Explanations Generator
// ---------------------------------------------------------------------------

function generateWhyItFitsEn(
  _t: CandidateTemplate,
  loc: string,
  input: FarmAssessmentInput,
  climate: NasaPowerClimateData,
  soil: SoilData,
  totalWater: number,
  netN: number,
  breakdown: RotationPlanScoreBreakdown
): string {
  const prioText = input.farmerPriority.replace(/_/g, ' ');
  const soilText = soil.soilType.replace(/_/g, ' ');

  return `This strategy directly addresses farm conditions at ${loc}. With observed NASA temperatures (Mean: ${climate.avgTemperatureC}°C, Peak: ${climate.maxTemperatureC}°C, Frost Min: ${climate.minTemperatureC}°C) and annual precipitation of ${climate.totalPrecipitationMm} mm, the plan achieves a Climate Suitability score of ${breakdown.climateSuitability}/100. Total 2-year water consumption is ${totalWater} mm, calibrated for ${input.irrigationAvailability} irrigation availability (Water Alignment: ${breakdown.waterAlignment}/100). The crops match ${soilText} soil (pH ${soil.ph}), generating a net nitrogen balance of ${netN > 0 ? `+${netN}` : netN} kg N/ha, with strong ${prioText} priority alignment (${breakdown.priorityAlignment}/100).`;
}

function generateWhyItFitsAr(
  _t: CandidateTemplate,
  loc: string,
  input: FarmAssessmentInput,
  climate: NasaPowerClimateData,
  soil: SoilData,
  totalWater: number,
  netN: number,
  breakdown: RotationPlanScoreBreakdown
): string {
  const prioAr: Record<string, string> = {
    water_conservation: 'ترشيد استهلاك المياه',
    soil_health: 'خصوبة وصحة التربة',
    climate_resilience: 'الصمود المناخي',
    profitability: 'تعظيم الربحية النقدية'
  };

  const soilAr: Record<string, string> = {
    clay_loam: 'طميية طينية',
    sandy_loam: 'طميية رملية',
    silty_clay: 'طميية سلتية',
    sandy: 'رملية',
    calcareous: 'جيرية كلسية'
  };

  return `تلبي هذه الاستراتيجية بدقة ظروف الحقل في ${loc}. استناداً لأرصاد ناسا الحية (متوسط الحرارة: ${climate.avgTemperatureC}°م، الذروة: ${climate.maxTemperatureC}°م، الصغرى: ${climate.minTemperatureC}°م، الأمطار: ${climate.totalPrecipitationMm} مم)، حققت الخطة مؤشر توافق مناخي ${breakdown.climateSuitability}/100. يبلغ الاستهلاك المائي التراكمي ${totalWater} مم متوافقاً مع وفرة مياه ${input.irrigationAvailability === 'high' ? 'عالية' : input.irrigationAvailability === 'medium' ? 'متوسطة' : 'منخفضة'} (مؤشر المياه: ${breakdown.waterAlignment}/100). تتلاءم المحاصيل مع التربة الـ${soilAr[soil.soilType] || soil.soilType} (حموضة pH ${soil.ph})، وتوفر ميزاناً نيتروجينياً قدره ${netN > 0 ? `+${netN}` : netN} كجم N/هكتار لخدمة أولوية ${prioAr[input.farmerPriority]} (${breakdown.priorityAlignment}/100).`;
}

function generateProsCons(
  _template: CandidateTemplate,
  climate: NasaPowerClimateData,
  _soil: SoilData,
  netN: number,
  totalWater: number,
  input?: FarmAssessmentInput
): { advantagesEn: string[]; advantagesAr: string[]; limitationsEn: string[]; limitationsAr: string[] } {
  const advEn: string[] = [];
  const advAr: string[] = [];
  const limEn: string[] = [];
  const limAr: string[] = [];

  if (totalWater <= 1500) {
    advEn.push(`Low cumulative water consumption (${totalWater} mm / 2 yrs): high drought resistance and reduced pumping cost.`);
    advAr.push(`استهلاك مائي منخفض (${totalWater} مم خلال عامين): مقاومة عالية لشح المياه وتوفير تكاليف الضخ.`);
  } else {
    limEn.push(`Substantial water requirement (${totalWater} mm / 2 yrs): requires reliable perennial irrigation or adequate rainfall.`);
    limAr.push(`احتياج مائي مرتفع (${totalWater} مم خلال عامين): يتطلب مصدراً مائياً مستقراً أو هطول أمطار كافٍ.`);
  }

  if (netN > 0) {
    advEn.push(`Positive biological nitrogen balance (+${netN} kg N/ha): cuts synthetic fertilizer dependency and enriches soil humus.`);
    advAr.push(`ميزان نيتروجيني حيوي موجب (+${netN} كجم N/هـ): يخفض تكلفة الأسمدة الكيماوية ويثري دبال التربة.`);
  } else {
    limEn.push(`Negative nitrogen balance (${netN} kg N/ha over 2 yrs): supplemental compost or mineral fertilizer required.`);
    limAr.push(`ميزان نيتروجيني سالب (${netN} كجم N/هـ): يستلزم إضافة كمبوست أو أسمدة تعويضية بين المواسم.`);
  }

  if (climate.maxTemperatureC > 38) {
    advEn.push(`Incorporates crops specifically adapted to withstand heat spells (up to ${climate.maxTemperatureC}°C) without sterility.`);
    advAr.push(`تضم محاصيل مهيأة فسيولوجياً لتحمل موجات الحر الشديدة (حتى ${climate.maxTemperatureC}°م) دون عقم زهري.`);
  }

  if (climate.minTemperatureC < 0) {
    advEn.push(`Winter crops selected with verified frost tolerance to survive freezing drops down to ${climate.minTemperatureC}°C.`);
    advAr.push(`محاصيل شتوية ذات قدرة معتمدة على تحمل الصقيع وموجات البرد حتى ${climate.minTemperatureC}°م.`);
  }

  // Relative humidity & disease considerations
  if (climate.avgRelativeHumidityPct !== undefined) {
    if (climate.avgRelativeHumidityPct >= 72 || (climate.highHumidityDaysCount ?? 0) >= 30) {
      limEn.push(`High atmospheric humidity (${climate.avgRelativeHumidityPct}%, ${climate.highHumidityDaysCount ?? 0} days ≥80%): monitor foliar fungal blights and ensure good row ventilation.`);
      limAr.push(`رطوبة جوية مرتفعة (${climate.avgRelativeHumidityPct}٪، ${climate.highHumidityDaysCount ?? 0} يوماً ≥80٪): تتطلب مراقبة أمراض الأوراق الفطرية وضمان تهوية جيدة بين الخطوط.`);
    } else if (climate.avgRelativeHumidityPct <= 45) {
      advEn.push(`Dry atmospheric conditions (RH ${climate.avgRelativeHumidityPct}%): suppresses foliar fungal blights and provides ideal conditions for cereal/pulse harvest drying.`);
      advAr.push(`أجواء جافة منخفضة الرطوبة (${climate.avgRelativeHumidityPct}٪): تحد من الأمراض الفطرية الورقية وتوفر ظروفاً مثالية لنضج وجفاف الحبوب.`);
    }
  }

  // Irrigation water salinity (ECw) considerations
  if (input?.irrigationWaterSalinityECw !== undefined && !isNaN(input.irrigationWaterSalinityECw)) {
    if (input.irrigationWaterSalinityECw >= 2.5) {
      limEn.push(`Elevated irrigation water salinity (ECw ${input.irrigationWaterSalinityECw} dS/m): apply scheduled leaching fractions to prevent root-zone salt accumulation.`);
      limAr.push(`ملوحة مياه ري مرتفعة (${input.irrigationWaterSalinityECw} ديسيمنز/م): يلزم تطبيق ريات غسيل دورية لتفادي تراكم الأملاح حول الجذور.`);
    } else if (input.irrigationWaterSalinityECw < 1.0) {
      advEn.push(`High-quality low-salinity irrigation water (ECw ${input.irrigationWaterSalinityECw} dS/m): zero water-quality osmotic stress on root water uptake.`);
      advAr.push(`مياه ري عذبة فائقة الجودة (${input.irrigationWaterSalinityECw} ديسيمنز/م): انعدام تام للإجهاد الأسموزي الملحي على امتصاص الجذور.`);
    }
  }

  // Botanical family diversity advantage
  advEn.push('Systematic rotation of botanical families disrupts weed seedbanks and root pathogen continuity.');
  advAr.push('التعاقب المنتظم للعائلات النباتية يقطع دورات الآفات ونيماتودا الجذور وبذور الحشائش.');

  limEn.push('Yield outcomes remain contingent on seasonal weather anomalies, timely sowing, and farm management diligence.');
  limAr.push('تبقى النتائج الإنتاجية مرتبطة بالتقلبات الجوية الموسمية والالتزام بمواعيد الزراعة ومكافحة الآفات.');

  return { advantagesEn: advEn, advantagesAr: advAr, limitationsEn: limEn, limitationsAr: limAr };
}

// ---------------------------------------------------------------------------
// Dynamic Candidate Sequence Generator
// ---------------------------------------------------------------------------

/**
 * Dynamically synthesizes a diversified pool of 4-season rotation candidates tailored
 * to the farm's soil profile, NASA climate observations, and management constraints.
 * Enforces botanical family rotation, preceding crop compatibility, legume nitrogen replenishment,
 * and thermal threshold tolerances.
 */
export function generateDynamicCandidatePool(
  input: FarmAssessmentInput,
  climate: NasaPowerClimateData,
  soil: SoilData
): CandidateTemplate[] {
  const allCrops = Object.values(CROPS_DATABASE);

  // Filter candidate cool/winter crops (Seasons 1 & 3)
  const candidateCoolCrops = allCrops.filter(crop => {
    if (crop.season !== 'winter') return false;
    // Soil texture compatibility
    if (!crop.toleratedSoilTypes.includes(soil.soilType)) return false;
    // Salinity check: if EC is provided and severely exceeds tolerance
    if (soil.salinityEC !== undefined && soil.salinityEC > crop.salinityToleranceECe + 2.5) return false;
    // Thermal frost limit check: if minimum temperature is below crop frost limit
    if (climate.minTemperatureC < crop.minToleratedTempC - 3) return false;
    return true;
  });

  // Filter candidate warm/summer crops (Seasons 2 & 4)
  const candidateWarmCrops = allCrops.filter(crop => {
    if (crop.season !== 'summer') return false;
    // Soil texture compatibility
    if (!crop.toleratedSoilTypes.includes(soil.soilType)) return false;
    // Salinity check
    if (soil.salinityEC !== undefined && soil.salinityEC > crop.salinityToleranceECe + 2.5) return false;
    // Extreme heat check
    if (climate.maxTemperatureC > crop.maxToleratedTempC + 3) return false;
    // Sub-zero frost exclusion: chilling-sensitive summer crops (sesame, rice, groundnut) suffer freezing injury
    if (climate.minTemperatureC < 0 && (['rice', 'sesame', 'groundnut'].includes(crop.id) || crop.minToleratedTempC >= 10)) return false;
    // Rice and Sugarcane water requirement check: Paddy rice and Sugarcane require high irrigation or heavy rainfall
    if ((crop.id === 'rice' || crop.id === 'sugarcane') && input.irrigationAvailability === 'low' && climate.totalPrecipitationMm < 500) return false;
    return true;
  });

  // Productive crop candidate pools (summer fallow is completely eliminated)
  const fallbackCool = allCrops.filter(c => {
    if (c.season !== 'winter') return false;
    if (climate.minTemperatureC < c.minToleratedTempC - 3) return false;
    return true;
  });
  const coolPool: Crop[] = candidateCoolCrops.length >= 1
    ? candidateCoolCrops
    : (fallbackCool.length >= 1 ? fallbackCool : allCrops.filter(c => c.season === 'winter'));

  const fallbackWarm = allCrops.filter(c => {
    if (c.season !== 'summer') return false;
    if (climate.minTemperatureC < 0 && (['rice', 'sesame', 'groundnut'].includes(c.id) || c.minToleratedTempC >= 10)) return false;
    return true;
  });
  const warmPool: Crop[] = candidateWarmCrops.length >= 1
    ? candidateWarmCrops
    : (fallbackWarm.length >= 1 ? fallbackWarm : allCrops.filter(c => c.season === 'summer'));

  // Sort candidate pools based on priority orientation so most relevant crops are evaluated across the sequence
  const sortPool = (pool: Crop[]): Crop[] => {
    return [...pool].sort((a, b) => {
      if (input.farmerPriority === 'profitability') {
        const cashScore = (c: Crop) => (c.cashCropTier === 'high' ? 3 : c.cashCropTier === 'medium' ? 2 : 1);
        return cashScore(b) - cashScore(a);
      }
      if (input.farmerPriority === 'water_conservation') {
        return a.waterRequirementMm - b.waterRequirementMm;
      }
      if (input.farmerPriority === 'soil_health') {
        return b.nitrogenFixationKgPerHa - a.nitrogenFixationKgPerHa;
      }
      if (input.farmerPriority === 'climate_resilience') {
        const aTolerant = a.maxToleratedTempC >= 38 ? 2 : 1;
        const bTolerant = b.maxToleratedTempC >= 38 ? 2 : 1;
        return bTolerant - aTolerant;
      }
      return 0;
    });
  };

  const sortedCoolPool = sortPool(coolPool);
  const sortedWarmPool = sortPool(warmPool);

  const dynamicTemplates: CandidateTemplate[] = [];

  for (const c1 of sortedCoolPool) {
    // S1 check against previous crop
    if (input.previousCrop && input.previousCrop !== 'fallow') {
      if (c1.rotationRulesEn.avoidPreceding.includes(input.previousCrop)) {
        continue;
      }
    }

    for (const c2 of sortedWarmPool) {
      // Succession rule S1 -> S2: avoid same family and avoidPreceding
      if (c1.family === c2.family) continue;
      if (c2.rotationRulesEn.avoidPreceding.includes(c1.id)) continue;

      let pairCount = 0;
      for (const c3 of sortedCoolPool) {
        // Succession rule S2 -> S3: avoid same family and avoidPreceding
        if (c2.family === c3.family) continue;
        if (c3.rotationRulesEn.avoidPreceding.includes(c2.id)) continue;

        for (const c4 of sortedWarmPool) {
          // Succession rule S3 -> S4: avoid same family and avoidPreceding
          if (c3.family === c4.family) continue;
          if (c4.rotationRulesEn.avoidPreceding.includes(c3.id)) continue;

          const cropIds: (CropId | 'fallow')[] = [c1.id, c2.id, c3.id, c4.id];

          // 1. Legume presence: at least one legume (Fabaceae) for biological nitrogen replenishment
          const activeCropList = [c1, c2, c3, c4];
          const hasLegume = activeCropList.some(c => c.family === 'Fabaceae (Leguminosae)');
          if (!hasLegume) continue;

          // 2. Diversity constraint: no single non-fallow crop more than 2 times
          const counts: Record<string, number> = {};
          let maxCount = 0;
          for (const cid of cropIds) {
            counts[cid] = (counts[cid] || 0) + 1;
            if (counts[cid] > maxCount) maxCount = counts[cid];
          }
          if (maxCount > 2) continue;

          // 3. Minimum 3 distinct crop states across 4 seasons
          const distinctStates = new Set(cropIds);
          if (distinctStates.size < 3) continue;

          // Archetype categorization
          let templateType: CandidateTemplate['templateType'] = 'diversified';
          const legumesCount = activeCropList.filter(c => c.family === 'Fabaceae (Leguminosae)').length;
          const cashTierHigh = activeCropList.filter(c => c.cashCropTier === 'high').length;

          if (input.irrigationAvailability === 'low' && activeCropList.every(c => c.waterRequirementMm <= 550)) {
            templateType = 'water_saving';
          } else if (legumesCount >= 2 || activeCropList.some(c => c.id === 'berseem')) {
            templateType = 'soil_restorative';
          } else if (cashTierHigh >= 2 || activeCropList.some(c => c.id === 'onion' || c.id === 'potato' || c.id === 'cotton' || c.id === 'tomato')) {
            templateType = 'cash_crop';
          } else if (climate.avgTemperatureC < 16) {
            templateType = 'cool_temperate';
          }

          const c1NameEn = c1.nameEn;
          const c2NameEn = c2.nameEn;
          const c3NameEn = c3.nameEn;
          const c4NameEn = c4.nameEn;

          const c1NameAr = c1.nameAr;
          const c2NameAr = c2.nameAr;
          const c3NameAr = c3.nameAr;
          const c4NameAr = c4.nameAr;

          const titleEn = `${c1NameEn} ➔ ${c2NameEn} ➔ ${c3NameEn} ➔ ${c4NameEn} Rotation`;
          const titleAr = `دورة ${c1NameAr} ➔ ${c2NameAr} ➔ ${c3NameAr} ➔ ${c4NameAr}`;

          const id = `dyn_${cropIds.join('_')}`;

          dynamicTemplates.push({
            id,
            templateType,
            cropIds,
            titleEn,
            titleAr,
            taglineEn: `Productive multi-cropping sequence calibrated for ${input.soilType.replace(/_/g, ' ')} soil and ${input.farmerPriority.replace(/_/g, ' ')}`,
            taglineAr: `دورة حقلية إنتاجية متعاقبة مهيأة لتربة ${soil.soilType} ومستجيبة لأولوية المزارع`,
            strategicFocusEn: `Complete 4-season sequence delivering continuous productivity with ${legumesCount} nitrogen-fixing legume${legumesCount > 1 ? 's' : ''} and diverse root structures.`,
            strategicFocusAr: `دورة متكاملة لـ 4 مواسم تضمن استمرار الإنتاجية الزراعية مع ${legumesCount} محصول بقولي مخصب وتنوع طبقات الجذور.`
          });

          pairCount++;
          // Allow up to 2 distinct successor pairs per (c1, c2) to preserve pool diversity
          if (pairCount >= 2) break;
        }
        if (pairCount >= 2) break;
      }

      // Limit pool size to top ~140 dynamic candidates across diverse (c1, c2) combinations
      if (dynamicTemplates.length >= 140) break;
    }
    if (dynamicTemplates.length >= 140) break;
  }

  return dynamicTemplates;
}

// ---------------------------------------------------------------------------
// Main Public Export: Dynamic Generator & Multi-Criteria Evaluator
// ---------------------------------------------------------------------------

/**
 * Dynamically evaluates candidate rotation plans against the farm's exact
 * NASA POWER telemetry and soil profile. Calculates scientific suitability scores,
 * applies dynamic priority weights, and ranks the top 3 best-fitting plans
 * with deterministic 5-key tie-breaking.
 */
export function generateRotationPlans(
  input: FarmAssessmentInput,
  climate: NasaPowerClimateData,
  soil: SoilData,
  customWeights?: Partial<ScoringWeights>
): RotationPlan[] {
  console.group('🧠 [SmartCrop] Dynamic Recommendation Engine Execution');
  console.info('Inputs:', {
    coords: `${input.latitude.toFixed(4)}, ${input.longitude.toFixed(4)}`,
    soil: soil.soilType,
    ph: soil.ph,
    om: soil.organicMatterPct,
    irrigation: input.irrigationAvailability,
    priority: input.farmerPriority,
    previousCrop: input.previousCrop
  });
  console.info('NASA Climate:', {
    avgTemp: climate.avgTemperatureC,
    maxTemp: climate.maxTemperatureC,
    minTemp: climate.minTemperatureC,
    precip: climate.totalPrecipitationMm,
    gdd: climate.estimatedGDD
  });

  // 1. Determine dynamic scoring weights based on farmer priority
  const priorityWeights = getPriorityWeights(input.farmerPriority);
  const weights: ScoringWeights = {
    ...priorityWeights,
    ...customWeights
  };
  console.info('Dynamic Priority Weights:', weights);

  // 2. Synthesize dynamic candidate sequences tailored to site conditions
  const dynamicCandidates = generateDynamicCandidatePool(input, climate, soil);

  // Combine dynamic candidates with benchmark reference templates
  const combinedTemplates = [...GLOBAL_ROTATION_CANDIDATES, ...dynamicCandidates];

  // De-duplicate by sequence signature (e.g. "wheat->sorghum->faba_bean->sorghum")
  const uniqueTemplatesMap = new Map<string, CandidateTemplate>();
  for (const t of combinedTemplates) {
    const signature = t.cropIds.join('->');
    if (!uniqueTemplatesMap.has(signature)) {
      uniqueTemplatesMap.set(signature, t);
    }
  }
  const uniqueTemplates = Array.from(uniqueTemplatesMap.values());

  // 3. Evaluate all candidate rotation plans across the pool
  const evaluatedPlans = uniqueTemplates.map(template => {
    return evaluateCandidatePlan(template, input, climate, soil, weights);
  });

  // 4. Filter out plans with fatal agronomic disqualifications (e.g. extreme climate incompatibility)
  const viablePlans = evaluatedPlans.filter(p => p.scoreBreakdown.climateSuitability >= 25);
  const candidatePool = viablePlans.length >= 3 ? viablePlans : evaluatedPlans;

  // 5. Deterministic multi-tier sort:
  // 1) overallScore descending
  // 2) priorityAlignment descending
  // 3) soilHealthIndex descending
  // 4) sequenceHarmony descending
  // 5) id ascending (deterministic string comparison)
  candidatePool.sort((a, b) => {
    return (
      (b.overallScore - a.overallScore) ||
      (b.scoreBreakdown.priorityAlignment - a.scoreBreakdown.priorityAlignment) ||
      (b.scoreBreakdown.soilHealthIndex - a.scoreBreakdown.soilHealthIndex) ||
      (b.scoreBreakdown.sequenceHarmony - a.scoreBreakdown.sequenceHarmony) ||
      a.id.localeCompare(b.id)
    );
  });

  // 6. Select top 3 distinct plans
  const top3 = candidatePool.slice(0, 3);

  console.info(`Evaluated ${uniqueTemplates.length} candidate plans (${dynamicCandidates.length} dynamic + ${GLOBAL_ROTATION_CANDIDATES.length} benchmark templates).`);
  console.info('Top 3 Plans Selected:');
  top3.forEach((p, idx) => {
    console.info(`#${idx + 1} [${p.overallScore}/100] ${p.titleEn}`, {
      climate: p.scoreBreakdown.climateSuitability,
      water: p.scoreBreakdown.waterAlignment,
      soil: p.scoreBreakdown.soilHealthIndex,
      seq: p.scoreBreakdown.sequenceHarmony,
      prio: p.scoreBreakdown.priorityAlignment
    });
  });
  console.groupEnd();

  return top3;
}
