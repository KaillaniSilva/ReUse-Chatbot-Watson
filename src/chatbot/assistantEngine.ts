/**
 * assistantEngine.ts
 * Executa as TAREFAS do assistente sobre os dados reais do app
 * (AsyncStorage via services/storage) e conduz os fluxos multi-turno.
 *
 * Tarefas automatizadas:
 *  - list_offers       lista as ofertas publicadas (ativas/pausadas)
 *  - pause_offers      pausa todas as ofertas ativas (ou uma específica)
 *  - resume_offers     reativa ofertas pausadas (todas ou uma específica)
 *  - delete_offer      exclui uma oferta (com confirmação)
 *  - publish_item      cadastra um item por conversa (coleta guiada)
 *  - show_favorites    abre a tela de favoritos
 *  - my_progress       resume nível, XP, sequência e contadores
 *  - update_city       altera a cidade do perfil
 *  - notifications_on/off  liga/desliga notificações push
 *  - go_profile / go_settings  navegação por comando
 */

import {
  getPostedItems,
  addPostedItem,
  deletePostedItem,
  setPostedItemsStatus,
  getUserProfile,
  saveUserProfile,
  saveSetting,
  getFavorites,
  type PostedItem,
} from "../services/storage";
import { CATEGORIES } from "../data/mockData";
import { normalize, tokenize } from "./localNlu";
import type {
  BotReply,
  EngineResult,
  OfferSummary,
  PendingState,
  PublishDraft,
  QuickReply,
} from "./types";

export type EngineDeps = {
  /** Navega para uma rota do stack raiz (ex.: "Favorites") */
  navigate: (route: string, params?: object) => void;
};

const CONDITIONS = ["Novo", "Excelente", "Bom", "Razoável"] as const;
const TYPES = ["doação", "venda", "troca"] as const;

// Palavras genéricas que não identificam um item específico
const GENERIC_WORDS = new Set([
  "anuncio", "anuncios", "oferta", "ofertas", "item", "itens", "produto",
  "produtos", "todos", "todas", "ativas", "ativos", "pausadas", "pausados",
  "pausar", "pausa", "reativar", "reativa", "retomar", "excluir", "apagar",
  "remover", "deletar", "suspender", "desativar", "ocultar", "voltar",
  "despausar", "ativar", "publicado", "publicados", "publiquei", "tirar", "ar",
]);

const reply = (text: string, extra?: Partial<BotReply>): BotReply => ({ text, ...extra });
const chips = (...labels: string[]): QuickReply[] =>
  labels.map((l) => ({ label: l, text: l }));

const done = (replies: BotReply[], pending: PendingState = null): EngineResult => ({
  replies,
  pending,
});

function toSummary(item: PostedItem): OfferSummary {
  return {
    id: item.id,
    title: item.title,
    type: item.type,
    price: item.price,
    status: item.status ?? "active",
  };
}

/** Itens cujo título compartilha alguma palavra relevante com a frase. */
function matchItemsByText(items: PostedItem[], text: string): PostedItem[] {
  const words = tokenize(text).filter((t) => t.length >= 3 && !GENERIC_WORDS.has(t));
  if (words.length === 0) return [];
  return items.filter((item) => {
    const titleTokens = new Set(tokenize(item.title));
    return words.some((w) => titleTokens.has(w));
  });
}

function isCancel(text: string): boolean {
  return /\b(cancelar|cancela|desistir|deixa pra la|esquece|sair|nao quero mais)\b/.test(
    normalize(text)
  );
}

function isYes(text: string): boolean {
  return /^(sim|s|confirmo|confirmar|pode|pode sim|isso|claro|ok|yes|quero|bora|vai)\b/.test(
    normalize(text)
  );
}

function isNo(text: string): boolean {
  return /^(nao|n|negativo|cancelar|cancela|melhor nao)\b/.test(normalize(text));
}

