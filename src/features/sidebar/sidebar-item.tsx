import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import type { NavItem } from "./types";
import { useSidebarStore } from "./store";
import { SidebarContextMenu } from "./sidebar-context-menu";
import { Kbd } from "@/components/kbd";

interface SidebarItemProps {
  item: NavItem;
  indent?: boolean | number;
}

export function SidebarItem({ item, indent }: SidebarItemProps) {
  const { setActiveItem } = useSidebarStore();
  const location = useLocation();

  const isActive = item.href
    ? location.pathname === item.href
    : useSidebarStore.getState().activeItemId === item.id;

  const indentLevel = item.indent ?? (typeof indent === "number" ? indent : indent ? 1 : 0);
  const indentPx = indentLevel > 0 ? `${14 + indentLevel * 16}px` : undefined;

  const content = (
    <>
      {item.icon && (
        <item.icon
          className={cn(
            "h-4 w-4 shrink-0",
            isActive ? "text-li-text-bright" : "text-li-text-muted"
          )}
        />
      )}
      <span className="truncate text-[13px]">{item.label}</span>
      {item.badge && (
        <span className="ml-auto text-[11px] tabular-nums text-li-text-badge">
          {item.badge.count}
        </span>
      )}
      {item.shortcut && (
        <Kbd
          keys={item.shortcut.split(" ")}
          className="ml-auto opacity-0 group-hover/item:opacity-100 transition-opacity"
        />
      )}
    </>
  );

  const className = cn(
    "group/item flex items-center gap-2 h-[27px] px-2 rounded-md cursor-pointer select-none transition-colors duration-75",
    isActive
      ? "bg-li-bg-active text-li-text-bright font-medium"
      : "text-li-text hover:bg-li-bg-hover hover:text-li-text-bright"
  );

  const style = indentPx ? { paddingLeft: indentPx } : undefined;

  const inner = item.href ? (
    <Link to={item.href} className={className} style={style} onClick={() => setActiveItem(item.id)}>
      {content}
    </Link>
  ) : (
    <button
      className={cn(className, "w-full text-left")}
      style={style}
      onClick={() => {
        setActiveItem(item.id);
        item.action?.();
      }}
    >
      {content}
    </button>
  );

  return (
    <SidebarContextMenu config={item.contextMenu}>
      {inner}
    </SidebarContextMenu>
  );
}
