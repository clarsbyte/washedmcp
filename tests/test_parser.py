"""
Tests for the parser module.

Tests function extraction from Python and JavaScript/TypeScript files,
including call extraction and handling of various code patterns.
"""

import os
import tempfile

import pytest

from washedmcp.parser import (
    extract_functions,
    extract_calls,
    get_supported_extensions,
    extract_imports,
    extract_exports,
    extract_file_info,
    EXTENSION_MAP,
    _create_parser,
    PY_LANGUAGE,
    JS_LANGUAGE,
)


class TestGetSupportedExtensions:
    """Tests for get_supported_extensions function."""

    def test_returns_list(self):
        """Should return a list."""
        extensions = get_supported_extensions()
        assert isinstance(extensions, list)

    def test_contains_python(self):
        """Should include Python extension."""
        extensions = get_supported_extensions()
        assert ".py" in extensions

    def test_contains_javascript(self):
        """Should include JavaScript extensions."""
        extensions = get_supported_extensions()
        assert ".js" in extensions
        assert ".jsx" in extensions

    def test_contains_typescript(self):
        """Should include TypeScript extensions."""
        extensions = get_supported_extensions()
        assert ".ts" in extensions
        assert ".tsx" in extensions

    def test_all_extensions_in_extension_map(self):
        """All returned extensions should be in EXTENSION_MAP."""
        extensions = get_supported_extensions()
        for ext in extensions:
            assert ext in EXTENSION_MAP


class TestExtractFunctionsPython:
    """Tests for extracting functions from Python files."""

    def test_extract_simple_function(self, temp_dir):
        """Should extract a simple Python function."""
        code = '''def hello():
    return "world"
'''
        file_path = os.path.join(temp_dir, "test.py")
        with open(file_path, "w") as f:
            f.write(code)

        functions = extract_functions(file_path)

        assert len(functions) == 1
        assert functions[0]["name"] == "hello"
        assert functions[0]["language"] == "python"
        assert functions[0]["kind"] == "function"

    def test_extract_function_with_arguments(self, temp_dir):
        """Should extract function with type hints."""
        code = '''def greet(name: str, times: int = 1) -> str:
    """Greet someone."""
    return f"Hello, {name}!" * times
'''
        file_path = os.path.join(temp_dir, "test.py")
        with open(file_path, "w") as f:
            f.write(code)

        functions = extract_functions(file_path)

        assert len(functions) == 1
        assert functions[0]["name"] == "greet"
        assert "name: str" in functions[0]["code"]
        assert "-> str" in functions[0]["code"]

    def test_extract_multiple_functions(self, temp_dir):
        """Should extract all functions from a file."""
        code = '''def func1():
    pass

def func2():
    pass

def func3():
    pass
'''
        file_path = os.path.join(temp_dir, "test.py")
        with open(file_path, "w") as f:
            f.write(code)

        functions = extract_functions(file_path)

        assert len(functions) == 3
        names = [f["name"] for f in functions]
        assert "func1" in names
        assert "func2" in names
        assert "func3" in names

    def test_extract_class_and_methods(self, temp_dir, sample_python_class):
        """Should extract class and its methods."""
        file_path = os.path.join(temp_dir, "test.py")
        with open(file_path, "w") as f:
            f.write(sample_python_class)

        functions = extract_functions(file_path)

        # Should have class + methods
        names = [f["name"] for f in functions]
        assert "UserService" in names
        assert "UserService.__init__" in names
        assert "UserService.get_user" in names
        assert "UserService.create_user" in names
        assert "UserService.validate_email" in names

    def test_extract_function_line_numbers(self, temp_dir):
        """Should correctly track line numbers."""
        code = '''# Comment line 1
# Comment line 2

def my_function():
    """Docstring on line 5."""
    return True
'''
        file_path = os.path.join(temp_dir, "test.py")
        with open(file_path, "w") as f:
            f.write(code)

        functions = extract_functions(file_path)

        assert len(functions) == 1
        assert functions[0]["line_start"] == 4
        assert functions[0]["line_end"] == 6

    def test_extract_nested_function(self, temp_dir):
        """Should extract nested functions."""
        code = '''def outer():
    def inner():
        return "inner"
    return inner()
'''
        file_path = os.path.join(temp_dir, "test.py")
        with open(file_path, "w") as f:
            f.write(code)

        functions = extract_functions(file_path)

        names = [f["name"] for f in functions]
        assert "outer" in names
        assert "inner" in names


