import { Prediction } from "../types";
import { LEAGUES, QUALITY_LABELS, MARKET_LABELS } from "./constants";

export function formatTelegramMessage(pred: Prediction): string {
  const leagueInfo = LEAGUES[pred.league];
  const leagueName = leagueInfo?.name || pred.league;
  const flag = leagueInfo?.flag || "🏆";
  
  const qInfo = QUALITY_LABELS[pred.sample_quality];
  const qLabel = qInfo?.label || pred.sample_quality;
  const qEmoji = pred.sample_quality === "alta" ? "🟢" : pred.sample_quality === "media" ? "🟡" : "🔴";

  // Determinar favorito
  const probs = [
    { k: "1", v: pred.prob_home_win },
    { k: "X", v: pred.prob_draw },
    { k: "2", v: pred.prob_away_win }
  ].sort((a, b) => b.v - a.v);
  const topOutcome = probs[0];
  const topEmoji = topOutcome.k === "1" ? "🏠" : topOutcome.k === "X" ? "🤝" : "✈️";
  const topLabel = topOutcome.k === "1" ? "Local" : topOutcome.k === "X" ? "Empate" : "Visitante";

  let valueBetsBlock = "";
  if (pred.value_bets && pred.value_bets.length > 0) {
    const bets = pred.value_bets.map(vb => {
      const marketName = MARKET_LABELS[vb.market] || vb.market;
      return `  💎 ${marketName}: ${(vb.model_prob * 100).toFixed(0)}% vs ${(vb.bookmaker_prob * 100).toFixed(0)}% (edge +${(vb.edge * 100).toFixed(1)}%)`;
    }).join("\n");
    valueBetsBlock = `\n🎯 Value Bets detectadas:\n${bets}\n`;
  }

  const hashtagLeague = (pred.league || "Futbol").replace(/_/g, "");

  return `${flag} ${leagueName.toUpperCase()}
━━━━━━━━━━━━━━━━━━
🆚 ${pred.home_team} vs ${pred.away_team}
📅 ${pred.match_date}

📊 Probabilidades:
🏠 Local: ${(pred.prob_home_win * 100).toFixed(1)}%
🤝 Empate: ${(pred.prob_draw * 100).toFixed(1)}%
✈️ Visit.: ${(pred.prob_away_win * 100).toFixed(1)}%

⚽ BTTS: ${(pred.prob_btts * 100).toFixed(1)}%  |  O2.5: ${(pred.prob_over_25 * 100).toFixed(1)}%

🔮 Favorito: ${topEmoji} ${topLabel} (${(topOutcome.v * 100).toFixed(1)}%)
📐 Exp. Goals: ${pred.lambda_home.toFixed(2)} – ${pred.lambda_away.toFixed(2)}
${qEmoji} Confianza: ${qLabel}
${valueBetsBlock}
#ScoreFlow #${hashtagLeague} #Predicciones`;
}
