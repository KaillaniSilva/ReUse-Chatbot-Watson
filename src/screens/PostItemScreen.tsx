/**
 * PostItemScreen.tsx
 * Publicação de itens no ReUse.
 *
 * Fase 3 — APIs integradas:
 *  - ViaCEP: preenche cidade/estado automaticamente ao digitar o CEP do item
 *  - IBGE:   carrega lista de estados para o picker de localização manual
 *
 * Recursos anteriores mantidos:
 *  - Câmera (launchCameraAsync / launchImageLibraryAsync)
 *  - AsyncStorage via addPostedItem()
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
  Modal,
  KeyboardAvoidingView,
  Platform,
  FlatList,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import Animated, { FadeInDown, FadeInUp, ZoomIn } from "react-native-reanimated";
import type { BottomTabScreenProps } from "@react-navigation/bottom-tabs";
import type { TabParamList } from "../navigation/types";
import { addPostedItem } from "../services/storage";
import { SpringPressable } from "../components/AnimatedComponents";
import { CATEGORIES } from "../data/mockData";
import { fetchAddressByCEP, fetchStates, type IBGEState } from "../services/api";
import { formatCacheAge } from "../services/cache";

type Props = BottomTabScreenProps<TabParamList, "PostItem">;

const CONDITIONS = ["Novo", "Excelente", "Bom", "Razoável"] as const;
const TYPES = [
  { value: "doação", label: "Doação", emoji: "💚", color: "#16A34A", bg: "#DCFCE7" },
  { value: "venda",  label: "Venda",  emoji: "💰", color: "#2563EB", bg: "#DBEAFE" },
  { value: "troca",  label: "Troca",  emoji: "🔄", color: "#7C3AED", bg: "#EDE9FE" },
] as const;

export function PostItemScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();

  // Foto
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Formulário básico
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [condition, setCondition] = useState<string>("");
  const [itemType, setItemType] = useState<"doação" | "venda" | "troca">("doação");
  const [price, setPrice] = useState("");
  const [loading, setLoading] = useState(false);

  // Localização — CEP + IBGE
  const [cep, setCep] = useState("");
  const [city, setCity] = useState("");
  const [selectedUf, setSelectedUf] = useState("");
  const [cepLoading, setCepLoading] = useState(false);
  const [cepError, setCepError] = useState(false);
  const [cepFromCache, setCepFromCache] = useState<boolean | null>(null);
  const [cepCachedAt, setCepCachedAt] = useState<number | undefined>(undefined);

  // Estados IBGE
  const [states, setStates] = useState<IBGEState[]>([]);
  const [statesLoading, setStatesLoading] = useState(false);
  const [statesFromCache, setStatesFromCache] = useState<boolean | null>(null);
  const [statesCachedAt, setStatesCachedAt] = useState<number | undefined>(undefined);
  const [showStateModal, setShowStateModal] = useState(false);

  // ─── Carrega estados IBGE ao montar ────────────────────────────────────────
  useEffect(() => {
    loadStates();
  }, []);

  async function loadStates() {
    setStatesLoading(true);
    const result = await fetchStates();
    setStates(result.data);
    setStatesFromCache(result.fromCache);
    setStatesCachedAt(result.cachedAt);
    setStatesLoading(false);
  }

  // ─── ViaCEP: busca endereço ao completar o CEP ─────────────────────────────
  async function handleCepChange(value: string) {
    const digits = value.replace(/\D/g, "").slice(0, 8);
    const formatted = digits.length > 5
      ? `${digits.slice(0, 5)}-${digits.slice(5)}`
      : digits;
    setCep(formatted);
    setCepError(false);

    if (digits.length === 8) {
      setCepLoading(true);
      setCepFromCache(null);
      setCepCachedAt(undefined);
      const result = await fetchAddressByCEP(digits);
      setCepLoading(false);

      if (result.data) {
        setCity(result.data.localidade);
        setSelectedUf(result.data.uf);
        setCepFromCache(result.fromCache);
        setCepError(false);
      } else {
        setCepError(true);
      }
    } else if (digits.length < 8) {
      setCepError(false);
      setCepFromCache(null);
    }
  }

  // ─── Câmera ────────────────────────────────────────────────────────────────
  async function openCamera() {
    setShowPhotoModal(false);
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissão negada", "Permita o acesso à câmera nas configurações.");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  }

  // ─── Galeria ───────────────────────────────────────────────────────────────
  async function openGallery() {
    setShowPhotoModal(false);
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Permissão negada", "Permita o acesso à galeria nas configurações.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.85,
    });
    if (!result.canceled && result.assets.length > 0) {
      setImageUri(result.assets[0].uri);
    }
  }

  // ─── Publicar ──────────────────────────────────────────────────────────────
  async function handlePublish() {
    if (!title.trim()) {
      Alert.alert("Campo obrigatório", "Dê um título ao seu item.");
      return;
    }
    if (!category) {
      Alert.alert("Campo obrigatório", "Selecione uma categoria.");
      return;
    }
    if (!condition) {
      Alert.alert("Campo obrigatório", "Selecione o estado de conservação.");
      return;
    }
    if (itemType === "venda" && (!price || isNaN(Number(price)) || Number(price) <= 0)) {
      Alert.alert("Preço inválido", "Informe um preço válido para o item.");
      return;
    }

    setLoading(true);
    await new Promise((r) => setTimeout(r, 600));

    const locationStr = city && selectedUf
      ? `${city}, ${selectedUf}`
      : city || selectedUf || "Localização não informada";

    await addPostedItem({
      id: `item_${Date.now()}`,
      title: title.trim(),
      description: description.trim(),
      category,
      condition,
      price: itemType === "venda" ? Number(price) : 0,
      type: itemType,
      imageUri,
      location: locationStr,
      createdAt: new Date().toISOString(),
    });

    setLoading(false);
    Alert.alert(
      "Item publicado! 🎉",
      "Seu item já está visível no ReUse. Você ganhou +50 RP!",
      [
        {
          text: "Ver marketplace",
          onPress: () => {
            resetForm();
            navigation.navigate("Marketplace");
          },
        },
      ]
    );
  }

  function resetForm() {
    setImageUri(null);
    setTitle("");
    setDescription("");
    setCategory("");
    setCondition("");
    setItemType("doação");
    setPrice("");
    setCep("");
    setCity("");
    setSelectedUf("");
    setCepFromCache(null);
  }

  const categoriesFiltered = CATEGORIES.filter((c) => c.id !== "all");

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="dark" />
      <View style={[styles.container, { paddingTop: insets.top }]}>

        {/* Header */}
        <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
          <Text style={styles.headerTitle}>Publicar Item</Text>
          <Text style={styles.headerSub}>Dê nova vida ao que você não usa</Text>
        </Animated.View>

        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Foto do item ───────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(100).duration(500)}>
            <Text style={styles.sectionTitle}>Foto do item</Text>
            <TouchableOpacity
              style={[styles.photoArea, imageUri && styles.photoAreaFilled]}
              onPress={() => setShowPhotoModal(true)}
              activeOpacity={0.8}
            >
              {imageUri ? (
                <View style={styles.photoPreviewWrap}>
                  <Image source={{ uri: imageUri }} style={styles.photoPreview} />
                  <TouchableOpacity
                    style={styles.removePhotoBtn}
                    onPress={() => setImageUri(null)}
                  >
                    <Text style={styles.removePhotoBtnText}>✕</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.changePhotoBtn}
                    onPress={() => setShowPhotoModal(true)}
                  >
                    <Text style={styles.changePhotoBtnText}>📷 Trocar foto</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <View style={styles.photoPlaceholder}>
                  <Text style={styles.photoPlaceholderEmoji}>📷</Text>
                  <Text style={styles.photoPlaceholderTitle}>Adicionar foto</Text>
                  <Text style={styles.photoPlaceholderSub}>
                    Câmera ou galeria • Melhora em até 3x as chances de doação/venda
                  </Text>
                </View>
              )}
            </TouchableOpacity>
          </Animated.View>

          {/* ── Tipo ──────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(150).duration(500)}>
            <Text style={styles.sectionTitle}>Tipo de anúncio</Text>
            <View style={styles.typeRow}>
              {TYPES.map((t) => (
                <TouchableOpacity
                  key={t.value}
                  style={[
                    styles.typeCard,
                    itemType === t.value && {
                      backgroundColor: t.bg,
                      borderColor: t.color,
                      borderWidth: 2,
                    },
                  ]}
                  onPress={() => setItemType(t.value)}
                >
                  <Text style={styles.typeEmoji}>{t.emoji}</Text>
                  <Text
                    style={[
                      styles.typeLabel,
                      itemType === t.value && { color: t.color, fontWeight: "700" },
                    ]}
                  >
                    {t.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* ── Título ─────────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(200).duration(500)}>
            <Text style={styles.sectionTitle}>Título *</Text>
            <View style={styles.inputWrap}>
              <TextInput
                style={styles.input}
                placeholder="Ex: Sofá 3 lugares cinza"
                placeholderTextColor="#94A3B8"
                value={title}
                onChangeText={setTitle}
                maxLength={60}
                returnKeyType="next"
              />
              <Text style={styles.charCount}>{title.length}/60</Text>
            </View>
          </Animated.View>

          {/* ── Descrição ─────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(220).duration(500)}>
            <Text style={styles.sectionTitle}>Descrição</Text>
            <View style={[styles.inputWrap, styles.textAreaWrap]}>
              <TextInput
                style={[styles.input, styles.textArea]}
                placeholder="Descreva o item: marca, tamanho, cor, estado..."
                placeholderTextColor="#94A3B8"
                value={description}
                onChangeText={setDescription}
                multiline
                maxLength={400}
                textAlignVertical="top"
              />
              <Text style={[styles.charCount, { alignSelf: "flex-end" }]}>{description.length}/400</Text>
            </View>
          </Animated.View>

          {/* ── Categoria ─────────────────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(240).duration(500)}>
            <Text style={styles.sectionTitle}>Categoria *</Text>
            <View style={styles.chipsWrap}>
              {categoriesFiltered.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[styles.chip, category === cat.id && styles.chipActive]}
                  onPress={() => setCategory(cat.id)}
                >
                  <Text style={styles.chipEmoji}>{cat.emoji}</Text>
                  <Text
                    style={[
                      styles.chipLabel,
                      category === cat.id && styles.chipLabelActive,
                    ]}
                  >
                    {cat.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* ── Estado de conservação ─────────────────────────── */}
          <Animated.View entering={FadeInDown.delay(260).duration(500)}>
            <Text style={styles.sectionTitle}>Estado de conservação *</Text>
            <View style={styles.conditionsRow}>
              {CONDITIONS.map((cond) => (
                <TouchableOpacity
                  key={cond}
                  style={[styles.condCard, condition === cond && styles.condCardActive]}
                  onPress={() => setCondition(cond)}
                >
                  <Text style={[styles.condLabel, condition === cond && styles.condLabelActive]}>
                    {cond}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </Animated.View>

          {/* ── Localização via CEP + IBGE ────────────────────── */}
          <Animated.View entering={FadeInDown.delay(280).duration(500)}>
            <View style={styles.locationHeader}>
              <Text style={styles.sectionTitle}>Localização</Text>
              {statesFromCache !== null && (
                <View style={[styles.apiBadge, statesFromCache ? styles.apiBadgeCache : styles.apiBadgeFresh]}>
                  <Text style={styles.apiBadgeText}>
                    {statesFromCache
                      ? `📦 IBGE cache ${statesCachedAt ? formatCacheAge(statesCachedAt) : ""}`
                      : "🌐 IBGE API"}
                  </Text>
                </View>
              )}
            </View>

            {/* CEP */}
            <View style={styles.locationRow}>
              <View style={[styles.inputWrap, styles.cepInput, cepError && styles.inputError]}>
                <TextInput
                  style={styles.input}
                  placeholder="CEP"
                  placeholderTextColor="#94A3B8"
                  value={cep}
                  onChangeText={handleCepChange}
                  keyboardType="numeric"
                  maxLength={9}
                  returnKeyType="next"
                />
                {cepLoading
                  ? <ActivityIndicator size="small" color="#0D5C3D" />
                  : cepFromCache === true
                  ? <Text style={{ fontSize: 12 }}>📦</Text>
                  : cepFromCache === false
                  ? <Text style={{ fontSize: 12 }}>🌐</Text>
                  : null}
              </View>

              {/* Seletor de estado via IBGE */}
              <TouchableOpacity
                style={[styles.inputWrap, styles.ufInput, selectedUf ? styles.inputFilled : undefined]}
                onPress={() => setShowStateModal(true)}
              >
                {statesLoading
                  ? <ActivityIndicator size="small" color="#0D5C3D" />
                  : <Text style={[styles.input, !selectedUf && { color: "#94A3B8" }]}>
                      {selectedUf || "UF"}
                    </Text>}
                <Text style={{ fontSize: 10, color: "#94A3B8" }}>▼</Text>
              </TouchableOpacity>
            </View>

            {cepFromCache !== null && !cepError && (
              <Text style={styles.fieldHint}>
                Endereço via {cepFromCache ? "cache local (ViaCEP)" : "ViaCEP API"}
              </Text>
            )}
            {cepError && (
              <Text style={[styles.fieldHint, { color: "#EF4444" }]}>
                CEP não encontrado. Selecione o estado manualmente.
              </Text>
            )}

            {/* Cidade */}
            <View style={[styles.inputWrap, { marginTop: 10 }, city ? styles.inputFilled : undefined]}>
              <Text style={styles.inputIcon}>📍</Text>
              <TextInput
                style={styles.input}
                placeholder="Cidade"
                placeholderTextColor="#94A3B8"
                value={city}
                onChangeText={setCity}
                returnKeyType="next"
              />
            </View>
          </Animated.View>

          {/* ── Preço (só para venda) ──────────────────────────── */}
          {itemType === "venda" && (
            <Animated.View entering={ZoomIn.duration(350)}>
              <Text style={styles.sectionTitle}>Preço (R$) *</Text>
              <View style={styles.inputWrap}>
                <Text style={styles.currencySymbol}>R$</Text>
                <TextInput
                  style={[styles.input, { paddingLeft: 0 }]}
                  placeholder="0,00"
                  placeholderTextColor="#94A3B8"
                  value={price}
                  onChangeText={(t) => setPrice(t.replace(/[^0-9.]/g, ""))}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
              </View>
            </Animated.View>
          )}

          {/* ── Dica ambiental ────────────────────────────────── */}
          <Animated.View entering={FadeInUp.delay(300).duration(500)} style={styles.ecoTip}>
            <Text style={styles.ecoEmoji}>🌱</Text>
            <Text style={styles.ecoText}>
              {itemType === "doação"
                ? "Itens doados ganham +300 RP e ajudam o planeta!"
                : itemType === "troca"
                ? "Trocas geram +200 RP e criam conexões na comunidade."
                : "Itens vendidos ganham +50 RP. Boa sorte na venda!"}
            </Text>
          </Animated.View>

          {/* ── Botão publicar ────────────────────────────────── */}
          <SpringPressable
            onPress={handlePublish}
            style={[styles.publishBtn, loading && { opacity: 0.7 }]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.publishBtnText}>Publicar agora</Text>
                <Text style={styles.publishBtnSub}>
                  {itemType === "doação" ? "• Grátis • +300 RP" : itemType === "troca" ? "• +200 RP" : "• +50 RP"}
                </Text>
              </>
            )}
          </SpringPressable>
        </ScrollView>
      </View>

      {/* ── Modal: câmera ou galeria ──────────────────────────── */}
      <Modal
        visible={showPhotoModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowPhotoModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowPhotoModal(false)}
          activeOpacity={1}
        >
          <Animated.View
            entering={FadeInUp.duration(300)}
            style={[styles.modalSheet, { paddingBottom: 20 + insets.bottom }]}
          >
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Adicionar foto do item</Text>
            <Text style={styles.modalSub}>Fotos de qualidade aumentam as chances de sucesso!</Text>

            <TouchableOpacity style={styles.modalOption} onPress={openCamera}>
              <View style={styles.modalOptionIcon}><Text style={{ fontSize: 28 }}>📷</Text></View>
              <View style={styles.modalOptionInfo}>
                <Text style={styles.modalOptionTitle}>Tirar foto agora</Text>
                <Text style={styles.modalOptionSub}>Use a câmera do seu dispositivo</Text>
              </View>
              <Text style={styles.modalOptionArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.modalOption} onPress={openGallery}>
              <View style={styles.modalOptionIcon}><Text style={{ fontSize: 28 }}>🖼️</Text></View>
              <View style={styles.modalOptionInfo}>
                <Text style={styles.modalOptionTitle}>Escolher da galeria</Text>
                <Text style={styles.modalOptionSub}>Selecione uma foto já existente</Text>
              </View>
              <Text style={styles.modalOptionArrow}>→</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalCancel}
              onPress={() => setShowPhotoModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancelar</Text>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Modal>

      {/* ── Modal: seleção de estado via IBGE ───────────────────── */}
      <Modal
        visible={showStateModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowStateModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          onPress={() => setShowStateModal(false)}
          activeOpacity={1}
        >
          <View style={[styles.modalSheet, styles.stateSheet, { paddingBottom: insets.bottom }]}>
            <View style={styles.modalHandle} />
            <View style={styles.stateModalHeader}>
              <Text style={styles.modalTitle}>Selecionar Estado</Text>
              {statesFromCache !== null && (
                <Text style={styles.stateSourceText}>
                  {statesFromCache ? "📦 Cache IBGE" : "🌐 IBGE API"}
                </Text>
              )}
            </View>

            <FlatList
              data={states}
              keyExtractor={(item) => String(item.id)}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.stateItem,
                    selectedUf === item.sigla && styles.stateItemActive,
                  ]}
                  onPress={() => {
                    setSelectedUf(item.sigla);
                    setShowStateModal(false);
                  }}
                >
                  <Text style={styles.stateItemSigla}>{item.sigla}</Text>
                  <Text style={[
                    styles.stateItemNome,
                    selectedUf === item.sigla && styles.stateItemNomeActive,
                  ]}>
                    {item.nome}
                  </Text>
                  {selectedUf === item.sigla && (
                    <Text style={{ color: "#0D5C3D", fontWeight: "700" }}>✓</Text>
                  )}
                </TouchableOpacity>
              )}
              style={styles.stateList}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  },
  headerTitle: { fontSize: 22, fontWeight: "800", color: "#0F172A" },
  headerSub: { fontSize: 13, color: "#64748B", marginTop: 2 },
  scrollContent: { padding: 20, paddingBottom: 40 },
  sectionTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A", marginBottom: 10, marginTop: 20 },
  locationHeader: { flexDirection: "row", alignItems: "center", gap: 8, marginTop: 20, marginBottom: 10 },
  apiBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 99 },
  apiBadgeCache: { backgroundColor: "#E0F2FE" },
  apiBadgeFresh: { backgroundColor: "#DCFCE7" },
  apiBadgeText: { fontSize: 10, fontWeight: "700", color: "#0369A1" },
  fieldHint: { fontSize: 11, color: "#64748B", marginTop: 5, marginLeft: 2 },

  // Foto
  photoArea: {
    height: 200,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: "#E5E7EB",
    borderStyle: "dashed",
    overflow: "hidden",
    backgroundColor: "#F8FAF9",
  },
  photoAreaFilled: { borderStyle: "solid", borderColor: "#0D5C3D" },
  photoPreviewWrap: { flex: 1, position: "relative" },
  photoPreview: { width: "100%", height: "100%" },
  removePhotoBtn: {
    position: "absolute", top: 10, right: 10, width: 30, height: 30,
    borderRadius: 15, backgroundColor: "rgba(0,0,0,0.6)",
    alignItems: "center", justifyContent: "center",
  },
  removePhotoBtnText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  changePhotoBtn: {
    position: "absolute", bottom: 10, left: "50%", transform: [{ translateX: -55 }],
    backgroundColor: "rgba(0,0,0,0.6)", paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
  },
  changePhotoBtnText: { color: "#FFFFFF", fontSize: 13, fontWeight: "600" },
  photoPlaceholder: { flex: 1, alignItems: "center", justifyContent: "center", gap: 8 },
  photoPlaceholderEmoji: { fontSize: 44 },
  photoPlaceholderTitle: { fontSize: 16, fontWeight: "700", color: "#0D5C3D" },
  photoPlaceholderSub: { fontSize: 12, color: "#94A3B8", textAlign: "center", maxWidth: 240 },

  // Tipos
  typeRow: { flexDirection: "row", gap: 10 },
  typeCard: {
    flex: 1, alignItems: "center", paddingVertical: 14,
    borderRadius: 14, backgroundColor: "#FFFFFF",
    borderWidth: 1.5, borderColor: "#E5E7EB", gap: 4,
  },
  typeEmoji: { fontSize: 24 },
  typeLabel: { fontSize: 13, fontWeight: "500", color: "#64748B" },

  // Inputs
  inputWrap: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#FFFFFF", borderRadius: 14,
    borderWidth: 1.5, borderColor: "#E5E7EB",
    paddingHorizontal: 14, minHeight: 52,
  },
  inputFilled: { borderColor: "#0D5C3D", backgroundColor: "#F0FDF4" },
  inputError: { borderColor: "#FCA5A5", backgroundColor: "#FFF5F5" },
  textAreaWrap: { alignItems: "flex-start", paddingVertical: 12 },
  input: { flex: 1, fontSize: 15, color: "#0F172A", paddingLeft: 4 },
  textArea: { height: 100, paddingTop: 0 },
  charCount: { fontSize: 11, color: "#94A3B8" },
  currencySymbol: { fontSize: 16, fontWeight: "700", color: "#0D5C3D", marginRight: 8 },
  inputIcon: { fontSize: 18, marginRight: 2 },

  // Localização
  locationRow: { flexDirection: "row", gap: 10 },
  cepInput: { flex: 3 },
  ufInput: { flex: 1, justifyContent: "space-between" },

  // Chips de categoria
  chipsWrap: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  chip: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 99, backgroundColor: "#FFFFFF",
    borderWidth: 1.5, borderColor: "#E5E7EB", gap: 5,
  },
  chipActive: { backgroundColor: "#0D5C3D", borderColor: "#0D5C3D" },
  chipEmoji: { fontSize: 16 },
  chipLabel: { fontSize: 13, fontWeight: "500", color: "#64748B" },
  chipLabelActive: { color: "#FFFFFF", fontWeight: "700" },

  // Condições
  conditionsRow: { flexDirection: "row", gap: 10 },
  condCard: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: "#FFFFFF", borderWidth: 1.5,
    borderColor: "#E5E7EB", alignItems: "center",
  },
  condCardActive: { backgroundColor: "#F0FDF4", borderColor: "#0D5C3D" },
  condLabel: { fontSize: 12, fontWeight: "600", color: "#64748B" },
  condLabelActive: { color: "#0D5C3D" },

  // Eco tip
  ecoTip: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F0FDF4", borderRadius: 14,
    padding: 14, marginTop: 20, gap: 10,
    borderWidth: 1, borderColor: "#BBF7D0",
  },
  ecoEmoji: { fontSize: 22 },
  ecoText: { flex: 1, fontSize: 13, color: "#166534", fontWeight: "500", lineHeight: 18 },

  // Botão publicar
  publishBtn: {
    backgroundColor: "#0D5C3D", borderRadius: 16,
    paddingVertical: 18, alignItems: "center",
    marginTop: 24, gap: 2,
  },
  publishBtnText: { fontSize: 17, fontWeight: "800", color: "#FFFFFF" },
  publishBtnSub: { fontSize: 12, color: "rgba(255,255,255,0.75)" },

  // Modal base
  modalOverlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.5)", justifyContent: "flex-end" },
  modalSheet: {
    backgroundColor: "#FFFFFF", borderTopLeftRadius: 28, borderTopRightRadius: 28,
    paddingHorizontal: 24, paddingTop: 16, gap: 8,
  },
  modalHandle: {
    width: 40, height: 4, borderRadius: 2,
    backgroundColor: "#E5E7EB", alignSelf: "center", marginBottom: 12,
  },
  modalTitle: { fontSize: 20, fontWeight: "800", color: "#0F172A", marginBottom: 4 },
  modalSub: { fontSize: 13, color: "#64748B", marginBottom: 12 },
  modalOption: {
    flexDirection: "row", alignItems: "center",
    backgroundColor: "#F8FAF9", borderRadius: 16,
    padding: 16, gap: 14,
    borderWidth: 1, borderColor: "#E5E7EB",
  },
  modalOptionIcon: {
    width: 52, height: 52, borderRadius: 14,
    backgroundColor: "#FFFFFF", alignItems: "center",
    justifyContent: "center", borderWidth: 1, borderColor: "#E5E7EB",
  },
  modalOptionInfo: { flex: 1 },
  modalOptionTitle: { fontSize: 15, fontWeight: "700", color: "#0F172A" },
  modalOptionSub: { fontSize: 12, color: "#64748B", marginTop: 2 },
  modalOptionArrow: { fontSize: 18, color: "#0D5C3D", fontWeight: "700" },
  modalCancel: {
    alignItems: "center", paddingVertical: 14,
    borderRadius: 14, backgroundColor: "#F1F5F9", marginTop: 4,
  },
  modalCancelText: { fontSize: 15, fontWeight: "600", color: "#64748B" },

  // Modal estados IBGE
  stateSheet: { maxHeight: "75%", paddingHorizontal: 0 },
  stateModalHeader: {
    flexDirection: "row", alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 24, marginBottom: 8,
  },
  stateSourceText: { fontSize: 11, color: "#64748B", fontWeight: "600" },
  stateList: { flex: 1 },
  stateItem: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 24, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: "#F1F5F9", gap: 12,
  },
  stateItemActive: { backgroundColor: "#F0FDF4" },
  stateItemSigla: {
    fontSize: 14, fontWeight: "800", color: "#0D5C3D",
    width: 32,
  },
  stateItemNome: { flex: 1, fontSize: 15, color: "#374151" },
  stateItemNomeActive: { color: "#0D5C3D", fontWeight: "600" },
});