// ─── Tarefas ────────────────────────────────────────────────────────────────
export async function runTask(
  action: string,
  text: string,
  deps: EngineDeps
): Promise<EngineResult> {
  switch (action) {
    case "list_offers":
      return listOffers();
    case "pause_offers":
      return changeStatus("paused", text);
    case "resume_offers":
      return changeStatus("active", text);
    case "delete_offer":
      return startDelete(text);
    case "publish_item":
      return done(
        [
          reply(
            "Qual é o título do item? (ex.: \"Sofá 3 lugares\")\n\nVocê pode digitar \"cancelar\" a qualquer momento."
          ),
        ],
        { type: "publish", step: "title", draft: {} }
      );
    case "show_favorites": {
      const favs = await getFavorites();
      deps.navigate("Favorites");
      return done([
        reply(
          favs.length > 0
            ? `Abrindo seus favoritos — você tem ${favs.length} ${favs.length === 1 ? "item salvo" : "itens salvos"} ❤️`
            : "Abrindo seus favoritos. Você ainda não salvou nenhum item — toque no 🤍 de um anúncio para guardar!"
        ),
      ]);
    }
    case "my_progress":
      return myProgress(deps);
    case "update_city":
      return updateCity(text);
    case "notifications_on":
      await saveSetting("notificationsEnabled", true);
      return done([reply("🔔 Pronto! Notificações push ativadas.")]);
    case "notifications_off":
      await saveSetting("notificationsEnabled", false);
      return done([
        reply("🔕 Feito! Notificações push desativadas. Você pode reativá-las quando quiser."),
      ]);
    case "go_profile":
      deps.navigate("MainApp", { screen: "Profile" });
      return done([]);
    case "go_settings":
      deps.navigate("Settings");
      return done([]);
    default:
      return done([]);
  }
}

async function listOffers(): Promise<EngineResult> {
  const items = await getPostedItems();
  if (items.length === 0) {
    return done([
      reply("Você ainda não publicou nenhuma oferta. Quer que eu cadastre uma com você agora?", {
        quickReplies: chips("Cadastrar um item agora"),
      }),
    ]);
  }
  const active = items.filter((i) => (i.status ?? "active") === "active").length;
  const paused = items.length - active;
  return done([
    reply(`Você tem ${items.length} ${items.length === 1 ? "oferta" : "ofertas"}: ${active} ativa(s) e ${paused} pausada(s).`, {
      offers: items.map(toSummary),
      quickReplies:
        active > 0
          ? chips("Pausar minhas ofertas")
          : chips("Reativar minhas ofertas"),
    }),
  ]);
}

async function changeStatus(
  status: "active" | "paused",
  text: string
): Promise<EngineResult> {
  const items = await getPostedItems();
  if (items.length === 0) {
    return done([reply("Você não tem ofertas publicadas ainda, então não há nada para alterar. 🙂")]);
  }

  const targeted = matchItemsByText(items, text);
  const scope = targeted.length > 0 ? targeted : items;
  const candidates = scope.filter((i) => (i.status ?? "active") !== status);

  if (candidates.length === 0) {
    return done([
      reply(
        status === "paused"
          ? "Todas as ofertas selecionadas já estão pausadas. ⏸️"
          : "Nenhuma oferta estava pausada — tudo já está ativo. ✅"
      ),
    ]);
  }

  const changed = await setPostedItemsStatus(status, candidates.map((c) => c.id));
  const names = changed.map((c) => `• ${c.title}`).join("\n");
  const head =
    status === "paused"
      ? `⏸️ ${changed.length} ${changed.length === 1 ? "oferta pausada" : "ofertas pausadas"}:`
      : `▶️ ${changed.length} ${changed.length === 1 ? "oferta reativada" : "ofertas reativadas"}:`;

  const note =
    status === "paused"
      ? "\n\nOfertas pausadas ficam ocultas até você reativá-las."
      : "";

  return done([
    reply(`${head}\n${names}${note}`, {
      offers: changed.map(toSummary),
      quickReplies:
        status === "paused"
          ? chips("Reativar minhas ofertas", "Minhas ofertas")
          : chips("Minhas ofertas"),
    }),
  ]);
}

async function startDelete(text: string): Promise<EngineResult> {
  const items = await getPostedItems();
  if (items.length === 0) {
    return done([reply("Você não tem ofertas publicadas para excluir.")]);
  }
  const matches = matchItemsByText(items, text);

  if (matches.length === 1) {
    const item = matches[0];
    return done(
      [
        reply(`Tem certeza que deseja excluir "${item.title}"? Essa ação não pode ser desfeita.`, {
          quickReplies: chips("Sim, excluir", "Não, manter"),
        }),
      ],
      { type: "confirm_delete", itemId: item.id, title: item.title }
    );
  }

  const list = matches.length > 1 ? matches : items;
  return done(
    [
      reply(
        matches.length > 1
          ? "Encontrei mais de uma oferta parecida. Qual delas você quer excluir? Diga o nome:"
          : "Qual oferta você quer excluir? Diga o nome:",
        { offers: list.map(toSummary) }
      ),
    ],
    { type: "pick_delete" }
  );
}

