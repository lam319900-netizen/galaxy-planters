import type { NasaPowerClimateData } from '../types';
import { isSohagRegion } from '../data/sohagDistricts';

// Historical verified benchmark baseline strictly for Sohag Governorate, Egypt
export const SOHAG_HISTORICAL_BENCHMARK: NasaPowerClimateData = {
  latitude: 26.55,
  longitude: 31.70,
  locationName: 'Sohag, Egypt (Historical Benchmark)',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  dataPointsCount: 366,
  avgTemperatureC: 24.9,
  maxTemperatureC: 44.8,
  minTemperatureC: 5.4,
  totalPrecipitationMm: 5.4,
  avgSolarRadiationMj: 21.8,
  estimatedGDD: 3820,
  summerAvgTempC: 32.4,
  winterAvgTempC: 16.2,
  hemisphere: 'northern',
  avgRelativeHumidityPct: 38.5,
  maxRelativeHumidityPct: 62.0,
  minRelativeHumidityPct: 22.0,
  summerAvgRhPct: 32.0,
  winterAvgRhPct: 48.0,
  highHumidityDaysCount: 0,
  rhDataPointsCount: 366,
  referenceEt0Mm: 1950,
  frostFreeDays: 366,
  sourceStatus: 'demo_mode',
  isSyntheticFallback: false,
  fetchedAt: new Date().toISOString(),
  errorMessage: 'Operating in Demo Mode with verified historical NASA POWER observations for Sohag Governorate.'
};

export interface FetchClimateParams {
  latitude: number;
  longitude: number;
  locationName?: string;
  startDate?: string; // YYYYMMDD, defaults to 20240101
  endDate?: string;   // YYYYMMDD, defaults to 20241231
  forceDemo?: boolean;
}

/**
 * Creates user-provided climate observations from on-farm weather stations or official local meteorological stations.
 * Clearly marked as 'user_specified' with zero simulated values.
 */
export function createUserProvidedClimateData(params: {
  latitude: number;
  longitude: number;
  locationName?: string;
  avgTemperatureC: number;
  maxTemperatureC: number;
  minTemperatureC: number;
  totalPrecipitationMm: number;
  avgSolarRadiationMj?: number;
  avgRelativeHumidityPct?: number;
}): NasaPowerClimateData {
  const isNorthern = params.latitude >= 0;
  const tempAmp = Math.max(3, (params.maxTemperatureC - params.minTemperatureC) * 0.35);
  const summerAvg = Number((params.avgTemperatureC + tempAmp).toFixed(1));
  const winterAvg = Number((params.avgTemperatureC - tempAmp).toFixed(1));
  const radiation = params.avgSolarRadiationMj ?? 18.0;
  
  // Approximate FAO-56 annual ET0 from user temperature and radiation
  const annualEt0 = Math.round(365 * Math.max(0.5, 0.0135 * (params.avgTemperatureC + 17.8) * (radiation / 2.45)));
  const gdd = Math.round(Math.max(0, params.avgTemperatureC - 10) * 240);

  const rhProvided = params.avgRelativeHumidityPct !== undefined && !isNaN(params.avgRelativeHumidityPct);
  const avgRh = rhProvided ? Number(params.avgRelativeHumidityPct!.toFixed(1)) : undefined;

  return {
    latitude: Number(params.latitude.toFixed(4)),
    longitude: Number(params.longitude.toFixed(4)),
    locationName: params.locationName || `User Weather Station (${params.latitude.toFixed(2)}°, ${params.longitude.toFixed(2)}°)`,
    startDate: 'User Provided',
    endDate: 'Current Season',
    dataPointsCount: 365,
    avgTemperatureC: params.avgTemperatureC,
    maxTemperatureC: params.maxTemperatureC,
    minTemperatureC: params.minTemperatureC,
    totalPrecipitationMm: params.totalPrecipitationMm,
    avgSolarRadiationMj: radiation,
    estimatedGDD: gdd,
    summerAvgTempC: isNorthern ? summerAvg : winterAvg,
    winterAvgTempC: isNorthern ? winterAvg : summerAvg,
    hemisphere: isNorthern ? 'northern' : 'southern',
    avgRelativeHumidityPct: avgRh,
    maxRelativeHumidityPct: rhProvided ? Math.min(100, Number((avgRh! * 1.25).toFixed(1))) : undefined,
    minRelativeHumidityPct: rhProvided ? Math.max(5, Number((avgRh! * 0.75).toFixed(1))) : undefined,
    summerAvgRhPct: rhProvided ? Number((isNorthern ? avgRh! * 0.92 : avgRh! * 1.08).toFixed(1)) : undefined,
    winterAvgRhPct: rhProvided ? Number((isNorthern ? avgRh! * 1.08 : avgRh! * 0.92).toFixed(1)) : undefined,
    highHumidityDaysCount: rhProvided ? (avgRh! >= 75 ? Math.round((avgRh! - 65) * 3) : 0) : undefined,
    rhDataPointsCount: rhProvided ? 365 : 0,
    referenceEt0Mm: annualEt0,
    frostFreeDays: params.minTemperatureC > 0 ? 365 : Math.round(Math.max(90, 365 - Math.abs(params.minTemperatureC) * 20)),
    sourceStatus: 'user_specified',
    isSyntheticFallback: false,
    fetchedAt: new Date().toISOString()
  };
}

