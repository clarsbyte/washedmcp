import os
import csv
from typing import Optional
from pydantic import BaseModel

import google.generativeai as genai

# Configure Gemini API from environment variable
api_key = os.getenv("GEMINI_API_KEY", "")
if api_key:
    genai.configure(api_key=api_key)
    model = genai.GenerativeModel('gemini-2.0-flash')
else:
    model = None
    print("Warning: GEMINI_API_KEY not set. Recommendations will return all MCPs.")


class MCPInfo(BaseModel):
    """MCP Server Information"""
    name: str
    description: str
    documentation: str

    def to_claude_format(self) -> dict:
        """Format for Claude Code to understand and install"""
        return {
            "mcp_name": self.name,
            "description": self.description,
            "installation_docs": self.documentation,
            "install_command": f"# Install {self.name}\n# Documentation: {self.documentation}"
        }


def load_mcp_database(csv_path: str = None) -> list[MCPInfo]:
    """Load all MCPs from the CSV database"""
    if csv_path is None:
        current_dir = os.path.dirname(os.path.abspath(__file__))
        csv_path = os.path.join(current_dir, '..', 'mcpdatabase.csv')

    mcps = []
    with open(csv_path, 'r', encoding='utf-8') as file:
        reader = csv.DictReader(file)
        for row in reader:
            name = row.get('name', '').strip()
            description = row.get('description', '').strip()
            docs = row.get('docs', '').strip()

            if name and description:
                mcps.append(MCPInfo(
                    name=name,
                    description=description,
                    documentation=docs
                ))

    return mcps


def recommend_mcps_with_gemini(user_context: str, csv_path: str = None) -> list[MCPInfo]:
    """
    Use Gemini to analyze user context and recommend relevant MCP servers.

    Args:
        user_context: Description of what the user wants to do
        csv_path: Optional path to the MCP database CSV

    Returns:
        List of MCPInfo objects recommended by Gemini
    """
    if model is None:
        # No API key, return all MCPs
        return load_mcp_database(csv_path)

    # Load all available MCPs
    all_mcps = load_mcp_database(csv_path)

    # Create a formatted list of MCPs for Gemini
    mcp_list = "\n".join([
        f"{i+1}. {mcp.name}: {mcp.description}"
        for i, mcp in enumerate(all_mcps)
    ])

    # Create prompt for Gemini
    prompt = f"""You are an AI assistant helping to recommend MCP (Model Context Protocol) servers based on user needs.

User Context: {user_context}

Available MCP Servers:
{mcp_list}

Task: Analyze the user's context and recommend the most relevant MCP servers that would help them accomplish their goals. Consider their specific needs and choose only the MCPs that are truly relevant.

IMPORTANT: Return ONLY the exact names of the recommended MCPs, one per line, nothing else. No explanations, no numbers, no markdown, just the exact names as they appear in the list above.

Example response format:
Github MCP
Playwright MCP
Firebase MCP"""

    # Call Gemini API
    response = model.generate_content(prompt)

    # Parse Gemini's response to get recommended MCP names
    recommended_names = [name.strip() for name in response.text.strip().split('\n') if name.strip()]

    # Match recommended names with MCPInfo objects
    recommended_mcps = []
    for name in recommended_names:
        for mcp in all_mcps:
            if mcp.name.lower() == name.lower():
                recommended_mcps.append(mcp)
                break

    return recommended_mcps


def get_mcp_docs_installation(name: str) -> str:
    """Get MCP documentation URL by name"""
    mcps = load_mcp_database()
    for mcp in mcps:
        if mcp.name.lower() == name.lower():
            return mcp.documentation
    return f"MCP '{name}' not found in database"


def get_mcp_by_name(name: str) -> Optional[MCPInfo]:
    """Get MCPInfo by name (case-insensitive)."""
    mcps = load_mcp_database()
    for mcp in mcps:
        if mcp.name.lower() == name.lower():
            return mcp
    return None


def get_mcp_names(context: str = None) -> list[MCPInfo]:
    """
    Get MCP servers based on user context.
    If context is provided, uses Gemini to recommend relevant MCPs.
    Otherwise, returns all available MCPs.

    Args:
        context: Optional user context describing what they want to do

    Returns:
        List of MCPInfo objects
    """
    if context:
        return recommend_mcps_with_gemini(context)
    else:
        return load_mcp_database()


def format_for_claude_code(mcps: list[MCPInfo]) -> str:
    """
    Format MCP recommendations for Claude Code to parse and install.

    Returns a formatted string that Claude Code can understand.
    """
    if not mcps:
        return "No MCP servers recommended."

    output = "# Recommended MCP Servers for Installation\n\n"

    for i, mcp in enumerate(mcps, 1):
        output += f"## {i}. {mcp.name}\n"
        output += f"**Description:** {mcp.description}\n\n"
        output += f"**Documentation:** {mcp.documentation}\n\n"
        output += "---\n\n"

    output += "\n## Next Steps\n"
    output += "To install these MCP servers:\n"
    output += "1. Visit each documentation link above\n"
    output += "2. Follow the installation instructions for your environment\n"
    output += "3. Configure the MCP server in your Claude Code settings\n"

    return output


# Example usage
if __name__ == "__main__":
    # Test the recommendation system
    test_context = "I want to build a web scraping tool that can interact with websites and take screenshots"
    recommended = recommend_mcps_with_gemini(test_context)

    print(f"User Context: {test_context}\n")
    print(f"Recommended {len(recommended)} MCP servers:\n")
    print(format_for_claude_code(recommended))
