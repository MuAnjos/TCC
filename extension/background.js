// Register the Context Menu item when the extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: "analyze-financial-sentiment",
    title: "Analyze Financial Sentiment",
    contexts: ["selection"]
  });
});

const BACKEND_URL = 'http://127.0.0.1:8000/analyze';

// Listen for Context Menu clicks
chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId === "analyze-financial-sentiment" && tab.id) {
    const selectedText = info.selectionText;

    try {
      // 1. Inject the CSS file into the current webpage
      await chrome.scripting.insertCSS({
        target: { tabId: tab.id },
        files: ["toast.css"]
      });

      // 2. Inject the "Loading" toast
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: injectLoadingToast
      });

      // 3. Make the API request to the Python backend
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: selectedText })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      // 4. Inject the actual result to update the toast
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: updateToastResult,
        args: [data]
      });

    } catch (e) {
      console.error("FinSentiment Error:", e);
      // In case of error (e.g., backend offline)
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        func: updateToastError
      });
    }
  }
});

// --- CONTENT SCRIPT FUNCTIONS ---
// Note: These functions are executed IN THE WEBPAGE, isolated from the background.
// They cannot reference background variables outside their own scope.

function injectLoadingToast() {
  // Remove existing toast if user clicks multiple times rapidly
  const existing = document.getElementById('finsentiment-temp-toast');
  if (existing) existing.remove();

  const container = document.createElement('div');
  container.id = 'finsentiment-temp-toast';
  container.className = 'finsentiment-toast-container finsentiment-neutral';
  
  container.innerHTML = `
    <div class="finsentiment-toast-icon">⌛</div>
    <div class="finsentiment-toast-content">
      <h4 class="finsentiment-toast-title">FinBERT</h4>
      <p class="finsentiment-toast-result">Analyzing...</p>
    </div>
  `;
  document.body.appendChild(container);
}

function updateToastResult(data) {
  const container = document.getElementById('finsentiment-temp-toast');
  if (!container) return;

  const sentiment = data.sentiment ? data.sentiment.toUpperCase() : 'UNKNOWN';
  const confidence = Math.round((data.confidence || 0) * 100);

  let icon = '😐';
  let cssClass = 'finsentiment-neutral';

  if (sentiment === 'POSITIVE' || sentiment === 'POSITIVO') {
    icon = '😄';
    cssClass = 'finsentiment-positive';
  } else if (sentiment === 'NEGATIVE' || sentiment === 'NEGATIVO') {
    icon = '📉';
    cssClass = 'finsentiment-negative';
  }

  container.className = `finsentiment-toast-container ${cssClass}`;
  container.innerHTML = `
    <div class="finsentiment-toast-icon">${icon}</div>
    <div class="finsentiment-toast-content">
      <h4 class="finsentiment-toast-title">FinBERT Analysis</h4>
      <p class="finsentiment-toast-result">${sentiment}</p>
      <span class="finsentiment-toast-confidence">Confidence: ${confidence}%</span>
    </div>
  `;

  // Auto remove the toast after 4 seconds
  setTimeout(() => {
    container.classList.add('finsentiment-toast-fade-out');
    setTimeout(() => container.remove(), 400); // 400ms matches the CSS animation time
  }, 4000);
}

function updateToastError() {
  const container = document.getElementById('finsentiment-temp-toast');
  if (!container) return;
  
  container.className = 'finsentiment-toast-container finsentiment-negative';
  container.innerHTML = `
    <div class="finsentiment-toast-icon">❌</div>
    <div class="finsentiment-toast-content">
      <h4 class="finsentiment-toast-title">FinBERT</h4>
      <p class="finsentiment-toast-result" style="font-size: 15px;">Backend Offline</p>
    </div>
  `;
  
  setTimeout(() => {
    container.classList.add('finsentiment-toast-fade-out');
    setTimeout(() => container.remove(), 400);
  }, 4000);
}
