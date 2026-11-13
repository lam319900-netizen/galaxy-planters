import React, { useState } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { UnitProvider } from './context/UnitContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { HomeView } from './components/HomeView';
import { AssessmentForm } from './components/AssessmentForm';
import { ResultsView } from './components/ResultsView';
import { MethodologyView } from './components/MethodologyView';
import { DashboardView } from './components/DashboardView';
import { SavedPlansView } from './components/SavedPlansView';
import { FarmsView } from './components/FarmsView';
import { ActivityHistoryView } from './components/ActivityHistoryView';
import { ProfileView } from './components/ProfileView';
import { AIAssistantView } from './components/AIAssistantView';
import { AuthModal } from './components/AuthModal';
import type { 
  FarmAssessmentInput, 
  NasaPowerClimateData, 
  RotationPlan,
  NavigationTab,
  SavedPlanRecord,
  FarmRecord
} from './types';
import { generateRotationPlans } from './services/recommendationEngine';
import { fetchSoilData } from './services/soilGrids';
import { dbService } from './services/database';

const SmartCropApp: React.FC = () => {
  const { user } = useAuth();
  const { language } = useLanguage();
  const [currentTab, setCurrentTab] = useState<NavigationTab>('home');
  const [farmInput, setFarmInput] = useState<FarmAssessmentInput | null>(null);
  const [climateData, setClimateData] = useState<NasaPowerClimateData | null>(null);
  const [plans, setPlans] = useState<RotationPlan[] | null>(null);

  // Saved plan snapshot viewing state
  const [isSavedSnapshot, setIsSavedSnapshot] = useState(false);
  const [savedPlanMetadata, setSavedPlanMetadata] = useState<{
    planId: string;
    planName: string;
    savedAt: string;
    notes?: string;
  } | undefined>(undefined);
  const [activeSavedRecord, setActiveSavedRecord] = useState<SavedPlanRecord | null>(null);
  const [selectedPlanForAssistant, setSelectedPlanForAssistant] = useState<RotationPlan | null>(null);
  const [selectedPlanRecordForAssistant, setSelectedPlanRecordForAssistant] = useState<SavedPlanRecord | null>(null);

  const handleAskAboutPlan = (plan: RotationPlan, savedRecord?: SavedPlanRecord) => {
    setSelectedPlanForAssistant(plan);
    setSelectedPlanRecordForAssistant(savedRecord || null);
    if (savedRecord) {
      if (savedRecord.originalInputs) setFarmInput(savedRecord.originalInputs);
      if (savedRecord.climateDataSnapshot) setClimateData(savedRecord.climateDataSnapshot);
    }
    setCurrentTab('assistant');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleAskAboutSavedPlan = (savedRecord: SavedPlanRecord) => {
    handleAskAboutPlan(savedRecord.planSnapshot, savedRecord);
  };

  const handleGeneratePlans = async (input: FarmAssessmentInput, climate: NasaPowerClimateData) => {
    // Retrieve soil data
    const soil = await fetchSoilData(
      input.latitude,
      input.longitude,
      input.soilType,
      input.soilPh,
      input.organicMatterPct,
      input.soilSalinityEC
    );

    // Run transparent rule-based recommendation engine
    const generated = generateRotationPlans(input, climate, soil);

    setFarmInput(input);
    setClimateData(climate);
    setPlans(generated);
    setIsSavedSnapshot(false);
    setSavedPlanMetadata(undefined);
    setActiveSavedRecord(null);
    setCurrentTab('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSavedPlan = (savedRecord: SavedPlanRecord) => {
    setActiveSavedRecord(savedRecord);
    setFarmInput(savedRecord.originalInputs);
    setClimateData(savedRecord.climateDataSnapshot);
    setPlans([savedRecord.planSnapshot]);
    setIsSavedSnapshot(true);
    setSavedPlanMetadata({
      planId: savedRecord.id,
      planName: savedRecord.planName,
      savedAt: savedRecord.createdAt,
      notes: savedRecord.userNotes
    });
    setCurrentTab('results');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleOpenSavedPlanById = async (planId: string) => {
    try {
      const plan = await dbService.getPlan(planId);
      if (plan) {
        handleOpenSavedPlan(plan);
      }
    } catch (e) {
      console.warn('Could not load plan by ID:', e);
    }
  };

  const handleRegenerateLive = async (savedRecord?: SavedPlanRecord) => {
    const record = savedRecord || activeSavedRecord;
    if (!record) return;

    try {
      const input = record.originalInputs;
      const climate = record.climateDataSnapshot;
      const soil = await fetchSoilData(
        input.latitude,
        input.longitude,
        input.soilType,
        input.soilPh,
        input.organicMatterPct,
        input.soilSalinityEC
      );

      const generated = generateRotationPlans(input, climate, soil);
      setFarmInput(input);
      setClimateData(climate);
      setPlans(generated);
      setIsSavedSnapshot(false);
      setSavedPlanMetadata(undefined);
      setActiveSavedRecord(null);
      setCurrentTab('results');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      console.error('Error re-evaluating plan live:', e);
    }
  };

  const handleAssessFarm = (farm: FarmRecord) => {
    const initialInput: FarmAssessmentInput = {
      farmId: farm.id,
      farmName: farm.farmName,
      districtId: 'custom',
      latitude: farm.latitude,
      longitude: farm.longitude,
      locationName: `${farm.farmName} (${farm.region || farm.country})`,
      soilType: farm.soilType,
      soilPh: farm.soilPh,
      organicMatterPct: farm.organicMatterPct,
      soilSalinityEC: farm.soilSalinityEC,
      irrigationAvailability: farm.irrigationAvailability,
      farmerPriority: farm.farmerPriority,
      previousCrop: farm.previousCrop || 'fallow',
      irrigationWaterSalinityECw: farm.irrigationWaterSalinityECw
    };

    setFarmInput(initialInput);
    setIsSavedSnapshot(false);
    setSavedPlanMetadata(undefined);
    setActiveSavedRecord(null);
    setCurrentTab('assessment');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen w-full max-w-full flex flex-col bg-slate-50 text-slate-800 selection:bg-crop-200 selection:text-crop-900 overflow-x-hidden">
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        hasResults={plans !== null && plans.length > 0}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-3.5 sm:px-6 lg:px-8 py-4 sm:py-6 min-w-0">
        {currentTab === 'home' && (
          <HomeView
            onStartAssessment={() => {
              setCurrentTab('assessment');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onExploreMethodology={() => {
              setCurrentTab('methodology');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentTab === 'dashboard' && (
          <DashboardView
            onNavigate={(tab) => {
              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onOpenSavedPlan={handleOpenSavedPlan}
            onAskAboutPlan={handleAskAboutSavedPlan}
          />
        )}

        {currentTab === 'plans' && (
          <SavedPlansView
            onOpenSavedPlan={handleOpenSavedPlan}
            onRegeneratePlan={handleRegenerateLive}
            onStartNewAssessment={() => {
              setCurrentTab('assessment');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onAskAboutPlan={handleAskAboutSavedPlan}
          />
        )}

        {currentTab === 'farms' && (
          <FarmsView
            onAssessFarm={handleAssessFarm}
          />
        )}

        {currentTab === 'history' && (
          <ActivityHistoryView
            onOpenSavedPlan={handleOpenSavedPlanById}
          />
        )}

        {currentTab === 'profile' && (
          <ProfileView />
        )}

        {currentTab === 'assistant' && (
          <AIAssistantView
            language={language}
            currentUser={user}
            farmInput={farmInput || {
              districtId: 'custom',
              latitude: 26.55,
              longitude: 31.70,
              locationName: 'Sohag, Egypt',
              soilType: 'clay_loam',
              soilPh: 7.8,
              organicMatterPct: 1.5,
              soilSalinityEC: 1.2,
              irrigationAvailability: 'medium',
              farmerPriority: 'profitability',
              previousCrop: 'fallow'
            }}
            climateData={climateData}
            currentPlan={selectedPlanForAssistant || (plans ? plans[0] : null)}
            selectedPlanRecord={selectedPlanRecordForAssistant || undefined}
            onNavigate={(tab) => {
              setCurrentTab(tab);
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
          />
        )}

        {currentTab === 'assessment' && (
          <AssessmentForm
            onGeneratePlans={handleGeneratePlans}
            initialInput={farmInput}
            initialClimate={climateData}
          />
        )}

        {currentTab === 'results' && plans && farmInput && climateData && (
          <ResultsView
            plans={plans}
            input={farmInput}
            climate={climateData}
            onModifyAssessment={() => {
              setCurrentTab('assessment');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            isSavedSnapshot={isSavedSnapshot}
            savedPlanMetadata={savedPlanMetadata}
            onRegenerateLive={activeSavedRecord ? () => handleRegenerateLive(activeSavedRecord) : undefined}
            onViewSavedPlans={() => {
              setCurrentTab('plans');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            onAskAboutPlan={handleAskAboutPlan}
          />
        )}

        {currentTab === 'methodology' && (
          <MethodologyView />
        )}
      </main>

      <Footer />

      {/* Global Auth Modal & Guest-to-User Plan Bridge */}
      <AuthModal
        onPlanSavedRedirect={() => {
          setCurrentTab('plans');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
      />
    </div>
  );
};

export default function App() {
  return (
    <LanguageProvider>
      <UnitProvider>
        <AuthProvider>
          <SmartCropApp />
        </AuthProvider>
      </UnitProvider>
    </LanguageProvider>
  );
}
