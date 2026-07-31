import { getEncoding } from "js-tiktoken";

document.addEventListener('DOMContentLoaded', () => {
  const promptInput = document.getElementById('promptInput');
  const modelSelect = document.getElementById('modelSelect');
  const analyzeBtn = document.getElementById('analyzeBtn');
  const clearBtn = document.getElementById('clearBtn');
  const copyBtn = document.getElementById('copyBtn');
  
  const recommendationCard = document.getElementById('recommendationCard');
  const recommendationText = document.getElementById('recommendationText');
  const originalTokenCount = document.getElementById('originalTokenCount');
  const translatedTokenCount = document.getElementById('translatedTokenCount');
  const originalLangPreview = document.getElementById('originalLangPreview');
  const diffBadge = document.getElementById('diffBadge');
  const translatedTextOutput = document.getElementById('translatedTextOutput');

  // Get tiktoken encoding based on selected model
  function getTokens(text, modelName) {
    try {
      let encodingName = "cl100k_base"; // GPT-4 / GPT-3.5
      if (modelName === "p50k_base") encodingName = "p50k_base";
      if (modelName === "r50k_base") encodingName = "r50k_base";
      
      const enc = getEncoding(encodingName);
      const encoded = enc.encode(text);
      return encoded.length;
    } catch (e) {
      console.error("Tokenization error:", e);
      // Fallback approximation: ~4 chars per token
      return Math.ceil(text.length / 4);
    }
  }

  // Contextual translation using free public API without API keys
  async function translateText(text) {
    if (!text.trim()) return "";
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=autodetect|en`;
      const res = await fetch(url);
      const data = await res.json();
      if (data && data.responseData && data.responseData.translatedText) {
        return data.responseData.translatedText;
      }
      return text;
    } catch (e) {
      console.error("Translation error:", e);
      return text; // Fallback to original text if offline
    }
  }

  async function handleAnalyze() {
    const text = promptInput.value.trim();
    if (!text) {
      alert('Por favor, introduce un prompt para analizar.');
      return;
    }

    const originalBtnText = analyzeBtn.innerHTML;
    analyzeBtn.disabled = true;
    analyzeBtn.innerHTML = `
      <svg class="animate-spin -ml-1 mr-2 h-4 w-4 text-white inline" fill="none" viewBox="0 0 24 24">
        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
      </svg>
      <span>Traduciendo y Analizando...</span>
    `;

    try {
      const modelName = modelSelect.value;
      
      // 1. Translate text contextually to English
      const translated = await translateText(text);

      // 2. Count tokens for original text and translated text
      const inputTokens = getTokens(text, modelName);
      const translatedTokens = getTokens(translated, modelName);

      // 3. Efficiency comparison
      const diff = inputTokens - translatedTokens;
      let efficientLang = "";
      let recommendation = "";

      if (inputTokens < translatedTokens) {
        efficientLang = "Idioma de Entrada (Original)";
        const diffAbs = translatedTokens - inputTokens;
        recommendation = `El idioma original es más eficiente porque consume ${diffAbs} tokens menos que la traducción al inglés.`;
      } else if (translatedTokens < inputTokens) {
        efficientLang = "Inglés (Traducido)";
        const diffAbs = inputTokens - translatedTokens;
        recommendation = `El inglés es más eficiente porque consume ${diffAbs} tokens menos que el texto original (optimización típica del tokenizador para el idioma inglés).`;
      } else {
        efficientLang = "Ambos";
        recommendation = "Ambas versiones consumen exactamente la misma cantidad de tokens.";
      }

      // Render results
      originalTokenCount.textContent = inputTokens;
      translatedTokenCount.textContent = translatedTokens;
      originalLangPreview.textContent = `Texto original (${inputTokens} tokens)`;
      diffBadge.textContent = `Diferencia: ${Math.abs(diff)} tokens`;
      
      translatedTextOutput.textContent = translated;
      translatedTextOutput.classList.remove('italic', 'text-slate-500');
      translatedTextOutput.classList.add('text-slate-200');

      recommendationText.textContent = recommendation;
      recommendationCard.classList.remove('hidden');
      copyBtn.classList.remove('hidden');

    } catch (error) {
      console.error(error);
      alert('Ocurrió un error al procesar el prompt.');
    } finally {
      analyzeBtn.disabled = false;
      analyzeBtn.innerHTML = originalBtnText;
    }
  }

  analyzeBtn.addEventListener('click', handleAnalyze);

  promptInput.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
      handleAnalyze();
    }
  });

  clearBtn.addEventListener('click', () => {
    promptInput.value = '';
    originalTokenCount.textContent = '0';
    translatedTokenCount.textContent = '0';
    originalLangPreview.textContent = 'Idioma original';
    diffBadge.textContent = 'Diferencia: 0 tokens';
    translatedTextOutput.textContent = 'La traducción aparecerá aquí tras analizar el prompt...';
    translatedTextOutput.classList.add('italic', 'text-slate-500');
    translatedTextOutput.classList.remove('text-slate-200');
    recommendationCard.classList.add('hidden');
    copyBtn.classList.add('hidden');
  });

  copyBtn.addEventListener('click', () => {
    const textToCopy = translatedTextOutput.textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
      const originalText = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg class="w-3.5 h-3.5 text-emerald-400 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
        ¡Copiado!
      `;
      setTimeout(() => {
        copyBtn.innerHTML = originalText;
      }, 2000);
    });
  });
});
