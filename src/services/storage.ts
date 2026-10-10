/**
 * storage.ts
 * Camada de abstração sobre o AsyncStorage do ReUse.
 *
 * O que é persistido:
 *  - @reuse:user_profile    — dados do perfil do usuário logado
 *  - @reuse:favorites       — IDs dos itens salvos/favoritados
 *  - @reuse:settings        — preferências de notificação e tema
 *  - @reuse:onboarding_done — flag para não repetir o onboarding
 *  - @reuse:posted_items    — itens publicados pelo usuário (sem backend)
 *  - @reuse:recently_viewed — últimos 10 itens visualizados
 */

import AsyncStorage from "@react-native-async-storage/async-storage";

// ─── Chaves ───────────────────────────────────────────────────────────────────
const KEYS = {
  USER_PROFILE: "@reuse:user_profile",
  FAVORITES: "@reuse:favorites",
  SETTINGS: "@reuse:settings",
  ONBOARDING_DONE: "@reuse:onboarding_done",
  POSTED_ITEMS: "@reuse:posted_items",
  RECENTLY_VIEWED: "@reuse:recently_viewed",
} as const;

// ─── Tipos ────────────────────────────────────────────────────────────────────
export type UserProfile = {
  id: string;
  name: string;
  email: string;
  bio: string;
  avatarUri: string | null;
  city: string;
  level: number;
  xp: number;
  streak: number;
  itemsListed: number;
  tradesCompleted: number;
  donationsGiven: number;
  createdAt: string;
};

export type AppSettings = {
  notificationsEnabled: boolean;
  emailNotifications: boolean;
  showLocation: boolean;
  darkMode: boolean;
  language: "pt-BR";
};

export type PostedItem = {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  type: "doação" | "venda" | "troca";
  imageUri: string | null;
  location: string;
  createdAt: string;
  /** "paused" oculta a oferta; ausente = ativa (compatível com itens antigos) */
  status?: "active" | "paused";
};

// ─── Perfil do usuário ─────────────────────────────────────────────────────────
export const DEFAULT_PROFILE: UserProfile = {
  id: "user_local",
  name: "",
  email: "",
  bio: "",
  avatarUri: null,
  city: "",
  level: 1,
  xp: 0,
  streak: 0,
  itemsListed: 0,
  tradesCompleted: 0,
  donationsGiven: 0,
  createdAt: new Date().toISOString(),
};

export const DEFAULT_SETTINGS: AppSettings = {
  notificationsEnabled: true,
  emailNotifications: false,
  showLocation: true,
  darkMode: false,
  language: "pt-BR",
};

// ─── User Profile ──────────────────────────────────────────────────────────────
export async function getUserProfile(): Promise<UserProfile> {
  try {
    const data = await AsyncStorage.getItem(KEYS.USER_PROFILE);
    if (data) return { ...DEFAULT_PROFILE, ...JSON.parse(data) };
    return DEFAULT_PROFILE;
  } catch {
    return DEFAULT_PROFILE;
  }
}

export async function saveUserProfile(profile: Partial<UserProfile>): Promise<void> {
  try {
    const current = await getUserProfile();
    const updated = { ...current, ...profile };
    await AsyncStorage.setItem(KEYS.USER_PROFILE, JSON.stringify(updated));
  } catch (e) {
    console.warn("Erro ao salvar perfil:", e);
  }
}

// ─── Favoritos ─────────────────────────────────────────────────────────────────
export async function getFavorites(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.FAVORITES);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function toggleFavorite(itemId: string): Promise<boolean> {
  try {
    const current = await getFavorites();
    const isFav = current.includes(itemId);
    const updated = isFav
      ? current.filter((id) => id !== itemId)
      : [...current, itemId];
    await AsyncStorage.setItem(KEYS.FAVORITES, JSON.stringify(updated));
    return !isFav; // retorna o novo estado
  } catch {
    return false;
  }
}

export async function isFavorite(itemId: string): Promise<boolean> {
  const favs = await getFavorites();
  return favs.includes(itemId);
}

