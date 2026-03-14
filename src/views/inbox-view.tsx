'use client';

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import {
  Inbox as InboxIcon,
  Check,
  CheckCheck,
  Circle,
  ChevronRight,
  Trash2,
  Mail,
  MailOpen,
} from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { getNotificationService } from "@/services";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns";
import { Kbd } from "@/components/kbd";
import { useCounterStore } from "@/stores/counter-store";
import { useListSelection } from "@/hooks/use-list-selection";
import { BulkActionDialog, type BulkActionType } from "@/components/bulk-action-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { Notification } from "@/services/types";

// ─── Helpers ────────────────────────────────────────────

function groupByDate(items: Notification[]) {
  const groups: { label: string; items: Notification[] }[] = [];
  const buckets: Record<string, Notification[]> = {};

  for (const n of items) {
    const d = new Date(n.createdAt);
    let key: string;
    if (isToday(d)) key = "Today";
    else if (isYesterday(d)) key = "Yesterday";
    else if (isThisWeek(d)) key = "This week";
    else key = "Earlier";

    (buckets[key] ??= []).push(n);
  }

  const order = ["Today", "Yesterday", "This week", "Earlier"];
  for (const label of order) {
    if (buckets[label]?.length) groups.push({ label, items: buckets[label] });
  }
  return groups;
}

// ─── Notification row ──────────────────────────────────

