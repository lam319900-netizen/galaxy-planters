import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/database';
import { GLOBAL_SOIL_TEXTURE_PROFILES } from '../services/soilGrids';
import { fetchNasaPowerClimate, createUserProvidedClimateData } from '../services/nasaPower';
import { InteractiveMap } from './InteractiveMap';
import { UnitSwitcher } from './UnitSwitcher';
import { CROPS_LIST } from '../data/crops';
import type { 
  FarmAssessmentInput, 
  NasaPowerClimateData, 
  SoilType, 
  IrrigationAvailability, 
  FarmerPriority, 
  CropId,
  FarmRecord 
} from '../types';
import { 
  MapPin, 
  Layers, 
  Droplet, 
  Target, 
  RefreshCw, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  ChevronRight,
  Sun,
  Sliders
} from 'lucide-react';

interface AssessmentFormProps {
  onGeneratePlans: (input: FarmAssessmentInput, climate: NasaPowerClimateData) => void;
  initialInput?: FarmAssessmentInput | null;
  initialClimate?: NasaPowerClimateData | null;
}

export const AssessmentForm: React.FC<AssessmentFormProps> = ({
  onGeneratePlans,
  initialInput,
  initialClimate
}) => {
  const { language, t } = useLanguage();
  const isAr = language === 'ar';
  const { user } = useAuth();
  const [savedFarms, setSavedFarms] = useState<FarmRecord[]>([]);
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');

  useEffect(() => {
    if (user) {
      dbService.getFarms(user.id).then(farms => setSavedFarms(farms)).catch(() => {});
    } else {
      setSavedFarms([]);
      setSelectedFarmId('');
    }
  }, [user]);

  const handleSelectSavedFarm = (farmId: string) => {
    setSelectedFarmId(farmId);
    if (!farmId) return;
    const farm = savedFarms.find(f => f.id === farmId);
    if (!farm) return;

    setLatitude(farm.latitude);
    setLongitude(farm.longitude);
    setLocationName(`${farm.farmName} (${farm.region}, ${farm.country})`);
    setSoilType(farm.soilType);
    setSoilPh(farm.soilPh !== undefined ? String(farm.soilPh) : '');
    setOrganicMatter(farm.organicMatterPct !== undefined ? String(farm.organicMatterPct) : '');
    setSoilSalinityEC(farm.soilSalinityEC !== undefined ? String(farm.soilSalinityEC) : '');
    setIrrigation(farm.irrigationAvailability);
    setIrrigationMethod(farm.irrigationMethod || 'surface_furrow');
    setWaterSalinityECw(farm.irrigationWaterSalinityECw !== undefined ? String(farm.irrigationWaterSalinityECw) : '');
    setPriority(farm.farmerPriority);
    setPreviousCrop(farm.previousCrop || 'fallow');

    fetchClimate(farm.latitude, farm.longitude, farm.farmName, forceDemoMode);
  };

  // Global Location state
  const [latitude, setLatitude] = useState<number>(initialInput?.latitude ?? 26.55);
  const [longitude, setLongitude] = useState<number>(initialInput?.longitude ?? 31.70);
  const [locationName, setLocationName] = useState<string>(initialInput?.locationName ?? 'Upper Egypt (Default Reference)');

  // Climate state (NASA POWER)
  const [climate, setClimate] = useState<NasaPowerClimateData | null>(initialClimate || null);
  const [climateLoading, setClimateLoading] = useState<boolean>(false);
  const [climateError, setClimateError] = useState<string | null>(null);
  const [forceDemoMode, setForceDemoMode] = useState<boolean>(false);

  // Manual climate entry fallback state
  const [showManualClimate, setShowManualClimate] = useState<boolean>(false);
  const [manualAvgTemp, setManualAvgTemp] = useState<string>('24.5');
  const [manualMaxTemp, setManualMaxTemp] = useState<string>('39.0');
  const [manualMinTemp, setManualMinTemp] = useState<string>('7.5');
  const [manualPrecip, setManualPrecip] = useState<string>('25');
  const [manualRh, setManualRh] = useState<string>('45');

  // Soil state
  const [soilType, setSoilType] = useState<SoilType>(initialInput?.soilType || 'clay_loam');
  const [soilPh, setSoilPh] = useState<string>(initialInput?.soilPh !== undefined ? String(initialInput.soilPh) : '');
  const [organicMatter, setOrganicMatter] = useState<string>(initialInput?.organicMatterPct !== undefined ? String(initialInput.organicMatterPct) : '');
  const [soilSalinityEC, setSoilSalinityEC] = useState<string>(initialInput?.soilSalinityEC !== undefined ? String(initialInput.soilSalinityEC) : '');

  // Irrigation & Priority
  const [irrigation, setIrrigation] = useState<IrrigationAvailability>(initialInput?.irrigationAvailability || 'medium');
  const [irrigationMethod, setIrrigationMethod] = useState<'surface_furrow' | 'drip' | 'sprinkler'>(initialInput?.irrigationMethod || 'surface_furrow');
  const [waterSalinityECw, setWaterSalinityECw] = useState<string>(initialInput?.irrigationWaterSalinityECw !== undefined ? String(initialInput.irrigationWaterSalinityECw) : '');
  const [priority, setPriority] = useState<FarmerPriority>(initialInput?.farmerPriority || 'water_conservation');
  const [previousCrop, setPreviousCrop] = useState<string>(initialInput?.previousCrop || 'fallow');

  // Validation
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  // Fetch NASA POWER climate data for coordinates
  const fetchClimate = async (lat: number, lon: number, locLabel?: string, demo = false) => {
    setClimateLoading(true);
    setClimateError(null);
    setClimate(null);

    try {
      const data = await fetchNasaPowerClimate({
        latitude: lat,
        longitude: lon,
        locationName: locLabel,
        startDate: '20240101',
        endDate: '20241231',
        forceDemo: demo
      });
      setClimate(data);
    } catch (err: any) {
      setClimateError(err?.message || (isAr ? 'تعذر الاتصال بـ NASA POWER API. يمكنك تفعيل الوضع التجريبي أدناه.' : 'NASA POWER API connection failed. You can enable Demo Mode below.'));
      console.warn('NASA POWER error caught in UI:', err);
    } finally {
      setClimateLoading(false);
    }
  };

  // When location changes via Global Interactive Map (click, search, GPS)
  const handleLocationChange = (lat: number, lon: number, newLocationName?: string) => {
    setLatitude(Number(lat.toFixed(4)));
    setLongitude(Number(lon.toFixed(4)));

    if (newLocationName) {
      setLocationName(newLocationName);
    } else {
      setLocationName(`${Number(lat.toFixed(2))}°, ${Number(lon.toFixed(2))}°`);
    }

    fetchClimate(lat, lon, newLocationName, forceDemoMode);
  };

  useEffect(() => {
    if (!climate) {
      fetchClimate(latitude, longitude, locationName, forceDemoMode);
    }
  }, []);

  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (latitude < -90 || latitude > 90 || longitude < -180 || longitude > 180) {
      errors.coordinates = t('errorCoordRange');
    }

    if (soilPh !== '') {
      const phNum = parseFloat(soilPh);
      if (isNaN(phNum) || phNum < 3.5 || phNum > 10.5) {
        errors.soilPh = isAr ? 'درجة pH يجب أن تكون بين 3.5 و10.5.' : 'Soil pH must be between 3.5 and 10.5.';
      }
    }

    if (organicMatter !== '') {
      const omNum = parseFloat(organicMatter);
      if (isNaN(omNum) || omNum < 0.05 || omNum > 15) {
        errors.organicMatter = isAr ? 'نسبة المادة العضوية يجب أن تكون بين 0.1% و15%.' : 'Organic matter percentage must be between 0.1% and 15%.';
      }
    }

    if (soilSalinityEC !== '') {
      const ecNum = parseFloat(soilSalinityEC);
      if (isNaN(ecNum) || ecNum < 0 || ecNum > 40) {
        errors.soilSalinityEC = isAr ? 'الملوحة يجب أن تقع بين 0 و40 ديسيمنز/م.' : 'Salinity must be between 0 and 40 dS/m.';
      }
    }

    if (waterSalinityECw !== '') {
      const ecwNum = parseFloat(waterSalinityECw);
      if (isNaN(ecwNum) || ecwNum < 0 || ecwNum > 25) {
        errors.waterSalinityECw = isAr ? 'ملوحة مياه الري (ECw) يجب أن تقع بين 0 و25 ديسيمنز/م.' : 'Irrigation water salinity (ECw) must be between 0 and 25 dS/m.';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleApplyManualClimate = () => {
    const avg = parseFloat(manualAvgTemp);
    const max = parseFloat(manualMaxTemp);
    const min = parseFloat(manualMinTemp);
    const precip = parseFloat(manualPrecip);
    const rh = parseFloat(manualRh);
    if (isNaN(avg) || isNaN(max) || isNaN(min) || isNaN(precip)) {
      return;
    }
    const customData = createUserProvidedClimateData({
      latitude,
      longitude,
      locationName,
      avgTemperatureC: avg,
      maxTemperatureC: max,
      minTemperatureC: min,
      totalPrecipitationMm: precip,
      avgRelativeHumidityPct: !isNaN(rh) ? rh : undefined
    });
    setClimate(customData);
    setClimateError(null);
    setShowManualClimate(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (!climate) {
      setClimateError(isAr ? 'يرجى انتظار تحميل أرصاد ناسا المناخية للموقع المختار.' : 'Please wait for NASA climate telemetry to finish loading for your coordinates.');
      return;
    }

    setIsSubmitting(true);

    const chosenFarm = savedFarms.find(f => f.id === selectedFarmId);
    const input: FarmAssessmentInput = {
      districtId: 'global_custom',
      farmId: selectedFarmId || undefined,
      farmName: chosenFarm?.farmName || undefined,
      locationName,
      latitude,
      longitude,
      soilType,
      soilPh: soilPh !== '' ? parseFloat(soilPh) : undefined,
      organicMatterPct: organicMatter !== '' ? parseFloat(organicMatter) : undefined,
      soilSalinityEC: soilSalinityEC !== '' ? parseFloat(soilSalinityEC) : undefined,
      irrigationAvailability: irrigation,
      irrigationMethod,
      irrigationWaterSalinityECw: waterSalinityECw !== '' ? parseFloat(waterSalinityECw) : undefined,
      farmerPriority: priority,
      previousCrop: previousCrop !== 'fallow' ? (previousCrop as CropId) : 'fallow',
      userClimate: climate.sourceStatus === 'user_specified' ? {
        avgTemperatureC: climate.avgTemperatureC,
        maxTemperatureC: climate.maxTemperatureC,
        minTemperatureC: climate.minTemperatureC,
        totalPrecipitationMm: climate.totalPrecipitationMm
      } : undefined
    };

    setTimeout(() => {
      setIsSubmitting(false);
      onGeneratePlans(input, climate);
    }, 350);
  };

  const handleResetDefaults = () => {
    setLatitude(26.55);
    setLongitude(31.70);
    setLocationName('Upper Egypt (Reference Baseline)');
    setSoilType('clay_loam');
    setSoilPh('');
    setOrganicMatter('');
    setSoilSalinityEC('');
    setWaterSalinityECw('');
    setManualRh('45');
    setIrrigation('medium');
    setIrrigationMethod('surface_furrow');
    setPriority('water_conservation');
    setPreviousCrop('fallow');
    setShowManualClimate(false);
    setValidationErrors({});
    fetchClimate(26.55, 31.70, 'Upper Egypt (Reference Baseline)', false);
  };

  return (
    <div className="max-w-5xl mx-auto py-3 sm:py-6 space-y-6 sm:space-y-8 font-sans w-full max-w-full overflow-hidden">
      
      {/* Form Header with Unit Switcher */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-200/80 shadow-soft space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700 bg-forest-50 px-2.5 py-1 rounded-md">
              <Sparkles className="w-3.5 h-3.5 text-forest-600 shrink-0" />
              <span>{isAr ? 'نظام دعم القرارات الزراعية المدعوم بأقمار ناسا' : 'Global NASA Earth Observation Farm Profiler'}</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-bold text-charcoal">
              {t('formTitle')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 max-w-3xl leading-relaxed">
              {t('formSubtitle')}
            </p>
          </div>

          <UnitSwitcher />
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 sm:space-y-8">

        {/* Saved Farm Quick Selector for Registered Farmers */}
        {savedFarms.length > 0 && (
          <div className="bg-sand/60 rounded-2xl p-4 sm:p-5 border border-slate-200/80 shadow-soft flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-forest-700 text-white flex items-center justify-center shrink-0 shadow-soft">
                <MapPin className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-charcoal">
                  {isAr ? 'اختر من مزارعك وحقولك المحفوظة' : 'Select from Your Saved Farms'}
                </h3>
                <p className="text-xs text-slate-600">
                  {isAr 
                    ? 'تحميل الإحداثيات ونوع التربة ومصادر الري تلقائياً بنقرة واحدة دون إعادة إدخالها.'
                    : 'Auto-load parcel coordinates, soil profile, and irrigation properties in one click.'}
                </p>
              </div>
            </div>

            <div className="w-full sm:w-64 shrink-0">
              <select
                value={selectedFarmId}
                onChange={e => handleSelectSavedFarm(e.target.value)}
                className="w-full py-2 px-3 text-xs font-semibold rounded-xl border border-slate-300 bg-white text-charcoal shadow-soft focus:ring-2 focus:ring-forest-500 focus:border-forest-500"
              >
                <option value="">{isAr ? '-- اختر مزرعة محفوظة --' : '-- Select a Saved Farm --'}</option>
                {savedFarms.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.farmName} ({f.region})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Section 1: Universal Global Map & Coordinates */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-200/80 shadow-soft space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-forest-100 text-forest-800 flex items-center justify-center font-bold text-sm">
                1
              </div>
              <div>
                <h2 className="text-lg font-bold text-charcoal">
                  {isAr ? '1. الموقع الجغرافي وخريطة العالم' : '1. Geographic Location & Global Map'}
                </h2>
                <p className="text-xs text-slate-500">
                  {isAr ? 'ابحث عن أي مدينة أو دولة في العالم، أو انقر على الخريطة لوضع دبوس الإحداثيات.' : 'Search any city or country worldwide, or click anywhere on the interactive map.'}
                </p>
              </div>
            </div>

            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200 self-start sm:self-auto">
              {t('requiredBadge')}
            </span>
          </div>

          {/* Leaflet Global Interactive Map with Search */}
          <div className="rounded-2xl overflow-hidden border border-slate-200/80 shadow-soft">
            <InteractiveMap
              latitude={latitude}
              longitude={longitude}
              locationName={locationName}
              onLocationChange={handleLocationChange}
              height="370px"
            />
          </div>

          {/* Coordinates & Location Label Inputs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-1">
            
            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                {t('latitude')} (°N/S) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.0001"
                min="-90"
                max="90"
                value={latitude}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    handleLocationChange(val, longitude, undefined);
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-forest-500 focus:border-forest-500 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                {t('longitude')} (°E/W) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                step="0.0001"
                min="-180"
                max="180"
                value={longitude}
                onChange={(e) => {
                  const val = parseFloat(e.target.value);
                  if (!isNaN(val)) {
                    handleLocationChange(latitude, val, undefined);
                  }
                }}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-mono font-bold focus:ring-2 focus:ring-forest-500 focus:border-forest-500 bg-white"
              />
            </div>

            <div className="space-y-1">
              <label className="block text-xs font-bold text-slate-700">
                {isAr ? 'اسم الموقع / الوصف' : 'Location Label / Region'}
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={locationName}
                  onChange={(e) => setLocationName(e.target.value)}
                  placeholder={isAr ? 'مثال: أسيوط، مصر أو ميونخ، ألمانيا' : 'e.g. Seville, Spain or Kansas, USA'}
                  className={`w-full px-3 py-2.5 rounded-xl border border-slate-300 text-xs font-medium focus:ring-2 focus:ring-forest-500 focus:border-forest-500 bg-white ${isAr ? 'pr-8 pl-3' : 'pl-8 pr-3'}`}
                />
                <MapPin className={`w-3.5 h-3.5 text-forest-600 absolute ${isAr ? 'right-2.5' : 'left-2.5'} top-3`} />
              </div>
            </div>

          </div>

          {validationErrors.coordinates && (
            <p className="text-xs text-red-600 font-medium">{validationErrors.coordinates}</p>
          )}
        </div>

        {/* Section 2: NASA POWER Climate Integration */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-200/80 shadow-soft space-y-5 sm:space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-sky-100 text-sky-800 flex items-center justify-center font-bold text-sm">
                2
              </div>
              <div>
                <h2 className="text-lg font-bold text-charcoal">
                  {t('sectionClimate')}
                </h2>
                <p className="text-xs text-slate-500">
                  NASA POWER Daily AG Meteorology • Point ({latitude.toFixed(2)}°, {longitude.toFixed(2)}°)
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => fetchClimate(latitude, longitude, locationName, false)}
                disabled={climateLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-sky-50 hover:bg-sky-100 text-sky-800 border border-sky-200 text-xs font-semibold transition-all disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${climateLoading ? 'animate-spin' : ''}`} />
                <span>{climateLoading ? t('fetchingClimate') : t('fetchClimateBtn')}</span>
              </button>
            </div>
          </div>

          {/* Climate Provenance Badge & Status */}
          <div className="flex flex-wrap items-center justify-between gap-3">
            {climate && climate.sourceStatus === 'live_api' && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{t('climateLiveBadge')}</span>
                <span className="text-[11px] font-normal text-emerald-600">({climate.startDate} to {climate.endDate})</span>
              </div>
            )}

            {climate && climate.sourceStatus === 'user_specified' && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-50 text-blue-800 border border-blue-200 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4 text-blue-600" />
                <span>{isAr ? 'بيانات مناخية مدخلة يدوياً بواسطة المزارع' : 'User-Provided Climate Observations'}</span>
              </div>
            )}

            {climate && climate.sourceStatus === 'demo_mode' && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 text-amber-800 border border-amber-200 text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 text-amber-600" />
                <span>{climate.isSyntheticFallback ? (isAr ? 'نموذج مناخي تجريبي تقديري' : 'Estimated Climate Baseline (Demo Mode)') : t('climateDemoBadge')}</span>
              </div>
            )}

            {climateError && (
              <div className="w-full p-4 rounded-xl bg-red-50 border border-red-200 text-red-800 text-xs flex flex-col sm:flex-row items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                  <div className="space-y-1">
                    <p className="font-semibold">{t('climateErrorBadge')}: {climateError}</p>
                    <p className="text-red-700">
                      {isAr
                        ? 'تنبيه النزاهة العلمية: التطبيق يرفض توليد بيانات وهمية منسوبة لناسا. يرجى إدخال بياناتك المناخية يدوياً أو تفعيل الوضع التجريبي فقط.'
                        : 'Data Integrity Notice: The system refuses to fabricate synthetic data as real NASA observations. Please provide climate metrics manually or select Demo Mode.'}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center shrink-0">
                  <button
                    type="button"
                    onClick={() => setShowManualClimate(true)}
                    className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition-all inline-flex items-center gap-1"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>{isAr ? 'إدخال مناخي يدوي' : 'Enter Manually'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setForceDemoMode(true);
                      fetchClimate(latitude, longitude, locationName, true);
                    }}
                    className="px-3 py-1.5 rounded-lg bg-amber-600 hover:bg-amber-500 text-white font-semibold transition-all"
                  >
                    <span>{isAr ? 'وضع تجريبي' : 'Demo Mode'}</span>
                  </button>
                </div>
              </div>
            )}

            {/* Manual Entry Toggle & Demo Switch */}
            <div className="flex items-center gap-4 text-xs text-slate-600">
              <button
                type="button"
                onClick={() => setShowManualClimate(!showManualClimate)}
                className="inline-flex items-center gap-1 font-semibold text-blue-700 hover:text-blue-900 transition-colors"
              >
                <Sliders className="w-3.5 h-3.5" />
                <span>{isAr ? 'إدخال مناخ مخصص' : 'Custom Climate Entry'}</span>
              </button>

              <label className="flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={forceDemoMode}
                  onChange={(e) => {
                    const demo = e.target.checked;
                    setForceDemoMode(demo);
                    fetchClimate(latitude, longitude, locationName, demo);
                  }}
                  className="rounded border-slate-300 text-forest-600 focus:ring-forest-500 w-4 h-4"
                />
                <span className="font-medium">{t('useDemoMode')}</span>
              </label>
            </div>
          </div>

          {/* Collapsible Manual Climate Input Panel */}
          {showManualClimate && (
            <div className="p-4 rounded-2xl bg-blue-50/70 border border-blue-200 space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-700" />
                  <span>{isAr ? 'إدخال القياسات المناخية الميدانية للموقع' : 'Enter On-Farm Meteorological Climate Parameters'}</span>
                </h4>
                <span className="text-[10px] text-blue-600 font-medium">
                  {isAr ? 'مستقل تماماً عن ناسا' : 'Non-synthetic user input'}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold text-[11px]">{t('climateAvgTemp')} (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualAvgTemp}
                    onChange={(e) => setManualAvgTemp(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white font-mono text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold text-[11px]">{t('climateMaxTemp')} (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualMaxTemp}
                    onChange={(e) => setManualMaxTemp(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white font-mono text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold text-[11px]">{isAr ? 'أدنى حرارة' : 'Winter Min'} (°C)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={manualMinTemp}
                    onChange={(e) => setManualMinTemp(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white font-mono text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold text-[11px]">{t('climateRainfall')} (mm)</label>
                  <input
                    type="number"
                    step="1"
                    value={manualPrecip}
                    onChange={(e) => setManualPrecip(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white font-mono text-xs font-bold"
                  />
                </div>
                <div className="space-y-1">
                  <label className="block text-slate-700 font-bold text-[11px]">{isAr ? 'الرطوبة النسبية' : 'Rel. Humidity'} (%)</label>
                  <input
                    type="number"
                    step="1"
                    min="5"
                    max="100"
                    value={manualRh}
                    onChange={(e) => setManualRh(e.target.value)}
                    className="w-full px-2.5 py-1.5 rounded-lg border border-blue-200 bg-white font-mono text-xs font-bold"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowManualClimate(false)}
                  className="px-3 py-1 rounded-lg border border-slate-300 text-slate-600 text-xs font-semibold hover:bg-slate-100"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={handleApplyManualClimate}
                  className="px-4 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-soft"
                >
                  {isAr ? 'تطبيق البيانات المناخية' : 'Apply Climate Data'}
                </button>
              </div>
            </div>
          )}

          {/* 7 Climate Metrics Display Cards */}
          {climate && (
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
              
              {/* 1. Annual Mean Temp */}
              <div className="bg-sand/60 p-3.5 rounded-xl border border-slate-200/80 text-center space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('climateAvgTemp')}</div>
                <div className="text-xl font-bold text-charcoal">{climate.avgTemperatureC}°C</div>
                <div className="text-[10px] text-slate-500">mean(T2M)</div>
              </div>

              {/* 2. Summer Peak Extreme */}
              <div className="bg-amber-50/70 p-3.5 rounded-xl border border-amber-200/80 text-center space-y-1">
                <div className="text-[11px] font-bold text-amber-700 uppercase tracking-wider">{t('climateMaxTemp')}</div>
                <div className="text-xl font-bold text-amber-900">{climate.maxTemperatureC}°C</div>
                <div className="text-[10px] text-amber-700">max(T2M_MAX)</div>
              </div>

              {/* 3. Winter Minimum / Frost */}
              <div className="bg-blue-50/70 p-3.5 rounded-xl border border-blue-200/80 text-center space-y-1">
                <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">{isAr ? 'أدنى حرارة / صقيع' : 'Winter Min / Frost'}</div>
                <div className="text-xl font-bold text-blue-900">{climate.minTemperatureC}°C</div>
                <div className="text-[10px] text-blue-700">min(T2M_MIN)</div>
              </div>

              {/* 4. Total Annual Rainfall */}
              <div className="bg-sky-50/70 p-3.5 rounded-xl border border-sky-200/80 text-center space-y-1">
                <div className="text-[11px] font-bold text-sky-700 uppercase tracking-wider">{t('climateRainfall')}</div>
                <div className="text-xl font-bold text-sky-900">{climate.totalPrecipitationMm} mm</div>
                <div className="text-[10px] text-sky-700">sum(PRECTOTCORR)</div>
              </div>

              {/* 5. Relative Humidity */}
              <div className="bg-emerald-50/70 p-3.5 rounded-xl border border-emerald-200/80 text-center space-y-1">
                <div className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider">{isAr ? 'الرطوبة النسبية' : 'Rel. Humidity'}</div>
                <div className="text-xl font-bold text-emerald-900">
                  {climate.avgRelativeHumidityPct !== undefined ? `${climate.avgRelativeHumidityPct}%` : (isAr ? 'غير متوفرة' : 'N/A')}
                </div>
                <div className="text-[10px] text-emerald-700 truncate" title={climate.highHumidityDaysCount !== undefined ? `${climate.highHumidityDaysCount} days ≥80%` : undefined}>
                  {climate.highHumidityDaysCount !== undefined ? `${climate.highHumidityDaysCount} ${isAr ? 'يوم ≥80%' : 'days ≥80%'}` : 'NASA RH2M'}
                </div>
              </div>

              {/* 6. Mean Daily Solar Radiation */}
              <div className="bg-sand/60 p-3.5 rounded-xl border border-slate-200/80 text-center space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('climateSolarRad')}</div>
                <div className="text-xl font-bold text-charcoal">{climate.avgSolarRadiationMj}</div>
                <div className="text-[10px] text-slate-500">MJ/m²/day</div>
              </div>

              {/* 7. Growing Degree Days */}
              <div className="bg-sand/60 p-3.5 rounded-xl border border-slate-200/80 text-center space-y-1">
                <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">{t('climateGdd')}</div>
                <div className="text-xl font-bold text-charcoal">{climate.estimatedGDD}</div>
                <div className="text-[10px] text-slate-500">GDD (Base 10°C)</div>
              </div>

            </div>
          )}

          <p className="text-[11px] text-slate-400">
            {t('climateDisclaimer')}
          </p>
        </div>

        {/* Section 3: Soil Information */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-200/80 shadow-soft space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center font-bold text-sm">
                3
              </div>
              <div>
                <h2 className="text-lg font-bold text-charcoal">
                  {t('sectionSoil')}
                </h2>
                <p className="text-xs text-slate-500">
                  {isAr ? 'يتم الاستعلام عن SoilGrids 250m تلقائياً، مع دعم إدخال تحاليلك المعملية الحقلية.' : 'Queried via ISRIC SoilGrids 250m with support for your laboratory field tests.'}
                </p>
              </div>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
              {t('requiredBadge')}
            </span>
          </div>

          {/* Soil Type Selection Cards */}
          <div className="space-y-3">
            <label className="block text-sm font-bold text-charcoal">
              {t('soilTypeLabel')} <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {(Object.keys(GLOBAL_SOIL_TEXTURE_PROFILES) as SoilType[]).map((st) => {
                const prof = GLOBAL_SOIL_TEXTURE_PROFILES[st];
                const isSelected = soilType === st;
                return (
                  <button
                    key={st}
                    type="button"
                    onClick={() => setSoilType(st)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      isSelected
                        ? 'border-forest-600 bg-forest-50/70 shadow-soft ring-1 ring-forest-600'
                        : 'border-slate-200/80 hover:border-forest-300 bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-charcoal">
                      {isAr ? prof.labelAr : prof.labelEn}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1 line-clamp-2">
                      {isAr ? prof.descriptionAr : prof.descriptionEn}
                    </div>
                    <div className="mt-2 text-[10px] font-semibold text-slate-400">
                      pH ~{prof.typicalPh} • OM ~{prof.typicalOrganicMatterPct}%
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Optional Soil Lab Measurements */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
            
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-charcoal">
                  {t('phLabel')}
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sand text-slate-500 font-semibold">
                  {t('optionalBadge')}
                </span>
              </div>
              <input
                type="number"
                step="0.1"
                min="3.5"
                max="10.5"
                placeholder={`Typical: ${GLOBAL_SOIL_TEXTURE_PROFILES[soilType]?.typicalPh || '6.8'}`}
                value={soilPh}
                onChange={(e) => setSoilPh(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-forest-500 focus:border-forest-500 text-sm font-medium"
              />
              <p className="text-[11px] text-slate-500">{t('phHelp')}</p>
              {validationErrors.soilPh && (
                <p className="text-xs text-red-600 font-medium">{validationErrors.soilPh}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-charcoal">
                  {t('omLabel')}
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sand text-slate-500 font-semibold">
                  {t('optionalBadge')}
                </span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0.1"
                max="15.0"
                placeholder={`Typical: ${GLOBAL_SOIL_TEXTURE_PROFILES[soilType]?.typicalOrganicMatterPct || '1.5'}%`}
                value={organicMatter}
                onChange={(e) => setOrganicMatter(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-forest-500 focus:border-forest-500 text-sm font-medium"
              />
              <p className="text-[11px] text-slate-500">{t('omHelp')}</p>
              {validationErrors.organicMatter && (
                <p className="text-xs text-red-600 font-medium">{validationErrors.organicMatter}</p>
              )}
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-charcoal">
                  {isAr ? 'ملوحة التربة (ECe)' : 'Soil Salinity (ECe)'}
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sand text-slate-500 font-semibold">
                  {t('optionalBadge')}
                </span>
              </div>
              <input
                type="number"
                step="0.1"
                min="0"
                max="40"
                placeholder="dS/m (e.g. 1.8)"
                value={soilSalinityEC}
                onChange={(e) => setSoilSalinityEC(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-forest-500 focus:border-forest-500 text-sm font-medium"
              />
              <p className="text-[11px] text-slate-500">
                {isAr ? 'التوصيل الكهربائي لمستخلص العجينة المشبعة (dS/m).' : 'Electrical conductivity in saturated extract (dS/m).'}
              </p>
              {validationErrors.soilSalinityEC && (
                <p className="text-xs text-red-600 font-medium">{validationErrors.soilSalinityEC}</p>
              )}
            </div>

          </div>
        </div>

        {/* Section 4: Irrigation & Priorities */}
        <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-200/80 shadow-soft space-y-5 sm:space-y-6">
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-sm">
                4
              </div>
              <h2 className="text-lg font-bold text-charcoal">
                {t('sectionIrrigation')}
              </h2>
            </div>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-800 font-semibold border border-emerald-200">
              {t('requiredBadge')}
            </span>
          </div>

          <div className="space-y-6">
            
            {/* Irrigation Availability */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-charcoal">
                {t('irrigationLabel')} <span className="text-red-500">*</span>
              </label>
              <p className="text-xs text-slate-500">{t('irrigationHelp')}</p>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  { id: 'low', label: t('irrigationLow') },
                  { id: 'medium', label: t('irrigationMed') },
                  { id: 'high', label: t('irrigationHigh') },
                ].map((tier) => (
                  <button
                    key={tier.id}
                    type="button"
                    onClick={() => setIrrigation(tier.id as IrrigationAvailability)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      irrigation === tier.id
                        ? 'border-forest-600 bg-forest-50/70 shadow-soft ring-1 ring-forest-600'
                        : 'border-slate-200/80 hover:border-forest-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Droplet className={`w-4 h-4 ${irrigation === tier.id ? 'text-forest-600' : 'text-slate-400'}`} />
                      <span className="text-xs font-bold text-charcoal capitalize">
                        {isAr ? (tier.id === 'low' ? 'وفرة مياه منخفضة' : tier.id === 'medium' ? 'وفرة مياه متوسطة' : 'وفرة مياه عالية') : `${tier.id} Availability`}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-600 mt-1 leading-snug">
                      {tier.label}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Irrigation Method & Application Efficiency */}
            <div className="space-y-3 pt-2 border-t border-slate-100">
              <label className="block text-sm font-bold text-charcoal">
                {isAr ? 'طريقة الري وكفاءة التطبيق الحقلي (FAO-56)' : 'Irrigation Method & Application Efficiency (FAO-56)'}
              </label>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[
                  {
                    id: 'surface_furrow',
                    labelEn: 'Surface / Furrow (60% Eff)',
                    labelAr: 'ري غمر / خطوط (كفاءة 60%)',
                    descEn: 'Traditional gravity surface basin system',
                    descAr: 'نظام الري السطحي التقليدي بالغمر والخطوط'
                  },
                  {
                    id: 'sprinkler',
                    labelEn: 'Sprinkler (75% Eff)',
                    labelAr: 'ري بالرش (كفاءة 75%)',
                    descEn: 'Pressurized sprinkler / center pivot',
                    descAr: 'شبكات الرش بالضغط أو الرش المحوري'
                  },
                  {
                    id: 'drip',
                    labelEn: 'Precision Drip (85% Eff)',
                    labelAr: 'ري بالتنقيط (كفاءة 85%)',
                    descEn: 'Localized micro-irrigation system',
                    descAr: 'نظام الري الموضعي عالي الكفاءة بالتنقيط'
                  },
                ].map((m) => (
                  <button
                    key={m.id}
                    type="button"
                    onClick={() => setIrrigationMethod(m.id as any)}
                    className={`p-3.5 rounded-xl border text-left transition-all ${
                      irrigationMethod === m.id
                        ? 'border-forest-600 bg-forest-50/70 shadow-soft ring-1 ring-forest-600'
                        : 'border-slate-200/80 hover:border-forest-300 bg-white'
                    }`}
                  >
                    <div className="text-xs font-bold text-charcoal">
                      {isAr ? m.labelAr : m.labelEn}
                    </div>
                    <div className="text-[11px] text-slate-500 mt-1">
                      {isAr ? m.descAr : m.descEn}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Irrigation Water Salinity (ECw) */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-charcoal flex items-center gap-1.5">
                  <Droplet className="w-4 h-4 text-sky-600" />
                  <span>{isAr ? 'ملوحة مياه الري (ECw)' : 'Irrigation Water Salinity (ECw)'}</span>
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sand text-slate-500 font-semibold">
                  {t('optionalBadge')}
                </span>
              </div>
              
              <p className="text-[11px] text-slate-500 leading-relaxed">
                {isAr
                  ? 'اختياري: التوصيل الكهربائي لمياه الري المطبقة (ECw بالديسيمنز/م). يختلف تماماً عن ملوحة مستخلص التربة المشبعة (ECe). في ظروف الصرف الاعتيادية، تستقر ملوحة التربة عند ~1.5 ضعف ملوحة مياه الري (FAO 29 Table 4).'
                  : 'Optional: Electrical conductivity of applied irrigation water (ECw in dS/m). Strictly distinct from root-zone soil extract salinity (ECe). Under standard leaching, soil ECe stabilizes at ~1.5 × ECw (FAO 29 Table 4).'}
              </p>

              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <div className="relative flex-1 sm:max-w-xs">
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    max="25"
                    placeholder={isAr ? 'مثال: 0.8 ديسيمنز/م' : 'e.g. 0.8 dS/m'}
                    value={waterSalinityECw}
                    onChange={(e) => setWaterSalinityECw(e.target.value)}
                    className={`w-full py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-forest-500 focus:border-forest-500 text-sm font-medium ${isAr ? 'pr-3.5 pl-14' : 'pl-3.5 pr-14'}`}
                  />
                  <div className={`absolute inset-y-0 ${isAr ? 'left-3' : 'right-3'} flex items-center pointer-events-none text-xs text-slate-400 font-semibold`}>
                    dS/m
                  </div>
                </div>

                {waterSalinityECw !== '' && !isNaN(parseFloat(waterSalinityECw)) && (
                  <div className="text-xs">
                    {parseFloat(waterSalinityECw) < 0.7 && (
                      <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-800 font-bold border border-emerald-200">
                        {isAr ? 'مياه ممتازة (بدون قيود)' : 'None (<0.7 dS/m)'}
                      </span>
                    )}
                    {parseFloat(waterSalinityECw) >= 0.7 && parseFloat(waterSalinityECw) <= 3.0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-800 font-bold border border-amber-200">
                        {isAr ? 'قيود طفيفة إلى متوسطة (0.7–3.0)' : 'Slight to Moderate (0.7–3.0)'}
                      </span>
                    )}
                    {parseFloat(waterSalinityECw) > 3.0 && (
                      <span className="px-2.5 py-1 rounded-lg bg-red-50 text-red-800 font-bold border border-red-200">
                        {isAr ? 'قيود شديدة (>3.0 dS/m)' : 'Severe Restriction (>3.0)'}
                      </span>
                    )}
                  </div>
                )}
              </div>

              {validationErrors.waterSalinityECw && (
                <p className="text-xs text-red-600 font-medium">{validationErrors.waterSalinityECw}</p>
              )}
            </div>

            {/* Farmer Priority */}
            <div className="space-y-3">
              <label className="block text-sm font-bold text-charcoal">
                {t('priorityLabel')} <span className="text-red-500">*</span>
              </label>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {[
                  { id: 'water_conservation', label: t('priorityWater'), icon: Droplet },
                  { id: 'soil_health', label: t('prioritySoil'), icon: Layers },
                  { id: 'climate_resilience', label: t('priorityClimate'), icon: Sun },
                  { id: 'profitability', label: t('priorityProfit'), icon: Target },
                ].map((item) => {
                  const Icon = item.icon;
                  const isSelected = priority === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setPriority(item.id as FarmerPriority)}
                      className={`p-3.5 rounded-xl border text-left transition-all flex items-start gap-3 ${
                        isSelected
                          ? 'border-forest-600 bg-forest-50/70 shadow-soft ring-1 ring-forest-600'
                          : 'border-slate-200/80 hover:border-forest-300 bg-white'
                      }`}
                    >
                      <div className={`p-2 rounded-lg ${isSelected ? 'bg-forest-600 text-white' : 'bg-sand text-charcoal'}`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="text-xs font-semibold text-charcoal leading-snug">
                        {item.label}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Previous Crop */}
            <div className="space-y-2 pt-2 border-t border-slate-100">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-bold text-charcoal">
                  {t('previousCropLabel')}
                </label>
                <span className="text-[10px] px-2 py-0.5 rounded bg-sand text-slate-500 font-semibold">
                  {t('optionalBadge')}
                </span>
              </div>
              <p className="text-xs text-slate-500">{t('previousCropHelp')}</p>
              
              <select
                value={previousCrop}
                onChange={(e) => setPreviousCrop(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 focus:ring-2 focus:ring-forest-500 focus:border-forest-500 bg-white text-charcoal text-sm font-medium"
              >
                <option value="fallow">{t('previousCropNone')}</option>
                {CROPS_LIST.map((c) => (
                  <option key={c.id} value={c.id}>
                    {isAr ? `${c.nameAr} (${c.familyAr})` : `${c.nameEn} (${c.family})`}
                  </option>
                ))}
              </select>
            </div>

          </div>
        </div>

        {/* Submit Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
          <button
            type="button"
            onClick={handleResetDefaults}
            className="text-xs font-semibold text-slate-500 hover:text-charcoal underline transition-colors"
          >
            {t('resetForm')}
          </button>

          <button
            type="submit"
            disabled={isSubmitting || climateLoading}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-bold text-base shadow-soft hover:shadow-soft-lg transition-all active:scale-[0.98] disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <RefreshCw className="w-5 h-5 animate-spin" />
                <span>{t('submittingBtn')}</span>
              </>
            ) : (
              <>
                <span>{t('submitBtn')}</span>
                <ChevronRight className={`w-5 h-5 ${isAr ? 'rotate-180' : ''}`} />
              </>
            )}
          </button>
        </div>

      </form>
    </div>
  );
};
