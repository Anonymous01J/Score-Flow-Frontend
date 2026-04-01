import React, { useState, useEffect } from "react";
import {
  View, StyleSheet, ScrollView, TouchableOpacity,
} from "react-native";
import {
  Text, Surface, ActivityIndicator, useTheme, ProgressBar,
} from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, Zap, Shield, TrendingUp } from "lucide-react-native";
import { api } from "../../src/utils/api";
import { LEAGUES, QUALITY_LABELS, MARKET_LABELS } from "../../src/utils/constants";
import type { Prediction, LeagueKey } from "../../src/types";

export default function PredictionScreen() {
  const theme  = useTheme();
  const params = useLocalSearchParams<{
    fixture_id: string;
    league:     string;
    home_team:  string;
    away_team:  string;
  }>();

  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const league     = (params.league as LeagueKey) || "premier_league";
  const leagueInfo = LEAGUES[league];

  useEffect(() => {
    api.getPrediction(Number(params.fixture_id), league)
      .then(setPrediction)
      .catch(() => setError("No se pudo cargar la predicción."))
      .finally(() => setLoading(false));
  }, [params.fixture_id]);

  const quality = prediction ? QUALITY_LABELS[prediction.sample_quality] : null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={theme.colors.onBackground} strokeWidth={1.8} />
        </TouchableOpacity>
        <View style={[styles.leaguePill, { backgroundColor: leagueInfo.color + "22" }]}>
          <Text style={[styles.leaguePillText, { color: leagueInfo.color }]}>
            {leagueInfo.flag} {leagueInfo.name}
          </Text>
        </View>
        <View style={{ width: 36 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>
            Calculando predicción...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={{ color: theme.colors.error, textAlign: "center" }}>{error}</Text>
        </View>
      ) : prediction ? (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>

          {/* Equipos + λ */}
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <View style={styles.teamsSection}>
              <View style={styles.teamBlock}>
                <Text style={[styles.teamName, { color: theme.colors.onSurface }]} numberOfLines={2}>
                  {prediction.home_team}
                </Text>
                <View style={[styles.lambdaBadge, { backgroundColor: theme.colors.primary + "22" }]}>
                  <Text style={[styles.lambdaValue, { color: theme.colors.primary }]}>
                    λ {prediction.lambda_home}
                  </Text>
                </View>
                <Text style={[styles.lambdaLabel, { color: theme.colors.onSurfaceVariant }]}>
                  goles esperados
                </Text>
              </View>

              <View style={styles.vsBlock}>
                <Text style={[styles.vsText, { color: theme.colors.onSurfaceVariant }]}>vs</Text>
              </View>

              <View style={[styles.teamBlock, styles.teamRight]}>
                <Text style={[styles.teamName, { color: theme.colors.onSurface, textAlign: "right" }]} numberOfLines={2}>
                  {prediction.away_team}
                </Text>
                <View style={[styles.lambdaBadge, { backgroundColor: theme.colors.secondary + "22" }]}>
                  <Text style={[styles.lambdaValue, { color: theme.colors.secondary }]}>
                    λ {prediction.lambda_away}
                  </Text>
                </View>
                <Text style={[styles.lambdaLabel, { color: theme.colors.onSurfaceVariant }]}>
                  goles esperados
                </Text>
              </View>
            </View>
          </Surface>

          {/* Probabilidades 1X2 */}
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Probabilidades 1X2
            </Text>

            {[
              { label: "Local",     prob: prediction.prob_home_win, color: theme.colors.primary },
              { label: "Empate",    prob: prediction.prob_draw,     color: theme.colors.secondary },
              { label: "Visitante", prob: prediction.prob_away_win, color: "#3b82f6" },
            ].map((item) => (
              <View key={item.label} style={styles.probRow}>
                <Text style={[styles.probLabel, { color: theme.colors.onSurfaceVariant }]}>
                  {item.label}
                </Text>
                <ProgressBar
                  progress={item.prob}
                  color={item.color}
                  style={styles.progressBar}
                />
                <Text style={[styles.probValue, { color: item.color }]}>
                  {(item.prob * 100).toFixed(1)}%
                </Text>
              </View>
            ))}
          </Surface>

          {/* Marcadores más probables */}
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>
              Top 5 Marcadores
            </Text>
            {prediction.top_scorelines.map((s, i) => (
              <View
                key={i}
                style={[
                  styles.scorelineRow,
                  i === 0 && { backgroundColor: theme.colors.primary + "11", borderRadius: 10 },
                ]}
              >
                <Text style={[styles.scorelineRank, { color: theme.colors.onSurfaceVariant }]}>
                  #{i + 1}
                </Text>
                <View style={[styles.scoreBox, { backgroundColor: theme.colors.surfaceVariant }]}>
                  <Text style={[styles.scoreText, { color: theme.colors.onSurface }]}>
                    {s.home} – {s.away}
                  </Text>
                </View>
                <ProgressBar
                  progress={s.probability}
                  color={i === 0 ? theme.colors.primary : theme.colors.onSurfaceVariant}
                  style={[styles.progressBar, { flex: 1 }]}
                />
                <Text style={[styles.probValue, { color: i === 0 ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>
                  {(s.probability * 100).toFixed(1)}%
                </Text>
              </View>
            ))}
          </Surface>

          {/* Value Bets */}
          {prediction.value_bets.length > 0 && (
            <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
              <View style={styles.sectionTitleRow}>
                <Zap size={16} color="#f59e0b" fill="#f59e0b" />
                <Text style={[styles.sectionTitle, { color: theme.colors.onSurface, marginLeft: 6 }]}>
                  Valor detectado
                </Text>
              </View>
              {prediction.value_bets.map((vb, i) => (
                <View key={i} style={[styles.valueBetRow, { backgroundColor: "#f59e0b11", borderRadius: 10 }]}>
                  <Text style={[styles.valueBetMarket, { color: "#f59e0b" }]}>
                    {MARKET_LABELS[vb.market]}
                  </Text>
                  <Text style={[styles.valueBetDetail, { color: theme.colors.onSurfaceVariant }]}>
                    Modelo: {(vb.model_prob * 100).toFixed(1)}% · Implícita: {(vb.bookmaker_prob * 100).toFixed(1)}%
                  </Text>
                  <Text style={[styles.valueBetEdge, { color: "#22c55e" }]}>
                    +{(vb.edge * 100).toFixed(1)}% ventaja
                  </Text>
                </View>
              ))}
            </Surface>
          )}

          {/* Confianza del modelo */}
          <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
            <View style={styles.sectionTitleRow}>
              <Shield size={16} color={quality?.color} strokeWidth={1.8} />
              <Text style={[styles.sectionTitle, { color: theme.colors.onSurface, marginLeft: 6 }]}>
                Confianza del modelo
              </Text>
            </View>
            <View style={styles.qualityRow}>
              <View style={[styles.qualityBadge, { backgroundColor: quality?.color + "22" }]}>
                <Text style={[styles.qualityLabel, { color: quality?.color }]}>
                  {quality?.label}
                </Text>
              </View>
            </View>
            <View style={styles.formRow}>
              <View style={styles.formItem}>
                <TrendingUp size={14} color={theme.colors.primary} strokeWidth={1.8} />
                <Text style={[styles.formLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Forma local: {prediction.home_form_weight.toFixed(2)}
                </Text>
              </View>
              <View style={styles.formItem}>
                <TrendingUp size={14} color={theme.colors.secondary} strokeWidth={1.8} />
                <Text style={[styles.formLabel, { color: theme.colors.onSurfaceVariant }]}>
                  Forma visitante: {prediction.away_form_weight.toFixed(2)}
                </Text>
              </View>
            </View>
          </Surface>

          <View style={{ height: 32 }} />
        </ScrollView>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1 },
  header:          { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  backBtn:         { padding: 8, borderRadius: 10 },
  leaguePill:      { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  leaguePillText:  { fontSize: 12, fontWeight: "700" },
  centered:        { flex: 1, justifyContent: "center", alignItems: "center", gap: 8 },
  scroll:          { padding: 16, gap: 12 },
  card:            { borderRadius: 16, padding: 16 },
  sectionTitle:    { fontSize: 14, fontWeight: "700", marginBottom: 14 },
  sectionTitleRow: { flexDirection: "row", alignItems: "center", marginBottom: 14 },
  teamsSection:    { flexDirection: "row", alignItems: "flex-start" },
  teamBlock:       { flex: 1, alignItems: "flex-start" },
  teamRight:       { alignItems: "flex-end" },
  teamName:        { fontSize: 15, fontWeight: "800", marginBottom: 10, lineHeight: 20 },
  lambdaBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, marginBottom: 4 },
  lambdaValue:     { fontSize: 16, fontWeight: "800" },
  lambdaLabel:     { fontSize: 11 },
  vsBlock:         { paddingHorizontal: 12, paddingTop: 4 },
  vsText:          { fontSize: 14, fontWeight: "600" },
  probRow:         { flexDirection: "row", alignItems: "center", marginBottom: 12, gap: 10 },
  probLabel:       { width: 72, fontSize: 13, fontWeight: "600" },
  progressBar:     { flex: 1, height: 8, borderRadius: 4 },
  probValue:       { width: 44, fontSize: 13, fontWeight: "700", textAlign: "right" },
  scorelineRow:    { flexDirection: "row", alignItems: "center", padding: 8, marginBottom: 6, gap: 10 },
  scorelineRank:   { width: 24, fontSize: 12 },
  scoreBox:        { paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  scoreText:       { fontSize: 15, fontWeight: "800" },
  valueBetRow:     { padding: 12, marginBottom: 8, gap: 4 },
  valueBetMarket:  { fontSize: 14, fontWeight: "800" },
  valueBetDetail:  { fontSize: 12 },
  valueBetEdge:    { fontSize: 13, fontWeight: "700" },
  qualityRow:      { marginBottom: 12 },
  qualityBadge:    { alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  qualityLabel:    { fontSize: 13, fontWeight: "700" },
  formRow:         { gap: 8 },
  formItem:        { flexDirection: "row", alignItems: "center", gap: 8 },
  formLabel:       { fontSize: 13 },
});
