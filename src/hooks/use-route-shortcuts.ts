/**
 * Shared route-level shortcut pattern using native keydown.
 *
 * Shortcut scheme:
 *   s            = toggle read on focused item
 *   Shift+A      = mark all read
 *   n / Shift+N  = new item
 *   o            = open selected
 *   e            = focus editor
 *   /            = focus primary input
 *   Alt+S        = save
 *   1            = filter: all
 *   2            = filter: unread
 */
import { useEffect, useRef } from "react";

export interface RouteActions {
  onNew?: () => void;
  onOpen?: () => void;
  onEdit?: () => void;
  onFocusInput?: () => void;
  onSave?: () => void;
  onToggleRead?: () => void;
  onMarkAllRead?: () => void;
  onFilterAll?: () => void;
  onFilterUnread?: () => void;
}

function isTyping(e: KeyboardEvent): boolean {
  const tag = (e.target as HTMLElement)?.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT") return true;
  if ((e.target as HTMLElement)?.isContentEditable) return true;
  return false;
}

export function useRouteShortcuts(actions: RouteActions) {
  const actionsRef = useRef(actions);
  actionsRef.current = actions;

  useEffect(() => {
    function handler(e: KeyboardEvent) {
      if (isTyping(e)) return;

      const a = actionsRef.current;
      const key = e.key.toLowerCase();
      const shift = e.shiftKey;
      const alt = e.altKey;
      const meta = e.metaKey || e.ctrlKey;

      // Don't intercept modifier combos we don't handle
      if (meta) return;

      // Alt+S = save
      if (alt && key === "s" && a.onSave) {
        e.preventDefault();
        a.onSave();
        return;
      }
      if (alt) return;

      // Shift+A = mark all read
      if (shift && key === "a" && a.onMarkAllRead) {
        e.preventDefault();
        a.onMarkAllRead();
        return;
      }
      // Shift+N = new
      if (shift && key === "n" && a.onNew) {
        e.preventDefault();
        a.onNew();
        return;
      }
      if (shift) return;

      // Single keys (no modifiers)
      switch (key) {
        case "s":
          if (a.onToggleRead) { a.onToggleRead(); }
          break;
        case "n":
          if (a.onNew) { a.onNew(); }
          break;
        case "o":
          if (a.onOpen) { a.onOpen(); }
          break;
        case "e":
          if (a.onEdit) { a.onEdit(); }
          break;
        case "/":
          if (a.onFocusInput) { e.preventDefault(); a.onFocusInput(); }
          break;
        case "1":
          if (a.onFilterAll) { a.onFilterAll(); }
          break;
        case "2":
          if (a.onFilterUnread) { a.onFilterUnread(); }
          break;
      }
    }

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);
}
