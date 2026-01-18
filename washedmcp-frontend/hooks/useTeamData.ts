'use client';

export type TeamMember = {
  id: string;
  name: string;
  email?: string;
};

export function useTeamData() {
  const members: TeamMember[] = [];
  const loading = false;

  return { members, loading };
}
