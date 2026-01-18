/**
 * Capability Detection Module
 * Two-tier system: Gemini AI (primary) + Keyword matching (fallback)
 */

import { GoogleGenerativeAI } from "@google/generative-ai";

// Capability categories mapped to keywords
const CAPABILITY_KEYWORDS: Record<string, string[]> = {
  "browser-automation": [
    "screenshot", "scrape", "browser", "web", "navigate", "click", "playwright",
    "selenium", "puppeteer", "webpage", "website", "html", "dom", "element"
  ],
  "database": [
    "database", "sql", "query", "postgres", "postgresql", "mysql", "sqlite",
    "mongodb", "redis", "select", "insert", "update", "delete", "table"
  ],
  "github": [
    "github", "repo", "repository", "pr", "pull request", "issue", "commit",
    "branch", "merge", "git", "code review", "fork", "star"
  ],
  "gitlab": [
    "gitlab", "merge request", "pipeline", "ci/cd"
  ],
  "slack": [
    "slack", "message", "channel", "dm", "direct message", "workspace", "thread"
  ],
  "filesystem": [
    "file", "read", "write", "directory", "folder", "create", "delete",
    "move", "copy", "rename", "path", "disk"
  ],
  "search": [
    "search", "lookup", "find", "google", "brave", "bing", "web search"
  ],
  "aws": [
    "aws", "amazon", "s3", "lambda", "ec2", "dynamodb", "cloudwatch", "sns", "sqs"
  ],
  "gcp": [
    "gcp", "google cloud", "bigquery", "cloud storage", "compute engine"
  ],
  "azure": [
    "azure", "microsoft", "blob storage", "cosmos"
  ],
  "email": [
    "email", "gmail", "outlook", "send mail", "inbox", "smtp"
  ],
  "notion": [
    "notion", "page", "database", "block", "workspace"
  ],
  "jira": [
    "jira", "ticket", "sprint", "backlog", "story", "epic"
  ],
  "api": [
    "api", "rest", "graphql", "endpoint", "fetch", "request", "response"
  ],
  "docker": [
    "docker", "container", "image", "kubernetes", "k8s", "pod"
  ],
  "ai": [
    "ai", "llm", "gpt", "claude", "openai", "anthropic", "embedding", "vector"
  ]
};

// Capability to Smithery search terms mapping
export const CAPABILITY_SEARCH_TERMS: Record<string, string[]> = {
  "browser-automation": ["playwright", "puppeteer", "browser", "screenshot"],
  "database": ["postgres", "mysql", "sqlite", "database"],
  "github": ["github"],
  "gitlab": ["gitlab"],
  "slack": ["slack"],
  "filesystem": ["filesystem", "file"],
  "search": ["brave-search", "search"],
  "aws": ["aws", "s3"],
  "gcp": ["gcp", "google-cloud"],
  "azure": ["azure"],
  "email": ["gmail", "email"],
  "notion": ["notion"],
  "jira": ["jira", "atlassian"],
  "api": ["rest", "api", "fetch"],
  "docker": ["docker", "kubernetes"],
  "ai": ["openai", "anthropic", "llm"]
};

export interface DetectionResult {
  capabilities: string[];
  confidence: number;
  suggestedServers: string[];
  method: "gemini" | "keyword";
}

/**
 * Detect capabilities using Gemini AI
 */
export async function detectWithGemini(task: string): Promise<DetectionResult | null> {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.log("[Capabilities] No GEMINI_API_KEY, falling back to keywords");
    return null;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Analyze this task and identify what MCP (Model Context Protocol) server capabilities are needed.

Task: "${task}"

Available capability categories:
- browser-automation (screenshots, web scraping, clicking elements)
- database (SQL queries, postgres, mysql, mongodb)
- github (repos, PRs, issues, commits)
- gitlab (merge requests, pipelines)
- slack (messages, channels)
- filesystem (read/write files, directories)
- search (web search, lookup)
- aws (S3, Lambda, EC2)
- gcp (BigQuery, Cloud Storage)
- azure (Blob Storage, Cosmos)
- email (Gmail, sending emails)
- notion (pages, databases)
- jira (tickets, sprints)
- api (REST calls, GraphQL)
- docker (containers, kubernetes)
- ai (LLM calls, embeddings)

Respond with ONLY a JSON object in this exact format:
{
  "capabilities": ["capability1", "capability2"],
  "confidence": 0.95,
  "suggested_servers": ["@playwright/mcp-playwright", "@other/server"]
}

If no clear capability is detected, use "general" as the capability.`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Extract JSON from response
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      console.log("[Capabilities] Could not parse Gemini response");
      return null;
    }

    const parsed = JSON.parse(jsonMatch[0]);

    return {
      capabilities: parsed.capabilities || ["general"],
      confidence: parsed.confidence || 0.5,
      suggestedServers: parsed.suggested_servers || [],
      method: "gemini"
    };
  } catch (error) {
    console.error("[Capabilities] Gemini detection error:", error);
    return null;
  }
}

/**
 * Detect capabilities using keyword matching (fallback)
 */
export function detectWithKeywords(task: string): DetectionResult {
  const taskLower = task.toLowerCase();
  const detectedCapabilities: string[] = [];
  let totalMatches = 0;

  for (const [capability, keywords] of Object.entries(CAPABILITY_KEYWORDS)) {
    const matches = keywords.filter(kw => taskLower.includes(kw.toLowerCase()));
    if (matches.length > 0) {
      detectedCapabilities.push(capability);
      totalMatches += matches.length;
    }
  }

  // Calculate confidence based on match density
  const words = task.split(/\s+/).length;
  const confidence = Math.min(0.9, totalMatches / words + 0.3);

  if (detectedCapabilities.length === 0) {
    detectedCapabilities.push("general");
  }

  return {
    capabilities: detectedCapabilities,
    confidence,
    suggestedServers: [],
    method: "keyword"
  };
}

/**
 * Main capability detection function
 * Tries Gemini first, falls back to keywords
 */
export async function detectCapabilities(task: string): Promise<DetectionResult> {
  // Try Gemini first
  const geminiResult = await detectWithGemini(task);
  if (geminiResult && geminiResult.confidence > 0.5) {
    return geminiResult;
  }

  // Fall back to keyword matching
  const keywordResult = detectWithKeywords(task);

  // If Gemini had some results, merge them
  if (geminiResult) {
    const mergedCapabilities = [...new Set([
      ...geminiResult.capabilities,
      ...keywordResult.capabilities
    ])];
    return {
      capabilities: mergedCapabilities,
      confidence: Math.max(geminiResult.confidence, keywordResult.confidence),
      suggestedServers: geminiResult.suggestedServers,
      method: "gemini"
    };
  }

  return keywordResult;
}

/**
 * Get Smithery search terms for detected capabilities
 */
export function getSearchTermsForCapabilities(capabilities: string[]): string[] {
  const searchTerms: string[] = [];

  for (const cap of capabilities) {
    const terms = CAPABILITY_SEARCH_TERMS[cap];
    if (terms) {
      searchTerms.push(...terms);
    }
  }

  return [...new Set(searchTerms)];
}
