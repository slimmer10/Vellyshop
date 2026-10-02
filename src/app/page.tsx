import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/ProductCard";
import { CategoryChips } from "@/components/CategoryChips";
import { SetupNotice } from "@/components/SetupNotice";
import { Reveal } from "@/components/Reveal";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1551232864-3f0890e580d9?w=2000&q=80";

const PROMISES: [string, string][] = [
  ["Nationwide delivery", "₦2,500 flat, free over ₦50,000"],
  ["2–5 working days", "Lagos is often next day"],
  ["7-day returns", "Unworn, with the tags on"],
];

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
      {/* ------------------------------------------------------------ hero */}
      <section className="relative h-[66vh] min-h-[420px] w-full overflow-hidden xl:h-[72vh]">
        <Image
          src={HERO_IMAGE}
          alt="A rail hung with coats, jackets and knitwear"
          fill
          priority
          sizes="100vw"
          className="hero-pan object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-ink/80 via-ink/30 to-ink/5" />

        <div className="absolute inset-x-0 bottom-0 pb-12 sm:pb-16">
          <div className="shell">
            <p
              className="rise eyebrow text-paper/75"
              style={{ "--delay": "80ms" } as React.CSSProperties}
            >
              New in
            </p>
            <h1
              className="rise display mt-4 max-w-2xl text-[40px] leading-[1.05] text-paper sm:text-[56px] xl:text-[64px]"
              style={{ "--delay": "180ms" } as React.CSSProperties}
            >
              Layers for the harmattan
            </h1>
            <p
              className="rise mt-5 max-w-lg text-[15px] leading-relaxed text-paper/85 sm:text-base"
              style={{ "--delay": "280ms" } as React.CSSProperties}
            >
              Coats, knitwear and denim, picked a piece at a time and kept only
              if they were worth keeping.
            </p>
            <div
              className="rise mt-8 flex flex-wrap items-center gap-3"
              style={{ "--delay": "380ms" } as React.CSSProperties}
            >
              <Link
                href="#catalogue"
                className="press rounded-full bg-paper px-8 py-3.5 text-sm font-medium text-ink hover:bg-clay hover:text-paper"
              >
                Shop all
              </Link>
              <Link
                href="/collections/outerwear"
                className="press rounded-full border border-paper/50 px-8 py-3.5 text-sm font-medium text-paper hover:border-paper hover:bg-paper/10"
              >
                See outerwear
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* -------------------------------------------------------- promises */}
      <section className="border-b border-line bg-paper-raised">
        <div className="shell grid divide-y divide-line md:grid-cols-3 md:divide-y-0">
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
      <section id="catalogue" className="shell py-14 xl:py-16">
        <div className="border-b border-line pb-7">
          <h2 className="display text-[28px] text-ink sm:text-[32px]">
            All pieces
          </h2>
          <p className="mt-1.5 text-[13px] text-muted">
            {products.length} {products.length === 1 ? "piece" : "pieces"} on the
            rail
          </p>
          <div className="mt-6">
            <CategoryChips categories={categories} activeSlug={null} />
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-3 lg:gap-x-7 xl:grid-cols-4">
          {products.map((product, index) => (
            <Reveal key={product.id} delay={(index % 4) * 80}>
              <ProductCard product={product} priority={index < 4} />
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
