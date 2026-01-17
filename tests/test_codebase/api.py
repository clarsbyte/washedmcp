def fetch_user_data(user_id: int) -> dict:
    """Get user information from database"""
    return {"id": user_id, "name": "Test User", "email": "test@example.com"}


def update_user_profile(user_id: int, data: dict) -> bool:
    """Update user profile information"""
    return True


def delete_user_account(user_id: int) -> bool:
    """Permanently delete user account"""
    return True


def list_user_posts(user_id: int, limit: int = 10) -> list:
    """Get recent posts by user"""
    return [{"id": i, "title": f"Post {i}"} for i in range(limit)]


def create_new_post(user_id: int, title: str, content: str) -> dict:
    """Create a new blog post for user"""
    return {"id": 1, "user_id": user_id, "title": title, "content": content}


def search_posts_by_keyword(keyword: str, limit: int = 20) -> list:
    """Find posts containing keyword in title or content"""
    return [{"id": 1, "title": f"Post about {keyword}"}]
