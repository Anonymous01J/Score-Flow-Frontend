import { Stack } from "expo-router";
import { PaperProvider } from "react-native-paper";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { ThemeProvider, FavoritesProvider, useTheme } from "../src/store/AppContext";
import { RateLimitProvider } from "../src/store/RateLimitContext";
import { ScoreFlowDarkTheme, ScoreFlowLightTheme } from "../src/store/theme";
import { RateLimitOverlay } from "../src/components/ui/RateLimitOverlay";

function RootLayoutInner() {
  const { isDark } = useTheme();
  const theme = isDark ? ScoreFlowDarkTheme : ScoreFlowLightTheme;

  return (
    <PaperProvider theme={theme}>
      <SafeAreaProvider>
        <StatusBar style={isDark ? "light" : "dark"} />
        <RateLimitOverlay />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="(screens)/prediction"
            options={{
              headerShown: false,
              presentation: "card",
              animation: "slide_from_right",
            }}
          />
        </Stack>
      </SafeAreaProvider>
    </PaperProvider>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <FavoritesProvider>
        <RateLimitProvider>
          <RootLayoutInner />
        </RateLimitProvider>
      </FavoritesProvider>
    </ThemeProvider>
  );
}
