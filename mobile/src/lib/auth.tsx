import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

WebBrowser.maybeCompleteAuthSession();

type AuthValue = {
  user: User | null;
  session: Session | null;
  /** False until the saved session has been read from storage. */
  ready: boolean;
  signInWithGoogle: () => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_event, next) => {
      setSession(next);
      setReady(true);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  const signInWithGoogle = useCallback(async () => {
    // vellyshop://auth/callback in an installed app. This exact URL must be in
    // Supabase -> Authentication -> URL Configuration -> Redirect URLs.
    const redirectTo = Linking.createURL("auth/callback");

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo, skipBrowserRedirect: true },
    });
    if (error || !data.url) {
      return { error: error?.message ?? "Could not start Google sign-in." };
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
    if (result.type !== "success") return {}; // Cancelled: not an error.

    const returned = new URL(result.url);
    const code = returned.searchParams.get("code");
    if (!code) {
      return {
        error:
          returned.searchParams.get("error_description") ??
          "Sign-in did not complete. Check the redirect URL in Supabase.",
      };
    }

    const exchange = await supabase.auth.exchangeCodeForSession(code);
    return exchange.error ? { error: exchange.error.message } : {};
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const value = useMemo<AuthValue>(
    () => ({ user: session?.user ?? null, session, ready, signInWithGoogle, signOut }),
    [session, ready, signInWithGoogle, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside an AuthProvider");
  return context;
}
