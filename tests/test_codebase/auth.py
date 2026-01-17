import re
import hashlib


def validate_email(email: str) -> bool:
    """Check if email format is valid"""
    pattern = r'^[\w\.-]+@[\w\.-]+\.\w+$'
    return bool(re.match(pattern, email))


def hash_password(password: str) -> str:
    """Hash password using SHA256"""
    return hashlib.sha256(password.encode()).hexdigest()


def verify_password(password: str, hashed: str) -> bool:
    """Check if password matches hash"""
    return hash_password(password) == hashed


def generate_token(user_id: int) -> str:
    """Generate auth token for user"""
    import secrets
    return f"{user_id}_{secrets.token_hex(16)}"


def validate_password_strength(password: str) -> bool:
    """Check if password meets security requirements"""
    if len(password) < 8:
        return False
    has_upper = any(c.isupper() for c in password)
    has_lower = any(c.islower() for c in password)
    has_digit = any(c.isdigit() for c in password)
    return has_upper and has_lower and has_digit
