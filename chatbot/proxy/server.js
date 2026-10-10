/**
 * ReUse — proxy do IBM Watson Assistant
 *
 * Por que existe: a API key do Watson não pode ficar dentro do app mobile
 * (qualquer pessoa extrairia do bundle). O app chama este servidor, que
 * guarda as credenciais em variáveis de ambiente.
 *
 * Requisitos: Node 18+ (usa fetch nativo). Nenhuma dependência.
 *
 * Variáveis de ambiente (veja chatbot/proxy/.env.example):
 *   WATSON_API_KEY        API key do serviço Watson Assistant (IBM Cloud)
 *   WATSON_URL            URL da instância, ex.: https://api.us-south.assistant.watson.cloud.ibm.com/instances/<id>
 *   WATSON_ASSISTANT_ID   ID do assistant/environment (Assistant settings → Assistant IDs and API details)
 *   WATSON_VERSION        (opcional) versão da API, padrão 2023-06-15
 *   PORT                  (opcional) padrão 3001
 *
 * Rotas:
 *   GET  /health  → { ok: true }
 *   POST /chat    → body { text, context? } → resposta do Watson (message stateless)
 */

const http = require("http");
const fs = require("fs");
const path = require("path");

// Carrega .env local (sem dependência externa)
const envPath = path.join(__dirname, ".env");
if (fs.existsSync(envPath)) {
  for (const line of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
    }
  }
}

const {
  WATSON_API_KEY,
  WATSON_URL,
  WATSON_ASSISTANT_ID,
  WATSON_VERSION = "2023-06-15",
  PORT = "3001",
} = process.env;

if (!WATSON_API_KEY || !WATSON_URL || !WATSON_ASSISTANT_ID) {
  console.error(
    "Faltam variáveis: WATSON_API_KEY, WATSON_URL e WATSON_ASSISTANT_ID. Veja chatbot/proxy/.env.example"
  );
  process.exit(1);
}

// ─── Token IAM (cache em memória) ─────────────────────────────────────────
let iam = { token: null, expiresAt: 0 };

async function getIamToken() {
  if (iam.token && Date.now() < iam.expiresAt - 60_000) return iam.token;

  const res = await fetch("https://iam.cloud.ibm.com/identity/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body: new URLSearchParams({
      grant_type: "urn:ibm:params:oauth:grant-type:apikey",
      apikey: WATSON_API_KEY,
    }),
  });
  if (!res.ok) throw new Error(`IAM ${res.status}: ${await res.text()}`);
  const data = await res.json();
  iam = { token: data.access_token, expiresAt: Date.now() + data.expires_in * 1000 };
  return iam.token;
}

// ─── Mensagem (API v2 stateless: o contexto trafega no corpo) ─────────────
async function sendToWatson(text, context) {
  const token = await getIamToken();
  const url = `${WATSON_URL.replace(/\/+$/, "")}/v2/assistants/${WATSON_ASSISTANT_ID}/message?version=${WATSON_VERSION}`;

  const body = {
    input: {
      message_type: "text",
      text,
      options: { return_context: true },
    },
  };
  if (context) body.context = context;

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(body),
  });
  const payload = await res.text();
  if (!res.ok) throw new Error(`Watson ${res.status}: ${payload}`);
  return JSON.parse(payload);
}

// ─── HTTP ─────────────────────────────────────────────────────────────────
function send(res, status, obj) {
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
  });
  res.end(JSON.stringify(obj));
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") return send(res, 204, {});
  if (req.method === "GET" && req.url === "/health") return send(res, 200, { ok: true });

  if (req.method === "POST" && req.url === "/chat") {
    let raw = "";
    req.on("data", (c) => {
      raw += c;
      if (raw.length > 20_000) req.destroy(); // limite defensivo
    });
    req.on("end", async () => {
      try {
        const { text, context } = JSON.parse(raw || "{}");
        if (typeof text !== "string" || !text.trim()) {
          return send(res, 400, { error: "Campo 'text' é obrigatório" });
        }
        const result = await sendToWatson(text.slice(0, 500), context);
        send(res, 200, result);
      } catch (e) {
        console.error(e.message);
        send(res, 502, { error: "Falha ao consultar o Watson Assistant" });
      }
    });
    return;
  }

  send(res, 404, { error: "Rota não encontrada" });
});

server.listen(Number(PORT), () => {
  console.log(`ReUse Watson proxy ouvindo em http://localhost:${PORT}`);
});
