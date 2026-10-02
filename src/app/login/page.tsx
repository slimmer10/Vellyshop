import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export const dynamic = "force-dynamic";

export const metadata = { title: "Sign in" };

export default async function LoginPage({
  searchParams,
}: PageProps<"/login">) {
  const { next, error } = await searchParams;
  const destination = typeof next === "string" && next.startsWith("/") ? next : "/orders";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect(destination);

  return (
    <div className="mx-auto flex max-w-md flex-col px-4 py-20 sm:px-6">
      <div className="eyebrow text-clay">Vellyshop</div>
      <h1 className="display mt-4 text-3xl text-ink">Sign in to continue</h1>
      <p className="mt-3 text-sm leading-relaxed text-ink-soft">
        We use your Google account so you never need another password. Signing in
        keeps your order history with you — close this tab, come back next week,
        and it will all still be here.
      </p>

      {typeof error === "string" && error.length > 0 && (
        <p className="mt-6 rounded-sm border border-clay/30 bg-clay/5 px-4 py-3 text-sm text-clay-deep">
          {error === "exchange"
            ? "We could not complete that sign-in. Please try again."
            : error}
        </p>
      )}

      <div className="mt-8">
        <GoogleSignInButton next={destination} />
      </div>

      <p className="mt-8 text-xs leading-relaxed text-muted">
        By signing in you agree to let us email you about orders you place.
      </p>
    </div>
  );
}
