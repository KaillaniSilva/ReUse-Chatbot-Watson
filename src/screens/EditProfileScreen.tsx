/**
 * EditProfileScreen.tsx
 * Edição do perfil do usuário.
 *
 * Câmera utilizada para:
 *  - Tirar ou selecionar foto de perfil (avatar)
 *
 * AsyncStorage:
 *  - Carrega perfil atual via getUserProfile()
 *  - Salva alterações via saveUserProfile()
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeInDown } from "react-native-reanimated";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { getUserProfile, saveUserProfile } from "../services/storage";
import { SpringPressable } from "../components/AnimatedComponents";

type Props = NativeStackScreenProps<RootStackParamList, "EditProfile">;

export function EditProfileScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [name, setName] = useState("");
  const [bio, setBio] = useState("");
  const [city, setCity] = useState("");
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  async function loadProfile() {
    const profile = await getUserProfile();
    setName(profile.name);
    setBio(profile.bio);
    setCity(profile.city);
    setAvatarUri(profile.avatarUri);
    setInitialLoad(false);
  }

  // ─── Câmera para avatar ─────────────────────────────────────────────────────
  async function handleChangeAvatar() {
    Alert.alert("Foto de perfil", "Como deseja adicionar sua foto?", [
      { text: "Câmera", onPress: takePhoto },
      { text: "Galeria", onPress: pickFromGallery },
      { text: "Cancelar", style: "cancel" },
    ]);
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissão necessária", "Permita o acesso à câmera nas configurações.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  }

  async function pickFromGallery() {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissão necessária", "Permita o acesso à galeria nas configurações.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
    });
    if (!result.canceled) setAvatarUri(result.assets[0].uri);
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert("Nome obrigatório", "Por favor, insira seu nome.");
      return;
    }
    setLoading(true);
    await saveUserProfile({ name: name.trim(), bio: bio.trim(), city: city.trim(), avatarUri });
    setLoading(false);
    Alert.alert("Perfil atualizado! ✅", "Suas informações foram salvas.", [
      { text: "OK", onPress: () => navigation.goBack() },
    ]);
  }

  if (initialLoad) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color="#0D5C3D" size="large" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="dark" />
      <View style={[styles.container, { paddingTop: insets.top }]}>
        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>← Voltar</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Editar Perfil</Text>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)} style={styles.avatarSection}>
            <TouchableOpacity onPress={handleChangeAvatar} style={styles.avatarTouch}>
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarImage} />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={{ fontSize: 56 }}>🌿</Text>
                </View>
              )}
              <View style={styles.avatarEditBadge}>
                <Text style={{ fontSize: 16 }}>📷</Text>
              </View>
            </TouchableOpacity>
            <Text style={styles.avatarHint}>Toque para alterar a foto</Text>
            <Text style={styles.avatarSubHint}>Use câmera ou selecione da galeria</Text>
          </Animated.View>

          {/* Campos */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Nome completo *</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>👤</Text>
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="Seu nome"
                  placeholderTextColor="#94A3B8"
                  autoCapitalize="words"
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Cidade</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.inputIcon}>📍</Text>
                <TextInput
                  style={styles.input}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Ex: São Paulo, SP"
                  placeholderTextColor="#94A3B8"
                  returnKeyType="next"
                />
              </View>
            </View>

            <View style={styles.fieldGroup}>
              <Text style={styles.label}>Bio</Text>
              <View style={[styles.inputWrap, styles.textAreaWrap]}>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={bio}
                  onChangeText={(t) => setBio(t.slice(0, 150))}
                  placeholder="Conte um pouco sobre você e o que costuma vender/doar..."
                  placeholderTextColor="#94A3B8"
                  multiline
                  maxLength={150}
                  textAlignVertical="top"
                />
                <Text style={styles.charCount}>{bio.length}/150</Text>
              </View>
            </View>
          </Animated.View>

          {/* Dica */}
          <Animated.View
            entering={FadeInDown.delay(300).duration(500)}
            style={styles.tipCard}
          >
            <Text style={styles.tipEmoji}>💡</Text>
            <Text style={styles.tipText}>
              Perfis com foto e bio recebem 2× mais contatos de outros usuários!
            </Text>
          </Animated.View>

          {/* Salvar */}
          <SpringPressable
            onPress={handleSave}
            style={[styles.saveBtn, loading && { opacity: 0.8 }]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveBtnText}>Salvar alterações</Text>
            )}
          </SpringPressable>
        </ScrollView>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F8FAF9" },
  header: {
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  backBtn: {},
  backBtnText: { fontSize: 15, color: "#0D5C3D", fontWeight: "600" },
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A" },
  scrollContent: { padding: 24, paddingBottom: 40 },
  avatarSection: { alignItems: "center", marginBottom: 32 },
  avatarTouch: { position: "relative", marginBottom: 10 },
  avatarImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 3,
    borderColor: "#0D5C3D",
  },
  avatarPlaceholder: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: "#E8F5F0",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#0D5C3D",
  },
  avatarEditBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#0D5C3D",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: "#FFFFFF",
  },
  avatarHint: { fontSize: 14, fontWeight: "600", color: "#0D5C3D" },
  avatarSubHint: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    minHeight: 52,
    gap: 10,
  },
  textAreaWrap: { alignItems: "flex-start", paddingVertical: 12 },
  inputIcon: { fontSize: 18 },
  input: { flex: 1, fontSize: 15, color: "#0F172A" },
  textArea: { height: 90, paddingTop: 0 },
  charCount: { fontSize: 11, color: "#94A3B8", alignSelf: "flex-end" },
  tipCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FEF3C7",
    borderRadius: 14,
    padding: 14,
    gap: 10,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: "#FDE68A",
  },
  tipEmoji: { fontSize: 22 },
  tipText: { flex: 1, fontSize: 13, color: "#92400E", fontWeight: "500", lineHeight: 18 },
  saveBtn: {
    backgroundColor: "#0D5C3D",
    borderRadius: 16,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
  },
  saveBtnText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
});
