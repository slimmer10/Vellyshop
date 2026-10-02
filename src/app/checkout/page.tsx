import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { CheckoutForm } from "@/components/CheckoutForm";

export const dynamic = "force-dynamic";

export const metadata = { title: "Checkout" };

export default async function CheckoutPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return (
      <div className="mx-auto max-w-md px-4 py-20 sm:px-6">
        <div className="eyebrow text-clay">Checkout</div>
        <h1 className="display mt-4 text-3xl text-ink">Log in to check out</h1>
        <p className="mt-3 text-sm leading-relaxed text-ink-soft">
          Your cart is safe where it is. Sign in and you will come straight back
          here, with everything still in it.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/login?next=%2Fcheckout"
            className="press rounded-full bg-ink px-6 py-3 text-center text-sm font-medium text-paper hover:bg-clay"
          >
            Log in
          </Link>
          <Link
            href="/login?mode=create&next=%2Fcheckout"
            className="press rounded-full border border-line px-6 py-3 text-center text-sm font-medium text-ink hover:border-ink"
          >
            Create an account
          </Link>
        </div>
      </div>
    );
  }

  const metadata = user.user_metadata as { full_name?: string; name?: string };

  return (
    <CheckoutForm
      defaultEmail={user.email ?? ""}
      defaultName={metadata.full_name ?? metadata.name ?? ""}
    />
  );
}
