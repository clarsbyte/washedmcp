export type FreshnessStatus = 'fresh' | 'outdated' | 'deprecated';

/**
 * Calculate freshness based on version difference
 * - Fresh: 0 versions behind
 * - Outdated: 1-2 versions behind
 * - Deprecated: 3+ versions behind
 */
export function calculateFreshness(versionDiff: number): FreshnessStatus {
  if (versionDiff === 0) return 'fresh';
  if (versionDiff <= 2) return 'outdated';
  return 'deprecated';
}

/**
 * Calculate freshness based on timestamp
 * - Fresh: Less than 7 days old
 * - Outdated: 7-30 days old
 * - Deprecated: More than 30 days old
 */
export function calculateFreshnessByTime(timestamp: Date): FreshnessStatus {
  const now = new Date();
  const diff = now.getTime() - timestamp.getTime();
  const days = diff / (1000 * 60 * 60 * 24);

  if (days < 7) return 'fresh';
  if (days <= 30) return 'outdated';
  return 'deprecated';
}

/**
 * Get color for freshness status (matching design system)
 */
export function getFreshnessColor(status: FreshnessStatus): string {
  switch (status) {
    case 'fresh':
      return '#10B981'; // --color-success
    case 'outdated':
      return '#F59E0B'; // --color-warning
    case 'deprecated':
      return '#EF4444'; // --color-error
  }
}

/**
 * Get background color class for freshness status
 */
export function getFreshnessBgClass(status: FreshnessStatus): string {
  switch (status) {
    case 'fresh':
      return 'bg-(--color-success)/10';
    case 'outdated':
      return 'bg-(--color-warning)/10';
    case 'deprecated':
      return 'bg-(--color-error)/10';
  }
}

/**
 * Get text color class for freshness status
 */
export function getFreshnessTextClass(status: FreshnessStatus): string {
  switch (status) {
    case 'fresh':
      return 'text-(--color-success)';
    case 'outdated':
      return 'text-(--color-warning)';
    case 'deprecated':
      return 'text-(--color-error)';
  }
}

/**
 * Get border color class for freshness status
 */
export function getFreshnessBorderClass(status: FreshnessStatus): string {
  switch (status) {
    case 'fresh':
      return 'border-(--color-success)/20';
    case 'outdated':
      return 'border-(--color-warning)/20';
    case 'deprecated':
      return 'border-(--color-error)/20';
  }
}

/**
 * Get human-readable label for freshness status
 */
export function getFreshnessLabel(status: FreshnessStatus): string {
  switch (status) {
    case 'fresh':
      return 'Fresh';
    case 'outdated':
      return 'Outdated';
    case 'deprecated':
      return 'Deprecated';
  }
}

/**
 * Get description for freshness status
 */
export function getFreshnessDescription(status: FreshnessStatus): string {
  switch (status) {
    case 'fresh':
      return 'Up to date';
    case 'outdated':
      return '1-2 versions behind';
    case 'deprecated':
      return '3+ versions behind';
  }
}

/**
 * Get all freshness config for a status
 */
export function getFreshnessConfig(status: FreshnessStatus) {
  return {
    status,
    color: getFreshnessColor(status),
    bgClass: getFreshnessBgClass(status),
    textClass: getFreshnessTextClass(status),
    borderClass: getFreshnessBorderClass(status),
    label: getFreshnessLabel(status),
    description: getFreshnessDescription(status),
  };
}
