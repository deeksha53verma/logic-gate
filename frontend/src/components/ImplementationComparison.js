import React, { useMemo } from 'react';

const COLORS = {
  text: '#f8fafc',
  textDim: '#94a3b8',
  cyan: '#06b6d4',
  green: '#10b981',
  border: 'rgba(255,255,255,0.08)',
};

const IMPL_NAMES = ['Basic', 'NAND-Only', 'NOR-Only', 'Mixed'];
const IMPL_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#d946ef'];

/* ─── Helper: get metric from impl safely ───────────────────── */
const m = (impl, key, fallback = 0) => {
  if (!impl) return fallback;
  return impl[key] ?? impl[key.toLowerCase()] ?? fallback;
};

/* ─── Bar Chart (SVG) ───────────────────────────────────────── */
const BarChart = ({ title, values, unit = '', colors = IMPL_COLORS }) => {
  const max = Math.max(...values.filter(v => v > 0), 1);
  const chartW = 340;
  const chartH = 160;
  const barW = 42;
  const gap = (chartW - 40 - barW * values.length) / (values.length + 1);
  const baseY = 130;
  const maxBarH = 100;

  return (
    <div className="glass-panel" style={{ margin: 0, textAlign: 'center' }}>
      <h4 style={{ color: COLORS.cyan, margin: '0 0 12px 0', fontSize: 14 }}>{title}</h4>
      <svg width="100%" height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} style={{ overflow: 'visible' }}>
        {/* Grid lines */}
        {[0.25, 0.5, 0.75, 1].map(frac => {
          const y = baseY - frac * maxBarH;
          return (
            <g key={frac}>
              <line x1={30} y1={y} x2={chartW - 10} y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray="3 3" />
              <text x={26} y={y + 3} textAnchor="end" fill={COLORS.textDim} fontSize={8}>
                {(max * frac).toFixed(max > 10 ? 0 : 1)}
              </text>
            </g>
          );
        })}
        {/* Baseline */}
        <line x1={30} y1={baseY} x2={chartW - 10} y2={baseY} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />

        {/* Bars */}
        {values.map((val, i) => {
          const h = max > 0 ? (val / max) * maxBarH : 0;
          const x = 40 + gap + i * (barW + gap);
          const y = baseY - h;
          return (
            <g key={i}>
              {/* Bar shadow */}
              <rect x={x + 2} y={y + 2} width={barW} height={h} rx={4} fill="rgba(0,0,0,0.3)" />
              {/* Bar */}
              <rect x={x} y={y} width={barW} height={h} rx={4} fill={colors[i]}
                style={{ transition: 'height 0.6s ease, y 0.6s ease' }}>
                <animate attributeName="height" from="0" to={h} dur="0.6s" fill="freeze" />
                <animate attributeName="y" from={baseY} to={y} dur="0.6s" fill="freeze" />
              </rect>
              {/* Value label */}
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" fill={colors[i]}
                fontSize={10} fontWeight="bold" fontFamily="monospace">
                {typeof val === 'number' ? (val % 1 === 0 ? val : val.toFixed(2)) : val}{unit}
              </text>
              {/* X-axis label */}
              <text x={x + barW / 2} y={baseY + 14} textAnchor="middle" fill={COLORS.textDim} fontSize={9}>
                {IMPL_NAMES[i]?.split('-')[0] || `#${i + 1}`}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/* ─── Radar Chart (SVG) ─────────────────────────────────────── */
const RadarChart = ({ implementations }) => {
  const metrics = ['Gates', 'ICs', 'Delay', 'Cost', 'Power'];
  const n = metrics.length;
  const cx = 170, cy = 150, radius = 110;
  const angleStep = (2 * Math.PI) / n;

  // Compute normalized values (inverted: lower is better → higher on chart)
  const rawValues = implementations.map(impl => [
    m(impl, 'gateCount') || m(impl, 'gates') || 0,
    m(impl, 'totalICs') || m(impl, 'icCount') || 0,
    m(impl, 'totalDelay') || m(impl, 'delay') || 0,
    m(impl, 'totalCost') || m(impl, 'cost') || 0,
    m(impl, 'totalPower') || m(impl, 'power') || 0,
  ]);

  const maxPerMetric = metrics.map((_, mi) => Math.max(...rawValues.map(rv => rv[mi]), 1));

  const getPoint = (metricIdx, normVal) => {
    const angle = -Math.PI / 2 + metricIdx * angleStep;
    const r = normVal * radius;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
  };

  // Concentric hexagons
  const levels = [0.2, 0.4, 0.6, 0.8, 1.0];

  return (
    <div className="glass-panel" style={{ margin: 0, textAlign: 'center' }}>
      <h4 style={{ color: COLORS.cyan, margin: '0 0 4px 0', fontSize: 14 }}>Multi-Metric Radar Comparison</h4>
      <svg width="100%" height={310} viewBox="0 0 340 310" style={{ overflow: 'visible' }}>
        {/* Concentric hexagons */}
        {levels.map(level => {
          const pts = metrics.map((_, i) => getPoint(i, level).join(',')).join(' ');
          return <polygon key={level} points={pts}
            fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={0.8} />;
        })}

        {/* Axis spokes */}
        {metrics.map((label, i) => {
          const [ex, ey] = getPoint(i, 1);
          const [lx, ly] = getPoint(i, 1.18);
          return (
            <g key={i}>
              <line x1={cx} y1={cy} x2={ex} y2={ey} stroke="rgba(255,255,255,0.1)" strokeWidth={0.8} />
              <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle"
                fill={COLORS.textDim} fontSize={10} fontWeight="600">{label}</text>
            </g>
          );
        })}

        {/* Implementation polygons */}
        {implementations.map((impl, ii) => {
          const normVals = rawValues[ii].map((v, mi) => 1 - (v / maxPerMetric[mi]));
          const pts = normVals.map((nv, mi) => getPoint(mi, Math.max(nv, 0.05)).join(',')).join(' ');
          return (
            <g key={ii}>
              <polygon points={pts}
                fill={`${IMPL_COLORS[ii]}22`} stroke={IMPL_COLORS[ii]} strokeWidth={2} />
              {normVals.map((nv, mi) => {
                const [px, py] = getPoint(mi, Math.max(nv, 0.05));
                return <circle key={mi} cx={px} cy={py} r={3.5}
                  fill={IMPL_COLORS[ii]} stroke="#0f172a" strokeWidth={1.5} />;
              })}
            </g>
          );
        })}
      </svg>

      {/* Legend */}
      <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 8 }}>
        {IMPL_NAMES.map((name, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11 }}>
            <div style={{ width: 12, height: 12, borderRadius: 3, background: IMPL_COLORS[i] }} />
            <span style={{ color: COLORS.textDim }}>{name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   Implementation Comparison — Main Component
   ═══════════════════════════════════════════════════════════════ */
const ImplementationComparison = ({ implementations }) => {
  const impls = useMemo(() => {
    if (!implementations) return [];
    return Array.isArray(implementations) ? implementations : Object.values(implementations);
  }, [implementations]);

  if (!impls.length) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📊</div>
        <h3 style={{ color: COLORS.text }}>No Implementations to Compare</h3>
        <p style={{ color: COLORS.textDim }}>Generate IC mappings first to see comparisons.</p>
      </div>
    );
  }

  // Extract metrics
  const metrics = [
    { label: 'Gates', key: 'gateCount', alt: 'gates', unit: '', better: 'lower' },
    { label: 'Total ICs', key: 'totalICs', alt: 'icCount', unit: '', better: 'lower' },
    { label: 'Unused Gates', key: 'unusedGates', alt: 'unused', unit: '', better: 'lower' },
    { label: 'Delay', key: 'totalDelay', alt: 'delay', unit: ' ns', better: 'lower' },
    { label: 'Power', key: 'totalPower', alt: 'power', unit: ' mW', better: 'lower' },
    { label: 'Area', key: 'pcbArea', alt: 'area', unit: ' mm²', better: 'lower' },
    { label: 'Cost', key: 'totalCost', alt: 'cost', unit: '', better: 'lower' },
    {
      label: 'Reliability',
      compute: impl => {
        const unused = m(impl, 'unusedGates') || m(impl, 'unused') || 0;
        const ics = m(impl, 'totalICs') || m(impl, 'icCount') || 0;
        return Math.max(0, Math.min(100, 100 - (unused * 2) - (ics * 1.5)));
      },
      unit: '%',
      better: 'higher',
    },
  ];

  const getVal = (impl, metric) => {
    if (metric.compute) return metric.compute(impl);
    return m(impl, metric.key) || m(impl, metric.alt) || 0;
  };

  const findBest = (metric) => {
    const vals = impls.map(impl => getVal(impl, metric));
    if (metric.better === 'higher') return vals.indexOf(Math.max(...vals));
    return vals.indexOf(Math.min(...vals));
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* ─── Comparison Table ─── */}
      <div className="glass-panel" style={{ margin: 0 }}>
        <h3 style={{ color: COLORS.text, margin: '0 0 16px 0' }}>📋 Implementation Comparison Matrix</h3>
        <table className="styled-table">
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Metric</th>
              {impls.map((_, i) => (
                <th key={i} style={{ color: IMPL_COLORS[i] }}>
                  {IMPL_NAMES[i] || `Impl ${i + 1}`}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {metrics.map((metric, mi) => {
              const bestIdx = findBest(metric);
              return (
                <tr key={mi}>
                  <td style={{ textAlign: 'left', fontWeight: 600, color: COLORS.text }}>{metric.label}</td>
                  {impls.map((impl, ii) => {
                    const val = getVal(impl, metric);
                    const isBest = ii === bestIdx;
                    return (
                      <td key={ii} style={{
                        fontFamily: 'monospace', fontWeight: isBest ? 700 : 400,
                        color: isBest ? '#10b981' : COLORS.text,
                        background: isBest ? 'rgba(16,185,129,0.1)' : 'transparent',
                      }}>
                        {typeof val === 'number' ? (val % 1 === 0 ? val : val.toFixed(2)) : val}
                        {metric.unit}
                        {isBest && ' ✓'}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ─── Bar Charts Grid ─── */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        <BarChart title="Gate Count" values={impls.map(i => m(i, 'gateCount') || m(i, 'gates') || 0)} />
        <BarChart title="IC Count" values={impls.map(i => m(i, 'totalICs') || m(i, 'icCount') || 0)} />
        <BarChart title="Delay (ns)" values={impls.map(i => m(i, 'totalDelay') || m(i, 'delay') || 0)} unit="ns" />
        <BarChart title="Cost ($)" values={impls.map(i => m(i, 'totalCost') || m(i, 'cost') || 0)} unit="$" />
      </div>

      {/* ─── Radar Chart ─── */}
      <RadarChart implementations={impls} />
    </div>
  );
};

export default ImplementationComparison;
