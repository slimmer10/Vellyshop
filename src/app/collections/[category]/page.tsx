import Link from "next/link";
import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ProductCard } from "@/components/ProductCard";
import { CategoryChips } from "@/components/CategoryChips";
import { SetupNotice } from "@/components/SetupNotice";
import { Reveal } from "@/components/Reveal";
import { categoryFromSlug, categorySlug } from "@/lib/categories";
import type { Product } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: PageProps<"/collections/[category]">) {
  const { category } = await params;
  const name = category.charAt(0).toUpperCase() + category.slice(1);
  return { title: name };
}

export default async function CollectionPage({
  params,
}: PageProps<"/collections/[category]">) {
  const { category: slug } = await params;
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("products")
    .select("*")
    .order("created_at", { ascending: true });

  if (error) return <SetupNotice detail={error.message} />;

  const all = (data ?? []) as Product[];
  const categories = [...new Set(all.map((p) => p.category))];
  const name = categoryFromSlug(categories, slug);

  if (!name) notFound();

  const products = all.filter((p) => p.category === name);

  return (
    <div className="shell py-8 sm:py-10">
      <nav aria-label="Breadcrumb" className="text-[13px] text-muted">
        <ol className="flex items-center gap-1.5">
          <li>
            <Link href="/" className="transition-colors hover:text-clay">
              Shop
            </Link>
          </li>
          <li aria-hidden="true">/</li>
          <li className="text-ink-soft">{name}</li>
        </ol>
      </nav>

      <header className="rise mt-6 border-b border-line pb-7">
        <h1 className="display text-[32px] leading-tight text-ink sm:text-[38px]">
          {name}
        </h1>
        <p className="mt-1.5 text-[13px] text-muted">
          {products.length} {products.length === 1 ? "piece" : "pieces"}
        </p>
        <div className="mt-6">
          <CategoryChips categories={categories} activeSlug={categorySlug(name)} />
        </div>
      </header>

      {products.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-sm text-muted">Nothing in {name} right now.</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm text-clay underline underline-offset-4"
          >
            See everything
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 gap-x-5 gap-y-12 lg:grid-cols-3 lg:gap-x-7 xl:grid-cols-4">
          {products.map((product, index) => (
            <Reveal key={product.id} delay={(index % 4) * 80}>
              <ProductCard product={product} priority={index < 4} />
            </Reveal>
          ))}
        </div>
      )}
    </div>
  );
}
