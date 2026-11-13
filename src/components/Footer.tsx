import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import { GalaxyIcon } from './GalaxyLogo';
import { ShieldAlert, Award, Globe2 } from 'lucide-react';

export const Footer: React.FC = () => {
  const { language, t } = useLanguage();

  return (
    <footer className="bg-forest-950 text-slate-300 text-sm border-t border-forest-900 mt-16 sm:mt-20 no-print font-sans w-full max-w-full overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pb-8 border-b border-forest-800/80">
          
          {/* Col 1: Project Identity */}
          <div className="space-y-3">
            <div className="flex items-center gap-2.5 text-white">
              <div className="w-8 h-8 rounded-xl bg-forest-600 flex items-center justify-center text-white shadow-soft">
                <GalaxyIcon className="w-5 h-5 text-emerald-300" />
              </div>
              <span className="font-bold text-lg tracking-tight">Galaxy Planters</span>
            </div>
            <p className="text-xs text-slate-300/80 leading-relaxed font-normal">
              {t('tagline')}
            </p>
            <div className="flex items-center gap-2 pt-2 flex-wrap">
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-sage-300 bg-forest-900/80 border border-forest-700/80 px-2.5 py-0.5 rounded-md">
                <Award className="w-3 h-3 text-sage-400" />
                NASA Hackathon Project
              </span>
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-forest-200 bg-forest-900/80 border border-forest-700/80 px-2.5 py-0.5 rounded-md">
                <Globe2 className="w-3 h-3 text-forest-300" />
                {language === 'ar' ? 'تغطية زراعية عالمية' : 'Global Agriculture'}
              </span>
            </div>
          </div>

          {/* Col 2: Scientific Data Sources */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-white uppercase tracking-wider">
              {t('footerCredits')}
            </h4>
            <ul className="text-xs space-y-1.5 text-slate-300/80 font-normal">
              <li>• <strong className="text-white">NASA POWER Project:</strong> Surface meteorology & solar irradiance (Daily Point AG API).</li>
              <li>• <strong className="text-white">ISRIC SoilGrids 250m:</strong> Spatial soil property prediction and physical attributes.</li>
              <li>• <strong className="text-white">Agricultural Research Institutes:</strong> FAO, ICARDA, IRRI, ICRISAT, and ARC agronomic bulletins.</li>
              <li>• <strong className="text-white">FAO Irrigation Paper 56 & 29:</strong> Crop evapotranspiration calculations and water salinity guidelines.</li>
            </ul>
          </div>

          {/* Col 3: Agronomic Advisory Disclaimer */}
          <div className="space-y-2">
            <h4 className="text-xs font-bold text-amber-400 flex items-center gap-1.5 uppercase tracking-wider">
              <ShieldAlert className="w-4 h-4 text-amber-400" />
              <span>{t('disclaimerTitle')}</span>
            </h4>
            <p className="text-xs text-slate-300/80 leading-relaxed font-normal">
              {t('footerDisclaimer')}
            </p>
          </div>

        </div>

        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-400 gap-4 text-center sm:text-start">
          <p>© {new Date().getFullYear()} Galaxy Planters. Intelligent Agricultural Decision Support Platform.</p>
          <p className="font-mono text-[11px] text-slate-400">
            Worldwide Coverage • 30 Scientific Crop Models • 2-Year Multi-Season Succession
          </p>
        </div>
      </div>
    </footer>
  );
};
