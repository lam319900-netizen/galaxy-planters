import React, { createContext, useContext, useState, useEffect } from 'react';
import { useLanguage } from './LanguageContext';

export type UnitSystem = 'ha' | 'feddan';

interface UnitContextType {
  unitSystem: UnitSystem;
  setUnitSystem: (unit: UnitSystem) => void;
  toggleUnitSystem: () => void;
  formatNitrogen: (kgPerHa: number) => { value: number; formatted: string; unitLabel: string };
  formatWater: (mm: number) => { value: number; formatted: string; unitLabel: string };
}

const UnitContext = createContext<UnitContextType | undefined>(undefined);

export const UnitProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { language } = useLanguage();
  const [unitSystem, setUnitSystemState] = useState<UnitSystem>(() => {
    const saved = localStorage.getItem('smartcrop_unit');
    return (saved === 'ha' || saved === 'feddan') ? saved : 'ha';
  });

  useEffect(() => {
    localStorage.setItem('smartcrop_unit', unitSystem);
  }, [unitSystem]);

  const setUnitSystem = (unit: UnitSystem) => {
    setUnitSystemState(unit);
  };

  const toggleUnitSystem = () => {
    setUnitSystemState(prev => (prev === 'ha' ? 'feddan' : 'ha'));
  };

  /**
   * Convert Nitrogen from kg/ha to kg/feddan
   * 1 Hectare = 2.381 Feddans => kg/feddan = kg/ha / 2.381
   */
  const formatNitrogen = (kgPerHa: number) => {
    const isAr = language === 'ar';
    if (unitSystem === 'feddan') {
      const val = Math.round(kgPerHa / 2.381);
      const sign = val > 0 ? '+' : '';
      const unitLabel = isAr ? 'كجم N/فدان' : 'kg N/feddan';
      return {
        value: val,
        formatted: `${sign}${val} ${unitLabel}`,
        unitLabel
      };
    } else {
      const sign = kgPerHa > 0 ? '+' : '';
      const unitLabel = isAr ? 'كجم N/هكتار' : 'kg N/ha';
      return {
        value: kgPerHa,
        formatted: `${sign}${kgPerHa} ${unitLabel}`,
        unitLabel
      };
    }
  };

  /**
   * Convert Water Requirement from mm depth to m³/feddan
   * 1 mm on 1 Feddan (4,200 m²) = 4.2 m³
   */
  const formatWater = (mm: number) => {
    const isAr = language === 'ar';
    if (unitSystem === 'feddan') {
      const m3 = Math.round(mm * 4.2);
      const unitLabel = isAr ? 'م³/فدان' : 'm³/feddan';
      return {
        value: m3,
        formatted: `${m3.toLocaleString()} ${unitLabel}`,
        unitLabel
      };
    } else {
      const unitLabel = isAr ? 'مم' : 'mm';
      return {
        value: mm,
        formatted: `${mm.toLocaleString()} ${unitLabel}`,
        unitLabel
      };
    }
  };

  return (
    <UnitContext.Provider value={{
      unitSystem,
      setUnitSystem,
      toggleUnitSystem,
      formatNitrogen,
      formatWater
    }}>
      {children}
    </UnitContext.Provider>
  );
};

export const useUnit = (): UnitContextType => {
  const context = useContext(UnitContext);
  if (!context) {
    throw new Error('useUnit must be used within a UnitProvider');
  }
  return context;
};
