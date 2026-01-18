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

    # Build output
    lines = ["results"]

    # Header row
    headers = [columns[i][1].ljust(col_widths[i]) for i in range(len(columns))]
    lines.append("  " + " | ".join(headers))

    # Data rows
    for row in rows:
        cells = [row[i].ljust(col_widths[i]) for i in range(len(columns))]
        lines.append("  " + " | ".join(cells))

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


def format_results_rich(results: list[dict], context: dict = None) -> str:
    """
    Format search results with rich context (calls, callers, same file).

    Args:
        results: List of search result dicts
        context: Optional context dict from get_function_context() with keys:
            - function: The main function dict
            - callees: Functions this one calls
            - callers: Functions that call this one
            - same_file: Other functions in the same file

    Returns:
        Rich formatted string for display
    """
    if not results:
        return "No results found."

    lines = []
    best = results[0]

    # Format the best match header
    func_name = best.get("function_name", "unknown")
    file_path = best.get("file_path", "unknown")
    line_start = best.get("line_start", 0)
    similarity = best.get("similarity", 0.0)
    similarity_pct = int(similarity * 100)

    lines.append(f"FOUND: {func_name}() in {file_path}:{line_start} ({similarity_pct}% match)")
    lines.append("")

    # Show the code if available
    code = best.get("code", best.get("body", ""))
    if code:
        lines.append("CODE:")
        code_lines = code.strip().split("\n")
        # Truncate to ~20 lines if too long
        if len(code_lines) > 20:
            code_lines = code_lines[:20]
            code_lines.append("  ... (truncated)")
        for code_line in code_lines:
            lines.append(f"  {code_line}")
        lines.append("")

    # Show context relationships if provided
    if context:
        # CALLS: functions this one calls
        callees = context.get("callees", [])
        if callees:
            callee_names = [f.get("function_name", "unknown") for f in callees]
            lines.append(f"CALLS: {', '.join(callee_names)}")

        # CALLED BY: functions that call this one
        callers = context.get("callers", [])
        if callers:
            caller_names = [f.get("function_name", "unknown") for f in callers]
            lines.append(f"CALLED BY: {', '.join(caller_names)}")

        # SAME FILE: other functions in the same file
        same_file = context.get("same_file", [])
        if same_file:
            same_file_names = [f.get("function_name", "unknown") for f in same_file]
            lines.append(f"SAME FILE: {', '.join(same_file_names)}")

        if callees or callers or same_file:
            lines.append("")

    # Show additional matches if there are more results
    if len(results) > 1:
        lines.append("---")
        lines.append("Additional matches:")
        for result in results[1:]:
            r_file = result.get("file_path", "unknown")
            r_line = result.get("line_start", 0)
            r_sim = int(result.get("similarity", 0.0) * 100)
            lines.append(f"  {r_file}:{r_line} ({r_sim}%)")

    return "\n".join(lines)


def format_results(results: list[dict], format: str = "toon", context: dict = None) -> str:
    """
    Format search results in the specified format.

    Args:
        results: list of search result dictionaries
        format: "toon", "json", or "rich"
        context: Optional context dict for rich format (from get_function_context())

    Returns:
        Formatted string
    """
    if format == "toon":
        return format_results_toon(results)
    elif format == "json":
        return format_results_json(results)
    elif format == "rich":
        return format_results_rich(results, context)
    else:
        raise ValueError(f"Unknown format: {format}. Use 'toon', 'json', or 'rich'.")


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
