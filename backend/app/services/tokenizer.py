import tiktoken
from functools import lru_cache
from typing import Optional

try:
    from tokenizers import Tokenizer as HFTokenizer
    HF_AVAILABLE = True
except ImportError:
    HF_AVAILABLE = False


class TokenizerService:
    MODEL_ENCODINGS = {
        "gpt-4o": "o200k_base",
        "gpt-4o-mini": "o200k_base",
        "gpt-4": "cl100k_base",
        "gpt-3.5-turbo": "cl100k_base",
        "claude-3-5": "cl100k_base",
        "claude-3-5-haiku": "cl100k_base",
        "gemini-1-5-pro": "cl100k_base",
        "llama-3-1": "cl100k_base",
        "mistral-large": "cl100k_base",
        "deepseek-v3": "cl100k_base",
    }

    HF_TOKENIZER_REPOS = {
        "llama3": "meta-llama/Meta-Llama-3-8B",
        "mistral": "mistralai/Mistral-Large-Instruct-2407",
        "deepseek": "deepseek-ai/DeepSeek-V3",
    }

    HF_FALLBACK_ENCODINGS = {
        "llama3": "cl100k_base",
        "mistral": "cl100k_base",
        "deepseek": "cl100k_base",
    }

    APPROXIMATED_MODELS = {
        "claude-3-5",
        "claude-3-5-haiku",
        "gemini-1-5-pro",
        "llama-3-1",
        "mistral-large",
        "deepseek-v3",
    }

    _hf_tokenizers: dict[str, "HFTokenizer"] = {}
    _hf_load_status: dict[str, bool] = {}

    @classmethod
    def _get_tiktoken_encoding(cls, encoding_name: str):
        try:
            return tiktoken.get_encoding(encoding_name)
        except Exception:
            return tiktoken.get_encoding("cl100k_base")

    @classmethod
    def _get_hf_tokenizer(cls, model_key: str) -> Optional["HFTokenizer"]:
        if not HF_AVAILABLE:
            return None
        if model_key in cls._hf_tokenizers:
            return cls._hf_tokenizers[model_key]
        if cls._hf_load_status.get(model_key, False) is False:
            return None
        repo = cls.HF_TOKENIZER_REPOS.get(model_key)
        if not repo:
            return None
        try:
            tokenizer = HFTokenizer.from_pretrained(repo)
            cls._hf_tokenizers[model_key] = tokenizer
            cls._hf_load_status[model_key] = True
            return tokenizer
        except Exception:
            cls._hf_load_status[model_key] = False
            return None

    @classmethod
    def count_tokens(cls, text: str, model_name: str = "cl100k_base") -> int:
        if not text or not text.strip():
            return 0

        encoding_name = cls.MODEL_ENCODINGS.get(model_name, "cl100k_base")

        if encoding_name in cls.HF_TOKENIZER_REPOS:
            hf_tokenizer = cls._get_hf_tokenizer(encoding_name)
            if hf_tokenizer:
                return len(hf_tokenizer.encode(text).ids)

        encoding = cls._get_tiktoken_encoding(encoding_name)
        return len(encoding.encode(text))

    @classmethod
    def get_token_details(cls, text: str, model_name: str = "cl100k_base") -> dict:
        if not text or not text.strip():
            return {"count": 0, "tokens": [], "encoding_used": "cl100k_base", "is_approximation": False}

        encoding_name = cls.MODEL_ENCODINGS.get(model_name, "cl100k_base")
        is_approx = model_name in cls.APPROXIMATED_MODELS

        if encoding_name in cls.HF_TOKENIZER_REPOS:
            hf_tokenizer = cls._get_hf_tokenizer(encoding_name)
            if hf_tokenizer:
                encoded = hf_tokenizer.encode(text)
                return {
                    "count": len(encoded.ids),
                    "tokens": encoded.ids[:100],
                    "encoding_used": f"hf:{encoding_name}",
                    "is_approximation": False,
                }

            fallback_encoding = cls.HF_FALLBACK_ENCODINGS.get(encoding_name, "cl100k_base")
            encoding = cls._get_tiktoken_encoding(fallback_encoding)
            tokens = encoding.encode(text)
            return {
                "count": len(tokens),
                "tokens": tokens[:100],
                "encoding_used": f"{fallback_encoding} (fallback: HF tokenizer unavailable)",
                "is_approximation": True,
            }

        encoding = cls._get_tiktoken_encoding(encoding_name)
        tokens = encoding.encode(text)
        return {
            "count": len(tokens),
            "tokens": tokens[:100],
            "encoding_used": encoding_name,
            "is_approximation": is_approx,
        }

    @classmethod
    def get_supported_models(cls) -> list[str]:
        return list(cls.MODEL_ENCODINGS.keys())

    @classmethod
    def is_approximation(cls, model_name: str) -> bool:
        return model_name in cls.APPROXIMATED_MODELS