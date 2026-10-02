"use client";

import Image from "next/image";
import Link from "next/link";
import { lineKey, useCart } from "@/lib/cart";
import { deliveryFor, formatNaira, FREE_DELIVERY_FROM_KOBO } from "@/lib/money";

export default function CartPage() {
  const { lines, ready, subtotalKobo, setQuantity, remove } = useCart();
  const delivery = deliveryFor(subtotalKobo);
  const total = subtotalKobo + delivery;
  const shortOfFreeDelivery = FREE_DELIVERY_FROM_KOBO - subtotalKobo;

  if (!ready) {
    return (
      <div className="shell py-20 text-sm text-muted">
        Loading your cart…
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="shell py-24 text-center">
        <h1 className="display text-3xl text-ink">Your cart is empty</h1>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-muted">
          Nothing on the hanger yet. The rail is through here.
        </p>
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
    <div className="shell py-12">
      <h1 className="display text-3xl text-ink">Your cart</h1>

      <div className="mt-10 grid gap-12 lg:grid-cols-[1.6fr_1fr] lg:gap-16">
        <ul className="divide-y divide-line border-y border-line">
          {lines.map((line) => {
            const key = lineKey(line.productId, line.size);
            return (
              <li key={key} className="flex gap-4 py-6 sm:gap-6">
                <Link
                  href={`/product/${line.slug}`}
                  className="relative h-28 w-22 shrink-0 overflow-hidden rounded-sm bg-[#efe8df] sm:h-32 sm:w-26"
                >
                  <Image
                    src={line.imageUrl}
                    alt={line.name}
                    fill
                    sizes="112px"
                    className="object-cover"
                  />
                </Link>

                <div className="flex min-w-0 flex-1 flex-col">
                  <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
                    <Link
                      href={`/product/${line.slug}`}
                      className="display text-base text-ink transition-colors hover:text-clay"
                    >
                      {line.name}
                    </Link>
                    <span className="text-sm tabular-nums text-ink">
                      {formatNaira(line.priceKobo * line.quantity)}
                    </span>
                  </div>

                  <p className="mt-1 text-sm text-muted">
                    {formatNaira(line.priceKobo)} each
                    {line.size && <> · size {line.size}</>}
                  </p>

                  <div className="mt-auto flex items-center gap-4 pt-4">
                    <div className="flex items-center rounded-sm border border-line bg-paper-raised">
                      <button
                        type="button"
                        aria-label={`Reduce quantity of ${line.name}`}
                        onClick={() => setQuantity(key, line.quantity - 1)}
                        className="px-3 py-1.5 text-lg leading-none text-muted transition-colors hover:text-clay"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm tabular-nums">
                        {line.quantity}
                      </span>
                      <button
                        type="button"
                        aria-label={`Increase quantity of ${line.name}`}
                        onClick={() => setQuantity(key, line.quantity + 1)}
                        className="px-3 py-1.5 text-lg leading-none text-muted transition-colors hover:text-clay"
                      >
                        +
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => remove(key)}
                      className="text-sm text-muted underline-offset-4 transition-colors hover:text-clay hover:underline"
                    >
                      Remove
                    </button>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-sm border border-line bg-paper-raised p-6">
            <h2 className="eyebrow text-muted">Summary</h2>
            <dl className="mt-5 space-y-3 text-sm">
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

            {shortOfFreeDelivery > 0 && (
              <p className="mt-4 text-xs leading-relaxed text-muted">
                Add {formatNaira(shortOfFreeDelivery)} more for free delivery.
              </p>
            )}

            <Link
              href="/checkout"
              className="mt-6 block rounded-full bg-ink px-6 py-3 text-center text-sm font-medium text-paper transition-colors hover:bg-clay"
            >
              Checkout
            </Link>
            <Link
              href="/"
              className="mt-3 block text-center text-sm text-muted transition-colors hover:text-clay"
            >
              Keep shopping
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
