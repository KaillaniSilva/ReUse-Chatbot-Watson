/**
 * ItemDetailScreen.tsx
 * Tela de detalhes de um item do marketplace.
 *
 * UI/UX mobile aplicados:
 *  - Header com imagem full-width e botão de voltar flutuante
 *  - Botão de favoritar com feedback animado
 *  - Seção de informações expandida
 *  - Botões de ação fixos no rodapé (Falar com vendedor / Compartilhar)
 *  - Adiciona ao histórico de recentemente vistos via AsyncStorage
 */

import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Share,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeIn,
  FadeInUp,
  SlideInUp,
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withTiming,
  withSpring,
} from "react-native-reanimated";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { MOCK_ITEMS } from "../data/mockData";
import {
  toggleFavorite,
  isFavorite,
  addRecentlyViewed,
} from "../services/storage";
import { SpringPressable } from "../components/AnimatedComponents";

type Props = NativeStackScreenProps<RootStackParamList, "ItemDetail">;

export function ItemDetailScreen({ route, navigation }: Props) {
  const { itemId } = route.params;
  const insets = useSafeAreaInsets();
  const item = MOCK_ITEMS.find((i) => i.id === itemId) ?? MOCK_ITEMS[0];

  const [fav, setFav] = useState(false);
  const heartScale = useSharedValue(1);
  const heartAnimStyle = useAnimatedStyle(() => ({
    transform: [{ scale: heartScale.value }],
  }));

  const TYPE_CONFIG = {
    doação: { color: "#16A34A", bg: "#DCFCE7", label: "Doação Gratuita" },
    venda:  { color: "#2563EB", bg: "#DBEAFE", label: "À Venda" },
    troca:  { color: "#7C3AED", bg: "#EDE9FE", label: "Para Troca" },
  };
  const typeConf = TYPE_CONFIG[item.type];

  const COND_CONFIG: Record<string, { color: string; bg: string }> = {
    Novo:       { color: "#16A34A", bg: "#DCFCE7" },
    Excelente:  { color: "#0D9488", bg: "#CCFBF1" },
    Bom:        { color: "#2563EB", bg: "#DBEAFE" },
    Razoável:   { color: "#D97706", bg: "#FEF3C7" },
  };
  const condConf = COND_CONFIG[item.condition] ?? COND_CONFIG["Bom"];

  useEffect(() => {
    loadFavState();
    addRecentlyViewed(item.id);
  }, []);

  async function loadFavState() {
    const isFav = await isFavorite(item.id);
    setFav(isFav);
  }

  async function handleToggleFav() {
    heartScale.value = withSequence(
      withTiming(1.4, { duration: 150 }),
      withSpring(1, { damping: 10, stiffness: 300 })
    );
    const newState = await toggleFavorite(item.id);
    setFav(newState);
  }

  async function handleShare() {
    await Share.share({
      message: `Vi esse item no ReUse: ${item.title} — ${item.type === "doação" ? "Doação gratuita!" : `R$ ${item.price}`}`,
    });
  }

  function handleContact() {
    (navigation as any).navigate("Chat", {
      conversationId: `new_${item.id}`,
      participantName: item.userName,
      participantAvatar: item.userAvatar,
      itemTitle: item.title,
    });
  }

  return (
    <View style={styles.container}>
      <StatusBar style="light" />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={{ paddingBottom: 120 + insets.bottom }}
        showsVerticalScrollIndicator={false}
      >
        {/* Imagem / Hero */}
        <View style={[styles.heroWrap, { backgroundColor: item.bgColor }]}>
          <Animated.Text entering={FadeIn.duration(500)} style={styles.heroEmoji}>
            {item.emoji}
          </Animated.Text>

          {/* Overlay de volta flutuante */}
          <TouchableOpacity
            style={[styles.backBtn, { top: 16 + insets.top }]}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backBtnIcon}>←</Text>
          </TouchableOpacity>

          {/* Botão de favoritar flutuante */}
          <TouchableOpacity
            style={[styles.favBtn, { top: 16 + insets.top }]}
            onPress={handleToggleFav}
          >
            <Animated.Text style={[{ fontSize: 22 }, heartAnimStyle]}>
              {fav ? "❤️" : "🤍"}
            </Animated.Text>
          </TouchableOpacity>

          {/* Badges sobrepostos */}
          <View style={styles.heroOverlay}>
            <View style={[styles.typeBadge, { backgroundColor: typeConf.bg }]}>
              <Text style={[styles.typeBadgeText, { color: typeConf.color }]}>
                {typeConf.label}
              </Text>
            </View>
            {item.isFeatured && (
              <View style={styles.featuredBadge}>
                <Text style={styles.featuredBadgeText}>⭐ Destaque</Text>
              </View>
            )}
          </View>
        </View>

        {/* Conteúdo */}
        <Animated.View entering={FadeInUp.delay(150).duration(500)} style={styles.content}>

          {/* Título e preço */}
          <View style={styles.titleRow}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.price}>
              {item.type === "doação" ? "Grátis" : `R$ ${item.price.toLocaleString("pt-BR")}`}
            </Text>
          </View>

          {/* Badges de condição e visualizações */}
          <View style={styles.badgesRow}>
            <View style={[styles.condBadge, { backgroundColor: condConf.bg }]}>
              <Text style={[styles.condBadgeText, { color: condConf.color }]}>
                Estado: {item.condition}
              </Text>
            </View>
            <Text style={styles.viewsText}>👁️ {item.views} visualizações</Text>
            <Text style={styles.timeText}>🕐 {item.createdAt}</Text>
          </View>

          {/* Localização */}
          <View style={styles.locationCard}>
            <Text style={styles.locationIcon}>📍</Text>
            <View>
              <Text style={styles.locationTitle}>Localização</Text>
              <Text style={styles.locationText}>{item.location}</Text>
            </View>
          </View>

          {/* Descrição */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <Text style={styles.description}>{item.description}</Text>
          </View>

          {/* Anunciante */}
          <Animated.View
            entering={FadeInUp.delay(300).duration(500)}
            style={styles.sellerCard}
          >
            <Text style={styles.sectionTitle}>Anunciante</Text>
            <View style={styles.sellerRow}>
              <View style={styles.sellerAvatar}>
                <Text style={{ fontSize: 28 }}>{item.userAvatar}</Text>
              </View>
              <View style={styles.sellerInfo}>
                <Text style={styles.sellerName}>{item.userName}</Text>
                <View style={styles.sellerStars}>
                  {[1, 2, 3, 4, 5].map((i) => (
                    <Text key={i} style={{ fontSize: 12 }}>⭐</Text>
                  ))}
                  <Text style={styles.sellerRating}> 5.0</Text>
                </View>
                <Text style={styles.sellerMember}>Membro desde 2024</Text>
              </View>
              <View style={styles.sellerBadge}>
                <Text style={styles.sellerBadgeText}>✓ Verificado</Text>
              </View>
            </View>
          </Animated.View>

          {/* Segurança */}
          <View style={styles.safetyCard}>
            <Text style={styles.safetyIcon}>🛡️</Text>
            <Text style={styles.safetyText}>
              Sempre combine a entrega em locais públicos e movimentados. O ReUse não se
              responsabiliza por transações realizadas fora da plataforma.
            </Text>
          </View>
        </Animated.View>
      </ScrollView>

      {/* Footer fixo com botões de ação */}
      <Animated.View
        entering={SlideInUp.delay(400).duration(500)}
        style={[styles.footer, { paddingBottom: 16 + insets.bottom }]}
      >
        <TouchableOpacity style={styles.shareBtn} onPress={handleShare}>
          <Text style={{ fontSize: 20 }}>↗️</Text>
        </TouchableOpacity>
        <SpringPressable
          onPress={handleContact}
          style={styles.contactBtn}
        >
          <Text style={styles.contactBtnText}>
            {item.type === "doação" ? "💬 Quero receber" : "💬 Falar com vendedor"}
          </Text>
        </SpringPressable>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAF9" },
  scroll: { flex: 1 },

  // Hero
  heroWrap: {
    height: 260,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },
  heroEmoji: { fontSize: 100 },
  backBtn: {
    position: "absolute",
    left: 16,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnIcon: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  favBtn: {
    position: "absolute",
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "rgba(255,255,255,0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  heroOverlay: {
    position: "absolute",
    bottom: 12,
    left: 16,
    flexDirection: "row",
    gap: 8,
  },
  typeBadge: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 99,
  },
  typeBadgeText: { fontSize: 12, fontWeight: "700" },
  featuredBadge: {
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  featuredBadgeText: { fontSize: 12, fontWeight: "600", color: "#92400E" },

  // Content
  content: {
    backgroundColor: "#FFFFFF",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -20,
    padding: 24,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 4,
  },
  titleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 12,
    gap: 12,
  },
  title: { fontSize: 22, fontWeight: "800", color: "#0F172A", flex: 1, lineHeight: 30 },
  price: { fontSize: 22, fontWeight: "800", color: "#0D5C3D" },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
    alignItems: "center",
  },
  condBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 99 },
  condBadgeText: { fontSize: 12, fontWeight: "600" },
  viewsText: { fontSize: 12, color: "#64748B" },
  timeText: { fontSize: 12, color: "#64748B" },
  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#F8FAF9",
    borderRadius: 14,
    padding: 14,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  locationIcon: { fontSize: 24 },
  locationTitle: { fontSize: 11, color: "#64748B", marginBottom: 2 },
  locationText: { fontSize: 14, fontWeight: "600", color: "#0F172A" },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: "#0F172A", marginBottom: 10 },
  description: { fontSize: 15, color: "#475569", lineHeight: 24 },
  sellerCard: {
    backgroundColor: "#F8FAF9",
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sellerRow: { flexDirection: "row", alignItems: "center", gap: 14 },
  sellerAvatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#E8F5F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#0D5C3D",
  },
  sellerInfo: { flex: 1 },
  sellerName: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 3 },
  sellerStars: { flexDirection: "row", alignItems: "center", marginBottom: 2 },
  sellerRating: { fontSize: 12, color: "#64748B" },
  sellerMember: { fontSize: 12, color: "#94A3B8" },
  sellerBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
  },
  sellerBadgeText: { fontSize: 11, fontWeight: "600", color: "#16A34A" },
  safetyCard: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#FFF7ED",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#FDE68A",
    alignItems: "flex-start",
  },
  safetyIcon: { fontSize: 20, marginTop: 2 },
  safetyText: { flex: 1, fontSize: 12, color: "#92400E", lineHeight: 18 },

  // Footer
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
    paddingHorizontal: 20,
    paddingTop: 16,
    flexDirection: "row",
    gap: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 8,
  },
  shareBtn: {
    width: 50,
    height: 50,
    borderRadius: 14,
    backgroundColor: "#F8FAF9",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    alignItems: "center",
    justifyContent: "center",
  },
  contactBtn: {
    flex: 1,
    backgroundColor: "#0D5C3D",
    borderRadius: 14,
    height: 50,
    alignItems: "center",
    justifyContent: "center",
  },
  contactBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
