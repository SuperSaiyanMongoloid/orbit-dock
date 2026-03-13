import { useState, useRef } from "react";
import { useParams, useNavigate } from "@/lib/navigation";
import { useIssue, useUpdateIssue } from "@/hooks/use-issues";
import { cn } from "@/lib/utils";
import {
  ArrowLeft,
  BarChart3,
  Circle,
  AlertCircle,
  User,
  Clock,
  Tag,
  FileText,
  ChevronDown,
} from "lucide-react";
import { formatDistanceToNow, format } from "date-fns";
import type { Priority, IssueStatus, Issue, ActivityEvent } from "@/services";
import { MarkdownEditor, MarkdownPreview } from "@/components/markdown-editor";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
} from "@/components/ui/dropdown-menu";
import {
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  PriorityIcon,
  StatusIcon,
} from "@/features/issues/issue-detail-panel";
import { useRouteShortcuts } from "@/hooks/use-route-shortcuts";

// ─── Activity Item (full version) ───────────────────────

function ActivityItem({ event }: { event: ActivityEvent }) {
  const icon = (() => {
    switch (event.type) {
      case "status_change":
        return <Circle className="h-3.5 w-3.5 text-li-status-progress" />;
      case "priority_change":
        return <BarChart3 className="h-3.5 w-3.5 text-li-priority-high" />;
      case "label_added":
      case "label_removed":
        return <Tag className="h-3.5 w-3.5 text-li-dot-purple" />;
      case "created":
        return <FileText className="h-3.5 w-3.5 text-li-dot-green" />;
      default:
        return <Clock className="h-3.5 w-3.5 text-li-text-muted" />;
    }
  })();

  const description = (() => {
    switch (event.type) {
      case "status_change":
        return (
          <>
            changed status from <span className="text-li-text-bright font-medium">{event.from}</span> to{" "}
            <span className="text-li-text-bright font-medium">{event.to}</span>
          </>
        );
      case "priority_change":
        return (
          <>
            changed priority from <span className="text-li-text-bright font-medium">{event.from}</span> to{" "}
            <span className="text-li-text-bright font-medium">{event.to}</span>
          </>
        );
      case "label_added":
        return (
          <>
            added label <span className="text-li-text-bright font-medium">{event.to}</span>
          </>
        );
      case "label_removed":
        return (
          <>
            removed label <span className="text-li-text-bright font-medium">{event.from}</span>
          </>
        );
      case "created":
        return "created this issue";
      case "description_changed":
        return "updated the description";
      default:
        return (
          <>
            updated <span className="text-li-text-bright font-medium">{event.field}</span>
          </>
        );
    }
  })();

  return (
    <div className="flex items-start gap-3 py-2.5 border-b border-li-divider last:border-0">
      <div className="mt-0.5 shrink-0 p-1 bg-li-bg rounded">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-[12.5px] text-li-text leading-relaxed">
          <span className="text-li-text-bright font-medium">{event.userName}</span>{" "}
          {description}
        </div>
        <span className="text-[10.5px] text-li-text-muted">
          {format(new Date(event.createdAt), "MMM d, yyyy 'at' h:mm a")}
        </span>
      </div>
    </div>
  );
}

// ─── Full Issue Detail Page ─────────────────────────────

