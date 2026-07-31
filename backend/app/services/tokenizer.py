import tiktoken

class TokenizerService:
    @staticmethod
    def count_tokens(text: str, model_name: str = "cl100k_base") -> int:
        try:
            encoding = tiktoken.get_encoding(model_name)
        except Exception:
            encoding = tiktoken.get_encoding("cl100k_base")
        
        tokens = encoding.encode(text)
        return len(tokens)

    @staticmethod
    def get_token_details(text: str, model_name: str = "cl100k_base") -> dict:
        try:
            encoding = tiktoken.get_encoding(model_name)
        except Exception:
            encoding = tiktoken.get_encoding("cl100k_base")
            
        tokens = encoding.encode(text)
        return {
            "count": len(tokens),
            "tokens": tokens[:100]  # First 100 token IDs for preview if needed
        }
