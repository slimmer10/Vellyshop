import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddToCart } from "@/components/AddToCart";
import { formatNaira } from "@/lib/money";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export default async function ProductPage({
  params,
}: PageProps<"/product/[slug]">) {
  const { slug } = await params;
  const supabase = await createClient();

  const { data } = await supabase
    .from("products")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();

  if (!data) notFound();
  const product = data as Product;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-16">
      <Link
        href="/"
        className="text-sm text-muted transition-colors hover:text-clay"
      >
        ← Back to the rail
      </Link>

      <div className="mt-8 grid gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-[#efe8df]">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            priority
            sizes="(min-width: 1024px) 48vw, 92vw"
            className="object-cover"
          />
        </div>

        <div className="lg:py-4">
          <div className="eyebrow text-clay">{product.category}</div>
          <h1 className="display mt-4 text-3xl leading-tight text-ink sm:text-4xl">
            {product.name}
          </h1>
          <p className="mt-2 text-base text-muted">{product.tagline}</p>

          <p className="mt-6 text-2xl tabular-nums text-ink">
            {formatNaira(product.price_kobo)}
          </p>

          <p className="mt-6 max-w-prose leading-relaxed text-ink-soft">
            {product.description}
          </p>

          {product.colour && (
            <p className="mt-4 text-sm text-muted">
              Colour: <span className="text-ink-soft">{product.colour}</span>
            </p>
          )}

          <AddToCart product={product} />

          <dl className="mt-10 space-y-3 border-t border-line pt-6 text-sm">
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-muted">Delivery</dt>
              <dd className="text-ink-soft">
                ₦2,500 nationwide, free over ₦50,000. Two to five working days.
              </dd>
            </div>
            <div className="flex gap-3">
              <dt className="w-28 shrink-0 text-muted">Returns</dt>
              <dd className="text-ink-soft">
                Seven days, unworn and with tags on.
              </dd>
            </div>
          </dl>
        </div>
      </div>
    </div>
  );
}
