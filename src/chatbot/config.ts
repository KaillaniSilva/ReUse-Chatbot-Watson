/**
 * config.ts
 * Configuração do assistente virtual.
 *
 * O app NUNCA fala direto com o IBM Watson (isso exporia a API key no
 * bundle do aplicativo). Ele conversa com o proxy em `chatbot/proxy`, que
 * guarda as credenciais e repassa a mensagem ao Watson Assistant.
 *
 * Defina em um arquivo `.env` na raiz (veja `.env.example`):
 *   EXPO_PUBLIC_WATSON_PROXY_URL=http://192.168.0.10:3001
 *
 * Sem essa variável (ou se o proxy estiver fora do ar) o app usa o
 * motor de NLU local, que implementa as mesmas intenções do Watson —
 * assim o assistente continua funcionando offline / em demonstrações.
 */

export const WATSON_PROXY_URL: string = (
  process.env.EXPO_PUBLIC_WATSON_PROXY_URL ?? ""
).replace(/\/+$/, "");

export const WATSON_TIMEOUT_MS = 8000;

/** Abaixo disso a frase é tratada como "não entendi" */
export const MIN_CONFIDENCE = 0.45;

