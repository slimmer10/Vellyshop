import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SetupNotice } from "@/components/SetupNotice";
import { SignOutButton } from "@/components/SignOutButton";
import { Reveal } from "@/components/Reveal";
import { formatNaira } from "@/lib/money";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Your account" };

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function AccountPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="shell-narrow max-w-md py-16 sm:py-24">
        <div className="rise rounded-sm border border-line bg-paper-raised p-7 sm:p-9">
          <p className="eyebrow text-clay">Your account</p>
          <h1 className="display mt-3 text-[28px] leading-tight text-ink">
            Log in to your account
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
            Your orders, your delivery details and everything you have bought
            before, kept in one place.
          </p>
          <div className="mt-7 flex flex-col gap-3">
            <Link
              href="/login?next=%2Faccount"
              className="press rounded-full bg-ink px-6 py-3 text-center text-sm font-medium text-paper hover:bg-clay"
            >
              Log in
            </Link>
            <Link
              href="/login?mode=create&next=%2Faccount"
              className="press rounded-full border border-line px-6 py-3 text-center text-sm font-medium text-ink hover:border-ink"
            >
              Create an account
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const { data, error } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  if (error) return <SetupNotice detail={error.message} />;

  const orders = (data ?? []) as Order[];
  const meta = user.user_metadata as { full_name?: string; name?: string };
  const fullName = meta.full_name ?? meta.name ?? null;
  const firstName = fullName?.trim().split(" ")[0] ?? user.email?.split("@")[0];

  const spent = orders.reduce((sum, o) => sum + o.total_kobo, 0);
  const pieces = orders.reduce(
    (sum, o) => sum + o.order_items.reduce((n, i) => n + i.quantity, 0),
    0,
  );
  const latest = orders[0] ?? null;
  const recent = orders.slice(0, 3);

  const stats: [string, string, string][] = [
    ["Orders placed", String(orders.length), "since you joined"],
    ["Pieces bought", String(pieces), "across all orders"],
    ["Total spent", formatNaira(spent), "including delivery"],
  ];

  return (
    <div className="shell py-10 sm:py-14">
      {/* ------------------------------------------------------- greeting */}
      <header className="rise flex flex-wrap items-start justify-between gap-x-8 gap-y-5 border-b border-line pb-8">
        <div>
          <p className="eyebrow text-clay">Your account</p>
          <h1 className="display mt-3 text-[32px] leading-tight text-ink sm:text-[38px]">
            {greeting()}, {firstName}
          </h1>
          <p className="mt-1.5 text-[13px] text-muted">{user.email}</p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/"
            className="press rounded-full bg-ink px-5 py-2.5 text-[13px] font-medium text-paper hover:bg-clay"
          >
            Continue shopping
          </Link>
          <SignOutButton className="press rounded-full border border-line px-5 py-2.5 text-[13px] font-medium text-ink hover:border-ink disabled:opacity-50" />
        </div>
      </header>

      {/* ---------------------------------------------------------- stats */}
      <section className="mt-8 grid gap-4 sm:grid-cols-3">
        {stats.map(([label, value, note], i) => (
          <Reveal key={label} delay={i * 80}>
            <div className="h-full rounded-sm border border-line bg-paper-raised p-5">
              <p className="text-[12px] uppercase tracking-[0.14em] text-muted">
                {label}
              </p>
              <p className="display mt-3 text-[30px] leading-none text-ink tabular-nums">
                {value}
              </p>
              <p className="mt-2 text-[12px] text-muted">{note}</p>
            </div>
          </Reveal>
        ))}
      </section>

      {/* --------------------------------------------------- latest order */}
      {latest && (
        <Reveal className="mt-4">
          <section className="rounded-sm border border-line bg-paper-raised p-5 sm:p-6">
            <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2">
              <div>
                <p className="text-[12px] uppercase tracking-[0.14em] text-muted">
                  Latest order
                </p>
                <p className="mt-2 text-[15px] tracking-wide text-ink">
                  {latest.reference}
                  <span className="text-muted">
                    {" "}
                    · {formatDate(latest.created_at)}
                  </span>
                </p>
              </div>
              <div className="flex items-center gap-4">
                <span className="rounded-full border border-line px-3 py-1 text-[11px] uppercase tracking-wider text-ink-soft">
                  {latest.status}
                </span>
                <span className="text-[15px] tabular-nums text-ink">
                  {formatNaira(latest.total_kobo)}
                </span>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              {latest.order_items.map(
                (item) =>
                  item.image_url && (
                    <div
                      key={item.id}
                      className="relative h-20 w-16 overflow-hidden rounded-sm bg-[#efe8df]"
                      title={item.name}
                    >
                      <Image
                        src={item.image_url}
                        alt={item.name}
                        fill
                        sizes="64px"
                        className="object-cover"
                      />
                    </div>
                  ),
              )}
            </div>

            <p className="mt-5 text-[13px] text-muted">
              Delivering to {latest.address}, {latest.city}, {latest.state}
            </p>
          </section>
        </Reveal>
      )}

      {/* -------------------------------------------------- recent orders */}
      <section className="mt-12">
        <div className="flex items-baseline justify-between gap-6 border-b border-line pb-4">
          <h2 className="display text-[22px] text-ink">Recent orders</h2>
          {orders.length > recent.length && (
            <Link
              href="/orders"
              className="text-[13px] text-clay underline underline-offset-4"
            >
              View all {orders.length}
            </Link>
          )}
        </div>

        {orders.length === 0 ? (
          <div className="rise mt-8 rounded-sm border border-line bg-paper-raised p-10 text-center">
            <p className="display text-xl text-ink">Nothing here yet</p>
            <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted">
              Your first order will show up here the moment you place it.
            </p>
            <Link
              href="/"
              className="press mt-7 inline-block rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper hover:bg-clay"
            >
              Start shopping
            </Link>
          </div>
        ) : (
          <ul className="mt-2 divide-y divide-line">
            {recent.map((order, index) => (
              <li key={order.id}>
                <Reveal delay={index * 70}>
                  <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5">
                    <div>
                      <p className="text-[14px] tracking-wide text-ink">
                        {order.reference}
                      </p>
                      <p className="mt-0.5 text-[13px] text-muted">
                        {formatDate(order.created_at)} ·{" "}
                        {order.order_items.length}{" "}
                        {order.order_items.length === 1 ? "line" : "lines"}
                      </p>
                    </div>
                    <p className="text-[14px] tabular-nums text-ink">
                      {formatNaira(order.total_kobo)}
                    </p>
                  </div>
                </Reveal>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* ------------------------------------------------------ shortcuts */}
      <section className="mt-12 grid gap-4 sm:grid-cols-3">
        {[
          ["Order history", "Every order you have placed", "/orders"],
          ["Your cart", "Pick up where you left off", "/cart"],
          ["Keep shopping", "See what is on the rail", "/"],
        ].map(([title, detail, href], i) => (
          <Reveal key={href} delay={i * 80}>
            <Link
              href={href}
              className="group block h-full rounded-sm border border-line bg-paper-raised p-5 transition-colors hover:border-ink"
            >
              <p className="text-[14px] font-medium text-ink transition-colors group-hover:text-clay">
                {title}
              </p>
              <p className="mt-1 text-[13px] text-muted">{detail}</p>
            </Link>
          </Reveal>
        ))}
      </section>
    </div>
  );
}
