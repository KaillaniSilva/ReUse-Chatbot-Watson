/**
 * ProfileScreen.tsx
 * Perfil do usuário logado no ReUse.
 *
 * AsyncStorage utilizado:
 *  - getUserProfile()    → carrega nome, bio, avatar, stats
 *  - getPostedItems()    → lista itens publicados pelo usuário
 *  - clearAllStorage()   → logout (limpa todos os dados)
 *
 * UI/UX mobile aplicados:
 *  - useFocusEffect para recarregar ao voltar de EditProfile
 *  - Avatar com foto real (via imageUri) ou emoji de nível
 *  - Tabs: Anúncios | Conquistas | Avaliações
 *  - Stats em cards animados
 *  - CTA de editar perfil com acesso à câmera
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  Alert,
  RefreshControl,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Animated, {
  FadeInDown,
  FadeInUp,
  ZoomIn,
} from "react-native-reanimated";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TabParamList, RootStackParamList } from "../navigation/types";
import {
  getUserProfile,
  getPostedItems,
  type UserProfile,
  type PostedItem,
} from "../services/storage";
import { AnimatedProgressBar, SpringPressable } from "../components/AnimatedComponents";
import { cardShadow } from "../theme/shadows";
import { useAuth } from "../contexts/AuthContext";
import { formatExpiresIn } from "../services/auth";

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Profile">,
  NativeStackScreenProps<RootStackParamList>
>;

const LEVELS = [
  { level: 1, name: "Semente",  emoji: "🌱", maxXP: 500 },
  { level: 2, name: "Broto",    emoji: "🪴", maxXP: 1500 },
  { level: 3, name: "Muda",     emoji: "🌿", maxXP: 3500 },
  { level: 4, name: "Árvore",   emoji: "🌳", maxXP: 7000 },
  { level: 5, name: "Floresta", emoji: "🌲", maxXP: 9999 },
];

type ProfileTab = "listings" | "achievements" | "ratings";

export function ProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const { session, logout } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [postedItems, setPostedItems] = useState<PostedItem[]>([]);
  const [activeTab, setActiveTab] = useState<ProfileTab>("listings");
  const [refreshing, setRefreshing] = useState(false);

  async function loadData() {
    const [p, items] = await Promise.all([getUserProfile(), getPostedItems()]);
    setProfile(p);
    setPostedItems(items);
  }

  // Recarrega sempre que a tela ganha foco (ex: ao voltar do EditProfile)
  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  }, []);

  function handleLogout() {
    Alert.alert("Encerrar sessão", "Deseja realmente sair da sua conta?", [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Sair",
        style: "destructive",
        onPress: async () => {
          await logout();
          (navigation as any).replace("Login");
        },
      },
    ]);
  }

  if (!profile) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.loadingWrap}>
          <Text style={{ fontSize: 32 }}>🌿</Text>
          <Text style={styles.loadingText}>Carregando perfil...</Text>
        </View>
      </View>
    );
  }

  const currentLevel = LEVELS.find((l) => l.level === profile.level) ?? LEVELS[0];
  const nextLevel = LEVELS.find((l) => l.level === profile.level + 1);
  const prevLevelMaxXP = LEVELS.find((l) => l.level === profile.level - 1)?.maxXP ?? 0;
  const xpProgress = nextLevel
    ? (profile.xp - prevLevelMaxXP) / (currentLevel.maxXP - prevLevelMaxXP)
    : 1;

  const firstName = profile.name.split(" ")[0] || "Usuário";

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D5C3D" />
        }
      >
        {/* ── Header / Perfil ─────────────────────────────────── */}
        <Animated.View entering={FadeInDown.duration(500)} style={styles.profileHeader}>
          {/* Botões de ação do header */}
          <View style={styles.headerActions}>
            <TouchableOpacity
              style={styles.headerActionBtn}
              onPress={() => (navigation as any).navigate("Settings")}
            >
              <Text style={{ fontSize: 20 }}>⚙️</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.headerActionBtn} onPress={handleLogout}>
              <Text style={{ fontSize: 20 }}>🚪</Text>
            </TouchableOpacity>
          </View>

          {/* Avatar */}
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={() => (navigation as any).navigate("EditProfile")}
          >
            {profile.avatarUri ? (
              <Image source={{ uri: profile.avatarUri }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatarPlaceholder]}>
                <Text style={{ fontSize: 48 }}>{currentLevel.emoji}</Text>
              </View>
            )}
            <View style={styles.editAvatarBadge}>
              <Text style={{ fontSize: 12 }}>📷</Text>
            </View>
          </TouchableOpacity>

          {/* Nome */}
          <Text style={styles.profileName}>{profile.name || "Meu Perfil"}</Text>
          {profile.city ? (
            <Text style={styles.profileCity}>📍 {profile.city}</Text>
          ) : null}
          {profile.bio ? (
            <Text style={styles.profileBio} numberOfLines={2}>{profile.bio}</Text>
          ) : null}

          {/* Level chip */}
          <View style={styles.levelChip}>
            <Text style={styles.levelChipEmoji}>{currentLevel.emoji}</Text>
            <Text style={styles.levelChipText}>
              Nível {profile.level}: {currentLevel.name}
            </Text>
          </View>

          {/* XP bar */}
          <View style={styles.xpSection}>
            <AnimatedProgressBar
              progress={xpProgress}
              color="#0D5C3D"
              height={10}
              style={{ marginBottom: 6 }}
            />
            <View style={styles.xpLabels}>
              <Text style={styles.xpCurrent}>{profile.xp.toLocaleString("pt-BR")} RP</Text>
              {nextLevel && (
                <Text style={styles.xpNext}>Meta: {currentLevel.maxXP.toLocaleString("pt-BR")} RP</Text>
              )}
            </View>
          </View>

          {/* Botão editar */}
          <SpringPressable
            style={styles.editBtn}
            onPress={() => (navigation as any).navigate("EditProfile")}
          >
            <Text style={styles.editBtnText}>✏️ Editar perfil</Text>
          </SpringPressable>
        </Animated.View>

        {/* ── Stats ──────────────────────────────────────────── */}
        <Animated.View entering={FadeInUp.delay(150).duration(500)} style={styles.statsRow}>
          {[
            { label: "Anúncios", value: profile.itemsListed, emoji: "📦" },
            { label: "Trocas",   value: profile.tradesCompleted, emoji: "🔄" },
            { label: "Doações",  value: profile.donationsGiven, emoji: "💚" },
            { label: "Streak",   value: `${profile.streak}d`, emoji: "🔥" },
          ].map((stat, i) => (
            <Animated.View
              key={stat.label}
              entering={ZoomIn.delay(200 + i * 60).duration(350).springify()}
              style={[styles.statCard, cardShadow]}
            >
              <Text style={styles.statEmoji}>{stat.emoji}</Text>
              <Text style={styles.statValue}>{stat.value}</Text>
              <Text style={styles.statLabel}>{stat.label}</Text>
            </Animated.View>
          ))}
        </Animated.View>

        {/* ── Acesso rápido ─────────────────────────────────── */}
        <Animated.View entering={FadeInUp.delay(250).duration(500)} style={styles.quickAccess}>
          {[
            { icon: "❤️", label: "Favoritos", screen: "Favorites" },
            { icon: "🏆", label: "Conquistas", screen: "Gamification" },
            { icon: "⭐", label: "Avaliações", screen: null },
          ].map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.quickCard}
              onPress={() => item.screen && (navigation as any).navigate(item.screen)}
            >
              <Text style={{ fontSize: 28 }}>{item.icon}</Text>
              <Text style={styles.quickLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </Animated.View>

        {/* ── Sessão ativa ──────────────────────────────────── */}
        {session && (
          <Animated.View entering={FadeInUp.delay(280).duration(500)} style={styles.sessionCard}>
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionTitle}>🔐 Sessão ativa</Text>
              <View style={styles.sessionBadge}>
                <Text style={styles.sessionBadgeText}>Autenticado</Text>
              </View>
            </View>
            <View style={styles.sessionRow}>
              <Text style={styles.sessionLabel}>Token</Text>
              <Text style={styles.sessionValue}>{session.token.slice(0, 16)}…</Text>
            </View>
            <View style={styles.sessionRow}>
              <Text style={styles.sessionLabel}>E-mail</Text>
              <Text style={styles.sessionValue}>{session.email}</Text>
            </View>
            <View style={styles.sessionRow}>
              <Text style={styles.sessionLabel}>Expira em</Text>
              <Text style={[styles.sessionValue, { color: "#0D5C3D", fontWeight: "700" }]}>
                {formatExpiresIn(session.expiresAt)}
              </Text>
            </View>
            <View style={styles.sessionRow}>
              <Text style={styles.sessionLabel}>Criada em</Text>
              <Text style={styles.sessionValue}>
                {new Date(session.createdAt).toLocaleDateString("pt-BR")}
              </Text>
            </View>
          </Animated.View>
        )}

        {/* ── Meus anúncios ─────────────────────────────────── */}
        <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Meus anúncios</Text>
            <Text style={styles.sectionCount}>{postedItems.length} publicados</Text>
          </View>

          {postedItems.length === 0 ? (
            <View style={styles.emptyListings}>
              <Text style={{ fontSize: 40, marginBottom: 12 }}>📦</Text>
              <Text style={styles.emptyTitle}>Nenhum anúncio ainda</Text>
              <Text style={styles.emptySub}>
                Publique seu primeiro item e comece a fazer parte da comunidade!
              </Text>
              <SpringPressable
                style={styles.emptyBtn}
                onPress={() => navigation.navigate("PostItem" as any)}
              >
                <Text style={styles.emptyBtnText}>+ Publicar item</Text>
              </SpringPressable>
            </View>
          ) : (
            postedItems.map((item, i) => (
              <Animated.View
                key={item.id}
                entering={FadeInUp.delay(i * 80).duration(400)}
                style={[
                  styles.listingCard,
                  cardShadow,
                  item.status === "paused" && { opacity: 0.6 },
                ]}
              >
                {item.imageUri ? (
                  <Image source={{ uri: item.imageUri }} style={styles.listingImage} />
                ) : (
                  <View style={styles.listingImagePlaceholder}>
                    <Text style={{ fontSize: 28 }}>📦</Text>
                  </View>
                )}
                <View style={styles.listingInfo}>
                  <Text style={styles.listingTitle} numberOfLines={1}>
                    {item.status === "paused" ? "⏸ " : ""}
                    {item.title}
                  </Text>
                  <Text style={styles.listingMeta}>
                    {item.category} · {item.condition}
                  </Text>
                  <View style={styles.listingFooter}>
                    <Text style={styles.listingPrice}>
                      {item.type === "doação" ? "Grátis" : `R$ ${item.price}`}
                    </Text>
                    <View
                      style={[
                        styles.listingTypePill,
                        item.type === "doação" && { backgroundColor: "#DCFCE7" },
                        item.type === "venda" && { backgroundColor: "#DBEAFE" },
                        item.type === "troca" && { backgroundColor: "#EDE9FE" },
                      ]}
                    >
                      <Text style={styles.listingTypeText}>{item.type}</Text>
                    </View>
                  </View>
                </View>
              </Animated.View>
            ))
          )}
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAF9" },
  scrollContent: { paddingBottom: 32 },
  loadingWrap: { flex: 1, alignItems: "center", justifyContent: "center", gap: 12 },
  loadingText: { fontSize: 16, color: "#64748B" },

  // Profile header
  profileHeader: {
    backgroundColor: "#FFFFFF",
    padding: 24,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerActions: {
    position: "absolute",
    top: 20,
    right: 20,
    flexDirection: "row",
    gap: 8,
  },
  headerActionBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F8FAF9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  avatarWrap: { position: "relative", marginBottom: 14 },
  avatarImage: {
    width: 88,
    height: 88,
    borderRadius: 44,
    borderWidth: 3,
    borderColor: "#0D5C3D",
  },
  avatarPlaceholder: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: "#E8F5F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#0D5C3D",
  },
  editAvatarBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#0D5C3D",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  profileName: { fontSize: 22, fontWeight: "800", color: "#0F172A", marginBottom: 4 },
  profileCity: { fontSize: 13, color: "#64748B", marginBottom: 6 },
  profileBio: { fontSize: 14, color: "#475569", textAlign: "center", maxWidth: 280, lineHeight: 20, marginBottom: 12 },
  levelChip: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 99,
    gap: 6,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  levelChipEmoji: { fontSize: 16 },
  levelChipText: { fontSize: 13, fontWeight: "700", color: "#0D5C3D" },
  xpSection: { width: "100%", marginBottom: 16 },
  xpLabels: { flexDirection: "row", justifyContent: "space-between" },
  xpCurrent: { fontSize: 12, fontWeight: "700", color: "#0D5C3D" },
  xpNext: { fontSize: 11, color: "#94A3B8" },
  editBtn: {
    borderWidth: 2,
    borderColor: "#0D5C3D",
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 24,
  },
  editBtnText: { fontSize: 14, fontWeight: "700", color: "#0D5C3D" },

  // Stats
  statsRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 16,
    gap: 10,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E0EDE0",
  },
  statEmoji: { fontSize: 20, marginBottom: 4 },
  statValue: { fontSize: 18, fontWeight: "800", color: "#0F172A" },
  statLabel: { fontSize: 10, color: "#64748B", textAlign: "center", marginTop: 2 },

  // Quick access
  quickAccess: {
    flexDirection: "row",
    marginHorizontal: 20,
    marginTop: 16,
    gap: 12,
  },
  quickCard: {
    flex: 1,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  quickLabel: { fontSize: 12, fontWeight: "600", color: "#374151" },

  // Sessão
  sessionCard: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#BBF7D0",
    gap: 10,
  },
  sessionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 4,
  },
  sessionTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  sessionBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: 99,
  },
  sessionBadgeText: { fontSize: 11, fontWeight: "700", color: "#16A34A" },
  sessionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 4,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  sessionLabel: { fontSize: 12, color: "#64748B", fontWeight: "500" },
  sessionValue: { fontSize: 12, color: "#0F172A", fontWeight: "600", maxWidth: "60%" },

  // Section
  section: { marginHorizontal: 20, marginTop: 24 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 14,
  },
  sectionTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  sectionCount: { fontSize: 13, color: "#64748B" },

  // Empty state
  emptyListings: {
    alignItems: "center",
    paddingVertical: 32,
    backgroundColor: "#FFFFFF",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
  },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 8 },
  emptySub: { fontSize: 13, color: "#64748B", textAlign: "center", maxWidth: 240, lineHeight: 18, marginBottom: 20 },
  emptyBtn: {
    backgroundColor: "#0D5C3D",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  emptyBtnText: { fontSize: 14, fontWeight: "700", color: "#FFFFFF" },

  // Listing card
  listingCard: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  listingImage: { width: 80, height: 80 },
  listingImagePlaceholder: {
    width: 80,
    height: 80,
    backgroundColor: "#F0FDF4",
    alignItems: "center",
    justifyContent: "center",
  },
  listingInfo: { flex: 1, padding: 12, justifyContent: "space-between" },
  listingTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  listingMeta: { fontSize: 12, color: "#64748B" },
  listingFooter: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  listingPrice: { fontSize: 15, fontWeight: "800", color: "#0D5C3D" },
  listingTypePill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  listingTypeText: { fontSize: 11, fontWeight: "600", color: "#374151" },
});