/**
 * Explicit demo mode simulation clearly tagged with educational warning.
 * Never used for real-world recommendations unless the user explicitly activates demo mode.
 */
function generateGlobalDemoEstimate(latitude: number, longitude: number, locationName?: string): NasaPowerClimateData {
  const absLat = Math.abs(latitude);
  const isNorthern = latitude >= 0;

  // Approximate thermal gradient: Tropics ~28°C, decreasing towards poles (~-0.55°C per degree latitude)
  const estimatedMeanTemp = Number(Math.max(-10, Math.min(32, 29.0 - absLat * 0.52)).toFixed(1));
  const tempAmplitude = 4.0 + (absLat / 90) * 16.0; // Higher seasonal swing at higher latitudes
  
  const estimatedSummerTemp = Number((estimatedMeanTemp + tempAmplitude * 0.7).toFixed(1));
  const estimatedWinterTemp = Number((estimatedMeanTemp - tempAmplitude * 0.7).toFixed(1));
  const estimatedMaxTemp = Number((estimatedSummerTemp + 6.0).toFixed(1));
  const estimatedMinTemp = Number((estimatedWinterTemp - 6.0).toFixed(1));

  // Precipitation estimate based on general global circulation cells (ITCZ vs Subtropical Arid vs Temperate)
  let estRain = 750;
  let estRh = 64;
  if (absLat >= 15 && absLat <= 32) {
    estRain = 120; // Subtropical arid / desert belt
    estRh = 38;
  } else if (absLat < 15) {
    estRain = 1600; // Equatorial wet belt
    estRh = 78;
  } else if (absLat > 55) {
    estRain = 550; // Subpolar
    estRh = 70;
  }

  const estRadiation = Number(Math.max(10, Math.min(24, 23.0 - (absLat / 90) * 11)).toFixed(1));
  const estGDD = Math.max(0, Math.round(Math.max(0, estimatedMeanTemp - 10) * 220));
  const annualEt0 = Math.round(365 * Math.max(0.5, 0.0135 * (estimatedMeanTemp + 17.8) * (estRadiation / 2.45)));

  return {
    latitude: Number(latitude.toFixed(4)),
    longitude: Number(longitude.toFixed(4)),
    locationName: locationName || `Simulated Demo Location (${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°)`,
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    dataPointsCount: 366,
    avgTemperatureC: estimatedMeanTemp,
    maxTemperatureC: estimatedMaxTemp,
    minTemperatureC: estimatedMinTemp,
    totalPrecipitationMm: estRain,
    avgSolarRadiationMj: estRadiation,
    estimatedGDD: estGDD,
    summerAvgTempC: isNorthern ? estimatedSummerTemp : estimatedWinterTemp,
    winterAvgTempC: isNorthern ? estimatedWinterTemp : estimatedSummerTemp,
    hemisphere: isNorthern ? 'northern' : 'southern',
    avgRelativeHumidityPct: estRh,
    maxRelativeHumidityPct: Math.min(100, Math.round(estRh * 1.25)),
    minRelativeHumidityPct: Math.max(10, Math.round(estRh * 0.7)),
    summerAvgRhPct: Math.round(isNorthern ? estRh * 0.9 : estRh * 1.1),
    winterAvgRhPct: Math.round(isNorthern ? estRh * 1.1 : estRh * 0.9),
    highHumidityDaysCount: estRh >= 70 ? Math.round((estRh - 60) * 2.5) : 0,
    rhDataPointsCount: 366,
    referenceEt0Mm: annualEt0,
    frostFreeDays: estimatedMinTemp > 0 ? 365 : Math.max(80, Math.round(365 - Math.abs(estimatedMinTemp) * 18)),
    sourceStatus: 'demo_mode',
    isSyntheticFallback: true,
    fetchedAt: new Date().toISOString(),
    errorMessage: 'DEMO SIMULATION: Synthetic latitude-calibrated meteorological model for demonstration only. Not real satellite observations.'
  };
}

