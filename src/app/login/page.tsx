import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";

export const dynamic = "force-dynamic";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next, error, mode } = await searchParams;
  const creating = mode === "create";
  const destination =
    typeof next === "string" && next.startsWith("/") ? next : "/orders";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) redirect(destination);

  return (
    <div className="mx-auto w-full max-w-md px-4 py-16 sm:px-6 sm:py-24">
      <div className="rise rounded-sm border border-line bg-paper-raised p-7 sm:p-9">
        <p className="eyebrow text-clay">
          {creating ? "New customer" : "Welcome back"}
        </p>
        <h1 className="display mt-3 text-[28px] leading-tight text-ink">
          {creating ? "Create your account" : "Log in"}
        </h1>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-soft">
          {creating
            ? "Your account keeps your orders together, so you can check on anything you have bought without digging through your email."
            : "Log in to see your orders and check out faster. Everything you have bought before will still be here."}
        </p>

        {typeof error === "string" && error.length > 0 && (
          <p className="mt-6 rounded-sm border border-clay/30 bg-clay/5 px-4 py-3 text-sm text-clay-deep">
            {error === "exchange"
              ? "We could not finish that sign-in. Please try again."
              : error}
          </p>
        )}

        <div className="mt-7">
          <GoogleSignInButton
            next={destination}
            label={creating ? "Sign up with Google" : "Continue with Google"}
          />
        </div>

        <p className="mt-6 border-t border-line pt-5 text-[13px] text-muted">
          {creating ? (
            <>
              Already have an account?{" "}
              <Link
                href={`/login?next=${encodeURIComponent(destination)}`}
                className="text-clay underline underline-offset-4"
              >
                Log in
              </Link>
            </>
          ) : (
            <>
              New here?{" "}
              <Link
                href={`/login?mode=create&next=${encodeURIComponent(destination)}`}
                className="text-clay underline underline-offset-4"
              >
                Create an account
              </Link>
            </>
          )}
        </p>
      </div>

      <p className="mt-5 px-1 text-[12px] leading-relaxed text-muted">
        We use Google so there is no extra password to remember. Signing in
        creates your account the first time. We will only email you about
        orders you place.
      </p>
    </div>
  );
}
