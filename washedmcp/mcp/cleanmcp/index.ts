import { Tool, Resource, SchemaConstraint, Optional } from "@leanmcp/core";
import * as fs from "fs";
import * as path from "path";

/**
 * washedMCP Service - MCP Recommender and Auto-Installer
 *
 * Provides tools for recommending and installing MCP servers
 * based on user context using AI-powered analysis.
 */

// Storage for tool calls (JSON-based)
const STORAGE_FILE = path.join(process.cwd(), "mcp_tool_calls.json");

// Load MCP metadata
function loadMCPMetadata(): Record<string, any> {
  const metadataPath = path.join(process.cwd(), "mcp_metadata.json");
  if (fs.existsSync(metadataPath)) {
    return JSON.parse(fs.readFileSync(metadataPath, "utf-8"));
  }
  return { mcps: {} };
}

// Load tool calls from JSON
function loadToolCalls(): any[] {
  if (fs.existsSync(STORAGE_FILE)) {
    try {
      return JSON.parse(fs.readFileSync(STORAGE_FILE, "utf-8"));
    } catch {
      return [];
    }
  }
  return [];
}

// Save tool call to JSON
function saveToolCall(call: any): void {
  const calls = loadToolCalls();
  calls.push({
    ...call,
    timestamp: new Date().toISOString()
  });
  fs.writeFileSync(STORAGE_FILE, JSON.stringify(calls, null, 2));
}

// Input schemas
class RecommendInput {
  @SchemaConstraint({ description: "Description of what the user wants to accomplish" })
  user_context!: string;
}

class InstallInput {
  @SchemaConstraint({ description: "Exact name of the MCP server to install" })
  mcp_name!: string;

  @Optional()
  @SchemaConstraint({ description: "Environment variables (API keys, tokens)" })
  env_vars?: Record<string, string>;
}

class StatusInput {
  @SchemaConstraint({ description: "Name of the MCP server to check" })
  mcp_name!: string;
}

class RecentCallsInput {
  @Optional()
  @SchemaConstraint({ description: "Maximum number of calls to return", default: 10 })
  limit?: number;

  @Optional()
  @SchemaConstraint({ description: "Filter by server name" })
  server_name?: string;

  @Optional()
  @SchemaConstraint({ description: "Filter by tool name" })
  tool_name?: string;
}

class SearchCallsInput {
  @SchemaConstraint({ description: "Search query" })
  query!: string;

  @Optional()
  @SchemaConstraint({ description: "Maximum results", default: 10 })
  limit?: number;
}

export class washedMCPService {

  @Tool({
    description: "Recommend MCP servers based on user's needs and context",
    inputClass: RecommendInput
  })
  async recommendMCPServers(input: RecommendInput) {
    const metadata = loadMCPMetadata();
    const mcps = Object.values(metadata.mcps || {}) as any[];

    // Simple keyword matching (in production, use AI like Gemini)
    const context = input.user_context.toLowerCase();
    const matches = mcps.filter((mcp: any) => {
      const name = (mcp.name || "").toLowerCase();
      const desc = (mcp.description || "").toLowerCase();
      const capabilities = (mcp.capabilities || []).join(" ").toLowerCase();
      const useCases = (mcp.use_cases || []).join(" ").toLowerCase();

      return context.split(" ").some((word: string) =>
        name.includes(word) ||
        desc.includes(word) ||
        capabilities.includes(word) ||
        useCases.includes(word)
      );
    });

    if (matches.length === 0) {
      return {
        content: [{
          type: "text" as const,
          text: `No MCP servers found matching: "${input.user_context}"\n\nUse list_all_mcp_servers to see all available options.`
        }]
      };
    }

    const formatted = matches.slice(0, 5).map((mcp: any, i: number) =>
      `## ${i + 1}. ${mcp.name}\n**Description:** ${mcp.description}\n**Documentation:** ${mcp.documentation}\n`
    ).join("\n---\n");

    return {
      content: [{
        type: "text" as const,
        text: `# Recommended MCP Servers\n\n${formatted}\n\n## Next Steps\nUse install_mcp_server("MCP Name") to install any of these.`
      }]
    };
  }

