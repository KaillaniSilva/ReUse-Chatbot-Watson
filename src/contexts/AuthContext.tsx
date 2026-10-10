/**
 * AuthContext.tsx
 * Contexto global de autenticação do ReUse.
 *
 * Expõe:
 *  - session      — dados da sessão ativa (ou null)
 *  - isLoading    — true enquanto verifica a sessão salva no startup
 *  - login()      — autentica e cria sessão
 *  - register()   — cadastra e cria sessão
 *  - logout()     — encerra sessão e limpa AsyncStorage
 */

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  type ReactNode,
} from "react";
import {
  getSession,
  login as authLogin,
  register as authRegister,
  logout as authLogout,
  type Session,
} from "../services/auth";

type AuthContextType = {
  session: Session | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<Session>;
  register: (
    name: string,
    email: string,
    city: string,
    password: string
  ) => Promise<Session>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Verifica sessão persistida no AsyncStorage ao iniciar o app
    getSession()
      .then((s) => setSession(s))
      .finally(() => setIsLoading(false));
  }, []);

  async function login(email: string, password: string): Promise<Session> {
    const s = await authLogin(email, password);
    setSession(s);
    return s;
  }

  async function register(
    name: string,
    email: string,
    city: string,
    password: string
  ): Promise<Session> {
    const s = await authRegister(name, email, city, password);
    setSession(s);
    return s;
  }

  async function logout(): Promise<void> {
    await authLogout();
    setSession(null);
  }

  return (
    <AuthContext.Provider value={{ session, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth precisa estar dentro de <AuthProvider>");
  return ctx;
}
