import { NavLink as NavigationNavLink } from "@/lib/navigation";
import { forwardRef, type ComponentProps } from "react";

type NavLinkProps = ComponentProps<typeof NavigationNavLink>;

const NavLink = forwardRef<HTMLAnchorElement, NavLinkProps>(
  (props, ref) => {
    return <NavigationNavLink ref={ref as never} {...props} />;
  },
);

NavLink.displayName = "NavLink";

export { NavLink };
