import type { 
  Crop, 
  FarmAssessmentInput, 
  NasaPowerClimateData, 
  SoilData, 
  SeedVariety, 
  SeedVarietyRecommendation,
  ClimateZone
} from '../types';
import { getSeedVarietiesForCrop } from '../data/seedVarieties';

/**
 * Resolved Geographic & Agro-Climatic Profile for a Farm Location
 */
export interface ResolvedGeography {
  countryCode: string; // ISO 2-letter code e.g. 'EG', 'SD', 'SA', 'US', 'FR', 'ES', 'DE', 'IN', 'AU', 'BR', 'GLOBAL'
  regionNameEn: string;
  regionNameAr: string;
  climateZone: ClimateZone;
  isEgyptUpperNile: boolean;
  isSouthernHemisphere: boolean;
}

/**
 * Resolves country code, regional agro-ecological zone, and macro-climate regime
 * from geographic coordinates and optional location name.
 */
export function resolveFarmLocationGeography(
  latitude: number,
  longitude: number,
  locationName?: string
): ResolvedGeography {
  const isSouthern = latitude < 0;
  const name = (locationName || '').toLowerCase();

  // 1. Egypt & Nile Basin Check
  const inEgyptCoords = latitude >= 21.5 && latitude <= 31.8 && longitude >= 24.5 && longitude <= 37.0;
  const isEgyptUpperNile = inEgyptCoords && latitude >= 24.0 && latitude <= 27.8;
  const inSudanCoords = latitude >= 3.5 && latitude < 21.5 && longitude >= 21.5 && longitude <= 38.5;

  if (inEgyptCoords || name.includes('egypt') || name.includes('sohag') || name.includes('مصر') || name.includes('سوهاج')) {
    return {
      countryCode: 'EG',
      regionNameEn: isEgyptUpperNile ? 'Upper Egypt (Nile Valley)' : 'Egypt (Nile Valley & Delta)',
      regionNameAr: isEgyptUpperNile ? 'صعيد مصر (وادي النيل)' : 'مصر (الوادي والدلتا)',
      climateZone: 'arid',
      isEgyptUpperNile,
      isSouthernHemisphere: false
    };
  }

  if (inSudanCoords || name.includes('sudan') || name.includes('سودان')) {
    return {
      countryCode: 'SD',
      regionNameEn: 'Sudan (Nile & Savanna)',
      regionNameAr: 'السودان (حوض النيل والسافانا)',
      climateZone: 'arid',
      isEgyptUpperNile: false,
      isSouthernHemisphere: false
    };
  }

  // 2. Arabian Peninsula / Gulf
  if ((latitude >= 12.0 && latitude <= 32.5 && longitude >= 34.5 && longitude <= 60.0) ||
      name.includes('saudi') || name.includes('riyadh') || name.includes('emirates') || name.includes('السعودية')) {
    return {
      countryCode: 'SA',
      regionNameEn: 'Arabian Peninsula',
      regionNameAr: 'شبه الجزيرة العربية',
      climateZone: 'arid',
      isEgyptUpperNile: false,
      isSouthernHemisphere: false
    };
  }

  // 3. Mediterranean Basin (Levant, North Africa, Southern Europe)
  const isMedLatitude = latitude >= 30.0 && latitude <= 45.0;
  const inLevant = isMedLatitude && longitude >= 34.0 && longitude <= 42.0;
  if (inLevant || name.includes('jordan') || name.includes('syria') || name.includes('lebanon') || name.includes('الأردن') || name.includes('سوريا')) {
    return {
      countryCode: 'SY',
      regionNameEn: 'Levant & Fertile Crescent',
      regionNameAr: 'بلاد الشام والهلال الخصيب',
      climateZone: 'mediterranean',
      isEgyptUpperNile: false,
      isSouthernHemisphere: false
    };
  }

  // 3. Mediterranean Basin & Southern Europe
  const inSouthEurope = latitude >= 36.0 && latitude <= 44.5 && longitude >= -10.0 && longitude <= 28.0;
  if (inSouthEurope || name.includes('spain') || name.includes('italy') || name.includes('greece') || name.includes('portugal') || name.includes('إسبانيا') || name.includes('إيطاليا')) {
    return {
      countryCode: 'ES',
      regionNameEn: 'Southern Europe (Mediterranean Basin)',
      regionNameAr: 'جنوب أوروبا (حوض البحر المتوسط)',
      climateZone: 'mediterranean',
      isEgyptUpperNile: false,
      isSouthernHemisphere: false
    };
  }

  const inMaghreb = latitude >= 25.0 && latitude < 36.0 && longitude >= -13.0 && longitude <= 12.0;
  if (inMaghreb || name.includes('morocco') || name.includes('algeria') || name.includes('tunisia') || name.includes('المغرب') || name.includes('الجزائر') || name.includes('تونس')) {
    return {
      countryCode: 'MA',
      regionNameEn: 'North Africa (Maghreb)',
      regionNameAr: 'شمال إفريقيا (المغرب العربي)',
      climateZone: 'mediterranean',
      isEgyptUpperNile: false,
      isSouthernHemisphere: false
    };
  }

  // 4. Central & Western Europe
  const inCentralEurope = latitude > 44.5 && latitude <= 60.0 && longitude >= -10.0 && longitude <= 30.0;
  if (inCentralEurope || name.includes('france') || name.includes('germany') || name.includes('uk') || name.includes('poland') || name.includes('ألمانيا') || name.includes('فرنسا')) {
    return {
      countryCode: 'FR',
      regionNameEn: 'Central & Western Europe',
      regionNameAr: 'وسط وغرب أوروبا',
      climateZone: 'temperate',
      isEgyptUpperNile: false,
      isSouthernHemisphere: false
    };
  }

  // 5. North America (USA & Canada)
  const inNorthAmerica = latitude >= 24.0 && latitude <= 60.0 && longitude >= -130.0 && longitude <= -65.0;
  if (inNorthAmerica || name.includes('usa') || name.includes('america') || name.includes('canada') || name.includes('أمريكا') || name.includes('كندا')) {
    return {
      countryCode: 'US',
      regionNameEn: 'North America',
      regionNameAr: 'أمريكا الشمالية',
      climateZone: latitude < 35.0 ? 'subtropical' : 'temperate',
      isEgyptUpperNile: false,
      isSouthernHemisphere: false
    };
  }

  // 6. South America
  const inSouthAmerica = latitude >= -55.0 && latitude < 12.0 && longitude >= -85.0 && longitude <= -34.0;
  if (inSouthAmerica || name.includes('brazil') || name.includes('argentina') || name.includes('البرازيل') || name.includes('الأرجنتين')) {
    return {
      countryCode: 'BR',
      regionNameEn: 'South America (Cerrado / Pampas)',
      regionNameAr: 'أمريكا الجنوبية',
      climateZone: Math.abs(latitude) < 20.0 ? 'tropical' : 'subtropical',
      isEgyptUpperNile: false,
      isSouthernHemisphere: true
    };
  }

  // 7. South Asia (India / Pakistan)
  const inSouthAsia = latitude >= 6.0 && latitude <= 36.0 && longitude >= 68.0 && longitude <= 95.0;
  if (inSouthAsia || name.includes('india') || name.includes('pakistan') || name.includes('الهند')) {
    return {
      countryCode: 'IN',
      regionNameEn: 'South Asia (Indo-Gangetic & Deccan)',
      regionNameAr: 'جنوب آسيا (الهند وباكستان)',
      climateZone: latitude < 23.0 ? 'tropical' : 'subtropical',
      isEgyptUpperNile: false,
      isSouthernHemisphere: false
    };
  }

  // 8. Australia
  const inAustralia = latitude <= -10.0 && latitude >= -45.0 && longitude >= 110.0 && longitude <= 155.0;
  if (inAustralia || name.includes('australia') || name.includes('أستراليا')) {
    return {
      countryCode: 'AU',
      regionNameEn: 'Australia (Grain Belt)',
      regionNameAr: 'أستراليا (حزام الحبوب)',
      climateZone: 'mediterranean',
      isEgyptUpperNile: false,
      isSouthernHemisphere: true
    };
  }

  // 9. Generic Global Fallback
  return {
    countryCode: 'GLOBAL',
    regionNameEn: 'Global Agricultural Zone',
    regionNameAr: 'نطاق زراعي عالمي',
    climateZone: Math.abs(latitude) < 18 ? 'tropical' : Math.abs(latitude) < 35 ? 'semi_arid' : 'temperate',
    isEgyptUpperNile: false,
    isSouthernHemisphere: isSouthern
  };
}

