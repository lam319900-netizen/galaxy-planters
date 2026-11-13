import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useLanguage } from '../context/LanguageContext';
import { Navigation, Crosshair, Search, Globe, Loader2 } from 'lucide-react';

interface InteractiveMapProps {
  latitude: number;
  longitude: number;
  onLocationChange: (lat: number, lon: number, locationName?: string) => void;
  locationName?: string;
  height?: string;
  interactive?: boolean;
  className?: string;
}

// Custom modern SVG marker icon using Leaflet's divIcon
function createActivePinIcon() {
  const color = '#15803d'; // Emerald green
  const pulseColor = 'rgba(21, 128, 61, 0.4)';

  return L.divIcon({
    className: 'custom-leaflet-marker',
    html: `
      <div style="position: relative; width: 34px; height: 42px; display: flex; align-items: center; justify-content: center;">
        <div style="position: absolute; width: 28px; height: 28px; border-radius: 50%; background: ${pulseColor}; animation: marker-pulse 2s infinite ease-out; transform: translateY(-8px);"></div>
        <svg width="34" height="42" viewBox="0 0 24 30" fill="none" xmlns="http://www.w3.org/2000/svg" style="filter: drop-shadow(0 4px 6px rgba(0,0,0,0.35));">
          <path d="M12 0C5.37258 0 0 5.37258 0 12C0 19.5 12 30 12 30C12 30 24 19.5 24 12C24 5.37258 18.6274 0 12 0Z" fill="${color}"/>
          <circle cx="12" cy="11" r="5" fill="white"/>
        </svg>
      </div>
    `,
    iconSize: [34, 42],
    iconAnchor: [17, 40],
    popupAnchor: [0, -36]
  });
}

