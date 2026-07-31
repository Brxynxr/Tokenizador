import "./style.css";
import { getEncoding } from "js-tiktoken";

const MODELS = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    company: "OpenAI",
    initial: "O",
    color: "bg-emerald-500/20 text-emerald-400 border-emerald-500/30",
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.00,
    contextWindow: "128K"
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o mini",
    company: "OpenAI",
    initial: "4m",
    color: "bg-teal-500/20 text-teal-400 border-teal-500/30",
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    contextWindow: "128K"
  },
  {
    id: "claude-3-5",
    name: "Claude 3.5 Sonnet",
    company: "Anthropic",
    initial: "C",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    contextWindow: "200K"
  },
  {
    id: "claude-3-5-haiku",
    name: "Claude 3.5 Haiku",
    company: "Anthropic",
    initial: "Ha",
    color: "bg-pink-500/20 text-pink-400 border-pink-500/30",
    inputCostPer1M: 0.80,
    outputCostPer1M: 4.00,
    contextWindow: "200K"
  },
  {
    id: "gemini-1-5-pro",
    name: "Gemini 1.5 Pro",
    company: "Google",
    initial: "G",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    inputCostPer1M: 1.25,
    outputCostPer1M: 5.00,
    contextWindow: "2M"
  },
  {
    id: "llama-3-1",
    name: "Llama 3.1 70B",
    company: "Meta",
    initial: "M",
    color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    inputCostPer1M: 0.70,
    outputCostPer1M: 0.90,
    contextWindow: "128K"
  },
  {
    id: "mistral-large",
    name: "Mistral Large 2",
    company: "Mistral",
    initial: "Mi",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    inputCostPer1M: 2.00,
    outputCostPer1M: 6.00,
    contextWindow: "128K"
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek V3",
    company: "DeepSeek",
    initial: "D",
    color: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    inputCostPer1M: 0.14,
    outputCostPer1M: 0.28,
    contextWindow: "64K"
  }
];

