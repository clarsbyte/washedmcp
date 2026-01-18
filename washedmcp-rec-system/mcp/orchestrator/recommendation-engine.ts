/**
 * AI-Powered Recommendation Engine
 * Uses Gemini for intelligent MCP server recommendations
 */

import { GoogleGenerativeAI } from "@google/generative-ai";
import { searchSmithery, SmitheryServer } from "./smithery.js";

export interface RankedServer {
  server: SmitheryServer;
  score: number;
  reasoning: string;
  matchedKeywords: string[];
}

export interface RecommendationResult {
  success: boolean;
  query: string;
  recommendations: RankedServer[];
  method: "gemini" | "keyword";
  confidence: number;
  searchKeywords: string[];
  error?: string;
}

/**
 * Extract search keywords from natural language using Gemini AI
 */
export async function extractSearchKeywords(query: string): Promise<{
  keywords: string[];
  method: "gemini" | "keyword";
}> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log("[RecommendationEngine] No GEMINI_API_KEY, using keyword extraction");
    return {
      keywords: extractKeywordsWithHeuristics(query),
      method: "keyword"
    };
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    const prompt = `Extract search keywords for finding MCP (Model Context Protocol) servers based on this user request.

User request: "${query}"

Return ONLY a JSON array of 3-5 search keywords that would help find relevant MCP servers in a registry.
Focus on:
- Tool/service names (github, slack, playwright, postgres, etc.)
- Action types (screenshot, database, message, search, etc.)
- Technology categories (browser, automation, api, cloud, etc.)

Example responses:
- "I need to take screenshots of websites" → ["playwright", "browser", "screenshot", "automation"]
- "Query my postgres database" → ["postgres", "database", "sql", "postgresql"]
- "Send slack messages" → ["slack", "messaging", "communication"]

Return ONLY the JSON array, no other text:`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Extract JSON array from response
    const jsonMatch = response.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      console.log("[RecommendationEngine] Could not parse Gemini response, using fallback");
      return {
        keywords: extractKeywordsWithHeuristics(query),
        method: "keyword"
      };
    }

    const keywords = JSON.parse(jsonMatch[0]);

    return {
      keywords: keywords.slice(0, 5),
      method: "gemini"
    };
  } catch (error) {
    console.error("[RecommendationEngine] Gemini keyword extraction error:", error);
    return {
      keywords: extractKeywordsWithHeuristics(query),
      method: "keyword"
    };
  }
}

/**
 * Fallback keyword extraction using heuristics
 */
function extractKeywordsWithHeuristics(query: string): string[] {
  const keywords: string[] = [];
  const queryLower = query.toLowerCase();

  // Service/tool keywords
  const serviceKeywords: Record<string, string[]> = {
    github: ["github", "git", "repo", "repository", "pr", "pull request", "issue", "commit"],
    gitlab: ["gitlab", "merge request", "pipeline"],
    slack: ["slack", "message", "channel", "dm", "workspace"],
    playwright: ["screenshot", "browser", "scrape", "web page", "website", "automate browser"],
    postgres: ["postgres", "postgresql", "database", "sql", "query"],
    mysql: ["mysql", "database", "sql"],
    mongodb: ["mongo", "mongodb", "nosql", "document"],
    redis: ["redis", "cache", "key value"],
    notion: ["notion", "page", "database", "workspace"],
    linear: ["linear", "ticket", "issue", "sprint"],
    jira: ["jira", "ticket", "sprint", "backlog"],
    todoist: ["todoist", "task", "todo"],
    openai: ["openai", "gpt", "chat", "completion", "embedding"],
    anthropic: ["anthropic", "claude", "llm"],
    aws: ["aws", "amazon", "s3", "lambda", "ec2"],
    gcp: ["gcp", "google cloud", "bigquery"],
    azure: ["azure", "microsoft cloud"],
    docker: ["docker", "container", "kubernetes", "k8s"],
    filesystem: ["file", "read", "write", "directory", "folder"],
    search: ["search", "google", "brave", "web search"],
    email: ["email", "gmail", "mail", "send email"],
  };

  for (const [service, patterns] of Object.entries(serviceKeywords)) {
    if (patterns.some(p => queryLower.includes(p))) {
      keywords.push(service);
    }
  }

  // If no specific service found, extract significant words
  if (keywords.length === 0) {
    const stopWords = new Set([
      "i", "want", "need", "to", "the", "a", "an", "and", "or", "but", "in",
      "on", "at", "for", "with", "by", "from", "up", "about", "into", "over",
      "after", "can", "could", "would", "should", "will", "my", "me", "we",
      "our", "help", "please", "using", "use"
    ]);

    const words = queryLower
      .replace(/[^\w\s]/g, " ")
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    keywords.push(...words.slice(0, 5));
  }

  return [...new Set(keywords)];
}

