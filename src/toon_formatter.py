"""
TOON (Token-Optimized Object Notation) formatter for search results.

Formats search results in a compact, token-efficient tabular format.
"""

import json


def truncate(value: str, max_length: int) -> str:
    """Truncate a string to max_length, adding '...' if truncated."""
    if len(value) <= max_length:
        return value
    return value[:max_length - 3] + "..."


def format_results_toon(results: list[dict]) -> str:
    """
    Format search results in TOON format.

    Input: list of search results with keys:
        - function_name: str
        - file_path: str
        - line_start: int
        - summary: str
        - similarity: float (0.0 to 1.0)

    Output: TOON-formatted string
    """
    if not results:
        return "results\n  (empty)"

    # Define column specs: (key, header, max_width, formatter)
    columns = [
        ("function_name", "function_name", 20, str),
        ("file_path", "file_path", 30, str),
        ("line_start", "line", 6, str),
        ("summary", "summary", 40, str),
        ("similarity", "similarity", 10, lambda x: f"{int(x * 100)}%"),
    ]

    # Process data rows
    rows = []
    for result in results:
        row = []
        for key, _, max_width, formatter in columns:
            value = result.get(key, "")
            formatted = formatter(value) if value != "" else ""
            truncated = truncate(formatted, max_width)
            row.append(truncated)
        rows.append(row)

    # Calculate column widths (max of header and all data)
    col_widths = []
    for i, (_, header, max_width, _) in enumerate(columns):
        data_max = max((len(rows[j][i]) for j in range(len(rows))), default=0)
        col_widths.append(max(len(header), data_max))

    # Build output with instruction
    lines = [
        "FOUND. Read these files directly (do not search again):",
        ""
    ]

    # Header row
    headers = [columns[i][1].ljust(col_widths[i]) for i in range(len(columns))]
    lines.append("  " + " | ".join(headers))

    # Data rows
    for row in rows:
        cells = [row[i].ljust(col_widths[i]) for i in range(len(columns))]
        lines.append("  " + " | ".join(cells))

    # Add best match prominently
    if results:
        best = results[0]
        lines.append("")
        lines.append(f"BEST MATCH: {best['file_path']}:{best['line_start']}")

    return "\n".join(lines)


def format_results_json(results: list[dict]) -> str:
    """
    Format search results as JSON.

    Input: list of search results with keys:
        - function_name: str
        - file_path: str
        - line_start: int
        - summary: str
        - similarity: float

    Output: JSON-formatted string
    """
    return json.dumps(results, indent=2)


def format_results(results: list[dict], format: str = "toon") -> str:
    """
    Format search results in the specified format.

    Args:
        results: list of search result dictionaries
        format: "toon" or "json"

    Returns:
        Formatted string
    """
    if format == "toon":
        return format_results_toon(results)
    elif format == "json":
        return format_results_json(results)
    else:
        raise ValueError(f"Unknown format: {format}. Use 'toon' or 'json'.")


if __name__ == "__main__":
    # Create fake results for demonstration
    fake_results = [
        {
            "function_name": "check_reverse",
            "file_path": "src/utils.py",
            "line_start": 1,
            "summary": "checks if string is palindrome",
            "similarity": 0.92,
        },
        {
            "function_name": "validate_email",
            "file_path": "src/auth.py",
            "line_start": 5,
            "summary": "validates email format using regex",
            "similarity": 0.87,
        },
        {
            "function_name": "parse_config_file",
            "file_path": "src/config/settings_loader.py",
            "line_start": 42,
            "summary": "parses YAML or JSON configuration files and returns dict",
            "similarity": 0.75,
        },
        {
            "function_name": "connect_to_database",
            "file_path": "src/database/connection_manager.py",
            "line_start": 128,
            "summary": "establishes connection to PostgreSQL or MySQL database",
            "similarity": 0.68,
        },
    ]

    # Format in both formats
    toon_output = format_results(fake_results, format="toon")
    json_output = format_results(fake_results, format="json")

    # Print TOON format
    print("=" * 60)
    print("TOON FORMAT:")
    print("=" * 60)
    print(toon_output)
    print()

    # Print JSON format
    print("=" * 60)
    print("JSON FORMAT:")
    print("=" * 60)
    print(json_output)
    print()

    # Token count comparison
    toon_tokens = len(toon_output)
    json_tokens = len(json_output)
    savings = ((json_tokens - toon_tokens) / json_tokens) * 100

    print("=" * 60)
    print("TOKEN COUNT COMPARISON (character count as proxy):")
    print("=" * 60)
    print(f"TOON format: {toon_tokens} characters")
    print(f"JSON format: {json_tokens} characters")
    print(f"Savings: {savings:.1f}% fewer characters with TOON")