async function myProgress(deps: EngineDeps): Promise<EngineResult> {
  const [p, items] = await Promise.all([getUserProfile(), getPostedItems()]);
  const nextXp = [500, 1500, 3500, 7000, 9999][Math.min(p.level, 5) - 1];
  const missing = Math.max(0, nextXp - p.xp);
  void deps;
  return done([
    reply(
      `🏆 Seu progresso no ReUse\n\n` +
        `• Nível ${p.level}\n` +
        `• ${p.xp} RP acumulados${p.level < 5 ? ` (faltam ${missing} para o próximo nível)` : ""}\n` +
        `• Sequência: ${p.streak} dia(s) 🔥\n` +
        `• Ofertas publicadas: ${items.length}\n` +
        `• Trocas: ${p.tradesCompleted} · Doações: ${p.donationsGiven}`,
      { quickReplies: chips("Como ganhar pontos?") }
    ),
  ]);
}

async function updateCity(text: string): Promise<EngineResult> {
  const city = extractCity(text);
  if (!city) {
    return done([reply("Claro! Para qual cidade você quer alterar? (ex.: \"Campinas\")")], {
      type: "ask_city",
    });
  }
  await saveUserProfile({ city });
  return done([reply(`📍 Pronto! Sua cidade agora é ${city}.`)]);
}

function titleCase(s: string): string {
  return s.replace(/(^|\s)(\S)/g, (_m, sp: string, ch: string) => sp + ch.toUpperCase());
}

function extractCity(text: string): string | null {
  const pattern = (words: string) =>
    new RegExp(`\\b(?:${words})\\s+(?:a |o )?([A-Za-zÀ-ÿ' .-]{3,40})\\s*$`, "i");
  // "para/em" têm prioridade: em "mudar minha cidade para Campinas" a cidade vem depois de "para"
  const m = text.match(pattern("para|pra|em")) ?? text.match(pattern("cidade"));
  const raw = m?.[1]?.trim().replace(/[.!?]+$/, "");
  if (!raw) return null;
  const blocked = ["minha cidade", "cidade", "perfil", "localização", "localizacao"];
  if (blocked.includes(normalize(raw))) return null;
  return titleCase(raw);
}

// ─── Fluxos multi-turno ─────────────────────────────────────────────────────
export async function continuePending(
  pending: Exclude<PendingState, null>,
  text: string
): Promise<EngineResult> {
  if (isCancel(text) && pending.type !== "confirm_delete") {
    return done([reply("Tudo bem, cancelei. Se precisar, é só chamar! 🙂")]);
  }

  switch (pending.type) {
    case "confirm_delete": {
      if (isYes(text)) {
        await deletePostedItem(pending.itemId);
        return done([reply(`🗑️ A oferta "${pending.title}" foi excluída.`)]);
      }
      if (isNo(text) || isCancel(text)) {
        return done([reply(`Ok, mantive "${pending.title}" publicada. ✅`)]);
      }
      return done(
        [
          reply(`Excluir "${pending.title}"? Responda "sim" ou "não".`, {
            quickReplies: chips("Sim, excluir", "Não, manter"),
          }),
        ],
        pending
      );
    }

    case "pick_delete": {
      const items = await getPostedItems();
      const matches = matchItemsByText(items, text);
      if (matches.length === 1) {
        const item = matches[0];
        return done(
          [
            reply(`Tem certeza que deseja excluir "${item.title}"? Essa ação não pode ser desfeita.`, {
              quickReplies: chips("Sim, excluir", "Não, manter"),
            }),
          ],
          { type: "confirm_delete", itemId: item.id, title: item.title }
        );
      }
      return done(
        [
          reply(
            matches.length > 1
              ? "Ainda há mais de uma oferta com esse nome. Seja mais específico, por favor."
              : "Não encontrei essa oferta. Digite parte do título (ou \"cancelar\").",
            { offers: (matches.length > 1 ? matches : items).map(toSummary) }
          ),
        ],
        pending
      );
    }

    case "ask_city": {
      const city = text.trim().replace(/[.!?]+$/, "");
      if (city.length < 3) {
        return done([reply("Não consegui entender a cidade. Pode escrever o nome dela?")], pending);
      }
      const formatted = titleCase(city);
      await saveUserProfile({ city: formatted });
      return done([reply(`📍 Pronto! Sua cidade agora é ${formatted}.`)]);
    }

    case "publish":
      return continuePublish(pending, text);
  }
}