class TestExtractFunctionsJavaScript:
    """Tests for extracting functions from JavaScript files."""

    def test_extract_function_declaration(self, temp_dir):
        """Should extract function declarations."""
        code = '''function greet(name) {
    return "Hello, " + name;
}
'''
        file_path = os.path.join(temp_dir, "test.js")
        with open(file_path, "w") as f:
            f.write(code)

        functions = extract_functions(file_path)

        assert len(functions) == 1
        assert functions[0]["name"] == "greet"
        assert functions[0]["language"] == "javascript"
        assert functions[0]["kind"] == "function"

    def test_extract_arrow_function(self, temp_dir):
        """Should extract arrow functions assigned to variables."""
        code = '''const add = (a, b) => {
    return a + b;
};
'''
        file_path = os.path.join(temp_dir, "test.js")
        with open(file_path, "w") as f:
            f.write(code)

        functions = extract_functions(file_path)

        assert len(functions) == 1
        assert functions[0]["name"] == "add"
        assert functions[0]["kind"] == "arrow_function"

    def test_extract_class_methods(self, temp_dir, sample_javascript_class):
        """Should extract class and its methods."""
        file_path = os.path.join(temp_dir, "test.js")
        with open(file_path, "w") as f:
            f.write(sample_javascript_class)

        functions = extract_functions(file_path)

        names = [f["name"] for f in functions]
        assert "ApiClient" in names
        assert "ApiClient.constructor" in names
        assert "ApiClient.get" in names
        assert "ApiClient.post" in names
        assert "ApiClient.handleResponse" in names

    def test_extract_exported_function(self, temp_dir):
        """Should mark exported functions."""
        code = '''export function publicFunc() {
    return true;
}

function privateFunc() {
    return false;
}
'''
        file_path = os.path.join(temp_dir, "test.js")
        with open(file_path, "w") as f:
            f.write(code)

        functions = extract_functions(file_path)

        exported = [f for f in functions if f.get("exported")]
        non_exported = [f for f in functions if not f.get("exported")]

        assert len(exported) >= 1
        assert any(f["name"] == "publicFunc" for f in exported)

    def test_extract_exported_arrow_function(self, temp_dir):
        """Should extract exported arrow functions."""
        code = '''export const myHelper = () => {
    return "help";
};
'''
        file_path = os.path.join(temp_dir, "test.js")
        with open(file_path, "w") as f:
            f.write(code)

        functions = extract_functions(file_path)

        assert len(functions) == 1
        assert functions[0]["name"] == "myHelper"
        assert functions[0].get("exported") == True


class TestExtractFunctionsTypeScript:
    """Tests for extracting functions from TypeScript files."""

    def test_extract_typescript_function(self, temp_dir):
        """Should extract TypeScript function with types."""
        code = '''function add(a: number, b: number): number {
    return a + b;
}
'''
        file_path = os.path.join(temp_dir, "test.ts")
        with open(file_path, "w") as f:
            f.write(code)

        functions = extract_functions(file_path)

        assert len(functions) == 1
        assert functions[0]["name"] == "add"
        assert functions[0]["language"] == "typescript"

    def test_extract_interface(self, temp_dir):
        """Should extract TypeScript interfaces."""
        code = '''interface User {
    id: number;
    name: string;
}
'''
        file_path = os.path.join(temp_dir, "test.ts")
        with open(file_path, "w") as f:
            f.write(code)

        functions = extract_functions(file_path)

        assert len(functions) == 1
        assert functions[0]["name"] == "User"
        assert functions[0]["kind"] == "interface"

    def test_extract_type_alias(self, temp_dir):
        """Should extract TypeScript type aliases."""
        code = '''type Status = "active" | "inactive" | "pending";
'''
        file_path = os.path.join(temp_dir, "test.ts")
        with open(file_path, "w") as f:
            f.write(code)

        functions = extract_functions(file_path)

        assert len(functions) == 1
        assert functions[0]["name"] == "Status"
        assert functions[0]["kind"] == "type"


