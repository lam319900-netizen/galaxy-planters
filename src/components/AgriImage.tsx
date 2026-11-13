import React, { useState, useEffect } from 'react';
import { 
  VERIFIED_CROP_IMAGES, 
  getCropSvgPlaceholder, 
  type CropImageRecord 
} from '../data/cropImages';
import { CROP_IMAGES_MAP } from '../data/agriImages';

export interface AgriImageProps {
  cropId?: string;
  src?: string;
  secondarySrc?: string;
  alt: string;
  cropName?: string;
  category?: string;
  className?: string;
  aspectRatio?: 'video' | 'square' | '4/3' | 'wide' | 'auto';
  showCategoryBadge?: boolean;
}

/**
 * Resilient Crop Photography & Verified Agricultural Visual Component
 * Automatically resolves verified primary and secondary images for all 30 crops,
 * with lazy loading and neutral SVG vector placeholder fallback on network errors.
 */
export const AgriImage: React.FC<AgriImageProps> = ({
  cropId,
  src,
  secondarySrc,
  alt,
  cropName,
  category,
  className = '',
  aspectRatio = 'auto'
}) => {
  const verifiedRecord: CropImageRecord | undefined = cropId ? VERIFIED_CROP_IMAGES[cropId] : undefined;
  
  // Resolved category
  const resolvedCategory = category || verifiedRecord?.category || 'cereal';
  const resolvedName = cropName || verifiedRecord?.nameEn || (cropId ? cropId.replace('_', ' ') : 'Crop');

  // Multi-tier source candidates: Local high-speed asset -> Verified Remote CDN -> SVG vector fallback
  const localAsset = verifiedRecord?.imagePath;
  const primaryUrl = src || localAsset || verifiedRecord?.url || (cropId ? CROP_IMAGES_MAP[cropId]?.url : undefined);
  const backupUrl = secondarySrc || (localAsset ? verifiedRecord?.url : verifiedRecord?.secondaryUrl) || (cropId ? CROP_IMAGES_MAP[cropId]?.secondaryUrl : undefined);
  const fallbackSvg = getCropSvgPlaceholder(resolvedName, resolvedCategory);

  const [currentTier, setCurrentTier] = useState<'primary' | 'secondary' | 'svg'>('primary');
  const [isLoaded, setIsLoaded] = useState(false);

  // Reset state if cropId or src changes
  useEffect(() => {
    setCurrentTier('primary');
    setIsLoaded(false);
  }, [cropId, src]);

  const activeSrc = currentTier === 'primary' 
    ? (primaryUrl || backupUrl || fallbackSvg)
    : currentTier === 'secondary'
    ? (backupUrl || fallbackSvg)
    : fallbackSvg;

  const handleImageError = () => {
    if (currentTier === 'primary' && backupUrl && backupUrl !== primaryUrl) {
      setCurrentTier('secondary');
    } else {
      setCurrentTier('svg');
    }
  };

  const aspectClass = aspectRatio === 'auto' ? '' : {
    'video': 'aspect-video',
    'square': 'aspect-square',
    '4/3': 'aspect-[4/3]',
    'wide': 'aspect-[21/9]'
  }[aspectRatio];

  return (
    <div className={`relative overflow-hidden bg-sand/60 ${aspectClass} ${className}`}>
      {/* Loading Skeleton */}
      {!isLoaded && currentTier !== 'svg' && (
        <div className="absolute inset-0 animate-pulse bg-slate-200/60 z-0" />
      )}

      <img
        src={activeSrc}
        alt={alt || resolvedName}
        loading="lazy"
        decoding="async"
        onLoad={() => setIsLoaded(true)}
        onError={handleImageError}
        className={`w-full h-full object-cover transition-all duration-300 ${
          isLoaded || currentTier === 'svg' ? 'opacity-100 scale-100' : 'opacity-0 scale-105'
        }`}
      />
    </div>
  );
};

// Aliased export for direct semantic readability
export const CropImage = AgriImage;