// Major agricultural biome presets for rapid global exploration
const GLOBAL_BIOME_PRESETS = [
  { nameEn: 'Upper Egypt (Arid)', nameAr: 'صعيد مصر (جاف)', lat: 26.55, lon: 31.70, zoom: 9 },
  { nameEn: 'Northern Europe (Temperate)', nameAr: 'شمال أوروبا (معتدل بارد)', lat: 52.00, lon: 9.00, zoom: 7 },
  { nameEn: 'Mediterranean Basin', nameAr: 'حوض البحر المتوسط', lat: 38.00, lon: 14.00, zoom: 7 },
  { nameEn: 'Tropical Monsoon (Asia)', nameAr: 'استوائي موسمي (آسيا)', lat: 8.00, lon: 105.00, zoom: 7 },
  { nameEn: 'North America (Corn Belt)', nameAr: 'أمريكا الشمالية (نطاق الحبوب)', lat: 41.50, lon: -93.50, zoom: 7 },
];

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  latitude,
  longitude,
  onLocationChange,
  locationName,
  height = '380px',
  interactive = true,
  className = ''
}) => {
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const activeMarkerRef = useRef<L.Marker | null>(null);

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searching, setSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [gpsLoading, setGpsLoading] = useState<boolean>(false);
  const [gpsError, setGpsError] = useState<string | null>(null);

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: [latitude, longitude],
      zoom: 6,
      zoomControl: false,
      attributionControl: true
    });

    // Clean OpenStreetMap tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);

    // Zoom control positioned bottom-right above coordinates bar
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Map Click Listener anywhere worldwide
    if (interactive) {
      map.on('click', (e: L.LeafletMouseEvent) => {
        const { lat, lng } = e.latlng;
        // Normalize longitude [-180, 180]
        const normalizedLng = ((((lng + 180) % 360) + 360) % 360) - 180;
        onLocationChange(Number(lat.toFixed(4)), Number(normalizedLng.toFixed(4)), undefined);
      });
    }

    mapInstanceRef.current = map;

    let resizeObserver: ResizeObserver | null = null;
    if (mapContainerRef.current && typeof ResizeObserver !== 'undefined') {
      resizeObserver = new ResizeObserver(() => {
        map.invalidateSize();
      });
      resizeObserver.observe(mapContainerRef.current);
    }

    const timer = setTimeout(() => {
      map.invalidateSize();
    }, 200);

    return () => {
      clearTimeout(timer);
      resizeObserver?.disconnect();
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Sync active marker and center
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (activeMarkerRef.current) {
      activeMarkerRef.current.setLatLng([latitude, longitude]);
    } else {
      const marker = L.marker([latitude, longitude], {
        icon: createActivePinIcon(),
        zIndexOffset: 1000
      }).addTo(map);

      activeMarkerRef.current = marker;
    }

    const popupContent = `<strong>${locationName || (isAr ? 'الموقع المختار' : 'Selected Location')}</strong><br/><span style="font-size:11px; color:#64748b;">${latitude.toFixed(4)}°N, ${longitude.toFixed(4)}°E</span>`;
    activeMarkerRef.current.bindPopup(popupContent);

    map.panTo([latitude, longitude], { animate: true, duration: 0.8 });
  }, [latitude, longitude, locationName, isAr]);

  // Global Geocoding Search Handler
  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;

    setSearching(true);
    setSearchError(null);

    // Check if user entered manual coordinates e.g. "48.85, 2.35"
    const coordMatch = searchQuery.match(/^(-?\d+(\.\d+)?)\s*,\s*(-?\d+(\.\d+)?)$/);
    if (coordMatch) {
      const lat = parseFloat(coordMatch[1]);
      const lon = parseFloat(coordMatch[3]);
      if (lat >= -90 && lat <= 90 && lon >= -180 && lon <= 180) {
        setSearching(false);
        onLocationChange(lat, lon, `Coordinates (${lat.toFixed(2)}°, ${lon.toFixed(2)}°)`);
        mapInstanceRef.current?.flyTo([lat, lon], 8, { duration: 1.2 });
        return;
      }
    }

    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`;
      const res = await fetch(url, {
        headers: {
          'Accept': 'application/json'
        }
      });

      if (!res.ok) {
        throw new Error('Geocoding service unavailable');
      }

      const results = await res.json();
      if (results && results.length > 0) {
        const item = results[0];
        const lat = parseFloat(item.lat);
        const lon = parseFloat(item.lon);
        const placeName = item.display_name.split(',').slice(0, 2).join(', ');

        onLocationChange(Number(lat.toFixed(4)), Number(lon.toFixed(4)), placeName);
        mapInstanceRef.current?.flyTo([lat, lon], 9, { duration: 1.2 });
      } else {
        setSearchError(isAr ? 'لم يتم العثور على نتائج للموقع المطلوب.' : 'No locations found for this query.');
      }
    } catch (_err) {
      setSearchError(isAr ? 'تعذر الاتصال بخدمة البحث الجغرافي. يرجى إدخال الإحداثيات يدوياً.' : 'Could not reach search service. You can enter coordinates manually.');
    } finally {
      setSearching(false);
    }
  };

  // GPS Location Handler
  const handleUseGps = () => {
    if (!navigator.geolocation) {
      setGpsError(isAr ? 'خاصية تحديد الموقع غير مدعومة في متصفحك.' : 'Geolocation is not supported by your browser.');
      return;
    }

    setGpsLoading(true);
    setGpsError(null);

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGpsLoading(false);
        const lat = position.coords.latitude;
        const lon = position.coords.longitude;
        onLocationChange(Number(lat.toFixed(4)), Number(lon.toFixed(4)), isAr ? 'موقعي الحالي (GPS)' : 'My GPS Location');
        mapInstanceRef.current?.flyTo([lat, lon], 10, { duration: 1.2 });
      },
      (error) => {
        setGpsLoading(false);
        setGpsError(isAr ? 'تعذر الوصول للموقع الجغرافي. يرجى تفعيل إذن الموقع.' : 'Could not access GPS location. Please check browser permissions.');
        console.warn('Geolocation error:', error);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden border border-slate-200 shadow-inner bg-slate-100 ${className}`}>
      
      {/* Map Search & Control Header Bar */}
      <div className="absolute top-2.5 sm:top-3 left-2.5 sm:left-3 right-2.5 sm:right-3 z-[400] flex flex-row items-center justify-between gap-1.5 sm:gap-2 pointer-events-none">
        
        {/* Search Bar */}
        <form onSubmit={handleSearch} className="flex items-center gap-1.5 bg-white/95 backdrop-blur-md p-1 sm:p-1.5 rounded-xl border border-slate-200/90 shadow-md text-xs pointer-events-auto flex-1 min-w-0">
          <Search className="w-3.5 h-3.5 text-slate-400 shrink-0 ms-1" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={isAr ? 'ابحث عن مدينة، دولة، أو إقليم...' : 'Search city, country, region...'}
            className="flex-1 min-w-0 bg-transparent border-none text-slate-800 text-xs focus:ring-0 focus:outline-none placeholder:text-slate-400 truncate"
          />
          <button
            type="submit"
            disabled={searching}
            className="px-2.5 sm:px-3 py-1 sm:py-1.5 bg-crop-600 hover:bg-crop-500 text-white font-bold rounded-lg transition-all flex items-center gap-1 disabled:opacity-50 shrink-0 text-xs"
          >
            {searching ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <span>{isAr ? 'بحث' : 'Search'}</span>}
          </button>
        </form>

        {/* GPS Button */}
        <div className="flex items-center pointer-events-auto shrink-0">
          <button
            type="button"
            onClick={handleUseGps}
            disabled={gpsLoading}
            title={isAr ? 'استخدم موقعي الحالي (GPS)' : 'Use My GPS Location'}
            className="flex items-center gap-1 px-2.5 py-1.5 sm:py-2 rounded-xl bg-white/95 hover:bg-white text-slate-800 font-bold border border-slate-200/90 shadow-md backdrop-blur-md transition-all active:scale-95 disabled:opacity-50 text-xs shrink-0"
          >
            <Navigation className={`w-3.5 h-3.5 text-crop-600 ${gpsLoading ? 'animate-spin' : ''}`} />
            <span className="hidden xs:inline">{gpsLoading ? (isAr ? 'تحديد...' : 'Locating...') : (isAr ? 'موقعي' : 'GPS')}</span>
          </button>
        </div>

      </div>

      {/* Map Container */}
      <div 
        ref={mapContainerRef} 
        style={{ height, width: '100%' }}
        className="z-0"
      />

      {/* Global Presets Pill Row (Quick Continent Explorers) */}
      <div className="absolute bottom-11 left-2.5 sm:left-3 right-2.5 sm:right-3 z-[400] hidden sm:flex items-center gap-1.5 overflow-x-auto p-1 bg-white/90 backdrop-blur-md rounded-xl border border-slate-200/90 shadow-sm text-[11px] scrollbar-none">
        <span className="flex items-center gap-1 text-slate-500 font-bold px-1.5 shrink-0 select-none">
          <Globe className="w-3.5 h-3.5 text-crop-600" />
          <span>{isAr ? 'أقاليم استكشاف سريعة:' : 'Quick Regional Jumps:'}</span>
        </span>
        {GLOBAL_BIOME_PRESETS.map((preset, idx) => (
          <button
            key={idx}
            type="button"
            onClick={() => {
              onLocationChange(preset.lat, preset.lon, isAr ? preset.nameAr : preset.nameEn);
              mapInstanceRef.current?.flyTo([preset.lat, preset.lon], preset.zoom, { duration: 1.0 });
            }}
            className="px-2 py-1 rounded-md bg-slate-100 hover:bg-crop-50 hover:text-crop-800 text-slate-700 font-medium whitespace-nowrap transition-colors border border-slate-200/60"
          >
            {isAr ? preset.nameAr : preset.nameEn}
          </button>
        ))}
      </div>

      {/* Map Helper Pill in Bottom */}
      <div className="absolute bottom-2 left-2.5 sm:left-3 right-2.5 sm:right-3 z-[400] bg-slate-900/90 backdrop-blur-md text-white px-2.5 sm:px-3 py-1.5 rounded-xl text-[10px] sm:text-[11px] font-medium shadow-md flex items-center justify-between gap-2 pointer-events-none">
        <span className="flex items-center gap-1.5 truncate">
          <Crosshair className="w-3.5 h-3.5 text-crop-400 shrink-0" />
          <span className="truncate">{isAr ? 'انقر على الخريطة لتحديد موقع المزرعة' : 'Click map to pin farm location'}</span>
        </span>
        <span className="font-mono text-crop-300 font-bold shrink-0">
          {latitude.toFixed(2)}°, {longitude.toFixed(2)}°
        </span>
      </div>

      {/* Search / GPS Alerts */}
      {(searchError || gpsError) && (
        <div className="absolute top-14 sm:top-16 left-2.5 sm:left-3 right-2.5 sm:right-3 z-[400] bg-red-50/95 border border-red-200 text-red-800 text-xs p-2 rounded-xl shadow-md flex items-center justify-between">
          <span className="text-[11px] sm:text-xs">{searchError || gpsError}</span>
          <button 
            type="button" 
            onClick={() => { setSearchError(null); setGpsError(null); }} 
            className="text-red-500 hover:text-red-700 font-bold px-1"
          >
            ×
          </button>
        </div>
      )}

      {/* Pulse Animation Style & Zoom Control Positioning */}
      <style>{`
        .leaflet-bottom.leaflet-right {
          bottom: 45px !important;
          right: 12px !important;
          margin-bottom: 0 !important;
        }
        @keyframes marker-pulse {
          0% { transform: scale(0.6); opacity: 0.8; }
          70% { transform: scale(1.6); opacity: 0; }
          100% { transform: scale(0.6); opacity: 0; }
        }
      `}</style>
    </div>
  );
};
