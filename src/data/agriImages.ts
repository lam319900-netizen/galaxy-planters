/**
 * Curated Agricultural Photography & Visual Asset Registry
 * Provides high-resolution, context-accurate photography for all 30 crops,
 * landscapes, field operations, and graceful offline fallback handlers.
 */

import { 
  VERIFIED_CROP_IMAGES, 
  getCropSvgPlaceholder, 
  type CropImageRecord 
} from './cropImages';

export { 
  VERIFIED_CROP_IMAGES, 
  getCropSvgPlaceholder, 
  type CropImageRecord 
};

// Resilient SVG fallback generator for crop cards
export function getCropSvgFallback(cropName: string, category: string = 'crop'): string {
  return getCropSvgPlaceholder(cropName, category);
}

export const AGRI_HERO_IMAGES = {
  landscapeSunrise: 'https://images.unsplash.com/photo-1500937386664-56d1dfef3854?auto=format&fit=crop&w=1600&q=80', // Golden wheat at sunrise
  droneFieldParcel: 'https://images.unsplash.com/photo-1625246333195-78d9c38ad449?auto=format&fit=crop&w=1600&q=80', // Aerial farm parcels
  dripIrrigation: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&w=1200&q=80', // Modern precision irrigation
  centerPivotField: 'https://images.unsplash.com/photo-1563514227147-6d2ff665a6a0?auto=format&fit=crop&w=1200&q=80', // Center pivot field
  richSoilProfile: 'https://images.unsplash.com/photo-1592417817098-8f3d6910985c?auto=format&fit=crop&w=1200&q=80', // Soil agronomy inspection
  satelliteEarth: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80' // Earth observation & telemetry
};

// Curated crop photography registry mapping all 30 crops + fallow
export const CROP_IMAGES_MAP: Record<string, { imagePath?: string; url: string; secondaryUrl?: string; altEn: string; altAr: string }> = Object.entries(
  VERIFIED_CROP_IMAGES
).reduce((acc, [key, item]) => {
  acc[key] = {
    imagePath: item.imagePath,
    url: item.url,
    secondaryUrl: item.secondaryUrl,
    altEn: item.altEn,
    altAr: item.altAr
  };
  return acc;
}, {} as Record<string, { imagePath?: string; url: string; secondaryUrl?: string; altEn: string; altAr: string }>);

/**
 * Returns a high-res photo URL for any given crop, with reliable category fallback
 */
export function getCropImageUrl(cropId: string): string {
  if (VERIFIED_CROP_IMAGES[cropId]) {
    return VERIFIED_CROP_IMAGES[cropId].url;
  }
  return VERIFIED_CROP_IMAGES.wheat.url;
}
