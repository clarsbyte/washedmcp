/**
 * Realistic dummy data for development and testing.
 * Structured for future ChromaDB integration.
 */

import type { MCP, ContextNode, TeamMember } from '@/lib/types/data';

/**
 * 6 MCP servers representing common integrations
 */
export const DUMMY_MCPS: MCP[] = [
  {
    id: 'mcp-github',
    name: 'GitHub MCP',
    status: 'active',
    contextCount: 47,
    lastSync: new Date('2025-01-17T10:30:00'),
    connectionConfig: {
      endpoint: 'github.com/api/v4',
      protocol: 'HTTPS',
      autoSync: true,
    },
  },
  {
    id: 'mcp-notion',
    name: 'Notion MCP',
    status: 'active',
    contextCount: 32,
    lastSync: new Date('2025-01-17T10:25:00'),
    connectionConfig: {
      endpoint: 'api.notion.com/v1',
      protocol: 'HTTPS',
      autoSync: true,
    },
  },
  {
    id: 'mcp-slack',
    name: 'Slack MCP',
    status: 'inactive',
    contextCount: 89,
    lastSync: new Date('2025-01-16T15:45:00'),
    connectionConfig: {
      endpoint: 'slack.com/api',
      protocol: 'HTTPS',
      autoSync: false,
    },
  },
  {
    id: 'mcp-linear',
    name: 'Linear MCP',
    status: 'active',
    contextCount: 24,
    lastSync: new Date('2025-01-17T10:28:00'),
    connectionConfig: {
      endpoint: 'api.linear.app/graphql',
      protocol: 'HTTPS',
      autoSync: true,
    },
  },
  {
    id: 'mcp-memory',
    name: 'Memory MCP',
    status: 'active',
    contextCount: 156,
    lastSync: new Date('2025-01-17T10:32:00'),
    connectionConfig: {
      endpoint: 'localhost:3001',
      protocol: 'HTTP',
      autoSync: true,
    },
  },
  {
    id: 'mcp-filesystem',
    name: 'Filesystem MCP',
    status: 'error',
    contextCount: 12,
    lastSync: new Date('2025-01-15T08:00:00'),
    connectionConfig: {
      endpoint: 'localhost:3002',
      protocol: 'HTTP',
      autoSync: true,
    },
  },
];

/**
 * ~20 context items distributed across MCPs
 * Realistic tool call names and content
 */
