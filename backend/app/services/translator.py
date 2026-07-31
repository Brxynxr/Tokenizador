from deep_translator import GoogleTranslator

class TranslatorService:
    @staticmethod
    def translate_text(text: str, source_lang: str = "auto", target_lang: str = "en") -> str:
        if not text or not text.strip():
            return ""
        try:
            # If source is auto, deep-translator auto-detects
            translator = GoogleTranslator(source=source_lang, target=target_lang)
            translated = translator.translate(text)
            return translated if translated else text
        except Exception as e:
            # Fallback if translation service encounters network/limit issues
            print(f"Translation error: {e}")
            return text
