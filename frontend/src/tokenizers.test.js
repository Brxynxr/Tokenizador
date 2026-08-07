import { describe, it, expect, vi, beforeEach } from 'vitest';
import { countTokens, getModelTokenizerInfo, getSupportedModels, isApproximation } from './tokenizers.js';

vi.mock('js-tiktoken', () => ({
  getEncoding: vi.fn((name) => ({
    encode: vi.fn((text) => {
      if (name === 'o200k_base') return new Array(Math.ceil(text.length / 3.5)).fill(1);
      if (name === 'cl100k_base') return new Array(Math.ceil(text.length / 4)).fill(1);
      return new Array(Math.ceil(text.length / 4)).fill(1);
    }),
  })),
}));

vi.mock('@huggingface/tokenizers', () => ({
  AutoTokenizer: {
    from_pretrained: vi.fn().mockResolvedValue({
      encode: vi.fn((text) => ({ length: Math.ceil(text.length / 3.8) })),
    }),
  },
}));

describe('tokenizers.js', () => {
  const TEST_TEXT = 'Hola mundo, esto es una prueba de tokenización.';

  describe('countTokens', () => {
    it('returns 0 for empty string', async () => {
      expect(await countTokens('', 'gpt-4o')).toBe(0);
      expect(await countTokens('   ', 'gpt-4o')).toBe(0);
    });

    it('returns positive count for valid text with gpt-4o (o200k_base)', async () => {
      const count = await countTokens(TEST_TEXT, 'gpt-4o');
      expect(count).toBeGreaterThan(0);
    });

    it('returns positive count for valid text with gpt-4 (cl100k_base)', async () => {
      const count = await countTokens(TEST_TEXT, 'gpt-4');
      expect(count).toBeGreaterThan(0);
    });

    it('returns positive count for claude-3-5 (approximation)', async () => {
      const count = await countTokens(TEST_TEXT, 'claude-3-5');
      expect(count).toBeGreaterThan(0);
    });

    it('returns positive count for llama-3-1 (HF tokenizer)', async () => {
      const count = await countTokens(TEST_TEXT, 'llama-3-1');
      expect(count).toBeGreaterThan(0);
    });

    it('different models produce different token counts for longer text', async () => {
      const longText = 'Esta es una prueba de tokenización con un texto más largo para ver diferencias entre encodings. '.repeat(10);
      const gpt4oCount = await countTokens(longText, 'gpt-4o');
      const gpt4Count = await countTokens(longText, 'gpt-4');
      expect(gpt4oCount).not.toBe(gpt4Count);
    });

    it('unknown model falls back to cl100k_base', async () => {
      const count = await countTokens(TEST_TEXT, 'unknown-model');
      expect(count).toBeGreaterThan(0);
    });
  });

  describe('getModelTokenizerInfo', () => {
    it('returns correct info for gpt-4o', () => {
      const info = getModelTokenizerInfo('gpt-4o');
      expect(info.modelId).toBe('gpt-4o');
      expect(info.encoding).toBe('o200k_base');
      expect(info.isApproximation).toBe(false);
    });

    it('returns correct info for gpt-4', () => {
      const info = getModelTokenizerInfo('gpt-4');
      expect(info.encoding).toBe('cl100k_base');
      expect(info.isApproximation).toBe(false);
    });

    it('returns correct info for claude-3-5 (approximation)', () => {
      const info = getModelTokenizerInfo('claude-3-5');
      expect(info.encoding).toBe('cl100k_base');
      expect(info.isApproximation).toBe(true);
    });

    it('returns correct info for llama-3-1 (approximation with cl100k_base)', () => {
      const info = getModelTokenizerInfo('llama-3-1');
      expect(info.encoding).toBe('cl100k_base');
      expect(info.isApproximation).toBe(true);
    });

    it('returns default for unknown model', () => {
      const info = getModelTokenizerInfo('unknown-model');
      expect(info.encoding).toBe('cl100k_base');
      expect(info.isApproximation).toBe(true);
    });
  });

  describe('getSupportedModels', () => {
    it('returns array with all configured models', () => {
      const models = getSupportedModels();
      expect(models).toContain('gpt-4o');
      expect(models).toContain('gpt-4');
      expect(models).toContain('claude-3-5');
      expect(models).toContain('llama-3-1');
      expect(models).toContain('mistral-large');
      expect(models).toContain('deepseek-v3');
      expect(models.length).toBeGreaterThanOrEqual(10);
    });
  });

  describe('isApproximation', () => {
    it('returns true for approximated models', () => {
      expect(isApproximation('claude-3-5')).toBe(true);
      expect(isApproximation('gemini-1-5-pro')).toBe(true);
      expect(isApproximation('llama-3-1')).toBe(true);
      expect(isApproximation('mistral-large')).toBe(true);
      expect(isApproximation('deepseek-v3')).toBe(true);
    });

    it('returns false for exact models', () => {
      expect(isApproximation('gpt-4o')).toBe(false);
      expect(isApproximation('gpt-4')).toBe(false);
      expect(isApproximation('gpt-3.5-turbo')).toBe(false);
    });
  });
});