"use client";

import {
  useRouter,
  usePathname,
  useParams as useNextParams,
} from "next/navigation";
import NextLink from "next/link";
import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
  type ReactNode,
  type ComponentProps,
} from "react";
import { cn } from "@/lib/utils";

// ─── Navigation Context for Client-Side Routing ─────────────────────

interface RouteConfig {
  path: string;
  element: ReactNode;
  children?: RouteConfig[];
}

interface NavigationContextValue {
  pathname: string;
  routes: RouteConfig[];
  outlet: ReactNode | null;
  setOutlet: (outlet: ReactNode | null) => void;
}

const NavigationContext = createContext<NavigationContextValue | null>(null);

// ─── useNavigate Hook ───────────────────────────────────────────────

export function useNavigate() {
  const router = useRouter();

  return useCallback(
    (path: string | number, options?: { replace?: boolean }) => {
      if (typeof path === "number") {
        if (path === -1) {
          router.back();
        } else if (path === 1) {
          router.forward();
        }
      } else {
        if (options?.replace) {
          router.replace(path);
        } else {
          router.push(path);
        }
      }
    },
    [router]
  );
}

// ─── useLocation Hook ───────────────────────────────────────────────

export function useLocation() {
  const pathname = usePathname();
  return useMemo(() => ({ pathname }), [pathname]);
}

// ─── useParams Hook ─────────────────────────────────────────────────

export function useParams<T extends Record<string, string> = Record<string, string>>(): T {
  const params = useNextParams();
  const pathname = usePathname();
  
  // Extract params from pathname based on known route patterns
  return useMemo(() => {
    const result: Record<string, string> = { ...(params as Record<string, string>) };
    
    // Match /issues/:id pattern
    const issueMatch = pathname.match(/^\/issues\/([^/]+)/);
    if (issueMatch) {
      result.id = issueMatch[1];
    }
    
    // Match /:teamId/* patterns
    const teamMatch = pathname.match(/^\/([^/]+)\/(issues|projects|views)/);
    if (teamMatch && !["inbox", "reviews", "my-issues", "issues", "projects", "views"].includes(teamMatch[1])) {
      result.teamId = teamMatch[1];
    }
    
    return result as T;
  }, [params, pathname]);
}

// ─── Link Component ─────────────────────────────────────────────────

interface LinkProps extends Omit<ComponentProps<typeof NextLink>, "href"> {
  to: string;
}

export function Link({ to, children, className, ...props }: LinkProps) {
  return (
    <NextLink href={to} className={className} {...props}>
      {children}
    </NextLink>
  );
}

// ─── NavLink Component (with active state) ──────────────────────────

interface NavLinkProps extends Omit<LinkProps, "className"> {
  className?: string | ((props: { isActive: boolean; isPending: boolean }) => string);
  activeClassName?: string;
  pendingClassName?: string;
}

export function NavLink({
  to,
  children,
  className,
  activeClassName,
  pendingClassName,
  ...props
}: NavLinkProps) {
  const pathname = usePathname();
  const isActive = pathname === to || pathname.startsWith(to + "/");
  const isPending = false; // No pending state in Next.js

  const computedClassName = useMemo(() => {
    if (typeof className === "function") {
      return className({ isActive, isPending });
    }
    return cn(className, isActive && activeClassName, isPending && pendingClassName);
  }, [className, isActive, isPending, activeClassName, pendingClassName]);

  return (
    <NextLink href={to} className={computedClassName} {...props}>
      {children}
    </NextLink>
  );
}

// ─── Navigate Component (for redirects) ─────────────────────────────

interface NavigateProps {
  to: string;
  replace?: boolean;
}

export function Navigate({ to, replace = false }: NavigateProps) {
  const router = useRouter();

  useEffect(() => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [router, to, replace]);

  return null;
}

// ─── Outlet Component ───────────────────────────────────────────────

export function Outlet() {
  const context = useContext(NavigationContext);
  return <>{context?.outlet}</>;
}

// ─── Route Component (declarative route definition) ─────────────────

interface RouteProps {
  path?: string;
  element?: ReactNode;
  index?: boolean;
  children?: ReactNode;
}

export function Route(_props: RouteProps) {
  // This is a declarative component - actual routing logic is in Routes
  return null;
}

// ─── Routes Component (client-side router) ──────────────────────────

interface RoutesProps {
  children: ReactNode;
}

