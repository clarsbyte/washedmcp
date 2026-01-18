/**
 * Centralized data types for the application.
 * These types are designed to be compatible with future ChromaDB integration.
 */

export interface MCP {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  contextCount: number;
  lastSync?: Date;
  connectionConfig?: {
    endpoint?: string;
    protocol?: string;
    autoSync?: boolean;
  };
}

export interface ContextNode {
  id: string;
  mcpId: string;
  content: string;
  freshness: 'fresh' | 'outdated' | 'deprecated';
  timestamp?: Date;
  tokenCount?: number;
  sourceMCP?: string;
  isShared?: boolean;
}

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  lastActive: Date;
  syncStatus: 'synced' | 'syncing' | 'offline';
}

export interface GraphDataResponse {
  mcps: MCP[];
  contexts: ContextNode[];
}

/**
 * API response types - these serialize Date objects to ISO strings
 */
export interface MCPApiResponse {
  id: string;
  name: string;
  status: 'active' | 'inactive' | 'error';
  contextCount: number;
  lastSync?: string;
  connectionConfig?: {
    endpoint?: string;
    protocol?: string;
    autoSync?: boolean;
  };
}

export interface ContextApiResponse {
  id: string;
  mcpId: string;
  content: string;
  freshness: 'fresh' | 'outdated' | 'deprecated';
  timestamp?: string;
  tokenCount?: number;
  sourceMCP?: string;
  isShared?: boolean;
}

export interface TeamMemberApiResponse {
  id: string;
  name: string;
  email: string;
  role: 'owner' | 'admin' | 'member';
  lastActive: string;
  syncStatus: 'synced' | 'syncing' | 'offline';
}

export interface GraphApiResponse {
  mcps: MCPApiResponse[];
  contexts: ContextApiResponse[];
}
