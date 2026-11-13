import React, { useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useUnit } from '../context/UnitContext';
import { useAuth } from '../context/AuthContext';
import { dbService } from '../services/database';
import { UnitSwitcher } from './UnitSwitcher';
import { AgriImage } from './AgriImage';
import { CropRotationTimeline } from './CropRotationTimeline';
import type { 
  FarmAssessmentInput, 
  NasaPowerClimateData, 
  RotationPlan,
  FarmRecord
} from '../types';
import { getLocationDisplayName, isSohagRegion } from '../data/sohagDistricts';
import { 
  Award, 
  Printer, 
  ArrowLeft, 
  CheckCircle2, 
  AlertTriangle, 
  Info, 
  ShieldAlert,
  TrendingUp,
  Globe2,
  Calendar,
  Clock,
  Sprout,
  Layers,
  Droplet,
  Sparkles,
  ShieldCheck,
  Zap,
  Sun,
  BookmarkCheck,
  Bookmark,
  Loader2,
  RefreshCw,
  X,
  Bot
} from 'lucide-react';

interface ResultsViewProps {
  plans: RotationPlan[];
  input: FarmAssessmentInput;
  climate: NasaPowerClimateData;
  onModifyAssessment: () => void;
  isSavedSnapshot?: boolean;
  savedPlanMetadata?: {
    planId: string;
    planName: string;
    savedAt: string;
    notes?: string;
  };
  onRegenerateLive?: () => void;
  onViewSavedPlans?: () => void;
  onAskAboutPlan?: (plan: RotationPlan) => void;
}

const SOIL_TYPE_NAMES: Record<string, { en: string; ar: string }> = {
  clay_loam: { en: 'Clay Loam', ar: 'طميية طينية (Clay Loam)' },
  sandy_loam: { en: 'Sandy Loam', ar: 'طميية رملية (Sandy Loam)' },
  silty_clay: { en: 'Silty Clay', ar: 'طميية سلتية (Silty Clay)' },
  sandy: { en: 'Sandy', ar: 'رملية (Sandy)' },
  calcareous: { en: 'Calcareous', ar: 'جيرية كلسية (Calcareous)' },
};

const IRRIGATION_NAMES: Record<string, { en: string; ar: string }> = {
  low: { en: 'Low Availability', ar: 'وفرة مياه منخفضة' },
  medium: { en: 'Medium Availability', ar: 'وفرة مياه متوسطة' },
  high: { en: 'High Availability', ar: 'وفرة مياه عالية' },
};

const PRIORITY_NAMES: Record<string, { en: string; ar: string }> = {
  water_conservation: { en: 'Water Conservation', ar: 'ترشيد المياه' },
  soil_health: { en: 'Soil Health', ar: 'خصوبة وصحة التربة' },
  climate_resilience: { en: 'Climate Resilience', ar: 'الصمود المناخي' },
  profitability: { en: 'Profitability', ar: 'الربحية والسيولة' },
};

const PREVIOUS_CROP_NAMES: Record<string, { en: string; ar: string }> = {
  none: { en: 'Fallow (Resting)', ar: 'أرض بور (مراحة)' },
  fallow: { en: 'Fallow (Resting)', ar: 'أرض بور (مراحة)' },
  wheat: { en: 'Wheat', ar: 'القمح' },
  berseem: { en: 'Egyptian Clover (Berseem)', ar: 'البرسيم المصري' },
  sorghum: { en: 'Grain Sorghum', ar: 'الذرة الرفيعة' },
  faba_bean: { en: 'Faba Bean', ar: 'الفول البلدي' },
  onion: { en: 'Onion', ar: 'البصل' },
  barley: { en: 'Barley', ar: 'الشعير' },
  canola: { en: 'Canola / Rapeseed', ar: 'الكانولا / السلجم' },
  potato: { en: 'Potato', ar: 'البطاطس' },
  rice: { en: 'Paddy Rice', ar: 'الأرز المغمور' },
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
  tomato: { en: 'Tomato', ar: 'طماطم الحقل' },
  pepper: { en: 'Pepper', ar: 'الفلفل' },
  sweet_potato: { en: 'Sweet Potato', ar: 'البطاطا الحلوة' },
  lupin: { en: 'White Lupin', ar: 'الترمس الأبيض' },
  castor: { en: 'Castor Bean', ar: 'الخروع' },
};

const TIER_NAMES: Record<string, { en: string; ar: string }> = {
  high: { en: 'High', ar: 'مرتفع' },
  medium: { en: 'Medium', ar: 'متوسط' },
  moderate: { en: 'Moderate', ar: 'معتدل' },
  low: { en: 'Low', ar: 'منخفض' },
};

