"""
Pytest configuration and fixtures for WashedMCP tests.

Provides reusable fixtures for:
- Sample code strings (Python, JavaScript)
- Temporary directories for ChromaDB
- Mock embeddings (to avoid loading the model)
- Sample function data structures
"""

import json
import os
import tempfile
from typing import List
from unittest.mock import MagicMock, patch

import pytest


# ============== SAMPLE CODE FIXTURES ==============

@pytest.fixture
def sample_python_code() -> str:
    """Simple Python function for testing."""
    return '''def greet(name: str) -> str:
    """Say hello to someone."""
    return f"Hello, {name}!"
'''


@pytest.fixture
def sample_python_code_with_calls() -> str:
    """Python function that calls other functions."""
    return '''def process_user(data):
    """Process user data with validation."""
    validated = validate_input(data)
    cleaned = sanitize(validated)
    return save_to_db(cleaned)
'''


@pytest.fixture
def sample_python_class() -> str:
    """Python class with methods."""
    return '''class UserService:
    """Service for user operations."""

    def __init__(self, db):
        self.db = db

    def get_user(self, user_id: int):
        """Get user by ID."""
        return self.db.find(user_id)

    def create_user(self, name: str, email: str):
        """Create a new user."""
        validated = self.validate_email(email)
        return self.db.insert({"name": name, "email": validated})

    def validate_email(self, email: str) -> str:
        """Validate and normalize email."""
        return email.lower().strip()
'''


@pytest.fixture
def sample_python_file_content() -> str:
    """Complete Python file with multiple functions."""
    return '''"""Utility functions for data processing."""

import json
from typing import List, Dict


def load_config(path: str) -> Dict:
    """Load configuration from JSON file."""
    with open(path) as f:
        return json.load(f)


def validate_data(data: Dict) -> bool:
    """Validate data structure."""
    required = ["name", "value"]
    return all(k in data for k in required)


def process_items(items: List[Dict]) -> List[Dict]:
    """Process and filter valid items."""
    results = []
    for item in items:
        if validate_data(item):
            results.append(transform_item(item))
    return results


def transform_item(item: Dict) -> Dict:
    """Transform item to output format."""
    return {
        "id": item.get("id", 0),
        "name": item["name"].upper(),
        "value": item["value"] * 2
    }
'''


@pytest.fixture
def sample_javascript_code() -> str:
    """Simple JavaScript function for testing."""
    return '''function calculateTotal(items) {
    return items.reduce((sum, item) => sum + item.price, 0);
}
'''


@pytest.fixture
def sample_javascript_arrow_function() -> str:
    """JavaScript arrow function for testing."""
    return '''const fetchUser = async (userId) => {
    const response = await fetch(`/api/users/${userId}`);
    const data = await response.json();
    return processUserData(data);
};
'''


@pytest.fixture
def sample_javascript_class() -> str:
    """JavaScript class with methods."""
    return '''class ApiClient {
    constructor(baseUrl) {
        this.baseUrl = baseUrl;
    }

    async get(endpoint) {
        const response = await fetch(this.baseUrl + endpoint);
        return this.handleResponse(response);
    }

    async post(endpoint, data) {
        const response = await fetch(this.baseUrl + endpoint, {
            method: 'POST',
            body: JSON.stringify(data)
        });
        return this.handleResponse(response);
    }

    handleResponse(response) {
        if (!response.ok) {
            throw new Error('Request failed');
        }
        return response.json();
    }
}
'''


@pytest.fixture
def sample_typescript_code() -> str:
    """TypeScript function with types."""
    return '''interface User {
    id: number;
    name: string;
    email: string;
}

function createUser(name: string, email: string): User {
    return {
        id: Date.now(),
        name,
        email
    };
}

export const validateUser = (user: User): boolean => {
    return user.name.length > 0 && user.email.includes('@');
};
'''


@pytest.fixture
def sample_jsx_code() -> str:
    """React JSX component."""
    return '''import React from 'react';

function UserCard({ user, onEdit }) {
    const handleClick = () => {
        onEdit(user.id);
    };

    return (
        <div className="user-card">
            <h2>{user.name}</h2>
            <p>{user.email}</p>
            <button onClick={handleClick}>Edit</button>
        </div>
    );
}

export default UserCard;
'''


