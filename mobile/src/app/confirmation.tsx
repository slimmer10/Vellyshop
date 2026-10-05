import { StyleSheet, Text, View } from "react-native";
import { router, useLocalSearchParams } from "expo-router";
import { colors, displayFont } from "@/lib/theme";
import { Button } from "@/components/ui";

export default function Confirmation() {
  const { reference, emailed } = useLocalSearchParams<{ reference: string; emailed: string }>();

  return (
    <View style={styles.screen}>
      <Text style={styles.eyebrow}>THANK YOU</Text>
      <Text style={styles.title}>Order placed</Text>
      <Text style={styles.ref}>{reference}</Text>
      <Text style={styles.body}>
        {emailed === "1"
          ? "A confirmation email is on its way."
          : "Your order is saved, but the confirmation email did not go out. The shop can resend it."}
      </Text>
      <Button label="View my orders" onPress={() => router.replace("/orders")} style={{ marginTop: 24 }} />
      <Button label="Keep shopping" variant="outline" onPress={() => router.replace("/")} style={{ marginTop: 10 }} />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, padding: 24, justifyContent: "center", backgroundColor: colors.paper },
  eyebrow: { color: colors.clay, fontSize: 11, fontWeight: "700", letterSpacing: 2.4 },
  title: { fontFamily: displayFont, fontSize: 34, color: colors.ink, marginTop: 8 },
  ref: { fontSize: 20, fontWeight: "700", letterSpacing: 1, color: colors.ink, marginTop: 14 },
  body: { color: colors.inkSoft, lineHeight: 21, marginTop: 12 },
});
