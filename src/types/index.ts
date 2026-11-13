export type Language = 'en' | 'ar';

export type IrrigationAvailability = 'low' | 'medium' | 'high';

export type FarmerPriority = 'water_conservation' | 'soil_health' | 'climate_resilience' | 'profitability';

export type SoilType = 'clay_loam' | 'sandy_loam' | 'silty_clay' | 'sandy' | 'calcareous';

export type Season = 'winter' | 'summer';

export type ClimateZone = 'arid' | 'semi_arid' | 'mediterranean' | 'temperate' | 'tropical' | 'subtropical';

export type CropId = 
  | 'wheat' 
  | 'berseem' 
  | 'sorghum' 
  | 'faba_bean' 
  | 'onion' 
  | 'barley' 
  | 'canola' 
  | 'potato' 
  | 'rice' 
  | 'maize' 
  | 'soybean' 
  | 'chickpea' 
  | 'sesame' 
  | 'groundnut' 
  | 'sunflower'
  | 'oats'
  | 'millet'
  | 'cowpea'
  | 'lentil'
  | 'common_bean'
  | 'field_pea'
  | 'cotton'
  | 'sugarcane'
  | 'safflower'
  | 'flax'
  | 'tomato'
  | 'pepper'
  | 'sweet_potato'
  | 'lupin'
  | 'castor';

export interface Crop {
  id: CropId;
  nameEn: string;
  nameAr: string;
  scientificName: string;
  family: string;
  familyAr: string;
  season: Season;
  climateZones: ClimateZone[];
  growingDays: number;
  plantingMonthEn: string;
  plantingMonthAr: string;
  harvestMonthEn: string;
  harvestMonthAr: string;
  waterRequirementMm: number; // typical mm per growing cycle (FAO 56)
  cropCoefficientKc: number; // Seasonal average crop coefficient (FAO 56 Table 12)
  waterDemandTier: 'low' | 'medium' | 'high';
  optimalPhRange: [number, number];
  toleratedSoilTypes: SoilType[];
  optimalTempRangeC: [number, number];
  maxToleratedTempC: number;
  minToleratedTempC: number; // Frost/chilling damage threshold
  baseTemperatureC: number; // Base temperature for thermal time / GDD accumulation
  frostToleranceClass: 'hardy' | 'semi_hardy' | 'sensitive' | 'chilling_sensitive';
  gddRequirement: number; // Growing Degree Days required to reach physiological maturity
  salinityToleranceECe: number; // Soil salinity threshold in dS/m before significant yield decline (FAO 29)
  salinityToleranceECw: number; // Irrigation water salinity threshold in dS/m before significant yield decline (FAO 29 Table 4)
  humidityToleranceTier: 'sensitive' | 'moderate' | 'tolerant' | 'humid_adapted'; // Atmospheric humidity and foliar disease response
  optimalRhRange: [number, number]; // Optimal relative humidity range (%)
  maxToleratedRhPct: number; // Humidity ceiling above which foliar fungal disease risk escalates (%)
  diseaseRiskFactorsEn?: string; // Documented microclimate disease vulnerabilities (e.g. rusts, blights, powdery mildew)
  diseaseRiskFactorsAr?: string;
  nitrogenFixationKgPerHa: number; // positive = adds N to soil, negative = depletes N
  organicMatterAdditionScore: number; // 1-5 scale (root biomass & stubble)
  cashCropTier: 'high' | 'medium' | 'low'; // Relative economic liquidity potential
  soilHealthRoleEn: string;
  soilHealthRoleAr: string;
  rotationRulesEn: {
    idealPreceding: (CropId | 'fallow')[];
    avoidPreceding: (CropId | 'fallow')[];
    agronomicNotes: string;
  };
  rotationRulesAr: {
    idealPreceding: (CropId | 'fallow')[];
    avoidPreceding: (CropId | 'fallow')[];
    agronomicNotes: string;
  };
  sources: {
    agronomy: string;
    waterReq: string;
  };
}

export interface District {
  id: string;
  nameEn: string;
  nameAr: string;
  latitude: number;
  longitude: number;
  zoneTypeEn: 'Nile Floodplain Alluvial' | 'Desert Reclamation Fringe' | 'Global Ag-Zone';
  zoneTypeAr: 'سهول طمي النيل الفيضية' | 'نطاق الاستصلاح الصحراوي' | 'نطاق زراعي عالمي';
  predominantSoil: SoilType;
  typicalWaterSourceEn: string;
  typicalWaterSourceAr: string;
}

