import { StyleSheet, Text, View } from "react-native";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { colors, displayFont } from "@/lib/theme";
import { Button } from "@/components/ui";

export default function Account() {
  const { user, ready, signOut } = useAuth();

  if (!ready) return null;

  if (!user) {
    return (
      <View style={styles.screen}>
        <Text style={styles.title}>Your account</Text>
        <Text style={styles.body}>
          Log in to see your orders and keep your cart in step with the website.
        </Text>
        <Button label="Log in" onPress={() => router.push("/login")} style={{ marginTop: 22 }} />
      </View>
    );
  }

  const name =
    (user.user_metadata?.full_name as string | undefined) ??
    (user.user_metadata?.name as string | undefined) ??
    null;

  return (
    <View style={styles.screen}>
      <Text style={styles.eyebrow}>SIGNED IN</Text>
      <Text style={styles.title}>{name ?? "Your account"}</Text>
      <Text style={styles.body}>{user.email}</Text>
      <Text style={styles.note}>
        This is the same account as the website, so your cart and orders are
        shared between the two.
      </Text>
      <Button label="Log out" variant="outline" onPress={() => void signOut()} style={{ marginTop: 24 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, backgroundColor: colors.paper },
  eyebrow: { color: colors.clay, fontSize: 11, fontWeight: "700", letterSpacing: 2.4 },
  title: { fontFamily: displayFont, fontSize: 30, color: colors.ink, marginTop: 8 },
  body: { color: colors.inkSoft, lineHeight: 21, marginTop: 8 },
  note: { color: colors.muted, fontSize: 13, lineHeight: 19, marginTop: 18 },
});
