# Tokenizador & Traductor Contextual de Prompts

Plataforma modular con **Frontend Vite + JavaScript vanilla** y un **Backend FastAPI** opcional. Sirve para analizar prompts, calcular tokens con precisión, traducir con contexto y comparar eficiencia entre idiomas/modelos.

## Qué Usa Cada Parte

1. **Frontend**: UI, análisis visual, tokenización local con `js-tiktoken`, heurísticas de calidad y fallback de traducción.
2. **Backend**: API `FastAPI` para centralizar traducción y análisis cuando está activo.
3. **Regla de funcionamiento**: el frontend intenta usar el backend primero; si no responde, cae a fallback local.

## Estructura

```text
Tokenizador/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   └── services/
│   │       ├── tokenizer.py
│   │       └── translator.py
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── main.js
│   │   └── style.css
│   ├── index.html
│   ├── package.json
│   └── postcss.config.js
└── README.md
```

## Requisitos

- **Node.js 18+** y npm
- **Python 3.12+**
- Paquete del sistema para venv en Debian/Ubuntu: `python3.12-venv`

## Arranque Recomendado

### 1. Backend

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

### 2. Frontend

En otra terminal:

```bash
cd frontend
npm install
npm run dev
```

## Cómo Funciona

- Si el backend está levantado, el frontend llama a `POST /api/analyze`.
- Ese endpoint traduce el prompt y calcula tokens/recomendación centralizada.
- Si el backend no está disponible, el frontend usa su fallback local:
  - traducción por chunks con MyMemory
  - conteo local con `js-tiktoken`
  - análisis heurístico de calidad

## Notas

- La comparación de modelos es estimada y local.
- Los tokens no dependen del modelo comercial, sino del encoding seleccionado.
- El proyecto no requiere APIs de pago para funcionar.

## Licencia

Open-source.
