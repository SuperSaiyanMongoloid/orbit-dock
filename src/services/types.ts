/**
 * Service layer contracts.
 * 
 * Each service is an interface. Implementations can be:
 * - Mock (current, client-side only)
 * - REST/fetch
 * - tRPC / oRPC client
 * - Supabase client
 * - GraphQL
 * 
 * Components never import implementations directly — they consume
 * services through hooks that resolve the active implementation.
 */

import type { PaginatedResult } from "@/types";

// ─── Issues ─────────────────────────────────────────────

export type Priority = "urgent" | "high" | "medium" | "low" | "none";
export type IssueStatus = "backlog" | "todo" | "in_progress" | "done" | "cancelled";

export interface IssueLabel {
  id: string;
  name: string;
  color: string;
}

export interface SubIssueProgress {
  done: number;
  total: number;
}

export interface ActivityEvent {
  id: string;
  type: "status_change" | "priority_change" | "label_added" | "label_removed" | "created" | "updated" | "description_changed";
  field?: string;
  from?: string;
  to?: string;
  userId: string;
  userName: string;
  createdAt: string;
}

export interface Issue {
  id: string;
  identifier: string; // e.g. "AIO-19"
  title: string;
  description?: string;
  status: IssueStatus;
  priority: Priority;
  labels: IssueLabel[];
  parentId?: string;
  parentTitle?: string;
  subIssues?: SubIssueProgress;
  projectId?: string;
  projectName?: string;
  assigneeId?: string;
  assigneeName?: string;
  activity?: ActivityEvent[];
  createdAt: string;
  updatedAt: string;
}

export interface IssueFilters {
  status?: IssueStatus[];
  priority?: Priority[];
  projectId?: string;
  assigneeId?: string;
  search?: string;
}

export interface IssueService {
  list(filters?: IssueFilters): Promise<PaginatedResult<Issue>>;
  getById(id: string): Promise<Issue | null>;
  create(input: CreateIssueInput): Promise<Issue>;
  update(id: string, input: UpdateIssueInput): Promise<Issue>;
  delete(id: string): Promise<void>;
}

export interface CreateIssueInput {
  title: string;
  status?: IssueStatus;
  priority?: Priority;
  labelIds?: string[];
  projectId?: string;
  parentId?: string;
}

export interface UpdateIssueInput {
  title?: string;
  status?: IssueStatus;
  priority?: Priority;
  labelIds?: string[];
  projectId?: string;
}

// ─── Projects ───────────────────────────────────────────

export interface Project {
  id: string;
  name: string;
  icon?: string;
  color?: string;
}

export interface ProjectService {
  list(): Promise<Project[]>;
  getById(id: string): Promise<Project | null>;
}

// ─── Teams ──────────────────────────────────────────────

export interface Team {
  id: string;
  name: string;
  color?: string;
  memberCount?: number;
}

export interface TeamService {
  list(): Promise<Team[]>;
  getById(id: string): Promise<Team | null>;
}

// ─── User / Auth ────────────────────────────────────────

export interface User {
  id: string;
  name: string;
  email?: string;
  avatarUrl?: string;
}

export interface UserService {
  getCurrentUser(): Promise<User | null>;
  // Stubs for future auth
  login?: (email: string, password: string) => Promise<User>;
  logout?: () => Promise<void>;
}

// ─── Notifications ──────────────────────────────────────

export interface Notification {
  id: string;
  title: string;
  issueId?: string;
  read: boolean;
  createdAt: string;
}

export interface NotificationService {
  list(): Promise<Notification[]>;
  markAsRead?: (id: string) => Promise<void>;
  markAsUnread?: (id: string) => Promise<void>;
  markAllAsRead?: () => Promise<void>;
  markManyAsRead?: (ids: string[]) => Promise<void>;
  markManyAsUnread?: (ids: string[]) => Promise<void>;
  delete?: (id: string) => Promise<void>;
  deleteMany?: (ids: string[]) => Promise<void>;
  getUnreadCount(): Promise<number>;
}
