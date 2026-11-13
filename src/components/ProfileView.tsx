import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { 
  User, 
  Mail, 
  MapPin, 
  Globe, 
  Calendar, 
  ShieldCheck, 
  AlertTriangle, 
  Save, 
  Trash2, 
  CheckCircle2
} from 'lucide-react';

const PRESET_AVATARS = [
  '🌾', '🌱', '🌴', '🚜', '🌽', '🫒', '🍇', '🌻'
];

export const ProfileView: React.FC = () => {
  const { user, updateProfile, deleteAccount } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [fullName, setFullName] = useState(user?.fullName || '');
  const [country, setCountry] = useState(user?.country || '');
  const [city, setCity] = useState(user?.city || '');
  const [selectedAvatar, setSelectedAvatar] = useState(user?.profileImage || '🌾');

  const [saving, setSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!user) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-600">
          {isAr ? 'يرجى تسجيل الدخول للوصول إلى ملفك الشخصي.' : 'Please sign in to access your profile.'}
        </p>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccessMsg(null);
    setErrorMsg(null);

    try {
      await updateProfile({
        fullName: fullName.trim(),
        country: country.trim(),
        city: city.trim(),
        profileImage: selectedAvatar
      });
      setSuccessMsg(isAr ? 'تم تحديث بياناتك الشخصية بنجاح!' : 'Profile updated successfully!');
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    try {
      await deleteAccount();
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : String(err));
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  return (
    <div className="py-3 sm:py-6 max-w-3xl mx-auto space-y-6 sm:space-y-8 animate-fade-in font-sans w-full max-w-full overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Header Bar */}
      <div className="pb-4 border-b border-slate-200/80">
        <h1 className="text-xl sm:text-3xl font-bold text-charcoal tracking-tight flex items-center gap-2.5">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-forest-100 text-forest-800 flex items-center justify-center shrink-0">
            <User className="w-5 h-5 sm:w-6 sm:h-6 text-forest-700" />
          </div>
          <span>{isAr ? 'الملف الشخصي للمزارع' : 'Farmer Profile'}</span>
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 mt-1">
          {isAr 
            ? 'إدارة بيانات حسابك، ومعلومات الاتصال الإقليمية، وتفضيلات الهوية الزراعية.'
            : 'Manage personal contact information, regional defaults, and farm identity preferences.'}
        </p>
      </div>

      {successMsg && (
        <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-3 text-emerald-800 text-xs font-semibold">
          <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 flex items-center gap-3 text-rose-800 text-xs font-semibold">
          <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 2. Main Profile Card */}
      <div className="bg-white rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-slate-200/80 shadow-soft space-y-6">
        {/* Avatar Selection Row */}
        <div>
          <label className="block text-xs font-bold text-charcoal uppercase tracking-wider mb-2">
            {isAr ? 'الشعار / الصورة الرمزية للمزارع' : 'Farmer Icon / Avatar'}
          </label>
          <div className="flex items-center gap-3 flex-wrap">
            <div className="w-16 h-16 rounded-2xl bg-forest-800 text-white flex items-center justify-center text-3xl shadow-soft border-2 border-forest-600/40">
              {selectedAvatar}
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              {PRESET_AVATARS.map(avatar => (
                <button
                  key={avatar}
                  type="button"
                  onClick={() => setSelectedAvatar(avatar)}
                  className={`w-10 h-10 rounded-xl flex items-center justify-center text-xl transition-all ${
                    selectedAvatar === avatar 
                      ? 'bg-forest-100 border-2 border-forest-600 scale-105 shadow-soft' 
                      : 'bg-sand hover:bg-slate-200 border border-transparent'
                  }`}
                >
                  {avatar}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Profile Edit Form */}
        <form onSubmit={handleSave} className="space-y-4 pt-4 border-t border-slate-100">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-charcoal mb-1">
                {isAr ? 'الاسم بالكامل' : 'Full Name'}
              </label>
              <div className="relative">
                <User className={`absolute top-2.5 ${isAr ? 'right-3' : 'left-3'} w-4 h-4 text-slate-400`} />
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  className={`w-full ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-500 font-medium text-charcoal`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal mb-1">
                {isAr ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className={`absolute top-2.5 ${isAr ? 'right-3' : 'left-3'} w-4 h-4 text-slate-400`} />
                <input
                  type="email"
                  disabled
                  value={user.email}
                  className={`w-full ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 text-xs rounded-xl border border-slate-200 bg-sand text-slate-500 cursor-not-allowed font-medium`}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-charcoal mb-1">
                {isAr ? 'الدولة' : 'Country'}
              </label>
              <div className="relative">
                <Globe className={`absolute top-2.5 ${isAr ? 'right-3' : 'left-3'} w-4 h-4 text-slate-400`} />
                <input
                  type="text"
                  required
                  value={country}
                  onChange={e => setCountry(e.target.value)}
                  className={`w-full ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-500 font-medium text-charcoal`}
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-charcoal mb-1">
                {isAr ? 'المدينة / المحافظة' : 'City / Region'}
              </label>
              <div className="relative">
                <MapPin className={`absolute top-2.5 ${isAr ? 'right-3' : 'left-3'} w-4 h-4 text-slate-400`} />
                <input
                  type="text"
                  required
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className={`w-full ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-500 font-medium text-charcoal`}
                />
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3 text-xs text-slate-500 pt-2">
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5 text-slate-400" />
              <span>{isAr ? 'تاريخ الانضمام: ' : 'Member since: '}</span>
              <strong className="text-charcoal font-semibold">
                {new Date(user.createdAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', { dateStyle: 'long' })}
              </strong>
            </span>
            <span>•</span>
            <span className="inline-flex items-center gap-1 text-emerald-800 font-semibold">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>{isAr ? 'حساب مزارع موثق' : 'Verified Farmer Account'}</span>
            </span>
          </div>

          <div className="pt-4 flex items-center justify-end">
            <button
              type="submit"
              disabled={saving}
              className="w-full sm:w-auto justify-center px-6 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-xs shadow-soft transition-all flex items-center gap-2 disabled:opacity-60 active:scale-[0.98]"
            >
              <Save className="w-4 h-4" />
              <span>{saving ? (isAr ? 'جارٍ الحفظ...' : 'Saving...') : (isAr ? 'حفظ التعديلات' : 'Save Changes')}</span>
            </button>
          </div>
        </form>
      </div>

      {/* 3. Danger Zone (Delete Account) */}
      <div className="bg-rose-50/70 rounded-2xl sm:rounded-3xl p-4 sm:p-8 border border-rose-200/80 space-y-4 shadow-soft">
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-rose-900 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{isAr ? 'منطقة الخطر: حذف الحساب' : 'Danger Zone: Account Deletion'}</span>
            </h3>
            <p className="text-xs text-rose-700 max-w-xl font-normal leading-relaxed">
              {isAr 
                ? 'عند حذف حسابك، سيتم حذف جميع بياناتك الشخصية، والمزارع المسجلة، والخطط المحفوظة، وسجل العمليات نهائياً وفق سياسة خصوصية البيانات.'
                : 'Deleting your account permanently removes all personal information, registered farms, saved plans, and audit history.'}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="w-full sm:w-auto justify-center px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-soft transition-all flex items-center gap-1.5 shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isAr ? 'طلب حذف الحساب' : 'Delete Account'}</span>
          </button>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-soft-xl border border-slate-200/80 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-2">
              <h3 className="font-bold text-base text-charcoal">
                {isAr ? 'هل أنت متأكد تماماً من حذف الحساب؟' : 'Permanently Delete Account?'}
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                {isAr 
                  ? 'هذا الإجراء نهائي ولا يمكن التراجع عنه. ستفقد إمكانية الوصول إلى جميع الخطط والمزارع المسجلة.'
                  : 'This action is irreversible. All your saved farm parameters and historical recommendations will be wiped.'}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="flex-1 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-sand"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={deleting}
                onClick={handleDeleteAccount}
                className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-soft disabled:opacity-60"
              >
                {deleting ? (isAr ? 'جارٍ الحذف...' : 'Deleting...') : (isAr ? 'نعم، حذف نهائي' : 'Yes, Delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
