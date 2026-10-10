/**
 * AssistantScreen.tsx
 * Chat com o assistente virtual "Reuso" (IBM Watson Assistant).
 *
 * Duas frentes:
 *  1. Tarefas — o assistente executa ações no app (pausar/reativar ofertas,
 *     cadastrar item, excluir, alterar cidade, notificações...).
 *  2. Orientação — responde dúvidas com passo a passo.
 *
 * UI/UX: balões, chips de resposta rápida, cartões de ofertas,
 * indicador "digitando", teclado que não cobre o campo de texto.
 */

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInUp } from "react-native-reanimated";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { useAssistant } from "../chatbot/useAssistant";
import type { AssistantMessage, OfferSummary } from "../chatbot/types";

type Props = NativeStackScreenProps<RootStackParamList, "Assistant">;

export function AssistantScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const listRef = useRef<FlatList<AssistantMessage>>(null);
  const [input, setInput] = useState("");

  const deps = useMemo(
    () => ({
      navigate: (route: string, params?: object) =>
        (navigation as any).navigate(route, params),
    }),
    [navigation]
  );
  const { messages, typing, send, lastSource } = useAssistant(deps);

  // Rola até o fim a cada nova mensagem
  useEffect(() => {
    const t = setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 80);
    return () => clearTimeout(t);
  }, [messages.length, typing]);

  // Só a última mensagem do bot exibe as respostas rápidas
  const lastBotId = [...messages].reverse().find((m) => m.from === "bot")?.id;
  const lastIsBot = messages[messages.length - 1]?.from === "bot";

  function submit(text: string) {
    if (!text.trim() || typing) return;
    setInput("");
    send(text);
  }

  const statusLabel =
    lastSource === "watson"
      ? "IBM Watson Assistant"
      : lastSource === "local"
      ? "Modo local (offline)"
      : "Assistente virtual";

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <StatusBar style="light" />

      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          accessibilityLabel="Voltar"
        >
          <Text style={styles.backText}>←</Text>
        </TouchableOpacity>
        <View style={styles.botAvatar}>
          <Text style={{ fontSize: 22 }}>🤖</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Reuso</Text>
          <View style={styles.statusRow}>
            <View style={styles.statusDot} />
            <Text style={styles.headerSub}>{statusLabel}</Text>
          </View>
        </View>
      </View>

      {/* Mensagens */}
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        renderItem={({ item }) => (
          <MessageBubble
            message={item}
            showChips={item.id === lastBotId && lastIsBot && !typing}
            onChip={submit}
          />
        )}
        ListFooterComponent={
          typing ? (
            <View style={[styles.bubbleRow, { justifyContent: "flex-start" }]}>
              <View style={[styles.bubble, styles.botBubble]}>
                <Text style={styles.typingText}>digitando…</Text>
              </View>
            </View>
          ) : null
        }
      />

      {/* Entrada */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, 12) }]}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Digite sua mensagem…"
          placeholderTextColor="#94A3B8"
          returnKeyType="send"
          onSubmitEditing={() => submit(input)}
          editable={!typing}
          multiline={false}
        />
        <TouchableOpacity
          style={[styles.sendBtn, (!input.trim() || typing) && { opacity: 0.4 }]}
          onPress={() => submit(input)}
          disabled={!input.trim() || typing}
          accessibilityLabel="Enviar"
        >
          <Text style={styles.sendText}>➤</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

