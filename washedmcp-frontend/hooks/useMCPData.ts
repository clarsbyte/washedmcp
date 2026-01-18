'use client';

export type MCPItem = {
  id: string;
  name: string;
  status?: string;
};

export function useMCPData() {
  const mcps: MCPItem[] = [];
  const loading = false;

  return { mcps, loading };
}
