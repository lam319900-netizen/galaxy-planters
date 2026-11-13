import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { dbService, type FarmerStats } from '../services/database';
import type { NavigationTab, SavedPlanRecord, ActivityHistoryRecord } from '../types/platform';
import { CropRotationTimeline } from './CropRotationTimeline';
import { AGRI_HERO_IMAGES } from '../data/agriImages';
import { 
  Sprout, 
  MapPin, 
  FileText, 
  History, 
  User, 
  PlusCircle, 
  ArrowRight, 
  ArrowLeft,
  Calendar, 
  CheckCircle, 
  TrendingUp, 
  Compass, 
  ExternalLink,
  Layers,
  Sparkles,
  Bot
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: NavigationTab) => void;
  onOpenSavedPlan: (plan: SavedPlanRecord) => void;
  onAskAboutPlan?: (plan: SavedPlanRecord) => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate, onOpenSavedPlan, onAskAboutPlan }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [stats, setStats] = useState<FarmerStats | null>(null);
  const [recentActivities, setRecentActivities] = useState<ActivityHistoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    Promise.all([
      dbService.getFarmerStats(user.id),
      dbService.getActivityHistory(user.id, { limit: 5 })
    ])
      .then(([farmerStats, activities]) => {
        if (isMounted) {
          setStats(farmerStats);
          setRecentActivities(activities);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('[DashboardView] Failed loading stats', err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [user]);

  if (!user) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-600">
          {isAr ? 'يرجى تسجيل الدخول للوصول إلى لوحة التحكم.' : 'Please sign in to access your dashboard.'}
        </p>
      </div>
    );
  }

  return (
    <div className="py-3 sm:py-6 space-y-6 sm:space-y-8 animate-fade-in font-sans w-full max-w-full overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Welcome Banner with Agricultural Scrim */}
      <div className="relative overflow-hidden rounded-2xl sm:rounded-3xl bg-forest-950 text-white p-5 sm:p-9 shadow-soft-xl border border-forest-800/60">
        <div className="absolute inset-0 z-0">
          <img 
            src={AGRI_HERO_IMAGES.centerPivotField} 
            alt="Field" 
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-forest-950 via-forest-900/90 to-forest-950/80" />
        </div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-5 sm:gap-6">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-forest-800/80 text-[11px] sm:text-xs font-semibold backdrop-blur-md text-forest-200 border border-forest-600/40">
              <Sparkles className="w-3.5 h-3.5 text-sage-400 shrink-0" />
              <span>{isAr ? 'منصة المزارع المخصصة' : 'Personalized Farmer Workspace'}</span>
            </div>
            <h1 className="text-xl sm:text-3xl font-bold tracking-tight text-white">
              {isAr ? `مرحباً بك، ${user.fullName}` : `Welcome back, ${user.fullName}`}
            </h1>
            <p className="text-slate-200/90 text-xs sm:text-sm max-w-xl font-normal leading-relaxed">
              {isAr 
                ? `مزرعتك في ${user.city}، ${user.country}. تابع خطط تعاقب المحاصيل المحفوظة، وتعرف على التقاوي المثلى لأرضك.`
                : `Managing farms in ${user.city}, ${user.country}. Review saved rotations, track seasonal yields, and manage verified seed varieties.`}
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={() => onNavigate('assessment')}
              className="px-5 py-2.5 rounded-xl bg-forest-500 hover:bg-forest-400 text-white font-semibold text-xs sm:text-sm shadow-soft hover:shadow-soft-lg transition-all active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <PlusCircle className="w-4 h-4 text-white shrink-0" />
              <span>{isAr ? 'بدء تقييم جديد' : 'New Assessment'}</span>
            </button>
            <button
              onClick={() => onNavigate('assistant')}
              className="px-4 py-2.5 rounded-xl bg-forest-800/90 hover:bg-forest-700/90 text-emerald-200 font-semibold text-xs sm:text-sm border border-emerald-400/40 backdrop-blur-md transition-all flex items-center justify-center gap-2"
            >
              <Bot className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>{isAr ? 'المساعد الزراعي الذكي' : 'AI Assistant'}</span>
            </button>
            <button
              onClick={() => onNavigate('plans')}
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/15 text-white font-medium text-xs sm:text-sm border border-white/20 backdrop-blur-md transition-all flex items-center justify-center gap-2"
            >
              <FileText className="w-4 h-4 text-forest-200 shrink-0" />
              <span>{isAr ? 'خططي الزراعية' : 'My Plans'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. Key Metrics Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {/* Metric 1: Saved Plans */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft hover:shadow-soft-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'الخطط المحفوظة' : 'Saved Plans'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-forest-50 text-forest-700 flex items-center justify-center">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-charcoal">
            {loading ? '...' : (stats?.totalPlans ?? 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {isAr ? 'خطط دورات محصولية معتمدة' : 'Verified multi-season rotations'}
          </p>
        </div>

        {/* Metric 2: Registered Farms */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft hover:shadow-soft-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'المزارع المسجلة' : 'Registered Farms'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-sky-50 text-sky-700 flex items-center justify-center">
              <MapPin className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-charcoal">
            {loading ? '...' : (stats?.totalFarms ?? 0)}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {isAr ? 'حقول ومواقع جغرافية مخصصة' : 'Unique parcels and coordinates'}
          </p>
        </div>

        {/* Metric 3: Total Managed Area */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft hover:shadow-soft-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'المساحة الكلية' : 'Total Area'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-bold text-charcoal">
            {loading ? '...' : `${stats?.totalArea ?? 0}`} <span className="text-xs font-medium text-slate-500">{isAr ? 'فدان / هكتار' : 'Area Units'}</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">
            {isAr ? 'مساحات الحقول تحت المتابعة' : 'Combined farm footprint'}
          </p>
        </div>

        {/* Metric 4: Top Crop */}
        <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft hover:shadow-soft-lg transition-all">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
              {isAr ? 'المحصول الأبرز' : 'Top Crop'}
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-lg sm:text-xl font-bold text-charcoal truncate">
            {loading ? '...' : (stats?.topCrops[0] ? (isAr ? stats.topCrops[0].nameAr : stats.topCrops[0].nameEn) : (isAr ? 'لا يوجد بعد' : 'None yet'))}
          </div>
          <p className="text-[11px] text-slate-500 mt-1 font-medium truncate">
            {stats?.topCrops[0] ? `${stats.topCrops[0].count} ${isAr ? 'مرات في خططك' : 'times in plans'}` : (isAr ? 'أنشئ أول خطة لمزرعتك' : 'Generate your first plan')}
          </p>
        </div>
      </div>

      {/* 3. Quick Actions Row */}
      <div className="bg-white rounded-2xl p-6 border border-slate-200/80 shadow-soft">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center gap-2">
          <Compass className="w-4 h-4 text-forest-600" />
          <span>{isAr ? 'إجراءات سريعة' : 'Quick Actions'}</span>
        </h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          <button
            onClick={() => onNavigate('assistant')}
            className="flex flex-col items-center text-center p-4 rounded-xl border border-emerald-300 bg-emerald-50/60 hover:bg-emerald-100/70 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-forest-700 text-white flex items-center justify-center mb-2 group-hover:scale-105 transition-transform shadow-xs">
              <Bot className="w-5 h-5 text-emerald-300" />
            </div>
            <span className="text-xs font-bold text-forest-900">{isAr ? 'المساعد الزراعي' : 'AI Assistant'}</span>
            <span className="text-[10px] text-forest-700 mt-0.5">{isAr ? 'استشارات فورية' : 'Instant advice'}</span>
          </button>

          <button
            onClick={() => onNavigate('assessment')}
            className="flex flex-col items-center text-center p-4 rounded-xl border border-slate-200/70 hover:border-forest-300 bg-sand/40 hover:bg-forest-50/50 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <Sprout className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-charcoal">{isAr ? 'تقييم زراعي جديد' : 'New Assessment'}</span>
            <span className="text-[10px] text-slate-500 mt-0.5">{isAr ? 'توليد دورة محصولية' : 'Generate plan'}</span>
          </button>

          <button
            onClick={() => onNavigate('plans')}
            className="flex flex-col items-center text-center p-4 rounded-xl border border-slate-200/70 hover:border-forest-300 bg-sand/40 hover:bg-forest-50/50 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-sky-100 text-sky-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <FileText className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-charcoal">{isAr ? 'خططي الزراعية' : 'My Plans'}</span>
            <span className="text-[10px] text-slate-500 mt-0.5">{isAr ? 'استعراض وإدارة الخطط' : 'Manage saved plans'}</span>
          </button>

          <button
            onClick={() => onNavigate('farms')}
            className="flex flex-col items-center text-center p-4 rounded-xl border border-slate-200/70 hover:border-forest-300 bg-sand/40 hover:bg-forest-50/50 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <MapPin className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-charcoal">{isAr ? 'مزارعي وحقولي' : 'My Farms'}</span>
            <span className="text-[10px] text-slate-500 mt-0.5">{isAr ? 'إدارة بيانات الأراضي' : 'Farm profiles'}</span>
          </button>

          <button
            onClick={() => onNavigate('history')}
            className="flex flex-col items-center text-center p-4 rounded-xl border border-slate-200/70 hover:border-forest-300 bg-sand/40 hover:bg-forest-50/50 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <History className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-charcoal">{isAr ? 'السجل الزراعي' : 'Activity History'}</span>
            <span className="text-[10px] text-slate-500 mt-0.5">{isAr ? 'سجل العمليات والقرارات' : 'Action timeline'}</span>
          </button>

          <button
            onClick={() => onNavigate('profile')}
            className="flex flex-col items-center text-center p-4 rounded-xl border border-slate-200/70 hover:border-forest-300 bg-sand/40 hover:bg-forest-50/50 transition-all group"
          >
            <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
              <User className="w-5 h-5" />
            </div>
            <span className="text-xs font-bold text-charcoal">{isAr ? 'الملف الشخصي' : 'Farmer Profile'}</span>
            <span className="text-[10px] text-slate-500 mt-0.5">{isAr ? 'بيانات الحساب والإعدادات' : 'Account settings'}</span>
          </button>
        </div>
      </div>

      {/* 4. Two Columns: Recent Plans & Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Recent Plans (2 cols) */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-charcoal flex items-center gap-2">
              <FileText className="w-4 h-4 text-forest-600" />
              <span>{isAr ? 'أحدث الخطط الزراعية المحفوظة' : 'Recent Agricultural Plans'}</span>
            </h2>
            <button
              onClick={() => onNavigate('assistant')}
              className="px-4 py-2.5 rounded-xl bg-forest-800/90 hover:bg-forest-700/90 text-emerald-200 font-semibold text-sm border border-emerald-400/40 backdrop-blur-md transition-all flex items-center gap-2"
            >
              <Bot className="w-4 h-4 text-emerald-300" />
              <span>{isAr ? 'المساعد الزراعي الذكي' : 'AI Assistant'}</span>
            </button>
            <button
              onClick={() => onNavigate('plans')}
              className="text-xs font-semibold text-forest-700 hover:text-forest-800 flex items-center gap-1"
            >
              <span>{isAr ? 'عرض الكل' : 'View all'}</span>
              {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center bg-white rounded-2xl border border-slate-200 text-slate-500 text-sm">
              {isAr ? 'جارٍ تحميل الخطط...' : 'Loading plans...'}
            </div>
          ) : stats && stats.recentPlans.length > 0 ? (
            <div className="space-y-3">
              {stats.recentPlans.map(plan => (
                <div
                  key={plan.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft hover:shadow-soft-lg hover:border-forest-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                >
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-sm text-charcoal">{plan.planName}</span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-forest-50 text-forest-800 border border-forest-200">
                        {plan.planSnapshot.overallScore}/100
                      </span>
                    </div>

                    <div className="flex items-center gap-3 text-xs text-slate-500">
                      <span className="flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-slate-400" />
                        {plan.farmName}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        {new Date(plan.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { dateStyle: 'medium' })}
                      </span>
                    </div>

                    {/* Sequence badges with numbered stages and directional connectors */}
                    <div className="pt-2">
                      <CropRotationTimeline steps={plan.planSnapshot.steps} layout="mini" />
                    </div>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-center shrink-0">
                    {onAskAboutPlan && (
                      <button
                        onClick={() => onAskAboutPlan(plan)}
                        className="px-3 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs hover:scale-105 active:scale-95"
                        title={isAr ? 'اسأل المستشار عن هذه الخطة' : 'Ask About This Plan'}
                      >
                        <Bot className="w-3.5 h-3.5 text-emerald-700" />
                        <span>{isAr ? 'استشارة الخطة' : 'Ask About Plan'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => onOpenSavedPlan(plan)}
                      className="px-4 py-2 rounded-xl bg-forest-50 hover:bg-forest-100 text-forest-800 text-xs font-semibold border border-forest-200/80 transition-colors flex items-center justify-center gap-1.5"
                    >
                      <span>{isAr ? 'فتح الخطة' : 'Open Plan'}</span>
                      <ExternalLink className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white rounded-2xl p-8 border border-slate-200/80 text-center space-y-3">
              <div className="w-12 h-12 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center mx-auto">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="font-bold text-sm text-charcoal">
                {isAr ? 'لا توجد خطط زراعية محفوظة بعد' : 'No saved plans yet'}
              </h3>
              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                {isAr 
                  ? 'ابدأ أول تقييم لمزرعتك واحفظ خطط الدورات الزراعية المقترحة للرجوع إليها مستقبلاً.'
                  : 'Start a farm assessment and save recommended crop rotation plans to access them anytime.'}
              </p>
              <button
                onClick={() => onNavigate('assessment')}
                className="px-4 py-2 rounded-xl bg-forest-600 hover:bg-forest-700 text-white font-semibold text-xs shadow-soft transition-all"
              >
                {isAr ? 'بدء التقييم الآن' : 'Start Assessment'}
              </button>
            </div>
          )}
        </div>

        {/* Right Column: Recent Activity History Feed (1 col) */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-charcoal flex items-center gap-2">
              <History className="w-4 h-4 text-purple-600" />
              <span>{isAr ? 'آخر العمليات' : 'Recent Activity'}</span>
            </h2>
            <button
              onClick={() => onNavigate('history')}
              className="text-xs font-semibold text-purple-700 hover:text-purple-800 flex items-center gap-1"
            >
              <span>{isAr ? 'السجل' : 'All'}</span>
              {isAr ? <ArrowLeft className="w-3.5 h-3.5" /> : <ArrowRight className="w-3.5 h-3.5" />}
            </button>
          </div>

          <div className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-soft space-y-4">
            {recentActivities.length > 0 ? (
              <div className="relative pl-6 sm:pl-7 border-l-2 border-slate-100 space-y-4">
                {recentActivities.map((act) => (
                  <div key={act.id} className="relative">
                    <div className="absolute -left-[31px] sm:-left-[35px] top-1 w-5 h-5 rounded-full bg-purple-50 text-purple-700 flex items-center justify-center border-2 border-white shadow-soft">
                      <CheckCircle className="w-3 h-3" />
                    </div>
                    <div>
                      <p className="text-xs font-medium text-charcoal">
                        {isAr ? act.descriptionAr : act.descriptionEn}
                      </p>
                      <span className="text-[10px] text-slate-400 mt-0.5 block">
                        {new Date(act.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-500 text-center py-4">
                {isAr ? 'لا توجد أنشطة مسجلة بعد' : 'No recorded activity yet'}
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
