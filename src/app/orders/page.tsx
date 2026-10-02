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
    month: "long",
    year: "numeric",
  });
}

export default async function OrdersPage({
  searchParams,
}: PageProps<"/orders">) {
  const { placed, email } = await searchParams;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6 sm:py-24">
        <div className="rise rounded-sm border border-line bg-paper-raised p-7 sm:p-9">
          <p className="eyebrow text-clay">Your account</p>
          <h1 className="display mt-3 text-[28px] leading-tight text-ink">
            Log in to see your orders
          </h1>
          <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
            Every order is kept against your account. Log in on any device and
            the whole history comes back.
          </p>
          <div className="mt-7 flex flex-col gap-3">
            <Link
              href="/login?next=%2Forders"
              className="press rounded-full bg-ink px-6 py-3 text-center text-sm font-medium text-paper hover:bg-clay"
            >
              Log in
            </Link>
            <Link
              href="/login?mode=create&next=%2Forders"
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
  const justPlaced = typeof placed === "string" ? placed : null;
  const emailFailed = email === "failed";
  const meta = user.user_metadata as { full_name?: string; name?: string };
  const name = meta.full_name ?? meta.name ?? null;

  const spent = orders.reduce((sum, o) => sum + o.total_kobo, 0);

  return (
    <div className="shell-narrow py-10 sm:py-14">
      {justPlaced && (
        <Reveal className="mb-10">
          <div className="rounded-sm border border-line bg-paper-raised p-6 sm:p-7">
            <p className="eyebrow text-clay">Order confirmed</p>
            <h2 className="display mt-3 text-[22px] text-ink">
              Thank you. Your reference is {justPlaced}.
            </h2>
            <p className="mt-2 text-[14px] leading-relaxed text-ink-soft">
              {emailFailed ? (
                <>
                  Your order is saved, but the confirmation email did not go
                  out. The shop has been notified and will contact you
                  directly.
                </>
              ) : (
                <>
                  A confirmation email is on its way to{" "}
                  <span className="text-ink">{user.email}</span>. If it is not
                  in your inbox shortly, check your spam folder.
                </>
              )}
            </p>
          </div>
        </Reveal>
      )}

      {/* ------------------------------------------------- account summary */}
      <div className="rise flex flex-wrap items-start justify-between gap-x-6 gap-y-4 border-b border-line pb-6">
        <div>
          <p className="eyebrow text-muted">Your account</p>
          <h1 className="display mt-2 text-[28px] leading-tight text-ink">
            {name ?? "Order history"}
          </h1>
          <p className="mt-1 text-[13px] text-muted">{user.email}</p>
        </div>

        <div className="flex items-center gap-5">
          <div className="text-right">
            <p className="text-[13px] text-muted">
              {orders.length} {orders.length === 1 ? "order" : "orders"}
            </p>
            {orders.length > 0 && (
              <p className="text-[13px] tabular-nums text-ink-soft">
                {formatNaira(spent)} spent
              </p>
            )}
          </div>
          <SignOutButton className="press rounded-full border border-line px-5 py-2 text-[13px] font-medium text-ink hover:border-ink disabled:opacity-50" />
        </div>
      </div>

      {orders.length === 0 ? (
        <div className="rise mt-14 rounded-sm border border-line bg-paper-raised p-10 text-center">
          <p className="display text-xl text-ink">No orders yet</p>
          <p className="mx-auto mt-2 max-w-sm text-[14px] leading-relaxed text-muted">
            When you buy something it will appear here, and stay here.
          </p>
          <Link
            href="/"
            className="press mt-7 inline-block rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper hover:bg-clay"
          >
            Start shopping
          </Link>
        </div>
      ) : (
        <ul className="mt-8 space-y-5">
          {orders.map((order, index) => (
            <li key={order.id}>
              <Reveal delay={Math.min(index, 4) * 70}>
                <article className="overflow-hidden rounded-sm border border-line bg-paper-raised">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-line px-5 py-4 sm:px-6">
                    <div>
                      <p className="font-medium tracking-wide text-ink">
                        {order.reference}
                      </p>
                      <p className="mt-0.5 text-[13px] text-muted">
                        {formatDate(order.created_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="rounded-full border border-line px-3 py-1 text-[11px] uppercase tracking-wider text-ink-soft">
                        {order.status}
                      </span>
                      <span className="text-[15px] tabular-nums text-ink">
                        {formatNaira(order.total_kobo)}
                      </span>
                    </div>
                  </div>

                  <ul className="divide-y divide-line px-5 sm:px-6">
                    {order.order_items.map((item) => (
                      <li key={item.id} className="flex items-center gap-4 py-4">
                        {item.image_url && (
                          <div className="relative h-16 w-13 shrink-0 overflow-hidden rounded-sm bg-[#efe8df]">
                            <Image
                              src={item.image_url}
                              alt={item.name}
                              fill
                              sizes="64px"
                              className="object-cover"
                            />
                          </div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-[14px] text-ink">
                            {item.name}
                          </p>
                          <p className="mt-0.5 text-[13px] text-muted">
                            {item.size && <>Size {item.size} &middot; </>}
                            &times;{item.quantity} at{" "}
                            {formatNaira(item.unit_price_kobo)}
                          </p>
                        </div>
                        <p className="shrink-0 text-[14px] tabular-nums text-ink">
                          {formatNaira(item.unit_price_kobo * item.quantity)}
                        </p>
                      </li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap justify-between gap-x-6 gap-y-1 border-t border-line px-5 py-4 text-[13px] text-muted sm:px-6">
                    <p>
                      {order.address}, {order.city}, {order.state}
                    </p>
                    <p>
                      Subtotal {formatNaira(order.subtotal_kobo)} &middot;
                      Delivery{" "}
                      {order.delivery_kobo === 0
                        ? "free"
                        : formatNaira(order.delivery_kobo)}
                    </p>
                  </div>
                </article>
              </Reveal>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
