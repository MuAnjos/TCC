document.addEventListener('DOMContentLoaded', () => {
  // 1. Get all DOM elements we need to interact with
  const textInput = document.getElementById('textInput');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const loadingIndicator = document.getElementById('loadingIndicator');
  const resultContainer = document.getElementById('resultContainer');
  
  // Elements inside the result card
  const sentimentIcon = document.getElementById('sentimentIcon');
  const sentimentLabel = document.getElementById('sentimentLabel');
  const confidenceScore = document.getElementById('confidenceScore');
  const confidenceFill = document.getElementById('confidenceFill');

  // Our FastAPI backend URL
  const BACKEND_URL = 'http://127.0.0.1:8000/analyze';

  // 2. Add Event Listener to the button
  analyzeBtn.addEventListener('click', async () => {
    const textToAnalyze = textInput.value.trim();

    // Small validation
    if (!textToAnalyze) {
      alert('Please paste some text first!');
      return;
    }

    // Set UI to loading state
    resultContainer.classList.add('hidden');
    resultContainer.classList.remove('positive', 'negative', 'neutral'); // Cleanup old colors
    loadingIndicator.classList.remove('hidden');
    analyzeBtn.disabled = true;

    try {
      // 3. Make HTTP POST request to the backend
      const response = await fetch(BACKEND_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text: textToAnalyze })
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();
      
      // The backend (main.py) returns: { "text": "...", "sentiment": "NEGATIVE", "confidence": 0.95 }
      const sentiment = data.sentiment ? data.sentiment.toUpperCase() : 'UNKNOWN';
      const confidence = data.confidence || 0;
      
      // Convert confidence score to percentage (e.g. 0.95 -> 95%)
      const percentage = Math.round(confidence * 100);

      // 4. Update the DOM with the results
      sentimentLabel.innerText = sentiment;
      confidenceScore.innerText = `${percentage}%`;
      // Animate the progress bar width based on confidence
      setTimeout(() => {
        confidenceFill.style.width = `${percentage}%`;
      }, 100);

      // Change colors and emojis based on the sentiment
      if (sentiment === 'POSITIVE' || sentiment === 'POSITIVO') {
        resultContainer.classList.add('positive');
        sentimentIcon.innerText = '😄';
      } else if (sentiment === 'NEGATIVE' || sentiment === 'NEGATIVO') {
        resultContainer.classList.add('negative');
        sentimentIcon.innerText = '📉';
      } else {
        resultContainer.classList.add('neutral');
        sentimentIcon.innerText = '😐';
      }

      // Show result container
      resultContainer.classList.remove('hidden');

    } catch (error) {
      console.error('Error analyzing text:', error);
      alert('Error connecting to the backend. Is FastAPI running?');
    } finally {
      // Restore UI state
      loadingIndicator.classList.add('hidden');
      analyzeBtn.disabled = false;
    }
  });
});