class TestExtractCalls:
    """Tests for function call extraction."""

    def test_extract_simple_calls_python(self, temp_dir):
        """Should extract simple function calls in Python."""
        code = '''def process():
    validate()
    transform()
    save()
'''
        file_path = os.path.join(temp_dir, "test.py")
        with open(file_path, "w") as f:
            f.write(code)

        functions = extract_functions(file_path)

        assert len(functions) == 1
        calls = functions[0].get("calls", [])
        assert "validate" in calls
        assert "transform" in calls
        assert "save" in calls

    def test_extract_method_calls_python(self, temp_dir):
        """Should extract method calls with objects."""
        code = '''def process(data):
    cleaned = data.strip()
    result = self.validate(cleaned)
    return db.save(result)
'''
        file_path = os.path.join(temp_dir, "test.py")
        with open(file_path, "w") as f:
            f.write(code)

        functions = extract_functions(file_path)
        calls = functions[0].get("calls", [])

        assert "data.strip" in calls
        assert "self.validate" in calls
        assert "db.save" in calls

    def test_extract_calls_javascript(self, temp_dir):
        """Should extract function calls in JavaScript."""
        code = '''function handler(req, res) {
    const data = parseRequest(req);
    const result = processData(data);
    sendResponse(res, result);
}
'''
        file_path = os.path.join(temp_dir, "test.js")
        with open(file_path, "w") as f:
            f.write(code)

        functions = extract_functions(file_path)
        calls = functions[0].get("calls", [])

        assert "parseRequest" in calls
        assert "processData" in calls
        assert "sendResponse" in calls

    def test_extract_chained_method_calls(self, temp_dir):
        """Should handle chained method calls."""
        code = '''function transform(items) {
    return items.filter(x => x.valid).map(x => x.value);
}
'''
        file_path = os.path.join(temp_dir, "test.js")
        with open(file_path, "w") as f:
            f.write(code)

        functions = extract_functions(file_path)
        calls = functions[0].get("calls", [])

        assert "items.filter" in calls

    def test_no_duplicate_calls(self, temp_dir):
        """Should not include duplicate calls."""
        code = '''def process():
    validate()
    validate()
    validate()
'''
        file_path = os.path.join(temp_dir, "test.py")
        with open(file_path, "w") as f:
            f.write(code)

        functions = extract_functions(file_path)
        calls = functions[0].get("calls", [])

        assert calls.count("validate") == 1


class TestExtractImports:
    """Tests for import extraction in JavaScript/TypeScript."""

    def test_extract_default_import(self, temp_dir):
        """Should extract default imports."""
        code = '''import React from 'react';
'''
        file_path = os.path.join(temp_dir, "test.js")
        with open(file_path, "w") as f:
            f.write(code)

        parser = _create_parser(JS_LANGUAGE)
        with open(file_path, "rb") as f:
            source = f.read()
        tree = parser.parse(source)

        imports = extract_imports(tree, source, file_path)

        assert len(imports) == 1
        assert imports[0]["name"] == "React"
        assert imports[0]["from"] == "react"
        assert imports[0]["type"] == "external"

    def test_extract_named_imports(self, temp_dir):
        """Should extract named imports."""
        code = '''import { useState, useEffect } from 'react';
'''
        file_path = os.path.join(temp_dir, "test.js")
        with open(file_path, "w") as f:
            f.write(code)

        parser = _create_parser(JS_LANGUAGE)
        with open(file_path, "rb") as f:
            source = f.read()
        tree = parser.parse(source)

        imports = extract_imports(tree, source, file_path)

        names = [i["name"] for i in imports]
        assert "useState" in names
        assert "useEffect" in names

    def test_extract_local_imports(self, temp_dir):
        """Should identify local vs external imports."""
        code = '''import helper from './utils';
import axios from 'axios';
'''
        file_path = os.path.join(temp_dir, "test.js")
        with open(file_path, "w") as f:
            f.write(code)

        parser = _create_parser(JS_LANGUAGE)
        with open(file_path, "rb") as f:
            source = f.read()
        tree = parser.parse(source)

        imports = extract_imports(tree, source, file_path)

        local = [i for i in imports if i["type"] == "local"]
        external = [i for i in imports if i["type"] == "external"]

        assert len(local) == 1
        assert local[0]["name"] == "helper"
        assert len(external) == 1
        assert external[0]["name"] == "axios"


