/**
 * Heuristic Scorer — implements a multi-criteria decision-making heuristic
 * to score and rank different implementation candidates.
 */

// Heuristic Weights: must sum to 1.0
export const HEURISTIC_WEIGHTS = {
  gateCount: 0.30,          // Gate count minimization (30%)
  delay: 0.25,              // Propagation delay (25%)
  icCost: 0.20,             // IC purchase cost (20%)
  power: 0.15,              // Power consumption (15%)
  routingComplexity: 0.10   // Wiring complexity (10%)
};

/**
 * Calculates the multi-criteria score for each candidate, normalized from 0 (best) to 100 (worst).
 * @param {Array} candidates - Array of objects with properties: { name, gateCount, delay, icCost, power, routingComplexity }
 */
export function calculateTransparentScore(candidates) {
  if (!candidates || candidates.length === 0) return [];

  const keys = ['gateCount', 'delay', 'icCost', 'power', 'routingComplexity'];
  const labels = {
    gateCount: 'Gate Count',
    delay: 'Propagation Delay',
    icCost: 'IC Chip Cost',
    power: 'Power Consumption',
    routingComplexity: 'Routing Complexity'
  };

  // Find min and max for each metric across candidates for normalization
  const bounds = {};
  keys.forEach(key => {
    const vals = candidates.map(c => c[key] ?? 0);
    bounds[key] = {
      min: Math.min(...vals),
      max: Math.max(...vals)
    };
  });

  // Calculate scores
  const scored = candidates.map(cand => {
    const metricBreakdown = [];
    let finalScore = 0;

    keys.forEach(key => {
      const val = cand[key] ?? 0;
      const { min, max } = bounds[key];
      
      // Normalize (0 = best, 1 = worst). If min === max, it's a tie (normalize to 0)
      let normalized = 0;
      if (max !== min) {
        normalized = (val - min) / (max - min);
      }

      const weight = HEURISTIC_WEIGHTS[key];
      const contribution = parseFloat((normalized * weight * 100).toFixed(2));
      finalScore += contribution;

      metricBreakdown.push({
        name: labels[key],
        key,
        raw: val,
        normalized: parseFloat(normalized.toFixed(3)),
        weight,
        contribution
      });
    });

    return {
      name: cand.name,
      metrics: metricBreakdown,
      finalScore: parseFloat(finalScore.toFixed(2)),
      isWinner: false // will be determined below
    };
  });

  // Find the minimum score (lower is better)
  let minScore = Infinity;
  scored.forEach(c => {
    if (c.finalScore < minScore) {
      minScore = c.finalScore;
    }
  });

  // Mark the winner(s)
  scored.forEach(c => {
    if (c.finalScore === minScore) {
      c.isWinner = true;
    }
  });

  return scored;
}

/**
 * Generates natural language reasoning for why candidates won or lost.
 * @param {Array} scoredCandidates - Output of calculateTransparentScore
 */
export function generateWinLossReasons(scoredCandidates) {
  if (!scoredCandidates || scoredCandidates.length === 0) return [];

  const keys = ['gateCount', 'delay', 'icCost', 'power', 'routingComplexity'];
  
  // Find min/max indices or ranks for each metric
  const bounds = {};
  keys.forEach(key => {
    const vals = scoredCandidates.map(c => {
      const m = c.metrics.find(x => x.key === key);
      return m ? m.raw : 0;
    });
    bounds[key] = {
      min: Math.min(...vals),
      max: Math.max(...vals)
    };
  });

  return scoredCandidates.map(c => {
    const reasons = [];
    
    c.metrics.forEach(m => {
      const bound = bounds[m.key];
      const isLowest = m.raw === bound.min;
      const isHighest = m.raw === bound.max;

      if (isLowest && bound.min !== bound.max) {
        reasons.push({ type: 'pro', text: `Lowest ${m.name.toLowerCase()} (${m.raw})` });
      } else if (isHighest && bound.min !== bound.max) {
        reasons.push({ type: 'con', text: `Highest ${m.name.toLowerCase()} (${m.raw})` });
      }
    });

    let reasonText = '';
    if (c.isWinner) {
      const pros = reasons.filter(r => r.type === 'pro').map(r => r.text);
      reasonText = pros.length > 0 
        ? `Won because of optimal performance: ${pros.join(', ')}.`
        : 'Won due to best overall balanced score across all metrics.';
    } else {
      const cons = reasons.filter(r => r.type === 'con').map(r => r.text);
      const pros = reasons.filter(r => r.type === 'pro').map(r => r.text);
      
      let base = cons.length > 0 
        ? `Lost due to: ${cons.join(', ')}.`
        : 'Lost due to higher aggregate penalties.';
      
      if (pros.length > 0) {
        base += ` (Strengths: ${pros.join(', ')})`;
      }
      reasonText = base;
    }

    return {
      name: c.name,
      isWinner: c.isWinner,
      reason: reasonText
    };
  });
}
