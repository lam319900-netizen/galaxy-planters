import React, { useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useUnit } from '../context/UnitContext';
import { CROPS_LIST, CROP_NAMES_MAP } from '../data/crops';
import type { Crop } from '../types';
import { UnitSwitcher } from './UnitSwitcher';
import { AgriImage } from './AgriImage';
import { AGRI_HERO_IMAGES } from '../data/agriImages';
import { 
  Sprout, 
  Satellite, 
  Layers, 
  Droplet, 
  Sun, 
  ArrowRight, 
  BookOpen, 
  Sparkles, 
  ShieldCheck,
  Compass,
  Info,
  Globe2,
  RotateCw,
  Snowflake,
  CloudRain
} from 'lucide-react';

interface HomeViewProps {
  onStartAssessment: () => void;
  onExploreMethodology: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({ onStartAssessment, onExploreMethodology }) => {
  const { language, t } = useLanguage();
  const { formatNitrogen, formatWater } = useUnit();
  const [selectedCrop, setSelectedCrop] = useState<Crop | null>(CROPS_LIST[0]);
  const [climateFilter, setClimateFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [seasonFilter, setSeasonFilter] = useState<string>('all');

  const filteredCrops = CROPS_LIST.filter(crop => {
    if (climateFilter !== 'all' && !crop.climateZones.includes(climateFilter as any)) return false;
    if (seasonFilter !== 'all' && crop.season !== seasonFilter) return false;
    if (categoryFilter !== 'all') {
      if (categoryFilter === 'cereals' && !['wheat', 'sorghum', 'barley', 'rice', 'maize', 'oats', 'millet', 'sugarcane'].includes(crop.id)) return false;
      if (categoryFilter === 'legumes' && !['berseem', 'faba_bean', 'soybean', 'chickpea', 'groundnut', 'cowpea', 'lentil', 'common_bean', 'field_pea', 'lupin'].includes(crop.id)) return false;
      if (categoryFilter === 'oilseeds' && !['canola', 'sunflower', 'sesame', 'safflower', 'castor'].includes(crop.id)) return false;
      if (categoryFilter === 'fiber' && !['cotton', 'flax'].includes(crop.id)) return false;
      if (categoryFilter === 'vegetables' && !['onion', 'potato', 'tomato', 'pepper', 'sweet_potato'].includes(crop.id)) return false;
    }
    return true;
  });

  return (
    <div className="space-y-10 sm:space-y-16 py-3 sm:py-6 font-sans w-full max-w-full overflow-hidden">
      
      {/* Editorial Hero Section with Real Agriculture Photography Backdrop */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-forest-950 text-white shadow-soft-xl border border-forest-800/50">
        {/* Photographic Background with Editorial Scrim Overlay */}
        <div className="absolute inset-0 z-0">
          <img 
            src={AGRI_HERO_IMAGES.landscapeSunrise} 
            alt="Agricultural landscape at sunrise" 
            className="w-full h-full object-cover opacity-25 scale-105 transition-transform duration-1000 ease-out"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-950/95 via-forest-900/85 to-forest-950/75 mix-blend-multiply" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(143,174,145,0.15),transparent_65%)]" />
        </div>

        <div className="relative z-10 max-w-4xl p-5 sm:p-10 lg:p-16 space-y-5 sm:space-y-7">
          <div className="inline-flex items-center gap-2 px-3 py-1 sm:px-3.5 sm:py-1.5 rounded-full bg-forest-800/80 border border-forest-600/40 text-forest-200 text-[11px] sm:text-xs font-medium backdrop-blur-md">
            <Sparkles className="w-3.5 h-3.5 text-sage-400 shrink-0" />
            <span className="tracking-wide">{t('heroBadge')}</span>
          </div>

          <h1 className="text-2xl sm:text-4xl lg:text-6xl font-bold tracking-tight text-white leading-tight sm:leading-[1.15]">
            {t('heroTitle')}
          </h1>

          <p className="text-sm sm:text-base lg:text-lg text-slate-200/90 leading-relaxed max-w-2xl font-normal">
            {t('heroSubtitle')}
          </p>

          <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full sm:w-auto">
            <button
              onClick={onStartAssessment}
              className="inline-flex items-center justify-center gap-2.5 px-6 py-3.5 rounded-xl bg-forest-500 hover:bg-forest-400 text-white font-semibold text-sm sm:text-base shadow-soft hover:shadow-soft-lg transition-all active:scale-[0.98] group"
            >
              <span>{t('heroCtaStart')}</span>
              <ArrowRight className={`w-4 h-4 transition-transform group-hover:translate-x-1 ${language === 'ar' ? 'rotate-180 group-hover:-translate-x-1' : ''}`} />
            </button>

            <button
              onClick={onExploreMethodology}
              className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-sm sm:text-base border border-white/20 backdrop-blur-sm transition-all"
            >
              <BookOpen className="w-4 h-4 text-forest-300 shrink-0" />
              <span>{t('heroCtaMethodology')}</span>
            </button>
          </div>

          {/* Precision Metrics Strip */}
          <div className="pt-6 sm:pt-8 grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-6 border-t border-white/15">
            <div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
                {language === 'ar' ? 'تغطية عالمية' : 'Worldwide'}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-300/80 font-medium mt-0.5 sm:mt-1">
                {language === 'ar' ? 'تغطية زراعية لكافة قارات العالم' : 'Interactive Global Coordinates'}
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
                30 {language === 'ar' ? 'محصولاً' : 'Crops'}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-300/80 font-medium mt-0.5 sm:mt-1">
                {language === 'ar' ? 'قاعدة بيانات فاو وإيكاردا' : '5 Global Crop Categories'}
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
                4 {language === 'ar' ? 'مواسم' : 'Seasons'}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-300/80 font-medium mt-0.5 sm:mt-1">
                {language === 'ar' ? 'دورة تعاقب على مدار عامين' : '2-Year Succession Engine'}
              </div>
            </div>
            <div>
              <div className="text-xl sm:text-2xl lg:text-3xl font-bold text-white tracking-tight">
                NASA POWER
              </div>
              <div className="text-[10px] sm:text-xs text-slate-300/80 font-medium mt-0.5 sm:mt-1">
                {language === 'ar' ? 'أرصاد أقمار حية ودقيقة' : 'Live Satellite Telemetry'}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Global Agricultural Coverage & Agro-Ecological Biomes */}
      <section className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 lg:p-10 border border-slate-200/80 shadow-soft space-y-8 sm:space-y-10">
        
        {/* Section Header */}
        <div className="max-w-3xl space-y-3">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700 bg-forest-50 border border-forest-200/60 px-3 py-1 rounded-lg">
            <Globe2 className="w-3.5 h-3.5 text-forest-600" />
            <span>{language === 'ar' ? 'تغطية زراعية عالمية' : 'Worldwide Agricultural Coverage'}</span>
          </div>

          <h2 className="text-2xl sm:text-4xl font-bold text-charcoal tracking-tight">
            {t('globalCoverageTitle')}
          </h2>

          <p className="text-slate-600 text-sm sm:text-base leading-relaxed">
            {t('globalCoverageDesc')}
          </p>
        </div>

        {/* 4 Global Highlights */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-5 rounded-2xl bg-sand/60 border border-slate-200/80 hover:border-forest-300 hover:shadow-soft transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center transition-transform group-hover:scale-105">
              <Globe2 className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-charcoal">{t('highlightLocationTitle')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t('highlightLocationDesc')}</p>
          </div>

          <div className="p-5 rounded-2xl bg-sand/60 border border-slate-200/80 hover:border-forest-300 hover:shadow-soft transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center transition-transform group-hover:scale-105">
              <Satellite className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-charcoal">{t('highlightNasaTitle')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t('highlightNasaDesc')}</p>
          </div>

          <div className="p-5 rounded-2xl bg-sand/60 border border-slate-200/80 hover:border-forest-300 hover:shadow-soft transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center transition-transform group-hover:scale-105">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-charcoal">{t('highlightSoilTitle')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t('highlightSoilDesc')}</p>
          </div>

          <div className="p-5 rounded-2xl bg-sand/60 border border-slate-200/80 hover:border-forest-300 hover:shadow-soft transition-all space-y-3 group">
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center transition-transform group-hover:scale-105">
              <RotateCw className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-semibold text-charcoal">{t('highlightRotationTitle')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t('highlightRotationDesc')}</p>
          </div>
        </div>

        {/* Global Climate Regions Showcase */}
        <div className="pt-6 border-t border-slate-200/80 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
            <div className="space-y-1.5">
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                <Compass className="w-3.5 h-3.5 text-forest-600" />
                <span>{language === 'ar' ? 'الأقاليم المناخية العالمية' : 'Planetary Agro-Ecological Biomes'}</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-bold text-charcoal">
                {t('climateShowcaseTitle')}
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 max-w-2xl">
                {t('climateShowcaseSubtitle')}
              </p>
            </div>
          </div>

          {/* 4 Climate Region Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            
            {/* 1. Arid & Desert */}
            <div className="bg-sand/40 rounded-2xl p-5 border border-amber-200/70 hover:border-amber-400 hover:shadow-soft transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
                    <Sun className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-200">
                    BWh / BSh
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-charcoal">{t('regionAridTitle')}</h4>
                  <p className="text-[11px] text-amber-800 font-medium mt-0.5">{t('regionAridExamples')}</p>
                </div>
                <div className="space-y-2 pt-1">
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {language === 'ar' ? 'الظروف المناخية:' : 'Climate Conditions:'}
                    </div>
                    <p className="text-xs text-slate-700 leading-snug">{t('regionAridConditions')}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-forest-700 tracking-wider">
                      {language === 'ar' ? 'تحديات الدورة الزراعية:' : 'Rotation Challenges:'}
                    </div>
                    <p className="text-xs text-slate-700 leading-snug">{t('regionAridChallenges')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 2. Mediterranean */}
            <div className="bg-sand/40 rounded-2xl p-5 border border-sky-200/70 hover:border-sky-400 hover:shadow-soft transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
                    <Droplet className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-sky-100 text-sky-900 border border-sky-200">
                    Csa / Csb
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-charcoal">{t('regionMedTitle')}</h4>
                  <p className="text-[11px] text-sky-800 font-medium mt-0.5">{t('regionMedExamples')}</p>
                </div>
                <div className="space-y-2 pt-1">
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {language === 'ar' ? 'الظروف المناخية:' : 'Climate Conditions:'}
                    </div>
                    <p className="text-xs text-slate-700 leading-snug">{t('regionMedConditions')}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-forest-700 tracking-wider">
                      {language === 'ar' ? 'تحديات الدورة الزراعية:' : 'Rotation Challenges:'}
                    </div>
                    <p className="text-xs text-slate-700 leading-snug">{t('regionMedChallenges')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 3. Tropical & Humid */}
            <div className="bg-sand/40 rounded-2xl p-5 border border-emerald-200/70 hover:border-emerald-400 hover:shadow-soft transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
                    <CloudRain className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-200">
                    Af / Aw / As
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-charcoal">{t('regionTropTitle')}</h4>
                  <p className="text-[11px] text-emerald-800 font-medium mt-0.5">{t('regionTropExamples')}</p>
                </div>
                <div className="space-y-2 pt-1">
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {language === 'ar' ? 'الظروف المناخية:' : 'Climate Conditions:'}
                    </div>
                    <p className="text-xs text-slate-700 leading-snug">{t('regionTropConditions')}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-forest-700 tracking-wider">
                      {language === 'ar' ? 'تحديات الدورة الزراعية:' : 'Rotation Challenges:'}
                    </div>
                    <p className="text-xs text-slate-700 leading-snug">{t('regionTropChallenges')}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* 4. Temperate & Cold */}
            <div className="bg-sand/40 rounded-2xl p-5 border border-indigo-200/70 hover:border-indigo-400 hover:shadow-soft transition-all flex flex-col justify-between space-y-4">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-indigo-100 text-indigo-800 flex items-center justify-center">
                    <Snowflake className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-indigo-100 text-indigo-900 border border-indigo-200">
                    Cfb / Dfb
                  </span>
                </div>
                <div>
                  <h4 className="text-base font-bold text-charcoal">{t('regionTempTitle')}</h4>
                  <p className="text-[11px] text-indigo-800 font-medium mt-0.5">{t('regionTempExamples')}</p>
                </div>
                <div className="space-y-2 pt-1">
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-slate-400 tracking-wider">
                      {language === 'ar' ? 'الظروف المناخية:' : 'Climate Conditions:'}
                    </div>
                    <p className="text-xs text-slate-700 leading-snug">{t('regionTempConditions')}</p>
                  </div>
                  <div className="p-3 rounded-xl bg-white border border-slate-200/80 space-y-1">
                    <div className="text-[10px] uppercase font-bold text-forest-700 tracking-wider">
                      {language === 'ar' ? 'تحديات الدورة الزراعية:' : 'Rotation Challenges:'}
                    </div>
                    <p className="text-xs text-slate-700 leading-snug">{t('regionTempChallenges')}</p>
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Informational Callout Bar */}
          <div className="p-4 sm:p-5 rounded-2xl bg-forest-50/70 border border-forest-200/70 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-forest-700 text-white shrink-0 mt-0.5">
                <Info className="w-4 h-4" />
              </div>
              <p className="text-xs sm:text-sm text-forest-900 leading-relaxed">
                {language === 'ar'
                  ? 'توضح هذه النطاقات المناخية مرونة المحرك الزراعي لمنصة Galaxy Planters في تحليل مختلف النظم المحصولية. يمكنك بدء تقييم حقلك في أي إحداثيات جغرافية حول العالم بكل دقة وسهولة.'
                  : 'These global climate biomes illustrate Galaxy Planters’ adaptable decision-support engine. You can assess any field coordinates worldwide or select documented regional presets.'}
              </p>
            </div>
            <button
              onClick={onStartAssessment}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-medium text-xs shadow-soft transition-all active:scale-[0.98] shrink-0"
            >
              <span>{t('heroCtaStart')}</span>
              <ArrowRight className={`w-4 h-4 ${language === 'ar' ? 'rotate-180' : ''}`} />
            </button>
          </div>

        </div>

      </section>

      {/* 4 Scientific Pillars */}
      <section className="space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-2xl sm:text-3xl font-bold text-charcoal">
            {language === 'ar' ? 'الركائز الأربع لمنظومة Galaxy Planters' : 'The Four Pillars of Galaxy Planters'}
          </h2>
          <p className="text-sm text-slate-600">
            {language === 'ar' ? 'نهج علمي متكامل يجمع بين أرصاد الفضاء ومعادلات الزراعة الدولية المعتمدة' : 'A robust agricultural decision architecture grounded in open satellite data and peer-reviewed agronomy.'}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft hover:shadow-soft-lg hover:border-forest-300 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center">
              <Satellite className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-base text-charcoal">{t('pillar1Title')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t('pillar1Desc')}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft hover:shadow-soft-lg hover:border-forest-300 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
              <Layers className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-base text-charcoal">{t('pillar2Title')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t('pillar2Desc')}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft hover:shadow-soft-lg hover:border-forest-300 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
              <Sprout className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-base text-charcoal">{t('pillar3Title')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t('pillar3Desc')}</p>
          </div>

          <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft hover:shadow-soft-lg hover:border-forest-300 transition-all space-y-3">
            <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="font-semibold text-base text-charcoal">{t('pillar4Title')}</h3>
            <p className="text-xs text-slate-600 leading-relaxed">{t('pillar4Desc')}</p>
          </div>
        </div>
      </section>

      {/* Global Crop Database Explorer with Photography */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700 bg-forest-50 px-2.5 py-1 rounded-md">
              <BookOpen className="w-3.5 h-3.5 text-forest-600" />
              <span>{t('cropsShowcaseTitle')}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold text-charcoal mt-2">
              {t('cropsShowcaseSubtitle')}
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              {language === 'ar' ? 'بيانات معتمدة من منظمة الأغذية والزراعة (FAO 56)، ومراكز البحوث الزراعية الدولية والإقليمية (ICARDA, IRRI, ICRISAT, ARC).' : 'Documented agronomic characteristics from FAO Irrigation Paper No. 56 and international research institutes (ICARDA, IRRI, ICRISAT, ARC).'}
            </p>
          </div>

          {/* Unit Switcher */}
          <UnitSwitcher />
        </div>

        {/* Filter Controls: Category, Season, and Climate Biome */}
        <div className="space-y-4 pt-2">
          
          {/* 1. Category Filter */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            <span className="w-full sm:w-auto text-xs font-bold text-slate-500 uppercase block mb-1 sm:mb-0 sm:min-w-[130px]">
              {language === 'ar' ? 'التصنيف المحصولي:' : 'Crop Category:'}
            </span>
            {[
              { id: 'all', en: 'All Categories', ar: 'جميع التصنيفات' },
              { id: 'cereals', en: 'Cereals & Grains (8)', ar: 'الحبوب والنجيليات (8)' },
              { id: 'legumes', en: 'Legumes & Pulses (10)', ar: 'البقوليات المخصبة (10)' },
              { id: 'oilseeds', en: 'Oilseeds (5)', ar: 'المحاصيل الزيتية (5)' },
              { id: 'fiber', en: 'Fiber & Industrial (2)', ar: 'الألياف والصناعية (2)' },
              { id: 'vegetables', en: 'Vegetables & Roots (5)', ar: 'الخضار والدرنات (5)' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setCategoryFilter(tab.id);
                  const nextList = CROPS_LIST.filter(c => {
                    if (climateFilter !== 'all' && !c.climateZones.includes(climateFilter as any)) return false;
                    if (seasonFilter !== 'all' && c.season !== seasonFilter) return false;
                    if (tab.id === 'cereals' && !['wheat', 'sorghum', 'barley', 'rice', 'maize', 'oats', 'millet', 'sugarcane'].includes(c.id)) return false;
                    if (tab.id === 'legumes' && !['berseem', 'faba_bean', 'soybean', 'chickpea', 'groundnut', 'cowpea', 'lentil', 'common_bean', 'field_pea', 'lupin'].includes(c.id)) return false;
                    if (tab.id === 'oilseeds' && !['canola', 'sunflower', 'sesame', 'safflower', 'castor'].includes(c.id)) return false;
                    if (tab.id === 'fiber' && !['cotton', 'flax'].includes(c.id)) return false;
                    if (tab.id === 'vegetables' && !['onion', 'potato', 'tomato', 'pepper', 'sweet_potato'].includes(c.id)) return false;
                    return true;
                  });
                  if (nextList.length > 0 && (!selectedCrop || !nextList.find(c => c.id === selectedCrop.id))) {
                    setSelectedCrop(nextList[0]);
                  }
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  categoryFilter === tab.id
                    ? 'bg-forest-700 text-white shadow-soft ring-1 ring-forest-700'
                    : 'bg-sand hover:bg-slate-200/80 text-charcoal'
                }`}
              >
                {language === 'ar' ? tab.ar : tab.en}
              </button>
            ))}
          </div>

          {/* 2. Season Filter & Match Counter */}
          <div className="flex flex-wrap items-center justify-between gap-3 sm:gap-4 pt-1 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
              <span className="w-full sm:w-auto text-xs font-bold text-slate-500 uppercase block mb-1 sm:mb-0 sm:min-w-[130px]">
                {language === 'ar' ? 'الموسم الزراعي:' : 'Growing Season:'}
              </span>
              {[
                { id: 'all', en: 'All Seasons', ar: 'جميع المواسم' },
                { id: 'winter', en: 'Winter / Cool (15)', ar: 'شتوي ومعتدل (15)' },
                { id: 'summer', en: 'Summer / Warm (15)', ar: 'صيفي ودافئ (15)' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setSeasonFilter(tab.id);
                    const nextList = CROPS_LIST.filter(c => {
                      if (climateFilter !== 'all' && !c.climateZones.includes(climateFilter as any)) return false;
                      if (tab.id !== 'all' && c.season !== tab.id) return false;
                      if (categoryFilter === 'cereals' && !['wheat', 'sorghum', 'barley', 'rice', 'maize', 'oats', 'millet', 'sugarcane'].includes(c.id)) return false;
                      if (categoryFilter === 'legumes' && !['berseem', 'faba_bean', 'soybean', 'chickpea', 'groundnut', 'cowpea', 'lentil', 'common_bean', 'field_pea', 'lupin'].includes(c.id)) return false;
                      if (categoryFilter === 'oilseeds' && !['canola', 'sunflower', 'sesame', 'safflower', 'castor'].includes(c.id)) return false;
                      if (categoryFilter === 'fiber' && !['cotton', 'flax'].includes(c.id)) return false;
                      if (categoryFilter === 'vegetables' && !['onion', 'potato', 'tomato', 'pepper', 'sweet_potato'].includes(c.id)) return false;
                      return true;
                    });
                    if (nextList.length > 0 && (!selectedCrop || !nextList.find(c => c.id === selectedCrop.id))) {
                      setSelectedCrop(nextList[0]);
                    }
                  }}
                  className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                    seasonFilter === tab.id
                      ? 'bg-forest-800 text-white shadow-soft ring-1 ring-forest-800'
                      : 'bg-sand hover:bg-slate-200/80 text-charcoal'
                  }`}
                >
                  {language === 'ar' ? tab.ar : tab.en}
                </button>
              ))}
            </div>

            <div className="text-xs font-semibold text-slate-600 bg-sand px-3 py-1 rounded-full border border-slate-200/60">
              {language === 'ar' 
                ? `عرض ${filteredCrops.length} من أصل ${CROPS_LIST.length} محصولاً` 
                : `Showing ${filteredCrops.length} of ${CROPS_LIST.length} crops`}
            </div>
          </div>

          {/* 3. Climate Zone Filter */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 pt-1 border-t border-slate-100">
            <span className="w-full sm:w-auto text-xs font-bold text-slate-500 uppercase block mb-1 sm:mb-0 sm:min-w-[130px]">
              {language === 'ar' ? 'النطاق المناخي:' : 'Climate Biome:'}
            </span>
            {[
              { id: 'all', en: 'All 30 Crops', ar: 'جميع الـ 30 محصولاً' },
              { id: 'arid', en: 'Arid / Desert', ar: 'جاف وصحراوي' },
              { id: 'semi_arid', en: 'Semi-Arid', ar: 'شبه جاف' },
              { id: 'mediterranean', en: 'Mediterranean', ar: 'البحر المتوسط' },
              { id: 'temperate', en: 'Temperate / Cool', ar: 'معتدل وبارد' },
              { id: 'tropical', en: 'Tropical / Humid', ar: 'مداري ورطب' },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => {
                  setClimateFilter(tab.id);
                  const nextList = CROPS_LIST.filter(c => {
                    if (tab.id !== 'all' && !c.climateZones.includes(tab.id as any)) return false;
                    if (seasonFilter !== 'all' && c.season !== seasonFilter) return false;
                    if (categoryFilter === 'cereals' && !['wheat', 'sorghum', 'barley', 'rice', 'maize', 'oats', 'millet', 'sugarcane'].includes(c.id)) return false;
                    if (categoryFilter === 'legumes' && !['berseem', 'faba_bean', 'soybean', 'chickpea', 'groundnut', 'cowpea', 'lentil', 'common_bean', 'field_pea', 'lupin'].includes(c.id)) return false;
                    if (categoryFilter === 'oilseeds' && !['canola', 'sunflower', 'sesame', 'safflower', 'castor'].includes(c.id)) return false;
                    if (categoryFilter === 'fiber' && !['cotton', 'flax'].includes(c.id)) return false;
                    if (categoryFilter === 'vegetables' && !['onion', 'potato', 'tomato', 'pepper', 'sweet_potato'].includes(c.id)) return false;
                    return true;
                  });
                  if (nextList.length > 0 && (!selectedCrop || !nextList.find(c => c.id === selectedCrop.id))) {
                    setSelectedCrop(nextList[0]);
                  }
                }}
                className={`px-2.5 sm:px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                  climateFilter === tab.id
                    ? 'bg-amber-600 text-white shadow-soft ring-1 ring-amber-600'
                    : 'bg-sand hover:bg-slate-200/80 text-charcoal'
                }`}
              >
                {language === 'ar' ? tab.ar : tab.en}
              </button>
            ))}
          </div>

        </div>

        {/* Crops Visual Grid with Photographic Thumbnails */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-2.5 sm:gap-3">
          {filteredCrops.map((crop) => {
            const isSelected = selectedCrop?.id === crop.id;
            return (
              <button
                key={crop.id}
                onClick={() => setSelectedCrop(crop)}
                className={`group relative p-2.5 rounded-2xl border text-left transition-all overflow-hidden flex flex-col justify-between ${
                  isSelected
                    ? 'border-forest-600 bg-forest-50/80 shadow-soft ring-2 ring-forest-600/30'
                    : 'border-slate-200/80 hover:border-forest-300 bg-white hover:shadow-soft'
                }`}
              >
                {/* Crop Photo Thumbnail */}
                <div className="relative w-full h-24 rounded-xl overflow-hidden mb-2.5 bg-slate-100">
                  <AgriImage 
                    cropId={crop.id} 
                    alt={crop.nameEn} 
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                  <div className="absolute top-1.5 right-1.5">
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-md backdrop-blur-md shadow-xs ${
                      crop.season === 'winter' 
                        ? 'bg-sky-950/70 text-sky-200 border border-sky-400/30' 
                        : 'bg-amber-950/70 text-amber-200 border border-amber-400/30'
                    }`}>
                      {language === 'ar' ? (crop.season === 'winter' ? 'شتوي' : 'صيفي') : crop.season}
                    </span>
                  </div>
                </div>

                <div className="space-y-0.5">
                  <div className="text-xs font-bold text-charcoal truncate">
                    {language === 'ar' ? crop.nameAr : crop.nameEn}
                  </div>
                  <div className="text-[10px] text-slate-500 font-mono italic truncate">
                    {crop.scientificName}
                  </div>
                  <div className="mt-1.5 flex items-center gap-1 text-[10px] font-semibold text-forest-800">
                    <span>{formatWater(crop.waterRequirementMm).formatted}</span>
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Crop Detail Panel with High-Resolution Photography */}
        {selectedCrop && (
          <div className="bg-sand/40 rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-200/80 shadow-soft space-y-5 sm:space-y-6">
            
            {/* Header with Crop Banner */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 sm:gap-6 pb-5 sm:pb-6 border-b border-slate-200/80">
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="w-16 h-16 sm:w-24 sm:h-24 rounded-2xl overflow-hidden border border-slate-200 shadow-soft shrink-0">
                  <AgriImage 
                    cropId={selectedCrop.id} 
                    alt={selectedCrop.nameEn} 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="text-lg sm:text-2xl font-bold text-charcoal truncate">
                      {language === 'ar' ? selectedCrop.nameAr : selectedCrop.nameEn}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-slate-600 font-mono mt-0.5 truncate">
                    {selectedCrop.scientificName} • {language === 'ar' ? selectedCrop.familyAr : selectedCrop.family}
                  </p>
                  <p className="text-xs text-forest-700 font-medium mt-1 truncate">
                    {selectedCrop.climateZones.map(z => z.replace('_', ' ')).join(' • ')}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-forest-100 text-forest-900 text-xs font-semibold border border-forest-200/60">
                  {language === 'ar' ? (selectedCrop.season === 'winter' ? 'محصول شتوي' : 'محصول صيفي') : `${selectedCrop.season.toUpperCase()} CROP`}
                </span>
                <span className="px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl bg-sky-100 text-sky-900 text-xs font-semibold border border-sky-200/60">
                  {formatWater(selectedCrop.waterRequirementMm).formatted} / {language === 'ar' ? 'موسم' : 'season'}
                </span>
                <span className={`px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-xl text-xs font-semibold border ${
                  selectedCrop.nitrogenFixationKgPerHa > 0
                    ? 'bg-emerald-100 text-emerald-900 border-emerald-200/60'
                    : 'bg-amber-100 text-amber-900 border-amber-200/60'
                }`}>
                  {formatNitrogen(selectedCrop.nitrogenFixationKgPerHa).formatted} ({selectedCrop.nitrogenFixationKgPerHa > 0 ? (language === 'ar' ? 'تثبيت حيوي' : 'Fixes N') : (language === 'ar' ? 'استنزاف' : 'Depletes N')})
                </span>
              </div>
            </div>

            {/* 3 Scientific Specification Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              
              {/* 1. Climate & Heat */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft space-y-3">
                <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-2">
                  <Sun className="w-4 h-4 text-amber-500" />
                  {language === 'ar' ? 'المناخ والحرارة' : 'Climate & Heat Tolerance'}
                </h4>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">{language === 'ar' ? 'المدى الحراري الأمثل:' : 'Optimal Temp:'}</span>
                    <span className="font-semibold text-charcoal">{selectedCrop.optimalTempRangeC[0]}°C – {selectedCrop.optimalTempRangeC[1]}°C</span>
                  </li>
                  <li className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">{language === 'ar' ? 'أقصى حرارة يتحملها:' : 'Max Tolerated Temp:'}</span>
                    <span className="font-semibold text-charcoal">{selectedCrop.maxToleratedTempC}°C</span>
                  </li>
                  <li className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">{language === 'ar' ? 'تحمل الصقيع (أدنى حرارة):' : 'Frost Limit (Min Temp):'}</span>
                    <span className="font-semibold text-charcoal">{selectedCrop.minToleratedTempC}°C</span>
                  </li>
                  <li className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">{language === 'ar' ? 'الوحدات الحرارية (GDD):' : 'GDD Requirement:'}</span>
                    <span className="font-semibold text-charcoal">{selectedCrop.gddRequirement} °C·days</span>
                  </li>
                  <li className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">{language === 'ar' ? 'فترة النمو:' : 'Cycle:'}</span>
                    <span className="font-semibold text-charcoal">{selectedCrop.growingDays} days</span>
                  </li>
                  <li className="flex justify-between items-center py-1">
                    <span className="text-slate-500">{language === 'ar' ? 'الزراعة / الحصاد:' : 'Sow / Harvest:'}</span>
                    <span className="font-semibold text-charcoal">{language === 'ar' ? `${selectedCrop.plantingMonthAr} / ${selectedCrop.harvestMonthAr}` : `${selectedCrop.plantingMonthEn} / ${selectedCrop.harvestMonthEn}`}</span>
                  </li>
                </ul>
              </div>

              {/* 2. Soil Health & Quality */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft space-y-3">
                <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-2">
                  <Layers className="w-4 h-4 text-emerald-600" />
                  {language === 'ar' ? 'تأثيره على التربة' : 'Soil Health & Water Profile'}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {language === 'ar' ? selectedCrop.soilHealthRoleAr : selectedCrop.soilHealthRoleEn}
                </p>
                <div className="text-xs text-slate-600 space-y-2 pt-2 border-t border-slate-100">
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">{language === 'ar' ? 'ملوحة التربة (ECe):' : 'Soil Salinity (ECe):'}</span>
                    <span className="font-semibold text-charcoal">Up to {selectedCrop.salinityToleranceECe} dS/m</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">{language === 'ar' ? 'ملوحة مياه الري (ECw):' : 'Water Salinity (ECw):'}</span>
                    <span className="font-semibold text-charcoal">Up to {selectedCrop.salinityToleranceECw} dS/m</span>
                  </div>
                  <div className="flex justify-between items-center py-1 border-b border-slate-100">
                    <span className="text-slate-500">{language === 'ar' ? 'الرطوبة المثلى (RH):' : 'Optimal Humidity:'}</span>
                    <span className="font-semibold text-charcoal">{selectedCrop.optimalRhRange[0]}% – {selectedCrop.optimalRhRange[1]}%</span>
                  </div>
                  <div className="flex justify-between items-center py-1">
                    <span className="text-slate-500">{language === 'ar' ? 'التربة المناسبة:' : 'Optimal Soils:'}</span>
                    <span className="font-semibold text-charcoal break-words sm:truncate max-w-[200px]">{selectedCrop.toleratedSoilTypes.join(', ')}</span>
                  </div>
                </div>
              </div>

              {/* 3. Rotation Rules & Alerts */}
              <div className="p-5 rounded-2xl bg-white border border-slate-200/80 shadow-soft space-y-3">
                <h4 className="text-xs font-bold text-charcoal uppercase tracking-wider flex items-center gap-2">
                  <RotateCw className="w-4 h-4 text-forest-600" />
                  {language === 'ar' ? 'قواعد التدوير الزراعي' : 'Rotation Compatibility'}
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {language === 'ar' ? selectedCrop.rotationRulesAr.agronomicNotes : selectedCrop.rotationRulesEn.agronomicNotes}
                </p>
                <div className="text-xs text-slate-600 pt-2 border-t border-slate-100 space-y-2">
                  <div>
                    <span className="text-forest-700 font-semibold">{t('idealAfterLabel')}&nbsp;</span>
                    <span className="text-charcoal font-medium">
                      {selectedCrop.rotationRulesEn.idealPreceding.map(cropId => {
                        const info = CROP_NAMES_MAP[cropId];
                        return language === 'ar' ? (info?.ar || cropId) : (info?.en || cropId);
                      }).join(language === 'ar' ? '، ' : ', ')}
                    </span>
                  </div>
                  {selectedCrop.diseaseRiskFactorsEn && (
                    <div className="p-3 rounded-xl bg-amber-50/90 border border-amber-200/70 text-[11px] text-amber-900 leading-snug">
                      <strong className="font-bold">{language === 'ar' ? 'تنبيه الآفات والرطوبة: ' : 'Microclimate Alerts: '}</strong>
                      {language === 'ar' ? selectedCrop.diseaseRiskFactorsAr : selectedCrop.diseaseRiskFactorsEn}
                    </div>
                  )}
                </div>
              </div>

            </div>

            {/* Citations Footer */}
            <div className="pt-4 border-t border-slate-200/80 flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 gap-2">
              <span><strong>Agronomy Source:</strong> {selectedCrop.sources.agronomy}</span>
              <span><strong>Water Source:</strong> {selectedCrop.sources.waterReq}</span>
            </div>
          </div>
        )}
      </section>

      {/* Action CTA Banner */}
      <section className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-forest-900 text-white p-5 sm:p-10 lg:p-12 shadow-soft-xl border border-forest-800">
        <div className="absolute inset-0 z-0 opacity-20">
          <img 
            src={AGRI_HERO_IMAGES.centerPivotField} 
            alt="Irrigation field" 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2 max-w-xl">
            <h2 className="text-xl sm:text-2xl md:text-3xl font-bold tracking-tight text-white">
              {language === 'ar' ? 'جاهز لمقارنة خطط الدورة الزراعية لحقلك؟' : 'Ready to Evaluate Rotation Strategies for Your Farm?'}
            </h2>
            <p className="text-xs sm:text-sm text-forest-100/90 leading-relaxed font-normal">
              {language === 'ar' ? 'حدد موقع حقلك في أي مكان حول العالم واسترجع أرصاد ناسا اليومية لسطح الأرض لتوليد توصيات الدورة الزراعية فوراً.' : 'Pinpoint your farm coordinates anywhere in the world, fetch live NASA POWER Earth observations, and generate science-backed 2-year rotation sequences instantly.'}
            </p>
          </div>

          <button
            onClick={onStartAssessment}
            className="w-full md:w-auto px-6 sm:px-8 py-3.5 sm:py-4 rounded-xl bg-white text-forest-900 hover:bg-forest-50 font-bold text-sm sm:text-base shadow-soft hover:shadow-soft-lg transition-all active:scale-[0.98] text-center shrink-0"
          >
            {t('heroCtaStart')}
          </button>
        </div>
      </section>

    </div>
  );
};
