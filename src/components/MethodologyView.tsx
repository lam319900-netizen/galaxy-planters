import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { 
  BookOpen, 
  Satellite, 
  Layers, 
  Droplet, 
  Calculator, 
  ShieldAlert
} from 'lucide-react';

export const MethodologyView: React.FC = () => {
  const { language, t } = useLanguage();

  return (
    <div className="max-w-5xl mx-auto py-6 space-y-10 font-sans">
      
      {/* Header */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft space-y-2">
        <div className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-forest-700 bg-forest-50 px-2.5 py-1 rounded-md">
          <BookOpen className="w-3.5 h-3.5 text-forest-600" />
          <span>{language === 'ar' ? 'التوثيق العلمي والمنهجية' : 'Scientific Transparency & Methodology'}</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-charcoal">
          {t('methTitle')}
        </h1>
        <p className="text-sm text-slate-600 max-w-3xl leading-relaxed font-normal">
          {t('methSubtitle')}
        </p>
      </div>

      {/* 1. NASA POWER API Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center">
            <Satellite className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-charcoal">{t('nasaSectionTitle')}</h2>
            <p className="text-xs text-slate-500">NASA Prediction Of Worldwide Energy Resources (POWER) • Daily Point AG API</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
          {t('nasaSectionBody')}
        </p>

        <div className="bg-forest-950 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto space-y-2 border border-forest-800">
          <div className="text-slate-400">// API Endpoint & Queried Parameters for Sohag, Egypt</div>
          <div className="text-emerald-400">
            https://power.larc.nasa.gov/api/temporal/daily/point?parameters=T2M,T2M_MAX,T2M_MIN,PRECTOTCORR,RH2M,ALLSKY_SFC_SW_DWN&community=AG&longitude=31.70&latitude=26.55&start=20240101&end=20241231&format=JSON
          </div>
          <div className="text-slate-400 pt-2">// Null Value Filter Routine:</div>
          <div className="text-sky-300">
            daily_valid_values = [v for v in parameter['T2M'].values() if v &gt; -900]
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 text-xs">
          <div className="p-4 rounded-xl bg-sand/60 border border-slate-200/80 space-y-1">
            <span className="font-bold text-charcoal block">{language === 'ar' ? 'التعامل مع القيم المفقودة' : 'Missing Value Handling'}</span>
            <p className="text-slate-600 leading-relaxed font-normal">
              {language === 'ar' 
                ? 'يستخدم مرصد ناسا القيمة -999 أو -900 لتمثيل الأيام التي تعذر فيها الرصد القمري. يقوم Galaxy Planters بتصفية هذه القيم تلقائياً وحساب المتوسطات بناءً على الأيام المكتملة فقط.'
                : 'NASA POWER uses -900 or -999 for cloud-obscured or unobserved days. Galaxy Planters filters these out and normalizes averages only across valid observation days.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-sand/60 border border-slate-200/80 space-y-1">
            <span className="font-bold text-charcoal block">{language === 'ar' ? 'الشفافية في وضع العرض التجريبي' : 'Demo Mode Provenance'}</span>
            <p className="text-slate-600 leading-relaxed font-normal">
              {language === 'ar'
                ? 'إذا تعطل الاتصال بالإنترنت بسيرفرات ناسا، يُفعل التطبيق وضع العرض التجريبي مع إظهار شارة تنبيه واضحة تفيد بأن البيانات تاريخية معتمدة وليست استدعاء حياً فورياً.'
                : 'If network connectivity fails, Galaxy Planters switches to Demo Mode with explicit visual badges. The application never silently substitutes synthetic data for real API observations.'}
            </p>
          </div>
        </div>
      </div>

      {/* 2. Soil Data Sources */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-charcoal">{t('soilSectionTitle')}</h2>
            <p className="text-xs text-slate-500">ISRIC SoilGrids 250m & Egyptian Soil & Water Research Institute (SWRI)</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
          {t('soilSectionBody')}
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-4 rounded-xl bg-sand/60 border border-slate-200/80 space-y-1.5">
            <span className="font-bold text-charcoal block">{language === 'ar' ? 'أراضي وادي النيل القديمة' : 'Nile Valley Alluvial Soils'}</span>
            <span className="text-[11px] text-slate-500 block font-mono">Fluvisols & Vertisols</span>
            <p className="text-slate-600 font-normal leading-relaxed">
              {language === 'ar' ? 'طميية ثقيلة ذات خصوبة عالية وقدرة احتفاظ بالماء مرتفعة، لكنها تعاني من قلة التهوية عند الإفراط في الري السطحي.' : 'Heavy clay loam with high cation exchange capacity (CEC > 35 cmol+/kg) and water holding capacity.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-sand/60 border border-slate-200/80 space-y-1.5">
            <span className="font-bold text-charcoal block">{language === 'ar' ? 'أراضي الظهير الصحراوي' : 'Desert Margin Arenosols'}</span>
            <span className="text-[11px] text-slate-500 block font-mono">Juhayna & Dar El Salam</span>
            <p className="text-slate-600 font-normal leading-relaxed">
              {language === 'ar' ? 'أراضٍ رملية طميية سريعة الصرف، منخفضة المادة العضوية (<0.5%)، تتطلب رياً موضعياً وإضافة مستمرة للسماد العضوي.' : 'Coarse textured sandy loam requiring micro-irrigation (drip) and frequent organic matter replenishment.'}
            </p>
          </div>

          <div className="p-4 rounded-xl bg-sand/60 border border-slate-200/80 space-y-1.5">
            <span className="font-bold text-charcoal block">{language === 'ar' ? 'الهضبة الكلسية بسوهاج الجديدة' : 'Calcic Plateau (New Sohag)'}</span>
            <span className="text-[11px] text-slate-500 block font-mono">Calcisols (CaCO3 &gt; 15%)</span>
            <p className="text-slate-600 font-normal leading-relaxed">
              {language === 'ar' ? 'تحتوي على نسبة عالية من كربونات الكالسيوم التي تثبت الفوسفور وتتطلب محاصيل بقولية مخصبة ذات جذور حامضية.' : 'Calcareous soils with high calcium carbonate levels that fix phosphorus and benefit from deep-rooting legumes.'}
            </p>
          </div>
        </div>
      </div>

      {/* 3. Crop Evapotranspiration & Agronomic Constants */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center">
            <Droplet className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-charcoal">{t('cropSectionTitle')}</h2>
            <p className="text-xs text-slate-500">FAO-56 Penman-Monteith & Shandaweel Agricultural Research Station</p>
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
          {t('cropSectionBody')}
        </p>

        <div className="bg-sand/60 rounded-2xl p-4 border border-slate-200/80 text-xs space-y-2">
          <div className="font-bold text-charcoal">
            {language === 'ar' ? 'معادلة حساب البخر-نتح المحصولي (Crop ETc):' : 'Crop Evapotranspiration Formula:'}
          </div>
          <div className="p-2.5 rounded-lg bg-white border border-slate-200 font-mono text-xs text-forest-800 font-bold">
            ETc = ETo × Kc
          </div>
          <p className="text-slate-600 leading-relaxed text-[11px] font-normal">
            {language === 'ar'
              ? 'حيث ETo هو البخر-نتح المرجعي المحسوب يومياً من إشعاع وحرارة ناسا POWER، وKc هو معامل نمو المحصول في صعيد مصر وفق أبحاث محطة شندويل الزراعية بسوهاج.'
              : 'Where ETo is reference evapotranspiration calculated from NASA POWER daily solar irradiance and temperature, and Kc is the single crop coefficient calibrated for Upper Egypt conditions.'}
          </p>
        </div>
      </div>

      {/* 4. Scoring Mathematical Model */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-soft space-y-4">
        <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-charcoal">{t('scoringSectionTitle')}</h2>
            <p className="text-xs text-slate-500">Transparent Rule-Based Multi-Criteria Decision Analysis (MCDA)</p>
          </div>
        </div>

        <div className="bg-forest-950 text-slate-200 p-4 rounded-2xl font-mono text-xs overflow-x-auto space-y-2 border border-forest-800">
          <div className="text-emerald-400 font-bold">{t('scoringSectionFormula')}</div>
          <div className="text-slate-400 pt-1">// Default Weights Distribution:</div>
          <div className="text-sky-300">
            W_water = 0.25 | W_soil = 0.20 | W_climate = 0.20 | W_sequence = 0.15 | W_priority = 0.20
          </div>
        </div>

        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
          {t('scoringWeightsExplained')}
        </p>
      </div>

      {/* 5. Scientific Disclaimer */}
      <div className="bg-forest-950 text-slate-300 rounded-3xl p-6 sm:p-8 border border-forest-800 space-y-4 shadow-soft-xl">
        <div className="flex items-center gap-3 text-amber-400 font-bold text-base">
          <ShieldAlert className="w-6 h-6 text-amber-400 shrink-0" />
          <span>{t('disclaimerTitle')}</span>
        </div>
        <p className="text-xs sm:text-sm text-slate-300/80 leading-relaxed font-normal">
          {t('disclaimerText')}
        </p>
      </div>

    </div>
  );
};
