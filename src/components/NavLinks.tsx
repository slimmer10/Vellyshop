"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type NavItem = { label: string; href: string };

/**
 * The collection navigation. Needs the current path to mark the collection
 * you are on, which is the one thing a server component cannot know.
 */
export function NavLinks({
  items,
  variant = "bar",
}: {
  items: NavItem[];
  variant?: "bar" | "rail";
}) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href);

  if (variant === "rail") {
    return (
      <nav className="flex items-center gap-5 overflow-x-auto border-t border-line/70 px-5 py-2.5 lg:hidden">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive(item.href) ? "page" : undefined}
            className={`shrink-0 text-[12px] uppercase tracking-[0.1em] transition-colors ${
              isActive(item.href)
                ? "text-ink"
                : "text-muted hover:text-clay"
            }`}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    );
  }

  return (
    <nav className="hidden items-center gap-8 lg:flex">
      {items.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isActive(item.href) ? "page" : undefined}
          className={`nav-link text-[13px] uppercase tracking-[0.1em] transition-colors hover:text-clay ${
            isActive(item.href) ? "is-active" : "text-ink-soft"
          }`}
        >
          {item.label}
        </Link>
      ))}
    </nav>
  );
}