async function continuePublish(
  pending: Extract<PendingState, { type: "publish" }>,
  text: string
): Promise<EngineResult> {
  const draft: PublishDraft = { ...pending.draft };
  const norm = normalize(text);

  switch (pending.step) {
    case "title": {
      const title = text.trim();
      if (title.length < 3) {
        return done([reply("O título precisa ter pelo menos 3 letras. Qual é o item?")], pending);
      }
      draft.title = title.charAt(0).toUpperCase() + title.slice(1);
      return done(
        [reply(`Ótimo: "${draft.title}". É uma doação, venda ou troca?`, { quickReplies: chips("Doação", "Venda", "Troca") })],
        { type: "publish", step: "type", draft }
      );
    }

    case "type": {
      const type = TYPES.find((t) => norm.includes(normalize(t).slice(0, 4)));
      if (!type) {
        return done(
          [reply("Escolha uma opção: doação, venda ou troca.", { quickReplies: chips("Doação", "Venda", "Troca") })],
          pending
        );
      }
      draft.type = type;
      if (type === "venda") {
        return done([reply("Qual o preço em reais? (ex.: 80)")], { type: "publish", step: "price", draft });
      }
      draft.price = 0;
      return askCategory(draft);
    }

    case "price": {
      const value = Number(text.replace(/[^\d,.]/g, "").replace(",", "."));
      if (!isFinite(value) || value <= 0) {
        return done([reply("Não entendi o valor. Informe só o número, por exemplo: 80")], pending);
      }
      draft.price = value;
      return askCategory(draft);
    }

    case "category": {
      const cat = CATEGORIES.filter((c) => c.id !== "all").find(
        (c) => norm.includes(normalize(c.label)) || norm === c.id
      );
      if (!cat) {
        return done(
          [reply("Não encontrei essa categoria. Escolha uma da lista:", { quickReplies: categoryChips() })],
          pending
        );
      }
      draft.category = cat.id;
      return done(
        [reply("E qual o estado de conservação?", { quickReplies: chips(...CONDITIONS) })],
        { type: "publish", step: "condition", draft }
      );
    }

    case "condition": {
      const cond = CONDITIONS.find((c) => norm.includes(normalize(c)));
      if (!cond) {
        return done(
          [reply("Escolha: Novo, Excelente, Bom ou Razoável.", { quickReplies: chips(...CONDITIONS) })],
          pending
        );
      }
      draft.condition = cond;
      const price = draft.type === "venda" ? `R$ ${draft.price}` : "Grátis";
      return done(
        [
          reply(
            `Confira antes de publicar:\n\n📦 ${draft.title}\n🏷️ ${draft.type} · ${price}\n🗂️ ${labelOf(draft.category)} · ${draft.condition}\n\nPublico agora?`,
            { quickReplies: chips("Sim, publicar", "Cancelar") }
          ),
        ],
        { type: "publish", step: "confirm", draft }
      );
    }

    case "confirm": {
      if (!isYes(text)) {
        return done(
          [reply("Quer publicar? Responda \"sim\" para confirmar ou \"cancelar\".", { quickReplies: chips("Sim, publicar", "Cancelar") })],
          pending
        );
      }
      const profile = await getUserProfile();
      const item: PostedItem = {
        id: `item_${Date.now()}`,
        title: draft.title!,
        description: `${draft.title} — ${draft.condition}. Publicado pelo assistente ReUse.`,
        category: draft.category!,
        condition: draft.condition!,
        price: draft.type === "venda" ? draft.price ?? 0 : 0,
        type: draft.type!,
        imageUri: null,
        location: profile.city || "Localização não informada",
        createdAt: new Date().toISOString(),
        status: "active",
      };
      await addPostedItem(item);
      return done([
        reply(
          `🎉 Item publicado! "${item.title}" já está nas suas ofertas.\n\nDica: abra Perfil → Editar para adicionar uma foto e atrair mais interessados.`,
          { offers: [toSummary(item)], quickReplies: chips("Minhas ofertas", "Cadastrar outro item") }
        ),
      ]);
    }
  }
}

function labelOf(categoryId?: string): string {
  return CATEGORIES.find((c) => c.id === categoryId)?.label ?? "Outros";
}

function categoryChips(): QuickReply[] {
  return CATEGORIES.filter((c) => c.id !== "all").map((c) => ({
    label: `${c.emoji} ${c.label}`,
    text: c.label,
  }));
}

function askCategory(draft: PublishDraft): EngineResult {
  return done(
    [reply("Em qual categoria ele se encaixa?", { quickReplies: categoryChips() })],
    { type: "publish", step: "category", draft }
  );
}

