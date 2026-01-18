/**
 * Skeleton Components Index
 * Exports all skeleton loading states for easy importing
 *
 * @example
 * ```tsx
 * import { GraphSkeleton, MCPCardSkeleton } from '@/components/skeletons';
 * ```
 */

// Base skeleton components
export { Skeleton, SkeletonGroup, SkeletonText } from '../Skeleton';

// Graph skeletons
export { GraphSkeleton, EmptyGraphSkeleton } from './GraphSkeleton';

// MCP card skeletons
export {
  MCPCardSkeleton,
  MCPCardGridSkeleton,
  MCPCardExpandedSkeleton,
} from './MCPCardSkeleton';

// Context table skeletons
export {
  ContextTableSkeleton,
  ContextTableHeaderSkeleton,
  ContextTableWithHeaderSkeleton,
  ContextDetailModalSkeleton,
} from './ContextTableSkeleton';

// Sidebar skeletons
export {
  SidebarSkeleton,
  CollapsedSidebarSkeleton,
  SidebarNavItemSkeleton,
} from './SidebarSkeleton';

// Team skeletons
export {
  TeamMemberCardSkeleton,
  TeamMemberListSkeleton,
  InviteMemberModalSkeleton,
} from './TeamSkeleton';

// Settings skeletons
export {
  SettingsSectionSkeleton,
  SettingsPageSkeleton,
} from './SettingsSkeleton';
