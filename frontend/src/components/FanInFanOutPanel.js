import React, { useMemo } from 'react';

const COLORS = {
  bg: 'rgba(15,23,42,0.92)',
  card: 'rgba(15,23,42,0.55)',
  border: 'rgba(255,255,255,0.08)',
  text: '#f8fafc',
  textDim: '#94a3b8',
  cyan: '#06b6d4',
  green: '#10b981',
  red: '#ef4444',
  amber: '#f59e0b',
  blue: '#3b82f6',
};

/* SVG Fan-Out Distribution Bar Chart */
const FanOutChart = ({ data }) => {
  const chartW = 700;
  const chartH = 150;
  const baseY = 120;
  const maxBarH = 90;

  // Filter to gate nodes and sort by fan-out descending (limit to top 15 nodes for spacing)
  const chartData = useMemo(() => {
    return [...data]
      .filter(d => d.nodeType !== 'INPUT' && d.nodeType !== 'OUTPUT')
      .sort((a, b) => b.fanOut - a.fanOut)
      .slice(0, 15);
  }, [data]);

  const maxVal = Math.max(...chartData.map(d => d.fanOut), 1);
  const barW = Math.max(16, (chartW - 80) / (chartData.length || 1) - 10);
  const gap = 10;

  return (
    <div style={{
      padding: 16, background: 'rgba(2,6,23,0.5)', borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', overflowX: 'auto'
    }}>
      {chartData.length === 0 ? (
        <div style={{ color: COLORS.textDim, fontStyle: 'italic', padding: 20 }}>No gates to show in distribution.</div>
      ) : (
        <svg width={chartW} height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} style={{ overflow: 'visible', display: 'inline-block' }}>
          {/* Y-axis grid lines */}
          {[0.25, 0.5, 0.75, 1.0].map(frac => {
            const y = baseY - frac * maxBarH;
            const labelVal = Math.round(maxVal * frac);
            return (
              <g key={frac}>
                <line x1={40} y1={y} x2={chartW - 20} y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="3 3" />
                <text x={34} y={y + 3} textAnchor="end" fill={COLORS.textDim} fontSize={8} fontFamily="monospace">
                  {labelVal}
                </text>
              </g>
            );
          })}
          {/* Baseline */}
          <line x1={40} y1={baseY} x2={chartW - 20} y2={baseY} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />

          {/* Bars */}
          {chartData.map((d, i) => {
            const h = maxVal > 0 ? (d.fanOut / maxVal) * maxBarH : 0;
            const x = 50 + i * (barW + gap);
            const y = baseY - h;
            const isHigh = d.fanOut > 3; // warning threshold for display styling
            const color = isHigh ? COLORS.amber : COLORS.cyan;

            return (
              <g key={d.nodeId}>
                <rect x={x} y={y} width={barW} height={h} rx={2} fill={color} opacity={0.8} />
                {/* Value on top of bar */}
                <text x={x + barW / 2} y={y - 5} textAnchor="middle" fill={color} fontSize={9} fontWeight="bold" fontFamily="monospace">
                  {d.fanOut}
                </text>
                {/* Node ID label below bar */}
                <text x={x + barW / 2} y={baseY + 12} textAnchor="middle" fill={COLORS.textDim} fontSize={7} transform={`rotate(15, ${x + barW / 2}, ${baseY + 12})`}>
                  {d.nodeId.substring(0, 7)}
                </text>
              </g>
            );
          })}
        </svg>
      )}
    </div>
  );
};

/* Main Component */
const FanInFanOutPanel = ({ fanAnalysis }) => {
  // Calculate summary statistics
  const summary = useMemo(() => {
    let maxFanIn = 0;
    let maxFanOut = 0;
    let overloadedCount = 0;

    if (fanAnalysis) {
      fanAnalysis.forEach(item => {
        if (item.fanIn > maxFanIn) maxFanIn = item.fanIn;
        if (item.fanOut > maxFanOut) maxFanOut = item.fanOut;
        if (item.warning) overloadedCount++;
      });
    }

    return { maxFanIn, maxFanOut, overloadedCount };
  }, [fanAnalysis]);

  if (!fanAnalysis || fanAnalysis.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <h3 style={{ color: COLORS.text }}>No Fan Analysis Data</h3>
        <p style={{ color: COLORS.textDim }}>Synthesize a logic expression first to run graph fan-in/fan-out load analysis.</p>
      </div>
    );
  }

  return (
    <div>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: COLORS.text }}>Fan-In / Fan-Out Load Analysis</h2>
        <span className="badge" style={{
          background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
          color: '#fff', fontSize: 11,
        }}>Electrical Load Balancing</span>
      </div>

      {/* Summary Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Maximum Node Fan-In', value: summary.maxFanIn, color: COLORS.cyan },
          { label: 'Maximum Node Fan-Out', value: summary.maxFanOut, color: COLORS.amber },
          { label: 'Overloaded Nodes Flagged', value: summary.overloadedCount, color: summary.overloadedCount > 0 ? COLORS.red : COLORS.green }
        ].map((item, idx) => (
          <div key={idx} className="glass-panel" style={{
            margin: 0, display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 14px'
          }}>
            <span style={{ fontSize: 11, color: COLORS.textDim }}>{item.label}</span>
            <span style={{ fontSize: 18, fontWeight: 700, color: item.color, fontFamily: 'monospace' }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Fan-Out Distribution SVG Chart */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ color: COLORS.cyan, fontSize: 12, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Fan-Out Load Distribution (Top 15 Gates)
        </h4>
        <FanOutChart data={fanAnalysis} />
      </div>

      {/* Adjacency Load Matrix Table */}
      <div className="glass-panel" style={{ margin: 0 }}>
        <h4 style={{ color: COLORS.cyan, fontSize: 12, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Circuit Load Matrix
        </h4>
        <table className="styled-table" style={{ fontSize: '0.85em' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Node / Gate ID</th>
              <th>Type</th>
              <th>Fan-In (Inputs)</th>
              <th>Fan-Out (Outputs)</th>
              <th>Total Node Load</th>
              <th>Load Warnings</th>
            </tr>
          </thead>
          <tbody>
            {fanAnalysis.map((row, idx) => (
              <tr key={idx} style={{
                background: row.warning ? 'rgba(239,68,68,0.05)' : undefined
              }}>
                <td style={{ textAlign: 'left', fontWeight: 600, color: COLORS.text }}>
                  {row.nodeId}
                </td>
                <td style={{ fontFamily: 'monospace' }}>{row.nodeType}</td>
                <td style={{ fontFamily: 'monospace' }}>{row.fanIn}</td>
                <td style={{ fontFamily: 'monospace' }}>{row.fanOut}</td>
                <td style={{ fontFamily: 'monospace', fontWeight: 600 }}>{row.load}</td>
                <td>
                  {row.warning ? (
                    <span style={{ color: COLORS.red, fontWeight: 700 }}>⚠️ {row.warning}</span>
                  ) : (
                    <span style={{ color: COLORS.green }}>✓ Within limits</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default FanInFanOutPanel;
