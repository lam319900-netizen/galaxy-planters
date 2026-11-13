import type { 
  SoilType, 
  IrrigationAvailability, 
  FarmerPriority, 
  CropId, 
  FarmAssessmentInput, 
  SoilData, 
  NasaPowerClimateData, 
  RotationPlan 
} from './index';

/**
 * Farmer User Profile
 */
export interface UserProfile {
  id: string;
  fullName: string;
  email: string;
  profileImage?: string;
  country: string;
  city: string;
  isVerified?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * Farm Record Entity
 */
export interface FarmRecord {
  id: string;
  userId: string;
  farmName: string;
  latitude: number;
  longitude: number;
  country: string;
  region: string;
  farmArea: number;
  areaUnit: 'feddan' | 'hectare' | 'acre';
  soilType: SoilType;
  soilPh?: number;
  organicMatterPct?: number;
  soilSalinityEC?: number;
  irrigationAvailability: IrrigationAvailability;
  irrigationMethod?: 'drip' | 'sprinkler' | 'surface_furrow';
  irrigationWaterSalinityECw?: number;
  farmerPriority: FarmerPriority;
  previousCrop?: CropId | 'fallow';
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Saved Plan Snapshot Record
 */
export interface SavedPlanRecord {
  id: string;
  userId: string;
  farmId?: string;
  farmName: string;
  planName: string;
  userNotes?: string;
  planSnapshot: RotationPlan;
  originalInputs: FarmAssessmentInput;
  soilDataSnapshot: SoilData;
  climateDataSnapshot: NasaPowerClimateData;
  recommendationVersion: string;
  createdAt: string;
  updatedAt: string;
}

/**
 * Agricultural Activity History Event Types
 */
export type ActivityType = 
  | 'account_created'
  | 'farm_created'
  | 'farm_updated'
  | 'farm_deleted'
  | 'plan_generated'
  | 'plan_saved'
  | 'plan_updated'
  | 'plan_duplicated'
  | 'plan_deleted'
  | 'chat_conversation_started'
  | 'chat_message_sent'
  | 'plant_doctor_consultation';

/**
 * Plant Doctor Diagnosis Handover Payload
 * Future-proof integration for image/symptom diagnosis modules
 */
export interface PlantDoctorPayload {
  plantCropId?: CropId | string;
  cropCommonNameEn?: string;
  cropCommonNameAr?: string;
  symptoms?: string[];
  suspectedPathogenOrPest?: string;
  confidencePct?: number;
  severityLevel?: 'mild' | 'moderate' | 'severe' | 'critical';
  affectedOrgans?: Array<'leaves' | 'stem' | 'roots' | 'fruits_tubers' | 'flowers'>;
  imageUrl?: string;
  diagnosticNotes?: string;
  recommendedLabAnalysis?: string;
}

/**
 * Verified Source Citation
 */
export interface ChatSourceCitation {
  organization: 'FAO' | 'CABI PlantwisePlus' | 'ICARDA' | 'CIMMYT' | 'CGIAR' | 'ARC Egypt' | 'NASA POWER' | 'IRRI' | 'ICRISAT';
  titleEn: string;
  titleAr: string;
  referenceCode?: string;
  publicationYear?: number;
  url?: string;
  excerptEn?: string;
  excerptAr?: string;
  supportedSubject?: string;
}

/**
 * Chat Message in Conversation
 */
export interface ChatMessage {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  sources?: ChatSourceCitation[];
  plantDoctorPayload?: PlantDoctorPayload;
  modelUsed?: 'gemini' | 'openai' | 'smartcrop-agri-grounded';
  farmContextSnapshot?: {
    farmId?: string;
    farmName?: string;
    planId?: string;
    planName?: string;
    latitude?: number;
    longitude?: number;
    soilType?: string;
    cropId?: string;
  };
}

/**
 * Stored Chat Conversation Thread
 */
export interface ChatConversation {
  id: string;
  userId: string;
  title: string;
  farmId?: string;
  farmName?: string;
  planId?: string;
  planName?: string;
  activeCropContext?: string;
  createdAt: string;
  updatedAt: string;
  messages: ChatMessage[];
  plantDoctorHandover?: boolean;
}

/**
 * Agricultural Activity History Record
 */
export interface ActivityHistoryRecord {
  id: string;
  userId: string;
  farmId?: string;
  farmName?: string;
  planId?: string;
  planName?: string;
  activityType: ActivityType;
  descriptionEn: string;
  descriptionAr: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

/**
 * Auth Session
 */
export interface AuthSession {
  token: string;
  expiresAt: number;
  user: UserProfile;
}

/**
 * Registration Form Payload
 */
export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  confirmPassword: string;
  country: string;
  city: string;
}

/**
 * Navigation Views in the Application
 */
export type NavigationTab = 
  | 'home' 
  | 'assessment' 
  | 'results' 
  | 'methodology'
  | 'dashboard'
  | 'plans'
  | 'farms'
  | 'assistant'
  | 'history'
  | 'profile';
