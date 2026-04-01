import React from "react";
import { View, FlatList, StyleSheet } from "react-native";
import { Text, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { Star } from "lucide-react-native";
import { FixtureCard } from "../../src/components/ui/FixtureCard";
import { useFavorites } from "../../src/store/AppContext";

export default function FavoritesScreen() {
  const theme     = useTheme();
  const { favorites } = useFavorites();

  const handlePress = (fixtureId: number, league: string, home: string, away: string) => {
    router.push({
      pathname: "/(screens)/prediction",
      params: { fixture_id: fixtureId, league, home_team: home, away_team: away },
    });
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      <View style={styles.header}>
        <Text variant="headlineSmall" style={[styles.title, { color: theme.colors.onBackground }]}>
          Favoritos
        </Text>
        <Text variant="bodySmall" style={{ color: theme.colors.onSurfaceVariant }}>
          {favorites.length} partido{favorites.length !== 1 ? "s" : ""} guardado{favorites.length !== 1 ? "s" : ""}
        </Text>
      </View>

      {favorites.length === 0 ? (
        <View style={styles.empty}>
          <Star size={48} color={theme.colors.onSurfaceVariant} strokeWidth={1.5} />
          <Text style={[styles.emptyTitle, { color: theme.colors.onSurface }]}>
            Sin favoritos aún
          </Text>
          <Text style={[styles.emptyText, { color: theme.colors.onSurfaceVariant }]}>
            Toca la estrella ★ en cualquier partido para guardarlo aquí
          </Text>
        </View>
      ) : (
        <FlatList
          data={favorites}
          keyExtractor={(item) => String(item.fixture_id)}
          contentContainerStyle={styles.list}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <FixtureCard
              fixture={item}
              onPress={() => handlePress(item.fixture_id, item.league, item.home_team, item.away_team)}
            />
          )}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:  { flex: 1 },
  header:     { paddingHorizontal: 16, paddingTop: 8, paddingBottom: 20 },
  title:      { fontWeight: "800", marginBottom: 4 },
  list:       { paddingVertical: 8, paddingBottom: 24 },
  empty:      { flex: 1, justifyContent: "center", alignItems: "center", gap: 12, paddingHorizontal: 40 },
  emptyTitle: { fontSize: 18, fontWeight: "700", marginTop: 8 },
  emptyText:  { fontSize: 14, textAlign: "center", lineHeight: 20 },
});
