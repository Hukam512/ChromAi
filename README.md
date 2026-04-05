# ChromAi / Beyond Continue
Chrom AI to do Question - Self-improving MQL4/MQL5 development environment with AI learning.

## Installation
1. Open Chrome and go to `chrome://extensions/`.
2. Enable "Developer mode" in the top right.
3. Click "Load unpacked" and select this folder (`/workspaces/ChromAi`).
4. The extension is now loaded.

## Usage
- Load the extension in Chrome via `chrome://extensions/`.
- Use the popup to index local `.mq4` and `.mq5` files.
- Enter a question and click "Optimize question" to build a better Gemini prompt.
- Copy the optimized prompt and paste it into Gemini, Claude, or any AI chat.
- The system saves indexed files and AI responses locally in browser storage.

## Features
- Local MQL file indexer for `.mq4` and `.mq5` projects.
- Question Optimizer with NL→MQL mapping.
- Saved AI response history to avoid losing previous answers.
- Self-training brain that learns from feedback.
- Real-time observation of AI interactions.
- Local storage for all data.
- Friendly MQL4/MQL5 prompt generation for MT4/MT5 and CPU/RAM safe coding.

## Testing the Brain
- Load MQL files from your project into the popup.
- Ask a vague or specific question and optimize it.
- Paste optimized prompt into Gemini or Claude.
- Provide feedback later by using the extension data model when available.
- Inspect `chrome.storage.local` for `codeIndex`, `nlFunctionMap`, and `learningLog`.
 
