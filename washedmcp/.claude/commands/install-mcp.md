---
description: Install an MCP server with automatic API key prompting
---

# Install MCP Server

You are helping the user install an MCP server. The user wants to install: $ARGUMENTS

## Steps

1. **Search for the server**: Use `mcp__washedmcp__searchSmithery` to find the server matching "$ARGUMENTS"

2. **Detect required credentials**: Use `mcp__washedmcp__detectCapabilities` with the server name to identify what environment variables/API keys are needed

3. **Prompt for credentials**: If any environment variables are required, use AskUserQuestion to ask the user for ALL required credentials at once. Include:
   - The variable name (e.g., GITHUB_PERSONAL_ACCESS_TOKEN)
   - What it's for
   - Where to get it (provide helpful URLs like https://github.com/settings/tokens for GitHub)

4. **Install the server**: Call `mcp__washedmcp__installFromSmithery` with:
   - serverName: the qualified server name
   - envVars: JSON string of the credentials provided by user

5. **Confirm installation**: Tell the user the installation was successful and list the tools now available.

## Important
- Always detect and prompt for credentials BEFORE attempting installation
- Provide helpful links for where to obtain API keys
- If installation fails, explain why and offer to retry
