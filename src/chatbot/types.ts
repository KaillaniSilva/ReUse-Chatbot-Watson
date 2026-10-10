/**
 * types.ts
 * Tipos compartilhados do assistente virtual (chatbot) do ReUse.
 */

export type QuickReply = {
  label: string;
  /** Texto enviado ao bot quando o usuário toca no chip */
  text: string;
};

export type OfferSummary = {
  id: string;
  title: string;
  type: "doação" | "venda" | "troca";
  price: number;
  status: "active" | "paused";
};

export type AssistantMessage = {
  id: string;
  from: "bot" | "user";
  text: string;
  quickReplies?: QuickReply[];
  offers?: OfferSummary[];
  /** Quem gerou a resposta — exibido discretamente na UI */
  source?: "watson" | "local";
};

/** Resultado da interpretação da frase do usuário (Watson ou NLU local). */
export type NluResult = {
  /** Nome da intenção (ex.: "pause_offers", "help_publish") */
  intent: string | null;
  confidence: number;
  /** Texto de resposta do Watson (quando vier do serviço) */
  reply?: string;
  quickReplies?: QuickReply[];
  /** Ação customizada devolvida pelo dialog (output.user_defined.action) */
  action?: string;
  /** Contexto devolvido pelo Watson — reenviado na próxima mensagem (API stateless) */
  context?: unknown;
  source: "watson" | "local";
};

export type PublishDraft = {
  title?: string;
  type?: "doação" | "venda" | "troca";
  price?: number;
  category?: string;
  condition?: "Novo" | "Excelente" | "Bom" | "Razoável";
};

/** Estado de um fluxo multi-turno em andamento (coleta de dados / confirmação). */
export type PendingState =
  | null
  | { type: "confirm_delete"; itemId: string; title: string }
  | { type: "pick_delete" }
  | { type: "ask_city" }
  | { type: "publish"; step: "title" | "type" | "price" | "category" | "condition" | "confirm"; draft: PublishDraft };

export type BotReply = {
  text: string;
  quickReplies?: QuickReply[];
  offers?: OfferSummary[];
};

export type EngineResult = {
  replies: BotReply[];
  pending: PendingState;
};
