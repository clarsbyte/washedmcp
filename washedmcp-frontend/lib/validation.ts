import { z } from 'zod';

// MCP Schemas
export const mcpSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'MCP name is required'),
  status: z.enum(['active', 'inactive', 'error']),
  connectionConfig: z.record(z.string(), z.any()).optional(),
  lastSync: z.date().optional(),
  contextCount: z.number().int().nonnegative().optional(),
});

export const createMCPSchema = z.object({
  name: z.string().min(1, 'MCP name is required').max(100, 'Name too long'),
  connectionConfig: z.record(z.string(), z.any()),
});

// Context Schemas
export const contextSchema = z.object({
  id: z.string(),
  content: z.string().min(1, 'Content is required'),
  source_mcp: z.string(),
  user_id: z.string().optional(),
  timestamp: z.date(),
  token_count: z.number().int().nonnegative().optional(),
  freshness_status: z.enum(['fresh', 'outdated', 'deprecated']).optional(),
  is_shared: z.boolean().optional(),
});

export const updateContextSchema = z.object({
  content: z.string().min(1, 'Content is required').optional(),
  is_shared: z.boolean().optional(),
});

// User/Team Member Schemas
export const userSchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email address'),
  last_active: z.date().optional(),
  sync_status: z.enum(['online', 'offline', 'away']).optional(),
  avatar_gradient: z.tuple([z.string(), z.string()]).optional(),
});

export const inviteMemberSchema = z.object({
  email: z.string().email('Invalid email address'),
  role: z.enum(['admin', 'member', 'viewer']).optional(),
  expiresInDays: z.number().int().positive().max(30).optional(),
});

// Settings Schemas
export const projectSettingsSchema = z.object({
  name: z.string().min(1, 'Project name is required').max(100, 'Name too long'),
  description: z.string().max(500, 'Description too long').optional(),
  created_at: z.date().optional(),
  project_id: z.string().optional(),
});

export const databaseSettingsSchema = z.object({
  connection_string: z.string().url('Invalid connection string').optional(),
  host: z.string().optional(),
  port: z.number().int().positive().optional(),
  protocol: z.string().optional(),
  ssl_enabled: z.boolean().optional(),
});

export const apiKeySchema = z.object({
  key: z.string().min(10, 'API key is required'),
  created_at: z.date().optional(),
  last_used: z.date().optional(),
});

// Form Schemas (for client-side validation)
export const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
});

export const signupSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name too long'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

// Search/Filter Schemas
export const searchContextSchema = z.object({
  query: z.string().optional(),
  source_mcp: z.string().optional(),
  freshness: z.enum(['fresh', 'outdated', 'deprecated', 'all']).optional(),
  start_date: z.date().optional(),
  end_date: z.date().optional(),
  limit: z.number().int().positive().max(1000).optional(),
  offset: z.number().int().nonnegative().optional(),
});

// Type exports
export type MCP = z.infer<typeof mcpSchema>;
export type CreateMCP = z.infer<typeof createMCPSchema>;
export type Context = z.infer<typeof contextSchema>;
export type UpdateContext = z.infer<typeof updateContextSchema>;
export type User = z.infer<typeof userSchema>;
export type InviteMember = z.infer<typeof inviteMemberSchema>;
export type ProjectSettings = z.infer<typeof projectSettingsSchema>;
export type DatabaseSettings = z.infer<typeof databaseSettingsSchema>;
export type APIKey = z.infer<typeof apiKeySchema>;
export type Login = z.infer<typeof loginSchema>;
export type Signup = z.infer<typeof signupSchema>;
export type SearchContext = z.infer<typeof searchContextSchema>;
