import type { SoilData, SoilType } from '../types';

export interface SoilTextureBenchmark {
  soilType: SoilType;
  labelEn: string;
  labelAr: string;
  typicalPh: number;
  typicalOrganicMatterPct: number;
  clayPct: number;
  sandPct: number;
  cationExchangeCapacity: string;
  descriptionEn: string;
  descriptionAr: string;
}

// Global USDA / FAO standard soil texture model (used only when live spatial query is unreachable)
export const GLOBAL_SOIL_TEXTURE_PROFILES: Record<SoilType, SoilTextureBenchmark> = {
  clay_loam: {
    soilType: 'clay_loam',
    labelEn: 'Clay Loam (Moderate-Heavy Agricultural Texture)',
    labelAr: 'طميية طينية (قوام زراعي متوسط إلى ثقيل)',
    typicalPh: 6.8,
    typicalOrganicMatterPct: 2.1,
    clayPct: 32,
    sandPct: 34,
    cationExchangeCapacity: '25-35 cmol+/kg (High nutrient retention)',
    descriptionEn: 'Balanced agricultural texture with strong water holding capacity and good nutrient exchange. Widely distributed across temperate, river basin, and alluvial agricultural plains worldwide.',
    descriptionAr: 'قوام زراعي متوازن ذو قدرة جيدة على الاحتفاظ بالماء والعناصر الغذائية، شائع في السهول النهرية والزراعية حول العالم.'
  },
  sandy_loam: {
    soilType: 'sandy_loam',
    labelEn: 'Sandy Loam (Light-Medium Well-Drained Soil)',
    labelAr: 'طميية رملية (تربة خفيفة إلى متوسطة جيدة الصرف)',
    typicalPh: 6.6,
    typicalOrganicMatterPct: 1.4,
    clayPct: 14,
    sandPct: 65,
    cationExchangeCapacity: '10-18 cmol+/kg (Medium)',
    descriptionEn: 'Freely draining, easily tilled soil that warms quickly in spring. Highly responsive to drip fertigation, common in semi-arid fringes and alluvial terraces.',
    descriptionAr: 'تربة جيدة الصرف وسهلة الحراثة وتدفأ سريعاً في الربيع، ملائمة للري بالتنقيط وتنتشر في الأراضي المستصلحة والشرفات الرسوبية.'
  },
  silty_clay: {
    soilType: 'silty_clay',
    labelEn: 'Silty Clay (Heavy Alluvial / Basin Soil)',
    labelAr: 'طميية سلتية ثقيلة (تربة حوضية رسوبية)',
    typicalPh: 6.9,
    typicalOrganicMatterPct: 2.4,
    clayPct: 44,
    sandPct: 10,
    cationExchangeCapacity: '35-48 cmol+/kg (Very High)',
    descriptionEn: 'Fine-textured heavy soil with superior moisture retention and mineral fertility. Prone to waterlogging and compaction if worked wet; benefits from deep taproot break crops.',
    descriptionAr: 'تربة ناعمة ثقيلة ذات خصوبة معدنية وقدرة عالية على حفظ الرطوبة، عرضة للانضغاط وتستفيد من المحاصيل وتدية الجذور.'
  },
  sandy: {
    soilType: 'sandy',
    labelEn: 'Coarse Sand / Aeolian Soil',
    labelAr: 'تربة رملية خشنة (أراضي صحراوية وكثبان)',
    typicalPh: 6.5,
    typicalOrganicMatterPct: 0.6,
    clayPct: 5,
    sandPct: 90,
    cationExchangeCapacity: '4-8 cmol+/kg (Low)',
    descriptionEn: 'Rapidly permeable coarse sand with low chemical buffering and low organic reserves. Requires frequent split water applications and active organic matter building.',
    descriptionAr: 'رمال خشنة سريعة النفاذية ذات مخزون عضوي منخفض، تتطلب رياً مجزءاً متقارباً وإضافة مستمرة للمادة العضوية والكمبوست.'
  },
  calcareous: {
    soilType: 'calcareous',
    labelEn: 'Calcareous / Limestone-Rich Soil (CaCO3 > 15%)',
    labelAr: 'تربة جيرية كلسية (غنية بكربونات الكالسيوم)',
    typicalPh: 7.9,
    typicalOrganicMatterPct: 1.1,
    clayPct: 20,
    sandPct: 48,
    cationExchangeCapacity: '15-22 cmol+/kg',
    descriptionEn: 'Soils developed over limestone and calcareous parent materials (Mediterranean, Middle East, SW US). Moderately alkaline; tends to fix phosphorus and micronutrients.',
    descriptionAr: 'تربة متطورة على صخور جيرية (حوض البحر المتوسط، الشرق الأوسط، والمناطق شبه الجافة). قلوية وتثبت الفوسفور والعناصر الصغرى.'
  }
};

