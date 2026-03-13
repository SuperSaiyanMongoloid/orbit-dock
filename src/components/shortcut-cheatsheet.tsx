'use client';

import { cn } from "@/lib/utils";
import { Kbd, getModKey } from "@/components/kbd";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";

interface ShortcutCheatsheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const mod = getModKey();

const SECTIONS = [
  {
    title: "Navigation",
    shortcuts: [
      { keys: ["G", "I"], label: "Go to Inbox" },
      { keys: ["G", "R"], label: "Go to Reviews" },
      { keys: ["G", "B"], label: "Go to My Issues" },
      { keys: ["G", "P"], label: "Go to Projects" },
      { keys: ["G", "V"], label: "Go to Views" },
    ],
  },
  {
    title: "Actions",
    shortcuts: [
      { keys: [mod, "K"], label: "Open search" },
      { keys: ["N"], label: "Create new issue" },
      { keys: ["?"], label: "Show this cheatsheet" },
      { keys: [mod, "B"], label: "Toggle sidebar" },
    ],
  },
  {
    title: "Lists",
    shortcuts: [
      { keys: ["↓", "/", "J"], label: "Move down" },
      { keys: ["↑", "/", "K"], label: "Move up" },
      { keys: ["Enter"], label: "Open item" },
      { keys: ["Space"], label: "Toggle read / select" },
      { keys: ["O"], label: "Open full view" },
    ],
  },
  {
    title: "Inbox",
    shortcuts: [
      { keys: ["S"], label: "Toggle read/unread" },
      { keys: ["⇧", "A"], label: "Mark all as read" },
      { keys: ["1"], label: "Filter: All" },
      { keys: ["2"], label: "Filter: Unread" },
    ],
  },
  {
    title: "Issue Detail",
    shortcuts: [
      { keys: ["E"], label: "Focus editor" },
      { keys: ["/"], label: "Focus input" },
      { keys: ["Alt", "S"], label: "Save editor" },
    ],
  },
  {
    title: "General",
    shortcuts: [
      { keys: ["Esc"], label: "Close modal / panel" },
      { keys: ["Tab"], label: "Focus next element" },
      { keys: ["⇧", "Tab"], label: "Focus previous element" },
    ],
  },
];

export function ShortcutCheatsheet({ open, onOpenChange }: ShortcutCheatsheetProps) {
  const overlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === overlayRef.current) onOpenChange(false);
      }}
    >
      <div className="bg-li-bg border border-li-border rounded-lg shadow-2xl w-full max-w-[640px] max-h-[80vh] overflow-auto">
        <div className="flex items-center justify-between px-5 py-3 border-b border-li-border sticky top-0 bg-li-bg z-10">
          <h2 className="text-[14px] font-semibold text-li-text-bright">Keyboard Shortcuts</h2>
          <button
            onClick={() => onOpenChange(false)}
            className="text-li-text-muted hover:text-li-text-bright transition-colors p-1 rounded hover:bg-li-bg-hover"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid grid-cols-2 gap-x-6 gap-y-5 p-5">
          {SECTIONS.map((section) => (
            <div key={section.title}>
              <h3 className="text-[11px] font-medium text-li-text-muted uppercase tracking-wider mb-2">
                {section.title}
              </h3>
              <div className="space-y-1.5">
                {section.shortcuts.map((shortcut) => (
                  <div
                    key={shortcut.label}
                    className="flex items-center justify-between py-1"
                  >
                    <span className="text-[12px] text-li-text">{shortcut.label}</span>
                    <Kbd keys={shortcut.keys} />
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
