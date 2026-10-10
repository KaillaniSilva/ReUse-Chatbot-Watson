/**
 * AnimatedComponents.tsx
 * Componentes animados reutilizáveis do ReUse.
 *
 * Utiliza react-native-reanimated v4 para animações fluidas e performáticas.
 * Todos os cálculos de animação rodam na UI thread (worklets), sem bloquear o JS.
 */

import React from "react";
import {
  View,
  Pressable,
  PressableProps,
  ViewStyle,
  StyleProp,
} from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  withDelay,
  withRepeat,
  withSequence,
  Easing,
  Keyframe,
} from "react-native-reanimated";

// ─── SpringPressable ──────────────────────────────────────────────────────────
// Botão com escala mola no press — substitui o opacity simples por feedback tátil real.
// Keyframe: scale 1 → 0.94 (pressIn, 120ms ease-out) → 1 (pressOut, spring damping=15)

type SpringPressableProps = PressableProps & {
  style?: StyleProp<ViewStyle>;
  children: React.ReactNode;
};

export function SpringPressable({ children, style, onPress, ...rest }: SpringPressableProps) {
  const scale = useSharedValue(1);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Pressable
      onPressIn={() => {
        scale.value = withTiming(0.94, { duration: 120, easing: Easing.out(Easing.quad) });
      }}
      onPressOut={() => {
        scale.value = withSpring(1, { damping: 15, stiffness: 250 });
      }}
      onPress={onPress}
      {...rest}
    >
      <Animated.View style={[animStyle, style]}>{children}</Animated.View>
    </Pressable>
  );
}

// ─── AnimatedProgressBar ─────────────────────────────────────────────────────
// Barra de progresso com animação de largura (XP / nível).
// Keyframe: width 0 → progress% (600ms delay=400ms, easing cubic-out)

type ProgressBarProps = {
  progress: number; // 0.0 a 1.0
  color?: string;
  trackColor?: string;
  height?: number;
  borderRadius?: number;
  style?: StyleProp<ViewStyle>;
};

export function AnimatedProgressBar({
  progress,
  color = "#0D5C3D",
  trackColor = "#E8F5F0",
  height = 8,
  borderRadius = 99,
  style,
}: ProgressBarProps) {
  const [containerWidth, setContainerWidth] = React.useState(0);
  const animWidth = useSharedValue(0);

  React.useEffect(() => {
    if (containerWidth > 0) {
      animWidth.value = withDelay(
        400,
        withTiming(Math.max(0, Math.min(1, progress)) * containerWidth, {
          duration: 1000,
          easing: Easing.out(Easing.cubic),
        })
      );
    }
  }, [containerWidth, progress]);

  const barStyle = useAnimatedStyle(() => ({
    width: animWidth.value,
  }));

  return (
    <View
      style={[{ height, borderRadius, backgroundColor: trackColor, overflow: "hidden" }, style]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View
        style={[{ height, borderRadius, backgroundColor: color }, barStyle]}
      />
    </View>
  );
}

// ─── PulseView ────────────────────────────────────────────────────────────────
// Wrapper pulsante — ideal para badges de notificação e ícones de conquista.
// Keyframe: scale 1 → 1.08 → 1 (loop infinito, 900ms each way, easeInOut)

type PulseViewProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number; // quanto pulsa, default 1.08
};

export function PulseView({ children, style, intensity = 1.08 }: PulseViewProps) {
  const scale = useSharedValue(1);

  React.useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(intensity, { duration: 900, easing: Easing.inOut(Easing.ease) }),
        withTiming(1, { duration: 900, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}

// ─── FloatView ────────────────────────────────────────────────────────────────
// Flutuação suave no eixo Y — para hero icons e elementos decorativos.
// Keyframe: translateY 0 → -8 → 0 (loop infinito, 1800ms each way)

type FloatViewProps = {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  amplitude?: number; // pixels de flutuação, default 8
};

export function FloatView({ children, style, amplitude = 8 }: FloatViewProps) {
  const translateY = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withRepeat(
      withSequence(
        withTiming(-amplitude, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) })
      ),
      -1,
      false
    );
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  return <Animated.View style={[animStyle, style]}>{children}</Animated.View>;
}

// ─── Keyframe Animations (entering/exiting) ───────────────────────────────────
// Definições de keyframes declarativas usadas como prop `entering` em Animated.View.

/** FadeSlideUp: fade-in + sobe 24px → posição natural */
export const FadeSlideUpKeyframe = new Keyframe({
  0: { opacity: 0, transform: [{ translateY: 24 }] },
  60: { opacity: 0.85, transform: [{ translateY: 4 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }] },
});

/** ScaleBounceIn: escala de 0.4 → overshoots 1.1 → estabiliza em 1 */
export const ScaleBounceKeyframe = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.4 }] },
  60: { opacity: 1, transform: [{ scale: 1.12 }] },
  80: { transform: [{ scale: 0.96 }] },
  100: { opacity: 1, transform: [{ scale: 1 }] },
});

/** SlideInRight: entra pela direita com fade */
export const SlideInRightKeyframe = new Keyframe({
  0: { opacity: 0, transform: [{ translateX: 40 }] },
  70: { opacity: 0.9, transform: [{ translateX: -4 }] },
  100: { opacity: 1, transform: [{ translateX: 0 }] },
});

/** LevelUpKeyframe: animação de conquista/level-up (escala + giro suave) */
export const LevelUpKeyframe = new Keyframe({
  0: { opacity: 0, transform: [{ scale: 0.5 }, { rotate: "-10deg" }] },
  40: { opacity: 1, transform: [{ scale: 1.25 }, { rotate: "4deg" }] },
  70: { transform: [{ scale: 0.92 }, { rotate: "-2deg" }] },
  100: { opacity: 1, transform: [{ scale: 1 }, { rotate: "0deg" }] },
});
