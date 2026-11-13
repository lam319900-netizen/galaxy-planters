import { generateRotationPlans, getPriorityWeights } from './services/recommendationEngine';
import type { FarmAssessmentInput, NasaPowerClimateData, SoilData } from './types';

// ==========================================
// SCENARIO A: Upper Egypt (Sohag / Desert Margin)
// Hot, Arid, Max 45.2°C, Rain 5.4mm, Sandy Loam, Low Irrigation
// ==========================================
const inputA: FarmAssessmentInput = {
  districtId: 'custom_global',
  locationName: 'Upper Egypt Desert Margin',
  latitude: 26.55,
  longitude: 31.70,
  soilType: 'sandy_loam',
  soilPh: 8.2,
  organicMatterPct: 0.6,
  irrigationAvailability: 'low',
  farmerPriority: 'water_conservation',
  previousCrop: 'fallow'
};

const climateA: NasaPowerClimateData = {
  latitude: 26.55,
  longitude: 31.70,
  hemisphere: 'northern',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  dataPointsCount: 366,
  avgTemperatureC: 25.0,
  maxTemperatureC: 45.2,
  minTemperatureC: 5.5,
  totalPrecipitationMm: 5.4,
  avgSolarRadiationMj: 22.0,
  estimatedGDD: 3850,
  summerAvgTempC: 33.0,
  winterAvgTempC: 16.0,
  sourceStatus: 'live_api',
  fetchedAt: new Date().toISOString()
};

const soilA: SoilData = {
  soilType: 'sandy_loam',
  ph: 8.2,
  organicMatterPct: 0.6,
  source: 'user_specified',
  uncertaintyLevel: 'low'
};

// ==========================================
// SCENARIO B: Northern Europe (Germany / Denmark / UK, 52°N)
// Cold Winter (-8°C), Max 28°C, Rain 750mm, Clay Loam, High Irrigation
// ==========================================
const inputB: FarmAssessmentInput = {
  districtId: 'custom_global',
  locationName: 'Northern Europe Plains (52°N, 9°E)',
  latitude: 52.0,
  longitude: 9.0,
  soilType: 'clay_loam',
  soilPh: 6.8,
  organicMatterPct: 2.8,
  irrigationAvailability: 'high',
  farmerPriority: 'climate_resilience',
  previousCrop: 'fallow'
};

const climateB: NasaPowerClimateData = {
  latitude: 52.0,
  longitude: 9.0,
  hemisphere: 'northern',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  dataPointsCount: 366,
  avgTemperatureC: 10.2,
  maxTemperatureC: 28.5,
  minTemperatureC: -8.5,
  totalPrecipitationMm: 750.0,
  avgSolarRadiationMj: 12.8,
  estimatedGDD: 1350,
  summerAvgTempC: 18.5,
  winterAvgTempC: 2.1,
  sourceStatus: 'live_api',
  fetchedAt: new Date().toISOString()
};

const soilB: SoilData = {
  soilType: 'clay_loam',
  ph: 6.8,
  organicMatterPct: 2.8,
  source: 'user_specified',
  uncertaintyLevel: 'low'
};

// ==========================================
// SCENARIO C: Tropical Region (Mekong Basin / Indonesia / Nigeria, 8°N)
// Warm Tropical, Max 35°C, Min 21°C, Rain 1850mm, Silty Clay, High Irrigation
// ==========================================
const inputC: FarmAssessmentInput = {
  districtId: 'custom_global',
  locationName: 'Tropical Monsoon Lowlands (8°N, 105°E)',
  latitude: 8.0,
  longitude: 105.0,
  soilType: 'silty_clay',
  soilPh: 6.0,
  organicMatterPct: 2.5,
  irrigationAvailability: 'high',
  farmerPriority: 'profitability',
  previousCrop: 'rice'
};

const climateC: NasaPowerClimateData = {
  latitude: 8.0,
  longitude: 105.0,
  hemisphere: 'northern',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  dataPointsCount: 366,
  avgTemperatureC: 27.8,
  maxTemperatureC: 35.0,
  minTemperatureC: 21.5,
  totalPrecipitationMm: 1850.0,
  avgSolarRadiationMj: 19.5,
  estimatedGDD: 4500,
  summerAvgTempC: 29.0,
  winterAvgTempC: 26.5,
  sourceStatus: 'live_api',
  fetchedAt: new Date().toISOString()
};

const soilC: SoilData = {
  soilType: 'silty_clay',
  ph: 6.0,
  organicMatterPct: 2.5,
  source: 'user_specified',
  uncertaintyLevel: 'low'
};

// ==========================================
// SCENARIO D: Mediterranean Region (Spain / Southern Italy, 38°N)
// Mild Wet Winter (Min 5°C), Hot Dry Summer (36°C), Rain 480mm, Calcareous Soil
// ==========================================
const inputD: FarmAssessmentInput = {
  districtId: 'custom_global',
  locationName: 'Mediterranean Basin (38°N, 14°E)',
  latitude: 38.0,
  longitude: 14.0,
  soilType: 'calcareous',
  soilPh: 7.8,
  organicMatterPct: 1.5,
  irrigationAvailability: 'medium',
  farmerPriority: 'soil_health',
  previousCrop: 'wheat'
};

const climateD: NasaPowerClimateData = {
  latitude: 38.0,
  longitude: 14.0,
  hemisphere: 'northern',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  dataPointsCount: 366,
  avgTemperatureC: 18.5,
  maxTemperatureC: 36.5,
  minTemperatureC: 5.0,
  totalPrecipitationMm: 480.0,
  avgSolarRadiationMj: 18.0,
  estimatedGDD: 2650,
  summerAvgTempC: 26.0,
  winterAvgTempC: 11.0,
  sourceStatus: 'live_api',
  fetchedAt: new Date().toISOString()
};

