import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { dbService } from '../services/database';
import type { ActivityHistoryRecord, FarmRecord } from '../types';
import { 
  History, 
  MapPin, 
  FileText, 
  UserCheck, 
  Edit3, 
  Trash2, 
  Copy, 
  PlusCircle, 
  CheckCircle2
} from 'lucide-react';

interface ActivityHistoryViewProps {
  onOpenSavedPlan?: (planId: string) => void;
}

export const ActivityHistoryView: React.FC<ActivityHistoryViewProps> = ({ onOpenSavedPlan }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [activities, setActivities] = useState<ActivityHistoryRecord[]>([]);
  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters
  const [selectedType, setSelectedType] = useState<string>('all');
  const [selectedFarm, setSelectedFarm] = useState<string>('all');
  const [dateFilter, setDateFilter] = useState<'all' | '7days' | '30days'>('all');

  useEffect(() => {
    if (!user) return;
    let isMounted = true;

    Promise.all([
      dbService.getActivityHistory(user.id),
      dbService.getFarms(user.id)
    ])
      .then(([acts, userFarms]) => {
        if (isMounted) {
          setActivities(acts);
          setFarms(userFarms);
          setLoading(false);
        }
      })
      .catch(err => {
        console.error('[ActivityHistoryView] Failed loading history', err);
        if (isMounted) setLoading(false);
      });

    return () => { isMounted = false; };
  }, [user]);

  // Filter activities
  const filteredActivities = activities.filter(act => {
    if (selectedType !== 'all') {
      if (selectedType === 'farms' && !act.activityType.startsWith('farm_')) return false;
      if (selectedType === 'plans' && !act.activityType.startsWith('plan_')) return false;
      if (selectedType === 'account' && act.activityType !== 'account_created') return false;
    }

    if (selectedFarm !== 'all' && act.farmId !== selectedFarm) {
      return false;
    }

    if (dateFilter !== 'all') {
      const actDate = new Date(act.createdAt).getTime();
      const cutoff = Date.now() - (dateFilter === '7days' ? 7 * 86400000 : 30 * 86400000);
      if (actDate < cutoff) return false;
    }

    return true;
  });

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'account_created':
        return <UserCheck className="w-4 h-4 text-emerald-600" />;
      case 'farm_created':
        return <PlusCircle className="w-4 h-4 text-blue-600" />;
      case 'farm_updated':
        return <Edit3 className="w-4 h-4 text-amber-600" />;
      case 'farm_deleted':
        return <Trash2 className="w-4 h-4 text-rose-600" />;
      case 'plan_saved':
        return <FileText className="w-4 h-4 text-forest-600" />;
      case 'plan_updated':
        return <Edit3 className="w-4 h-4 text-indigo-600" />;
      case 'plan_duplicated':
        return <Copy className="w-4 h-4 text-purple-600" />;
      case 'plan_deleted':
        return <Trash2 className="w-4 h-4 text-rose-600" />;
      default:
        return <CheckCircle2 className="w-4 h-4 text-slate-500" />;
    }
  };

  const getActivityBadgeColor = (type: string) => {
    switch (type) {
      case 'account_created':
        return 'bg-emerald-50 text-emerald-800 border-emerald-200';
      case 'farm_created':
      case 'farm_updated':
        return 'bg-blue-50 text-blue-800 border-blue-200';
      case 'farm_deleted':
      case 'plan_deleted':
        return 'bg-rose-50 text-rose-800 border-rose-200';
      case 'plan_saved':
      case 'plan_duplicated':
        return 'bg-forest-50 text-forest-800 border-forest-200';
      default:
        return 'bg-sand text-slate-700 border-slate-200';
    }
  };

  if (!user) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-600">
          {isAr ? 'يرجى تسجيل الدخول للوصول إلى سجلك الزراعي.' : 'Please sign in to view your agricultural activity history.'}
        </p>
      </div>
    );
  }

  return (
    <div className="py-3 sm:py-6 space-y-5 sm:space-y-6 animate-fade-in font-sans w-full max-w-full overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Header Bar */}
      <div className="pb-4 border-b border-slate-200/80">
        <h1 className="text-xl sm:text-3xl font-bold text-charcoal tracking-tight flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-purple-100 text-purple-800 flex items-center justify-center shrink-0">
            <History className="w-5 h-5 sm:w-6 sm:h-6 text-purple-700" />
          </div>
          <span>{isAr ? 'السجل الزراعي والأنشطة' : 'Agricultural History & Audit'}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {isAr 
            ? 'سجل زمني موثق لجميع العمليات والقرارات: إضافة المزارع، وتوليد الخطط، وحفظ التوصيات، وتعديل الملاحظات.'
            : 'Chronological timeline of all farm activities: parcel registrations, saved rotations, duplications, and notes.'}
        </p>
      </div>

      {/* 2. Filters Row */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Filter by Category */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              {isAr ? 'نوع النشاط' : 'Activity Category'}
            </label>
            <select
              value={selectedType}
              onChange={e => setSelectedType(e.target.value)}
              className="w-full py-1.5 px-3 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-500 text-charcoal font-medium"
            >
              <option value="all">{isAr ? 'جميع الأنشطة' : 'All Activities'}</option>
              <option value="plans">{isAr ? 'الخطط الزراعية (حفظ، تكرار، تعديل)' : 'Plans (Save, Duplicate, Edit)'}</option>
              <option value="farms">{isAr ? 'المزارع والحقول (تسجيل، تحديث)' : 'Farms (Create, Update)'}</option>
              <option value="account">{isAr ? 'بيانات الحساب' : 'Account Events'}</option>
            </select>
          </div>

          {/* Filter by Farm */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              {isAr ? 'المزرعة المرتبطة' : 'Associated Farm'}
            </label>
            <select
              value={selectedFarm}
              onChange={e => setSelectedFarm(e.target.value)}
              className="w-full py-1.5 px-3 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-500 text-charcoal font-medium"
            >
              <option value="all">{isAr ? 'جميع المزارع' : 'All Farms'}</option>
              {farms.map(f => (
                <option key={f.id} value={f.id}>{f.farmName}</option>
              ))}
            </select>
          </div>

          {/* Filter by Date Period */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 mb-1">
              {isAr ? 'الفترة الزمنية' : 'Time Period'}
            </label>
            <select
              value={dateFilter}
              onChange={e => setDateFilter(e.target.value as any)}
              className="w-full py-1.5 px-3 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-500 text-charcoal font-medium"
            >
              <option value="all">{isAr ? 'كل الفترات' : 'All Time'}</option>
              <option value="7days">{isAr ? 'آخر 7 أيام' : 'Last 7 Days'}</option>
              <option value="30days">{isAr ? 'آخر 30 يوماً' : 'Last 30 Days'}</option>
            </select>
          </div>
        </div>
      </div>

      {/* 3. Timeline Feed */}
      {loading ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500">{isAr ? 'جارٍ تحميل السجل الزراعي...' : 'Loading history...'}</p>
        </div>
      ) : filteredActivities.length > 0 ? (
        <div className="bg-white rounded-2xl p-4 sm:p-6 border border-slate-200/80 shadow-soft">
          <div className={`relative ${isAr ? 'pr-6 sm:pr-8 border-r-2' : 'pl-6 sm:pl-8 border-l-2'} border-slate-200 space-y-6`}>
            {filteredActivities.map((act) => {
              const formattedDate = new Date(act.createdAt).toLocaleString(isAr ? 'ar-EG' : 'en-US', {
                dateStyle: 'medium',
                timeStyle: 'short'
              });

              return (
                <div key={act.id} className="relative group">
                  {/* Timeline Node Dot */}
                  <div className={`absolute ${isAr ? '-right-[35px] sm:-right-[43px]' : '-left-[35px] sm:-left-[43px]'} top-1 w-6 h-6 rounded-full bg-white border-2 border-purple-500 flex items-center justify-center shadow-soft group-hover:scale-105 transition-transform z-10`}>
                    {getActivityIcon(act.activityType)}
                  </div>

                  {/* Activity Content Box */}
                  <div className="p-4 rounded-xl bg-sand/40 hover:bg-sand/70 border border-slate-200/70 transition-all space-y-2">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${getActivityBadgeColor(act.activityType)}`}>
                          {act.activityType.replace(/_/g, ' ').toUpperCase()}
                        </span>
                        {act.farmName && (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-charcoal">
                            <MapPin className="w-3 h-3 text-forest-600" />
                            {act.farmName}
                          </span>
                        )}
                        {act.planName && (
                          <button
                            type="button"
                            onClick={() => act.planId && onOpenSavedPlan && onOpenSavedPlan(act.planId)}
                            className={`inline-flex items-center gap-1 text-xs font-semibold text-forest-800 ${act.planId && onOpenSavedPlan ? 'hover:underline cursor-pointer' : ''}`}
                          >
                            <FileText className="w-3 h-3" />
                            {act.planName}
                          </button>
                        )}
                      </div>

                      <span className="text-[11px] text-slate-400 font-medium">
                        {formattedDate}
                      </span>
                    </div>

                    <p className="text-xs sm:text-sm font-medium text-charcoal">
                      {isAr ? act.descriptionAr : act.descriptionEn}
                    </p>

                    {/* Metadata Pill */}
                    {act.metadata && Object.keys(act.metadata).length > 0 && (
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-500 pt-1">
                        {Object.entries(act.metadata).map(([key, val]) => (
                          <span key={key} className="px-1.5 py-0.5 rounded bg-white border border-slate-200">
                            {key}: {String(val)}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 space-y-3">
          <div className="w-12 h-12 rounded-full bg-purple-50 text-purple-600 flex items-center justify-center mx-auto">
            <History className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-charcoal">
            {isAr ? 'لا توجد أنشطة مطابقة للبحث' : 'No matching activities'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-normal">
            {isAr 
              ? 'ستظهر هنا جميع أنشطة حفظ الخطط وتعديل المزارع فور إجرائها.'
              : 'All farm actions, plan generations, and modifications will appear here automatically.'}
          </p>
        </div>
      )}
    </div>
  );
};
