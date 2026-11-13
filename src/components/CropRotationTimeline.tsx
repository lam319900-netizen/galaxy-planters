import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { AgriImage } from './AgriImage';
import type { RotationPlanStep } from '../types';
import { 
  ArrowRight, 
  ArrowLeft, 
  ArrowDown, 
  Calendar, 
  Clock, 
  Wheat, 
  Leaf, 
  ShieldCheck, 
  Sparkles 
} from 'lucide-react';

interface CropRotationTimelineProps {
  steps: RotationPlanStep[];
  layout?: 'full' | 'compact' | 'scroll' | 'mini';
  className?: string;
  onStepClick?: (step: RotationPlanStep, index: number) => void;
  activeStepIndex?: number;
}

export const CropRotationTimeline: React.FC<CropRotationTimelineProps> = ({
  steps,
  layout = 'full',
  className = '',
  onStepClick,
  activeStepIndex
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  if (!steps || steps.length === 0) return null;

  // --------------------------------------------------------------------------
  // LAYOUT 1: MINI (Inline badges with arrows, used in dashboard & compact pills)
  // --------------------------------------------------------------------------
  if (layout === 'mini') {
    return (
      <div 
        className={`flex items-center gap-1.5 flex-wrap w-full max-w-full ${className}`}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {steps.map((step, idx) => {
          const crop = step.crop;
          const stageNumber = String(idx + 1).padStart(2, '0');
          const isLast = idx === steps.length - 1;

          return (
            <React.Fragment key={idx}>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-sand/70 border border-slate-200/80 text-[11px] font-semibold text-charcoal shadow-2xs shrink-0">
                <span className="font-mono text-[10px] text-forest-700 bg-forest-50 px-1 py-0.2 rounded font-bold">
                  {stageNumber}
                </span>
                {crop && (
                  <div className="w-4 h-4 rounded-full overflow-hidden shrink-0 border border-slate-200">
                    <AgriImage cropId={crop.id} alt="" className="w-full h-full object-cover" />
                  </div>
                )}
                <span>{crop ? (isAr ? crop.nameAr : crop.nameEn) : (isAr ? 'أرض بور' : 'Summer Fallow')}</span>
              </div>

              {!isLast && (
                <span className="text-forest-600/70 shrink-0 font-bold text-xs" aria-hidden="true">
                  {isAr ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                </span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // LAYOUT 2: COMPACT (Contained Vertical Timeline for Plan Comparison Cards)
  // Designed specifically to fit within a ~300px multi-column grid card.
  // 100% contained: NEVER expands or overflows into neighboring cards!
  // --------------------------------------------------------------------------
  if (layout === 'compact') {
    return (
      <div 
        className={`w-full max-w-full overflow-hidden space-y-1.5 ${className}`}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {steps.map((step, idx) => {
          const crop = step.crop;
          const stageNumber = String(idx + 1).padStart(2, '0');
          const isLast = idx === steps.length - 1;
          const timeline = step.timeline;

          return (
            <React.Fragment key={idx}>
              {/* Individual Stage Row Card */}
              <div 
                onClick={() => onStepClick?.(step, idx)}
                className={`w-full min-w-0 p-2 sm:p-2.5 rounded-xl bg-sand/35 hover:bg-white border border-slate-200/80 hover:border-forest-300 hover:shadow-2xs transition-all flex items-start gap-2.5 ${
                  onStepClick ? 'cursor-pointer' : ''
                }`}
              >
                {/* Stage Badge & Miniature Photo Thumbnail */}
                <div className="relative shrink-0 mt-0.5">
                  <div className="w-9 h-9 rounded-xl overflow-hidden border border-slate-200 shadow-2xs bg-white">
                    {crop ? (
                      <AgriImage cropId={crop.id} alt={crop.nameEn} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full bg-sand flex items-center justify-center text-slate-400">
                        <Leaf className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <span className="absolute -top-1.5 -start-1.5 bg-forest-800 text-white font-mono font-bold text-[9px] px-1 py-0.2 rounded-full shadow-2xs border border-white">
                    {stageNumber}
                  </span>
                </div>

                {/* Crop Name, Season Pill & Calibrated Sowing Window */}
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-1.5">
                    <h5 className="text-xs font-bold text-charcoal break-words whitespace-normal leading-snug">
                      {crop ? (isAr ? crop.nameAr : crop.nameEn) : (isAr ? 'أرض بور (مراحة)' : 'Summer Fallow')}
                    </h5>
                    <span className="text-[10px] font-semibold text-forest-800 bg-forest-50 px-1.5 py-0.5 rounded border border-forest-200/70 shrink-0 mt-0.5">
                      {isAr ? step.seasonLabelAr : step.seasonLabelEn}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-1.5 mt-1 text-[10px] text-slate-500 font-medium flex-wrap">
                    <span className="break-words whitespace-normal">
                      {timeline 
                        ? (isAr ? timeline.plantingWindowAr : timeline.plantingWindowEn) 
                        : (isAr ? 'ميعاد معاير' : 'Calibrated window')}
                    </span>
                    <span className="text-[9px] text-slate-400 font-mono shrink-0">
                      {isAr ? `المرحلة ${stageNumber}` : `Stage ${stageNumber}`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Clean Downward Directional Connector Arrow */}
              {!isLast && (
                <div className="flex items-center justify-center -my-0.5 py-0.5">
                  <div className="w-4 h-4 rounded-full bg-forest-50 border border-forest-200/90 flex items-center justify-center text-forest-700 shadow-2xs">
                    <ArrowDown className="w-2.5 h-2.5 text-forest-700" />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // LAYOUT 3: SCROLL (Contained Horizontal Scroll Track with Snapping)
  // Strictly bounded with overflow-x-auto so it never overflows into neighbors!
  // --------------------------------------------------------------------------
  if (layout === 'scroll') {
    return (
      <div 
        className={`w-full max-w-full overflow-hidden ${className}`}
        dir={isAr ? 'rtl' : 'ltr'}
      >
        <div className="w-full overflow-x-auto pb-2 flex items-stretch gap-2 scroll-smooth">
          {steps.map((step, idx) => {
            const crop = step.crop;
            const stageNumber = String(idx + 1).padStart(2, '0');
            const isLast = idx === steps.length - 1;
            const timeline = step.timeline;

            return (
              <React.Fragment key={idx}>
                <div 
                  onClick={() => onStepClick?.(step, idx)}
                  className={`min-w-[140px] max-w-[160px] shrink-0 p-2.5 rounded-2xl bg-white border border-slate-200/90 shadow-2xs hover:border-forest-400 transition-all flex flex-col justify-between space-y-2 ${
                    onStepClick ? 'cursor-pointer' : ''
                  }`}
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className="bg-forest-800 text-white font-mono font-bold text-[9px] px-1.5 py-0.5 rounded-full">
                      #{stageNumber}
                    </span>
                    <span className="text-[9px] font-semibold text-forest-800 bg-forest-50 px-1 py-0.5 rounded truncate">
                      {isAr ? step.seasonLabelAr : step.seasonLabelEn}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl overflow-hidden border border-slate-200 shrink-0">
                      {crop ? (
                        <AgriImage cropId={crop.id} alt={crop.nameEn} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-sand flex items-center justify-center text-slate-400">
                          <Leaf className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h5 className="text-xs font-bold text-charcoal break-words whitespace-normal leading-tight">
                        {crop ? (isAr ? crop.nameAr : crop.nameEn) : (isAr ? 'أرض بور' : 'Summer Fallow')}
                      </h5>
                    </div>
                  </div>

                  <p className="text-[10px] text-slate-500 font-medium break-words whitespace-normal pt-1 border-t border-slate-100">
                    {timeline ? (isAr ? timeline.plantingWindowAr : timeline.plantingWindowEn) : ''}
                  </p>
                </div>

                {!isLast && (
                  <div className="flex items-center justify-center shrink-0 px-0.5">
                    <div className="w-5 h-5 rounded-full bg-forest-50 border border-forest-200 flex items-center justify-center text-forest-700 shadow-2xs">
                      {isAr ? <ArrowLeft className="w-3 h-3" /> : <ArrowRight className="w-3 h-3" />}
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    );
  }

  // --------------------------------------------------------------------------
  // LAYOUT 4: FULL (Comprehensive Sequence Display for Detailed Plan Overview)
  // Bounded with w-full max-w-full overflow-hidden.
  // Responsive: Full horizontal row on xl (1280px+), smooth contained horizontal
  // scroll track with snapping on tablets/mobile so it NEVER overflows the page!
  // --------------------------------------------------------------------------
  return (
    <div 
      className={`w-full max-w-full overflow-hidden space-y-4 ${className}`}
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-slate-200/80">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-forest-700 text-white flex items-center justify-center shadow-soft shrink-0">
            <Sparkles className="w-4 h-4 text-emerald-300" />
          </div>
          <div>
            <h4 className="text-base sm:text-lg font-bold text-charcoal">
              {isAr ? 'مخطط تتابع وتعاقب المواسم الزراعية الأربعة' : '4-Season Crop Succession & Rotation Sequence'}
            </h4>
            <p className="text-xs text-slate-500">
              {isAr 
                ? 'تعاقب زمني مدروس علمياً من المرحلة 01 إلى 04 لتعظيم خصوبة التربة وتثبيت النيتروجين وكسر دورات الآفات'
                : 'Science-calibrated chronological succession from Stage 01 to 04 for soil fertility, nitrogen fixation, and pest breaks'}
            </p>
          </div>
        </div>

        <span className="self-start sm:self-center text-[11px] font-semibold text-forest-800 bg-forest-50 border border-forest-200 px-3 py-1 rounded-full shrink-0">
          {isAr ? 'دورة متكاملة على مدار عامين' : '2-Year Balanced Succession'}
        </span>
      </div>

      {/* Main Contained Timeline Track: Bounded with overflow-x-auto for narrow screens */}
      <div className="w-full max-w-full overflow-x-auto pb-3 pt-1 scroll-smooth">
        <div className="flex items-stretch gap-3 lg:gap-4 min-w-full w-max xl:w-full">
          {steps.map((step, idx) => {
            const crop = step.crop;
            const stageNumber = String(idx + 1).padStart(2, '0');
            const isLast = idx === steps.length - 1;
            const timeline = step.timeline;
            const variety = step.varietyRecommendation;
            const isActive = activeStepIndex === idx;

            return (
              <React.Fragment key={idx}>
                {/* Individual Stage Card */}
                <div 
                  onClick={() => onStepClick?.(step, idx)}
                  className={`min-w-[240px] sm:min-w-[260px] xl:min-w-0 xl:flex-1 rounded-3xl p-5 sm:p-6 bg-white border transition-all duration-300 flex flex-col justify-between space-y-4 relative overflow-hidden group shadow-soft ${
                    isActive
                      ? 'border-forest-600 shadow-soft-lg ring-2 ring-forest-600/30'
                      : 'border-slate-200/90 hover:shadow-soft-lg hover:border-forest-400'
                  } ${onStepClick ? 'cursor-pointer' : ''}`}
                >
                  {/* Stage Number & Season Pill Header */}
                  <div className="flex items-center justify-between gap-2">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-800 text-white font-mono font-bold text-xs shadow-2xs">
                      <span className="text-emerald-300">#</span>
                      <span>{stageNumber}</span>
                    </div>

                    <span className="px-2.5 py-0.5 rounded-md bg-forest-50 text-forest-800 font-semibold text-[11px] border border-forest-200/70 truncate">
                      {isAr ? step.seasonLabelAr : step.seasonLabelEn}
                    </span>
                  </div>

                  {/* Crop Photography & Identity */}
                  <div className="flex items-center gap-3.5">
                    <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden border border-slate-200 shadow-soft shrink-0 group-hover:scale-105 transition-transform duration-300">
                      {crop ? (
                        <AgriImage cropId={crop.id} alt={crop.nameEn} className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full bg-sand flex items-center justify-center text-slate-400">
                          <Leaf className="w-6 h-6" />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1 space-y-1">
                      <h4 className="text-base sm:text-lg font-bold text-charcoal truncate">
                        {crop ? (isAr ? crop.nameAr : crop.nameEn) : (isAr ? 'أرض بور (مراحة)' : 'Summer Fallow')}
                      </h4>
                      <p className="text-xs font-mono text-slate-500 italic truncate">
                        {crop ? crop.scientificName : 'Resting Period'}
                      </p>
                      <span className="inline-block text-[11px] font-medium text-forest-700 bg-forest-50/60 px-2 py-0.5 rounded border border-forest-100">
                        {crop ? (isAr ? crop.familyAr : crop.family) : (isAr ? 'تشميس التربة' : 'Solarization')}
                      </span>
                    </div>
                  </div>

                  {/* Planting and Harvesting Period Calendar */}
                  <div className="p-3.5 rounded-2xl bg-sand/40 border border-slate-200/80 space-y-2 text-xs">
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-medium">
                      <span className="flex items-center gap-1 font-bold text-forest-900 uppercase tracking-wider text-[10px]">
                        <Calendar className="w-3.5 h-3.5 text-forest-600" />
                        <span>{isAr ? 'المواعيد الزراعية:' : 'Agricultural Dates:'}</span>
                      </span>
                      <span className="flex items-center gap-1 text-slate-400">
                        <Clock className="w-3 h-3" />
                        <span>{timeline ? (isAr ? timeline.durationRangeAr : timeline.durationRangeEn) : ''}</span>
                      </span>
                    </div>

                    <div className="space-y-1 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 text-[11px]">{isAr ? 'الزراعة:' : 'Planting:'}</span>
                        <strong className="text-charcoal font-bold truncate">
                          {timeline ? (isAr ? timeline.plantingWindowAr : timeline.plantingWindowEn) : (isAr ? 'معاير' : 'Calibrated')}
                        </strong>
                      </div>
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-slate-500 text-[11px]">{isAr ? 'الحصاد:' : 'Harvesting:'}</span>
                        <strong className="text-amber-900 font-bold truncate">
                          {timeline ? (isAr ? timeline.harvestWindowAr : timeline.harvestWindowEn) : (isAr ? 'معاير' : 'Calibrated')}
                        </strong>
                      </div>
                    </div>
                  </div>

                  {/* Verified Seed Variety Badge (if present) */}
                  {variety && (
                    <div className="p-2.5 rounded-xl bg-emerald-50/80 border border-emerald-200/70 flex items-center gap-2 text-xs">
                      <div className="w-6 h-6 rounded-lg bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-2xs">
                        <Wheat className="w-3.5 h-3.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <span className="text-[10px] font-bold text-emerald-800 uppercase block tracking-wider">
                          {isAr ? 'الصنف المعتمد رسمياً:' : 'Verified Cultivar:'}
                        </span>
                        <span className="font-bold text-emerald-950 text-xs truncate block">
                          {isAr ? variety.varietyNameAr : variety.varietyName}
                        </span>
                      </div>
                    </div>
                  )}

                  {/* Agronomic Function Tag */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                    <span className="flex items-center gap-1 text-forest-700 font-semibold truncate">
                      <ShieldCheck className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                      <span className="truncate">{crop?.nitrogenFixationKgPerHa && crop.nitrogenFixationKgPerHa > 0 ? (isAr ? 'تثبيت النيتروجين' : 'Nitrogen Fixer') : (isAr ? 'كسر دورة الآفات' : 'Pathogen Break')}</span>
                    </span>
                    <span className="font-mono text-slate-400 text-[10px] shrink-0">
                      {isAr ? `الموسم ${idx + 1} من 4` : `Season ${idx + 1} of 4`}
                    </span>
                  </div>
                </div>

                {/* Clean Directional Connector Arrow between stages */}
                {!isLast && (
                  <div className="flex flex-col items-center justify-center shrink-0 self-center z-10 px-0.5">
                    <div className="w-8 h-8 rounded-full bg-white border-2 border-forest-600 text-forest-800 flex items-center justify-center shadow-soft">
                      {isAr ? (
                        <ArrowLeft className="w-4 h-4 text-forest-800 stroke-[2.5]" />
                      ) : (
                        <ArrowRight className="w-4 h-4 text-forest-800 stroke-[2.5]" />
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-forest-700 tracking-wider mt-1 uppercase">
                      {isAr ? 'ثم' : 'Then'}
                    </span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
};
