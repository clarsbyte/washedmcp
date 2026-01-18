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


# ============== FUNCTION CALL EXTRACTION ==============

def extract_calls(node, source_code: bytes) -> list[str]:
    """
    Extract all function calls from a function body node.

    Handles JS/TS call patterns:
    - functionName() - direct calls
    - object.method() - method calls (returns "object.method")
    - this.method() - this calls
    - Component() - React component calls

    Also handles Python call patterns:
    - function_name()
    - object.method()
    - self.method()
    - Class.method()

    Args:
        node: The tree-sitter node to traverse (typically a function body)
        source_code: The source code bytes

    Returns:
        List of function/method names being called (deduplicated, preserving order)
    """
    calls = []
    seen = set()

    def _extract_call_name(call_node) -> str | None:
        """Extract the function/method name from a call_expression node."""
        # Get the function being called (first child before arguments)
        func_node = call_node.child_by_field_name("function")

        # Python uses "function" field, JS/TS varies
        if func_node is None:
            # For JS/TS, try to get first child that's not the arguments
            for child in call_node.children:
                if child.type != "arguments" and child.type != "template_string":
                    func_node = child
                    break

        if func_node is None:
            return None

        # Handle different node types
        if func_node.type == "identifier":
            # Direct function call: functionName()
            return func_node.text.decode("utf-8")

        elif func_node.type == "member_expression":
            # Method call: object.method() or this.method()
            return _extract_member_expression(func_node, source_code)

        elif func_node.type == "attribute":
            # Python attribute access: object.method() or self.method()
            return _extract_attribute(func_node, source_code)

        elif func_node.type == "call":
            # Chained call: something().method() - extract the chain
            # Return just the immediate call for simplicity
            return None

        return None

    def _extract_member_expression(node, source_code: bytes) -> str | None:
        """Extract name from JS/TS member_expression (object.property)."""
        obj_node = node.child_by_field_name("object")
        prop_node = node.child_by_field_name("property")

        if obj_node is None or prop_node is None:
            # Fallback: just return full text
            return node.text.decode("utf-8")

        # Handle nested member expressions (a.b.c)
        if obj_node.type == "member_expression":
            obj_name = _extract_member_expression(obj_node, source_code)
        elif obj_node.type in ("identifier", "this"):
            obj_name = obj_node.text.decode("utf-8")
        else:
            obj_name = obj_node.text.decode("utf-8")

        prop_name = prop_node.text.decode("utf-8")

        return f"{obj_name}.{prop_name}"

    def _extract_attribute(node, source_code: bytes) -> str | None:
        """Extract name from Python attribute node (object.attribute)."""
        obj_node = node.child_by_field_name("object")
        attr_node = node.child_by_field_name("attribute")

        if obj_node is None or attr_node is None:
            return node.text.decode("utf-8")

        # Handle nested attributes (a.b.c)
        if obj_node.type == "attribute":
            obj_name = _extract_attribute(obj_node, source_code)
        elif obj_node.type == "identifier":
            obj_name = obj_node.text.decode("utf-8")
        else:
            obj_name = obj_node.text.decode("utf-8")

        attr_name = attr_node.text.decode("utf-8")

        return f"{obj_name}.{attr_name}"

    def _traverse(n):
        """Recursively traverse nodes to find call expressions."""
        # JS/TS: call_expression
        # Python: call
        if n.type in ("call_expression", "call"):
            call_name = _extract_call_name(n)
            if call_name and call_name not in seen:
                seen.add(call_name)
                calls.append(call_name)

        # Recurse into children
        for child in n.children:
            _traverse(child)

    _traverse(node)
    return calls


# ============== PYTHON EXTRACTION ==============