  @Tool({
    description: "List all available MCP servers in the database"
  })
  async listAllMCPServers() {
    const metadata = loadMCPMetadata();
    const mcps = Object.values(metadata.mcps || {}) as any[];

    if (mcps.length === 0) {
      return {
        content: [{
          type: "text" as const,
          text: "No MCP servers found in database."
        }]
      };
    }

    const formatted = mcps.map((mcp: any, i: number) =>
      `${i + 1}. **${mcp.name}** - ${mcp.description?.slice(0, 100)}...`
    ).join("\n");

    return {
      content: [{
        type: "text" as const,
        text: `# Available MCP Servers (${mcps.length})\n\n${formatted}`
      }]
    };
  }

  @Tool({
    description: "Install an MCP server automatically",
    inputClass: InstallInput
  })
  async installMCPServer(input: InstallInput) {
    const metadata = loadMCPMetadata();
    const mcpId = input.mcp_name.toLowerCase().replace(/ /g, "-");

    // Find MCP by name or ID
    let mcp = metadata.mcps?.[mcpId];
    if (!mcp) {
      // Try by display name
      mcp = Object.values(metadata.mcps || {}).find(
        (m: any) => m.name?.toLowerCase() === input.mcp_name.toLowerCase()
      );
    }

    if (!mcp) {
      return {
        content: [{
          type: "text" as const,
          text: `MCP "${input.mcp_name}" not found.\n\nUse recommend_mcp_servers() or list_all_mcp_servers() to find available MCPs.`
        }]
      };
    }

    // Check required env vars
    const requiredVars = mcp.configuration?.env_vars?.required || [];
    const missingVars = requiredVars.filter(
      (v: any) => !input.env_vars?.[v.name]
    );

    if (missingVars.length > 0) {
      const varList = missingVars.map((v: any) =>
        `  - ${v.name}: ${v.description}\n    Get it at: ${v.docs_url || "See documentation"}`
      ).join("\n");

      return {
        content: [{
          type: "text" as const,
          text: `Required Credentials Missing\n\n${varList}\n\nCall install_mcp_server with env_vars to provide these.`
        }]
      };
    }

    // Check if already installed
    const mcpJsonPath = path.join(process.cwd(), ".mcp.json");
    if (fs.existsSync(mcpJsonPath)) {
      const config = JSON.parse(fs.readFileSync(mcpJsonPath, "utf-8"));
      if (config.mcpServers?.[input.mcp_name]) {
        return {
          content: [{
            type: "text" as const,
            text: `${mcp.name} is already installed.\n\nRestart Claude Code to load it if not available.`
          }]
        };
      }
    }

    // Get installation command
    const installation = mcp.installation || {};
    const primaryMethod = installation.primary_method || "manual";
    const methods = installation.methods || {};

    if (primaryMethod === "manual" || !methods[primaryMethod]) {
      return {
        content: [{
          type: "text" as const,
          text: `Manual installation required for ${mcp.name}.\n\nDocumentation: ${mcp.documentation}`
        }]
      };
    }

    const method = methods[primaryMethod];
    const command = primaryMethod === "npx"
      ? "npx"
      : primaryMethod === "npm"
        ? "npx"
        : method.command || "npx";

    const args = primaryMethod === "npx"
      ? ["-y", method.package]
      : [method.package];

    // Update .mcp.json
    let config: any = { mcpServers: {} };
    if (fs.existsSync(mcpJsonPath)) {
      config = JSON.parse(fs.readFileSync(mcpJsonPath, "utf-8"));
    }

    config.mcpServers = config.mcpServers || {};
    config.mcpServers[input.mcp_name] = {
      type: mcp.configuration?.type || "stdio",
      command,
      args,
      env: input.env_vars || {}
    };

    fs.writeFileSync(mcpJsonPath, JSON.stringify(config, null, 2));

    return {
      content: [{
        type: "text" as const,
        text: `Installation Complete: ${mcp.name}\n\nConfiguration added to .mcp.json\n- Command: ${command}\n- Args: ${args.join(" ")}\n\nRESTART REQUIRED: Please restart Claude Code to load the new MCP server.\n\nDocumentation: ${mcp.documentation}`
      }]
    };
  }

