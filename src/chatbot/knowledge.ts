/**
 * knowledge.ts
 * Base de conhecimento do assistente (intenções, exemplos e respostas).
 *
 * Fonte única da verdade: `data/intents.json`. Ela é usada:
 *  - aqui, pelo NLU local (modo offline);
 *  - por `chatbot/watson/generate-skill.js`, que gera o arquivo de skill
 *    para importar no IBM Watson Assistant.
 */

import data from "./data/intents.json";
import type { QuickReply } from "./types";

export type IntentDef = {
  name: string;
  kind: "smalltalk" | "help" | "task";
  action?: string;
  keywords: string[];
  examples: string[];
  answer: string;
  quickReplies?: string[];
};

export const WELCOME_TEXT: string = data.welcome;
export const FALLBACK_TEXT: string = data.fallback;
export const INTENTS = data.intents as IntentDef[];

export function getIntent(name: string | null | undefined): IntentDef | undefined {
  if (!name) return undefined;
  return INTENTS.find((i) => i.name === name);
}

export function toQuickReplies(labels?: string[]): QuickReply[] | undefined {
  return labels?.map((l) => ({ label: l, text: l }));
}

export const DEFAULT_QUICK_REPLIES: QuickReply[] = [
  { label: "Pausar minhas ofertas", text: "Pausar minhas ofertas" },
  { label: "Cadastrar um item", text: "Quero cadastrar um item agora" },
  { label: "Como funciona a troca?", text: "Como funciona a troca?" },
  { label: "Meu progresso", text: "Qual é o meu progresso?" },
];