export function IssueDetailView() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: issue, isLoading } = useIssue(id ?? "");
  const updateIssue = useUpdateIssue();
  const editorRef = useRef<HTMLTextAreaElement | null>(null);

  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState("");
  const [editingDesc, setEditingDesc] = useState(false);
  const [descValue, setDescValue] = useState("");

  // ─── Route shortcuts ─────────────────────────────────
  useRouteShortcuts({
    onEdit: () => {
      if (!editingDesc && issue) {
        setDescValue(issue.description ?? "");
        setEditingDesc(true);
        // Focus textarea after render
        setTimeout(() => editorRef.current?.focus(), 50);
      }
    },
    onFocusInput: () => {
      if (!editingDesc && issue) {
        setDescValue(issue.description ?? "");
        setEditingDesc(true);
        setTimeout(() => editorRef.current?.focus(), 50);
      }
    },
    onSave: () => {
      if (editingDesc && issue) {
        updateIssue.mutate({ id: issue.id, input: { title: issue.title } });
        setEditingDesc(false);
      }
    },
  });

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-li-content-bg">
        <span className="text-li-text-muted text-sm">Loading issue…</span>
      </div>
    );
  }

  if (!issue) {
    return (
      <div className="flex-1 flex items-center justify-center bg-li-content-bg">
        <div className="text-center space-y-2">
          <p className="text-sm text-li-text-muted">Issue not found</p>
          <button
            onClick={() => navigate(-1)}
            className="text-[12px] text-li-dot-blue hover:underline"
          >
            Go back
          </button>
        </div>
      </div>
    );
  }

  const statusOpt = STATUS_OPTIONS.find((s) => s.value === issue.status);
  const priorityOpt = PRIORITY_OPTIONS.find((p) => p.value === issue.priority);
  const sortedActivity = [...(issue.activity ?? [])].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const handleTitleSave = () => {
    const trimmed = titleValue.trim();
    if (trimmed && trimmed !== issue.title) {
      updateIssue.mutate({ id: issue.id, input: { title: trimmed } });
    }
    setEditingTitle(false);
  };

  const handleDescSave = () => {
    updateIssue.mutate({ id: issue.id, input: { title: issue.title } });
    setEditingDesc(false);
  };

  return (
    <div className="flex-1 flex flex-col bg-li-content-bg min-h-0">
      {/* Top bar */}
      <div className="flex items-center h-11 px-4 border-b border-li-content-border shrink-0 gap-3">
        <button
          onClick={() => navigate(-1)}
          className="text-li-text-muted hover:text-li-text-bright transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
        <span className="text-[12px] text-li-text-muted">{issue.identifier}</span>
        <span className="text-[11px] text-li-text-muted">·</span>
        {issue.projectName && (
          <span className="text-[12px] text-li-text-muted">{issue.projectName}</span>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-4xl mx-auto py-8 px-6">
          <div className="flex gap-8">
            {/* Main content */}
            <div className="flex-1 min-w-0 space-y-6">
              {/* Title */}
              <div>
                {editingTitle ? (
                  <input
                    autoFocus
                    value={titleValue}
                    onChange={(e) => setTitleValue(e.target.value)}
                    onBlur={handleTitleSave}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleTitleSave();
                      if (e.key === "Escape") setEditingTitle(false);
                    }}
                    className="w-full text-[20px] font-semibold text-li-text-bright bg-transparent border-b border-li-dot-blue outline-none pb-1"
                    maxLength={200}
                  />
                ) : (
                  <h1
                    className="text-[20px] font-semibold text-li-text-bright cursor-pointer hover:text-li-text-bright/80 transition-colors"
                    onClick={() => {
                      setTitleValue(issue.title);
                      setEditingTitle(true);
                    }}
                  >
                    {issue.title}
                  </h1>
                )}
              </div>

              {/* Description */}
              <div>
                <h3 className="text-[11px] font-medium text-li-text-muted uppercase tracking-wider mb-2">
                  Description
                </h3>
              {editingDesc ? (
                  <MarkdownEditor
                    value={descValue}
                    onChange={setDescValue}
                    onBlur={handleDescSave}
                    placeholder="Write a description using markdown…"
                    maxLength={5000}
                    minRows={6}
                  />
                ) : (
                  <div
                    className="cursor-pointer hover:bg-li-bg-hover/50 rounded-md p-2 -m-2 transition-colors min-h-[40px]"
                    onClick={() => {
                      setDescValue(issue.description ?? "");
                      setEditingDesc(true);
                    }}
                  >
                    {issue.description ? (
                      <MarkdownPreview content={issue.description} />
                    ) : (
                      <span className="text-[13px] text-li-text-muted italic">Click to add a description…</span>
                    )}
                  </div>
                )}
              </div>

              {/* Activity */}
              <div>
                <h3 className="text-[11px] font-medium text-li-text-muted uppercase tracking-wider mb-3">
                  Activity
                </h3>
                {sortedActivity.length > 0 ? (
                  <div className="space-y-0">
                    {sortedActivity.map((event) => (
                      <ActivityItem key={event.id} event={event} />
                    ))}
                  </div>
                ) : (
                  <p className="text-[12px] text-li-text-muted italic">No activity yet</p>
                )}
              </div>
            </div>

            {/* Right sidebar properties */}
            <div className="w-[220px] shrink-0 space-y-5">
              <PropertyBlock label="Status">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 text-[12.5px] text-li-text-bright hover:bg-li-bg-hover rounded px-2 py-1 transition-colors -ml-2 w-full">
                      <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: statusOpt?.color }} />
                      {statusOpt?.label}
                      <ChevronDown className="h-3 w-3 ml-auto text-li-text-muted" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-li-menu-bg border-li-menu-border min-w-[160px]">
                    {STATUS_OPTIONS.map((opt) => (
                      <DropdownMenuCheckboxItem
                        key={opt.value}
                        checked={issue.status === opt.value}
                        onCheckedChange={() =>
                          updateIssue.mutate({ id: issue.id, input: { status: opt.value } })
                        }
                        className="text-[12px] text-li-text-bright hover:bg-li-menu-bg-hover cursor-pointer"
                      >
                        <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: opt.color }} />
                        {opt.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </PropertyBlock>

              <PropertyBlock label="Priority">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="flex items-center gap-2 text-[12.5px] text-li-text-bright hover:bg-li-bg-hover rounded px-2 py-1 transition-colors -ml-2 w-full">
                      <PriorityIcon priority={issue.priority} />
                      {priorityOpt?.label}
                      <ChevronDown className="h-3 w-3 ml-auto text-li-text-muted" />
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="bg-li-menu-bg border-li-menu-border min-w-[160px]">
                    {PRIORITY_OPTIONS.map((opt) => (
                      <DropdownMenuCheckboxItem
                        key={opt.value}
                        checked={issue.priority === opt.value}
                        onCheckedChange={() =>
                          updateIssue.mutate({ id: issue.id, input: { priority: opt.value as Priority } })
                        }
                        className="text-[12px] text-li-text-bright hover:bg-li-menu-bg-hover cursor-pointer"
                      >
                        {opt.label}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              </PropertyBlock>

              <PropertyBlock label="Assignee">
                <div className="flex items-center gap-2 px-2 py-1 -ml-2">
                  <div className="h-5 w-5 rounded-full bg-li-dot-blue/20 flex items-center justify-center">
                    <User className="h-3 w-3 text-li-dot-blue" />
                  </div>
                  <span className="text-[12.5px] text-li-text-bright">
                    {issue.assigneeName ?? "Unassigned"}
                  </span>
                </div>
              </PropertyBlock>

              <PropertyBlock label="Labels">
                {issue.labels.length > 0 ? (
                  <div className="flex flex-wrap gap-1.5 px-2 -ml-2">
                    {issue.labels.map((label) => (
                      <span
                        key={label.id}
                        className="text-[11px] px-2 py-0.5 rounded"
                        style={{ color: label.color, backgroundColor: `${label.color}15` }}
                      >
                        {label.name}
                      </span>
                    ))}
                  </div>
                ) : (
                  <span className="text-[12px] text-li-text-muted px-2 -ml-2">None</span>
                )}
              </PropertyBlock>

              {issue.projectName && (
                <PropertyBlock label="Project">
                  <span className="text-[12.5px] text-li-text px-2 -ml-2">{issue.projectName}</span>
                </PropertyBlock>
              )}

              {issue.parentTitle && (
                <PropertyBlock label="Parent issue">
                  <span className="text-[12.5px] text-li-text px-2 -ml-2">› {issue.parentTitle}</span>
                </PropertyBlock>
              )}

              <PropertyBlock label="Created">
                <span className="text-[12px] text-li-text-muted px-2 -ml-2">
                  {format(new Date(issue.createdAt), "MMM d, yyyy")}
                </span>
              </PropertyBlock>

              <PropertyBlock label="Updated">
                <span className="text-[12px] text-li-text-muted px-2 -ml-2">
                  {formatDistanceToNow(new Date(issue.updatedAt), { addSuffix: true })}
                </span>
              </PropertyBlock>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PropertyBlock({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <h4 className="text-[10px] font-medium text-li-text-muted uppercase tracking-wider mb-1">
        {label}
      </h4>
      {children}
    </div>
  );
}
