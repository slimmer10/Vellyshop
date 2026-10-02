import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CartBadge } from "@/components/CartBadge";
import { SignOutButton } from "@/components/SignOutButton";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/85 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link href="/" className="group flex items-baseline gap-2">
          <span className="display text-xl tracking-tight text-ink">
            Vellyshop
          </span>
          <span className="hidden h-1 w-1 rounded-full bg-clay sm:block" />
        </Link>

        <nav className="flex items-center gap-5 sm:gap-7">
          <Link
            href="/"
            className="hidden text-sm text-ink-soft transition-colors hover:text-clay sm:block"
          >
            Shop
          </Link>
          <Link
            href="/orders"
            className="text-sm text-ink-soft transition-colors hover:text-clay"
          >
            Orders
          </Link>
          <CartBadge />
          {user ? (
            <div className="flex items-center gap-3 border-l border-line pl-5">
              <span
                className="hidden max-w-[16ch] truncate text-sm text-muted md:block"
                title={user.email ?? undefined}
              >
                {user.email}
              </span>
              <SignOutButton />
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-clay"
            >
              Sign in
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
