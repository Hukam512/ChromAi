// Existing shared knowledge
const MQL_FUNCTIONS = {
  OrderSend: 'Send a trading order',
  OrderClose: 'Close a trading order',
  PositionClose: 'Close a position',
  OrderModify: 'Modify an order',
  PositionSelect: 'Select a position',
  // Add more as needed for MQL4/MQL5 native language
};

const NL_FUNCTION_MAP = {
  'send order': 'OrderSend',
  'close order': 'OrderClose',
  'close position': 'PositionClose',
  'modify order': 'OrderModify',
  'select position': 'PositionSelect',
  'trailing stop': 'OrderModify',
  'break even': 'OrderModify',
  'stop loss': 'OrderModify',
};

const NL_FUNCTION_WEIGHTS = {
  'send order': 1,
  'close order': 1,
  'close position': 1,
  'modify order': 1,
  'select position': 1,
  'trailing stop': 1,
  'break even': 1,
  'stop loss': 1,
};

const PROMPT_TEMPLATES = {
  fix_error: 'Ask the AI to resolve the MQL error in {function} using safe MT4/MT5 friendly language',
  implement_feature: 'Ask the AI how to implement {feature} in MQL4/MQL5, referencing relevant local code and CPU/RAM safe behavior',
  optimize_performance: 'Ask the AI to optimize the MQL4/MQL5 code for low CPU/RAM usage and stable MT4/MT5 execution',
  explain_behavior: 'Ask the AI to explain the behavior of {function} in MQL4/MQL5 with best practices',
};

const PROMPT_PERFORMANCE = {
  // Tracks which prompt phrasing yields "Worked" vs "Failed"
  // Key: template_type, Value: { success_count, fail_count, avg_tokens, best_phrasing }
};

const USER_BEHAVIOR_PATTERNS = {
  // Tracks what the user types vs what the system optimizes
  // Example: 'fix error' -> 'resolve OrderSend error 130'
};