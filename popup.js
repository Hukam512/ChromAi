const fileInput = document.getElementById('fileInput');
const optimizeBtn = document.getElementById('optimizeBtn');
const copyBtn = document.getElementById('copyBtn');
const questionEl = document.getElementById('question');
const optimizedTextEl = document.getElementById('optimizedText');
const indexStatusEl = document.getElementById('indexStatus');
const savedResponsesEl = document.getElementById('savedResponses');

let lastOptimized = '';

fileInput.addEventListener('change', async (event) => {
  const files = Array.from(event.target.files || []).filter(file => file.name.endsWith('.mq4') || file.name.endsWith('.mq5'));
  if (!files.length) {
    indexStatusEl.textContent = 'Index status: no MQL files selected';
    return;
  }

  const fileData = await Promise.all(files.map(file => {
    return new Promise(resolve => {
      const reader = new FileReader();
      reader.onload = () => resolve({ name: file.name, path: file.webkitRelativePath || file.name, text: reader.result });
      reader.readAsText(file);
    });
  }));

  chrome.runtime.sendMessage({ type: 'INDEX_FILES', files: fileData }, response => {
    if (response && response.success) {
      indexStatusEl.textContent = `Index status: ${response.count} files indexed`;
    } else {
      indexStatusEl.textContent = `Index failed: ${response?.error || 'unknown'}`;
    }
  });
});

optimizeBtn.addEventListener('click', () => {
  const question = questionEl.value.trim();
  if (!question) {
    optimizedTextEl.textContent = 'Enter a question first.';
    return;
  }

  chrome.runtime.sendMessage({ type: 'OPTIMIZE_QUESTION', question }, response => {
    if (response && response.optimizedQuestion) {
      lastOptimized = response.optimizedQuestion;
      optimizedTextEl.textContent = response.optimizedQuestion;
      copyBtn.disabled = false;
    } else {
      optimizedTextEl.textContent = `Optimize failed: ${response?.error || 'unknown'}`;
    }
  });
});

copyBtn.addEventListener('click', async () => {
  if (!lastOptimized) return;
  await navigator.clipboard.writeText(lastOptimized);
  copyBtn.textContent = 'Copied!';
  setTimeout(() => (copyBtn.textContent = 'Copy optimized text'), 1500);
});

function loadSavedResponses() {
  chrome.storage.local.get(['aiResponseHistory'], (store) => {
    const responses = store.aiResponseHistory || [];
    if (!responses.length) {
      savedResponsesEl.innerHTML = '<div class="small">No saved AI responses yet.</div>';
      return;
    }

    savedResponsesEl.innerHTML = responses.slice(0, 10).map(entry => {
      const time = new Date(entry.savedAt).toLocaleString();
      const question = escapeHtml(entry.question || '');
      const answer = escapeHtml(entry.answerText || '');
      return `
        <div class="entry">
          <div class="small">${time} • ${escapeHtml(entry.source || location.hostname)}</div>
          <div><strong>Q:</strong> ${question}</div>
          <div><strong>A:</strong> <pre>${answer}</pre></div>
        </div>
      `;
    }).join('');
  });
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

window.addEventListener('load', () => {
  copyBtn.disabled = true;
  loadSavedResponses();
});