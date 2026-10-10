/**
 * SettingsScreen.tsx
 * Configurações do app ReUse.
 *
 * AsyncStorage utilizado:
 *  - getSettings()      → carrega preferências salvas
 *  - saveSetting()      → persiste cada toggle individualmente
 *
 * UI/UX mobile aplicados:
 *  - Toggles nativos para cada setting
 *  - Agrupamento por seções (Notificações, Privacidade, Conta)
 *  - Feedback visual imediato ao alterar um setting
 *  - Versão do app no rodapé
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Switch,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import {
  getSettings,
  saveSetting,
  clearAllStorage,
  type AppSettings,
} from "../services/storage";

type Props = NativeStackScreenProps<RootStackParamList, "Settings">;

type SettingItem = {
  key: keyof AppSettings;
  label: string;
  desc: string;
  icon: string;
};

const NOTIFICATION_SETTINGS: SettingItem[] = [
  {
    key: "notificationsEnabled",
    label: "Notificações push",
    desc: "Receba alertas de mensagens e novas ofertas",
    icon: "🔔",
  },
  {
    key: "emailNotifications",
    label: "Notificações por e-mail",
    desc: "Resumos semanais e alertas de negócios",
    icon: "✉️",
  },
];

const PRIVACY_SETTINGS: SettingItem[] = [
  {
    key: "showLocation",
    label: "Mostrar localização",
    desc: "Exibe sua cidade nos anúncios e perfil",
    icon: "📍",
  },
];

export function SettingsScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [settings, setSettings] = useState<AppSettings | null>(null);
  const [savingKey, setSavingKey] = useState<keyof AppSettings | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    const s = await getSettings();
    setSettings(s);
  }

  async function handleToggle(key: keyof AppSettings, value: boolean) {
    if (!settings) return;
    // Atualiza UI imediatamente (optimistic update)
    setSettings((prev) => prev ? { ...prev, [key]: value } : prev);
    setSavingKey(key);
    await saveSetting(key, value as any);
    setSavingKey(null);
  }

  function handleClearData() {
    Alert.alert(
      "Limpar todos os dados",
      "Esta ação removerá todas as configurações, favoritos e itens publicados localmente. Tem certeza?",
      [
        { text: "Cancelar", style: "cancel" },
        {
          text: "Limpar tudo",
          style: "destructive",
          onPress: async () => {
            await clearAllStorage();
            Alert.alert("Dados limpos", "Todos os dados locais foram removidos.", [
              { text: "OK", onPress: () => (navigation as any).replace("Login") },
            ]);
          },
        },
      ]
    );
  }

  function handleAbout() {
    Alert.alert(
      "Sobre o ReUse!",
      "Versão 1.0.0\n\nPlataforma de economia sustentável e consumo consciente.\n\nDesenvolvido com React Native + Expo.\n\n© 2025 ReUse! Todos os direitos reservados."
    );
  }

  if (!settings) {
    return (
      <View style={[styles.container, { alignItems: "center", justifyContent: "center" }]}>
        <ActivityIndicator color="#0D5C3D" size="large" />
      </View>
    );
  }

  function SettingRow({ item }: { item: SettingItem }) {
    const value = settings ? settings[item.key] as boolean : false;
    const isSaving = savingKey === item.key;
    return (
      <View style={styles.settingRow}>
        <View style={styles.settingIconWrap}>
          <Text style={{ fontSize: 20 }}>{item.icon}</Text>
        </View>
        <View style={styles.settingInfo}>
          <Text style={styles.settingLabel}>{item.label}</Text>
          <Text style={styles.settingDesc}>{item.desc}</Text>
        </View>
        {isSaving ? (
          <ActivityIndicator size="small" color="#0D5C3D" style={{ width: 51 }} />
        ) : (
          <Switch
            value={value}
            onValueChange={(v) => handleToggle(item.key, v)}
            trackColor={{ false: "#E5E7EB", true: "#86EFAC" }}
            thumbColor={value ? "#0D5C3D" : "#FFFFFF"}
            ios_backgroundColor="#E5E7EB"
          />
        )}
      </View>
    );
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <StatusBar style="dark" />

      {/* Header */}
      <Animated.View entering={FadeInDown.duration(400)} style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Configurações</Text>
        <View style={{ width: 40 }} />
      </Animated.View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Notificações */}
        <Animated.View entering={FadeInDown.delay(100).duration(500)}>
          <Text style={styles.sectionTitle}>Notificações</Text>
          <View style={styles.card}>
            {NOTIFICATION_SETTINGS.map((item, i) => (
              <React.Fragment key={item.key}>
                <SettingRow item={item} />
                {i < NOTIFICATION_SETTINGS.length - 1 && <View style={styles.divider} />}
              </React.Fragment>
            ))}
          </View>
        </Animated.View>

        {/* Privacidade */}
        <Animated.View entering={FadeInDown.delay(160).duration(500)}>
          <Text style={styles.sectionTitle}>Privacidade</Text>
          <View style={styles.card}>
            {PRIVACY_SETTINGS.map((item) => (
              <SettingRow key={item.key} item={item} />
            ))}
          </View>
        </Animated.View>

        {/* Conta */}
        <Animated.View entering={FadeInDown.delay(220).duration(500)}>
          <Text style={styles.sectionTitle}>Conta</Text>
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => (navigation as any).navigate("EditProfile")}
            >
              <View style={styles.settingIconWrap}>
                <Text style={{ fontSize: 20 }}>👤</Text>
              </View>
              <Text style={styles.actionLabel}>Editar perfil</Text>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.actionRow} onPress={handleAbout}>
              <View style={styles.settingIconWrap}>
                <Text style={{ fontSize: 20 }}>ℹ️</Text>
              </View>
              <Text style={styles.actionLabel}>Sobre o ReUse!</Text>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity
              style={styles.actionRow}
              onPress={() => (navigation as any).navigate("About")}
            >
              <View style={styles.settingIconWrap}>
                <Text style={{ fontSize: 20 }}>🌱</Text>
              </View>
              <Text style={styles.actionLabel}>Nossa missão</Text>
              <Text style={styles.actionArrow}>→</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Zona de perigo */}
        <Animated.View entering={FadeInDown.delay(300).duration(500)}>
          <Text style={[styles.sectionTitle, { color: "#EF4444" }]}>Zona de perigo</Text>
          <View style={[styles.card, styles.dangerCard]}>
            <TouchableOpacity style={styles.dangerRow} onPress={handleClearData}>
              <View style={[styles.settingIconWrap, styles.dangerIconWrap]}>
                <Text style={{ fontSize: 20 }}>🗑️</Text>
              </View>
              <View style={styles.settingInfo}>
                <Text style={styles.dangerLabel}>Limpar dados locais</Text>
                <Text style={styles.settingDesc}>Remove favoritos, configurações e anúncios locais</Text>
              </View>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Footer */}
        <Animated.View
          entering={FadeInUp.delay(400).duration(500)}
          style={styles.footer}
        >
          <Text style={styles.footerEmoji}>♻️</Text>
          <Text style={styles.footerTitle}>ReUse!</Text>
          <Text style={styles.footerVersion}>Versão 1.0.0 • Expo SDK 55</Text>
          <Text style={styles.footerTagline}>Economia sustentável e consumo consciente</Text>
        </Animated.View>
      </ScrollView>
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
  headerTitle: { flex: 1, textAlign: "center", fontSize: 20, fontWeight: "800", color: "#0F172A" },
  scrollContent: { padding: 20, paddingBottom: 40 },
  sectionTitle: {
    fontSize: 13,
    fontWeight: "700",
    color: "#64748B",
    letterSpacing: 0.6,
    textTransform: "uppercase",
    marginTop: 24,
    marginBottom: 10,
    marginLeft: 4,
  },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  dangerCard: { borderColor: "#FECACA" },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  settingIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#F8FAF9",
    alignItems: "center",
    justifyContent: "center",
  },
  settingInfo: { flex: 1 },
  settingLabel: { fontSize: 15, fontWeight: "600", color: "#0F172A" },
  settingDesc: { fontSize: 12, color: "#64748B", marginTop: 2 },
  divider: { height: 1, backgroundColor: "#F1F5F9", marginLeft: 70 },
  actionRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  actionLabel: { flex: 1, fontSize: 15, fontWeight: "600", color: "#0F172A" },
  actionArrow: { fontSize: 16, color: "#94A3B8" },
  dangerRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  dangerIconWrap: { backgroundColor: "#FFF5F5" },
  dangerLabel: { fontSize: 15, fontWeight: "600", color: "#EF4444" },
  footer: {
    alignItems: "center",
    paddingVertical: 32,
    gap: 4,
  },
  footerEmoji: { fontSize: 32, marginBottom: 4 },
  footerTitle: { fontSize: 18, fontWeight: "800", color: "#0D5C3D" },
  footerVersion: { fontSize: 12, color: "#94A3B8" },
  footerTagline: { fontSize: 12, color: "#64748B", marginTop: 2 },
});
