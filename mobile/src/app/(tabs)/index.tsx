import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { Image } from "expo-image";
import { Link } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { supabase } from "@/lib/supabase";
import { formatNaira } from "@/lib/money";
import { colors, displayFont } from "@/lib/theme";
import type { Product } from "@/lib/types";

export default function Shop() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [category, setCategory] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const load = useCallback(
    () =>
      supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: true })
        .then(({ data, error: failure }) => {
          if (failure) setError(failure.message);
          else {
            setError(null);
            setProducts(data as Product[]);
          }
        }),
    [],
  );

  useEffect(() => {
    void load();
  }, [load]);

  const categories = useMemo(
    () => [...new Set((products ?? []).map((p) => p.category))],
    [products],
  );
  const visible = useMemo(
    () => (products ?? []).filter((p) => !category || p.category === category),
    [products, category],
  );

  return (
    <SafeAreaView style={styles.screen} edges={["top"]}>
      <FlatList
        data={visible}
        keyExtractor={(p) => p.id}
        numColumns={2}
        columnWrapperStyle={styles.row}
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
        ListHeaderComponent={
          <View>
            <Text style={styles.eyebrow}>LAGOS · CONSIDERED CLOTHING</Text>
            <Text style={styles.title}>Vellyshop</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.chips}
            >
              <Chip label="All" active={!category} onPress={() => setCategory(null)} />
              {categories.map((c) => (
                <Chip key={c} label={c} active={category === c} onPress={() => setCategory(c)} />
              ))}
            </ScrollView>
          </View>
        }
        ListEmptyComponent={
          error ? (
            <Text style={styles.note}>Could not load the shop: {error}</Text>
          ) : products ? (
            <Text style={styles.note}>Nothing in this collection yet.</Text>
          ) : (
            <ActivityIndicator color={colors.clay} style={{ marginTop: 40 }} />
          )
        }
        renderItem={({ item }) => (
          <Link href={{ pathname: "/product/[slug]", params: { slug: item.slug } }} asChild>
            <Pressable style={styles.card}>
              <Image source={item.image_url} alt={item.name} style={styles.image} contentFit="cover" transition={150} />
              <Text style={styles.name} numberOfLines={1}>
                {item.name}
              </Text>
              <Text style={styles.price}>
                {item.in_stock ? formatNaira(item.price_kobo) : "Sold out"}
              </Text>
            </Pressable>
          </Link>
        )}
      />
    </SafeAreaView>
  );
}

function Chip({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.chip, active && styles.chipActive]}>
      <Text style={[styles.chipText, active && { color: "#fff" }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.paper },
  list: { padding: 16, paddingBottom: 32 },
  row: { gap: 12 },
  eyebrow: { color: colors.clay, fontSize: 11, fontWeight: "700", letterSpacing: 2.4, marginTop: 8 },
  title: { fontFamily: displayFont, fontSize: 38, color: colors.ink, marginTop: 6, marginBottom: 14 },
  chips: { gap: 8, paddingBottom: 16 },
  chip: {
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paperRaised,
    borderRadius: 999,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  chipActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  chipText: { color: colors.inkSoft, fontSize: 13, fontWeight: "500" },
  card: { flex: 1, marginBottom: 20 },
  image: { width: "100%", aspectRatio: 3 / 4, backgroundColor: colors.line, borderRadius: 2 },
  name: { color: colors.ink, fontSize: 14, fontWeight: "500", marginTop: 8 },
  price: { color: colors.muted, fontSize: 13, marginTop: 2 },
  note: { color: colors.muted, textAlign: "center", marginTop: 40, paddingHorizontal: 24 },
});
