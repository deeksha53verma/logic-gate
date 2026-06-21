import React from 'react';

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
  purple: '#a855f7'
};

/* SVG Horizontal Critical Path Visualization */
const CriticalPathSVG = ({ nodes }) => {
  if (!nodes || nodes.length === 0) return null;

  const w = 700;
  const h = 100;
  const nodeW = 75;
  const nodeH = 45;
  
  // Calculate horizontal spacing dynamically
  const count = nodes.length;
  const gap = (w - count * nodeW) / (count + 1 || 1);

  return (
    <div style={{
      padding: 16, background: 'rgba(2,6,23,0.5)', borderRadius: 12,
      border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center', overflowX: 'auto'
    }}>
      <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ overflow: 'visible', display: 'inline-block' }}>
        {/* Draw connectors first */}
        {Array.from({ length: count - 1 }).map((_, i) => {
          const x1 = gap + nodeW + i * (nodeW + gap);
          const y1 = h / 2;
          const x2 = x1 + gap;
          const y2 = h / 2;
          
          return (
            <g key={`c-${i}`}>
              <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={COLORS.red} strokeWidth={2} strokeDasharray="4 2" />
              {/* Arrowhead */}
              <polygon points={`${x2},${y2} ${x2 - 6},${y2 - 4} ${x2 - 6},${y2 + 4}`} fill={COLORS.red} />
              {/* Typical delay text */}
              <text x={x1 + gap/2} y={y1 - 6} textAnchor="middle" fill={COLORS.amber} fontSize={8} fontFamily="monospace">
                +9ns
              </text>
            </g>
          );
        })}

        {/* Draw gate boxes */}
        {nodes.map((nodeId, i) => {
          const x = gap + i * (nodeW + gap);
          const y = (h - nodeH) / 2;

          return (
            <g key={nodeId}>
              {/* Outer glow */}
              <rect x={x} y={y} width={nodeW} height={nodeH} rx={6}
                fill="rgba(239,68,68,0.15)" stroke={COLORS.red} strokeWidth={2}
                style={{ filter: `drop-shadow(0 0 4px ${COLORS.red}44)` }} />
              {/* Text label */}
              <text x={x + nodeW/2} y={y + 18} textAnchor="middle" fill={COLORS.text} fontSize={10} fontWeight="bold" fontFamily="monospace">
                {nodeId.substring(0, 8)}
              </text>
              <text x={x + nodeW/2} y={y + 32} textAnchor="middle" fill={COLORS.textDim} fontSize={8}>
                Critical Stage
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/* Main Component */
const PropagationDelayPanel = ({ graphResult }) => {
  if (!graphResult || !graphResult.criticalPath || graphResult.criticalPath.nodes.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>⚡</div>
        <h3 style={{ color: COLORS.text }}>No Delay Analysis Data</h3>
        <p style={{ color: COLORS.textDim }}>Execute logical synthesis first to generate the circuit DAG and compute delays.</p>
      </div>
    );
  }

  const {
    logicDepth,
    criticalPath,
    shortestPath,
    maxFrequency,
    fanAnalysis,
    depthMap
  } = graphResult;

  // Compile detailed gate delay row entries
  const gateRows = fanAnalysis.map(nodeAnalysis => {
    const nodeId = nodeAnalysis.nodeId;
    const type = nodeAnalysis.nodeType;
    const onCritical = criticalPath.nodes.includes(nodeId);
    
    // Assign standard gate delay estimate
    let delay = 0;
    if (type !== 'INPUT' && type !== 'OUTPUT') {
      delay = type === 'NOT' ? 6 : type === 'XOR' ? 11 : 9;
    }
    const depth = depthMap[nodeId] ?? 0;
    const cumDelay = depth * delay; // approximation

    return {
      nodeId,
      type,
      delay,
      depth,
      cumDelay,
      onCritical
    };
  });

  return (
    <div>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: COLORS.text }}>Propagation Delay & Critical Path</h2>
        <span className="badge" style={{
          background: 'linear-gradient(135deg, #ef4444, #f59e0b)',
          color: '#fff', fontSize: 11,
        }}>Timing Analysis</span>
      </div>

      {/* Stats Cards Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Critical Path Delay', value: `${criticalPath.totalDelay} ns`, color: COLORS.red },
          { label: 'Shortest Path Delay', value: `${shortestPath.totalDelay} ns`, color: COLORS.green },
          { label: 'Max Clock Frequency', value: `${maxFrequency} MHz`, color: COLORS.amber },
          { label: 'Logic Circuit Depth', value: `${logicDepth} Levels`, color: COLORS.cyan }
        ].map((item, idx) => (
          <div key={idx} className="glass-panel" style={{
            margin: 0, display: 'flex', flexDirection: 'column', gap: 4, padding: '12px 14px'
          }}>
            <span style={{ fontSize: 11, color: COLORS.textDim }}>{item.label}</span>
            <span style={{ fontSize: 16, fontWeight: 700, color: item.color, fontFamily: 'monospace' }}>
              {item.value}
            </span>
          </div>
        ))}
      </div>

      {/* Critical Path Pipeline */}
      <div style={{ marginBottom: 20 }}>
        <h4 style={{ color: COLORS.cyan, fontSize: 12, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Critical Path Gate Pipeline
        </h4>
        <CriticalPathSVG nodes={criticalPath.nodes} />
      </div>

      {/* Detailed Timing Matrix Table */}
      <div className="glass-panel" style={{ margin: 0 }}>
        <h4 style={{ color: COLORS.cyan, fontSize: 12, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Detailed Gate Timing Matrix
        </h4>
        <table className="styled-table" style={{ fontSize: '0.85em' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Gate / Node ID</th>
              <th>Gate Type</th>
              <th>Logic Level</th>
              <th>Intrinsic Delay</th>
              <th>Cumulative Est. Delay</th>
              <th>Timing Status</th>
            </tr>
          </thead>
          <tbody>
            {gateRows.map((row, idx) => (
              <tr key={idx} style={{
                background: row.onCritical ? 'rgba(239,68,68,0.04)' : undefined
              }}>
                <td style={{ textAlign: 'left', fontWeight: 600, color: COLORS.text }}>
                  {row.nodeId}
                </td>
                <td style={{ fontFamily: 'monospace' }}>{row.type}</td>
                <td style={{ fontFamily: 'monospace' }}>{row.depth}</td>
                <td style={{ fontFamily: 'monospace' }}>{row.delay > 0 ? `${row.delay} ns` : '0 ns'}</td>
                <td style={{ fontFamily: 'monospace' }}>{row.cumDelay > 0 ? `${row.cumDelay} ns` : '0 ns'}</td>
                <td>
                  <span style={{
                    color: row.onCritical ? COLORS.red : COLORS.green,
                    fontWeight: 600, fontSize: 11
                  }}>
                    {row.onCritical ? '⚠️ CRITICAL PATH' : '✓ Normal'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PropagationDelayPanel;
