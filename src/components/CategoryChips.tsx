import Link from "next/link";
import { categorySlug } from "@/lib/categories";

export function CategoryChips({
  categories,
  activeSlug = null,
}: {
  categories: string[];
  /** Slug of the collection being viewed, or null on "all pieces". */
  activeSlug?: string | null;
}) {
  const chip = (active: boolean) =>
    `shrink-0 rounded-full border px-4 py-1.5 text-[13px] transition-colors ${
      active
        ? "border-ink bg-ink text-paper"
        : "border-line text-ink-soft hover:border-ink"
    }`;

  return (
    <div className="flex flex-wrap gap-2">
      <Link href="/" className={chip(activeSlug === null)}>
        All pieces
      </Link>
      {categories.map((c) => {
        const slug = categorySlug(c);
        return (
          <Link
            key={c}
            href={`/collections/${slug}`}
            className={chip(activeSlug === slug)}
          >
            {c}
          </Link>
        );
      })}
    </div>
  );
}
