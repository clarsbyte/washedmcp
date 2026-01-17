/**
 * Smithery Registry Integration
 * Searches and connects to MCP servers from the Smithery registry
 */

const SMITHERY_API = "https://registry.smithery.ai/servers";

export interface SmitheryServer {
  qualifiedName: string;
  displayName: string;
  description: string;
  homepage: string;
  useCount: number;
  isVerified: boolean;
  isDeployedOnSmithery: boolean;
  createdAt: string;
  security?: {
    scanPassed: boolean;
    lastScanned: string;
  };
  connections?: {
    type: "stdio" | "sse" | "streamable-http";
    url?: string;
    configSchema?: any;
  }[];
}

export interface SmitherySearchResult {
  servers: SmitheryServer[];
  totalCount: number;
  page: number;
  pageSize: number;
}

// Cache for search results (5 min TTL)
const searchCache = new Map<string, { result: SmitherySearchResult; timestamp: number }>();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Search Smithery registry for MCP servers
 */
export async function searchSmithery(
  query: string,
  options: {
    page?: number;
    pageSize?: number;
    owner?: string;
  } = {}
): Promise<SmitherySearchResult> {
  const { page = 1, pageSize = 10, owner } = options;

  // Build URL with query params
  const params = new URLSearchParams({
    q: query,
    page: page.toString(),
    pageSize: pageSize.toString()
  });
  if (owner) params.set("owner", owner);

  const cacheKey = params.toString();

  // Check cache
  const cached = searchCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    console.log(`[Smithery] Cache hit for: ${query}`);
    return cached.result;
  }

  const apiKey = process.env.SMITHERY_API_KEY;
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  try {
    const url = `${SMITHERY_API}?${params.toString()}`;
    console.log(`[Smithery] Searching: ${url}`);

    const response = await fetch(url, { headers });

    if (!response.ok) {
      throw new Error(`Smithery API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();

    // Transform API response to our interface
    const result: SmitherySearchResult = {
      servers: (data.servers || []).map((s: any) => ({
        qualifiedName: s.qualifiedName || s.name,
        displayName: s.displayName || s.name,
        description: s.description || "",
        homepage: s.homepage || "",
        useCount: s.useCount || 0,
        isVerified: s.isVerified || false,
        isDeployedOnSmithery: s.isDeployedOnSmithery || false,
        createdAt: s.createdAt || "",
        security: s.security,
        connections: s.connections
      })),
      totalCount: data.totalCount || data.servers?.length || 0,
      page: data.page || page,
      pageSize: data.pageSize || pageSize
    };

    // Cache the result
    searchCache.set(cacheKey, { result, timestamp: Date.now() });

    return result;
  } catch (error) {
    console.error("[Smithery] Search error:", error);
    // Return empty result on error
    return {
      servers: [],
      totalCount: 0,
      page,
      pageSize
    };
  }
}

/**
 * Get details of a specific server from Smithery
 */
export async function getServerDetails(qualifiedName: string): Promise<SmitheryServer | null> {
  const apiKey = process.env.SMITHERY_API_KEY;
  const headers: Record<string, string> = {
    "Content-Type": "application/json"
  };
  if (apiKey) {
    headers["Authorization"] = `Bearer ${apiKey}`;
  }

  try {
    // Encode the qualified name for URL
    const encodedName = encodeURIComponent(qualifiedName);
    const url = `${SMITHERY_API}/${encodedName}`;

    console.log(`[Smithery] Getting details: ${url}`);

    const response = await fetch(url, { headers });

    if (!response.ok) {
      if (response.status === 404) {
        return null;
      }
      throw new Error(`Smithery API error: ${response.status}`);
    }

    const data = await response.json();

    return {
      qualifiedName: data.qualifiedName || data.name,
      displayName: data.displayName || data.name,
      description: data.description || "",
      homepage: data.homepage || "",
      useCount: data.useCount || 0,
      isVerified: data.isVerified || false,
      isDeployedOnSmithery: data.isDeployedOnSmithery || false,
      createdAt: data.createdAt || "",
      security: data.security,
      connections: data.connections
    };
  } catch (error) {
    console.error("[Smithery] Get server details error:", error);
    return null;
  }
}

/**
 * Find the best server for a capability from search results
 * Prefers: remote > verified > popular
 */
export function selectBestServer(servers: SmitheryServer[]): SmitheryServer | null {
  if (servers.length === 0) return null;

  // Sort by preference: remote first, then verified, then by use count
  const sorted = [...servers].sort((a, b) => {
    // Remote servers first
    if (a.isDeployedOnSmithery !== b.isDeployedOnSmithery) {
      return a.isDeployedOnSmithery ? -1 : 1;
    }
    // Verified servers next
    if (a.isVerified !== b.isVerified) {
      return a.isVerified ? -1 : 1;
    }
    // Security scan passed
    if (a.security?.scanPassed !== b.security?.scanPassed) {
      return a.security?.scanPassed ? -1 : 1;
    }
    // Higher use count
    return (b.useCount || 0) - (a.useCount || 0);
  });

  return sorted[0];
}

/**
 * Get npm install command for a server
 */
export function getInstallCommand(server: SmitheryServer): string {
  const name = server.qualifiedName;

  // Check for stdio connection with configSchema
  const stdioConnection = server.connections?.find(c => c.type === "stdio");

  if (stdioConnection) {
    // Use npx for most MCP servers
    return `npx -y ${name}`;
  }

  // For servers without stdio, use the qualified name
  return `npx -y ${name}`;
}

/**
 * Clear the search cache
 */
export function clearCache(): void {
  searchCache.clear();
}

/**
 * Required environment variable info extracted from configSchema
 */
export interface RequiredEnvVar {
  name: string;
  description: string;
  isRequired: boolean;
}

/**
 * Extract required environment variables from a server's configSchema
 * Smithery servers can have configSchema in their connection definitions
 */
export function extractRequiredEnvVars(server: SmitheryServer): RequiredEnvVar[] {
  const envVars: RequiredEnvVar[] = [];

  // Check each connection for configSchema
  for (const connection of server.connections || []) {
    if (!connection.configSchema) continue;

    const schema = connection.configSchema;
    const properties = schema.properties || {};
    const required = schema.required || [];

    for (const [propName, propDef] of Object.entries(properties)) {
      const prop = propDef as any;

      // Look for properties that look like env vars (uppercase with underscores)
      // or have descriptions mentioning "token", "key", "secret", etc.
      const isEnvVarLike = /^[A-Z][A-Z0-9_]+$/.test(propName);
      const descLower = (prop.description || "").toLowerCase();
      const isCredentialLike =
        descLower.includes("token") ||
        descLower.includes("api key") ||
        descLower.includes("secret") ||
        descLower.includes("password") ||
        descLower.includes("credential");

      if (isEnvVarLike || isCredentialLike) {
        envVars.push({
          name: propName,
          description: prop.description || `Configuration for ${propName}`,
          isRequired: required.includes(propName)
        });
      }
    }
  }

  return envVars;
}

/**
 * Check if a server requires credentials based on its configSchema
 */
export function serverRequiresCredentials(server: SmitheryServer): boolean {
  const envVars = extractRequiredEnvVars(server);
  return envVars.some(v => v.isRequired);
}

/**
 * Get friendly instructions for obtaining common API tokens
 */
export function getCredentialInstructions(varName: string): string {
  const instructions: Record<string, string> = {
    "GITHUB_PERSONAL_ACCESS_TOKEN": "Create at https://github.com/settings/tokens",
    "GITHUB_TOKEN": "Create at https://github.com/settings/tokens",
    "SLACK_BOT_TOKEN": "Create a Slack app at https://api.slack.com/apps",
    "SLACK_TOKEN": "Create a Slack app at https://api.slack.com/apps",
    "OPENAI_API_KEY": "Get from https://platform.openai.com/api-keys",
    "ANTHROPIC_API_KEY": "Get from https://console.anthropic.com/",
    "GEMINI_API_KEY": "Get from https://aistudio.google.com/app/apikey",
    "GOOGLE_API_KEY": "Get from https://console.cloud.google.com/apis/credentials",
    "AWS_ACCESS_KEY_ID": "Get from AWS IAM Console",
    "AWS_SECRET_ACCESS_KEY": "Get from AWS IAM Console",
    "FIREBASE_PROJECT_ID": "Get from https://console.firebase.google.com/",
    "SUPABASE_URL": "Get from your Supabase project settings",
    "SUPABASE_KEY": "Get from your Supabase project settings",
    "TODOIST_API_TOKEN": "Get from https://todoist.com/prefs/integrations (API token section)",
    "TODOIST_API_KEY": "Get from https://todoist.com/prefs/integrations (API token section)",
    "LINEAR_API_KEY": "Get from https://linear.app/settings/api",
    "NOTION_API_KEY": "Get from https://www.notion.so/my-integrations",
    "NOTION_TOKEN": "Get from https://www.notion.so/my-integrations",
    "TRELLO_API_KEY": "Get from https://trello.com/app-key",
    "ASANA_TOKEN": "Get from https://app.asana.com/0/developer-console"
  };

  return instructions[varName] || `Please provide your ${varName}`;
}

/**
 * Common env var names that servers typically need
 * Maps server name patterns to likely required env vars
 */
export const KNOWN_SERVER_ENV_VARS: Record<string, { name: string; description: string }[]> = {
  "todoist": [
    { name: "TODOIST_API_TOKEN", description: "Todoist API token for authentication" }
  ],
  "github": [
    { name: "GITHUB_PERSONAL_ACCESS_TOKEN", description: "GitHub personal access token" }
  ],
  "slack": [
    { name: "SLACK_BOT_TOKEN", description: "Slack bot token (xoxb-...)" }
  ],
  "notion": [
    { name: "NOTION_API_KEY", description: "Notion integration token" }
  ],
  "linear": [
    { name: "LINEAR_API_KEY", description: "Linear API key" }
  ],
  "openai": [
    { name: "OPENAI_API_KEY", description: "OpenAI API key" }
  ],
  "postgres": [
    { name: "DATABASE_URL", description: "PostgreSQL connection string" }
  ],
  "supabase": [
    { name: "SUPABASE_URL", description: "Supabase project URL" },
    { name: "SUPABASE_KEY", description: "Supabase anon/service key" }
  ]
};

/**
 * Infer required env vars from server name if schema doesn't provide them
 */
export function inferRequiredEnvVars(serverName: string): RequiredEnvVar[] {
  const nameLower = serverName.toLowerCase();

  for (const [pattern, vars] of Object.entries(KNOWN_SERVER_ENV_VARS)) {
    if (nameLower.includes(pattern)) {
      return vars.map(v => ({
        name: v.name,
        description: v.description,
        isRequired: true
      }));
    }
  }

  return [];
}

/**
 * Get all required env vars for a server (from schema + inference)
 */
export function getAllRequiredEnvVars(server: SmitheryServer): RequiredEnvVar[] {
  // First try to extract from configSchema
  let envVars = extractRequiredEnvVars(server);

  // If no env vars found in schema, try to infer from server name
  if (envVars.length === 0) {
    envVars = inferRequiredEnvVars(server.qualifiedName);
  }

  return envVars;
}