/**
 * Evaluates and recommends the single best verified seed variety for a given crop
 * based on farm geographic location, local registration, climate telemetry, and soil indicators.
 */
export function recommendBestSeedVariety(
  crop: Crop,
  input: FarmAssessmentInput,
  climate: NasaPowerClimateData,
  soil: SoilData
): SeedVarietyRecommendation | null {
  const varieties = getSeedVarietiesForCrop(crop.id);
  if (!varieties || varieties.length === 0) {
    return null;
  }

  const geography = resolveFarmLocationGeography(input.latitude, input.longitude, input.locationName);
  const seasonalAvgTemp = crop.season === 'summer' ? climate.summerAvgTempC : climate.winterAvgTempC;
  const avgRh = climate.avgRelativeHumidityPct ?? 50;

  let bestVariety: SeedVariety | null = null;
  let highestScore = -1000;
  let bestPositives: string[] = [];
  let bestPositivesAr: string[] = [];
  let bestIsLocallyRegistered = false;

  for (const variety of varieties) {
    let score = 50;
    const stressPositivesEn: string[] = [];
    const stressPositivesAr: string[] = [];
    const contextPositivesEn: string[] = [];
    const contextPositivesAr: string[] = [];

    // -----------------------------------------------------------------------
    // 1. Local Registration & National Variety Catalogue Priority
    // -----------------------------------------------------------------------
    const isLocallyRegistered = variety.countriesRegistered.includes(geography.countryCode);
    if (isLocallyRegistered) {
      score += 35;
      contextPositivesEn.push(`officially registered in ${geography.regionNameEn}`);
      contextPositivesAr.push(`معتمد رسمياً في ${geography.regionNameAr}`);
    } else {
      // Check regional biome compatibility if not registered in exact country
      if (variety.agroEcologicalZones.includes(geography.climateZone)) {
        score += 12;
      }
    }

    // -----------------------------------------------------------------------
    // 2. Heat Stress & Thermal Regime Matching (Seasonally Adjusted)
    // -----------------------------------------------------------------------
    const relevantMaxTemp = crop.season === 'winter'
      ? Math.min(climate.maxTemperatureC, climate.winterAvgTempC + 10)
      : climate.maxTemperatureC;

    if (relevantMaxTemp >= variety.maxToleratedTempC + 6) {
      // Lethal thermal excess: severe physiological mortality / anthesis failure
      continue;
    } else if (relevantMaxTemp > variety.maxToleratedTempC) {
      const heatExcess = relevantMaxTemp - variety.maxToleratedTempC;
      score -= Math.min(50, Math.round(heatExcess * 8));
    } else if (variety.maxToleratedTempC >= 42 && relevantMaxTemp >= 38) {
      score += 18;
      stressPositivesEn.push(`proven heat tolerance up to ${variety.maxToleratedTempC}°C`);
      stressPositivesAr.push(`تحمل موثق للإجهاد الحراري حتى ${variety.maxToleratedTempC}°م`);
    }

    // -----------------------------------------------------------------------
    // 3. Cold & Frost Tolerance Matching (Seasonally Adjusted)
    // -----------------------------------------------------------------------
    const relevantMinTemp = crop.season === 'summer'
      ? Math.max(climate.minTemperatureC, climate.summerAvgTempC - 10)
      : climate.minTemperatureC;

    if (relevantMinTemp <= variety.minToleratedTempC - 6) {
      // Lethal frost / catastrophic freeze mortality
      continue;
    } else if (relevantMinTemp < variety.minToleratedTempC) {
      const coldDeficit = variety.minToleratedTempC - relevantMinTemp;
      score -= Math.min(50, Math.round(coldDeficit * 8));
    } else if (relevantMinTemp <= 2 && variety.minToleratedTempC <= -4) {
      score += 15;
      stressPositivesEn.push(`frost hardiness down to ${variety.minToleratedTempC}°C`);
      stressPositivesAr.push(`مقاومة الصقيع حتى ${variety.minToleratedTempC}°م`);
    }

    // Optimal seasonal temperature matching
    if (seasonalAvgTemp >= variety.optimalTempRangeC[0] && seasonalAvgTemp <= variety.optimalTempRangeC[1]) {
      score += 10;
    }

    // -----------------------------------------------------------------------
    // 4. Soil Texture Compatibility
    // -----------------------------------------------------------------------
    if (variety.toleratedSoilTypes.includes(soil.soilType)) {
      score += 12;
      const soilTextEn = soil.soilType.replace(/_/g, ' ');
      const soilTextAr: Record<string, string> = {
        clay_loam: 'التربة الطميية الطينية',
        sandy_loam: 'التربة الطميية الرملية',
        silty_clay: 'التربة الطميية السلتية',
        sandy: 'التربة الرملية',
        calcareous: 'التربة الكلسية الجيرية'
      };
      contextPositivesEn.push(`high performance on ${soilTextEn} soils`);
      contextPositivesAr.push(`إنتاجية مستقرة في ${soilTextAr[soil.soilType] || 'هذه التربة'}`);
    } else {
      score -= 22; // Incompatible soil texture
    }

    // pH matching
    if (soil.ph >= variety.optimalPhRange[0] && soil.ph <= variety.optimalPhRange[1]) {
      score += 8;
    } else {
      score -= 10;
    }

    // -----------------------------------------------------------------------
    // 5. Salinity Tolerance (ECe & ECw)
    // -----------------------------------------------------------------------
    const farmSalinityECe = soil.salinityEC || 1.5;
    if (farmSalinityECe > variety.salinityToleranceECe) {
      const saltExcess = farmSalinityECe - variety.salinityToleranceECe;
      score -= Math.min(40, Math.round(saltExcess * 10));
    }
    if (farmSalinityECe >= 3.5 && variety.salinityToleranceECe >= 5.5) {
      score += 20;
      stressPositivesEn.push(`elevated salinity tolerance (ECe up to ${variety.salinityToleranceECe} dS/m)`);
      stressPositivesAr.push(`تحمل فائق للملوحة (حتى ${variety.salinityToleranceECe} ديسيمنز/م)`);
    }

    // Irrigation Water Salinity (ECw) check
    if (input.irrigationWaterSalinityECw !== undefined && !isNaN(input.irrigationWaterSalinityECw)) {
      if (input.irrigationWaterSalinityECw > variety.salinityToleranceECw) {
        score -= Math.round((input.irrigationWaterSalinityECw - variety.salinityToleranceECw) * 10);
      } else if (input.irrigationWaterSalinityECw >= 2.5 && variety.salinityToleranceECw >= 3.5) {
        score += 14;
      }
    }

    // -----------------------------------------------------------------------
    // 6. Atmospheric Relative Humidity & Foliar Disease Defenses
    // -----------------------------------------------------------------------
    if (avgRh >= 70 || (climate.highHumidityDaysCount ?? 0) >= 25) {
      // High humidity pressure: award varieties with documented fungal resistances
      if (variety.diseaseResistanceEn.length > 0) {
        score += 15;
        const diseaseSummaryEn = variety.diseaseResistanceEn[0].toLowerCase();
        const diseaseSummaryAr = variety.diseaseResistanceAr[0];
        stressPositivesEn.push(diseaseSummaryEn);
        stressPositivesAr.push(diseaseSummaryAr);
      }
    } else if (avgRh <= 45 && variety.droughtTolerance === 'high') {
      // Arid atmosphere: award drought-tolerant varieties
      score += 10;
      stressPositivesEn.push('strong drought endurance');
      stressPositivesAr.push('صمود قوي للجفاف');
    }

    // -----------------------------------------------------------------------
    // 7. Water Availability & Cycle Duration
    // -----------------------------------------------------------------------
    if (input.irrigationAvailability === 'low') {
      if (variety.droughtTolerance === 'high' || variety.maturityClass === 'early') {
        score += 15;
        stressPositivesEn.push('low irrigation footprint and drought avoidance');
        stressPositivesAr.push('ترشيد مياه الري وتفادي الإجهاد المائي');
      } else if (variety.droughtTolerance === 'low') {
        score -= 20;
      }
    }

    // Upper Egypt specific adaptation bonus
    if (geography.isEgyptUpperNile && variety.countryOfOrigin.includes('Sohag')) {
      score += 15;
    }

    const varietyPositivesEn = [...stressPositivesEn, ...contextPositivesEn];
    const varietyPositivesAr = [...stressPositivesAr, ...contextPositivesAr];

    if (score > highestScore) {
      highestScore = score;
      bestVariety = variety;
      bestPositives = varietyPositivesEn;
      bestPositivesAr = varietyPositivesAr;
      bestIsLocallyRegistered = isLocallyRegistered;
    }
  }

  // -------------------------------------------------------------------------
  // Minimum Evidence Threshold
  // If no variety reaches a reliable threshold, return null (transparent non-recommendation)
  // -------------------------------------------------------------------------
  const MIN_EVIDENCE_SCORE_THRESHOLD = 35;
  if (!bestVariety || highestScore < MIN_EVIDENCE_SCORE_THRESHOLD) {
    return null;
  }

  // Build concise 1-2 sentence tailored natural language explanations
  const selectedReasonsEn = bestPositives.slice(0, 3).join(', ');
  const selectedReasonsAr = bestPositivesAr.slice(0, 3).join('، ');

  const explanationEn = selectedReasonsEn.length > 0
    ? `Selected by Galaxy Planters for your farm conditions due to its ${selectedReasonsEn}.`
    : `Selected by Galaxy Planters for its optimal climate, soil, and seasonal compatibility with your farm location.`;

  const explanationAr = selectedReasonsAr.length > 0
    ? `تم اختياره لمزرعتك لتميزه بـ ${selectedReasonsAr}، بما يوافق الظروف المناخية ونوع التربة في موقعك.`
    : `تم اختياره لتوافقه التام مع الظروف المناخية ونوع التربة ومواعيد الزراعة في موقعك.`;

  return {
    varietyName: bestVariety.nameEn,
    varietyNameAr: bestVariety.nameAr,
    breedingInstitute: bestVariety.breedingInstitute,
    releaseYear: bestVariety.releaseYear,
    countryOfOrigin: bestVariety.countryOfOrigin,
    registrationStatus: bestVariety.registrationStatus,
    explanationEn,
    explanationAr,
    suitabilityScore: Math.min(100, Math.max(10, highestScore)),
    confidenceLevel: highestScore >= 75 ? 'high' : highestScore >= 55 ? 'medium' : 'low',
    isLocallyRegistered: bestIsLocallyRegistered,
    evidenceSupported: true
  };
}
