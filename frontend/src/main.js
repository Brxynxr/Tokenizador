import { getEncoding } from "js-tiktoken";

document.addEventListener('DOMContentLoaded', () => {
  const promptInput = document.getElementById('promptInput');
  const translatedTextOutput = document.getElementById('translatedTextOutput');
  const modelSelect = document.getElementById('modelSelect');
  const sourceLangSelect = document.getElementById('sourceLangSelect');
  const targetLangSelect = document.getElementById('targetLangSelect');

  const translateBtn = document.getElementById('translateBtn');
  const optimizeBtn = document.getElementById('optimizeBtn');
  const copyBtn = document.getElementById('copyBtn');
  const clearBtn = document.getElementById('clearBtn');
  const centralIconCircle = document.getElementById('centralIconCircle');

  const recommendationCard = document.getElementById('recommendationCard');
  const recommendationText = document.getElementById('recommendationText');

  // Stats elements
  const statInputChars = document.getElementById('statInputChars');
  const statInputWords = document.getElementById('statInputWords');
  const statInputLines = document.getElementById('statInputLines');
  const statInputTokens = document.getElementById('statInputTokens');

  const statTransChars = document.getElementById('statTransChars');
  const statTransWords = document.getElementById('statTransWords');
  const statTransLines = document.getElementById('statTransLines');
  const statTransTokens = document.getElementById('statTransTokens');

  let isRotated = false;

  // Get token count using js-tiktoken
  function countTokens(text, modelName) {
    if (!text || !text.trim()) return 0;
    try {
      let encodingName = "cl100k_base";
      if (modelName === "p50k_base") encodingName = "p50k_base";
      if (modelName === "r50k_base") encodingName = "r50k_base";
      
      const enc = getEncoding(encodingName);
      return enc.encode(text).length;
    } catch (e) {
      console.error("Tokenization error:", e);
      return Math.ceil(text.length / 4);
    }
  }

  // Calculate stats for a given text
  function updateStats(text, isInput = true) {
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text ? text.split(/\r\n|\r|\n/).length : 0;
    const modelName = modelSelect.value;
    const tokens = countTokens(text, modelName);

    if (isInput) {
      statInputChars.textContent = chars;
      statInputWords.textContent = words;
      statInputLines.textContent = lines;
      statInputTokens.textContent = tokens;
    } else {
      statTransChars.textContent = chars;
      statTransWords.textContent = words;
      statTransLines.textContent = lines;
      statTransTokens.textContent = tokens;
    }

    checkEfficiency();
  }

  // Efficiency comparison logic
  function checkEfficiency() {
    const inputTokens = parseInt(statInputTokens.textContent) || 0;
    const transTokens = parseInt(statTransTokens.textContent) || 0;

    if (inputTokens === 0 && transTokens === 0) {
      recommendationCard.classList.add('hidden');
      return;
    }

    if (inputTokens < transTokens) {
      const diff = transTokens - inputTokens;
      recommendationText.textContent = `El idioma original es más eficiente porque consume ${diff} tokens menos que la traducción al inglés.`;
      recommendationCard.classList.remove('hidden');
    } else if (transTokens < inputTokens) {
      const diff = inputTokens - transTokens;
      recommendationText.textContent = `El inglés es más eficiente porque consume ${diff} tokens menos que el texto original (optimización del tokenizador para inglés).`;
      recommendationCard.classList.remove('hidden');
    } else {
      recommendationText.textContent = `Ambas versiones consumen exactamente la misma cantidad de tokens (${inputTokens} tokens).`;
      recommendationCard.classList.remove('hidden');
    }
  }

  // Contextual translation using free public API
  async function translateText() {
    const text = promptInput.value.trim();
    if (!text) {
      alert('Por favor, introduce un prompt para traducir.');
      return;
    }

    const sourceLang = sourceLangSelect.value;
    const targetLang = targetLangSelect.value;
    const langPair = sourceLang === 'auto' ? `autodetect|${targetLang}` : `${sourceLang}|${targetLang}`;

    translateBtn.disabled = true;
    const origHTML = translateBtn.innerHTML;
    translateBtn.innerHTML = `<span>Traduciendo...</span>`;

    // Rotate central icon
    isRotated = !isRotated;
    centralIconCircle.style.transform = isRotated ? 'rotate(180deg)' : 'rotate(0deg)';

    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=${langPair}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data && data.responseData && data.responseData.translatedText) {
        const translated = data.responseData.translatedText;
        translatedTextOutput.value = translated;
        updateStats(translated, false);
      } else {
        translatedTextOutput.value = text;
        updateStats(text, false);
      }
    } catch (e) {
      console.error("Translation error:", e);
      alert('Error al realizar la traducción.');
    } finally {
      translateBtn.disabled = false;
      translateBtn.innerHTML = origHTML;
    }
  }

  // Optimize prompt feature
  async function optimizePrompt() {
    const text = promptInput.value.trim();
    if (!text) {
      alert('Por favor, introduce un prompt para optimizar.');
      return;
    }

    optimizeBtn.disabled = true;
    const origHTML = optimizeBtn.innerHTML;
    optimizeBtn.innerHTML = `<span>Optimizando...</span>`;

    try {
      // Professional prompt engineering enhancement heuristic / structure
      const optimized = `Act as an expert AI assistant. Provide a highly detailed, accurate, and well-structured response for the following objective:\n\n${text}\n\nEnsure clarity, precision, and actionable insights.`;
      promptInput.value = optimized;
      updateStats(optimized, true);

      // Automatically translate the optimized prompt
      await translateText();
    } catch (e) {
      console.error("Optimization error:", e);
    } finally {
      optimizeBtn.disabled = false;
      optimizeBtn.innerHTML = origHTML;
    }
  }

  // Event Listeners for real-time stats
  promptInput.addEventListener('input', (e) => {
    updateStats(e.target.value, true);
  });

  translatedTextOutput.addEventListener('input', (e) => {
    updateStats(e.target.value, false);
  });

  modelSelect.addEventListener('change', () => {
    updateStats(promptInput.value, true);
    updateStats(translatedTextOutput.value, false);
  });

  translateBtn.addEventListener('click', translateText);
  centralIconCircle.addEventListener('click', translateText);
  optimizeBtn.addEventListener('click', optimizePrompt);

  copyBtn.addEventListener('click', () => {
    const textToCopy = translatedTextOutput.value || promptInput.value;
    if (!textToCopy) {
      alert('No hay texto para copiar.');
      return;
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
      const orig = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg class="w-4 h-4 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        ¡Copiado ✓!
      `;
      setTimeout(() => {
        copyBtn.innerHTML = orig;
      }, 2000);
    });
  });

  clearBtn.addEventListener('click', () => {
    promptInput.value = '';
    translatedTextOutput.value = '';
    updateStats('', true);
    updateStats('', false);
    recommendationCard.classList.add('hidden');
  });
});
