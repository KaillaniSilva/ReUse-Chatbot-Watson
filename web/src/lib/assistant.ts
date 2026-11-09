/**
 * Segurança da integração com o IBM watsonx Orchestrate (AI Assistant Builder).
 *
 * - Action token: token curto (HMAC) que identifica o usuário logado. Vai no
 *   payload PRIVADO do Web Chat e volta para as APIs no header X-ReUse-Action-Token.
 * - Extension key: segredo compartilhado com a extensão OpenAPI da IBM
 *   (header X-ReUse-Extension-Key).
 * - Identity JWT: token RS256 que o Web Chat exige quando "Secure your web chat"
 *   está ativo. É assinado com a nossa chave privada; o user_payload é
 *   criptografado com a chave pública da IBM.
 *
 * Nenhum segredo daqui chega ao navegador.
 */
import crypto from "crypto";

const ACTION_TOKEN_TTL_SECONDS = 60 * 60; // 1 hora

function b64url(input: Buffer | string) {
  return Buffer.from(input).toString("base64url");
}

function safeEqual(a: string, b: string) {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  return ba.length === bb.length && crypto.timingSafeEqual(ba, bb);
}

/** Aceita PEM puro ou PEM codificado em base64 (formato usado na Vercel). */
function readPem(value: string | undefined): string | null {
  if (!value) return null;
  const trimmed = value.trim();
  if (trimmed.startsWith("-----BEGIN")) return trimmed.replace(/\\n/g, "\n");
  const decoded = Buffer.from(trimmed, "base64").toString("utf8").trim();
  return decoded.startsWith("-----BEGIN") ? decoded : null;
}

// ─── Action token ─────────────────────────────────────────────────────────

function actionSecret() {
  return process.env.ASSISTANT_ACTION_SECRET || null;
}

export function createActionToken(userId: string) {
  const secret = actionSecret();
  if (!secret) return null;
  const exp = Math.floor(Date.now() / 1000) + ACTION_TOKEN_TTL_SECONDS;
  const body = `v1.${userId}.${exp}`;
  const sig = crypto.createHmac("sha256", secret).update(body).digest("base64url");
  return { token: `${body}.${sig}`, expiresAt: exp };
}

export function verifyActionToken(token: string | null): string | null {
  const secret = actionSecret();
  if (!secret || !token) return null;
  const parts = token.split(".");
  if (parts.length !== 4 || parts[0] !== "v1") return null;
  const [v, userId, exp, sig] = parts;
  const expected = crypto.createHmac("sha256", secret).update(`${v}.${userId}.${exp}`).digest("base64url");
  if (!safeEqual(sig, expected)) return null;
  if (Number(exp) < Math.floor(Date.now() / 1000)) return null;
  return userId;
}

// ─── Autorização das rotas chamadas pela extensão ─────────────────────────

/**
 * Valida X-ReUse-Extension-Key (veio da extensão IBM) e X-ReUse-Action-Token
 * (qual usuário). Retorna o userId ou uma Response de erro pronta.
 */
export function authorizeAssistantRequest(request: Request): { userId: string } | Response {
  const expectedKey = process.env.ASSISTANT_EXTENSION_API_KEY;
  const key = request.headers.get("x-reuse-extension-key");
  if (!expectedKey || !key || !safeEqual(key, expectedKey)) {
    return Response.json({ ok: false, message: "Extensão não autorizada." }, { status: 401 });
  }

  const userId = verifyActionToken(request.headers.get("x-reuse-action-token"));
  if (!userId) {
    return Response.json(
      { ok: false, message: "Sua sessão expirou ou você não está logado. Entre no ReUse e tente de novo." },
      { status: 403 }
    );
  }
  return { userId };
}

// ─── JWT de identidade do Web Chat ────────────────────────────────────────

export function isWebChatSecurityConfigured() {
  return Boolean(readPem(process.env.ASSISTANT_WEB_CHAT_PRIVATE_KEY_BASE64));
}

/** Criptografa o payload privado com a chave pública da IBM (RSA-OAEP, base64). */
function encryptUserPayload(payload: object): string | null {
  const ibmKey = readPem(process.env.ASSISTANT_WEB_CHAT_IBM_PUBLIC_KEY_BASE64);
  if (!ibmKey) return null;
  return crypto
    .publicEncrypt(
      { key: ibmKey, padding: crypto.constants.RSA_PKCS1_OAEP_PADDING },
      Buffer.from(JSON.stringify(payload))
    )
    .toString("base64");
}

export function signIdentityToken(sub: string, privatePayload?: object) {
  const privateKey = readPem(process.env.ASSISTANT_WEB_CHAT_PRIVATE_KEY_BASE64);
  if (!privateKey) return null;

  const now = Math.floor(Date.now() / 1000);
  const claims: Record<string, unknown> = { sub, iss: "reuse", iat: now, exp: now + ACTION_TOKEN_TTL_SECONDS };
  if (privatePayload) {
    const encrypted = encryptUserPayload(privatePayload);
    if (encrypted) claims.user_payload = encrypted;
  }

  const header = b64url(JSON.stringify({ alg: "RS256", typ: "JWT" }));
  const body = b64url(JSON.stringify(claims));
  const signature = crypto.sign("RSA-SHA256", Buffer.from(`${header}.${body}`), privateKey);
  return `${header}.${body}.${b64url(signature)}`;
}
