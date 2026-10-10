import React from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ViewStyle,
  useWindowDimensions,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
  SlideInLeft,
} from "react-native-reanimated";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { cardShadow } from "../theme/shadows";
import { SpringPressable, AnimatedProgressBar, PulseView } from "../components/AnimatedComponents";

type Props = NativeStackScreenProps<RootStackParamList, "About">;

const CONTENT_WIDTH_PERCENT = "80%";
const SECTION_GAP = 48;
const CARD_GAP = 20;

// Dados mock do usuário logado (aparece na ribbon de gamificação)
const MOCK_USER_LEVEL = { level: 3, name: "Muda", emoji: "🌿", xp: 2350, nextXP: 3500, streak: 7 };

function SectionTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {subtitle ? <Text style={styles.sectionSubtitle}>{subtitle}</Text> : null}
    </View>
  );
}

function FeatureCard({
  icon,
  title,
  description,
  style,
  delay = 0,
}: {
  icon: string;
  title: string;
  description: string;
  style?: ViewStyle;
  delay?: number;
}) {
  return (
    <Animated.View
      entering={ZoomIn.delay(delay).duration(380).springify().damping(14)}
      style={[styles.featureCard, style]}
    >
      <View style={[styles.featureCardInner, cardShadow]}>
        <View style={styles.featureCardIcon}>
          <Text style={styles.featureCardEmoji}>{icon}</Text>
        </View>
        <Text style={styles.featureCardTitle}>{title}</Text>
        <Text style={styles.featureCardDesc}>{description}</Text>
      </View>
    </Animated.View>
  );
}

