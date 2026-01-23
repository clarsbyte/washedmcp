"""Claude Haiku based code summarizer that generates 1-line descriptions of functions."""

import os
from dotenv import load_dotenv
from anthropic import Anthropic

from .config import get_config
from .logging_config import get_logger

logger = get_logger(__name__)

# Load environment variables from .env file
load_dotenv()

# Lazy client initialization
_client = None


def _get_client() -> Anthropic:
    """Get or create the Anthropic client lazily."""
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            logger.error("ANTHROPIC_API_KEY environment variable is not set")
            raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
        logger.debug("Initializing Anthropic client")
        _client = Anthropic(api_key=api_key)
    return _client


def summarize_function(code: str, function_name: str = None) -> str:
    """
    Summarize a single function's purpose in one line.

    Args:
        code: The function source code to summarize
        function_name: Optional name of the function (not used in prompt but available for context)

    Returns:
        A 1-line summary (max configured chars) of what the function does
    """
    config = get_config()

    try:
        # Use config for model and settings
        prompt = config.summarizer.prompt_template.format(code=code)

        message = _get_client().messages.create(
            model=config.summarizer.model,
            max_tokens=config.summarizer.max_tokens,
            messages=[
                {
                    "role": "user",
                    "content": prompt
                }
            ]
        )

        summary = message.content[0].text.strip()

        # Truncate to max length if needed
        max_length = config.summarizer.max_summary_length
        if len(summary) > max_length:
            summary = summary[:max_length - 3] + "..."

        return summary

    except Exception:
        logger.exception("Failed to summarize function")
        return config.summarizer.fallback_message


def summarize_batch(functions: list[dict]) -> list[str]:
    """
    Summarize multiple functions.

    Args:
        functions: List of dictionaries with "code" and optional "name" keys

    Returns:
        List of 1-line summaries corresponding to each input function
    """
    logger.info("Summarizing %d functions", len(functions))
    summaries = []

    for func in functions:
        code = func.get("code", "")
        name = func.get("name")

        summary = summarize_function(code, function_name=name)
        summaries.append(summary)

    return summaries


if __name__ == "__main__":
    # Test with a simple palindrome check function
    test_code = "def check_reverse(s): return s == s[::-1]"

    print("Testing summarize_function:")
    print(f"Code: {test_code}")
    print(f"Summary: {summarize_function(test_code)}")
