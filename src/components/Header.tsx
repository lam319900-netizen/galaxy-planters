import React, { useState, useRef, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useAuth } from '../context/AuthContext';
import type { NavigationTab } from '../types/platform';
import { GalaxyIcon } from './GalaxyLogo';
import { 
  Globe, 
  Satellite, 
  User, 
  LogOut, 
  FileText, 
  MapPin, 
  History, 
  LayoutDashboard,
  ChevronDown,
  ChevronRight,
  Menu,
  X,
  Compass,
  BookOpen,
  Bot
} from 'lucide-react';

interface HeaderProps {
  currentTab: NavigationTab;
  setCurrentTab: (tab: NavigationTab) => void;
  hasResults: boolean;
}

export const Header: React.FC<HeaderProps> = ({ currentTab, setCurrentTab, hasResults }) => {
  const { language, toggleLanguage, t } = useLanguage();
  const { user, isAuthenticated, logout, openAuthModal } = useAuth();
  const isAr = language === 'ar';

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleNavClick = (tab: NavigationTab) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
    setUserDropdownOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleLogout = async () => {
    await logout();
    setUserDropdownOpen(false);
    setCurrentTab('home');
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-[#EAECE4] transition-all" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Identity */}
          <div 
            onClick={() => handleNavClick(isAuthenticated ? 'dashboard' : 'home')}
            className="flex items-center gap-2.5 sm:gap-3.5 cursor-pointer group shrink-0 min-w-0"
          >
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-forest-700 text-white flex items-center justify-center shadow-soft-sm group-hover:bg-forest-800 transition-colors shrink-0">
              <GalaxyIcon className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-base sm:text-xl tracking-tight text-charcoal-900 group-hover:text-forest-700 transition-colors truncate">
                  {t('appName')}
                </span>
                <span className="hidden sm:inline-flex items-center gap-1 text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-full bg-forest-50 text-forest-700 border border-forest-200/70 shrink-0">
                  <Satellite className="w-3 h-3 text-forest-600" />
                  NASA POWER
                </span>
              </div>
              <p className="text-[11px] text-charcoal-400 font-medium hidden md:block truncate">
                {t('appSubtitle')} • {isAr ? 'المنصة العالمية للقرار الزراعي' : 'Global Agro-Decision Platform'}
              </p>
            </div>
          </div>

          {/* Desktop Navigation Links */}
          <nav className="hidden lg:flex items-center gap-1.5 bg-sand-100/70 p-1 rounded-xl border border-[#EAECE4]">
            {isAuthenticated ? (
              <>
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    currentTab === 'dashboard'
                      ? 'bg-white text-forest-800 shadow-soft-sm font-bold'
                      : 'text-charcoal-500 hover:text-charcoal-900 hover:bg-white/60'
                  }`}
                >
                  <LayoutDashboard className="w-3.5 h-3.5 text-forest-600" />
                  <span>{t('navDashboard')}</span>
                </button>

                <button
                  onClick={() => handleNavClick('plans')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    currentTab === 'plans'
                      ? 'bg-white text-forest-800 shadow-soft-sm font-bold'
                      : 'text-charcoal-500 hover:text-charcoal-900 hover:bg-white/60'
                  }`}
                >
                  <FileText className="w-3.5 h-3.5 text-sage-600" />
                  <span>{t('navPlans')}</span>
                </button>

                <button
                  onClick={() => handleNavClick('farms')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    currentTab === 'farms'
                      ? 'bg-white text-forest-800 shadow-soft-sm font-bold'
                      : 'text-charcoal-500 hover:text-charcoal-900 hover:bg-white/60'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5 text-amber-600" />
                  <span>{t('navFarms')}</span>
                </button>
              </>
            ) : (
              <button
                onClick={() => handleNavClick('home')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentTab === 'home'
                    ? 'bg-white text-forest-800 shadow-soft-sm font-bold'
                    : 'text-charcoal-500 hover:text-charcoal-900 hover:bg-white/60'
                }`}
              >
                {t('navHome')}
              </button>
            )}

            <button
              onClick={() => handleNavClick('assistant')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentTab === 'assistant'
                  ? 'bg-white text-forest-800 shadow-soft-sm font-bold'
                  : 'text-charcoal-500 hover:text-charcoal-900 hover:bg-white/60'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-emerald-600" />
              <span>{t('navAssistant')}</span>
              <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                AI
              </span>
            </button>

            <button
              onClick={() => handleNavClick('assessment')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentTab === 'assessment'
                  ? 'bg-white text-forest-800 shadow-soft-sm font-bold'
                  : 'text-charcoal-500 hover:text-charcoal-900 hover:bg-white/60'
              }`}
            >
              <Compass className="w-3.5 h-3.5 text-forest-600" />
              <span>{t('navAssessment')}</span>
            </button>

            <button
              onClick={() => handleNavClick('results')}
              disabled={!hasResults}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all relative ${
                !hasResults
                  ? 'text-charcoal-300 cursor-not-allowed'
                  : currentTab === 'results'
                  ? 'bg-white text-forest-800 shadow-soft-sm font-bold'
                  : 'text-charcoal-500 hover:text-charcoal-900 hover:bg-white/60'
              }`}
            >
              {t('navResults')}
              {hasResults && (
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-forest-600 ring-2 ring-white" />
              )}
            </button>

            <button
              onClick={() => handleNavClick('methodology')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                currentTab === 'methodology'
                  ? 'bg-white text-forest-800 shadow-soft-sm font-bold'
                  : 'text-charcoal-500 hover:text-charcoal-900 hover:bg-white/60'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5 text-charcoal-400" />
              <span>{t('navMethodology')}</span>
            </button>
          </nav>

          {/* Right Controls: Language Switcher, User/Auth & Hamburger Menu */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Desktop Language Switcher */}
            <button
              onClick={toggleLanguage}
              title={t('switchLangPrompt')}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[#EAECE4] bg-white hover:bg-sand-50 text-charcoal-700 text-xs font-semibold transition-all shadow-soft-sm active:scale-95"
            >
              <Globe className="w-3.5 h-3.5 text-forest-700" />
              <span className="font-bold">{language === 'en' ? 'العربية' : 'English'}</span>
              <span className="text-[10px] px-1 py-0.2 rounded bg-sand-200 text-charcoal-600 font-mono">
                {language === 'en' ? 'AR' : 'EN'}
              </span>
            </button>

            {/* Mobile Language Switcher Quick Pill */}
            <button
              onClick={toggleLanguage}
              title={t('switchLangPrompt')}
              className="flex sm:hidden items-center gap-1 px-2.5 py-1.5 rounded-xl border border-[#EAECE4] bg-white hover:bg-sand-50 text-charcoal-700 text-xs font-bold transition-all shadow-2xs active:scale-95"
            >
              <Globe className="w-3.5 h-3.5 text-forest-700" />
              <span>{language === 'en' ? 'عربي' : 'EN'}</span>
            </button>

            {/* User Profile or Guest Auth Buttons */}
            {isAuthenticated && user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="flex items-center gap-2 py-1 px-2 sm:px-2.5 rounded-xl border border-[#EAECE4] hover:border-forest-300 bg-white hover:bg-sand-50 transition-all shadow-soft-sm"
                >
                  <div className="w-7 h-7 rounded-lg bg-forest-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                    {user.profileImage || '🌾'}
                  </div>
                  <div className="hidden sm:block text-start">
                    <span className="text-xs font-bold text-charcoal-900 block truncate max-w-[100px]">
                      {user.fullName}
                    </span>
                    <span className="text-[10px] text-charcoal-400 block truncate max-w-[100px]">
                      {user.city || user.country}
                    </span>
                  </div>
                  <ChevronDown className="w-3.5 h-3.5 text-charcoal-400 hidden sm:block" />
                </button>

                {/* Dropdown Menu */}
                {userDropdownOpen && (
                  <div className={`absolute top-full mt-2 ${isAr ? 'left-0' : 'right-0'} w-56 bg-white rounded-2xl shadow-soft-lg border border-[#EAECE4] py-1.5 z-50 animate-fade-in`}>
                    <div className="px-4 py-3 border-b border-[#EAECE4]/60">
                      <p className="text-xs font-extrabold text-charcoal-900 truncate">{user.fullName}</p>
                      <p className="text-[11px] text-charcoal-400 truncate">{user.email}</p>
                    </div>

                    <div className="py-1">
                      <button
                        onClick={() => handleNavClick('dashboard')}
                        className="w-full px-4 py-2 text-start text-xs font-semibold text-charcoal-700 hover:bg-forest-50 hover:text-forest-800 flex items-center gap-2"
                      >
                        <LayoutDashboard className="w-4 h-4 text-forest-600" />
                        <span>{t('navDashboard')}</span>
                      </button>

                      <button
                        onClick={() => handleNavClick('plans')}
                        className="w-full px-4 py-2 text-start text-xs font-semibold text-charcoal-700 hover:bg-forest-50 hover:text-forest-800 flex items-center gap-2"
                      >
                        <FileText className="w-4 h-4 text-sage-600" />
                        <span>{t('navPlans')}</span>
                      </button>

                      <button
                        onClick={() => handleNavClick('farms')}
                        className="w-full px-4 py-2 text-start text-xs font-semibold text-charcoal-700 hover:bg-forest-50 hover:text-forest-800 flex items-center gap-2"
                      >
                        <MapPin className="w-4 h-4 text-amber-600" />
                        <span>{t('navFarms')}</span>
                      </button>

                      <button
                        onClick={() => handleNavClick('assistant')}
                        className="w-full px-4 py-2 text-start text-xs font-semibold text-charcoal-700 hover:bg-forest-50 hover:text-forest-800 flex items-center gap-2"
                      >
                        <Bot className="w-4 h-4 text-emerald-600" />
                        <span>{t('navAssistant')}</span>
                      </button>

                      <button
                        onClick={() => handleNavClick('history')}
                        className="w-full px-4 py-2 text-start text-xs font-semibold text-charcoal-700 hover:bg-forest-50 hover:text-forest-800 flex items-center gap-2"
                      >
                        <History className="w-4 h-4 text-charcoal-500" />
                        <span>{t('navHistory')}</span>
                      </button>

                      <button
                        onClick={() => handleNavClick('profile')}
                        className="w-full px-4 py-2 text-start text-xs font-semibold text-charcoal-700 hover:bg-forest-50 hover:text-forest-800 flex items-center gap-2"
                      >
                        <User className="w-4 h-4 text-forest-600" />
                        <span>{t('navProfile')}</span>
                      </button>
                    </div>

                    <div className="pt-1 border-t border-[#EAECE4]/60">
                      <button
                        onClick={handleLogout}
                        className="w-full px-4 py-2 text-start text-xs font-bold text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        <span>{t('navLogout')}</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="hidden sm:flex items-center gap-2">
                <button
                  onClick={() => openAuthModal('login')}
                  className="px-3 py-1.5 text-xs font-bold text-forest-700 hover:text-forest-800 hover:bg-forest-50/70 rounded-xl transition-colors"
                >
                  {t('navLogin')}
                </button>
                <button
                  onClick={() => openAuthModal('register')}
                  className="px-3.5 py-1.5 text-xs font-bold bg-forest-700 hover:bg-forest-800 text-white rounded-xl shadow-soft-sm transition-all active:scale-95"
                >
                  {t('navRegister')}
                </button>
              </div>
            )}

            {/* Mobile Hamburger Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              className="lg:hidden p-2 rounded-xl text-charcoal-700 hover:text-charcoal-900 hover:bg-sand-100 border border-[#EAECE4] transition-colors"
            >
              {mobileMenuOpen ? <X className="w-5 h-5 text-forest-800" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Overlay Backdrop & Container */}
      {mobileMenuOpen && (
        <>
          <div 
            onClick={() => setMobileMenuOpen(false)}
            className="fixed inset-0 top-20 z-40 bg-forest-950/40 backdrop-blur-xs lg:hidden animate-fade-in"
          />

          <div 
            className="fixed inset-x-0 top-20 z-50 bg-white border-b border-[#EAECE4] shadow-soft-2xl max-h-[calc(100vh-5rem)] overflow-y-auto px-4 py-4 space-y-4 lg:hidden animate-fade-in"
            dir={isAr ? 'rtl' : 'ltr'}
          >
            {/* User Profile or Guest Login Cards in Drawer */}
            {isAuthenticated && user ? (
              <div className="p-3.5 rounded-2xl bg-forest-50/80 border border-forest-200/70 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-forest-700 text-white flex items-center justify-center font-bold text-sm shrink-0">
                    {user.profileImage || '🌾'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-extrabold text-charcoal-900 truncate">{user.fullName}</p>
                    <p className="text-[11px] text-charcoal-500 truncate">{user.city || user.country}</p>
                  </div>
                </div>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-rose-50 text-rose-600 border border-rose-200 text-xs font-bold transition-colors shrink-0"
                >
                  {t('navLogout')}
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pb-2">
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('login');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl border border-forest-600 text-forest-800 font-bold text-xs bg-white hover:bg-forest-50 transition-colors text-center"
                >
                  {t('navLogin')}
                </button>
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    openAuthModal('register');
                  }}
                  className="w-full py-2.5 px-3 rounded-xl bg-forest-700 hover:bg-forest-800 text-white font-bold text-xs shadow-soft transition-all text-center"
                >
                  {t('navRegister')}
                </button>
              </div>
            )}

            {/* Authenticated Fast Navigation Grid */}
            {isAuthenticated && (
              <div className="grid grid-cols-2 gap-2 pb-2 border-b border-[#EAECE4]/80">
                <button
                  onClick={() => handleNavClick('dashboard')}
                  className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    currentTab === 'dashboard' ? 'bg-forest-700 text-white shadow-soft' : 'bg-sand-50 text-charcoal-700 hover:bg-sand-100'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 shrink-0" />
                  <span className="truncate">{t('navDashboard')}</span>
                </button>
                <button
                  onClick={() => handleNavClick('plans')}
                  className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    currentTab === 'plans' ? 'bg-forest-700 text-white shadow-soft' : 'bg-sand-50 text-charcoal-700 hover:bg-sand-100'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0" />
                  <span className="truncate">{t('navPlans')}</span>
                </button>
                <button
                  onClick={() => handleNavClick('farms')}
                  className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    currentTab === 'farms' ? 'bg-forest-700 text-white shadow-soft' : 'bg-sand-50 text-charcoal-700 hover:bg-sand-100'
                  }`}
                >
                  <MapPin className="w-4 h-4 shrink-0" />
                  <span className="truncate">{t('navFarms')}</span>
                </button>
                <button
                  onClick={() => handleNavClick('history')}
                  className={`p-2.5 rounded-xl text-xs font-bold flex items-center gap-2 transition-all ${
                    currentTab === 'history' ? 'bg-forest-700 text-white shadow-soft' : 'bg-sand-50 text-charcoal-700 hover:bg-sand-100'
                  }`}
                >
                  <History className="w-4 h-4 shrink-0" />
                  <span className="truncate">{t('navHistory')}</span>
                </button>
              </div>
            )}

            {/* Core Section Links */}
            <div className="space-y-1">
              {!isAuthenticated && (
                <button
                  onClick={() => handleNavClick('home')}
                  className={`w-full p-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    currentTab === 'home' ? 'bg-forest-50 text-forest-800' : 'text-charcoal-700 hover:bg-sand-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <GalaxyIcon className="w-4 h-4 text-forest-700" />
                    <span>{t('navHome')}</span>
                  </span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 ${isAr ? 'rotate-180' : ''}`} />
                </button>
              )}

              <button
                onClick={() => handleNavClick('assistant')}
                className={`w-full p-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                  currentTab === 'assistant' ? 'bg-forest-50 text-forest-800' : 'text-charcoal-700 hover:bg-sand-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Bot className="w-4 h-4 text-emerald-600" />
                  <span>{t('navAssistant')}</span>
                  <span className="px-1.5 py-0.2 text-[9px] font-bold rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                    AI
                  </span>
                </span>
                <ChevronRight className={`w-4 h-4 text-slate-400 ${isAr ? 'rotate-180' : ''}`} />
              </button>

              <button
                onClick={() => handleNavClick('assessment')}
                className={`w-full p-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                  currentTab === 'assessment' ? 'bg-forest-50 text-forest-800' : 'text-charcoal-700 hover:bg-sand-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <Compass className="w-4 h-4 text-forest-600" />
                  <span>{t('navAssessment')}</span>
                </span>
                <ChevronRight className={`w-4 h-4 text-slate-400 ${isAr ? 'rotate-180' : ''}`} />
              </button>

              {hasResults && (
                <button
                  onClick={() => handleNavClick('results')}
                  className={`w-full p-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    currentTab === 'results' ? 'bg-forest-50 text-forest-800' : 'text-charcoal-700 hover:bg-sand-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <FileText className="w-4 h-4 text-forest-600" />
                    <span>{t('navResults')}</span>
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-forest-600 text-white text-[10px] font-bold">Active</span>
                </button>
              )}

              <button
                onClick={() => handleNavClick('methodology')}
                className={`w-full p-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                  currentTab === 'methodology' ? 'bg-forest-50 text-forest-800' : 'text-charcoal-700 hover:bg-sand-50'
                }`}
              >
                <span className="flex items-center gap-2.5">
                  <BookOpen className="w-4 h-4 text-charcoal-500" />
                  <span>{t('navMethodology')}</span>
                </span>
                <ChevronRight className={`w-4 h-4 text-slate-400 ${isAr ? 'rotate-180' : ''}`} />
              </button>

              {isAuthenticated && (
                <button
                  onClick={() => handleNavClick('profile')}
                  className={`w-full p-3 rounded-xl text-xs font-bold flex items-center justify-between transition-all ${
                    currentTab === 'profile' ? 'bg-forest-50 text-forest-800' : 'text-charcoal-700 hover:bg-sand-50'
                  }`}
                >
                  <span className="flex items-center gap-2.5">
                    <User className="w-4 h-4 text-forest-600" />
                    <span>{t('navProfile')}</span>
                  </span>
                  <ChevronRight className={`w-4 h-4 text-slate-400 ${isAr ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>

            {/* Language Switcher Bar inside Drawer */}
            <div className="pt-2 border-t border-[#EAECE4]/80">
              <button
                onClick={toggleLanguage}
                className="w-full py-2.5 px-3 rounded-xl bg-sand-100/70 hover:bg-sand-200/70 border border-[#EAECE4] text-charcoal-800 text-xs font-bold flex items-center justify-between transition-colors"
              >
                <span className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-forest-700" />
                  <span>{language === 'en' ? 'التحويل إلى اللغة العربية' : 'Switch to English'}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-white text-forest-800 font-mono font-bold shadow-2xs border border-slate-200">
                  {language === 'en' ? 'العربية' : 'EN'}
                </span>
              </button>
            </div>
          </div>
        </>
      )}
    </header>
  );
};