# ============== TEMP DIRECTORY FIXTURES ==============

@pytest.fixture
def temp_dir():
    """Create a temporary directory for test files."""
    with tempfile.TemporaryDirectory() as tmpdir:
        yield tmpdir


@pytest.fixture
def temp_chroma_dir(temp_dir):
    """Create a temporary directory specifically for ChromaDB."""
    chroma_path = os.path.join(temp_dir, "chroma")
    os.makedirs(chroma_path, exist_ok=True)
    return chroma_path


@pytest.fixture
def temp_python_file(temp_dir, sample_python_file_content):
    """Create a temporary Python file with sample content."""
    file_path = os.path.join(temp_dir, "sample.py")
    with open(file_path, "w") as f:
        f.write(sample_python_file_content)
    return file_path


@pytest.fixture
def temp_javascript_file(temp_dir, sample_javascript_class):
    """Create a temporary JavaScript file with sample content."""
    file_path = os.path.join(temp_dir, "sample.js")
    with open(file_path, "w") as f:
        f.write(sample_javascript_class)
    return file_path


@pytest.fixture
def temp_codebase(temp_dir, sample_python_file_content, sample_javascript_class):
    """Create a temporary codebase with multiple files."""
    # Create Python file
    py_path = os.path.join(temp_dir, "utils.py")
    with open(py_path, "w") as f:
        f.write(sample_python_file_content)

    # Create JavaScript file
    js_path = os.path.join(temp_dir, "api.js")
    with open(js_path, "w") as f:
        f.write(sample_javascript_class)

    # Create subdirectory with another file
    subdir = os.path.join(temp_dir, "src")
    os.makedirs(subdir, exist_ok=True)

    sub_py_path = os.path.join(subdir, "helpers.py")
    with open(sub_py_path, "w") as f:
        f.write('''def helper_func():
    """A helper function."""
    return True
''')

    return temp_dir


# ============== MOCK EMBEDDING FIXTURES ==============

@pytest.fixture
def mock_embedding() -> List[float]:
    """Return a mock embedding vector (384 dimensions)."""
    return [0.1] * 384


@pytest.fixture
def mock_embedding_different() -> List[float]:
    """Return a different mock embedding vector."""
    return [0.2] * 384


@pytest.fixture
def mock_embedder(mock_embedding):
    """Mock the embedder module to avoid loading the model."""
    with patch("washedmcp.embedder._get_model") as mock_get_model:
        mock_model = MagicMock()
        mock_model.encode.return_value = MagicMock(tolist=lambda: mock_embedding)
        mock_get_model.return_value = mock_model
        yield mock_model


@pytest.fixture
def mock_embed_batch(mock_embedding):
    """Mock embed_batch to return consistent embeddings."""
    def _embed_batch(codes):
        return [mock_embedding for _ in codes]

    with patch("washedmcp.embedder.embed_batch", side_effect=_embed_batch):
        yield


@pytest.fixture
def mock_embed_code(mock_embedding):
    """Mock embed_code to return a consistent embedding."""
    with patch("washedmcp.embedder.embed_code", return_value=mock_embedding):
        yield


@pytest.fixture
def mock_embed_query(mock_embedding):
    """Mock embed_query to return a consistent embedding."""
    with patch("washedmcp.embedder.embed_query", return_value=mock_embedding):
        yield


# ============== SAMPLE DATA FIXTURES ==============

@pytest.fixture
def sample_function_dict(mock_embedding) -> dict:
    """Sample function dictionary as stored in the database."""
    return {
        "name": "calculate_sum",
        "code": "def calculate_sum(a, b):\n    return a + b",
        "file_path": "/test/example.py",
        "line_start": 10,
        "line_end": 12,
        "language": "python",
        "summary": "Calculates the sum of two numbers",
        "embedding": mock_embedding,
        "calls": [],
        "imports": [],
        "exported": False
    }


