import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CartBadge } from "@/components/CartBadge";
import { AccountMenu } from "@/components/AccountMenu";
import { StickyHeader } from "@/components/StickyHeader";

const NAV = [
  { label: "Shop all", href: "/" },
  { label: "Outerwear", href: "/?category=Outerwear" },
  { label: "Dresses", href: "/?category=Dresses" },
  { label: "Knitwear", href: "/?category=Knitwear" },
  { label: "Tops", href: "/?category=Tops" },
];

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const meta = user?.user_metadata as
    | { full_name?: string; name?: string }
    | undefined;

  return (
    <>
      <div className="bg-ink text-paper">
        <p className="mx-auto max-w-6xl px-4 py-2 text-center text-[12px] tracking-wide sm:px-6">
          Free delivery on orders over ₦50,000 · Nationwide, 2–5 working days
        </p>
      </div>

      <StickyHeader>
        <div className="mx-auto flex h-[60px] max-w-6xl items-center justify-between gap-6 px-4 sm:px-6">
          <Link href="/" className="group flex shrink-0 items-baseline gap-1.5">
            <span className="display text-xl tracking-tight text-ink transition-colors group-hover:text-clay">
              Vellyshop
            </span>
            <span className="h-[5px] w-[5px] rounded-full bg-clay transition-transform duration-500 group-hover:scale-150" />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {NAV.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className="nav-link text-[13px] uppercase tracking-[0.1em] text-ink-soft transition-colors hover:text-clay"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex shrink-0 items-center gap-3 sm:gap-4">
            {user ? (
              <AccountMenu
                email={user.email ?? ""}
                name={meta?.full_name ?? meta?.name ?? null}
              />
            ) : (
              <>
                <Link
                  href="/login"
                  className="nav-link hidden text-[13px] text-ink-soft transition-colors hover:text-clay sm:block"
                >
                  Log in
                </Link>
                <Link
                  href="/login?mode=create"
                  className="press rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-paper hover:bg-clay"
                >
                  Create account
                </Link>
              </>
            )}
            <CartBadge />
          </div>
        </div>

        <nav className="flex items-center gap-5 overflow-x-auto border-t border-line/70 px-4 py-2.5 lg:hidden">
          {NAV.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              className="shrink-0 text-[12px] uppercase tracking-[0.1em] text-muted transition-colors hover:text-clay"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </StickyHeader>
    </>
  );
}
