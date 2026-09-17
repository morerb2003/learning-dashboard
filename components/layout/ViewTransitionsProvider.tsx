"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";

interface ViewTransitionsProviderProps {
  children: React.ReactNode;
}

export default function ViewTransitionsProvider({ children }: ViewTransitionsProviderProps) {
  const router = useRouter();

  useEffect(() => {
    if (typeof window === "undefined" || !("startViewTransition" in document)) {
      return;
    }

    const handleClick = (event: MouseEvent) => {
      // Respect user's motion preferences
      if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        return;
      }

      // Ignore modified clicks or secondary button clicks
      if (
        event.defaultPrevented ||
        event.button !== 0 ||
        event.metaKey ||
        event.ctrlKey ||
        event.altKey ||
        event.shiftKey
      ) {
        return;
      }

      const anchor = (event.target as HTMLElement)?.closest("a");
      if (!anchor) return;

      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("tel:")) {
        return;
      }

      // Ensure link is on the same origin
      const destination = new URL(href, window.location.href);
      if (destination.origin !== window.location.origin) {
        return;
      }

      // Ignore external tabs
      const targetAttr = anchor.getAttribute("target");
      if (targetAttr && targetAttr !== "_self") {
        return;
      }

      // Ignore download links
      if (anchor.hasAttribute("download")) {
        return;
      }

      // If already on the exact same path and query, skip
      if (
        destination.pathname === window.location.pathname &&
        destination.search === window.location.search
      ) {
        return;
      }

      event.preventDefault();
      const docWithVt = document as Document & {
        startViewTransition: (callback: () => void | Promise<void>) => {
          finished: Promise<void>;
          ready: Promise<void>;
          updateCallbackDone: Promise<void>;
        };
      };

      docWithVt.startViewTransition(() => {
        router.push(destination.pathname + destination.search + destination.hash);
      });
    };

    document.addEventListener("click", handleClick, { capture: true });
    return () => {
      document.removeEventListener("click", handleClick, { capture: true });
    };
  }, [router]);

  return <>{children}</>;
}
