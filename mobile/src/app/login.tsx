import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { Redirect, router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { colors, displayFont } from "@/lib/theme";
import { Button } from "@/components/ui";

export default function Login() {
  const { user, signInWithGoogle } = useAuth();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (user) return <Redirect href="/account" />;

  return (
    <View style={styles.screen}>
      <Text style={styles.eyebrow}>WELCOME BACK</Text>
      <Text style={styles.title}>Log in</Text>
      <Text style={styles.body}>
        Use the same Google account as on the website. Your cart and your orders
        follow you between the two.
      </Text>

      {error && <Text style={styles.error}>{error}</Text>}

      <Button
        label={busy ? "Opening Google…" : "Continue with Google"}
        disabled={busy}
        onPress={async () => {
          setBusy(true);
          setError(null);
          const result = await signInWithGoogle();
          setBusy(false);
          if (result.error) setError(result.error);
          else router.back();
        }}
        style={{ marginTop: 24 }}
      />
      <Text style={styles.fine}>
        We use Google so there is no extra password to remember. Signing in
        creates your account the first time.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, backgroundColor: colors.paper },
  eyebrow: { color: colors.clay, fontSize: 11, fontWeight: "700", letterSpacing: 2.4, marginTop: 16 },
  title: { fontFamily: displayFont, fontSize: 34, color: colors.ink, marginTop: 8 },
  body: { color: colors.inkSoft, lineHeight: 21, marginTop: 12 },
  error: {
    marginTop: 18,
    padding: 12,
    color: colors.clayDeep,
    backgroundColor: "rgba(156,61,46,0.07)",
    borderColor: "rgba(156,61,46,0.3)",
    borderWidth: 1,
    borderRadius: 3,
    fontSize: 13,
  },
  fine: { color: colors.muted, fontSize: 12, lineHeight: 18, marginTop: 16 },
});
