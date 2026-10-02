import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { SetupNotice } from "@/components/SetupNotice";
import { formatNaira } from "@/lib/money";
import type { Order } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Your orders" };

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
      <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
        <div className="eyebrow text-clay">Your orders</div>
        <h1 className="display mt-4 text-3xl text-ink">Sign in to see them</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Every order you place is kept against your Google account. Sign in on
          any device and the whole history comes back.
        </p>
        <Link
          href="/login?next=%2Forders"
          className="mt-8 inline-block rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-clay"
        >
          Sign in with Google
        </Link>
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6">
      {justPlaced && (
        <div className="mb-10 rounded-sm border border-line bg-paper-raised p-6">
          <div className="eyebrow text-clay">Order confirmed</div>
          <h2 className="display mt-3 text-2xl text-ink">
            Thank you. Reference {justPlaced}.
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-soft">
            {emailFailed ? (
              <>
                Your order is saved, but the confirmation email did not go out.
                The shop has been notified and will contact you directly.
              </>
            ) : (
              <>
                A confirmation email is on its way to{" "}
                <span className="text-ink">{user.email}</span>. If it is not in
                your inbox in a few minutes, look in spam.
              </>
            )}
          </p>
        </div>
      )}

      <h1 className="display text-3xl text-ink">Your orders</h1>
      <p className="mt-2 text-sm text-muted">
        Signed in as {user.email}.
      </p>

      {orders.length === 0 ? (
        <div className="mt-16 rounded-sm border border-line bg-paper-raised p-10 text-center">
          <p className="display text-xl text-ink">No orders yet</p>
          <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted">
            When you buy something it will appear here, and stay here.
          </p>
          <Link
            href="/"
            className="mt-7 inline-block rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-clay"
          >
            Browse the rail
          </Link>
        </div>
      ) : (
        <ul className="mt-10 space-y-6">
          {orders.map((order) => (
            <li
              key={order.id}
              className="overflow-hidden rounded-sm border border-line bg-paper-raised"
            >
              <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b border-line px-6 py-4">
                <div>
                  <div className="font-medium tracking-wide text-ink">
                    {order.reference}
                  </div>
                  <div className="mt-0.5 text-sm text-muted">
                    {formatDate(order.created_at)}
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="rounded-full border border-line px-3 py-1 text-xs capitalize text-ink-soft">
                    {order.status}
                  </span>
                  <span className="text-base tabular-nums text-ink">
                    {formatNaira(order.total_kobo)}
                  </span>
                </div>
              </div>

              <ul className="divide-y divide-line px-6">
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
                      <div className="truncate text-sm text-ink">
                        {item.name}
                      </div>
                      <div className="mt-0.5 text-sm text-muted">
                        {item.size && <>Size {item.size} &middot; </>}
                        &times;{item.quantity} at{" "}
                        {formatNaira(item.unit_price_kobo)}
                      </div>
                    </div>
                    <div className="shrink-0 text-sm tabular-nums text-ink">
                      {formatNaira(item.unit_price_kobo * item.quantity)}
                    </div>
                  </li>
                ))}
              </ul>

              <div className="flex flex-wrap justify-between gap-x-6 gap-y-2 border-t border-line px-6 py-4 text-sm text-muted">
                <span>
                  Delivering to {order.address}, {order.city}, {order.state}
                </span>
                <span>
                  Subtotal {formatNaira(order.subtotal_kobo)} &middot; Delivery{" "}
                  {order.delivery_kobo === 0
                    ? "free"
                    : formatNaira(order.delivery_kobo)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
