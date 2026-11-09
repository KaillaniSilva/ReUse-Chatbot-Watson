"use client";

import { useEffect } from "react";

/* eslint-disable @typescript-eslint/no-explicit-any */
type ChatInstance = {
  updateLocale: (l: string) => Promise<void>;
  render: () => Promise<void>;
  on: (h: { type: string; handler: (event: any) => unknown }) => void;
  destroy: () => void;
};

declare global {
  interface Window {
    watsonAssistantChatOptions?: Record<string, unknown>;
    loadWatsonAssistantChat?: (options: Record<string, unknown>) => Promise<ChatInstance>;
  }
}

const integrationID = process.env.NEXT_PUBLIC_IBM_ASSISTANT_INTEGRATION_ID;
const region = process.env.NEXT_PUBLIC_IBM_ASSISTANT_REGION;
const serviceInstanceID = process.env.NEXT_PUBLIC_IBM_ASSISTANT_SERVICE_INSTANCE_ID;
const clientVersion = process.env.NEXT_PUBLIC_IBM_ASSISTANT_WEB_CHAT_VERSION || "latest";

type SessionResponse = {
  identityToken: string | null;
  context: Record<string, unknown>;
};

async function fetchSession(): Promise<SessionResponse> {
  const res = await fetch("/api/assistant/session", { method: "POST", cache: "no-store" });
  return res.json();
}

function loadScript(): Promise<void> {
  if (window.loadWatsonAssistantChat) return Promise.resolve();
  return new Promise((resolve, reject) => {
    const s = document.createElement("script");
    s.src = `https://web-chat.global.assistant.watson.appdomain.cloud/versions/${clientVersion}/WatsonAssistantChatEntry.js`;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Falha ao carregar o Web Chat da IBM"));
    document.head.appendChild(s);
  });
}

/**
 * Web Chat do IBM watsonx Orchestrate. O `key` no layout muda quando o usuário
 * entra/sai, recriando o chat com a identidade nova.
 */
export function WatsonAssistantChat() {
  useEffect(() => {
    if (!integrationID || !region || !serviceInstanceID) return;

    let instance: ChatInstance | null = null;
    let cancelled = false;

    (async () => {
      const session = await fetchSession();
      await loadScript();
      if (cancelled || !window.loadWatsonAssistantChat) return;

      let context = session.context;
      const options: Record<string, unknown> = { integrationID, region, serviceInstanceID, clientVersion };
      if (session.identityToken) options.identityToken = session.identityToken;

      instance = await window.loadWatsonAssistantChat(options);
      if (cancelled) return instance.destroy();

      // Variáveis PÚBLICAS de contexto (o token fica só no payload privado do JWT)
      instance.on({
        type: "pre:send",
        handler: (event) => {
          const skills = (event.data.context ??= {}).skills ??= {};
          const actions = (skills["actions skill"] ??= {});
          actions.skill_variables = { ...(actions.skill_variables ?? {}), ...context };
        },
      });

      // Renova o JWT quando expira
      instance.on({
        type: "identityTokenExpired",
        handler: async (event) => {
          const fresh = await fetchSession();
          context = fresh.context;
          event.identityToken = fresh.identityToken;
        },
      });

      await instance.updateLocale("pt-br");
      await instance.render();
    })().catch((e) => console.error("[WatsonAssistantChat]", e));

    return () => {
      cancelled = true;
      instance?.destroy();
    };
  }, []);

  return null;
}
