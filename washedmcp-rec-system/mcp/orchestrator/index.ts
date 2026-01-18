/**
 * Intelligent MCP Orchestrator Service
 *
 * Automatically detects capabilities needed for any task,
 * finds and installs MCP servers from Smithery, and executes tasks seamlessly.
 */

import { Tool, Resource, SchemaConstraint, Optional } from "@leanmcp/core";
import * as fs from "fs";
import * as path from "path";

import {
  detectCapabilities,
  getSearchTermsForCapabilities,
  DetectionResult
} from "./capabilities.js";

import {
  searchSmithery,
  getServerDetails,
  selectBestServer,
  getInstallCommand,
  extractRequiredEnvVars,
  getCredentialInstructions,
  getAllRequiredEnvVars,
  SmitheryServer,
  SmitherySearchResult,
  RequiredEnvVar
} from "./smithery.js";

import {
  registerServer,
  getServer,
  isServerInstalled,
  listServers,
  updateServerStatus,
  recordServerUsage,
  unregisterServer,
  updateMcpConfig,
  removeFromMcpConfig,
  InstalledServer,
  ConfigLocation
} from "./server-manager.js";

import {
  validateEnvVars,
  getTokenFormatHint
} from "./validation.js";

// Tool call logging
const TOOL_CALLS_FILE = path.join(process.cwd(), "mcp_tool_calls.json");

function logToolCall(toolName: string, input: any, result: any): void {
  try {
    let calls: any[] = [];
    if (fs.existsSync(TOOL_CALLS_FILE)) {
      calls = JSON.parse(fs.readFileSync(TOOL_CALLS_FILE, "utf-8"));
    }
    calls.push({
      tool_name: toolName,
      server_name: "orchestrator",
      parameters: input,
      result: typeof result === "string" ? result.slice(0, 500) : result,
      timestamp: new Date().toISOString()
    });
    fs.writeFileSync(TOOL_CALLS_FILE, JSON.stringify(calls, null, 2));
  } catch (error) {
    // Silent fail for logging
  }
}

// Input schemas
class TaskInput {
  @SchemaConstraint({ description: "The task to analyze and execute (natural language)" })
  task!: string;

  @Optional()
  @SchemaConstraint({ description: "Skip execution, only analyze", default: false })
  dryRun?: boolean;
}

class DetectInput {
  @SchemaConstraint({ description: "Task description to analyze for required capabilities" })
  task!: string;
}

class SearchInput {
  @SchemaConstraint({ description: "Search query for Smithery registry" })
  query!: string;

  @Optional()
  @SchemaConstraint({ description: "Maximum results to return", default: 5 })
  limit?: number;
}

class InstallInput {
  @SchemaConstraint({ description: "Qualified server name (e.g., @playwright/mcp-playwright)" })
  serverName!: string;

  @Optional()
  @SchemaConstraint({
    description: "Connection type",
    enum: ["remote", "local"],
    default: "remote"
  })
  connectionType?: "remote" | "local";

  @Optional()
  @SchemaConstraint({ description: "Environment variables for the server" })
  envVars?: Record<string, string>;
}

class ExecuteInput {
  @SchemaConstraint({ description: "Name of the installed server to use" })
  serverName!: string;

  @SchemaConstraint({ description: "Name of the tool to execute on the server" })
  toolName!: string;

  @Optional()
  @SchemaConstraint({ description: "Parameters for the tool" })
  params?: Record<string, any>;
}

class CleanupInput {
  @SchemaConstraint({ description: "Server name to disconnect/uninstall" })
  serverName!: string;

  @Optional()
  @SchemaConstraint({ description: "Also remove from .mcp.json", default: true })
  removeConfig?: boolean;
}

export class OrchestratorService {

