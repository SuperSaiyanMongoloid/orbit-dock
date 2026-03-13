import { useState, useMemo, useCallback, useRef, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  ChevronDown,
  ChevronRight,
  ArrowUpDown,
  Filter,
  Plus,
} from "lucide-react";
import { useIssues, useUpdateIssue } from "@/hooks/use-issues";
import type { Priority, IssueStatus, Issue } from "@/services";
import { CreateIssueModal } from "./create-issue-modal";
import {
  IssueDetailPanel,
  STATUS_OPTIONS,
  PRIORITY_OPTIONS,
  PriorityIcon,
  StatusIcon,
} from "./issue-detail-panel";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "@/lib/navigation";
import { Kbd } from "@/components/kbd";
import { useCounterStore } from "@/stores/counter-store";
import { useRouteShortcuts } from "@/hooks/use-route-shortcuts";

// ─── Constants ──────────────────────────────────────────

type SortField = "priority" | "status" | "title" | "updatedAt";
type SortDir = "asc" | "desc";

/** Default tracked status for My Issues counter */
const TRACKED_STATUSES: IssueStatus[] = ["in_progress"];

const PRIORITY_ORDER: Record<Priority, number> = {
  urgent: 0, high: 1, medium: 2, low: 3, none: 4,
};

const STATUS_ORDER: Record<IssueStatus, number> = {
  in_progress: 0, todo: 1, backlog: 2, done: 3, cancelled: 4,
};

// ─── Issue Row ──────────────────────────────────────────

interface IssueRowProps {
  issue: Issue;
  expanded: boolean;
  focused: boolean;
  onToggle: () => void;
  onStatusChange: (issue: Issue, status: IssueStatus) => void;
  onPriorityChange: (issue: Issue, priority: Priority) => void;
  onOpenFull: (issue: Issue) => void;
}

