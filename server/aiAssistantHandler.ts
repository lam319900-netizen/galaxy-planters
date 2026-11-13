import type { IncomingMessage, ServerResponse } from 'http';
import { 
  buildAgronomicContext, 
  buildSystemPrompt, 
  generateGroundedAssistantResponse, 
  findRelevantCropsInQuery,
  type AIAssistantRequest, 
  type AIAssistantResponse,
  type ChatSourceCitation
} from '../src/services/aiAssistantService.ts';
import { 
  retrieveScientificKnowledge 
} from '../src/services/scientificKnowledgeBase.ts';
import {
  evaluateCropReplacement,
  evaluateCropComparison,
  auditMissingInformation
} from '../src/services/agriculturalAgentTools.ts';
import type { CropId, RotationPlan } from '../src/types/index.ts';

/**
 * Server-side tool specifications for LLM function calling (Gemini & OpenAI)
 */
export const AGRI_AGENT_TOOLS = [
  {
    type: 'function',
    function: {
      name: 'evaluate_crop_replacement',
      description: 'Evaluates whether a target crop in an agricultural rotation plan can be replaced with an alternative crop, analyzing growing season, phenology, water demand, salinity tolerance, nitrogen balance, and impact on subsequent crops.',
      parameters: {
        type: 'object',
        properties: {
          target_crop: {
            type: 'string',
            description: 'The crop currently in the plan to be replaced (e.g. "chickpea", "حمص", "third crop", "المحصول الثالث")'
          },
          replacement_crop: {
            type: 'string',
            description: 'The proposed alternative crop to insert into the rotation (e.g. "maize", "ذرة", "sorghum")'
          }
        },
        required: ['target_crop', 'replacement_crop']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'compare_crops',
      description: 'Evaluates a side-by-side agronomic comparison between two crops for water consumption, salinity tolerance, nitrogen balance, and thermal requirements.',
      parameters: {
        type: 'object',
        properties: {
          crop_a: { type: 'string', description: 'First crop identifier (e.g. "wheat", "قمح")' },
          crop_b: { type: 'string', description: 'Second crop identifier (e.g. "barley", "شعير")' }
        },
        required: ['crop_a', 'crop_b']
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'audit_missing_information',
      description: 'Audits missing or unmeasured farm parameters (e.g. unmeasured irrigation water salinity ECw, lab soil pH) that must be verified before confirming recommendations.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_selected_plan',
      description: 'Retrieves full details of the farmer currently selected crop rotation plan, including crop succession, sowing windows, harvest dates, and water estimates.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_farm_context',
      description: 'Retrieves current farm parameters including location coordinates, soil texture, pH, and measured salinity.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'get_climate_context',
      description: 'Retrieves historical NASA POWER agroclimatic data including relative humidity (RH2M), maximum temperatures, and GDD.',
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function',
    function: {
      name: 'search_agricultural_knowledge',
      description: 'Searches peer-reviewed agricultural knowledge from FAO, ICARDA, CIMMYT, and ARC.',
      parameters: {
        type: 'object',
        properties: {
          query: { type: 'string', description: 'The search query topic' }
        },
        required: ['query']
      }
    }
  }
];

/**
 * Deterministically executes a tool call using verified agronomic calculation engines.
 */
export function executeToolCall(
  toolName: string,
  args: any,
  request: AIAssistantRequest
): any {
  switch (toolName) {
    case 'evaluate_crop_replacement':
      return evaluateCropReplacement({
        plan: (request.selectedPlanRecord?.planSnapshot || request.currentPlan) as RotationPlan,
        targetCropIdentifier: args?.target_crop || 'chickpea',
        replacementCropIdentifier: args?.replacement_crop || 'maize',
        farmInput: request.farmInput,
        climateData: request.climateData,
        soilData: request.soilData,
        language: request.language
      });
    case 'compare_crops':
      return evaluateCropComparison({
        cropAIdentifier: args?.crop_a || 'wheat',
        cropBIdentifier: args?.crop_b || 'barley',
        farmInput: request.farmInput,
        climateData: request.climateData,
        language: request.language
      });
    case 'audit_missing_information':
      return auditMissingInformation({
        farmInput: request.farmInput,
        soilData: request.soilData,
        plan: (request.selectedPlanRecord?.planSnapshot || request.currentPlan) as RotationPlan,
        language: request.language
      });
    case 'get_selected_plan':
      return request.selectedPlanRecord?.planSnapshot || request.currentPlan || null;
    case 'get_farm_context':
      return {
        farmInput: request.farmInput,
        soilData: request.soilData,
        selectedFarm: request.selectedFarm
      };
    case 'get_climate_context':
      return request.climateData || null;
    case 'search_agricultural_knowledge':
      return retrieveScientificKnowledge({
        query: args?.query || '',
        limit: 3
      });
    default:
      return { error: `Unknown tool: ${toolName}` };
  }
}

/**
 * Handles incoming HTTP requests for the SmartCrop AI Assistant API endpoint (/api/ai-assistant).
 * Executes strictly on the server/middleware side to prevent secret API keys from leaking into client browser bundles.
 */
export async function handleAIAssistantApi(req: IncomingMessage, res: ServerResponse): Promise<void> {
  // Set CORS headers and JSON content type
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.statusCode = 405;
    res.end(JSON.stringify({ error: 'Method Not Allowed. Use POST.' }));
    return;
  }

  try {
    // Read request body stream
    const chunks: Buffer[] = [];
    for await (const chunk of req) {
      chunks.push(typeof chunk === 'string' ? Buffer.from(chunk) : chunk);
    }
    const rawBody = Buffer.concat(chunks).toString('utf-8');
    const payload: AIAssistantRequest = rawBody ? JSON.parse(rawBody) : { messages: [], language: 'ar' };

    // Handle dedicated dynamic question generation request
    if (payload.action === 'generate_questions' && payload.currentPlan && payload.currentPlan.id) {
      const { generateDynamicPlanQuestions, validatePlanQuestions } = await import('../src/services/aiAssistantClient.ts');
      const plan = payload.currentPlan as RotationPlan;
      const questions = generateDynamicPlanQuestions(plan, payload.farmInput, payload.climateData, payload.language);
      const validated = validatePlanQuestions(questions, plan, payload.farmInput, payload.climateData);
      res.statusCode = 200;
      res.end(JSON.stringify({ questions: validated, modelUsed: 'smartcrop-agri-grounded', content: '', sources: [] }));
      return;
    }

    const response = await processAIAssistantRequest(payload);
    res.statusCode = 200;
    res.end(JSON.stringify(response));
  } catch (error: any) {
    console.error('[AI Assistant Server Error]', error);
    // Provide safe grounded fallback even on server errors
    res.statusCode = 200;
    const fallbackResponse = generateGroundedAssistantResponse({
      messages: [{ role: 'user', content: 'Agricultural advisory' }],
      language: 'ar'
    });
    res.end(JSON.stringify(fallbackResponse));
  }
}

/**
 * Core processing logic that coordinates between LLM providers and grounded agronomic fallback
 */
export async function processAIAssistantRequest(request: AIAssistantRequest): Promise<AIAssistantResponse> {
  const language = request.language || 'ar';
  const agronomicContext = buildAgronomicContext(request);
  const systemPrompt = buildSystemPrompt(language);

  // Check server environment variables for LLM API keys
  const geminiApiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || process.env.AI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  // 1. Try Google Gemini API if key is present
  if (geminiApiKey) {
    try {
      const geminiResult = await callGeminiApi(request, agronomicContext, systemPrompt, geminiApiKey);
      if (geminiResult) {
        return geminiResult;
      }
    } catch (err) {
      console.warn('[AI Assistant] Gemini API call failed, trying secondary fallback:', err);
    }
  }

  // 2. Try OpenAI API if key is present
  if (openaiApiKey) {
    try {
      const openaiResult = await callOpenAiApi(request, agronomicContext, systemPrompt, openaiApiKey);
      if (openaiResult) {
        return openaiResult;
      }
    } catch (err) {
      console.warn('[AI Assistant] OpenAI API call failed, falling back to grounded engine:', err);
    }
  }

  // 3. Deterministic Knowledge-Grounded Agricultural Engine
  return generateGroundedAssistantResponse(request);
}

/**
 * Calls Google Gemini REST API
 */
async function callGeminiApi(
  request: AIAssistantRequest,
  agronomicContext: string,
  systemPrompt: string,
  apiKey: string
): Promise<AIAssistantResponse | null> {
  const formattedContents = (request.messages || []).map((m: { role: string; content: string }) => ({
    role: m.role === 'assistant' ? 'model' : 'user',
    parts: [{ text: m.content }]
  }));

  const fullSystemInstruction = `${systemPrompt}\n\n=== VERIFIED AGRICULTURAL CONTEXT & GROUNDING DATA ===\n${agronomicContext}`;

  // Use Gemini 2.5 Flash with fallback to 1.5 Flash
  const models = ['gemini-2.5-flash', 'gemini-1.5-flash'];
  
  for (const model of models) {
    try {
      const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{ text: fullSystemInstruction }]
          },
          contents: formattedContents.length > 0 ? formattedContents : [{ role: 'user', parts: [{ text: 'Hello' }] }],
          generationConfig: {
            temperature: 0.2, // Strict factual agronomic guidance
            maxOutputTokens: 2048
          }
        })
      });

      if (!response.ok) {
        const errText = await response.text();
        console.warn(`Gemini (${model}) returned HTTP ${response.status}:`, errText);
        continue;
      }

      const data: any = await response.json();
      const generatedText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (generatedText) {
        const sources = resolveAttributedSources(generatedText, request);
        return {
          content: generatedText,
          sources,
          modelUsed: 'gemini'
        };
      }
    } catch (modelErr) {
      console.warn(`Error invoking Gemini model ${model}:`, modelErr);
    }
  }

  return null;
}

