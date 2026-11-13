import { supabase, isSupabaseConfigured } from './supabase';
import type { 
  UserProfile, 
  FarmRecord, 
  SavedPlanRecord, 
  ActivityHistoryRecord,
  ChatConversation,
  ChatMessage
} from '../types/platform';
import { CROP_NAMES_MAP } from '../data/crops';

// ----------------------------------------------------------------------------
// Local In-Memory & IndexedDB Persistent Store (for offline / testing / demo)
// ----------------------------------------------------------------------------
interface LocalDBStore {
  profiles: Map<string, UserProfile>;
  farms: Map<string, FarmRecord>;
  plans: Map<string, SavedPlanRecord>;
  conversations: Map<string, ChatConversation>;
  history: ActivityHistoryRecord[];
}

const LOCAL_STORAGE_KEY = 'smartcrop_farmer_db_v1';

function loadLocalStore(): LocalDBStore {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const serialized = window.localStorage.getItem(LOCAL_STORAGE_KEY);
      if (serialized) {
        const parsed = JSON.parse(serialized);
        return {
          profiles: new Map(Object.entries(parsed.profiles || {})),
          farms: new Map(Object.entries(parsed.farms || {})),
          plans: new Map(Object.entries(parsed.plans || {})),
          conversations: new Map(Object.entries(parsed.conversations || {})),
          history: Array.isArray(parsed.history) ? parsed.history : []
        };
      }
    }
  } catch (err) {
    console.warn('[SmartCrop DB] Failed reading local storage backup, starting clean', err);
  }
  return {
    profiles: new Map(),
    farms: new Map(),
    plans: new Map(),
    conversations: new Map(),
    history: []
  };
}

function persistLocalStore(store: LocalDBStore) {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const serializable = {
        profiles: Object.fromEntries(store.profiles),
        farms: Object.fromEntries(store.farms),
        plans: Object.fromEntries(store.plans),
        conversations: Object.fromEntries(store.conversations),
        history: store.history
      };
      window.localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(serializable));
    }
  } catch (err) {
    console.warn('[SmartCrop DB] Failed saving to local storage', err);
  }
}

const localStore = loadLocalStore();

// ----------------------------------------------------------------------------
// Database Service Interface
// ----------------------------------------------------------------------------
export interface FarmerStats {
  totalPlans: number;
  totalFarms: number;
  totalArea: number;
  topCrops: { id: string; nameEn: string; nameAr: string; count: number }[];
  recentPlans: SavedPlanRecord[];
}