const soilD: SoilData = {
  soilType: 'calcareous',
  ph: 7.8,
  organicMatterPct: 1.5,
  source: 'user_specified',
  uncertaintyLevel: 'low'
};

console.log('================================================================');
console.log('SCENARIO A: Upper Egypt (Hot Arid, Low Irrigation, Water Conservation)');
console.log('================================================================');
const plansA = generateRotationPlans(inputA, climateA, soilA);
plansA.forEach((p, i) => {
  console.log(`#${i+1} [${p.overallScore}/100] ${p.titleEn}`);
  console.log(`   Steps: ${p.steps.map(s => s.crop ? s.crop.nameEn.split(' ')[0] : 'Fallow').join(' ➔ ')}`);
  console.log(`   Scores: Climate ${p.scoreBreakdown.climateSuitability} | Water ${p.scoreBreakdown.waterAlignment} | Soil ${p.scoreBreakdown.soilHealthIndex} | Seq ${p.scoreBreakdown.sequenceHarmony} | Prio ${p.scoreBreakdown.priorityAlignment}`);
  console.log(`   Metrics: Water ${p.totalWaterDemandMm}mm | Net N ${p.netNitrogenBalanceKgHa} kg/ha\n`);
});

console.log('================================================================');
console.log('SCENARIO B: Northern Europe (Cold Winters, Frost, Rain 750mm)');
console.log('================================================================');
const plansB = generateRotationPlans(inputB, climateB, soilB);
plansB.forEach((p, i) => {
  console.log(`#${i+1} [${p.overallScore}/100] ${p.titleEn}`);
  console.log(`   Steps: ${p.steps.map(s => s.crop ? s.crop.nameEn.split(' ')[0] : 'Fallow').join(' ➔ ')}`);
  console.log(`   Scores: Climate ${p.scoreBreakdown.climateSuitability} | Water ${p.scoreBreakdown.waterAlignment} | Soil ${p.scoreBreakdown.soilHealthIndex} | Seq ${p.scoreBreakdown.sequenceHarmony} | Prio ${p.scoreBreakdown.priorityAlignment}`);
  console.log(`   Metrics: Water ${p.totalWaterDemandMm}mm | Net N ${p.netNitrogenBalanceKgHa} kg/ha\n`);
});

console.log('================================================================');
console.log('SCENARIO C: Tropical Region (Warm, 1850mm Rain, Silty Clay)');
console.log('================================================================');
const plansC = generateRotationPlans(inputC, climateC, soilC);
plansC.forEach((p, i) => {
  console.log(`#${i+1} [${p.overallScore}/100] ${p.titleEn}`);
  console.log(`   Steps: ${p.steps.map(s => s.crop ? s.crop.nameEn.split(' ')[0] : 'Fallow').join(' ➔ ')}`);
  console.log(`   Scores: Climate ${p.scoreBreakdown.climateSuitability} | Water ${p.scoreBreakdown.waterAlignment} | Soil ${p.scoreBreakdown.soilHealthIndex} | Seq ${p.scoreBreakdown.sequenceHarmony} | Prio ${p.scoreBreakdown.priorityAlignment}`);
  console.log(`   Metrics: Water ${p.totalWaterDemandMm}mm | Net N ${p.netNitrogenBalanceKgHa} kg/ha\n`);
});

console.log('================================================================');
console.log('SCENARIO D: Mediterranean Region (Mild Winter, Hot Summer, Calcareous)');
console.log('================================================================');
const plansD = generateRotationPlans(inputD, climateD, soilD);
plansD.forEach((p, i) => {
  console.log(`#${i+1} [${p.overallScore}/100] ${p.titleEn}`);
  console.log(`   Steps: ${p.steps.map(s => s.crop ? s.crop.nameEn.split(' ')[0] : 'Fallow').join(' ➔ ')}`);
  console.log(`   Scores: Climate ${p.scoreBreakdown.climateSuitability} | Water ${p.scoreBreakdown.waterAlignment} | Soil ${p.scoreBreakdown.soilHealthIndex} | Seq ${p.scoreBreakdown.sequenceHarmony} | Prio ${p.scoreBreakdown.priorityAlignment}`);
  console.log(`   Metrics: Water ${p.totalWaterDemandMm}mm | Net N ${p.netNitrogenBalanceKgHa} kg/ha\n`);
});

console.log('================================================================');
console.log('SCENARIO E: Same Conditions (Mediterranean), Varying Farmer Priority');
console.log('================================================================');
const priorities: any[] = ['water_conservation', 'soil_health', 'climate_resilience', 'profitability'];
priorities.forEach(prio => {
  const inp = { ...inputD, farmerPriority: prio };
  const plans = generateRotationPlans(inp, climateD, soilD);
  const w = getPriorityWeights(prio);
  console.log(`Priority: ${prio.padEnd(19)} (Weights: W:${w.water} S:${w.soil} C:${w.climate} Seq:${w.sequence} P:${w.priority})`);
  console.log(`   ➔ #1 Ranked: [${plans[0].overallScore}/100] ${plans[0].titleEn}`);
  console.log(`   ➔ #2 Ranked: [${plans[1].overallScore}/100] ${plans[1].titleEn}`);
  console.log(`   ➔ #3 Ranked: [${plans[2].overallScore}/100] ${plans[2].titleEn}\n`);
});