/**
 * Calls OpenAI REST API
 */
async function callOpenAiApi(
  request: AIAssistantRequest,
  agronomicContext: string,
  systemPrompt: string,
  apiKey: string
): Promise<AIAssistantResponse | null> {
  const fullSystemInstruction = `${systemPrompt}\n\n=== VERIFIED AGRICULTURAL CONTEXT & GROUNDING DATA ===\n${agronomicContext}`;
  
  const formattedMessages = [
    { role: 'system', content: fullSystemInstruction },
    ...(request.messages || []).map((m: { role: string; content: string }) => ({
      role: m.role === 'assistant' ? 'assistant' : 'user',
      content: m.content
    }))
  ];

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: formattedMessages,
      temperature: 0.2,
      max_tokens: 2048
    })
  });

  if (!response.ok) {
    const errText = await response.text();
    console.warn(`OpenAI returned HTTP ${response.status}:`, errText);
    return null;
  }

  const data: any = await response.json();
  const generatedText = data?.choices?.[0]?.message?.content;
  if (generatedText) {
    const sources = resolveAttributedSources(generatedText, request);
    return {
      content: generatedText,
      sources,
      modelUsed: 'openai'
    };
  }

  return null;
}

/**
 * Resolves verified scientific citations matching the actual content generated
 */