  @Tool({
    description: "Check installation status of an MCP server",
    inputClass: StatusInput
  })
  async getMCPInstallationStatus(input: StatusInput) {
    const mcpJsonPath = path.join(process.cwd(), ".mcp.json");

    if (!fs.existsSync(mcpJsonPath)) {
      return {
        content: [{
          type: "text" as const,
          text: "No .mcp.json configuration file found."
        }]
      };
    }

    const config = JSON.parse(fs.readFileSync(mcpJsonPath, "utf-8"));
    const mcpConfig = config.mcpServers?.[input.mcp_name];

    if (!mcpConfig) {
      const metadata = loadMCPMetadata();
      const mcp = Object.values(metadata.mcps || {}).find(
        (m: any) => m.name?.toLowerCase() === input.mcp_name.toLowerCase()
      ) as any;

      if (mcp) {
        return {
          content: [{
            type: "text" as const,
            text: `${mcp.name} is NOT installed\n\nDescription: ${mcp.description}\nDocumentation: ${mcp.documentation}\n\nInstall with: install_mcp_server("${mcp.name}")`
          }]
        };
      }

      return {
        content: [{
          type: "text" as const,
          text: `"${input.mcp_name}" not found in configuration or database.`
        }]
      };
    }

    return {
      content: [{
        type: "text" as const,
        text: `${input.mcp_name} is INSTALLED\n\nConfiguration:\n- Type: ${mcpConfig.type}\n- Command: ${mcpConfig.command}\n- Args: ${mcpConfig.args?.join(" ") || "none"}\n- Env vars: ${Object.keys(mcpConfig.env || {}).length} configured\n\nStatus: Ready (restart Claude Code if not loaded)`
      }]
    };
  }

  @Tool({
    description: "Get recent MCP tool calls from the log",
    inputClass: RecentCallsInput
  })
  async getRecentToolCalls(input: RecentCallsInput) {
    let calls = loadToolCalls();

    if (input.server_name) {
      calls = calls.filter(c => c.server_name === input.server_name);
    }
    if (input.tool_name) {
      calls = calls.filter(c => c.tool_name === input.tool_name);
    }

    // Sort by timestamp descending
    calls.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const limited = calls.slice(0, input.limit || 10);

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(limited, null, 2)
      }]
    };
  }

  @Tool({
    description: "Search through logged tool calls",
    inputClass: SearchCallsInput
  })
  async searchToolCalls(input: SearchCallsInput) {
    const calls = loadToolCalls();
    const query = input.query.toLowerCase();

    const matches = calls.filter(call => {
      const toolName = (call.tool_name || "").toLowerCase();
      const params = JSON.stringify(call.parameters || {}).toLowerCase();
      const result = JSON.stringify(call.result || {}).toLowerCase();

      return toolName.includes(query) || params.includes(query) || result.includes(query);
    });

    // Sort by timestamp descending
    matches.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(matches.slice(0, input.limit || 10), null, 2)
      }]
    };
  }

  @Tool({
    description: "Get statistics about logged tool calls"
  })
  async getToolCallStats() {
    const calls = loadToolCalls();

    const servers: Record<string, number> = {};
    const tools: Record<string, number> = {};

    calls.forEach(call => {
      const server = call.server_name || "unknown";
      const tool = call.tool_name || "unknown";
      servers[server] = (servers[server] || 0) + 1;
      tools[tool] = (tools[tool] || 0) + 1;
    });

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          total_calls: calls.length,
          servers,
          tools
        }, null, 2)
      }]
    };
  }

  @Resource({ description: "Get MCP database statistics" })
  async mcpStats() {
    const metadata = loadMCPMetadata();
    const mcps = Object.values(metadata.mcps || {}) as any[];

    const categories: Record<string, number> = {};
    mcps.forEach((mcp: any) => {
      const cat = mcp.category || "uncategorized";
      categories[cat] = (categories[cat] || 0) + 1;
    });

    return {
      contents: [{
        uri: "washedmcp://stats",
        mimeType: "application/json",
        text: JSON.stringify({
          total_mcps: mcps.length,
          categories,
          last_updated: metadata.last_updated
        }, null, 2)
      }]
    };
  }
}
