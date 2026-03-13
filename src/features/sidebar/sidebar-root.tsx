'use client';

import { useEffect } from "react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";
import type { SidebarConfig } from "./types";
import { SidebarHeader } from "./sidebar-header";
import { SidebarItem } from "./sidebar-item";
import { SidebarSection } from "./sidebar-section";
import { SidebarTeam } from "./sidebar-team";
import { SidebarFooter } from "./sidebar-footer";
import { useSidebarStore } from "./store";

interface SidebarRootProps {
  config: SidebarConfig;
}

export function SidebarRoot({ config }: SidebarRootProps) {
  const { collapsed, toggleCollapsed } = useSidebarStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "b") {
        e.preventDefault();
        toggleCollapsed();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleCollapsed]);

  return (
    <aside
      className={cn(
        "h-screen flex flex-col bg-li-bg border-r border-li-border shrink-0 transition-[width] duration-200 ease-in-out overflow-hidden",
        collapsed ? "w-0" : "w-[240px]"
      )}
    >
      <SidebarHeader user={config.user} />

      <div className="h-px bg-li-divider mx-3" />

      <ScrollArea className="flex-1 min-h-0">
        <div className="flex flex-col gap-3 py-2">
          {/* Top nav items */}
          <div className="flex flex-col gap-0.5 px-1.5">
            {config.topItems.map((item) => (
              <SidebarItem key={item.id} item={item} />
            ))}
          </div>

          {/* Divider */}
          <div className="h-px bg-li-divider mx-3" />

          {/* Sections */}
          {config.sections.map((section) => (
            <SidebarSection key={section.id} section={section} />
          ))}

          {/* Divider before teams */}
          {config.teams.length > 0 && (
            <>
              <div className="h-px bg-li-divider mx-3" />
              <div className="px-3">
                <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-li-text-muted select-none">
                  Your teams
                </span>
              </div>
              <div className="flex flex-col gap-0.5">
                {config.teams.map((team) => (
                  <SidebarTeam key={team.id} team={team} />
                ))}
              </div>
            </>
          )}
        </div>
      </ScrollArea>

      <SidebarFooter items={config.footerItems} slot={config.footerSlot} />
    </aside>
  );
}
