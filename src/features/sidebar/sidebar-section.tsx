'use client';

import { useEffect } from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import type { NavSection } from "./types";
import { SidebarItem } from "./sidebar-item";
import { useSidebarStore } from "./store";
import { SidebarContextMenu } from "./sidebar-context-menu";

interface SidebarSectionProps {
  section: NavSection;
}

export function SidebarSection({ section }: SidebarSectionProps) {
  const { openSections, toggleSection, initSection } = useSidebarStore();

  useEffect(() => {
    initSection(section.id, section.defaultOpen ?? true);
  }, [section.id, section.defaultOpen, initSection]);

  const isOpen = openSections[section.id] ?? section.defaultOpen ?? true;

  return (
    <div className="flex flex-col">
      {section.label && (
        <SidebarContextMenu config={section.contextMenu}>
          <button
            onClick={() => section.collapsible && toggleSection(section.id)}
            className={cn(
              "flex items-center gap-1 px-3 h-[26px] group",
              section.collapsible && "cursor-pointer"
            )}
          >
            {section.collapsible && (
              <ChevronRight
                className={cn(
                  "h-3 w-3 text-li-text-muted transition-transform duration-150",
                  isOpen && "rotate-90"
                )}
              />
            )}
            <span className="text-[11px] font-medium tracking-[0.06em] uppercase text-li-text-muted select-none">
              {section.label}
            </span>
            {section.headerAction && (
              <div className="ml-auto opacity-0 group-hover:opacity-100 transition-opacity">
                {section.headerAction}
              </div>
            )}
          </button>
        </SidebarContextMenu>
      )}
      {isOpen && (
        <div className="flex flex-col gap-0.5 px-1.5">
          {section.items.map((item) => (
            <SidebarItem key={item.id} item={item} />
          ))}
        </div>
      )}
    </div>
  );
}
