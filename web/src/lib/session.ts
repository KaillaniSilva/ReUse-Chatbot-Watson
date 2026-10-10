import { cookies } from "next/headers";
import crypto from "crypto";

const COOKIE_NAME = "reuse_session";
function getSecret() {
  const secret = process.env.AUTH_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === "production") {
    throw new Error("AUTH_SECRET não configurado");
  }
  return "dev-secret-change-me";
}
const MAX_AGE_SECONDS = 60 * 60 * 24 * 7; // 7 dias

function sign(value: string) {
  const hmac = crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
  return `${value}.${hmac}`;
}

function verify(signed: string): string | null {
  const separatorIndex = signed.lastIndexOf(".");
  if (separatorIndex === -1) return null;
  const value = signed.slice(0, separatorIndex);
  const signature = signed.slice(separatorIndex + 1);
  const expected = crypto.createHmac("sha256", getSecret()).update(value).digest("hex");
  const a = Buffer.from(signature);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return value;
}

export async function createSession(userId: string) {
  const store = await cookies();
  store.set(COOKIE_NAME, sign(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  const raw = store.get(COOKIE_NAME)?.value;
  if (!raw) return null;
  return verify(raw);
}
