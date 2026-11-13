import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  Bot, 
  Sparkles, 
  Send, 
  Sprout, 
  Plus, 
  Trash2, 
  Copy, 
  Check, 
  Info, 
  AlertTriangle, 
  BookOpen, 
  Stethoscope, 
  MapPin, 
  Droplets, 
  ExternalLink, 
  MessageSquare,
  Layers,
  X,
  Cpu,
  RefreshCw
} from 'lucide-react';
import type { 
  FarmAssessmentInput, 
  NasaPowerClimateData, 
  SoilData, 
  RotationPlan, 
  FarmRecord, 
  SavedPlanRecord,
  UserProfile, 
  ChatConversation, 
  ChatMessage, 
  PlantDoctorPayload 
} from '../types';
import { TRANSLATIONS } from '../i18n/translations';
import { dbService } from '../services/database';
import { 
  askAssistant, 
  getContextualSuggestions, 
  getDynamicPlanSuggestions,
  clearPlanQuestionsCache,
  type QuickPromptSuggestion 
} from '../services/aiAssistantClient';
import { FormattedMarkdown } from './FormattedMarkdown';

interface AIAssistantViewProps {
  language: 'ar' | 'en';
  currentUser?: UserProfile | null;
  farmInput?: FarmAssessmentInput;
  climateData?: NasaPowerClimateData | null;
  soilData?: SoilData | null;
  currentPlan?: RotationPlan | null;
  selectedPlanRecord?: SavedPlanRecord;
  farmsList?: FarmRecord[];
  onSelectFarm?: (farm: FarmRecord) => void;
  onNavigate?: (tab: any) => void;
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  language,
  currentUser,
  farmInput,
  climateData,
  soilData,
  currentPlan,
  selectedPlanRecord,
  farmsList = [],
  onSelectFarm
}) => {
  const t = TRANSLATIONS[language];
  const isAr = language === 'ar';

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [inputMessage, setInputMessage] = useState<string>('');
  const [isThinking, setIsThinking] = useState<boolean>(false);
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [showTelemetryModal, setShowTelemetryModal] = useState<boolean>(false);
  const [isDoctorPayloadAttached, setIsDoctorPayloadAttached] = useState<boolean>(false);
  const [pendingDoctorPayload, setPendingDoctorPayload] = useState<PlantDoctorPayload | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  const [isRegeneratingQuestions, setIsRegeneratingQuestions] = useState<boolean>(false);
  const [refreshCounter, setRefreshCounter] = useState<number>(0);

  // User plans and farms state
  const [savedPlans, setSavedPlans] = useState<SavedPlanRecord[]>([]);
  const [userFarms, setUserFarms] = useState<FarmRecord[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState<string>(
    selectedPlanRecord ? selectedPlanRecord.id : (currentPlan ? 'live_current' : '')
  );
  const [selectedFarmId, setSelectedFarmId] = useState<string>('');

  // Sync selectedPlanId if incoming plan props update
  useEffect(() => {
    if (selectedPlanRecord) {
      setSelectedPlanId(selectedPlanRecord.id);
    } else if (currentPlan) {
      setSelectedPlanId('live_current');
    }
  }, [selectedPlanRecord, currentPlan]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Active user ID fallback for guest demo
  const effectiveUserId = currentUser?.id || 'guest_farmer';

  // Load user chats, farms and saved plans on mount or user switch
  useEffect(() => {
    async function loadUserData() {
      try {
        const [loadedChats, loadedFarms, loadedPlans] = await Promise.all([
          dbService.getConversations(effectiveUserId),
          dbService.getFarms(effectiveUserId),
          dbService.getSavedPlans(effectiveUserId)
        ]);

        setConversations(loadedChats);
        setUserFarms(loadedFarms);
        setSavedPlans(loadedPlans);

        if (loadedChats.length > 0) {
          setActiveConversationId(loadedChats[0].id);
        } else {
          startNewConversation(false);
        }

        // Auto-select initial plan if not set
        if (!currentPlan && loadedPlans.length > 0 && !selectedPlanId) {
          setSelectedPlanId(loadedPlans[0].id);
        }
      } catch (err) {
        console.warn('Failed to load chat conversations or user plans', err);
      }
    }
    loadUserData();
  }, [effectiveUserId]);

  // Derive effective active plan based on user selection
  const effectivePlanRecord = useMemo<SavedPlanRecord | null>(() => {
    if (selectedPlanId === 'live_current' || selectedPlanId === 'none' || !selectedPlanId) {
      return null;
    }
    return savedPlans.find(p => p.id === selectedPlanId) || null;
  }, [selectedPlanId, savedPlans]);

  const effectivePlan = useMemo<RotationPlan | null>(() => {
    if (selectedPlanId === 'none') return null;
    if (selectedPlanId === 'live_current' && currentPlan) return currentPlan;
    if (effectivePlanRecord) return effectivePlanRecord.planSnapshot;
    return currentPlan || (savedPlans.length > 0 ? savedPlans[0].planSnapshot : null);
  }, [selectedPlanId, effectivePlanRecord, currentPlan, savedPlans]);

  // Combine farms
  const combinedFarms = useMemo(() => {
    const list = [...farmsList];
    for (const uf of userFarms) {
      if (!list.some(f => f.id === uf.id)) {
        list.push(uf);
      }
    }
    return list;
  }, [farmsList, userFarms]);

  // Selected farm record
  const selectedFarmRecord = useMemo(() => {
    if (!selectedFarmId) return null;
    return combinedFarms.find(f => f.id === selectedFarmId) || null;
  }, [selectedFarmId, combinedFarms]);

  // Effective farm assessment input
  const effectiveFarmInput = useMemo<FarmAssessmentInput>(() => {
    if (selectedFarmRecord) {
      return {
        districtId: selectedFarmRecord.id,
        latitude: selectedFarmRecord.latitude,
        longitude: selectedFarmRecord.longitude,
        locationName: `${selectedFarmRecord.farmName} (${selectedFarmRecord.region})`,
        soilType: selectedFarmRecord.soilType as any,
        soilPh: selectedFarmRecord.soilPh,
        organicMatterPct: 1.5,
        soilSalinityEC: selectedFarmRecord.soilSalinityEC,
        irrigationAvailability: 'medium',
        farmerPriority: 'profitability',
        previousCrop: 'fallow'
      };
    }
    return farmInput || {
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
    };
  }, [selectedFarmRecord, farmInput]);

  // Scroll to bottom when messages update
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, activeConversationId, isThinking]);

  // Get active conversation object
  const activeConversation = conversations.find(c => c.id === activeConversationId);

  // Start fresh conversation
  const startNewConversation = async (switchImmediately: boolean = true) => {
    const newId = 'chat_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now();
    const now = new Date().toISOString();

    const planNotice = effectivePlan
      ? (isAr 
          ? `\n- 📑 **الخطة الزراعية النشطة:** "${effectivePlan.titleAr}" (${effectivePlan.steps.map(s => s.crop?.nameAr || s.cropId).join(' ← ')})`
          : `\n- 📑 **Active Rotation Plan:** "${effectivePlan.titleEn}" (${effectivePlan.steps.map(s => s.crop?.nameEn || s.cropId).join(' → ')})`)
      : '';
    
    const initialWelcome: ChatMessage = {
      id: 'welcome_' + Date.now(),
      conversationId: newId,
      role: 'assistant',
      content: isAr 
        ? `أهلاً بك يا فندم في **المستشار الزراعي الذكي لـ Galaxy Planters**! 🌾🚜
${planNotice}

أنا مستشارك الزراعي الميداني المعتمد علمياً على أرصاد وكالة ناسا ومعايير الفاو (FAO-56, FAO-29) ومراكز البحوث الدولية (ICARDA, CIMMYT, ARC).

يسعدني إرشادك في:
- 🔄 **تفسير وتعديل خطتك الزراعية:** أسباب التتابع المحصولي، نوافذ الزراعة والحصاد، وتأثير تأخير البذر.
- 💧 **الاحتياج المائي الدقيق (FAO-56 ETc):** إدارة مقننات الري السطحي والتنقيط وفق رطوبة ناسا (RH2M).
- 🧂 **مقاومة الملوحة واحتياج الغسيل (FAO-29):** تشخيص مخاطر ملوحة التربة ومياه الري بدقة علمية.
- 🏅 **اختيار أفضل صنف تقاوي معتمد رسمياً:** لتربتك وموقعك الجغرافي.
- 🩺 **فحص صحة النبات وتشخيص الآفات:** بخطط المكافحة المتكاملة (IPM).

كيف يمكنني مساعدتك في مزرعتك اليوم؟`
        : `Welcome to the **Galaxy Planters AI Agricultural Advisor**! 🌾🚜
${planNotice}

I am your field agronomist grounded in NASA Earth observations, FAO irrigation standards (FAO-56, FAO-29), and international agricultural research (ICARDA, CIMMYT, ARC).

I can help you with:
- 🔄 **Interpreting & Optimizing Your Rotation Plan:** Step sequence rationale, sowing/harvest windows, and delay risk analysis.
- 💧 **Crop Water Demands (FAO-56 ETc):** Irrigation requirements aligned with NASA relative humidity (RH2M).
- 🧂 **Salinity & Leaching Fractions (FAO-29):** Mitigating soil and water salinity without assumptions.
- 🏅 **Verified Seed Variety Recommendations:** Officially registered cultivars for your exact coordinates.
- 🩺 **Crop Health & IPM Advisory:** Safe, lab-verified plant health practices.

What agricultural question can I answer for your field today?`,
      timestamp: now,
      sources: [
        {
          organization: 'FAO',
          referenceCode: 'FAO-56',
          titleEn: 'FAO-56 Crop Evapotranspiration & Water Requirements',
          titleAr: 'دليل الفاو 56 للبخر-نتح والاحتياجات المائية',
          url: 'https://www.fao.org/land-water/databases-and-software/cropwat/en/'
        },
        {
          organization: 'NASA POWER',
          referenceCode: 'NASA-POWER-2023',
          titleEn: 'NASA Agroclimatology Earth Observations',
          titleAr: 'أرصاد ناسا المناخية الزراعية التاريخية',
          url: 'https://power.larc.nasa.gov/'
        }
      ]
    };

    const newChat: ChatConversation = {
      id: newId,
      userId: effectiveUserId,
      title: isAr ? 'استشارة زراعية جديدة' : 'New Agricultural Consultation',
      farmId: effectiveFarmInput?.districtId,
      farmName: effectiveFarmInput?.locationName,
      planId: effectivePlan?.id,
      planName: effectivePlan ? (isAr ? effectivePlan.titleAr : effectivePlan.titleEn) : undefined,
      createdAt: now,
      updatedAt: now,
      messages: [initialWelcome]
    };

    try {
      await dbService.saveConversation(effectiveUserId, newChat);
      setConversations(prev => [newChat, ...prev]);
      if (switchImmediately) {
        setActiveConversationId(newId);
        setSidebarOpen(false);
      }
    } catch (err) {
      console.warn('Error creating conversation', err);
    }
  };

  // Delete conversation
  const handleDeleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm(t.assistantDeleteConfirm)) return;

    try {
      await dbService.deleteConversation(effectiveUserId, convId);
      const remaining = conversations.filter(c => c.id !== convId);
      setConversations(remaining);
      if (activeConversationId === convId) {
        if (remaining.length > 0) {
          setActiveConversationId(remaining[0].id);
        } else {
          startNewConversation(true);
        }
      }
    } catch (err) {
      console.warn('Failed to delete conversation', err);
    }
  };

  // Send message
  const handleSendMessage = async (textToSend?: string, attachedDoctorPayload?: PlantDoctorPayload | null) => {
    const text = (textToSend || inputMessage).trim();
    if (!text && !attachedDoctorPayload) return;

    let targetConvId = activeConversationId;
    if (!targetConvId || !conversations.some(c => c.id === targetConvId)) {
      await startNewConversation(true);
      targetConvId = activeConversationId;
    }

    const payloadToInclude = attachedDoctorPayload !== undefined 
      ? attachedDoctorPayload 
      : (isDoctorPayloadAttached ? pendingDoctorPayload : null);

    const now = new Date().toISOString();
    const userMsg: ChatMessage = {
      id: 'msg_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now(),
      conversationId: targetConvId,
      role: 'user',
      content: text,
      timestamp: now,
      plantDoctorPayload: payloadToInclude || undefined,
      farmContextSnapshot: {
        farmName: effectiveFarmInput?.locationName,
        latitude: effectiveFarmInput?.latitude,
        longitude: effectiveFarmInput?.longitude,
        soilType: effectiveFarmInput?.soilType,
        planId: effectivePlan?.id,
        planName: effectivePlan ? (isAr ? effectivePlan.titleAr : effectivePlan.titleEn) : undefined
      }
    };

    // Update active conversation locally
    const currentConv = conversations.find(c => c.id === targetConvId);
    const existingMessages = currentConv?.messages || [];
    const updatedMessages = [...existingMessages, userMsg];

    // Auto title from first meaningful user query
    const newTitle = currentConv?.title === 'New Agricultural Consultation' || currentConv?.title === 'استشارة زراعية جديدة'
      ? text.slice(0, 35) + (text.length > 35 ? '...' : '')
      : currentConv?.title || text.slice(0, 35);

    setConversations(prev => prev.map(c => c.id === targetConvId ? {
      ...c,
      title: newTitle,
      updatedAt: now,
      messages: updatedMessages
    } : c));

    setInputMessage('');
    setIsDoctorPayloadAttached(false);
    setPendingDoctorPayload(null);
    setIsThinking(true);

    try {
      // Persist user message to storage
      await dbService.addChatMessage(effectiveUserId, targetConvId, userMsg);

      // Call assistant service via secure server endpoint with full plan grounding
      const assistantResponse = await askAssistant({
        messages: updatedMessages.map(m => ({ role: m.role, content: m.content })),
        language,
        farmInput: effectiveFarmInput,
        climateData: climateData || undefined,
        soilData: soilData || undefined,
        currentPlan: effectivePlan || undefined,
        selectedPlanRecord: effectivePlanRecord || undefined,
        selectedFarm: selectedFarmRecord || undefined,
        plantDoctorPayload: payloadToInclude || undefined,
        conversationId: targetConvId
      });

      const assistantMsg: ChatMessage = {
        id: 'msg_' + Math.random().toString(36).substring(2, 11) + '_' + Date.now(),
        conversationId: targetConvId,
        role: 'assistant',
        content: assistantResponse.content,
        timestamp: new Date().toISOString(),
        sources: assistantResponse.sources,
        plantDoctorPayload: payloadToInclude || undefined,
        modelUsed: assistantResponse.modelUsed
      };

      await dbService.addChatMessage(effectiveUserId, targetConvId, assistantMsg);

      setConversations(prev => prev.map(c => c.id === targetConvId ? {
        ...c,
        updatedAt: assistantMsg.timestamp,
        messages: [...c.messages, assistantMsg]
      } : c));
    } catch (err) {
      console.error('Failed to communicate with assistant', err);
    } finally {
      setIsThinking(false);
    }
  };

  // Copy message text
  const handleCopyMessage = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedMessageId(id);
    setTimeout(() => setCopiedMessageId(null), 2000);
  };

  // Dynamic questions genuinely generated for the active plan or general field
  const quickSuggestions: QuickPromptSuggestion[] = useMemo(() => {
    if (effectivePlan && effectivePlan.steps && effectivePlan.steps.length > 0) {
      return getDynamicPlanSuggestions(
        effectivePlan, 
        effectiveFarmInput, 
        climateData || undefined, 
        language, 
        refreshCounter > 0
      );
    }
    return getContextualSuggestions(effectiveFarmInput, climateData || undefined, null);
  }, [effectiveFarmInput, climateData, effectivePlan, language, refreshCounter]);

  // Regenerate dynamic questions on farmer demand
  const handleRegenerateQuestions = () => {
    setIsRegeneratingQuestions(true);
    if (effectivePlan?.id) {
      clearPlanQuestionsCache(effectivePlan.id);
    } else {
      clearPlanQuestionsCache();
    }
    setRefreshCounter(prev => prev + 1);
    setTimeout(() => {
      setIsRegeneratingQuestions(false);
    }, 400);
  };

  // Trigger quick prompt
  const handleSelectQuickPrompt = (s: QuickPromptSuggestion) => {
    const prompt = isAr ? s.promptAr : s.promptEn;
    if (s.simulatedPlantDoctorPayload) {
      setIsDoctorPayloadAttached(true);
      setPendingDoctorPayload(s.simulatedPlantDoctorPayload);
      handleSendMessage(prompt, s.simulatedPlantDoctorPayload);
    } else {
      handleSendMessage(prompt, null);
    }
  };

  return (
    <div className="min-h-[85vh] bg-[#F7F8F4] text-[#202923] flex flex-col font-sans w-full max-w-full overflow-hidden">
      {/* Top Agricultural Context Bar */}
      <header className="bg-white border-b border-[#E3E8DE] px-3 sm:px-4 py-2.5 sm:py-3 shadow-xs sticky top-0 z-20">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-2.5 sm:gap-3">
          {/* Left: Branding & Connection Status */}
          <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="md:hidden p-1.5 sm:p-2 text-[#202923] hover:bg-[#F2F5EE] rounded-lg transition-colors shrink-0"
              title="Toggle Conversations"
            >
              <MessageSquare className="w-5 h-5 text-forest-700" />
            </button>
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-[#174C35] to-[#256345] flex items-center justify-center text-white shadow-sm shrink-0">
              <Bot className="w-5 h-5 text-emerald-200" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 sm:gap-2">
                <h1 className="text-sm sm:text-lg font-bold text-[#174C35] truncate">
                  {t.assistantTitle}
                </h1>
                {/* Scientific Advisor Status Badge */}
                <span className="inline-flex items-center px-1.5 sm:px-2 py-0.5 rounded-full text-[10px] sm:text-xs font-semibold bg-emerald-50 text-[#174C35] border border-emerald-200 shadow-2xs shrink-0">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-600 animate-pulse me-1" />
                  <Cpu className="w-3 h-3 me-0.5 sm:me-1 text-emerald-700" />
                  <span className="hidden xs:inline">{t.assistantModelConnected}</span>
                </span>
              </div>
              <p className="text-xs text-stone-500 hidden sm:block truncate">
                {t.assistantSubtitle}
              </p>
            </div>
          </div>

          {/* Right: Farm & Plan Context Selectors */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 w-full sm:w-auto">
            {/* Farm Selector */}
            <div className="flex items-center gap-1 flex-1 sm:flex-initial min-w-0">
              <MapPin className="w-3.5 h-3.5 text-[#174C35] shrink-0" />
              <select
                aria-label={t.assistantSelectFarm}
                value={selectedFarmId}
                onChange={(e) => {
                  setSelectedFarmId(e.target.value);
                  const found = combinedFarms.find(f => f.id === e.target.value);
                  if (found && onSelectFarm) onSelectFarm(found);
                }}
                className="text-xs bg-[#F7F8F4] border border-[#D5DDD2] rounded-lg px-2 sm:px-2.5 py-1.5 font-medium text-[#202923] focus:outline-hidden focus:ring-1 focus:ring-[#174C35] w-full sm:max-w-[180px] truncate"
              >
                <option value="">{effectiveFarmInput?.locationName || t.assistantActiveFarm}</option>
                {combinedFarms.map(f => (
                  <option key={f.id} value={f.id}>{f.farmName} ({f.region})</option>
                ))}
              </select>
            </div>

            {/* Plan Selector */}
            <div className="flex items-center gap-1 flex-1 sm:flex-initial min-w-0">
              <Layers className="w-3.5 h-3.5 text-emerald-700 shrink-0" />
              <select
                aria-label={t.assistantSelectPlan}
                value={selectedPlanId}
                onChange={(e) => setSelectedPlanId(e.target.value)}
                className="text-xs bg-[#F7F8F4] border border-[#D5DDD2] rounded-lg px-2 sm:px-2.5 py-1.5 font-medium text-[#202923] focus:outline-hidden focus:ring-1 focus:ring-[#174C35] w-full sm:max-w-[220px] truncate"
              >
                {currentPlan && (
                  <option value="live_current">
                    {isAr ? `⚡ ${currentPlan.titleAr} (${t.assistantLivePlan})` : `⚡ ${currentPlan.titleEn} (${t.assistantLivePlan})`}
                  </option>
                )}
                {savedPlans.map(p => (
                  <option key={p.id} value={p.id}>
                    📑 {isAr ? p.planSnapshot.titleAr : p.planSnapshot.titleEn} ({p.farmName})
                  </option>
                ))}
                <option value="none">-- {t.assistantNoPlanSelected} --</option>
              </select>
            </div>

            {/* Field Telemetry Quick Drawer Button */}
            <button
              onClick={() => setShowTelemetryModal(!showTelemetryModal)}
              className="inline-flex items-center gap-1 px-2 sm:px-2.5 py-1.5 text-xs font-medium bg-[#EEF3EA] text-[#174C35] hover:bg-[#E3ECE0] rounded-lg border border-[#D0DEC9] transition-all shrink-0"
              title="View Soil & Climate Telemetry"
            >
              <Droplets className="w-3 h-3 text-emerald-700 shrink-0" />
              <span className="hidden sm:inline">RH:</span>
              <span className="font-semibold">{(climateData?.avgRelativeHumidityPct ?? 38.5).toFixed(0)}%</span>
              <Info className="w-3 h-3 ms-0.5 text-stone-500" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout: Sidebar + Chat Stream */}
      <div className="max-w-7xl mx-auto w-full flex-1 flex overflow-hidden relative">
        {/* Mobile Sidebar Backdrop */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 z-20 bg-stone-900/40 backdrop-blur-xs md:hidden"
          />
        )}

        {/* Left Sidebar: Saved Consultations */}
        <aside
          className={`
            fixed md:static inset-y-0 ${isAr ? 'right-0' : 'left-0'} z-30
            w-72 sm:w-80 bg-white border-e border-[#E3E8DE] flex flex-col transition-transform duration-300 ease-in-out
            ${sidebarOpen ? 'translate-x-0' : (isAr ? 'translate-x-full md:translate-x-0' : '-translate-x-full md:translate-x-0')}
          `}
        >
          {/* Sidebar Header */}
          <div className="p-3.5 border-b border-[#E3E8DE] flex items-center justify-between gap-2">
            <button
              onClick={() => startNewConversation(true)}
              className="w-full inline-flex items-center justify-center gap-2 px-3 py-2 bg-[#174C35] hover:bg-[#123B2A] text-white rounded-lg text-xs font-medium shadow-xs transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>{t.assistantNewChat}</span>
            </button>
            <button
              onClick={() => setSidebarOpen(false)}
              className="md:hidden p-2 text-stone-500 hover:text-stone-800"
              title="Close Drawer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Active Plan Indicator Badge in Sidebar */}
          {effectivePlan && (
            <div className="px-3.5 py-2.5 bg-[#F2F6EF] border-b border-[#E0E9DC] text-xs">
              <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#174C35] mb-1">
                <Layers className="w-3 h-3" />
                <span>{isAr ? 'الخطة قيد المناقشة' : 'Active Discussion Plan'}:</span>
              </div>
              <p className="font-semibold text-stone-800 truncate">
                {isAr ? effectivePlan.titleAr : effectivePlan.titleEn}
              </p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {effectivePlan.steps.map((st, sIdx) => (
                  <span key={sIdx} className="text-[10px] px-1.5 py-0.5 rounded bg-white text-emerald-900 border border-[#D5E0CF]">
                    {isAr ? st.crop?.nameAr || st.cropId : st.crop?.nameEn || st.cropId}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Consultation List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="p-6 text-center text-xs text-stone-400">
                <MessageSquare className="w-8 h-8 mx-auto mb-2 opacity-40 text-stone-500" />
                <p>{t.assistantNoConversations}</p>
              </div>
            ) : (
              conversations.map(conv => {
                const isActive = conv.id === activeConversationId;
                return (
                  <div
                    key={conv.id}
                    onClick={() => {
                      setActiveConversationId(conv.id);
                      setSidebarOpen(false);
                    }}
                    className={`
                      group relative w-full text-start p-2.5 rounded-lg text-xs cursor-pointer transition-all flex items-start justify-between gap-2
                      ${isActive 
                        ? 'bg-[#EEF3EA] text-[#174C35] font-semibold border border-[#D0DEC9]' 
                        : 'text-stone-700 hover:bg-[#F7F8F4]'}
                    `}
                  >
                    <div className="flex items-start gap-2 overflow-hidden">
                      <MessageSquare className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${isActive ? 'text-[#174C35]' : 'text-stone-400'}`} />
                      <div className="overflow-hidden">
                        <p className="truncate leading-snug">{conv.title}</p>
                        <span className="text-[10px] text-stone-400 font-normal">
                          {new Date(conv.updatedAt).toLocaleDateString(isAr ? 'ar-EG' : 'en-US', {
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      className="opacity-0 group-hover:opacity-100 hover:text-red-600 p-1 text-stone-400 transition-opacity"
                      title={t.assistantDeleteConfirm}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>

          {/* Plant Doctor Simulation Shortcut */}
          <div className="p-3 border-t border-[#E3E8DE] bg-[#F9FAF8]">
            <div className="text-[11px] font-semibold text-stone-600 mb-1.5 flex items-center gap-1.5">
              <Stethoscope className="w-3.5 h-3.5 text-emerald-700" />
              <span>{isAr ? 'تكامل طبيب النبات (Plant Doctor)' : 'Plant Doctor Integration'}</span>
            </div>
            <button
              onClick={() => {
                const docSuggestion = quickSuggestions.find(s => s.category === 'doctor');
                if (docSuggestion) handleSelectQuickPrompt(docSuggestion);
              }}
              className="w-full text-start text-[11px] p-2 rounded-lg bg-white border border-[#DCE4D8] hover:border-emerald-600 text-stone-700 hover:text-[#174C35] transition-colors flex items-center justify-between"
            >
              <span>{isAr ? 'محاكاة تشخيص الصدأ الأصفر' : 'Simulate Rust Diagnosis'}</span>
              <Sparkles className="w-3 h-3 text-amber-500" />
            </button>
          </div>
        </aside>

        {/* Backdrop for mobile sidebar */}
        {sidebarOpen && (
          <div 
            onClick={() => setSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-stone-900/40 backdrop-blur-xs z-20"
          />
        )}

        {/* Right Main Chat Panel */}
        <main className="flex-1 flex flex-col bg-white overflow-hidden shadow-xs">
          {/* Consultation Mode Indicator Banner */}
          {effectivePlan && selectedPlanId !== 'none' ? (
            <div className="bg-emerald-50/90 border-b border-emerald-200/90 px-4 py-2.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-2xs">
              <div className="flex items-center gap-2.5 flex-wrap">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-800 text-white font-bold text-[11px] shadow-2xs">
                  <Layers className="w-3.5 h-3.5 text-emerald-300" />
                  <span>{t.planConsultationMode}</span>
                </span>
                <span className="font-bold text-emerald-950 text-sm">
                  {isAr ? effectivePlan.titleAr : effectivePlan.titleEn}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-emerald-200/70 text-emerald-950 font-bold text-[10px]">
                  {effectivePlan.overallScore}/100
                </span>
              </div>

              {/* Crop sequence flow pills with icons */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[11px] text-emerald-900 font-bold">
                  {t.planCropSequence}
                </span>
                <div className="flex items-center gap-1 flex-wrap">
                  {effectivePlan.steps.map((step, idx) => (
                    <React.Fragment key={idx}>
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-white text-emerald-950 text-[11px] font-semibold border border-emerald-200/80 shadow-2xs">
                        <span>{step.crop ? (isAr ? step.crop.nameAr.split(' ')[0] : step.crop.nameEn.split(' ')[0]) : step.cropId}</span>
                        {step.varietyRecommendation && (
                          <span className="text-[10px] text-emerald-700 font-normal">
                            ({isAr ? step.varietyRecommendation.varietyNameAr.split(' ')[0] : step.varietyRecommendation.varietyName.split(' ')[0]})
                          </span>
                        )}
                      </span>
                      {idx < effectivePlan.steps.length - 1 && (
                        <span className="text-emerald-500 font-bold text-xs">➔</span>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedPlanId('none')}
                  className="ms-2 text-[10px] text-emerald-700 hover:text-emerald-900 underline font-medium cursor-pointer"
                >
                  {t.switchToGeneralMode}
                </button>
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 border-b border-slate-200/90 px-4 py-2 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-2 shadow-2xs">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 text-white font-bold text-[11px]">
                  <MapPin className="w-3 h-3 text-slate-300" />
                  <span>{t.generalConsultationMode}</span>
                </span>
                <span className="text-slate-700 font-semibold text-xs">
                  {effectiveFarmInput?.locationName} • {effectiveFarmInput?.soilType} (ECe: {effectiveFarmInput?.soilSalinityEC ?? 1.2} dS/m)
                </span>
              </div>
              {savedPlans.length > 0 && (
                <div className="flex items-center gap-1.5">
                  <span className="text-slate-500 text-[11px]">{t.attachPlan}:</span>
                  <select
                    value=""
                    onChange={(e) => {
                      if (e.target.value) setSelectedPlanId(e.target.value);
                    }}
                    className="text-xs bg-white border border-slate-300 rounded px-2 py-1 font-medium text-slate-700"
                  >
                    <option value="">-- {t.assistantSelectPlan} --</option>
                    {savedPlans.map(p => (
                      <option key={p.id} value={p.id}>
                        {isAr ? p.planSnapshot.titleAr : p.planSnapshot.titleEn}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          )}

          {/* Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
            {(!activeConversation || activeConversation.messages.length === 0) ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-8 max-w-lg mx-auto">
                <div className="w-14 h-14 rounded-2xl bg-[#EEF3EA] flex items-center justify-center text-[#174C35] mb-4 shadow-xs">
                  <Sprout className="w-7 h-7" />
                </div>
                <h3 className="text-lg font-bold text-[#174C35] mb-2">
                  {t.assistantTitle}
                </h3>
                <p className="text-xs text-stone-600 leading-relaxed mb-6">
                  {t.assistantSubtitle}
                </p>
              </div>
            ) : (
              activeConversation.messages.map((message) => {
                const isAssistant = message.role === 'assistant';
                return (
                  <div
                    key={message.id}
                    className={`flex items-start gap-3 sm:gap-4 ${isAssistant ? '' : 'flex-row-reverse'}`}
                  >
                    {/* Avatar */}
                    <div
                      className={`
                        w-8 h-8 sm:w-9 sm:h-9 rounded-xl flex items-center justify-center shrink-0 shadow-xs
                        ${isAssistant 
                          ? 'bg-gradient-to-br from-[#174C35] to-[#205e43] text-emerald-200' 
                          : 'bg-[#202923] text-white'}
                      `}
                    >
                      {isAssistant ? <Bot className="w-4 h-4 sm:w-5 sm:h-5" /> : <span className="text-xs font-bold">You</span>}
                    </div>

                    {/* Message Bubble */}
                    <div className="max-w-[95%] sm:max-w-[82%] space-y-2 min-w-0">
                      {/* Attached Plant Doctor Payload Banner */}
                      {message.plantDoctorPayload && (
                        <div className="bg-amber-50 border border-amber-200 rounded-lg p-2.5 text-xs text-amber-900 flex items-start gap-2 shadow-xs">
                          <Stethoscope className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                          <div className="min-w-0">
                            <div className="font-bold flex items-center gap-1.5 flex-wrap">
                              <span>{t.assistantDoctorPayloadAttached}:</span>
                              <span className="text-amber-800">
                                {isAr 
                                  ? (message.plantDoctorPayload.cropCommonNameAr || message.plantDoctorPayload.plantCropId)
                                  : (message.plantDoctorPayload.cropCommonNameEn || message.plantDoctorPayload.plantCropId)}
                              </span>
                            </div>
                            <p className="text-[11px] text-amber-800 mt-0.5 break-words">
                              {message.plantDoctorPayload.suspectedPathogenOrPest} (Confidence: {message.plantDoctorPayload.confidencePct}%)
                            </p>
                          </div>
                        </div>
                      )}

                      <div
                        className={`
                          p-3.5 sm:p-5 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs break-words
                          ${isAssistant 
                            ? 'bg-[#F9FAF8] border border-[#E5EBE0] text-[#202923]' 
                            : 'bg-[#174C35] text-white rounded-br-xs'}
                        `}
                      >
                        {/* Clean Formatted Markdown (Eliminates ### and ** leakage) */}
                        <FormattedMarkdown
                          content={message.content}
                          isUser={!isAssistant}
                        />

                        {/* Verified Scientific Source Citations */}
                        {isAssistant && message.sources && message.sources.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-[#E3E8DE]">
                            <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#174C35] mb-2">
                              <BookOpen className="w-3.5 h-3.5 text-emerald-700" />
                              <span>{t.assistantSources}</span>
                            </div>
                            <div className="flex flex-wrap gap-1.5">
                              {message.sources.map((src, sIdx) => (
                                <a
                                  key={sIdx}
                                  href={src.url || '#'}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-white border border-[#D5E0CF] text-[11px] font-medium text-stone-700 hover:text-[#174C35] hover:border-[#174C35] transition-all shadow-2xs"
                                >
                                  <span className="font-semibold text-emerald-800">[{src.organization}]</span>
                                  <span className="truncate max-w-[200px]">{isAr ? src.titleAr : src.titleEn}</span>
                                  {src.url && <ExternalLink className="w-2.5 h-2.5 opacity-60 ms-0.5" />}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Message Footer Info (Timestamp, Model & Copy Action) */}
                      <div className={`flex items-center gap-2 text-[10px] text-stone-400 ${isAssistant ? 'justify-start' : 'justify-end'}`}>
                        <span>
                          {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {isAssistant && message.modelUsed && (
                          <span className="text-[9px] px-1.5 py-0.2 rounded bg-stone-100 text-stone-500 font-mono">
                            {message.modelUsed}
                          </span>
                        )}
                        <button
                          onClick={() => handleCopyMessage(message.id, message.content)}
                          className="hover:text-stone-700 p-0.5 rounded transition-colors"
                          title="Copy message"
                        >
                          {copiedMessageId === message.id ? (
                            <Check className="w-3 h-3 text-emerald-600" />
                          ) : (
                            <Copy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            )}

            {/* Thinking / Streaming Indicator */}
            {isThinking && (
              <div className="flex items-start gap-3 sm:gap-4">
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#174C35] to-[#256345] flex items-center justify-center text-emerald-200 shrink-0">
                  <Bot className="w-4 h-4 animate-pulse" />
                </div>
                <div className="bg-[#F9FAF8] border border-[#E5EBE0] p-4 rounded-2xl text-xs text-stone-600 flex items-center gap-3 shadow-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-ping" />
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce delay-100" />
                    <span className="w-2 h-2 rounded-full bg-emerald-600 animate-bounce delay-200" />
                  </div>
                  <span>{t.assistantThinking}</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Dynamic Suggested Questions Panel */}
          <div className="px-3 sm:px-4 py-2 sm:py-3 border-t border-[#EEF2E9] bg-[#FAFCF8] space-y-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#174C35]">
                <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                <span>{effectivePlan && selectedPlanId !== 'none' ? t.dynamicQuestionsTitle : t.assistantQuickQuestions}</span>
              </div>
              {effectivePlan && selectedPlanId !== 'none' && (
                <button
                  type="button"
                  onClick={handleRegenerateQuestions}
                  disabled={isThinking || isRegeneratingQuestions}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-emerald-800 bg-white hover:bg-emerald-50 rounded-lg border border-emerald-200 transition-all cursor-pointer disabled:opacity-50 shadow-2xs"
                  title={t.regenerateQuestions}
                >
                  <RefreshCw className={`w-3 h-3 ${isRegeneratingQuestions ? 'animate-spin' : ''}`} />
                  <span className="hidden sm:inline">{t.regenerateQuestions}</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
              {quickSuggestions.map(sug => (
                <button
                  key={sug.id}
                  onClick={() => handleSelectQuickPrompt(sug)}
                  disabled={isThinking}
                  className="text-start p-2.5 rounded-xl bg-white border border-[#DCE4D8] hover:border-emerald-600 hover:bg-[#EEF3EA] text-stone-800 hover:text-[#174C35] transition-all shadow-2xs group flex flex-col justify-between gap-1 cursor-pointer disabled:opacity-50 min-w-0"
                >
                  <div className="flex items-center justify-between gap-1">
                    <span className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                      sug.category === 'rotation' ? 'bg-emerald-100 text-emerald-900' :
                      sug.category === 'varieties' ? 'bg-amber-100 text-amber-900' :
                      sug.category === 'salinity' ? 'bg-sky-100 text-sky-900' :
                      sug.category === 'water' ? 'bg-blue-100 text-blue-900' :
                      'bg-purple-100 text-purple-900'
                    }`}>
                      {sug.category}
                    </span>
                    <span className="text-[10px] text-stone-400 group-hover:text-emerald-700">↵</span>
                  </div>
                  <p className="text-xs font-semibold leading-snug break-words">
                    {isAr ? sug.labelAr : sug.labelEn}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {/* Plant Doctor Attached Notice Bar */}
          {isDoctorPayloadAttached && pendingDoctorPayload && (
            <div className="px-3 sm:px-4 py-2 bg-amber-50 border-t border-amber-200 flex items-center justify-between text-xs text-amber-900 gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Stethoscope className="w-4 h-4 text-amber-700 shrink-0" />
                <span className="font-bold shrink-0">{t.assistantDoctorPayloadAttached}:</span>
                <span className="truncate">{pendingDoctorPayload.suspectedPathogenOrPest} ({pendingDoctorPayload.cropCommonNameEn})</span>
              </div>
              <button
                onClick={() => {
                  setIsDoctorPayloadAttached(false);
                  setPendingDoctorPayload(null);
                }}
                className="text-amber-800 hover:text-amber-950 p-1 shrink-0"
                title="Remove attached diagnosis"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

          {/* Chat Input Bar */}
          <div className="p-2.5 sm:p-4 bg-white border-t border-[#E3E8DE]">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSendMessage();
              }}
              className="flex items-end gap-2"
            >
              <div className="flex-1 relative min-w-0">
                <textarea
                  ref={textareaRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  rows={2}
                  placeholder={t.assistantChatPlaceholder}
                  disabled={isThinking}
                  className="w-full text-xs sm:text-sm px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl border border-[#D5DDD2] focus:border-[#174C35] focus:ring-1 focus:ring-[#174C35] focus:outline-hidden resize-none bg-[#FDFEFC] text-[#202923] placeholder-stone-400 leading-relaxed"
                />
              </div>

              <button
                type="submit"
                disabled={isThinking || (!inputMessage.trim() && !isDoctorPayloadAttached)}
                className="h-10 sm:h-11 px-3.5 sm:px-5 rounded-xl bg-[#174C35] hover:bg-[#123B2A] text-white flex items-center justify-center gap-1.5 font-medium text-xs sm:text-sm shadow-xs transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
              >
                <Send className="w-4 h-4 shrink-0" />
                <span className="hidden sm:inline">{t.assistantSend}</span>
              </button>
            </form>

            <p className="text-[10px] text-stone-400 mt-1.5 text-center">
              {t.assistantDisclaimer}
            </p>
          </div>
        </main>
      </div>

      {/* Field Telemetry Inspection Modal / Drawer */}
      {showTelemetryModal && (
        <div className="fixed inset-0 z-50 bg-stone-900/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-[#D5DDD2] space-y-4">
            <div className="flex items-center justify-between border-b border-[#E3E8DE] pb-3">
              <div className="flex items-center gap-2 text-[#174C35] font-bold text-sm">
                <MapPin className="w-4 h-4" />
                <span>{t.assistantContextDrawerTitle}</span>
              </div>
              <button
                onClick={() => setShowTelemetryModal(false)}
                className="text-stone-400 hover:text-stone-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#F7F8F4] border border-[#E3E8DE]">
                <span className="text-stone-500 font-medium block">Coordinates</span>
                <span className="font-bold text-[#174C35] text-sm">
                  {effectiveFarmInput?.latitude?.toFixed(4) ?? 26.55}°N, {effectiveFarmInput?.longitude?.toFixed(4) ?? 31.70}°E
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">{effectiveFarmInput?.locationName || 'Sohag, Egypt'}</span>
              </div>

              <div className="p-3 rounded-xl bg-[#F7F8F4] border border-[#E3E8DE]">
                <span className="text-stone-500 font-medium block">Soil Texture & pH</span>
                <span className="font-bold text-[#174C35] text-sm">
                  {effectiveFarmInput?.soilType || 'Clay Loam'} (pH {effectiveFarmInput?.soilPh ?? 7.8})
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">Organic Matter: {effectiveFarmInput?.organicMatterPct ?? 1.5}%</span>
              </div>

              <div className="p-3 rounded-xl bg-[#F7F8F4] border border-[#E3E8DE]">
                <span className="text-stone-500 font-medium block">Salinity (ECe & ECw)</span>
                <span className="font-bold text-[#174C35] text-sm">
                  ECe: {effectiveFarmInput?.soilSalinityEC ?? 1.2} dS/m
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">
                  Water ECw: {effectiveFarmInput?.irrigationWaterSalinityECw ? `${effectiveFarmInput.irrigationWaterSalinityECw} dS/m` : 'Unmeasured (Not Specified)'}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-[#F7F8F4] border border-[#E3E8DE]">
                <span className="text-stone-500 font-medium block">NASA Relative Humidity</span>
                <span className="font-bold text-[#174C35] text-sm">
                  {(climateData?.avgRelativeHumidityPct ?? 38.5).toFixed(1)}% RH2M
                </span>
                <span className="text-[10px] text-stone-400 block mt-0.5">
                  Summer: {(climateData?.summerAvgRhPct ?? 32).toFixed(1)}% | Winter: {(climateData?.winterAvgRhPct ?? 48).toFixed(1)}%
                </span>
              </div>
            </div>

            {effectivePlan && (
              <div className="p-3 rounded-xl bg-[#EEF3EA] border border-[#D5E0CF] text-xs">
                <span className="text-stone-500 font-medium block">{t.assistantActivePlan}</span>
                <span className="font-bold text-[#174C35] text-sm block mt-0.5">
                  {isAr ? effectivePlan.titleAr : effectivePlan.titleEn}
                </span>
                <span className="text-[10px] text-stone-600 block mt-1">
                  {effectivePlan.steps.length} Seasons: {effectivePlan.steps.map(s => `${s.seasonLabelEn} (${s.crop?.nameEn || s.cropId})`).join(' → ')}
                </span>
              </div>
            )}

            <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold block">NASA POWER Agroclimatology Reanalysis Notice:</span>
                Climate values reflect historical daily satellite-derived reanalysis observations for coordinates ({effectiveFarmInput?.latitude ?? 26.55}, {effectiveFarmInput?.longitude ?? 31.70}) during the observation baseline period ({climateData?.startDate || '2024-01-01'} to {climateData?.endDate || '2024-12-31'}), not live instantaneous forecasts.
              </div>
            </div>

            <button
              onClick={() => setShowTelemetryModal(false)}
              className="w-full py-2.5 bg-[#174C35] text-white rounded-xl text-xs font-semibold hover:bg-[#123B2A] transition-colors"
            >
              {isAr ? 'إغلاق نافذة القياسات' : 'Close Telemetry Window'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
