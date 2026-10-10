/**
 * auth.ts
 * Serviço de autenticação e sessões do ReUse.
 *
 * Fluxo:
 *  login / register → gera token de sessão → persiste no AsyncStorage
 *  SplashScreen chama getSession() → redireciona direto ao app se válida
 *  logout → remove sessão e limpa dados locais
 *
 * A sessão expira em SESSION_TTL_DAYS dias sem necessidade de novo login.
 */

import AsyncStorage from "@react-native-async-storage/async-storage";
import { saveUserProfile, clearAllStorage } from "./storage";

const SESSION_KEY = "@reuse:session";
const SESSION_TTL_DAYS = 7;
const SESSION_TTL_MS = SESSION_TTL_DAYS * 24 * 60 * 60 * 1000;

export type Session = {
  token: string;
  userId: string;
  email: string;
  name: string;
  createdAt: string;
  expiresAt: string;
};

function generateToken(): string {
  const rand = Math.random().toString(36).slice(2, 10);
  const time = Date.now().toString(36);
  return `rt_${rand}${time}`;
}

export async function login(email: string, _password: string): Promise<Session> {
  const name = email.split("@")[0].replace(/[^a-zA-ZÀ-ú]/g, " ").trim() || "Usuário";
  const capitalizedName = name.charAt(0).toUpperCase() + name.slice(1);

  const session: Session = {
    token: generateToken(),
    userId: `user_${Date.now()}`,
    email: email.trim().toLowerCase(),
    name: capitalizedName,
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };

  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));

  await saveUserProfile({
    id: session.userId,
    email: session.email,
    name: capitalizedName,
    level: 1,
    xp: 0,
    streak: 1,
    itemsListed: 0,
    tradesCompleted: 0,
    donationsGiven: 0,
  });

  return session;
}

export async function register(
  name: string,
  email: string,
  city: string,
  _password: string
): Promise<Session> {
  const userId = `user_${Date.now()}`;

  const session: Session = {
    token: generateToken(),
    userId,
    email: email.trim().toLowerCase(),
    name: name.trim(),
    createdAt: new Date().toISOString(),
    expiresAt: new Date(Date.now() + SESSION_TTL_MS).toISOString(),
  };

  await AsyncStorage.setItem(SESSION_KEY, JSON.stringify(session));

  await saveUserProfile({
    id: userId,
    name: name.trim(),
    email: email.trim().toLowerCase(),
    city: city.trim(),
    bio: "",
    avatarUri: null,
    level: 1,
    xp: 100,
    streak: 0,
    itemsListed: 0,
    tradesCompleted: 0,
    donationsGiven: 0,
    createdAt: new Date().toISOString(),
  });

  return session;
}

export async function getSession(): Promise<Session | null> {
  try {
    const raw = await AsyncStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const session: Session = JSON.parse(raw);
    if (new Date(session.expiresAt) < new Date()) {
      await AsyncStorage.removeItem(SESSION_KEY);
      return null;
    }
    return session;
  } catch {
    return null;
  }
}

export async function logout(): Promise<void> {
  await clearAllStorage();
}

export async function isAuthenticated(): Promise<boolean> {
  const session = await getSession();
  return session !== null;
}

export function formatExpiresIn(expiresAt: string): string {
  const ms = new Date(expiresAt).getTime() - Date.now();
  const days = Math.floor(ms / (1000 * 60 * 60 * 24));
  if (days > 1) return `${days} dias`;
  const hours = Math.floor(ms / (1000 * 60 * 60));
  if (hours > 0) return `${hours} horas`;
  return "menos de 1 hora";
}