def _extract_python_function(node, source_code: bytes, file_path: str) -> dict:
    """Extract Python function info."""
    name_node = node.child_by_field_name("name")
    name = name_node.text.decode("utf-8") if name_node else "unknown"

    line_start = node.start_point[0] + 1
    line_end = node.end_point[0] + 1
    code = source_code[node.start_byte:node.end_byte].decode("utf-8")

    # Extract function calls from the function body
    body_node = node.child_by_field_name("body")
    calls = extract_calls(body_node, source_code) if body_node else []

    return {
        "name": name,
        "code": code,
        "file_path": file_path,
        "line_start": line_start,
        "line_end": line_end,
        "language": "python",
        "kind": "function",
        "calls": calls,
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

                # Extract function calls from the method body
                method_body = child.child_by_field_name("body")
                method_calls = extract_calls(method_body, source_code) if method_body else []

                results.append({
                    "name": f"{class_name}.{method_name}",
                    "code": method_code,
                    "file_path": file_path,
                    "line_start": child.start_point[0] + 1,
                    "line_end": child.end_point[0] + 1,
                    "language": "python",
                    "kind": "method",
                    "class_name": class_name,
                    "calls": method_calls,
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

    # Extract function calls from the function body
    body_node = node.child_by_field_name("body")
    calls = extract_calls(body_node, source_code) if body_node else []

    return {
        "name": name,
        "code": code,
        "file_path": file_path,
        "line_start": line_start,
        "line_end": line_end,
        "language": lang,
        "kind": kind,
        "calls": calls,
    }


def _extract_js_arrow_function(node, source_code: bytes, file_path: str, lang: str, var_name: str = None) -> dict:
    """Extract arrow function info."""
    name = var_name or "anonymous_arrow"

    line_start = node.start_point[0] + 1
    line_end = node.end_point[0] + 1
    code = source_code[node.start_byte:node.end_byte].decode("utf-8")

    # Extract function calls from the arrow function body
    body_node = node.child_by_field_name("body")
    calls = extract_calls(body_node, source_code) if body_node else []

    return {
        "name": name,
        "code": code,
        "file_path": file_path,
        "line_start": line_start,
        "line_end": line_end,
        "language": lang,
        "kind": "arrow_function",
        "calls": calls,
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

                # Extract function calls from the method body
                method_body = child.child_by_field_name("body")
                method_calls = extract_calls(method_body, source_code) if method_body else []

                results.append({
                    "name": f"{class_name}.{method_name}",
                    "code": method_code,
                    "file_path": file_path,
                    "line_start": child.start_point[0] + 1,
                    "line_end": child.end_point[0] + 1,
                    "language": lang,
                    "kind": "method",
                    "class_name": class_name,
                    "calls": method_calls,
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
                    # Extract calls from arrow function body
                    arrow_body = value_node.child_by_field_name("body")
                    calls = extract_calls(arrow_body, source_code) if arrow_body else []
                    entities.append({
                        "name": var_name or "anonymous",
                        "code": code,
                        "file_path": file_path,
                        "line_start": node.start_point[0] + 1,
                        "line_end": node.end_point[0] + 1,
                        "language": lang,
                        "kind": "arrow_function",
                        "calls": calls,
                    })
                elif value_node and value_node.type == "function":
                    code = source_code[node.start_byte:node.end_byte].decode("utf-8")
                    # Extract calls from function body
                    func_body = value_node.child_by_field_name("body")
                    calls = extract_calls(func_body, source_code) if func_body else []
                    entities.append({
                        "name": var_name or "anonymous",
                        "code": code,
                        "file_path": file_path,
                        "line_start": node.start_point[0] + 1,
                        "line_end": node.end_point[0] + 1,
                        "language": lang,
                        "kind": "function",
                        "calls": calls,
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
                            # Extract calls from arrow function body
                            arrow_body = value_node.child_by_field_name("body")
                            calls = extract_calls(arrow_body, source_code) if arrow_body else []
                            entities.append({
                                "name": var_name or "anonymous",
                                "code": code,
                                "file_path": file_path,
                                "line_start": node.start_point[0] + 1,
                                "line_end": node.end_point[0] + 1,
                                "language": lang,
                                "kind": "arrow_function",
                                "exported": True,
                                "calls": calls,
                            })
                        elif value_node and value_node.type == "function":
                            code = source_code[node.start_byte:node.end_byte].decode("utf-8")
                            # Extract calls from function body
                            func_body = value_node.child_by_field_name("body")
                            calls = extract_calls(func_body, source_code) if func_body else []
                            entities.append({
                                "name": var_name or "anonymous",
                                "code": code,
                                "file_path": file_path,
                                "line_start": node.start_point[0] + 1,
                                "line_end": node.end_point[0] + 1,
                                "language": lang,
                                "kind": "function",
                                "exported": True,
                                "calls": calls,
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


# ============== IMPORT/EXPORT EXTRACTION (JS/TS) ==============

def _is_local_import(module_path: str) -> bool:
    """Determine if an import is local (relative path) or external (npm package)."""
    return module_path.startswith(".") or module_path.startswith("/")


def _get_import_type(module_path: str) -> str:
    """Return 'local' for relative imports, 'external' for npm packages."""
    return "local" if _is_local_import(module_path) else "external"


def extract_imports(tree, source_code: bytes, file_path: str) -> list[dict]:
    """
    Extract all import and require statements from a JavaScript/TypeScript file.

    Handles:
    - ES6 imports: `import X from 'y'`, `import { A, B } from 'y'`
    - CommonJS requires: `const X = require('y')`
    - Dynamic imports: `import('y')`

    Args:
        tree: The tree-sitter parse tree.
        source_code: The source code as bytes.
        file_path: Path to the source file (for context).

    Returns:
        List of dictionaries containing:
        - name: The imported identifier name
        - from: The module path/package name
        - type: "local" (relative path) or "external" (npm package)
    """
    imports = []

    def _extract_import_specifiers(node, module_path: str) -> list[dict]:
        """Extract individual import specifiers from an import statement."""
        results = []
        import_type = _get_import_type(module_path)

        for child in node.children:
            # Default import: import X from 'y'
            if child.type == "identifier":
                results.append({
                    "name": child.text.decode("utf-8"),
                    "from": module_path,
                    "type": import_type,
                })
            # Named imports: import { A, B } from 'y'
            elif child.type == "named_imports":
                for spec in child.children:
                    if spec.type == "import_specifier":
                        # Handle aliased imports: import { A as B } from 'y'
                        name_node = spec.child_by_field_name("name")
                        alias_node = spec.child_by_field_name("alias")
                        if alias_node:
                            name = alias_node.text.decode("utf-8")
                        elif name_node:
                            name = name_node.text.decode("utf-8")
                        else:
                            continue
                        results.append({
                            "name": name,
                            "from": module_path,
                            "type": import_type,
                        })
            # Namespace import: import * as X from 'y'
            elif child.type == "namespace_import":
                for sub in child.children:
                    if sub.type == "identifier":
                        results.append({
                            "name": sub.text.decode("utf-8"),
                            "from": module_path,
                            "type": import_type,
                        })
                        break
            # Import clause that contains nested elements
            elif child.type == "import_clause":
                results.extend(_extract_import_specifiers(child, module_path))

        return results

    def _find_imports(node):
        """Recursively find all import statements."""
        # ES6 import statement
        if node.type == "import_statement":
            source_node = node.child_by_field_name("source")
            if source_node:
                # Remove quotes from module path
                module_path = source_node.text.decode("utf-8").strip("'\"")
                imports.extend(_extract_import_specifiers(node, module_path))

        # CommonJS require: const X = require('y')
        elif node.type in ("lexical_declaration", "variable_declaration"):
            for child in node.children:
                if child.type == "variable_declarator":
                    name_node = child.child_by_field_name("name")
                    value_node = child.child_by_field_name("value")

                    if value_node and value_node.type == "call_expression":
                        func_node = value_node.child_by_field_name("function")
                        args_node = value_node.child_by_field_name("arguments")

                        if func_node and func_node.text.decode("utf-8") == "require":
                            if args_node:
                                for arg in args_node.children:
                                    if arg.type == "string":
                                        module_path = arg.text.decode("utf-8").strip("'\"")
                                        var_name = None

                                        # Handle destructuring: const { A, B } = require('y')
                                        if name_node and name_node.type == "object_pattern":
                                            for prop in name_node.children:
                                                if prop.type == "shorthand_property_identifier_pattern":
                                                    imports.append({
                                                        "name": prop.text.decode("utf-8"),
                                                        "from": module_path,
                                                        "type": _get_import_type(module_path),
                                                    })
                                                elif prop.type == "pair_pattern":
                                                    key_node = prop.child_by_field_name("key")
                                                    val_node = prop.child_by_field_name("value")
                                                    if val_node:
                                                        imports.append({
                                                            "name": val_node.text.decode("utf-8"),
                                                            "from": module_path,
                                                            "type": _get_import_type(module_path),
                                                        })
                                        elif name_node:
                                            var_name = name_node.text.decode("utf-8")
                                            imports.append({
                                                "name": var_name,
                                                "from": module_path,
                                                "type": _get_import_type(module_path),
                                            })
                                        break

        # Recurse into children
        for child in node.children:
            _find_imports(child)

    _find_imports(tree.root_node)
    return imports


def extract_exports(tree, source_code: bytes, file_path: str) -> dict:
    """
    Extract all export statements from a JavaScript/TypeScript file.

    Handles:
    - Named exports: `export { A, B }`
    - Default exports: `export default X`
    - Export declarations: `export function X()`, `export const X`
    - Re-exports: `export { A } from 'y'`

    Args:
        tree: The tree-sitter parse tree.
        source_code: The source code as bytes.
        file_path: Path to the source file (for context).

    Returns:
        Dictionary containing:
        - exports: List of named export identifiers
        - default_export: Name of the default export or None
    """
    exports = []
    default_export = None

    def _find_exports(node):
        nonlocal default_export

        if node.type == "export_statement":
            is_default = False

            # Check if this is a default export
            for child in node.children:
                if child.type == "default":
                    is_default = True
                    break

            # Get the declaration
            declaration = node.child_by_field_name("declaration")

            if is_default:
                # export default X
                if declaration:
                    if declaration.type == "function_declaration":
                        name_node = declaration.child_by_field_name("name")
                        if name_node:
                            default_export = name_node.text.decode("utf-8")
                        else:
                            default_export = "default"
                    elif declaration.type == "class_declaration":
                        name_node = declaration.child_by_field_name("name")
                        if name_node:
                            default_export = name_node.text.decode("utf-8")
                        else:
                            default_export = "default"
                    elif declaration.type == "identifier":
                        default_export = declaration.text.decode("utf-8")
                    else:
                        default_export = "default"
                else:
                    # Find identifier after 'default' keyword
                    for child in node.children:
                        if child.type == "identifier":
                            default_export = child.text.decode("utf-8")
                            break
                        elif child.type in ("function_expression", "arrow_function", "class"):
                            default_export = "default"
                            break
                    if not default_export:
                        default_export = "default"

            elif declaration:
                # export function X() / export class X / export const X
                if declaration.type == "function_declaration":
                    name_node = declaration.child_by_field_name("name")
                    if name_node:
                        exports.append(name_node.text.decode("utf-8"))
                elif declaration.type == "class_declaration":
                    name_node = declaration.child_by_field_name("name")
                    if name_node:
                        exports.append(name_node.text.decode("utf-8"))
                elif declaration.type in ("lexical_declaration", "variable_declaration"):
                    for child in declaration.children:
                        if child.type == "variable_declarator":
                            name_node = child.child_by_field_name("name")
                            if name_node:
                                if name_node.type == "identifier":
                                    exports.append(name_node.text.decode("utf-8"))
                                elif name_node.type == "object_pattern":
                                    # export const { a, b } = obj
                                    for prop in name_node.children:
                                        if prop.type == "shorthand_property_identifier_pattern":
                                            exports.append(prop.text.decode("utf-8"))
                elif declaration.type == "interface_declaration":
                    name_node = declaration.child_by_field_name("name")
                    if name_node:
                        exports.append(name_node.text.decode("utf-8"))
                elif declaration.type == "type_alias_declaration":
                    name_node = declaration.child_by_field_name("name")
                    if name_node:
                        exports.append(name_node.text.decode("utf-8"))

            else:
                # Named exports: export { A, B } or export { A } from 'y'
                for child in node.children:
                    if child.type == "export_clause":
                        for spec in child.children:
                            if spec.type == "export_specifier":
                                # Handle aliased exports: export { A as B }
                                name_node = spec.child_by_field_name("name")
                                alias_node = spec.child_by_field_name("alias")
                                if alias_node:
                                    exports.append(alias_node.text.decode("utf-8"))
                                elif name_node:
                                    exports.append(name_node.text.decode("utf-8"))

        # Recurse into children
        for child in node.children:
            _find_exports(child)

    _find_exports(tree.root_node)

    return {
        "exports": exports,
        "default_export": default_export,
    }


def extract_file_info(file_path: str) -> dict:
    """
    Extract comprehensive file information including imports, exports, and functions.

    This function combines import/export extraction with function extraction
    to provide a complete overview of a JavaScript/TypeScript file.

    Args:
        file_path: Path to the source file to analyze.

    Returns:
        Dictionary containing:
        - file_path: Absolute path to the file
        - imports: List of import information (see extract_imports)
        - exports: Export information (see extract_exports)
        - functions: List of function names defined in the file

    Returns dict with empty lists/None if file cannot be parsed.
    """
    result = {
        "file_path": os.path.abspath(file_path),
        "imports": [],
        "exports": {"exports": [], "default_export": None},
        "functions": [],
    }

    try:
        _, ext = os.path.splitext(file_path)
        if ext not in EXTENSION_MAP:
            return result

        lang_name, language = EXTENSION_MAP[ext]
        abs_path = os.path.abspath(file_path)

        with open(abs_path, "rb") as f:
            source_code = f.read()

        parser = _create_parser(language)
        tree = parser.parse(source_code)

        # Extract imports and exports (JS/TS only)
        if lang_name in ("javascript", "typescript"):
            result["imports"] = extract_imports(tree, source_code, abs_path)
            result["exports"] = extract_exports(tree, source_code, abs_path)

        # Extract function names
        if lang_name == "python":
            entities = _find_python_entities(tree.root_node, source_code, abs_path)
        else:
            entities = _find_js_entities(tree.root_node, source_code, abs_path, lang_name)

        # Get function names (excluding classes, types, interfaces)
        function_kinds = ("function", "arrow_function", "method")
        result["functions"] = [
            e["name"] for e in entities
            if e.get("kind") in function_kinds
        ]

    except (OSError, IOError, UnicodeDecodeError):
        pass
    except Exception:
        pass

    return result


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
        - calls: List of function/method names called within this entity
                 (for functions and methods only)

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
        calls_str = ""
        if "calls" in r and r["calls"]:
            calls_str = f" -> calls: {r['calls']}"
        print(f"  [{r['kind']}] {r['name']} (lines {r['line_start']}-{r['line_end']}){calls_str}")

    if results:
        print(f"\nFirst entity code preview:")
        print(results[0]['code'][:200] + "..." if len(results[0]['code']) > 200 else results[0]['code'])
