import { Tiktoken } from "js-tiktoken/lite";

const MODEL_TOKENIZER_CONFIG = {
  "gpt-4o": { encoding: "o200k_base", approx: false },
  "gpt-4o-mini": { encoding: "o200k_base", approx: false },
  "gpt-4": { encoding: "cl100k_base", approx: false },
  "gpt-3.5-turbo": { encoding: "cl100k_base", approx: false },
  "claude-3-5": { encoding: "cl100k_base", approx: true },
  "claude-3-5-haiku": { encoding: "cl100k_base", approx: true },
  "gemini-1-5-pro": { encoding: "cl100k_base", approx: true },
  "llama-3-1": { encoding: "cl100k_base", approx: true },
  "mistral-large": { encoding: "cl100k_base", approx: true },
  "deepseek-v3": { encoding: "cl100k_base", approx: true },
};

const DEFAULT_CONFIG = { encoding: "cl100k_base", approx: true };

let cl100kEncoder = null;
let o200kEncoder = null;
let cl100kLoading = null;
let o200kLoading = null;

async function ensureCl100kEncoder() {
  if (cl100kEncoder) return cl100kEncoder;
  if (!cl100kLoading) {
    cl100kLoading = (async () => {
      const rank = await import("js-tiktoken/ranks/cl100k_base");
      cl100kEncoder = new Tiktoken(rank.default);
      return cl100kEncoder;
    })();
  }
  return cl100kLoading;
}

async function ensureO200kEncoder() {
  if (o200kEncoder) return o200kEncoder;
  if (!o200kLoading) {
    o200kLoading = (async () => {
      const rank = await import("js-tiktoken/ranks/o200k_base");
      o200kEncoder = new Tiktoken(rank.default);
      return o200kEncoder;
    })();
  }
  return o200kLoading;
}

async function getEncoder(name) {
  if (name === "o200k_base") {
    return ensureO200kEncoder();
  }
  return ensureCl100kEncoder();
}

export async function countTokens(text, modelId) {
  if (!text || !text.trim()) return 0;

  const config = MODEL_TOKENIZER_CONFIG[modelId] || DEFAULT_CONFIG;
  const encoding = await getEncoder(config.encoding);
  return encoding.encode(text).length;
}

export function getModelTokenizerInfo(modelId) {
  const config = MODEL_TOKENIZER_CONFIG[modelId] || DEFAULT_CONFIG;
  return {
    modelId,
    encoding: config.encoding,
    isApproximation: config.approx,
  };
}

export function getSupportedModels() {
  return Object.keys(MODEL_TOKENIZER_CONFIG);
}

export function isApproximation(modelId) {
  const config = MODEL_TOKENIZER_CONFIG[modelId] || DEFAULT_CONFIG;
  return config.approx;
}

// Count tokens using encoding name directly (for stats - input/translated text)
export async function countTokensWithEncoding(text, encodingName) {
  if (!text || !text.trim()) return 0;
  try {
    const encoding = await getEncoder(encodingName);
    return encoding.encode(text).length;
  } catch (e) {
    console.error("Tokenization error:", e);
    return Math.ceil(text.length / 4);
  }
}