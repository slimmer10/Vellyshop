import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { router, useFocusEffect } from "expo-router";
import { useAuth } from "@/lib/auth";
import { supabase } from "@/lib/supabase";
import { formatNaira } from "@/lib/money";
import { colors, displayFont } from "@/lib/theme";
import { Button } from "@/components/ui";
import type { Order } from "@/lib/types";

export default function Orders() {
  const { user, ready } = useAuth();
  const [orders, setOrders] = useState<Order[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(async () => {
    if (!user) return;
    const { data, error: failure } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    if (failure) setError(failure.message);
    else {
      setError(null);
      setOrders(data as Order[]);
    }
  }, [user]);

  // Reload whenever the tab is opened, so a fresh order is there straight away.
  useFocusEffect(
    useCallback(() => {
      void load();
    }, [load]),
  );

  if (!ready) return null;

  if (!user) {
    return (
      <View style={styles.center}>
        <Text style={styles.title}>Your orders</Text>
        <Text style={styles.note}>Log in to see what you have bought.</Text>
        <Button label="Log in" onPress={() => router.push("/login")} style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <FlatList
      data={orders ?? []}
      keyExtractor={(o) => o.id}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          tintColor={colors.clay}
          onRefresh={async () => {
            setRefreshing(true);
            await load();
            setRefreshing(false);
          }}
        />
      }
      ListEmptyComponent={
        error ? (
          <Text style={styles.note}>Could not load your orders: {error}</Text>
        ) : orders ? (
          <Text style={styles.note}>No orders yet.</Text>
        ) : (
          <ActivityIndicator color={colors.clay} style={{ marginTop: 40 }} />
        )
      }
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={styles.head}>
            <Text style={styles.ref}>{item.reference}</Text>
            <Text style={styles.status}>{item.status}</Text>
          </View>
          <Text style={styles.date}>{new Date(item.created_at).toLocaleDateString("en-NG", { dateStyle: "medium" })}</Text>
          {item.order_items.map((line) => (
            <Text key={line.id} style={styles.item}>
              {line.quantity} × {line.name}
              {line.size ? ` (${line.size})` : ""}
            </Text>
          ))}
          <Text style={styles.total}>Total {formatNaira(item.total_kobo)}</Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  list: { padding: 16, backgroundColor: colors.paper, flexGrow: 1 },
  center: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32, backgroundColor: colors.paper },
  title: { fontFamily: displayFont, fontSize: 26, color: colors.ink },
  note: { color: colors.muted, textAlign: "center", marginTop: 12 },
  card: { backgroundColor: colors.paperRaised, borderColor: colors.line, borderWidth: 1, borderRadius: 3, padding: 16, marginBottom: 12 },
  head: { flexDirection: "row", justifyContent: "space-between" },
  ref: { color: colors.ink, fontWeight: "700", letterSpacing: 0.5 },
  status: { color: colors.clay, fontSize: 12, textTransform: "capitalize" },
  date: { color: colors.muted, fontSize: 12, marginTop: 2, marginBottom: 8 },
  item: { color: colors.inkSoft, fontSize: 13, marginTop: 2 },
  total: { color: colors.ink, fontWeight: "600", marginTop: 10 },
});
