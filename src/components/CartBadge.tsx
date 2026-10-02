"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export function CartBadge() {
  const { count, ready } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={count > 0 ? `Cart, ${count} items` : "Cart, empty"}
      className="group relative flex items-center gap-2 text-ink-soft transition-colors hover:text-clay"
    >
      <span className="relative">
        <svg
          viewBox="0 0 24 24"
          aria-hidden="true"
          className="h-[22px] w-[22px] transition-transform duration-500 group-hover:-translate-y-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5.5 7h13l-1.1 12.1a1.6 1.6 0 0 1-1.6 1.4H8.2a1.6 1.6 0 0 1-1.6-1.4L5.5 7Z" />
          <path d="M9 7V5.6a3 3 0 0 1 6 0V7" />
        </svg>

        {ready && count > 0 && (
          // Remounting on every change replays the pop.
          <span
            key={count}
            className="pop absolute -right-2 -top-1.5 flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-clay px-1 text-[10px] font-semibold leading-none text-white tabular-nums"
          >
            {count}
          </span>
        )}
      </span>
      <span className="hidden text-[13px] sm:block">Cart</span>
    </Link>
  );
}
