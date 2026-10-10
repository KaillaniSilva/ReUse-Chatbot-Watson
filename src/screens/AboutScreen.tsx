import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ViewStyle,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInLeft,
} from "react-native-reanimated";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { cardShadow, cardShadowLg } from "../theme/shadows";
import { SpringPressable } from "../components/AnimatedComponents";

type Props = NativeStackScreenProps<RootStackParamList, "About">;

const CONTENT_WIDTH_PERCENT = "80%";
const SECTION_GAP = 40;
const SCREEN_BOTTOM = 56;

function SectionTitle({ children }: { children: string }) {
  return <Text style={styles.sectionTitle}>{children}</Text>;
}

function Card({ children, style }: { children: React.ReactNode; style?: ViewStyle }) {
  return <View style={[styles.card, cardShadow, style]}>{children}</View>;
}

export function AboutScreen({ navigation }: Props) {
  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.contentWrap}>

          {/* Hero */}
          <Animated.View
            entering={FadeInDown.duration(600)}
            style={[styles.hero, cardShadowLg]}
          >
            <Text style={styles.heroTitle}>Sobre o ReUse</Text>
            <Text style={styles.heroSub}>
              Conheça a missão, o impacto e os próximos passos da nossa plataforma.
            </Text>
          </Animated.View>

          {/* Nossa missão */}
          <Animated.View entering={FadeInUp.delay(100).duration(500)} style={styles.block}>
            <SectionTitle>Nossa missão</SectionTitle>
            <Card>
              <Text style={styles.body}>
                Reduzir o desperdício e o impacto ambiental promovendo a
                reutilização de produtos em bom estado. Queremos ser a ponte entre
                quem tem itens para doar ou vender e quem busca consumo mais
                consciente e acessível.
              </Text>
              <View style={styles.highlight}>
                <Text style={styles.highlightText}>
                  Em uma frase: dar nova vida ao que já existe, em vez de
                  produzir e descartar sem necessidade.
                </Text>
              </View>
            </Card>
          </Animated.View>

          {/* Como funciona */}
          <Animated.View entering={FadeInUp.delay(180).duration(500)} style={styles.block}>
            <SectionTitle>Como o ReUse funciona</SectionTitle>
            <Card>
              <Text style={styles.body}>
                O ReUse é uma plataforma onde você pode anunciar itens que não usa
                mais ou buscar itens de segunda mão. Tudo em um só lugar, com
                foco em simplicidade e confiança entre os usuários.
              </Text>
              <Text style={styles.listLabel}>O que você poderá fazer em breve:</Text>
              <View style={styles.bulletList}>
                {[
                  "Criar listagens com foto, descrição e condição do item",
                  "Buscar por categoria (roupas, móveis, eletrônicos, etc.)",
                  "Filtrar por localização para facilitar entrega ou retirada",
                  "Combinar encontros de forma segura e transparente",
                  "Avaliar trocas e doações para construir reputação na comunidade",
                ].map((item, i) => (
                  <Animated.View
                    key={i}
                    entering={SlideInLeft.delay(250 + i * 80).duration(400)}
                    style={styles.bulletRow}
                  >
                    <View style={styles.bullet} />
                    <Text style={styles.bulletText}>{item}</Text>
                  </Animated.View>
                ))}
              </View>
            </Card>
          </Animated.View>

          {/* Impacto */}
          <Animated.View entering={FadeInUp.delay(260).duration(500)} style={styles.block}>
            <SectionTitle>Impacto que buscamos</SectionTitle>
            <View style={[styles.impactCard, cardShadow]}>
              <Text style={styles.body}>
                Menos produtos novos fabricados, menos lixo, mais vida útil para
                cada objeto. Cada item reutilizado é um passo em direção a um
                consumo mais sustentável e a um planeta mais saudável.
              </Text>
              <Text style={styles.listLabel}>Exemplos de impacto:</Text>
              <View style={styles.bulletList}>
                {[
                  "Reutilizar 1 kg de roupa evita em média o uso de milhares de litros de água que seriam usados na produção de peças novas.",
                  "Eletrônicos reutilizados reduzem a extração de minerais e o lixo eletrônico, um dos que mais cresce no mundo.",
                  "Móveis e objetos em bom estado evitam que mais recursos virem descarte em aterros.",
                ].map((text, i) => (
                  <Animated.View
                    key={i}
                    entering={SlideInLeft.delay(360 + i * 80).duration(400)}
                    style={styles.bulletRow}
                  >
                    <View style={styles.bullet} />
                    <Text style={styles.bulletText}>{text}</Text>
                  </Animated.View>
                ))}
              </View>
            </View>
          </Animated.View>

          {/* Visão */}
          <Animated.View entering={FadeInUp.delay(340).duration(500)} style={styles.block}>
            <SectionTitle>Visão e próximos passos</SectionTitle>
            <Card>
              <Text style={styles.body}>
                Queremos que o ReUse se torne a referência em reutilização e
                consumo consciente no Brasil: um lugar onde doar, vender e buscar
                itens usados seja simples, seguro e gratificante.
              </Text>
              <Text style={[styles.body, { marginTop: 12 }]}>
                Nesta primeira fase, estamos focados na apresentação da proposta
                e na base do aplicativo. Nas próximas etapas, vamos implementar
                listagens, busca, perfis de usuário e formas de combinar entrega
                ou retirada.
              </Text>
            </Card>
          </Animated.View>

          {/* Voltar */}
          <Animated.View entering={FadeInUp.delay(420).duration(500)} style={styles.ctaBlock}>
            <SpringPressable
              onPress={() => navigation.goBack()}
              style={[styles.backButton, cardShadow]}
              accessibilityRole="button"
              accessibilityLabel="Voltar"
            >
              <Text style={styles.backButtonText}>← Voltar</Text>
            </SpringPressable>
          </Animated.View>

        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#FFFFFF" },
  scroll: { flex: 1 },
  scrollContent: { paddingVertical: 32, paddingBottom: SCREEN_BOTTOM, alignItems: "center" },
  contentWrap: { width: CONTENT_WIDTH_PERCENT, alignSelf: "center" },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#0F172A",
    marginBottom: 16,
    letterSpacing: -0.3,
  },
  hero: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    paddingVertical: 32,
    paddingHorizontal: 28,
    alignItems: "center",
  },
  heroTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#0D5C3D",
    letterSpacing: -0.5,
  },
  heroSub: {
    fontSize: 15,
    color: "#64748B",
    marginTop: 10,
    textAlign: "center",
    lineHeight: 22,
    maxWidth: 300,
  },
  block: { marginTop: SECTION_GAP },
  card: { backgroundColor: "#FFFFFF", borderRadius: 20, padding: 24, overflow: "hidden" },
  body: { fontSize: 15, lineHeight: 24, color: "#475569" },
  highlight: {
    backgroundColor: "#E8F5F0",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 18,
    marginTop: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#0D5C3D",
  },
  highlightText: { fontSize: 14, fontWeight: "600", color: "#0D5C3D", lineHeight: 20 },
  listLabel: { fontSize: 15, fontWeight: "600", color: "#0F172A", marginTop: 16, marginBottom: 8 },
  bulletList: { gap: 8 },
  bulletRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  bullet: { width: 6, height: 6, borderRadius: 3, backgroundColor: "#0D5C3D" },
  bulletText: { flex: 1, fontSize: 14, color: "#64748B", lineHeight: 20 },
  impactCard: {
    backgroundColor: "#E8F5F0",
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
    borderColor: "#D1E7DD",
  },
  ctaBlock: { alignItems: "center", marginTop: 48 },
  backButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 18,
    paddingHorizontal: 40,
    borderRadius: 16,
    minWidth: 180,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#0D5C3D",
  },
  backButtonText: { fontSize: 16, fontWeight: "700", color: "#0D5C3D" },
});
