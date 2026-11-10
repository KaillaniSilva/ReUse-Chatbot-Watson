"use client";

import { useEffect } from "react";

/**
 * Chat do agente "ReUse Assistente" (IBM watsonx Orchestrate — Embedded agent).
 * Os valores vêm de Deploy → Live → Embedded agent e são públicos.
 */
const orchestrationID = process.env.NEXT_PUBLIC_WXO_ORCHESTRATION_ID;
const hostURL = process.env.NEXT_PUBLIC_WXO_HOST_URL;
const agentId = process.env.NEXT_PUBLIC_WXO_AGENT_ID;
const agentEnvironmentId = process.env.NEXT_PUBLIC_WXO_AGENT_ENVIRONMENT_ID;

const ROOT_ID = "wxo-chat-root";

declare global {
  interface Window {
    wxOConfiguration?: Record<string, unknown>;
    wxoLoader?: { init: () => void };
  }
}

export function OrchestrateChat() {
  useEffect(() => {
    if (!orchestrationID || !hostURL || !agentId || !agentEnvironmentId) return;
    if (document.getElementById("wxo-loader")) return; // já carregado

    window.wxOConfiguration = {
      orchestrationID,
      hostURL,
      rootElementID: ROOT_ID,
      chatOptions: { agentId, agentEnvironmentId },
    };

    const script = document.createElement("script");
    script.id = "wxo-loader";
    script.src = `${hostURL}/wxochat/wxoLoader.js?embed=true`;
    script.addEventListener("load", () => window.wxoLoader?.init());
    document.head.appendChild(script);
  }, []);

  return <div id={ROOT_ID} />;
}
