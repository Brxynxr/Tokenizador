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
  const centralSwapCircle = document.getElementById('centralSwapCircle');

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

  // Analysis panel elements
  const qualityProgressCircle = document.getElementById('qualityProgressCircle');
  const qualityScoreNum = document.getElementById('qualityScoreNum');
  const qualityScoreLabel = document.getElementById('qualityScoreLabel');
  const tempValueBadge = document.getElementById('tempValueBadge');
  const tempExplanation = document.getElementById('tempExplanation');
  const tempIndicatorDot = document.getElementById('tempIndicatorDot');
  const recommendationsList = document.getElementById('recommendationsList');

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
      // Run prompt analysis whenever input changes
      runPromptAnalysis(text);
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

  // Prompt Analysis Heuristics
  function runPromptAnalysis(text) {
    if (!text || !text.trim()) {
      qualityScoreNum.textContent = "0/100";
      qualityProgressCircle.style.strokeDashoffset = "251.2";
      qualityScoreLabel.textContent = "Escribe tu prompt para evaluar la calidad.";
      qualityScoreLabel.className = "text-xs font-medium text-slate-400 mt-2 px-2";
      
      tempValueBadge.textContent = "0.5";
      tempExplanation.textContent = "Analizando el tono y la intención del prompt...";
      tempIndicatorDot.style.left = "50%";
      
      recommendationsList.innerHTML = `
        <li class="flex items-start gap-2">
          <span class="text-slate-500">•</span>
          <span>Escribe tu prompt para recibir sugerencias de mejora en tiempo real.</span>
        </li>
      `;
      return;
    }

    const trimmed = text.trim();
    const words = trimmed.split(/\s+/).length;
    const sentences = trimmed.split(/[.!?]+/).filter(Boolean).length;

    // Heuristics scoring (0 to 100)
    let score = 50;

    // 1. Length factor
    if (words < 8) score -= 25;
    else if (words < 15) score -= 10;
    else if (words >= 20 && words <= 200) score += 20;
    else if (words > 350) score -= 10;

    // 2. Action verbs / instruction presence
    const actionVerbs = /(actúa|explica|genera|analiza|escribe|resume|diseña|crea|traduce|resuelve|ayúdame|cuál|cómo|desarrolla|programa)/i;
    if (actionVerbs.test(trimmed)) score += 15;

    // 3. Context / examples
    const contextKeywords = /(ejemplo|contexto|caso|situación|escenario|basado en|dado que)/i;
    if (contextKeywords.test(trimmed)) score += 10;

    // 4. Specificity / constraints (format, tone, audience)
    const constraintKeywords = /(formato|lista|tabla|json|código|markdown|tono|público|experto|principiante|restríngete|máximo|palabras|estricto)/i;
    if (constraintKeywords.test(trimmed)) score += 15;

    // 5. Structure (multiple sentences)
    if (sentences >= 2) score += 10;

    // Clamp score between 0 and 100
    score = Math.max(0, Math.min(100, score));

    // Update Quality Circle UI
    qualityScoreNum.textContent = `${score}/100`;
    const circumference = 251.2;
    const offset = circumference - (score / 100) * circumference;
    qualityProgressCircle.style.strokeDashoffset = offset;

    if (score <= 40) {
      qualityScoreLabel.textContent = "Prompt débil, necesita más contexto";
      qualityScoreLabel.className = "text-xs font-medium text-[#f87171] mt-2 px-2";
    } else if (score <= 70) {
      qualityScoreLabel.textContent = "Prompt aceptable, puede mejorar";
      qualityScoreLabel.className = "text-xs font-medium text-[#fb923c] mt-2 px-2";
    } else {
      qualityScoreLabel.textContent = "Prompt claro y bien estructurado";
      qualityScoreLabel.className = "text-xs font-medium text-[#4ade80] mt-2 px-2";
    }

    // Temperature Heuristics
    let temp = 0.5;
    const creativeWords = /(historia|poema|brainstorm|ideas|ficción|crear|inventa|narrativa|cuento|imagina|creativo)/i;
    const technicalWords = /(código|datos|exacto|preciso|función|api|sql|bug|calcular|fórmula|matemáticas|analiza|técnico|json|script)/i;

    if (creativeWords.test(trimmed)) {
      temp = 0.85;
      tempExplanation.textContent = "Detecté lenguaje creativo/narrativo o de ideación, se sugiere temperatura alta.";
    } else if (technicalWords.test(trimmed)) {
      temp = 0.2;
      tempExplanation.textContent = "Prompt técnico, analítico o factual, se sugiere temperatura baja para mayor precisión.";
    } else {
      temp = 0.5;
      tempExplanation.textContent = "Prompt general o balanceado, se sugiere temperatura neutra (0.5).";
    }

    tempValueBadge.textContent = temp.toFixed(1);
    const percent = temp * 100;
    tempIndicatorDot.style.left = `${percent}%`;

    // Recommendations Generation
    const recs = [];
    if (words < 15) {
      recs.push("Agrega más contexto o detalle para obtener mejores resultados.");
    }
    const formatKeywords = /(lista|tabla|json|código|markdown|esquema|viñetas)/i;
    if (!formatKeywords.test(trimmed)) {
      recs.push("Especifica el formato de salida deseado (lista, tabla, código, JSON, etc.).");
    }
    const toneKeywords = /(tono|audiencia|experto|principiante|formal|casual|profesional)/i;
    if (!toneKeywords.test(trimmed)) {
      recs.push("Indica el tono o la audiencia objetivo (ej: profesional, para principiantes).");
    }
    const exampleKeywords = /(ejemplo|caso)/i;
    if (!exampleKeywords.test(trimmed) && words > 15) {
      recs.push("Considera pedir ejemplos prácticos para guiar mejor al modelo.");
    }

    if (score >= 75 && recs.length === 0) {
      recs.push("¡Excelente prompt! Está muy bien estructurado y es claro.");
    }

    recommendationsList.innerHTML = recs.map(rec => `
      <li class="flex items-start gap-2">
        <span class="text-indigo-400">💡</span>
        <span>${rec}</span>
      </li>
    `).join('');
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

  // Swap content and languages (Central Circle)
  function handleSwap() {
    isRotated = !isRotated;
    centralSwapCircle.style.transform = isRotated ? 'rotate(180deg)' : 'rotate(0deg)';

    // Swap textareas
    const tempText = promptInput.value;
    promptInput.value = translatedTextOutput.value;
    translatedTextOutput.value = tempText;

    // Swap languages
    const tempLang = sourceLangSelect.value;
    sourceLangSelect.value = targetLangSelect.value;
    if (tempLang !== 'auto') {
      targetLangSelect.value = tempLang;
    }

    // Recalculate stats for both
    updateStats(promptInput.value, true);
    updateStats(translatedTextOutput.value, false);
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
      const optimized = `Act as an expert AI assistant. Provide a highly detailed, accurate, and well-structured response for the following objective:\n\n${text}\n\nEnsure clarity, precision, and actionable insights.`;
      promptInput.value = optimized;
      updateStats(optimized, true);

      // Automatically translate
      await translateText();
    } catch (e) {
      console.error("Optimization error:", e);
    } finally {
      optimizeBtn.disabled = false;
      optimizeBtn.innerHTML = origHTML;
    }
  }

  // Event Listeners for real-time stats & analysis
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
  centralSwapCircle.addEventListener('click', handleSwap);
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
