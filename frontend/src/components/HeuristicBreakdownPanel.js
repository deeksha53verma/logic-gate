import React, { useMemo } from 'react';
import { calculateTransparentScore, generateWinLossReasons } from '../heuristics/heuristicScorer';

const COLORS = {
  bg: 'rgba(15,23,42,0.92)',
  card: 'rgba(15,23,42,0.55)',
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(6,182,212,0.4)',
  text: '#f8fafc',
  textDim: '#94a3b8',
  cyan: '#06b6d4',
  green: '#10b981',
  red: '#ef4444',
  amber: '#f59e0b',
  blue: '#3b82f6',
  purple: '#a855f7',
};

const METRIC_COLORS = {
  gateCount: '#3b82f6',
  delay: '#f59e0b',
  icCost: '#10b981',
  power: '#a855f7',
  routingComplexity: '#06b6d4'
};

const HeuristicBreakdownPanel = ({ candidates }) => {
  // Compute transparent scores and win/loss reasoning
  const scoredCandidates = useMemo(() => {
    if (!candidates || candidates.length === 0) return [];
    return calculateTransparentScore(candidates);
  }, [candidates]);

  const reasons = useMemo(() => {
    if (scoredCandidates.length === 0) return [];
    return generateWinLossReasons(scoredCandidates);
  }, [scoredCandidates]);

  if (!candidates || candidates.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🏆</div>
        <h3 style={{ color: COLORS.text }}>No Candidates to Rank</h3>
        <p style={{ color: COLORS.textDim }}>Synthesize a logic expression first to run the heuristic ranking engine.</p>
      </div>
    );
  }

  // Find winner
  const winner = scoredCandidates.find(c => c.isWinner);

  return (
    <div>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: COLORS.text }}>Transparent Heuristic Winner Selection</h2>
        <span className="badge" style={{
          background: 'linear-gradient(135deg, #06b6d4, #10b981)',
          color: '#fff', fontSize: 11,
        }}>DAA Decision Engine</span>
      </div>

      {/* Why they won/lost boxes */}
      {winner && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
          {/* Winner explanation */}
          <div className="glass-panel" style={{
            margin: 0,
            background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.03))',
            border: `1px solid ${COLORS.green}`,
            boxShadow: '0 0 16px rgba(16,185,129,0.1)'
          }}>
            <h4 style={{ color: COLORS.green, margin: '0 0 6px 0', fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span>🏆</span> WINNER: {winner.name} (Score: {winner.finalScore.toFixed(1)})
            </h4>
            <p style={{ margin: 0, fontSize: 13, color: COLORS.text, lineHeight: 1.5 }}>
              {reasons.find(r => r.name === winner.name)?.reason}
            </p>
          </div>

          {/* Loser explanations */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {scoredCandidates.filter(c => !c.isWinner).map((cand, idx) => (
              <div key={idx} className="glass-panel" style={{
                margin: 0,
                background: 'rgba(239,68,68,0.03)',
                border: '1px solid rgba(239,68,68,0.15)',
              }}>
                <h5 style={{ color: '#f87171', margin: '0 0 4px 0', fontSize: 12, fontWeight: 600 }}>
                  ❌ {cand.name} (Score: {cand.finalScore.toFixed(1)})
                </h5>
                <p style={{ margin: 0, fontSize: 11, color: COLORS.textDim, lineHeight: 1.4 }}>
                  {reasons.find(r => r.name === cand.name)?.reason}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Grid of details for each candidate */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {scoredCandidates.map((cand, cIdx) => (
          <div key={cIdx} className="glass-panel" style={{
            margin: 0,
            border: cand.isWinner ? `2px solid ${COLORS.green}` : `1px solid ${COLORS.border}`,
            background: cand.isWinner ? 'rgba(16,185,129,0.02)' : COLORS.card,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
              <h3 style={{ margin: 0, fontSize: 15, color: COLORS.text, fontWeight: 700 }}>
                {cand.name} {cand.isWinner && '🏆'}
              </h3>
              <div style={{ textAlign: 'right' }}>
                <span style={{
                  fontFamily: 'monospace', fontSize: 15, fontWeight: 700,
                  color: cand.isWinner ? COLORS.green : COLORS.cyan
                }}>
                  {cand.finalScore.toFixed(1)}
                </span>
                <span style={{ fontSize: 10, color: COLORS.textDim, marginLeft: 4 }}>Score (lower is better)</span>
              </div>
            </div>

            {/* Metric Score Table */}
            <table className="styled-table" style={{ fontSize: '0.85em', marginBottom: 16 }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', width: '35%' }}>Heuristic Metric</th>
                  <th style={{ width: '15%' }}>Raw Value</th>
                  <th style={{ width: '15%' }}>Normalized (0-1)</th>
                  <th style={{ width: '15%' }}>Weight</th>
                  <th style={{ width: '20%', textAlign: 'right' }}>Contribution</th>
                </tr>
              </thead>
              <tbody>
                {cand.metrics.map((m, mIdx) => (
                  <tr key={mIdx}>
                    <td style={{ textAlign: 'left', fontWeight: 600, color: COLORS.text }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ width: 8, height: 8, borderRadius: '50%', background: METRIC_COLORS[m.key] }} />
                        {m.name}
                      </div>
                    </td>
                    <td style={{ fontFamily: 'monospace' }}>{m.raw}</td>
                    <td style={{ fontFamily: 'monospace' }}>{m.normalized.toFixed(2)}</td>
                    <td style={{ fontFamily: 'monospace' }}>{(m.weight * 100).toFixed(0)}%</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700, color: COLORS.cyan, textAlign: 'right' }}>
                      +{m.contribution.toFixed(1)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {/* Visual Contribution Bars */}
            <div>
              <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                Penalty Contribution Breakdown
              </div>
              <div style={{
                height: 12, width: '100%', background: 'rgba(2,6,23,0.5)',
                borderRadius: 4, display: 'flex', overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.06)'
              }}>
                {cand.metrics.map((m, mIdx) => {
                  const pct = cand.finalScore > 0 ? (m.contribution / cand.finalScore) * 100 : 0;
                  if (pct <= 0) return null;
                  return (
                    <div
                      key={mIdx}
                      style={{
                        width: `${pct}%`,
                        background: METRIC_COLORS[m.key],
                        height: '100%'
                      }}
                      title={`${m.name}: +${m.contribution.toFixed(1)} penalty points (${pct.toFixed(0)}%)`}
                    />
                  );
                })}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HeuristicBreakdownPanel;
