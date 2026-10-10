/**
 * SplashScreen.tsx
 * Tela de abertura do ReUse — exibida por ~2s ao iniciar o app.
 * Verifica se o onboarding já foi concluído e redireciona para:
 *   - OnboardingScreen (primeira vez)
 *   - LoginScreen (usuário não logado)
 */

import React, { useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { StatusBar } from "expo-status-bar";
import Animated, {
  FadeIn,
  FadeOut,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
} from "react-native-reanimated";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { isOnboardingDone } from "../services/storage";
import { getSession } from "../services/auth";

type Props = NativeStackScreenProps<RootStackParamList, "Splash">;

export function SplashScreen({ navigation }: Props) {
  const logoScale = useSharedValue(0.5);
  const logoOpacity = useSharedValue(0);
  const taglineOpacity = useSharedValue(0);

  const logoAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: logoScale.value }],
    opacity: logoOpacity.value,
  }));

  const taglineAnimStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
  }));

  useEffect(() => {
    // Animação de entrada do logo
    logoOpacity.value = withTiming(1, { duration: 600 });
    logoScale.value = withTiming(1, {
      duration: 700,
      easing: Easing.out(Easing.back(2)),
    });
    taglineOpacity.value = withDelay(500, withTiming(1, { duration: 600 }));

    // Redirecionar após 2.2s — sessão ativa pula o login diretamente
    const timer = setTimeout(async () => {
      const session = await getSession();
      if (session) {
        navigation.replace("MainApp");
        return;
      }
      const done = await isOnboardingDone();
      navigation.replace(done ? "Login" : "Onboarding");
    }, 2200);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Círculos decorativos de fundo */}
      <View style={[styles.circle, styles.circleTopLeft]} />
      <View style={[styles.circle, styles.circleBottomRight]} />

      {/* Logo animado */}
      <Animated.View style={[styles.logoWrap, logoAnimStyle]}>
        <View style={styles.logoIconBg}>
          <Text style={styles.logoIcon}>♻️</Text>
        </View>
        <Text style={styles.logoText}>
          Re<Text style={styles.logoTextBold}>Use</Text>
          <Text style={styles.logoExcl}>!</Text>
        </Text>
      </Animated.View>

      {/* Tagline */}
      <Animated.Text style={[styles.tagline, taglineAnimStyle]}>
        Economia sustentável e consumo consciente
      </Animated.Text>

      {/* Loading dots */}
      <Animated.View
        entering={FadeIn.delay(900).duration(500)}
        style={styles.dotsRow}
      >
        {[0, 1, 2].map((i) => (
          <View key={i} style={[styles.dot, i === 0 && styles.dotActive]} />
        ))}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0D5C3D",
    alignItems: "center",
    justifyContent: "center",
  },
  circle: {
    position: "absolute",
    width: 300,
    height: 300,
    borderRadius: 150,
    backgroundColor: "rgba(255,255,255,0.05)",
  },
  circleTopLeft: { top: -80, left: -80 },
  circleBottomRight: { bottom: -80, right: -80 },
  logoWrap: { alignItems: "center", gap: 16 },
  logoIconBg: {
    width: 96,
    height: 96,
    borderRadius: 28,
    backgroundColor: "rgba(255,255,255,0.15)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "rgba(255,255,255,0.3)",
  },
  logoIcon: { fontSize: 52 },
  logoText: {
    fontSize: 42,
    fontWeight: "300",
    color: "#FFFFFF",
    letterSpacing: 1,
  },
  logoTextBold: { fontWeight: "800" },
  logoExcl: { color: "#86EFAC", fontWeight: "800" },
  tagline: {
    marginTop: 24,
    fontSize: 15,
    color: "rgba(255,255,255,0.75)",
    textAlign: "center",
    maxWidth: 260,
    lineHeight: 22,
  },
  dotsRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 60,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255,255,255,0.3)",
  },
  dotActive: { backgroundColor: "#86EFAC", width: 24 },
});
