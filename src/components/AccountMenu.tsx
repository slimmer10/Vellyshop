"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useCart } from "@/lib/cart";

/**
 * The signed-in account control: initial, name, and a menu holding the
 * account links and Log out — the pattern most storefronts use, so the
 * header stays clean and everything to do with the account is in one place.
 */
export function AccountMenu({
  email,
  name,
}: {
  email: string;
  name: string | null;
}) {
  const [open, setOpen] = useState(false);
  const { clear } = useCart();
  const wrapper = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const onPointerDown = (event: MouseEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };

    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const label = name?.trim() || email.split("@")[0];
  const initial = (label[0] ?? "?").toUpperCase();

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className="flex items-center gap-2 rounded-full border border-line bg-paper-raised py-1 pl-1 pr-2.5 text-sm text-ink transition-colors hover:border-ink sm:pr-3"
      >
        <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink text-xs font-semibold text-paper">
          {initial}
        </span>
        <span className="hidden max-w-[12ch] truncate sm:block">{label}</span>
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className={`h-3.5 w-3.5 text-muted transition-transform duration-300 ${open ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>

      {open && (
        <div
          role="menu"
          className="menu-pop absolute right-0 top-[calc(100%+10px)] z-50 w-60 overflow-hidden rounded-sm border border-line bg-paper-raised shadow-[0_18px_50px_-24px_rgba(31,26,22,0.45)]"
        >
          <div className="border-b border-line px-4 py-3">
            <p className="text-sm text-ink">{label}</p>
            <p className="truncate text-xs text-muted" title={email}>
              {email}
            </p>
          </div>

          <nav className="py-1">
            <Link
              href="/account"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-paper hover:text-clay"
            >
              Your account
            </Link>
            <Link
              href="/orders"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-paper hover:text-clay"
            >
              Order history
            </Link>
            <Link
              href="/cart"
              role="menuitem"
              onClick={() => setOpen(false)}
              className="block px-4 py-2.5 text-sm text-ink-soft transition-colors hover:bg-paper hover:text-clay"
            >
              Your cart
            </Link>
          </nav>

          <form
            action="/auth/signout"
            method="post"
            onSubmit={() => clear()}
            className="border-t border-line"
          >
            <button
              type="submit"
              role="menuitem"
              className="w-full px-4 py-2.5 text-left text-sm text-ink-soft transition-colors hover:bg-paper hover:text-clay"
            >
              Log out
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
