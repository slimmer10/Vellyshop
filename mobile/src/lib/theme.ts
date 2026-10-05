import { Platform } from "react-native";

/** Same palette as the website. */
export const colors = {
  paper: "#faf7f3",
  paperRaised: "#ffffff",
  ink: "#1f1a16",
  inkSoft: "#4b423b",
  muted: "#7b7169",
  line: "#e7ded4",
  clay: "#9c3d2e",
  clayDeep: "#7d2f22",
  gold: "#b98a4b",
};

export const displayFont = Platform.select({
  ios: "Georgia",
  default: "serif",
});
