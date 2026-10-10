/**
 * GamificationScreen.tsx
 * Tela principal do sistema de gamificação do ReUse.
 *
 * Mecânicas implementadas:
 *  - Sistema de XP (ReUse Points - RP)
 *  - Níveis progressivos com nomes temáticos (Semente → Floresta)
 *  - Badges de conquistas (desbloqueadas / bloqueadas)
 *  - Desafios diários com streak tracker
 *  - Ranking semanal da comunidade
 */

import React, { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  useWindowDimensions,
  TouchableOpacity,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInLeft,
} from "react-native-reanimated";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { cardShadow } from "../theme/shadows";
import {
  AnimatedProgressBar,
  PulseView,
  FloatView,
  SpringPressable,
  ScaleBounceKeyframe,
  LevelUpKeyframe,
  SlideInRightKeyframe,
} from "../components/AnimatedComponents";

type Props = NativeStackScreenProps<RootStackParamList, "Gamification">;

// ─── Dados mock do usuário ─────────────────────────────────────────────────────
const MOCK_USER = {
  name: "Lucas",
  avatarEmoji: "🌱",
  level: 3,
  levelName: "Muda",
  levelEmoji: "🌿",
  currentXP: 2350,
  nextLevelXP: 3500,
  totalRP: 2350,
  streak: 7,
  itemsListed: 12,
  tradesCompleted: 4,
  donationsGiven: 2,
};

// ─── Sistema de Níveis ────────────────────────────────────────────────────────
const LEVELS = [
  { level: 1, name: "Semente",  emoji: "🌱", minXP: 0,    maxXP: 500,  color: "#A8D5A2" },
  { level: 2, name: "Broto",    emoji: "🪴", minXP: 500,  maxXP: 1500, color: "#52B788" },
  { level: 3, name: "Muda",     emoji: "🌿", minXP: 1500, maxXP: 3500, color: "#2D6A4F" },
  { level: 4, name: "Árvore",   emoji: "🌳", minXP: 3500, maxXP: 7000, color: "#1B4332" },
  { level: 5, name: "Floresta", emoji: "🌲", minXP: 7000, maxXP: 9999, color: "#081C15" },
];

// ─── Badges / Conquistas ───────────────────────────────────────────────────────
const BADGES = [
  {
    id: "pioneer",
    emoji: "🌱",
    title: "Pioneiro",
    desc: "Cadastrou o 1º item",
    unlocked: true,
    rarity: "comum",
  },
  {
    id: "negotiator",
    emoji: "🔄",
    title: "Negociador",
    desc: "10 trocas realizadas",
    unlocked: false,
    rarity: "raro",
    progress: 4,
    total: 10,
  },
  {
    id: "guardian",
    emoji: "💚",
    title: "Guardião Verde",
    desc: "5 doações realizadas",
    unlocked: false,
    rarity: "raro",
    progress: 2,
    total: 5,
  },
  {
    id: "influencer",
    emoji: "👥",
    title: "Influenciador",
    desc: "5 amigos indicados",
    unlocked: false,
    rarity: "épico",
    progress: 1,
    total: 5,
  },
  {
    id: "ecohero",
    emoji: "♻️",
    title: "Eco-Herói",
    desc: "100 itens salvos",
    unlocked: false,
    rarity: "lendário",
    progress: 12,
    total: 100,
  },
  {
    id: "fivestar",
    emoji: "⭐",
    title: "Cinco Estrelas",
    desc: "20 avaliações 5★",
    unlocked: true,
    rarity: "comum",
  },
  {
    id: "dedicated",
    emoji: "🔥",
    title: "Dedicado",
    desc: "30 dias consecutivos",
    unlocked: false,
    rarity: "épico",
    progress: 7,
    total: 30,
  },
  {
    id: "topreuser",
    emoji: "🏆",
    title: "Top ReUser",
    desc: "Entrar no Top 10",
    unlocked: false,
    rarity: "lendário",
    progress: 0,
    total: 1,
  },
];

