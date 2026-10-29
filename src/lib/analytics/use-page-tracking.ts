import * as React from "react";
import { useLocation } from "@tanstack/react-router";
import { track } from "./tracker";

/**
 * Root page tracking hook: fires a single `pageview` event when route transitions complete.
 * Automatically excludes /admin/* routes.
 */
export function usePageTracking(): void {
  const location = useLocation();
  const lastTrackedPathRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    const path = location.pathname;

    // Skip if path is in admin or already tracked for this navigation
    if (path.startsWith("/admin") || lastTrackedPathRef.current === path) {
      return;
    }

    lastTrackedPathRef.current = path;

    // Detect entity type from pathname
    let entityType: "post" | "case" | "sales" | "audit" | "general" = "general";
    let entityId: string | undefined = undefined;

    if (path.startsWith("/journal/")) {
      entityType = "post";
      entityId = path.replace("/journal/", "").replace(/\/$/, "");
    } else if (path.startsWith("/cases/")) {
      entityType = "case";
      entityId = path.replace("/cases/", "").replace(/\/$/, "");
    } else if (path.startsWith("/sales/") || path.startsWith("/tools/")) {
      entityType = "sales";
      entityId = path.replace(/^\/(sales|tools)\//, "").replace(/\/$/, "");
    } else if (path.startsWith("/audit")) {
      entityType = "audit";
    }

    track("pageview", {
      path,
      entityType,
      entityId,
    });
  }, [location.pathname]);
}

