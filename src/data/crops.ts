import type { Crop, CropId } from '../types';

export const CROP_NAMES_MAP: Record<string, { en: string; ar: string }> = {
  wheat: { en: 'Wheat', ar: 'القمح' },
  berseem: { en: 'Egyptian Clover (Berseem)', ar: 'البرسيم المصري' },
  sorghum: { en: 'Grain Sorghum', ar: 'الذرة الرفيعة' },
  faba_bean: { en: 'Faba Bean', ar: 'الفول البلدي' },
  onion: { en: 'Dry Bulb Onion', ar: 'البصل الجاف' },
  barley: { en: 'Barley', ar: 'الشعير' },
  canola: { en: 'Canola / Rapeseed', ar: 'الكانولا (سلجم الزيت)' },
  potato: { en: 'Potato', ar: 'البطاطس' },
  rice: { en: 'Paddy Rice', ar: 'الأرز' },
  maize: { en: 'Maize (Corn)', ar: 'الذرة الشامية' },
  soybean: { en: 'Soybean', ar: 'فول الصويا' },
  chickpea: { en: 'Chickpea', ar: 'الحمص' },
  sesame: { en: 'Sesame', ar: 'السمسم' },
  groundnut: { en: 'Groundnut (Peanut)', ar: 'الفول السوداني' },
  sunflower: { en: 'Sunflower', ar: 'دوار الشمس' },
  oats: { en: 'Oats', ar: 'الشوفان' },
  millet: { en: 'Pearl Millet', ar: 'دخن اللؤلؤ' },
  cowpea: { en: 'Cowpea', ar: 'اللوبيا' },
  lentil: { en: 'Lentil', ar: 'العدس' },
  common_bean: { en: 'Common Dry Bean', ar: 'الفاصوليا الجافة' },
  field_pea: { en: 'Field Pea', ar: 'البازلاء الحقلية' },
  cotton: { en: 'Cotton', ar: 'القطن' },
  sugarcane: { en: 'Sugarcane', ar: 'قصب السكر' },
  safflower: { en: 'Safflower', ar: 'العصفر (القرطم)' },
  flax: { en: 'Flax / Linseed', ar: 'الكتان' },
  tomato: { en: 'Processing Tomato', ar: 'طماطم الحقل' },
  pepper: { en: 'Pepper', ar: 'الفلفل' },
  sweet_potato: { en: 'Sweet Potato', ar: 'البطاطا الحلوة' },
  lupin: { en: 'White Lupin', ar: 'الترمس الأبيض' },
  castor: { en: 'Castor Bean', ar: 'الخروع' },
  fallow: { en: 'Summer Fallow', ar: 'أرض بور (مراحة)' },
};

