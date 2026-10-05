import { Pressable, StyleSheet, Text, type StyleProp, type ViewStyle } from "react-native";
import { colors } from "@/lib/theme";

export function Button({
  label,
  onPress,
  disabled,
  variant = "solid",
  style,
}: {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: "solid" | "outline";
  style?: StyleProp<ViewStyle>;
}) {
  const solid = variant === "solid";
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        solid ? styles.solid : styles.outline,
        (pressed || disabled) && { opacity: disabled ? 0.5 : 0.85 },
        style,
      ]}
    >
      <Text style={[styles.label, { color: solid ? "#fff" : colors.ink }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 50,
    borderRadius: 3,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  solid: { backgroundColor: colors.ink },
  outline: { borderWidth: 1, borderColor: colors.ink },
  label: { fontSize: 15, fontWeight: "600", letterSpacing: 0.3 },
});
