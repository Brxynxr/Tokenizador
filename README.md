# Tokenizador & Traductor Contextual de Prompts

Plataforma modular construida con **Vite**, **JavaScript vainilla** y **js-tiktoken** para el análisis de eficiencia de prompts, traducción contextual y conteo preciso de tokens sin necesidad de APIs de pago ni servidores complejos.

---

## Características Principales

1. **Traducción Contextual Sin APIs de Pago**: Traducción inteligente y contextual entre español (u otros idiomas) e inglés utilizando servicios públicos sin claves de API.
2. **Conteo Preciso de Tokens (`js-tiktoken`)**: Cálculo exacto de tokens utilizados en el idioma de entrada frente al idioma traducido (inglés) utilizando el tokenizador oficial de OpenAI.
3. **Análisis de Eficiencia**: Comparativa automática que determina cuál idioma es más eficiente y por qué (menor consumo de tokens).
4. **Landing Page Interactiva**: Interfaz moderna, elegante y modular.

---

## Estructura del Proyecto

```text
Tokenizador/
├── frontend/
│   ├── src/
│   │   └── main.js          # Lógica principal, tokenización y traducción
│   ├── index.html           # Landing page interactiva
│   ├── package.json         # Dependencias (Vite, js-tiktoken)
│   └── vite.config.js       # Configuración de Vite
└── README.md                # Documentación del proyecto
```

---

## Requisitos Previos

- **Node.js 18+** y npm

---

## Instrucciones para Levantar el Proyecto

1. Entrar en la carpeta del frontend:
   ```bash
   cd frontend
   ```

2. Instalar las dependencias:
   ```bash
   npm install
   ```

3. Iniciar el servidor de desarrollo:
   ```bash
   npm run dev
   ```

El proyecto se abrirá en tu navegador (por defecto en `http://localhost:5173`). Podrás introducir cualquier prompt en español u otro idioma, ver su traducción contextual en inglés, el conteo exacto de tokens de ambos lados, y la recomendación de eficiencia en tiempo real.

---

## Licencia

Proyecto desarrollado bajo arquitectura modular y open-source.
