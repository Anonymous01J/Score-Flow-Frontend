import { Prediction } from "../types";

export const computeConfidence = (p: Prediction): number => {
  // 1. Sample weight (max 50)
  const totalWeight = p.home_form_weight + p.away_form_weight;
  const sampleScore = Math.min(50, (totalWeight / 12) * 50);
  
  // 2. Elo difference (max 20)
  const eloDiff = Math.abs(p.elo_home - p.elo_away);
  const eloScore = Math.min(20, (eloDiff / 200) * 20);
  
  // 3. Decisiveness (max 20)
  const totalLambda = p.lambda_home + p.lambda_away;
  const maxLambda = Math.max(p.lambda_home, p.lambda_away);
  const maxProb = totalLambda > 0 ? maxLambda / totalLambda : 0.33;
  const decisiveness = Math.min(20, Math.max(0, ((maxProb - 0.33) / 0.40) * 20));
  
  // 4. Base recency (10)
  const recency = totalWeight > 0 ? 10 : 0;
  
  const total = sampleScore + eloScore + decisiveness + recency;
  return Math.min(99.9, Math.max(10.0, total));
};