function IssueRow({ issue, expanded, focused, onToggle, onStatusChange, onPriorityChange, onOpenFull }: IssueRowProps) {
  return (
    <>
      <div
        className={cn(
          "flex items-center h-[34px] px-4 hover:bg-li-bg-hover transition-colors cursor-pointer group",
          !expanded && "border-b border-li-divider",
          expanded && "bg-li-bg-hover/60",
          focused && "ring-1 ring-inset ring-li-dot-blue bg-li-bg-hover"
        )}
        onClick={onToggle}
        tabIndex={-1}
      >
        <div className="flex items-center gap-2.5 flex-1 min-w-0">
          <ChevronRight
            className={cn(
              "h-3 w-3 text-li-text-muted transition-transform duration-200",
              expanded && "rotate-90"
            )}
          />
          <PriorityIcon priority={issue.priority} />
          <span className="text-[12px] text-li-text-muted shrink-0">{issue.identifier}</span>

          <DropdownMenu>
            <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
              <button className="focus:outline-none hover:scale-125 transition-transform">
                <StatusIcon status={issue.status} />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="bg-li-menu-bg border-li-menu-border min-w-[160px]"
              onClick={(e) => e.stopPropagation()}
            >
              <DropdownMenuLabel className="text-li-text-muted text-[11px]">Set status</DropdownMenuLabel>
              {STATUS_OPTIONS.map((opt) => (
                <DropdownMenuCheckboxItem
                  key={opt.value}
                  checked={issue.status === opt.value}
                  onCheckedChange={() => onStatusChange(issue, opt.value)}
                  className="text-[12px] text-li-text-bright hover:bg-li-menu-bg-hover cursor-pointer"
                >
                  <span className="inline-block h-2 w-2 rounded-full mr-1.5" style={{ backgroundColor: opt.color }} />
                  {opt.label}
                </DropdownMenuCheckboxItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          <span className="text-[13px] text-li-text-bright truncate">{issue.title}</span>
          {issue.subIssues && (
            <span className="text-[11px] text-li-text-muted shrink-0 bg-li-badge-bg rounded px-1.5 py-0.5">
              {issue.subIssues.done}/{issue.subIssues.total}
            </span>
          )}
          {issue.parentTitle && (
            <span className="text-[11px] text-li-text-muted truncate">› {issue.parentTitle}</span>
          )}
        </div>
        <div className="flex items-center gap-3 shrink-0 ml-4">
          {issue.labels?.map((label) => (
            <span
              key={label.id}
              className="text-[11px] px-1.5 py-0.5 rounded"
              style={{ color: label.color, backgroundColor: `${label.color}15` }}
            >
              {label.name}
            </span>
          ))}
          {issue.projectName && (
            <span className="text-[11px] text-li-text-muted truncate max-w-[160px]">{issue.projectName}</span>
          )}
        </div>
      </div>

      <IssueDetailPanel
        issue={issue}
        expanded={expanded}
        onOpenFull={onOpenFull}
        onStatusChange={onStatusChange}
        onPriorityChange={onPriorityChange}
      />
    </>
  );
}

// ─── Filter Dropdown ────────────────────────────────────

function MultiFilterDropdown<T extends string>({
  label,
  options,
  selected,
  onChange,
}: {
  label: string;
  options: { value: T; label: string }[];
  selected: T[];
  onChange: (v: T[]) => void;
}) {
  const toggle = (val: T) => {
    onChange(selected.includes(val) ? selected.filter((s) => s !== val) : [...selected, val]);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1 text-[12px] text-li-text-muted hover:text-li-text-bright transition-colors px-2 py-1 rounded hover:bg-li-bg-hover">
          <Filter className="h-3 w-3" />
          {label}
          {selected.length > 0 && (
            <span className="bg-li-badge-bg text-li-text-badge text-[10px] px-1.5 rounded-full">
              {selected.length}
            </span>
          )}
          <ChevronDown className="h-3 w-3" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-li-menu-bg border-li-menu-border min-w-[160px]">
        {options.map((opt) => (
          <DropdownMenuCheckboxItem
            key={opt.value}
            checked={selected.includes(opt.value)}
            onCheckedChange={() => toggle(opt.value)}
            className="text-[12px] text-li-text-bright hover:bg-li-menu-bg-hover cursor-pointer"
          >
            {opt.label}
          </DropdownMenuCheckboxItem>
        ))}
        {selected.length > 0 && (
          <>
            <DropdownMenuSeparator className="bg-li-divider" />
            <DropdownMenuCheckboxItem
              checked={false}
              onCheckedChange={() => onChange([])}
              className="text-[12px] text-li-text-muted hover:bg-li-menu-bg-hover cursor-pointer"
            >
              Clear filters
            </DropdownMenuCheckboxItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Sort Dropdown ──────────────────────────────────────

function SortDropdown({
  sortField,
  sortDir,
  onChange,
}: {
  sortField: SortField;
  sortDir: SortDir;
  onChange: (field: SortField, dir: SortDir) => void;
}) {
  const fields: { value: SortField; label: string }[] = [
    { value: "priority", label: "Priority" },
    { value: "status", label: "Status" },
    { value: "title", label: "Title" },
    { value: "updatedAt", label: "Updated" },
  ];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-1 text-[12px] text-li-text-muted hover:text-li-text-bright transition-colors px-2 py-1 rounded hover:bg-li-bg-hover">
          <ArrowUpDown className="h-3 w-3" />
          Sort
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-li-menu-bg border-li-menu-border min-w-[160px]">
        <DropdownMenuLabel className="text-li-text-muted text-[11px]">Sort by</DropdownMenuLabel>
        {fields.map((f) => (
          <DropdownMenuCheckboxItem
            key={f.value}
            checked={sortField === f.value}
            onCheckedChange={() => onChange(f.value, sortDir)}
            className="text-[12px] text-li-text-bright hover:bg-li-menu-bg-hover cursor-pointer"
          >
            {f.label}
          </DropdownMenuCheckboxItem>
        ))}
        <DropdownMenuSeparator className="bg-li-divider" />
        <DropdownMenuLabel className="text-li-text-muted text-[11px]">Direction</DropdownMenuLabel>
        <DropdownMenuCheckboxItem
          checked={sortDir === "asc"}
          onCheckedChange={() => onChange(sortField, "asc")}
          className="text-[12px] text-li-text-bright hover:bg-li-menu-bg-hover cursor-pointer"
        >
          Ascending
        </DropdownMenuCheckboxItem>
        <DropdownMenuCheckboxItem
          checked={sortDir === "desc"}
          onCheckedChange={() => onChange(sortField, "desc")}
          className="text-[12px] text-li-text-bright hover:bg-li-menu-bg-hover cursor-pointer"
        >
          Descending
        </DropdownMenuCheckboxItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

// ─── Main View ──────────────────────────────────────────

interface IssuesViewProps {
  onIssueSelect?: (issue: Issue) => void;
  onFilterChange?: (filters: Record<string, unknown>) => void;
}

export function IssuesView({ onIssueSelect: _onIssueSelect }: IssuesViewProps) {
  const [statusFilter, setStatusFilter] = useState<IssueStatus[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<Priority[]>([]);
  const [sortField, setSortField] = useState<SortField>("priority");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [createOpen, setCreateOpen] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [focusedIdx, setFocusedIdx] = useState(-1);
  const navigate = useNavigate();
  const listRef = useRef<HTMLDivElement>(null);
  const setCount = useCounterStore((s) => s.setCount);

  const { data, isLoading } = useIssues();
  const updateIssue = useUpdateIssue();

  // Push "in_progress" issue count to sidebar counter store
  const allIssues = data?.data ?? [];
  const trackedCount = useMemo(
    () => allIssues.filter((i) => TRACKED_STATUSES.includes(i.status)).length,
    [allIssues]
  );
  useEffect(() => {
    setCount("my-issues", trackedCount);
  }, [trackedCount, setCount]);

  // ─── Route shortcuts ────────────────────────────────
  useRouteShortcuts({
    onNew: () => setCreateOpen(true),
    onOpen: () => {
      if (focusedIdx >= 0 && flatIssues[focusedIdx]) {
        navigate(`/issues/${flatIssues[focusedIdx].id}`);
      }
    },
  });

  const issues = useMemo(() => {
    let result = allIssues;
    if (statusFilter.length) result = result.filter((i) => statusFilter.includes(i.status));
    if (priorityFilter.length) result = result.filter((i) => priorityFilter.includes(i.priority));

    result = [...result].sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "priority": cmp = PRIORITY_ORDER[a.priority] - PRIORITY_ORDER[b.priority]; break;
        case "status": cmp = STATUS_ORDER[a.status] - STATUS_ORDER[b.status]; break;
        case "title": cmp = a.title.localeCompare(b.title); break;
        case "updatedAt": cmp = new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime(); break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });
    return result;
  }, [allIssues, statusFilter, priorityFilter, sortField, sortDir]);

  const flatIssues = useMemo(() => {
    const groups: Record<string, Issue[]> = {};
    for (const issue of issues) {
      if (!groups[issue.status]) groups[issue.status] = [];
      groups[issue.status].push(issue);
    }
    const sorted = Object.entries(groups).sort(
      ([a], [b]) => STATUS_ORDER[a as IssueStatus] - STATUS_ORDER[b as IssueStatus]
    );
    return sorted.flatMap(([, g]) => g);
  }, [issues]);

  const clampIdx = useCallback(
    (idx: number) => Math.max(0, Math.min(idx, flatIssues.length - 1)),
    [flatIssues.length]
  );

  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        setFocusedIdx((i) => clampIdx(i + 1));
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        setFocusedIdx((i) => clampIdx(i - 1));
      } else if (e.key === "Enter" && focusedIdx >= 0 && flatIssues[focusedIdx]) {
        e.preventDefault();
        navigate(`/issues/${flatIssues[focusedIdx].id}`);
      } else if (e.key === " " && focusedIdx >= 0 && flatIssues[focusedIdx]) {
        e.preventDefault();
        const issue = flatIssues[focusedIdx];
        setExpandedId(expandedId === issue.id ? null : issue.id);
      }
    },
    [focusedIdx, flatIssues, clampIdx, navigate, expandedId]
  );

  const handleStatusChange = (issue: Issue, status: IssueStatus) => {
    updateIssue.mutate({ id: issue.id, input: { status } });
  };

  const handlePriorityChange = (issue: Issue, priority: Priority) => {
    updateIssue.mutate({ id: issue.id, input: { priority } });
  };

  const grouped = useMemo(() => {
    const groups: Record<string, Issue[]> = {};
    for (const issue of issues) {
      if (!groups[issue.status]) groups[issue.status] = [];
      groups[issue.status].push(issue);
    }
    return Object.entries(groups).sort(
      ([a], [b]) => STATUS_ORDER[a as IssueStatus] - STATUS_ORDER[b as IssueStatus]
    );
  }, [issues]);

  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-li-content-bg">
        <span className="text-li-text-muted text-sm">Loading issues…</span>
      </div>
    );
  }

  const activeFilters = statusFilter.length + priorityFilter.length;

  let flatIndex = 0;

  return (
    <div className="flex-1 flex flex-col bg-li-content-bg min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between h-11 px-4 border-b border-li-content-border shrink-0">
        <div className="flex items-center gap-2">
          <span className="text-[14px] font-medium text-li-text-bright">My Issues</span>
          {activeFilters > 0 && (
            <span className="text-[10px] text-li-text-badge bg-li-badge-bg rounded-full px-1.5 py-0.5">
              {activeFilters} filter{activeFilters > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setCreateOpen(true)}
            className="flex items-center gap-1.5 text-[12px] text-li-text-bright bg-li-dot-blue hover:bg-li-dot-blue/90 transition-colors px-2.5 py-1 rounded mr-1"
          >
            <Plus className="h-3 w-3" />
            New
            <Kbd keys={["N"]} className="ml-0.5" />
          </button>
          <MultiFilterDropdown label="Status" options={STATUS_OPTIONS} selected={statusFilter} onChange={setStatusFilter} />
          <MultiFilterDropdown label="Priority" options={PRIORITY_OPTIONS} selected={priorityFilter} onChange={setPriorityFilter} />
          <SortDropdown sortField={sortField} sortDir={sortDir} onChange={(f, d) => { setSortField(f); setSortDir(d); }} />
        </div>
      </div>

      {/* Content */}
      <div
        ref={listRef}
        className="flex-1 overflow-auto outline-none"
        tabIndex={0}
        onKeyDown={handleListKeyDown}
        onFocus={() => { if (focusedIdx < 0 && flatIssues.length > 0) setFocusedIdx(0); }}
      >
        {grouped.length === 0 ? (
          <div className="flex-1 flex items-center justify-center py-20">
            <p className="text-sm text-li-text-muted">No issues match the current filters</p>
          </div>
        ) : (
          grouped.map(([status, groupIssues]) => {
            const statusOpt = STATUS_OPTIONS.find((s) => s.value === status);
            return (
              <div key={status}>
                <div className="flex items-center h-[30px] px-4 sticky top-0 bg-li-content-bg z-10">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ backgroundColor: statusOpt?.color }} />
                    <span className="text-[12px] font-medium text-li-text-bright">{statusOpt?.label ?? status}</span>
                    <span className="text-[11px] text-li-text-muted">{groupIssues.length}</span>
                  </div>
                </div>
                {groupIssues.map((issue) => {
                  const myIdx = flatIndex++;
                  return (
                    <IssueRow
                      key={issue.id}
                      issue={issue}
                      expanded={expandedId === issue.id}
                      focused={focusedIdx === myIdx}
                      onToggle={() => setExpandedId(expandedId === issue.id ? null : issue.id)}
                      onStatusChange={handleStatusChange}
                      onPriorityChange={handlePriorityChange}
                      onOpenFull={(i) => navigate(`/issues/${i.id}`)}
                    />
                  );
                })}
              </div>
            );
          })
        )}
      </div>

      <CreateIssueModal open={createOpen} onOpenChange={setCreateOpen} />
    </div>
  );
}
