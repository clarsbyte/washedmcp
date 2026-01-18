import { NextResponse } from 'next/server';
import { getMCPs, getMCPById } from '@/lib/data';
import type { MCPApiResponse } from '@/lib/types/data';

/**
 * GET /api/mcps
 * Fetches all MCP servers
 * Query params:
 *   - id: Get a specific MCP by ID
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
      // Get specific MCP by ID
      const mcp = await getMCPById(id);

      if (!mcp) {
        return NextResponse.json(
          { error: 'MCP not found' },
          { status: 404 }
        );
      }

      const response: MCPApiResponse = {
        ...mcp,
        lastSync: mcp.lastSync?.toISOString(),
      };

      return NextResponse.json(response);
    }

    // Get all MCPs
    const mcps = await getMCPs();

    const response: MCPApiResponse[] = mcps.map(mcp => ({
      ...mcp,
      lastSync: mcp.lastSync?.toISOString(),
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching MCPs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch MCPs', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
