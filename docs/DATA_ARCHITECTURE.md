# Data Architecture

> Overview of domain models, service contracts, state management, and data flow patterns used in Orbit Dock.

---

## Table of Contents

1. [Domain Models](#domain-models)
2. [Service Layer](#service-layer)
3. [State Management](#state-management)
4. [Data Flow](#data-flow)
5. [Type Hierarchy](#type-hierarchy)

---

## Domain Models

### Core Entities

```
┌─────────────────────────────────────────────────────────────────────┐
│                           ISSUE                                     │
├─────────────────────────────────────────────────────────────────────┤
│ id: string              │ Unique identifier                         │
│ identifier: string      │ Human-readable ID (e.g. "AIO-19")         │
│ title: string           │ Issue title                               │
│ description?: string    │ Markdown content                          │
│ status: IssueStatus     │ backlog|todo|in_progress|done|cancelled   │
│ priority: Priority      │ urgent|high|medium|low|none               │
│ labels: IssueLabel[]    │ Attached labels                           │
│ parentId?: string       │ Parent issue (for sub-issues)             │
│ parentTitle?: string    │ Denormalized parent title                 │
│ subIssues?: SubIssueProgress │ { done, total } counts              │
│ projectId?: string      │ Owning project                            │
│ projectName?: string    │ Denormalized project name                 │
│ assigneeId?: string     │ Assigned user                             │
│ assigneeName?: string   │ Denormalized assignee name                │
│ activity?: ActivityEvent[] │ Change history                         │
│ createdAt: string       │ ISO timestamp                             │
│ updatedAt: string       │ ISO timestamp                             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                          PROJECT                                    │
├─────────────────────────────────────────────────────────────────────┤
│ id: string              │ Unique identifier                         │
│ name: string            │ Project name                              │
│ icon?: string           │ Optional icon                             │
│ color?: string          │ Theme color                               │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                           TEAM                                      │
├─────────────────────────────────────────────────────────────────────┤
│ id: string              │ Unique identifier                         │
│ name: string            │ Team name                                 │
│ color?: string          │ Theme color                               │
│ memberCount?: number    │ Number of members                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                           USER                                      │
├─────────────────────────────────────────────────────────────────────┤
│ id: string              │ Unique identifier                         │
│ name: string            │ Display name                              │
│ email?: string          │ Email address                             │
│ avatarUrl?: string      │ Profile image URL                         │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                       NOTIFICATION                                  │
├─────────────────────────────────────────────────────────────────────┤
│ id: string              │ Unique identifier                         │
│ title: string           │ Notification text                         │
│ issueId?: string        │ Related issue                             │
│ read: boolean           │ Read status                               │
│ createdAt: string       │ ISO timestamp                             │
└─────────────────────────────────────────────────────────────────────┘
```

### Supporting Types

```typescript
// Enums
type Priority = "urgent" | "high" | "medium" | "low" | "none";
type IssueStatus = "backlog" | "todo" | "in_progress" | "done" | "cancelled";

// Value Objects
interface IssueLabel {
  id: string;
  name: string;
  color: string;
}

interface SubIssueProgress {
  done: number;
  total: number;
}

interface ActivityEvent {
  id: string;
  type: "status_change" | "priority_change" | "label_added" | 
        "label_removed" | "created" | "updated" | "description_changed";
  field?: string;
  from?: string;
  to?: string;
  userId: string;
  userName: string;
  createdAt: string;
}
```

---

## Service Layer

### Architecture Pattern

```
┌─────────────────────────────────────────────────────────────────────┐
│                        COMPONENT LAYER                              │
│  (React components consume data via hooks)                          │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                         HOOKS LAYER                                 │
│  useIssues, useTeams, useCurrentUser, useNotifications              │
│  (TanStack Query for caching, deduplication, background refresh)    │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      SERVICE REGISTRY                               │
│  getIssueService(), getTeamService(), getUserService(), etc.        │
│  (Singleton factory - returns interface implementations)            │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────────┐
│                   SERVICE IMPLEMENTATIONS                           │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐                 │
│  │    Mock     │  │   REST/     │  │  Supabase   │                 │
│  │  (current)  │  │   fetch     │  │   Client    │                 │
│  └─────────────┘  └─────────────┘  └─────────────┘                 │
└─────────────────────────────────────────────────────────────────────┘
```

### Service Interfaces

```typescript
// Issue Service
interface IssueService {
  list(filters?: IssueFilters): Promise<PaginatedResult<Issue>>;
  getById(id: string): Promise<Issue | null>;
  create(input: CreateIssueInput): Promise<Issue>;
  update(id: string, input: UpdateIssueInput): Promise<Issue>;
  delete(id: string): Promise<void>;
}

// Project Service
interface ProjectService {
  list(): Promise<Project[]>;
  getById(id: string): Promise<Project | null>;
}

// Team Service
interface TeamService {
  list(): Promise<Team[]>;
  getById(id: string): Promise<Team | null>;
}

// User Service
interface UserService {
  getCurrentUser(): Promise<User | null>;
  login?: (email: string, password: string) => Promise<User>;
  logout?: () => Promise<void>;
}

// Notification Service
interface NotificationService {
  list(): Promise<Notification[]>;
  markAsRead?: (id: string) => Promise<void>;
  markAsUnread?: (id: string) => Promise<void>;
  markAllAsRead?: () => Promise<void>;
  getUnreadCount(): Promise<number>;
}
```

### Swapping Implementations

To replace mock services with a real backend:

1. Create implementation in `src/services/api/` or `src/services/supabase/`
2. Update the factory in `src/services/index.ts`:

```typescript
// Before (mock)
export function getIssueService(): IssueService {
  if (!issueService) issueService = createMockIssueService();
  return issueService;
}

// After (real API)
export function getIssueService(): IssueService {
  if (!issueService) issueService = createApiIssueService();
  return issueService;
}
```

---

## State Management

### Global State (Zustand)

```
┌─────────────────────────────────────────────────────────────────────┐
│                      COUNTER STORE                                  │
│  Location: src/stores/counter-store.ts                              │
├─────────────────────────────────────────────────────────────────────┤
│  Purpose: Badge counts for sidebar navigation                       │
│                                                                     │
│  State:                                                             │
│    counts: { inbox: number, reviews: number, "my-issues": number }  │
│                                                                     │
│  Actions:                                                           │
│    setCount(key, count) - Update a specific counter                 │
│    getCount(key) - Read a counter value                             │
└─────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────┐
│                      SIDEBAR STORE                                  │
│  Location: src/features/sidebar/store.ts                            │
├─────────────────────────────────────────────────────────────────────┤
│  Purpose: UI state for sidebar collapse, sections, teams            │
│  Persistence: localStorage via zustand/persist                      │
│                                                                     │
│  State:                                                             │
│    collapsed: boolean                                               │
│    activeItemId: string | null                                      │
│    openSections: Record<string, boolean>                            │
│    openTeams: Record<string, boolean>                               │
│                                                                     │
│  Actions:                                                           │
│    toggleCollapsed() - Expand/collapse sidebar                      │
│    setActiveItem(id) - Highlight active nav item                    │
│    toggleSection(id) - Expand/collapse a section                    │
│    toggleTeam(id) - Expand/collapse a team                          │
│    initSection(id, defaultOpen) - Initialize section state          │
│    initTeam(id, defaultOpen) - Initialize team state                │
└─────────────────────────────────────────────────────────────────────┘
```

### Server State (TanStack Query)

```
┌─────────────────────────────────────────────────────────────────────┐
│                      QUERY KEYS                                     │
├─────────────────────────────────────────────────────────────────────┤
│  ["issues"]                    │ All issues list                    │
│  ["issues", filters]           │ Filtered issues                    │
│  ["issues", id]                │ Single issue by ID                 │
│  ["teams"]                     │ All teams                          │
│  ["current-user"]              │ Authenticated user                 │
│  ["notifications"]             │ All notifications                  │
│  ["notifications", "unread-count"] │ Unread notification count      │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Flow Hooks

| Hook | Query Key | Service | Returns |
|------|-----------|---------|---------|
| `useIssues(filters?)` | `["issues", filters]` | IssueService.list | PaginatedResult\<Issue\> |
| `useIssue(id)` | `["issues", id]` | IssueService.getById | Issue \| null |
| `useCreateIssue()` | mutation | IssueService.create | Issue |
| `useUpdateIssue()` | mutation | IssueService.update | Issue |
| `useDeleteIssue()` | mutation | IssueService.delete | void |
| `useTeams()` | `["teams"]` | TeamService.list | Team[] |
| `useCurrentUser()` | `["current-user"]` | UserService.getCurrentUser | User \| null |
| `useNotifications()` | `["notifications"]` | NotificationService.list | Notification[] |
| `useUnreadCount()` | `["notifications", "unread-count"]` | NotificationService.getUnreadCount | number |

---

## Data Flow

### Read Path

```
User Action (view issues)
        │
        ▼
┌───────────────────┐
│   useIssues()     │  Hook called in component
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  TanStack Query   │  Check cache → stale? → refetch
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ getIssueService() │  Resolve singleton
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│  service.list()   │  Execute (mock or real)
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Component       │  Render with data
└───────────────────┘
```

### Write Path

```
User Action (create issue)
        │
        ▼
┌───────────────────┐
│ useCreateIssue()  │  Get mutation
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ mutate(input)     │  Trigger mutation
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ service.create()  │  Execute create
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│ invalidateQueries │  Bust cache for ["issues"]
└─────────┬─────────┘
          │
          ▼
┌───────────────────┐
│   Refetch         │  Components auto-update
└───────────────────┘
```

---

## Type Hierarchy

```
src/
├── types/
│   └── index.ts              # Shared domain types
│       ├── PaginatedResult<T>
│       ├── AsyncResult<T>
│       ├── ActionCallback<A,R>
│       └── OptionalAction<A,R>
│
├── services/
│   ├── types.ts              # Service contracts + domain models
│   │   ├── Issue, IssueStatus, Priority, IssueLabel
│   │   ├── Project
│   │   ├── Team
│   │   ├── User
│   │   ├── Notification
│   │   ├── IssueService, ProjectService, TeamService
│   │   ├── UserService, NotificationService
│   │   └── Input types (CreateIssueInput, UpdateIssueInput)
│   │
│   ├── index.ts              # Service registry + re-exports
│   └── mock/                 # Mock implementations
│       ├── issues.ts
│       ├── projects.ts
│       ├── teams.ts
│       ├── user.ts
│       └── notifications.ts
│
├── stores/
│   └── counter-store.ts      # Sidebar badge counts (Zustand)
│
├── features/
│   └── sidebar/
│       ├── types.ts          # Sidebar-specific types
│       │   ├── NavItem, NavSection, NavBadge
│       │   ├── TeamConfig, UserConfig
│       │   ├── SidebarConfig
│       │   └── ContextMenuConfig
│       └── store.ts          # Sidebar UI state (Zustand + persist)
│
└── hooks/
    ├── use-issues.ts         # Issue data hooks
    ├── use-teams.ts          # Team data hooks
    ├── use-user.ts           # User data hooks
    └── use-notifications.ts  # Notification data hooks
```

---

## Migration Notes

When connecting to a real backend:

1. **Service Implementation**: Create new service files implementing the interfaces
2. **Service Registry**: Update `src/services/index.ts` to use new implementations
3. **No Component Changes**: Hooks and components remain unchanged
4. **Type Safety**: All implementations must satisfy the existing interfaces
5. **Cache Invalidation**: TanStack Query patterns already handle refetching

Supported backend options (per service contract design):
- REST/fetch
- tRPC / oRPC
- Supabase client
- GraphQL
