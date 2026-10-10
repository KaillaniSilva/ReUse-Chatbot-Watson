/**
 * watsonClient.ts
 * Cliente do IBM Watson Assistant (via proxy) com fallback para NLU local.
 *
 * Contrato com o proxy (chatbot/proxy/server.js):
 *   POST {PROXY}/chat   body: { text, context? }
 *   resposta: o JSON do endpoint `message` do Watson Assistant v2
 *             { output: { generic, intents, entities, user_defined }, context }
 *
 * O Watson indica a ação a executar em `output.user_defined.action`
 * (configurado nos nós do dialog). Se não houver, usamos o nome da
 * intenção de maior confiança.
 */

import { WATSON_PROXY_URL, WATSON_TIMEOUT_MS, MIN_CONFIDENCE } from "./config";
import { classifyLocal } from "./localNlu";
import { getIntent } from "./knowledge";
import type { NluResult, QuickReply } from "./types";

type WatsonGeneric =
  | { response_type: "text"; text: string }
  | {
      response_type: "option";
      title?: string;
      options: { label: string; value?: { input?: { text?: string } } }[];
    }
  | { response_type: string };

type WatsonResponse = {
  output?: {
    generic?: WatsonGeneric[];
    intents?: { intent: string; confidence: number }[];
    user_defined?: { action?: string } & Record<string, unknown>;
  };
  context?: unknown;
};

async function callWatson(text: string, context: unknown): Promise<NluResult> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), WATSON_TIMEOUT_MS);

  try {
    const res = await fetch(`${WATSON_PROXY_URL}/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, context }),
      signal: controller.signal,
    });
    if (!res.ok) throw new Error(`Proxy respondeu ${res.status}`);
    const data = (await res.json()) as WatsonResponse;

    const generic = data.output?.generic ?? [];
    const textParts: string[] = [];
    let quickReplies: QuickReply[] | undefined;

    for (const g of generic) {
      if (g.response_type === "text" && "text" in g && g.text) {
        textParts.push(g.text);
      }
      if (g.response_type === "option" && "options" in g) {
        quickReplies = g.options.map((o) => ({
          label: o.label,
          text: o.value?.input?.text ?? o.label,
        }));
      }
    }

    const top = data.output?.intents?.[0];
    const action = data.output?.user_defined?.action;
    const intent = top?.intent ?? null;

    return {
      intent,
      confidence: top?.confidence ?? (textParts.length ? 1 : 0),
      reply: textParts.join("\n\n") || undefined,
      quickReplies,
      action,
      context: data.context,
      source: "watson",
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Interpreta a frase do usuário. Tenta o Watson primeiro; em qualquer falha
 * (sem proxy configurado, offline, timeout, erro 5xx) cai para o NLU local.
 */
export async function understand(
  text: string,
  context: unknown
): Promise<NluResult> {
  if (WATSON_PROXY_URL) {
    try {
      const result = await callWatson(text, context);
      // Se o Watson não reconheceu nada, tenta o NLU local antes de desistir
      const recognized =
        !!result.action || (result.intent && result.confidence >= MIN_CONFIDENCE);
      if (recognized || result.reply) return result;
    } catch (e) {
      console.warn("[assistente] Watson indisponível, usando NLU local:", e);
    }
  }
  return classifyLocal(text);
}

/** Descobre qual ação de tarefa executar para um resultado de NLU. */
export function resolveAction(nlu: NluResult): string | null {
  if (nlu.action) return nlu.action;
  const def = getIntent(nlu.intent);
  return def?.kind === "task" ? def.action ?? def.name : null;
}
