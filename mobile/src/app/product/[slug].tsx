import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Image } from "expo-image";
import { Stack, router, useLocalSearchParams } from "expo-router";
import { supabase } from "@/lib/supabase";
import { useCart } from "@/lib/cart";
import { formatNaira } from "@/lib/money";
import { colors, displayFont } from "@/lib/theme";
import { Button } from "@/components/ui";
import type { Product } from "@/lib/types";

export default function ProductScreen() {
  const { slug } = useLocalSearchParams<{ slug: string }>();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null | undefined>(undefined);
  const [size, setSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [justAdded, setJustAdded] = useState(false);

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("slug", slug)
      .maybeSingle()
      .then(({ data }) => setProduct((data as Product | null) ?? null));
  }, [slug]);

  if (product === undefined) return <ActivityIndicator color={colors.clay} style={{ marginTop: 60 }} />;
  if (product === null) return <Text style={styles.missing}>We could not find that piece.</Text>;

  const needsSize = product.sizes.length > 0;
  const canAdd = product.in_stock && (!needsSize || size !== null);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Stack.Screen options={{ title: product.name }} />
      <Image source={product.image_url} alt={product.name} style={styles.image} contentFit="cover" />
      <Text style={styles.eyebrow}>{product.category.toUpperCase()}</Text>
      <Text style={styles.name}>{product.name}</Text>
      <Text style={styles.price}>{formatNaira(product.price_kobo)}</Text>
      <Text style={styles.tagline}>{product.tagline}</Text>
      <Text style={styles.description}>{product.description}</Text>

      {needsSize && (
        <View style={styles.block}>
          <Text style={styles.label}>Size</Text>
          <View style={styles.sizes}>
            {product.sizes.map((s) => (
              <Pressable
                key={s}
                onPress={() => setSize(s)}
                style={[styles.size, size === s && styles.sizeActive]}
              >
                <Text style={[styles.sizeText, size === s && { color: "#fff" }]}>{s}</Text>
              </Pressable>
            ))}
          </View>
        </View>
      )}

      <View style={styles.block}>
        <Text style={styles.label}>Quantity</Text>
        <View style={styles.stepper}>
          <Pressable style={styles.step} onPress={() => setQuantity((q) => Math.max(1, q - 1))}>
            <Text style={styles.stepText}>−</Text>
          </Pressable>
          <Text style={styles.qty}>{quantity}</Text>
          <Pressable style={styles.step} onPress={() => setQuantity((q) => Math.min(20, q + 1))}>
            <Text style={styles.stepText}>+</Text>
          </Pressable>
        </View>
      </View>

      <Button
        label={
          !product.in_stock
            ? "Sold out"
            : needsSize && !size
              ? "Choose a size"
              : justAdded
                ? "Added to cart ✓"
                : "Add to cart"
        }
        disabled={!canAdd}
        onPress={() => {
          add({
            productId: product.id,
            slug: product.slug,
            name: product.name,
            size,
            imageUrl: product.image_url,
            priceKobo: product.price_kobo,
            quantity,
          });
          setJustAdded(true);
          setTimeout(() => setJustAdded(false), 1800);
        }}
        style={{ marginTop: 24 }}
      />
      {justAdded && (
        <Button
          label="View cart"
          variant="outline"
          onPress={() => router.push("/cart")}
          style={{ marginTop: 10 }}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, paddingBottom: 40 },
  missing: { textAlign: "center", marginTop: 60, color: colors.muted },
  image: { width: "100%", aspectRatio: 4 / 5, backgroundColor: colors.line, borderRadius: 2 },
  eyebrow: { color: colors.clay, fontSize: 11, fontWeight: "700", letterSpacing: 2.2, marginTop: 18 },
  name: { fontFamily: displayFont, fontSize: 30, color: colors.ink, marginTop: 6 },
  price: { fontSize: 18, color: colors.ink, marginTop: 6, fontWeight: "500" },
  tagline: { color: colors.inkSoft, fontSize: 15, marginTop: 14, fontStyle: "italic" },
  description: { color: colors.inkSoft, fontSize: 14, lineHeight: 21, marginTop: 10 },
  block: { marginTop: 22 },
  label: { color: colors.muted, fontSize: 11, fontWeight: "700", letterSpacing: 1.8, textTransform: "uppercase", marginBottom: 10 },
  sizes: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  size: {
    minWidth: 48,
    paddingVertical: 11,
    paddingHorizontal: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.paperRaised,
    borderRadius: 3,
  },
  sizeActive: { backgroundColor: colors.ink, borderColor: colors.ink },
  sizeText: { color: colors.ink, fontSize: 14, fontWeight: "500" },
  stepper: { flexDirection: "row", alignItems: "center", alignSelf: "flex-start", borderWidth: 1, borderColor: colors.line, borderRadius: 3, backgroundColor: colors.paperRaised },
  step: { width: 46, height: 46, alignItems: "center", justifyContent: "center" },
  stepText: { fontSize: 20, color: colors.ink },
  qty: { minWidth: 36, textAlign: "center", fontSize: 15, color: colors.ink },
});