export interface NasaPowerClimateData {
  latitude: number;
  longitude: number;
  locationName?: string;
  startDate: string;
  endDate: string;
  dataPointsCount: number;
  avgTemperatureC: number;
  maxTemperatureC: number;
  minTemperatureC: number;
  totalPrecipitationMm: number;
  avgSolarRadiationMj: number;
  estimatedGDD: number;
  summerAvgTempC: number;
  winterAvgTempC: number;
  hemisphere: 'northern' | 'southern';
  avgRelativeHumidityPct?: number; // Mean annual relative humidity at 2m (RH2M, %)
  maxRelativeHumidityPct?: number; // Peak daily mean relative humidity (RH2M, %)
  minRelativeHumidityPct?: number; // Minimum daily mean relative humidity (RH2M, %)
  summerAvgRhPct?: number; // Mean relative humidity during warm season (%)
  winterAvgRhPct?: number; // Mean relative humidity during cool season (%)
  highHumidityDaysCount?: number; // Count of days with RH2M >= 80% (fungal spore germination threshold)
  rhDataPointsCount?: number; // Valid daily RH2M observations count
  referenceEt0Mm?: number; // FAO-56 Penman-Monteith / Hargreaves-Samani reference evapotranspiration
  frostFreeDays?: number; // Consecutive frost-free days (Tmin >= 0°C)
  monthlyData?: Array<{ month: number; avgTempC: number; precipMm: number; solarRadMj: number; avgRhPct?: number }>;
  sourceStatus: 'live_api' | 'user_specified' | 'demo_mode' | 'loading' | 'error';
  isSyntheticFallback?: boolean;
  fetchedAt: string;
  errorMessage?: string;
}

export interface SoilData {
  soilType: SoilType;
  ph: number;
  organicMatterPct: number;
  salinityEC?: number; // dS/m (ECe)
  source: 'soilgrids_live' | 'regional_swri_benchmark' | 'global_usda_texture_model' | 'user_specified';
  phSource?: 'user_specified' | 'soilgrids_live' | 'regional_swri_benchmark' | 'global_usda_texture_model';
  omSource?: 'user_specified' | 'soilgrids_live' | 'regional_swri_benchmark' | 'global_usda_texture_model';
  salinitySource?: 'user_specified' | 'unavailable';
  textureSource?: 'user_selected' | 'soilgrids_live';
  clayPercent?: number;
  sandPercent?: number;
  siltPercent?: number;
  uncertaintyLevel: 'low' | 'moderate' | 'high';
}

export interface FarmAssessmentInput {
  districtId: string;
  farmId?: string;
  farmName?: string;
  locationName?: string;
  latitude: number;
  longitude: number;
  soilType: SoilType;
  soilPh?: number;
  organicMatterPct?: number;
  soilSalinityEC?: number;
  irrigationAvailability: IrrigationAvailability;
  irrigationMethod?: 'drip' | 'sprinkler' | 'surface_furrow';
  irrigationWaterSalinityECw?: number; // Optional electrical conductivity of irrigation water in dS/m (ECw)
  farmerPriority: FarmerPriority;
  previousCrop?: CropId | 'fallow';
  userClimate?: {
    avgTemperatureC: number;
    maxTemperatureC: number;
    minTemperatureC: number;
    totalPrecipitationMm: number;
  };
}

export interface CropTimeline {
  plantingWindowEn: string;
  plantingWindowAr: string;
  harvestWindowEn: string;
  harvestWindowAr: string;
  durationDays: number;
  durationRangeEn: string;
  durationRangeAr: string;
  seasonClassificationEn: string;
  seasonClassificationAr: string;
  timingRationaleEn: string;
  timingRationaleAr: string;
}

export interface SeedVarietySourceReference {
  organization: string; // e.g. 'ARC Egypt', 'CIMMYT', 'ICARDA', 'UPOV PLUTO', 'CPVO', 'USDA-ARS'
  citation: string;
  sourceType: 'national_catalogue' | 'international_treaty' | 'cgiar_trials' | 'peer_reviewed' | 'extension_recommendation';
}

