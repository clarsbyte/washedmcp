import { NextResponse } from 'next/server';
import { getGraphData } from '@/lib/data';
import type { GraphApiResponse } from '@/lib/types/data';

/**
 * GET /api/graph
 * Fetches graph data for visualization
 * Returns MCPs and their associated contexts
 */
export async function GET() {
  try {
    const data = await getGraphData();

    // Transform to API response format (serialize Dates to ISO strings)
    const response: GraphApiResponse = {
      mcps: data.mcps.map(mcp => ({
        ...mcp,
        lastSync: mcp.lastSync?.toISOString(),
      })),
      contexts: data.contexts.map(ctx => ({
        ...ctx,
        timestamp: ctx.timestamp?.toISOString(),
      })),
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching graph data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch graph data', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
