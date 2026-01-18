"""Claude Haiku based code summarizer that generates 1-line descriptions of functions."""

import os
from dotenv import load_dotenv
from anthropic import Anthropic

# Load environment variables from .env file
load_dotenv()

MODEL = "claude-3-haiku-20240307"

# Lazy client initialization
_client = None


def _get_client() -> Anthropic:
    """Get or create the Anthropic client lazily."""
    global _client
    if _client is None:
        api_key = os.getenv("ANTHROPIC_API_KEY")
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is not set")
        _client = Anthropic(api_key=api_key)
    return _client


MAX_SUMMARY_LENGTH = 100

SUMMARIZE_PROMPT = """Summarize what this function does in 10 words or less. Be specific about the action. Just return the summary, nothing else.

Function: {code}"""


def summarize_function(code: str, function_name: str = None) -> str:
    """
    Summarize a single function's purpose in one line.

    Args:
        code: The function source code to summarize
        function_name: Optional name of the function (not used in prompt but available for context)

    Returns:
        A 1-line summary (max 100 chars) of what the function does
    """
    try:
        message = _get_client().messages.create(
            model=MODEL,
            max_tokens=100,
            messages=[
                {
                    "role": "user",
                    "content": SUMMARIZE_PROMPT.format(code=code)
                }
            ]
        )

        summary = message.content[0].text.strip()

        # Truncate to max length if needed
        if len(summary) > MAX_SUMMARY_LENGTH:
            summary = summary[:MAX_SUMMARY_LENGTH - 3] + "..."

        return summary

    except Exception:
        return "Unable to summarize"


def summarize_batch(functions: list[dict]) -> list[str]:
    """
    Summarize multiple functions.

    Args:
        functions: List of dictionaries with "code" and optional "name" keys

    Returns:
        List of 1-line summaries corresponding to each input function
    """
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