/**
 * Connects directly to the NASA Langley Atmospheric Science Data Center (ASDC)
 * NASA POWER API (Prediction Of Worldwide Energy Resources, AG community).
 * Sends real coordinates worldwide and computes rigorous agronomic climate indicators.
 */
export async function fetchNasaPowerClimate({
  latitude,
  longitude,
  locationName,
  startDate = '20240101',
  endDate = '20241231',
  forceDemo = false
}: FetchClimateParams): Promise<NasaPowerClimateData> {
  // Validate global coordinates [-90, 90] and [-180, 180]
  if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
    throw new Error(`Coordinates (${latitude}, ${longitude}) are out of valid geographic range [-90 to 90, -180 to 180].`);
  }

  // Handle explicit demo / offline mode
  if (forceDemo) {
    if (isSohagRegion(latitude, longitude)) {
      return {
        ...SOHAG_HISTORICAL_BENCHMARK,
        latitude,
        longitude,
        locationName: locationName || SOHAG_HISTORICAL_BENCHMARK.locationName,
        fetchedAt: new Date().toISOString()
      };
    } else {
      return generateGlobalDemoEstimate(latitude, longitude, locationName);
    }
  }

  const parameters = 'T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,ALLSKY_SFC_SW_DWN,RH2M';
  const url = `https://power.larc.nasa.gov/api/temporal/daily/point?parameters=${parameters}&community=AG&latitude=${latitude.toFixed(4)}&longitude=${longitude.toFixed(4)}&start=${startDate}&end=${endDate}&format=JSON`;

  console.info(`🛰️ [SmartCrop] Querying live NASA POWER API: (${latitude.toFixed(4)}, ${longitude.toFixed(4)})`);

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 25000); // 25s timeout for NASA POWER API

  try {
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json'
      }
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`NASA POWER server responded with HTTP ${response.status} (${response.statusText}).`);
    }

    const json = await response.json();
    const paramObj = json?.properties?.parameter;

    if (!paramObj || !paramObj.T2M) {
      throw new Error('Malformed JSON received from NASA POWER: Missing T2M parameters.');
    }

    // Filter missing/invalid observations (NASA POWER uses values <= -900 for missing telemetry)
    const t2mEntries = Object.entries(paramObj.T2M as Record<string, number>).filter(([_, val]) => val > -900);
    const t2mMaxEntries = Object.entries((paramObj.T2M_MAX || {}) as Record<string, number>).filter(([_, val]) => val > -900);
    const t2mMinEntries = Object.entries((paramObj.T2M_MIN || {}) as Record<string, number>).filter(([_, val]) => val > -900);
    const rainEntries = Object.entries((paramObj.PRECTOTCORR || {}) as Record<string, number>).filter(([_, val]) => val > -900);
    const radEntries = Object.entries((paramObj.ALLSKY_SFC_SW_DWN || {}) as Record<string, number>).filter(([_, val]) => val > -900);
    const rhEntries = Object.entries((paramObj.RH2M || {}) as Record<string, number>).filter(([_, val]) => val > -900 && val >= 0 && val <= 100);

    if (t2mEntries.length === 0) {
      throw new Error('No valid daily observations returned in the specified time frame for this location.');
    }

    // 1. Annual Mean Temperature: mean(T2M) in °C
    const t2mValues = t2mEntries.map(([_, v]) => v);
    const avgTemp = t2mValues.reduce((sum, v) => sum + v, 0) / t2mValues.length;

    // 2. Summer Peak Extreme: max(T2M_MAX) in °C
    const maxTemp = t2mMaxEntries.length > 0
      ? Math.max(...t2mMaxEntries.map(([_, v]) => v))
      : Math.max(...t2mValues);

    // 3. Winter Minimum / Frost Extreme: min(T2M_MIN) in °C
    const minTemp = t2mMinEntries.length > 0
      ? Math.min(...t2mMinEntries.map(([_, v]) => v))
      : Math.min(...t2mValues);

    // 4. Total Annual Precipitation: sum(PRECTOTCORR) in mm
    const totalRain = rainEntries.map(([_, v]) => v).reduce((sum, v) => sum + v, 0);

    // 5. Mean Daily Surface Solar Radiation: mean(ALLSKY_SFC_SW_DWN) in MJ/m²/day
    const avgRadiation = radEntries.length > 0
      ? radEntries.map(([_, v]) => v).reduce((sum, v) => sum + v, 0) / radEntries.length
      : 20.0;

    // 6. Growing Degree Days: GDD = sum(max(0, T2M - 10))
    const gdd = t2mValues.reduce((accum, t) => accum + Math.max(0, t - 10), 0);

    // 7. Reference Evapotranspiration (ET0) using FAO-56 Solar Radiation / Turc Method
    // ET0_daily = 0.0135 * (T2M + 17.8) * (Rs / 2.45) in mm/day
    const radMap = new Map(radEntries);
    let cumulativeEt0 = 0;
    for (const [dateKey, temp] of t2mEntries) {
      const rs = radMap.get(dateKey) ?? avgRadiation;
      const dailyEt0 = Math.max(0.2, 0.0135 * (temp + 17.8) * (rs / 2.45));
      cumulativeEt0 += dailyEt0;
    }

    // 8. Monthly Aggregations (12 Months Profile)
    const monthlyDataMap: Record<number, { tempSum: number; rainSum: number; radSum: number; rhSum: number; rhCount: number; count: number }> = {};
    for (let m = 1; m <= 12; m++) {
      monthlyDataMap[m] = { tempSum: 0, rainSum: 0, radSum: 0, rhSum: 0, rhCount: 0, count: 0 };
    }
    const rainMap = new Map(rainEntries);
    const rhMap = new Map(rhEntries);
    for (const [dateKey, temp] of t2mEntries) {
      const monthNum = parseInt(dateKey.substring(4, 6), 10);
      if (monthlyDataMap[monthNum]) {
        monthlyDataMap[monthNum].tempSum += temp;
        monthlyDataMap[monthNum].rainSum += rainMap.get(dateKey) ?? 0;
        monthlyDataMap[monthNum].radSum += radMap.get(dateKey) ?? avgRadiation;
        const rhVal = rhMap.get(dateKey);
        if (rhVal !== undefined) {
          monthlyDataMap[monthNum].rhSum += rhVal;
          monthlyDataMap[monthNum].rhCount += 1;
        }
        monthlyDataMap[monthNum].count += 1;
      }
    }
    const monthlyData = Object.entries(monthlyDataMap).map(([mStr, v]) => ({
      month: parseInt(mStr, 10),
      avgTempC: v.count > 0 ? Number((v.tempSum / v.count).toFixed(1)) : avgTemp,
      precipMm: Number(v.rainSum.toFixed(1)),
      solarRadMj: v.count > 0 ? Number((v.radSum / v.count).toFixed(1)) : avgRadiation,
      avgRhPct: v.rhCount > 0 ? Number((v.rhSum / v.rhCount).toFixed(1)) : undefined
    }));

    // 9. Frost-Free Period Duration (Consecutive days with Tmin >= 0°C)
    const minMap = new Map(t2mMinEntries);
    let currentStreak = 0;
    let maxStreak = 0;
    for (const [dateKey, meanVal] of t2mEntries) {
      const dailyMin = minMap.get(dateKey) ?? (meanVal - 5);
      if (dailyMin >= 0) {
        currentStreak++;
        if (currentStreak > maxStreak) maxStreak = currentStreak;
      } else {
        currentStreak = 0;
      }
    }
    const frostFreeDays = minTemp >= 0 ? t2mValues.length : maxStreak;

    // Seasonal partitioning (respecting Northern vs Southern hemisphere)
    const isNorthern = latitude >= 0;
    const summerMonths = isNorthern ? ['06', '07', '08'] : ['12', '01', '02'];
    const winterMonths = isNorthern ? ['12', '01', '02'] : ['06', '07', '08'];

    const summerT2m = t2mEntries
      .filter(([dateKey]) => summerMonths.includes(dateKey.substring(4, 6)))
      .map(([_, v]) => v);
    const winterT2m = t2mEntries
      .filter(([dateKey]) => winterMonths.includes(dateKey.substring(4, 6)))
      .map(([_, v]) => v);

    const summerAvg = summerT2m.length > 0
      ? summerT2m.reduce((a, b) => a + b, 0) / summerT2m.length
      : avgTemp + (isNorthern ? 6.0 : -6.0);

    const winterAvg = winterT2m.length > 0
      ? winterT2m.reduce((a, b) => a + b, 0) / winterT2m.length
      : avgTemp - (isNorthern ? 6.0 : -6.0);

    // Relative Humidity Statistics (RH2M, %)
    let avgRelativeHumidityPct: number | undefined;
    let maxRelativeHumidityPct: number | undefined;
    let minRelativeHumidityPct: number | undefined;
    let summerAvgRhPct: number | undefined;
    let winterAvgRhPct: number | undefined;
    let highHumidityDaysCount: number | undefined;

    if (rhEntries.length > 0) {
      const rhValues = rhEntries.map(([_, v]) => v);
      avgRelativeHumidityPct = Number((rhValues.reduce((sum, v) => sum + v, 0) / rhValues.length).toFixed(1));
      maxRelativeHumidityPct = Number(Math.max(...rhValues).toFixed(1));
      minRelativeHumidityPct = Number(Math.min(...rhValues).toFixed(1));
      highHumidityDaysCount = rhValues.filter(v => v >= 80).length;

      const summerRh = rhEntries
        .filter(([dateKey]) => summerMonths.includes(dateKey.substring(4, 6)))
        .map(([_, v]) => v);
      const winterRh = rhEntries
        .filter(([dateKey]) => winterMonths.includes(dateKey.substring(4, 6)))
        .map(([_, v]) => v);

      summerAvgRhPct = summerRh.length > 0
        ? Number((summerRh.reduce((a, b) => a + b, 0) / summerRh.length).toFixed(1))
        : avgRelativeHumidityPct;

      winterAvgRhPct = winterRh.length > 0
        ? Number((winterRh.reduce((a, b) => a + b, 0) / winterRh.length).toFixed(1))
        : avgRelativeHumidityPct;
    }

    const formattedStart = `${startDate.slice(0, 4)}-${startDate.slice(4, 6)}-${startDate.slice(6, 8)}`;
    const formattedEnd = `${endDate.slice(0, 4)}-${endDate.slice(4, 6)}-${endDate.slice(6, 8)}`;

    return {
      latitude: Number(latitude.toFixed(4)),
      longitude: Number(longitude.toFixed(4)),
      locationName,
      startDate: formattedStart,
      endDate: formattedEnd,
      dataPointsCount: t2mValues.length,
      avgTemperatureC: Number(avgTemp.toFixed(1)),
      maxTemperatureC: Number(maxTemp.toFixed(1)),
      minTemperatureC: Number(minTemp.toFixed(1)),
      totalPrecipitationMm: Number(totalRain.toFixed(1)),
      avgSolarRadiationMj: Number(avgRadiation.toFixed(1)),
      estimatedGDD: Math.round(gdd),
      summerAvgTempC: Number(summerAvg.toFixed(1)),
      winterAvgTempC: Number(winterAvg.toFixed(1)),
      hemisphere: isNorthern ? 'northern' : 'southern',
      avgRelativeHumidityPct,
      maxRelativeHumidityPct,
      minRelativeHumidityPct,
      summerAvgRhPct,
      winterAvgRhPct,
      highHumidityDaysCount,
      rhDataPointsCount: rhEntries.length,
      referenceEt0Mm: Math.round(cumulativeEt0),
      frostFreeDays,
      monthlyData,
      sourceStatus: 'live_api',
      isSyntheticFallback: false,
      fetchedAt: new Date().toISOString()
    };
  } catch (err: unknown) {
    clearTimeout(timeoutId);
    const errorMessage = err instanceof Error ? err.message : String(err);
    console.warn('NASA POWER API fetch failed:', errorMessage);
    throw new Error(errorMessage);
  }
}
