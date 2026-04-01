import { Tabs } from "expo-router";
import { useTheme as usePaperTheme } from "react-native-paper";
import { useTheme } from "../../src/store/AppContext";
import { Calendar, Trophy, Star } from "lucide-react-native";

export default function TabsLayout() {
  const paperTheme = usePaperTheme();
  const { isDark } = useTheme();

  const bg     = paperTheme.colors.surface;
  const active = paperTheme.colors.primary;
  const inactive = isDark ? "#475569" : "#94a3b8";

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: bg,
          borderTopColor: isDark ? "#1e293b" : "#e2e8f0",
          borderTopWidth: 1,
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarActiveTintColor:   active,
        tabBarInactiveTintColor: inactive,
        tabBarLabelStyle: {
          fontSize: 11,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Hoy",
          tabBarIcon: ({ color, size }) => (
            <Calendar size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="leagues"
        options={{
          title: "Ligas",
          tabBarIcon: ({ color, size }) => (
            <Trophy size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
      <Tabs.Screen
        name="favorites"
        options={{
          title: "Favoritos",
          tabBarIcon: ({ color, size }) => (
            <Star size={size} color={color} strokeWidth={1.8} />
          ),
        }}
      />
    </Tabs>
  );
}
