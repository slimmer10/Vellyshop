"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import type { Product } from "@/lib/types";

export function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const sizes = product.sizes ?? [];
  const [size, setSize] = useState<string | null>(
    sizes.length === 1 ? sizes[0] : null,
  );
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function handleAdd() {
    if (sizes.length > 1 && !size) {
      setError("Choose a size first.");
      return;
    }
    setError(null);
    add({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      size,
      imageUrl: product.image_url,
      priceKobo: product.price_kobo,
      quantity,
    });
    setAdded(true);
    window.setTimeout(() => setAdded(false), 4000);
  }

  if (!product.in_stock) {
    return (
      <p className="mt-8 rounded border border-line bg-paper-raised px-4 py-3 text-sm text-muted">
        This piece is sold out. Check back — we restock the ones people ask for.
      </p>
    );
  }

  return (
    <div className="mt-8">
      {sizes.length > 0 && (
        <fieldset>
          <legend className="eyebrow text-muted">Size</legend>
          <div className="mt-3 flex flex-wrap gap-2">
            {sizes.map((option) => {
              const selected = option === size;
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => {
                    setSize(option);
                    setError(null);
                  }}
                  aria-pressed={selected}
                  className={`min-w-12 rounded-sm border px-3 py-2 text-sm transition-colors ${
                    selected
                      ? "border-ink bg-ink text-paper"
                      : "border-line bg-paper-raised text-ink-soft hover:border-ink"
                  }`}
                >
                  {option}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-sm border border-line bg-paper-raised">
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.max(1, q - 1))}
            aria-label="Reduce quantity"
            className="px-3 py-2 text-lg leading-none text-muted transition-colors hover:text-clay"
          >
            −
          </button>
          <span className="w-9 text-center text-sm tabular-nums">
            {quantity}
          </span>
          <button
            type="button"
            onClick={() => setQuantity((q) => Math.min(20, q + 1))}
            aria-label="Increase quantity"
            className="px-3 py-2 text-lg leading-none text-muted transition-colors hover:text-clay"
          >
            +
          </button>
        </div>

        <button
          type="button"
          onClick={handleAdd}
          className="flex-1 rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-clay sm:flex-none sm:px-10"
        >
          Add to cart
        </button>
      </div>

      {error && <p className="mt-3 text-sm text-clay">{error}</p>}

      {added && (
        <p className="mt-4 rounded-sm border border-line bg-paper-raised px-4 py-3 text-sm text-ink-soft">
          Added to your cart.{" "}
          <Link href="/cart" className="font-medium text-clay underline underline-offset-4">
            Go to cart
          </Link>
        </p>
      )}
    </div>
  );
}