export function HomeScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isNarrow = width < 600;
  const xpProgress =
    (MOCK_USER_LEVEL.xp - 1500) / (MOCK_USER_LEVEL.nextXP - 1500);

  return (
    <View style={styles.container}>
      <StatusBar style="light" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Banner hero ─────────────────────────────────────────── */}
        <Animated.View
          entering={FadeInDown.duration(700)}
          style={styles.banner}
        >
          <View style={styles.bannerInner}>
            <Animated.Text
              entering={FadeInDown.delay(100).duration(600)}
              style={styles.bannerTitle}
            >
              Economia sustentável{"\n"}e consumo consciente
            </Animated.Text>
            <Animated.Text
              entering={FadeInDown.delay(200).duration(600)}
              style={styles.bannerSub}
            >
              Conectamos quem quer dar nova vida a itens usados e quem busca
              qualidade sem comprar novo.
            </Animated.Text>
            <Animated.View entering={FadeInDown.delay(350).duration(500)}>
              <SpringPressable
                onPress={() => navigation.navigate("About")}
                style={styles.bannerButton}
                accessibilityRole="button"
                accessibilityLabel="Saber mais"
              >
                <Text style={styles.bannerButtonText}>Saber mais</Text>
              </SpringPressable>
            </Animated.View>
          </View>
        </Animated.View>

        {/* ── Ribbon de Gamificação ────────────────────────────────── */}
        <Animated.View
          entering={FadeInUp.delay(300).duration(550)}
          style={styles.gamificationRibbon}
        >
          <View style={styles.ribbonLeft}>
            <PulseView intensity={1.10}>
              <View style={styles.ribbonAvatar}>
                <Text style={{ fontSize: 22 }}>{MOCK_USER_LEVEL.emoji}</Text>
              </View>
            </PulseView>
            <View>
              <Text style={styles.ribbonLevel}>
                Nível {MOCK_USER_LEVEL.level}: {MOCK_USER_LEVEL.name}
              </Text>
              <AnimatedProgressBar
                progress={xpProgress}
                color="#0D5C3D"
                trackColor="#E0EDE0"
                height={6}
                style={{ width: 120, marginTop: 4 }}
              />
              <Text style={styles.ribbonXP}>
                {MOCK_USER_LEVEL.xp.toLocaleString("pt-BR")} / {MOCK_USER_LEVEL.nextXP.toLocaleString("pt-BR")} RP
              </Text>
            </View>
          </View>
          <View style={styles.ribbonRight}>
            <View style={styles.streakBadge}>
              <Text style={styles.streakEmoji}>🔥</Text>
              <Text style={styles.streakCount}>{MOCK_USER_LEVEL.streak}</Text>
            </View>
            <SpringPressable
              onPress={() => navigation.navigate("Gamification")}
              style={styles.ribbonCTA}
              accessibilityRole="button"
            >
              <Text style={styles.ribbonCTAText}>Ver perfil →</Text>
            </SpringPressable>
          </View>
        </Animated.View>

        {/* ── Conteúdo central ────────────────────────────────────── */}
        <View style={styles.contentWrap}>

          {/* O problema */}
          <Animated.View
            entering={FadeInUp.delay(100).duration(550)}
            style={styles.section}
          >
            <SectionTitle title="O problema que enfrentamos" />
            <View style={[styles.card, cardShadow]}>
              <Text style={styles.body}>
                O consumo excessivo e o descarte precoce geram impacto ambiental
                e social. No Brasil, milhões de toneladas de roupas, móveis e
                eletrônicos vão para o lixo todos os anos, enquanto muitas
                pessoas poderiam reutilizá-los.
              </Text>
              <View style={styles.highlight}>
                <Text style={styles.highlightText}>
                  Exemplo: só de resíduos têxteis, são descartadas mais de 170 mil
                  toneladas por ano. A maior parte poderia ser reutilizada ou
                  reciclada.
                </Text>
              </View>
            </View>
          </Animated.View>

          {/* O que reutilizar */}
          <Animated.View
            entering={FadeInUp.delay(150).duration(550)}
            style={styles.section}
          >
            <SectionTitle
              title="O que você pode reutilizar no ReUse"
              subtitle="Dê nova vida ao que já existe."
            />
            <View style={[styles.cardGrid, isNarrow && styles.cardGridNarrow]}>
              {[
                { icon: "👕", title: "Roupas e calçados",             desc: "Camisetas, casacos, sapatos em bom estado para doar ou vender." },
                { icon: "🛋️", title: "Móveis e decoração",            desc: "Sofás, mesas, cadeiras, quadros e itens de decoração." },
                { icon: "📱", title: "Eletrônicos e eletrodomésticos", desc: "Celulares, notebooks, geladeiras, micro-ondas que ainda funcionam." },
                { icon: "📚", title: "Livros, brinquedos e outros",   desc: "Livros, jogos, brinquedos, utensílios de cozinha e muito mais." },
              ].map((item, i) => (
                <FeatureCard
                  key={item.title}
                  icon={item.icon}
                  title={item.title}
                  description={item.desc}
                  style={isNarrow ? styles.featureCardFull : undefined}
                  delay={i * 80}
                />
              ))}
            </View>
          </Animated.View>

          {/* Por que usar */}
          <Animated.View
            entering={FadeInUp.delay(200).duration(550)}
            style={styles.section}
          >
            <SectionTitle
              title="O que você ganha com o ReUse"
              subtitle="Uma mudança que vai além da economia."
            />
            <View style={[styles.cardGrid, isNarrow && styles.cardGridNarrow]}>
              {[
                { icon: "🌱", title: "Menos impacto no planeta",  desc: "Cada item reutilizado significa menos produção nova, menos lixo e menos uso de recursos naturais." },
                { icon: "💰", title: "Economia real",              desc: "Quem doa ou vende ganha espaço e dá destino útil; quem busca encontra itens de qualidade por um preço acessível." },
                { icon: "🤝", title: "Comunidade consciente",      desc: "Faça parte de uma rede de pessoas que valorizam o consumo responsável e a vida útil dos produtos." },
              ].map((item, i) => (
                <FeatureCard
                  key={item.title}
                  icon={item.icon}
                  title={item.title}
                  description={item.desc}
                  style={isNarrow ? styles.featureCardFull : undefined}
                  delay={i * 80}
                />
              ))}
            </View>
          </Animated.View>

          {/* Como funciona */}
          <Animated.View
            entering={FadeInUp.delay(250).duration(550)}
            style={styles.section}
          >
            <SectionTitle title="Como funciona em 3 passos" />
            <View style={[styles.card, cardShadow]}>
              {[
                { step: "1", title: "Anuncie ou busque",  text: "Cadastre itens que você não usa mais ou pesquise o que precisa." },
                { step: "2", title: "Conecte-se",         text: "Combine com outra pessoa da plataforma de forma segura e transparente." },
                { step: "3", title: "Reutilize",          text: "Doação, venda ou troca: o item ganha nova vida e você faz a diferença." },
              ].map((item, i) => (
                <Animated.View
                  key={item.step}
                  entering={SlideInLeft.delay(300 + i * 100).duration(450)}
                  style={styles.stepRow}
                >
                  <View style={styles.stepNumber}>
                    <Text style={styles.stepNumberText}>{item.step}</Text>
                  </View>
                  <View style={styles.stepContent}>
                    <Text style={styles.stepTitle}>{item.title}</Text>
                    <Text style={styles.stepText}>{item.text}</Text>
                  </View>
                </Animated.View>
              ))}
            </View>
          </Animated.View>

          {/* CTA final */}
          <Animated.View
            entering={FadeInUp.delay(350).duration(550)}
            style={styles.ctaBlock}
          >
            <SpringPressable
              onPress={() => navigation.navigate("About")}
              style={[styles.ctaButton, cardShadow]}
              accessibilityRole="button"
              accessibilityLabel="Saber mais sobre o projeto"
            >
              <Text style={styles.ctaTitle}>Saber mais sobre o projeto</Text>
              <Text style={styles.ctaSub}>Missão, impacto e próximos passos</Text>
            </SpringPressable>

            <SpringPressable
              onPress={() => navigation.navigate("Gamification")}
              style={[styles.gamifButton, cardShadow]}
              accessibilityRole="button"
              accessibilityLabel="Ver minhas conquistas"
            >
              <Text style={styles.gamifButtonEmoji}>🏆</Text>
              <View>
                <Text style={styles.gamifButtonTitle}>Minhas Conquistas</Text>
                <Text style={styles.gamifButtonSub}>Ver XP, badges e ranking</Text>
              </View>
              <Text style={styles.gamifButtonArrow}>→</Text>
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
  scrollContent: { paddingBottom: 56, alignItems: "center" },
  contentWrap: {
    width: CONTENT_WIDTH_PERCENT,
    alignSelf: "center",
    marginTop: SECTION_GAP,
  },

  // Banner
  banner: {
    width: "100%",
    backgroundColor: "#0D5C3D",
    paddingVertical: 44,
    paddingHorizontal: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  bannerInner: { alignItems: "center", maxWidth: 560 },
  bannerTitle: {
    fontSize: 28,
    fontWeight: "800",
    color: "#FFFFFF",
    letterSpacing: -0.4,
    marginBottom: 14,
    textAlign: "center",
    lineHeight: 36,
  },
  bannerSub: {
    fontSize: 16,
    color: "rgba(255,255,255,0.92)",
    lineHeight: 25,
    marginBottom: 28,
    textAlign: "center",
  },
  bannerButton: {
    backgroundColor: "#FFFFFF",
    paddingVertical: 14,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignSelf: "center",
  },
  bannerButtonText: { fontSize: 16, fontWeight: "700", color: "#0D5C3D" },

  // Gamification ribbon
  gamificationRibbon: {
    width: "100%",
    backgroundColor: "#F0FDF4",
    borderBottomWidth: 1,
    borderBottomColor: "#D1FAE5",
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  ribbonLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  ribbonAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#DCFCE7",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0D5C3D",
  },
  ribbonLevel: { fontSize: 13, fontWeight: "700", color: "#0D5C3D" },
  ribbonXP: { fontSize: 11, color: "#64748B", marginTop: 2 },
  ribbonRight: { flexDirection: "row", alignItems: "center", gap: 10 },
  streakBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 99,
    gap: 2,
  },
  streakEmoji: { fontSize: 14 },
  streakCount: { fontSize: 13, fontWeight: "700", color: "#B45309" },
  ribbonCTA: {
    backgroundColor: "#0D5C3D",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  ribbonCTAText: { fontSize: 13, fontWeight: "600", color: "#FFFFFF" },

  // Sections
  section: { marginTop: SECTION_GAP },
  sectionHeader: { marginBottom: 20 },
  sectionTitle: { fontSize: 22, fontWeight: "700", color: "#0F172A", letterSpacing: -0.3 },
  sectionSubtitle: { fontSize: 15, color: "#64748B", marginTop: 6, lineHeight: 22 },

  // Cards
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  body: { fontSize: 15, lineHeight: 24, color: "#475569", marginBottom: 16 },
  highlight: {
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderLeftWidth: 4,
    borderLeftColor: "#0D5C3D",
  },
  highlightText: { fontSize: 14, fontWeight: "600", color: "#0D5C3D", lineHeight: 20 },
  cardGrid: { flexDirection: "row", flexWrap: "wrap", marginHorizontal: -CARD_GAP / 2 },
  cardGridNarrow: {},
  featureCard: { width: "50%", padding: CARD_GAP / 2, minWidth: 0 },
  featureCardFull: { width: "100%" },
  featureCardInner: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  featureCardIcon: {
    width: 52,
    height: 52,
    borderRadius: 12,
    backgroundColor: "#E8F5F0",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
  },
  featureCardEmoji: { fontSize: 28 },
  featureCardTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 8 },
  featureCardDesc: { fontSize: 14, color: "#64748B", lineHeight: 20 },

  // Steps
  stepRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 16,
    marginBottom: 20,
  },
  stepNumber: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#0D5C3D",
    alignItems: "center",
    justifyContent: "center",
  },
  stepNumberText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  stepContent: { flex: 1 },
  stepTitle: { fontSize: 16, fontWeight: "600", color: "#0F172A" },
  stepText: { fontSize: 14, color: "#64748B", marginTop: 2, lineHeight: 20 },

  // CTA
  ctaBlock: { alignItems: "center", marginTop: 56, gap: 16, width: "100%" },
  ctaButton: {
    backgroundColor: "#0D5C3D",
    paddingVertical: 20,
    paddingHorizontal: 32,
    borderRadius: 16,
    alignItems: "center",
    width: "100%",
  },
  ctaTitle: { fontSize: 17, fontWeight: "700", color: "#FFFFFF" },
  ctaSub: { fontSize: 13, color: "rgba(255,255,255,0.85)", marginTop: 4 },

  gamifButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#0D5C3D",
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    width: "100%",
  },
  gamifButtonEmoji: { fontSize: 28 },
  gamifButtonTitle: { fontSize: 16, fontWeight: "700", color: "#0D5C3D" },
  gamifButtonSub: { fontSize: 13, color: "#64748B", marginTop: 2 },
  gamifButtonArrow: { marginLeft: "auto", fontSize: 18, color: "#0D5C3D", fontWeight: "700" },
});