export const ResultsView: React.FC<ResultsViewProps> = ({
  plans,
  input,
  climate,
  onModifyAssessment,
  isSavedSnapshot = false,
  savedPlanMetadata,
  onRegenerateLive,
  onViewSavedPlans,
  onAskAboutPlan
}) => {
  const { language, t } = useLanguage();
  const { formatNitrogen, formatWater } = useUnit();
  const { user, isAuthenticated, openAuthModal } = useAuth();
  const [selectedPlanId, setSelectedPlanId] = useState<string>(plans[0]?.id || '');

  // Save Plan modal state
  const [isSaveModalOpen, setIsSaveModalOpen] = useState(false);
  const [userFarms, setUserFarms] = useState<FarmRecord[]>([]);
  const [planCustomName, setPlanCustomName] = useState('');
  const [selectedFarmId, setSelectedFarmId] = useState<string>(input.farmId || '');
  const [planNotes, setPlanNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const selectedPlan = plans.find(p => p.id === selectedPlanId) || plans[0];
  const isAr = language === 'ar';

  useEffect(() => {
    if (user && isSaveModalOpen) {
      dbService.getFarms(user.id).then(farms => {
        setUserFarms(farms);
        if (input.farmId && farms.some(f => f.id === input.farmId)) {
          setSelectedFarmId(input.farmId);
        }
      }).catch(err => console.warn('Could not load user farms:', err));
    }
  }, [user, isSaveModalOpen, input.farmId]);

  const handleSaveClick = (targetPlan?: RotationPlan) => {
    const planToSave = targetPlan || selectedPlan;
    if (!isAuthenticated) {
      openAuthModal('register', {
        plan: planToSave,
        input,
        climate,
        soil: {
          soilType: input.soilType,
          ph: input.soilPh || 7.2,
          organicMatterPct: input.organicMatterPct || 1.5,
          salinityEC: input.soilSalinityEC,
          source: 'user_specified',
          uncertaintyLevel: 'low'
        },
        farmName: input.farmName
      });
      return;
    }

    setPlanCustomName(language === 'ar' ? planToSave.titleAr : planToSave.titleEn);
    setPlanNotes('');
    setIsSaveModalOpen(true);
  };

  const handleConfirmSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSaving(true);
    try {
      const matchedFarm = userFarms.find(f => f.id === selectedFarmId);
      await dbService.savePlan({
        userId: user.id,
        farmId: selectedFarmId || undefined,
        farmName: matchedFarm ? matchedFarm.farmName : (input.farmName || (isAr ? 'حقل مخصص' : 'Custom Field')),
        planName: planCustomName.trim() || (language === 'ar' ? selectedPlan.titleAr : selectedPlan.titleEn),
        userNotes: planNotes.trim() || undefined,
        planSnapshot: selectedPlan,
        originalInputs: input,
        soilDataSnapshot: {
          soilType: input.soilType,
          ph: input.soilPh || 7.2,
          organicMatterPct: input.organicMatterPct || 1.5,
          salinityEC: input.soilSalinityEC,
          source: 'user_specified',
          uncertaintyLevel: 'low'
        },
        climateDataSnapshot: climate,
        recommendationVersion: 'v2.1-global-fao56'
      });
      setSavedSuccess(true);
      setTimeout(() => {
        setIsSaveModalOpen(false);
        setSavedSuccess(false);
      }, 1500);
    } catch (err) {
      console.error('Failed to save plan:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const locationName = input.locationName || getLocationDisplayName(input.districtId, input.latitude, input.longitude, language);
  const soilDisplay = SOIL_TYPE_NAMES[input.soilType] ? (isAr ? SOIL_TYPE_NAMES[input.soilType].ar : SOIL_TYPE_NAMES[input.soilType].en) : input.soilType;
  const irrigationDisplay = IRRIGATION_NAMES[input.irrigationAvailability] ? (isAr ? IRRIGATION_NAMES[input.irrigationAvailability].ar : IRRIGATION_NAMES[input.irrigationAvailability].en) : input.irrigationAvailability;
  const priorityDisplay = PRIORITY_NAMES[input.farmerPriority] ? (isAr ? PRIORITY_NAMES[input.farmerPriority].ar : PRIORITY_NAMES[input.farmerPriority].en) : input.farmerPriority;
  const prevCropKey = input.previousCrop || 'none';
  const prevCropDisplay = PREVIOUS_CROP_NAMES[prevCropKey] ? (isAr ? PREVIOUS_CROP_NAMES[prevCropKey].ar : PREVIOUS_CROP_NAMES[prevCropKey].en) : (input.previousCrop || (isAr ? 'أرض بور (مراحة)' : 'Fallow'));

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="max-w-7xl mx-auto py-3 sm:py-6 space-y-6 sm:space-y-10 font-sans w-full max-w-full overflow-hidden">
      
      {/* Historical Saved Plan Snapshot Banner */}
      {isSavedSnapshot && (
        <div className="p-6 rounded-3xl bg-forest-950 text-white shadow-soft-xl flex flex-col md:flex-row md:items-center justify-between gap-5 border border-forest-800">
          <div className="space-y-1.5">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-forest-200 bg-forest-800/80 px-3 py-1 rounded-full border border-forest-600/40">
              <BookmarkCheck className="w-4 h-4 text-sage-400" />
              <span>{isAr ? 'نسخة تاريخية محفوظة لخطة زراعية' : 'Saved Plan Snapshot'}</span>
              {savedPlanMetadata?.savedAt && (
                <span className="text-forest-200/80 font-normal">
                  • {new Date(savedPlanMetadata.savedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { dateStyle: 'medium' })}
                </span>
              )}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold text-white">
              {savedPlanMetadata?.planName || (isAr ? selectedPlan.titleAr : selectedPlan.titleEn)}
            </h2>
            {savedPlanMetadata?.notes && (
              <p className="text-xs text-forest-100/90 italic bg-white/5 p-2.5 rounded-xl border border-white/10">
                "{savedPlanMetadata.notes}"
              </p>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0 no-print">
            {onRegenerateLive && (
              <button
                onClick={onRegenerateLive}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-500 hover:bg-forest-400 text-white font-semibold text-xs shadow-soft transition-all active:scale-[0.98]"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>{isAr ? 'إعادة تقييم حية بأرصاد ناسا' : 'Re-evaluate with Fresh Live NASA Data'}</span>
              </button>
            )}
            {onViewSavedPlans && (
              <button
                onClick={onViewSavedPlans}
                className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white font-medium text-xs transition-all border border-white/20"
              >
                <span>{isAr ? 'العودة لخططي الزراعية' : 'Back to My Plans'}</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Top Banner: Context & Summary */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-200/80 shadow-soft space-y-5 sm:space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-5 sm:pb-6 border-b border-slate-100">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700 bg-forest-50 px-2.5 py-1 rounded-md">
              <Award className="w-3.5 h-3.5 text-forest-600" />
              <span>{t('resultsTitle')}</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-bold text-charcoal mt-2">
              {t('plansGeneratedCount')}
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              {t('resultsSubtitle')}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2 sm:gap-2.5 no-print">
            <UnitSwitcher />

            {/* Save Plan Button */}
            <button
              onClick={() => handleSaveClick()}
              className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold transition-all shadow-soft active:scale-[0.98]"
            >
              <Bookmark className="w-3.5 h-3.5" />
              <span>{isAr ? 'حفظ الخطة لحسابي' : 'Save Plan to Profile'}</span>
            </button>

            <button
              onClick={onModifyAssessment}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-300 hover:border-slate-400 text-charcoal text-xs font-semibold bg-white hover:bg-sand transition-all shadow-soft"
            >
              <ArrowLeft className={`w-3.5 h-3.5 ${language === 'ar' ? 'rotate-180' : ''}`} />
              <span>{language === 'ar' ? 'تعديل مدخلات الحقل' : 'Modify Farm Inputs'}</span>
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-500 text-white text-xs font-semibold transition-all shadow-soft active:scale-[0.98]"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{t('printReport')}</span>
            </button>
          </div>
        </div>

        {/* Global Agricultural Notice if applicable */}
        {!isSohagRegion(input.latitude, input.longitude) && (
          <div className="p-3.5 rounded-2xl bg-sky-50/80 border border-sky-200 text-xs text-sky-950 flex items-center gap-2.5 font-medium">
            <Globe2 className="w-4 h-4 text-sky-600 shrink-0" />
            <span>
              {isAr
                ? 'نطاق زراعي عالمي - تم احتساب التوصيات بناءً على أرصاد ناسا POWER المناخية الحية للموقع وخصائص التربة المحددة.'
                : 'Global Agricultural Location - Recommendations derived from live NASA POWER surface meteorology and your soil profile.'}
            </span>
          </div>
        )}

        {/* Climate Telemetry Provenance Banner */}
        {climate.sourceStatus === 'user_specified' && (
          <div className="p-3.5 rounded-2xl bg-blue-50/80 border border-blue-200 text-xs text-blue-950 flex items-center gap-2.5 font-medium">
            <Info className="w-4 h-4 text-blue-600 shrink-0" />
            <span>
              {isAr
                ? 'بيانات مناخية مدخلة يدوياً: الحسابات مبنية على قياساتك الحقلية المدخلة دون استخدام بيانات اصطناعية تقديرية.'
                : 'User-Provided Climate Telemetry: Suitability calculations are driven by your specified climate inputs without synthetic estimates.'}
            </span>
          </div>
        )}

        {climate.sourceStatus === 'demo_mode' && (
          <div className="p-3.5 rounded-2xl bg-amber-50/80 border border-amber-200 text-xs text-amber-950 flex items-center gap-2.5 font-medium">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>
              {isAr
                ? 'تنبيه الوضع التجريبي: الحسابات مبنية على نموذج تقديري محاكى مخصص للعرض فقط وليست أرصاداً حية من ناسا.'
                : 'Demo Simulation Mode: Recommendations are driven by benchmark simulation data for demonstration purposes only.'}
            </span>
          </div>
        )}

        {/* Input & Climate Summary Chips */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2 sm:gap-3 text-xs">
          
          <div className="p-3 rounded-xl bg-sand/60 border border-slate-200/80">
            <span className="text-slate-400 block font-medium">{language === 'ar' ? 'المركز والموقع' : 'Location'}</span>
            <span className="font-bold text-charcoal text-xs mt-0.5 block truncate" title={locationName}>
              {locationName}
            </span>
            <span className="text-[10px] text-slate-500 font-mono">
              {input.latitude.toFixed(2)}°N, {input.longitude.toFixed(2)}°E
            </span>
          </div>

          <div className="p-3 rounded-xl bg-sand/60 border border-slate-200/80">
            <span className="text-slate-400 block font-medium">{t('soilTypeLabel')}</span>
            <span className="font-bold text-charcoal text-xs mt-0.5 block truncate" title={soilDisplay}>
              {soilDisplay}
            </span>
            <span className="text-[10px] text-slate-500">
              pH: {input.soilPh || '7.2'} • {language === 'ar' ? 'مادة عضوية:' : 'OM:'} {input.organicMatterPct ? `${input.organicMatterPct}%` : '1.5%'}
              {input.soilSalinityEC !== undefined && ` • EC: ${input.soilSalinityEC} dS/m`}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-sand/60 border border-slate-200/80">
            <span className="text-slate-400 block font-medium">{t('irrigationLabel')}</span>
            <span className="font-bold text-charcoal text-xs mt-0.5 block truncate" title={irrigationDisplay}>
              {irrigationDisplay}
            </span>
            <span className="text-[10px] text-slate-500">
              {isAr
                ? (isSohagRegion(input.latitude, input.longitude) ? 'مناوبات ترع النيل' : 'إمداد مائي مخصص')
                : (isSohagRegion(input.latitude, input.longitude) ? 'Nile canal rotation' : 'Allocated supply')}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-sand/60 border border-slate-200/80">
            <span className="text-slate-400 block font-medium">{t('priorityLabel')}</span>
            <span className="font-bold text-charcoal text-xs mt-0.5 block truncate" title={priorityDisplay}>
              {priorityDisplay}
            </span>
            <span className="text-[10px] text-forest-700 font-semibold">
              {language === 'ar' ? 'أولوية مرجحة' : 'Priority Weighted'}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-sky-50/70 border border-sky-200/80">
            <span className="text-sky-700 block font-medium">{language === 'ar' ? 'مناخ ناسا POWER' : 'NASA Climate'}</span>
            <span className="font-bold text-sky-950 text-xs mt-0.5 block">
              {climate.avgTemperatureC}°C / {climate.maxTemperatureC}°C
            </span>
            <span className="text-[10px] text-sky-700">
              {language === 'ar' ? `أمطار: ${climate.totalPrecipitationMm} مم (2024)` : `Rain: ${climate.totalPrecipitationMm} mm (2024)`}
            </span>
          </div>

          <div className="p-3 rounded-xl bg-sand/60 border border-slate-200/80">
            <span className="text-slate-400 block font-medium">{language === 'ar' ? 'المحصول السابق' : 'Previous Crop'}</span>
            <span className="font-bold text-charcoal text-xs mt-0.5 block truncate" title={prevCropDisplay}>
              {prevCropDisplay}
            </span>
            <span className="text-[10px] text-slate-500">
              {language === 'ar' ? 'تتابع معاير' : 'Sequence calibrated'}
            </span>
          </div>

        </div>
      </div>

      {/* 3 Strategy Cards Grid at Top */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-charcoal flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-forest-600" />
            <span>{isAr ? 'أفضل 3 خطط زراعية متعاقبة تم توليدها وتصنيفها' : 'Top 3 Ranked Crop Rotation Strategies'}</span>
          </h2>
          <span className="text-xs text-slate-500">
            {isAr ? 'انقر على أي خطة لمعاينة تفاصيلها وجدول زراعتها' : 'Click any strategy below to inspect its full timeline'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
          {plans.map((plan, index) => {
            const isSelected = plan.id === selectedPlanId;
            const isTopMatch = index === 0;

            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlanId(plan.id)}
                className={`rounded-2xl sm:rounded-3xl p-4 sm:p-7 border transition-all cursor-pointer relative flex flex-col justify-between min-w-0 w-full max-w-full overflow-hidden ${
                  isSelected
                    ? 'bg-white border-forest-600 shadow-soft-lg ring-2 ring-forest-600/30'
                    : 'bg-white/90 hover:bg-white border-slate-200/80 hover:border-forest-300 shadow-soft'
                }`}
              >
                {/* Badge & Overall Score Header */}
                <div className="flex items-center justify-between gap-2 pb-4 border-b border-slate-100">
                  <span className={`px-3 py-1 rounded-full text-xs font-semibold ${
                    isTopMatch
                      ? 'bg-forest-100 text-forest-900 border border-forest-300'
                      : 'bg-sand text-charcoal'
                  }`}>
                    {isTopMatch ? `★ ${t('recommendedBadge')}` : t('alternativeBadge')}
                  </span>

                  <div className="text-right flex items-baseline gap-1">
                    <span className="text-2xl font-bold text-forest-800">{plan.overallScore}</span>
                    <span className="text-xs text-slate-400 font-medium">/100</span>
                  </div>
                </div>

                {/* 4-Season Crop Stages Succession (Clean & Perfectly Aligned) */}
                <div className="py-4 flex-1 w-full max-w-full overflow-hidden">
                  <CropRotationTimeline steps={plan.steps} layout="compact" />
                </div>

                {/* Bottom Action Footer */}
                <div className="pt-3.5 border-t border-slate-100 flex items-center justify-between gap-2 text-xs font-semibold">
                  <span className="text-forest-700 flex items-center gap-1.5">
                    {isSelected && <CheckCircle2 className="w-3.5 h-3.5 text-forest-600 shrink-0" />}
                    <span>{isSelected ? (language === 'ar' ? 'الخطة المعروضة حالياً' : 'Currently Inspected') : (language === 'ar' ? 'معاينة التفاصيل' : 'View Details')}</span>
                  </span>
                  {onAskAboutPlan && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onAskAboutPlan(plan);
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-800 border border-forest-200 transition-all text-[11px] shadow-2xs hover:scale-105 active:scale-95 shrink-0"
                      title={isAr ? 'اسأل المستشار عن هذه الخطة' : 'Ask About This Plan'}
                    >
                      <Bot className="w-3.5 h-3.5 text-forest-600" />
                      <span>{isAr ? 'اسأل المستشار' : 'Ask AI'}</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Plan Selection Navigation Tabs */}
      <div className="bg-sand/70 p-1.5 rounded-2xl flex flex-wrap sm:flex-nowrap gap-1 border border-slate-200/80">
        {plans.map((p, idx) => {
          const isSelected = p.id === selectedPlanId;
          return (
            <button
              key={p.id}
              onClick={() => setSelectedPlanId(p.id)}
              className={`flex-1 py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold transition-all flex items-center justify-center gap-2 ${
                isSelected
                  ? 'bg-white text-forest-800 shadow-soft ring-1 ring-forest-600/30'
                  : 'text-slate-600 hover:text-charcoal hover:bg-white/60'
              }`}
            >
              <span>{idx === 0 ? '★ ' : ''}{isAr ? `الخطة ${idx + 1}` : `Plan ${idx + 1}`}:</span>
              <span className="truncate max-w-[200px]">{isAr ? p.titleAr.split('–')[0] : p.titleEn.split('–')[0]}</span>
              <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${isSelected ? 'bg-forest-100 text-forest-800' : 'bg-slate-200 text-slate-700'}`}>
                {p.overallScore}/100
              </span>
            </button>
          );
        })}
      </div>

      {/* Selected Plan In-Depth Visualizer */}
      <div className="bg-white rounded-3xl p-6 sm:p-9 border border-slate-200/80 shadow-soft space-y-10">
        
        {/* PART 4A: Plan Overview */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-6 border-b border-slate-100">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider px-3 py-1 rounded-full bg-forest-100 text-forest-900 border border-forest-300">
                {language === 'ar' ? 'التحليل الزراعي الشامل للخطة' : 'Detailed Agronomic Plan Overview'}
              </span>
              <span className="text-xs font-medium text-slate-500">
                ({selectedPlan.steps.length} {isAr ? 'مواسم إنتاجية متعاقبة' : 'consecutive cropping seasons'})
              </span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-charcoal">
              {language === 'ar' ? selectedPlan.titleAr : selectedPlan.titleEn}
            </h2>
            <p className="text-sm text-forest-900 font-medium leading-relaxed">
              {language === 'ar' ? selectedPlan.strategicFocusAr : selectedPlan.strategicFocusEn}
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0 flex-wrap sm:flex-nowrap">
            {onAskAboutPlan && (
              <button
                onClick={() => onAskAboutPlan(selectedPlan)}
                className="no-print inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-forest-700 hover:bg-forest-800 text-white text-xs font-semibold transition-all shadow-soft active:scale-[0.98]"
              >
                <Bot className="w-4 h-4 text-emerald-300" />
                <span>{isAr ? 'اسأل المستشار عن هذه الخطة' : 'Ask About This Plan'}</span>
              </button>
            )}

            <button
              onClick={() => handleSaveClick(selectedPlan)}
              className="no-print inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-forest-50 hover:bg-forest-100 text-forest-900 border border-forest-200/80 text-xs font-semibold transition-all shadow-soft active:scale-[0.98]"
            >
              <Bookmark className="w-4 h-4 text-forest-700" />
              <span>{isAr ? 'حفظ هذه الخطة' : 'Save This Plan'}</span>
            </button>

            <div className="text-center p-4 rounded-2xl bg-sand/60 border border-slate-200/80 min-w-32">
              <span className="text-[10px] font-bold text-slate-500 uppercase block">{t('overallSuitability')}</span>
              <span className="text-3xl font-bold text-forest-800">{selectedPlan.overallScore}</span>
              <span className="text-[11px] text-slate-500 font-medium block">/ 100 points</span>
            </div>
          </div>
        </div>

        {/* Why this plan fits the user's specific inputs */}
        <div className="p-6 rounded-2xl bg-forest-50/70 border border-forest-200/70 space-y-2">
          <h3 className="text-base font-bold text-forest-900 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-forest-700" />
            <span>{t('whyFitsTitle')}</span>
          </h3>
          <p className="text-sm text-forest-950 leading-relaxed font-normal">
            {language === 'ar' ? selectedPlan.whyItFitsAr : selectedPlan.whyItFitsEn}
          </p>
        </div>

        {/* PART 4B: Four-Season Agricultural & Planting Timeline (Individual Crop Cards with AgriImage) */}
        <div className="space-y-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-forest-700">
              <Calendar className="w-4 h-4" />
              <span>{isAr ? 'جدول المواعيد الزراعية والتعاقب الحقلي' : 'Agricultural Timeline & Planting Calendar'}</span>
            </div>
            <h3 className="text-xl font-bold text-charcoal">
              {isAr ? 'تفاصيل كل محصول في الدورة الزراعية ومواعيد زراعته وحصاده' : 'Detailed Crop Cards with Calibrated Planting & Harvesting Windows'}
            </h3>
            <p className="text-xs text-slate-500">
              {isAr
                ? 'مواعيد الزراعة والحصاد محسوبة استناداً لنصف الكرة الأرضية وأرصاد درجات الحرارة والصقيع اليومية.'
                : 'Planting and harvesting windows are dynamically calibrated for your hemisphere, local frost hazard, and crop thermal requirements.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedPlan.steps.map((step, idx) => {
              const crop = step.crop;
              if (!crop) return null;
              const stepWater = formatWater(step.waterEstimateMm);
              const stepNitrogen = formatNitrogen(step.nitrogenContributionKg);
              const timeline = step.timeline;

              return (
                <div
                  key={idx}
                  className="rounded-3xl p-6 border border-slate-200/80 bg-white hover:border-forest-300 shadow-soft hover:shadow-soft-lg transition-all flex flex-col justify-between space-y-5"
                >
                  {/* Step Header with High-Resolution Crop Photography */}
                  <div className="space-y-4 pb-4 border-b border-slate-100">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-0.5 rounded-full bg-forest-800 text-white font-mono font-bold text-[11px] shadow-2xs">
                          #{String(idx + 1).padStart(2, '0')}
                        </span>
                        <span className="px-3 py-1 rounded-full bg-sand text-charcoal font-semibold border border-slate-200/80">
                          {isAr ? step.seasonLabelAr : step.seasonLabelEn}
                        </span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-md bg-forest-50 text-forest-800 font-semibold text-[11px] border border-forest-200/70">
                        {isAr ? timeline?.seasonClassificationAr : timeline?.seasonClassificationEn}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {/* Crop Thumbnail */}
                      <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-slate-200 shrink-0 shadow-soft">
                        <AgriImage cropId={crop.id} alt={crop.nameEn} className="w-full h-full object-cover" />
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2 flex-wrap">
                          <h4 className="text-lg sm:text-xl font-bold text-charcoal break-words whitespace-normal leading-tight">
                            {isAr ? crop.nameAr : crop.nameEn}
                          </h4>
                          <span className="text-xs font-medium text-forest-700 shrink-0">
                            {isAr ? crop.nameEn : crop.nameAr}
                          </span>
                        </div>
                        <p className="text-xs font-mono text-slate-500 italic mt-0.5 break-words whitespace-normal">
                          {crop.scientificName} • {isAr ? crop.familyAr : crop.family}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Agricultural Calendar Windows */}
                  <div className="p-4 rounded-2xl bg-sand/40 border border-slate-200/80 space-y-3">
                    <div className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-forest-600" />
                      <span>{isAr ? 'المواعيد الزراعية المقدرة' : 'Agricultural Planting & Harvest Windows'}</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3 text-xs">
                      <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-soft">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">{isAr ? 'ميعاد الزراعة الموصى به' : 'Recommended Planting'}</span>
                        <span className="text-xs font-bold text-forest-900 mt-0.5 block">
                          {isAr ? timeline?.plantingWindowAr : timeline?.plantingWindowEn}
                        </span>
                      </div>

                      <div className="p-2.5 rounded-xl bg-white border border-slate-200/80 shadow-soft">
                        <span className="text-[10px] text-slate-400 block font-bold uppercase">{isAr ? 'ميعاد الحصاد المتوقع' : 'Expected Harvesting'}</span>
                        <span className="text-xs font-bold text-amber-900 mt-0.5 block">
                          {isAr ? timeline?.harvestWindowAr : timeline?.harvestWindowEn}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs px-1">
                      <span className="text-slate-500 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                        <span>{isAr ? 'فترة النمو والنضج الحقلية:' : 'Growing Cycle Duration:'}</span>
                      </span>
                      <strong className="text-charcoal font-bold">
                        {isAr ? timeline?.durationRangeAr : timeline?.durationRangeEn}
                      </strong>
                    </div>

                    {/* Window rationale */}
                    <p className="text-[11px] text-slate-600 leading-relaxed pt-1 border-t border-slate-200/60 font-normal">
                      <strong>{isAr ? 'أسباب الميعاد:' : 'Timing Rationale:'}</strong> {isAr ? timeline?.timingRationaleAr : timeline?.timingRationaleEn}
                    </p>
                  </div>

                  {/* Agronomic Role & Specific Notes */}
                  <div className="space-y-3 text-xs leading-relaxed">
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-charcoal uppercase tracking-wider block">
                        {isAr ? 'دور المحصول في الدورة الزراعية:' : 'Role in Crop Rotation:'}
                      </span>
                      <p className="text-slate-700 bg-sand/40 p-2.5 rounded-xl border border-slate-200/70">
                        {isAr ? step.roleInRotationAr : step.roleInRotationEn}
                      </p>
                    </div>

                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-charcoal uppercase tracking-wider block">
                        {isAr ? 'إرشادات زراعية وملاحظات مهمة:' : 'Agronomic Guidance & Precautions:'}
                      </span>
                      <p className="text-slate-600 bg-sand/40 p-2.5 rounded-xl border border-slate-200/70">
                        {isAr ? step.importantNotesAr : step.importantNotesEn}
                      </p>
                    </div>

                    {/* Foliar Disease / Humidity Risk Factors */}
                    {crop.diseaseRiskFactorsEn && (
                      <div className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200/80 text-[11px] text-amber-900 space-y-0.5">
                        <div className="font-bold flex items-center gap-1 text-amber-800">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{isAr ? 'عوامل المخاطر المرضية والرطوبة:' : 'Disease Risk & Foliar Humidity Factor:'}</span>
                        </div>
                        <p className="leading-snug">
                          {isAr ? crop.diseaseRiskFactorsAr : crop.diseaseRiskFactorsEn}
                        </p>
                      </div>
                    )}

                    {/* Best Seed Variety Recommendation for Farmer's Specific Land */}
                    {step.varietyRecommendation && (
                      <div className="p-3.5 rounded-2xl bg-forest-50/70 border border-forest-200/80 space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-forest-900">
                            <Sparkles className="w-4 h-4 text-forest-600 shrink-0" />
                            <span>{t('varietySectionTitle')}</span>
                          </div>
                          {step.varietyRecommendation.evidenceSupported && step.varietyRecommendation.varietyName && (
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-forest-200/70 text-forest-950">
                              {step.varietyRecommendation.breedingInstitute.split('/')[0].trim()}
                            </span>
                          )}
                        </div>

                        {step.varietyRecommendation.evidenceSupported && step.varietyRecommendation.varietyName ? (
                          <div className="space-y-1.5">
                            <div className="flex items-baseline gap-2">
                              <h5 className="text-base font-bold text-forest-950">
                                {isAr ? (step.varietyRecommendation.varietyNameAr || step.varietyRecommendation.varietyName) : step.varietyRecommendation.varietyName}
                              </h5>
                              {step.varietyRecommendation.releaseYear && (
                                <span className="text-[11px] font-mono text-forest-700">
                                  ({step.varietyRecommendation.releaseYear})
                                </span>
                              )}
                            </div>

                            <div className="pt-1.5 border-t border-forest-200/70 space-y-0.5">
                              <span className="text-[11px] font-bold text-forest-900 block">
                                {t('varietyWhyTitle')}
                              </span>
                              <p className="text-xs text-forest-900/90 leading-relaxed font-normal">
                                {isAr ? step.varietyRecommendation.explanationAr : step.varietyRecommendation.explanationEn}
                              </p>
                            </div>
                          </div>
                        ) : (
                          <div className="p-2.5 rounded-xl bg-white/70 border border-forest-200/50 text-xs text-slate-500 italic">
                            {t('varietyNoData')}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Quantitative Crop Metrics Footer */}
                  <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center justify-between p-2 rounded-lg bg-sky-50 text-sky-900 font-medium">
                      <span>{t('waterReqLabel')}:</span>
                      <strong className="font-bold">{stepWater.formatted}</strong>
                    </div>

                    <div className={`flex items-center justify-between p-2 rounded-lg font-medium ${step.nitrogenContributionKg >= 0 ? 'bg-emerald-50 text-emerald-900' : 'bg-amber-50 text-amber-900'}`}>
                      <span>{t('nitrogenFixLabel')}:</span>
                      <strong className="font-bold">{stepNitrogen.formatted}</strong>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        </div>

        {/* PART 4C: Comprehensive Agronomic Explanation Cards */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-charcoal flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-forest-600" />
              <span>{isAr ? 'التحليل الزراعي والعلمي المتكامل للدورة' : 'Comprehensive Agronomic Strategy Explanation'}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {isAr ? 'تحليل تأثير الدورة على الخصوبة ومكافحة الآفات وإدارة المياه والمخاطر المحتملة' : 'Detailed evaluation of fertility impact, pest breaks, water footprint, and rotational harmony.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs leading-relaxed">
            
            {/* 1. Soil Fertility */}
            <div className="p-4 rounded-2xl bg-sand/40 border border-slate-200/80 space-y-1.5">
              <h4 className="font-bold text-charcoal flex items-center gap-1.5">
                <Layers className="w-4 h-4 text-forest-600" />
                <span>{isAr ? '1. ديناميكية خصوبة وصحة التربة' : '1. Soil Health & Biological Fertility'}</span>
              </h4>
              <p className="text-slate-600">
                {isAr
                  ? `توفر هذه الدورة ميزاناً نيتروجينياً صافياً قدره (${selectedPlan.netNitrogenBalanceKgHa > 0 ? `+${selectedPlan.netNitrogenBalanceKgHa}` : selectedPlan.netNitrogenBalanceKgHa} كجم N/هـ)، عبر إدماج البقوليات المثبتة للنيتروجين الحيوي التي تعوض استهلاك الحبوب المجهدة للتربة وتثري محتوى الدبال والمادة العضوية.`
                  : `Delivers a net nitrogen balance of (${selectedPlan.netNitrogenBalanceKgHa > 0 ? `+${selectedPlan.netNitrogenBalanceKgHa}` : selectedPlan.netNitrogenBalanceKgHa} kg N/ha). Integrating N-fixing legumes offsets cereal nutrient uptake and enriches organic humus structure.`}
              </p>
            </div>

            {/* 2. Pest & Disease Break */}
            <div className="p-4 rounded-2xl bg-sand/40 border border-slate-200/80 space-y-1.5">
              <h4 className="font-bold text-charcoal flex items-center gap-1.5">
                <ShieldAlert className="w-4 h-4 text-amber-600" />
                <span>{isAr ? '2. كسر دورات الآفات ونيماتودا الجذور' : '2. Botanical Family & Pathogen Disruption'}</span>
              </h4>
              <p className="text-slate-600">
                {isAr
                  ? 'يتعاقب في هذه الدورة مزيج متباين من العائلات النباتية، مما يمنع توالي العائلة الواحدة ويقطع دورة حياة أمراض تعفن الجذور، والديدان الثعبانية (النيماتودا)، وبذور الحشائش المتخصصة.'
                  : 'Rotating disparate botanical families across consecutive seasons interrupts nematode propagation, starves host-specific fungal pathotypes, and depletes persistent weed seedbanks.'}
              </p>
            </div>

            {/* 3. Water Management */}
            <div className="p-4 rounded-2xl bg-sand/40 border border-slate-200/80 space-y-1.5">
              <h4 className="font-bold text-charcoal flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-sky-600" />
                <span>{isAr ? '3. إدارة المقنن المائي والري' : '3. Hydrological Water Management'}</span>
              </h4>
              <p className="text-slate-600">
                {isAr
                  ? `يبلغ الاستهلاك المائي التراكمي خلال عامين ${formatWater(selectedPlan.totalWaterDemandMm).formatted}، وهو مصمم ليتناسب مع وفرة مياه الري المتاحة (${irrigationDisplay})، مع دمج محاصيل وتدية تستخلص رطوبة الأعماق.`
                  : `Cumulative 2-year water requirement is ${formatWater(selectedPlan.totalWaterDemandMm).formatted}, tailored to your ${irrigationDisplay} profile while incorporating deep-rooting crops that mine subsoil moisture efficiently.`}
              </p>
            </div>

            {/* 4. Sequence Succession */}
            <div className="p-4 rounded-2xl bg-sand/40 border border-slate-200/80 space-y-1.5">
              <h4 className="font-bold text-charcoal flex items-center gap-1.5">
                <Sprout className="w-4 h-4 text-emerald-600" />
                <span>{isAr ? '4. التوافق والتعاقب بين المحاصيل' : '4. Crop Succession & Root Zone Stratification'}</span>
              </h4>
              <p className="text-slate-600">
                {isAr
                  ? 'يتبع كل محصول المحصول السابق وفقاً لقواعد التعاقب الزراعي العلمي؛ حيث تستفيد المحاصيل النجيلية من النيتروجين المتبقي بعد البقوليات، وتتعاقب الجذور العميقة مع السطحية لاستغلال شتى طبقات التربة.'
                  : 'Succession follows proven agronomic synergy: heavy feeders succeed biological fixers to capture mineralized nitrogen, and alternating root depths explore varying soil horizons.'}
              </p>
            </div>

            {/* 5. Atmospheric Relative Humidity */}
            <div className="p-4 rounded-2xl bg-sand/40 border border-slate-200/80 space-y-1.5">
              <h4 className="font-bold text-charcoal flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-forest-600" />
                <span>{isAr ? '5. الرطوبة الجوية والبيئة الدقيقة لأمراض الأوراق' : '5. Atmospheric Relative Humidity & Disease Microclimate'}</span>
              </h4>
              <p className="text-slate-600">
                {selectedPlan.humidityAssessment
                  ? (isAr ? selectedPlan.humidityAssessment.summaryAr : selectedPlan.humidityAssessment.summaryEn)
                  : (isAr ? 'لم تتوفر قياسات الرطوبة النسبية من محطة الرصد، وتم الحفاظ على تقييم محايد دون فرض جزاءات افتراضية.' : 'Relative humidity observations were not available from telemetry; scoring was held neutral without synthetic penalties.')}
              </p>
            </div>

            {/* 6. Irrigation Water Salinity (ECw) */}
            <div className="p-4 rounded-2xl bg-sand/40 border border-slate-200/80 space-y-1.5">
              <h4 className="font-bold text-charcoal flex items-center gap-1.5">
                <Droplet className="w-4 h-4 text-sky-600" />
                <span>{isAr ? '6. ملوحة مياه الري (ECw) وتوازن الغسيل الحقلي' : '6. Irrigation Water Salinity (ECw) & Leaching Hazard'}</span>
              </h4>
              <p className="text-slate-600">
                {selectedPlan.waterSalinityAssessment
                  ? (isAr ? selectedPlan.waterSalinityAssessment.summaryAr : selectedPlan.waterSalinityAssessment.summaryEn)
                  : (isAr ? 'لم يتم إدخال ملوحة مياه الري (ECw)، وتم الاعتماد على تحليل ملوحة التربة وحدها.' : 'Irrigation water salinity (ECw) was not provided; root-zone salinity was evaluated from soil baseline alone.')}
              </p>
            </div>

          </div>
        </div>

        {/* PART 4D: Final Plan Assessment & Multi-Criteria Scores */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-charcoal flex items-center gap-2">
              <Zap className="w-5 h-5 text-forest-600" />
              <span>{isAr ? 'مؤشرات التقييم العلمي للخطة' : 'Multi-Criteria Scientific Assessment Scores'}</span>
            </h3>
            <p className="text-xs text-slate-500">
              {isAr ? 'تقييم شامل من 100 نقطة لكل جانب زراعي وبيئي بناءً على بيانات الحقل المدخلة' : 'Quantitative performance indices across climate, water, soil health, and farmer priorities.'}
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-sand/50 border border-slate-200/80 text-center space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">{t('dimClimate')}</span>
              <span className="text-xl font-bold text-charcoal">{selectedPlan.scoreBreakdown.climateSuitability}</span>
              <span className="text-[10px] text-slate-500 block">/ 100</span>
            </div>

            <div className="p-3.5 rounded-xl bg-sand/50 border border-slate-200/80 text-center space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">{t('dimSoil')}</span>
              <span className="text-xl font-bold text-charcoal">{selectedPlan.scoreBreakdown.soilHealthIndex}</span>
              <span className="text-[10px] text-slate-500 block">/ 100</span>
            </div>

            <div className="p-3.5 rounded-xl bg-sand/50 border border-slate-200/80 text-center space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">{t('dimWater')}</span>
              <span className="text-xl font-bold text-charcoal">{selectedPlan.scoreBreakdown.waterAlignment}</span>
              <span className="text-[10px] text-slate-500 block">/ 100</span>
            </div>

            <div className="p-3.5 rounded-xl bg-sand/50 border border-slate-200/80 text-center space-y-1">
              <span className="text-[10px] text-slate-400 font-bold uppercase block">{t('dimSequence')}</span>
              <span className="text-xl font-bold text-charcoal">{selectedPlan.scoreBreakdown.sequenceHarmony}</span>
              <span className="text-[10px] text-slate-500 block">/ 100</span>
            </div>

            <div className="p-3.5 rounded-xl bg-forest-50 border border-forest-200 text-center space-y-1">
              <span className="text-[10px] text-forest-800 font-bold uppercase block">{t('dimPriority')}</span>
              <span className="text-xl font-bold text-forest-800">{selectedPlan.scoreBreakdown.priorityAlignment}</span>
              <span className="text-[10px] text-forest-600 block">/ 100</span>
            </div>
          </div>
        </div>

        {/* Advantages & Limitations Columns */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
          
          {/* Advantages */}
          <div className="bg-emerald-50/60 rounded-2xl p-6 border border-emerald-200/80 space-y-3">
            <h3 className="text-base font-bold text-emerald-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-700" />
              <span>{t('advantagesTitle')}</span>
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-emerald-950 font-normal">
              {(language === 'ar' ? selectedPlan.advantagesAr : selectedPlan.advantagesEn).map((adv, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-emerald-600 font-bold shrink-0 mt-0.5">✓</span>
                  <span className="leading-snug">{adv}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Limitations & Precautions */}
          <div className="bg-amber-50/60 rounded-2xl p-6 border border-amber-200/80 space-y-3">
            <h3 className="text-base font-bold text-amber-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700" />
              <span>{t('limitationsTitle')}</span>
            </h3>
            <ul className="space-y-2.5 text-xs sm:text-sm text-amber-950 font-normal">
              {(language === 'ar' ? selectedPlan.limitationsAr : selectedPlan.limitationsEn).map((lim, i) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-amber-600 font-bold shrink-0 mt-0.5">!</span>
                  <span className="leading-snug">{lim}</span>
                </li>
              ))}
            </ul>
          </div>

        </div>

        {/* Data Provenance & Uncertainties */}
        <div className="bg-sand/40 rounded-2xl p-6 border border-slate-200/80 space-y-3 text-xs">
          <h3 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-2">
            <Info className="w-4 h-4 text-slate-600" />
            <span>{t('provenanceTitle')}</span>
          </h3>
          <ul className="space-y-1.5 text-slate-600">
            {(language === 'ar' ? selectedPlan.dataSourcesAndUncertaintiesAr : selectedPlan.dataSourcesAndUncertaintiesEn).map((src, i) => (
              <li key={i}>• {src}</li>
            ))}
          </ul>
        </div>

      </div>

      {/* Side-by-Side Comparison Matrix Table */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-200/80 shadow-soft space-y-4 sm:space-y-6 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base sm:text-lg font-bold text-charcoal">
              {language === 'ar' ? 'مصفوفة المقارنة المباشرة بين الخطط الثلاث' : 'Side-by-Side Strategy Comparison Matrix'}
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              {language === 'ar' ? 'مقارنة معيارية شاملة لمؤشرات المياه والتربة والمناخ والمخاطر' : 'Objective side-by-side comparison of water demand, soil metrics, and climate resilience.'}
            </p>
          </div>
          <span className="text-[11px] font-semibold text-slate-400 sm:hidden">
            {isAr ? '← اسحب الجدول للمقارنة' : 'Swipe table to compare →'}
          </span>
        </div>

        <div className="w-full overflow-x-auto pb-2 scroll-smooth">
          <table className="w-full min-w-[520px] text-xs text-start border-collapse" dir={isAr ? 'rtl' : 'ltr'}>
          <thead>
            <tr className="border-b border-slate-200 bg-sand/60 text-charcoal font-bold">
              <th className="p-3.5">{language === 'ar' ? 'المعيار الزراعي' : 'Agronomic Criterion'}</th>
              {plans.map(p => (
                <th key={p.id} className="p-3.5 text-center">
                  {language === 'ar' ? p.titleAr.split(':')[0] : p.titleEn.split(':')[0]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            <tr>
              <td className="p-3.5 font-bold text-charcoal">{t('overallSuitability')}</td>
              {plans.map(p => (
                <td key={p.id} className="p-3.5 text-center font-bold text-sm text-forest-700">
                  {p.overallScore}/100
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-3.5 font-semibold text-slate-700">{t('twoYearWaterReq')}</td>
              {plans.map(p => (
                <td key={p.id} className="p-3.5 text-center font-bold text-charcoal">
                  {formatWater(p.totalWaterDemandMm).formatted}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-3.5 font-semibold text-slate-700">{t('netNitrogenBalance')}</td>
              {plans.map(p => {
                const nObj = formatNitrogen(p.netNitrogenBalanceKgHa);
                return (
                  <td key={p.id} className={`p-3.5 text-center font-bold ${
                    p.netNitrogenBalanceKgHa >= 0 ? 'text-emerald-700' : 'text-amber-700'
                  }`}>
                    {nObj.formatted}
                  </td>
                );
              })}
            </tr>
            <tr>
              <td className="p-3.5 font-semibold text-slate-700">{t('soilBenefitBadge')}</td>
              {plans.map(p => (
                <td key={p.id} className="p-3.5 text-center capitalize font-medium text-slate-700">
                  {TIER_NAMES[p.soilHealthBenefitTier] ? (isAr ? TIER_NAMES[p.soilHealthBenefitTier].ar : TIER_NAMES[p.soilHealthBenefitTier].en) : p.soilHealthBenefitTier}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-3.5 font-semibold text-slate-700">{t('climateResilienceBadge')}</td>
              {plans.map(p => (
                <td key={p.id} className="p-3.5 text-center capitalize font-medium text-slate-700">
                  {TIER_NAMES[p.climateResilienceRating] ? (isAr ? TIER_NAMES[p.climateResilienceRating].ar : TIER_NAMES[p.climateResilienceRating].en) : p.climateResilienceRating}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-3.5 font-semibold text-slate-700">{t('economicRiskBadge')}</td>
              {plans.map(p => (
                <td key={p.id} className="p-3.5 text-center capitalize font-medium text-slate-700">
                  {TIER_NAMES[p.economicRiskProfile] ? (isAr ? TIER_NAMES[p.economicRiskProfile].ar : TIER_NAMES[p.economicRiskProfile].en) : p.economicRiskProfile}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-3.5 font-semibold text-slate-700">{isAr ? 'مخاطر الرطوبة والأمراض' : 'Humidity Disease Risk'}</td>
              {plans.map(p => (
                <td key={p.id} className="p-3.5 text-center capitalize font-medium text-slate-700">
                  {p.humidityAssessment
                    ? (isAr ? (p.humidityAssessment.riskTier === 'high' ? 'مرتفع' : p.humidityAssessment.riskTier === 'moderate' ? 'معتدل' : 'منخفض') : p.humidityAssessment.riskTier)
                    : (isAr ? 'معتدل (محايد)' : 'Neutral (N/A)')}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-3.5 font-semibold text-slate-700">{isAr ? 'توافق ملوحة مياه الري (ECw)' : 'Water Salinity (ECw) Fit'}</td>
              {plans.map(p => (
                <td key={p.id} className="p-3.5 text-center capitalize font-medium text-slate-700">
                  {p.waterSalinityAssessment?.ecwProvided
                    ? (p.waterSalinityAssessment.restrictionTier === 'severe'
                        ? (isAr ? 'قيود شديدة' : 'Severe Risk')
                        : p.waterSalinityAssessment.restrictionTier === 'slight_to_moderate'
                        ? (isAr ? 'قيود طفيفة' : 'Slight-Mod')
                        : (isAr ? 'ملائمة تامة' : 'Optimal'))
                    : (isAr ? 'غير مدخلة (آمن)' : 'Not provided (Safe)')}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
        </div>
      </div>

      {/* Scientific Transparency & Disclaimer Banner */}
      <div className="p-5 sm:p-6 rounded-2xl sm:rounded-3xl bg-forest-950 text-slate-300 border border-forest-800 space-y-3">
        <div className="flex items-center gap-2 text-amber-400 font-bold text-sm">
          <ShieldAlert className="w-5 h-5 text-amber-400" />
          <span>{t('disclaimerTitle')}</span>
        </div>
        <p className="text-xs text-slate-300/80 leading-relaxed font-normal">
          {t('disclaimerText')}
        </p>
      </div>

      {/* Save Plan Modal */}
      {isSaveModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/60 backdrop-blur-sm animate-fade-in no-print overflow-y-auto">
          <div className="bg-white rounded-2xl sm:rounded-3xl max-w-lg w-full p-5 sm:p-8 shadow-soft-xl border border-slate-200/80 space-y-5 sm:space-y-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setIsSaveModalOpen(false)}
              className="absolute top-5 ltr:right-5 rtl:left-5 p-2 rounded-xl text-slate-400 hover:text-charcoal hover:bg-sand transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-forest-100 text-forest-800 flex items-center justify-center font-bold">
                <Bookmark className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-charcoal">
                  {isAr ? 'حفظ الخطة الزراعية' : 'Save Agricultural Plan'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isAr ? 'احفظ لقطة كاملة لهذه الخطة في حسابك الزراعي للرجوع إليها في أي وقت' : 'Save an immutable snapshot of this plan to your farmer account'}
                </p>
              </div>
            </div>

            {savedSuccess ? (
              <div className="p-6 rounded-2xl bg-forest-50 border border-forest-200 text-center space-y-2">
                <CheckCircle2 className="w-10 h-10 text-forest-600 mx-auto" />
                <h4 className="text-base font-bold text-forest-900">
                  {isAr ? 'تم حفظ الخطة بنجاح!' : 'Plan Saved Successfully!'}
                </h4>
                <p className="text-xs text-forest-700">
                  {isAr ? 'يمكنك الوصول إليها وإدارتها في قسم "خططي الزراعية".' : 'You can find and manage it in "My Agricultural Plans".'}
                </p>
              </div>
            ) : (
              <form onSubmit={handleConfirmSave} className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-charcoal mb-1">
                    {isAr ? 'اسم الخطة المخصص' : 'Custom Plan Name'} *
                  </label>
                  <input
                    type="text"
                    required
                    value={planCustomName}
                    onChange={e => setPlanCustomName(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-forest-500 font-medium text-charcoal"
                    placeholder={isAr ? 'مثال: خطة القمح والفول للحوض الشرقي' : 'e.g. Wheat & Faba Rotation - East Field'}
                  />
                </div>

                <div>
                  <label className="block font-bold text-charcoal mb-1">
                    {isAr ? 'ربط بحقل من مزارعك (اختياري)' : 'Assign to Saved Farm (Optional)'}
                  </label>
                  <select
                    value={selectedFarmId}
                    onChange={e => setSelectedFarmId(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-forest-500 font-medium text-charcoal bg-white"
                  >
                    <option value="">{isAr ? 'بدون ربط بحقل محدد (خطة عامة)' : 'No specific farm (Standalone plan)'}</option>
                    {userFarms.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.farmName} ({f.region || f.country}) - {f.farmArea} {f.areaUnit}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-charcoal mb-1">
                    {isAr ? 'ملاحظات زراعية خاصة (اختياري)' : 'Agronomic Notes (Optional)'}
                  </label>
                  <textarea
                    rows={3}
                    value={planNotes}
                    onChange={e => setPlanNotes(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-forest-500 font-medium text-charcoal resize-none"
                    placeholder={isAr ? 'مثال: تجربة التسميد الحيوي في الموسم الثاني ومراقبة ملوحة التربة' : 'e.g. Test bio-fertilizer in season 2 and monitor soil EC'}
                  />
                </div>

                <div className="pt-3 flex items-center justify-end gap-2.5">
                  <button
                    type="button"
                    onClick={() => setIsSaveModalOpen(false)}
                    className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-semibold hover:bg-sand transition-colors"
                  >
                    {isAr ? 'إلغاء' : 'Cancel'}
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-5 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-semibold transition-all shadow-soft flex items-center gap-2"
                  >
                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bookmark className="w-4 h-4" />}
                    <span>{isAr ? 'تأكيد الحفظ' : 'Save Plan'}</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

    </div>
  );
};