export const CROPS_DATABASE: Record<CropId, Crop> = {
  // 1. WHEAT - Universal Cereal
  wheat: {
    id: 'wheat',
    nameEn: 'Wheat (Durum & Bread)',
    nameAr: 'القمح (قمح الخبز والمكرونة)',
    scientificName: 'Triticum aestivum / T. durum',
    family: 'Poaceae (Gramineae)',
    familyAr: 'النجيليات',
    season: 'winter',
    climateZones: ['arid', 'semi_arid', 'mediterranean', 'temperate'],
    growingDays: 155,
    plantingMonthEn: 'October – December (Winter) / March – April (Spring)',
    plantingMonthAr: 'أكتوبر – ديسمبر (شتوي) / مارس – أبريل (ربيعي)',
    harvestMonthEn: 'April – July',
    harvestMonthAr: 'أبريل – يوليو',
    waterRequirementMm: 480,
    cropCoefficientKc: 1.15, // FAO-56 Table 12 mid-season Kc
    waterDemandTier: 'medium',
    optimalPhRange: [6.5, 8.2],
    toleratedSoilTypes: ['clay_loam', 'silty_clay', 'sandy_loam'],
    optimalTempRangeC: [14, 23],
    maxToleratedTempC: 33, // Grain filling abortion above 33°C (CIMMYT)
    minToleratedTempC: -12, // Frost hardy during vegetative/tillering
    baseTemperatureC: 0.0, // Standard base for winter cereal GDD
    frostToleranceClass: 'hardy',
    gddRequirement: 1400,
    salinityToleranceECe: 6.0, // Threshold ECe in dS/m (FAO 29 Table 4)
    salinityToleranceECw: 4,
    humidityToleranceTier: 'moderate',
    optimalRhRange: [40, 65],
    maxToleratedRhPct: 75,
    diseaseRiskFactorsEn: 'Elevated humidity (>75%) coupled with moderate temperatures promotes stripe rust (Puccinia striiformis) and Fusarium head blight.',
    diseaseRiskFactorsAr: 'الرطوبة العالية (>75%) مع درجات الحرارة المعتدلة تحفز الإصابة بالصدأ الأصفر (Puccinia striiformis) وتلف السنابل الفيوزارمي.',
    nitrogenFixationKgPerHa: -65,
    organicMatterAdditionScore: 3,
    cashCropTier: 'medium',
    soilHealthRoleEn: 'Provides dense fibrous root biomass and crumb structure stability; foundation staple crop.',
    soilHealthRoleAr: 'يوفر كتلة جذرية ليفية كثيفة واستقراراً لحبيبات التربة؛ محصول استراتيجي رئيسي.',
    rotationRulesEn: {
      idealPreceding: ['berseem', 'faba_bean', 'chickpea', 'canola', 'soybean'],
      avoidPreceding: ['wheat', 'barley'],
      agronomicNotes: 'Yields increase by 15-25% following legumes due to fixed nitrogen and broken cereal crown rot cycles.'
    },
    rotationRulesAr: {
      idealPreceding: ['berseem', 'faba_bean', 'chickpea', 'canola', 'soybean'],
      avoidPreceding: ['wheat', 'barley'],
      agronomicNotes: 'ترتفع الإنتاجية بنسبة 15-25% بعد البقوليات بفضل رصيد النيتروجين وكسر دورة فطريات تعفن جذور الحبوب.'
    },
    sources: {
      agronomy: 'FAO Crop Production Bulletins & Egyptian ARC Field Crops Research Institute',
      waterReq: 'FAO Irrigation and Drainage Paper No. 56'
    }
  },

  // 2. BERSEEM CLOVER - Restorative Legume (Subtropical / Mediterranean)
  berseem: {
    id: 'berseem',
    nameEn: 'Egyptian Clover (Berseem)',
    nameAr: 'البرسيم المصري (المسقاوي)',
    scientificName: 'Trifolium alexandrinum',
    family: 'Fabaceae (Leguminosae)',
    familyAr: 'البقوليات',
    season: 'winter',
    climateZones: ['arid', 'semi_arid', 'mediterranean', 'subtropical'],
    growingDays: 180,
    plantingMonthEn: 'October – November',
    plantingMonthAr: 'أكتوبر – نوفمبر',
    harvestMonthEn: 'May (4–5 cuts)',
    harvestMonthAr: 'مايو (4 إلى 5 حشات)',
    waterRequirementMm: 680,
    cropCoefficientKc: 1.15, // FAO-56 Table 12 forage clover Kc
    waterDemandTier: 'high',
    optimalPhRange: [6.8, 8.4],
    toleratedSoilTypes: ['clay_loam', 'silty_clay', 'sandy_loam', 'calcareous'],
    optimalTempRangeC: [15, 25],
    maxToleratedTempC: 34,
    minToleratedTempC: 1, // Sensitive to freezing frost
    baseTemperatureC: 5.0,
    frostToleranceClass: 'sensitive',
    gddRequirement: 1600,
    salinityToleranceECe: 3.2, // Moderately sensitive (FAO 29)
    salinityToleranceECw: 1,
    humidityToleranceTier: 'tolerant',
    optimalRhRange: [45, 75],
    maxToleratedRhPct: 85,
    diseaseRiskFactorsEn: 'Persistent high humidity (>85%) in dense forage stands increases susceptibility to Sclerotinia crown rot and stem blight.',
    diseaseRiskFactorsAr: 'الرطوبة المرتفعة المستمرة (>85%) في الكثافات النباتية العالية تزيد من احتمالية عفن التاج الإسكيلروتيني ولفحة السيقان.',
    nitrogenFixationKgPerHa: 180,
    organicMatterAdditionScore: 5,
    cashCropTier: 'medium',
    soilHealthRoleEn: 'Unsurpassed biological nitrogen fixation engine (+180 kg N/ha) and subsoil taproot decompaction.',
    soilHealthRoleAr: 'محرك خصوبة التربة الأقوى؛ يثبت 180 كجم نيتروجين/هكتار ويفكك انضغاط التربة بجذوره الوتدية.',
    rotationRulesEn: {
      idealPreceding: ['sorghum', 'wheat', 'maize', 'rice'],
      avoidPreceding: ['berseem'],
      agronomicNotes: 'Restores organic matter for subsequent cereal and summer crops. Avoid monoculture to prevent Sclerotinia rot.'
    },
    rotationRulesAr: {
      idealPreceding: ['sorghum', 'wheat', 'maize', 'rice'],
      avoidPreceding: ['berseem'],
      agronomicNotes: 'يجدد خصوبة التربة بعد الحبوب الصيفية. تجنب تكراره سنوياً دون تدوير لمنع أمراض السكليروتينيا.'
    },
    sources: {
      agronomy: 'ICARDA Forage Legume Regional Network & ARC Egypt Forage Department',
      waterReq: 'FAO Water Development Report 33 & FAO 56'
    }
  },

  // 3. GRAIN SORGHUM - Heat & Drought C4 Cereal
  sorghum: {
    id: 'sorghum',
    nameEn: 'Grain Sorghum',
    nameAr: 'الذرة الرفيعة (الحبوب)',
    scientificName: 'Sorghum bicolor',
    family: 'Poaceae (Gramineae)',
    familyAr: 'النجيليات',
    season: 'summer',
    climateZones: ['arid', 'semi_arid', 'tropical', 'subtropical'],
    growingDays: 115,
    plantingMonthEn: 'May – June',
    plantingMonthAr: 'مايو – يونيو',
    harvestMonthEn: 'September – October',
    harvestMonthAr: 'سبتمبر – أكتوبر',
    waterRequirementMm: 500,
    cropCoefficientKc: 1.00, // FAO-56 Table 12 mid-season Kc
    waterDemandTier: 'medium',
    optimalPhRange: [6.0, 8.4],
    toleratedSoilTypes: ['clay_loam', 'sandy_loam', 'silty_clay', 'calcareous', 'sandy'],
    optimalTempRangeC: [25, 36],
    maxToleratedTempC: 44, // Supreme heat endurance (ICRISAT)
    minToleratedTempC: 8, // Tropical C4: chilling injury < 10°C, zero frost tolerance
    baseTemperatureC: 10.0,
    frostToleranceClass: 'chilling_sensitive',
    gddRequirement: 1500,
    salinityToleranceECe: 6.8, // Moderately tolerant (FAO 29)
    salinityToleranceECw: 4.5,
    humidityToleranceTier: 'tolerant',
    optimalRhRange: [35, 65],
    maxToleratedRhPct: 80,
    diseaseRiskFactorsEn: 'Excessive humidity (>80%) during grain maturity induces grain mold complexes (Fusarium, Curvularia) and anthracnose.',
    diseaseRiskFactorsAr: 'الرطوبة المفرطة (>80%) أثناء نضج الحبوب تسبب أعفان الحبوب الفطرية (الفيوزاريوم) والأنثراكنوز.',
    nitrogenFixationKgPerHa: -75,
    organicMatterAdditionScore: 4,
    cashCropTier: 'medium',
    soilHealthRoleEn: 'High biomass stover, allelopathic weed suppression (sorgoleone), and deep moisture scavenging.',
    soilHealthRoleAr: 'كتلة حيوية عالية، إفرازات جذرية مثبطة للحشائش، وقدرة فائقة على امتصاص الرطوبة العميقة.',
    rotationRulesEn: {
      idealPreceding: ['berseem', 'faba_bean', 'chickpea', 'groundnut'],
      avoidPreceding: ['sorghum'],
      agronomicNotes: 'Thrives when following winter legumes. Incorporate stover well ahead of subsequent winter planting.'
    },
    rotationRulesAr: {
      idealPreceding: ['berseem', 'faba_bean', 'chickpea', 'groundnut'],
      avoidPreceding: ['sorghum'],
      agronomicNotes: 'يعطي أعلى إنتاجية بعد البقوليات الشتوية. يلزم فرم الحطب وخلطه بالتربة مبكراً.'
    },
    sources: {
      agronomy: 'ICRISAT Sorghum Crop Guides & ARC Egypt',
      waterReq: 'FAO Irrigation Paper 56'
    }
  },

  // 4. FABA BEAN - Cool Season Pulse Legume
  faba_bean: {
    id: 'faba_bean',
    nameEn: 'Faba Bean (Broad Bean)',
    nameAr: 'الفول البلدي',
    scientificName: 'Vicia faba',
    family: 'Fabaceae (Leguminosae)',
    familyAr: 'البقوليات',
    season: 'winter',
    climateZones: ['arid', 'semi_arid', 'mediterranean', 'temperate'],
    growingDays: 140,
    plantingMonthEn: 'October – November',
    plantingMonthAr: 'أكتوبر – نوفمبر',
    harvestMonthEn: 'March – May',
    harvestMonthAr: 'مارس – مايو',
    waterRequirementMm: 380,
    cropCoefficientKc: 1.05, // FAO-56 Table 12 mid-season Kc
    waterDemandTier: 'low',
    optimalPhRange: [6.5, 8.2],
    toleratedSoilTypes: ['clay_loam', 'silty_clay', 'sandy_loam'],
    optimalTempRangeC: [14, 22],
    maxToleratedTempC: 30, // Heat sensitive during podding/flowering (ICARDA)
    minToleratedTempC: -4, // Mild frost tolerant
    baseTemperatureC: 4.0,
    frostToleranceClass: 'semi_hardy',
    gddRequirement: 1200,
    salinityToleranceECe: 2.5, // Moderately sensitive (FAO 29)
    salinityToleranceECw: 1.1,
    humidityToleranceTier: 'sensitive',
    optimalRhRange: [45, 70],
    maxToleratedRhPct: 78,
    diseaseRiskFactorsEn: 'Elevated humidity (>78%) combined with 15–22°C triggers devastating Chocolate Spot (Botrytis fabae) and rust epidemics.',
    diseaseRiskFactorsAr: 'الرطوبة الجوية المرتفعة (>78%) مع حرارة 15-22 مئوية تؤدي لتفشي مرض التبقع البني (بوتريتس) والصدأ الشديد.',
    nitrogenFixationKgPerHa: 110,
    organicMatterAdditionScore: 3,
    cashCropTier: 'medium',
    soilHealthRoleEn: 'Low water footprint, fixes +110 kg N/ha, breaks cereal root pathogen cycles.',
    soilHealthRoleAr: 'بصمة مائية منخفضة، يثبت +110 كجم نيتروجين/هكتار، ويكسر دورات أمراض فطريات الحبوب.',
    rotationRulesEn: {
      idealPreceding: ['wheat', 'sorghum', 'barley', 'maize'],
      avoidPreceding: ['faba_bean'],
      agronomicNotes: 'Must not be grown continuously to prevent broomrape (Orobanche crenata) seed accumulation.'
    },
    rotationRulesAr: {
      idealPreceding: ['wheat', 'sorghum', 'barley', 'maize'],
      avoidPreceding: ['faba_bean'],
      agronomicNotes: 'يُحظر تكرار زراعته سنوياً في نفس الحقل لتفادي استفحال طفيل الهالوك.'
    },
    sources: {
      agronomy: 'ICARDA Food Legumes Program',
      waterReq: 'FAO Crop Water Information: Faba Bean & FAO 56'
    }
  },

  // 5. DRY BULB ONION - High Value Cash Crop
  onion: {
    id: 'onion',
    nameEn: 'Dry Bulb Onion',
    nameAr: 'البصل الجاف',
    scientificName: 'Allium cepa',
    family: 'Amaryllidaceae',
    familyAr: 'النرجسيات (الثوميات)',
    season: 'winter',
    climateZones: ['arid', 'semi_arid', 'mediterranean', 'temperate'],
    growingDays: 145,
    plantingMonthEn: 'November – January',
    plantingMonthAr: 'نوفمبر – يناير',
    harvestMonthEn: 'April – June',
    harvestMonthAr: 'أبريل – يونيو',
    waterRequirementMm: 440,
    cropCoefficientKc: 1.05, // FAO-56 Table 12
    waterDemandTier: 'medium',
    optimalPhRange: [6.2, 7.8],
    toleratedSoilTypes: ['sandy_loam', 'clay_loam'],
    optimalTempRangeC: [13, 24],
    maxToleratedTempC: 33,
    minToleratedTempC: -2,
    baseTemperatureC: 6.0,
    frostToleranceClass: 'semi_hardy',
    gddRequirement: 1350,
    salinityToleranceECe: 1.8, // Salinity sensitive (FAO 29: threshold 1.2-1.8 dS/m)
    salinityToleranceECw: 0.8,
    humidityToleranceTier: 'sensitive',
    optimalRhRange: [40, 65],
    maxToleratedRhPct: 75,
    diseaseRiskFactorsEn: 'High relative humidity (>75%) triggers severe downy mildew (Peronospora destructor), purple blotch, and neck rot.',
    diseaseRiskFactorsAr: 'الرطوبة النسبية المرتفعة (>75%) تحفز الإصابة بالبياض الزغبي وعفن الرقبة واللطعة الأرجوانية (ألترناريا).',
    nitrogenFixationKgPerHa: -55,
    organicMatterAdditionScore: 2,
    cashCropTier: 'high',
    soilHealthRoleEn: 'Shallow root system rests deeper subsoil; natural organosulfur compounds mildly biofumigate soils.',
    soilHealthRoleAr: 'جذور سطحية تريح الطبقات العميقة؛ مركبات الكبريت العضوية تسهم في التطهير الحيوي للتربة.',
    rotationRulesEn: {
      idealPreceding: ['berseem', 'sorghum', 'wheat', 'fallow'],
      avoidPreceding: ['onion'],
      agronomicNotes: 'Requires a minimum 3-year break between Allium crops to prevent white rot (Sclerotium cepivorum).'
    },
    rotationRulesAr: {
      idealPreceding: ['berseem', 'sorghum', 'wheat', 'fallow'],
      avoidPreceding: ['onion'],
      agronomicNotes: 'يلزم فاصل 3 سنوات على الأقل قبل زراعة الأبصال مرة أخرى للوقاية من العفن الأبيض.'
    },
    sources: {
      agronomy: 'FAO Horticultural Crop Guidelines & ARC Egypt',
      waterReq: 'FAO Drainage Paper 56'
    }
  },

  // 6. BARLEY - Cool Temperate & Saline-Hardy Cereal (Northern Europe & Saline Arid Fringes)
  barley: {
    id: 'barley',
    nameEn: 'Barley (Feed & Malting)',
    nameAr: 'الشعير (العلفي وصناعة المولت)',
    scientificName: 'Hordeum vulgare',
    family: 'Poaceae (Gramineae)',
    familyAr: 'النجيليات',
    season: 'winter',
    climateZones: ['temperate', 'mediterranean', 'semi_arid', 'arid'],
    growingDays: 120,
    plantingMonthEn: 'October – December / March – April',
    plantingMonthAr: 'أكتوبر – ديسمبر / مارس – أبريل',
    harvestMonthEn: 'May – July',
    harvestMonthAr: 'مايو – يوليو',
    waterRequirementMm: 380,
    cropCoefficientKc: 1.05, // FAO-56 Table 12 mid-season Kc
    waterDemandTier: 'low',
    optimalPhRange: [6.5, 8.5],
    toleratedSoilTypes: ['sandy_loam', 'clay_loam', 'calcareous', 'sandy'],
    optimalTempRangeC: [12, 20],
    maxToleratedTempC: 30, // Low heat tolerance
    minToleratedTempC: -14, // Outstanding frost resilience
    baseTemperatureC: 0.0, // Base 0°C for cool cereal
    frostToleranceClass: 'hardy',
    gddRequirement: 1150,
    salinityToleranceECe: 8.0, // Most salt-tolerant major cereal (FAO 29 Table 4)
    salinityToleranceECw: 5.3,
    humidityToleranceTier: 'moderate',
    optimalRhRange: [35, 65],
    maxToleratedRhPct: 75,
    diseaseRiskFactorsEn: 'Prolonged damp canopy (>75% RH) encourages barley leaf scald (Rhynchosporium secalis) and powdery mildew.',
    diseaseRiskFactorsAr: 'الرطوبة العالية الممتدة (>75%) تشجع انتشار التبقع الشبكي، وتبقع الأوراق الإسكالدي والبياض الدقيقي.',
    nitrogenFixationKgPerHa: -50,
    organicMatterAdditionScore: 3,
    cashCropTier: 'medium',
    soilHealthRoleEn: 'Pioneer crop for saline and marginal soils; early harvest allows short spring break.',
    soilHealthRoleAr: 'محصول ريادي للأراضي الملحية والهامشية؛ نضجه المبكر يتيح فرصة لتهيئة التربة للموسم التالي.',
    rotationRulesEn: {
      idealPreceding: ['canola', 'faba_bean', 'potato', 'chickpea'],
      avoidPreceding: ['barley', 'wheat'],
      agronomicNotes: 'Excellent cool-climate rotation crop after brassicas and root crops. Avoid back-to-back barley.'
    },
    rotationRulesAr: {
      idealPreceding: ['canola', 'faba_bean', 'potato', 'chickpea'],
      avoidPreceding: ['barley', 'wheat'],
      agronomicNotes: 'محصول شتوي ممتاز في المناخات المعتدلة والباردة بعد الصليبيات والدرنيات.'
    },
    sources: {
      agronomy: 'European Grains Association & ICARDA Barley Program',
      waterReq: 'FAO Irrigation Paper 56'
    }
  },

  // 7. CANOLA / OILSEED RAPE - Cool Season Break Crop (Northern Europe & Temperate Zones)
  canola: {
    id: 'canola',
    nameEn: 'Canola / Oilseed Rape',
    nameAr: 'الكانولا (سلجم الزيت)',
    scientificName: 'Brassica napus',
    family: 'Brassicaceae',
    familyAr: 'الصليبيات',
    season: 'winter',
    climateZones: ['temperate', 'mediterranean', 'semi_arid'],
    growingDays: 165,
    plantingMonthEn: 'August – October / March',
    plantingMonthAr: 'أغسطس – أكتوبر / مارس',
    harvestMonthEn: 'June – July',
    harvestMonthAr: 'يونيو – يوليو',
    waterRequirementMm: 450,
    cropCoefficientKc: 1.05, // FAO-56 Table 12
    waterDemandTier: 'medium',
    optimalPhRange: [6.0, 7.5],
    toleratedSoilTypes: ['clay_loam', 'silty_clay', 'sandy_loam'],
    optimalTempRangeC: [12, 20],
    maxToleratedTempC: 28, // Extreme heat aborts flowering
    minToleratedTempC: -15, // Exceptional cold/frost tolerance in vegetative stage
    baseTemperatureC: 5.0,
    frostToleranceClass: 'hardy',
    gddRequirement: 1300,
    salinityToleranceECe: 6.5,
    salinityToleranceECw: 4.3,
    humidityToleranceTier: 'moderate',
    optimalRhRange: [45, 70],
    maxToleratedRhPct: 80,
    diseaseRiskFactorsEn: 'Persistent high humidity (>80%) during flowering promotes Sclerotinia stem rot and blackleg infection.',
    diseaseRiskFactorsAr: 'الرطوبة العالية المستمرة (>80%) أثناء التزهير تعزز العفن الأبيض الساقي (الإسكيلروتيني) والساق السوداء.',
    nitrogenFixationKgPerHa: -85, // Heavy feeder, deep taproot
    organicMatterAdditionScore: 4,
    cashCropTier: 'high',
    soilHealthRoleEn: 'Vigorous taproots penetrate hardpans up to 1.5m; biofumigation effect breaks cereal nematodes and take-all fungus.',
    soilHealthRoleAr: 'جذور وتدية قوية تكسر طبقات الصمم حتى عمق 1.5م؛ تطهير حيوي ضد نيماتودا وفطريات الحبوب.',
    rotationRulesEn: {
      idealPreceding: ['wheat', 'barley', 'potato'],
      avoidPreceding: ['canola', 'sunflower'],
      agronomicNotes: 'Supreme disease-break crop before winter wheat. Requires 3-4 year rotation to control Sclerotinia stem rot.'
    },
    rotationRulesAr: {
      idealPreceding: ['wheat', 'barley', 'potato'],
      avoidPreceding: ['canola', 'sunflower'],
      agronomicNotes: 'أفضل محصول كاسر للأمراض قبل قمح الخبز. يتطلب دورة 3-4 سنوات لتفادي عفن الساق الفطري.'
    },
    sources: {
      agronomy: 'Agriculture and Agri-Food Canada & EU Oilseeds Bulletin',
      waterReq: 'FAO Irrigation Paper 56'
    }
  },

  // 8. POTATO - Temperate / Winter Cash Tuber
  potato: {
    id: 'potato',
    nameEn: 'Field Potato',
    nameAr: 'البطاطس الحقلية',
    scientificName: 'Solanum tuberosum',
    family: 'Solanaceae',
    familyAr: 'الباذنجانيات',
    season: 'winter',
    climateZones: ['temperate', 'mediterranean', 'subtropical'],
    growingDays: 110,
    plantingMonthEn: 'March – May (Europe) / October – November (Subtropical)',
    plantingMonthAr: 'مارس – مايو (أوروبا) / أكتوبر – نوفمبر (شبه المداري)',
    harvestMonthEn: 'July – September / February – March',
    harvestMonthAr: 'يوليو – سبتمبر / فبراير – مارس',
    waterRequirementMm: 520,
    cropCoefficientKc: 1.15, // FAO-56 Table 12 mid-season Kc
    waterDemandTier: 'medium',
    optimalPhRange: [5.5, 7.0], // Prefers slightly acidic to neutral
    toleratedSoilTypes: ['sandy_loam', 'clay_loam'], // Fails in heavy silty clay
    optimalTempRangeC: [15, 21],
    maxToleratedTempC: 28, // Tuberization ceases above 27°C
    minToleratedTempC: -2, // Sensitive to hard freezing
    baseTemperatureC: 6.0,
    frostToleranceClass: 'semi_hardy',
    gddRequirement: 1250,
    salinityToleranceECe: 1.7, // Sensitive to salinity (FAO 29)
    salinityToleranceECw: 1.1,
    humidityToleranceTier: 'sensitive',
    optimalRhRange: [50, 75],
    maxToleratedRhPct: 82,
    diseaseRiskFactorsEn: 'Prolonged RH > 82% with moderate temperatures triggers late blight (Phytophthora infestans) and early blight defoliation.',
    diseaseRiskFactorsAr: 'استمرار الرطوبة فوق 82% مع اعتدال الحرارة يسبب الندوة المتأخرة (فيتوفثورا) والندوة المبكرة وسقوط الأوراق السريع.',
    nitrogenFixationKgPerHa: -90,
    organicMatterAdditionScore: 2,
    cashCropTier: 'high',
    soilHealthRoleEn: 'High gross revenue cash tuber; leaves soil loose and well-tilled for following grain crops.',
    soilHealthRoleAr: 'محصول درني نقدي عالي الربحية؛ يترك التربة مفككة وجيدة التهوية لزراعة الحبوب التالية.',
    rotationRulesEn: {
      idealPreceding: ['wheat', 'barley', 'canola', 'berseem'],
      avoidPreceding: ['potato', 'onion'],
      agronomicNotes: 'Never grow consecutively. Minimum 4-year rotation prevents cyst nematode (Globodera) and Rhizoctonia.'
    },
    rotationRulesAr: {
      idealPreceding: ['wheat', 'barley', 'canola', 'berseem'],
      avoidPreceding: ['potato', 'onion'],
      agronomicNotes: 'حذار من تكرارها سنوياً. دورة رباعية ضرورية لمنع نيماتودا الحوصلات وأعفان الدرنات.'
    },
    sources: {
      agronomy: 'International Potato Center (CIP) & Wageningen University Agronomy',
      waterReq: 'FAO Irrigation Paper 56'
    }
  },

  // 9. PADDY RICE - Warm Tropical / Monsoon Cereal
  rice: {
    id: 'rice',
    nameEn: 'Lowland Paddy Rice',
    nameAr: 'الأرز (المغمور)',
    scientificName: 'Oryza sativa',
    family: 'Poaceae (Gramineae)',
    familyAr: 'النجيليات',
    season: 'summer',
    climateZones: ['tropical', 'subtropical', 'temperate'],
    growingDays: 135,
    plantingMonthEn: 'May – June',
    plantingMonthAr: 'مايو – يونيو',
    harvestMonthEn: 'September – October',
    harvestMonthAr: 'سبتمبر – أكتوبر',
    waterRequirementMm: 1100, // High water footprint including percolation and standing water
    cropCoefficientKc: 1.20, // FAO-56 Table 12 flooded rice Kc
    waterDemandTier: 'high',
    optimalPhRange: [5.5, 7.5],
    toleratedSoilTypes: ['silty_clay', 'clay_loam'], // Requires low permeability to maintain flood
    optimalTempRangeC: [24, 32],
    maxToleratedTempC: 38,
    minToleratedTempC: 12, // Frost lethal; chilling injury below 12°C
    baseTemperatureC: 10.0,
    frostToleranceClass: 'chilling_sensitive',
    gddRequirement: 1800,
    salinityToleranceECe: 3.0,
    salinityToleranceECw: 2,
    humidityToleranceTier: 'humid_adapted',
    optimalRhRange: [65, 88],
    maxToleratedRhPct: 95,
    diseaseRiskFactorsEn: 'Adapted to high humidity (65–88%); low humidity (<50%) causes floret sterility, while >92% can elevate sheath blight and blast.',
    diseaseRiskFactorsAr: 'محصول متأقلم مع الرطوبة العالية (65-88%)؛ الرطوبة المنخفضة (<50%) تسبب عقم السنابل، بينما >92% تزيد من لفحة الغمد واللفحة.',
    nitrogenFixationKgPerHa: -80,
    organicMatterAdditionScore: 3,
    cashCropTier: 'high',
    soilHealthRoleEn: 'Flooding controls soil-borne nematodes and weed seedbanks; excellent for heavy impermeable basin clays.',
    soilHealthRoleAr: 'غمر المياه يقضي على بذور الحشائش ونيماتودا التربة؛ ملائم للأراضي الطينية الثقيلة عديمة النفاذية.',
    rotationRulesEn: {
      idealPreceding: ['berseem', 'faba_bean', 'wheat', 'soybean'],
      avoidPreceding: ['rice'],
      agronomicNotes: 'Flooded conditions alter soil redox. Succeeding winter crops must be selected for tolerance to reduced soil status.'
    },
    rotationRulesAr: {
      idealPreceding: ['berseem', 'faba_bean', 'wheat', 'soybean'],
      avoidPreceding: ['rice'],
      agronomicNotes: 'يغير الغمر الخواص الكيميائية للتربة. يلزم اختيار محاصيل شتوية تالية تتحمل التهوية المحدودة مؤقتاً.'
    },
    sources: {
      agronomy: 'International Rice Research Institute (IRRI)',
      waterReq: 'FAO Water Development Studies: Rice Water Management & FAO 56'
    }
  },

  // 10. MAIZE / CORN - Warm Season C4 Cereal (Worldwide)
  maize: {
    id: 'maize',
    nameEn: 'Maize (Field Corn)',
    nameAr: 'الذرة الشامية (الذرة الصفراء والبيضاء)',
    scientificName: 'Zea mays',
    family: 'Poaceae (Gramineae)',
    familyAr: 'النجيليات',
    season: 'summer',
    climateZones: ['tropical', 'subtropical', 'temperate', 'mediterranean'],
    growingDays: 110,
    plantingMonthEn: 'May – June',
    plantingMonthAr: 'مايو – يونيو',
    harvestMonthEn: 'August – October',
    harvestMonthAr: 'أغسطس – أكتوبر',
    waterRequirementMm: 620,
    cropCoefficientKc: 1.20, // FAO-56 Table 12 mid-season Kc
    waterDemandTier: 'high',
    optimalPhRange: [6.0, 7.8],
    toleratedSoilTypes: ['clay_loam', 'sandy_loam', 'silty_clay'],
    optimalTempRangeC: [21, 30],
    maxToleratedTempC: 38,
    minToleratedTempC: 6, // Sensitive to frost
    baseTemperatureC: 10.0,
    frostToleranceClass: 'sensitive',
    gddRequirement: 1450,
    salinityToleranceECe: 1.7, // Moderately sensitive (FAO 29 Table 4)
    salinityToleranceECw: 1.1,
    humidityToleranceTier: 'moderate',
    optimalRhRange: [50, 75],
    maxToleratedRhPct: 82,
    diseaseRiskFactorsEn: 'High humidity (>82%) during tasseling and silking fosters northern corn leaf blight and ear fungal rots.',
    diseaseRiskFactorsAr: 'الرطوبة العالية (>82%) أثناء مرحلة خروج الحريرة والتزهير تزيد من لفحة الأوراق التركمانية وعفن الكيزان الفطري.',
    nitrogenFixationKgPerHa: -100, // Heavy feeder
    organicMatterAdditionScore: 4,
    cashCropTier: 'high',
    soilHealthRoleEn: 'High productivity staple food and livestock grain; produces substantial biomass root stubble.',
    soilHealthRoleAr: 'حبوب استراتيجية عالية الإنتاجية للغذاء والأعلاف؛ تترك كتلة حيوية كبيرة من الحطب والجذور.',
    rotationRulesEn: {
      idealPreceding: ['berseem', 'faba_bean', 'soybean', 'groundnut'],
      avoidPreceding: ['maize', 'sorghum'],
      agronomicNotes: 'Yields drop sharply without preceding legume due to massive nitrogen uptake. Break cereal monoculture.'
    },
    rotationRulesAr: {
      idealPreceding: ['berseem', 'faba_bean', 'soybean', 'groundnut'],
      avoidPreceding: ['maize', 'sorghum'],
      agronomicNotes: 'تنخفض الإنتاجية بشدة عند تكرارها دون بقولي سابق بسبب استنزاف النيتروجين. تجنب توالي الحبوب.'
    },
    sources: {
      agronomy: 'CIMMYT Global Maize Program',
      waterReq: 'FAO Irrigation Paper 56'
    }
  },

  // 11. SOYBEAN - Warm Season Legume / Oilseed (Tropical, Subtropical, Temperate)
  soybean: {
    id: 'soybean',
    nameEn: 'Soybean',
    nameAr: 'فول الصويا',
    scientificName: 'Glycine max',
    family: 'Fabaceae (Leguminosae)',
    familyAr: 'البقوليات',
    season: 'summer',
    climateZones: ['tropical', 'subtropical', 'temperate'],
    growingDays: 120,
    plantingMonthEn: 'May – June',
    plantingMonthAr: 'مايو – يونيو',
    harvestMonthEn: 'September – October',
    harvestMonthAr: 'سبتمبر – أكتوبر',
    waterRequirementMm: 520,
    cropCoefficientKc: 1.15, // FAO-56 Table 12 mid-season Kc
    waterDemandTier: 'medium',
    optimalPhRange: [6.0, 7.5],
    toleratedSoilTypes: ['clay_loam', 'sandy_loam', 'silty_clay'],
    optimalTempRangeC: [22, 30],
    maxToleratedTempC: 36,
    minToleratedTempC: 4, // Frost sensitive
    baseTemperatureC: 10.0,
    frostToleranceClass: 'sensitive',
    gddRequirement: 1400,
    salinityToleranceECe: 5.0, // Moderately tolerant (FAO 29 Table 4)
    salinityToleranceECw: 3.3,
    humidityToleranceTier: 'tolerant',
    optimalRhRange: [50, 75],
    maxToleratedRhPct: 85,
    diseaseRiskFactorsEn: 'Continuous high humidity (>85%) favors Asian soybean rust (Phakopsora pachyrhizi) and Cercospora leaf blight.',
    diseaseRiskFactorsAr: 'الرطوبة المرتفعة المستمرة (>85%) تدعم انتشار صدأ الصويا وتبقع الأوراق السيركسبوري وعفن القرون.',
    nitrogenFixationKgPerHa: 90, // Biological fixation via Bradyrhizobium japonicum
    organicMatterAdditionScore: 3,
    cashCropTier: 'high',
    soilHealthRoleEn: 'Builds soil biological nitrogen (+90 kg N/ha), ideal break crop for maize or wheat rotations.',
    soilHealthRoleAr: 'يبني النيتروجين الحيوي في التربة (+90 كجم/هـ)، محصول كاسر مثالي في دورات الذرة والقمح.',
    rotationRulesEn: {
      idealPreceding: ['wheat', 'barley', 'maize'],
      avoidPreceding: ['soybean'],
      agronomicNotes: 'Core pillar of the global corn-soybean rotation. Excellent synergy preceding winter wheat.'
    },
    rotationRulesAr: {
      idealPreceding: ['wheat', 'barley', 'maize'],
      avoidPreceding: ['soybean'],
      agronomicNotes: 'عماد الدورات المحصولية العالمية بالتبادل مع الذرة، وتوافق ممتاز يسبق القمح الشتوي.'
    },
    sources: {
      agronomy: 'Iowa State University Agronomy & Embrapa Soybean Guides',
      waterReq: 'FAO Irrigation Paper 56'
    }
  },

  // 12. CHICKPEA - Mediterranean / Semi-Arid Pulse
  chickpea: {
    id: 'chickpea',
    nameEn: 'Chickpea (Garbanzo Bean)',
    nameAr: 'الحمص (حمص الشام)',
    scientificName: 'Cicer arietinum',
    family: 'Fabaceae (Leguminosae)',
    familyAr: 'البقوليات',
    season: 'winter',
    climateZones: ['mediterranean', 'semi_arid', 'arid'],
    growingDays: 130,
    plantingMonthEn: 'October – December / March – April',
    plantingMonthAr: 'أكتوبر – ديسمبر / مارس – أبريل',
    harvestMonthEn: 'April – June',
    harvestMonthAr: 'أبريل – يونيو',
    waterRequirementMm: 320, // Very low water footprint
    cropCoefficientKc: 1.00, // FAO-56 Table 12
    waterDemandTier: 'low',
    optimalPhRange: [6.5, 8.2],
    toleratedSoilTypes: ['clay_loam', 'sandy_loam', 'calcareous'],
    optimalTempRangeC: [16, 24],
    maxToleratedTempC: 34,
    minToleratedTempC: -5, // Tolerates light frost
    baseTemperatureC: 5.0,
    frostToleranceClass: 'semi_hardy',
    gddRequirement: 1200,
    salinityToleranceECe: 1.5, // Salinity sensitive (FAO 29 Table 4)
    salinityToleranceECw: 1,
    humidityToleranceTier: 'sensitive',
    optimalRhRange: [35, 60],
    maxToleratedRhPct: 72,
    diseaseRiskFactorsEn: 'Exceptionally sensitive to humidity (>72%); rapidly develops devastating Ascochyta blight and Botrytis gray mold.',
    diseaseRiskFactorsAr: 'حساس للغاية للرطوبة الجوية (>72%)؛ تؤدي الرطوبة المرتفعة لهلاك المحصول بلفحة الأسكوكيتا وعفن البوتريتس الرمادي.',
    nitrogenFixationKgPerHa: 80,
    organicMatterAdditionScore: 3,
    cashCropTier: 'high',
    soilHealthRoleEn: 'Drought-hardy pulse fixing +80 kg N/ha; deep taproot decompacts subsoil in rainfed Mediterranean environments.',
    soilHealthRoleAr: 'بقولي صامد للجفاف يثبت +80 كجم نيتروجين/هكتار، ويفكك الطبقات تحت السطحية في مناخات البحر المتوسط.',
    rotationRulesEn: {
      idealPreceding: ['wheat', 'barley', 'sorghum'],
      avoidPreceding: ['chickpea'],
      agronomicNotes: 'Ideal pulse break crop in cereal-dominant Mediterranean rotations. Avoid waterlogged or heavy saline plots.'
    },
    rotationRulesAr: {
      idealPreceding: ['wheat', 'barley', 'sorghum'],
      avoidPreceding: ['chickpea'],
      agronomicNotes: 'محصول كاسر مثالي في دورات البحر المتوسط المعتمدة على الحبوب. تجنب الأراضي الغدقة أو الملحية.'
    },
    sources: {
      agronomy: 'ICARDA Chickpea Improvement Program',
      waterReq: 'FAO Drainage Paper 56'
    }
  },

  // 13. SESAME - Heat & Drought Hardy Arid Oilseed
  sesame: {
    id: 'sesame',
    nameEn: 'Sesame (Golden Oilseed)',
    nameAr: 'السمسم (محصول الزيت الذهبي)',
    scientificName: 'Sesamum indicum',
    family: 'Pedaliaceae',
    familyAr: 'السمسميات',
    season: 'summer',
    climateZones: ['arid', 'semi_arid', 'tropical', 'subtropical'],
    growingDays: 100,
    plantingMonthEn: 'April – May',
    plantingMonthAr: 'أبريل – مايو',
    harvestMonthEn: 'August – September',
    harvestMonthAr: 'أغسطس – سبتمبر',
    waterRequirementMm: 330,
    cropCoefficientKc: 0.90, // Low water use oilseed
    waterDemandTier: 'low',
    optimalPhRange: [6.2, 8.0],
    toleratedSoilTypes: ['sandy_loam', 'clay_loam', 'sandy'],
    optimalTempRangeC: [26, 36],
    maxToleratedTempC: 43,
    minToleratedTempC: 10, // Chilling sensitive; zero frost tolerance
    baseTemperatureC: 10.0,
    frostToleranceClass: 'chilling_sensitive',
    gddRequirement: 1400,
    salinityToleranceECe: 3.5, // Moderately sensitive (FAO 29)
    salinityToleranceECw: 2.3,
    humidityToleranceTier: 'sensitive',
    optimalRhRange: [35, 60],
    maxToleratedRhPct: 70,
    diseaseRiskFactorsEn: 'Requires dry atmospheric conditions; humidity above 70% precipitates fungal root rots, Macrophomina stem rot, and foliar blights.',
    diseaseRiskFactorsAr: 'يتطلب أجواء جافة مشمسة؛ الرطوبة فوق 70% تؤدي لانتشار عفن الجذور وساق الماكروفومينا واللفحة الورقية.',
    nitrogenFixationKgPerHa: -40,
    organicMatterAdditionScore: 2,
    cashCropTier: 'high',
    soilHealthRoleEn: 'Survives extreme heat spells on marginal light soils; quick summer cash crop with low water consumption.',
    soilHealthRoleAr: 'يتحمل موجات القيظ الشديدة في الأراضي الخفيفة؛ محصول نقدي صيفي سريع قليل استهلاك المياه.',
    rotationRulesEn: {
      idealPreceding: ['wheat', 'faba_bean', 'berseem', 'barley'],
      avoidPreceding: ['sesame'],
      agronomicNotes: 'Excellent catch cash crop after early-harvested winter legumes or wheat. Fails in waterlogged fields.'
    },
    rotationRulesAr: {
      idealPreceding: ['wheat', 'faba_bean', 'berseem', 'barley'],
      avoidPreceding: ['sesame'],
      agronomicNotes: 'محصول نقدي ممتاز بعد البقوليات الشتوية أو القمح المبكر. يتضرر بشدة من ركود مياه الري.'
    },
    sources: {
      agronomy: 'FAO Tropical Oilseeds & Egyptian ARC Field Crops Institute',
      waterReq: 'FAO Irrigation Paper 56'
    }
  },

  // 14. GROUNDNUT / PEANUT - Tropical / Subtropical Legume for Sandy Soils
  groundnut: {
    id: 'groundnut',
    nameEn: 'Groundnut (Peanut)',
    nameAr: 'الفول السوداني',
    scientificName: 'Arachis hypogaea',
    family: 'Fabaceae (Leguminosae)',
    familyAr: 'البقوليات',
    season: 'summer',
    climateZones: ['tropical', 'subtropical', 'arid', 'semi_arid'],
    growingDays: 125,
    plantingMonthEn: 'April – May',
    plantingMonthAr: 'أبريل – مايو',
    harvestMonthEn: 'September – October',
    harvestMonthAr: 'سبتمبر – أكتوبر',
    waterRequirementMm: 480,
    cropCoefficientKc: 1.05, // FAO-56 Table 12 mid-season Kc
    waterDemandTier: 'medium',
    optimalPhRange: [5.8, 7.5],
    toleratedSoilTypes: ['sandy_loam', 'sandy'], // Requires loose sand/loam for peg penetration
    optimalTempRangeC: [24, 32],
    maxToleratedTempC: 40,
    minToleratedTempC: 8, // Chilling injury below 10°C, frost intolerant
    baseTemperatureC: 10.0,
    frostToleranceClass: 'sensitive',
    gddRequirement: 1550,
    salinityToleranceECe: 3.2, // Moderately sensitive (FAO 29 Table 4)
    salinityToleranceECw: 2.1,
    humidityToleranceTier: 'moderate',
    optimalRhRange: [50, 75],
    maxToleratedRhPct: 82,
    diseaseRiskFactorsEn: 'High humidity (>82%) accelerates early and late leaf spots (Cercospora) and increases aflatoxin contamination risk if damp at harvest.',
    diseaseRiskFactorsAr: 'الرطوبة العالية (>82%) تسرع ظهور تبقعات أوراق السركسبورا وخطر تلوث القرون بفطريات الأفلاتوكسين عند الحصاد.',
    nitrogenFixationKgPerHa: 70,
    organicMatterAdditionScore: 3,
    cashCropTier: 'high',
    soilHealthRoleEn: 'Fixes biological nitrogen (+70 kg N/ha) on light sandy reclamation soils where other legumes struggle.',
    soilHealthRoleAr: 'يثبت النيتروجين الحيوي (+70 كجم/هـ) في الأراضي الرملية الخفيفة المستصلحة التي تعاني من فقر العناصر.',
    rotationRulesEn: {
      idealPreceding: ['wheat', 'barley', 'fallow'],
      avoidPreceding: ['groundnut'],
      agronomicNotes: 'Essential cash rotation legume for sandy reclamation fringes. Alternate with winter cereals.'
    },
    rotationRulesAr: {
      idealPreceding: ['wheat', 'barley', 'fallow'],
      avoidPreceding: ['groundnut'],
      agronomicNotes: 'بقولي نقدي أساسي للأراضي الرملية المستصلحة. يُفضل تناوبه مع الحبوب الشتوية كالقمح والشعير.'
    },
    sources: {
      agronomy: 'ICRISAT Groundnut Breeding Program & ARC Egypt',
      waterReq: 'FAO Irrigation Paper 56'
    }
  },

  // 15. SUNFLOWER - Deep Rooted Semi-Arid / Mediterranean Oilseed
  sunflower: {
    id: 'sunflower',
    nameEn: 'Sunflower (Oilseed)',
    nameAr: 'دوار الشمس (عباد الشمس الزيتي)',
    scientificName: 'Helianthus annuus',
    family: 'Asteraceae (Compositae)',
    familyAr: 'النجميات (المركبة)',
    season: 'summer',
    climateZones: ['mediterranean', 'semi_arid', 'temperate', 'subtropical'],
    growingDays: 95,
    plantingMonthEn: 'April – June',
    plantingMonthAr: 'أبريل – يونيو',
    harvestMonthEn: 'July – September',
    harvestMonthAr: 'يوليو – سبتمبر',
    waterRequirementMm: 450,
    cropCoefficientKc: 1.05, // FAO-56 Table 12 mid-season Kc
    waterDemandTier: 'medium',
    optimalPhRange: [6.0, 8.0],
    toleratedSoilTypes: ['clay_loam', 'sandy_loam', 'silty_clay', 'calcareous'],
    optimalTempRangeC: [18, 28],
    maxToleratedTempC: 36,
    minToleratedTempC: 2, // Light frost tolerant as seedling
    baseTemperatureC: 6.0,
    frostToleranceClass: 'semi_hardy',
    gddRequirement: 1300,
    salinityToleranceECe: 4.8, // Moderately tolerant (FAO 29 Table 4)
    salinityToleranceECw: 3.7,
    humidityToleranceTier: 'moderate',
    optimalRhRange: [40, 70],
    maxToleratedRhPct: 80,
    diseaseRiskFactorsEn: 'Humidity above 80% during flowering predisposes the flower heads to Sclerotinia head rot and Rhizopus infection.',
    diseaseRiskFactorsAr: 'الرطوبة التي تتجاوز 80% أثناء تفتح النورات تجعل الأقراص الزهرية عرضة لعفن الرأس الإسكيلروتيني وعفن الرايزوبس.',
    nitrogenFixationKgPerHa: -60,
    organicMatterAdditionScore: 3,
    cashCropTier: 'high',
    soilHealthRoleEn: 'Deep taproot extracts subsoil water and residual nitrogen down to 2m, protecting groundwater from nitrate leaching.',
    soilHealthRoleAr: 'جذور وتدية عميقة تمتص المياه والنيتروجين المتسرب حتى عمق مترين، مما يحمي المياه الجوفية من تلوث النترات.',
    rotationRulesEn: {
      idealPreceding: ['wheat', 'barley', 'faba_bean', 'chickpea'],
      avoidPreceding: ['sunflower', 'canola'],
      agronomicNotes: 'Breaks cereal disease cycles. Avoid growing after canola to prevent Sclerotinia disease carryover.'
    },
    rotationRulesAr: {
      idealPreceding: ['wheat', 'barley', 'faba_bean', 'chickpea'],
      avoidPreceding: ['sunflower', 'canola'],
      agronomicNotes: 'يكسر دورة أمراض الحبوب. تجنب زراعته بعد الكانولا لتفادي انتقال مرض العفن الأبيض المشترك.'
    },
    sources: {
      agronomy: 'FAO Oil Crops Technical Network',
      waterReq: 'FAO Irrigation Paper 56'
    }
  },
  // 16. OATS - Cool Season Dual Cereal & Forage
  oats: {
    id: 'oats',
    nameEn: 'Oats (Grain & Forage)',
    nameAr: 'الشوفان (للحبوب والأعلاف)',
    scientificName: 'Avena sativa',
    family: 'Poaceae (Gramineae)',
    familyAr: 'النجيليات',
    season: 'winter',
    climateZones: ['temperate', 'mediterranean', 'semi_arid'],
    growingDays: 125,
    plantingMonthEn: 'October – November (Winter) / March – April (Spring)',
    plantingMonthAr: 'أكتوبر – نوفمبر (شتوي) / مارس – أبريل (ربيعي)',
    harvestMonthEn: 'April – June',
    harvestMonthAr: 'أبريل – يونيو',
    waterRequirementMm: 450,
    cropCoefficientKc: 1.15, // FAO-56 Table 12 mid-season Kc
    waterDemandTier: 'medium',
    optimalPhRange: [5.5, 7.5],
    toleratedSoilTypes: ['clay_loam', 'sandy_loam', 'silty_clay'],
    optimalTempRangeC: [15, 22],
    maxToleratedTempC: 30,
    minToleratedTempC: -8, // Hardy during tillering
    baseTemperatureC: 4.0,
    frostToleranceClass: 'hardy',
    gddRequirement: 1300,
    salinityToleranceECe: 3.0, // FAO 29 Table 4
    salinityToleranceECw: 2.0,
    humidityToleranceTier: 'moderate',
    optimalRhRange: [45, 70],
    maxToleratedRhPct: 80,
    diseaseRiskFactorsEn: 'High humidity (>80%) and cool moist conditions trigger crown rust (Puccinia coronata) and powdery mildew.',
    diseaseRiskFactorsAr: 'الرطوبة العالية (>80%) والأجواء الرطبة المعتدلة تحفز الإصابة بصدأ التاج (Puccinia coronata) والبياض الدقيقي.',
    nitrogenFixationKgPerHa: -55,
    organicMatterAdditionScore: 4,
    cashCropTier: 'medium',
    soilHealthRoleEn: 'Dense fibrous root system scavenges residual soil nitrogen and builds soil organic matter; excellent allelopathic weed suppressor.',
    soilHealthRoleAr: 'جذور ليفية كثيفة تمتص بقايا النيتروجين وتبني المادة العضوية في التربة؛ وتثبط الحشائش بفعل الإفرازات الأليلوباثية.',
    rotationRulesEn: {
      idealPreceding: ['faba_bean', 'berseem', 'soybean', 'cowpea'],
      avoidPreceding: ['oats', 'wheat', 'barley'],
      agronomicNotes: 'Excellent break crop following legumes; avoid following other cereals to reduce crown rot buildup.'
    },
    rotationRulesAr: {
      idealPreceding: ['faba_bean', 'berseem', 'soybean', 'cowpea'],
      avoidPreceding: ['oats', 'wheat', 'barley'],
      agronomicNotes: 'محصول كاسر ممتاز بعد البقوليات؛ تجنب زراعته بعد محاصيل الحبوب النجيلية للحد من تراكم تعفنات الجذور.'
    },
    sources: {
      agronomy: 'FAO ECOCROP & ICARDA Cereal Program',
      waterReq: 'FAO Irrigation Paper 56'
    }
  },

  // 17. PEARL MILLET - Arid C4 Summer Grain
  millet: {
    id: 'millet',
    nameEn: 'Pearl Millet (Grain & Fodder)',
    nameAr: 'دخن اللؤلؤ (للحبوب والأعلاف)',
    scientificName: 'Pennisetum glaucum',
    family: 'Poaceae (Gramineae)',
    familyAr: 'النجيليات',
    season: 'summer',
    climateZones: ['arid', 'semi_arid', 'tropical', 'subtropical'],
    growingDays: 85,
    plantingMonthEn: 'May – July',
    plantingMonthAr: 'مايو – يوليو',
    harvestMonthEn: 'August – October',
    harvestMonthAr: 'أغسطس – أكتوبر',
    waterRequirementMm: 350,
    cropCoefficientKc: 1.00, // FAO-56 Table 12 mid-season Kc
    waterDemandTier: 'low',
    optimalPhRange: [5.5, 8.2],
    toleratedSoilTypes: ['sandy', 'sandy_loam', 'clay_loam', 'calcareous'],
    optimalTempRangeC: [26, 36],
    maxToleratedTempC: 45, // Extreme C4 heat tolerance
    minToleratedTempC: 10, // Chilling sensitive
    baseTemperatureC: 10.0,
    frostToleranceClass: 'sensitive',
    gddRequirement: 1400,
    salinityToleranceECe: 4.0, // FAO 29 Table 4
    salinityToleranceECw: 2.7,
    humidityToleranceTier: 'tolerant',
    optimalRhRange: [30, 60],
    maxToleratedRhPct: 75,
    diseaseRiskFactorsEn: 'High humidity (>75%) combined with warm rain during flowering predisposes heads to ergot (Claviceps fusiformis) and downy mildew.',
    diseaseRiskFactorsAr: 'الرطوبة العالية (>75%) مع الدفء أثناء التزهير تؤدي لظهور فطر الإرجوت (Claviceps fusiformis) والبياض الزغبي.',
    nitrogenFixationKgPerHa: -45,
    organicMatterAdditionScore: 3,
    cashCropTier: 'low',
    soilHealthRoleEn: 'Unmatched drought and heat resilience on marginal sandy soils; deep penetrating root system prevents erosion in drylands.',
    soilHealthRoleAr: 'قدرة فائقة على الصمود في الأراضي الرملية الجافة؛ شبكة جذور عميقة تحمي الأراضي الهامشية من التعرية وتستغل الرطوبة النادرة.',
    rotationRulesEn: {
      idealPreceding: ['cowpea', 'groundnut', 'faba_bean', 'chickpea'],
      avoidPreceding: ['millet', 'sorghum'],
      agronomicNotes: 'Thrives on sandy soils following grain legumes; alternate with cowpea or groundnut for sustainable semi-arid multi-cropping.'
    },
    rotationRulesAr: {
      idealPreceding: ['cowpea', 'groundnut', 'faba_bean', 'chickpea'],
      avoidPreceding: ['millet', 'sorghum'],
      agronomicNotes: 'ينمو بقوة في الأراضي الرملية بعد البقوليات؛ يفضل التناوب مع اللوبيا أو الفول السوداني في النظم الزراعية الجافة.'
    },
    sources: {
      agronomy: 'ICRISAT Semi-Arid Tropics Mandate & FAO ECOCROP',
      waterReq: 'FAO Irrigation Paper 56'
    }
  },

  // 18. COWPEA - Heat-Tolerant Summer Legume
  cowpea: {
    id: 'cowpea',
    nameEn: 'Cowpea (Black-Eyed Pea)',
    nameAr: 'اللوبيا (لوبيا العيون السوداء)',
    scientificName: 'Vigna unguiculata',
    family: 'Fabaceae (Leguminosae)',
    familyAr: 'البقوليات',
    season: 'summer',
    climateZones: ['arid', 'semi_arid', 'tropical', 'subtropical'],
    growingDays: 80,
    plantingMonthEn: 'May – July',
    plantingMonthAr: 'مايو – يوليو',
    harvestMonthEn: 'August – October',
    harvestMonthAr: 'أغسطس – أكتوبر',
    waterRequirementMm: 380,
    cropCoefficientKc: 1.05, // FAO-56 Table 12 mid-season Kc
    waterDemandTier: 'low',
    optimalPhRange: [5.8, 7.8],
    toleratedSoilTypes: ['sandy', 'sandy_loam', 'clay_loam'],
    optimalTempRangeC: [24, 35],
    maxToleratedTempC: 42,
    minToleratedTempC: 10,
    baseTemperatureC: 8.5,
    frostToleranceClass: 'sensitive',
    gddRequirement: 1200,
    salinityToleranceECe: 4.9, // FAO 29 Table 4 (moderately tolerant)
    salinityToleranceECw: 3.3,
    humidityToleranceTier: 'moderate',
    optimalRhRange: [40, 70],
    maxToleratedRhPct: 80,
    diseaseRiskFactorsEn: 'Extended humidity above 80% fosters Cercospora leaf spot, anthracnose, and viral mosaic transmission by aphids.',
    diseaseRiskFactorsAr: 'الرطوبة الزائدة عن 80% تشجع تبقع الأوراق السركسبوري والأنثراكنوز وانتشار الفيروسات عبر حشرات المن.',
    nitrogenFixationKgPerHa: 70,
    organicMatterAdditionScore: 3,
    cashCropTier: 'medium',
    soilHealthRoleEn: 'Remarkable biological nitrogen fixer (+70 kg N/ha) that thrives in hot summer weather and poor sandy soils; provides quick ground cover.',
    soilHealthRoleAr: 'تثبيت حيوي ممتاز للنيتروجين (+70 كجم N/هـ) في حرارة الصيف والتربة الرملية الضعيفة؛ يوفر تغطية سريعة تحمي سطح التربة.',
    rotationRulesEn: {
      idealPreceding: ['wheat', 'barley', 'oats', 'millet'],
      avoidPreceding: ['cowpea', 'soybean', 'groundnut'],
      agronomicNotes: 'Premier summer legume for arid crop rotations; provides excellent nitrogen credit for subsequent winter cereals.'
    },
    rotationRulesAr: {
      idealPreceding: ['wheat', 'barley', 'oats', 'millet'],
      avoidPreceding: ['cowpea', 'soybean', 'groundnut'],
      agronomicNotes: 'بقول صيفي مثالي للدورات الجافة؛ يترك رصيداً نيتروجينياً وفيراً لمحاصيل الحبوب الشتوية التالية.'
    },
    sources: {
      agronomy: 'IITA / ICRISAT Grain Legume Program & FAO ECOCROP',
      waterReq: 'FAO Irrigation Paper 56'
    }
  },

  // 19. LENTIL - Mediterranean & Semi-Arid Winter Pulse
  lentil: {
    id: 'lentil',
    nameEn: 'Lentil (Red & Brown)',
    nameAr: 'العدس (الأحمر والبني)',
    scientificName: 'Lens culinaris',
    family: 'Fabaceae (Leguminosae)',
    familyAr: 'البقوليات',
    season: 'winter',
    climateZones: ['semi_arid', 'mediterranean', 'temperate'],
    growingDays: 120,
    plantingMonthEn: 'October – December',
    plantingMonthAr: 'أكتوبر – ديسمبر',
    harvestMonthEn: 'March – May',
    harvestMonthAr: 'مارس – مايو',
    waterRequirementMm: 360,
    cropCoefficientKc: 1.00, // FAO-56 Table 12 mid-season Kc
    waterDemandTier: 'low',
    optimalPhRange: [6.0, 8.2],
    toleratedSoilTypes: ['clay_loam', 'sandy_loam', 'silty_clay', 'calcareous'],
    optimalTempRangeC: [15, 24],
    maxToleratedTempC: 32,
    minToleratedTempC: -6,
    baseTemperatureC: 2.0,
    frostToleranceClass: 'semi_hardy',
    gddRequirement: 1100,
    salinityToleranceECe: 1.5, // FAO 29 Table 4 (sensitive)
    salinityToleranceECw: 1.0,
    humidityToleranceTier: 'sensitive',
    optimalRhRange: [40, 65],
    maxToleratedRhPct: 72,
    diseaseRiskFactorsEn: 'Highly susceptible to Ascochyta blight and Botrytis grey mold under prolonged atmospheric humidity exceeding 72%.',
    diseaseRiskFactorsAr: 'شديد الحساسية للفحة الأسكوكيتا والعفن الرمادي البوتريتيس عند ارتفاع الرطوبة النسبية لأكثر من 72%.',
    nitrogenFixationKgPerHa: 65,
    organicMatterAdditionScore: 2,
    cashCropTier: 'high',
    soilHealthRoleEn: 'High-value protein pulse fixing biological nitrogen (+65 kg N/ha); leaves soil enriched and friable for summer cereals.',
    soilHealthRoleAr: 'بقوليات غذائية عالية القيمة السوقية تثبت النيتروجين الحيوي (+65 كجم N/هـ)؛ وتترك التربة غنية ومفككة لمحاصيل الحبوب الصيفية.',
    rotationRulesEn: {
      idealPreceding: ['wheat', 'barley', 'maize', 'sorghum'],
      avoidPreceding: ['lentil', 'faba_bean', 'chickpea'],
      agronomicNotes: 'Maintain a 3-year gap between pulse crops to prevent Fusarium wilt and Ascochyta blight buildup.'
    },
    rotationRulesAr: {
      idealPreceding: ['wheat', 'barley', 'maize', 'sorghum'],
      avoidPreceding: ['lentil', 'faba_bean', 'chickpea'],
      agronomicNotes: 'يجب مراعاة فاصل 3 سنوات بين البقوليات لتفادي تراكم فطريات الذبول الفيوزارمي والأسكوكيتا.'
    },
    sources: {
      agronomy: 'ICARDA Food Legume Program & FAO ECOCROP',
      waterReq: 'FAO Irrigation Paper 56'
    }
  },

  // 20. COMMON BEAN - Grain Legume & Cash Pulse
  common_bean: {
    id: 'common_bean',
    nameEn: 'Common Dry Bean (Haricot / Navy)',
    nameAr: 'الفاصوليا الجافة (الفاصوليا البيضاء)',
    scientificName: 'Phaseolus vulgaris',
    family: 'Fabaceae (Leguminosae)',
    familyAr: 'البقوليات',
    season: 'summer',
    climateZones: ['temperate', 'subtropical', 'mediterranean'],
    growingDays: 95,
    plantingMonthEn: 'April – June',
    plantingMonthAr: 'أبريل – يونيو',
    harvestMonthEn: 'July – September',
    harvestMonthAr: 'يوليو – سبتمبر',
    waterRequirementMm: 420,
    cropCoefficientKc: 1.05, // FAO-56 Table 12 mid-season Kc
    waterDemandTier: 'medium',
    optimalPhRange: [6.0, 7.5],
    toleratedSoilTypes: ['clay_loam', 'sandy_loam'],
    optimalTempRangeC: [18, 28],
    maxToleratedTempC: 34, // Pollen sterility above 34°C
    minToleratedTempC: 2,
    baseTemperatureC: 8.0,
    frostToleranceClass: 'sensitive',
    gddRequirement: 1150,
    salinityToleranceECe: 1.0, // FAO 29 Table 4 (extremely sensitive)
    salinityToleranceECw: 0.7,
    humidityToleranceTier: 'moderate',
    optimalRhRange: [50, 75],
    maxToleratedRhPct: 80,
    diseaseRiskFactorsEn: 'High humidity (>80%) accelerates white mold (Sclerotinia sclerotiorum) and bacterial halo blight (Pseudomonas).',
    diseaseRiskFactorsAr: 'الرطوبة المرتفعة (>80%) تفاقم انتشار العفن الأبيض الإسكيلروتيني واللفحة البكتيرية الهالية.',
    nitrogenFixationKgPerHa: 45,
    organicMatterAdditionScore: 2,
    cashCropTier: 'high',
    soilHealthRoleEn: 'High commercial cash value grain legume; moderate biological nitrogen fixation (+45 kg N/ha) with shallow taproot.',
    soilHealthRoleAr: 'بقوليات نقدية ذات عائد تجاري مرتفع؛ تثبيت معتدل للنيتروجين (+45 كجم N/هـ) بجذور وتدية سطحية.',
    rotationRulesEn: {
      idealPreceding: ['wheat', 'maize', 'barley'],
      avoidPreceding: ['common_bean', 'soybean', 'sunflower'],
      agronomicNotes: 'Avoid planting after sunflower or canola due to common susceptibility to Sclerotinia sclerotiorum.'
    },
    rotationRulesAr: {
      idealPreceding: ['wheat', 'maize', 'barley'],
      avoidPreceding: ['common_bean', 'soybean', 'sunflower'],
      agronomicNotes: 'تجنب الزراعة بعد دوار الشمس أو الكانولا لاشتراكها في الإصابة بمرض العفن الأبيض الإسكيلروتيني.'
    },
    sources: {
      agronomy: 'CIAT / FAO ECOCROP',
      waterReq: 'FAO Irrigation Paper 56'
    }
  },

  // 21. FIELD PEA - Cool Season Pulse & Cover Crop
  field_pea: {
    id: 'field_pea',
    nameEn: 'Field Pea (Dry & Forage Pea)',
    nameAr: 'البازلاء الحقلية (بسلة العلف والحبوب)',
    scientificName: 'Pisum sativum var. arvense',
    family: 'Fabaceae (Leguminosae)',
    familyAr: 'البقوليات',
    season: 'winter',
    climateZones: ['temperate', 'mediterranean', 'semi_arid'],
    growingDays: 110,
    plantingMonthEn: 'October – November',
    plantingMonthAr: 'أكتوبر – نوفمبر',
    harvestMonthEn: 'March – May',
    harvestMonthAr: 'مارس – مايو',
    waterRequirementMm: 380,
    cropCoefficientKc: 1.00, // FAO-56 Table 12 mid-season Kc
    waterDemandTier: 'low',
    optimalPhRange: [6.0, 7.8],
    toleratedSoilTypes: ['clay_loam', 'sandy_loam', 'silty_clay'],
    optimalTempRangeC: [14, 22],
    maxToleratedTempC: 30,
    minToleratedTempC: -7,
    baseTemperatureC: 1.0,
    frostToleranceClass: 'hardy',
    gddRequirement: 1100,
    salinityToleranceECe: 1.5, // FAO 29 Table 4
    salinityToleranceECw: 1.0,
    humidityToleranceTier: 'moderate',
    optimalRhRange: [45, 65],
    maxToleratedRhPct: 75,
    diseaseRiskFactorsEn: 'Relative humidity above 75% rapidly triggers powdery mildew (Erysiphe pisi) and Mycosphaerella blight.',
    diseaseRiskFactorsAr: 'الرطوبة النسبية فوق 75% تحفز تفشي البياض الدقيقي (Erysiphe pisi) ولفحة الميكوسفيريلا.',
    nitrogenFixationKgPerHa: 75,
    organicMatterAdditionScore: 3,
    cashCropTier: 'medium',
    soilHealthRoleEn: 'Powerhouse cool-season nitrogen fixer (+75 kg N/ha); short growing duration leaves field early for optimal summer planting.',
    soilHealthRoleAr: 'محصول شتوي قوي في تثبيت النيتروجين (+75 كجم N/هـ)؛ فترة نمو سريعة تتيح إخلاء الحقل مبكراً لزراعة الصيفي في موعده.',
    rotationRulesEn: {
      idealPreceding: ['wheat', 'barley', 'maize', 'sorghum'],
      avoidPreceding: ['field_pea', 'chickpea', 'lentil', 'faba_bean'],
      agronomicNotes: 'Superb cereal break crop; inoculate with Rhizobium leguminosarum bv. viciae for maximum nodulation.'
    },
    rotationRulesAr: {
      idealPreceding: ['wheat', 'barley', 'maize', 'sorghum'],
      avoidPreceding: ['field_pea', 'chickpea', 'lentil', 'faba_bean'],
      agronomicNotes: 'كاسر مثالي لمحاصيل الحبوب؛ يلقح بالعقدين البكتيري لضمان أعلى كفاءة في تثبيت النيتروجين.'
    },
    sources: {
      agronomy: 'ICARDA & FAO ECOCROP',
      waterReq: 'FAO Irrigation Paper 56'
    }
  },

  // 22. COTTON - High-Value Fiber & Industrial Cash Crop
  cotton: {
    id: 'cotton',
    nameEn: 'Cotton (Long & Medium Staple)',
    nameAr: 'القطن (طويل ومتوسط التيلة)',
    scientificName: 'Gossypium barbadense / G. hirsutum',
    family: 'Malvaceae',
    familyAr: 'الخبازيات',
    season: 'summer',
    climateZones: ['arid', 'semi_arid', 'subtropical', 'tropical'],
    growingDays: 165,
    plantingMonthEn: 'March – May',
    plantingMonthAr: 'مارس – مايو',
    harvestMonthEn: 'September – November',
    harvestMonthAr: 'سبتمبر – نوفمبر',
    waterRequirementMm: 700,
    cropCoefficientKc: 1.15, // FAO-56 Table 12 mid-season Kc
    waterDemandTier: 'high',
    optimalPhRange: [6.5, 8.5],
    toleratedSoilTypes: ['clay_loam', 'silty_clay', 'sandy_loam'],
    optimalTempRangeC: [25, 35],
    maxToleratedTempC: 44,
    minToleratedTempC: 12, // Sensitive to chilling
    baseTemperatureC: 15.0,
    frostToleranceClass: 'sensitive',
    gddRequirement: 2100,
    salinityToleranceECe: 7.7, // FAO 29 Table 4 (highly tolerant)
    salinityToleranceECw: 5.1,
    humidityToleranceTier: 'moderate',
    optimalRhRange: [40, 70],
    maxToleratedRhPct: 80,
    diseaseRiskFactorsEn: 'Atmospheric humidity above 80% during boll opening causes boll rots and damages fiber grade and lint color.',
    diseaseRiskFactorsAr: 'الرطوبة العالية (>80%) أثناء تفتح اللوز تؤدي لعفن اللوز وتدهور رتبة التيلة ولون القطن.',
    nitrogenFixationKgPerHa: -90,
    organicMatterAdditionScore: 3,
    cashCropTier: 'high',
    soilHealthRoleEn: 'Deep taproot (up to 2m) opens subsoil hardpans and mines deep nutrients; highly tolerant of salinity and alkaline soils.',
    soilHealthRoleAr: 'جذر وتدي متعمق (حتى مترين) يفكك طبقات التربة الصماء ويمتص العناصر من الأعماق؛ فائق التحمل للملوحة والقلوية.',
    rotationRulesEn: {
      idealPreceding: ['berseem', 'faba_bean', 'wheat', 'barley'],
      avoidPreceding: ['cotton'],
      agronomicNotes: 'Rotate after berseem clover or winter grain legumes to counter heavy nitrogen extraction and break bollworm cycles.'
    },
    rotationRulesAr: {
      idealPreceding: ['berseem', 'faba_bean', 'wheat', 'barley'],
      avoidPreceding: ['cotton'],
      agronomicNotes: 'يُزرع عقب البرسيم التحريش أو البقوليات الشتوية لتعويض استنزاف النيتروجين وكسر دورات ديدان اللوز.'
    },
    sources: {
      agronomy: 'Cotton Research Institute (ARC Egypt) & FAO ECOCROP',
      waterReq: 'FAO Irrigation Paper 56'
    }
  },

  // 23. SUGARCANE - Tropical Perennial C4 Sugar Crop
  sugarcane: {
    id: 'sugarcane',
    nameEn: 'Sugarcane',
    nameAr: 'قصب السكر',
    scientificName: 'Saccharum officinarum',
    family: 'Poaceae (Gramineae)',
    familyAr: 'النجيليات',
    season: 'summer',
    climateZones: ['tropical', 'subtropical', 'arid'],
    growingDays: 300,
    plantingMonthEn: 'February – April / August – October',
    plantingMonthAr: 'فبراير – أبريل / أغسطس – أكتوبر',
    harvestMonthEn: 'December – April',
    harvestMonthAr: 'ديسمبر – أبريل',
    waterRequirementMm: 1200,
    cropCoefficientKc: 1.25, // FAO-56 Table 12 mid-season Kc
    waterDemandTier: 'high',
    optimalPhRange: [6.0, 8.0],
    toleratedSoilTypes: ['clay_loam', 'silty_clay', 'sandy_loam'],
    optimalTempRangeC: [26, 35],
    maxToleratedTempC: 42,
    minToleratedTempC: 12,
    baseTemperatureC: 12.0,
    frostToleranceClass: 'sensitive',
    gddRequirement: 2800,
    salinityToleranceECe: 1.7, // FAO 29 Table 4 (moderately sensitive)
    salinityToleranceECw: 1.1,
    humidityToleranceTier: 'humid_adapted',
    optimalRhRange: [60, 85],
    maxToleratedRhPct: 90,
    diseaseRiskFactorsEn: 'Very high humidity (>90%) with warm temperatures favors red rot (Colletotrichum falcatum) and smut (Sporisorium scitamineum).',
    diseaseRiskFactorsAr: 'الرطوبة الشديدة (>90%) مع الحرارة المرتفعة تحفز العفن الأحمر (Colletotrichum falcatum) وتفحم القصب.',
    nitrogenFixationKgPerHa: -130,
    organicMatterAdditionScore: 5,
    cashCropTier: 'high',
    soilHealthRoleEn: 'Massive biomass producer adding heavy root organic matter; requires intensive irrigation and long duration.',
    soilHealthRoleAr: 'إنتاجية هائلة من الكتلة الحيوية تضيف مادة عضوية ضخمة للتربة؛ يتطلب وفرة مائية عالية وموسماً طويلاً.',
    rotationRulesEn: {
      idealPreceding: ['berseem', 'soybean', 'cowpea'],
      avoidPreceding: ['sugarcane', 'maize', 'sorghum'],
      agronomicNotes: 'Follow multi-year cane cycles with restorative legume cover crops (berseem or cowpea) before replanting.'
    },
    rotationRulesAr: {
      idealPreceding: ['berseem', 'soybean', 'cowpea'],
      avoidPreceding: ['sugarcane', 'maize', 'sorghum'],
      agronomicNotes: 'يتبع كسر دورة القصب بزراعة محاصيل بقولية مخصبة (كالبرسيم أو اللوبيا) لتجديد حيوية التربة قبل إعادة الزراعة.'
    },
    sources: {
      agronomy: 'Sugar Crops Research Institute (ARC Egypt) & FAO ECOCROP',
      waterReq: 'FAO Irrigation Paper 56'
    }
  },

  // 24. SAFFLOWER - Drought & Salinity Hardy Deep-Rooted Oilseed
  safflower: {
    id: 'safflower',
    nameEn: 'Safflower (Deep-Rooted Oilseed)',
    nameAr: 'العصفر (قرطم الزيت)',
    scientificName: 'Carthamus tinctorius',
    family: 'Asteraceae (Compositae)',
    familyAr: 'المركبات',
    season: 'winter',
    climateZones: ['arid', 'semi_arid', 'mediterranean'],
    growingDays: 140,
    plantingMonthEn: 'October – December',
    plantingMonthAr: 'أكتوبر – ديسمبر',
    harvestMonthEn: 'April – June',
    harvestMonthAr: 'أبريل – يونيو',
    waterRequirementMm: 420,
    cropCoefficientKc: 1.05, // FAO-56 Table 12 mid-season Kc
    waterDemandTier: 'medium',
    optimalPhRange: [6.0, 8.5],
    toleratedSoilTypes: ['clay_loam', 'sandy_loam', 'calcareous', 'silty_clay'],
    optimalTempRangeC: [18, 30],
    maxToleratedTempC: 40,
    minToleratedTempC: -5,
    baseTemperatureC: 4.5,
    frostToleranceClass: 'semi_hardy',
    gddRequirement: 1400,
    salinityToleranceECe: 5.3, // FAO 29 Table 4 (tolerant)
    salinityToleranceECw: 3.5,
    humidityToleranceTier: 'tolerant',
    optimalRhRange: [30, 60],
    maxToleratedRhPct: 70,
    diseaseRiskFactorsEn: 'Extremely susceptible to Alternaria leaf blight, rust, and head rot if relative humidity exceeds 70% during flowering.',
    diseaseRiskFactorsAr: 'شديد التأثر بلفحة الألترناريا والصدأ وعفن النورات الزهرية إذا تجاوزت الرطوبة النسبية 70% في مرحلة الإزهار.',
    nitrogenFixationKgPerHa: -50,
    organicMatterAdditionScore: 3,
    cashCropTier: 'medium',
    soilHealthRoleEn: 'Pivotal taproot penetrates up to 2.5m, draining subsoil salt, mining unreached nitrates, and breaking dense subsoil hardpans.',
    soilHealthRoleAr: 'جذر وتدي ثاقب يتعمق حتى 2.5 م؛ يمتص الأملاح والنترات المتسربة ويكسر الطبقات الصماء في باطن الأرض.',
    rotationRulesEn: {
      idealPreceding: ['wheat', 'barley', 'faba_bean', 'chickpea'],
      avoidPreceding: ['safflower', 'sunflower'],
      agronomicNotes: 'Ideal deep-rooting break crop following shallow-rooted winter cereals; avoid following sunflower due to shared fungal diseases.'
    },
    rotationRulesAr: {
      idealPreceding: ['wheat', 'barley', 'faba_bean', 'chickpea'],
      avoidPreceding: ['safflower', 'sunflower'],
      agronomicNotes: 'كاسر عميق الجذور مثالي بعد الحبوب الشتوية؛ تجنب زراعته بعد دوار الشمس لاشتراكهما في نفس العائلة والأمراض الفطرية.'
    },
    sources: {
      agronomy: 'FAO ECOCROP & ICARDA Oilseed Program',
      waterReq: 'FAO Irrigation Paper 56'
    }
  },

  // 25. FLAX - Dual Fiber & Linseed Oil Crop
  flax: {
    id: 'flax',
    nameEn: 'Flax / Linseed (Fiber & Oil)',
    nameAr: 'الكتان (لإنتاج الألياف والزيت)',
    scientificName: 'Linum usitatissimum',
    family: 'Linaceae',
    familyAr: 'الكتانيات',
    season: 'winter',
    climateZones: ['mediterranean', 'temperate', 'semi_arid'],
    growingDays: 140,
    plantingMonthEn: 'October – November',
    plantingMonthAr: 'أكتوبر – نوفمبر',
    harvestMonthEn: 'April – May',
    harvestMonthAr: 'أبريل – مايو',
    waterRequirementMm: 400,
    cropCoefficientKc: 1.00, // FAO-56 Table 12 mid-season Kc
    waterDemandTier: 'medium',
    optimalPhRange: [6.0, 7.8],
    toleratedSoilTypes: ['clay_loam', 'silty_clay', 'sandy_loam'],
    optimalTempRangeC: [14, 22],
    maxToleratedTempC: 30,
    minToleratedTempC: -5,
    baseTemperatureC: 0.0,
    frostToleranceClass: 'semi_hardy',
    gddRequirement: 1200,
    salinityToleranceECe: 2.5, // FAO 29 Table 4 (moderately sensitive)
    salinityToleranceECw: 1.7,
    humidityToleranceTier: 'moderate',
    optimalRhRange: [50, 70],
    maxToleratedRhPct: 78,
    diseaseRiskFactorsEn: 'Relative humidity over 78% promotes flax rust (Melampsora lini) and Pasmo disease (Septoria linicola).',
    diseaseRiskFactorsAr: 'الرطوبة النسبية فوق 78% تحفز ظهور صدأ الكتان (Melampsora lini) ومرض البازمو (Septoria linicola).',
    nitrogenFixationKgPerHa: -45,
    organicMatterAdditionScore: 2,
    cashCropTier: 'medium',
    soilHealthRoleEn: 'Dual-purpose fiber and high-omega oilseed; shallow fibrous roots utilize residual fertility without soil disruption.',
    soilHealthRoleAr: 'محصول ثنائي الغرض للألياف وزيت بذر الكتان؛ جذوره السطحية تستغل الخصوبة المتبقية بلطف دون إرهاق التربة.',
    rotationRulesEn: {
      idealPreceding: ['maize', 'sorghum', 'faba_bean'],
      avoidPreceding: ['flax'],
      agronomicNotes: 'Requires a minimum 4-year rotation interval before repeating on the same plot to avoid flax wilt (Fusarium oxysporum f. sp. lini).'
    },
    rotationRulesAr: {
      idealPreceding: ['maize', 'sorghum', 'faba_bean'],
      avoidPreceding: ['flax'],
      agronomicNotes: 'يتطلب فاصلاً زمنياً لا يقل عن 4 سنوات قبل تكرار زراعته في نفس الحقل لتفادي مرض ذبول الكتان الفيوزارمي.'
    },
    sources: {
      agronomy: 'Field Crops Research Institute (ARC Egypt) & FAO ECOCROP',
      waterReq: 'FAO Irrigation Paper 56'
    }
  },

  // 26. TOMATO - Open-Field Processing & Cash Vegetable
  tomato: {
    id: 'tomato',
    nameEn: 'Open-Field Processing Tomato',
    nameAr: 'طماطم الحقل المكشوف (تصنيعية وطازجة)',
    scientificName: 'Solanum lycopersicum',
    family: 'Solanaceae',
    familyAr: 'الباذنجانيات',
    season: 'summer',
    climateZones: ['mediterranean', 'temperate', 'subtropical', 'arid'],
    growingDays: 120,
    plantingMonthEn: 'February – April (Summer) / August – September (Nili)',
    plantingMonthAr: 'فبراير – أبريل (صيفي) / أغسطس – سبتمبر (نيلي)',
    harvestMonthEn: 'June – August / December – January',
    harvestMonthAr: 'يونيو – أغسطس / ديسمبر – يناير',
    waterRequirementMm: 550,
    cropCoefficientKc: 1.15, // FAO-56 Table 12 mid-season Kc
    waterDemandTier: 'high',
    optimalPhRange: [6.0, 7.5],
    toleratedSoilTypes: ['sandy_loam', 'clay_loam'],
    optimalTempRangeC: [20, 28],
    maxToleratedTempC: 35, // Pollen abortion above 35°C
    minToleratedTempC: 5,
    baseTemperatureC: 10.0,
    frostToleranceClass: 'sensitive',
    gddRequirement: 1400,
    salinityToleranceECe: 2.5, // FAO 29 Table 4 (moderately sensitive)
    salinityToleranceECw: 1.7,
    humidityToleranceTier: 'moderate',
    optimalRhRange: [50, 70],
    maxToleratedRhPct: 78,
    diseaseRiskFactorsEn: 'Atmospheric humidity above 78% creates severe early blight (Alternaria) and late blight (Phytophthora infestans) epidemics.',
    diseaseRiskFactorsAr: 'الرطوبة الجوية فوق 78% تؤدي لانتشار وبائي للندوة المبكرة (Alternaria) والندوة المتأخرة (Phytophthora).',
    nitrogenFixationKgPerHa: -85,
    organicMatterAdditionScore: 2,
    cashCropTier: 'high',
    soilHealthRoleEn: 'High-value commercial cash vegetable; responsive to disciplined drip fertigation; demands complete rotation breaks.',
    soilHealthRoleAr: 'محصول خضار نقدي عالي الربحية؛ يستجيب بكفاءة للتسميد بالري بالتنقيط؛ يتطلب دورة زراعية صارمة.',
    rotationRulesEn: {
      idealPreceding: ['wheat', 'barley', 'maize'],
      avoidPreceding: ['tomato', 'potato', 'pepper'],
      agronomicNotes: 'Never follow potato or pepper to avoid catastrophic build-up of root-knot nematodes and Phytophthora blights.'
    },
    rotationRulesAr: {
      idealPreceding: ['wheat', 'barley', 'maize'],
      avoidPreceding: ['tomato', 'potato', 'pepper'],
      agronomicNotes: 'يحظر زراعته بعد البطاطس أو الفلفل لمنع تراكم نيماتودا تعقد الجذور وأمراض اللفحة الفطرية المشتركة.'
    },
    sources: {
      agronomy: 'AVRDC / World Vegetable Center & FAO ECOCROP',
      waterReq: 'FAO Irrigation Paper 56'
    }
  },

  // 27. PEPPER - Commercial Sweet & Hot Pepper
  pepper: {
    id: 'pepper',
    nameEn: 'Bell & Chili Pepper',
    nameAr: 'الفلفل (الحلو والحار)',
    scientificName: 'Capsicum annuum',
    family: 'Solanaceae',
    familyAr: 'الباذنجانيات',
    season: 'summer',
    climateZones: ['mediterranean', 'temperate', 'subtropical', 'tropical'],
    growingDays: 130,
    plantingMonthEn: 'March – May',
    plantingMonthAr: 'مارس – مايو',
    harvestMonthEn: 'July – October',
    harvestMonthAr: 'يوليو – أكتوبر',
    waterRequirementMm: 500,
    cropCoefficientKc: 1.05, // FAO-56 Table 12 mid-season Kc
    waterDemandTier: 'medium',
    optimalPhRange: [6.0, 7.5],
    toleratedSoilTypes: ['sandy_loam', 'clay_loam'],
    optimalTempRangeC: [22, 30],
    maxToleratedTempC: 36,
    minToleratedTempC: 8,
    baseTemperatureC: 10.0,
    frostToleranceClass: 'sensitive',
    gddRequirement: 1350,
    salinityToleranceECe: 1.5, // FAO 29 Table 4 (sensitive)
    salinityToleranceECw: 1.0,
    humidityToleranceTier: 'moderate',
    optimalRhRange: [50, 70],
    maxToleratedRhPct: 75,
    diseaseRiskFactorsEn: 'Elevated humidity (>75%) triggers bacterial spot (Xanthomonas) and anthracnose fruit rot during warm periods.',
    diseaseRiskFactorsAr: 'الرطوبة العالية (>75%) تشجع التبقع البكتيري (Xanthomonas) وعفن الثمار الأنثراكنوز في الأجواء الدافئة.',
    nitrogenFixationKgPerHa: -70,
    organicMatterAdditionScore: 2,
    cashCropTier: 'high',
    soilHealthRoleEn: 'High-margin horticultural cash crop; delicate root system requires well-drained, aerated soils free of soil-borne pathogens.',
    soilHealthRoleAr: 'محصول بستاني نقدي ممتاز الربحية؛ مجموع جذري حساس يتطلب تربة جيدة الصرف والتهوية خالية من ممرضات الجذور.',
    rotationRulesEn: {
      idealPreceding: ['wheat', 'barley', 'maize', 'berseem'],
      avoidPreceding: ['pepper', 'tomato', 'potato'],
      agronomicNotes: 'Strictly avoid repeating solanaceous crops; rotate with cereals or legumes to suppress soil fungal complexes.'
    },
    rotationRulesAr: {
      idealPreceding: ['wheat', 'barley', 'maize', 'berseem'],
      avoidPreceding: ['pepper', 'tomato', 'potato'],
      agronomicNotes: 'تجنب تكرار زراعة العائلة الباذنجانية؛ وتدويره مع الحبوب أو البقوليات للقضاء على فطريات التربة المستوطنة.'
    },
    sources: {
      agronomy: 'AVRDC / FAO ECOCROP',
      waterReq: 'FAO Irrigation Paper 56'
    }
  },

  // 28. SWEET POTATO - Heat-Resilient Caloric Root Tuber
  sweet_potato: {
    id: 'sweet_potato',
    nameEn: 'Sweet Potato',
    nameAr: 'البطاطا الحلوة',
    scientificName: 'Ipomoea batatas',
    family: 'Convolvulaceae',
    familyAr: 'المحموديات (العليقية)',
    season: 'summer',
    climateZones: ['tropical', 'subtropical', 'mediterranean', 'semi_arid'],
    growingDays: 135,
    plantingMonthEn: 'April – June',
    plantingMonthAr: 'أبريل – يونيو',
    harvestMonthEn: 'August – November',
    harvestMonthAr: 'أغسطس – نوفمبر',
    waterRequirementMm: 450,
    cropCoefficientKc: 1.05, // FAO-56 Table 12 mid-season Kc
    waterDemandTier: 'medium',
    optimalPhRange: [5.5, 7.5],
    toleratedSoilTypes: ['sandy_loam', 'sandy', 'clay_loam'],
    optimalTempRangeC: [24, 32],
    maxToleratedTempC: 38,
    minToleratedTempC: 10,
    baseTemperatureC: 10.0,
    frostToleranceClass: 'sensitive',
    gddRequirement: 1500,
    salinityToleranceECe: 1.5, // FAO 29 Table 4 (moderately sensitive)
    salinityToleranceECw: 1.0,
    humidityToleranceTier: 'humid_adapted',
    optimalRhRange: [60, 85],
    maxToleratedRhPct: 88,
    diseaseRiskFactorsEn: 'Relative humidity exceeding 88% along with warm weather promotes black rot (Ceratocystis) and storage scurf.',
    diseaseRiskFactorsAr: 'الرطوبة النسبية التي تتجاوز 88% مع الحرارة تشجع العفن الأسود (Ceratocystis) وجرب القشرة أثناء التخزين.',
    nitrogenFixationKgPerHa: -40,
    organicMatterAdditionScore: 3,
    cashCropTier: 'high',
    soilHealthRoleEn: 'Prostrate dense vegetative vines suppress summer weeds, prevent soil surface baking, and store high carbohydrate calories.',
    soilHealthRoleAr: 'عروش خضرية مفترشة كثيفة تكتم نمو الحشائش الصيفية، وتحمي سطح التربة من التشقق، وتخزن طاقة نشوية وفيرة.',
    rotationRulesEn: {
      idealPreceding: ['wheat', 'barley', 'faba_bean', 'berseem'],
      avoidPreceding: ['sweet_potato'],
      agronomicNotes: 'Distinct botanical family (Convolvulaceae) makes it an outstanding break crop after solanaceous or cereal crops.'
    },
    rotationRulesAr: {
      idealPreceding: ['wheat', 'barley', 'faba_bean', 'berseem'],
      avoidPreceding: ['sweet_potato'],
      agronomicNotes: 'انتماؤه لعائلة نباتية متميزة يجعل منه محصولاً كاسراً استثنائياً بعد الباذنجانيات أو الحبوب.'
    },
    sources: {
      agronomy: 'CIP (International Potato Center) & FAO ECOCROP',
      waterReq: 'FAO Irrigation Paper 56'
    }
  },

  // 29. WHITE LUPIN - Sandy Soil Reclamation & Phosphate-Mobilizing Pulse
  lupin: {
    id: 'lupin',
    nameEn: 'White Lupin (Termis)',
    nameAr: 'الترمس الأبيض',
    scientificName: 'Lupinus albus',
    family: 'Fabaceae (Leguminosae)',
    familyAr: 'البقوليات',
    season: 'winter',
    climateZones: ['mediterranean', 'semi_arid', 'temperate'],
    growingDays: 145,
    plantingMonthEn: 'October – November',
    plantingMonthAr: 'أكتوبر – نوفمبر',
    harvestMonthEn: 'April – May',
    harvestMonthAr: 'أبريل – مايو',
    waterRequirementMm: 420,
    cropCoefficientKc: 1.05, // FAO-56 Table 12 mid-season Kc
    waterDemandTier: 'medium',
    optimalPhRange: [5.0, 7.2], // Sensitive to high active CaCO3
    toleratedSoilTypes: ['sandy_loam', 'sandy', 'clay_loam'],
    optimalTempRangeC: [15, 24],
    maxToleratedTempC: 32,
    minToleratedTempC: -6,
    baseTemperatureC: 3.0,
    frostToleranceClass: 'semi_hardy',
    gddRequirement: 1250,
    salinityToleranceECe: 2.0, // FAO 29 Table 4
    salinityToleranceECw: 1.3,
    humidityToleranceTier: 'moderate',
    optimalRhRange: [40, 65],
    maxToleratedRhPct: 72,
    diseaseRiskFactorsEn: 'Atmospheric humidity above 72% fosters anthracnose (Colletotrichum lupini) and Pleiochaeta brown spot.',
    diseaseRiskFactorsAr: 'الرطوبة النسبية فوق 72% تحفز الإصابة بالأنثراكنوز (Colletotrichum lupini) والتبقع البني.',
    nitrogenFixationKgPerHa: 120, // Elite nitrogen fixer
    organicMatterAdditionScore: 4,
    cashCropTier: 'medium',
    soilHealthRoleEn: 'Elite biological nitrogen fixer (+120 kg N/ha); specialized proteoid cluster roots exude organic acids that mobilize fixed phosphorus in sandy soils.',
    soilHealthRoleAr: 'تثبيت حيوي فائق للنيتروجين (+120 كجم N/هـ)؛ تفرز جذوره العنقودية أحماضاً عضوية تذيب الفوسفور المثبت في الأراضي الرملية.',
    rotationRulesEn: {
      idealPreceding: ['wheat', 'barley', 'maize', 'sorghum'],
      avoidPreceding: ['lupin', 'faba_bean', 'chickpea'],
      agronomicNotes: 'Outstanding reclamation legume for sandy soils; mobilizes phosphorus for succeeding crops while enriching soil nitrogen.'
    },
    rotationRulesAr: {
      idealPreceding: ['wheat', 'barley', 'maize', 'sorghum'],
      avoidPreceding: ['lupin', 'faba_bean', 'chickpea'],
      agronomicNotes: 'بقوليات استصلاحية ممتازة للأراضي الرملية؛ تيسر الفوسفور للمحاصيل التالية وتثري مخزون النيتروجين.'
    },
    sources: {
      agronomy: 'ICARDA & FAO ECOCROP',
      waterReq: 'FAO Irrigation Paper 56'
    }
  },

  // 30. CASTOR BEAN - Arid Industrial Non-Food Oil Crop
  castor: {
    id: 'castor',
    nameEn: 'Castor Bean (Industrial Oilseed)',
    nameAr: 'الخروع (زيت صناعي)',
    scientificName: 'Ricinus communis',
    family: 'Euphorbiaceae',
    familyAr: 'الفربيونيات',
    season: 'summer',
    climateZones: ['arid', 'semi_arid', 'tropical', 'subtropical'],
    growingDays: 150,
    plantingMonthEn: 'April – June',
    plantingMonthAr: 'أبريل – يونيو',
    harvestMonthEn: 'September – November',
    harvestMonthAr: 'سبتمبر – نوفمبر',
    waterRequirementMm: 480,
    cropCoefficientKc: 1.05, // FAO-56 Table 12 mid-season Kc
    waterDemandTier: 'medium',
    optimalPhRange: [5.5, 8.2],
    toleratedSoilTypes: ['sandy_loam', 'sandy', 'clay_loam', 'calcareous'],
    optimalTempRangeC: [25, 36],
    maxToleratedTempC: 44,
    minToleratedTempC: 8,
    baseTemperatureC: 10.0,
    frostToleranceClass: 'sensitive',
    gddRequirement: 1600,
    salinityToleranceECe: 3.0, // FAO 29 Table 4
    salinityToleranceECw: 2.0,
    humidityToleranceTier: 'tolerant',
    optimalRhRange: [35, 65],
    maxToleratedRhPct: 75,
    diseaseRiskFactorsEn: 'Relative humidity exceeding 75% during capsule filling causes capsule rot (Botrytis ricini) and Cercospora leaf spot.',
    diseaseRiskFactorsAr: 'الرطوبة النسبية التي تتجاوز 75% أثناء امتلاء الكبسولات تؤدي لعفن الثمار البوتريتيسي وتبقع الأوراق.',
    nitrogenFixationKgPerHa: -60,
    organicMatterAdditionScore: 3,
    cashCropTier: 'high',
    soilHealthRoleEn: 'Deep taproot extracts subsoil water in drought-prone areas; industrial oilseed with high market liquidity for bio-lubricants.',
    soilHealthRoleAr: 'جذور وتدية عميقة تمتص المياه الباطنية في الأراضي المعرضة للجفاف؛ زيت صناعي ذو قيمة تسويقية عالية في التشحيم الحيوي.',
    rotationRulesEn: {
      idealPreceding: ['wheat', 'barley', 'berseem', 'faba_bean'],
      avoidPreceding: ['castor'],
      agronomicNotes: 'Valuable non-food cash crop for arid reclamation lands; breaks common cereal and pulse root nematode complexes.'
    },
    rotationRulesAr: {
      idealPreceding: ['wheat', 'barley', 'berseem', 'faba_bean'],
      avoidPreceding: ['castor'],
      agronomicNotes: 'محصول نقدي غير غذائي واعد للأراضي المستصلحة؛ يكسر معقدات نيماتودا جذور الحبوب والبقوليات.'
    },
    sources: {
      agronomy: 'FAO ECOCROP & ARC Egypt Industrial Crops',
      waterReq: 'FAO Irrigation Paper 56'
    }
  }

};

export const CROPS_LIST: Crop[] = Object.values(CROPS_DATABASE);