/**
 * Rank servers by relevance using Gemini AI
 */
export async function rankRecommendations(
  query: string,
  servers: SmitheryServer[]
): Promise<RankedServer[]> {
  if (servers.length === 0) {
    return [];
  }

  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.log("[RecommendationEngine] No GEMINI_API_KEY, using heuristic ranking");
    return rankWithHeuristics(query, servers);
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

    // Prepare server summaries for the prompt
    const serverSummaries = servers.slice(0, 10).map((s, i) =>
      `${i + 1}. ${s.qualifiedName} - ${s.displayName}: ${s.description?.slice(0, 150) || "No description"}`
    ).join("\n");

    const prompt = `Rank these MCP servers by relevance to the user's request.

User request: "${query}"

Available servers:
${serverSummaries}

Return a JSON array with rankings. Each item should have:
- index: number (1-based, matching the list above)
- score: number (0-100, relevance score)
- reasoning: string (brief explanation, 10-20 words)

Only include servers with score > 30. Order by score descending.

Example response:
[{"index": 2, "score": 95, "reasoning": "Direct match for browser automation and screenshots"}, {"index": 5, "score": 60, "reasoning": "General web automation capability"}]

Return ONLY the JSON array:`;

    const result = await model.generateContent(prompt);
    const response = result.response.text();

    // Extract JSON array
    const jsonMatch = response.match(/\[[\s\S]*?\]/);
    if (!jsonMatch) {
      console.log("[RecommendationEngine] Could not parse Gemini ranking, using fallback");
      return rankWithHeuristics(query, servers);
    }

    const rankings = JSON.parse(jsonMatch[0]);

    // Map rankings back to servers
    const rankedServers: RankedServer[] = rankings
      .filter((r: any) => r.index > 0 && r.index <= servers.length)
      .map((r: any) => ({
        server: servers[r.index - 1],
        score: r.score / 100,
        reasoning: r.reasoning || "Matched user request",
        matchedKeywords: []
      }))
      .sort((a: RankedServer, b: RankedServer) => b.score - a.score);

    return rankedServers;
  } catch (error) {
    console.error("[RecommendationEngine] Gemini ranking error:", error);
    return rankWithHeuristics(query, servers);
  }
}

/**
 * Fallback heuristic ranking
 */
function rankWithHeuristics(query: string, servers: SmitheryServer[]): RankedServer[] {
  const queryLower = query.toLowerCase();
  const queryWords = queryLower.split(/\s+/);

  return servers
    .map(server => {
      const nameLower = server.qualifiedName.toLowerCase();
      const displayLower = server.displayName.toLowerCase();
      const descLower = (server.description || "").toLowerCase();

      let score = 0;
      const matchedKeywords: string[] = [];

      // Check for keyword matches
      for (const word of queryWords) {
        if (word.length < 3) continue;

        if (nameLower.includes(word)) {
          score += 0.3;
          matchedKeywords.push(word);
        }
        if (displayLower.includes(word)) {
          score += 0.2;
          matchedKeywords.push(word);
        }
        if (descLower.includes(word)) {
          score += 0.1;
          matchedKeywords.push(word);
        }
      }

      // Boost for verified servers
      if (server.isVerified) {
        score += 0.1;
      }

      // Boost for popular servers
      if (server.useCount > 1000) {
        score += 0.1;
      }

      // Boost for remote servers (easier to use)
      if (server.isDeployedOnSmithery) {
        score += 0.05;
      }

      return {
        server,
        score: Math.min(score, 1.0),
        reasoning: matchedKeywords.length > 0
          ? `Matched: ${[...new Set(matchedKeywords)].join(", ")}`
          : "General relevance",
        matchedKeywords: [...new Set(matchedKeywords)]
      };
    })
    .filter(r => r.score > 0.1)
    .sort((a, b) => b.score - a.score);
}

