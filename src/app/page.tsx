import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/ProductCard";
import { SetupNotice } from "@/components/SetupNotice";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=1400&q=80";

export default async function ShopPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return <SetupNotice detail={error.message} />;

  const products = (data ?? []) as Product[];
  const categories = [...new Set(products.map((p) => p.category))];

  return (
    <>
      <section className="hero-wash border-b border-line">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:px-6 lg:grid-cols-[1.1fr_1fr] lg:items-center lg:gap-16 lg:py-24">
          <div>
            <div className="eyebrow text-clay">Lagos · since 2019</div>
            <h1 className="display mt-5 text-4xl leading-[1.08] text-ink sm:text-5xl lg:text-6xl">
              Clothes chosen
              <br />
              one piece
              <span className="text-clay"> at a time.</span>
            </h1>
            <p className="mt-6 max-w-md text-base leading-relaxed text-ink-soft">
              Vellyshop is a small wardrobe shop. Every coat, dress and pair of
              jeans here was picked by hand, tried on, and kept only if it was
              worth keeping.
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Link
                href="#catalogue"
                className="rounded-full bg-ink px-6 py-3 text-sm font-medium text-paper transition-colors hover:bg-clay"
              >
                Browse the rail
              </Link>
              <span className="text-sm text-muted">
                Free delivery over ₦50,000
              </span>
            </div>
          </div>

          <div className="relative aspect-[4/5] overflow-hidden rounded-sm lg:aspect-[3/4]">
            <Image
              src={HERO_IMAGE}
              alt="A clothing rail hung with coats and jackets"
              fill
              priority
              sizes="(min-width: 1024px) 45vw, 90vw"
              className="object-cover"
            />
          </div>
        </div>
      </section>

      <section id="catalogue" className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="flex flex-wrap items-end justify-between gap-4 border-b border-line pb-5">
          <h2 className="display text-2xl text-ink">The rail</h2>
          <p className="text-sm text-muted">
            {products.length} {products.length === 1 ? "piece" : "pieces"}
            {categories.length > 0 && <> · {categories.join(" · ")}</>}
          </p>
        </div>

        {products.length === 0 ? (
          <p className="py-16 text-center text-sm text-muted">
            The rail is empty. Run{" "}
            <code className="font-mono text-xs">supabase/seed.sql</code> to stock
            it.
          </p>
        ) : (
          <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((product, index) => (
              <ProductCard
                key={product.id}
                product={product}
                priority={index < 3}
              />
            ))}
          </div>
        )}
      </section>
    </>
  );
}
