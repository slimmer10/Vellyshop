import Link from "next/link";

const SHOP = [
  ["All pieces", "/"],
  ["Outerwear", "/?category=Outerwear"],
  ["Dresses", "/?category=Dresses"],
  ["Knitwear", "/?category=Knitwear"],
  ["Tops", "/?category=Tops"],
];

const ACCOUNT = [
  ["Log in", "/login"],
  ["Create account", "/login?mode=create"],
  ["Order history", "/orders"],
  ["Your cart", "/cart"],
];

export function Footer() {
  return (
    <footer className="mt-20 border-t border-line bg-paper-raised">
      <div className="mx-auto max-w-6xl px-4 py-14 sm:px-6">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="display text-lg text-ink">Vellyshop</span>
              <span className="h-[5px] w-[5px] rounded-full bg-clay" />
            </div>
            <p className="mt-3 max-w-xs text-[13px] leading-relaxed text-muted">
              A small wardrobe shop in Lagos. Coats, knitwear, denim and
              dresses, sent anywhere in Nigeria.
            </p>
          </div>

          <div>
            <h3 className="eyebrow text-ink">Shop</h3>
            <ul className="mt-4 space-y-2.5">
              {SHOP.map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="nav-link text-[13px] text-muted transition-colors hover:text-clay"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="eyebrow text-ink">Account</h3>
            <ul className="mt-4 space-y-2.5">
              {ACCOUNT.map(([label, href]) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="nav-link text-[13px] text-muted transition-colors hover:text-clay"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="eyebrow text-ink">Delivery &amp; returns</h3>
            <dl className="mt-4 space-y-3 text-[13px] leading-relaxed text-muted">
              <div>
                <dt className="text-ink-soft">Delivery</dt>
                <dd>₦2,500 nationwide, free over ₦50,000. 2–5 working days.</dd>
              </div>
              <div>
                <dt className="text-ink-soft">Returns</dt>
                <dd>Seven days, unworn and with the tags on.</dd>
              </div>
            </dl>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-2 border-t border-line pt-6 text-[12px] text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Vellyshop · Lagos, Nigeria</p>
          <p>Payment is settled with the shop directly.</p>
        </div>
      </div>
    </footer>
  );
}
