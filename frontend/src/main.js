import "./style.css";
import { countTokens, countTokensWithEncoding, getModelTokenizerInfo, getSupportedModels, isApproximation } from "./tokenizers.js";
import nspell from "nspell";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://127.0.0.1:8000";

const MODELS = [
  {
    id: "gpt-4o",
    name: "GPT-4o",
    company: "OpenAI",
    initial: "O",
    color: "bg-l2 text-sec border-c",
    inputCostPer1M: 2.50,
    outputCostPer1M: 10.00,
    contextWindow: "128K"
  },
  {
    id: "gpt-4o-mini",
    name: "GPT-4o mini",
    company: "OpenAI",
    initial: "4m",
    color: "bg-l2 text-sec border-c",
    inputCostPer1M: 0.15,
    outputCostPer1M: 0.60,
    contextWindow: "128K"
  },
  {
    id: "claude-3-5",
    name: "Claude 3.5 Sonnet",
    company: "Anthropic",
    initial: "C",
    color: "bg-l2 text-sec border-c",
    inputCostPer1M: 3.00,
    outputCostPer1M: 15.00,
    contextWindow: "200K"
  },
  {
    id: "claude-3-5-haiku",
    name: "Claude 3.5 Haiku",
    company: "Anthropic",
    initial: "Ha",
    color: "bg-l2 text-sec border-c",
    inputCostPer1M: 0.80,
    outputCostPer1M: 4.00,
    contextWindow: "200K"
  },
  {
    id: "gemini-1-5-pro",
    name: "Gemini 1.5 Pro",
    company: "Google",
    initial: "G",
    color: "bg-l2 text-sec border-c",
    inputCostPer1M: 1.25,
    outputCostPer1M: 5.00,
    contextWindow: "2M"
  },
  {
    id: "llama-3-1",
    name: "Llama 3.1 70B",
    company: "Meta",
    initial: "M",
    color: "bg-l2 text-sec border-c",
    inputCostPer1M: 0.70,
    outputCostPer1M: 0.90,
    contextWindow: "128K"
  },
  {
    id: "mistral-large",
    name: "Mistral Large 2",
    company: "Mistral",
    initial: "Mi",
    color: "bg-l2 text-sec border-c",
    inputCostPer1M: 2.00,
    outputCostPer1M: 6.00,
    contextWindow: "128K"
  },
  {
    id: "deepseek-v3",
    name: "DeepSeek V3",
    company: "DeepSeek",
    initial: "D",
    color: "bg-l2 text-sec border-c",
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

  const optRecommendation = document.getElementById('optRecommendation');

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
  const qualityLevelBadge = document.getElementById('qualityLevelBadge');
  const qualityStars = document.getElementById('qualityStars');
  const recommendationsList = document.getElementById('recommendationsList');
  const metricsBreakdownContainer = document.getElementById('metricsBreakdownContainer');

  // Optimization panel elements
  const optimizedPromptCard = document.getElementById('optimizedPromptCard');
  const optimizedContentWrapper = document.getElementById('optimizedContentWrapper');
  const optimizedPromptOutput = document.getElementById('optimizedPromptOutput');
  const optLangSelect = document.getElementById('optLangSelect');
  const optimizedImprovementsList = document.getElementById('optimizedImprovementsList');
  const optAfterCircle = document.getElementById('optAfterCircle');
  const optAfterScore = document.getElementById('optAfterScore');
  const optAfterStars = document.getElementById('optAfterStars');
  const optAfterLabel = document.getElementById('optAfterLabel');
  const optAfterLevelBadge = document.getElementById('optAfterLevelBadge');
  const optAfterMetrics = document.getElementById('optAfterMetrics');
  const optTokensBefore = document.getElementById('optTokensBefore');
  const optTokensAfter = document.getElementById('optTokensAfter');
  const optTokensDiff = document.getElementById('optTokensDiff');
  const optQualityBefore = document.getElementById('optQualityBefore');
  const optQualityAfter = document.getElementById('optQualityAfter');
  const optQualityDiff = document.getElementById('optQualityDiff');
  const optLevelBefore = document.getElementById('optLevelBefore');
  const optLevelAfter = document.getElementById('optLevelAfter');
  const copyOptimizedBtn = document.getElementById('copyOptimizedBtn');
  const optimizeScopeBtn = document.getElementById('optimizeScopeBtn');
  const optimizeScopeMenu = document.getElementById('optimizeScopeMenu');
  const toggleOptimizedBtn = document.getElementById('toggleOptimizedBtn');

  // Models Grid
  const modelsGrid = document.getElementById('modelsGrid');

  // Theme toggle
  const themeToggle = document.getElementById('themeToggle');
  themeToggle.addEventListener('click', () => {
    const html = document.documentElement;
    const next = html.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    html.setAttribute('data-theme', next);
    try {
      localStorage.setItem('pt-theme', next);
    } catch (e) {
      // almacenamiento no disponible
    }
  });

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

  // ============================================================
  // SPELL CHECKER (nspell + Hunspell) - OFFLINE
  // ============================================================
  let spellCheckers = { es: null, en: null };
  let spellCheckerLoaded = { es: false, en: false };

  async function loadSpellChecker(lang) {
    if (spellCheckerLoaded[lang]) return spellCheckers[lang];
    try {
      const [affResponse, dicResponse] = await Promise.all([
        fetch(`/assets/dictionaries/${lang}.aff`),
        fetch(`/assets/dictionaries/${lang}.dic`)
      ]);
      const aff = await affResponse.arrayBuffer();
      const dic = await dicResponse.arrayBuffer();
      const spell = nspell(aff, dic);
      spellCheckers[lang] = spell;
      spellCheckerLoaded[lang] = true;
      return spell;
    } catch (e) {
      console.warn(`Failed to load spell checker for ${lang}:`, e);
      spellCheckerLoaded[lang] = false;
      return null;
    }
  }

  async function getSpellChecker(lang) {
    if (!spellCheckerLoaded[lang]) {
      await loadSpellChecker(lang);
    }
    return spellCheckers[lang];
  }

  function checkSpelling(text, lang) {
    const spell = spellCheckers[lang];
    if (!spell) return [];
    const words = text.match(/[a-zA-ZáéíóúüñÁÉÍÓÚÜÑ]+/g) || [];
    const misspelled = [];
    for (const word of words) {
      if (!spell.correct(word)) {
        misspelled.push(word.toLowerCase());
      }
    }
    return [...new Set(misspelled)];
  }

  function getSuggestions(word, lang) {
    const spell = spellCheckers[lang];
    if (!spell) return [];
    return spell.suggest(word) || [];
  }

  // Spell check overlay state
  let spellCheckOverlay = null;
  let spellCheckDebounceTimer = null;
  const SPELL_CHECK_DEBOUNCE = 300;

  function createSpellCheckOverlay(textarea) {
    if (spellCheckOverlay) return spellCheckOverlay;
    
    const container = document.createElement('div');
    container.className = 'spell-check-overlay';
    container.style.cssText = `
      position: absolute;
      top: 0; left: 0; right: 0; bottom: 0;
      pointer-events: none;
      z-index: 10;
      font: inherit;
      padding: inherit;
      line-height: inherit;
      letter-spacing: inherit;
      white-space: pre-wrap;
      word-wrap: break-word;
      overflow: hidden;
      color: transparent;
    `;
    
    const wrapper = textarea.parentElement;
    wrapper.style.position = 'relative';
    wrapper.insertBefore(container, textarea.nextSibling);
    
    spellCheckOverlay = container;
    return container;
  }

  function updateSpellCheckOverlay(textarea, misspelledWords, lang) {
    if (!spellCheckOverlay) createSpellCheckOverlay(textarea);
    if (!spellCheckOverlay) return;

    let html = textarea.value
      .replace(/&/g, '&')
      .replace(/</g, '<')
      .replace(/>/g, '>')
      .replace(/"/g, '"')
      .replace(/'/g, '&#039;')
      .replace(/\n/g, '<br>')
      .replace(/ /g, '&nbsp;');

    // Highlight misspelled words with wavy underline
    for (const word of misspelledWords) {
      const regex = new RegExp(`(${word.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
      html = html.replace(regex, '<span class="spell-error" data-word="$1" data-lang="' + lang + '">$1</span>');
    }

    spellCheckOverlay.innerHTML = html;
  }

  function clearSpellCheckOverlay() {
    if (spellCheckOverlay) {
      spellCheckOverlay.innerHTML = '';
    }
  }

  async function debouncedSpellCheck(textarea) {
    clearTimeout(spellCheckDebounceTimer);
    spellCheckDebounceTimer = setTimeout(async () => {
      const text = textarea.value;
      if (!text.trim()) {
        clearSpellCheckOverlay();
        return;
      }
      const lang = detectLanguage(text);
      await getSpellChecker(lang);
      const misspelled = checkSpelling(text, lang);
      updateSpellCheckOverlay(textarea, misspelled, lang);
    }, SPELL_CHECK_DEBOUNCE);
  }

  // ============================================================
  // REAL-TIME AUTO-TRANSLATION
  // ============================================================
  let autoTranslateController = null;
  let autoTranslateDebounceTimer = null;
  const AUTO_TRANSLATE_DEBOUNCE = 600;
  let autoTranslateEnabled = true;

  function showAutoTranslateLoading(show) {
    const existing = document.getElementById('auto-translate-loading');
    if (show && !existing) {
      const indicator = document.createElement('div');
      indicator.id = 'auto-translate-loading';
      indicator.className = 'absolute right-3 top-3 flex items-center gap-1.5 text-xs text-mut';
      indicator.innerHTML = `
        <span class="w-3 h-3 border-2 border-accent border-t-transparent rounded-full animate-spin"></span>
        <span>Traduciendo...</span>
      `;
      const wrapper = translatedTextOutput.parentElement;
      wrapper.style.position = 'relative';
      wrapper.appendChild(indicator);
    } else if (!show && existing) {
      existing.remove();
    }
  }

  async function performAutoTranslate(text, sourceLang, targetLang, requestId) {
    if (!text.trim()) {
      translatedTextOutput.value = '';
      updateStats('', false);
      return;
    }

    // Cancel previous in-flight request
    if (autoTranslateController) {
      autoTranslateController.abort();
    }
    autoTranslateController = new AbortController();

    showAutoTranslateLoading(true);

    try {
      const cleanedText = cleanOrthography(text);
      
      // Try backend first
      try {
        const backendResponse = await fetch(`${BACKEND_URL}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanedText,
            source_lang: sourceLang,
            target_lang: targetLang,
            model_name: modelSelect.value
          }),
          signal: autoTranslateController.signal
        });

        if (backendResponse.ok) {
          const backendData = await backendResponse.json();
          if (backendData?.translated_text && requestId === currentAutoTranslateRequestId) {
            translatedTextOutput.value = backendData.translated_text.trim();
            updateStats(translatedTextOutput.value, false);
            showAutoTranslateLoading(false);
            return;
          }
        }
      } catch (backendError) {
        if (backendError.name !== 'AbortError') {
          console.warn('Backend unavailable, using local translation fallback:', backendError);
        }
      }

      // Local fallback translation using MyMemory
      const parts = splitForTranslation(cleanedText);
      const translatedParts = [];

      for (let i = 0; i < parts.length; i++) {
        if (autoTranslateController.signal.aborted) return;
        
        const part = parts[i];
        const langPair = sourceLang === 'auto' ? `autodetect|${targetLang}` : `${sourceLang}|${targetLang}`;
        const context = i < parts.length - 1 ? parts[i + 1].text : part.text;
        const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(part.text)}&langpair=${langPair}&context=${encodeURIComponent(context)}`;
        
        try {
          const res = await fetch(url, { signal: autoTranslateController.signal });
          const data = await res.json();

          if (data && data.responseData && data.responseData.translatedText && data.responseData.translatedText !== part.text) {
            if (i === 0 && data.responseData.detectedLanguage) {
              const detected = data.responseData.detectedLanguage.split('-')[0].toLowerCase();
              if (detected === targetLang) {
                if (requestId === currentAutoTranslateRequestId) {
                  translatedTextOutput.value = cleanedText;
                  updateStats(cleanedText, false);
                  showAutoTranslateLoading(false);
                }
                return;
              }
            }
            translatedParts.push({ text: data.responseData.translatedText.trim(), sep: part.sep });
          } else {
            translatedParts.push({ text: part.text, sep: part.sep });
          }
        } catch (e) {
          if (e.name !== 'AbortError') {
            translatedParts.push({ text: part.text, sep: part.sep });
          }
        }
      }

      if (autoTranslateController.signal.aborted) return;

      let translated = '';
      translatedParts.forEach((p, i) => {
        translated += p.text;
        if (i < translatedParts.length - 1) translated += p.sep;
      });

      if (requestId === currentAutoTranslateRequestId) {
        translatedTextOutput.value = translated.trim();
        updateStats(translated.trim(), false);
      }
    } catch (e) {
      if (e.name !== 'AbortError') {
        console.error("Auto-translation error:", e);
        if (requestId === currentAutoTranslateRequestId) {
          const fallbackTranslation = `[Translated to ${targetLangSelect.options[targetLangSelect.selectedIndex].text}]: ${cleanedText}`;
          translatedTextOutput.value = fallbackTranslation;
          updateStats(fallbackTranslation, false);
        }
      }
    } finally {
      if (requestId === currentAutoTranslateRequestId) {
        showAutoTranslateLoading(false);
      }
    }
  }

  let currentAutoTranslateRequestId = 0;

  function debouncedAutoTranslate(textarea) {
    if (!autoTranslateEnabled) return;
    
    const text = textarea.value;
    const detectedLang = detectLanguage(text);
    
    // Only auto-translate Spanish text
    if (detectedLang !== 'es') {
      // Clear translation if text is empty
      if (!text.trim()) {
        translatedTextOutput.value = '';
        updateStats('', false);
      }
      return;
    }

    clearTimeout(autoTranslateDebounceTimer);
    autoTranslateDebounceTimer = setTimeout(() => {
      const sourceLang = sourceLangSelect.value === 'auto' ? 'es' : sourceLangSelect.value;
      const targetLang = targetLangSelect.value;
      currentAutoTranslateRequestId++;
      performAutoTranslate(text, sourceLang, targetLang, currentAutoTranslateRequestId);
    }, AUTO_TRANSLATE_DEBOUNCE);
  }

  // Get token count using selected encoding (async - for input/translated stats)
  async function countTokensWithEncoding(text, encodingName) {
    if (!text || !text.trim()) return 0;
    try {
      return await countTokensWithEncoding(text, encodingName);
    } catch (e) {
      console.error("Tokenization error:", e);
      return Math.ceil(text.length / 4);
    }
  }

  // Get token count using model-specific tokenizers (async - for model comparison)
  async function countTokensAsync(text, modelId) {
    if (!text || !text.trim()) return 0;
    try {
      return await countTokens(text, modelId);
    } catch (e) {
      console.error("Tokenization error:", e);
      return Math.ceil(text.length / 4);
    }
  }

  // Update stats for input or translated text
  async function updateStats(text, isInput = true) {
    const chars = text.length;
    const words = text.trim() ? text.trim().split(/\s+/).length : 0;
    const lines = text ? text.split(/\r\n|\r|\n/).length : 0;
    const encodingName = modelSelect.value;
    const tokens = await countTokensWithEncoding(text, encodingName);
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

  // Efficiency recommendation - dynamic based on actual token comparison (matches backend logic)
  function checkEfficiency() {
    const inputTokens = parseInt(statInputTokens.textContent) || 0;
    const transTokens = parseInt(statTransTokens.textContent) || 0;

    if (inputTokens === 0 && transTokens === 0) {
      optRecommendation.classList.add('hidden');
      return;
    }

    const diff = inputTokens - transTokens;
    const threshold = Math.max(1, Math.round(inputTokens * 0.1)); // 10% threshold

    if (Math.abs(diff) < threshold) {
      optRecommendation.textContent = `La diferencia de tokens es insignificante (<10%). Puede usar el idioma original sin penalización.`;
    } else if (diff > 0) {
      optRecommendation.textContent = `El idioma original es más eficiente: consume ${diff} tokens menos que la traducción.`;
    } else {
      optRecommendation.textContent = `El idioma traducido es más eficiente: consume ${Math.abs(diff)} tokens menos que el original.`;
    }
    optRecommendation.classList.remove('hidden');
  }

  // Helper to evaluate prompt quality strictly and accurately
  function evaluatePromptQuality(text) {
    if (!text || !text.trim()) {
      return {
        score: 0,
        lengthScore: 0,
        actionScore: 0,
        contextScore: 0,
        formatScore: 0,
        structureScore: 0,
        level: '—',
        stars: '☆☆☆',
        levelClass: 'badge badge-neutral',
        starsClass: 'text-sm leading-none tracking-wide text-mut',
        label: 'Escribe tu prompt para evaluar la calidad.'
      };
    }

    const trimmed = text.trim();
    const words = trimmed.split(/\s+/).length;
    const sentences = trimmed.split(/[.!?]+/).filter(Boolean).length;
    const lower = trimmed.toLowerCase();

    // 1. Longitud adecuada (max 25 pts)
    let lengthScore = 0;
    if (words < 8) lengthScore = 0;
    else if (words < 20) lengthScore = 10;
    else if (words <= 200) lengthScore = 25;
    else if (words <= 350) lengthScore = 15;
    else lengthScore = 10;

    // 2. Verbo de acción/instrucción claro (max 20 pts)
    const actionVerbs = /(actúa|actua|actuar|explica|explicar|genera|generar|analiza|analizar|escribe|escribir|resume|resumir|diseña|diseñar|crea|crear|traduce|traducir|resuelve|resolver|ayúdame|ayudar|cuál|cómo|desarrolla|desarrollar|programa|programar|calcula|calcular|ordena|ordenar|filtra|filtrar|construye|construir|describe|describir)/i;
    const actionScore = actionVerbs.test(lower) ? 20 : 0;

    // 3. Contexto o situación (max 15 pts)
    const contextKeywords = /(ejemplo|contexto|caso|situación|escenario|basado en|dado que|para el proyecto|siguiente código|siguiente texto|donde|considerando|si ocurre|cuando)/i;
    const contextScore = contextKeywords.test(lower) ? 15 : 0;

    // 4. Restricciones/Formato especificado (max 20 pts)
    const formatKeywords = /(formato|lista|tabla|json|markdown|tono|público|publico|experto|principiante|restríngete|restrigete|máximo|maximo|palabras|estricto|sin alucinaciones|pasos|viñetas|viñetas|salida|devuelve|retorna)/i;
    const restrictionKeywords = /(no hagas|evita|debe tener|incluye|requiere|limitado a|solo devuelve|únicamente|sin explicar|restricciones:|sin inventar|sin alucinar)/i;
    const formatScore = (formatKeywords.test(lower) || restrictionKeywords.test(lower)) ? 20 : 0;

    // 5. Estructura (2+ oraciones bien formadas) (max 20 pts)
    const hasParagraphs = text.includes('\n');
    let structureScore = 0;
    if (sentences >= 2 && hasParagraphs) structureScore = 20;
    else if (sentences >= 2) structureScore = 18;
    else if (sentences === 1 && words >= 20) structureScore = 8;

    const totalScore = Math.min(100, lengthScore + actionScore + contextScore + formatScore + structureScore);

    let level = "Básico";
    let levelClass = "badge badge-neutral";
    let stars = "★☆☆";
    let starsClass = "text-sm leading-none tracking-wide text-mut";
    let label = "Prompt muy vago o incompleto. Agrega rol, contexto y formato.";

    if (totalScore >= 40 && totalScore <= 70) {
      level = "Intermedio";
      levelClass = "badge badge-accent";
      stars = "★★☆";
      starsClass = "text-sm leading-none tracking-wide accent-text";
      label = "Prompt aceptable. Especifica restricciones o un formato de salida claro.";
    } else if (totalScore > 70) {
      level = "Pro";
      levelClass = "badge badge-solid";
      stars = "★★★";
      starsClass = "text-sm leading-none tracking-wide accent-text";
      label = "Prompt claro, bien estructurado y con alto nivel de precisión.";
    }

    return {
      score: totalScore,
      lengthScore,
      actionScore,
      contextScore,
      formatScore,
      structureScore,
      level,
      stars,
      levelClass,
      starsClass,
      label
    };
  }

  // Prompt Analysis Heuristics & 6 Breakdown Metrics
  function runPromptAnalysis(text) {
    const evalResult = evaluatePromptQuality(text);

    if (!text || !text.trim()) {
      qualityScoreNum.textContent = "0/100";
      qualityProgressCircle.style.strokeDashoffset = "251.2";
      qualityScoreLabel.textContent = evalResult.label;
      qualityScoreLabel.className = "text-xs font-medium text-sec mt-2 px-2";

      qualityLevelBadge.textContent = evalResult.level;
      qualityLevelBadge.className = evalResult.levelClass;
      qualityStars.textContent = evalResult.stars;
      qualityStars.className = evalResult.starsClass;

      recommendationsList.innerHTML = `
        <li class="flex items-start gap-2">
          <span class="text-mut">•</span>
          <span>Escribe tu prompt para recibir sugerencias de mejora en tiempo real.</span>
        </li>
      `;
      metricsBreakdownContainer.innerHTML = `<div class="text-mut text-center py-4">Esperando prompt...</div>`;
      return;
    }

    const trimmed = text.trim();
    const words = trimmed.split(/\s+/).length;

    qualityScoreNum.textContent = `${evalResult.score}/100`;
    const circumference = 251.2;
    const offset = circumference - (evalResult.score / 100) * circumference;
    qualityProgressCircle.style.strokeDashoffset = offset;

    qualityLevelBadge.textContent = evalResult.level;
    qualityLevelBadge.className = evalResult.levelClass;
    qualityStars.textContent = evalResult.stars;
    qualityStars.className = evalResult.starsClass;

    qualityScoreLabel.textContent = evalResult.label;
    if (evalResult.score < 40) {
      qualityScoreLabel.className = "text-xs font-medium text-mut mt-2 px-2";
    } else if (evalResult.score <= 70) {
      qualityScoreLabel.className = "text-xs font-medium accent-text mt-2 px-2";
    } else {
      qualityScoreLabel.className = "text-xs font-medium accent-text mt-2 px-2";
    }

    const metrics = [
      { name: "Longitud adecuada", val: evalResult.lengthScore, max: 25 },
      { name: "Verbo de acción", val: evalResult.actionScore, max: 20 },
      { name: "Contexto o situación", val: evalResult.contextScore, max: 15 },
      { name: "Restricciones/Formato", val: evalResult.formatScore, max: 20 },
      { name: "Estructura", val: evalResult.structureScore, max: 20 }
    ];

    metricsBreakdownContainer.innerHTML = metrics.map(m => {
      const pct = Math.round((m.val / m.max) * 100);
      return `
        <div>
          <div class="flex justify-between text-[11px] mb-1">
            <span class="text-sec font-medium">${m.name}</span>
            <span class="accent-text font-bold">${m.val}/${m.max} (${pct}%)</span>
          </div>
          <div class="progress-track">
            <div class="progress-fill" style="width: ${pct}%"></div>
          </div>
        </div>
      `;
    }).join('');

    const recs = [];
    if (words < 12) recs.push("Agrega más detalle o especifica la tecnología o área objetivo.");
    const formatKeywords = /(lista|tabla|json|código|markdown|esquema|viñetas)/i;
    if (!formatKeywords.test(trimmed)) recs.push("Especifica el formato de salida deseado (lista, tabla, código, JSON, etc.).");
    const rolePattern = /(actúa|actua|eres un|as a|act as|rol:)/i;
    if (!rolePattern.test(trimmed)) recs.push("Define un rol para el modelo (ej: 'Actúa como desarrollador senior').");
    const constraintKeywords = /(restríngete|solo|únicamente|sin|evita|no hagas)/i;
    if (!constraintKeywords.test(trimmed) && words > 10) recs.push("Agrega restricciones explícitas (ej: 'Evita explicaciones innecesarias').");

    if (evalResult.score >= 80 && recs.length === 0) {
      recs.push("¡Excelente prompt! Está muy bien estructurado, delimitado y claro.");
    }

    recommendationsList.innerHTML = recs.map(rec => `
      <li class="flex items-start gap-2">
        <span class="accent-text">💡</span>
        <span>${rec}</span>
      </li>
    `).join('');
  }

  // Render Model Comparison Cards (async - uses per-model tokenizers)
  async function renderModelComparisonCards() {
    const text = promptInput.value.trim();
    if (!text) {
      modelsGrid.innerHTML = '<div class="col-span-full text-center text-mut py-8">Escribe un prompt para ver la comparación</div>';
      return;
    }

    const assumedOutputTokens = 500;

    const tokenPromises = MODELS.map(async (model) => {
      const tokens = await countTokensAsync(text, model.id);
      const inputCost = (tokens / 1000000) * model.inputCostPer1M;
      const outputCost = (assumedOutputTokens / 1000000) * model.outputCostPer1M;
      const totalCost = inputCost + outputCost;
      const info = getModelTokenizerInfo(model.id);
      return {
        ...model,
        tokens,
        inputCost,
        outputCost,
        totalCost,
        encoding: info.encoding,
        isApproximation: info.isApproximation,
      };
    });

    const evaluatedModels = await Promise.all(tokenPromises);

    let cheapestId = null;
    let minCost = Infinity;
    evaluatedModels.forEach(m => {
      if (m.totalCost < minCost) {
        minCost = m.totalCost;
        cheapestId = m.id;
      }
    });

    // Reorder models so the most efficient model always appears FIRST
    if (cheapestId) {
      evaluatedModels.sort((a, b) => {
        if (a.id === cheapestId) return -1;
        if (b.id === cheapestId) return 1;
        return a.totalCost - b.totalCost;
      });
    }

    let maxContextId = "gemini-1-5-pro";

    modelsGrid.innerHTML = evaluatedModels.map((m) => {
      const isCheapest = m.id === cheapestId;
      const isLargestContext = m.id === maxContextId;

      let borderClass = "border-c";
      if (isCheapest) {
        borderClass = "is-emphasized";
      }

      const approxBadge = m.isApproximation
        ? '<span class="badge badge-neutral ml-2" title="Tokenizador aproximado (no oficial)">≈ aprox</span>'
        : '';

      return `
        <div class="model-card p-4 flex flex-col justify-between ${borderClass}">
          <div>
            <div class="flex items-center justify-between mb-3">
              <div class="flex items-center gap-2.5">
                <div class="w-8 h-8 rounded-xl ${m.color} border flex items-center justify-center font-bold text-xs">
                  ${m.initial}
                </div>
                <div>
                  <h3 class="font-bold text-sm text-pri leading-tight">${m.name}</h3>
                  <span class="text-[11px] text-sec">${m.company}</span>
                </div>
              </div>
              <div class="flex flex-col items-end gap-1">
                ${isCheapest ? '<span class="badge badge-solid">★ MÁS EFICIENTE</span>' : ''}
                ${isLargestContext && !isCheapest ? '<span class="badge badge-neutral">Mayor contexto</span>' : ''}
              </div>
            </div>

            <div class="space-y-2 pt-2 border-t border-c text-xs">
              <div class="flex justify-between items-center">
                <span class="text-sec">Tokens estimados:</span>
                <span class="font-bold text-pri">${m.tokens}${approxBadge}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sec">Encoding:</span>
                <span class="font-mono text-[10px] text-mut">${m.encoding}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sec">Costo input:</span>
                <span class="font-mono text-sec">$${m.inputCost.toFixed(6)}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-sec">Costo output (~500t):</span>
                <span class="font-mono text-sec">$${m.outputCost.toFixed(5)}</span>
              </div>
              <div class="flex justify-between items-center pt-1 border-t border-c">
                <span class="text-sec font-medium">Costo total:</span>
                <span class="font-mono font-bold accent-text">$${m.totalCost.toFixed(5)}</span>
              </div>
            </div>
          </div>

          <div class="mt-3 pt-2.5 border-t border-c flex items-center justify-between text-[11px]">
            <span class="text-sec">Ventana de contexto:</span>
            <span class="badge badge-neutral">${m.contextWindow}</span>
          </div>
        </div>
      `;
    }).join('');

    // Add disclaimer
    const hasApproximations = evaluatedModels.some(m => m.isApproximation);
    if (hasApproximations) {
      const disclaimerEl = document.createElement('div');
      disclaimerEl.className = 'col-span-full mt-4 p-3 rounded-lg bg-l2 border border-c text-[11px] text-mut';
      disclaimerEl.innerHTML = `
        <strong class="text-sec">Nota:</strong> Los valores marcados con "≈ aprox" usan tokenizadores aproximados (cl100k_base/o200k_base) 
        porque los tokenizadores oficiales de Anthropic (Claude), Google (Gemini) y Meta (Llama) no son públicos. 
        Los modelos Llama 3, Mistral y DeepSeek intentan cargar sus tokenizadores reales vía HuggingFace; 
        si falla la carga, usan cl100k_base como fallback.
      `;
      modelsGrid.appendChild(disclaimerEl);
    }
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
    const targetName = targetLangSelect.options[targetLangSelect.selectedIndex].text;

    // Validation: source and target language must differ
    if (sourceLang === targetLang) {
      alert(`El idioma de origen y destino son el mismo (${targetName}). Cambia el idioma de destino.`);
      return;
    }

    // Validation: if the text is already in the target language, do not translate it again
    const localDetected = detectLanguage(cleanedText);
    if ((targetLang === 'en' || targetLang === 'es') && localDetected === targetLang) {
      alert(`El texto ya está en ${targetName}. No es necesario traducirlo.`);
      return;
    }

    translateBtn.disabled = true;
    const origHTML = translateBtn.innerHTML;
    translateBtn.innerHTML = `<span>...</span>`;

    try {
      // Try backend first so translation/token analysis stays centralized when the API is available.
      try {
        const backendResponse = await fetch(`${BACKEND_URL}/api/analyze`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: cleanedText,
            source_lang: sourceLang,
            target_lang: targetLang,
            model_name: modelSelect.value
          })
        });

        if (backendResponse.ok) {
          const backendData = await backendResponse.json();
          if (backendData?.translated_text) {
            translatedTextOutput.value = backendData.translated_text.trim();
            updateStats(translatedTextOutput.value, false);
            return;
          }
        }
      } catch (backendError) {
        console.warn('Backend unavailable, using local translation fallback:', backendError);
      }

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
          // Validation: abort if the service detected the text is already in the target language
          if (i === 0 && data.responseData.detectedLanguage) {
            const detected = data.responseData.detectedLanguage.split('-')[0].toLowerCase();
            if (detected === targetLang) {
              translatedTextOutput.value = cleanedText;
              updateStats(cleanedText, false);
              applyDetectedLanguage(data.responseData.detectedLanguage);
              alert(`El texto ya está en ${targetName}. No se realizó ninguna traducción.`);
              return;
            }
            if (sourceLang === 'auto') applyDetectedLanguage(data.responseData.detectedLanguage);
          }
          translatedParts.push({ text: data.responseData.translatedText.trim(), sep: part.sep });
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

  // Detect the prompt language based on the source selector or text markers
  function detectLanguage(text) {
    const sourceLang = sourceLangSelect.value;
    if (sourceLang === 'es' || sourceLang === 'en') return sourceLang;
    const spanishMarkers = /[áéíóúñ¿¡]|(^|\s)(el|la|los|las|de|y|que|una|un|para|con|como|es|del)\s/i;
    return spanishMarkers.test(text) ? 'es' : 'en';
  }

  // Analyze prompt content to build a dynamic optimization
  function analyzePrompt(text) {
    const lower = text.toLowerCase();
    const analysis = {
      type: 'general',
      formats: [],
      tone: null,
      audience: null
    };

    const typeMap = [
      { type: 'code', pattern: /(código|codigo|función|funcion|script|programa|programar|bug|api|algoritmo|clase|sql|json|desarrolla|debug)/i },
      { type: 'creative', pattern: /(historia|poema|cuento|crea|escribe|inventa|imagina|narrativa|ficción|ficcion|story|poem|creative)/i },
      { type: 'analysis', pattern: /(analiza|resume|explica|compara|evalúa|evalua|revisa|interpreta|sintetiza)/i },
      { type: 'data', pattern: /(datos|data|sql|json|csv|tabla|tablas|dataset|estadística|estadistica)/i }
    ];
    for (const t of typeMap) {
      if (t.pattern.test(lower)) {
        analysis.type = t.type;
        break;
      }
    }

    const formatPatterns = [
      { name: 'lista', pattern: /(lista|viñetas|viñeta|bullets|bullets list|list)/i },
      { name: 'tabla', pattern: /(tabla|table)/i },
      { name: 'json', pattern: /(json)/i },
      { name: 'código', pattern: /(código|codigo|code)/i },
      { name: 'markdown', pattern: /(markdown)/i },
      { name: 'resumen', pattern: /(resumen|resume|summary)/i },
      { name: 'pasos', pattern: /(pasos|steps|guía|guia|tutorial)/i }
    ];
    analysis.formats = formatPatterns.filter(f => f.pattern.test(lower)).map(f => f.name);

    if (/(tono formal|formal|profesional)/i.test(lower)) analysis.tone = 'formal';
    if (/(tono casual|casual|amigable|informal)/i.test(lower)) analysis.tone = 'casual';

    if (/(principiante|básico|basico|nivel inicial)/i.test(lower)) analysis.audience = 'principiante';
    if (/(experto|avanzado|profesional)/i.test(lower)) analysis.audience = 'experto';

    return analysis;
  }

  // Build the optimized prompt dynamically in the detected language
  function buildOptimizedPrompt(text, lang, scope = 'all') {
    const analysis = analyzePrompt(text);
    const isEs = lang === 'es';

    const roleByType = {
      code: isEs
        ? 'Actúa como un ingeniero de software senior experto en arquitectura limpia, eficiencia y buenas prácticas.'
        : 'Act as a senior software engineer expert in clean architecture, efficiency, and best practices.',
      creative: isEs
        ? 'Actúa como un escritor creativo profesional con un estilo vívido, preciso y cautivador.'
        : 'Act as a professional creative writer with a vivid, precise, and captivating style.',
      analysis: isEs
        ? 'Actúa como un analista riguroso que estructura información compleja con claridad y profundidad.'
        : 'Act as a rigorous analyst who structures complex information with clarity and depth.',
      data: isEs
        ? 'Actúa como un analista de datos experto en SQL, JSON y visualización de información.'
        : 'Act as a data analyst expert in SQL, JSON, and data visualization.',
      general: isEs
        ? 'Actúa como un asistente experto de alto rendimiento con respuestas detalladas y bien estructuradas.'
        : 'Act as a high-performance expert assistant with detailed, well-structured responses.'
    };

    const formatNames = {
      lista: isEs ? 'lista con viñetas' : 'bullet list',
      tabla: isEs ? 'tabla' : 'table',
      json: 'JSON',
      código: isEs ? 'código limpio y comentado' : 'clean, commented code',
      markdown: 'Markdown',
      resumen: isEs ? 'resumen conciso' : 'concise summary',
      pasos: isEs ? 'pasos numerados' : 'numbered steps'
    };
    const formatPrompt = analysis.formats.length
      ? (isEs
        ? `Formato de salida: ${analysis.formats.map(f => formatNames[f] || f).join(', ')}.`
        : `Output format: ${analysis.formats.map(f => formatNames[f] || f).join(', ')}.`)
      : (isEs
        ? 'Proporciona una respuesta clara, precisa y bien estructurada.'
        : 'Provide a clear, precise, and well-structured response.');

    const tonePrompt = analysis.tone === 'formal'
      ? (isEs ? 'Usa un tono formal y profesional. ' : 'Use a formal and professional tone. ')
      : analysis.tone === 'casual'
        ? (isEs ? 'Usa un tono amigable y casual. ' : 'Use a friendly and casual tone. ')
        : '';

    const audiencePrompt = analysis.audience === 'principiante'
      ? (isEs ? 'Explica en términos sencillos para principiantes. ' : 'Explain in simple terms for beginners. ')
      : analysis.audience === 'experto'
        ? (isEs ? 'Dirígete a un público experto y evita explicaciones básicas. ' : 'Address an expert audience and avoid basic explanations. ')
        : '';

    const constraints = isEs
      ? 'Restricciones: sé preciso y basado en hechos; si falta información, indícalo explícitamente en lugar de inventar. Entrega la respuesta en el idioma del prompt.'
      : 'Constraints: be precise and factual; if information is missing, say so explicitly instead of inventing. Deliver the response in the language of the prompt.';

    const role = roleByType[analysis.type];
    const taskLabel = isEs ? 'Tarea:' : 'Task:';
    const guidance = (tonePrompt + audiencePrompt).trim();

    const defaultTemplate = `${role}

${taskLabel} ${text}

${formatPrompt}${guidance ? ' ' + guidance : ''}
${constraints}`;

    if (scope === 'reduce') {
      return `${role}

${isEs ? 'Objetivo:' : 'Objective:'} ${text}

${isEs ? 'Reduce el prompt a lo esencial, elimina relleno y conserva solo la instrucción principal.' : 'Reduce the prompt to its essentials, remove fluff, and keep only the main instruction.'}
${isEs ? 'Devuelve una versión compacta, clara y con menor consumo de tokens.' : 'Return a compact, clear version with lower token usage.'}`;
    }

    if (scope === 'specific') {
      return `${role}

${taskLabel} ${text}

${isEs ? 'Haz la petición más precisa: añade contexto, objetivo final, criterios de éxito y restricciones.' : 'Make the request more precise: add context, final goal, success criteria, and constraints.'}
${constraints}`;
    }

    if (scope === 'format') {
      return `${role}

${taskLabel} ${text}

${formatPrompt}
${constraints}`;
    }

    return defaultTemplate;
  }

  // Optimize prompt feature: renders dedicated Optimization Panel without overwriting input
  function optimizePrompt(scope = 'all') {
    const sourceText = optimizedPromptOutput.value.trim() || promptInput.value.trim();
    if (!sourceText) {
      alert('Por favor, introduce un prompt para optimizar.');
      return;
    }

    const lang = optLangSelect.value;

    const baseAnalysis = analyzePrompt(sourceText);
    const rawOptimized = buildOptimizedPrompt(sourceText, lang, scope);
    const cleanedOptimized = rawOptimized
      .replace(/[ \t]+/g, ' ')
      .replace(/\s*\n\s*/g, '\n')
      .trim();

    const modelName = modelSelect.value;
    const origTokens = countTokens(sourceText, modelName);
    const optTokens = countTokens(cleanedOptimized, modelName);

    const origAnalysis = evaluatePromptQuality(sourceText);
    const optAnalysis = evaluatePromptQuality(cleanedOptimized);

    const afterMetrics = document.getElementById('optAfterMetrics');
    const afterCircle = document.getElementById('optAfterCircle');
    const afterScore = document.getElementById('optAfterScore');
    const afterLabel = document.getElementById('optAfterLabel');
    const afterLevel = document.getElementById('optAfterLevelBadge');
    const afterStars = document.getElementById('optAfterStars');

    const metricRows = (analysis) => `
      <div class="space-y-2 text-[11px]">
        <div class="flex justify-between"><span>Longitud adecuada</span><span class="accent-text font-bold">${analysis.lengthScore}/25</span></div>
        <div class="flex justify-between"><span>Verbo de acción</span><span class="accent-text font-bold">${analysis.actionScore}/20</span></div>
        <div class="flex justify-between"><span>Contexto o situación</span><span class="accent-text font-bold">${analysis.contextScore}/15</span></div>
        <div class="flex justify-between"><span>Restricciones/Formato</span><span class="accent-text font-bold">${analysis.formatScore}/20</span></div>
        <div class="flex justify-between"><span>Estructura</span><span class="accent-text font-bold">${analysis.structureScore}/20</span></div>
      </div>`;

    afterMetrics.innerHTML = metricRows(optAnalysis);

    afterCircle.style.strokeDashoffset = `${251.2 - (optAnalysis.score / 100) * 251.2}`;
    afterScore.textContent = `${optAnalysis.score}/100`;
    afterLabel.textContent = optAnalysis.label;
    afterLevel.textContent = `${optAnalysis.level}`;
    afterLevel.className = optAnalysis.levelClass;
    afterStars.textContent = optAnalysis.stars;
    afterStars.className = optAnalysis.starsClass;

    // Populate panel
    optimizedPromptOutput.value = cleanedOptimized;
    // optLangSelect already reflects the value used, no need to update it

    optTokensBefore.textContent = origTokens;
    optTokensAfter.textContent = optTokens;
    const tokenDiffPct = origTokens > 0 ? Math.round(((optTokens - origTokens) / origTokens) * 100) : 0;
    optTokensDiff.textContent = `${tokenDiffPct >= 0 ? '+' : ''}${tokenDiffPct}%`;
    optTokensDiff.className = tokenDiffPct > 0
      ? 'badge badge-neutral'
      : 'badge badge-accent';

    optQualityBefore.textContent = `${origAnalysis.score}/100`;
    optQualityAfter.textContent = `${optAnalysis.score}/100`;
    const qualityDiffPts = optAnalysis.score - origAnalysis.score;
    optQualityDiff.textContent = `${qualityDiffPts >= 0 ? '+' : ''}${qualityDiffPts} pts`;

    optLevelBefore.textContent = `${origAnalysis.level} ${origAnalysis.stars}`;
    optLevelAfter.textContent = `${optAnalysis.level} ${optAnalysis.stars}`;

    const typeLabelMap = { code: 'Código', creative: 'Creativo', analysis: 'Análisis', data: 'Datos', general: 'Asistente IA' };
    const selectedScopeLabel = {
      all: 'Optimizar todo',
      reduce: 'Reducir tokens',
      specific: 'Más específico',
      format: 'Mejor formato'
    }[scope] || 'Optimizar todo';

    const improvements = [
      `✓ Ámbito: ${selectedScopeLabel}`,
      `✓ Rol: ${typeLabelMap[baseAnalysis.type] || 'Experto'}`,
      `✓ Formato: ${baseAnalysis.formats.length ? baseAnalysis.formats.join(', ') : 'Estructurado'}`,
      `✓ Idioma óptimo: ${lang === 'es' ? 'Español' : 'Inglés'}`,
      `✓ Precisión y anti-alucinación`
    ];

    optimizedImprovementsList.innerHTML = improvements.map(imp => `
      <span class="badge badge-accent">${imp}</span>
    `).join('');

    optimizedContentWrapper.classList.remove('hidden');
    toggleOptimizedBtn.querySelector('span').textContent = 'Ocultar';
    optimizedPromptCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  // Event Listeners with Debounce (300ms) for promptInput
  promptInput.addEventListener('input', (e) => {
    const val = e.target.value;
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(() => {
      updateStats(val, true);
    }, 300);

    // Real-time spell check
    debouncedSpellCheck(e.target);

    // Real-time auto-translation (Spanish only)
    debouncedAutoTranslate(e.target);
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

  toggleOptimizedBtn.addEventListener('click', () => {
    optimizedContentWrapper.classList.toggle('hidden');
    const isHidden = optimizedContentWrapper.classList.contains('hidden');
    toggleOptimizedBtn.querySelector('span').textContent = isHidden ? 'Mostrar' : 'Ocultar';
  });

  optimizeScopeBtn.addEventListener('click', () => {
    optimizeScopeMenu.classList.toggle('hidden');
  });

  optimizeScopeMenu.querySelectorAll('button[data-scope]').forEach((btn) => {
    btn.addEventListener('click', () => {
      optimizeScopeMenu.classList.add('hidden');
      optimizePrompt(btn.dataset.scope || 'all');
    });
  });

  document.addEventListener('click', (event) => {
    if (!optimizeScopeMenu.contains(event.target) && !optimizeScopeBtn.contains(event.target)) {
      optimizeScopeMenu.classList.add('hidden');
    }
  });

  // Spell error click handler - show suggestions
  let activeSpellTooltip = null;

  document.addEventListener('click', (event) => {
    const spellError = event.target.closest('.spell-error');
    if (spellError) {
      event.preventDefault();
      event.stopPropagation();
      
      // Remove existing tooltip
      if (activeSpellTooltip) {
        activeSpellTooltip.remove();
        activeSpellTooltip = null;
      }

      const word = spellError.dataset.word;
      const lang = spellError.dataset.lang || detectLanguage(promptInput.value);
      const suggestions = getSuggestions(word, lang);

      if (suggestions.length === 0) return;

      const tooltip = document.createElement('div');
      tooltip.className = 'spell-suggestions-tooltip';
      tooltip.innerHTML = `
        <ul>${suggestions.map(s => `<li data-suggestion="${s}">${s}</li>`).join('')}</ul>
        <div class="spell-dismiss">Ignorar</div>
      `;

      // Position near the clicked word
      const rect = spellError.getBoundingClientRect();
      const textareaRect = promptInput.getBoundingClientRect();
      tooltip.style.top = `${rect.bottom - textareaRect.top + 4}px`;
      tooltip.style.left = `${rect.left - textareaRect.left}px`;

      // Add click handlers for suggestions
      tooltip.querySelectorAll('li[data-suggestion]').forEach(li => {
        li.addEventListener('click', () => {
          const suggestion = li.dataset.suggestion;
          replaceWordInTextarea(promptInput, word, suggestion);
          tooltip.remove();
          activeSpellTooltip = null;
          // Trigger spell check again
          debouncedSpellCheck(promptInput);
          // Trigger stats update
          updateStats(promptInput.value, true);
        });
      });

      tooltip.querySelector('.spell-dismiss').addEventListener('click', () => {
        tooltip.remove();
        activeSpellTooltip = null;
      });

      const wrapper = promptInput.parentElement;
      wrapper.appendChild(tooltip);
      activeSpellTooltip = tooltip;
      return;
    }

    // Close tooltip if clicking elsewhere
    if (activeSpellTooltip && !activeSpellTooltip.contains(event.target)) {
      activeSpellTooltip.remove();
      activeSpellTooltip = null;
    }
  });

  function replaceWordInTextarea(textarea, oldWord, newWord) {
    const text = textarea.value;
    const regex = new RegExp(`\\b${oldWord.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\b`, 'gi');
    textarea.value = text.replace(regex, newWord);
  }

  copyOptimizedBtn.addEventListener('click', () => {
    const val = optimizedPromptOutput.value;
    if (!val) return;
    navigator.clipboard.writeText(val).then(() => {
      const origSpan = copyOptimizedBtn.querySelector('span');
      const origText = origSpan.textContent;
      origSpan.textContent = '¡Copiado!';
      setTimeout(() => {
        origSpan.textContent = origText;
      }, 2000);
    });
  });

  copyBtn.addEventListener('click', () => {
    const textToCopy = translatedTextOutput.value || promptInput.value;
    if (!textToCopy) {
      alert('No hay texto para copiar.');
      return;
    }
    navigator.clipboard.writeText(textToCopy).then(() => {
      const orig = copyBtn.innerHTML;
      copyBtn.innerHTML = `
        <svg class="w-5 h-5 accent-text" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    if (optimizedPromptOutput) optimizedPromptOutput.value = '';
    if (optimizedContentWrapper) optimizedContentWrapper.classList.add('hidden');
    if (toggleOptimizedBtn) toggleOptimizedBtn.querySelector('span').textContent = 'Mostrar';
    if (optimizeScopeMenu) optimizeScopeMenu.classList.add('hidden');
    updateStats('', true);
    updateStats('', false);
    optRecommendation.classList.add('hidden');
    renderModelComparisonCards();
  });
});
