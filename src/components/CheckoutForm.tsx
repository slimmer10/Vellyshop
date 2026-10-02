"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { useCart } from "@/lib/cart";
import { deliveryFor, formatNaira } from "@/lib/money";
import { NIGERIAN_STATES } from "@/lib/states";
import { placeOrder } from "@/app/checkout/actions";

const fieldClass =
  "mt-1.5 w-full rounded-sm border border-line bg-paper-raised px-3.5 py-2.5 text-sm text-ink outline-none transition-colors placeholder:text-muted/70 focus:border-ink";

const labelClass = "block text-sm text-ink-soft";

export function CheckoutForm({
  defaultEmail,
  defaultName,
}: {
  defaultEmail: string;
  defaultName: string;
}) {
  const router = useRouter();
  const { lines, ready, subtotalKobo, clear } = useCart();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const delivery = deliveryFor(subtotalKobo);
  const total = subtotalKobo + delivery;

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const data = new FormData(event.currentTarget);
    setError(null);

    startTransition(async () => {
      const result = await placeOrder(
        {
          fullName: String(data.get("fullName") ?? ""),
          email: String(data.get("email") ?? ""),
          phone: String(data.get("phone") ?? ""),
          address: String(data.get("address") ?? ""),
          city: String(data.get("city") ?? ""),
          state: String(data.get("state") ?? ""),
          note: String(data.get("note") ?? ""),
        },
        lines.map((line) => ({
          productId: line.productId,
          size: line.size,
          quantity: line.quantity,
        })),
      );

      if (!result.ok) {
        if (result.needsAuth) {
          router.push("/login?next=%2Fcheckout");
          return;
        }
        setError(result.error);
        return;
      }

      clear();
      const query = new URLSearchParams({ placed: result.reference });
      if (!result.emailed) query.set("email", "failed");
      router.push(`/orders?${query.toString()}`);
    });
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-20 text-sm text-muted sm:px-6">
        Loading your cart...
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-6xl px-4 py-24 text-center sm:px-6">
        <h1 className="display text-3xl text-ink">Nothing to check out</h1>
        <p className="mt-3 text-sm text-muted">Your cart is empty.</p>
        <Link
          href="/"
          className="mt-8 inline-block rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-clay"
        >
          Browse the rail
        </Link>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <h1 className="display text-3xl text-ink">Checkout</h1>
      <p className="mt-2 text-sm text-muted">
        Where should this go, and who do we call when it arrives?
      </p>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1.5fr_1fr] lg:gap-16">
        <div className="space-y-5">
          <div>
            <label htmlFor="fullName" className={labelClass}>
              Full name
            </label>
            <input
              id="fullName"
              name="fullName"
              required
              defaultValue={defaultName}
              autoComplete="name"
              placeholder="Adaeze Okonkwo"
              className={fieldClass}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="email" className={labelClass}>
                Email for the confirmation
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                defaultValue={defaultEmail}
                autoComplete="email"
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="phone" className={labelClass}>
                Phone
              </label>
              <input
                id="phone"
                name="phone"
                required
                inputMode="tel"
                autoComplete="tel"
                placeholder="0803 000 0000"
                className={fieldClass}
              />
            </div>
          </div>

          <div>
            <label htmlFor="address" className={labelClass}>
              Delivery address
            </label>
            <input
              id="address"
              name="address"
              required
              autoComplete="street-address"
              placeholder="12 Adeola Odeku Street, Victoria Island"
              className={fieldClass}
            />
          </div>

          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="city" className={labelClass}>
                City or town
              </label>
              <input
                id="city"
                name="city"
                required
                autoComplete="address-level2"
                placeholder="Lagos"
                className={fieldClass}
              />
            </div>
            <div>
              <label htmlFor="state" className={labelClass}>
                State
              </label>
              <select
                id="state"
                name="state"
                required
                defaultValue="Lagos"
                className={fieldClass}
              >
                {NIGERIAN_STATES.map((state) => (
                  <option key={state} value={state}>
                    {state}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label htmlFor="note" className={labelClass}>
              Anything we should know{" "}
              <span className="text-muted">(optional)</span>
            </label>
            <textarea
              id="note"
              name="note"
              rows={3}
              placeholder="Landmark, gate code, best time to call."
              className={fieldClass}
            />
          </div>

          <p className="text-xs leading-relaxed text-muted">
            This build takes no card payment. Placing the order records it and
            sends your confirmation email; the shop settles payment with you
            directly.
          </p>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-sm border border-line bg-paper-raised p-6">
            <h2 className="eyebrow text-muted">Your order</h2>

            <ul className="mt-5 space-y-4">
              {lines.map((line) => (
                <li
                  key={`${line.productId}|${line.size ?? ""}`}
                  className="flex gap-3"
                >
                  <div className="relative h-16 w-13 shrink-0 overflow-hidden rounded-sm bg-[#efe8df]">
                    <Image
                      src={line.imageUrl}
                      alt={line.name}
                      fill
                      sizes="64px"
                      className="object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1 text-sm">
                    <div className="truncate text-ink">{line.name}</div>
                    <div className="text-muted">
                      {line.size && <>Size {line.size} &middot; </>}
                      &times;{line.quantity}
                    </div>
                  </div>
                  <div className="shrink-0 text-sm tabular-nums text-ink">
                    {formatNaira(line.priceKobo * line.quantity)}
                  </div>
                </li>
              ))}
            </ul>

            <dl className="mt-6 space-y-3 border-t border-line pt-5 text-sm">
              <div className="flex justify-between">
                <dt className="text-muted">Subtotal</dt>
                <dd className="tabular-nums text-ink">
                  {formatNaira(subtotalKobo)}
                </dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-muted">Delivery</dt>
                <dd className="tabular-nums text-ink">
                  {delivery === 0 ? "Free" : formatNaira(delivery)}
                </dd>
              </div>
              <div className="flex justify-between border-t border-line pt-3 text-base">
                <dt className="font-medium text-ink">Total</dt>
                <dd className="font-medium tabular-nums text-ink">
                  {formatNaira(total)}
                </dd>
              </div>
            </dl>

            {error && (
              <p className="mt-5 rounded-sm border border-clay/30 bg-clay/5 px-3.5 py-3 text-sm text-clay-deep">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={pending}
              className="mt-6 w-full rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-clay disabled:opacity-60"
            >
              {pending ? "Placing your order..." : "Place order"}
            </button>

            <Link
              href="/cart"
              className="mt-3 block text-center text-sm text-muted transition-colors hover:text-clay"
            >
              Back to cart
            </Link>
          </div>
        </aside>
      </div>
    </form>
  );
}