@pytest.fixture
def sample_functions_with_calls(mock_embedding) -> List[dict]:
    """Sample functions with call relationships."""
    return [
        {
            "name": "main",
            "code": "def main():\n    result = process_data([1, 2])\n    print(result)",
            "file_path": "/test/main.py",
            "line_start": 1,
            "line_end": 4,
            "language": "python",
            "summary": "Main entry point",
            "embedding": mock_embedding,
            "calls": ["process_data"],
            "imports": [],
            "exported": False
        },
        {
            "name": "process_data",
            "code": "def process_data(data):\n    total = calculate_sum(data[0], data[1])\n    return total",
            "file_path": "/test/example.py",
            "line_start": 15,
            "line_end": 18,
            "language": "python",
            "summary": "Processes data and calculates sum",
            "embedding": [0.2] * 384,
            "calls": ["calculate_sum"],
            "imports": [],
            "exported": True
        },
        {
            "name": "calculate_sum",
            "code": "def calculate_sum(a, b):\n    return a + b",
            "file_path": "/test/example.py",
            "line_start": 10,
            "line_end": 12,
            "language": "python",
            "summary": "Calculates the sum of two numbers",
            "embedding": [0.3] * 384,
            "calls": [],
            "imports": ["math"],
            "exported": True
        }
    ]


@pytest.fixture
def sample_search_results() -> List[dict]:
    """Sample search results for formatter tests."""
    return [
        {
            "function_name": "validate_email",
            "file_path": "/src/auth.py",
            "line_start": 42,
            "line_end": 48,
            "summary": "Validates email format using regex",
            "similarity": 0.92,
            "code": "def validate_email(email):\n    return re.match(r'^[\\w.-]+@[\\w.-]+\\.\\w+$', email)",
            "calls": ["re.match"],
            "called_by": ["create_user", "update_user"],
            "exported": True
        },
        {
            "function_name": "hash_password",
            "file_path": "/src/auth.py",
            "line_start": 50,
            "line_end": 53,
            "summary": "Hashes password using SHA256",
            "similarity": 0.75,
            "code": "def hash_password(password):\n    return hashlib.sha256(password.encode()).hexdigest()",
            "calls": ["hashlib.sha256"],
            "called_by": ["create_user"],
            "exported": True
        },
        {
            "function_name": "check_token",
            "file_path": "/src/auth.py",
            "line_start": 60,
            "line_end": 65,
            "summary": "Checks if auth token is valid",
            "similarity": 0.68,
            "code": "def check_token(token):\n    return verify_signature(token)",
            "calls": ["verify_signature"],
            "called_by": [],
            "exported": False
        }
    ]


@pytest.fixture
def sample_context() -> dict:
    """Sample context data for formatter tests."""
    return {
        "function": {
            "function_name": "validate_email",
            "file_path": "/src/auth.py",
            "line_start": 42,
            "code": "def validate_email(email):\n    return re.match(r'^[\\w.-]+@[\\w.-]+\\.\\w+$', email)",
            "calls": ["re.match"],
            "called_by": ["create_user", "update_user"]
        },
        "callees": [
            {"function_name": "re.match", "file_path": "/stdlib/re.py", "line_start": 100}
        ],
        "callers": [
            {"function_name": "create_user", "file_path": "/src/users.py", "line_start": 20},
            {"function_name": "update_user", "file_path": "/src/users.py", "line_start": 45}
        ],
        "same_file": [
            {"function_name": "hash_password", "file_path": "/src/auth.py", "line_start": 50},
            {"function_name": "check_token", "file_path": "/src/auth.py", "line_start": 60}
        ]
    }


# ============== DATABASE RESET FIXTURE ==============

@pytest.fixture(autouse=False)
def reset_database_globals():
    """Reset database module global state between tests."""
    import washedmcp.database as db_module

    # Store original values
    original_client = db_module._client
    original_collection = db_module._collection
    original_persist_path = db_module._persist_path

    # Reset to None
    db_module._client = None
    db_module._collection = None
    db_module._persist_path = None

    yield

    # Restore (in case test didn't clean up)
    db_module._client = original_client
    db_module._collection = original_collection
    db_module._persist_path = original_persist_path
