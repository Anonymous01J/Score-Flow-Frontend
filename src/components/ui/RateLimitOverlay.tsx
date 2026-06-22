import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { useRateLimit } from "../../store/RateLimitContext";
import { Clock } from "lucide-react-native";

export function RateLimitOverlay() {
  const { isPaused, secondsLeft } = useRateLimit();
  const theme = useTheme();
  const translateY = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (isPaused) {
      Animated.spring(translateY, {
        toValue: 0,
        useNativeDriver: true,
        tension: 80,
        friction: 12,
      }).start();
    } else {
      Animated.timing(translateY, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isPaused]);

  if (!isPaused && secondsLeft === 0) return null;

  return (
    <Animated.View
      style={[
        styles.container,
        { backgroundColor: theme.colors.errorContainer, transform: [{ translateY }] },
      ]}
    >
      <Clock size={16} color={theme.colors.onErrorContainer} strokeWidth={2.5} />
      <Text style={[styles.text, { color: theme.colors.onErrorContainer }]}>
        Límite de API alcanzado. Esperando {secondsLeft}s...
      </Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 50,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 24,
    zIndex: 9999,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  text: {
    fontSize: 13,
    fontWeight: "700",
  },
});