// Egyptian SWRI benchmarks (only used as regional baseline within Egypt)
export const EGYPT_SWRI_BENCHMARKS: Record<SoilType, { ph: number; om: number }> = {
  clay_loam: { ph: 7.9, om: 1.2 },
  sandy_loam: { ph: 8.1, om: 0.5 },
  silty_clay: { ph: 7.8, om: 1.4 },
  sandy: { ph: 8.3, om: 0.2 },
  calcareous: { ph: 8.2, om: 0.4 }
};

function isEgyptianTerritory(lat: number, lon: number): boolean {
  return lat >= 22.0 && lat <= 31.8 && lon >= 24.8 && lon <= 36.9;
}

/**
 * Classifies soil texture according to the standard USDA Soil Texture Triangle
 * from clay, sand, and silt percentages.
 */
export function classifyUsdaTexture(clayPct: number, sandPct: number, siltPct: number): SoilType {
  if (sandPct >= 85 && (siltPct + 1.5 * clayPct) < 15) return 'sandy';
  if (clayPct >= 35 && siltPct >= 40) return 'silty_clay';
  if (clayPct >= 27 && clayPct <= 40 && sandPct >= 20 && sandPct <= 45) return 'clay_loam';
  if (sandPct >= 43 && clayPct < 20) return 'sandy_loam';
  if (clayPct >= 40) return 'silty_clay';
  return 'clay_loam';
}

/**
 * Retrieves soil properties with strict data provenance:
 * 1. User manual field measurements take highest priority.
 * 2. Live ISRIC SoilGrids REST API (v2.0 global coverage 250m resolution).
 *    - Correct properties: phh2o (pH*10), soc (dg/kg), clay (g/kg), sand (g/kg), silt (g/kg)
 *    - Correct depth interval weighting across rootzone (0-30 cm)
 *    - SOM% = (SOC dg/kg / 100) * 1.724 (van Bemmelen factor)
 *    - Salinity (ECe) is acknowledged as NOT provided by SoilGrids and marked accordingly.
 * 3. Transparent fallback:
 *    - SWRI benchmark if strictly in Egypt.
 *    - Standard USDA global soil texture classification if international.
 * Never labels fallback benchmarks as live SoilGrids measurements.
 */
