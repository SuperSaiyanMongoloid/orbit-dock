'use client';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Kbd } from "@/components/kbd";
import { cn } from "@/lib/utils";

export type BulkActionType = "delete" | "markRead" | "markUnread";

interface BulkActionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  actionType: BulkActionType;
  itemCount: number;
  onConfirm: () => void;
  isLoading?: boolean;
}

const ACTION_CONFIG: Record<
  BulkActionType,
  {
    title: string;
    description: (count: number) => string;
    confirmLabel: string;
    confirmShortcut: string[];
    variant: "default" | "destructive";
  }
> = {
  delete: {
    title: "Delete items",
    description: (count) =>
      `Are you sure you want to delete ${count} item${count === 1 ? "" : "s"}? This action cannot be undone.`,
    confirmLabel: "Delete",
    confirmShortcut: ["Enter"],
    variant: "destructive",
  },
  markRead: {
    title: "Mark as read",
    description: (count) =>
      `Mark ${count} item${count === 1 ? "" : "s"} as read?`,
    confirmLabel: "Mark read",
    confirmShortcut: ["Enter"],
    variant: "default",
  },
  markUnread: {
    title: "Mark as unread",
    description: (count) =>
      `Mark ${count} item${count === 1 ? "" : "s"} as unread?`,
    confirmLabel: "Mark unread",
    confirmShortcut: ["Enter"],
    variant: "default",
  },
};

export function BulkActionDialog({
  open,
  onOpenChange,
  actionType,
  itemCount,
  onConfirm,
  isLoading = false,
}: BulkActionDialogProps) {
  const config = ACTION_CONFIG[actionType];

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent className="bg-li-content-bg border-li-content-border max-w-md">
        <AlertDialogHeader>
          <AlertDialogTitle className="text-li-text-bright text-base">
            {config.title}
          </AlertDialogTitle>
          <AlertDialogDescription className="text-li-text-muted text-sm">
            {config.description(itemCount)}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter className="gap-2 sm:gap-2">
          <AlertDialogCancel
            className="bg-transparent border-li-border text-li-text-muted hover:bg-li-bg-hover hover:text-li-text-bright"
            disabled={isLoading}
          >
            Cancel
            <Kbd keys={["Esc"]} className="ml-2" />
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              "gap-2",
              config.variant === "destructive"
                ? "bg-red-600 hover:bg-red-700 text-white"
                : "bg-li-dot-blue hover:bg-li-dot-blue/90 text-white"
            )}
          >
            {isLoading ? "Processing..." : config.confirmLabel}
            <Kbd keys={config.confirmShortcut} className="ml-1" />
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