// ─── Desafios Diários ──────────────────────────────────────────────────────────
const DAILY_CHALLENGES = [
  { id: 1, emoji: "🔓", title: "Fazer login hoje",     xp: 10,  done: true },
  { id: 2, emoji: "👀", title: "Ver 5 anúncios",        xp: 20,  done: true },
  { id: 3, emoji: "📤", title: "Compartilhar um item", xp: 15,  done: false },
];

// ─── Ranking Semanal ──────────────────────────────────────────────────────────
const RANKING = [
  { pos: 1, name: "Ana C.",    xp: 4820, emoji: "🌳", badge: "🥇" },
  { pos: 2, name: "João P.",   xp: 3640, emoji: "🌳", badge: "🥈" },
  { pos: 3, name: "Maria L.",  xp: 3210, emoji: "🌿", badge: "🥉" },
  { pos: 4, name: "Carlos M.", xp: 2890, emoji: "🌿", badge: "4º" },
  { pos: 5, name: "Lucas",     xp: 2350, emoji: "🌿", badge: "5º", isMe: true },
];

const RARITY_COLORS: Record<string, string> = {
  comum:    "#52B788",
  raro:     "#2196F3",
  épico:    "#9C27B0",
  lendário: "#FF8C00",
};

// ─── Componentes internos ──────────────────────────────────────────────────────

function BadgeCard({ badge, index }: { badge: typeof BADGES[number]; index: number }) {
  const rarityColor = RARITY_COLORS[badge.rarity];
  const progress = "progress" in badge && "total" in badge
    ? (badge.progress as number) / (badge.total as number)
    : badge.unlocked ? 1 : 0;

  return (
    <Animated.View
      entering={badge.unlocked
        ? LevelUpKeyframe.delay(index * 80).duration(500)
        : ScaleBounceKeyframe.delay(index * 80).duration(400)
      }
      style={[
        styles.badgeCard,
        badge.unlocked ? { borderColor: rarityColor, borderWidth: 2 } : styles.badgeLocked,
      ]}
    >
      {badge.unlocked ? (
        <PulseView intensity={1.06}>
          <View style={[styles.badgeEmojiBg, { backgroundColor: rarityColor + "22" }]}>
            <Text style={styles.badgeEmoji}>{badge.emoji}</Text>
          </View>
        </PulseView>
      ) : (
        <View style={[styles.badgeEmojiBg, styles.badgeLockedBg]}>
          <Text style={[styles.badgeEmoji, { opacity: 0.4 }]}>{badge.emoji}</Text>
        </View>
      )}
      <Text
        style={[styles.badgeTitle, badge.unlocked ? { color: "#0F172A" } : { color: "#94A3B8" }]}
        numberOfLines={1}
      >
        {badge.title}
      </Text>
      <Text style={styles.badgeDesc} numberOfLines={2}>
        {badge.desc}
      </Text>
      <View style={[styles.rarityPill, { backgroundColor: rarityColor + "22" }]}>
        <Text style={[styles.rarityText, { color: rarityColor }]}>{badge.rarity}</Text>
      </View>
      {"progress" in badge && !badge.unlocked && (
        <AnimatedProgressBar
          progress={progress}
          color={rarityColor}
          trackColor="#E5E7EB"
          height={4}
          style={{ marginTop: 8 }}
        />
      )}
    </Animated.View>
  );
}

function RankRow({ item, index }: { item: typeof RANKING[number]; index: number }) {
  return (
    <Animated.View
      entering={SlideInRightKeyframe.delay(index * 100).duration(450)}
      style={[styles.rankRow, "isMe" in item && item.isMe && styles.rankRowMe]}
    >
      <Text style={styles.rankBadge}>{item.badge}</Text>
      <View style={styles.rankEmojiBg}>
        <Text style={{ fontSize: 18 }}>{item.emoji}</Text>
      </View>
      <Text style={[styles.rankName, "isMe" in item && item.isMe && styles.rankNameMe]}>
        {"isMe" in item && item.isMe ? "Você" : item.name}
      </Text>
      <View style={{ flex: 1 }} />
      <Text style={styles.rankXP}>{item.xp.toLocaleString("pt-BR")} RP</Text>
    </Animated.View>
  );
}

