import { NextResponse } from 'next/server';
import { getContexts, getContextsByMCP, searchContexts, getContextById } from '@/lib/data';
import type { ContextApiResponse } from '@/lib/types/data';

/**
 * GET /api/contexts
 * Fetches context items
 * Query params:
 *   - id: Get a specific context by ID
 *   - mcpId: Filter contexts by MCP ID
 *   - q: Search query string
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');
    const mcpId = searchParams.get('mcpId');
    const query = searchParams.get('q');

    // Get specific context by ID
    if (id) {
      const context = await getContextById(id);

      if (!context) {
        return NextResponse.json(
          { error: 'Context not found' },
          { status: 404 }
        );
      }

      const response: ContextApiResponse = {
        ...context,
        timestamp: context.timestamp?.toISOString(),
      };

      return NextResponse.json(response);
    }

    let contexts;

    // Filter by MCP ID
    if (mcpId) {
      contexts = await getContextsByMCP(mcpId);
    }
    // Search by query
    else if (query) {
      contexts = await searchContexts(query);
    }
    // Get all contexts
    else {
      contexts = await getContexts();
    }

    const response: ContextApiResponse[] = contexts.map(ctx => ({
      ...ctx,
      timestamp: ctx.timestamp?.toISOString(),
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching contexts:', error);
    return NextResponse.json(
      { error: 'Failed to fetch contexts', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
