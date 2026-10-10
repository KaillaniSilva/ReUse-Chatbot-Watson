import React from "react";
import { View, Text, StyleSheet } from "react-native";

type LogoVariant = "dark" | "light";

/**
 * Logo do ReUse. "light" = fundo branco (header); "dark" = fundo verde.
 */
export function Logo({ variant = "light" }: { variant?: LogoVariant }) {
  const isLight = variant === "light";
  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.seal,
          isLight ? styles.sealLight : styles.sealDark,
        ]}
      >
        <Text style={[styles.letter, isLight ? styles.letterLight : styles.letterDark]}>
          R
        </Text>
      </View>
      <Text style={[styles.word, isLight ? styles.wordLight : styles.wordDark]}>
        ReUse
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  seal: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  sealLight: {
    backgroundColor: "#E8F5F0",
    borderWidth: 1.5,
    borderColor: "#0D5C3D",
  },
  sealDark: {
    backgroundColor: "rgba(255,255,255,0.25)",
    borderWidth: 1.5,
    borderColor: "rgba(255,255,255,0.5)",
  },
  letter: {
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: -0.5,
  },
  letterLight: { color: "#0D5C3D" },
  letterDark: { color: "#FFFFFF" },
  word: {
    fontSize: 20,
    fontWeight: "700",
    letterSpacing: 0.5,
  },
  wordLight: { color: "#0D5C3D" },
  wordDark: { color: "#FFFFFF" },
});