// ─── Tela principal ─────────────────────────────────────────────────────────
export function GamificationScreen({ navigation }: Props) {
  const { width } = useWindowDimensions();
  const isNarrow = width < 600;
  const [dailyChallenges, setDailyChallenges] = useState(DAILY_CHALLENGES);

  const currentLevel = LEVELS.find((l) => l.level === MOCK_USER.level) ?? LEVELS[0];
  const xpProgress =
    (MOCK_USER.currentXP - currentLevel.minXP) /
    (MOCK_USER.nextLevelXP - currentLevel.minXP);

  const completedChallenges = dailyChallenges.filter((c) => c.done).length;
  const challengeXP = dailyChallenges.filter((c) => c.done).reduce((s, c) => s + c.xp, 0);

  function toggleChallenge(id: number) {
    setDailyChallenges((prev) =>
      prev.map((c) => (c.id === id ? { ...c, done: !c.done } : c))
    );
  }

  return (
    <View style={styles.container}>
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Perfil / Header ────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.profileCard}>
          <FloatView amplitude={6} style={styles.avatarWrap}>
            <View style={[styles.avatarCircle, { backgroundColor: currentLevel.color }]}>
              <Text style={styles.avatarEmoji}>{currentLevel.emoji}</Text>
            </View>
            <View style={styles.levelBadgeWrap}>
              <Text style={styles.levelBadgeText}>{MOCK_USER.level}</Text>
            </View>
          </FloatView>

          <Text style={styles.profileName}>Olá, {MOCK_USER.name}!</Text>
          <View style={styles.levelRow}>
            <Text style={styles.levelChip}>
              {currentLevel.emoji} Nível {MOCK_USER.level}: {currentLevel.name}
            </Text>
          </View>

          <View style={styles.xpSection}>
            <AnimatedProgressBar
              progress={xpProgress}
              color={currentLevel.color}
              height={12}
              style={{ marginBottom: 6 }}
            />
            <View style={styles.xpLabels}>
              <Text style={styles.xpCurrent}>
                {MOCK_USER.currentXP.toLocaleString("pt-BR")} RP
              </Text>
              <Text style={styles.xpNext}>
                Meta: {MOCK_USER.nextLevelXP.toLocaleString("pt-BR")} RP
              </Text>
            </View>
          </View>
        </Animated.View>

        {/* ── Stats Row ──────────────────────────────────────── */}
        <Animated.View entering={FadeInUp.delay(150).duration(500)} style={styles.statsRow}>
          {[
            { label: "Itens anunciados", value: MOCK_USER.itemsListed, emoji: "📦" },
            { label: "Trocas",           value: MOCK_USER.tradesCompleted, emoji: "🔄" },
            { label: "Streak",           value: `${MOCK_USER.streak}d`, emoji: "🔥" },
          ].map((stat, i) => (
            <View key={i} style={[styles.statCard, cardShadow]}>
              <Text style={styles.statEmoji}>{stat.emoji}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </View>
          ))}
        </Animated.View>

        {/* ── Desafios Diários ───────────────────────────────── */}
        <Animated.View entering={FadeInUp.delay(250).duration(500)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Desafios Diários</Text>
            <View style={styles.streakPill}>
              <Text style={styles.streakText}>🔥 {MOCK_USER.streak} dias</Text>
            </View>
          </View>
          <View style={styles.challengeProgress}>
            <AnimatedProgressBar
              progress={completedChallenges / dailyChallenges.length}
              color="#F59E0B"
              trackColor="#FEF3C7"
              height={6}
            />
            <Text style={styles.challengeProgressLabel}>
              {completedChallenges}/{dailyChallenges.length} completos · +{challengeXP} RP hoje
            </Text>
          </View>

          {dailyChallenges.map((ch, i) => (
            <Animated.View
              key={ch.id}
              entering={FadeInUp.delay(300 + i * 80).duration(400)}
              style={[styles.challengeRow, cardShadow, ch.done && styles.challengeDone]}
            >
              <TouchableOpacity
                style={styles.challengeCheckbox}
                onPress={() => toggleChallenge(ch.id)}
                accessibilityRole="checkbox"
              >
                <Text style={{ fontSize: 18 }}>{ch.done ? "✅" : "⬜"}</Text>
              </TouchableOpacity>
              <Text style={styles.challengeEmoji}>{ch.emoji}</Text>
              <Text style={[styles.challengeTitle, ch.done && styles.challengeTitleDone]}>
                {ch.title}
              </Text>
              <View style={{ flex: 1 }} />
              <Text style={styles.challengeXP}>+{ch.xp} RP</Text>
            </Animated.View>
          ))}
        </Animated.View>

        {/* ── Conquistas ────────────────────────────────────── */}
        <Animated.View entering={FadeInUp.delay(400).duration(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Conquistas</Text>
          <Text style={styles.sectionSub}>
            {BADGES.filter((b) => b.unlocked).length}/{BADGES.length} desbloqueadas
          </Text>
          <View style={[styles.badgeGrid, isNarrow && styles.badgeGridNarrow]}>
            {BADGES.map((badge, i) => (
              <BadgeCard key={badge.id} badge={badge} index={i} />
            ))}
          </View>
        </Animated.View>

        {/* ── Ranking Semanal ───────────────────────────────── */}
        <Animated.View entering={FadeInUp.delay(500).duration(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Ranking Semanal</Text>
          <Text style={styles.sectionSub}>Você está em 5º lugar esta semana!</Text>
          <View style={[styles.rankingCard, cardShadow]}>
            {RANKING.map((item, i) => (
              <RankRow key={item.pos} item={item} index={i} />
            ))}
          </View>
        </Animated.View>

        {/* ── Tabela de pontos ──────────────────────────────── */}
        <Animated.View entering={FadeInUp.delay(600).duration(500)} style={styles.section}>
          <Text style={styles.sectionTitle}>Como ganhar RP</Text>
          <View style={[styles.rpTable, cardShadow]}>
            {[
              { action: "Login diário",           xp: "+10 RP",  emoji: "📅" },
              { action: "Cadastrar um item",       xp: "+50 RP",  emoji: "📦" },
              { action: "Completar uma troca",     xp: "+200 RP", emoji: "🔄" },
              { action: "Completar uma doação",    xp: "+300 RP", emoji: "💚" },
              { action: "Receber avaliação 5★",    xp: "+100 RP", emoji: "⭐" },
              { action: "Completar perfil",        xp: "+80 RP",  emoji: "👤" },
              { action: "Convidar um amigo",       xp: "+150 RP", emoji: "👥" },
            ].map((row, i) => (
              <Animated.View
                key={i}
                entering={SlideInLeft.delay(600 + i * 60).duration(400)}
                style={[styles.rpRow, i % 2 === 0 && styles.rpRowAlt]}
              >
                <Text style={styles.rpEmoji}>{row.emoji}</Text>
                <Text style={styles.rpAction}>{row.action}</Text>
                <Text style={styles.rpXP}>{row.xp}</Text>
              </Animated.View>
            ))}
          </View>
        </Animated.View>

        {/* ── Botão voltar ──────────────────────────────────── */}
        <View style={styles.bottomActions}>
          <SpringPressable onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Voltar ao início</Text>
          </SpringPressable>
        </View>
      </ScrollView>
    </View>
  );
}

// ─── Estilos ──────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAF9" },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: 60, paddingTop: 24 },

  // Profile card
  profileCard: {
    marginHorizontal: 20,
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    padding: 28,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0EDE0",
    ...cardShadow,
  },
  avatarWrap: { position: "relative", marginBottom: 16 },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarEmoji: { fontSize: 40 },
  levelBadgeWrap: {
    position: "absolute",
    bottom: -4,
    right: -4,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: "#0D5C3D",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  levelBadgeText: { fontSize: 12, fontWeight: "800", color: "#FFFFFF" },
  profileName: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  levelRow: { marginTop: 6, marginBottom: 20 },
  levelChip: {
    fontSize: 14,
    fontWeight: "600",
    color: "#2D6A4F",
    backgroundColor: "#E8F5F0",
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 99,
  },
  xpSection: { width: "100%", gap: 4 },
  xpLabels: { flexDirection: "row", justifyContent: "space-between" },
  xpCurrent: { fontSize: 13, fontWeight: "700", color: "#0D5C3D" },
  xpNext: { fontSize: 12, color: "#94A3B8" },

  // Stats
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0EDE0",
  },
  statEmoji: { fontSize: 22, marginBottom: 4 },
  statValue: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  statLabel: { fontSize: 11, color: "#64748B", marginTop: 2, textAlign: "center" },

  // Sections
  section: { marginHorizontal: 20, marginTop: 28 },
  sectionHeader: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  sectionTitle: { fontSize: 20, fontWeight: "700", color: "#0F172A", letterSpacing: -0.3, marginBottom: 4 },
  sectionSub: { fontSize: 13, color: "#64748B", marginBottom: 14 },
  streakPill: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  streakText: { fontSize: 13, fontWeight: "600", color: "#B45309" },

  // Daily challenges
  challengeProgress: { marginBottom: 12, gap: 6 },
  challengeProgressLabel: { fontSize: 12, color: "#64748B", marginTop: 4 },
  challengeRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    gap: 10,
  },
  challengeDone: {
    backgroundColor: "#F0FDF4",
    borderColor: "#BBF7D0",
  },
  challengeCheckbox: { padding: 4 },
  challengeEmoji: { fontSize: 18 },
  challengeTitle: { fontSize: 14, fontWeight: "500", color: "#0F172A", flex: 1 },
  challengeTitleDone: { textDecorationLine: "line-through", color: "#94A3B8" },
  challengeXP: { fontSize: 13, fontWeight: "700", color: "#0D5C3D" },

  // Badges
  badgeGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 4,
  },
  badgeGridNarrow: {},
  badgeCard: {
    width: "47%",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  badgeLocked: { borderColor: "#E5E7EB", backgroundColor: "#F8FAFC" },
  badgeEmojiBg: {
    width: 48,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 10,
  },
  badgeLockedBg: { backgroundColor: "#F1F5F9" },
  badgeEmoji: { fontSize: 28 },
  badgeTitle: { fontSize: 14, fontWeight: "700", marginBottom: 2 },
  badgeDesc: { fontSize: 12, color: "#64748B", lineHeight: 16, marginBottom: 6 },
  rarityPill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  rarityText: { fontSize: 11, fontWeight: "600", textTransform: "capitalize" },

  // Ranking
  rankingCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E0EDE0",
  },
  rankRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 12,
  },
  rankRowMe: { backgroundColor: "#F0FDF4" },
  rankBadge: { fontSize: 20, width: 28, textAlign: "center" },
  rankEmojiBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#E8F5F0",
    alignItems: "center",
    justifyContent: "center",
  },
  rankName: { fontSize: 15, fontWeight: "500", color: "#0F172A" },
  rankNameMe: { fontWeight: "700", color: "#0D5C3D" },
  rankXP: { fontSize: 14, fontWeight: "700", color: "#0D5C3D" },

  // RP Table
  rpTable: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E0EDE0",
  },
  rpRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 13,
    gap: 12,
  },
  rpRowAlt: { backgroundColor: "#F8FAF9" },
  rpEmoji: { fontSize: 18, width: 28, textAlign: "center" },
  rpAction: { flex: 1, fontSize: 14, color: "#0F172A" },
  rpXP: { fontSize: 14, fontWeight: "700", color: "#0D5C3D" },

  // Bottom
  bottomActions: { marginHorizontal: 20, marginTop: 32 },
  backButton: {
    backgroundColor: "#FFFFFF",
    borderWidth: 2,
    borderColor: "#0D5C3D",
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: "center",
  },
  backButtonText: { fontSize: 16, fontWeight: "700", color: "#0D5C3D" },
});
