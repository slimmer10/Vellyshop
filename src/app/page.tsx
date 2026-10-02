import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/ProductCard";
import { SetupNotice } from "@/components/SetupNotice";
import { Reveal } from "@/components/Reveal";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=1800&q=80";

const PROMISES: [string, string][] = [
  ["Nationwide delivery", "₦2,500 flat, free over ₦50,000"],
  ["2–5 working days", "Lagos is often next day"],
  ["7-day returns", "Unworn, with the tags on"],
];

export default async function ShopPage({ searchParams }: PageProps<"/">) {
  const { category } = await searchParams;
  const active = typeof category === "string" ? category : null;

  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return <SetupNotice detail={error.message} />;

  const all = (data ?? []) as Product[];
  const categories = [...new Set(all.map((p) => p.category))];
  const products = active ? all.filter((p) => p.category === active) : all;

  return (
    <>
      {/* ------------------------------------------------------------ hero */}
      <section className="relative h-[70vh] min-h-[440px] w-full overflow-hidden sm:h-[76vh]">
        <Image
          src={HERO_IMAGE}
          alt="A rail hung with coats, jackets and knitwear"
          fill
          priority
          sizes="100vw"
          className="hero-pan object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-ink/5" />

        <div className="absolute inset-x-0 bottom-0">
          <div className="mx-auto max-w-6xl px-4 pb-12 sm:px-6 sm:pb-16">
            <p
              className="rise eyebrow text-paper/75"
              style={{ "--delay": "80ms" } as React.CSSProperties}
            >
              New in
            </p>
            <h1
              className="rise display mt-4 max-w-xl text-4xl leading-[1.08] text-paper sm:text-5xl"
              style={{ "--delay": "180ms" } as React.CSSProperties}
            >
              Layers for the harmattan
            </h1>
            <p
              className="rise mt-4 max-w-md text-[15px] leading-relaxed text-paper/85"
              style={{ "--delay": "280ms" } as React.CSSProperties}
            >
              Coats, knitwear and denim, picked a piece at a time and kept only
              if they were worth keeping.
            </p>
            <div
              className="rise mt-7 flex flex-wrap items-center gap-3"
              style={{ "--delay": "380ms" } as React.CSSProperties}
            >
              <Link
                href="/#catalogue"
                className="press rounded-full bg-paper px-7 py-3 text-sm font-medium text-ink hover:bg-clay hover:text-paper"
              >
                Shop all
              </Link>
              <Link
                href="/?category=Outerwear#catalogue"
                className="press rounded-full border border-paper/50 px-7 py-3 text-sm font-medium text-paper hover:border-paper hover:bg-paper/10"
              >
                See outerwear
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- promises */}
      <section className="border-b border-line bg-paper-raised">
        <div className="mx-auto grid max-w-6xl divide-y divide-line px-4 sm:px-6 md:grid-cols-3 md:divide-y-0">
          {PROMISES.map(([title, detail], i) => (
            <Reveal key={title} delay={i * 90}>
              <div className="py-5">
                <p className="text-sm font-medium text-ink">{title}</p>
                <p className="mt-0.5 text-[13px] text-muted">{detail}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* ------------------------------------------------------- catalogue */}
      <section id="catalogue" className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="flex items-end justify-between gap-6">
          <div>
            <h2 className="display text-2xl text-ink">
              {active ?? "All pieces"}
            </h2>
            <p className="mt-1 text-[13px] text-muted">
              {products.length} {products.length === 1 ? "item" : "items"}
            </p>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-2 border-b border-line pb-6">
          <Link
            href="/#catalogue"
            className={`rounded-full border px-4 py-1.5 text-[13px] transition-colors ${
              active === null
                ? "border-ink bg-ink text-paper"
                : "border-line text-ink-soft hover:border-ink"
            }`}
          >
            All
          </Link>
          {categories.map((c) => (
            <Link
              key={c}
              href={`/?category=${encodeURIComponent(c)}#catalogue`}
              className={`rounded-full border px-4 py-1.5 text-[13px] transition-colors ${
                active === c
                  ? "border-ink bg-ink text-paper"
                  : "border-line text-ink-soft hover:border-ink"
              }`}
            >
              {c}
            </Link>
          ))}
        </div>

        {products.length === 0 ? (
          <div className="py-20 text-center">
            <p className="text-sm text-muted">
              Nothing in {active} right now.
            </p>
            <Link
              href="/#catalogue"
              className="mt-4 inline-block text-sm text-clay underline underline-offset-4"
            >
              See everything
            </Link>
          </div>
        ) : (
          <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-3">
            {products.map((product, index) => (
              <Reveal key={product.id} delay={(index % 3) * 90}>
                <ProductCard product={product} priority={index < 3} />
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </>
  );
}