class TestExtractExports:
    """Tests for export extraction in JavaScript/TypeScript."""

    def test_extract_named_exports(self, temp_dir):
        """Should extract named exports."""
        code = '''export function myFunc() {}
export const myConst = 42;
'''
        file_path = os.path.join(temp_dir, "test.js")
        with open(file_path, "w") as f:
            f.write(code)

        parser = _create_parser(JS_LANGUAGE)
        with open(file_path, "rb") as f:
            source = f.read()
        tree = parser.parse(source)

        exports = extract_exports(tree, source, file_path)

        assert "myFunc" in exports["exports"]
        assert "myConst" in exports["exports"]

    def test_extract_default_export(self, temp_dir):
        """Should extract default exports."""
        code = '''function MyComponent() {}
export default MyComponent;
'''
        file_path = os.path.join(temp_dir, "test.js")
        with open(file_path, "w") as f:
            f.write(code)

        parser = _create_parser(JS_LANGUAGE)
        with open(file_path, "rb") as f:
            source = f.read()
        tree = parser.parse(source)

        exports = extract_exports(tree, source, file_path)

        assert exports["default_export"] == "MyComponent"


class TestExtractFileInfo:
    """Tests for comprehensive file info extraction."""

    def test_extract_file_info_js(self, temp_dir):
        """Should extract complete file info for JavaScript."""
        code = '''import React from 'react';

export function MyComponent() {
    return <div>Hello</div>;
}

function helper() {
    return true;
}
'''
        file_path = os.path.join(temp_dir, "test.js")
        with open(file_path, "w") as f:
            f.write(code)

        info = extract_file_info(file_path)

        assert info["file_path"] == os.path.abspath(file_path)
        assert len(info["imports"]) == 1
        assert "MyComponent" in info["exports"]["exports"]
        assert "MyComponent" in info["functions"]

    def test_unsupported_extension(self, temp_dir):
        """Should return empty info for unsupported files."""
        file_path = os.path.join(temp_dir, "test.txt")
        with open(file_path, "w") as f:
            f.write("Hello world")

        info = extract_file_info(file_path)

        assert info["imports"] == []
        assert info["functions"] == []


class TestEdgeCases:
    """Tests for edge cases and error handling."""

    def test_empty_file(self, temp_dir):
        """Should handle empty files."""
        file_path = os.path.join(temp_dir, "empty.py")
        with open(file_path, "w") as f:
            f.write("")

        functions = extract_functions(file_path)
        assert functions == []

    def test_nonexistent_file(self):
        """Should return empty list for nonexistent files."""
        functions = extract_functions("/nonexistent/path/file.py")
        assert functions == []

    def test_unsupported_extension(self, temp_dir):
        """Should return empty list for unsupported extensions."""
        file_path = os.path.join(temp_dir, "file.rs")
        with open(file_path, "w") as f:
            f.write("fn main() {}")

        functions = extract_functions(file_path)
        assert functions == []

    def test_syntax_error_file(self, temp_dir):
        """Should handle files with syntax errors gracefully."""
        code = '''def broken(
    # Missing closing paren
'''
        file_path = os.path.join(temp_dir, "broken.py")
        with open(file_path, "w") as f:
            f.write(code)

        # Should not raise, may return partial results or empty
        functions = extract_functions(file_path)
        assert isinstance(functions, list)
