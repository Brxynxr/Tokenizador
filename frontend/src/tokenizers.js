import { getEncoding } from "js-tiktoken";

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

function getTiktokenEncoding(encodingName) {
  try {
    return getEncoding(encodingName);
  } catch {
    return getEncoding("cl100k_base");
  }
}

export async function countTokens(text, modelId) {
  if (!text || !text.trim()) return 0;

  const config = MODEL_TOKENIZER_CONFIG[modelId] || DEFAULT_CONFIG;
  const encoding = getTiktokenEncoding(config.encoding);
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