function NotificationRow({
  n,
  index,
  isFocused,
  isSelected,
  showCheckbox,
  onToggleSelect,
  onMarkRead,
}: {
  n: Notification;
  index: number;
  isFocused: boolean;
  isSelected: boolean;
  showCheckbox: boolean;
  onToggleSelect: (index: number) => void;
  onMarkRead: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center h-[42px] px-4 border-b border-li-divider transition-colors cursor-pointer group",
        !n.read && "bg-li-bg-hover/50",
        isFocused && "ring-1 ring-inset ring-li-dot-blue",
        isSelected && "bg-li-dot-blue/10",
        !isSelected && !isFocused && "hover:bg-li-bg-hover"
      )}
      onClick={(e) => {
        if (e.shiftKey || showCheckbox) {
          onToggleSelect(index);
        } else if (!n.read) {
          onMarkRead(n.id);
        }
      }}
      tabIndex={-1}
      role="row"
      aria-selected={isSelected}
    >
      {/* Checkbox / Unread indicator */}
      <div className="flex items-center gap-2 shrink-0 mr-2">
        {showCheckbox ? (
          <Checkbox
            checked={isSelected}
            onCheckedChange={() => onToggleSelect(index)}
            onClick={(e) => e.stopPropagation()}
            className="h-3.5 w-3.5 border-li-border data-[state=checked]:bg-li-dot-blue data-[state=checked]:border-li-dot-blue"
            aria-label={`Select notification: ${n.title}`}
          />
        ) : (
          <div className="w-3.5 flex justify-center">
            {!n.read && (
              <Circle className="h-2 w-2 text-li-dot-blue fill-li-dot-blue" />
            )}
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <span
          className={cn(
            "text-[13px] truncate",
            n.read ? "text-li-text-muted" : "text-li-text-bright font-medium"
          )}
        >
          {n.title}
        </span>
      </div>

      {/* Meta & actions */}
      <div className="flex items-center gap-2 shrink-0 ml-4">
        <span className="text-[11px] text-li-text-muted">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </span>
        {isFocused && !showCheckbox && (
          <span className="flex items-center gap-1 opacity-60">
            <Kbd keys={["Space"]} className="text-[9px]" />
          </span>
        )}
        {!showCheckbox && !n.read && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(n.id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-li-text-muted hover:text-li-text-bright"
            title="Mark as read"
            aria-label="Mark as read"
          >
            <Check className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

// ─── Collapsible group ─────────────────────────────────

function NotificationGroup({
  label,
  items,
  itemIndexOffset,
  focusedIndex,
  selection,
  showCheckboxes,
  onToggleSelect,
  onMarkRead,
}: {
  label: string;
  items: Notification[];
  itemIndexOffset: number;
  focusedIndex: number;
  selection: UseListSelectionReturn;
  showCheckboxes: boolean;
  onToggleSelect: (index: number) => void;
  onMarkRead: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div role="rowgroup" aria-label={label}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full px-4 py-1.5 text-[11px] font-medium text-li-text-muted uppercase tracking-wider hover:text-li-text-bright transition-colors"
        aria-expanded={open}
      >
        <ChevronRight
          className={cn(
            "h-3 w-3 transition-transform duration-150",
            open && "rotate-90"
          )}
        />
        {label}
        <span className="text-li-text-badge ml-1">{items.length}</span>
      </button>
      {open &&
        items.map((n, localIdx) => {
          const globalIdx = itemIndexOffset + localIdx;
          return (
            <NotificationRow
              key={n.id}
              n={n}
              index={globalIdx}
              isFocused={selection.isFocused(globalIdx)}
              isSelected={selection.isSelected(n.id)}
              showCheckbox={showCheckboxes}
              onToggleSelect={onToggleSelect}
              onMarkRead={onMarkRead}
            />
          );
        })}
    </div>
  );
}

// Type for selection return
type UseListSelectionReturn = ReturnType<typeof useListSelection<Notification>>;

// ─── Page ──────────────────────────────────────────────

export function InboxView() {
  const { data: notifications = [], isLoading } = useNotifications();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const listRef = useRef<HTMLDivElement>(null);
  const setCount = useCounterStore((s) => s.setCount);

  // Bulk action dialog state
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogAction, setDialogAction] = useState<BulkActionType>("delete");
  const [isProcessing, setIsProcessing] = useState(false);

  const filtered = useMemo(
    () => (filter === "unread" ? notifications.filter((n) => !n.read) : notifications),
    [filter, notifications]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    setCount("inbox", unreadCount);
  }, [unreadCount, setCount]);

  // Multi-selection hook
  const selection = useListSelection({
    items: filtered,
    getItemId: (n) => n.id,
  });

  const showCheckboxes = selection.hasSelection;

  // ─── Actions ──────────────────────────────────────────

  const markAsRead = async (id: string) => {
    const svc = getNotificationService();
    await svc.markAsRead?.(id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const handleBulkMarkRead = async () => {
    setIsProcessing(true);
    try {
      const svc = getNotificationService();
      const ids = Array.from(selection.selectedIds);
      await svc.markManyAsRead?.(ids);
      qc.invalidateQueries({ queryKey: ["notifications"] });
      selection.clearSelection();
    } finally {
      setIsProcessing(false);
      setDialogOpen(false);
    }
  };

  const handleBulkMarkUnread = async () => {
    setIsProcessing(true);
    try {
      const svc = getNotificationService();
      const ids = Array.from(selection.selectedIds);
      await svc.markManyAsUnread?.(ids);
      qc.invalidateQueries({ queryKey: ["notifications"] });
      selection.clearSelection();
    } finally {
      setIsProcessing(false);
      setDialogOpen(false);
    }
  };

  const handleBulkDelete = async () => {
    setIsProcessing(true);
    try {
      const svc = getNotificationService();
      const ids = Array.from(selection.selectedIds);
      await svc.deleteMany?.(ids);
      qc.invalidateQueries({ queryKey: ["notifications"] });
      selection.clearSelection();
    } finally {
      setIsProcessing(false);
      setDialogOpen(false);
    }
  };

  const markAllAsRead = async () => {
    const svc = getNotificationService();
    await svc.markAllAsRead?.();
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const openBulkDialog = (action: BulkActionType) => {
    if (!selection.hasSelection) return;
    setDialogAction(action);
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    switch (dialogAction) {
      case "delete":
        handleBulkDelete();
        break;
      case "markRead":
        handleBulkMarkRead();
        break;
      case "markUnread":
        handleBulkMarkUnread();
        break;
    }
  };

  // ─── Keyboard handlers ────────────────────────────────

  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Let selection hook handle arrow keys and space
      selection.handleKeyDown(e);

      const key = e.key.toLowerCase();

      // Shift+A = Select all
      if (e.shiftKey && key === "a") {
        e.preventDefault();
        selection.selectAll();
        return;
      }

      // Only handle bulk actions when items are selected
      if (selection.hasSelection) {
        // R = Mark selected as read
        if (key === "r" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          openBulkDialog("markRead");
          return;
        }

        // U = Mark selected as unread
        if (key === "u" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          openBulkDialog("markUnread");
          return;
        }

        // Backspace = Delete selected
        if (key === "backspace" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
          e.preventDefault();
          openBulkDialog("delete");
          return;
        }
      }

      // Filter shortcuts
      if (key === "1") {
        setFilter("all");
      } else if (key === "2") {
        setFilter("unread");
      }
    },
    [selection]
  );

  // Calculate item index offset for each group
  const groups = useMemo(() => groupByDate(filtered), [filtered]);
  const groupOffsets = useMemo(() => {
    const offsets: number[] = [];
    let offset = 0;
    for (const group of groups) {
      offsets.push(offset);
      offset += group.items.length;
    }
    return offsets;
  }, [groups]);

  return (
    <div className="flex-1 flex flex-col bg-li-content-bg min-h-0">
      {/* Header */}
      <div className="flex items-center justify-between h-11 px-4 border-b border-li-content-border shrink-0">
        <div className="flex items-center gap-2">
          <InboxIcon className="h-4 w-4 text-li-text-muted" />
          <span className="text-[14px] font-medium text-li-text-bright">Inbox</span>
          {unreadCount > 0 && (
            <span className="text-[10px] bg-li-dot-blue text-li-text-bright rounded-full px-1.5 py-0.5 font-medium">
              {unreadCount}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setFilter("all")}
            className={cn(
              "flex items-center gap-1.5 text-[12px] px-2 py-1 rounded transition-colors",
              filter === "all"
                ? "text-li-text-bright bg-li-bg-hover"
                : "text-li-text-muted hover:text-li-text-bright"
            )}
          >
            All
            <Kbd keys={["1"]} />
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={cn(
              "flex items-center gap-1.5 text-[12px] px-2 py-1 rounded transition-colors",
              filter === "unread"
                ? "text-li-text-bright bg-li-bg-hover"
                : "text-li-text-muted hover:text-li-text-bright"
            )}
          >
            Unread
            <Kbd keys={["2"]} />
          </button>
          {unreadCount > 0 && !selection.hasSelection && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 text-[12px] text-li-text-muted hover:text-li-text-bright transition-colors px-2 py-1 rounded hover:bg-li-bg-hover ml-1"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
            </button>
          )}
        </div>
      </div>

      {/* Selection toolbar */}
      {selection.hasSelection && (
        <div className="flex items-center gap-3 px-4 py-2 border-b border-li-content-border bg-li-bg-hover/50 shrink-0">
          <span className="text-[12px] text-li-text-bright font-medium">
            {selection.selectionCount} selected
          </span>
          <div className="flex items-center gap-1 ml-auto">
            <button
              onClick={() => openBulkDialog("markRead")}
              className="flex items-center gap-1.5 text-[12px] text-li-text-muted hover:text-li-text-bright transition-colors px-2 py-1 rounded hover:bg-li-bg-hover"
              title="Mark selected as read (R)"
            >
              <MailOpen className="h-3.5 w-3.5" />
              Read
              <Kbd keys={["R"]} />
            </button>
            <button
              onClick={() => openBulkDialog("markUnread")}
              className="flex items-center gap-1.5 text-[12px] text-li-text-muted hover:text-li-text-bright transition-colors px-2 py-1 rounded hover:bg-li-bg-hover"
              title="Mark selected as unread (U)"
            >
              <Mail className="h-3.5 w-3.5" />
              Unread
              <Kbd keys={["U"]} />
            </button>
            <button
              onClick={() => openBulkDialog("delete")}
              className="flex items-center gap-1.5 text-[12px] text-red-400 hover:text-red-300 transition-colors px-2 py-1 rounded hover:bg-red-500/10"
              title="Delete selected (Backspace)"
            >
              <Trash2 className="h-3.5 w-3.5" />
              Delete
              <Kbd keys={["⌫"]} />
            </button>
            <button
              onClick={() => selection.clearSelection()}
              className="flex items-center gap-1.5 text-[12px] text-li-text-muted hover:text-li-text-bright transition-colors px-2 py-1 rounded hover:bg-li-bg-hover ml-2"
              title="Clear selection (Esc)"
            >
              Clear
              <Kbd keys={["Esc"]} />
            </button>
          </div>
        </div>
      )}

      {/* Keyboard hints */}
      <div className="flex items-center gap-3 px-4 py-1.5 border-b border-li-divider text-[10px] text-li-text-muted shrink-0">
        <span className="flex items-center gap-1">
          <Kbd keys={["↑", "↓"]} /> navigate
        </span>
        <span className="flex items-center gap-1">
          <Kbd keys={["⇧", "↑/↓"]} /> extend select
        </span>
        <span className="flex items-center gap-1">
          <Kbd keys={["Space"]} /> toggle select
        </span>
        <span className="flex items-center gap-1">
          <Kbd keys={["⇧", "A"]} /> select all
        </span>
      </div>

      {/* Content */}
      <div
        ref={listRef}
        className="flex-1 overflow-auto outline-none"
        tabIndex={0}
        onKeyDown={handleListKeyDown}
        role="grid"
        aria-label="Notifications list"
        aria-multiselectable="true"
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="text-sm text-li-text-muted">Loading...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20 flex-col gap-2">
            <InboxIcon className="h-10 w-10 text-li-text-muted" />
            <p className="text-sm text-li-text-muted">
              {filter === "unread" ? "No unread notifications" : "No notifications"}
            </p>
          </div>
        ) : (
          groups.map((group, groupIdx) => (
            <NotificationGroup
              key={group.label}
              label={group.label}
              items={group.items}
              itemIndexOffset={groupOffsets[groupIdx]}
              focusedIndex={selection.focusedIndex}
              selection={selection}
              showCheckboxes={showCheckboxes}
              onToggleSelect={selection.toggleItem}
              onMarkRead={markAsRead}
            />
          ))
        )}
      </div>

      {/* Bulk action confirmation dialog */}
      <BulkActionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        actionType={dialogAction}
        itemCount={selection.selectionCount}
        onConfirm={handleConfirm}
        isLoading={isProcessing}
      />
    </div>
  );
}
