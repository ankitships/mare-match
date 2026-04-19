"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

// Hairline top-of-page progress bar that shows during in-app client navigation.
// Nothing fancy: listens for link clicks that will trigger a route change,
// animates a thin accent line, and settles when the new pathname is visible.
export function NavProgress() {
  const pathname = usePathname();
  const [active, setActive] = useState(false);
  const prevPath = useRef(pathname);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (prevPath.current !== pathname) {
      prevPath.current = pathname;
      // Pathname changed — fade out the progress bar.
      setActive(false);
      if (timerRef.current) clearTimeout(timerRef.current);
    }
  }, [pathname]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      const anchor = target?.closest("a") as HTMLAnchorElement | null;
      if (!anchor) return;
      if (e.defaultPrevented) return;
      if (anchor.target && anchor.target !== "_self") return;
      if (anchor.hasAttribute("download")) return;
      if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const href = anchor.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      try {
        const url = new URL(anchor.href, window.location.href);
        if (url.origin !== window.location.origin) return;
        if (url.pathname === window.location.pathname && url.search === window.location.search) return;
        setActive(true);
      } catch {
        /* ignore */
      }
    }
    document.addEventListener("click", onClick);
    return () => document.removeEventListener("click", onClick);
  }, []);

  if (!active) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[60] indeterminate-bar" aria-hidden="true" />
  );
}
