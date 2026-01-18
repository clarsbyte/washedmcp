# CLAUDE.md — Project Context

This file provides essential context for AI agents working on this project.

---

## 🚨 CRITICAL: Always Research Latest Versions

**Before implementing ANY feature or installing ANY package:**

1. **Search for the LATEST version** of frameworks, libraries, and tools
2. **NEVER assume older versions** — always verify current releases
3. **Check breaking changes** between versions
4. **Use official documentation** for the most recent stable release
5. **Use Context7 to fetch official documentation** for accurate, up-to-date information

**Research pattern:**
```
"[package-name] latest version 2025"
"[framework] [version] migration guide"
"[tool] latest features"
```

**Use Context7 for documentation:**
```
@context7 [framework-name] [specific-topic]
```

Examples:
- `@context7 next.js app router`
- `@context7 framer-motion scroll animations`
- `@context7 tailwind css v4 configuration`
- `@context7 reagraph graph visualization`
- `@context7 neo4j javascript driver`

**If you find a NEWER version than what's in this file:**
- Use the newer version (unless explicitly pinned)
- Check migration guides via Context7
- Update patterns to match latest best practices

---

## Project Overview

**Name**: Clean  
**Description**: MCP (Model Context Protocol) visualization and management dashboard with node-based graph interface. Provides real-time context tracking, team collaboration, and database-backed storage.  
**Type**: Web Application

### Key Features
- **Landing Page**: Public-facing marketing site (handled separately)
- **Dashboard**: Interactive node graph visualization (Reagraph)
- MCP server management and configuration
- Context library with freshness tracking
- Team collaboration with real-time sync
- Neo4j database integration
- WebSocket real-time updates

### Application Structure
- **Landing Page** (`/`): Public, mobile-responsive marketing site
- **Dashboard** (`/dashboard`): Desktop-only authenticated application area

---

## Tech Stack

### Core
- **Next.js**: 16.0.5 (App Router, Turbopack default)
- **React**: 19.2.0
- **TypeScript**: 5.x
- **Node.js**: 20+ recommended

### Styling & UI
- **Tailwind CSS**: 4.x (CSS-first configuration)
- **shadcn/ui**: Latest (Card, Switch, Dialog, Button, Input, Table, Progress)
- **Radix UI**: Latest (via shadcn/ui)

### Animation & Graphics
- **Framer Motion**: Latest — Primary animation library
- **GSAP**: Latest — Complex timeline animations
- **Reagraph**: Latest — Graph visualization (CRITICAL: Research latest API)

### Data & Backend
- **Neo4j**: Latest JavaScript driver
  - Connection: Bolt protocol (`bolt://localhost:7687`)
  - OGM: `@neo4j/graphql-ogm`
- **WebSocket**: Real-time updates (native or library like Socket.io)

### Utilities
- **date-fns**: Date formatting
- **react-hook-form**: Form handling
- **zod**: Schema validation
- **@tanstack/react-table**: Data tables

### Linting & Formatting
- **ESLint**: 9.x
- **Prettier**: Latest

---

## 🎨 Design System (Granola-Inspired, Teal/Blue)

### Color Palette

**Core Colors:**
```css
@theme {
  /* Backgrounds */
  --color-background: #FAFBFC;
  --color-surface: #FFFFFF;
  --color-border: #E5EAEF;
  
  /* Accents (Teal/Blue Range) */
  --color-primary: #0EA5E9;
  --color-primary-hover: #0284C7;
  --color-secondary: #06B6D4;
  --color-tertiary: #14B8A6;
  
  /* Text */
  --color-text-primary: #1E293B;
  --color-text-secondary: #64748B;
  --color-text-tertiary: #94A3B8;
  
  /* Semantic */
  --color-success: #10B981;
  --color-warning: #F59E0B;
  --color-error: #EF4444;
  --color-info: #3B82F6;
  
  /* MCP Node Colors (cycle through for different MCPs) */
  --color-node-1: #0EA5E9;
  --color-node-2: #06B6D4;
  --color-node-3: #8B5CF6;
  --color-node-4: #EC4899;
  --color-node-5: #F59E0B;
  --color-node-6: #10B981;
  
  /* Context Node */
  --color-context-node: #64748B;
  
  /* Clean Central Node */
  --color-clean-node: #0EA5E9;
  --shadow-clean-glow: 0 0 40px oklch(from #0EA5E9 l c h / 0.4);
}
```

### Design Tokens