// ─── Configurações ─────────────────────────────────────────────────────────────
export async function getSettings(): Promise<AppSettings> {
  try {
    const data = await AsyncStorage.getItem(KEYS.SETTINGS);
    if (data) return { ...DEFAULT_SETTINGS, ...JSON.parse(data) };
    return DEFAULT_SETTINGS;
  } catch {
    return DEFAULT_SETTINGS;
  }
}

export async function saveSetting<K extends keyof AppSettings>(
  key: K,
  value: AppSettings[K]
): Promise<void> {
  try {
    const current = await getSettings();
    await AsyncStorage.setItem(
      KEYS.SETTINGS,
      JSON.stringify({ ...current, [key]: value })
    );
  } catch (e) {
    console.warn("Erro ao salvar configuração:", e);
  }
}

// ─── Onboarding ────────────────────────────────────────────────────────────────
export async function isOnboardingDone(): Promise<boolean> {
  try {
    const val = await AsyncStorage.getItem(KEYS.ONBOARDING_DONE);
    return val === "true";
  } catch {
    return false;
  }
}

export async function markOnboardingDone(): Promise<void> {
  await AsyncStorage.setItem(KEYS.ONBOARDING_DONE, "true");
}

// ─── Itens publicados ──────────────────────────────────────────────────────────
export async function getPostedItems(): Promise<PostedItem[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.POSTED_ITEMS);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

export async function addPostedItem(item: PostedItem): Promise<void> {
  try {
    const current = await getPostedItems();
    await AsyncStorage.setItem(
      KEYS.POSTED_ITEMS,
      JSON.stringify([item, ...current])
    );
    // Incrementar contador de itens no perfil
    const profile = await getUserProfile();
    await saveUserProfile({ itemsListed: profile.itemsListed + 1 });
  } catch (e) {
    console.warn("Erro ao salvar item:", e);
  }
}

export async function deletePostedItem(itemId: string): Promise<void> {
  try {
    const current = await getPostedItems();
    await AsyncStorage.setItem(
      KEYS.POSTED_ITEMS,
      JSON.stringify(current.filter((i) => i.id !== itemId))
    );
  } catch (e) {
    console.warn("Erro ao deletar item:", e);
  }
}

/**
 * Pausa/reativa ofertas. Se `ids` for omitido, afeta todas.
 * Retorna os itens que de fato mudaram de estado.
 */
export async function setPostedItemsStatus(
  status: "active" | "paused",
  ids?: string[]
): Promise<PostedItem[]> {
  try {
    const current = await getPostedItems();
    const changed: PostedItem[] = [];
    const updated = current.map((item) => {
      const inScope = !ids || ids.includes(item.id);
      const currentStatus = item.status ?? "active";
      if (inScope && currentStatus !== status) {
        const next = { ...item, status };
        changed.push(next);
        return next;
      }
      return item;
    });
    await AsyncStorage.setItem(KEYS.POSTED_ITEMS, JSON.stringify(updated));
    return changed;
  } catch (e) {
    console.warn("Erro ao atualizar status dos itens:", e);
    return [];
  }
}

// ─── Recentemente visualizados ─────────────────────────────────────────────────
export async function addRecentlyViewed(itemId: string): Promise<void> {
  try {
    const current = await getRecentlyViewed();
    const filtered = current.filter((id) => id !== itemId);
    const updated = [itemId, ...filtered].slice(0, 10); // máximo 10
    await AsyncStorage.setItem(KEYS.RECENTLY_VIEWED, JSON.stringify(updated));
  } catch {
    // silencia
  }
}

export async function getRecentlyViewed(): Promise<string[]> {
  try {
    const data = await AsyncStorage.getItem(KEYS.RECENTLY_VIEWED);
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

// ─── Utilitário de debug ───────────────────────────────────────────────────────
export async function clearAllStorage(): Promise<void> {
  await AsyncStorage.multiRemove(Object.values(KEYS));
}
