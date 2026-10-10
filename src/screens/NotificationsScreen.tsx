/**
 * NotificationsScreen.tsx
 * Tela de notificações do ReUse.
 *
 * UI/UX:
 *  - Lista de notificações com ícones por tipo
 *  - Badge de não lida
 *  - Estado vazio
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ListRenderItem,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, SlideInRight } from "react-native-reanimated";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";

type Props = NativeStackScreenProps<RootStackParamList, "Notifications">;

type Notification = {
  id: string;
  type: "message" | "favorite" | "system" | "gamification";
  title: string;
  body: string;
  time: string;
  read: boolean;
  emoji: string;
};

const MOCK_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "message",
    title: "Nova mensagem de Ana Lima",
    body: 'Ainda está disponível o sofá?',
    time: "10 min",
    read: false,
    emoji: "💬",
  },
  {
    id: "n2",
    type: "gamification",
    title: "Você subiu de nível! 🎉",
    body: "Parabéns! Você alcançou o Nível 2: Broto",
    time: "2h",
    read: false,
    emoji: "🏆",
  },
  {
    id: "n3",
    type: "favorite",
    title: "Seu item foi favoritado",
    body: '3 pessoas salvaram "Sofá 3 lugares" nos favoritos.',
    time: "5h",
    read: true,
    emoji: "❤️",
  },
  {
    id: "n4",
    type: "system",
    title: "Complete seu perfil",
    body: "Adicione uma foto e bio para receber mais contatos!",
    time: "1d",
    read: true,
    emoji: "👤",
  },
  {
    id: "n5",
    type: "message",
    title: "Felipe Costa quer trocar",
    body: 'Aceito troca por Samsung Galaxy S21?',
    time: "2d",
    read: true,
    emoji: "🔄",
  },
];

export function NotificationsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => !n.read).length;

  function markAllRead() {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  const renderItem: ListRenderItem<Notification> = ({ item, index }) => (
    <Animated.View entering={SlideInRight.delay(index * 60).duration(400)}>
      <TouchableOpacity
        style={[styles.notifRow, !item.read && styles.notifRowUnread]}
        onPress={() =>
          setNotifications((prev) =>
            prev.map((n) => (n.id === item.id ? { ...n, read: true } : n))
          )
        }
      >
        <View style={[styles.notifIconWrap, !item.read && styles.notifIconWrapUnread]}>
          <Text style={{ fontSize: 22 }}>{item.emoji}</Text>
        </View>
        <View style={styles.notifInfo}>
          <Text style={[styles.notifTitle, !item.read && styles.notifTitleUnread]}>
            {item.title}
          </Text>
          <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
          <Text style={styles.notifTime}>{item.time} atrás</Text>
        </View>
        {!item.read && <View style={styles.unreadDot} />}
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Notificações</Text>
          {unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{unreadCount} novas</Text>
            </View>
          )}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead}>
            <Text style={styles.markReadBtn}>Marcar lidas</Text>
          </TouchableOpacity>
        )}
      </Animated.View>

      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAF9" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 12,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: "#F8FAF9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  backBtnText: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  headerCenter: { flex: 1, flexDirection: "row", alignItems: "center", gap: 8 },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  unreadBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
  },
  unreadBadgeText: { fontSize: 11, fontWeight: "700", color: "#16A34A" },
  markReadBtn: { fontSize: 13, color: "#0D5C3D", fontWeight: "600" },
  notifRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  notifRowUnread: { backgroundColor: "#F0FDF4" },
  notifIconWrap: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: "#F8FAF9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  notifIconWrapUnread: { backgroundColor: "#DCFCE7", borderColor: "#BBF7D0" },
  notifInfo: { flex: 1 },
  notifTitle: { fontSize: 14, fontWeight: "500", color: "#0F172A", marginBottom: 3 },
  notifTitleUnread: { fontWeight: "700" },
  notifBody: { fontSize: 13, color: "#64748B", lineHeight: 18, marginBottom: 4 },
  notifTime: { fontSize: 11, color: "#94A3B8" },
  unreadDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: "#0D5C3D",
    marginTop: 6,
  },
  separator: { height: 1, backgroundColor: "#F1F5F9" },
});
