'use client';

export type ContextItem = {
  id: string;
  content?: string;
};

export function useContextData() {
  const contexts: ContextItem[] = [];
  const loading = false;

  return { contexts, loading };
}
