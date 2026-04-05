// Existing imports
import { MQL_FUNCTIONS, NL_FUNCTION_MAP, PROMPT_TEMPLATES, PROMPT_PERFORMANCE, USER_BEHAVIOR_PATTERNS } from './knowledge.js';

// ─── NEW: SMART LEARNING LOGIC ───
async function analyzeInteractionSuccess(pipeline, feedback) {
  const { originalQuestion, optimizedQuestion, task1, task2, userFeedback } = pipeline;
  
  // 1. Extract "Key Phrases" from the optimized question that led to success
  const successPhrases = extractKeyPhrases(optimizedQuestion);
  
  // 2. Compare with User's original phrasing
  const userPhrases = extractKeyPhrases(originalQuestion);
  
  // 3. Determine "Improvement Factor"
  // If the optimized version used specific MQL terms (e.g., "PositionClose" vs "close trade")
  // and it worked, we boost the weight of those terms in NL_FUNCTION_MAP.
  
  const learningData = {
    original: originalQuestion,
    optimized: optimizedQuestion,
    feedback: userFeedback, // 'worked' or 'failed'
    timestamp: Date.now(),
    mqlVersion: pipeline.mqlVersion,
    successPhrases,
    userPhrases
  };

  // Store in a dedicated "Learning Log"
  const store = await chrome.storage.local.get(['learningLog']);
  const log = store.learningLog || [];
  log.unshift(learningData);
  
  // Keep last 1000 interactions for training
  if (log.length > 1000) log.pop();
  
  await chrome.storage.local.set({ learningLog: log });

  // 4. Update the Knowledge Base (The "Brain" Update)
  if (userFeedback === 'worked') {
    boostPromptWeights(successPhrases);
  } else {
    penalizePromptWeights(successPhrases);
  }
}

function extractKeyPhrases(text) {
  // Simple heuristic: Extract MQL function names and strong verbs
  const verbs = ['resolve', 'fix', 'generate', 'implement', 'calculate', 'handle'];
  const mqlTerms = Object.keys(MQL_FUNCTIONS);
  const tokens = text.toLowerCase().split(/\s+/);
  
  return tokens.filter(t => 
    verbs.includes(t) || mqlTerms.some(m => t.includes(m.toLowerCase()))
  );
}

function boostPromptWeights(phrases) {
  // Update NL_FUNCTION_MAP scores in storage
  updateMapScores(phrases, 1);
  console.log('[Learning] Boosting weights for:', phrases);
}

function penalizePromptWeights(phrases) {
  // Update NL_FUNCTION_MAP scores in storage
  updateMapScores(phrases, -1);
  console.log('[Learning] Penalizing weights for:', phrases);
}

async function updateMapScores(phrases, delta) {
  const store = await chrome.storage.local.get(['nlFunctionMap']);
  let map = store.nlFunctionMap || { ...NL_FUNCTION_MAP };
  phrases.forEach(phrase => {
    if (map[phrase] !== undefined) {
      map[phrase] = (map[phrase] || 0) + delta;
    }
  });
  await chrome.storage.local.set({ nlFunctionMap: map });
}

// ─── UPDATED: PIPELINE COMPLETE WITH LEARNING ───
async function handlePipelineComplete({ pipelineId, feedback }) {
  const store = await chrome.storage.local.get(['pipeline', 'pipelineHistory', 'solutions', 'stats']);
  const pipeline = store.pipeline;

  if (!pipeline || pipeline.id !== pipelineId) return { error: 'Pipeline not found' };

  // 1. Run the Learning Analysis BEFORE saving
  await analyzeInteractionSuccess(pipeline, feedback);

  // 2. Existing logic to save solution
  pipeline.userFeedback = feedback;
  pipeline.completedAt = Date.now();
  
  // ... (rest of existing save logic) ...
  
  // 3. Trigger a "Model Refresh" (Simulated)
  // In a real app, this might re-rank the NL_FUNCTION_MAP
  console.log(`[Learning] Pipeline ${pipelineId} completed. Brain updated based on: ${feedback}`);

  return { success: true, solutionId: 'sol_' + Date.now() };
}