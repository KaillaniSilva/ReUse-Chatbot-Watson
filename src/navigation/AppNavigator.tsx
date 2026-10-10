/**
 * AppNavigator.tsx
 * Navegador de abas inferiores do ReUse — exibido após o login.
 *
 * Abas:
 *  1. Marketplace  — feed de itens disponíveis
 *  2. Publicar     — botão central destacado (+) para novo item
 *  3. Mensagens    — lista de conversas
 *  4. Perfil       — perfil do usuário logado
 *
 * UI/UX mobile aplicados:
 *  - Aba central (Publicar) com botão circular elevado — padrão FAB-in-tab
 *  - Ícones emoji para identidade visual única
 *  - Badge de mensagens não lidas
 *  - Safe area respeitada via react-native-safe-area-context
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import type { TabParamList } from "./types";
import { MarketplaceScreen } from "../screens/MarketplaceScreen";
import { PostItemScreen } from "../screens/PostItemScreen";
import { ChatListScreen } from "../screens/ChatListScreen";
import { ProfileScreen } from "../screens/ProfileScreen";

const Tab = createBottomTabNavigator<TabParamList>();

// ─── Ícone customizado para cada aba ──────────────────────────────────────────
function TabIcon({
  emoji,
  label,
  focused,
  badge,
}: {
  emoji: string;
  label: string;
  focused: boolean;
  badge?: number;
}) {
  return (
    <View style={[styles.tabIconWrap, focused && styles.tabIconWrapFocused]}>
      <View style={{ position: "relative" }}>
        <Text style={[styles.tabEmoji, focused && styles.tabEmojiFocused]}>{emoji}</Text>
        {badge && badge > 0 ? (
          <View style={styles.tabBadge}>
            <Text style={styles.tabBadgeText}>{badge > 9 ? "9+" : badge}</Text>
          </View>
        ) : null}
      </View>
      <Text style={[styles.tabLabel, focused && styles.tabLabelFocused]}>{label}</Text>
    </View>
  );
}

// ─── Botão central customizado (Publicar) ─────────────────────────────────────
function PostButton({ focused }: { focused: boolean }) {
  return (
    <View style={styles.postBtnOuter}>
      <View style={[styles.postBtnInner, focused && styles.postBtnFocused]}>
        <Text style={styles.postBtnText}>+</Text>
      </View>
    </View>
  );
}

/** Botão flutuante que abre o assistente virtual de qualquer aba. */
function AssistantFab() {
  const navigation = useNavigation<any>();
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => navigation.navigate("Assistant")}
      activeOpacity={0.85}
      accessibilityLabel="Abrir assistente virtual"
    >
      <Text style={styles.fabEmoji}>🤖</Text>
    </TouchableOpacity>
  );
}

export function AppNavigator() {
  return (
    <View style={{ flex: 1 }}>
      <Tabs />
      <AssistantFab />
    </View>
  );
}

function Tabs() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: styles.tabBar,
        tabBarShowLabel: false,
        tabBarHideOnKeyboard: true,
      }}
    >
      <Tab.Screen
        name="Marketplace"
        component={MarketplaceScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="🏠" label="Início" focused={focused} />
          ),
        }}
      />

      <Tab.Screen
        name="PostItem"
        component={PostItemScreen}
        options={{
          tabBarIcon: ({ focused }) => <PostButton focused={focused} />,
        }}
      />

      <Tab.Screen
        name="Messages"
        component={ChatListScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="💬" label="Mensagens" focused={focused} badge={3} />
          ),
        }}
      />

      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon emoji="👤" label="Perfil" focused={focused} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

const styles = StyleSheet.create({
  // Botão flutuante do assistente
  fab: {
    position: "absolute",
    right: 16,
    bottom: 88,
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#0D5C3D",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    shadowColor: "#0D5C3D",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 8,
  },
  fabEmoji: { fontSize: 26 },

  // Tab bar
  tabBar: {
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    height: 72,
    paddingBottom: 0,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 12,
  },

  // Ícone padrão
  tabIconWrap: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 8,
    gap: 3,
    minWidth: 64,
  },
  tabIconWrapFocused: {},
  tabEmoji: { fontSize: 24, opacity: 0.5 },
  tabEmojiFocused: { opacity: 1 },
  tabLabel: { fontSize: 10, color: "#94A3B8", fontWeight: "500" },
  tabLabelFocused: { color: "#0D5C3D", fontWeight: "700" },
  tabBadge: {
    position: "absolute",
    top: -4,
    right: -8,
    minWidth: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: "#EF4444",
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: "#FFFFFF",
  },
  tabBadgeText: { fontSize: 8, fontWeight: "800", color: "#FFFFFF" },

  // Botão central (+)
  postBtnOuter: {
    alignItems: "center",
    justifyContent: "center",
    marginTop: -20,
  },
  postBtnInner: {
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: "#0D5C3D",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0D5C3D",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 10,
    borderWidth: 3,
    borderColor: "#FFFFFF",
  },
  postBtnFocused: {
    backgroundColor: "#052E16",
    shadowOpacity: 0.5,
  },
  postBtnText: { fontSize: 30, fontWeight: "300", color: "#FFFFFF", lineHeight: 36 },
});
