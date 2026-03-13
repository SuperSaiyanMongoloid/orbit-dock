'use client';

import { useEffect, useState } from "react";
import { ChevronRight, MoreHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import type { TeamConfig } from "./types";
import { SidebarItem } from "./sidebar-item";
import { useSidebarStore } from "./store";
import { SidebarContextMenu } from "./sidebar-context-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface SidebarTeamProps {
  team: TeamConfig;
}

export function SidebarTeam({ team }: SidebarTeamProps) {
  const { openTeams, toggleTeam, initTeam } = useSidebarStore();
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    initTeam(team.id, true);
  }, [team.id, initTeam]);

  const isOpen = openTeams[team.id] ?? true;

  return (
    <div className="flex flex-col">
      <SidebarContextMenu config={team.contextMenu}>
        <div className="group flex items-center h-[27px] px-3 cursor-pointer select-none hover:bg-li-bg-hover rounded-md mx-1.5">
          <button
            onClick={() => toggleTeam(team.id)}
            className="flex items-center gap-2 flex-1 min-w-0"
          >
            <ChevronRight
              className={cn(
                "h-3 w-3 text-li-text-muted transition-transform duration-150 shrink-0",
                isOpen && "rotate-90"
              )}
            />
            <span
              className="h-2 w-2 rounded-full shrink-0"
              style={{
                backgroundColor: team.color || "hsl(var(--li-dot-green))",
              }}
            />
            <span className="text-[13px] text-li-text-bright truncate">
              {team.label}
            </span>
          </button>

          {team.contextMenu && (
            <DropdownMenu open={menuOpen} onOpenChange={setMenuOpen}>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "h-5 w-5 flex items-center justify-center rounded shrink-0 transition-opacity",
                    menuOpen
                      ? "opacity-100"
                      : "opacity-0 group-hover:opacity-100"
                  )}
                  onClick={(e) => e.stopPropagation()}
                >
                  <MoreHorizontal className="h-3.5 w-3.5 text-li-text-muted" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="start"
                className="w-52 bg-li-menu-bg border-li-menu-border rounded-lg shadow-xl p-1"
              >
                {team.contextMenu.items.map((menuItem, i) =>
                  menuItem.separator ? (
                    <DropdownMenuSeparator
                      key={`sep-${i}`}
                      className="bg-li-divider"
                    />
                  ) : (
                    <DropdownMenuItem
                      key={menuItem.id}
                      onClick={menuItem.action}
                      disabled={menuItem.disabled}
                      className="text-[12.5px] text-li-text hover:text-li-text-bright hover:bg-li-menu-bg-hover rounded-md cursor-pointer gap-2"
                    >
                      {menuItem.icon && (
                        <menuItem.icon className="h-3.5 w-3.5 text-li-text-muted" />
                      )}
                      {menuItem.label}
                    </DropdownMenuItem>
                  )
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </SidebarContextMenu>

      {isOpen && (
        <div className="flex flex-col gap-0.5 px-1.5">
          {team.items.map((item) => (
            <SidebarItem key={item.id} item={item} indent={1} />
          ))}
        </div>
      )}
    </div>
  );
}
