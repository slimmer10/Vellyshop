import Link from "next/link";

export function Footer() {
  return (
    <footer className="mt-24 border-t border-line bg-paper-raised">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-10 text-sm text-muted sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div>
          <div className="display text-lg text-ink">Vellyshop</div>
          <p className="mt-1 max-w-sm leading-relaxed">
            Considered clothing, sent anywhere in Nigeria. Free delivery over
            ₦50,000.
          </p>
        </div>
        <div className="flex gap-6">
          <Link href="/" className="transition-colors hover:text-clay">
            Shop
          </Link>
          <Link href="/orders" className="transition-colors hover:text-clay">
            Orders
          </Link>
          <Link href="/cart" className="transition-colors hover:text-clay">
            Cart
          </Link>
        </div>
      </div>
    </footer>
  );
}
