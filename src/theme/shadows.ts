import { Platform, ViewStyle } from "react-native";

/**
 * Sombra suave para cards (iOS + Android + Web).
 */
export const cardShadow: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#0D5C3D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
  },
  android: {
    elevation: 4,
  },
  default: {},
});

/**
 * Sombra mais forte para hero ou CTAs.
 */
export const cardShadowLg: ViewStyle = Platform.select({
  ios: {
    shadowColor: "#0D5C3D",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
  },
  android: {
    elevation: 8,
  },
  default: {},
});
