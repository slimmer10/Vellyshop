import { useState } from "react";
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { Redirect, router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { API_URL } from "@/lib/supabase";
import { deliveryFor, formatNaira } from "@/lib/money";
import { colors, displayFont } from "@/lib/theme";
import { Button } from "@/components/ui";

type Field = "fullName" | "email" | "phone" | "address" | "city" | "state" | "note";

export default function Checkout() {
  const { user, session } = useAuth();
  const { lines, subtotalKobo, clear } = useCart();
  const [form, setForm] = useState<Record<Field, string>>({
    fullName: (user?.user_metadata?.full_name as string | undefined) ?? "",
    email: user?.email ?? "",
    phone: "",
    address: "",
    city: "",
    state: "Lagos",
    note: "",
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!user) return <Redirect href="/login" />;
  if (lines.length === 0 && !busy) return <Redirect href="/cart" />;

  const delivery = deliveryFor(subtotalKobo);
  const set = (field: Field) => (value: string) => setForm((f) => ({ ...f, [field]: value }));

  async function submit() {
    setBusy(true);
    setError(null);
    try {
      // Same endpoint family as the website: the server re-reads prices from the
      // database and sends the confirmation email.
      const response = await fetch(`${API_URL}/api/checkout`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session?.access_token ?? ""}`,
        },
        body: JSON.stringify({
          details: form,
          lines: lines.map((l) => ({ productId: l.productId, size: l.size, quantity: l.quantity })),
        }),
      });
      const result = await response.json();

      if (!result.ok) {
        setError(result.error ?? "Could not place your order.");
        setBusy(false);
        return;
      }

      clear();
      router.replace({
        pathname: "/confirmation",
        params: { reference: result.reference, emailed: result.emailed ? "1" : "0" },
      });
    } catch {
      setError("Could not reach the shop. Check your connection and try again.");
      setBusy(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.title}>Delivery details</Text>

        <Input label="Full name" value={form.fullName} onChangeText={set("fullName")} />
        <Input label="Email" value={form.email} onChangeText={set("email")} keyboardType="email-address" autoCapitalize="none" />
        <Input label="Phone" value={form.phone} onChangeText={set("phone")} keyboardType="phone-pad" />
        <Input label="Address" value={form.address} onChangeText={set("address")} />
        <Input label="City or town" value={form.city} onChangeText={set("city")} />
        <Input label="State" value={form.state} onChangeText={set("state")} />
        <Input label="Note (optional)" value={form.note} onChangeText={set("note")} multiline />

        <View style={styles.summary}>
          <Text style={styles.sumLine}>Subtotal {formatNaira(subtotalKobo)}</Text>
          <Text style={styles.sumLine}>Delivery {delivery === 0 ? "Free" : formatNaira(delivery)}</Text>
          <Text style={styles.sumTotal}>Total {formatNaira(subtotalKobo + delivery)}</Text>
          <Text style={styles.fine}>No card payment: payment is settled with the shop directly.</Text>
        </View>

        {error && <Text style={styles.error}>{error}</Text>}

        <Button label={busy ? "Placing order…" : "Place order"} disabled={busy} onPress={submit} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Input({
  label,
  ...props
}: { label: string } & React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ marginTop: 14 }}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor={colors.muted}
        style={[styles.input, props.multiline && { minHeight: 70, textAlignVertical: "top" }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  title: { fontFamily: displayFont, fontSize: 26, color: colors.ink },
  label: { color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1.6, textTransform: "uppercase", marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paperRaised,
    borderRadius: 3,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 15,
    color: colors.ink,
  },
  summary: { marginVertical: 22, padding: 14, borderWidth: 1, borderColor: colors.line, backgroundColor: colors.paperRaised, borderRadius: 3 },
  sumLine: { color: colors.inkSoft, fontSize: 14, marginBottom: 4 },
  sumTotal: { color: colors.ink, fontSize: 16, fontWeight: "700", marginTop: 4 },
  fine: { color: colors.muted, fontSize: 11, marginTop: 8 },
  error: { color: colors.clayDeep, marginBottom: 14, fontSize: 13 },
});
