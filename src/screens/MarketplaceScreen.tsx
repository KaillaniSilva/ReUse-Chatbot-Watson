/**
 * MarketplaceScreen.tsx
 * Feed principal do ReUse.
 *
 * Fase 3 — APIs integradas:
 *  - Random User API: carrega avatares reais dos vendedores (cache 24h)
 *  - Lorem Picsum:    imagens de placeholder para os itens no card
 *
 * Recursos anteriores mantidos:
 *  - Busca com debounce, chips de categoria, skeleton loading, pull to refresh
 */

import React, { useState, useCallback, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  RefreshControl,
  Pressable,
  Dimensions,
  ListRenderItem,
  Image,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  FadeInDown,
  ZoomIn,
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from "react-native-reanimated";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { TabParamList } from "../navigation/types";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { CATEGORIES, MOCK_ITEMS, type MarketItem } from "../data/mockData";
import { getFavorites } from "../services/storage";
import { fetchRandomUsers, getItemImageUrl, type RandomUser } from "../services/api";
import { formatCacheAge } from "../services/cache";

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Marketplace">,
  NativeStackScreenProps<RootStackParamList>
>;

const { width: SCREEN_W } = Dimensions.get("window");
const CARD_W = (SCREEN_W - 48) / 2;

// ─── Skeleton de carregamento ──────────────────────────────────────────────────
function SkeletonCard() {
  const opacity = useSharedValue(0.4);
  const animStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

  useEffect(() => {
    opacity.value = withTiming(1, { duration: 800 });
    const interval = setInterval(() => {
      opacity.value = withTiming(0.4, { duration: 600 });
      setTimeout(() => { opacity.value = withTiming(1, { duration: 600 }); }, 600);
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  return (
    <Animated.View style={[styles.skeletonCard, animStyle]}>
      <View style={styles.skeletonImage} />
      <View style={{ padding: 10 }}>
        <View style={styles.skeletonTitle} />
        <View style={styles.skeletonSub} />
        <View style={styles.skeletonPrice} />
      </View>
    </Animated.View>
  );
}

// ─── Card do item ─────────────────────────────────────────────────────────────
function ItemCard({
  item,
  index,
  isFav,
  avatarUrl,
  onPress,
}: {
  item: MarketItem;
  index: number;
  isFav: boolean;
  avatarUrl?: string;
  onPress: () => void;
}) {
  const [imageError, setImageError] = useState(false);
  const TYPE_CONFIG = {
    doação: { color: "#16A34A", bg: "#DCFCE7", label: "Doação" },
    venda:  { color: "#2563EB", bg: "#DBEAFE", label: "Venda" },
    troca:  { color: "#7C3AED", bg: "#EDE9FE", label: "Troca" },
  };
  const typeConf = TYPE_CONFIG[item.type];

  const itemImageUrl = getItemImageUrl(item.id);

  return (
    <Animated.View entering={ZoomIn.delay(index * 60).duration(350).springify().damping(14)}>
      <Pressable
        style={({ pressed }) => [styles.itemCard, pressed && { opacity: 0.85 }]}
        onPress={onPress}
      >
        {/* Imagem do item via Picsum (com fallback para emoji) */}
        <View style={[styles.itemImageWrap, { backgroundColor: item.bgColor }]}>
          {!imageError ? (
            <Image
              source={{ uri: itemImageUrl }}
              style={styles.itemImage}
              onError={() => setImageError(true)}
            />
          ) : (
            <Text style={styles.itemEmoji}>{item.emoji}</Text>
          )}
          {item.isFeatured && (
            <View style={styles.featuredBadge}>
              <Text style={styles.featuredBadgeText}>⭐ Destaque</Text>
            </View>
          )}
          {isFav && (
            <View style={styles.favBadge}>
              <Text style={{ fontSize: 12 }}>❤️</Text>
            </View>
          )}
        </View>

        {/* Info */}
        <View style={styles.itemInfo}>
          <View style={[styles.typePill, { backgroundColor: typeConf.bg }]}>
            <Text style={[styles.typePillText, { color: typeConf.color }]}>
              {typeConf.label}
            </Text>
          </View>

          <Text style={styles.itemTitle} numberOfLines={2}>{item.title}</Text>

          {/* Vendedor com avatar real (Random User API) */}
          <View style={styles.sellerRow}>
            {avatarUrl ? (
              <Image source={{ uri: avatarUrl }} style={styles.sellerAvatar} />
            ) : (
              <View style={[styles.sellerAvatarPlaceholder]}>
                <Text style={{ fontSize: 10 }}>{item.userAvatar}</Text>
              </View>
            )}
            <Text style={styles.sellerName} numberOfLines={1}>{item.userName}</Text>
          </View>

          <Text style={styles.itemLocation} numberOfLines={1}>📍 {item.location}</Text>

          <View style={styles.priceRow}>
            <Text style={styles.itemPrice}>
              {item.type === "doação" ? "Grátis" : `R$ ${item.price.toLocaleString("pt-BR")}`}
            </Text>
            <Text style={styles.itemCondition}>{item.condition}</Text>
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}

// ─── Tela Principal ────────────────────────────────────────────────────────────
export function MarketplaceScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [searchText, setSearchText] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState<string[]>([]);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // Random User API — avatares dos vendedores
  const [avatars, setAvatars] = useState<RandomUser[]>([]);
  const [avatarsFromCache, setAvatarsFromCache] = useState<boolean | null>(null);
  const [avatarsCachedAt, setAvatarsCachedAt] = useState<number | undefined>(undefined);
  const [avatarsLoading, setAvatarsLoading] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    loadFavorites();
    loadAvatars();
    return () => clearTimeout(t);
  }, []);

  async function loadFavorites() {
    const favs = await getFavorites();
    setFavorites(favs);
  }

  async function loadAvatars() {
    setAvatarsLoading(true);
    const result = await fetchRandomUsers(MOCK_ITEMS.length, "reuse2025");
    setAvatars(result.data);
    setAvatarsFromCache(result.fromCache);
    setAvatarsCachedAt(result.cachedAt);
    setAvatarsLoading(false);
  }

  function handleSearchChange(text: string) {
    setSearchText(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => setDebouncedSearch(text), 300);
  }

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadFavorites();
    await loadAvatars();
    await new Promise((r) => setTimeout(r, 600));
    setRefreshing(false);
  }, []);

  const filteredItems = MOCK_ITEMS.filter((item) => {
    const matchesCategory = selectedCategory === "all" || item.category === selectedCategory;
    const matchesSearch =
      !debouncedSearch ||
      item.title.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
      item.category.toLowerCase().includes(debouncedSearch.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const renderItem: ListRenderItem<MarketItem> = ({ item, index }) => {
    const originalIndex = MOCK_ITEMS.findIndex((m) => m.id === item.id);
    const avatar = avatars[originalIndex];
    return (
      <View style={{ width: CARD_W, marginBottom: 12 }}>
        <ItemCard
          item={item}
          index={index}
          isFav={favorites.includes(item.id)}
          avatarUrl={avatar?.picture.thumbnail}
          onPress={() =>
            (navigation as any).navigate("ItemDetail", { itemId: item.id })
          }
        />
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(500)} style={styles.header}>
        <View style={styles.headerTop}>
          <View>
            <Text style={styles.headerGreeting}>Olá! 👋</Text>
            <Text style={styles.headerTitle}>O que você busca hoje?</Text>
          </View>
          <TouchableOpacity
            style={styles.notifBtn}
            onPress={() => (navigation as any).navigate("Notifications")}
          >
            <Text style={styles.notifIcon}>🔔</Text>
            <View style={styles.notifBadge}>
              <Text style={styles.notifBadgeText}>3</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Barra de busca */}
        <View style={styles.searchBar}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Buscar itens, categorias..."
            placeholderTextColor="#94A3B8"
            value={searchText}
            onChangeText={handleSearchChange}
            returnKeyType="search"
          />
          {searchText.length > 0 && (
            <TouchableOpacity onPress={() => { setSearchText(""); setDebouncedSearch(""); }}>
              <Text style={{ fontSize: 18, color: "#94A3B8" }}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </Animated.View>

      {/* Categorias */}
      <Animated.View entering={FadeInDown.delay(150).duration(500)} style={styles.categoriesList}>
        <FlatList
          data={CATEGORIES}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                item.id === selectedCategory && styles.categoryChipActive,
              ]}
              onPress={() => setSelectedCategory(item.id)}
            >
              <Text style={styles.categoryChipEmoji}>{item.emoji}</Text>
              <Text
                style={[
                  styles.categoryChipLabel,
                  item.id === selectedCategory && styles.categoryChipLabelActive,
                ]}
              >
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        />
      </Animated.View>

      {/* Barra de status de API/cache */}
      {avatarsFromCache !== null && (
        <View style={styles.apiStatusBar}>
          <Text style={styles.apiStatusText}>
            {avatarsLoading
              ? "🌐 Buscando avatares..."
              : avatarsFromCache
              ? `📦 Avatares em cache · ${avatarsCachedAt ? formatCacheAge(avatarsCachedAt) : ""}`
              : "🌐 Avatares via Random User API"}
          </Text>
          <Text style={styles.apiStatusText}>
            🖼️ Imagens via Picsum
          </Text>
        </View>
      )}

      {/* Contagem */}
      <View style={styles.countRow}>
        <Text style={styles.countText}>
          {loading ? "Carregando..." : `${filteredItems.length} itens encontrados`}
        </Text>
        {!loading && filteredItems.length > 0 && (
          <TouchableOpacity>
            <Text style={styles.filterBtn}>Filtrar ⬇</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Grid de itens */}
      {loading ? (
        <View style={styles.skeletonGrid}>
          {[1, 2, 3, 4].map((i) => (
            <SkeletonCard key={i} />
          ))}
        </View>
      ) : filteredItems.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🔍</Text>
          <Text style={styles.emptyTitle}>Nenhum item encontrado</Text>
          <Text style={styles.emptySub}>
            Tente outra categoria ou termo de busca.
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={{ gap: 12 }}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor="#0D5C3D"
              colors={["#0D5C3D"]}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAF9" },

  // Header
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 14,
  },
  headerGreeting: { fontSize: 13, color: "#64748B" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A", marginTop: 2 },
  notifBtn: { position: "relative", padding: 4 },
  notifIcon: { fontSize: 24 },
  notifBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  notifBadgeText: { fontSize: 9, fontWeight: "800", color: "#FFFFFF" },
  searchBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAF9",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    height: 48,
    gap: 10,
  },
  searchIcon: { fontSize: 18 },
  searchInput: { flex: 1, fontSize: 15, color: "#0F172A" },

  // Categorias
  categoriesList: { backgroundColor: "#FFFFFF" },
  categoriesContent: { paddingHorizontal: 20, paddingVertical: 12, gap: 8 },
  categoryChip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
    backgroundColor: "#F8FAF9",
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    gap: 6,
  },
  categoryChipActive: { backgroundColor: "#0D5C3D", borderColor: "#0D5C3D" },
  categoryChipEmoji: { fontSize: 16 },
  categoryChipLabel: { fontSize: 13, fontWeight: "600", color: "#64748B" },
  categoryChipLabelActive: { color: "#FFFFFF" },

  // Barra de status da API
  apiStatusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: "#F0FDF4",
    borderBottomWidth: 1,
    borderBottomColor: "#BBF7D0",
  },
  apiStatusText: { fontSize: 10, color: "#166534", fontWeight: "600" },

  // Contagem
  countRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  countText: { fontSize: 13, color: "#64748B" },
  filterBtn: { fontSize: 13, color: "#0D5C3D", fontWeight: "600" },

  // Skeletons
  skeletonGrid: { flexDirection: "row", flexWrap: "wrap", paddingHorizontal: 20, gap: 12 },
  skeletonCard: {
    width: CARD_W,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  skeletonImage: { width: "100%", height: 130, backgroundColor: "#E5E7EB" },
  skeletonTitle: { height: 12, backgroundColor: "#E5E7EB", borderRadius: 6, marginBottom: 6 },
  skeletonSub: { height: 10, backgroundColor: "#F1F5F9", borderRadius: 6, width: "70%", marginBottom: 8 },
  skeletonPrice: { height: 14, backgroundColor: "#E5E7EB", borderRadius: 6, width: "40%" },

  // Lista
  listContent: { paddingHorizontal: 20, paddingBottom: 24, paddingTop: 4 },

  // Card
  itemCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "#E5E7EB",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  itemImageWrap: {
    height: 130,
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
    overflow: "hidden",
  },
  itemImage: { width: "100%", height: "100%", resizeMode: "cover" },
  itemEmoji: { fontSize: 52 },
  featuredBadge: {
    position: "absolute",
    bottom: 8,
    left: 8,
    backgroundColor: "#FEF3C7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  featuredBadgeText: { fontSize: 10, fontWeight: "600", color: "#92400E" },
  favBadge: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255,255,255,0.9)",
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: { padding: 10 },
  typePill: {
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 99,
    marginBottom: 5,
  },
  typePillText: { fontSize: 10, fontWeight: "700" },
  itemTitle: { fontSize: 13, fontWeight: "700", color: "#0F172A", lineHeight: 18, marginBottom: 5 },

  // Vendedor
  sellerRow: { flexDirection: "row", alignItems: "center", gap: 5, marginBottom: 4 },
  sellerAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  sellerAvatarPlaceholder: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: "#F1F5F9",
    alignItems: "center",
    justifyContent: "center",
  },
  sellerName: { fontSize: 10, color: "#64748B", flex: 1 },

  itemLocation: { fontSize: 11, color: "#94A3B8", marginBottom: 6 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  itemPrice: { fontSize: 14, fontWeight: "800", color: "#0D5C3D" },
  itemCondition: {
    fontSize: 10,
    color: "#64748B",
    backgroundColor: "#F1F5F9",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },

  // Estado vazio
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", marginBottom: 8 },
  emptySub: { fontSize: 14, color: "#64748B", textAlign: "center", lineHeight: 20 },
});
