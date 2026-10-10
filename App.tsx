/**
 * App.tsx — Raiz do ReUse!
 *
 * Fluxo de navegação:
 *  Splash → (primeira vez) Onboarding → Login / Register → MainApp
 *  Splash → (retorno)                 → Login → MainApp
 *
 * Dentro do MainApp (bottom tabs):
 *  Marketplace | PostItem (+) | Messages | Profile
 *
 * Telas modais / push acessíveis de qualquer aba:
 *  ItemDetail, Chat, EditProfile, Favorites, Settings, About, Gamification
 */

import "./global.css";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { AuthProvider } from "./src/contexts/AuthContext";

import type { RootStackParamList } from "./src/navigation/types";
import { AppNavigator } from "./src/navigation/AppNavigator";

// Telas de autenticação / onboarding
import { SplashScreen } from "./src/screens/SplashScreen";
import { OnboardingScreen } from "./src/screens/OnboardingScreen";
import { LoginScreen } from "./src/screens/LoginScreen";
import { RegisterScreen } from "./src/screens/RegisterScreen";

// Telas modais / push do stack raiz
import { ItemDetailScreen } from "./src/screens/ItemDetailScreen";
import { ChatScreen } from "./src/screens/ChatScreen";
import { EditProfileScreen } from "./src/screens/EditProfileScreen";
import { FavoritesScreen } from "./src/screens/FavoritesScreen";
import { SettingsScreen } from "./src/screens/SettingsScreen";
import { AboutScreen } from "./src/screens/AboutScreen";
import { GamificationScreen } from "./src/screens/GamificationScreen";
import { NotificationsScreen } from "./src/screens/NotificationsScreen";
import { AssistantScreen } from "./src/screens/AssistantScreen";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <AuthProvider>
    <SafeAreaProvider>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="Splash"
          screenOptions={{
            headerShown: false,
            animation: "slide_from_right",
          }}
        >
          {/* ── Auth / Onboarding ─────────────────────────────── */}
          <Stack.Screen name="Splash" component={SplashScreen} options={{ animation: "none" }} />
          <Stack.Screen name="Onboarding" component={OnboardingScreen} options={{ animation: "fade" }} />
          <Stack.Screen name="Login" component={LoginScreen} options={{ animation: "fade" }} />
          <Stack.Screen name="Register" component={RegisterScreen} />

          {/* ── App principal (bottom tabs) ───────────────────── */}
          <Stack.Screen
            name="MainApp"
            component={AppNavigator}
            options={{ animation: "fade" }}
          />

          {/* ── Telas acessíveis de qualquer aba ─────────────── */}
          <Stack.Screen
            name="ItemDetail"
            component={ItemDetailScreen}
            options={{
              headerShown: true,
              title: "",
              headerTransparent: true,
              headerTintColor: "#0F172A",
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="Chat"
            component={ChatScreen}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="EditProfile"
            component={EditProfileScreen}
            options={{ animation: "slide_from_bottom" }}
          />
          <Stack.Screen
            name="Favorites"
            component={FavoritesScreen}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="Settings"
            component={SettingsScreen}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="About"
            component={AboutScreen}
            options={{
              headerShown: true,
              title: "Sobre o projeto",
              headerStyle: { backgroundColor: "#FFFFFF" },
              headerTintColor: "#0D5C3D",
              headerTitleStyle: { fontWeight: "700" },
              animation: "slide_from_right",
            }}
          />
          <Stack.Screen
            name="Gamification"
            component={GamificationScreen}
            options={{
              headerShown: true,
              title: "Minhas Conquistas",
              headerStyle: { backgroundColor: "#FFFFFF" },
              headerTintColor: "#0D5C3D",
              headerTitleStyle: { fontWeight: "700" },
              animation: "slide_from_bottom",
            }}
          />
          <Stack.Screen
            name="Notifications"
            component={NotificationsScreen}
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="Assistant"
            component={AssistantScreen}
            options={{ animation: "slide_from_bottom" }}
          />
        </Stack.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
    </AuthProvider>
  );
}