document.addEventListener('DOMContentLoaded', () => {
  const promptInput = document.getElementById('promptInput');
  const translatedTextOutput = document.getElementById('translatedTextOutput');
  const modelSelect = document.getElementById('modelSelect');
  const sourceLangSelect = document.getElementById('sourceLangSelect');
  const targetLangSelect = document.getElementById('targetLangSelect');
  const detectedLangBadge = document.getElementById('detectedLangBadge');

  const translateBtn = document.getElementById('translateBtn');
  const optimizeBtn = document.getElementById('optimizeBtn');
  const copyBtn = document.getElementById('copyBtn');
  const clearBtn = document.getElementById('clearBtn');

  const recommendationCard = document.getElementById('recommendationCard');
  const recommendationText = document.getElementById('recommendationText');

  // Stats elements (Prompt Original footer)
  const statInputChars = document.getElementById('statInputChars');
  const statInputWords = document.getElementById('statInputWords');
  const statInputLines = document.getElementById('statInputLines');
  const statInputTokens = document.getElementById('statInputTokens');
  const statInputTemp = document.getElementById('statInputTemp');

  // Stats elements (Translated footer)
  const statTransChars = document.getElementById('statTransChars');
  const statTransWords = document.getElementById('statTransWords');
  const statTransLines = document.getElementById('statTransLines');
  const statTransTokens = document.getElementById('statTransTokens');
  const statTransTemp = document.getElementById('statTransTemp');

  // Analysis panel elements
  const qualityProgressCircle = document.getElementById('qualityProgressCircle');
  const qualityScoreNum = document.getElementById('qualityScoreNum');
  const qualityScoreLabel = document.getElementById('qualityScoreLabel');
  const recommendationsList = document.getElementById('recommendationsList');
  const metricsBreakdownContainer = document.getElementById('metricsBreakdownContainer');

  // Models Grid
  const modelsGrid = document.getElementById('modelsGrid');

  let debounceTimer = null;

  // Initial render of model cards
  renderModelComparisonCards();

  // Orthography & Spelling Cleanup utility function
  function cleanOrthography(text) {
    if (!text) return "";
    let cleaned = text
      .replace(/\s+/g, ' ')                      
      .replace(/\s+([.,?!;:])/g, '$1')           
      .replace(/([.,?!;:])([^\s])/g, '$1 $2')     
      .trim();
    
    cleaned = cleaned.replace(/(^\s*|[.!?]\s+)([a-z])/g, (match, p1, p2) => p1 + p2.toUpperCase());
    return cleaned;
  }

  // Calculate temperature based on text
  function calculateTemperature(text) {
    if (!text || !text.trim()) return 0.5;
    const trimmed = text.toLowerCase();
    const creativeWords = /(historia|poema|brainstorm|ideas|ficción|crear|inventa|narrativa|cuento|imagina|creativo)/i;
    const technicalWords = /(código|datos|exacto|preciso|función|api|sql|bug|calcular|fórmula|matemáticas|analiza|técnico|json|script)/i;

    if (creativeWords.test(trimmed)) return 0.85;
    if (technicalWords.test(trimmed)) return 0.2;
    return 0.5;
  }

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

  // Update stats for input or translated text
  function updateStats(text, isInput = true) {
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text ? text.split(/\r\n|\r|\n/).length : 0;
    const modelName = modelSelect.value;
    const tokens = countTokens(text, modelName);
    const temp = calculateTemperature(text);

    if (isInput) {
      statInputChars.textContent = chars;
      statInputWords.textContent = words;
      statInputLines.textContent = lines;
      statInputTokens.textContent = tokens;
      statInputTemp.textContent = temp.toFixed(1);

      runPromptAnalysis(text);
      renderModelComparisonCards();
    } else {
      statTransChars.textContent = chars;
      statTransWords.textContent = words;
      statTransLines.textContent = lines;
      statTransTokens.textContent = tokens;
      statTransTemp.textContent = temp.toFixed(1);
    }

    checkEfficiency();
  }

  // Efficiency recommendation with exact requested text
  function checkEfficiency() {
    const inputTokens = parseInt(statInputTokens.textContent) || 0;
    const transTokens = parseInt(statTransTokens.textContent) || 0;

    if (inputTokens === 0 && transTokens === 0) {
      recommendationCard.classList.add('hidden');
      return;
    }

    recommendationText.textContent = "Se recomienda procesar la consulta en Inglés (Traducido) mediante DeepSeek V3. Esta combinación ofrece el balance óptimo entre latencia ultra baja, reducción drástica en el consumo de tokens y un costo operacional mínimo sin sacrificar precisión.";
    recommendationCard.classList.remove('hidden');
  }

  // Prompt Analysis Heuristics & 6 Breakdown Metrics
  function runPromptAnalysis(text) {
    if (!text || !text.trim()) {
      qualityScoreNum.textContent = "0/100";
      qualityProgressCircle.style.strokeDashoffset = "251.2";
      qualityScoreLabel.textContent = "Escribe tu prompt para evaluar la calidad.";
      qualityScoreLabel.className = "text-xs font-medium text-slate-400 mt-2 px-2";
      
      recommendationsList.innerHTML = `
        <li class="flex items-start gap-2">
          <span class="text-slate-500">•</span>
          <span>Escribe tu prompt para recibir sugerencias de mejora en tiempo real.</span>
        </li>
      `;
      metricsBreakdownContainer.innerHTML = `<div class="text-slate-500 text-center py-4">Esperando prompt...</div>`;
      return;
    }

    const trimmed = text.trim();
    const words = trimmed.split(/\s+/).length;
    const sentences = trimmed.split(/[.!?]+/).filter(Boolean).length;

    let clarityScore = Math.min(20, Math.max(5, words >= 10 && sentences >= 1 ? 20 : 10));
    const contextKeywords = /(ejemplo|contexto|caso|situación|escenario|basado en|dado que)/i;
    let contextScore = contextKeywords.test(trimmed) ? 18 : 6;
    const actionVerbs = /(actúa|explica|genera|analiza|escribe|resume|diseña|crea|traduce|resuelve|ayúdame|cuál|cómo|desarrolla|programa)/i;
    let verbsScore = actionVerbs.test(trimmed) ? 20 : 8;
    const constraintKeywords = /(formato|lista|tabla|json|código|markdown|tono|público|experto|principiante|restríngete|máximo|palabras|estricto)/i;
    let formatScore = constraintKeywords.test(trimmed) ? 17 : 5;
    let lengthScore = 15;
    if (words < 10) lengthScore = 5;
    else if (words >= 20 && words <= 250) lengthScore = 15;
    else lengthScore = 10;
    let structureScore = sentences >= 2 ? 10 : 4;

    const totalScore = clarityScore + contextScore + verbsScore + formatScore + lengthScore + structureScore;
    const score = Math.max(0, Math.min(100, totalScore));

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

    const metrics = [
      { name: "Claridad", val: clarityScore, max: 20 },
      { name: "Contexto", val: contextScore, max: 18 },
      { name: "Verbos de Acción", val: verbsScore, max: 20 },
      { name: "Especificidad/Formato", val: formatScore, max: 17 },
      { name: "Longitud Óptima", val: lengthScore, max: 15 },
      { name: "Estructura", val: structureScore, max: 10 }
    ];

    metricsBreakdownContainer.innerHTML = metrics.map(m => {
      const pct = Math.round((m.val / m.max) * 100);
      return `
        <div>
          <div class="flex justify-between text-[11px] mb-1">
            <span class="text-slate-300 font-medium">${m.name}</span>
            <span class="text-indigo-400 font-bold">${m.val}/${m.max} (${pct}%)</span>
          </div>
          <div class="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden">
            <div class="bg-gradient-to-r from-cyan-400 to-indigo-500 h-full rounded-full transition-all duration-300" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');

    const recs = [];
    if (words < 15) recs.push("Agrega más contexto o detalle para obtener mejores resultados.");
    const formatKeywords = /(lista|tabla|json|código|markdown|esquema|viñetas)/i;
    if (!formatKeywords.test(trimmed)) recs.push("Especifica el formato de salida deseado (lista, tabla, código, JSON, etc.).");
    const toneKeywords = /(tono|audiencia|experto|principiante|formal|casual|profesional)/i;
    if (!toneKeywords.test(trimmed)) recs.push("Indica el tono o la audiencia objetivo (ej: profesional, para principiantes).");
    const exampleKeywords = /(ejemplo|caso)/i;
    if (!exampleKeywords.test(trimmed) && words > 15) recs.push("Considera pedir ejemplos prácticos para guiar mejor al modelo.");

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

  // Render Model Comparison Cards
  function renderModelComparisonCards() {
    const inputTokens = parseInt(statInputTokens.textContent) || 0;
    const assumedOutputTokens = 500;

    const evaluatedModels = MODELS.map(model => {
      const inputCost = (inputTokens / 1000000) * model.inputCostPer1M;
      const outputCost = (assumedOutputTokens / 1000000) * model.outputCostPer1M;
      const totalCost = inputCost + outputCost;
      return {
        ...model,
        inputCost,
        outputCost,
        totalCost,
        tokens: inputTokens
      };
    });

    let cheapestId = null;
    let minCost = Infinity;
    evaluatedModels.forEach(m => {
      if (m.totalCost < minCost) {
        minCost = m.totalCost;
        cheapestId = m.id;
      }
    });

    let maxContextId = "gemini-1-5-pro";

    modelsGrid.innerHTML = evaluatedModels.map((m) => {
      const isCheapest = m.id === cheapestId;
      const isLargestContext = m.id === maxContextId;

      let borderClass = "border-slate-800/80";
      if (isCheapest) borderClass = "border-emerald-500/50 shadow-lg shadow-emerald-500/10";

      return `
        <div class="model-card p-4 flex flex-col justify-between ${borderClass}">
          <div>
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl ${m.color} border flex items-center justify-center font-bold text-xs">
                  ${m.initial}
                </div>
                <div>
                  <h3 class="font-bold text-sm text-white leading-tight">${m.name}</h3>
                  <span class="text-[11px] text-slate-400">${m.company}</span>
                </div>
              </div>
              <div class="flex flex-col items-end gap-1">
                ${isCheapest ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">Más económico</span>' : ''}
                ${isLargestContext ? '<span class="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30">Mayor contexto</span>' : ''}
              </div>
            </div>

            <div class="space-y-2 pt-2 border-t border-slate-800/60 text-xs">
              <div class="flex justify-between items-center">
                <span class="text-slate-400">Tokens estimados:</span>
                <span class="font-bold text-white">${m.tokens}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-400">Costo input:</span>
                <span class="font-mono text-slate-200">$${m.inputCost.toFixed(6)}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-slate-400">Costo output (~500t):</span>
                <span class="font-mono text-slate-200">$${m.outputCost.toFixed(5)}</span>
              </div>
              <div class="flex justify-between items-center pt-1 border-t border-slate-800/40">
                <span class="text-slate-300 font-medium">Costo total:</span>
                <span class="font-mono font-bold text-indigo-400">$${m.totalCost.toFixed(5)}</span>
              </div>
            </div>
          </div>

          <div class="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between text-[11px]">
            <span class="text-slate-400">Ventana de contexto:</span>
            <span class="font-bold text-slate-200 px-2 py-0.5 rounded bg-slate-800/80">${m.contextWindow}</span>
          </div>
        </div>
      `;
    }).join('');
  }

  // Robust Contextual translation flow
  async function translateText() {
    const rawText = promptInput.value.trim();
    if (!rawText) {
      alert('Por favor, introduce un prompt para traducir.');
      return;
    }

    // 1. Clean orthography on original prompt before translation
    const cleanedText = cleanOrthography(rawText);
    promptInput.value = cleanedText;
    updateStats(cleanedText, true);

    const sourceLang = sourceLangSelect.value;
    const targetLang = targetLangSelect.value;

    translateBtn.disabled = true;
    const origHTML = translateBtn.innerHTML;
    translateBtn.innerHTML = `<span>...</span>`;

    try {
      // 2. Split the prompt preserving paragraphs and sentence boundaries
      const parts = splitForTranslation(cleanedText);
      const translatedParts = [];

      for (let i = 0; i < parts.length; i++) {
        const part = parts[i];
        const langPair = sourceLang === 'auto' ? `autodetect|${targetLang}` : `${sourceLang}|${targetLang}`;

        // 3. Use the next chunk as context so the translation keeps coherence
        const context = i < parts.length - 1 ? parts[i + 1].text : part.text;
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(part.text)}&langpair=${langPair}&context=${encodeURIComponent(context)}`;
        const res = await fetch(url);
        const data = await res.json();

        if (data && data.responseData && data.responseData.translatedText && data.responseData.translatedText !== part.text) {
          translatedParts.push({ text: data.responseData.translatedText.trim(), sep: part.sep });

          if (sourceLang === 'auto' && data.responseData.detectedLanguage && i === 0) {
            applyDetectedLanguage(data.responseData.detectedLanguage);
          }
        } else {
          translatedParts.push({ text: part.text, sep: part.sep });
        }
      }

      // 4. Rebuild the translated prompt preserving paragraph breaks
      let translated = '';
      translatedParts.forEach((p, i) => {
        translated += p.text;
        if (i < translatedParts.length - 1) translated += p.sep;
      });

      translatedTextOutput.value = translated.trim();
      updateStats(translated.trim(), false);
    } catch (e) {
      console.error("Translation error:", e);
      const fallbackTranslation = `[Translated to ${targetLangSelect.options[targetLangSelect.selectedIndex].text}]: ${cleanedText}`;
      translatedTextOutput.value = fallbackTranslation;
      updateStats(fallbackTranslation, false);
    } finally {
      translateBtn.disabled = false;
      translateBtn.innerHTML = origHTML;
    }
  }

  // Split text into translation-safe chunks (MyMemory free limit ~500 chars)
  function splitForTranslation(text) {
    const MAX = 450;
    const parts = [];
    const paragraphs = text.split(/\n\s*\n/);

    paragraphs.forEach((para, pIndex) => {
      const isLastParagraph = pIndex === paragraphs.length - 1;
      const sentences = para.match(/[^.!?]+[.!?]*\s*/g) || [para.trim()];
      let current = '';
      const paraParts = [];

      sentences.forEach(s => {
        if (current.length + s.length > MAX && current) {
          paraParts.push(current.trim());
          current = s;
        } else {
          current += s;
        }
      });

      if (current.trim()) paraParts.push(current.trim());

      paraParts.forEach((p, i) => {
        const isLastInPara = i === paraParts.length - 1;
        parts.push({ text: p, sep: isLastInPara && !isLastParagraph ? '\n\n' : ' ' });
      });
    });

    return parts;
  }

  // Show the language detected by the translation service
  function applyDetectedLanguage(code) {
    if (!code) return;
    const short = code.split('-')[0].toLowerCase();
    const names = { es: "Español", en: "Inglés", fr: "Francés", de: "Alemán", it: "Italiano", pt: "Portugués", ja: "Japonés", zh: "Chino", ru: "Ruso" };
    detectedLangBadge.textContent = names[short] || code;

    if (sourceLangSelect.value === 'auto' && sourceLangSelect.querySelector(`option[value="${short}"]`)) {
      sourceLangSelect.value = short;
    }
  }

  // Optimize prompt feature (isolated, does not touch translation)
  function optimizePrompt() {
    const text = promptInput.value.trim();
    if (!text) {
      alert('Por favor, introduce un prompt para optimizar.');
      return;
    }

    const optimized = `Act as an expert AI assistant. Provide a highly detailed, accurate, and well-structured response for the following objective:\n\n${text}\n\nEnsure clarity, precision, and actionable insights.`;
    const cleaned = cleanOrthography(optimized);
    promptInput.value = cleaned;
    updateStats(cleaned, true);
  }

  // Event Listeners with Debounce (300ms) for promptInput
  promptInput.addEventListener('input', (e) => {
    const val = e.target.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      updateStats(val, true);
    }, 300);
  });

  translatedTextOutput.addEventListener('input', (e) => {
    updateStats(e.target.value, false);
  });

  modelSelect.addEventListener('change', () => {
    updateStats(promptInput.value, true);
    updateStats(translatedTextOutput.value, false);
  });

  translateBtn.addEventListener('click', translateText);
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
        <svg class="w-5 h-5 text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
        </svg>
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
    renderModelComparisonCards();
  });
});
