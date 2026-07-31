from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional

from app.services.tokenizer import TokenizerService
from app.services.translator import TranslatorService

app = FastAPI(title="Tokenizador & Traductor API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalyzeRequest(BaseModel):
    text: str
    source_lang: Optional[str] = "auto"
    target_lang: Optional[str] = "en"
    model_name: Optional[str] = "cl100k_base"

@app.get("/")
def read_root():
    return {"message": "API Tokenizador & Traductor Activa"}

@app.post("/api/analyze")
def analyze_prompt(payload: AnalyzeRequest):
    if not payload.text or not payload.text.strip():
        raise HTTPException(status_code=400, detail="El texto del prompt no puede estar vacío.")
    
    text = payload.text
    
    # 1. Translate text
    translated_text = TranslatorService.translate_text(
        text, 
        source_lang=payload.source_lang, 
        target_lang=payload.target_lang
    )
    
    # 2. Count tokens for input and translation
    input_tokens = TokenizerService.count_tokens(text, payload.model_name)
    translated_tokens = TokenizerService.count_tokens(translated_text, payload.model_name)
    
    # 3. Efficiency comparison
    diff = input_tokens - translated_tokens
    if input_tokens < translated_tokens:
        efficient_lang = "Idioma de Entrada (Original)"
        diff_abs = translated_tokens - input_tokens
        recommendation = f"El idioma original es más eficiente porque consume {diff_abs} tokens menos que la traducción al inglés."
    elif translated_tokens < input_tokens:
        efficient_lang = "Inglés (Traducido)"
        diff_abs = input_tokens - translated_tokens
        recommendation = f"El inglés es más eficiente porque consume {diff_abs} tokens menos que el texto original (típicamente debido a la optimización del tokenizador para inglés)."
    else:
        efficient_lang = "Ambos"
        recommendation = "Ambas versiones consumen exactamente la misma cantidad de tokens."

    return {
        "original_text": text,
        "translated_text": translated_text,
        "input_tokens": input_tokens,
        "translated_tokens": translated_tokens,
        "difference": abs(diff),
        "efficient_language": efficient_lang,
        "recommendation": recommendation,
        "model_used": payload.model_name
    }
