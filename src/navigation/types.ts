/**
 * types.ts
 * Definição dos tipos de navegação do ReUse.
 *
 * RootStackParamList — Stack principal (auth + modais)
 * TabParamList       — Abas do bottom tab navigator
 */

// ─── Stack raiz (auth flow + telas modais) ────────────────────────────────────
export type RootStackParamList = {
  Splash: undefined;
  Onboarding: undefined;
  Login: undefined;
  Register: undefined;
  MainApp: undefined;

  // Telas modais / push acessadas de qualquer aba
  ItemDetail: { itemId: string };
  Chat: {
    conversationId: string;
    participantName: string;
    participantAvatar: string;
    itemTitle: string;
  };
  EditProfile: undefined;
  Favorites: undefined;
  Settings: undefined;
  About: undefined;
  Gamification: undefined;
  Notifications: undefined;
  Assistant: undefined;
};

// ─── Bottom Tab Navigator ─────────────────────────────────────────────────────
export type TabParamList = {
  Marketplace: undefined;
  PostItem: undefined;
  Messages: undefined;
  Profile: undefined;
};
