import React from 'react';
import { useUnit } from '../context/UnitContext';
import { useLanguage } from '../context/LanguageContext';
import { Scale } from 'lucide-react';

interface UnitSwitcherProps {
  className?: string;
}

export const UnitSwitcher: React.FC<UnitSwitcherProps> = ({ className = '' }) => {
  const { unitSystem, setUnitSystem } = useUnit();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  return (
    <div className={`inline-flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl border border-slate-200 text-xs shadow-2xs ${className}`}>
      <span className="hidden sm:flex items-center gap-1 px-2 text-slate-500 font-semibold select-none">
        <Scale className="w-3.5 h-3.5 text-crop-600" />
        <span>{isAr ? 'الوحدة:' : 'Unit:'}</span>
      </span>

      <button
        type="button"
        onClick={() => setUnitSystem('ha')}
        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
          unitSystem === 'ha'
            ? 'bg-white text-crop-800 shadow-xs border border-slate-200'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        {isAr ? 'هكتار (ha / مم)' : 'Hectare (ha / mm)'}
      </button>

      <button
        type="button"
        onClick={() => setUnitSystem('feddan')}
        className={`px-2.5 py-1 rounded-lg font-bold transition-all ${
          unitSystem === 'feddan'
            ? 'bg-white text-crop-800 shadow-xs border border-slate-200'
            : 'text-slate-600 hover:text-slate-900'
        }`}
      >
        {isAr ? 'فدان (Feddan / م³)' : 'Feddan (Feddan / m³)'}
      </button>
    </div>
  );
};
