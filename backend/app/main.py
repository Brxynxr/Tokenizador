import os
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field, field_validator
from typing import Optional, List

from app.services.tokenizer import TokenizerService
from app.services.translator import TranslatorService

ALLOWED_ORIGINS = os.getenv("ALLOWED_ORIGINS", "http://localhost:5173").split(",")

app = FastAPI(title="Tokenizador & Traductor API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)


class AnalyzeRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=100000)
    source_lang: Optional[str] = Field(default="auto", pattern="^(auto|es|en|fr|de|it|pt|ja|zh|ru)$")
    target_lang: Optional[str] = Field(default="en", pattern="^(es|en|fr|de|it|pt|ja|zh|ru)$")
    model_name: Optional[str] = Field(default="gpt-4o")

    @field_validator("text")
    @classmethod
    def text_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("El texto del prompt no puede estar vacío.")
        return v.strip()

    @field_validator("target_lang")
    @classmethod
    def target_differs_from_source(cls, v: str, info) -> str:
        source = info.data.get("source_lang")
        if source and source != "auto" and source == v:
            raise ValueError("El idioma de origen y destino deben ser diferentes.")
        return v


class ModelTokenInfo(BaseModel):
    model_id: str
    model_name: str
    tokens: int
    encoding_used: str
    is_approximation: bool


class AnalyzeResponse(BaseModel):
    original_text: str
    translated_text: str
    input_tokens: int
    translated_tokens: int
    difference: int
    efficient_language: str
    recommendation: str
    model_used: str
    model_token_breakdown: List[ModelTokenInfo]
    disclaimer: str


@app.get("/")
def read_root():
    return {"message": "API Tokenizador & Traductor Activa"}


@app.get("/api/models")
def get_supported_models():
    models = TokenizerService.get_supported_models()
    return {
        "models": [
            {
                "id": m,
                "encoding": TokenizerService.MODEL_ENCODINGS.get(m, m),
                "is_approximation": TokenizerService.is_approximation(m),
            }
            for m in models
        ]
    }


@app.post("/api/analyze", response_model=AnalyzeResponse)
def analyze_prompt(payload: AnalyzeRequest):
    text = payload.text

    translated_text = TranslatorService.translate_text(
        text,
        source_lang=payload.source_lang,
        target_lang=payload.target_lang,
    )

    input_tokens = TokenizerService.count_tokens(text, payload.model_name)
    translated_tokens = TokenizerService.count_tokens(translated_text, payload.model_name)

    diff = input_tokens - translated_tokens
    if input_tokens < translated_tokens:
        efficient_lang = "Idioma de Entrada (Original)"
        diff_abs = translated_tokens - input_tokens
        recommendation = f"El idioma original es más eficiente porque consume {diff_abs} tokens menos que la traducción."
    elif translated_tokens < input_tokens:
        efficient_lang = "Idioma Destino (Traducido)"
        diff_abs = input_tokens - translated_tokens
        recommendation = f"El idioma de destino es más eficiente porque consume {diff_abs} tokens menos que el texto original."
    else:
        efficient_lang = "Ambos"
        recommendation = "Ambas versiones consumen exactamente la misma cantidad de tokens."

    model_breakdown = []
    for model_id in TokenizerService.get_supported_models():
        details = TokenizerService.get_token_details(text, model_id)
        model_breakdown.append(
            ModelTokenInfo(
                model_id=model_id,
                model_name=model_id.replace("-", " ").title(),
                tokens=details["count"],
                encoding_used=details["encoding_used"],
                is_approximation=details["is_approximation"],
            )
        )

    disclaimer = (
        "Valores estimados — los tokenizadores de Anthropic (Claude), Google (Gemini) y Meta (Llama) "
        "no son públicos; se aproximan con encodings compatibles de OpenAI (cl100k_base/o200k_base). "
        "Los modelos Llama 3, Mistral y DeepSeek usan sus tokenizadores reales vía HuggingFace."
    )

    return AnalyzeResponse(
        original_text=text,
        translated_text=translated_text,
        input_tokens=input_tokens,
        translated_tokens=translated_tokens,
        difference=abs(diff),
        efficient_language=efficient_lang,
        recommendation=recommendation,
        model_used=payload.model_name,
        model_token_breakdown=model_breakdown,
        disclaimer=disclaimer,
    )