function resolveAttributedSources(text: string, _request: AIAssistantRequest): ChatSourceCitation[] {
  const matchedCrops = findRelevantCropsInQuery(text);
  const cropIds = matchedCrops.map(c => c.id as CropId);

  const publications = retrieveScientificKnowledge({
    query: text,
    cropIds,
    hasSalinityIssue: text.toLowerCase().includes('salin') || text.includes('ملوح'),
    hasHumidityIssue: text.toLowerCase().includes('rust') || text.includes('صدأ') || text.includes('رطوب'),
    limit: 4
  });

  // Filter: Do NOT include NASA POWER if the topic is solely seed variety, fertilizer, or pesticide!
  const textLower = text.toLowerCase();
  const isPurelyVarietyOrChemical = 
    (textLower.includes('variety') || textLower.includes('صنف') || textLower.includes('pesticide') || textLower.includes('مبيد')) &&
    !textLower.includes('climate') && !textLower.includes('مناخ') && !textLower.includes('temperature') && !textLower.includes('حرار');

  const filteredPubs = isPurelyVarietyOrChemical
    ? publications.filter(p => p.institution !== 'NASA POWER')
    : publications;

  return filteredPubs.map(p => ({
    organization: p.institution,
    titleEn: p.publicationTitle,
    titleAr: p.publicationTitleAr,
    referenceCode: p.referenceCode,
    publicationYear: p.publicationYear,
    url: p.url,
    supportedSubject: p.topics.join(', ')
  }));
}
