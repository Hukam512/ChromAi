# ChromAi / Beyond Continue
Chrom AI to do Question - Self-improving MQL4/MQL5 development environment with AI learning.

## Installation
1. Open Chrome and go to `chrome://extensions/`.
2. Enable "Developer mode" in the top right.
3. Click "Load unpacked" and select this folder (`/workspaces/ChromAi`).
4. The extension is now loaded.

## Usage
- Visit gemini.google.com or claude.ai.
- Use the extension to optimize questions for MQL development.
- Provide feedback on responses to train the brain.

## Features
- Question Optimizer with NL→MQL mapping.
- Self-training brain that learns from feedback.
- Real-time observation of AI interactions.
- Local storage for all data.

## Testing the Brain
- Ask vague questions and check console for [Flow Monitor] logs.
- Provide "worked/failed" feedback to update prompt weights in storage.
- Inspect `chrome.storage.local` for `nlFunctionMap` and `learningLog`. 
