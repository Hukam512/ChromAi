// Existing code
let currentPipeline = null;

function setupAutoCapture() {
  // Base capture logic
  console.log('Auto capture setup');
  // Add existing logic here
  setupFlowMonitor(); // <--- ADD THIS
}

// ─── NEW: REAL-TIME FLOW MONITOR ───
let lastAiMessage = "";
let aiClarificationCount = 0;

function setupFlowMonitor() {
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const node of mutation.addedNodes) {
        if (node.nodeType !== 1) continue;
        
        const text = node.textContent || "";
        
        // Detect if AI is asking for clarification (Bad Prompt Signal)
        const clarificationKeywords = ["could you clarify", "please specify", "I need more info", "which symbol", "what timeframe"];
        const isClarification = clarificationKeywords.some(k => text.toLowerCase().includes(k));
        
        if (isClarification && text !== lastAiMessage) {
          aiClarificationCount++;
          console.log(`[Flow Monitor] AI asked for clarification (${aiClarificationCount}). Prompt might need optimization.`);
          
          // Notify the background script to flag this interaction as "Needs Improvement"
          chrome.runtime.sendMessage({
            type: 'FLAG_WEAK_PROMPT',
            data: { 
              pipelineId: currentPipeline?.id, 
              reason: 'AI_asked_clarification',
              aiResponse: text.substring(0, 200)
            }
          });
        }
        
        lastAiMessage = text;
      }
    }
  });

  // Observe the main chat container (selectors vary by site)
  const selectors = ['.response-container', '.markdown', '.prose', 'div[data-is-streaming]'];
  const targetNode = document.querySelector(selectors.join(', ')) || document.body;
  observer.observe(targetNode, { childList: true, subtree: true });
}

// Initialize in setupAutoCapture()
function setupAutoCapture() {
  setupFlowMonitor(); // <--- ADD THIS
  // ... rest of capture logic
}