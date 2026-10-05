"use client";

import { useState } from "react";
import { useCart } from "@/lib/cart";

/**
 * Signs out through a route handler so the auth cookie is cleared on the
 * server, and empties the cart so the next person on this device starts fresh.
 */
export function SignOutButton({ className }: { className?: string }) {
  const { clearLocal } = useCart();
  const [busy, setBusy] = useState(false);

  return (
    <form
      action="/auth/signout"
      method="post"
      onSubmit={() => {
        setBusy(true);
        clearLocal();
      }}
      className="contents"
    >
      <button
        type="submit"
        disabled={busy}
        className={
          className ??
          "text-sm text-muted underline-offset-4 transition-colors hover:text-clay hover:underline disabled:opacity-50"
        }
      >
        {busy ? "Signing out…" : "Log out"}
      </button>
    </form>
  );
}
