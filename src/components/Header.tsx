import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CartBadge } from "@/components/CartBadge";
import { AccountMenu } from "@/components/AccountMenu";
import { StickyHeader } from "@/components/StickyHeader";
import { NavLinks, type NavItem } from "@/components/NavLinks";

const NAV: NavItem[] = [
  { label: "Shop all", href: "/" },
  { label: "Outerwear", href: "/collections/outerwear" },
  { label: "Dresses", href: "/collections/dresses" },
  { label: "Knitwear", href: "/collections/knitwear" },
  { label: "Tops", href: "/collections/tops" },
  { label: "Bottoms", href: "/collections/bottoms" },
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
        <p className="shell py-2 text-center text-[12px] tracking-wide">
          Free delivery on orders over ₦50,000 · Nationwide, 2–5 working days
        </p>
      </div>

      <StickyHeader>
        <div className="shell flex h-[64px] items-center justify-between gap-8">
          <Link href="/" className="group flex shrink-0 items-baseline gap-1.5">
            <span className="display text-[22px] tracking-tight text-ink transition-colors group-hover:text-clay">
              Vellyshop
            </span>
            <span className="h-[5px] w-[5px] rounded-full bg-clay transition-transform duration-500 group-hover:scale-150" />
          </Link>

          <NavLinks items={NAV} />

          <div className="flex shrink-0 items-center gap-3 sm:gap-5">
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

        <NavLinks items={NAV} variant="rail" />
      </StickyHeader>
    </>
  );
}
