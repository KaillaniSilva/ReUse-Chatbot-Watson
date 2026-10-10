import AsyncStorage from "@react-native-async-storage/async-storage";

const PREFIX = "@reuse:cache:";

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
  cachedAt: number;
};

export async function cacheSet<T>(key: string, data: T, ttlMs: number): Promise<void> {
  try {
    const entry: CacheEntry<T> = {
      data,
      expiresAt: Date.now() + ttlMs,
      cachedAt: Date.now(),
    };
    await AsyncStorage.setItem(PREFIX + key, JSON.stringify(entry));
  } catch {
    // silencia falhas de escrita no cache
  }
}

export async function cacheGet<T>(key: string): Promise<{ data: T; cachedAt: number } | null> {
  try {
    const raw = await AsyncStorage.getItem(PREFIX + key);
    if (!raw) return null;
    const entry: CacheEntry<T> = JSON.parse(raw);
    if (Date.now() > entry.expiresAt) {
      await AsyncStorage.removeItem(PREFIX + key);
      return null;
    }
    return { data: entry.data, cachedAt: entry.cachedAt };
  } catch {
    return null;
  }
}

/**
 * Busca do cache; se expirado/ausente executa o fetcher, armazena e retorna.
 * `fromCache: true` indica que a resposta veio do cache local.
 */
export async function cacheGetOrFetch<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlMs: number
): Promise<{ data: T; fromCache: boolean; cachedAt?: number }> {
  const hit = await cacheGet<T>(key);
  if (hit !== null) {
    return { data: hit.data, fromCache: true, cachedAt: hit.cachedAt };
  }
  const data = await fetcher();
  await cacheSet(key, data, ttlMs);
  return { data, fromCache: false, cachedAt: Date.now() };
}

export async function cacheInvalidate(key: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(PREFIX + key);
  } catch {
    // silencia
  }
}

export async function cacheClearAll(): Promise<void> {
  try {
    const keys = await AsyncStorage.getAllKeys();
    const cacheKeys = keys.filter((k) => k.startsWith(PREFIX));
    if (cacheKeys.length > 0) await AsyncStorage.multiRemove(cacheKeys);
  } catch {
    // silencia
  }
}

export function formatCacheAge(cachedAt: number): string {
  const diffMs = Date.now() - cachedAt;
  const mins = Math.floor(diffMs / 60000);
  if (mins < 1) return "agora";
  if (mins < 60) return `há ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `há ${hours}h`;
  return `há ${Math.floor(hours / 24)}d`;
}
