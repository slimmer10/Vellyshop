import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AddToCart } from "@/components/AddToCart";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
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

  const { data: relatedRows } = await supabase
    .from("products")
    .select("*")
    .eq("category", product.category)
    .neq("id", product.id)
    .limit(3);

  const related = (relatedRows ?? []) as Product[];

  return (
    <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
        <ol className="flex flex-wrap items-center gap-1.5">
          <li>
            <Link href="/" className="transition-colors hover:text-clay">
              Shop
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li>
            <Link
              href={`/?category=${encodeURIComponent(product.category)}#catalogue`}
              className="transition-colors hover:text-clay"
            >
              {product.category}
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink-soft">{product.name}</li>
        </ol>
      </nav>

      <div className="mt-6 grid gap-8 lg:grid-cols-2 lg:gap-14">
        <div className="rise relative aspect-[4/5] overflow-hidden rounded-sm bg-[#efe8df]">
          <Image
            src={product.image_url}
            alt={product.name}
            fill
            priority
            sizes="(min-width: 1024px) 48vw, 92vw"
            className="object-cover"
          />
          {!product.in_stock && (
            <span className="absolute left-4 top-4 rounded-full bg-paper/95 px-3 py-1 text-[11px] font-medium text-ink">
              Sold out
            </span>
          )}
        </div>

        <div
          className="rise lg:py-2"
          style={{ "--delay": "120ms" } as React.CSSProperties}
        >
          <p className="eyebrow text-clay">{product.category}</p>
          <h1 className="display mt-3 text-[30px] leading-tight text-ink sm:text-[34px]">
            {product.name}
          </h1>
          <p className="mt-2 text-[15px] text-muted">{product.tagline}</p>

          <p className="mt-5 text-[22px] tabular-nums text-ink">
            {formatNaira(product.price_kobo)}
          </p>
          <p className="mt-1 text-[13px] text-muted">
            Delivery calculated at checkout
          </p>

          <AddToCart product={product} />

          <div className="mt-10 space-y-0 border-t border-line">
            <details className="group border-b border-line" open>
              <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[14px] font-medium text-ink">
                Description
                <span className="text-muted transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-5 text-[14px] leading-relaxed text-ink-soft">
                {product.description}
                {product.colour && (
                  <span className="mt-3 block text-muted">
                    Colour: {product.colour}
                  </span>
                )}
              </p>
            </details>

            <details className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[14px] font-medium text-ink">
                Delivery
                <span className="text-muted transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-5 text-[14px] leading-relaxed text-ink-soft">
                ₦2,500 flat anywhere in Nigeria, and free on orders over
                ₦50,000. Two to five working days, often next day within Lagos.
                We call before every delivery.
              </p>
            </details>

            <details className="group border-b border-line">
              <summary className="flex cursor-pointer list-none items-center justify-between py-4 text-[14px] font-medium text-ink">
                Returns
                <span className="text-muted transition-transform duration-300 group-open:rotate-45">
                  +
                </span>
              </summary>
              <p className="pb-5 text-[14px] leading-relaxed text-ink-soft">
                Seven days from delivery, unworn and with the tags still on.
                Reply to your confirmation email and we will arrange the pickup.
              </p>
            </details>
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20 border-t border-line pt-10">
          <h2 className="display text-xl text-ink">More in {product.category}</h2>
          <div className="mt-7 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3">
            {related.map((item, index) => (
              <Reveal key={item.id} delay={index * 90}>
                <ProductCard product={item} />
              </Reveal>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
