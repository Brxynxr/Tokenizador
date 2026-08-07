import pytest
from app.services.tokenizer import TokenizerService


class TestTokenizerService:
    TEST_TEXT = "Hola mundo, esto es una prueba de tokenización."
    TEST_TEXT_EN = "Hello world, this is a tokenization test."

    def test_count_tokens_basic(self):
        count = TokenizerService.count_tokens(self.TEST_TEXT, "gpt-4o")
        assert isinstance(count, int)
        assert count > 0

    def test_count_tokens_empty_string(self):
        assert TokenizerService.count_tokens("", "gpt-4o") == 0
        assert TokenizerService.count_tokens("   ", "gpt-4o") == 0

    def test_count_tokens_different_models_different_counts(self):
        long_text = "Esta es una prueba de tokenización con un texto más largo para ver diferencias entre encodings. " * 10
        models = ["gpt-4o", "gpt-4"]
        counts = {m: TokenizerService.count_tokens(long_text, m) for m in models}
        assert len(set(counts.values())) > 1, "Models with different encodings should produce different token counts"

    def test_gpt4o_uses_o200k_base(self):
        details = TokenizerService.get_token_details(self.TEST_TEXT, "gpt-4o")
        assert details["encoding_used"] == "o200k_base"
        assert not details["is_approximation"]

    def test_gpt4_uses_cl100k_base(self):
        details = TokenizerService.get_token_details(self.TEST_TEXT, "gpt-4")
        assert details["encoding_used"] == "cl100k_base"
        assert not details["is_approximation"]

    def test_claude_is_approximation(self):
        details = TokenizerService.get_token_details(self.TEST_TEXT, "claude-3-5")
        assert details["encoding_used"] == "cl100k_base"
        assert details["is_approximation"] is True

    def test_gemini_is_approximation(self):
        details = TokenizerService.get_token_details(self.TEST_TEXT, "gemini-1-5-pro")
        assert details["encoding_used"] == "cl100k_base"
        assert details["is_approximation"] is True

    def test_unknown_model_fallbacks_to_cl100k(self):
        details = TokenizerService.get_token_details(self.TEST_TEXT, "unknown-model")
        assert details["encoding_used"] == "cl100k_base"

    def test_get_supported_models(self):
        models = TokenizerService.get_supported_models()
        assert "gpt-4o" in models
        assert "llama-3-1" in models
        assert "mistral-large" in models
        assert "deepseek-v3" in models
        assert len(models) >= 10

    def test_is_approximation(self):
        assert TokenizerService.is_approximation("claude-3-5") is True
        assert TokenizerService.is_approximation("gemini-1-5-pro") is True
        assert TokenizerService.is_approximation("gpt-4o") is False
        assert TokenizerService.is_approximation("llama-3-1") is True
        assert TokenizerService.is_approximation("mistral-large") is True
        assert TokenizerService.is_approximation("deepseek-v3") is True

    def test_token_details_structure(self):
        details = TokenizerService.get_token_details(self.TEST_TEXT, "gpt-4o")
        assert "count" in details
        assert "tokens" in details
        assert "encoding_used" in details
        assert "is_approximation" in details
        assert isinstance(details["tokens"], list)
        assert len(details["tokens"]) <= 100

    def test_english_vs_spanish_token_counts(self):
        es_count = TokenizerService.count_tokens(self.TEST_TEXT, "gpt-4o")
        en_count = TokenizerService.count_tokens(self.TEST_TEXT_EN, "gpt-4o")
        assert es_count != en_count

    def test_special_characters(self):
        special_text = "🎉🚀🤖 Hello! 你好! Привет! 🎊"
        count = TokenizerService.count_tokens(special_text, "gpt-4o")
        assert count > 0

    def test_long_text(self):
        long_text = "Esta es una prueba. " * 1000
        count = TokenizerService.count_tokens(long_text, "gpt-4o")
        assert count > 1000