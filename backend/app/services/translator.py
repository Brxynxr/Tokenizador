import re

from deep_translator import GoogleTranslator

class TranslatorService:
    @staticmethod
    def translate_text(text: str, source_lang: str = "auto", target_lang: str = "en") -> str:
        if not text or not text.strip():
            return ""
        try:
            if source_lang == target_lang:
                return text

            translator = GoogleTranslator(source=source_lang, target=target_lang)
            chunks = TranslatorService._split_text(text)
            translated_chunks = [translator.translate(chunk) or chunk for chunk in chunks]
            return "\n\n".join(translated_chunks).strip() or text
        except Exception as e:
            # Fallback if translation service encounters network/limit issues
            print(f"Translation error: {e}")
            return text

    @staticmethod
    def _split_text(text: str, max_len: int = 450) -> list[str]:
        paragraphs = re.split(r"\n\s*\n", text.strip())
        chunks: list[str] = []

        for paragraph in paragraphs:
            sentences = re.findall(r"[^.!?]+[.!?]*\s*", paragraph) or [paragraph]
            current = ""

            for sentence in sentences:
                if len(current) + len(sentence) > max_len and current:
                    chunks.append(current.strip())
                    current = sentence
                else:
                    current += sentence

            if current.strip():
                chunks.append(current.strip())

        return chunks
