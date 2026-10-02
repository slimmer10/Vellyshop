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
          sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
          className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.04]"
        />
        {!product.in_stock && (
          <span className="absolute left-3 top-3 rounded-full bg-ink/85 px-3 py-1 text-[11px] font-medium text-paper">
            Sold out
          </span>
        )}
      </div>
      <div className="mt-4 flex items-baseline justify-between gap-3">
        <h3 className="display text-base text-ink transition-colors group-hover:text-clay">
          {product.name}
        </h3>
        <span className="shrink-0 text-sm tabular-nums text-ink-soft">
          {formatNaira(product.price_kobo)}
        </span>
      </div>
      <p className="mt-1 text-sm text-muted">{product.tagline}</p>
    </Link>
  );
}
