'use client';

export type SettingsData = {
  projectName?: string;
};

export function useSettingsData() {
  const settings: SettingsData = {};
  const loading = false;

  return { settings, loading };
}
