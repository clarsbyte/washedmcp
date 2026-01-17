"""
Tree-sitter based code parser for extracting functions from multiple languages.
Supports: Python, JavaScript, TypeScript, JSX, TSX

Extracts:
- Functions (regular and arrow)
- Classes with methods
- Exported declarations
- React components (function and class-based)
"""

import os
from typing import Optional

import tree_sitter_python as tspython
import tree_sitter_javascript as tsjavascript
import tree_sitter_typescript as tstypescript
from tree_sitter import Language, Parser


# Initialize languages
PY_LANGUAGE = Language(tspython.language())
JS_LANGUAGE = Language(tsjavascript.language())
TS_LANGUAGE = Language(tstypescript.language_typescript())
TSX_LANGUAGE = Language(tstypescript.language_tsx())


# Extension to language mapping
EXTENSION_MAP = {
    ".py": ("python", PY_LANGUAGE),
    ".js": ("javascript", JS_LANGUAGE),
    ".jsx": ("javascript", JS_LANGUAGE),  # JSX uses JS grammar
    ".ts": ("typescript", TS_LANGUAGE),
    ".tsx": ("typescript", TSX_LANGUAGE),
    ".mjs": ("javascript", JS_LANGUAGE),
    ".cjs": ("javascript", JS_LANGUAGE),
}


def get_supported_extensions() -> list[str]:
    """Return list of supported file extensions."""
    return list(EXTENSION_MAP.keys())


def _create_parser(language: Language) -> Parser:
    """Create and configure a tree-sitter parser for given language."""
    parser = Parser(language)
    return parser


# ============== PYTHON EXTRACTION ==============

def _extract_python_function(node, source_code: bytes, file_path: str) -> dict:
    """Extract Python function info."""
    name_node = node.child_by_field_name("name")
    name = name_node.text.decode("utf-8") if name_node else "unknown"

    line_start = node.start_point[0] + 1
    line_end = node.end_point[0] + 1
    code = source_code[node.start_byte:node.end_byte].decode("utf-8")

    return {
        "name": name,
        "code": code,
        "file_path": file_path,
        "line_start": line_start,
        "line_end": line_end,
        "language": "python",
        "kind": "function",
    }


def _extract_python_class(node, source_code: bytes, file_path: str) -> list[dict]:
    """Extract Python class and its methods."""
    results = []

    name_node = node.child_by_field_name("name")
    class_name = name_node.text.decode("utf-8") if name_node else "unknown"

    line_start = node.start_point[0] + 1
    line_end = node.end_point[0] + 1
    code = source_code[node.start_byte:node.end_byte].decode("utf-8")

    # Add the class itself
    results.append({
        "name": class_name,
        "code": code,
        "file_path": file_path,
        "line_start": line_start,
        "line_end": line_end,
        "language": "python",
        "kind": "class",
    })

    # Extract methods from class body
    body = node.child_by_field_name("body")
    if body:
        for child in body.children:
            if child.type == "function_definition":
                method_name_node = child.child_by_field_name("name")
                method_name = method_name_node.text.decode("utf-8") if method_name_node else "unknown"
                method_code = source_code[child.start_byte:child.end_byte].decode("utf-8")

                results.append({
                    "name": f"{class_name}.{method_name}",
                    "code": method_code,
                    "file_path": file_path,
                    "line_start": child.start_point[0] + 1,
                    "line_end": child.end_point[0] + 1,
                    "language": "python",
                    "kind": "method",
                    "class_name": class_name,
                })

    return results


def _find_python_entities(node, source_code: bytes, file_path: str) -> list[dict]:
    """Find all Python functions and classes."""
    entities = []

    if node.type == "function_definition":
        entities.append(_extract_python_function(node, source_code, file_path))
    elif node.type == "class_definition":
        entities.extend(_extract_python_class(node, source_code, file_path))

    for child in node.children:
        entities.extend(_find_python_entities(child, source_code, file_path))

    return entities


# ============== JAVASCRIPT/TYPESCRIPT EXTRACTION ==============

def _get_js_function_name(node, source_code: bytes) -> str:
    """Extract function name from various JS function types."""
    name_node = node.child_by_field_name("name")
    if name_node:
        return name_node.text.decode("utf-8")
    return "anonymous"


def _extract_js_function(node, source_code: bytes, file_path: str, lang: str, kind: str = "function") -> dict:
    """Extract JS/TS function info."""
    name = _get_js_function_name(node, source_code)

    line_start = node.start_point[0] + 1
    line_end = node.end_point[0] + 1
    code = source_code[node.start_byte:node.end_byte].decode("utf-8")

    return {
        "name": name,
        "code": code,
        "file_path": file_path,
        "line_start": line_start,
        "line_end": line_end,
        "language": lang,
        "kind": kind,
    }