```css
@theme {
  /* Spacing */
  --font-sans: "Playfair Display", "SF Pro", ui-serif, Georgia, serif;
  
  /* Border Radius (minimal but present) */
  --radius-sm: 6px;
  --radius-md: 6px;
  --radius-lg: 6px;
  
  /* Shadows (minimal, subtle only) */
  --shadow-subtle: 0 1px 3px oklch(0 0 0 / 0.08);
  --shadow-modal: 0 8px 24px oklch(0 0 0 / 0.12);
  
  /* Transitions */
  --transition-fast: 150ms;
  --transition-base: 200ms;
  --transition-smooth: 300ms;
  --transition-graph: 800ms;
  --transition-sidebar: 400ms;
  
  /* Animation Easing */
  --ease-smooth: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Typography Scale
- **Headings**: Font-weight 600-700
- **Body**: Font-weight 400
- **Labels**: Font-weight 500
- **Line Height**: Generous (1.6-1.7 for body)

### Component Patterns
- **Cards**: White background, 1px border, 6px radius, subtle shadow
- **Buttons**: 6px radius, smooth hover transitions (200ms)
- **Inputs**: 44px height, 1px border, 6px radius, focus ring 3px with 20% opacity
- **Modals**: Scale in from 0.95, 300ms ease-out

---

## 🎨 State-of-the-Art UI & Animation (ALWAYS USE)

**These libraries should be your default choice for UI/UX:**

### Animation & Motion
- **Framer Motion** — Use for ALL animations, page transitions, gestures
  - Prefer `motion.*` components over plain HTML
  - Use `AnimatePresence` for exit animations
  - Leverage `useScroll`, `useTransform` for scroll effects
  - **CRITICAL**: Graph zoom/transitions need extra attention (800ms smooth)

### Graph Visualization
- **Reagraph** — Node graph visualization (dashboard only)
  - **MUST research latest API** before implementation
  - Configuration: Force-directed layout, curved edges
  - Custom theme matching color palette
  - Draggable, animated nodes

### Design Inspiration & Patterns
- **Mobbin** — Reference for mobile/web UI patterns
  - Study before building new features
  - Use for inspiration on interactions and flows
  - Especially important for landing page design

### Component Patterns
- **React Bits** — Modern React patterns and best practices
  - Use recommended patterns for state management
  - Follow component composition guidelines

### Additional Tools
- **GSAP** — For complex timeline animations
- **Auto-Animate** — For automatic list/layout animations

**Installation example:**
```bash
npm install framer-motion gsap reagraph
npm install @neo4j/graphql-ogm neo4j-driver
npm install @tanstack/react-table date-fns react-hook-form zod
```

**Default animation pattern:**
```tsx
import { motion } from 'framer-motion';

export function Component() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
    >
      Content
    </motion.div>
  );
}
```

---

## Critical: Tailwind CSS v4

**Tailwind v4 uses CSS-first configuration. There is NO `tailwind.config.js` or `tailwind.config.ts` file.**

### Configuration lives in `app/globals.css`:

```css
@import "tailwindcss";

