import * as React from "react";
import { isReadQualified } from "./schema";
import { track } from "./tracker";

interface UseReadTrackingOptions {
  slug: string;
  readingMinutes: number;
  entityType: "post" | "case";
}

/**
 * Tracks engaged reading time and scroll depth on articles and case studies per Decision D17.
 * Uses Page Visibility API to measure only when the article is actively viewed on screen.
 * Dispatches at most 2 events:
 * 1. `read` event fired once when criteria are satisfied (>= 70% scroll + min(30s, 40% reading time)).
 * 2. `engagement` event on page hide/unload reporting final duration and scroll depth.
 */
export function useReadTracking({
  slug,
  readingMinutes,
  entityType,
}: UseReadTrackingOptions): void {
  const hasFiredReadRef = React.useRef(false);
  const maxScrollDepthRef = React.useRef(0);
  const visibleSecondsRef = React.useRef(0);
  const lastVisibilityTimestampRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    hasFiredReadRef.current = false;
    maxScrollDepthRef.current = 0;
    visibleSecondsRef.current = 0;
    lastVisibilityTimestampRef.current = document.visibilityState === "visible" ? Date.now() : null;

    // Helper to flush current visible duration
    const flushVisibleDuration = () => {
      if (lastVisibilityTimestampRef.current !== null) {
        const now = Date.now();
        const deltaSec = Math.floor((now - lastVisibilityTimestampRef.current) / 1000);
        if (deltaSec > 0) {
          visibleSecondsRef.current += deltaSec;
          lastVisibilityTimestampRef.current = now;
        }
      }
    };

    // Check read qualification
    const checkReadCriteria = () => {
      if (hasFiredReadRef.current) return;
      flushVisibleDuration();

      if (
        isReadQualified(
          maxScrollDepthRef.current,
          visibleSecondsRef.current,
          readingMinutes,
        )
      ) {
        hasFiredReadRef.current = true;
        track("read", {
          entityType,
          entityId: slug,
          durationSeconds: visibleSecondsRef.current,
          scrollDepth: maxScrollDepthRef.current,
          metadata: { estimatedReadingMinutes: readingMinutes },
        });
      }
    };

    // Scroll listener: calculate percentage (0-100)
    const handleScroll = () => {
      const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (scrollHeight > 0) {
        const currentDepth = Math.min(
          100,
          Math.max(0, Math.round((window.scrollY / scrollHeight) * 100)),
        );
        if (currentDepth > maxScrollDepthRef.current) {
          maxScrollDepthRef.current = currentDepth;
        }
      }
      checkReadCriteria();
    };

    // Visibility listener: pause timer when tab is hidden or backgrounded
    const handleVisibilityChange = () => {
      if (document.visibilityState === "visible") {
        lastVisibilityTimestampRef.current = Date.now();
      } else {
        flushVisibleDuration();
        lastVisibilityTimestampRef.current = null;
      }
      checkReadCriteria();
    };

    // Check criteria periodically every 3 seconds while active
    const interval = setInterval(checkReadCriteria, 3000);

    // Engagement on page unload / hide
    const handlePageHide = () => {
      flushVisibleDuration();
      track("engagement", {
        entityType,
        entityId: slug,
        durationSeconds: visibleSecondsRef.current,
        scrollDepth: maxScrollDepthRef.current,
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    document.addEventListener("visibilitychange", handleVisibilityChange);
    window.addEventListener("pagehide", handlePageHide);

    return () => {
      clearInterval(interval);
      window.removeEventListener("scroll", handleScroll);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
      window.removeEventListener("pagehide", handlePageHide);
      handlePageHide();
    };
  }, [slug, readingMinutes, entityType]);
}

