const currentPipeline = {
  id: `pipeline_${Date.now()}`,
  originalQuestion: '',
  optimizedQuestion: '',
};

function initBeyondContinue() {
  setupAutoCapture();
  setupQuestionTracking();
}

function setupAutoCapture() {
  console.log('Beyond Continue: Auto capture setup');
  setupFlowMonitor();
}

function setupQuestionTracking() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        const text = node.textContent?.trim();
        if (!text || text.length < 8) continue;

        if (isUserMessageNode(node)) {
          currentPipeline.originalQuestion = text;
          currentPipeline.optimizedQuestion = text;
          console.log('[Beyond Continue] Captured question:', text);
        }
      }
    }
  });

  observer.observe(document.body, { childList: true, subtree: true });
}

function isUserMessageNode(node) {
  const className = (node.className || '').toString().toLowerCase();
  const text = node.textContent?.trim() || '';
  if (className.includes('user') || className.includes('input') || className.includes('prompt')) return true;
  if (text && text.split('\n').length === 1 && text.length < 180 && /\?$/.test(text)) return true;
  return false;
}

let lastAiMessage = '';
let aiClarificationCount = 0;

function setupFlowMonitor() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        const text = node.textContent?.trim();
        if (!text || text === lastAiMessage) continue;

        if (isAiResponseNode(node)) {
          handleAiResponse(text);
        }

        lastAiMessage = text;
      }
    }
  });

  const selectors = ['.response-container', '.markdown', '.prose', 'div[data-is-streaming]', '.assistant', '.bot', '.ai-response'];
  const targetNode = document.querySelector(selectors.join(', ')) || document.body;
  observer.observe(targetNode, { childList: true, subtree: true });
}

function isAiResponseNode(node) {
  const className = (node.className || '').toString().toLowerCase();
  if (className.includes('assistant') || className.includes('bot') || className.includes('ai-response') || className.includes('response')) {
    return true;
  }
  return false;
}

function handleAiResponse(text) {
  const clarificationKeywords = ['could you clarify', 'please specify', 'i need more info', 'which symbol', 'what timeframe', 'can you provide more', 'unclear'];
  const isClarification = clarificationKeywords.some((keyword) => text.toLowerCase().includes(keyword));

  chrome.runtime.sendMessage({
    type: 'SAVE_AI_RESPONSE',
    payload: {
      answerText: text,
      pipelineId: currentPipeline.id,
      question: currentPipeline.originalQuestion,
      optimizedQuestion: currentPipeline.optimizedQuestion,
      url: window.location.href,
      source: window.location.hostname,
    },
  }, (response) => {
    if (response?.success) {
      console.log('[Beyond Continue] Saved AI response locally');
    }
  });

  if (isClarification) {
    aiClarificationCount++;
    console.log(`[Flow Monitor] AI asked for clarification (${aiClarificationCount}). Prompt might need optimization.`);
    chrome.runtime.sendMessage({
      type: 'FLAG_WEAK_PROMPT',
      data: {
        pipelineId: currentPipeline.id,
        reason: 'AI_asked_clarification',
        aiResponse: text.substring(0, 200),
        url: window.location.href,
      },
    });
  }
}

initBeyondContinue();