/**
 * ChatListScreen.tsx
 * Lista de conversas ativas do usuário no ReUse.
 *
 * UI/UX mobile aplicados:
 *  - Avatar com emoji e badge de mensagens não lidas
 *  - Preview da última mensagem truncado
 *  - Horário da mensagem formatado
 *  - Estado vazio quando não há conversas
 *  - Pull to refresh
 *  - Swipe indicator visual (ícone de lixo/arquivar)
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ListRenderItem,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, SlideInRight } from "react-native-reanimated";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { CompositeScreenProps } from "@react-navigation/native";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { TabParamList, RootStackParamList } from "../navigation/types";
import { MOCK_CONVERSATIONS, type ChatConversation } from "../data/mockData";

type Props = CompositeScreenProps<
  BottomTabScreenProps<TabParamList, "Messages">,
  NativeStackScreenProps<RootStackParamList>
>;

export function ChatListScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [conversations, setConversations] = useState(MOCK_CONVERSATIONS);
  const [refreshing, setRefreshing] = useState(false);

  async function onRefresh() {
    setRefreshing(true);
    await new Promise((r) => setTimeout(r, 800));
    setRefreshing(false);
  }

  const totalUnread = conversations.reduce((sum, c) => sum + c.unreadCount, 0);

  const renderItem: ListRenderItem<ChatConversation> = ({ item, index }) => (
    <Animated.View entering={SlideInRight.delay(index * 70).duration(400)}>
      <TouchableOpacity
        style={styles.conversationRow}
        onPress={() =>
          (navigation as any).navigate("Chat", {
            conversationId: item.id,
            participantName: item.participantName,
            participantAvatar: item.participantAvatar,
            itemTitle: item.itemTitle,
          })
        }
        activeOpacity={0.7}
      >
        {/* Avatar */}
        <View style={styles.avatarWrap}>
          <View style={styles.avatar}>
            <Text style={{ fontSize: 28 }}>{item.participantAvatar}</Text>
          </View>
          {item.unreadCount > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadBadgeText}>{item.unreadCount}</Text>
            </View>
          )}
        </View>

        {/* Info da conversa */}
        <View style={styles.convInfo}>
          <View style={styles.convTop}>
            <Text style={[styles.convName, item.unreadCount > 0 && styles.convNameUnread]}>
              {item.participantName}
            </Text>
            <Text style={[styles.convTime, item.unreadCount > 0 && styles.convTimeUnread]}>
              {item.lastMessageTime}
            </Text>
          </View>
          <Text style={styles.convItem} numberOfLines={1}>
            📦 {item.itemTitle}
          </Text>
          <Text
            style={[styles.convLastMsg, item.unreadCount > 0 && styles.convLastMsgUnread]}
            numberOfLines={1}
          >
            {item.lastMessage}
          </Text>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <Text style={styles.headerTitle}>Mensagens</Text>
        {totalUnread > 0 && (
          <View style={styles.headerBadge}>
            <Text style={styles.headerBadgeText}>{totalUnread} novas</Text>
          </View>
        )}
      </Animated.View>

      {conversations.length === 0 ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>💬</Text>
          <Text style={styles.emptyTitle}>Sem mensagens ainda</Text>
          <Text style={styles.emptySub}>
            Quando você entrar em contato com um anunciante ou receber uma mensagem, ela aparecerá aqui.
          </Text>
        </View>
      ) : (
        <FlatList
          data={conversations}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#0D5C3D" />
          }
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          ListHeaderComponent={
            <Animated.Text
              entering={FadeInDown.delay(100).duration(400)}
              style={styles.listHeader}
            >
              Suas conversas sobre itens do marketplace
            </Animated.Text>
          }
          contentContainerStyle={{ paddingBottom: 24 }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAF9" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  headerBadge: {
    backgroundColor: "#DCFCE7",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  headerBadgeText: { fontSize: 12, fontWeight: "700", color: "#16A34A" },
  listHeader: {
    fontSize: 13,
    color: "#64748B",
    paddingHorizontal: 20,
    paddingVertical: 12,
    textAlign: "center",
  },
  conversationRow: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 14,
  },
  avatarWrap: { position: "relative" },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#E8F5F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#D1FAE5",
  },
  unreadBadge: {
    position: "absolute",
    top: -2,
    right: -2,
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#0D5C3D",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
    paddingHorizontal: 4,
  },
  unreadBadgeText: { fontSize: 10, fontWeight: "800", color: "#FFFFFF" },
  convInfo: { flex: 1 },
  convTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 2,
  },
  convName: { fontSize: 15, fontWeight: "500", color: "#0F172A" },
  convNameUnread: { fontWeight: "800" },
  convTime: { fontSize: 12, color: "#94A3B8" },
  convTimeUnread: { color: "#0D5C3D", fontWeight: "700" },
  convItem: { fontSize: 11, color: "#94A3B8", marginBottom: 3 },
  convLastMsg: { fontSize: 13, color: "#64748B" },
  convLastMsgUnread: { color: "#0F172A", fontWeight: "600" },
  separator: { height: 1, backgroundColor: "#F1F5F9", marginLeft: 90 },
  emptyState: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyEmoji: { fontSize: 56, marginBottom: 16 },
  emptyTitle: { fontSize: 18, fontWeight: "700", color: "#0F172A", marginBottom: 8 },
  emptySub: { fontSize: 14, color: "#64748B", textAlign: "center", lineHeight: 21 },
});
