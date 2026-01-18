/**
 * Server Manager
 * Tracks installed/connected MCP servers and manages their lifecycle
 */

import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { SmitheryServer } from "./smithery.js";

/**
 * Configuration location options
 * - local: .mcp.json in current working directory
 * - global: ~/.claude.json (Claude Code global config)
 * - both: Write to both locations
 */
export type ConfigLocation = "local" | "global" | "both";

export interface ServerConfig {
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface ClaudeConfig {
  mcpServers?: Record<string, {
    type: string;
    command: string;
    args?: string[];
    env?: Record<string, string>;
  }>;
  [key: string]: any;
}

export interface InstalledServer {
  qualifiedName: string;
  displayName: string;
  connectionType: "remote" | "local";
  status: "connected" | "disconnected" | "error";
  installedAt: string;
  lastUsed?: string;
  config?: {
    command?: string;
    args?: string[];
    env?: Record<string, string>;
    url?: string;
  };
  tools?: string[];
  error?: string;
}

// In-memory store for installed servers (also persisted to JSON)
const installedServers = new Map<string, InstalledServer>();
const SERVERS_FILE = path.join(process.cwd(), "installed_servers.json");

/**
 * Load installed servers from disk
 */
export function loadServers(): void {
  try {
    if (fs.existsSync(SERVERS_FILE)) {
      const data = JSON.parse(fs.readFileSync(SERVERS_FILE, "utf-8"));
      for (const server of data.servers || []) {
        installedServers.set(server.qualifiedName, server);
      }
      console.log(`[ServerManager] Loaded ${installedServers.size} servers from disk`);
    }
  } catch (error) {
    console.error("[ServerManager] Error loading servers:", error);
  }
}

/**
 * Save installed servers to disk
 */
function saveServers(): void {
  try {
    const data = {
      updatedAt: new Date().toISOString(),
      servers: Array.from(installedServers.values())
    };
    fs.writeFileSync(SERVERS_FILE, JSON.stringify(data, null, 2));
  } catch (error) {
    console.error("[ServerManager] Error saving servers:", error);
  }
}

/**
 * Register a new server installation
 */
export function registerServer(
  smitheryServer: SmitheryServer,
  connectionType: "remote" | "local",
  config?: InstalledServer["config"]
): InstalledServer {
  const server: InstalledServer = {
    qualifiedName: smitheryServer.qualifiedName,
    displayName: smitheryServer.displayName,
    connectionType,
    status: "connected",
    installedAt: new Date().toISOString(),
    config
  };

  installedServers.set(server.qualifiedName, server);
  saveServers();

  console.log(`[ServerManager] Registered server: ${server.qualifiedName} (${connectionType})`);

  return server;
}

/**
 * Get an installed server by name
 */
export function getServer(qualifiedName: string): InstalledServer | null {
  return installedServers.get(qualifiedName) || null;
}

/**
 * Check if a server is already installed
 */
export function isServerInstalled(qualifiedName: string): boolean {
  return installedServers.has(qualifiedName);
}

/**
 * List all installed servers
 */
export function listServers(): InstalledServer[] {
  return Array.from(installedServers.values());
}

/**
 * Update server status
 */
export function updateServerStatus(
  qualifiedName: string,
  status: InstalledServer["status"],
  error?: string
): void {
  const server = installedServers.get(qualifiedName);
  if (server) {
    server.status = status;
    server.error = error;
    if (status === "connected") {
      server.lastUsed = new Date().toISOString();
    }
    saveServers();
  }
}

/**
 * Record server usage (update lastUsed timestamp)
 */
export function recordServerUsage(qualifiedName: string): void {
  const server = installedServers.get(qualifiedName);
  if (server) {
    server.lastUsed = new Date().toISOString();
    saveServers();
  }
}

/**
 * Unregister/remove a server
 */
export function unregisterServer(qualifiedName: string): boolean {
  const existed = installedServers.delete(qualifiedName);
  if (existed) {
    saveServers();
    console.log(`[ServerManager] Unregistered server: ${qualifiedName}`);
  }
  return existed;
}

/**
 * Find a server by capability
 */
export function findServerByCapability(capability: string): InstalledServer | null {
  // Simple matching based on server name containing capability
  for (const server of installedServers.values()) {
    const name = server.qualifiedName.toLowerCase();
    const display = server.displayName.toLowerCase();

    if (name.includes(capability) || display.includes(capability)) {
      return server;
    }
  }
  return null;
}

/**
 * Get servers that need reconnection (status: disconnected or error)
 */
export function getDisconnectedServers(): InstalledServer[] {
  return Array.from(installedServers.values()).filter(
    s => s.status === "disconnected" || s.status === "error"
  );
}

/**
 * Get the path to Claude Code global config file
 */
export function getClaudeConfigPath(): string {
  return path.join(os.homedir(), ".claude.json");
}

/**
 * Get the path to local .mcp.json config file
 */
export function getLocalConfigPath(): string {
  return path.join(process.cwd(), ".mcp.json");
}

/**
 * Read Claude Code global config
 */
export function readClaudeConfig(): ClaudeConfig | null {
  try {
    const configPath = getClaudeConfigPath();
    if (fs.existsSync(configPath)) {
      return JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }
    return null;
  } catch (error) {
    console.error("[ServerManager] Error reading Claude config:", error);
    return null;
  }
}

/**
 * Write server configuration to Claude Code global config
 */
export function writeClaudeConfig(
  serverName: string,
  config: ServerConfig
): boolean {
  try {
    const configPath = getClaudeConfigPath();
    let claudeConfig: ClaudeConfig = { mcpServers: {} };

    if (fs.existsSync(configPath)) {
      claudeConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));
    }