def _extract_js_arrow_function(node, source_code: bytes, file_path: str, lang: str, var_name: str = None) -> dict:
    """Extract arrow function info."""
    name = var_name or "anonymous_arrow"

    line_start = node.start_point[0] + 1
    line_end = node.end_point[0] + 1
    code = source_code[node.start_byte:node.end_byte].decode("utf-8")

    return {
        "name": name,
        "code": code,
        "file_path": file_path,
        "line_start": line_start,
        "line_end": line_end,
        "language": lang,
        "kind": "arrow_function",
    }


def _extract_js_class(node, source_code: bytes, file_path: str, lang: str) -> list[dict]:
    """Extract JS/TS class and its methods."""
    results = []

    name_node = node.child_by_field_name("name")
    class_name = name_node.text.decode("utf-8") if name_node else "unknown"

    line_start = node.start_point[0] + 1
    line_end = node.end_point[0] + 1
    code = source_code[node.start_byte:node.end_byte].decode("utf-8")

    # Add the class itself
    results.append({
        "name": class_name,
        "code": code,
        "file_path": file_path,
        "line_start": line_start,
        "line_end": line_end,
        "language": lang,
        "kind": "class",
    })

    # Extract methods from class body
    body = node.child_by_field_name("body")
    if body:
        for child in body.children:
            if child.type in ("method_definition", "public_field_definition"):
                method_name_node = child.child_by_field_name("name")
                method_name = method_name_node.text.decode("utf-8") if method_name_node else "unknown"
                method_code = source_code[child.start_byte:child.end_byte].decode("utf-8")

                results.append({
                    "name": f"{class_name}.{method_name}",
                    "code": method_code,
                    "file_path": file_path,
                    "line_start": child.start_point[0] + 1,
                    "line_end": child.end_point[0] + 1,
                    "language": lang,
                    "kind": "method",
                    "class_name": class_name,
                })

    return results


def _find_js_entities(node, source_code: bytes, file_path: str, lang: str, parent_context: dict = None) -> list[dict]:
    """Find all JS/TS functions, classes, and exports."""
    entities = []
    context = parent_context or {}

    # Function declarations
    if node.type == "function_declaration":
        entities.append(_extract_js_function(node, source_code, file_path, lang))

    # Arrow functions (usually in variable declarations)
    elif node.type == "arrow_function":
        var_name = context.get("var_name")
        entities.append(_extract_js_arrow_function(node, source_code, file_path, lang, var_name))

    # Variable declarations with arrow functions
    elif node.type == "lexical_declaration" or node.type == "variable_declaration":
        for child in node.children:
            if child.type == "variable_declarator":
                name_node = child.child_by_field_name("name")
                value_node = child.child_by_field_name("value")

                var_name = name_node.text.decode("utf-8") if name_node else None

                if value_node and value_node.type == "arrow_function":
                    # Include full declaration, not just arrow function
                    code = source_code[node.start_byte:node.end_byte].decode("utf-8")
                    entities.append({
                        "name": var_name or "anonymous",
                        "code": code,
                        "file_path": file_path,
                        "line_start": node.start_point[0] + 1,
                        "line_end": node.end_point[0] + 1,
                        "language": lang,
                        "kind": "arrow_function",
                    })
                elif value_node and value_node.type == "function":
                    code = source_code[node.start_byte:node.end_byte].decode("utf-8")
                    entities.append({
                        "name": var_name or "anonymous",
                        "code": code,
                        "file_path": file_path,
                        "line_start": node.start_point[0] + 1,
                        "line_end": node.end_point[0] + 1,
                        "language": lang,
                        "kind": "function",
                    })

    # Class declarations
    elif node.type == "class_declaration":
        entities.extend(_extract_js_class(node, source_code, file_path, lang))

    # Export statements - capture the exported item
    elif node.type == "export_statement":
        # Get the declaration inside export
        declaration = node.child_by_field_name("declaration")
        if declaration:
            if declaration.type == "function_declaration":
                func = _extract_js_function(declaration, source_code, file_path, lang)
                func["exported"] = True
                # Include export keyword in code
                func["code"] = source_code[node.start_byte:node.end_byte].decode("utf-8")
                entities.append(func)
            elif declaration.type == "class_declaration":
                class_entities = _extract_js_class(declaration, source_code, file_path, lang)
                for e in class_entities:
                    e["exported"] = True
                    if e["kind"] == "class":
                        e["code"] = source_code[node.start_byte:node.end_byte].decode("utf-8")
                entities.extend(class_entities)
            elif declaration.type in ("lexical_declaration", "variable_declaration"):
                # Export const/let/var
                for child in declaration.children:
                    if child.type == "variable_declarator":
                        name_node = child.child_by_field_name("name")
                        value_node = child.child_by_field_name("value")
                        var_name = name_node.text.decode("utf-8") if name_node else None

                        if value_node and value_node.type == "arrow_function":
                            code = source_code[node.start_byte:node.end_byte].decode("utf-8")
                            entities.append({
                                "name": var_name or "anonymous",
                                "code": code,
                                "file_path": file_path,
                                "line_start": node.start_point[0] + 1,
                                "line_end": node.end_point[0] + 1,
                                "language": lang,
                                "kind": "arrow_function",
                                "exported": True,
                            })
                        elif value_node and value_node.type == "function":
                            code = source_code[node.start_byte:node.end_byte].decode("utf-8")
                            entities.append({
                                "name": var_name or "anonymous",
                                "code": code,
                                "file_path": file_path,
                                "line_start": node.start_point[0] + 1,
                                "line_end": node.end_point[0] + 1,
                                "language": lang,
                                "kind": "function",
                                "exported": True,
                            })
        # Check for default export (only if no declaration field was found)
        if not declaration:
            for child in node.children:
                if child.type == "function_declaration":
                    func = _extract_js_function(child, source_code, file_path, lang)
                    func["exported"] = True
                    func["default_export"] = True
                    entities.append(func)
                elif child.type == "class_declaration":
                    class_entities = _extract_js_class(child, source_code, file_path, lang)
                    for e in class_entities:
                        e["exported"] = True
                        e["default_export"] = True
                    entities.extend(class_entities)

    # TypeScript-specific: interface declarations
    elif node.type == "interface_declaration":
        name_node = node.child_by_field_name("name")
        name = name_node.text.decode("utf-8") if name_node else "unknown"
        code = source_code[node.start_byte:node.end_byte].decode("utf-8")

        entities.append({
            "name": name,
            "code": code,
            "file_path": file_path,
            "line_start": node.start_point[0] + 1,
            "line_end": node.end_point[0] + 1,
            "language": lang,
            "kind": "interface",
        })

    # TypeScript-specific: type alias
    elif node.type == "type_alias_declaration":
        name_node = node.child_by_field_name("name")
        name = name_node.text.decode("utf-8") if name_node else "unknown"
        code = source_code[node.start_byte:node.end_byte].decode("utf-8")

        entities.append({
            "name": name,
            "code": code,
            "file_path": file_path,
            "line_start": node.start_point[0] + 1,
            "line_end": node.end_point[0] + 1,
            "language": lang,
            "kind": "type",
        })

    # Recurse (but skip already-processed nodes)
    if node.type not in ("function_declaration", "class_declaration", "export_statement",
                         "interface_declaration", "type_alias_declaration",
                         "lexical_declaration", "variable_declaration"):
        for child in node.children:
            entities.extend(_find_js_entities(child, source_code, file_path, lang))

    return entities


