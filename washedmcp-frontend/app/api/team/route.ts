import { NextResponse } from 'next/server';
import { getTeamMembers, getTeamMemberById } from '@/lib/data';
import type { TeamMemberApiResponse } from '@/lib/types/data';

/**
 * GET /api/team
 * Fetches team members
 * Query params:
 *   - id: Get a specific team member by ID
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    // Get specific team member by ID
    if (id) {
      const member = await getTeamMemberById(id);

      if (!member) {
        return NextResponse.json(
          { error: 'Team member not found' },
          { status: 404 }
        );
      }

      const response: TeamMemberApiResponse = {
        ...member,
        lastActive: member.lastActive.toISOString(),
      };

      return NextResponse.json(response);
    }

    // Get all team members
    const members = await getTeamMembers();

    const response: TeamMemberApiResponse[] = members.map(member => ({
      ...member,
      lastActive: member.lastActive.toISOString(),
    }));

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching team members:', error);
    return NextResponse.json(
      { error: 'Failed to fetch team members', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
