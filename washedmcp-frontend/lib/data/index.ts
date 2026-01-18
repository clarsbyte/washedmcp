/**
 * Data Access Layer
 *
 * Async functions that return dummy data.
 * Designed to be replaced with ChromaDB queries in the future.
 */

import type { MCP, ContextNode, TeamMember, GraphDataResponse } from '@/lib/types/data';
import { DUMMY_MCPS, DUMMY_CONTEXTS, DUMMY_TEAM_MEMBERS } from './dummy-data';

/**
 * Get all MCP servers
 */
export async function getMCPs(): Promise<MCP[]> {
  // Simulate async database call
  await new Promise(resolve => setTimeout(resolve, 50));
  return [...DUMMY_MCPS];
}

/**
 * Get a single MCP by ID
 */
export async function getMCPById(id: string): Promise<MCP | null> {
  await new Promise(resolve => setTimeout(resolve, 30));
  return DUMMY_MCPS.find(mcp => mcp.id === id) || null;
}

/**
 * Get all context items
 */
export async function getContexts(): Promise<ContextNode[]> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return [...DUMMY_CONTEXTS];
}

/**
 * Get contexts filtered by MCP ID
 */
export async function getContextsByMCP(mcpId: string): Promise<ContextNode[]> {
  await new Promise(resolve => setTimeout(resolve, 30));
  return DUMMY_CONTEXTS.filter(ctx => ctx.mcpId === mcpId);
}

/**
 * Get a single context by ID
 */
export async function getContextById(id: string): Promise<ContextNode | null> {
  await new Promise(resolve => setTimeout(resolve, 30));
  return DUMMY_CONTEXTS.find(ctx => ctx.id === id) || null;
}

/**
 * Search contexts by query string
 * Searches content and sourceMCP fields
 */
export async function searchContexts(query: string): Promise<ContextNode[]> {
  await new Promise(resolve => setTimeout(resolve, 50));

  if (!query || query.trim() === '') {
    return [...DUMMY_CONTEXTS];
  }

  const lowerQuery = query.toLowerCase();
  return DUMMY_CONTEXTS.filter(ctx =>
    ctx.content.toLowerCase().includes(lowerQuery) ||
    (ctx.sourceMCP?.toLowerCase().includes(lowerQuery))
  );
}

/**
 * Get all team members
 */
export async function getTeamMembers(): Promise<TeamMember[]> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return [...DUMMY_TEAM_MEMBERS];
}

/**
 * Get a team member by ID
 */
export async function getTeamMemberById(id: string): Promise<TeamMember | null> {
  await new Promise(resolve => setTimeout(resolve, 30));
  return DUMMY_TEAM_MEMBERS.find(member => member.id === id) || null;
}

/**
 * Get combined graph data (MCPs and contexts)
 * Used by the dashboard visualization
 */
export async function getGraphData(): Promise<GraphDataResponse> {
  await new Promise(resolve => setTimeout(resolve, 50));
  return {
    mcps: [...DUMMY_MCPS],
    contexts: [...DUMMY_CONTEXTS],
  };
}

/**
 * Get graph data filtered by MCP
 * Used when zooming into a specific MCP node
 */
export async function getGraphDataForMCP(mcpId: string): Promise<GraphDataResponse> {
  await new Promise(resolve => setTimeout(resolve, 30));

  const mcp = DUMMY_MCPS.find(m => m.id === mcpId);
  const contexts = DUMMY_CONTEXTS.filter(ctx => ctx.mcpId === mcpId);

  return {
    mcps: mcp ? [mcp] : [],
    contexts,
  };
}

/**
 * Export types for convenience
 */
export type { MCP, ContextNode, TeamMember, GraphDataResponse } from '@/lib/types/data';
