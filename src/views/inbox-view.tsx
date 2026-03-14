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
import { useListSelection, type SectionGroup } from "@/hooks/use-list-selection";
import { BulkActionDialog, type BulkActionType } from "@/components/bulk-action-dialog";
import { Checkbox } from "@/components/ui/checkbox";
import type { Notification } from "@/services/types";

// ─── Helpers ────────────────────────────────────────────

function groupByDate(items: Notification[]): SectionGroup<Notification>[] {
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
  const groups: SectionGroup<Notification>[] = [];
  
  for (const label of order) {
    if (buckets[label]?.length) {
      groups.push({ id: label.toLowerCase().replace(/\s/g, "-"), label, items: buckets[label] });
    }
  }
  
  return groups;
}

// ─── Notification row ──────────────────────────────────

function NotificationRow({
  n,
  isFocused,
  isSelected,
  showCheckbox,
  onToggleSelect,
  onToggleRead,
  onMarkRead,
  onClick,
}: {
  n: Notification;
  isFocused: boolean;
  isSelected: boolean;
  showCheckbox: boolean;
  onToggleSelect: () => void;
  onToggleRead: () => void;
  onMarkRead: () => void;
  onClick: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center h-[42px] px-4 border-b border-li-divider transition-colors cursor-pointer group",
        !n.read && "bg-li-bg-hover/50",
        isFocused && "ring-1 ring-inset ring-li-dot-blue bg-li-bg-hover/30",
        isSelected && "bg-li-dot-blue/10",
        !isSelected && !isFocused && "hover:bg-li-bg-hover"
      )}
      onClick={(e) => {
        if (e.shiftKey) {
          // Shift+click extends selection
          onToggleSelect();
        } else if (showCheckbox) {
          // When checkboxes visible, click toggles selection
          onToggleSelect();
        } else {
          // Normal click: focus this item, clear selection, mark as read if unread
          onClick();
          if (!n.read) {
            onMarkRead();
          }
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
            onCheckedChange={onToggleSelect}
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
              onMarkRead();
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

// ─── Section header ────────────────────────────────────

function SectionHeader({
  label,
  count,
  isOpen,
  isFocused,
  isFullySelected,
  showCheckbox,
  onToggle,
  onSelectAll,
}: {
  label: string;
  count: number;
  isOpen: boolean;
  isFocused: boolean;
  isFullySelected: boolean;
  showCheckbox: boolean;
  onToggle: () => void;
  onSelectAll: () => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-1.5 w-full px-4 py-1.5 transition-colors",
        isFocused && "ring-1 ring-inset ring-li-dot-blue bg-li-bg-hover/30"
      )}
      role="row"
      tabIndex={-1}
    >
      {showCheckbox && (
        <Checkbox
          checked={isFullySelected}
          onCheckedChange={onSelectAll}
          onClick={(e) => e.stopPropagation()}
          className="h-3.5 w-3.5 mr-1 border-li-border data-[state=checked]:bg-li-dot-blue data-[state=checked]:border-li-dot-blue"
          aria-label={`Select all in ${label}`}
        />
      )}
      <button
        onClick={onToggle}
        className="flex items-center gap-1.5 text-[11px] font-medium text-li-text-muted uppercase tracking-wider hover:text-li-text-bright transition-colors"
        aria-expanded={isOpen}
      >
        <ChevronRight
          className={cn(
            "h-3 w-3 transition-transform duration-150",
            isOpen && "rotate-90"
          )}
        />
        {label}
        <span className="text-li-text-badge ml-1">{count}</span>
      </button>
      {isFocused && (
        <span className="ml-auto flex items-center gap-1 text-[10px] text-li-text-muted">
          <Kbd keys={["R"]} /> read
          <Kbd keys={["U"]} /> unread
          <Kbd keys={["⌫"]} /> delete
        </span>
      )}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────

export function InboxView() {
  const { data: notifications = [], isLoading } = useNotifications();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());
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

  const groups = useMemo(() => groupByDate(filtered), [filtered]);
  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    setCount("inbox", unreadCount);
  }, [unreadCount, setCount]);

  // Multi-selection hook with hierarchical navigation
  const selection = useListSelection({
    groups,
    getItemId: (n) => n.id,
  });

  const showCheckboxes = selection.hasSelection;

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // ─── Actions ──────────────────────────────────────────

  const markAsRead = async (id: string) => {
    const svc = getNotificationService();
    await svc.markAsRead?.(id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markAsUnread = async (id: string) => {
    const svc = getNotificationService();
    await svc.markAsUnread?.(id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const toggleRead = async (id: string, currentlyRead: boolean) => {
    if (currentlyRead) {
      await markAsUnread(id);
    } else {
      await markAsRead(id);
    }
  };

  const handleBulkMarkRead = async (ids: string[]) => {
    setIsProcessing(true);
    try {
      const svc = getNotificationService();
      await svc.markManyAsRead?.(ids);
      qc.invalidateQueries({ queryKey: ["notifications"] });
      selection.clearSelection();
    } finally {
      setIsProcessing(false);
      setDialogOpen(false);
    }
  };

  const handleBulkMarkUnread = async (ids: string[]) => {
    setIsProcessing(true);
    try {
      const svc = getNotificationService();
      await svc.markManyAsUnread?.(ids);
      qc.invalidateQueries({ queryKey: ["notifications"] });
      selection.clearSelection();
    } finally {
      setIsProcessing(false);
      setDialogOpen(false);
    }
  };

  const handleBulkDelete = async (ids: string[]) => {
    setIsProcessing(true);
    try {
      const svc = getNotificationService();
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

  // Get the IDs that the action should apply to
  const getActionTargetIds = useCallback((): string[] => {
    const { focusTarget, selectedIds, hasSelection } = selection;
    
    // If items are selected, use selection
    if (hasSelection) {
      return Array.from(selectedIds);
    }
    
    // If focused on a section, use all items in that section
    if (focusTarget.type === "section") {
      return selection.getSectionItemIds(focusTarget.sectionIndex);
    }
    
    // If focused on an item, use just that item
    const focusedItem = selection.getFocusedItem();
    return focusedItem ? [focusedItem.id] : [];
  }, [selection]);

  const openBulkDialog = (action: BulkActionType) => {
    const ids = getActionTargetIds();
    if (ids.length === 0) return;
    setDialogAction(action);
    setDialogOpen(true);
  };

  const handleConfirm = () => {
    const ids = getActionTargetIds();
    switch (dialogAction) {
      case "delete":
        handleBulkDelete(ids);
        break;
      case "markRead":
        handleBulkMarkRead(ids);
        break;
      case "markUnread":
        handleBulkMarkUnread(ids);
        break;
    }
  };

  // Handle action on single focused item (no dialog)
  const handleFocusedItemAction = useCallback(
    async (action: "read" | "unread" | "toggle") => {
      const { focusTarget, hasSelection } = selection;
      
      // Map action to dialog type
      const dialogType: BulkActionType = action === "unread" ? "markUnread" : "markRead";
      
      // If selection exists, open dialog instead
      if (hasSelection) {
        openBulkDialog(dialogType);
        return;
      }
      
      // If focused on section, apply to all items in section (with dialog)
      if (focusTarget.type === "section") {
        openBulkDialog(dialogType);
        return;
      }
      
      // Single item - apply immediately without dialog
      const focusedItem = selection.getFocusedItem();
      if (!focusedItem) return;
      
      if (action === "toggle") {
        await toggleRead(focusedItem.id, focusedItem.read);
      } else if (action === "read") {
        await markAsRead(focusedItem.id);
      } else {
        await markAsUnread(focusedItem.id);
      }
    },
    [selection]
  );

  // ─── Keyboard handlers ────────────────────────────────

  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      // Let selection hook handle arrow keys, space, escape
      selection.handleKeyDown(e);

      const key = e.key.toLowerCase();

      // Shift+A = Hierarchical select (section first, then all)
      if (e.shiftKey && key === "a") {
        e.preventDefault();
        selection.hierarchicalSelect();
        return;
      }

      // R = Mark as read (focused item, section, or selection)
      if (key === "r" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleFocusedItemAction("read");
        return;
      }

      // U = Mark as unread (focused item, section, or selection)
      if (key === "u" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        handleFocusedItemAction("unread");
        return;
      }

      // Space = Toggle read/unread (when not handled by selection hook for toggle)
      // Note: Space in selection hook toggles selection, but when nothing selected, toggle read state
      if (key === " " && !selection.hasSelection && selection.focusTarget.type === "item") {
        // Already handled by selection hook for toggling selection
        // But we want to also toggle read state - this is handled in the hook
      }

      // Backspace = Delete (focused item, section, or selection)
      if (key === "backspace" && !e.shiftKey && !e.metaKey && !e.ctrlKey) {
        e.preventDefault();
        openBulkDialog("delete");
        return;
      }

      // Filter shortcuts
      if (key === "1") {
        setFilter("all");
      } else if (key === "2") {
        setFilter("unread");
      }
    },
    [selection, handleFocusedItemAction]
  );

  // Handle toggle of section selection
  const handleSectionSelectAll = (sectionIndex: number) => {
    const sectionIds = selection.getSectionItemIds(sectionIndex);
    const isFullySelected = selection.isSectionFullySelected(sectionIndex);
    
    if (isFullySelected) {
      // Deselect all in section
      const newSelection = new Set(selection.selectedIds);
      sectionIds.forEach((id) => newSelection.delete(id));
      // We need to call internal method - for now, toggle each item
      sectionIds.forEach((_, itemIndex) => {
        if (selection.isSelected(sectionIds[itemIndex])) {
          selection.toggleItem(sectionIndex, itemIndex);
        }
      });
    } else {
      // Select all in section
      sectionIds.forEach((_, itemIndex) => {
        if (!selection.isSelected(sectionIds[itemIndex])) {
          selection.toggleItem(sectionIndex, itemIndex);
        }
      });
    }
  };

  const actionTargetCount = getActionTargetIds().length;

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
          <Kbd keys={["⇧", "A"]} /> select section/all
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
          groups.map((group, sectionIndex) => {
            const isCollapsed = collapsedSections.has(group.id);
            const isSectionFocused = selection.isSectionFocused(sectionIndex);
            const isFullySelected = selection.isSectionFullySelected(sectionIndex);
            
            return (
              <div key={group.id} role="rowgroup" aria-label={group.label}>
                <SectionHeader
                  label={group.label}
                  count={group.items.length}
                  isOpen={!isCollapsed}
                  isFocused={isSectionFocused}
                  isFullySelected={isFullySelected}
                  showCheckbox={showCheckboxes}
                  onToggle={() => toggleSection(group.id)}
                  onSelectAll={() => handleSectionSelectAll(sectionIndex)}
                />
                {!isCollapsed &&
                  group.items.map((n, itemIndex) => (
                    <NotificationRow
                      key={n.id}
                      n={n}
                      isFocused={selection.isItemFocused(sectionIndex, itemIndex)}
                      isSelected={selection.isSelected(n.id)}
                      showCheckbox={showCheckboxes}
                      onToggleSelect={() => selection.toggleItem(sectionIndex, itemIndex)}
                      onToggleRead={() => toggleRead(n.id, n.read)}
                      onMarkRead={() => markAsRead(n.id)}
                      onClick={() => selection.focusItemOnly(sectionIndex, itemIndex)}
                    />
                  ))}
              </div>
            );
          })
        )}
      </div>

      {/* Bulk action confirmation dialog */}
      <BulkActionDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        actionType={dialogAction}
        itemCount={actionTargetCount}
        onConfirm={handleConfirm}
        isLoading={isProcessing}
      />
    </div>
  );
}