export function Routes({ children }: RoutesProps) {
  const pathname = usePathname();
  const [outlet, setOutlet] = useState<ReactNode | null>(null);

  // Parse route definitions from children
  const routes = useMemo(() => {
    const parseRoutes = (
      childNodes: ReactNode,
      parentPath = ""
    ): RouteConfig[] => {
      const result: RouteConfig[] = [];
      const childArray = Array.isArray(childNodes) ? childNodes : [childNodes];

      childArray.forEach((child) => {
        if (!child || typeof child !== "object" || !("type" in child)) return;

        const routeChild = child as { type: { name?: string }; props: RouteProps };
        if (routeChild.type?.name !== "Route" && (routeChild.type as unknown) !== Route) return;

        const { path, element, index, children: routeChildren } = routeChild.props;
        const fullPath = index ? parentPath : `${parentPath}/${path || ""}`.replace(/\/+/g, "/");

        const config: RouteConfig = {
          path: fullPath || "/",
          element,
          children: routeChildren ? parseRoutes(routeChildren, fullPath) : undefined,
        };

        result.push(config);
      });

      return result;
    };

    return parseRoutes(children);
  }, [children]);

  // Find matching route and render
  const matchedContent = useMemo(() => {
    const findMatch = (
      routeList: RouteConfig[],
      currentPath: string
    ): { element: ReactNode; childRoutes?: RouteConfig[] } | null => {
      for (const route of routeList) {
        // Check for exact match
        if (route.path === currentPath) {
          return { element: route.element, childRoutes: route.children };
        }

        // Check for dynamic segments (e.g., :id, :teamId)
        const routeParts = route.path.split("/").filter(Boolean);
        const pathParts = currentPath.split("/").filter(Boolean);

        if (routeParts.length <= pathParts.length) {
          let matches = true;
          const params: Record<string, string> = {};

          for (let i = 0; i < routeParts.length; i++) {
            const routePart = routeParts[i];
            const pathPart = pathParts[i];

            if (routePart.startsWith(":")) {
              params[routePart.slice(1)] = pathPart;
            } else if (routePart !== pathPart) {
              matches = false;
              break;
            }
          }

          if (matches && routeParts.length === pathParts.length) {
            return { element: route.element, childRoutes: route.children };
          }

          // Check nested routes
          if (matches && route.children) {
            const remainingPath = "/" + pathParts.slice(routeParts.length).join("/");
            const childMatch = findMatch(route.children, remainingPath);
            if (childMatch) {
              return { element: route.element, childRoutes: route.children };
            }
          }
        }

        // Check for catch-all (*) route
        if (route.path === "*") {
          return { element: route.element };
        }
      }

      return null;
    };

    return findMatch(routes, pathname);
  }, [routes, pathname]);

  // Update outlet when nested routes change
  useEffect(() => {
    if (matchedContent?.childRoutes) {
      const findChildMatch = (
        routeList: RouteConfig[],
        currentPath: string
      ): ReactNode | null => {
        for (const route of routeList) {
          // Handle index route
          if (route.path === "/" || route.path === "") {
            continue;
          }

          // Check for exact match
          if (currentPath === route.path || currentPath.startsWith(route.path)) {
            return route.element;
          }

          // Check for dynamic segments
          const routeParts = route.path.split("/").filter(Boolean);
          const pathParts = currentPath.split("/").filter(Boolean);

          if (routeParts.length === pathParts.length) {
            let matches = true;
            for (let i = 0; i < routeParts.length; i++) {
              const routePart = routeParts[i];
              const pathPart = pathParts[i];
              if (!routePart.startsWith(":") && routePart !== pathPart) {
                matches = false;
                break;
              }
            }
            if (matches) {
              return route.element;
            }
          }
        }

        // Check for index route at current path
        const indexRoute = routeList.find(
          (r) => r.path === "/" || r.path === ""
        );
        if (indexRoute && currentPath === "/") {
          return indexRoute.element;
        }

        return null;
      };

      const childContent = findChildMatch(matchedContent.childRoutes, pathname);
      setOutlet(childContent);
    }
  }, [matchedContent, pathname]);

  const contextValue = useMemo(
    () => ({
      pathname,
      routes,
      outlet,
      setOutlet,
    }),
    [pathname, routes, outlet]
  );

  if (!matchedContent) {
    // Try to find catch-all route
    const catchAll = routes.find((r) => r.path === "*");
    if (catchAll) {
      return <>{catchAll.element}</>;
    }
    return null;
  }

  return (
    <NavigationContext.Provider value={contextValue}>
      {matchedContent.element}
    </NavigationContext.Provider>
  );
}

// ─── BrowserRouter Compatibility (no-op wrapper) ────────────────────

interface BrowserRouterProps {
  children: ReactNode;
}

export function BrowserRouter({ children }: BrowserRouterProps) {
  // Next.js handles routing at the framework level, so this is a pass-through
  return <>{children}</>;
}
