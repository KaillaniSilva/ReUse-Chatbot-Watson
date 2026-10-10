/**
 * OnboardingScreen.tsx
 * 3 slides de apresentação do ReUse exibidos na primeira abertura do app.
 * Após o último slide (ou "Pular"), marca o onboarding como concluído
 * via AsyncStorage e navega para o Login.
 */

import React, { useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  Dimensions,
  TouchableOpacity,
  ListRenderItem,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { markOnboardingDone } from "../services/storage";
import { SpringPressable } from "../components/AnimatedComponents";

const { width: SCREEN_W } = Dimensions.get("window");

type Props = NativeStackScreenProps<RootStackParamList, "Onboarding">;

type Slide = {
  id: string;
  emoji: string;
  title: string;
  subtitle: string;
  bg: string;
  accentColor: string;
};

const SLIDES: Slide[] = [
  {
    id: "1",
    emoji: "♻️",
    title: "Bem-vindo ao ReUse!",
    subtitle:
      "A plataforma que conecta quem quer dar nova vida a itens usados com quem busca qualidade por menos.",
    bg: "#0D5C3D",
    accentColor: "#86EFAC",
  },
  {
    id: "2",
    emoji: "📦",
    title: "Anuncie em segundos",
    subtitle:
      "Fotografe seu item, defina o preço ou marque como doação e publique. É simples, rápido e gratuito.",
    bg: "#1B4332",
    accentColor: "#6EE7B7",
  },
  {
    id: "3",
    emoji: "🌱",
    title: "Faça a diferença",
    subtitle:
      "Cada item reutilizado reduz o desperdício. Ganhe pontos, suba de nível e ajude o planeta a respirar melhor.",
    bg: "#052E16",
    accentColor: "#A7F3D0",
  },
];

function SlideItem({ item }: { item: Slide }) {
  return (
    <View style={[styles.slide, { backgroundColor: item.bg }]}>
      {/* Círculos decorativos */}
      <View style={[styles.decorCircle, styles.decorTop, { borderColor: item.accentColor + "30" }]} />
      <View style={[styles.decorCircle, styles.decorBottom, { borderColor: item.accentColor + "20" }]} />

      <Animated.View entering={FadeInDown.duration(600)} style={styles.emojiWrap}>
        <View style={[styles.emojiBg, { backgroundColor: item.accentColor + "20" }]}>
          <Text style={styles.emoji}>{item.emoji}</Text>
        </View>
      </Animated.View>

      <Animated.Text entering={FadeInDown.delay(150).duration(600)} style={styles.slideTitle}>
        {item.title}
      </Animated.Text>

      <Animated.Text entering={FadeInDown.delay(280).duration(600)} style={styles.slideSubtitle}>
        {item.subtitle}
      </Animated.Text>
    </View>
  );
}

export function OnboardingScreen({ navigation }: Props) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  async function finish() {
    await markOnboardingDone();
    navigation.replace("Login");
  }

  function goNext() {
    if (currentIndex < SLIDES.length - 1) {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
      setCurrentIndex((prev) => prev + 1);
    } else {
      finish();
    }
  }

  const renderSlide: ListRenderItem<Slide> = ({ item }) => <SlideItem item={item} />;

  const isLast = currentIndex === SLIDES.length - 1;
  const currentSlide = SLIDES[currentIndex];

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      {/* Skip */}
      {!isLast && (
        <TouchableOpacity style={styles.skipButton} onPress={finish}>
          <Text style={styles.skipText}>Pular</Text>
        </TouchableOpacity>
      )}

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        style={{ flex: 1 }}
      />

      {/* Footer */}
      <Animated.View
        entering={FadeInUp.delay(300).duration(500)}
        style={[styles.footer, { backgroundColor: currentSlide.bg }]}
      >
        {/* Indicadores de página */}
        <View style={styles.dotsRow}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex
                  ? [styles.dotActive, { backgroundColor: currentSlide.accentColor }]
                  : styles.dotInactive,
              ]}
            />
          ))}
        </View>

        {/* Botão de ação */}
        <SpringPressable
          onPress={goNext}
          style={[styles.actionButton, { backgroundColor: currentSlide.accentColor }]}
        >
          <Text style={[styles.actionButtonText, { color: currentSlide.bg }]}>
            {isLast ? "Começar agora!" : "Próximo →"}
          </Text>
        </SpringPressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0D5C3D" },
  slide: {
    width: SCREEN_W,
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
    paddingTop: 80,
    paddingBottom: 20,
  },
  decorCircle: {
    position: "absolute",
    width: 360,
    height: 360,
    borderRadius: 180,
    borderWidth: 1,
  },
  decorTop: { top: -120, right: -100 },
  decorBottom: { bottom: -120, left: -100 },
  emojiWrap: { marginBottom: 36 },
  emojiBg: {
    width: 120,
    height: 120,
    borderRadius: 36,
    alignItems: "center",
    justifyContent: "center",
  },
  emoji: { fontSize: 64 },
  slideTitle: {
    fontSize: 30,
    fontWeight: "800",
    color: "#FFFFFF",
    textAlign: "center",
    letterSpacing: -0.5,
    marginBottom: 18,
    lineHeight: 38,
  },
  slideSubtitle: {
    fontSize: 16,
    color: "rgba(255,255,255,0.80)",
    textAlign: "center",
    lineHeight: 26,
    maxWidth: 300,
  },
  skipButton: {
    position: "absolute",
    top: 52,
    right: 24,
    zIndex: 10,
    padding: 8,
  },
  skipText: { fontSize: 15, color: "rgba(255,255,255,0.65)", fontWeight: "500" },
  footer: {
    paddingHorizontal: 32,
    paddingBottom: 48,
    paddingTop: 20,
    alignItems: "center",
    gap: 24,
  },
  dotsRow: { flexDirection: "row", gap: 8 },
  dot: { height: 8, borderRadius: 4 },
  dotActive: { width: 28 },
  dotInactive: { width: 8, backgroundColor: "rgba(255,255,255,0.3)" },
  actionButton: {
    width: "100%",
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: "center",
  },
  actionButtonText: { fontSize: 17, fontWeight: "700" },
});