@theme {
  --font-sans: "Playfair Display", "SF Pro", ui-serif, Georgia, serif;

  /* Clean Project Colors */
  --color-background: #FAFBFC;
  --color-surface: #FFFFFF;
  --color-border: #E5EAEF;
  --color-primary: #0EA5E9;
  --color-primary-hover: #0284C7;
  
  /* Custom Utilities */
  --shadow-subtle: 0 1px 3px oklch(0 0 0 / 0.08);
  --shadow-glow: 0 0 40px oklch(from #0EA5E9 l c h / 0.4);
}

@utility glass {
  background: oklch(1 0 0 / 0.05);
  backdrop-filter: blur(20px);
}
```

### Tailwind v4 syntax rules:

| Do this (v4) | Not this (v3) |
|--------------|---------------|
| `@import "tailwindcss"` | `@tailwind base; @tailwind components; @tailwind utilities;` |
| `@theme { --color-brand: #fff; }` | `tailwind.config.js → theme.extend.colors` |
| `@utility my-util { ... }` | `@layer utilities { .my-util { ... } }` |
| `bg-(--my-var)` | `bg-[var(--my-var)]` |
| `shadow-xs` | `shadow-sm` |
| `shadow-sm` | `shadow` |
| `rounded-xs` | `rounded-sm` |
| `rounded-sm` | `rounded` |
| `ring-3` | `ring` |

### PostCSS config (`postcss.config.mjs`):

```js
export default {
  plugins: {
    "@tailwindcss/postcss": {},
  },
};
```

**Important:** `postcss-import` and `autoprefixer` are NOT needed — Tailwind v4 handles them.

---

## Critical: Next.js 16

### Removed features:
- `next lint` command removed — use `eslint` directly
- `middleware.ts` deprecated — use `proxy.ts` instead

### Default behaviors:
- Turbopack is the default bundler (no flag needed)
- App Router is standard
- React 19.2 features available (View Transitions, useEffectEvent, Activity)

### Async params required in pages:

```tsx
// Correct (Next.js 16)
export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  return <div>{slug}</div>;
}

// Wrong (Next.js 15 style)
export default function Page({ params }: { params: { slug: string } }) {
  return <div>{params.slug}</div>;
}
```

---

## Critical: Neo4j Integration

### Connection Setup

```typescript
// lib/neo4j.ts
import neo4j from "neo4j-driver";

const driver = neo4j.driver(
  "bolt://localhost:7687",
  neo4j.auth.basic("username", "password")
);

export default driver;
```

### Using with GraphQL OGM

```typescript
import { OGM } from "@neo4j/graphql-ogm";
import neo4j from "neo4j-driver";

const driver = neo4j.driver(
  "bolt://localhost:7687",
  neo4j.auth.basic("username", "password")
);

const typeDefs = `
  type MCP {
    id: ID
    name: String
    status: String
  }
  
  type Context {
    id: ID
    content: String
    source_mcp: String
    timestamp: DateTime
  }
`;

const ogm = new OGM({ typeDefs, driver });
```

### Data Models

**MCP Node:**
- id, name, status, connection_config, last_sync, context_count

**Context Node:**
- id, content, source_mcp, user_id, timestamp, token_count, freshness_status, is_shared

**User Node:**
- id, name, email, last_active, sync_status

### Querying Pattern

```typescript
// Server Component or API Route
async function getData() {
  const session = driver.session();
  try {
    const result = await session.run(
      'MATCH (m:MCP) RETURN m'
    );
    return result.records.map(record => record.get('m').properties);
  } finally {
    await session.close();
  }
}
```

---

## Critical: WebSocket Integration

### Connection Management

```typescript
// lib/websocket.ts
let ws: WebSocket | null = null;

export function connectWebSocket() {
  ws = new WebSocket('ws://localhost:3001');
  
  ws.onopen = () => {
    console.log('WebSocket connected');
  };
  
  ws.onmessage = (event) => {
    const data = JSON.parse(event.data);
    // Handle events: mcp_added, context_updated, etc.
  };
  
  ws.onclose = () => {
    console.log('WebSocket disconnected');
    // Auto-reconnect with exponential backoff
    setTimeout(connectWebSocket, 5000);
  };
  
  return ws;
}
```

### Event Types
- `mcp_added` / `mcp_removed` / `mcp_status_change`
- `context_added` / `context_updated` / `context_deleted`
- `member_joined` / `member_removed` / `member_activity`
- `sync_status_change`
- `freshness_changed`

### Real-time Updates Pattern

```tsx
'use client';

import { useEffect } from 'react';
import { connectWebSocket } from '@/lib/websocket';

export function useRealtimeUpdates(onEvent: (data: any) => void) {
  useEffect(() => {
    const ws = connectWebSocket();
    
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      onEvent(data);
    };
    
    return () => ws.close();
  }, [onEvent]);
}
```

---

## Project Structure

```
app/
├── layout.tsx              # Root layout with fonts
├── page.tsx                # 🌟 Landing page (public, mobile-responsive)
├── globals.css             # Tailwind v4 config + colors
│
├── dashboard/              # 🔒 Dashboard area (desktop-only)
│   ├── layout.tsx         # Dashboard layout with sidebar
│   └── page.tsx           # Home (Graph Visualization)
│
├── mcp/
│   └── page.tsx           # MCP Management
├── context/
│   └── page.tsx           # Context Library
├── team/
│   └── page.tsx           # Team Management
└── settings/
    └── page.tsx           # Settings

components/
├── landing/               # 🌟 Landing page components
│   ├── Hero.tsx
│   ├── Features.tsx
│   ├── CTA.tsx
│   └── Footer.tsx
│
├── layout/
│   └── Sidebar.tsx        # Dashboard navigation (not on landing)
│
├── graph/
│   ├── GraphView.tsx      # Reagraph implementation
│   ├── NodeModal.tsx      # Context detail modal
│   └── EmptyState.tsx
│
├── mcp/
│   ├── MCPCard.tsx
│   ├── AddMCPModal.tsx
│   └── EditSettingsModal.tsx
│
├── context/
│   ├── ContextTable.tsx
│   ├── ContextDetailModal.tsx
│   └── BulkActions.tsx
│
├── team/
│   ├── MemberCard.tsx
│   └── InviteMemberModal.tsx
│
└── settings/
    ├── ProjectSection.tsx
    ├── DatabaseSection.tsx
    ├── UsageSection.tsx
    └── DataSection.tsx

hooks/
├── useGraphData.ts
├── useGraphAnimation.ts
├── useMCPData.ts
├── useContextData.ts
├── useTeamData.ts
└── useSettingsData.ts

lib/
├── neo4j.ts              # Database connection
├── websocket.ts          # Real-time updates
├── utils.ts              # cn() and utilities
├── validation.ts         # Zod schemas
├── freshness.ts          # Context freshness logic
└── avatarGradient.ts     # Deterministic gradients
```

---

## Page-Specific Patterns

### Landing Page (`/`)
- **Public facing**: No authentication required
- **No sidebar**: Full-width layout with custom navigation
- **Mobile responsive**: Unlike dashboard, MUST work on mobile
- **Sections**: Hero, Features, How It Works, Pricing(?), FAQ(?), Footer
- **CTA routing**: All "Get Started" buttons → `/dashboard`
- **Animations**: Framer Motion for scroll reveals, parallax effects
- **Performance**: Optimize for fast initial load, lazy load images
- **SEO**: Meta tags, Open Graph, proper heading hierarchy

### Dashboard Home (`/dashboard`)
- **3 Layers of abstraction:**
  1. Clean node → MCP nodes
  2. MCP node (zoom in) → Context nodes
  3. Context node (click) → Modal popup
- **Pagination**: If >10 context nodes, group into clusters (4th layer)
- **Animation**: 800ms smooth zoom with Framer Motion
- **Reset view**: Button appears when zoomed in
- **Desktop-only**: Min-width 1280px

### MCP Management (`/mcp`)
- **Grid layout**: 2 columns
- **Expandable cards**: Click to show connection settings
- **Add MCP**: Modal with database search
- **Auto-configuration**: Backend handles most settings

### Context Library (`/context`)
- **Table view**: Tanstack Table with pagination
- **Freshness indicators**: Fresh, Outdated (1-2 versions), Deprecated (3+ versions)
- **Bulk actions**: Multi-select with fixed bottom bar
- **Search**: Debounced 300ms

### Team Management (`/team`)
- **List view**: Vertical member cards
- **Avatar gradients**: Deterministic based on user ID
- **Sync status**: Real-time via WebSocket
- **Invite system**: Generate link with 7-day expiration

### Settings (`/settings`)
- **4 sections**: Project, Database, Usage, Data
- **Auto-save**: Project name on blur
- **Confirmation modals**: API key regeneration, clear all data
- **Usage monitoring**: Progress bar with warning states

---

## Common Gotchas

1. **No tailwind.config.js** — All config in `globals.css` via `@theme`
2. **Utility renames** — `shadow-sm` is now `shadow-xs`, `shadow` is now `shadow-sm`
3. **CSS variable syntax** — Use `bg-(--var)` not `bg-[var(--var)]`
4. **Async params** — Page params are Promises in Next.js 16
5. **No next lint** — Use `eslint` command directly
6. **React imports** — Not needed for JSX (`jsx: "react-jsx"`)
7. **Neo4j REST API removed** — Use Bolt protocol with official drivers
8. **Reagraph API** — Always research latest documentation
9. **WebSocket reconnection** — Implement exponential backoff
10. **Desktop-only dashboard** — Landing page is responsive, dashboard is not
11. **Sidebar scope** — Only appears in `/dashboard/*` routes, not on landing

---

## Animation Requirements

### Priority Animations (Extra Attention Required)
1. **Graph zoom/transitions** — 800ms smooth, Framer Motion controlled
2. **Node fade in/out** — Staggered, not simultaneous
3. **Sidebar collapse** — 400ms cubic-bezier(0.4, 0, 0.2, 1)
4. **Modal enter/exit** — Scale 0.95→1.0, 300ms
5. **Card hover states** — Border color, 200ms transition
6. **Landing page scroll reveals** — Sequential fade-up for sections

### Performance Requirements
- 60fps minimum for all animations
- Use `transform` and `opacity` only (GPU-accelerated)
- Avoid animating `width`, `height`, or `top`/`left`
- Use `will-change` sparingly
- Lazy load images/avatars (especially on landing page)
- Virtualize lists >100 items

### Framer Motion Patterns

```tsx
// Orchestrated sequence
import { useAnimation } from 'framer-motion';

const controls = useAnimation();

await controls.start({ opacity: 0, transition: { duration: 0.3 } });
await controls.start({ opacity: 1, transition: { duration: 0.3 } });

// Stagger children
<motion.div variants={container}>
  {items.map(item => (
    <motion.div key={item.id} variants={item} />
  ))}
</motion.div>

// Exit animations
<AnimatePresence>
  {show && <motion.div exit={{ opacity: 0 }} />}
</AnimatePresence>

// Scroll-triggered animations (landing page)
import { useScroll, useTransform } from 'framer-motion';

const { scrollYProgress } = useScroll();
const y = useTransform(scrollYProgress, [0, 1], [0, -100]);
```

---

## Loading & Error States

### Loading Patterns
- **Skeletons**: Shimmer gradient (#F1F5F9 → #E0F2FE, 1.5s)
- **Spinners**: 32px, primary color (#0EA5E9)
- **Progress indicators**: For multi-step processes
- **Text**: "Loading...", "Saving...", "Connecting..." (14px, #64748B)

### Error Patterns
- **Toasts**: Top-right, auto-dismiss 5s (except errors)
- **Banners**: Above content, dismissible
- **Inline errors**: Below fields, #EF4444 text
- **Modals**: For critical errors requiring action

---

## Responsive Behavior

### Landing Page
- **Fully responsive**: Works on all devices
- **Breakpoints**:
  - Mobile: 320px - 767px
  - Tablet: 768px - 1023px
  - Desktop: 1024px+
- **Mobile nav**: Hamburger menu, drawer/slide-out
- **Touch-friendly**: Minimum tap targets 44px×44px
- **Images**: Responsive with next/image, lazy loading

### Dashboard (`/dashboard` and all sub-routes)
- **Desktop-only**: Min width 1280px
- **Warning banner**: Show if viewport < 1280px
  * "This app is optimized for desktop. Please use a larger screen."
  * Background: #FEF3C7
  * Sticky top
  * Dismissible

---

## Accessibility Requirements

- All interactive elements keyboard accessible
- Focus visible: 2px solid #0EA5E9, offset 2px
- ARIA labels on icon buttons
- Semantic HTML (nav, main, section, article)
- Color contrast: WCAG AA minimum (verify with tools)
- Screen reader announcements for dynamic content
- Skip to main content link (both landing and dashboard)
- Alt text for all images (especially landing page)

---

## Commands

```bash
npm run dev      # Start dev server (Turbopack)
npm run build    # Production build
npm run start    # Start production server
npm run lint     # Run ESLint directly (not next lint)
```

---

## Code Patterns & Conventions

### File Naming
- Components: `PascalCase.tsx`
- Utilities: `camelCase.ts`
- Types: `types.ts` or `*.types.ts`
- Route files: `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`

### Import Order
```typescript
// 1. React (if needed for hooks/types)
import { useState } from 'react';

// 2. Next.js
import Image from 'next/image';
import Link from 'next/link';

// 3. External packages
import { motion } from 'framer-motion';
import { GraphCanvas } from 'reagraph';

// 4. Internal modules
import { cn } from '@/lib/utils';
import driver from '@/lib/neo4j';

// 5. Components
import { Button } from '@/components/ui/button';
import { Sidebar } from '@/components/layout/Sidebar';

// 6. Types
import type { Props } from './types';

// 7. Styles (if any separate CSS modules)
import styles from './styles.module.css';
```

### Component Structure
```typescript
// Server Component (default in Next.js 16)
export default function Component() {
  return <div>Server-rendered content</div>;
}

// Client Component (when needed)
'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';

export function InteractiveComponent() {
  const [state, setState] = useState(false);
  
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      onClick={() => setState(!state)}
    >
      Toggle
    </motion.button>
  );
}
```

### Async Server Components
```typescript
// Fetch data directly in Server Components
import driver from '@/lib/neo4j';

export default async function Page() {
  const session = driver.session();
  
  try {
    const result = await session.run('MATCH (m:MCP) RETURN m');
    const mcps = result.records.map(r => r.get('m').properties);
    
    return <div>{mcps.map(mcp => <div key={mcp.id}>{mcp.name}</div>)}</div>;
  } finally {
    await session.close();
  }
}
```

### Navigation Between Landing and Dashboard

```tsx
// Landing page CTA
import Link from 'next/link';

<Link href="/dashboard">
  <Button>Get Started</Button>
</Link>

// Dashboard sidebar navigation
const navItems = [
  { name: 'Home', href: '/dashboard', icon: Graph },
  { name: 'MCP', href: '/mcp', icon: Server },
  { name: 'Context', href: '/context', icon: Database },
  { name: 'Team', href: '/team', icon: Users },
  { name: 'Settings', href: '/settings', icon: Settings },
];
```

---

## Layout Structure

### Root Layout (`app/layout.tsx`)
```tsx
// No sidebar here - applies to both landing and dashboard
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={playfairDisplay.className}>
        {children}
      </body>
    </html>
  );
}
```

### Dashboard Layout (`app/dashboard/layout.tsx`)
```tsx
// Sidebar only appears in dashboard routes
import { Sidebar } from '@/components/layout/Sidebar';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

---

## When in Doubt

1. **Use Context7 to fetch documentation** (`@context7 [framework] [topic]`)
2. **Search for LATEST documentation** (2025 versions)
3. Check the user's `package.json` for exact versions
4. Use Tailwind v4 syntax, not v3
5. Use Next.js 16 patterns, not 15
6. Review existing similar code in the project
7. Ask for clarification before making assumptions
8. **Research Reagraph API** before implementing graph features
9. **Test WebSocket reconnection** logic thoroughly
10. **Verify Neo4j queries** with official driver documentation
11. **Remember**: Landing page is responsive, dashboard is desktop-only
12. **Check route context**: Am I in `/` (landing) or `/dashboard/*` (app)?

**Never assume a package version — always research the latest stable release first.**  
**Context7 is your first stop for accurate documentation.**

---

## Notes for AI Agents

### Code Style
- Functional components preferred
- TypeScript strict mode
- Explicit return types for functions
- Descriptive variable names (except common patterns: `i`, `j`, `e`, `el`)

### UI/UX Requirements
- **ALWAYS use Framer Motion** for animations (never plain CSS transitions)
- **Reference Mobbin** before building new UI patterns
- **Follow React Bits** patterns for component composition
- **Prioritize smooth animations** — 60fps minimum
- **Landing page**: Mobile-responsive, fast, SEO-optimized
- **Dashboard**: Desktop-only (min-width: 1280px), no mobile needed
- **Accessibility** — Semantic HTML, ARIA labels, keyboard navigation
- **Minimal design** — Subtle shadows, minimal borders, generous spacing

### Research-First Approach
1. **Use Context7** to fetch official documentation (`@context7 [framework] [topic]`)
2. **Always search for latest versions** before suggesting packages
3. **Check release notes** for breaking changes
4. **Use latest patterns** from official docs
5. **Verify compatibility** with project's dependencies
6. **Research Reagraph** thoroughly before implementing
7. **Consult Neo4j driver docs** for database operations

### Testing Checklist
- [ ] All animations run at 60fps
- [ ] WebSocket reconnection works
- [ ] Neo4j queries are optimized
- [ ] Keyboard navigation functional
- [ ] Loading states display correctly
- [ ] Error handling graceful
- [ ] Real-time updates sync across clients
- [ ] Graph zoom/transitions smooth (800ms)
- [ ] Landing page responsive on mobile
- [ ] Dashboard shows warning on small screens
- [ ] Navigation between `/` and `/dashboard` works
- [ ] Sidebar only appears in dashboard routes

### Keyboard Shortcuts (Dashboard Only)

Global shortcuts:
- `Cmd/Ctrl + K`: Focus search (Context page)
- `Cmd/Ctrl + /`: Toggle sidebar
- `Cmd/Ctrl + H`: Go to Dashboard home
- `Cmd/Ctrl + M`: Go to MCP
- `Cmd/Ctrl + C`: Go to Context
- `Cmd/Ctrl + T`: Go to Team
- `Cmd/Ctrl + S`: Go to Settings
- `Esc`: Close any open modal

Show shortcuts modal: `Cmd/Ctrl + ?`

**Context7 is your primary documentation source** - use it to get accurate, current information directly from official docs.