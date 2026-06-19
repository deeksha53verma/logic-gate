import React, { useMemo } from 'react';

const COLORS = {
  bg: 'rgba(15,23,42,0.92)',
  card: 'rgba(15,23,42,0.55)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f8fafc',
  textDim: '#94a3b8',
  cyan: '#06b6d4',
  green: '#10b981',
  blue: '#3b82f6',
  amber: '#f59e0b',
};

const IMPL_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#d946ef'];

/* SVG Stacked Bar Chart for Power Breakdown */
const PowerStackedChart = ({ data }) => {
  const chartW = 600;
  const chartH = 180;
  const baseY = 140;
  const maxBarH = 100;

  const maxVal = Math.max(...data.map(d => d.total), 1);
  const barW = 50;
  const gap = (chartW - 80 - barW * data.length) / (data.length + 1 || 1);

  return (
    <div style={{
      padding: 16, background: 'rgba(2,6,23,0.5)', borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', overflowX: 'auto'
    }}>
      <svg width={chartW} height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} style={{ overflow: 'visible', display: 'inline-block' }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1.0].map(frac => {
          const y = baseY - frac * maxBarH;
          return (
            <g key={frac}>
              <line x1={40} y1={y} x2={chartW - 20} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
              <text x={34} y={y + 3} textAnchor="end" fill={COLORS.textDim} fontSize={8} fontFamily="monospace">
                {(maxVal * frac).toFixed(0)} mW
              </text>
            </g>
          );
        })}
        {/* Baseline */}
        <line x1={40} y1={baseY} x2={chartW - 20} y2={baseY} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />

        {/* Bars */}
        {data.map((d, i) => {
          const x = 50 + gap + i * (barW + gap);
          
          const staticH = maxVal > 0 ? (d.static / maxVal) * maxBarH : 0;
          const dynamicH = maxVal > 0 ? (d.dynamic / maxVal) * maxBarH : 0;

          const staticY = baseY - staticH;
          const dynamicY = staticY - dynamicH;

          return (
            <g key={i}>
              {/* Static Bar Segment (Blue) */}
              <rect x={x} y={staticY} width={barW} height={staticH} fill={COLORS.blue} rx={1} />
              
              {/* Dynamic Bar Segment (Orange) */}
              <rect x={x} y={dynamicY} width={barW} height={dynamicH} fill={COLORS.amber} rx={1} />

              {/* Value Label */}
              <text x={x + barW / 2} y={dynamicY - 6} textAnchor="middle" fill={COLORS.text} fontSize={9} fontWeight="bold" fontFamily="monospace">
                {d.total.toFixed(1)}mW
              </text>

              {/* X-axis labels */}
              <text x={x + barW / 2} y={baseY + 16} textAnchor="middle" fill={COLORS.textDim} fontSize={9}>
                {d.label.split('-')[0]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/* Main Component */
const PowerEstimationPanel = ({ implementations }) => {
  const impls = useMemo(() => {
    if (!implementations) return [];
    return Array.isArray(implementations) ? implementations : Object.values(implementations);
  }, [implementations]);

  // Compute power breakdowns
  const powerData = useMemo(() => {
    return impls.map((impl, idx) => {
      const totalICs = impl.totalICs ?? 0;
      const totalGates = impl.totalGates ?? 0;

      // Formulas from UI specs
      const staticPower = totalICs * 2.5; // mW quiescent current
      const dynamicPower = totalGates * 0.5 * 1.5; // assume 50% switching activity, 1.5mW per gate
      const totalPower = staticPower + dynamicPower;

      return {
        label: impl.label || `Strategy ${idx + 1}`,
        static: staticPower,
        dynamic: dynamicPower,
        total: totalPower,
        gates: totalGates,
        ics: totalICs
      };
    });
  }, [impls]);

  // Find lowest power implementation
  const bestIdx = useMemo(() => {
    if (powerData.length === 0) return -1;
    let minPower = Infinity;
    let best = 0;
    powerData.forEach((d, i) => {
      if (d.total < minPower && d.total > 0) {
        minPower = d.total;
        best = i;
      }
    });
    return best;
  }, [powerData]);

  if (impls.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
        <h3 style={{ color: COLORS.text }}>No Power Estimation Data</h3>
        <p style={{ color: COLORS.textDim }}>Generate circuit mappings to see power dissipation estimates.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: COLORS.text }}>Power Consumption Estimation</h2>
        <span className="badge" style={{
          background: 'linear-gradient(135deg, #3b82f6, #f59e0b)',
          color: '#fff', fontSize: 11,
        }}>Dissipation Analysis</span>
      </div>

      {/* Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {powerData.map((d, i) => {
          const isBest = i === bestIdx;
          return (
            <div key={i} className="glass-panel" style={{
              margin: 0,
              border: isBest ? `2px solid ${COLORS.green}` : `1px solid ${COLORS.border}`,
              background: isBest ? 'rgba(16,185,129,0.03)' : COLORS.card,
              boxShadow: isBest ? '0 0 16px rgba(16,185,129,0.1)' : 'none',
            }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: 13, color: IMPL_COLORS[i] }}>{d.label}</h4>
              <div style={{ fontSize: 20, fontWeight: 700, color: COLORS.text, fontFamily: 'monospace' }}>
                {d.total.toFixed(1)} <span style={{ fontSize: 12, fontWeight: 400, color: COLORS.textDim }}>mW</span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 2, marginTop: 6, fontSize: 10, color: COLORS.textDim }}>
                <span>Static: {d.static.toFixed(1)} mW</span>
                <span>Dynamic: {d.dynamic.toFixed(1)} mW</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Stacked Chart */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ color: COLORS.cyan, fontSize: 12, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Static vs Dynamic Dissipation Breakdown
        </h4>
        <PowerStackedChart data={powerData} />
        {/* Chart Legend */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: 20, marginTop: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            <div style={{ width: 10, height: 10, background: COLORS.blue, borderRadius: 2 }} />
            <span style={{ color: COLORS.textDim }}>Static Power (Quiescent)</span>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            <div style={{ width: 10, height: 10, background: COLORS.amber, borderRadius: 2 }} />
            <span style={{ color: COLORS.textDim }}>Dynamic Power (Switching Activity @ 50%)</span>
          </div>
        </div>
      </div>

      {/* Comparison Table */}
      <div className="glass-panel" style={{ margin: 0 }}>
        <h4 style={{ color: COLORS.cyan, fontSize: 12, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Power Dissipation Comparison Matrix
        </h4>
        <table className="styled-table" style={{ fontSize: '0.85em' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Strategy</th>
              <th>Gate Count</th>
              <th>IC Chip Count</th>
              <th>Static Dissipation</th>
              <th>Dynamic Dissipation</th>
              <th>Total Power</th>
              <th>Efficiency Rank</th>
            </tr>
          </thead>
          <tbody>
            {powerData.map((d, i) => {
              const isBest = i === bestIdx;
              return (
                <tr key={i} style={{
                  background: isBest ? 'rgba(16,185,129,0.04)' : undefined
                }}>
                  <td style={{ textAlign: 'left', fontWeight: 600, color: IMPL_COLORS[i] }}>{d.label}</td>
                  <td style={{ fontFamily: 'monospace' }}>{d.gates}</td>
                  <td style={{ fontFamily: 'monospace' }}>{d.ics}</td>
                  <td style={{ fontFamily: 'monospace' }}>{d.static.toFixed(1)} mW</td>
                  <td style={{ fontFamily: 'monospace' }}>{d.dynamic.toFixed(1)} mW</td>
                  <td style={{ fontFamily: 'monospace', fontWeight: 700, color: isBest ? COLORS.green : COLORS.text }}>
                    {d.total.toFixed(1)} mW
                  </td>
                  <td>
                    {isBest ? (
                      <span style={{ color: COLORS.green, fontWeight: 700 }}>🏆 MOST EFFICIENT</span>
                    ) : (
                      <span style={{ color: COLORS.textDim }}>Rank {i + 1}</span>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PowerEstimationPanel;