export const DUMMY_CONTEXTS: ContextNode[] = [
  // GitHub MCP contexts
  {
    id: 'ctx-gh-001',
    mcpId: 'mcp-github',
    content: 'create_repository: washedmcp-frontend',
    freshness: 'fresh',
    timestamp: new Date('2025-01-17T10:30:00'),
    tokenCount: 1245,
    sourceMCP: 'GitHub MCP',
    isShared: true,
  },
  {
    id: 'ctx-gh-002',
    mcpId: 'mcp-github',
    content: 'list_pull_requests: open PRs in washedmcp/main',
    freshness: 'fresh',
    timestamp: new Date('2025-01-17T09:15:00'),
    tokenCount: 892,
    sourceMCP: 'GitHub MCP',
    isShared: false,
  },
  {
    id: 'ctx-gh-003',
    mcpId: 'mcp-github',
    content: 'get_file_contents: src/components/GraphView.tsx',
    freshness: 'fresh',
    timestamp: new Date('2025-01-17T08:45:00'),
    tokenCount: 3421,
    sourceMCP: 'GitHub MCP',
    isShared: true,
  },
  {
    id: 'ctx-gh-004',
    mcpId: 'mcp-github',
    content: 'search_issues: bug label:high-priority',
    freshness: 'outdated',
    timestamp: new Date('2025-01-10T14:20:00'),
    tokenCount: 567,
    sourceMCP: 'GitHub MCP',
    isShared: false,
  },

  // Notion MCP contexts
  {
    id: 'ctx-notion-001',
    mcpId: 'mcp-notion',
    content: 'search: Project roadmap Q1 2025',
    freshness: 'fresh',
    timestamp: new Date('2025-01-17T10:25:00'),
    tokenCount: 2156,
    sourceMCP: 'Notion MCP',
    isShared: true,
  },
  {
    id: 'ctx-notion-002',
    mcpId: 'mcp-notion',
    content: 'get_page: Architecture Decision Records',
    freshness: 'fresh',
    timestamp: new Date('2025-01-16T16:30:00'),
    tokenCount: 4521,
    sourceMCP: 'Notion MCP',
    isShared: true,
  },
  {
    id: 'ctx-notion-003',
    mcpId: 'mcp-notion',
    content: 'query_database: Sprint backlog items',
    freshness: 'outdated',
    timestamp: new Date('2025-01-08T11:00:00'),
    tokenCount: 1876,
    sourceMCP: 'Notion MCP',
    isShared: false,
  },

  // Slack MCP contexts
  {
    id: 'ctx-slack-001',
    mcpId: 'mcp-slack',
    content: 'search_messages: #engineering deployment',
    freshness: 'deprecated',
    timestamp: new Date('2024-12-15T09:30:00'),
    tokenCount: 3245,
    sourceMCP: 'Slack MCP',
    isShared: false,
  },
  {
    id: 'ctx-slack-002',
    mcpId: 'mcp-slack',
    content: 'get_channel_history: #general last 50 messages',
    freshness: 'deprecated',
    timestamp: new Date('2024-12-10T14:15:00'),
    tokenCount: 5678,
    sourceMCP: 'Slack MCP',
    isShared: true,
  },
  {
    id: 'ctx-slack-003',
    mcpId: 'mcp-slack',
    content: 'list_users: workspace members',
    freshness: 'deprecated',
    timestamp: new Date('2024-11-28T10:00:00'),
    tokenCount: 1234,
    sourceMCP: 'Slack MCP',
    isShared: false,
  },

  // Linear MCP contexts
  {
    id: 'ctx-linear-001',
    mcpId: 'mcp-linear',
    content: 'list_issues: Frontend sprint 42',
    freshness: 'fresh',
    timestamp: new Date('2025-01-17T10:28:00'),
    tokenCount: 2341,
    sourceMCP: 'Linear MCP',
    isShared: true,
  },
  {
    id: 'ctx-linear-002',
    mcpId: 'mcp-linear',
    content: 'get_project: Clean MCP Dashboard',
    freshness: 'fresh',
    timestamp: new Date('2025-01-17T09:00:00'),
    tokenCount: 1567,
    sourceMCP: 'Linear MCP',
    isShared: false,
  },
  {
    id: 'ctx-linear-003',
    mcpId: 'mcp-linear',
    content: 'create_issue: Implement ChromaDB migration',
    freshness: 'fresh',
    timestamp: new Date('2025-01-16T17:45:00'),
    tokenCount: 456,
    sourceMCP: 'Linear MCP',
    isShared: true,
  },

  // Memory MCP contexts
  {
    id: 'ctx-mem-001',
    mcpId: 'mcp-memory',
    content: 'store_memory: User prefers dark mode',
    freshness: 'fresh',
    timestamp: new Date('2025-01-17T10:32:00'),
    tokenCount: 128,
    sourceMCP: 'Memory MCP',
    isShared: false,
  },
  {
    id: 'ctx-mem-002',
    mcpId: 'mcp-memory',
    content: 'store_memory: Project uses Tailwind CSS v4',
    freshness: 'fresh',
    timestamp: new Date('2025-01-17T10:31:00'),
    tokenCount: 256,
    sourceMCP: 'Memory MCP',
    isShared: true,
  },
  {
    id: 'ctx-mem-003',
    mcpId: 'mcp-memory',
    content: 'retrieve_memory: Authentication flow patterns',
    freshness: 'fresh',
    timestamp: new Date('2025-01-17T10:30:00'),
    tokenCount: 512,
    sourceMCP: 'Memory MCP',
    isShared: false,
  },
  {
    id: 'ctx-mem-004',
    mcpId: 'mcp-memory',
    content: 'list_memories: coding preferences',
    freshness: 'outdated',
    timestamp: new Date('2025-01-05T08:00:00'),
    tokenCount: 1024,
    sourceMCP: 'Memory MCP',
    isShared: false,
  },

  // Filesystem MCP contexts
  {
    id: 'ctx-fs-001',
    mcpId: 'mcp-filesystem',
    content: 'read_file: /Users/dev/project/README.md',
    freshness: 'deprecated',
    timestamp: new Date('2025-01-15T08:00:00'),
    tokenCount: 2048,
    sourceMCP: 'Filesystem MCP',
    isShared: false,
  },
  {
    id: 'ctx-fs-002',
    mcpId: 'mcp-filesystem',
    content: 'list_directory: /Users/dev/project/src',
    freshness: 'deprecated',
    timestamp: new Date('2025-01-14T16:30:00'),
    tokenCount: 768,
    sourceMCP: 'Filesystem MCP',
    isShared: true,
  },
];

/**
 * 5 team members with various roles
 */
export const DUMMY_TEAM_MEMBERS: TeamMember[] = [
  {
    id: 'user-001',
    name: 'Alex Chen',
    email: 'alex@example.com',
    role: 'owner',
    lastActive: new Date('2025-01-17T10:30:00'),
    syncStatus: 'synced',
  },
  {
    id: 'user-002',
    name: 'Sarah Johnson',
    email: 'sarah@example.com',
    role: 'admin',
    lastActive: new Date('2025-01-17T09:15:00'),
    syncStatus: 'syncing',
  },
  {
    id: 'user-003',
    name: 'Michael Rodriguez',
    email: 'michael@example.com',
    role: 'member',
    lastActive: new Date('2025-01-16T16:45:00'),
    syncStatus: 'synced',
  },
  {
    id: 'user-004',
    name: 'Emily Watson',
    email: 'emily@example.com',
    role: 'member',
    lastActive: new Date('2025-01-15T14:20:00'),
    syncStatus: 'offline',
  },
  {
    id: 'user-005',
    name: 'David Kim',
    email: 'david@example.com',
    role: 'member',
    lastActive: new Date('2025-01-17T11:00:00'),
    syncStatus: 'synced',
  },
];
