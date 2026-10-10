/**
 * LoginScreen.tsx
 * Tela de login do ReUse.
 * Em produção faria chamada à API; aqui salva os dados de perfil via AsyncStorage.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from "react-native";
import { StatusBar } from "expo-status-bar";
import Animated, { FadeInDown, FadeInUp } from "react-native-reanimated";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import type { RootStackParamList } from "../navigation/types";
import { SpringPressable } from "../components/AnimatedComponents";
import { useAuth } from "../contexts/AuthContext";

type Props = NativeStackScreenProps<RootStackParamList, "Login">;

export function LoginScreen({ navigation }: Props) {
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      Alert.alert("Campos obrigatórios", "Preencha e-mail e senha para entrar.");
      return;
    }
    if (!email.includes("@")) {
      Alert.alert("E-mail inválido", "Digite um e-mail válido.");
      return;
    }
    setLoading(true);
    try {
      // Cria sessão persistente com token e expiração de 7 dias
      await login(email.trim(), password);
      navigation.replace("MainApp");
    } catch {
      Alert.alert("Erro ao entrar", "Não foi possível autenticar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <StatusBar style="dark" />
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header verde */}
        <Animated.View entering={FadeInDown.duration(600)} style={styles.header}>
          <View style={styles.logoRow}>
            <Text style={styles.logoEmoji}>♻️</Text>
            <Text style={styles.logoText}>
              Re<Text style={styles.logoTextBold}>Use!</Text>
            </Text>
          </View>
          <Text style={styles.headerSub}>Sua plataforma de consumo consciente</Text>
        </Animated.View>

        {/* Card de login */}
        <Animated.View entering={FadeInUp.delay(200).duration(600)} style={styles.card}>
          <Text style={styles.cardTitle}>Entrar na conta</Text>
          <Text style={styles.cardSub}>Bem-vindo de volta!</Text>

          {/* Campo e-mail */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>E-mail</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>✉️</Text>
              <TextInput
                style={styles.input}
                placeholder="seu@email.com"
                placeholderTextColor="#94A3B8"
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>
          </View>

          {/* Campo senha */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Senha</Text>
            <View style={styles.inputWrap}>
              <Text style={styles.inputIcon}>🔒</Text>
              <TextInput
                style={styles.input}
                placeholder="••••••••"
                placeholderTextColor="#94A3B8"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                returnKeyType="done"
                onSubmitEditing={handleLogin}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeBtn}>
                <Text style={{ fontSize: 18 }}>{showPassword ? "🙈" : "👁️"}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Esqueci senha */}
          <TouchableOpacity style={styles.forgotRow}>
            <Text style={styles.forgotText}>Esqueci minha senha</Text>
          </TouchableOpacity>

          {/* Botão entrar */}
          <SpringPressable
            onPress={handleLogin}
            style={[styles.loginButton, loading && styles.loginButtonLoading]}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.loginButtonText}>Entrar</Text>
            )}
          </SpringPressable>

          {/* Divider */}
          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>ou</Text>
            <View style={styles.dividerLine} />
          </View>

          {/* Link para cadastro */}
          <View style={styles.registerRow}>
            <Text style={styles.registerText}>Não tem conta? </Text>
            <TouchableOpacity onPress={() => navigation.navigate("Register")}>
              <Text style={styles.registerLink}>Cadastre-se grátis</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>

        {/* Rodapé */}
        <Animated.Text
          entering={FadeInUp.delay(400).duration(500)}
          style={styles.footer}
        >
          Ao entrar você concorda com os{"\n"}
          <Text style={styles.footerLink}>Termos de Uso</Text> e{" "}
          <Text style={styles.footerLink}>Política de Privacidade</Text>
        </Animated.Text>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  scroll: { flex: 1, backgroundColor: "#F8FAF9" },
  scrollContent: { flexGrow: 1, paddingBottom: 32 },
  header: {
    backgroundColor: "#0D5C3D",
    paddingTop: 64,
    paddingBottom: 48,
    paddingHorizontal: 24,
    alignItems: "center",
    borderBottomLeftRadius: 32,
    borderBottomRightRadius: 32,
  },
  logoRow: { flexDirection: "row", alignItems: "center", gap: 10, marginBottom: 10 },
  logoEmoji: { fontSize: 36 },
  logoText: { fontSize: 36, fontWeight: "300", color: "#FFFFFF" },
  logoTextBold: { fontWeight: "800" },
  headerSub: { fontSize: 14, color: "rgba(255,255,255,0.75)", textAlign: "center" },
  card: {
    backgroundColor: "#FFFFFF",
    borderRadius: 24,
    marginHorizontal: 20,
    marginTop: -24,
    padding: 28,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 16,
    elevation: 8,
  },
  cardTitle: { fontSize: 24, fontWeight: "800", color: "#0F172A", marginBottom: 4 },
  cardSub: { fontSize: 14, color: "#64748B", marginBottom: 28 },
  fieldGroup: { marginBottom: 18 },
  label: { fontSize: 14, fontWeight: "600", color: "#374151", marginBottom: 8 },
  inputWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#F8FAF9",
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: "#E5E7EB",
    paddingHorizontal: 14,
    height: 52,
    gap: 10,
  },
  inputIcon: { fontSize: 18 },
  input: { flex: 1, fontSize: 15, color: "#0F172A" },
  eyeBtn: { padding: 4 },
  forgotRow: { alignSelf: "flex-end", marginBottom: 24 },
  forgotText: { fontSize: 13, color: "#0D5C3D", fontWeight: "500" },
  loginButton: {
    backgroundColor: "#0D5C3D",
    borderRadius: 14,
    height: 54,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  loginButtonLoading: { opacity: 0.8 },
  loginButtonText: { fontSize: 16, fontWeight: "700", color: "#FFFFFF" },
  divider: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 20 },
  dividerLine: { flex: 1, height: 1, backgroundColor: "#E5E7EB" },
  dividerText: { fontSize: 13, color: "#94A3B8" },
  registerRow: { flexDirection: "row", justifyContent: "center" },
  registerText: { fontSize: 14, color: "#64748B" },
  registerLink: { fontSize: 14, fontWeight: "700", color: "#0D5C3D" },
  footer: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 24,
    lineHeight: 18,
  },
  footerLink: { color: "#0D5C3D", fontWeight: "500" },
});
