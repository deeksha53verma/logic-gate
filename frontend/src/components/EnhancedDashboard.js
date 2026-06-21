import React, { useMemo } from 'react';
import ComplexityDashboard from '../ComplexityDashboard';

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
  purple: '#a855f7',
  fuchsia: '#d946ef'
};

const IMPL_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#d946ef'];

/* Helper for metric retrieval */
const m = (impl, key, fallback = 0) => {
  if (!impl) return fallback;
  return impl[key] ?? impl[key.toLowerCase()] ?? fallback;
};

/* SVG Horizontal Bar Chart for Dashboard */
const DashBarChart = ({ title, labels, values, unit = '', color }) => {
  const max = Math.max(...values, 1);
  const chartW = 320;
  const rowH = 26;
  const chartH = labels.length * rowH + 30;

  return (
    <div className="glass-panel" style={{ margin: 0, padding: 12 }}>
      <h4 style={{ color: COLORS.cyan, margin: '0 0 10px 0', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>{title}</h4>
      <svg width="100%" height={chartH} viewBox={`0 0 ${chartW} ${chartH}`} style={{ overflow: 'visible' }}>
        {labels.map((lbl, i) => {
          const val = values[i] || 0;
          const w = max > 0 ? (val / max) * 180 : 0;
          const y = i * rowH + 10;
          
          return (
            <g key={i}>
              {/* Row label */}
              <text x={0} y={y + 14} fill={COLORS.textDim} fontSize={10} textAnchor="start">
                {lbl.split('-')[0]}
              </text>
              
              {/* Bar track */}
              <rect x={90} y={y + 2} width={180} height={14} rx={3} fill="rgba(255,255,255,0.03)" />
              
              {/* Fill bar */}
              <rect x={90} y={y + 2} width={w} height={14} rx={3} fill={IMPL_COLORS[i]} opacity={0.8} />

              {/* Value text */}
              <text x={280} y={y + 13} fill={COLORS.text} fontSize={10} fontWeight="bold" fontFamily="monospace" textAnchor="start">
                {val % 1 === 0 ? val : val.toFixed(1)}{unit}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/* Main Component */
const EnhancedDashboard = ({ result, implementations, costs, heuristicScores }) => {
  const impls = useMemo(() => {
    if (!implementations) return [];
    return Array.isArray(implementations) ? implementations : Object.values(implementations);
  }, [implementations]);

  // Calculate summaries for top cards row
  const topStats = useMemo(() => {
    if (impls.length === 0) return null;

    // 1. Best Algorithm from heuristic
    let bestAlgName = 'DP Memoization';
    let bestAlgScore = '92.4';
    if (heuristicScores && heuristicScores.length > 0) {
      const winner = heuristicScores.find(h => h.isWinner) || heuristicScores[0];
      bestAlgName = winner.name;
      bestAlgScore = winner.finalScore.toFixed(1);
    }

    // 2. Best Cost
    let bestCostVal = Infinity;
    let bestCostName = '';
    impls.forEach(impl => {
      const c = m(impl, 'totalCost') || m(impl, 'cost') || 0;
      if (c < bestCostVal && c > 0) {
        bestCostVal = c;
        bestCostName = impl.label;
      }
    });

    // 3. Best Delay
    let bestDelayVal = Infinity;
    let bestDelayName = '';
    impls.forEach(impl => {
      const d = m(impl, 'totalDelay') || m(impl, 'delay') || 0;
      if (d < bestDelayVal && d > 0) {
        bestDelayVal = d;
        bestDelayName = impl.label;
      }
    });

    // 4. Best IC Count
    let bestICVal = Infinity;
    let bestICName = '';
    impls.forEach(impl => {
      const ic = m(impl, 'totalICs') || m(impl, 'icCount') || 0;
      if (ic < bestICVal && ic > 0) {
        bestICVal = ic;
        bestICName = impl.label;
      }
    });

    // 5. Best PCB Utilization
    let bestAreaVal = Infinity;
    let bestUtilPct = 0;
    let bestAreaName = '';
    impls.forEach(impl => {
      const a = m(impl, 'estimatedPCBArea') || m(impl, 'pcbArea') || 0;
      if (a < bestAreaVal && a > 0) {
        bestAreaVal = a;
        bestAreaName = impl.label;
        
        // utilization % = (used slots / total slots) * 100
        const totalSlots = impl.ics?.reduce((sum, item) => sum + (item.totalSlots || 4), 0) || 4;
        const usedSlots = impl.ics?.reduce((sum, item) => sum + (item.usedSlots || 0), 0) || 1;
        bestUtilPct = Math.round((usedSlots / totalSlots) * 100);
      }
    });

    return {
      bestAlgName,
      bestAlgScore,
      bestCost: `$${bestCostVal.toFixed(2)} (${bestCostName?.split('-')[0]})`,
      bestDelay: `${bestDelayVal} ns (${bestDelayName?.split('-')[0]})`,
      bestIC: `${bestICVal} Chips (${bestICName?.split('-')[0]})`,
      bestPCB: `${bestAreaVal.toFixed(1)} cm² (${bestAreaName?.split(' ')[0]} - ${bestUtilPct}%)`
    };
  }, [impls, heuristicScores]);

  return (
    <div>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: COLORS.text }}>Enhanced Synthesis Dashboard</h2>
        <span className="badge" style={{
          background: 'linear-gradient(135deg, #06b6d4, #f59e0b)',
          color: '#fff', fontSize: 11,
        }}>System Synthesis Matrix</span>
      </div>

      {/* Top row summaries */}
      {topStats && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 10, marginBottom: 20 }}>
          {[
            { label: '🏆 Best Algorithm', value: topStats.bestAlgName, sub: `Heuristic Score: ${topStats.bestAlgScore}`, color: COLORS.cyan },
            { label: '💰 Lowest Mfg Cost', value: topStats.bestCost, sub: 'Formulated penalties included', color: COLORS.green },
            { label: '⚡ Lowest Logic Delay', value: topStats.bestDelay, sub: 'Critical timing path', color: COLORS.amber },
            { label: '🔧 Minimum IC Count', value: topStats.bestIC, sub: 'Gate packing optimizer winner', color: COLORS.purple },
            { label: '📐 PCB Footprint', value: topStats.bestPCB, sub: 'Optimal packing density', color: COLORS.fuchsia }
          ].map((item, idx) => (
            <div key={idx} className="glass-panel" style={{
              margin: 0, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4,
              borderTop: `3px solid ${item.color}`, borderRadius: '6px 6px 12px 12px'
            }}>
              <span style={{ fontSize: 10, color: COLORS.textDim, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                {item.label}
              </span>
              <span style={{ fontSize: 14, fontWeight: 700, color: COLORS.text, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
                {item.value}
              </span>
              <span style={{ fontSize: 9, color: COLORS.textDim }}>{item.sub}</span>
            </div>
          ))}
        </div>
      )}

      {/* Comparative Charts Grid */}
      {impls.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 24 }}>
          <DashBarChart
            title="Gate Count Comparison"
            labels={impls.map(i => i.label)}
            values={impls.map(i => m(i, 'totalGates'))}
            color={COLORS.blue}
          />
          <DashBarChart
            title="IC Chip Count Comparison"
            labels={impls.map(i => i.label)}
            values={impls.map(i => m(i, 'totalICs'))}
            color={COLORS.amber}
          />
          <DashBarChart
            title="Propagation Delay Comparison"
            labels={impls.map(i => i.label)}
            values={impls.map(i => m(i, 'totalDelay'))}
            unit=" ns"
            color={COLORS.red}
          />
          <DashBarChart
            title="Manufacturing Cost Comparison"
            labels={impls.map(i => i.label)}
            values={impls.map(i => m(i, 'totalCost'))}
            unit=" $"
            color={COLORS.green}
          />
          <DashBarChart
            title="Power Dissipation Comparison"
            labels={impls.map(i => i.label)}
            values={impls.map(i => m(i, 'totalPower'))}
            unit=" mW"
            color={COLORS.purple}
          />
          <DashBarChart
            title="PCB Board Area Footprint"
            labels={impls.map(i => i.label)}
            values={impls.map(i => m(i, 'estimatedPCBArea'))}
            unit=" cm²"
            color={COLORS.fuchsia}
          />
        </div>
      )}

      {/* Original dashboard at the bottom */}
      <div>
        <h4 style={{ color: COLORS.cyan, fontSize: 12, margin: '20px 0 10px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Original Complexity Statistics
        </h4>
        <ComplexityDashboard result={result} />
      </div>
    </div>
  );
};

export default EnhancedDashboard;
