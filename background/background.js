// Load shared knowledge into the service worker
importScripts('knowledge.js');

const AI_RESPONSE_KEY = 'aiResponseHistory';
const PIPELINE_HISTORY_KEY = 'pipelineHistory';
const WEAK_PROMPT_KEY = 'weakPromptFlags';
const LEARNING_LOG_KEY = 'learningLog';
const NL_WEIGHTS_KEY = 'nlFunctionWeights';
const CODE_INDEX_KEY = 'codeIndex';

chrome.runtime.onInstalled.addListener(() => {
  chrome.storage.local.get([AI_RESPONSE_KEY, PIPELINE_HISTORY_KEY, WEAK_PROMPT_KEY, NL_WEIGHTS_KEY, LEARNING_LOG_KEY], (store) => {
    const defaults = {};
    if (!store[AI_RESPONSE_KEY]) defaults[AI_RESPONSE_KEY] = [];
    if (!store[PIPELINE_HISTORY_KEY]) defaults[PIPELINE_HISTORY_KEY] = [];
    if (!store[WEAK_PROMPT_KEY]) defaults[WEAK_PROMPT_KEY] = [];
    if (!store[NL_WEIGHTS_KEY]) defaults[NL_WEIGHTS_KEY] = { ...NL_FUNCTION_WEIGHTS };
    if (!store[LEARNING_LOG_KEY]) defaults[LEARNING_LOG_KEY] = [];
    if (Object.keys(defaults).length) chrome.storage.local.set(defaults);
  });
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'SAVE_AI_RESPONSE') {
    saveAiResponse(message.payload).then(result => sendResponse({ success: true, result })).catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'FLAG_WEAK_PROMPT') {
    saveWeakPromptFlag(message.data).then(() => sendResponse({ success: true })).catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'SAVE_FEEDBACK') {
    handlePipelineComplete(message.payload).then(sendResponse).catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

function getStorageValue(key, defaultValue) {
  return new Promise((resolve) => chrome.storage.local.get([key], (store) => resolve(store[key] !== undefined ? store[key] : defaultValue)));
}

function setStorageValue(data) {
  return new Promise((resolve) => chrome.storage.local.set(data, resolve));
}

async function appendStorageValue(key, item, max = 2000) {
  const list = await getStorageValue(key, []);
  list.unshift(item);
  if (list.length > max) list.length = max;
  await setStorageValue({ [key]: list });
  return list;
}

async function saveAiResponse(payload) {
  const entry = {
    ...payload,
    savedAt: Date.now(),
  };
  await appendStorageValue(AI_RESPONSE_KEY, entry);
  await appendStorageValue(PIPELINE_HISTORY_KEY, { type: 'ai_response', entry });
  return entry;
}

async function saveWeakPromptFlag(data) {
  const entry = { ...data, timestamp: Date.now() };
  await appendStorageValue(WEAK_PROMPT_KEY, entry);
  return entry;
}

async function analyzeInteractionSuccess(pipeline, feedback) {
  const successPhrases = extractKeyPhrases(pipeline.optimizedQuestion || pipeline.originalQuestion || '');
  const userPhrases = extractKeyPhrases(pipeline.originalQuestion || '');

  const learningData = {
    original: pipeline.originalQuestion,
    optimized: pipeline.optimizedQuestion,
    feedback,
    timestamp: Date.now(),
    mqlVersion: pipeline.mqlVersion,
    successPhrases,
    userPhrases,
  };

  await appendStorageValue(LEARNING_LOG_KEY, learningData, 1000);

  if (feedback === 'worked') {
    await updateMapScores(successPhrases, 1);
  } else {
    await updateMapScores(successPhrases, -1);
  }
}

function extractKeyPhrases(text) {
  const verbs = ['resolve', 'fix', 'generate', 'implement', 'calculate', 'handle', 'optimize'];
  const mqlTerms = Object.keys(MQL_FUNCTIONS);
  const tokens = text.toLowerCase().split(/\s+/);
  return tokens.filter((t) => verbs.includes(t) || mqlTerms.some((m) => t.includes(m.toLowerCase())));
}

async function updateMapScores(phrases, delta) {
  const store = await getStorageValue(NL_WEIGHTS_KEY, { ...NL_FUNCTION_WEIGHTS });
  const map = { ...store };
  phrases.forEach((phrase) => {
    if (phrase && map[phrase] !== undefined) {
      map[phrase] = (map[phrase] || 0) + delta;
    }
  });
  await setStorageValue({ [NL_WEIGHTS_KEY]: map });
}

async function getCodeIndex() {
  const store = await chrome.storage.local.get([CODE_INDEX_KEY]);
  return store[CODE_INDEX_KEY] || [];
}

async function storeCodeIndex(index) {
  await chrome.storage.local.set({ [CODE_INDEX_KEY]: index });
}

async function indexCodeFiles(files) {
  const index = files.map(file => {
    const text = file.text || '';
    return {
      name: file.name,
      path: file.path || file.name,
      text,
      type: file.name.toLowerCase().endsWith('.mq5') ? 'mq5' : 'mq4',
      digest: text.slice(0, 200),
    };
  });
  await storeCodeIndex(index);
  return { success: true, count: index.length };
}

function scoreText(query, text) {
  const terms = query.toLowerCase().split(/\W+/).filter(Boolean);
  return terms.reduce((score, term) => {
    if (!term) return score;
    const occurrences = (text.toLowerCase().match(new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) || []).length;
    return score + occurrences;
  }, 0);
}

function searchCode(query, maxResults = 5, index = []) {
  const scored = index.map(entry => {
    const score = scoreText(query, entry.text);
    let snippet = '';
    const lowerText = entry.text.toLowerCase();
    const firstMatch = query.toLowerCase().split(/\W+/).find(term => lowerText.includes(term));
    if (firstMatch) {
      const pos = lowerText.indexOf(firstMatch);
      snippet = entry.text.slice(Math.max(0, pos - 80), pos + 160).replace(/\s+/g, ' ').trim();
    } else {
      snippet = entry.text.slice(0, 180).replace(/\s+/g, ' ').trim();
    }
    return { ...entry, score, snippet };
  });
  return scored.filter(item => item.score > 0).sort((a, b) => b.score - a.score).slice(0, maxResults);
}

function detectTemplateType(question) {
  const lower = question.toLowerCase();
  if (/error|fix|bug|fail|exception/.test(lower)) return 'fix_error';
  if (/optimi[sz]e|performance|cpu|ram|memory/.test(lower)) return 'optimize_performance';
  if (/explain|why|how|what/.test(lower)) return 'explain_behavior';
  return 'implement_feature';
}

function mapQuestionToFunction(question, map = NL_FUNCTION_MAP) {
  const lower = question.toLowerCase();
  const entries = Object.entries(map);
  const hit = entries.find(([key]) => lower.includes(key));
  return hit ? hit[1] : null;
}

async function optimizeQuestion(question) {
  const index = await getCodeIndex();
  const hits = searchCode(question, 4, index);
  const templateKey = detectTemplateType(question);
  const template = PROMPT_TEMPLATES[templateKey] || PROMPT_TEMPLATES.implement_feature;
  const mappedFunction = mapQuestionToFunction(question) || 'relevant MQL4/MQL5 functions';
  const contextText = hits.map(hit => `File: ${hit.name}\nSnippet: ${hit.snippet}`).join('\n\n');
  const optimizedText = template
    .replace('{function}', mappedFunction)
    .replace('{feature}', question)
    .replace('{functions}', mappedFunction);

  const prompt = `${optimizedText}\n\nProject context:\n${contextText}\n\nAsk the AI using friendly MQL4/MQL5 language and avoid CPU/RAM heavy patterns.`;
  return { optimizedQuestion: prompt, context: contextText, hits };
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === 'INDEX_FILES') {
    indexCodeFiles(message.files).then(sendResponse).catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'OPTIMIZE_QUESTION') {
    optimizeQuestion(message.question).then(sendResponse).catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }

  if (message.type === 'FLAG_WEAK_PROMPT') {
    console.log('[Background] Weak prompt flagged:', message.data);
    return;
  }

  if (message.type === 'SAVE_FEEDBACK') {
    handlePipelineComplete(message.payload).then(sendResponse).catch(error => sendResponse({ success: false, error: error.message }));
    return true;
  }
});

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

  const solutions = store.solutions || [];
  solutions.push(pipeline);
  await chrome.storage.local.set({ solutions });

  console.log(`[Learning] Pipeline ${pipelineId} completed. Brain updated based on: ${feedback}`);
  return { success: true, solutionId: 'sol_' + Date.now() };
}