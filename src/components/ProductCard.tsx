import Image from "next/image";
import Link from "next/link";
import { formatNaira } from "@/lib/money";
import type { Product } from "@/lib/types";

export function ProductCard({
  product,
  priority = false,
}: {
  product: Product;
  priority?: boolean;
}) {
  return (
    <Link href={`/product/${product.slug}`} className="group block">
      <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-[#efe8df]">
        <Image
          src={product.image_url}
          alt={product.name}
          fill
          priority={priority}
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 48vw"
          className="card-media object-cover"
        />

        {!product.in_stock && (
          <span className="absolute left-3 top-3 rounded-full bg-paper/95 px-3 py-1 text-[11px] font-medium tracking-wide text-ink">
            Sold out
          </span>
        )}

        {/* Slides up to meet the cursor. Hidden from touch, where there is
            no hover and the whole card is already tappable. */}
        <span className="pointer-events-none absolute inset-x-3 bottom-3 hidden translate-y-3 rounded-sm bg-paper/95 py-2.5 text-center text-[12px] font-medium tracking-wide text-ink opacity-0 transition-all duration-500 ease-out group-hover:translate-y-0 group-hover:opacity-100 lg:block">
          View piece
        </span>
      </div>

      <div className="card-caption mt-3.5">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="text-[15px] text-ink transition-colors group-hover:text-clay">
            {product.name}
          </h3>
          <span className="shrink-0 text-[15px] tabular-nums text-ink">
            {formatNaira(product.price_kobo)}
          </span>
        </div>
        <p className="mt-1 text-[13px] text-muted">
          {product.colour ?? product.category}
          {product.sizes.length > 1 && (
            <span className="text-line"> · </span>
          )}
          {product.sizes.length > 1 && (
            <span>{product.sizes.length} sizes</span>
          )}
        </p>
      </div>
    </Link>
  );
}
