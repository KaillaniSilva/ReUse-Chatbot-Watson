/**
 * ChatScreen.tsx
 * Tela de conversa individual entre dois usuários.
 *
 * UI/UX mobile aplicados:
 *  - Bolhas de mensagem diferenciadas (enviadas / recebidas)
 *  - Header com avatar, nome e item em negociação
 *  - FlatList invertida (mensagens mais novas em baixo)
 *  - Campo de texto com botão de enviar e câmera
 *  - KeyboardAvoidingView para não cobrir o campo de texto
 *  - ScrollToBottom automático ao enviar mensagem
 *  - Câmera para enviar fotos (expo-image-picker)
 */

import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  Image,
  Alert,
  ListRenderItem,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeInDown, SlideInUp } from "react-native-reanimated";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { MOCK_MESSAGES, type ChatMessage } from "../data/mockData";
import { SpringPressable } from "../components/AnimatedComponents";

type Props = NativeStackScreenProps<RootStackParamList, "Chat">;

export function ChatScreen({ route, navigation }: Props) {
  const { participantName, participantAvatar, itemTitle } = route.params;
  const insets = useSafeAreaInsets();
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [inputText, setInputText] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  function sendMessage() {
    if (!inputText.trim() && !photoUri) return;

    const newMsg: ChatMessage = {
      id: `m${Date.now()}`,
      text: inputText.trim(),
      senderId: "me",
      timestamp: new Date().toLocaleTimeString("pt-BR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
      ...(photoUri ? { imageUri: photoUri } : {}),
    } as any;

    setMessages((prev) => [...prev, newMsg]);
    setInputText("");
    setPhotoUri(null);

    // Scroll para o fim
    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }

  // ─── Câmera no chat (enviar foto) ──────────────────────────────────────────
  async function handleCameraInChat() {
    Alert.alert("Enviar foto", "Como deseja adicionar a foto?", [
      {
        text: "Câmera",
        onPress: async () => {
          const perm = await ImagePicker.requestCameraPermissionsAsync();
          if (!perm.granted) { Alert.alert("Permissão necessária"); return; }
          const result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 0.75,
          });
          if (!result.canceled) setPhotoUri(result.assets[0].uri);
        },
      },
      {
        text: "Galeria",
        onPress: async () => {
          const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            quality: 0.75,
          });
          if (!result.canceled) setPhotoUri(result.assets[0].uri);
        },
      },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  const renderMessage: ListRenderItem<ChatMessage> = ({ item }) => {
    const isMe = item.senderId === "me";
    const msgWithImage = item as ChatMessage & { imageUri?: string };

    return (
      <View style={[styles.msgWrap, isMe && styles.msgWrapMe]}>
        {!isMe && (
          <View style={styles.msgAvatar}>
            <Text style={{ fontSize: 16 }}>{participantAvatar}</Text>
          </View>
        )}
        <View style={[styles.bubble, isMe ? styles.bubbleMe : styles.bubbleThem]}>
          {msgWithImage.imageUri && (
            <Image
              source={{ uri: msgWithImage.imageUri }}
              style={styles.bubbleImage}
              resizeMode="cover"
            />
          )}
          {item.text ? (
            <Text style={[styles.bubbleText, isMe && styles.bubbleTextMe]}>
              {item.text}
            </Text>
          ) : null}
          <Text style={[styles.bubbleTime, isMe && styles.bubbleTimeMe]}>
            {item.timestamp}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      <StatusBar style="dark" />
      <View style={[styles.container, { paddingTop: insets.top }]}>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>←</Text>
          </TouchableOpacity>

          <View style={styles.headerAvatar}>
            <Text style={{ fontSize: 24 }}>{participantAvatar}</Text>
          </View>

          <View style={styles.headerInfo}>
            <Text style={styles.headerName} numberOfLines={1}>{participantName}</Text>
            <Text style={styles.headerItem} numberOfLines={1}>📦 {itemTitle}</Text>
          </View>

          <TouchableOpacity style={styles.headerAction}>
            <Text style={{ fontSize: 20 }}>⋮</Text>
          </TouchableOpacity>
        </Animated.View>

        {/* Mensagens */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
          onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
          ListHeaderComponent={
            <View style={styles.negotiationBanner}>
              <Text style={styles.negotiationIcon}>📦</Text>
              <Text style={styles.negotiationText}>
                Negociando: <Text style={styles.negotiationItem}>{itemTitle}</Text>
              </Text>
            </View>
          }
        />

        {/* Preview de foto a ser enviada */}
        {photoUri && (
          <Animated.View entering={SlideInUp.duration(300)} style={styles.photoPreviewBar}>
            <Image source={{ uri: photoUri }} style={styles.photoPreviewThumb} />
            <Text style={styles.photoPreviewLabel}>Foto pronta para enviar</Text>
            <TouchableOpacity onPress={() => setPhotoUri(null)}>
              <Text style={styles.photoPreviewRemove}>✕</Text>
            </TouchableOpacity>
          </Animated.View>
        )}

        {/* Campo de mensagem */}
        <View style={[styles.inputBar, { paddingBottom: 12 + insets.bottom }]}>
          <TouchableOpacity style={styles.cameraBtn} onPress={handleCameraInChat}>
            <Text style={{ fontSize: 22 }}>📷</Text>
          </TouchableOpacity>

          <TextInput
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            placeholder="Digite uma mensagem..."
            placeholderTextColor="#94A3B8"
            multiline
            maxLength={500}
            returnKeyType="default"
          />

          <SpringPressable
            onPress={sendMessage}
            style={[
              styles.sendBtn,
              (!inputText.trim() && !photoUri) && styles.sendBtnDisabled,
            ]}
          >
            <Text style={{ fontSize: 20, color: "#FFFFFF" }}>↑</Text>
          </SpringPressable>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAF9" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    gap: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "#F8FAF9",
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: { fontSize: 18, fontWeight: "700", color: "#0F172A" },
  headerAvatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: "#E8F5F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#D1FAE5",
  },
  headerInfo: { flex: 1 },
  headerName: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  headerItem: { fontSize: 11, color: "#64748B", marginTop: 1 },
  headerAction: { padding: 8 },

  // Messages
  messagesContent: { padding: 16, paddingBottom: 8 },
  negotiationBanner: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    borderRadius: 12,
    padding: 10,
    marginBottom: 16,
    gap: 8,
    borderWidth: 1,
    borderColor: "#BBF7D0",
  },
  negotiationIcon: { fontSize: 18 },
  negotiationText: { fontSize: 12, color: "#64748B" },
  negotiationItem: { color: "#0D5C3D", fontWeight: "700" },
  msgWrap: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 10,
    gap: 8,
  },
  msgWrapMe: { flexDirection: "row-reverse" },
  msgAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#E8F5F0",
    alignItems: "center",
    justifyContent: "center",
  },
  bubble: {
    maxWidth: "75%",
    borderRadius: 18,
    padding: 12,
    gap: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  bubbleMe: {
    backgroundColor: "#0D5C3D",
    borderBottomRightRadius: 4,
  },
  bubbleThem: {
    backgroundColor: "#FFFFFF",
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  bubbleImage: {
    width: 200,
    height: 150,
    borderRadius: 10,
    marginBottom: 4,
  },
  bubbleText: { fontSize: 14, color: "#0F172A", lineHeight: 20 },
  bubbleTextMe: { color: "#FFFFFF" },
  bubbleTime: { fontSize: 10, color: "#94A3B8", alignSelf: "flex-end" },
  bubbleTimeMe: { color: "rgba(255,255,255,0.6)" },

  // Photo preview
  photoPreviewBar: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F0FDF4",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#BBF7D0",
    gap: 12,
  },
  photoPreviewThumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
  },
  photoPreviewLabel: { flex: 1, fontSize: 13, color: "#0D5C3D", fontWeight: "600" },
  photoPreviewRemove: { fontSize: 18, color: "#94A3B8", padding: 4 },

  // Input bar
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#F1F5F9",
    gap: 10,
  },
  cameraBtn: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: "#F8FAF9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  input: {
    flex: 1,
    backgroundColor: "#F8FAF9",
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: "#0F172A",
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#0D5C3D",
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: "#D1FAE5" },
});
