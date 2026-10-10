/**
 * api.ts
 * Integração com APIs externas públicas do ReUse.
 *
 * APIs utilizadas:
 *  1. ViaCEP       — consulta de endereço por CEP (viacep.com.br)
 *  2. IBGE         — lista de estados e municípios brasileiros
 *  3. Random User  — avatares reais de vendedores (randomuser.me)
 *  4. Lorem Picsum — imagens de placeholder para itens (picsum.photos)
 *
 * Todas as chamadas passam pelo cacheGetOrFetch(), que armazena
 * a resposta no AsyncStorage com TTL — evitando requisições repetidas.
 */

import { cacheGetOrFetch } from "./cache";

// ─── TTLs ─────────────────────────────────────────────────────────────────────
const TTL_24H = 24 * 60 * 60 * 1000;
const TTL_7D  = 7  * 24 * 60 * 60 * 1000;
const TTL_5MIN = 5 * 60 * 1000;

// ─── ViaCEP ───────────────────────────────────────────────────────────────────
export type AddressData = {
  cep: string;
  logradouro: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  ibge: string;
  erro?: boolean;
};

export async function fetchAddressByCEP(
  cep: string
): Promise<{ data: AddressData | null; fromCache: boolean }> {
  const clean = cep.replace(/\D/g, "");
  if (clean.length !== 8) return { data: null, fromCache: false };

  try {
    const result = await cacheGetOrFetch<AddressData>(
      `viacep:${clean}`,
      async () => {
        const res = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
        if (!res.ok) throw new Error("CEP não encontrado");
        return res.json();
      },
      TTL_24H
    );
    if (result.data.erro) return { data: null, fromCache: result.fromCache };
    return { data: result.data, fromCache: result.fromCache };
  } catch {
    return { data: null, fromCache: false };
  }
}

// ─── IBGE — Estados ───────────────────────────────────────────────────────────
export type IBGEState = {
  id: number;
  sigla: string;
  nome: string;
  regiao: { sigla: string; nome: string };
};

export async function fetchStates(): Promise<{
  data: IBGEState[];
  fromCache: boolean;
  cachedAt?: number;
}> {
  try {
    return await cacheGetOrFetch<IBGEState[]>(
      "ibge:estados",
      async () => {
        const res = await fetch(
          "https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome"
        );
        if (!res.ok) throw new Error("Erro ao buscar estados");
        return res.json();
      },
      TTL_7D
    );
  } catch {
    return { data: [], fromCache: false };
  }
}

// ─── IBGE — Municípios ────────────────────────────────────────────────────────
export type IBGECity = {
  id: number;
  nome: string;
};

export async function fetchCitiesByState(uf: string): Promise<{
  data: IBGECity[];
  fromCache: boolean;
  cachedAt?: number;
}> {
  try {
    return await cacheGetOrFetch<IBGECity[]>(
      `ibge:municipios:${uf}`,
      async () => {
        const res = await fetch(
          `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${uf}/municipios?orderBy=nome`
        );
        if (!res.ok) throw new Error("Erro ao buscar municípios");
        return res.json();
      },
      TTL_7D
    );
  } catch {
    return { data: [], fromCache: false };
  }
}

// ─── Random User — avatares de vendedores ─────────────────────────────────────
export type RandomUser = {
  login: { uuid: string };
  name: { first: string; last: string };
  picture: { thumbnail: string; medium: string };
};

export async function fetchRandomUsers(
  count: number,
  seed: string
): Promise<{ data: RandomUser[]; fromCache: boolean; cachedAt?: number }> {
  try {
    const result = await cacheGetOrFetch<{ results: RandomUser[] }>(
      `randomuser:${seed}:${count}`,
      async () => {
        const res = await fetch(
          `https://randomuser.me/api/?results=${count}&seed=${seed}&nat=br&inc=login,picture,name`
        );
        if (!res.ok) throw new Error("Erro ao buscar usuários");
        return res.json();
      },
      TTL_24H
    );
    return {
      data: result.data.results,
      fromCache: result.fromCache,
      cachedAt: result.cachedAt,
    };
  } catch {
    return { data: [], fromCache: false };
  }
}

// ─── Picsum — URL de imagem por seed ─────────────────────────────────────────
// Não faz fetch — apenas constrói a URL determinística (sem cache necessário).
export function getItemImageUrl(
  seed: string | number,
  width = 400,
  height = 300
): string {
  return `https://picsum.photos/seed/reuse${seed}/${width}/${height}`;
}

// ─── Picsum — prefetch de metadados ──────────────────────────────────────────
export type PicsumImage = {
  id: string;
  author: string;
  width: number;
  height: number;
  url: string;
  download_url: string;
};

export async function fetchPicsumList(page = 1, limit = 12): Promise<{
  data: PicsumImage[];
  fromCache: boolean;
  cachedAt?: number;
}> {
  try {
    return await cacheGetOrFetch<PicsumImage[]>(
      `picsum:list:p${page}l${limit}`,
      async () => {
        const res = await fetch(
          `https://picsum.photos/v2/list?page=${page}&limit=${limit}`
        );
        if (!res.ok) throw new Error("Erro ao buscar imagens Picsum");
        return res.json();
      },
      TTL_5MIN
    );
  } catch {
    return { data: [], fromCache: false };
  }
}