# ============== MAIN EXTRACTION ==============

def extract_functions(file_path: str) -> list[dict]:
    """
    Extract all functions, classes, and methods from a source file.

    Supports: Python, JavaScript, TypeScript, JSX, TSX

    Extracts:
    - Functions (regular and arrow)
    - Classes with methods
    - Exported declarations
    - TypeScript interfaces and types
    - React components

    Args:
        file_path: Path to the source file to parse.

    Returns:
        List of dictionaries containing:
        - name: Entity name (Class.method for methods)
        - code: Full source code
        - file_path: Absolute path to the file
        - line_start: Starting line number (1-based)
        - line_end: Ending line number (1-based)
        - language: Programming language
        - kind: "function", "arrow_function", "class", "method", "interface", "type"

    Returns empty list if file cannot be parsed or unsupported.
    """
    try:
        _, ext = os.path.splitext(file_path)
        if ext not in EXTENSION_MAP:
            return []

        lang_name, language = EXTENSION_MAP[ext]
        abs_path = os.path.abspath(file_path)

        with open(abs_path, "rb") as f:
            source_code = f.read()

        parser = _create_parser(language)
        tree = parser.parse(source_code)

        if lang_name == "python":
            return _find_python_entities(tree.root_node, source_code, abs_path)
        else:
            return _find_js_entities(tree.root_node, source_code, abs_path, lang_name)

    except (OSError, IOError, UnicodeDecodeError):
        return []
    except Exception:
        return []


if __name__ == "__main__":
    import json
    import sys

    if len(sys.argv) > 1:
        test_file = sys.argv[1]
    else:
        test_file = "/Users/pratham/Wash/washedmcp/tests/test_codebase/utils.py"

    results = extract_functions(test_file)
    print(f"Found {len(results)} entities in {test_file}:\n")

    for r in results:
        print(f"  [{r['kind']}] {r['name']} (lines {r['line_start']}-{r['line_end']})")

    if results:
        print(f"\nFirst entity code preview:")
        print(results[0]['code'][:200] + "..." if len(results[0]['code']) > 200 else results[0]['code'])
