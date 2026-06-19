import React, { useMemo } from 'react';
import { calculateTotalCost } from '../cost-engine/costEngine';

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

const IMPL_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#d946ef'];

const CostAnalysisPanel = ({ implementations }) => {
  const impls = useMemo(() => {
    if (!implementations) return [];
    return Array.isArray(implementations) ? implementations : Object.values(implementations);
  }, [implementations]);

  const costedImpls = useMemo(() => {
    return impls.map((impl, index) => {
      const costResult = calculateTotalCost(impl);
      return {
        label: impl.label || `Strategy ${index + 1}`,
        costs: costResult,
        color: IMPL_COLORS[index] || COLORS.cyan
      };
    });
  }, [impls]);

  const bestIdx = useMemo(() => {
    if (costedImpls.length === 0) return -1;
    let minCost = Infinity;
    let best = 0;
    costedImpls.forEach((item, i) => {
      if (item.costs.totalCost < minCost && item.costs.totalCost > 0) {
        minCost = item.costs.totalCost;
        best = i;
      }
    });
    return best;
  }, [costedImpls]);

  if (impls.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>💰</div>
        <h3 style={{ color: COLORS.text }}>No Cost Analysis Data</h3>
        <p style={{ color: COLORS.textDim }}>Generate circuit mappings to see manufacturing and penalty cost analysis.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: COLORS.text }}>Manufacturing Cost Analysis</h2>
        <span className="badge" style={{
          background: 'linear-gradient(135deg, #06b6d4, #a855f7)',
          color: '#fff', fontSize: 11,
        }}>EDA Cost Estimation</span>
      </div>

      {/* Cost Formula Panel */}
      <div className="glass-panel" style={{
        margin: '0 0 20px 0',
        background: 'linear-gradient(135deg, rgba(6,182,212,0.1), rgba(168,85,247,0.05))',
        border: '1px solid rgba(6,182,212,0.2)'
      }}>
        <h4 style={{ color: COLORS.cyan, margin: '0 0 8px 0', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Engineering Cost Formula
        </h4>
        <div style={{
          fontFamily: 'monospace', fontSize: 14, color: COLORS.text,
          lineHeight: 1.6, padding: '10px 14px', background: 'rgba(2,6,23,0.5)',
          borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)',
          overflowX: 'auto', whiteSpace: 'nowrap'
        }}>
          TotalCost = IC_Purchase + Unused_Gate_Penalty (Silicon Waste) + Delay_Penalty + Power_Penalty + Routing_Penalty + Board_Area
        </div>
        <div style={{ fontSize: 11, color: COLORS.textDim, marginTop: 8 }}>
          💡 Penalizing unused gates ($0.05/gate) and wiring complexity ($0.02/wire) ensures the DAA algorithm selects compact, easy-to-manufacture designs.
        </div>
      </div>

      {/* Main Breakdown List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {costedImpls.map((item, idx) => {
          const isBest = idx === bestIdx;
          const { totalCost, breakdown, manufacturingComplexity } = item.costs;

          return (
            <div key={idx} className="glass-panel" style={{
              margin: 0,
              border: isBest ? `2px solid ${COLORS.green}` : `1px solid ${COLORS.border}`,
              background: isBest ? 'rgba(16,185,129,0.03)' : COLORS.card,
              boxShadow: isBest ? '0 0 20px rgba(16,185,129,0.15)' : 'none',
              transition: 'all 0.3s ease'
            }}>
              {/* Card Header */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{ width: 14, height: 14, borderRadius: 4, background: item.color }} />
                  <h3 style={{ margin: 0, fontSize: 16, color: COLORS.text }}>{item.label}</h3>
                  {isBest && (
                    <span className="badge" style={{
                      background: COLORS.green, color: '#fff', fontSize: 10, padding: '2px 8px'
                    }}>💰 LOWEST COST</span>
                  )}
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: 18, fontWeight: 700, color: isBest ? COLORS.green : COLORS.cyan, fontFamily: 'monospace' }}>
                    ${totalCost.toFixed(2)}
                  </div>
                  <div style={{ fontSize: 10, color: COLORS.textDim }}>Total Formulated Cost</div>
                </div>
              </div>

              {/* Stacked Horizontal Bar */}
              <div style={{
                height: 22, width: '100%', background: 'rgba(2,6,23,0.5)',
                borderRadius: 6, display: 'flex', overflow: 'hidden',
                border: '1px solid rgba(255,255,255,0.06)', marginBottom: 16
              }}>
                {breakdown.map((seg, sIdx) => {
                  const pct = totalCost > 0 ? (seg.value / totalCost) * 100 : 0;
                  if (pct <= 0) return null;
                  return (
                    <div
                      key={sIdx}
                      style={{
                        width: `${pct}%`,
                        background: seg.color,
                        height: '100%',
                        transition: 'width 0.5s ease'
                      }}
                      title={`${seg.name}: $${seg.value.toFixed(2)} (${pct.toFixed(1)}%)`}
                    />
                  );
                })}
              </div>

              {/* Component breakdown items */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {breakdown.map((seg, sIdx) => (
                  <div key={sIdx} style={{
                    background: 'rgba(2,6,23,0.3)', borderRadius: 8, padding: '8px 10px',
                    border: '1px solid rgba(255,255,255,0.03)',
                    display: 'flex', flexDirection: 'column', gap: 4
                  }}>
                    <span style={{ fontSize: 10, color: COLORS.textDim, display: 'flex', alignItems: 'center', gap: 6 }}>
                      <span style={{ width: 6, height: 6, borderRadius: '50%', background: seg.color }} />
                      {seg.name.replace(' Penalty', '').replace(' Cost', '')}
                    </span>
                    <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, fontFamily: 'monospace' }}>
                      ${seg.value.toFixed(2)}
                    </span>
                  </div>
                ))}

                {/* Manufacturing Complexity Score */}
                <div style={{
                  background: 'rgba(2,6,23,0.3)', borderRadius: 8, padding: '8px 10px',
                  border: '1px solid rgba(255,255,255,0.03)',
                  display: 'flex', flexDirection: 'column', gap: 4
                }}>
                  <span style={{ fontSize: 10, color: COLORS.textDim }}>🔧 Mfg Complexity</span>
                  <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.purple, fontFamily: 'monospace' }}>
                    {manufacturingComplexity.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CostAnalysisPanel;
