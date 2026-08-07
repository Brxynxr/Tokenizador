import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


class TestAnalyzeEndpoint:
    def test_analyze_success(self):
        response = client.post(
            "/api/analyze",
            json={
                "text": "Actúa como un desarrollador senior y explica qué es un token en LLMs.",
                "source_lang": "es",
                "target_lang": "en",
                "model_name": "gpt-4o",
            },
        )
        assert response.status_code == 200
        data = response.json()
        assert "original_text" in data
        assert "translated_text" in data
        assert "input_tokens" in data
        assert "translated_tokens" in data
        assert "difference" in data
        assert "efficient_language" in data
        assert "recommendation" in data
        assert "model_used" in data
        assert "model_token_breakdown" in data
        assert "disclaimer" in data

    def test_analyze_empty_text_returns_422(self):
        response = client.post("/api/analyze", json={"text": "", "model_name": "gpt-4o"})
        assert response.status_code == 422

    def test_analyze_whitespace_only_returns_422(self):
        response = client.post("/api/analyze", json={"text": "   \n\t  ", "model_name": "gpt-4o"})
        assert response.status_code == 422

    def test_analyze_same_source_target_lang_returns_422(self):
        response = client.post(
            "/api/analyze",
            json={"text": "Hola mundo", "source_lang": "es", "target_lang": "es", "model_name": "gpt-4o"},
        )
        assert response.status_code == 422

    def test_analyze_invalid_source_lang_returns_422(self):
        response = client.post(
            "/api/analyze",
            json={"text": "Hola", "source_lang": "invalid", "target_lang": "en", "model_name": "gpt-4o"},
        )
        assert response.status_code == 422

    def test_analyze_invalid_target_lang_returns_422(self):
        response = client.post(
            "/api/analyze",
            json={"text": "Hola", "source_lang": "es", "target_lang": "invalid", "model_name": "gpt-4o"},
        )
        assert response.status_code == 422

    def test_analyze_model_token_breakdown_has_all_models(self):
        response = client.post(
            "/api/analyze",
            json={"text": "Test prompt", "source_lang": "es", "target_lang": "en", "model_name": "gpt-4o"},
        )
        data = response.json()
        breakdown = data["model_token_breakdown"]
        model_ids = {item["model_id"] for item in breakdown}
        assert "gpt-4o" in model_ids
        assert "llama-3-1" in model_ids
        assert "mistral-large" in model_ids
        assert "deepseek-v3" in model_ids
        assert "claude-3-5" in model_ids

    def test_analyze_model_breakdown_has_correct_structure(self):
        response = client.post(
            "/api/analyze",
            json={"text": "Test prompt", "source_lang": "es", "target_lang": "en", "model_name": "gpt-4o"},
        )
        data = response.json()
        for item in data["model_token_breakdown"]:
            assert "model_id" in item
            assert "model_name" in item
            assert "tokens" in item
            assert "encoding_used" in item
            assert "is_approximation" in item
            assert isinstance(item["tokens"], int)
            assert isinstance(item["is_approximation"], bool)

    def test_analyze_claude_marked_as_approximation(self):
        response = client.post(
            "/api/analyze",
            json={"text": "Test prompt", "source_lang": "es", "target_lang": "en", "model_name": "gpt-4o"},
        )
        data = response.json()
        claude_item = next(item for item in data["model_token_breakdown"] if item["model_id"] == "claude-3-5")
        assert claude_item["is_approximation"] is True
        assert claude_item["encoding_used"] == "cl100k_base"

    def test_analyze_gpt4o_not_approximation(self):
        response = client.post(
            "/api/analyze",
            json={"text": "Test prompt", "source_lang": "es", "target_lang": "en", "model_name": "gpt-4o"},
        )
        data = response.json()
        gpt4o_item = next(item for item in data["model_token_breakdown"] if item["model_id"] == "gpt-4o")
        assert gpt4o_item["is_approximation"] is False
        assert gpt4o_item["encoding_used"] == "o200k_base"

    def test_analyze_disclaimer_present(self):
        response = client.post(
            "/api/analyze",
            json={"text": "Test prompt", "source_lang": "es", "target_lang": "en", "model_name": "gpt-4o"},
        )
        data = response.json()
        assert "disclaimer" in data
        assert "estimados" in data["disclaimer"].lower()
        assert "anthropic" in data["disclaimer"].lower()
        assert "google" in data["disclaimer"].lower()
        assert "meta" in data["disclaimer"].lower()

    def test_analyze_efficiency_recommendation_present(self):
        response = client.post(
            "/api/analyze",
            json={"text": "Test prompt", "source_lang": "es", "target_lang": "en", "model_name": "gpt-4o"},
        )
        data = response.json()
        assert data["recommendation"]
        assert len(data["recommendation"]) > 10
        assert data["efficient_language"] in [
            "Idioma de Entrada (Original)",
            "Idioma Destino (Traducido)",
            "Ambos",
        ]

    def test_analyze_auto_source_lang(self):
        response = client.post(
            "/api/analyze",
            json={"text": "Actúa como experto", "source_lang": "auto", "target_lang": "en", "model_name": "gpt-4o"},
        )
        assert response.status_code == 200

    def test_analyze_long_text(self):
        long_text = "Explica detalladamente cómo funciona un tokenizador. " * 500
        response = client.post(
            "/api/analyze",
            json={"text": long_text, "source_lang": "es", "target_lang": "en", "model_name": "gpt-4o"},
        )
        assert response.status_code == 200
        data = response.json()
        assert data["input_tokens"] > 1000

    def test_root_endpoint(self):
        response = client.get("/")
        assert response.status_code == 200
        assert response.json()["message"] == "API Tokenizador & Traductor Activa"

    def test_models_endpoint(self):
        response = client.get("/api/models")
        assert response.status_code == 200
        data = response.json()
        assert "models" in data
        assert len(data["models"]) >= 10
        for model in data["models"]:
            assert "id" in model
            assert "encoding" in model
            assert "is_approximation" in model