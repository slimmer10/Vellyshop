import { FlatList, Pressable, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { router } from "expo-router";
import { useAuth } from "@/lib/auth";
import { lineKey, useCart } from "@/lib/cart";
import { DELIVERY_KOBO, FREE_DELIVERY_FROM_KOBO, deliveryFor, formatNaira } from "@/lib/money";
import { colors, displayFont } from "@/lib/theme";
import { Button } from "@/components/ui";

export default function Cart() {
  const { lines, ready, subtotalKobo, setQuantity, remove } = useCart();
  const { user } = useAuth();

  if (ready && lines.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyTitle}>Your cart is empty</Text>
        <Text style={styles.emptyText}>
          Pieces you add here also show up on the website when you are signed in
          to the same account.
        </Text>
        <Button label="Browse the shop" onPress={() => router.navigate("/")} style={{ marginTop: 20 }} />
      </View>
    );
  }

  const delivery = deliveryFor(subtotalKobo);

  return (
    <View style={styles.screen}>
      <FlatList
        data={lines}
        keyExtractor={(l) => lineKey(l.productId, l.size)}
        contentContainerStyle={styles.list}
        ListHeaderComponent={
          <Text style={styles.sync}>
            {user
              ? "Synced with your account — changes on the website appear here."
              : "Sign in to sync this cart with the website."}
          </Text>
        }
        renderItem={({ item }) => {
          const key = lineKey(item.productId, item.size);
          return (
            <View style={styles.line}>
              <Image source={item.imageUrl} alt={item.name} style={styles.thumb} contentFit="cover" />
              <View style={{ flex: 1 }}>
                <Text style={styles.name} numberOfLines={2}>
                  {item.name}
                </Text>
                <Text style={styles.meta}>
                  {item.size ? `Size ${item.size} · ` : ""}
                  {formatNaira(item.priceKobo)}
                </Text>
                <View style={styles.actions}>
                  <View style={styles.stepper}>
                    <Pressable style={styles.step} onPress={() => setQuantity(key, item.quantity - 1)}>
                      <Text style={styles.stepText}>−</Text>
                    </Pressable>
                    <Text style={styles.qty}>{item.quantity}</Text>
                    <Pressable style={styles.step} onPress={() => setQuantity(key, item.quantity + 1)}>
                      <Text style={styles.stepText}>+</Text>
                    </Pressable>
                  </View>
                  <Pressable onPress={() => remove(key)}>
                    <Text style={styles.remove}>Remove</Text>
                  </Pressable>
                </View>
              </View>
              <Text style={styles.lineTotal}>{formatNaira(item.priceKobo * item.quantity)}</Text>
            </View>
          );
        }}
      />

      <View style={styles.summary}>
        <Row label="Subtotal" value={formatNaira(subtotalKobo)} />
        <Row label="Delivery" value={delivery === 0 ? "Free" : formatNaira(delivery)} />
        {delivery > 0 && (
          <Text style={styles.hint}>
            Free delivery over {formatNaira(FREE_DELIVERY_FROM_KOBO)} (otherwise {formatNaira(DELIVERY_KOBO)}).
          </Text>
        )}
        <Row label="Total" value={formatNaira(subtotalKobo + delivery)} strong />
        <Button
          label={user ? "Checkout" : "Sign in to check out"}
          onPress={() => router.push(user ? "/checkout" : "/login")}
          style={{ marginTop: 12 }}
        />
      </View>
    </View>
  );
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <View style={styles.row}>
      <Text style={[styles.rowLabel, strong && styles.strong]}>{label}</Text>
      <Text style={[styles.rowValue, strong && styles.strong]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  list: { padding: 16 },
  sync: { color: colors.muted, fontSize: 12, marginBottom: 14 },
  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: colors.paper },
  emptyTitle: { fontFamily: displayFont, fontSize: 26, color: colors.ink },
  emptyText: { color: colors.muted, textAlign: "center", marginTop: 10, lineHeight: 20 },
  line: { flexDirection: "row", gap: 12, paddingVertical: 14, borderBottomWidth: 1, borderBottomColor: colors.line },
  thumb: { width: 72, height: 96, backgroundColor: colors.line, borderRadius: 2 },
  name: { color: colors.ink, fontSize: 14, fontWeight: "500" },
  meta: { color: colors.muted, fontSize: 12, marginTop: 3 },
  actions: { flexDirection: "row", alignItems: "center", gap: 14, marginTop: 10 },
  stepper: { flexDirection: "row", alignItems: "center", borderWidth: 1, borderColor: colors.line, borderRadius: 3, backgroundColor: colors.paperRaised },
  step: { width: 36, height: 34, alignItems: "center", justifyContent: "center" },
  stepText: { fontSize: 18, color: colors.ink },
  qty: { minWidth: 26, textAlign: "center", color: colors.ink },
  remove: { color: colors.clay, fontSize: 12, textDecorationLine: "underline" },
  lineTotal: { color: colors.ink, fontSize: 13, fontWeight: "500" },
  summary: { padding: 16, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.paperRaised },
  row: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 4 },
  rowLabel: { color: colors.inkSoft, fontSize: 14 },
  rowValue: { color: colors.ink, fontSize: 14 },
  strong: { fontWeight: "700", fontSize: 16, color: colors.ink },
  hint: { color: colors.muted, fontSize: 11, marginBottom: 4 },
});