export const dbService = {
  // --------------------------------------------------------------------------
  // PROFILES
  // --------------------------------------------------------------------------
  async createProfile(profile: UserProfile): Promise<UserProfile> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('profiles')
        .upsert({
          id: profile.id,
          full_name: profile.fullName,
          email: profile.email,
          country: profile.country,
          city: profile.city,
          profile_image: profile.profileImage
        });
      if (error && error.code !== '23505') {
        console.warn('Supabase create profile notice:', error.message);
      }
      return profile;
    }

    localStore.profiles.set(profile.id, profile);
    persistLocalStore(localStore);
    return profile;
  },

  async getProfile(userId: string): Promise<UserProfile | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();
      if (error || !data) return null;
      return {
        id: data.id,
        fullName: data.full_name,
        email: data.email,
        profileImage: data.profile_image,
        country: data.country,
        city: data.city,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    }

    return localStore.profiles.get(userId) || null;
  },

  async updateProfile(userId: string, updates: Partial<UserProfile>): Promise<UserProfile> {
    if (isSupabaseConfigured && supabase) {
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (updates.fullName !== undefined) payload.full_name = updates.fullName;
      if (updates.country !== undefined) payload.country = updates.country;
      if (updates.city !== undefined) payload.city = updates.city;
      if (updates.profileImage !== undefined) payload.profile_image = updates.profileImage;

      const { data, error } = await supabase
        .from('profiles')
        .update(payload)
        .eq('id', userId)
        .select()
        .single();

      if (error || !data) throw new Error(error?.message || 'Failed to update profile');
      return {
        id: data.id,
        fullName: data.full_name,
        email: data.email,
        profileImage: data.profile_image,
        country: data.country,
        city: data.city,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    }

    const existing = localStore.profiles.get(userId);
    if (!existing) {
      if (updates.fullName && updates.email) {
        const newProfile: UserProfile = {
          id: userId,
          fullName: updates.fullName,
          email: updates.email,
          country: updates.country || '',
          city: updates.city || '',
          profileImage: updates.profileImage,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        localStore.profiles.set(userId, newProfile);
        persistLocalStore(localStore);
        return newProfile;
      }
      throw new Error('User profile not found');
    }
    const updated: UserProfile = {
      ...existing,
      ...updates,
      updatedAt: new Date().toISOString()
    };
    localStore.profiles.set(userId, updated);
    persistLocalStore(localStore);
    return updated;
  },

  async deleteAccount(userId: string): Promise<void> {
    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase.from('profiles').delete().eq('id', userId);
      if (error) throw new Error(error.message);
      return;
    }

    // Cascade deletes in local store
    localStore.profiles.delete(userId);
    for (const [id, f] of localStore.farms.entries()) {
      if (f.userId === userId) localStore.farms.delete(id);
    }
    for (const [id, p] of localStore.plans.entries()) {
      if (p.userId === userId) localStore.plans.delete(id);
    }
    localStore.history = localStore.history.filter(h => h.userId !== userId);
    persistLocalStore(localStore);
  },

  // --------------------------------------------------------------------------
  // FARMS
  // --------------------------------------------------------------------------
  async getFarms(userId: string): Promise<FarmRecord[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('farms')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []).map(f => ({
        id: f.id,
        userId: f.user_id,
        farmName: f.farm_name,
        latitude: f.latitude,
        longitude: f.longitude,
        country: f.country,
        region: f.region,
        farmArea: f.farm_area,
        areaUnit: f.area_unit,
        soilType: f.soil_properties?.soilType || 'clay_loam',
        soilPh: f.soil_properties?.ph,
        organicMatterPct: f.soil_properties?.organicMatterPct,
        soilSalinityEC: f.soil_properties?.salinityEC,
        irrigationAvailability: f.irrigation_properties?.irrigationAvailability || 'medium',
        irrigationMethod: f.irrigation_properties?.irrigationMethod,
        irrigationWaterSalinityECw: f.irrigation_properties?.irrigationWaterSalinityECw,
        farmerPriority: f.soil_properties?.farmerPriority || 'water_conservation',
        previousCrop: f.soil_properties?.previousCrop || 'fallow',
        notes: f.notes,
        createdAt: f.created_at,
        updatedAt: f.updated_at
      }));
    }

    const userFarms: FarmRecord[] = [];
    for (const farm of localStore.farms.values()) {
      if (farm.userId === userId) {
        userFarms.push(farm);
      }
    }
    return userFarms.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getFarmById(userId: string, farmId: string): Promise<FarmRecord | null> {
    const farms = await this.getFarms(userId);
    return farms.find(f => f.id === farmId) || null;
  },

  async createFarm(farm: Omit<FarmRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<FarmRecord> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('farms')
        .insert({
          user_id: farm.userId,
          farm_name: farm.farmName,
          latitude: farm.latitude,
          longitude: farm.longitude,
          country: farm.country,
          region: farm.region,
          farm_area: farm.farmArea,
          area_unit: farm.areaUnit,
          soil_properties: {
            soilType: farm.soilType,
            ph: farm.soilPh,
            organicMatterPct: farm.organicMatterPct,
            salinityEC: farm.soilSalinityEC,
            farmerPriority: farm.farmerPriority,
            previousCrop: farm.previousCrop
          },
          irrigation_properties: {
            irrigationAvailability: farm.irrigationAvailability,
            irrigationMethod: farm.irrigationMethod,
            irrigationWaterSalinityECw: farm.irrigationWaterSalinityECw
          },
          notes: farm.notes
        })
        .select()
        .single();

      if (error || !data) throw new Error(error?.message || 'Failed to create farm');
      const created: FarmRecord = {
        ...farm,
        id: data.id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      await this.logActivity({
        userId: farm.userId,
        farmId: created.id,
        farmName: created.farmName,
        activityType: 'farm_created',
        descriptionEn: `Registered new farm: "${created.farmName}" in ${created.region}, ${created.country}.`,
        descriptionAr: `تم تسجيل مزرعة جديدة: "${created.farmName}" في ${created.region}، ${created.country}.`,
        metadata: { area: created.farmArea, unit: created.areaUnit }
      });

      return created;
    }

    const id = 'farm_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    const created: FarmRecord = {
      ...farm,
      id,
      createdAt: now,
      updatedAt: now
    };
    localStore.farms.set(id, created);
    persistLocalStore(localStore);

    await this.logActivity({
      userId: farm.userId,
      farmId: created.id,
      farmName: created.farmName,
      activityType: 'farm_created',
      descriptionEn: `Registered new farm: "${created.farmName}" in ${created.region}, ${created.country}.`,
      descriptionAr: `تم تسجيل مزرعة جديدة: "${created.farmName}" في ${created.region}، ${created.country}.`,
      metadata: { area: created.farmArea, unit: created.areaUnit }
    });

    return created;
  },

  async updateFarm(userId: string, farmId: string, updates: Partial<FarmRecord>): Promise<FarmRecord> {
    const existing = await this.getFarmById(userId, farmId);
    if (!existing) throw new Error('Farm not found or unauthorized');

    const now = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      const payload: Record<string, unknown> = { updated_at: now };
      if (updates.farmName) payload.farm_name = updates.farmName;
      if (updates.latitude !== undefined) payload.latitude = updates.latitude;
      if (updates.longitude !== undefined) payload.longitude = updates.longitude;
      if (updates.country) payload.country = updates.country;
      if (updates.region) payload.region = updates.region;
      if (updates.farmArea !== undefined) payload.farm_area = updates.farmArea;
      if (updates.areaUnit) payload.area_unit = updates.areaUnit;
      if (updates.notes !== undefined) payload.notes = updates.notes;

      payload.soil_properties = {
        soilType: updates.soilType ?? existing.soilType,
        ph: updates.soilPh ?? existing.soilPh,
        organicMatterPct: updates.organicMatterPct ?? existing.organicMatterPct,
        salinityEC: updates.soilSalinityEC ?? existing.soilSalinityEC,
        farmerPriority: updates.farmerPriority ?? existing.farmerPriority,
        previousCrop: updates.previousCrop ?? existing.previousCrop
      };

      payload.irrigation_properties = {
        irrigationAvailability: updates.irrigationAvailability ?? existing.irrigationAvailability,
        irrigationMethod: updates.irrigationMethod ?? existing.irrigationMethod,
        irrigationWaterSalinityECw: updates.irrigationWaterSalinityECw ?? existing.irrigationWaterSalinityECw
      };

      const { data, error } = await supabase
        .from('farms')
        .update(payload)
        .eq('id', farmId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error || !data) throw new Error(error?.message || 'Failed to update farm');
      const updated: FarmRecord = {
        ...existing,
        ...updates,
        updatedAt: data.updated_at
      };

      await this.logActivity({
        userId,
        farmId,
        farmName: updated.farmName,
        activityType: 'farm_updated',
        descriptionEn: `Updated farm parameters for "${updated.farmName}".`,
        descriptionAr: `تم تحديث بيانات وخصائص مزرعة "${updated.farmName}".`
      });

      return updated;
    }

    const updated: FarmRecord = {
      ...existing,
      ...updates,
      updatedAt: now
    };
    localStore.farms.set(farmId, updated);
    persistLocalStore(localStore);

    await this.logActivity({
      userId,
      farmId,
      farmName: updated.farmName,
      activityType: 'farm_updated',
      descriptionEn: `Updated farm parameters for "${updated.farmName}".`,
      descriptionAr: `تم تحديث بيانات وخصائص مزرعة "${updated.farmName}".`
    });

    return updated;
  },

  async deleteFarm(userId: string, farmId: string): Promise<void> {
    const existing = await this.getFarmById(userId, farmId);
    if (!existing) throw new Error('Farm not found or unauthorized');

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('farms')
        .delete()
        .eq('id', farmId)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);
    } else {
      localStore.farms.delete(farmId);
      persistLocalStore(localStore);
    }

    await this.logActivity({
      userId,
      farmId,
      farmName: existing.farmName,
      activityType: 'farm_deleted',
      descriptionEn: `Removed farm record: "${existing.farmName}".`,
      descriptionAr: `تم حذف سجل مزرعة: "${existing.farmName}".`
    });
  },

  // --------------------------------------------------------------------------
  // SAVED PLANS
  // --------------------------------------------------------------------------
  async getSavedPlans(userId: string): Promise<SavedPlanRecord[]> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('saved_plans')
        .select('*, farms(farm_name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw new Error(error.message);
      return (data || []).map(p => ({
        id: p.id,
        userId: p.user_id,
        farmId: p.farm_id,
        farmName: p.farms?.farm_name || 'Custom Field',
        planName: p.plan_name,
        userNotes: p.user_notes,
        planSnapshot: p.plan_snapshot,
        originalInputs: p.original_inputs,
        soilDataSnapshot: p.soil_data_snapshot,
        climateDataSnapshot: p.climate_data_snapshot,
        recommendationVersion: p.recommendation_version,
        createdAt: p.created_at,
        updatedAt: p.updated_at
      }));
    }

    const userPlans: SavedPlanRecord[] = [];
    for (const plan of localStore.plans.values()) {
      if (plan.userId === userId) {
        userPlans.push(plan);
      }
    }
    return userPlans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  },

  async getSavedPlanById(userId: string, planId: string): Promise<SavedPlanRecord | null> {
    const plans = await this.getSavedPlans(userId);
    return plans.find(p => p.id === planId) || null;
  },

  async getSavedPlan(userId: string, planId: string): Promise<SavedPlanRecord | null> {
    return this.getSavedPlanById(userId, planId);
  },

  async getPlan(planId: string): Promise<SavedPlanRecord | null> {
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('saved_plans')
        .select('*, farms(farm_name)')
        .eq('id', planId)
        .single();
      if (error || !data) return null;
      return {
        id: data.id,
        userId: data.user_id,
        farmId: data.farm_id,
        farmName: data.farms?.farm_name || 'Custom Field',
        planName: data.plan_name,
        userNotes: data.user_notes,
        planSnapshot: data.plan_snapshot,
        originalInputs: data.original_inputs,
        soilDataSnapshot: data.soil_data_snapshot,
        climateDataSnapshot: data.climate_data_snapshot,
        recommendationVersion: data.recommendation_version,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };
    }
    return localStore.plans.get(planId) || null;
  },

  async savePlan(plan: Omit<SavedPlanRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedPlanRecord> {
    return this.createSavedPlan(plan);
  },

  async createSavedPlan(plan: Omit<SavedPlanRecord, 'id' | 'createdAt' | 'updatedAt'>): Promise<SavedPlanRecord> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('saved_plans')
        .insert({
          user_id: plan.userId,
          farm_id: plan.farmId,
          plan_name: plan.planName,
          user_notes: plan.userNotes,
          plan_snapshot: plan.planSnapshot,
          original_inputs: plan.originalInputs,
          soil_data_snapshot: plan.soilDataSnapshot,
          climate_data_snapshot: plan.climateDataSnapshot,
          recommendation_version: plan.recommendationVersion || 'v2.1-global-fao56'
        })
        .select()
        .single();

      if (error || !data) throw new Error(error?.message || 'Failed to save plan');
      const created: SavedPlanRecord = {
        ...plan,
        id: data.id,
        createdAt: data.created_at,
        updatedAt: data.updated_at
      };

      await this.logActivity({
        userId: plan.userId,
        farmId: plan.farmId,
        farmName: plan.farmName,
        planId: created.id,
        planName: created.planName,
        activityType: 'plan_saved',
        descriptionEn: `Saved crop rotation plan: "${created.planName}" (${created.planSnapshot.titleEn}).`,
        descriptionAr: `تم حفظ خطة دورة زراعية: "${created.planName}" (${created.planSnapshot.titleAr}).`,
        metadata: { score: created.planSnapshot.overallScore }
      });

      return created;
    }

    const id = 'plan_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    const created: SavedPlanRecord = {
      ...JSON.parse(JSON.stringify(plan)),
      id,
      createdAt: now,
      updatedAt: now
    };
    localStore.plans.set(id, created);
    persistLocalStore(localStore);

    await this.logActivity({
      userId: plan.userId,
      farmId: plan.farmId,
      farmName: plan.farmName,
      planId: created.id,
      planName: created.planName,
      activityType: 'plan_saved',
      descriptionEn: `Saved crop rotation plan: "${created.planName}" (${created.planSnapshot.titleEn}).`,
      descriptionAr: `تم حفظ خطة دورة زراعية: "${created.planName}" (${created.planSnapshot.titleAr}).`,
      metadata: { score: created.planSnapshot.overallScore }
    });

    return created;
  },

  async updateSavedPlan(
    userId: string, 
    planId: string, 
    updates: { planName?: string; userNotes?: string }
  ): Promise<SavedPlanRecord> {
    const existing = await this.getSavedPlanById(userId, planId);
    if (!existing) throw new Error('Plan not found or unauthorized');

    const now = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      const payload: Record<string, unknown> = { updated_at: now };
      if (updates.planName !== undefined) payload.plan_name = updates.planName;
      if (updates.userNotes !== undefined) payload.user_notes = updates.userNotes;

      const { data, error } = await supabase
        .from('saved_plans')
        .update(payload)
        .eq('id', planId)
        .eq('user_id', userId)
        .select()
        .single();

      if (error || !data) throw new Error(error?.message || 'Failed to update plan');
      const updated: SavedPlanRecord = {
        ...existing,
        ...updates,
        updatedAt: data.updated_at
      };

      await this.logActivity({
        userId,
        farmId: existing.farmId,
        farmName: existing.farmName,
        planId,
        planName: updated.planName,
        activityType: 'plan_updated',
        descriptionEn: `Updated details and notes for plan: "${updated.planName}".`,
        descriptionAr: `تم تحديث الملاحظات واسم الخطة: "${updated.planName}".`
      });

      return updated;
    }

    const updated: SavedPlanRecord = {
      ...existing,
      ...updates,
      updatedAt: now
    };
    localStore.plans.set(planId, updated);
    persistLocalStore(localStore);

    await this.logActivity({
      userId,
      farmId: existing.farmId,
      farmName: existing.farmName,
      planId,
      planName: updated.planName,
      activityType: 'plan_updated',
      descriptionEn: `Updated details and notes for plan: "${updated.planName}".`,
      descriptionAr: `تم تحديث الملاحظات واسم الخطة: "${updated.planName}".`
    });

    return updated;
  },

  async duplicateSavedPlan(userId: string, planId: string, newName?: string): Promise<SavedPlanRecord> {
    const existing = await this.getSavedPlanById(userId, planId);
    if (!existing) throw new Error('Plan not found or unauthorized');

    const duplicateTitle = newName || `${existing.planName} (Copy)`;
    const duplicated = await this.createSavedPlan({
      userId,
      farmId: existing.farmId,
      farmName: existing.farmName,
      planName: duplicateTitle,
      userNotes: existing.userNotes ? `Duplicated from ${existing.planName}.\n${existing.userNotes}` : undefined,
      planSnapshot: JSON.parse(JSON.stringify(existing.planSnapshot)),
      originalInputs: JSON.parse(JSON.stringify(existing.originalInputs)),
      soilDataSnapshot: JSON.parse(JSON.stringify(existing.soilDataSnapshot)),
      climateDataSnapshot: JSON.parse(JSON.stringify(existing.climateDataSnapshot)),
      recommendationVersion: existing.recommendationVersion
    });

    await this.logActivity({
      userId,
      farmId: existing.farmId,
      farmName: existing.farmName,
      planId: duplicated.id,
      planName: duplicated.planName,
      activityType: 'plan_duplicated',
      descriptionEn: `Duplicated plan "${existing.planName}" into new copy "${duplicated.planName}".`,
      descriptionAr: `تم إنشاء نسخة مكررة من الخطة "${existing.planName}" باسم "${duplicated.planName}".`
    });

    return duplicated;
  },

  async deleteSavedPlan(userId: string, planId: string): Promise<void> {
    const existing = await this.getSavedPlanById(userId, planId);
    if (!existing) throw new Error('Plan not found or unauthorized');

    if (isSupabaseConfigured && supabase) {
      const { error } = await supabase
        .from('saved_plans')
        .delete()
        .eq('id', planId)
        .eq('user_id', userId);

      if (error) throw new Error(error.message);
    } else {
      localStore.plans.delete(planId);
      persistLocalStore(localStore);
    }

    await this.logActivity({
      userId,
      farmId: existing.farmId,
      farmName: existing.farmName,
      planId,
      planName: existing.planName,
      activityType: 'plan_deleted',
      descriptionEn: `Deleted saved agricultural plan: "${existing.planName}".`,
      descriptionAr: `تم حذف الخطة الزراعية المحفوظة: "${existing.planName}".`
    });
  },

  // --------------------------------------------------------------------------
  // ACTIVITY HISTORY
  // --------------------------------------------------------------------------
  async getActivityHistory(
    userId: string, 
    filters?: { farmId?: string; activityType?: string; limit?: number }
  ): Promise<ActivityHistoryRecord[]> {
    if (isSupabaseConfigured && supabase) {
      let query = supabase
        .from('activity_history')
        .select('*, farms(farm_name), saved_plans(plan_name)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (filters?.farmId) {
        query = query.eq('farm_id', filters.farmId);
      }
      if (filters?.activityType && filters.activityType !== 'all') {
        query = query.eq('activity_type', filters.activityType);
      }
      if (filters?.limit) {
        query = query.limit(filters.limit);
      }

      const { data, error } = await query;
      if (error) throw new Error(error.message);

      return (data || []).map(h => ({
        id: h.id,
        userId: h.user_id,
        farmId: h.farm_id,
        farmName: h.farms?.farm_name,
        planId: h.plan_id,
        planName: h.saved_plans?.plan_name,
        activityType: h.activity_type,
        descriptionEn: h.description_en,
        descriptionAr: h.description_ar,
        metadata: h.metadata,
        createdAt: h.created_at
      }));
    }

    let records = localStore.history.filter(h => h.userId === userId);
    if (filters?.farmId) {
      records = records.filter(h => h.farmId === filters.farmId);
    }
    if (filters?.activityType && filters.activityType !== 'all') {
      records = records.filter(h => h.activityType === filters.activityType);
    }
    records.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (filters?.limit) {
      records = records.slice(0, filters.limit);
    }
    return records;
  },

  async logActivity(entry: Omit<ActivityHistoryRecord, 'id' | 'createdAt'>): Promise<ActivityHistoryRecord> {
    const now = new Date().toISOString();
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('activity_history')
        .insert({
          user_id: entry.userId,
          farm_id: entry.farmId,
          plan_id: entry.planId,
          activity_type: entry.activityType,
          description_en: entry.descriptionEn,
          description_ar: entry.descriptionAr,
          metadata: entry.metadata || {}
        })
        .select()
        .single();

      if (error || !data) {
        console.warn('[SmartCrop DB] Failed logging activity to Supabase', error);
        return { ...entry, id: 'act_temp', createdAt: now };
      }

      return {
        id: data.id,
        userId: data.user_id,
        farmId: data.farm_id,
        planId: data.plan_id,
        activityType: data.activity_type,
        descriptionEn: data.description_en,
        descriptionAr: data.description_ar,
        metadata: data.metadata,
        createdAt: data.created_at
      };
    }

    const id = 'act_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    const created: ActivityHistoryRecord = {
      ...entry,
      id,
      createdAt: now
    };
    localStore.history.unshift(created);
    persistLocalStore(localStore);
    return created;
  },

  // --------------------------------------------------------------------------
  // STATISTICS & AGGREGATIONS
  // --------------------------------------------------------------------------
  async getFarmerStats(userId: string): Promise<FarmerStats> {
    const [plans, farms] = await Promise.all([
      this.getSavedPlans(userId),
      this.getFarms(userId)
    ]);

    const totalArea = farms.reduce((sum, f) => {
      // Normalize to feddan for unified counter
      const factor = f.areaUnit === 'hectare' ? 2.38 : f.areaUnit === 'acre' ? 0.96 : 1.0;
      return sum + (f.farmArea * factor);
    }, 0);

    // Compute crop frequency across saved plans
    const cropCounts: Record<string, number> = {};
    for (const plan of plans) {
      for (const step of plan.planSnapshot.steps) {
        const cId = step.cropId || step.crop?.id;
        if (cId && cId !== 'fallow') {
          cropCounts[cId] = (cropCounts[cId] || 0) + 1;
        }
      }
    }

    const topCrops = Object.entries(cropCounts)
      .map(([id, count]) => ({
        id,
        nameEn: CROP_NAMES_MAP[id]?.en || id,
        nameAr: CROP_NAMES_MAP[id]?.ar || id,
        count
      }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    return {
      totalPlans: plans.length,
      totalFarms: farms.length,
      totalArea: Number(totalArea.toFixed(1)),
      topCrops,
      recentPlans: plans.slice(0, 3)
    };
  },

  // --------------------------------------------------------------------------
  // AI AGRICULTURAL ASSISTANT CONVERSATIONS & CHAT HISTORY
  // --------------------------------------------------------------------------
  async getConversations(userId: string): Promise<ChatConversation[]> {
    if (!userId) return [];
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('user_id', userId)
        .order('updated_at', { ascending: false });

      if (!error && Array.isArray(data)) {
        return data.map((row: any) => ({
          id: row.id,
          userId: row.user_id,
          title: row.title,
          farmId: row.farm_id,
          farmName: row.farm_name,
          createdAt: row.created_at,
          updatedAt: row.updated_at,
          messages: row.messages || [],
          plantDoctorHandover: row.plant_doctor_handover
        }));
      }
    }

    return Array.from(localStore.conversations.values())
      .filter(c => c.userId === userId)
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  },

  async getConversation(userId: string, conversationId: string): Promise<ChatConversation | null> {
    if (!userId || !conversationId) return null;
    if (isSupabaseConfigured && supabase) {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('*')
        .eq('id', conversationId)
        .eq('user_id', userId)
        .single();

      if (!error && data) {
        return {
          id: data.id,
          userId: data.user_id,
          title: data.title,
          farmId: data.farm_id,
          farmName: data.farm_name,
          createdAt: data.created_at,
          updatedAt: data.updated_at,
          messages: data.messages || [],
          plantDoctorHandover: data.plant_doctor_handover
        };
      }
    }

    const conv = localStore.conversations.get(conversationId);
    if (!conv || conv.userId !== userId) {
      return null;
    }
    return conv;
  },

  async saveConversation(userId: string, conversation: ChatConversation): Promise<ChatConversation> {
    if (!userId) throw new Error('User authentication required to save conversation');
    const safeConv: ChatConversation = {
      ...conversation,
      userId,
      updatedAt: new Date().toISOString()
    };

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('chat_conversations')
        .upsert({
          id: safeConv.id,
          user_id: userId,
          title: safeConv.title,
          farm_id: safeConv.farmId,
          farm_name: safeConv.farmName,
          created_at: safeConv.createdAt,
          updated_at: safeConv.updatedAt,
          messages: safeConv.messages,
          plant_doctor_handover: safeConv.plantDoctorHandover
        });
    }

    localStore.conversations.set(safeConv.id, safeConv);
    persistLocalStore(localStore);
    return safeConv;
  },

  async addChatMessage(userId: string, conversationId: string, message: ChatMessage): Promise<ChatMessage> {
    if (!userId) throw new Error('User authentication required to post chat message');
    let conv = localStore.conversations.get(conversationId);

    const now = new Date().toISOString();
    const safeMessage: ChatMessage = {
      ...message,
      id: message.id || 'msg_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now(),
      conversationId,
      timestamp: message.timestamp || now
    };

    if (!conv || conv.userId !== userId) {
      // Create fresh conversation thread if it doesn't exist
      conv = {
        id: conversationId,
        userId,
        title: message.content.slice(0, 40) || 'Agricultural Consultation',
        createdAt: now,
        updatedAt: now,
        messages: [safeMessage]
      };
    } else {
      conv = {
        ...conv,
        updatedAt: now,
        messages: [...conv.messages, safeMessage]
      };
    }

    localStore.conversations.set(conversationId, conv);
    persistLocalStore(localStore);

    if (isSupabaseConfigured && supabase) {
      await this.saveConversation(userId, conv);
    }

    return safeMessage;
  },

  async deleteConversation(userId: string, conversationId: string): Promise<boolean> {
    if (!userId || !conversationId) return false;
    const conv = localStore.conversations.get(conversationId);
    if (!conv || conv.userId !== userId) {
      return false;
    }

    localStore.conversations.delete(conversationId);
    persistLocalStore(localStore);

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('chat_conversations')
        .delete()
        .eq('id', conversationId)
        .eq('user_id', userId);
    }

    return true;
  },

  async clearConversations(userId: string): Promise<void> {
    if (!userId) return;
    for (const [id, c] of localStore.conversations.entries()) {
      if (c.userId === userId) {
        localStore.conversations.delete(id);
      }
    }
    persistLocalStore(localStore);

    if (isSupabaseConfigured && supabase) {
      await supabase
        .from('chat_conversations')
        .delete()
        .eq('user_id', userId);
    }
  }
};
