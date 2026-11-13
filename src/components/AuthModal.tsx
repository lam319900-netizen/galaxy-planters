import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { dbService } from '../services/database';
import { GalaxyIcon } from './GalaxyLogo';
import { 
  X, 
  Lock, 
  Mail, 
  User, 
  MapPin, 
  Globe, 
  AlertCircle, 
  CheckCircle2, 
  ArrowRight, 
  ArrowLeft,
  Loader2,
  BookmarkCheck
} from 'lucide-react';

interface AuthModalProps {
  onPlanSavedRedirect?: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ onPlanSavedRedirect }) => {
  const { 
    isAuthModalOpen, 
    authModalMode, 
    closeAuthModal, 
    login, 
    register, 
    requestPasswordReset,
    pendingSavePlan,
    clearPendingSavePlan
  } = useAuth();

  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [mode, setMode] = useState<'login' | 'register' | 'forgot'>(authModalMode);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [country, setCountry] = useState(isAr ? 'مصر' : 'Egypt');
  const [city, setCity] = useState(isAr ? 'سوهاج' : 'Sohag');
  const [rememberMe, setRememberMe] = useState(true);

  if (!isAuthModalOpen) return null;

  const handleAuthSuccess = async () => {
    if (pendingSavePlan) {
      try {
        const currentUser = (await import('../services/auth')).authService.getCurrentUser();
        if (currentUser) {
          await dbService.createSavedPlan({
            userId: currentUser.id,
            farmName: pendingSavePlan.farmName || (isAr ? 'مزرعتي الرئيسية' : 'My Primary Farm'),
            planName: isAr 
              ? `خطة: ${pendingSavePlan.plan.titleAr}` 
              : `Plan: ${pendingSavePlan.plan.titleEn}`,
            planSnapshot: pendingSavePlan.plan,
            originalInputs: pendingSavePlan.input,
            soilDataSnapshot: pendingSavePlan.soil,
            climateDataSnapshot: pendingSavePlan.climate,
            recommendationVersion: 'v2.1-global-fao56'
          });
          clearPendingSavePlan();
          closeAuthModal();
          if (onPlanSavedRedirect) onPlanSavedRedirect();
          return;
        }
      } catch (e) {
        console.warn('Auto-save plan error after auth', e);
      }
    }
    closeAuthModal();
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await login(email, password, rememberMe);
      setSuccessMsg(isAr ? 'تم تسجيل الدخول بنجاح!' : 'Logged in successfully!');
      setTimeout(() => {
        handleAuthSuccess();
      }, 700);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(isAr ? 'بيانات الدخول غير صحيحة. يرجى التحقق من البريد وكلمة المرور.' : msg);
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      const res = await register({
        fullName,
        email,
        password,
        confirmPassword,
        country,
        city
      });

      if (res.requiresVerification) {
        setSuccessMsg(
          isAr 
            ? 'تم إنشاء الحساب بنجاح! يرجى مراجعة بريدك الإلكتروني لتأكيد التسجيل.' 
            : 'Registration complete! Please check your email to verify your account.'
        );
      } else {
        setSuccessMsg(isAr ? 'تم إنشاء الحساب بنجاح!' : 'Account registered successfully!');
        setTimeout(() => {
          handleAuthSuccess();
        }, 700);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleForgotSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setLoading(true);

    try {
      await requestPasswordReset(email);
      setSuccessMsg(
        isAr 
          ? 'إذا كان هذا البريد مسجلاً، فقد تم إرسال تعليمات إعادة تعيين كلمة المرور إليه.' 
          : 'If this email is registered, a password reset link has been dispatched.'
      );
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      setErrorMsg(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-forest-950/60 backdrop-blur-sm animate-fade-in font-sans overflow-y-auto">
      <div 
        className="relative w-full max-w-md bg-white rounded-2xl sm:rounded-3xl shadow-soft-xl border border-slate-200/80 overflow-hidden transform transition-all max-h-[92vh] flex flex-col my-auto"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header Ribbon */}
        <div className="bg-forest-950 p-4 sm:p-6 text-white relative border-b border-forest-800 shrink-0">
          <button
            onClick={closeAuthModal}
            className={`absolute top-4 ${isAr ? 'left-4' : 'right-4'} p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors`}
          >
            <X className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-forest-800/80 backdrop-blur-md flex items-center justify-center border border-forest-600/40 shadow-soft">
              <GalaxyIcon className="w-6 h-6 text-emerald-300" />
            </div>
            <div>
              <h3 className="font-bold text-xl text-white">
                {mode === 'login' 
                  ? (isAr ? 'تسجيل دخول المزارع' : 'Farmer Sign In')
                  : mode === 'register'
                  ? (isAr ? 'إنشاء حساب زراعي جديد' : 'New Farmer Account')
                  : (isAr ? 'استعادة كلمة المرور' : 'Reset Password')}
              </h3>
              <p className="text-xs text-forest-200 font-medium mt-0.5">
                {isAr ? 'منصة Galaxy Planters لإدارة الحقول والدورات الزراعية' : 'Galaxy Planters Field & Rotation Platform'}
              </p>
            </div>
          </div>

          {/* Pending Save Plan Notice Banner */}
          {pendingSavePlan && (
            <div className="mt-4 p-2.5 rounded-xl bg-forest-800/80 border border-forest-600/50 flex items-center gap-2 text-xs font-semibold text-forest-100">
              <BookmarkCheck className="w-4 h-4 shrink-0 text-sage-400" />
              <span>
                {isAr 
                  ? 'سجّل الدخول الآن لحفظ الخطة الزراعية المختارة في سجلك الدائم!'
                  : 'Sign in to save this selected plan to your permanent farm history!'}
              </span>
            </div>
          )}
        </div>

        {/* Tab Switcher */}
        {mode !== 'forgot' && (
          <div className="flex border-b border-slate-200/80 bg-sand/60">
            <button
              type="button"
              onClick={() => { setMode('login'); setErrorMsg(null); }}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold text-center border-b-2 transition-colors ${
                mode === 'login'
                  ? 'border-forest-600 text-forest-800 bg-white'
                  : 'border-transparent text-slate-500 hover:text-charcoal'
              }`}
            >
              {isAr ? 'تسجيل الدخول' : 'Sign In'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setErrorMsg(null); }}
              className={`flex-1 py-3 text-xs sm:text-sm font-bold text-center border-b-2 transition-colors ${
                mode === 'register'
                  ? 'border-forest-600 text-forest-800 bg-white'
                  : 'border-transparent text-slate-500 hover:text-charcoal'
              }`}
            >
              {isAr ? 'حساب جديد' : 'Register'}
            </button>
          </div>
        )}

        {/* Form Body */}
        <div className="p-4 sm:p-6 overflow-y-auto max-h-[calc(92vh-9rem)]">
          {errorMsg && (
            <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-rose-800 text-xs font-medium">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-2.5 text-emerald-800 text-xs font-medium">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {/* 1. LOGIN FORM */}
          {mode === 'login' && (
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className={`absolute top-2.5 ${isAr ? 'right-3' : 'left-3'} w-4 h-4 text-slate-400`} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="farmer@example.com"
                    className={`w-full ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-500`}
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-charcoal">
                    {isAr ? 'كلمة المرور' : 'Password'}
                  </label>
                  <button
                    type="button"
                    onClick={() => { setMode('forgot'); setErrorMsg(null); }}
                    className="text-xs text-forest-700 hover:text-forest-800 font-semibold"
                  >
                    {isAr ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                  </button>
                </div>
                <div className="relative">
                  <Lock className={`absolute top-2.5 ${isAr ? 'right-3' : 'left-3'} w-4 h-4 text-slate-400`} />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-500`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs text-slate-600">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={e => setRememberMe(e.target.checked)}
                    className="rounded text-forest-600 focus:ring-forest-500"
                  />
                  <span>{isAr ? 'تذكر جلستي على هذا الجهاز' : 'Remember my session'}</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-sm shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isAr ? 'جارٍ تسجيل الدخول...' : 'Signing in...'}</span>
                  </>
                ) : (
                  <span>{isAr ? 'تسجيل الدخول' : 'Sign In'}</span>
                )}
              </button>
            </form>
          )}

          {/* 2. REGISTRATION FORM */}
          {mode === 'register' && (
            <form onSubmit={handleRegisterSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  {isAr ? 'الاسم بالكامل' : 'Full Name'}
                </label>
                <div className="relative">
                  <User className={`absolute top-2.5 ${isAr ? 'right-3' : 'left-3'} w-4 h-4 text-slate-400`} />
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={e => setFullName(e.target.value)}
                    placeholder={isAr ? 'أحمد محمد العزازي' : 'Ahmed Mohamed'}
                    className={`w-full ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-1.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-500`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className={`absolute top-2.5 ${isAr ? 'right-3' : 'left-3'} w-4 h-4 text-slate-400`} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="farmer@example.com"
                    className={`w-full ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-1.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-500`}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    {isAr ? 'الدولة' : 'Country'}
                  </label>
                  <div className="relative">
                    <Globe className={`absolute top-2.5 ${isAr ? 'right-2.5' : 'left-2.5'} w-3.5 h-3.5 text-slate-400`} />
                    <input
                      type="text"
                      required
                      value={country}
                      onChange={e => setCountry(e.target.value)}
                      placeholder={isAr ? 'مصر' : 'Egypt'}
                      className={`w-full ${isAr ? 'pr-8 pl-2' : 'pl-8 pr-2'} py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-500`}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    {isAr ? 'المدينة / المحافظة' : 'City / Region'}
                  </label>
                  <div className="relative">
                    <MapPin className={`absolute top-2.5 ${isAr ? 'right-2.5' : 'left-2.5'} w-3.5 h-3.5 text-slate-400`} />
                    <input
                      type="text"
                      required
                      value={city}
                      onChange={e => setCity(e.target.value)}
                      placeholder={isAr ? 'سوهاج' : 'Sohag'}
                      className={`w-full ${isAr ? 'pr-8 pl-2' : 'pl-8 pr-2'} py-1.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-500`}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  {isAr ? 'كلمة المرور (8 أحرف على الأقل)' : 'Password (8+ chars)'}
                </label>
                <div className="relative">
                  <Lock className={`absolute top-2.5 ${isAr ? 'right-3' : 'left-3'} w-4 h-4 text-slate-400`} />
                  <input
                    type="password"
                    required
                    minLength={8}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-1.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-500`}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  {isAr ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                </label>
                <div className="relative">
                  <Lock className={`absolute top-2.5 ${isAr ? 'right-3' : 'left-3'} w-4 h-4 text-slate-400`} />
                  <input
                    type="password"
                    required
                    value={confirmPassword}
                    onChange={e => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className={`w-full ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-1.5 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-500`}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-sm shadow-soft transition-all flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98]"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>{isAr ? 'جارٍ إنشاء الحساب...' : 'Creating Account...'}</span>
                  </>
                ) : (
                  <span>{isAr ? 'إنشاء حساب جديد' : 'Create Account'}</span>
                )}
              </button>
            </form>
          )}

          {/* 3. FORGOT PASSWORD FORM */}
          {mode === 'forgot' && (
            <form onSubmit={handleForgotSubmit} className="space-y-4">
              <p className="text-xs text-slate-600 font-normal">
                {isAr 
                  ? 'أدخل بريدك الإلكتروني المسجل لإرسال رابط إعادة تعيين كلمة المرور.'
                  : 'Enter your registered email address to receive password reset instructions.'}
              </p>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  {isAr ? 'البريد الإلكتروني' : 'Email Address'}
                </label>
                <div className="relative">
                  <Mail className={`absolute top-2.5 ${isAr ? 'right-3' : 'left-3'} w-4 h-4 text-slate-400`} />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="farmer@example.com"
                    className={`w-full ${isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'} py-2 text-sm rounded-xl border border-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-500`}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => { setMode('login'); setErrorMsg(null); }}
                  className="px-4 py-2 rounded-xl border border-slate-300 hover:bg-sand text-charcoal text-xs font-semibold flex items-center gap-1"
                >
                  {isAr ? <ArrowRight className="w-3.5 h-3.5" /> : <ArrowLeft className="w-3.5 h-3.5" />}
                  <span>{isAr ? 'رجوع' : 'Back'}</span>
                </button>

                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-2 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-xs shadow-soft transition-all flex items-center justify-center gap-1 disabled:opacity-60 active:scale-[0.98]"
                >
                  {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                  <span>{isAr ? 'إرسال رابط التعيين' : 'Send Reset Link'}</span>
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
