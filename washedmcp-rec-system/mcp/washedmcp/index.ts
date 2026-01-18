import { Tool, Resource, SchemaConstraint, Optional } from "@leanmcp/core";
import * as fs from "fs";
import * as path from "path";

// Import from orchestrator modules
import { updateMcpConfig, ConfigLocation } from "../orchestrator/server-manager.js";
import { validateEnvVars, getTokenFormatHint } from "../orchestrator/validation.js";
import { recommendWithAI, formatRecommendations } from "../orchestrator/recommendation-engine.js";

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
    // Try AI-powered recommendations first (searches Smithery registry)
    const aiResult = await recommendWithAI(input.user_context);

    if (aiResult.success && aiResult.recommendations.length > 0) {
      // Format the AI recommendations
      const formatted = formatRecommendations(aiResult);
      return {
        content: [{
          type: "text" as const,
          text: formatted
        }]
      };
    }

    // Fall back to local metadata keyword matching
    const metadata = loadMCPMetadata();
    const mcps = Object.values(metadata.mcps || {}) as any[];

    const context = input.user_context.toLowerCase();
    const matches = mcps.filter((mcp: any) => {
      const name = (mcp.name || "").toLowerCase();
      const desc = (mcp.description || "").toLowerCase();
      const capabilities = (mcp.capabilities || []).join(" ").toLowerCase();
      const useCases = (mcp.use_cases || []).join(" ").toLowerCase();

      return context.split(" ").some((word: string) =>
        word.length > 2 && (
          name.includes(word) ||
          desc.includes(word) ||
          capabilities.includes(word) ||
          useCases.includes(word)
        )
      );
    });

    if (matches.length === 0) {
      const errorMsg = aiResult.error
        ? `AI search: ${aiResult.error}\n\n`
        : "";
      return {
        content: [{
          type: "text" as const,
          text: `${errorMsg}No MCP servers found matching: "${input.user_context}"\n\nUse list_all_mcp_servers to see all available options.`
        }]
      };
    }

    const formatted = matches.slice(0, 5).map((mcp: any, i: number) =>
      `## ${i + 1}. ${mcp.name}\n**Description:** ${mcp.description}\n**Documentation:** ${mcp.documentation}\n`
    ).join("\n---\n");

    return {
      content: [{
        type: "text" as const,
        text: `# Recommended MCP Servers (from local database)\n\n${formatted}\n\n## Next Steps\nUse install_mcp_server("MCP Name") to install any of these.`
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
    description: "Install an MCP server automatically by writing to .mcp.json config",
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
          text: JSON.stringify({
            success: false,
            error: `MCP "${input.mcp_name}" not found`,
            hint: "Use recommend_mcp_servers() or list_all_mcp_servers() to find available MCPs."
          }, null, 2)
        }]
      };
    }

    // Check required env vars
    const requiredVars = mcp.configuration?.env_vars?.required || [];

    // Parse env_vars if it's a string (MCP passes objects as JSON strings)
    let providedEnvVars: Record<string, string> = {};
    if (input.env_vars) {
      if (typeof input.env_vars === "string") {
        try {
          providedEnvVars = JSON.parse(input.env_vars);
        } catch (e) {
          // If it's not valid JSON, treat as empty
          providedEnvVars = {};
        }
      } else {
        providedEnvVars = input.env_vars;
      }
    }

    // Validate provided env vars format (warn-only mode by default)
    if (Object.keys(providedEnvVars).length > 0) {
      const validationResult = validateEnvVars(providedEnvVars);

      // Log warnings but don't block installation
      if (validationResult.warnings.length > 0) {
        console.log("[washedMCP] Token format warnings:", validationResult.warnings);
      }

      // In strict mode (if ever enabled), errors would block installation
      if (!validationResult.isValid && validationResult.errors.length > 0) {
        const errorDetails = validationResult.errors.map(e => ({
          name: e.varName,
          error: e.message,
          hint: e.hint || getTokenFormatHint(e.varName)
        }));

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              success: false,
              validation_failed: true,
              mcp_name: mcp.name,
              errors: errorDetails,
              message: "Token format validation failed. Please check your credentials.",
              note: "If you believe this is a valid token, you can retry with strict validation disabled."
            }, null, 2)
          }]
        };
      }
    }

    const missingVars = requiredVars.filter(
      (v: any) => !providedEnvVars[v.name]
    );

    if (missingVars.length > 0) {
      // Return a structured prompt for missing credentials
      const missingVarDetails = missingVars.map((v: any) => ({
        name: v.name,
        description: v.description,
        instructions: v.prompt || `Get this from: ${v.docs_url || "See documentation"}`,
        docs_url: v.docs_url
      }));

      const exampleCall = `install_mcp_server("${mcp.name}", env_vars: { ${missingVars.map((v: any) => `"${v.name}": "your_value"`).join(", ")} })`;

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            success: false,
            requires_credentials: true,
            mcp_name: mcp.name,
            missing_vars: missingVarDetails,
            example_call: exampleCall,
            message: `The ${mcp.name} requires credentials to install. Please provide the following environment variables.`
          }, null, 2)
        }]
      };
    }

    // Get installation command
    const installation = mcp.installation || {};
    const primaryMethod = installation.primary_method || "manual";
    const methods = installation.methods || {};

    if (primaryMethod === "manual" || !methods[primaryMethod]) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            success: false,
            manual_install_required: true,
            mcp_name: mcp.name,
            documentation: mcp.documentation,
            message: `Manual installation required for ${mcp.name}. See documentation for instructions.`
          }, null, 2)
        }]
      };
    }

    const method = methods[primaryMethod];

    // Build configuration for .mcp.json
    let command: string;
    let args: string[];

    // Use command_generation if available (preferred), otherwise infer from method
    const cmdGen = mcp.configuration?.command_generation;
    const isWindows = process.platform === "win32";
    const platformConfig = isWindows ? cmdGen?.windows : cmdGen?.unix;

    if (platformConfig) {
      command = platformConfig.command;
      args = platformConfig.args || [];
    } else if (primaryMethod === "npx" || primaryMethod === "npm") {
      command = "npx";
      args = ["-y", method.package];
    } else {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            success: false,
            error: "Could not determine install command",
            mcp_name: mcp.name,
            documentation: mcp.documentation
          }, null, 2)
        }]
      };
    }

    // Write configuration to .mcp.json
    const configWritten = updateMcpConfig(mcp.name, {
      command,
      args,
      env: providedEnvVars
    });

    if (!configWritten) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            success: false,
            error: "Failed to write configuration to .mcp.json",
            mcp_name: mcp.name
          }, null, 2)
        }]
      };
    }

    // Log the installation
    saveToolCall({
      tool_name: "install_mcp_server",
      server_name: "washedmcp",
      parameters: input,
      result: {
        mcp_name: mcp.name,
        config_written: true,
        command,
        args,
        env_vars_count: Object.keys(providedEnvVars).length
      }
    });

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          success: true,
          mcp_name: mcp.name,
          config_written: true,
          configuration: {
            command,
            args,
            env_vars: Object.keys(providedEnvVars)
          },
          next_steps: [
            "Configuration written to .mcp.json",
            "Restart Claude Code to load the new MCP server",
            `The ${mcp.name} tools will then be available`
          ]
        }, null, 2)
      }]
    };
  }

  @Tool({
    description: "Check installation status of an MCP server",
    inputClass: StatusInput
  })
  async getMCPInstallationStatus(input: StatusInput) {
    // First check local .mcp.json (for development/testing)
    const mcpJsonPath = path.join(process.cwd(), ".mcp.json");
    let localConfig: any = null;
    
    if (fs.existsSync(mcpJsonPath)) {
      try {
        const config = JSON.parse(fs.readFileSync(mcpJsonPath, "utf-8"));
        localConfig = config.mcpServers?.[input.mcp_name];
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Look up MCP in metadata
    const metadata = loadMCPMetadata();
    const mcp = Object.values(metadata.mcps || {}).find(
      (m: any) => m.name?.toLowerCase() === input.mcp_name.toLowerCase()
    ) as any;

    if (!mcp) {
      return {
        content: [{
          type: "text" as const,
          text: `"${input.mcp_name}" not found in database.\n\nUse list_all_mcp_servers() to see available MCPs.`
        }]
      };
    }

    if (localConfig) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            installed: true,
            mcp_name: mcp.name,
            configuration: {
              type: localConfig.type,
              command: localConfig.command,
              args: localConfig.args || [],
              env_vars_configured: Object.keys(localConfig.env || {}).length
            },
            note: "Server is configured in .mcp.json. Restart Claude Code if not yet loaded."
          }, null, 2)
        }]
      };
    }

    // Check required env vars for the not-installed response
    const requiredVars = mcp.configuration?.env_vars?.required || [];
    const needsCredentials = requiredVars.length > 0;

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify({
          installed: false,
          mcp_name: mcp.name,
          description: mcp.description,
          documentation: mcp.documentation,
          requires_credentials: needsCredentials,
          required_env_vars: requiredVars.map((v: any) => ({
            name: v.name,
            description: v.description
          })),
          install_command: needsCredentials
            ? `install_mcp_server("${mcp.name}", env_vars: { ${requiredVars.map((v: any) => `"${v.name}": "your_value"`).join(", ")} })`
            : `install_mcp_server("${mcp.name}")`
        }, null, 2)
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