export async function fetchSoilData(
  lat: number,
  lon: number,
  selectedSoilType: SoilType,
  userPh?: number,
  userOm?: number,
  userEC?: number
): Promise<SoilData> {
  // If user provided complete field measurements, respect them with highest priority
  if (userPh !== undefined && userOm !== undefined) {
    return {
      soilType: selectedSoilType,
      ph: userPh,
      organicMatterPct: userOm,
      salinityEC: userEC,
      source: 'user_specified',
      phSource: 'user_specified',
      omSource: 'user_specified',
      salinitySource: userEC !== undefined ? 'user_specified' : 'unavailable',
      textureSource: 'user_selected',
      uncertaintyLevel: 'low'
    };
  }

  // Attempt live ISRIC SoilGrids REST API v2.0 query
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 5000);

  try {
    const url = `https://rest.isric.org/soilgrids/v2.0/properties/query?lat=${lat.toFixed(4)}&lon=${lon.toFixed(4)}&property=phh2o&property=soc&property=clay&property=sand&property=silt&depth=0-5cm&depth=5-15cm&depth=15-30cm&value=mean`;
    const response = await fetch(url, {
      signal: controller.signal,
      headers: { 'Accept': 'application/json' }
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const layers = data?.properties?.layers;

      if (Array.isArray(layers) && layers.length > 0) {
        // Helper to compute depth-weighted average across 0-5cm (wt=5), 5-15cm (wt=10), 15-30cm (wt=15)
        const getWeightedMean = (propName: string): number | null => {
          const layer = layers.find((l: any) => l.name === propName);
          if (!layer || !Array.isArray(layer.depths)) return null;

          let totalWeighted = 0;
          let totalDepth = 0;

          for (const d of layer.depths) {
            const meanVal = d.values?.mean;
            if (meanVal === undefined || meanVal === null || meanVal <= 0) continue;

            const top = d.range?.top_depth ?? 0;
            const bottom = d.range?.bottom_depth ?? (top + 10);
            const thickness = Math.max(1, bottom - top);

            totalWeighted += meanVal * thickness;
            totalDepth += thickness;
          }

          return totalDepth > 0 ? totalWeighted / totalDepth : null;
        };

        const rawPh = getWeightedMean('phh2o');
        const rawSoc = getWeightedMean('soc');
        const rawClay = getWeightedMean('clay');
        const rawSand = getWeightedMean('sand');
        const rawSilt = getWeightedMean('silt');

        let parsedPh: number | undefined = undefined;
        let parsedOm: number | undefined = undefined;
        let clayPct: number | undefined = undefined;
        let sandPct: number | undefined = undefined;
        let siltPct: number | undefined = undefined;

        if (rawPh !== null && rawPh > 0) {
          // SoilGrids phh2o is in pH * 10
          parsedPh = Number((rawPh / 10).toFixed(1));
        }

        if (rawSoc !== null && rawSoc > 0) {
          // SOC is dg/kg (decigram/kg = 0.1 g/kg = 0.01%). SOM% = (SOC / 100) * 1.724
          parsedOm = Number(((rawSoc / 100) * 1.724).toFixed(2));
        }

        if (rawClay !== null && rawSand !== null && rawSilt !== null) {
          clayPct = Number((rawClay / 10).toFixed(1));
          sandPct = Number((rawSand / 10).toFixed(1));
          siltPct = Number((rawSilt / 10).toFixed(1));
        }

        if (parsedPh !== undefined || parsedOm !== undefined) {
          const derivedTexture = (clayPct !== undefined && sandPct !== undefined && siltPct !== undefined)
            ? classifyUsdaTexture(clayPct, sandPct, siltPct)
            : selectedSoilType;

          return {
            soilType: selectedSoilType || derivedTexture,
            ph: userPh ?? (parsedPh ?? 7.0),
            organicMatterPct: userOm ?? (parsedOm ?? 1.5),
            salinityEC: userEC, // SoilGrids does NOT provide ECe; retain user measurement or undefined
            source: 'soilgrids_live',
            phSource: userPh !== undefined ? 'user_specified' : (parsedPh !== undefined ? 'soilgrids_live' : 'global_usda_texture_model'),
            omSource: userOm !== undefined ? 'user_specified' : (parsedOm !== undefined ? 'soilgrids_live' : 'global_usda_texture_model'),
            salinitySource: userEC !== undefined ? 'user_specified' : 'unavailable',
            textureSource: 'user_selected',
            clayPercent: clayPct,
            sandPercent: sandPct,
            siltPercent: siltPct,
            uncertaintyLevel: 'low'
          };
        }
      }
    }
  } catch (_e) {
    clearTimeout(timeoutId);
    // SoilGrids live query timed out or unreachable
  }

  // Fallback branch with clear provenance distinction
  const inEgypt = isEgyptianTerritory(lat, lon);

  if (inEgypt) {
    const swri = EGYPT_SWRI_BENCHMARKS[selectedSoilType] || EGYPT_SWRI_BENCHMARKS.clay_loam;
    return {
      soilType: selectedSoilType,
      ph: userPh ?? swri.ph,
      organicMatterPct: userOm ?? swri.om,
      salinityEC: userEC,
      source: 'regional_swri_benchmark',
      phSource: userPh !== undefined ? 'user_specified' : 'regional_swri_benchmark',
      omSource: userOm !== undefined ? 'user_specified' : 'regional_swri_benchmark',
      salinitySource: userEC !== undefined ? 'user_specified' : 'unavailable',
      textureSource: 'user_selected',
      uncertaintyLevel: 'moderate'
    };
  } else {
    // International location: Use Global USDA texture classification
    const usda = GLOBAL_SOIL_TEXTURE_PROFILES[selectedSoilType] || GLOBAL_SOIL_TEXTURE_PROFILES.clay_loam;
    return {
      soilType: selectedSoilType,
      ph: userPh ?? usda.typicalPh,
      organicMatterPct: userOm ?? usda.typicalOrganicMatterPct,
      salinityEC: userEC,
      source: 'global_usda_texture_model',
      phSource: userPh !== undefined ? 'user_specified' : 'global_usda_texture_model',
      omSource: userOm !== undefined ? 'user_specified' : 'global_usda_texture_model',
      salinitySource: userEC !== undefined ? 'user_specified' : 'unavailable',
      textureSource: 'user_selected',
      uncertaintyLevel: 'moderate'
    };
  }
}