export interface SeedVariety {
  id: string; // unique variety identifier
  cropId: CropId; // parent crop
  scientificName: string;
  nameEn: string;
  nameAr: string;
  breedingInstitute: string;
  countryOfOrigin: string;
  countriesRegistered: string[]; // ISO country codes or regional keys: 'EG', 'SD', 'SA', 'US', 'FR', 'ES', 'DE', 'IN', 'AU', 'BR', etc.
  agroEcologicalZones: ClimateZone[]; // 'arid', 'semi_arid', 'mediterranean', 'temperate', 'tropical', 'subtropical'
  registrationStatus: 'officially_registered' | 'national_catalogue' | 'research_cgiar_elite' | 'recommended';
  releaseYear?: number;
  maturityClass: 'early' | 'medium' | 'late';
  durationDays: [number, number]; // [min, max]
  optimalTempRangeC: [number, number];
  maxToleratedTempC: number;
  minToleratedTempC: number;
  droughtTolerance: 'high' | 'moderate' | 'low';
  toleratedSoilTypes: SoilType[];
  optimalPhRange: [number, number];
  salinityToleranceECe: number; // dS/m
  salinityToleranceECw: number; // dS/m
  humidityToleranceTier: 'sensitive' | 'moderate' | 'tolerant' | 'humid_adapted';
  diseaseResistanceEn: string[];
  diseaseResistanceAr: string[];
  keyStrengthsEn: string;
  keyStrengthsAr: string;
  yieldPotentialEn?: string;
  yieldPotentialAr?: string;
  sources: SeedVarietySourceReference[];
  dataVerificationStatus: 'verified';
}

export interface SeedVarietyRecommendation {
  varietyName: string;
  varietyNameAr: string;
  breedingInstitute: string;
  releaseYear?: number;
  countryOfOrigin: string;
  registrationStatus: string;
  explanationEn: string;
  explanationAr: string;
  suitabilityScore: number; // 0-100 internal matching score
  confidenceLevel: 'high' | 'medium' | 'low';
  isLocallyRegistered: boolean;
  evidenceSupported: boolean;
}

export interface PlanStep {
  seasonLabelEn: string;
  seasonLabelAr: string;
  seasonYear: 1 | 2;
  seasonType: Season;
  cropId: CropId | 'fallow';
  crop: Crop | null;
  timeline: CropTimeline;
  waterEstimateMm: number;
  nitrogenContributionKg: number;
  roleInRotationEn: string;
  roleInRotationAr: string;
  agronomicRationaleEn: string;
  agronomicRationaleAr: string;
  importantNotesEn: string;
  importantNotesAr: string;
  varietyRecommendation?: SeedVarietyRecommendation;
}

export interface WaterBalanceDetails {
  cropEvapotranspirationMm: number; // Cumulative crop ETc (mm over 2 years)
  referenceEt0Mm: number; // Reference ET0 over 2 years (FAO-56)
  effectiveRainfallMm: number; // Effective precipitation (USDA SCS method)
  netIrrigationRequirementMm: number; // max(0, ETc - Peff)
  irrigationEfficiencyPct: number; // Application efficiency (e.g. 60% surface, 75% sprinkler, 85% drip)
  grossIrrigationDemandMm: number; // Net / efficiency
  estimatedIrrigationCapacityMm: number; // Estimated management capacity (benchmark indicator, NOT farm meter)
  seasonalDeficitMm: number; // Shortfall when demand exceeds supply
  isDeficit: boolean;
}

export type RotationPlanStep = PlanStep;

export interface RotationPlanScoreBreakdown {
  climateSuitability: number; // 0-100
  waterAlignment: number;      // 0-100
  soilHealthIndex: number;     // 0-100
  sequenceHarmony: number;     // 0-100
  priorityAlignment: number;   // 0-100
}

export interface RotationPlan {
  id: string;
  titleEn: string;
  titleAr: string;
  taglineEn: string;
  taglineAr: string;
  strategicFocusEn: string;
  strategicFocusAr: string;
  overallScore: number; // 0-100
  scoreBreakdown: RotationPlanScoreBreakdown;
  steps: PlanStep[];
  totalWaterDemandMm: number;
  waterBalance?: WaterBalanceDetails;
  netNitrogenBalanceKgHa: number;
  soilHealthBenefitTier: 'high' | 'medium' | 'moderate';
  climateResilienceRating: 'high' | 'medium' | 'moderate';
  economicRiskProfile: 'low' | 'medium' | 'high';
  whyItFitsEn: string;
  whyItFitsAr: string;
  humidityAssessment?: {
    avgRhPct?: number;
    riskTier: 'low' | 'moderate' | 'high';
    summaryEn: string;
    summaryAr: string;
  };
  waterSalinityAssessment?: {
    ecwProvided: boolean;
    ecwValue?: number;
    restrictionTier?: 'none' | 'slight_to_moderate' | 'severe';
    effectiveDrainageFactor: number;
    penalizedCrops: string[];
    favoredCrops: string[];
    summaryEn: string;
    summaryAr: string;
  };
  advantagesEn: string[];
  advantagesAr: string[];
  limitationsEn: string[];
  limitationsAr: string[];
  dataSourcesAndUncertaintiesEn: string[];
  dataSourcesAndUncertaintiesAr: string[];
}

export * from './platform';

