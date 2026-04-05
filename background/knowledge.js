// Existing exports
export const MQL_FUNCTIONS = {
  'OrderSend': 'Send a trading order',
  'OrderClose': 'Close a trading order',
  'PositionClose': 'Close a position',
  'OrderModify': 'Modify an order',
  'PositionSelect': 'Select a position',
  // Add more as needed
};

export const NL_FUNCTION_MAP = {
  'send order': 'OrderSend',
  'close order': 'OrderClose',
  'close position': 'PositionClose',
  'modify order': 'OrderModify',
  'select position': 'PositionSelect',
  // Add more mappings
};

export const PROMPT_TEMPLATES = {
  'fix_error': 'Resolve the error in {function} with proper MQL syntax',
  'implement_feature': 'Implement {feature} using {functions}',
  // Add more templates
};

// ─── LEARNING ENGINE DATA STRUCTURES ───
export const PROMPT_PERFORMANCE = {
  // Tracks which prompt phrasing yields "Worked" vs "Failed"
  // Key: template_type, Value: { success_count, fail_count, avg_tokens, best_phrasing }
};

export const USER_BEHAVIOR_PATTERNS = {
  // Tracks what the user types vs what the system optimizes
  // If user types "fix error" and system optimizes to "resolve OrderSend error 130", 
  // and it works -> boost "resolve" phrasing.
};