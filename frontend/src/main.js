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
    contextWindow: "128K",
    contextValue: 128000
  },
  {
    id: "claude-3-5",
    name: "Claude 3.5 Sonnet",
    company: "Anthropic",
    initial: "C",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    contextWindow: "200K",
    contextValue: 200000
  },
  {
    id: "gemini-1-5-pro",
    name: "Gemini 1.5 Pro",
    company: "Google",
    initial: "G",
    color: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    inputCostPer1M: 1.25,
    outputCostPer1M: 5.00,
    contextWindow: "2M",
    contextValue: 2000000
  },
  {
    id: "llama-3-1",
    name: "Llama 3.1 70B",
    company: "Meta",
    initial: "M",
    color: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    inputCostPer1M: 0.70,
    outputCostPer1M: 0.90,
    contextWindow: "128K",
    contextValue: 128000
  },
  {
    id: "mistral-large",
    name: "Mistral Large 2",
    company: "Mistral",
    initial: "Mi",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    inputCostPer1M: 2.00,
    outputCostPer1M: 6.00,
    contextWindow: "128K",
    contextValue: 128000
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek V3",
    company: "DeepSeek",
    initial: "D",
    color: "bg-violet-500/20 text-violet-400 border-violet-500/30",
    inputCostPer1M: 0.14,
    outputCostPer1M: 0.28,
    contextWindow: "64K",
    contextValue: 64000
  }
];

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

  // Models Accordion elements
  const modelsAccordionHeader = document.getElementById('modelsAccordionHeader');
  const modelsAccordionBody = document.getElementById('modelsAccordionBody');
  const accordionChevron = document.getElementById('accordionChevron');
  const modelsGrid = document.getElementById('modelsGrid');

  let isRotated = false;
  let isAccordionOpen = false;
  let debounceTimer = null;

  // Toggle Accordion
  modelsAccordionHeader.addEventListener('click', () => {
    isAccordionOpen = !isAccordionOpen;
    if (isAccordionOpen) {
      modelsAccordionBody.classList.add('expanded');
      accordionChevron.style.transform = 'rotate(180deg)';
      renderModelComparisonCards();
    } else {
      modelsAccordionBody.classList.remove('expanded');
      accordionChevron.style.transform = 'rotate(0deg)';
    }
  });

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
      runPromptAnalysis(text);
      
      if (isAccordionOpen) {
        renderModelComparisonCards();
      }
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

    let score = 50;
    if (words < 8) score -= 25;
    else if (words < 15) score -= 10;
    else if (words >= 20 && words <= 200) score += 20;
    else if (words > 350) score -= 10;

    const actionVerbs = /(actúa|explica|genera|analiza|escribe|resume|diseña|crea|traduce|resuelve|ayúdame|cuál|cómo|desarrolla|programa)/i;
    if (actionVerbs.test(trimmed)) score += 15;

    const contextKeywords = /(ejemplo|contexto|caso|situación|escenario|basado en|dado que)/i;
    if (contextKeywords.test(trimmed)) score += 10;

    const constraintKeywords = /(formato|lista|tabla|json|código|markdown|tono|público|experto|principiante|restríngete|máximo|palabras|estricto)/i;
    if (constraintKeywords.test(trimmed)) score += 15;

    if (sentences >= 2) score += 10;

    score = Math.max(0, Math.min(100, score));

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

  // Render Model Comparison Cards
  function renderModelComparisonCards() {
    const inputTokens = parseInt(statInputTokens.textContent) || 0;
    const assumedOutputTokens = 500; // Average response assumption

    // Calculate costs for each model
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

    // Find cheapest model (lowest total cost)
    let cheapestId = null;
    let minCost = Infinity;
    evaluatedModels.forEach(m => {
      if (m.totalCost < minCost) {
        minCost = m.totalCost;
        cheapestId = m.id;
      }
    });

    // Find largest context window model
    let maxContextId = "gemini-1-5-pro"; // Gemini 1.5 Pro has 2M

    modelsGrid.innerHTML = evaluatedModels.map((m, index) => {
      const isCheapest = m.id === cheapestId;
      const isLargestContext = m.id === maxContextId;

      let borderClass = "border-slate-800/80";
      if (isCheapest) borderClass = "border-emerald-500/50 shadow-lg shadow-emerald-500/10";

      return `
        model-card p-4 flex flex-col justify-between opacity-0 translate-y-3 transition-all duration-300 ${borderClass}" 
        style="transition-delay: ${index * 50}ms;"
        id="model-card-${m.id}"
      >
        <div>
          <!-- Model Header -->
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

          <!-- Stats List -->
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

    // Trigger stagger fade-in animation
    setTimeout(() => {
      evaluatedModels.forEach((m) => {
        const el = document.getElementById(`model-card-${m.id}`);
        if (el) {
          el.classList.remove('opacity-0', 'translate-y-3');
        }
      });
    }, 20);
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

    const tempText = promptInput.value;
    promptInput.value = translatedTextOutput.value;
    translatedTextOutput.value = tempText;

    const tempLang = sourceLangSelect.value;
    sourceLangSelect.value = targetLangSelect.value;
    if (tempLang !== 'auto') {
      targetLangSelect.value = tempLang;
    }

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

      await translateText();
    } catch (e) {
      console.error("Optimization error:", e);
    } finally {
      optimizeBtn.disabled = false;
      optimizeBtn.innerHTML = origHTML;
    }
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
    if (isAccordionOpen) {
      renderModelComparisonCards();
    }
  });
});