/**
 * Main recommendation flow
 * Combines keyword extraction, Smithery search, and AI ranking
 */
export async function recommendWithAI(query: string): Promise<RecommendationResult> {
  try {
    // Step 1: Extract search keywords
    const { keywords, method } = await extractSearchKeywords(query);

    if (keywords.length === 0) {
      return {
        success: false,
        query,
        recommendations: [],
        method,
        confidence: 0,
        searchKeywords: [],
        error: "Could not extract meaningful keywords from query"
      };
    }

    // Step 2: Search Smithery with each keyword
    const allServers: SmitheryServer[] = [];
    const seenServers = new Set<string>();

    for (const keyword of keywords.slice(0, 3)) {
      const results = await searchSmithery(keyword, { pageSize: 10 });
      for (const server of results.servers) {
        if (!seenServers.has(server.qualifiedName)) {
          seenServers.add(server.qualifiedName);
          allServers.push(server);
        }
      }
    }

    if (allServers.length === 0) {
      return {
        success: false,
        query,
        recommendations: [],
        method,
        confidence: 0,
        searchKeywords: keywords,
        error: "No servers found matching the search keywords"
      };
    }

    // Step 3: Rank servers by relevance
    const rankedServers = await rankRecommendations(query, allServers);

    // Calculate overall confidence
    const topScore = rankedServers.length > 0 ? rankedServers[0].score : 0;
    const confidence = topScore * (method === "gemini" ? 1.0 : 0.8);

    return {
      success: true,
      query,
      recommendations: rankedServers.slice(0, 5),
      method,
      confidence,
      searchKeywords: keywords
    };
  } catch (error) {
    console.error("[RecommendationEngine] Error in recommendWithAI:", error);
    return {
      success: false,
      query,
      recommendations: [],
      method: "keyword",
      confidence: 0,
      searchKeywords: [],
      error: `Recommendation failed: ${error instanceof Error ? error.message : String(error)}`
    };
  }
}

/**
 * Format recommendations for display
 */
export function formatRecommendations(result: RecommendationResult): string {
  if (!result.success || result.recommendations.length === 0) {
    return `No recommendations found for: "${result.query}"\n${result.error || ""}`;
  }

  const lines = [
    `# MCP Server Recommendations`,
    ``,
    `Query: "${result.query}"`,
    `Method: ${result.method} (confidence: ${(result.confidence * 100).toFixed(0)}%)`,
    `Search keywords: ${result.searchKeywords.join(", ")}`,
    ``,
  ];

  for (let i = 0; i < result.recommendations.length; i++) {
    const rec = result.recommendations[i];
    const server = rec.server;

    lines.push(`## ${i + 1}. ${server.displayName}`);
    lines.push(`**Name:** ${server.qualifiedName}`);
    lines.push(`**Score:** ${(rec.score * 100).toFixed(0)}%`);
    lines.push(`**Why:** ${rec.reasoning}`);
    if (server.description) {
      lines.push(`**Description:** ${server.description.slice(0, 200)}...`);
    }
    lines.push(`**Verified:** ${server.isVerified ? "Yes" : "No"} | **Remote:** ${server.isDeployedOnSmithery ? "Yes" : "No"} | **Users:** ${server.useCount || 0}`);
    lines.push(``);
  }

  lines.push(`## Next Steps`);
  lines.push(`Use \`installFromSmithery("${result.recommendations[0].server.qualifiedName}")\` to install the top recommendation.`);

  return lines.join("\n");
}
