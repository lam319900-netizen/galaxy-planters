import React from 'react';

interface GalaxyLogoProps {
  className?: string;
  iconClassName?: string;
  showText?: boolean;
  textColor?: string;
}

/**
 * Galaxy Planters Official Emblem & Brand Icon
 * Unites celestial planetary orbits with agricultural crop vitality.
 */
export const GalaxyIcon: React.FC<{ className?: string }> = ({ className = 'w-6 h-6' }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
    aria-hidden="true"
  >
    {/* Celestial orbit ellipse */}
    <ellipse 
      cx="12" 
      cy="12" 
      rx="9.5" 
      ry="4" 
      stroke="currentColor" 
      strokeWidth="1.6" 
      strokeDasharray="3 2" 
      transform="rotate(-28 12 12)" 
      opacity="0.8" 
    />
    
    {/* Satellite / distant celestial body */}
    <circle cx="20" cy="7" r="1.5" fill="currentColor" opacity="0.95" />
    
    {/* Central seedling stem */}
    <path 
      d="M12 21V11" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
    />
    
    {/* Left leaf blade */}
    <path 
      d="M12 15C12 11 8.5 9 6.5 9.5C6.5 12.5 9 15.5 12 16Z" 
      fill="currentColor" 
      fillOpacity="0.85" 
      stroke="currentColor" 
      strokeWidth="1.2" 
      strokeLinejoin="round" 
    />
    
    {/* Right leaf blade */}
    <path 
      d="M12 13C12 9.5 15.5 8 17.5 8.5C17.5 11.5 15 14 12 14.5Z" 
      fill="currentColor" 
      fillOpacity="0.6" 
      stroke="currentColor" 
      strokeWidth="1.2" 
      strokeLinejoin="round" 
    />
  </svg>
);

export const GalaxyLogo: React.FC<GalaxyLogoProps> = ({
  className = '',
  iconClassName = 'w-5 h-5',
  showText = false,
  textColor = 'text-charcoal-900'
}) => {
  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      <div className="w-10 h-10 rounded-xl bg-forest-700 text-emerald-300 flex items-center justify-center shadow-soft-sm transition-transform group-hover:scale-105">
        <GalaxyIcon className={iconClassName} />
      </div>
      {showText && (
        <span className={`font-extrabold text-xl tracking-tight ${textColor}`}>
          Galaxy Planters
        </span>
      )}
    </div>
  );
};
