import React, { useState, useEffect } from "react";
import {
  View, StyleSheet, ScrollView, TouchableOpacity, Platform,
} from "react-native";
import { Text, Surface, ActivityIndicator, useTheme } from "react-native-paper";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, router } from "expo-router";
import { ArrowLeft, Zap, Shield, TrendingUp, AlertCircle, Info } from "lucide-react-native";
import { api } from "../../src/utils/api";
import { LEAGUES, QUALITY_LABELS, MARKET_LABELS } from "../../src/utils/constants";
import type { Prediction, LeagueKey } from "../../src/types";

const isWeb = Platform.OS === "web";

// ─── Bar visual personalizada (sin ProgressBar de Paper) ─────────────────────

function ProbBar({
  label, prob, color, sublabel,
}: {
  label: string; prob: number; color: string; sublabel?: string;
}) {
  const theme = useTheme();
  const pct   = (prob * 100).toFixed(1);

  return (
    <View style={probStyles.row}>
      <View style={probStyles.labelCol}>
        <Text style={[probStyles.label, { color: theme.colors.onSurface }]}>{label}</Text>
        {sublabel && <Text style={[probStyles.sublabel, { color: theme.colors.onSurfaceVariant }]}>{sublabel}</Text>}
      </View>
      <View style={[probStyles.barTrack, { backgroundColor: theme.colors.surfaceVariant }]}>
        <View style={[probStyles.barFill, { width: `${prob * 100}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[probStyles.pct, { color }]}>{pct}%</Text>
    </View>
  );
}

const probStyles = StyleSheet.create({
  row:      { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 12 },
  labelCol: { width: 80 },
  label:    { fontSize: 13, fontWeight: "700" },
  sublabel: { fontSize: 10, marginTop: 1 },
  barTrack: { flex: 1, height: 10, borderRadius: 5, overflow: "hidden" },
  barFill:  { height: 10, borderRadius: 5, minWidth: 4 },
  pct:      { width: 46, fontSize: 14, fontWeight: "800", textAlign: "right" },
});

// ─── Tarjeta de marcador ──────────────────────────────────────────────────────

function ScoreCard({
  rank, home, away, probability, isTop,
}: {
  rank: number; home: number; away: number; probability: number; isTop: boolean;
}) {
  const theme = useTheme();
  const pct   = (probability * 100).toFixed(1);

  const result = home > away ? "Local gana" : home < away ? "Visitante gana" : "Empate";
  const resultColor =
    home > away ? theme.colors.primary :
    home < away ? "#3b82f6" :
    theme.colors.secondary;

  return (
    <View style={[
      scoreStyles.card,
      { backgroundColor: isTop ? theme.colors.primary + "14" : theme.colors.surfaceVariant + "60" },
      isTop && { borderWidth: 1, borderColor: theme.colors.primary + "40" },
    ]}>
      {isTop && (
        <View style={[scoreStyles.topBadge, { backgroundColor: theme.colors.primary }]}>
          <Text style={scoreStyles.topBadgeText}>MÁS PROBABLE</Text>
        </View>
      )}
      <View style={scoreStyles.row}>
        <Text style={[scoreStyles.rank, { color: theme.colors.onSurfaceVariant }]}>#{rank}</Text>
        <View style={[scoreStyles.scoreBox, { backgroundColor: isTop ? theme.colors.primary + "22" : theme.colors.surface }]}>
          <Text style={[scoreStyles.score, { color: isTop ? theme.colors.primary : theme.colors.onSurface }]}>
            {home} – {away}
          </Text>
        </View>
        <Text style={[scoreStyles.result, { color: resultColor }]}>{result}</Text>
        <Text style={[scoreStyles.pct, { color: isTop ? theme.colors.primary : theme.colors.onSurfaceVariant }]}>
          {pct}%
        </Text>
      </View>
    </View>
  );
}

const scoreStyles = StyleSheet.create({
  card:         { borderRadius: 12, padding: 12, marginBottom: 8, overflow: "hidden" },
  topBadge:     { alignSelf: "flex-start", paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginBottom: 8 },
  topBadgeText: { color: "#fff", fontSize: 9, fontWeight: "800", letterSpacing: 0.8 },
  row:          { flexDirection: "row", alignItems: "center", gap: 10 },
  rank:         { width: 22, fontSize: 12 },
  scoreBox:     { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 8 },
  score:        { fontSize: 18, fontWeight: "900" },
  result:       { flex: 1, fontSize: 12, fontWeight: "600" },
  pct:          { fontSize: 15, fontWeight: "800", minWidth: 44, textAlign: "right" },
});

// ─── Advertencia datos vacíos ─────────────────────────────────────────────────

function NoDataWarning({ homeTeam, awayTeam }: { homeTeam: string; awayTeam: string }) {
  const theme = useTheme();
  return (
    <Surface style={[warningStyles.card, { backgroundColor: "#f59e0b14", borderColor: "#f59e0b44" }]} elevation={0}>
      <View style={warningStyles.row}>
        <AlertCircle size={18} color="#f59e0b" strokeWidth={1.8} />
        <Text style={[warningStyles.title, { color: "#f59e0b" }]}>Datos xG no disponibles</Text>
      </View>
      <Text style={[warningStyles.body, { color: theme.colors.onSurfaceVariant }]}>
        No se encontró historial de xG para <Text style={{ fontWeight: "700", color: theme.colors.onSurface }}>{homeTeam}</Text> o{" "}
        <Text style={{ fontWeight: "700", color: theme.colors.onSurface }}>{awayTeam}</Text> en Understat.
        {"\n\n"}Esto ocurre cuando un equipo no está en la liga seleccionada (ej: equipo de Segunda División en datos de La Liga), o cuando el nombre no coincide exactamente.
        {"\n\n"}La predicción usa valores promedio de liga como fallback — tómala con precaución.
      </Text>
    </Surface>
  );
}

const warningStyles = StyleSheet.create({
  card:  { borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 0 },
  row:   { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  title: { fontSize: 13, fontWeight: "700" },
  body:  { fontSize: 13, lineHeight: 20 },
});

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function PredictionScreen() {
  const theme  = useTheme();
  const params = useLocalSearchParams<{
    fixture_id: string; league: string; home_team: string; away_team: string;
  }>();

  const [prediction, setPrediction] = useState<Prediction | null>(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);

  const league     = (params.league as LeagueKey) || "premier_league";
  const leagueInfo = LEAGUES[league];

  useEffect(() => {
    api.getPrediction(Number(params.fixture_id), league)
      .then(setPrediction)
      .catch(() => setError("No se pudo cargar la predicción.\nVerifica que el partido esté disponible."))
      .finally(() => setLoading(false));
  }, [params.fixture_id]);

  const quality    = prediction ? QUALITY_LABELS[prediction.sample_quality] : null;
  const hasNoData  = prediction && prediction.home_form_weight === 0 && prediction.away_form_weight === 0;
  const totalProb  = prediction
    ? prediction.prob_home_win + prediction.prob_draw + prediction.prob_away_win
    : 0;

  const content = (
    <>
      {/* Advertencia si no hay datos */}
      {hasNoData && (
        <NoDataWarning homeTeam={prediction!.home_team} awayTeam={prediction!.away_team} />
      )}

      {/* Equipos + λ */}
      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <View style={styles.teamsSection}>
          <View style={styles.teamBlock}>
            <Text style={[styles.teamName, { color: theme.colors.onSurface }]} numberOfLines={2}>
              {prediction?.home_team}
            </Text>
            <View style={[styles.lambdaBadge, { backgroundColor: theme.colors.primary + "20" }]}>
              <Text style={[styles.lambdaValue, { color: theme.colors.primary }]}>
                λ {prediction?.lambda_home}
              </Text>
            </View>
            <Text style={[styles.lambdaExplain, { color: theme.colors.onSurfaceVariant }]}>
              goles esperados{"\n"}como local
            </Text>
          </View>

          <View style={styles.vsBlock}>
            <Text style={[styles.vsText, { color: theme.colors.onSurfaceVariant }]}>VS</Text>
          </View>

          <View style={[styles.teamBlock, styles.teamRight]}>
            <Text style={[styles.teamName, { color: theme.colors.onSurface, textAlign: "right" }]} numberOfLines={2}>
              {prediction?.away_team}
            </Text>
            <View style={[styles.lambdaBadge, { backgroundColor: theme.colors.secondary + "20" }]}>
              <Text style={[styles.lambdaValue, { color: theme.colors.secondary }]}>
                λ {prediction?.lambda_away}
              </Text>
            </View>
            <Text style={[styles.lambdaExplain, { color: theme.colors.onSurfaceVariant, textAlign: "right" }]}>
              goles esperados{"\n"}como visitante
            </Text>
          </View>
        </View>
      </Surface>

      {/* Probabilidades 1X2 */}
      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <View style={styles.sectionTitleRow}>
          <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Probabilidades 1X2</Text>
          <View style={[styles.infoPill, { backgroundColor: theme.colors.surfaceVariant }]}>
            <Info size={11} color={theme.colors.onSurfaceVariant} strokeWidth={2} />
            <Text style={[styles.infoText, { color: theme.colors.onSurfaceVariant }]}>
              Modelo Poisson + Dixon-Coles
            </Text>
          </View>
        </View>
        <ProbBar
          label="Local"
          prob={prediction?.prob_home_win ?? 0}
          color={theme.colors.primary}
          sublabel={prediction ? `${(prediction.prob_home_win * 100).toFixed(0)}% de 100%` : ""}
        />
        <ProbBar
          label="Empate"
          prob={prediction?.prob_draw ?? 0}
          color={theme.colors.secondary}
        />
        <ProbBar
          label="Visitante"
          prob={prediction?.prob_away_win ?? 0}
          color="#3b82f6"
        />
        <View style={[styles.divider, { backgroundColor: theme.colors.outline }]} />
        <Text style={[styles.probNote, { color: theme.colors.onSurfaceVariant }]}>
          La suma de probabilidades es ~{(totalProb * 100).toFixed(0)}% (normalizado por Dixon-Coles).
          El resultado más probable según el modelo es{" "}
          <Text style={{ fontWeight: "700", color: theme.colors.onSurface }}>
            {prediction && prediction.prob_home_win > prediction.prob_draw && prediction.prob_home_win > prediction.prob_away_win
              ? `victoria local (${(prediction.prob_home_win * 100).toFixed(1)}%)`
              : prediction && prediction.prob_draw > prediction.prob_away_win
              ? `empate (${(prediction?.prob_draw * 100).toFixed(1)}%)`
              : `victoria visitante (${(prediction?.prob_away_win * 100).toFixed(1)}%)`
            }
          </Text>.
        </Text>
      </Surface>

      {/* Marcadores top 5 */}
      <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
        <Text style={[styles.sectionTitle, { color: theme.colors.onSurface }]}>Top 5 Marcadores</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
          Probabilidad de cada marcador exacto según la matriz Poisson
        </Text>
        {prediction?.top_scorelines.map((s, i) => (
          <ScoreCard
            key={i}
            rank={i + 1}
            home={s.home}
            away={s.away}
            probability={s.probability}
            isTop={i === 0}
          />
        ))}
      </Surface>

      {/* Value Bets */}
      {(prediction?.value_bets?.length ?? 0) > 0 && (
        <Surface style={[styles.card, { backgroundColor: theme.colors.surface }]} elevation={1}>
          <View style={styles.sectionTitleRow}>
            <Zap size={16} color="#f59e0b" fill="#f59e0b" />
            <Text style={[styles.sectionTitle, { color: theme.colors.onSurface, marginLeft: 6 }]}>
              Valor detectado ⚡
            </Text>
          </View>
          <Text style={[styles.sectionSubtitle, { color: theme.colors.onSurfaceVariant }]}>
            El modelo estima una probabilidad mayor a la implícita en las cuotas
          </Text>
          {prediction?.value_bets.map((vb, i) => (
            <View key={i} style={[styles.valueBetCard, { backgroundColor: "#f59e0b0e", borderColor: "#f59e0b33" }]}>
              <View style={styles.valueBetHeader}>
                <Text style={[styles.valueBetMarket, { color: "#f59e0b" }]}>
                  {MARKET_LABELS[vb.market]}
                </Text>
                <View style={[styles.edgeBadge, { backgroundColor: "#22c55e22" }]}>
                  <Text style={{ color: "#22c55e", fontSize: 13, fontWeight: "800" }}>
                    +{(vb.edge * 100).toFixed(1)}% ventaja
                  </Text>
                </View>
              </View>
              <View style={styles.valueBetRow}>
                <View style={styles.valueBetStat}>
                  <Text style={[styles.valueBetStatLabel, { color: theme.colors.onSurfaceVariant }]}>Modelo</Text>
                  <Text style={[styles.valueBetStatValue, { color: theme.colors.primary }]}>
                    {(vb.model_prob * 100).toFixed(1)}%
                  </Text>
                </View>
                <View style={[styles.valueBetDivider, { backgroundColor: theme.colors.outline }]} />
                <View style={styles.valueBetStat}>
                  <Text style={[styles.valueBetStatLabel, { color: theme.colors.onSurfaceVariant }]}>Cuota implícita</Text>
                  <Text style={[styles.valueBetStatValue, { color: theme.colors.onSurface }]}>
                    {(vb.bookmaker_prob * 100).toFixed(1)}%
                  </Text>
                </View>
              </View>
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
          <View style={[styles.qualityBadge, { backgroundColor: quality?.color + "22" }]}>
            <Text style={[styles.qualityLabel, { color: quality?.color }]}>{quality?.label}</Text>
          </View>
        </View>

        <View style={styles.formGrid}>
          <View style={[styles.formCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <TrendingUp size={16} color={theme.colors.primary} strokeWidth={1.8} />
            <Text style={[styles.formCardLabel, { color: theme.colors.onSurfaceVariant }]}>Forma local</Text>
            <Text style={[styles.formCardValue, { color: prediction && prediction.home_form_weight > 0 ? theme.colors.primary : theme.colors.error }]}>
              {prediction?.home_form_weight.toFixed(2)}
            </Text>
            <Text style={[styles.formCardSub, { color: theme.colors.onSurfaceVariant }]}>
              {prediction && prediction.home_form_weight > 0
                ? "Datos xG disponibles"
                : "Sin datos xG — usando promedio de liga"}
            </Text>
          </View>
          <View style={[styles.formCard, { backgroundColor: theme.colors.surfaceVariant }]}>
            <TrendingUp size={16} color={theme.colors.secondary} strokeWidth={1.8} />
            <Text style={[styles.formCardLabel, { color: theme.colors.onSurfaceVariant }]}>Forma visitante</Text>
            <Text style={[styles.formCardValue, { color: prediction && prediction.away_form_weight > 0 ? theme.colors.secondary : theme.colors.error }]}>
              {prediction?.away_form_weight.toFixed(2)}
            </Text>
            <Text style={[styles.formCardSub, { color: theme.colors.onSurfaceVariant }]}>
              {prediction && prediction.away_form_weight > 0
                ? "Datos xG disponibles"
                : "Sin datos xG — usando promedio de liga"}
            </Text>
          </View>
        </View>

        <Text style={[styles.qualityExplain, { color: theme.colors.onSurfaceVariant }]}>
          {prediction?.sample_quality === "alta"
            ? "✅ El modelo tiene suficientes partidos recientes de ambos equipos en Understat para calcular xG ponderado con precisión."
            : prediction?.sample_quality === "media"
            ? "⚠️ Datos parciales disponibles. La predicción es orientativa pero menos precisa que con muestra completa."
            : "🔴 Datos insuficientes o no disponibles. La predicción usa valores promedio de liga — úsala solo como referencia."}
        </Text>
      </Surface>

      <View style={{ height: 32 }} />
    </>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.colors.background }]}>
      {/* Header */}
      <View style={[styles.header, isWeb && styles.headerWeb]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <ArrowLeft size={22} color={theme.colors.onBackground} strokeWidth={1.8} />
        </TouchableOpacity>
        <View style={[styles.leaguePill, { backgroundColor: leagueInfo.color + "22" }]}>
          <Text style={[styles.leaguePillText, { color: leagueInfo.color }]}>
            {leagueInfo.flag} {leagueInfo.name}
          </Text>
        </View>
        <View style={{ width: 38 }} />
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={{ color: theme.colors.onSurfaceVariant, marginTop: 12 }}>
            Calculando predicción con Poisson + Dixon-Coles...
          </Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <AlertCircle size={40} color={theme.colors.error} strokeWidth={1.5} />
          <Text style={{ color: theme.colors.error, textAlign: "center", marginTop: 12, lineHeight: 22 }}>
            {error}
          </Text>
          <TouchableOpacity onPress={() => router.back()} style={styles.retryBtn}>
            <Text style={{ color: theme.colors.primary, fontWeight: "700" }}>← Volver</Text>
          </TouchableOpacity>
        </View>
      ) : prediction ? (
        isWeb ? (
          <View style={styles.webLayout}>
            <ScrollView style={styles.webScrollLeft} contentContainerStyle={styles.webScrollContent} showsVerticalScrollIndicator={false}>
              {content}
            </ScrollView>
          </View>
        ) : (
          <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
            {content}
          </ScrollView>
        )
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:        { flex: 1 },
  header:           { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12 },
  headerWeb:        { maxWidth: 860, width: "100%" as any, alignSelf: "center" as any },
  backBtn:          { padding: 8, borderRadius: 10 },
  leaguePill:       { paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20 },
  leaguePillText:   { fontSize: 12, fontWeight: "700" },
  centered:         { flex: 1, justifyContent: "center", alignItems: "center", gap: 8, paddingHorizontal: 32 },
  retryBtn:         { marginTop: 12, padding: 12 },
  scroll:           { padding: 16, gap: 12 },
  webLayout:        { flex: 1, alignItems: "center" as any },
  webScrollLeft:    { width: "100%" as any, maxWidth: 860, alignSelf: "center" as any },
  webScrollContent: { padding: 24, gap: 14 },
  card:             { borderRadius: 16, padding: 16 },
  sectionTitle:     { fontSize: 15, fontWeight: "800" },
  sectionTitleRow:  { flexDirection: "row", alignItems: "center", marginBottom: 14, gap: 8, flexWrap: "wrap" as any },
  sectionSubtitle:  { fontSize: 12, marginBottom: 14, lineHeight: 18 },
  infoPill:         { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  infoText:         { fontSize: 10, fontWeight: "600" },
  divider:          { height: 1, marginVertical: 12 },
  probNote:         { fontSize: 12, lineHeight: 18 },
  teamsSection:     { flexDirection: "row", alignItems: "flex-start" },
  teamBlock:        { flex: 1, alignItems: "flex-start" },
  teamRight:        { alignItems: "flex-end" },
  teamName:         { fontSize: 16, fontWeight: "800", marginBottom: 10, lineHeight: 22 },
  lambdaBadge:      { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, marginBottom: 6 },
  lambdaValue:      { fontSize: 17, fontWeight: "900" },
  lambdaExplain:    { fontSize: 11, lineHeight: 16 },
  vsBlock:          { paddingHorizontal: 12, paddingTop: 6 },
  vsText:           { fontSize: 12, fontWeight: "700", letterSpacing: 1 },
  valueBetCard:     { borderRadius: 12, padding: 14, marginBottom: 10, borderWidth: 1 },
  valueBetHeader:   { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  valueBetMarket:   { fontSize: 15, fontWeight: "800" },
  edgeBadge:        { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  valueBetRow:      { flexDirection: "row", alignItems: "center" },
  valueBetStat:     { flex: 1, alignItems: "center", gap: 4 },
  valueBetStatLabel:{ fontSize: 11, fontWeight: "600" },
  valueBetStatValue:{ fontSize: 20, fontWeight: "900" },
  valueBetDivider:  { width: 1, height: 36, marginHorizontal: 8 },
  qualityBadge:     { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  qualityLabel:     { fontSize: 12, fontWeight: "700" },
  qualityExplain:   { fontSize: 12, lineHeight: 20, marginTop: 12 },
  formGrid:         { flexDirection: "row", gap: 10, marginBottom: 12 },
  formCard:         { flex: 1, borderRadius: 12, padding: 12, gap: 4 },
  formCardLabel:    { fontSize: 11, fontWeight: "600", marginTop: 4 },
  formCardValue:    { fontSize: 22, fontWeight: "900" },
  formCardSub:      { fontSize: 10, lineHeight: 14 },
});