    claudeConfig.mcpServers = claudeConfig.mcpServers || {};
    claudeConfig.mcpServers[serverName] = {
      type: "stdio",
      command: config.command,
      args: config.args || [],
      env: config.env || {}
    };

    fs.writeFileSync(configPath, JSON.stringify(claudeConfig, null, 2));
    console.log(`[ServerManager] Updated ~/.claude.json with ${serverName}`);

    return true;
  } catch (error) {
    console.error("[ServerManager] Error writing Claude config:", error);
    return false;
  }
}

/**
 * Write server configuration to local .mcp.json
 */
function writeLocalConfig(
  serverName: string,
  config: ServerConfig
): boolean {
  try {
    const mcpJsonPath = getLocalConfigPath();
    let mcpConfig: any = { mcpServers: {} };

    if (fs.existsSync(mcpJsonPath)) {
      mcpConfig = JSON.parse(fs.readFileSync(mcpJsonPath, "utf-8"));
    }

    mcpConfig.mcpServers = mcpConfig.mcpServers || {};
    mcpConfig.mcpServers[serverName] = {
      type: "stdio",
      command: config.command,
      args: config.args || [],
      env: config.env || {}
    };

    fs.writeFileSync(mcpJsonPath, JSON.stringify(mcpConfig, null, 2));
    console.log(`[ServerManager] Updated .mcp.json with ${serverName}`);

    return true;
  } catch (error) {
    console.error("[ServerManager] Error updating .mcp.json:", error);
    return false;
  }
}

/**
 * Update MCP config file with server configuration
 * Supports local (.mcp.json), global (~/.claude.json), or both
 */
export function updateMcpConfig(
  serverName: string,
  config: ServerConfig,
  location: ConfigLocation = "local"
): boolean {
  let localSuccess = true;
  let globalSuccess = true;

  if (location === "local" || location === "both") {
    localSuccess = writeLocalConfig(serverName, config);
  }

  if (location === "global" || location === "both") {
    globalSuccess = writeClaudeConfig(serverName, config);
  }

  return localSuccess && globalSuccess;
}

/**
 * Remove server from local .mcp.json config
 */
function removeFromLocalConfig(serverName: string): boolean {
  try {
    const mcpJsonPath = getLocalConfigPath();

    if (!fs.existsSync(mcpJsonPath)) {
      return false;
    }

    const mcpConfig = JSON.parse(fs.readFileSync(mcpJsonPath, "utf-8"));

    if (mcpConfig.mcpServers && mcpConfig.mcpServers[serverName]) {
      delete mcpConfig.mcpServers[serverName];
      fs.writeFileSync(mcpJsonPath, JSON.stringify(mcpConfig, null, 2));
      console.log(`[ServerManager] Removed ${serverName} from .mcp.json`);
      return true;
    }

    return false;
  } catch (error) {
    console.error("[ServerManager] Error removing from .mcp.json:", error);
    return false;
  }
}

/**
 * Remove server from global ~/.claude.json config
 */
function removeFromClaudeConfig(serverName: string): boolean {
  try {
    const configPath = getClaudeConfigPath();

    if (!fs.existsSync(configPath)) {
      return false;
    }

    const claudeConfig = JSON.parse(fs.readFileSync(configPath, "utf-8"));

    if (claudeConfig.mcpServers && claudeConfig.mcpServers[serverName]) {
      delete claudeConfig.mcpServers[serverName];
      fs.writeFileSync(configPath, JSON.stringify(claudeConfig, null, 2));
      console.log(`[ServerManager] Removed ${serverName} from ~/.claude.json`);
      return true;
    }

    return false;
  } catch (error) {
    console.error("[ServerManager] Error removing from ~/.claude.json:", error);
    return false;
  }
}

/**
 * Remove server from MCP config
 * Supports local (.mcp.json), global (~/.claude.json), or both
 */
export function removeFromMcpConfig(
  serverName: string,
  location: ConfigLocation = "local"
): boolean {
  let localRemoved = false;
  let globalRemoved = false;

  if (location === "local" || location === "both") {
    localRemoved = removeFromLocalConfig(serverName);
  }

  if (location === "global" || location === "both") {
    globalRemoved = removeFromClaudeConfig(serverName);
  }

  return localRemoved || globalRemoved;
}

// Load servers on module initialization
loadServers();
