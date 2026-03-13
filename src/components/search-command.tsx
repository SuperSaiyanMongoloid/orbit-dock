'use client';

import { useState, useEffect } from "react";
import { useNavigate } from "@/lib/navigation";
import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
  CommandSeparator,
} from "@/components/ui/command";
import {
  Inbox,
  GitPullRequest,
  CircleUser,
  FolderKanban,
  Eye,
  CircleDot,
} from "lucide-react";
import { useIssues } from "@/hooks/use-issues";

interface SearchCommandProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function SearchCommand({ open, onOpenChange }: SearchCommandProps) {
  const navigate = useNavigate();
  const { data } = useIssues();
  const issues = data?.data ?? [];

  const go = (path: string) => {
    navigate(path);
    onOpenChange(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Search pages, issues…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigation">
          <CommandItem onSelect={() => go("/inbox")}>
            <Inbox className="mr-2 h-4 w-4" />
            Inbox
          </CommandItem>
          <CommandItem onSelect={() => go("/reviews")}>
            <GitPullRequest className="mr-2 h-4 w-4" />
            Reviews
          </CommandItem>
          <CommandItem onSelect={() => go("/my-issues")}>
            <CircleUser className="mr-2 h-4 w-4" />
            My Issues
          </CommandItem>
          <CommandItem onSelect={() => go("/projects")}>
            <FolderKanban className="mr-2 h-4 w-4" />
            Projects
          </CommandItem>
          <CommandItem onSelect={() => go("/views")}>
            <Eye className="mr-2 h-4 w-4" />
            Views
          </CommandItem>
        </CommandGroup>
        {issues.length > 0 && (
          <>
            <CommandSeparator />
            <CommandGroup heading="Issues">
              {issues.slice(0, 8).map((issue) => (
                <CommandItem key={issue.id} onSelect={() => go(`/issues/${issue.id}`)}>
                  <CircleDot className="mr-2 h-4 w-4" />
                  <span className="text-li-text-muted mr-1.5 text-[11px]">{issue.identifier}</span>
                  {issue.title}
                </CommandItem>
              ))}
            </CommandGroup>
          </>
        )}
      </CommandList>
    </CommandDialog>
  );
}
