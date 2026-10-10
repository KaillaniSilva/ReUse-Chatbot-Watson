/**
 * FavoritesScreen.tsx
 * Tela de itens favoritados / salvos pelo usuário.
 *
 * AsyncStorage utilizado:
 *  - getFavorites()      → lista de IDs favoritados
 *  - toggleFavorite()    → remove favorito ao deslizar ou pressionar o ícone
 *
 * UI/UX mobile aplicados:
 *  - useFocusEffect para recarregar quando a tela ganha foco
 *  - Estado vazio ilustrado com CTA para o marketplace
 *  - Swipe-to-remove visual (botão de desfavoritar por card)
 *  - Animação de entrada escalonada para os cards
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  Alert,
  ListRenderItem,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Animated, {
  FadeInDown,
  FadeInUp,
  SlideInRight,
} from "react-native-reanimated";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { MOCK_ITEMS, type MarketItem } from "../data/mockData";
import { getFavorites, toggleFavorite } from "../services/storage";
import { SpringPressable } from "../components/AnimatedComponents";
import { cardShadow } from "../theme/shadows";

type Props = NativeStackScreenProps<RootStackParamList, "Favorites">;

export function FavoritesScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  async function loadFavorites() {
    const ids = await getFavorites();
    setFavoriteIds(ids);
  }

  useFocusEffect(
    useCallback(() => {
      loadFavorites();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFavorites();
    setRefreshing(false);
  }, []);

  async function handleUnfavorite(itemId: string, itemTitle: string) {
    Alert.alert(
      "Remover dos favoritos",
      `Deseja remover "${itemTitle}" da sua lista de favoritos?`,
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Remover",
          style: "destructive",
          onPress: async () => {
            await toggleFavorite(itemId);
            setFavoriteIds((prev) => prev.filter((id) => id !== itemId));
          },
        },
      ]
    );
  }

  // Filtra itens do mock que estão na lista de favoritos
  const favoriteItems = MOCK_ITEMS.filter((item) => favoriteIds.includes(item.id));

  const TYPE_COLORS: Record<string, string> = {
    doação: "#16A34A",
    venda: "#2563EB",
    troca: "#7C3AED",
  };
  const TYPE_BG: Record<string, string> = {
    doação: "#DCFCE7",
    venda: "#DBEAFE",
    troca: "#EDE9FE",
  };

  const renderItem: ListRenderItem<MarketItem> = ({ item, index }) => (
    <Animated.View
      entering={SlideInRight.delay(index * 60).duration(400)}
      style={[styles.card, cardShadow]}
    >
      {/* Imagem / preview */}
      <View style={[styles.cardImageWrap, { backgroundColor: item.bgColor }]}>
        <Text style={styles.cardEmoji}>{item.emoji}</Text>
      </View>

      {/* Info */}
      <View style={styles.cardInfo}>
        <View style={[styles.typePill, { backgroundColor: TYPE_BG[item.type] }]}>
          <Text style={[styles.typePillText, { color: TYPE_COLORS[item.type] }]}>
            {item.type}
          </Text>
        </View>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.cardLocation} numberOfLines={1}>📍 {item.location}</Text>
        <Text style={styles.cardPrice}>
          {item.type === "doação" ? "Grátis" : `R$ ${item.price.toLocaleString("pt-BR")}`}
        </Text>
      </View>

      {/* Ações */}
      <View style={styles.cardActions}>
        <TouchableOpacity
          style={styles.unfavBtn}
          onPress={() => handleUnfavorite(item.id, item.title)}
        >
          <Text style={{ fontSize: 20 }}>❤️</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.viewBtn}
          onPress={() => navigation.navigate("ItemDetail", { itemId: item.id })}
        >
          <Text style={styles.viewBtnText}>Ver →</Text>
        </TouchableOpacity>
      </View>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Favoritos</Text>
          <Text style={styles.headerCount}>
            {favoriteItems.length > 0 ? `${favoriteItems.length} itens salvos` : ""}
          </Text>
        </View>
        <View style={{ width: 40 }} />
      </Animated.View>

      {favoriteItems.length === 0 ? (
        // Estado vazio
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🤍</Text>
          <Text style={styles.emptyTitle}>Nenhum favorito ainda</Text>
          <Text style={styles.emptySub}>
            Ao navegar pelo marketplace, toque no coração ❤️ para salvar itens que você gostou.
          </Text>
          <SpringPressable
            style={styles.emptyBtn}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.emptyBtnText}>Explorar marketplace</Text>
          </SpringPressable>
        </Animated.View>
      ) : (
        <FlatList
          data={favoriteItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0D5C3D"
            />
          }
          ListHeaderComponent={
            <Animated.Text
              entering={FadeInDown.delay(100).duration(400)}
              style={styles.listHeader}
            >
              Seus itens salvos ficam aqui até que você os remova ou sejam finalizados.
            </Animated.Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAF9" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F8FAF9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  backBtnText: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  headerCenter: { flex: 1, alignItems: "center" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  headerCount: { fontSize: 12, color: "#64748B", marginTop: 1 },
  listContent: { padding: 20, paddingBottom: 32 },
  listHeader: {
    fontSize: 13,
    color: "#64748B",
    lineHeight: 18,
    marginBottom: 16,
    textAlign: "center",
  },

  // Card
  card: {
    flexDirection: "row",
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  cardImageWrap: {
    width: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  cardEmoji: { fontSize: 40 },
  cardInfo: { flex: 1, padding: 12, gap: 4 },
  typePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
  },
  typePillText: { fontSize: 10, fontWeight: "700" },
  cardTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A", lineHeight: 18 },
  cardLocation: { fontSize: 11, color: "#94A3B8" },
  cardPrice: { fontSize: 15, fontWeight: "800", color: "#0D5C3D" },
  cardActions: { paddingVertical: 12, paddingHorizontal: 10, justifyContent: "space-between", alignItems: "center" },
  unfavBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#FFF5F5",
    alignItems: "center",
    justifyContent: "center",
  },
  viewBtn: {
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  viewBtnText: { fontSize: 12, fontWeight: "700", color: "#0D5C3D" },

  // Empty state
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyEmoji: { fontSize: 64, marginBottom: 20 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A", marginBottom: 10 },
  emptySub: {
    fontSize: 14,
    color: "#64748B",
    textAlign: "center",
    lineHeight: 21,
    marginBottom: 32,
  },
  emptyBtn: {
    backgroundColor: "#0D5C3D",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 32,
  },
  emptyBtnText: { fontSize: 15, fontWeight: "700", color: "#FFFFFF" },
});
