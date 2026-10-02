/** "Outerwear" -> "outerwear", so collections get real, readable URLs. */
export function categorySlug(category: string): string {
  return category
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

/** Finds the original category name behind a slug from the URL. */
export function categoryFromSlug(
  categories: string[],
  slug: string,
): string | null {
  const wanted = slug.toLowerCase();
  return categories.find((c) => categorySlug(c) === wanted) ?? null;
}
