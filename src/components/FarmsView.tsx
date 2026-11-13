import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { dbService } from '../services/database';
import type { FarmRecord, SoilType, IrrigationAvailability, FarmerPriority, CropId } from '../types';
import { 
  MapPin, 
  Plus, 
  Edit3, 
  Trash2, 
  Sprout, 
  X, 
  AlertTriangle
} from 'lucide-react';

interface FarmsViewProps {
  onAssessFarm: (farm: FarmRecord) => void;
}

export const FarmsView: React.FC<FarmsViewProps> = ({ onAssessFarm }) => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const isAr = language === 'ar';

  const [farms, setFarms] = useState<FarmRecord[]>([]);
  const [loading, setLoading] = useState(true);

  // Add/Edit Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingFarmId, setEditingFarmId] = useState<string | null>(null);
  const [deleteTargetFarm, setDeleteTargetFarm] = useState<FarmRecord | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Farm Form State
  const [farmName, setFarmName] = useState('');
  const [latitude, setLatitude] = useState(26.5569);
  const [longitude, setLongitude] = useState(31.6948);
  const [country, setCountry] = useState(isAr ? 'مصر' : 'Egypt');
  const [region, setRegion] = useState(isAr ? 'محافظة سوهاج' : 'Sohag Governorate');
  const [farmArea, setFarmArea] = useState(5.0);
  const [areaUnit, setAreaUnit] = useState<'feddan' | 'hectare' | 'acre'>('feddan');
  const [soilType, setSoilType] = useState<SoilType>('clay_loam');
  const [soilPh, setSoilPh] = useState<number | undefined>(7.8);
  const [organicMatterPct, setOrganicMatterPct] = useState<number | undefined>(1.5);
  const [soilSalinityEC, setSoilSalinityEC] = useState<number | undefined>(1.5);
  const [irrigationAvailability, setIrrigationAvailability] = useState<IrrigationAvailability>('medium');
  const [irrigationMethod, setIrrigationMethod] = useState<'surface_furrow' | 'drip' | 'sprinkler'>('surface_furrow');
  const [irrigationWaterSalinityECw, setIrrigationWaterSalinityECw] = useState<number | undefined>(undefined);
  const [farmerPriority, setFarmerPriority] = useState<FarmerPriority>('water_conservation');
  const [previousCrop, setPreviousCrop] = useState<CropId | 'fallow'>('fallow');
  const [notes, setNotes] = useState('');

  const loadFarms = async () => {
    if (!user) return;
    try {
      setLoading(true);
      const userFarms = await dbService.getFarms(user.id);
      setFarms(userFarms);
    } catch (err) {
      console.error('[FarmsView] Failed loading farms', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadFarms();
  }, [user]);

  const handleOpenAdd = () => {
    setEditingFarmId(null);
    setFarmName('');
    setLatitude(26.5569);
    setLongitude(31.6948);
    setCountry(isAr ? 'مصر' : 'Egypt');
    setRegion(isAr ? 'محافظة سوهاج' : 'Sohag Governorate');
    setFarmArea(5.0);
    setAreaUnit('feddan');
    setSoilType('clay_loam');
    setSoilPh(7.8);
    setOrganicMatterPct(1.5);
    setSoilSalinityEC(1.5);
    setIrrigationAvailability('medium');
    setIrrigationMethod('surface_furrow');
    setIrrigationWaterSalinityECw(undefined);
    setFarmerPriority('water_conservation');
    setPreviousCrop('fallow');
    setNotes('');
    setIsModalOpen(true);
  };

  const handleOpenEdit = (f: FarmRecord) => {
    setEditingFarmId(f.id);
    setFarmName(f.farmName);
    setLatitude(f.latitude);
    setLongitude(f.longitude);
    setCountry(f.country);
    setRegion(f.region);
    setFarmArea(f.farmArea);
    setAreaUnit(f.areaUnit);
    setSoilType(f.soilType);
    setSoilPh(f.soilPh);
    setOrganicMatterPct(f.organicMatterPct);
    setSoilSalinityEC(f.soilSalinityEC);
    setIrrigationAvailability(f.irrigationAvailability);
    setIrrigationMethod(f.irrigationMethod || 'surface_furrow');
    setIrrigationWaterSalinityECw(f.irrigationWaterSalinityECw);
    setFarmerPriority(f.farmerPriority);
    setPreviousCrop(f.previousCrop || 'fallow');
    setNotes(f.notes || '');
    setIsModalOpen(true);
  };

  const handleSaveFarm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setActionLoading(true);

    try {
      if (editingFarmId) {
        const updated = await dbService.updateFarm(user.id, editingFarmId, {
          farmName: farmName.trim(),
          latitude: Number(latitude),
          longitude: Number(longitude),
          country: country.trim(),
          region: region.trim(),
          farmArea: Number(farmArea),
          areaUnit,
          soilType,
          soilPh: soilPh ? Number(soilPh) : undefined,
          organicMatterPct: organicMatterPct ? Number(organicMatterPct) : undefined,
          soilSalinityEC: soilSalinityEC ? Number(soilSalinityEC) : undefined,
          irrigationAvailability,
          irrigationMethod,
          irrigationWaterSalinityECw: irrigationWaterSalinityECw ? Number(irrigationWaterSalinityECw) : undefined,
          farmerPriority,
          previousCrop,
          notes: notes.trim()
        });
        setFarms(prev => prev.map(f => f.id === updated.id ? updated : f));
      } else {
        const created = await dbService.createFarm({
          userId: user.id,
          farmName: farmName.trim() || (isAr ? 'حقل زراعي جديد' : 'New Farm Parcel'),
          latitude: Number(latitude),
          longitude: Number(longitude),
          country: country.trim(),
          region: region.trim(),
          farmArea: Number(farmArea),
          areaUnit,
          soilType,
          soilPh: soilPh ? Number(soilPh) : undefined,
          organicMatterPct: organicMatterPct ? Number(organicMatterPct) : undefined,
          soilSalinityEC: soilSalinityEC ? Number(soilSalinityEC) : undefined,
          irrigationAvailability,
          irrigationMethod,
          irrigationWaterSalinityECw: irrigationWaterSalinityECw ? Number(irrigationWaterSalinityECw) : undefined,
          farmerPriority,
          previousCrop,
          notes: notes.trim()
        });
        setFarms(prev => [created, ...prev]);
      }
      setIsModalOpen(false);
    } catch (err) {
      console.error('Failed saving farm', err);
    } finally {
      setActionLoading(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!user || !deleteTargetFarm) return;
    setActionLoading(true);
    try {
      await dbService.deleteFarm(user.id, deleteTargetFarm.id);
      setFarms(prev => prev.filter(f => f.id !== deleteTargetFarm.id));
      setDeleteTargetFarm(null);
    } catch (err) {
      console.error('Failed deleting farm', err);
    } finally {
      setActionLoading(false);
    }
  };

  if (!user) {
    return (
      <div className="py-16 text-center">
        <p className="text-slate-600">
          {isAr ? 'يرجى تسجيل الدخول للوصول إلى مزارعك.' : 'Please sign in to manage your farms.'}
        </p>
      </div>
    );
  }

  return (
    <div className="py-3 sm:py-6 space-y-5 sm:space-y-6 animate-fade-in font-sans w-full max-w-full overflow-hidden" dir={isAr ? 'rtl' : 'ltr'}>
      {/* 1. Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-charcoal tracking-tight flex items-center gap-2.5">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
              <MapPin className="w-5 h-5 sm:w-6 sm:h-6 text-amber-700" />
            </div>
            <span>{isAr ? 'مزارعي وحقولي' : 'My Farms & Parcels'}</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            {isAr 
              ? 'احفظ إحداثيات وخصائص أراضيك لتطبيق تقييمات الدورات الزراعية تلقائياً دون إعادة إدخالها كل مرة.'
              : 'Save parcel coordinates and soil properties to launch automated rotation assessments in one click.'}
          </p>
        </div>

        <button
          onClick={handleOpenAdd}
          className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-forest-600 hover:bg-forest-500 text-white font-semibold text-sm shadow-soft hover:shadow-soft-lg transition-all flex items-center justify-center gap-2 self-stretch sm:self-auto active:scale-[0.98]"
        >
          <Plus className="w-4 h-4" />
          <span>{isAr ? 'إضافة مزرعة جديدة' : 'Add New Farm'}</span>
        </button>
      </div>

      {/* 2. Farms List */}
      {loading ? (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200">
          <p className="text-xs text-slate-500">{isAr ? 'جارٍ تحميل بيانات المزارع...' : 'Loading farms...'}</p>
        </div>
      ) : farms.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {farms.map(farm => (
            <div
              key={farm.id}
              className="bg-white rounded-2xl border border-slate-200/80 shadow-soft hover:shadow-soft-lg hover:border-forest-300 transition-all flex flex-col justify-between overflow-hidden group"
            >
              <div className="p-5 space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="space-y-1">
                    <h3 className="font-bold text-base text-charcoal group-hover:text-forest-700 transition-colors">
                      {farm.farmName}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-forest-600 shrink-0" />
                      <span>{farm.region}، {farm.country}</span>
                      <span className="text-slate-300">•</span>
                      <span className="font-mono text-[11px] text-slate-400">
                        ({farm.latitude.toFixed(4)}°, {farm.longitude.toFixed(4)}°)
                      </span>
                    </p>
                  </div>

                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleOpenEdit(farm)}
                      title={isAr ? 'تعديل بيانات المزرعة' : 'Edit farm'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-charcoal hover:bg-sand transition-colors"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteTargetFarm(farm)}
                      title={isAr ? 'حذف المزرعة' : 'Delete farm'}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Key Spec Badges */}
                <div className="grid grid-cols-3 gap-2">
                  <div className="p-2.5 rounded-xl bg-sand/60 border border-slate-200/60 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                      {isAr ? 'المساحة' : 'Area'}
                    </span>
                    <span className="text-xs font-bold text-charcoal block mt-0.5">
                      {farm.farmArea} {farm.areaUnit === 'feddan' ? (isAr ? 'فدان' : 'Feddan') : farm.areaUnit}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-sand/60 border border-slate-200/60 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                      {isAr ? 'التربة' : 'Soil'}
                    </span>
                    <span className="text-xs font-bold text-charcoal block mt-0.5 truncate">
                      {farm.soilType.replace(/_/g, ' ')}
                    </span>
                  </div>

                  <div className="p-2.5 rounded-xl bg-sand/60 border border-slate-200/60 text-center">
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">
                      {isAr ? 'مياه الري' : 'Water'}
                    </span>
                    <span className="text-xs font-bold text-charcoal block mt-0.5 capitalize">
                      {farm.irrigationAvailability}
                    </span>
                  </div>
                </div>

                {/* Detailed Indicators */}
                <div className="flex items-center gap-3 text-[11px] text-slate-600 flex-wrap pt-1 border-t border-slate-100">
                  {farm.soilPh && (
                    <span className="inline-flex items-center gap-1 font-mono">
                      <span className="text-slate-400">pH:</span>
                      <strong className="text-charcoal">{farm.soilPh}</strong>
                    </span>
                  )}
                  {farm.soilSalinityEC && (
                    <span className="inline-flex items-center gap-1 font-mono">
                      <span className="text-slate-400">ECe:</span>
                      <strong className="text-charcoal">{farm.soilSalinityEC} dS/m</strong>
                    </span>
                  )}
                  {farm.irrigationWaterSalinityECw && (
                    <span className="inline-flex items-center gap-1 font-mono">
                      <span className="text-slate-400">ECw:</span>
                      <strong className="text-charcoal">{farm.irrigationWaterSalinityECw} dS/m</strong>
                    </span>
                  )}
                </div>

                {farm.notes && (
                  <p className="text-xs text-slate-500 bg-sand/40 p-2.5 rounded-lg border border-slate-100 line-clamp-2 italic font-normal">
                    "{farm.notes}"
                  </p>
                )}
              </div>

              {/* Card Footer Button */}
              <div className="px-5 py-3 bg-sand/40 border-t border-slate-100 flex items-center justify-between">
                <span className="text-[11px] text-slate-400">
                  {isAr ? 'محدثة: ' : 'Updated: '} 
                  {new Date(farm.updatedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US')}
                </span>

                <button
                  onClick={() => onAssessFarm(farm)}
                  className="px-4 py-1.5 rounded-lg bg-forest-600 hover:bg-forest-500 text-white text-xs font-semibold shadow-soft transition-all flex items-center gap-1.5 active:scale-[0.98]"
                >
                  <Sprout className="w-3.5 h-3.5" />
                  <span>{isAr ? 'تقييم هذا الحقل' : 'Assess Farm'}</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-16 text-center bg-white rounded-2xl border border-slate-200/80 space-y-3">
          <div className="w-12 h-12 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
            <MapPin className="w-6 h-6" />
          </div>
          <h3 className="font-bold text-base text-charcoal">
            {isAr ? 'لم تسجل أي مزرعة بعد' : 'No farms registered yet'}
          </h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto font-normal">
            {isAr 
              ? 'سجّل أول مزرعة لك الآن لتخزين نوع التربة ومصادر الري والإحداثيات لسهولة تقييمها في أي وقت.'
              : 'Add your first farm parcel to store soil parameters, coordinates, and irrigation methods.'}
          </p>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-forest-600 hover:bg-forest-700 text-white text-xs font-semibold shadow-soft"
          >
            {isAr ? 'إضافة مزرعة الآن' : 'Add Farm Now'}
          </button>
        </div>
      )}

      {/* 3. Add/Edit Farm Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-forest-950/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-4 sm:p-6 shadow-soft-xl border border-slate-200/80 space-y-4 my-auto max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-base text-charcoal flex items-center gap-2">
                <MapPin className="w-5 h-5 text-forest-600 shrink-0" />
                <span className="truncate">
                  {editingFarmId 
                    ? (isAr ? 'تعديل بيانات المزرعة' : 'Edit Farm Information')
                    : (isAr ? 'إضافة مزرعة أو حقل جديد' : 'Register New Farm Parcel')}
                </span>
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-charcoal shrink-0"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveFarm} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-charcoal mb-1">
                  {isAr ? 'اسم المزرعة أو الحقل' : 'Farm / Parcel Name'}
                </label>
                <input
                  type="text"
                  required
                  value={farmName}
                  onChange={e => setFarmName(e.target.value)}
                  placeholder={isAr ? 'حقل القمح الغربي - سوهاج' : 'Nile Valley Parcel #1'}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-forest-500"
                />
              </div>

              {/* Location Coordinates & Geography */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    {isAr ? 'خط العرض (Lat)' : 'Latitude'}
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={latitude}
                    onChange={e => setLatitude(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    {isAr ? 'خط الطول (Lon)' : 'Longitude'}
                  </label>
                  <input
                    type="number"
                    step="0.0001"
                    required
                    value={longitude}
                    onChange={e => setLongitude(parseFloat(e.target.value))}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    {isAr ? 'الدولة' : 'Country'}
                  </label>
                  <input
                    type="text"
                    required
                    value={country}
                    onChange={e => setCountry(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    {isAr ? 'المحافظة / الإقليم' : 'Region'}
                  </label>
                  <input
                    type="text"
                    required
                    value={region}
                    onChange={e => setRegion(e.target.value)}
                    className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300"
                  />
                </div>
              </div>

              {/* Area & Units */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    {isAr ? 'مساحة الحقل' : 'Farm Area'}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.1"
                    required
                    value={farmArea}
                    onChange={e => setFarmArea(parseFloat(e.target.value))}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-charcoal mb-1">
                    {isAr ? 'وحدة القياس' : 'Measurement Unit'}
                  </label>
                  <select
                    value={areaUnit}
                    onChange={e => setAreaUnit(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white"
                  >
                    <option value="feddan">{isAr ? 'فدان (Feddan)' : 'Feddan'}</option>
                    <option value="hectare">{isAr ? 'هكتار (Hectare)' : 'Hectare'}</option>
                    <option value="acre">{isAr ? 'إيكر (Acre)' : 'Acre'}</option>
                  </select>
                </div>
              </div>

              {/* Soil Properties */}
              <div className="p-3 rounded-xl bg-sand/40 border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  {isAr ? 'خصائص التربة' : 'Soil Properties'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">{isAr ? 'نوع التربة' : 'Soil Texture'}</label>
                    <select
                      value={soilType}
                      onChange={e => setSoilType(e.target.value as any)}
                      className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 bg-white"
                    >
                      <option value="clay_loam">{isAr ? 'طميية طينية' : 'Clay Loam'}</option>
                      <option value="sandy_loam">{isAr ? 'طميية رملية' : 'Sandy Loam'}</option>
                      <option value="silty_clay">{isAr ? 'طميية سلتية' : 'Silty Clay'}</option>
                      <option value="sandy">{isAr ? 'رملية خفيفة' : 'Sandy'}</option>
                      <option value="calcareous">{isAr ? 'كلسية جيرية' : 'Calcareous'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">{isAr ? 'حموضة التربة (pH)' : 'Soil pH'}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={soilPh ?? ''}
                      onChange={e => setSoilPh(e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="7.8"
                      className="w-full px-2 py-1.5 text-xs rounded border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">{isAr ? 'المادة العضوية (%)' : 'OM %'}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={organicMatterPct ?? ''}
                      onChange={e => setOrganicMatterPct(e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="1.5"
                      className="w-full px-2 py-1.5 text-xs rounded border border-slate-300"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">{isAr ? 'ملوحة التربة (ECe)' : 'Salinity (ECe)'}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={soilSalinityEC ?? ''}
                      onChange={e => setSoilSalinityEC(e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="1.5"
                      className="w-full px-2 py-1.5 text-xs rounded border border-slate-300"
                    />
                  </div>
                </div>
              </div>

              {/* Irrigation & Operational Properties */}
              <div className="p-3 rounded-xl bg-sand/40 border border-slate-200/80 space-y-2">
                <span className="text-[11px] font-bold text-slate-600 uppercase tracking-wider block">
                  {isAr ? 'إمدادات ومياه الري' : 'Irrigation & Water Quality'}
                </span>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">{isAr ? 'وفرة مياه الري' : 'Water Availability'}</label>
                    <select
                      value={irrigationAvailability}
                      onChange={e => setIrrigationAvailability(e.target.value as any)}
                      className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 bg-white"
                    >
                      <option value="high">{isAr ? 'عالية (مناوبة ترعة مستقرة/آبار وفيرة)' : 'High Availability'}</option>
                      <option value="medium">{isAr ? 'متوسطة (مناوبة عادية)' : 'Medium Availability'}</option>
                      <option value="low">{isAr ? 'منخفضة (شح مائي / نهاية ترعة)' : 'Low (Water Stressed)'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">{isAr ? 'نظام الري' : 'Irrigation Method'}</label>
                    <select
                      value={irrigationMethod}
                      onChange={e => setIrrigationMethod(e.target.value as any)}
                      className="w-full px-2 py-1.5 text-xs rounded border border-slate-300 bg-white"
                    >
                      <option value="surface_furrow">{isAr ? 'غمر سطحي / خطوط' : 'Surface / Furrow'}</option>
                      <option value="drip">{isAr ? 'ري بالتنقيط' : 'Drip Irrigation'}</option>
                      <option value="sprinkler">{isAr ? 'ري بالرش' : 'Sprinkler'}</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[11px] text-slate-600 mb-1">{isAr ? 'ملوحة مياه الري (ECw)' : 'Water Salinity (ECw)'}</label>
                    <input
                      type="number"
                      step="0.1"
                      value={irrigationWaterSalinityECw ?? ''}
                      onChange={e => setIrrigationWaterSalinityECw(e.target.value ? parseFloat(e.target.value) : undefined)}
                      placeholder="اختياري (dS/m)"
                      className="w-full px-2 py-1.5 text-xs rounded border border-slate-300"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-charcoal mb-1">
                  {isAr ? 'ملاحظات إضافية' : 'Notes & History'}
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  placeholder={isAr ? 'ملاحظات حول مناوبة الري، نوع المصرف، أو تاريخ الزراعة السابق...' : 'Notes regarding irrigation schedules, canal delivery, or field observations...'}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-sand"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={actionLoading}
                  className="px-5 py-2 rounded-lg bg-forest-600 hover:bg-forest-500 text-white text-xs font-semibold shadow-soft disabled:opacity-60"
                >
                  {actionLoading ? (isAr ? 'جارٍ الحفظ...' : 'Saving...') : (isAr ? 'حفظ المزرعة' : 'Save Farm')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 4. Delete Farm Confirmation Modal */}
      {deleteTargetFarm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-forest-950/60 backdrop-blur-sm">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-soft-xl border border-slate-200/80 space-y-4">
            <div className="w-12 h-12 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <AlertTriangle className="w-6 h-6" />
            </div>

            <div className="text-center space-y-1">
              <h3 className="font-bold text-base text-charcoal">
                {isAr ? 'تأكيد حذف المزرعة' : 'Confirm Farm Deletion'}
              </h3>
              <p className="text-xs text-slate-500 font-normal">
                {isAr 
                  ? `هل أنت متأكد من حذف سجل مزرعة "${deleteTargetFarm.farmName}"؟ ستبقى الخطط السابقة المرتبطة بها في الأرشيف.`
                  : `Are you sure you want to remove "${deleteTargetFarm.farmName}"? Associated historical plans will be preserved.`}
              </p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteTargetFarm(null)}
                className="flex-1 py-2 rounded-lg border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-sand"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                type="button"
                disabled={actionLoading}
                onClick={handleConfirmDelete}
                className="flex-1 py-2 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-soft disabled:opacity-60"
              >
                {actionLoading ? (isAr ? 'جارٍ الحذف...' : 'Deleting...') : (isAr ? 'حذف نهائي' : 'Delete Farm')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
