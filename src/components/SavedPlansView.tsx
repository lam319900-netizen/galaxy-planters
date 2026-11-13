import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { dbService } from '../services/database';
import type { SavedPlanRecord, FarmRecord } from '../types/platform';
import { CropRotationTimeline } from './CropRotationTimeline';
import { 
  FileText, 
  Search, 
  MapPin, 
  Calendar, 
  Trash2, 
  Copy, 
  Edit3, 
  ExternalLink, 
  RefreshCw, 
  X, 
  AlertTriangle,
  Sparkles,
  ArrowUpDown,
  BookOpen,
  Bot
} from 'lucide-react';

interface SavedPlansViewProps {
  onOpenSavedPlan: (plan: SavedPlanRecord) => void;
  onRegeneratePlan: (plan: SavedPlanRecord) => void;
  onStartNewAssessment: () => void;
  onAskAboutPlan?: (plan: SavedPlanRecord) => void;
}

export const SavedPlansView: React.FC<SavedPlansViewProps> = ({
  onOpenSavedPlan,
  onRegeneratePlan,
  onStartNewAssessment,
  onAskAboutPlan
}) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [plans, setPlans] = useState<SavedPlanRecord[]>([]);
  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFarmFilter, setSelectedFarmFilter] = useState<string>('all');
  const [selectedCropFilter, setSelectedCropFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest' | 'score'>('newest');

  // Modals
  const [editingPlan, setEditingPlan] = useState<SavedPlanRecord | null>(null);
  const [editName, setEditName] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [deleteTargetPlan, setDeleteTargetPlan] = useState<SavedPlanRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const loadData = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const [userPlans, userFarms] = await Promise.all([
        dbService.getSavedPlans(user.id),
        dbService.getFarms(user.id)
      ]);
      setPlans(userPlans);
      setFarms(userFarms);
    } catch (err) {
      console.error('[SavedPlansView] Failed loading plans', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Handle Edit Plan
  const handleSaveEdit = async () => {
    if (!user || !editingPlan) return;
    setActionLoading(true);
    try {
      const updated = await dbService.updateSavedPlan(user.id, editingPlan.id, {
        planName: editName.trim() || editingPlan.planName,
        userNotes: editNotes.trim()
      });
      setPlans(prev => prev.map(p => p.id === updated.id ? updated : p));
      setEditingPlan(null);
    } catch (err) {
      console.error('Failed updating plan', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Handle Duplicate
  const handleDuplicate = async (plan: SavedPlanRecord) => {
    if (!user) return;
    try {
      const copyName = isAr ? `${plan.planName} (نسخة)` : `${plan.planName} (Copy)`;
      const duplicated = await dbService.duplicateSavedPlan(user.id, plan.id, copyName);
      setPlans(prev => [duplicated, ...prev]);
    } catch (err) {
      console.error('Failed duplicating plan', err);
    }
  };

  // Handle Delete Confirmation
  const handleConfirmDelete = async () => {
    if (!user || !deleteTargetPlan) return;
    setActionLoading(true);
    try {
      await dbService.deleteSavedPlan(user.id, deleteTargetPlan.id);
      setPlans(prev => prev.filter(p => p.id !== deleteTargetPlan.id));
      setDeleteTargetPlan(null);
    } catch (err) {
      console.error('Failed deleting plan', err);
    } finally {
      setActionLoading(false);
    }
  };

  // Filter & Sort logic
  const filteredPlans = plans.filter(plan => {
    const query = searchQuery.toLowerCase().trim();
    const matchesQuery = 
      !query ||
      plan.planName.toLowerCase().includes(query) ||
      plan.farmName.toLowerCase().includes(query) ||
      plan.planSnapshot.titleEn.toLowerCase().includes(query) ||
      plan.planSnapshot.titleAr.includes(query) ||
      plan.planSnapshot.steps.some(s => 
        (s.crop?.nameEn.toLowerCase().includes(query)) ||
        (s.crop?.nameAr.includes(query)) ||
        (s.varietyRecommendation?.varietyName.toLowerCase().includes(query))
      );

    const matchesFarm = 
      selectedFarmFilter === 'all' || 
      plan.farmId === selectedFarmFilter ||
      plan.farmName === selectedFarmFilter;

    const matchesCrop = 
      selectedCropFilter === 'all' ||
      plan.planSnapshot.steps.some(s => s.cropId === selectedCropFilter);

    return matchesQuery && matchesFarm && matchesCrop;
  }).sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    }
    if (sortBy === 'oldest') {
      return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
    }
    if (sortBy === 'score') {
      return b.planSnapshot.overallScore - a.planSnapshot.overallScore;
    }
    return 0;
  });

  const distinctCropsMap = new Map<string, { en: string; ar: string }>();
  plans.forEach(p => {
    p.planSnapshot.steps.forEach(s => {
      if (s.cropId && s.crop && s.cropId !== 'fallow') {
        distinctCropsMap.set(s.cropId, { en: s.crop.nameEn, ar: s.crop.nameAr });
      }
    });
  });

  if (!user) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-600">
          {isAr ? 'يرجى تسجيل الدخول للوصول إلى خططك الزراعية.' : 'Please sign in to view your saved agricultural plans.'}
        </p>
      </div>
    );
  }

  return (
    <div className="py-3 sm:py-6 space-y-5 sm:space-y-6 animate-fade-in font-sans w-full max-w-full overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Header & Title Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-charcoal tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center shrink-0">
              <FileText className="w-5 h-5 text-forest-700" />
            </div>
            <span>{isAr ? 'خططي الزراعية المحفوظة' : 'My Agricultural Plans'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isAr 
              ? 'سجل الدورات الزراعية المعتمدة وملاحظات التقاوي المقترحة لأراضيك ومزارعك.'
              : 'Archive of saved crop rotation plans, historical snapshots, and tailored seed varieties.'}
          </p>
        </div>

        <button
          onClick={onStartNewAssessment}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-xs sm:text-sm shadow-soft hover:shadow-soft-lg transition-all flex items-center justify-center gap-2 active:scale-[0.98] shrink-0"
        >
          <Sparkles className="w-4 h-4 shrink-0" />
          <span>{isAr ? 'تقييم خطة جديدة' : 'New Plan Assessment'}</span>
        </button>
      </div>

      {/* 2. Search & Filtering Controls */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200/80 shadow-soft space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search bar */}
          <div className="relative">
            <Search className={`absolute top-2.5 ${isAr ? 'right-3' : 'left-3'} w-4 h-4 text-slate-400`} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder={isAr ? 'بحث بالاسم، المزرعة، أو المحصول...' : 'Search by name, farm, or crop...'}
              className={`w-full ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-500`}
            />
          </div>

          {/* Farm Filter */}
          <div>
            <select
              value={selectedFarmFilter}
              onChange={e => setSelectedFarmFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-500 text-charcoal font-medium"
            >
              <option value="all">{isAr ? 'جميع المزارع' : 'All Farms'}</option>
              {farms.map(f => (
                <option key={f.id} value={f.id}>{f.farmName}</option>
              ))}
            </select>
          </div>

          {/* Crop Filter */}
          <div>
            <select
              value={selectedCropFilter}
              onChange={e => setSelectedCropFilter(e.target.value)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-500 text-charcoal font-medium"
            >
              <option value="all">{isAr ? 'جميع المحاصيل' : 'All Crops'}</option>
              {Array.from(distinctCropsMap.entries()).map(([cid, names]) => (
                <option key={cid} value={cid}>{isAr ? names.ar : names.en}</option>
              ))}
            </select>
          </div>

          {/* Sort Order */}
          <div className="relative flex items-center">
            <ArrowUpDown className={`absolute ${isAr ? 'left-3' : 'right-3'} w-3.5 h-3.5 text-slate-400 pointer-events-none`} />
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value as any)}
              className="w-full py-2 px-3 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-2 focus:ring-forest-500 text-charcoal font-medium"
            >
              <option value="newest">{isAr ? 'الأحدث حفظاً' : 'Newest First'}</option>
              <option value="oldest">{isAr ? 'الأقدم حفظاً' : 'Oldest First'}</option>
              <option value="score">{isAr ? 'الأعلى كفاءة (الدرجة)' : 'Highest Score'}</option>
            </select>
          </div>
        </div>

        {/* Counter indicator */}
        <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
          <span>
            {isAr 
              ? `عرض ${filteredPlans.length} من إجمالي ${plans.length} خطة محفوظة`
              : `Showing ${filteredPlans.length} of ${plans.length} saved plans`}
          </span>
          {(searchQuery || selectedFarmFilter !== 'all' || selectedCropFilter !== 'all') && (
            <button
              onClick={() => { setSearchQuery(''); setSelectedFarmFilter('all'); setSelectedCropFilter('all'); }}
              className="text-forest-600 hover:text-forest-700 font-semibold"
            >
              {isAr ? 'إعادة ضبط الفلاتر' : 'Reset filters'}
            </button>
          )}
        </div>
      </div>

      {/* 3. Plans Grid List */}
      {loading ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500">{isAr ? 'جارٍ تحميل الخطط المحفوظة...' : 'Loading saved plans...'}</p>
        </div>
      ) : filteredPlans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {filteredPlans.map(plan => {
            const snap = plan.planSnapshot;
            return (
              <div
                key={plan.id}
                className="bg-white rounded-2xl border border-slate-200/80 shadow-soft hover:shadow-soft-lg hover:border-forest-300 transition-all flex flex-col justify-between overflow-hidden group"
              >
                {/* Top Card Info */}
                <div className="p-5 space-y-3.5">
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-base text-charcoal group-hover:text-forest-700 transition-colors">
                          {plan.planName}
                        </h3>
                        <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-forest-50 text-forest-800 border border-forest-200">
                          {snap.overallScore}/100
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 font-medium">
                        {isAr ? snap.titleAr : snap.titleEn}
                      </p>
                    </div>

                    {/* Quick Menu Actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={() => {
                          setEditingPlan(plan);
                          setEditName(plan.planName);
                          setEditNotes(plan.userNotes || '');
                        }}
                        title={isAr ? 'تعديل الاسم والملاحظات' : 'Edit name & notes'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-charcoal hover:bg-sand transition-colors"
                      >
                        <Edit3 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDuplicate(plan)}
                        title={isAr ? 'إنشاء نسخة مكررة' : 'Duplicate plan'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeleteTargetPlan(plan)}
                        title={isAr ? 'حذف الخطة' : 'Delete plan'}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Farm & Metadata Badges */}
                  <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                    <span className="inline-flex items-center gap-1 font-semibold text-charcoal">
                      <MapPin className="w-3.5 h-3.5 text-forest-600" />
                      {plan.farmName}
                    </span>
                    <span>•</span>
                    <span className="inline-flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {new Date(plan.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { dateStyle: 'medium' })}
                    </span>
                    <span>•</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-sand text-slate-600 font-mono">
                      {plan.recommendationVersion}
                    </span>
                  </div>

                  {/* 4-Season Sequence Representation with Numbered Stages & Directional Connectors */}
                  <div className="p-3.5 rounded-2xl bg-sand/50 border border-slate-200/70 space-y-2 min-w-0 w-full max-w-full overflow-hidden">
                    <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                      {isAr ? 'تتابع وتعاقب المواسم الزراعية الأربعة (01 - 04):' : '4-Season Cropping Succession (Stages 01 – 04):'}
                    </span>
                    <CropRotationTimeline steps={snap.steps} layout="compact" />
                  </div>

                  {/* Personal Notes (if present) */}
                  {plan.userNotes && (
                    <div className="p-2.5 rounded-lg bg-amber-50/70 border border-amber-200/60 text-xs text-amber-900 space-y-1">
                      <div className="flex items-center gap-1 font-bold text-[11px] text-amber-800">
                        <BookOpen className="w-3.5 h-3.5" />
                        <span>{isAr ? 'ملاحظاتي الحقلية:' : 'Farmer Notes:'}</span>
                      </div>
                      <p className="line-clamp-2 text-[11px] text-amber-800/90 whitespace-pre-line font-normal">
                        {plan.userNotes}
                      </p>
                    </div>
                  )}
                </div>

                {/* Bottom Action Bar */}
                <div className="px-4 sm:px-5 py-3 bg-sand/40 border-t border-slate-100 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5">
                  <button
                    onClick={() => onRegeneratePlan(plan)}
                    className="text-xs font-semibold text-slate-600 hover:text-forest-700 flex items-center justify-center gap-1.5 py-1.5 px-2 rounded hover:bg-white transition-colors"
                  >
                    <RefreshCw className="w-3.5 h-3.5 text-slate-400 group-hover:text-forest-600 shrink-0" />
                    <span>{isAr ? 'إعادة تقييم بالبيانات الحية' : 'Regenerate Live'}</span>
                  </button>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    {onAskAboutPlan && (
                      <button
                        onClick={() => onAskAboutPlan(plan)}
                        className="flex-1 sm:flex-initial px-3 py-1.5 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-semibold transition-all flex items-center justify-center gap-1.5 shadow-2xs active:scale-95"
                        title={isAr ? 'اسأل المستشار عن هذه الخطة' : 'Ask About This Plan'}
                      >
                        <Bot className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
                        <span>{isAr ? 'استشارة الخطة' : 'Ask AI'}</span>
                      </button>
                    )}

                    <button
                      onClick={() => onOpenSavedPlan(plan)}
                      className="flex-1 sm:flex-initial px-4 py-1.5 rounded-lg bg-forest-600 hover:bg-forest-500 text-white text-xs font-semibold shadow-soft transition-all flex items-center justify-center gap-1.5 active:scale-95"
                    >
                      <span>{isAr ? 'فتح الخطة' : 'Open Plan'}</span>
                      <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200 space-y-3">
          <div className="w-12 h-12 rounded-full bg-forest-50 text-forest-700 flex items-center justify-center mx-auto">
            <FileText className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-charcoal">
            {isAr ? 'لا توجد خطط تطابق البحث' : 'No matching plans found'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            {isAr 
              ? 'جرّب تغيير فلاتر البحث أو أنشئ خطة محصولية جديدة لأحد حقولك.'
              : 'Try clearing your filters or generate a new rotation plan assessment.'}
          </p>
          <button
            onClick={onStartNewAssessment}
            className="px-4 py-2 rounded-xl bg-forest-600 hover:bg-forest-700 text-white text-xs font-semibold shadow-soft"
          >
            {isAr ? 'بدء تقييم جديد' : 'New Assessment'}
          </button>
        </div>
      )}

      {/* 4. Rename & Edit Notes Modal */}
      {editingPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-soft-xl border border-slate-200/80 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-charcoal">
                {isAr ? 'تعديل بيانات الخطة الزراعية' : 'Edit Plan Details'}
              </h3>
              <button
                onClick={() => setEditingPlan(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-charcoal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">
                  {isAr ? 'اسم الخطة المخصص' : 'Custom Plan Name'}
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-500 font-medium text-charcoal"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">
                  {isAr ? 'ملاحظاتك الزراعية والحقلية' : 'Agronomic & Field Notes'}
                </label>
                <textarea
                  rows={4}
                  value={editNotes}
                  onChange={e => setEditNotes(e.target.value)}
                  placeholder={isAr ? 'أضف مواعيد التسميد، نوع التقاوي المشتراة، أو ملاحظات الحصاد...' : 'Add notes on fertilizer doses, purchased seed varieties, or field observations...'}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-500 font-normal text-charcoal"
                />
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingPlan(null)}
                className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-sand"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleSaveEdit}
                className="px-4 py-2 rounded-lg bg-forest-600 hover:bg-forest-500 text-white text-xs font-semibold shadow-soft disabled:opacity-60"
              >
                {actionLoading ? (isAr ? 'جارٍ الحفظ...' : 'Saving...') : (isAr ? 'حفظ التعديلات' : 'Save Changes')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Delete Confirmation Modal */}
      {deleteTargetPlan && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/60 backdrop-blur-sm animate-fade-in">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-soft-xl border border-slate-200/80 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-charcoal">
                {isAr ? 'تأكيد حذف الخطة الزراعية' : 'Confirm Plan Deletion'}
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                {isAr 
                  ? `هل أنت متأكد من حذف "${deleteTargetPlan.planName}"؟ لا يمكن التراجع عن هذا الإجراء.`
                  : `Are you sure you want to delete "${deleteTargetPlan.planName}"? This action cannot be undone.`}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetPlan(null)}
                className="flex-1 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-sand"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-soft disabled:opacity-60"
              >
                {actionLoading ? (isAr ? 'جارٍ الحذف...' : 'Deleting...') : (isAr ? 'حذف نهائي' : 'Delete Plan')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