  @Tool({
    description: `Main orchestration tool - analyzes any task, finds the right MCP server, installs it, and executes.

Examples:
- "Take a screenshot of example.com" → Uses Playwright MCP
- "Query my PostgreSQL database" → Uses Postgres MCP
- "Search GitHub for TypeScript repos" → Uses GitHub MCP
- "Send a Slack message to #general" → Uses Slack MCP`,
    inputClass: TaskInput
  })
  async analyzeAndExecute(input: TaskInput) {
    const steps: string[] = [];

    // Step 1: Detect capabilities
    steps.push("1. Analyzing task for required capabilities...");
    const detection = await detectCapabilities(input.task);
    steps.push(`   Detected: ${detection.capabilities.join(", ")} (${detection.method}, confidence: ${(detection.confidence * 100).toFixed(0)}%)`);

    // Step 2: Check if we already have a matching server
    let installedServer: InstalledServer | null = null;
    for (const cap of detection.capabilities) {
      installedServer = getServer(cap) || listServers().find(s =>
        s.qualifiedName.toLowerCase().includes(cap) ||
        s.displayName.toLowerCase().includes(cap)
      ) || null;
      if (installedServer) break;
    }

    let serverToUse: { name: string; type: "remote" | "local"; isNew: boolean } | null = null;

    if (installedServer) {
      steps.push(`2. Found existing server: ${installedServer.qualifiedName}`);
      serverToUse = {
        name: installedServer.qualifiedName,
        type: installedServer.connectionType,
        isNew: false
      };
    } else {
      // Step 3: Search Smithery for servers
      steps.push("2. Searching Smithery registry...");

      const searchTerms = detection.suggestedServers.length > 0
        ? detection.suggestedServers
        : getSearchTermsForCapabilities(detection.capabilities);

      let bestServer: SmitheryServer | null = null;

      for (const term of searchTerms.slice(0, 3)) {
        const results = await searchSmithery(term, { pageSize: 5 });
        if (results.servers.length > 0) {
          bestServer = selectBestServer(results.servers);
          if (bestServer) {
            steps.push(`   Found: ${bestServer.displayName} (${bestServer.qualifiedName})`);
            break;
          }
        }
      }

      if (!bestServer) {
        steps.push("   No suitable server found in Smithery");

        const result = {
          success: false,
          task: input.task,
          detected_capabilities: detection.capabilities,
          steps,
          error: "No MCP server found for this task. Try being more specific or install a server manually."
        };

        logToolCall("analyzeAndExecute", input, result);
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify(result, null, 2)
          }]
        };
      }

      // Step 3: Check for required credentials BEFORE installation
      const requiredEnvVars = getAllRequiredEnvVars(bestServer);

      if (requiredEnvVars.length > 0) {
        steps.push(`3. Server requires credentials: ${requiredEnvVars.map(v => v.name).join(", ")}`);

        const credentialDetails = requiredEnvVars.map(v => ({
          name: v.name,
          description: v.description,
          instructions: getCredentialInstructions(v.name)
        }));

        const exampleCall = `installFromSmithery({ serverName: "${bestServer.qualifiedName}", envVars: { ${requiredEnvVars.map(v => `"${v.name}": "your_value"`).join(", ")} } })`;

        const result = {
          success: false,
          requires_credentials: true,
          task: input.task,
          detected_capabilities: detection.capabilities,
          server_found: {
            name: bestServer.qualifiedName,
            displayName: bestServer.displayName,
            isRemote: bestServer.isDeployedOnSmithery,
            isVerified: bestServer.isVerified
          },
          required_credentials: credentialDetails,
          example_install_call: exampleCall,
          steps,
          message: `Found ${bestServer.displayName} for this task, but it requires credentials. Please provide the required environment variables and use installFromSmithery to complete installation.`
        };

        logToolCall("analyzeAndExecute", input, result);
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify(result, null, 2)
          }]
        };
      }

      if (input.dryRun) {
        const result = {
          success: true,
          dryRun: true,
          task: input.task,
          detected_capabilities: detection.capabilities,
          would_install: {
            name: bestServer.qualifiedName,
            displayName: bestServer.displayName,
            isRemote: bestServer.isDeployedOnSmithery,
            isVerified: bestServer.isVerified
          },
          steps
        };

        logToolCall("analyzeAndExecute", input, result);
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify(result, null, 2)
          }]
        };
      }

      // Step 4: Install the server by writing config directly (no Smithery CLI)
      const connectionType = bestServer.isDeployedOnSmithery ? "remote" : "local";
      steps.push(`3. Installing ${bestServer.displayName} (${connectionType})...`);

      try {
        // Get the connection command from server details
        let command = "npx";
        let args = ["-y", bestServer.qualifiedName];

        // Check if server has stdio connection details
        const stdioConnection = bestServer.connections?.find(c => c.type === "stdio");
        if (stdioConnection && stdioConnection.url) {
          // Use the URL if available
          steps.push(`   Using connection URL: ${stdioConnection.url}`);
        }

        // Register locally for tracking
        const installed = registerServer(bestServer, connectionType, {
          command,
          args
        });

        // Write config directly to .mcp.json (no interactive CLI)
        const configWritten = updateMcpConfig(bestServer.qualifiedName, {
          command,
          args
        });

        if (configWritten) {
          steps.push("   Configuration written to .mcp.json");
        } else {
          steps.push("   Warning: Could not write to .mcp.json");
        }

        serverToUse = {
          name: bestServer.qualifiedName,
          type: connectionType,
          isNew: true
        };

        steps.push(`   Server registered: ${installed.qualifiedName}`);
      } catch (error) {
        steps.push(`   Installation failed: ${error instanceof Error ? error.message : String(error)}`);
        const result = {
          success: false,
          task: input.task,
          detected_capabilities: detection.capabilities,
          steps,
          error: `Failed to install ${bestServer.displayName}: ${error instanceof Error ? error.message : String(error)}`
        };
        logToolCall("analyzeAndExecute", input, result);
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    }

    // Step 5: Execution guidance
    steps.push(`4. Server ${serverToUse.name} is ready for use`);

    if (serverToUse.isNew && serverToUse.type === "local") {
      steps.push("   NOTE: Restart Claude Code to load the new local server");
    }

    const result = {
      success: true,
      task: input.task,
      detected_capabilities: detection.capabilities,
      detection_method: detection.method,
      confidence: detection.confidence,
      server_used: serverToUse.name,
      connection_type: serverToUse.type,
      newly_installed: serverToUse.isNew,
      steps,
      next_action: serverToUse.isNew && serverToUse.type === "local"
        ? "Restart Claude Code to load the server, then use its tools"
        : `Use ${serverToUse.name} tools to complete the task`
    };

    logToolCall("analyzeAndExecute", input, result);

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(result, null, 2)
      }]
    };
  }

  @Tool({
    description: "Detect what capabilities are needed for a task without installing anything",
    inputClass: DetectInput
  })
  async detectCapabilities(input: DetectInput) {
    const detection = await detectCapabilities(input.task);

    const result = {
      task: input.task,
      capabilities: detection.capabilities,
      confidence: detection.confidence,
      method: detection.method,
      suggested_servers: detection.suggestedServers,
      search_terms: getSearchTermsForCapabilities(detection.capabilities)
    };

    logToolCall("detectCapabilities", input, result);

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(result, null, 2)
      }]
    };
  }

  @Tool({
    description: "Search the Smithery registry for MCP servers",
    inputClass: SearchInput
  })
  async searchSmithery(input: SearchInput) {
    const results = await searchSmithery(input.query, {
      pageSize: input.limit || 5
    });

    const formatted = results.servers.map(s => ({
      name: s.qualifiedName,
      displayName: s.displayName,
      description: s.description?.slice(0, 200),
      isRemote: s.isDeployedOnSmithery,
      isVerified: s.isVerified,
      useCount: s.useCount,
      homepage: s.homepage
    }));

    const result = {
      query: input.query,
      totalFound: results.totalCount,
      servers: formatted
    };

    logToolCall("searchSmithery", input, result);

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(result, null, 2)
      }]
    };
  }

  @Tool({
    description: "Install/connect to an MCP server from Smithery",
    inputClass: InstallInput
  })
  async installFromSmithery(input: InstallInput) {
    // Check if already installed
    if (isServerInstalled(input.serverName)) {
      const existing = getServer(input.serverName);
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            success: true,
            alreadyInstalled: true,
            server: existing
          }, null, 2)
        }]
      };
    }

    // Get server details from Smithery
    let serverDetails = await getServerDetails(input.serverName);

    if (!serverDetails) {
      // Try searching
      const searchResults = await searchSmithery(input.serverName, { pageSize: 1 });
      if (searchResults.servers.length === 0) {
        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify({
              success: false,
              error: `Server "${input.serverName}" not found in Smithery registry`
            }, null, 2)
          }]
        };
      }
      serverDetails = searchResults.servers[0];
    }

    const server = serverDetails;
    const connectionType = input.connectionType || (server.isDeployedOnSmithery ? "remote" : "local");

    // Extract required environment variables from configSchema + inference
    const requiredEnvVars = getAllRequiredEnvVars(server);

    // Parse envVars if it's a string (MCP passes objects as JSON strings)
    let providedEnvVars: Record<string, string> = {};
    if (input.envVars) {
      if (typeof input.envVars === "string") {
        try {
          providedEnvVars = JSON.parse(input.envVars);
        } catch (e) {
          // If it's not valid JSON, treat as empty
          providedEnvVars = {};
        }
      } else {
        providedEnvVars = input.envVars;
      }
    }

    // Validate provided env vars format (warn-only mode by default)
    if (Object.keys(providedEnvVars).length > 0) {
      const validationResult = validateEnvVars(providedEnvVars);

      // Log warnings but don't block installation
      if (validationResult.warnings.length > 0) {
        console.log("[Orchestrator] Token format warnings:", validationResult.warnings);
      }

      // In strict mode (if ever enabled), errors would block installation
      if (!validationResult.isValid && validationResult.errors.length > 0) {
        const errorDetails = validationResult.errors.map(e => ({
          name: e.varName,
          error: e.message,
          hint: e.hint || getTokenFormatHint(e.varName)
        }));

        const result = {
          success: false,
          validation_failed: true,
          server_name: server.qualifiedName,
          errors: errorDetails,
          message: "Token format validation failed. Please check your credentials.",
          note: "If you believe this is a valid token, the format validation may be outdated. Contact support or try disabling strict validation."
        };

        logToolCall("installFromSmithery", input, result);

        return {
          content: [{
            type: "text" as const,
            text: JSON.stringify(result, null, 2)
          }]
        };
      }
    }

    // Check for missing required env vars
    const missingVars = requiredEnvVars.filter(
      v => v.isRequired && !providedEnvVars[v.name]
    );

    if (missingVars.length > 0) {
      // Return a structured prompt for missing credentials
      const missingVarDetails = missingVars.map(v => ({
        name: v.name,
        description: v.description,
        instructions: getCredentialInstructions(v.name)
      }));

      const exampleCall = `installFromSmithery({ serverName: "${input.serverName}", envVars: { ${missingVars.map(v => `"${v.name}": "your_value"`).join(", ")} } })`;

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            success: false,
            requires_credentials: true,
            server_name: server.qualifiedName,
            display_name: server.displayName,
            missing_vars: missingVarDetails,
            example_call: exampleCall,
            message: `The ${server.displayName} requires credentials to install. Please provide the following environment variables.`
          }, null, 2)
        }]
      };
    }

    const steps: string[] = [];
    steps.push(`Installing ${server.displayName} (${connectionType})...`);

    try {
      // Skip Smithery CLI - write config directly (non-interactive)
      const command = "npx";
      const args = ["-y", server.qualifiedName];

      if (Object.keys(providedEnvVars).length > 0) {
        steps.push(`   With environment variables: ${Object.keys(providedEnvVars).join(", ")}`);
      }

      // Check if server has stdio connection details from Smithery registry
      const stdioConnection = server.connections?.find(c => c.type === "stdio");
      if (stdioConnection && stdioConnection.url) {
        steps.push(`   Using connection URL: ${stdioConnection.url}`);
      }

      steps.push(`   Configuring: ${command} ${args.join(" ")}`);

      // Register locally for tracking
      const installed = registerServer(server, connectionType, {
        command,
        args,
        env: providedEnvVars
      });

      // Write config directly to .mcp.json (no Smithery CLI needed)
      const configWritten = updateMcpConfig(server.qualifiedName, {
        command,
        args,
        env: providedEnvVars
      });

      if (configWritten) {
        steps.push("   Configuration written to .mcp.json");
      } else {
        steps.push("   Warning: Could not write to .mcp.json");
      }

      const result = {
        success: true,
        server: installed,
        installCommand: getInstallCommand(server),
        needsRestart: connectionType === "local",
        config_written: configWritten,
        steps,
        next_steps: [
          "Configuration written to .mcp.json",
          "Restart Claude Code to load the new MCP server",
          `The ${server.displayName} tools will then be available`
        ]
      };

      logToolCall("installFromSmithery", input, result);

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2)
        }]
      };
    } catch (error) {
      const result = {
        success: false,
        error: `Installation failed: ${error instanceof Error ? error.message : String(error)}`,
        steps: [...steps, `   Error: ${error instanceof Error ? error.message : String(error)}`]
      };

      logToolCall("installFromSmithery", input, result);

      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify(result, null, 2)
        }]
      };
    }
  }

  @Tool({
    description: "Execute a tool on an installed MCP server (guidance only - actual execution through Claude)",
    inputClass: ExecuteInput
  })
  async executeOnServer(input: ExecuteInput) {
    const server = getServer(input.serverName) || listServers().find(s =>
      s.qualifiedName.includes(input.serverName) ||
      s.displayName.toLowerCase().includes(input.serverName.toLowerCase())
    );

    if (!server) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            success: false,
            error: `Server "${input.serverName}" is not installed. Use installFromSmithery first.`
          }, null, 2)
        }]
      };
    }

    recordServerUsage(server.qualifiedName);

    // This orchestrator can't directly execute tools on other MCP servers
    // It provides guidance for Claude to use the appropriate tools
    const result = {
      success: true,
      guidance: true,
      server: server.qualifiedName,
      connectionType: server.connectionType,
      requestedTool: input.toolName,
      params: input.params,
      instruction: `To execute "${input.toolName}" on ${server.displayName}, use the MCP tool: mcp__${server.qualifiedName.replace(/[@\/]/g, "_")}__${input.toolName}`,
      note: server.connectionType === "local" && server.status !== "connected"
        ? "Server may need Claude Code restart to be available"
        : "Server should be available for tool execution"
    };

    logToolCall("executeOnServer", input, result);

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(result, null, 2)
      }]
    };
  }

  @Tool({
    description: "List all installed/connected MCP servers"
  })
  async listInstalledServers() {
    const servers = listServers();

    const result = {
      count: servers.length,
      servers: servers.map(s => ({
        name: s.qualifiedName,
        displayName: s.displayName,
        type: s.connectionType,
        status: s.status,
        installedAt: s.installedAt,
        lastUsed: s.lastUsed
      }))
    };

    logToolCall("listInstalledServers", {}, result);

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(result, null, 2)
      }]
    };
  }

  @Tool({
    description: "Disconnect/uninstall an MCP server",
    inputClass: CleanupInput
  })
  async cleanupServer(input: CleanupInput) {
    const server = getServer(input.serverName);

    if (!server) {
      return {
        content: [{
          type: "text" as const,
          text: JSON.stringify({
            success: false,
            error: `Server "${input.serverName}" not found in installed servers`
          }, null, 2)
        }]
      };
    }

    // Unregister from our tracking
    unregisterServer(input.serverName);

    // Remove from .mcp.json if requested
    if (input.removeConfig !== false) {
      removeFromMcpConfig(input.serverName);
    }

    const result = {
      success: true,
      removed: input.serverName,
      removedFromConfig: input.removeConfig !== false,
      note: "Restart Claude Code to fully unload local servers"
    };

    logToolCall("cleanupServer", input, result);

    return {
      content: [{
        type: "text" as const,
        text: JSON.stringify(result, null, 2)
      }]
    };
  }

  @Resource({ description: "Get orchestrator status and statistics" })
  async orchestratorStats() {
    const servers = listServers();

    return {
      contents: [{
        uri: "orchestrator://stats",
        mimeType: "application/json",
        text: JSON.stringify({
          totalServers: servers.length,
          remoteServers: servers.filter(s => s.connectionType === "remote").length,
          localServers: servers.filter(s => s.connectionType === "local").length,
          connectedServers: servers.filter(s => s.status === "connected").length,
          hasSmitheryKey: !!process.env.SMITHERY_API_KEY,
          hasGeminiKey: !!process.env.GEMINI_API_KEY
        }, null, 2)
      }]
    };
  }
}