// ─── Balão de mensagem ──────────────────────────────────────────────────────
function MessageBubble({
  message,
  showChips,
  onChip,
}: {
  message: AssistantMessage;
  showChips: boolean;
  onChip: (text: string) => void;
}) {
  const isUser = message.from === "user";
  return (
    <Animated.View entering={FadeInUp.duration(260)}>
      <View style={[styles.bubbleRow, { justifyContent: isUser ? "flex-end" : "flex-start" }]}>
        <View style={[styles.bubble, isUser ? styles.userBubble : styles.botBubble]}>
          <Text style={[styles.bubbleText, isUser && { color: "#FFFFFF" }]}>
            {message.text}
          </Text>
        </View>
      </View>

      {message.offers && message.offers.length > 0 && (
        <View style={styles.offersWrap}>
          {message.offers.map((o) => (
            <OfferCard key={o.id} offer={o} />
          ))}
        </View>
      )}

      {showChips && message.quickReplies && message.quickReplies.length > 0 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipsRow}
          keyboardShouldPersistTaps="handled"
        >
          {message.quickReplies.map((q) => (
            <TouchableOpacity
              key={q.label}
              style={styles.chip}
              onPress={() => onChip(q.text)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipText}>{q.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      )}
    </Animated.View>
  );
}

function OfferCard({ offer }: { offer: OfferSummary }) {
  const paused = offer.status === "paused";
  return (
    <View style={[styles.offerCard, paused && { opacity: 0.65 }]}>
      <Text style={{ fontSize: 22 }}>{paused ? "⏸️" : "📦"}</Text>
      <View style={{ flex: 1 }}>
        <Text style={styles.offerTitle} numberOfLines={1}>
          {offer.title}
        </Text>
        <Text style={styles.offerMeta}>
          {offer.type === "venda" ? `R$ ${offer.price}` : "Grátis"} · {offer.type}
        </Text>
      </View>
      <View style={[styles.statusPill, paused ? styles.pillPaused : styles.pillActive]}>
        <Text style={[styles.pillText, { color: paused ? "#B45309" : "#166534" }]}>
          {paused ? "Pausada" : "Ativa"}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAF9" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#0D5C3D",
    paddingHorizontal: 16,
    paddingBottom: 14,
  },
  backBtn: { width: 32, height: 32, alignItems: "center", justifyContent: "center" },
  backText: { color: "#FFFFFF", fontSize: 24, fontWeight: "600" },
  botAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E8F5F0",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: { color: "#FFFFFF", fontSize: 17, fontWeight: "800" },
  statusRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  statusDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: "#74C69D" },
  headerSub: { color: "rgba(255,255,255,0.8)", fontSize: 12 },

  listContent: { padding: 16, paddingBottom: 8, gap: 8 },
  bubbleRow: { flexDirection: "row" },
  bubble: {
    maxWidth: "84%",
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  botBubble: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E2EDE7",
  },
  userBubble: { backgroundColor: "#0D5C3D", borderBottomRightRadius: 4 },
  bubbleText: { fontSize: 15, lineHeight: 22, color: "#0F172A" },
  typingText: { fontSize: 14, color: "#64748B", fontStyle: "italic" },

  offersWrap: { marginTop: 8, gap: 8 },
  offerCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#E2EDE7",
    padding: 12,
    maxWidth: "84%",
  },
  offerTitle: { fontSize: 14, fontWeight: "700", color: "#0F172A" },
  offerMeta: { fontSize: 12, color: "#64748B", marginTop: 2 },
  statusPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  pillActive: { backgroundColor: "#DCFCE7" },
  pillPaused: { backgroundColor: "#FEF3C7" },
  pillText: { fontSize: 11, fontWeight: "700" },

  chipsRow: { gap: 8, paddingTop: 10, paddingBottom: 4 },
  chip: {
    borderWidth: 1.5,
    borderColor: "#0D5C3D",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 99,
  },
  chipText: { color: "#0D5C3D", fontSize: 13, fontWeight: "700" },

  inputBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: 10,
    backgroundColor: "#FFFFFF",
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
  },
  input: {
    flex: 1,
    height: 46,
    backgroundColor: "#F1F5F9",
    borderRadius: 23,
    paddingHorizontal: 18,
    fontSize: 15,
    color: "#0F172A",
  },
  sendBtn: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: "#0D5C3D",
    alignItems: "center",
    justifyContent: "center",
  },
  sendText: { color: "#FFFFFF", fontSize: 18 },
});
