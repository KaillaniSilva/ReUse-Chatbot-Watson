/**
 * useAssistant.ts
 * Hook que orquestra a conversa: Watson/NLU → tarefa → respostas na tela.
 */

import { useCallback, useRef, useState } from "react";
import { understand, resolveAction } from "./watsonClient";
import { runTask, continuePending, type EngineDeps } from "./assistantEngine";
import {
  DEFAULT_QUICK_REPLIES,
  FALLBACK_TEXT,
  WELCOME_TEXT,
  getIntent,
  toQuickReplies,
} from "./knowledge";
import type {
  AssistantMessage,
  BotReply,
  EngineResult,
  PendingState,
} from "./types";

let counter = 0;
const nextId = () => `m_${Date.now()}_${counter++}`;

const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));

export function useAssistant(deps: EngineDeps) {
  const [messages, setMessages] = useState<AssistantMessage[]>(() => [
    {
      id: nextId(),
      from: "bot",
      text: WELCOME_TEXT,
      quickReplies: DEFAULT_QUICK_REPLIES,
    },
  ]);
  const [typing, setTyping] = useState(false);
  const [lastSource, setLastSource] = useState<"watson" | "local" | null>(null);

  const pendingRef = useRef<PendingState>(null);
  const contextRef = useRef<unknown>(undefined);
  const busyRef = useRef(false);

  const pushBot = useCallback(
    (replies: BotReply[], source?: "watson" | "local") => {
      setMessages((prev) => [
        ...prev,
        ...replies.map<AssistantMessage>((r) => ({
          id: nextId(),
          from: "bot",
          text: r.text,
          quickReplies: r.quickReplies,
          offers: r.offers,
          source,
        })),
      ]);
    },
    []
  );

  const send = useCallback(
    async (rawText: string) => {
      const text = rawText.trim();
      if (!text || busyRef.current) return;
      busyRef.current = true;

      setMessages((prev) => [...prev, { id: nextId(), from: "user", text }]);
      setTyping(true);

      try {
        const started = Date.now();
        let replies: BotReply[] = [];
        let source: "watson" | "local" | undefined;

        if (pendingRef.current) {
          const result: EngineResult = await continuePending(pendingRef.current, text);
          replies = result.replies;
          pendingRef.current = result.pending;
        } else {
          const nlu = await understand(text, contextRef.current);
          source = nlu.source;
          setLastSource(nlu.source);
          if (nlu.context) contextRef.current = nlu.context;

          const action = resolveAction(nlu);
          const def = getIntent(nlu.intent);

          if (nlu.reply) {
            replies.push({
              text: nlu.reply,
              quickReplies: action
                ? undefined
                : nlu.quickReplies ?? toQuickReplies(def?.quickReplies),
            });
          } else if (!action) {
            replies.push({ text: FALLBACK_TEXT, quickReplies: DEFAULT_QUICK_REPLIES });
          }

          if (action) {
            const result = await runTask(action, text, deps);
            replies.push(...result.replies);
            pendingRef.current = result.pending;
          }
        }

        // Pequeno atraso para o indicador "digitando" não piscar
        const elapsed = Date.now() - started;
        if (elapsed < 500) await wait(500 - elapsed);

        pushBot(replies, source);
      } catch (e) {
        console.warn("[assistente] erro ao processar mensagem:", e);
        pushBot([
          {
            text: "Ops, algo deu errado por aqui. Pode tentar de novo?",
            quickReplies: DEFAULT_QUICK_REPLIES,
          },
        ]);
      } finally {
        setTyping(false);
        busyRef.current = false;
      }
    },
    [deps, pushBot]
  );

  return { messages, typing, send, lastSource };
}
