"use client";

import { useEffect, useRef } from "react";

/**
 * The header bar. Sits flush with the page until you scroll, then picks up a
 * hairline and a soft shadow so it separates from the content moving under it.
 *
 * Written as a class on the node rather than React state so a scroll listener
 * never triggers a render.
 */
export function StickyHeader({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const sync = () => {
      element.classList.toggle("is-scrolled", window.scrollY > 8);
    };

    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, []);

  return (
    <header
      ref={ref}
      className="header-bar sticky top-0 z-40 border-b bg-paper/85 backdrop-blur-md"
    >
      {children}
    </header>
  );
}
