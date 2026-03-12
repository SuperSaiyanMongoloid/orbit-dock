import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Inbox as InboxIcon, Check, CheckCheck, Circle, ChevronRight } from "lucide-react";
import { useNotifications } from "@/hooks/use-notifications";
import { getNotificationService } from "@/services";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { formatDistanceToNow, isToday, isYesterday, isThisWeek } from "date-fns";
import { Kbd } from "@/components/kbd";
import { useCounterStore } from "@/stores/counter-store";
import { useRouteShortcuts } from "@/hooks/use-route-shortcuts";
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
  isFocused,
  onMarkRead,
}: {
  n: Notification;
  isFocused: boolean;
  onMarkRead: (id: string) => void;
}) {
  return (
    <div
      className={cn(
        "flex items-center h-[42px] px-4 border-b border-li-divider transition-colors cursor-pointer hover:bg-li-bg-hover group",
        !n.read && "bg-li-bg-hover/50",
        isFocused && "ring-1 ring-inset ring-li-dot-blue bg-li-bg-hover"
      )}
      onClick={() => !n.read && onMarkRead(n.id)}
      tabIndex={-1}
    >
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-2 flex justify-center shrink-0">
          {!n.read && <Circle className="h-2 w-2 text-li-dot-blue fill-li-dot-blue" />}
        </div>
        <span
          className={cn(
            "text-[13px] truncate",
            n.read ? "text-li-text-muted" : "text-li-text-bright font-medium"
          )}
        >
          {n.title}
        </span>
      </div>
      <div className="flex items-center gap-2 shrink-0 ml-4">
        <span className="text-[11px] text-li-text-muted">
          {formatDistanceToNow(new Date(n.createdAt), { addSuffix: true })}
        </span>
        {isFocused && (
          <span className="flex items-center gap-1 opacity-60">
            <Kbd keys={["S"]} className="text-[9px]" />
          </span>
        )}
        {!n.read && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onMarkRead(n.id);
            }}
            className="opacity-0 group-hover:opacity-100 transition-opacity text-li-text-muted hover:text-li-text-bright"
            title="Mark as read"
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
  focusedId,
  onMarkRead,
}: {
  label: string;
  items: Notification[];
  focusedId: string | null;
  onMarkRead: (id: string) => void;
}) {
  const [open, setOpen] = useState(true);

  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1.5 w-full px-4 py-1.5 text-[11px] font-medium text-li-text-muted uppercase tracking-wider hover:text-li-text-bright transition-colors"
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
        items.map((n) => (
          <NotificationRow
            key={n.id}
            n={n}
            isFocused={focusedId === n.id}
            onMarkRead={onMarkRead}
          />
        ))}
    </div>
  );
}

// ─── Page ──────────────────────────────────────────────

export default function InboxPage() {
  const { data: notifications = [], isLoading } = useNotifications();
  const qc = useQueryClient();
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [focusedIdx, setFocusedIdx] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const setCount = useCounterStore((s) => s.setCount);

  const filtered = useMemo(
    () => (filter === "unread" ? notifications.filter((n) => !n.read) : notifications),
    [filter, notifications]
  );

  const unreadCount = notifications.filter((n) => !n.read).length;

  useEffect(() => {
    setCount("inbox", unreadCount);
  }, [unreadCount, setCount]);

  // Auto-select first item when list changes
  useEffect(() => {
    if (filtered.length > 0 && focusedIdx < 0) {
      setFocusedIdx(0);
    } else if (focusedIdx >= filtered.length) {
      setFocusedIdx(Math.max(0, filtered.length - 1));
    }
  }, [filtered.length, focusedIdx]);

  const markAsRead = async (id: string) => {
    const svc = getNotificationService();
    await svc.markAsRead?.(id);
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const toggleRead = async (id: string) => {
    const svc = getNotificationService();
    const notif = notifications.find((n) => n.id === id);
    if (!notif) return;
    if (notif.read) {
      await svc.markAsUnread?.(id);
    } else {
      await svc.markAsRead?.(id);
    }
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  const markAllAsRead = async () => {
    const svc = getNotificationService();
    await svc.markAllAsRead?.();
    qc.invalidateQueries({ queryKey: ["notifications"] });
  };

  // ─── Route shortcuts ──────────────────────────────────
  useRouteShortcuts({
    onToggleRead: () => {
      if (focusedIdx >= 0 && filtered[focusedIdx]) {
        toggleRead(filtered[focusedIdx].id);
      }
    },
    onMarkAllRead: () => markAllAsRead(),
    onFilterAll: () => setFilter("all"),
    onFilterUnread: () => setFilter("unread"),
  });

  const clampIdx = useCallback(
    (idx: number) => Math.max(0, Math.min(idx, filtered.length - 1)),
    [filtered.length]
  );

  const handleListKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        setFocusedIdx((i) => clampIdx(i + 1));
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        setFocusedIdx((i) => clampIdx(i - 1));
      } else if (
        (e.key === "Enter" || e.key === " ") &&
        focusedIdx >= 0 &&
        filtered[focusedIdx]
      ) {
        e.preventDefault();
        toggleRead(filtered[focusedIdx].id);
      }
    },
    [focusedIdx, filtered, clampIdx]
  );

  const groups = useMemo(() => groupByDate(filtered), [filtered]);
  const focusedId = focusedIdx >= 0 ? filtered[focusedIdx]?.id ?? null : null;

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
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="flex items-center gap-1.5 text-[12px] text-li-text-muted hover:text-li-text-bright transition-colors px-2 py-1 rounded hover:bg-li-bg-hover ml-1"
            >
              <CheckCheck className="h-3 w-3" />
              Mark all read
              <Kbd keys={["⇧", "A"]} />
            </button>
          )}
        </div>
      </div>

      {/* List hint bar */}
      <div className="flex items-center gap-3 px-4 py-1.5 border-b border-li-divider text-[10px] text-li-text-muted shrink-0">
        <span className="flex items-center gap-1"><Kbd keys={["↑", "↓"]} /> navigate</span>
        <span className="flex items-center gap-1"><Kbd keys={["Space"]} /> toggle read</span>
        <span className="flex items-center gap-1"><Kbd keys={["S"]} /> toggle focused</span>
        <span className="flex items-center gap-1"><Kbd keys={["⇧", "A"]} /> read all</span>
      </div>

      {/* Content */}
      <div
        ref={listRef}
        className="flex-1 overflow-auto outline-none"
        tabIndex={0}
        onKeyDown={handleListKeyDown}
        onFocus={() => {
          if (focusedIdx < 0 && filtered.length > 0) setFocusedIdx(0);
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <span className="text-sm text-li-text-muted">Loading…</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex items-center justify-center py-20 flex-col gap-2">
            <InboxIcon className="h-10 w-10 text-li-text-muted" />
            <p className="text-sm text-li-text-muted">
              {filter === "unread" ? "No unread notifications" : "No notifications"}
            </p>
          </div>
        ) : (
          groups.map((group) => (
            <NotificationGroup
              key={group.label}
              label={group.label}
              items={group.items}
              focusedId={focusedId}
              onMarkRead={markAsRead}
            />
          ))
        )}
      </div>
    </div>
  );
}
