import React, { useMemo, useState } from 'react';

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
  purple: '#a855f7',
};

const IMPL_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#d946ef'];

/* SVG Semi-Circle Manufacturability Gauge */
const ManufacturabilityGauge = ({ score }) => {
  // Radius of arc
  const r = 50;
  const cx = 75;
  const cy = 70;
  // Circumference of semi-circle: pi * r = 157.1
  const strokeDash = 157.1;
  const progressDash = (score / 100) * strokeDash;

  // Determine color based on score
  const color = score >= 80 ? COLORS.green : score >= 50 ? COLORS.amber : COLORS.red;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <svg width={150} height={90} viewBox="0 0 150 90">
        <defs>
          <linearGradient id="gaugeGrad" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#ef4444" />
            <stop offset="50%" stopColor="#f59e0b" />
            <stop offset="100%" stopColor="#10b981" />
          </linearGradient>
        </defs>
        {/* Background track (semi-circle) */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={10} strokeLinecap="round" />
        {/* Progress track */}
        <path d={`M ${cx - r} ${cy} A ${r} ${r} 0 0 1 ${cx + r} ${cy}`}
          fill="none" stroke="url(#gaugeGrad)" strokeWidth={10} strokeLinecap="round"
          strokeDasharray={`${progressDash} ${strokeDash}`} style={{ transition: 'stroke-dasharray 0.8s ease' }} />
        
        {/* Score text */}
        <text x={cx} y={cy - 5} textAnchor="middle" fill={color} fontSize={20} fontWeight="bold" fontFamily="monospace">
          {score}
        </text>
        <text x={cx} y={cy + 12} textAnchor="middle" fill={COLORS.textDim} fontSize={8} textTransform="uppercase" letterSpacing={0.5}>
          DFM Score
        </text>
      </svg>
    </div>
  );
};

/* Main Component */
const PCBResourcePanel = ({ implementations }) => {
  const [selectedIdx, setSelectedIdx] = useState(0);

  const impls = useMemo(() => {
    if (!implementations) return [];
    return Array.isArray(implementations) ? implementations : Object.values(implementations);
  }, [implementations]);

  // Calculate detailed PCB manufacturing resources
  const resourceData = useMemo(() => {
    return impls.map((impl, idx) => {
      const totalICs = impl.totalICs ?? 0;
      const wiringComplexity = impl.wiringComplexity ?? 0;
      const totalGates = impl.totalGates ?? 0;

      // Estimate details based on UI specs
      const boardArea = totalICs * 2.5 + (wiringComplexity * 0.5);
      
      // Pins used estimate: each active gate uses (inputs + output) + VCC + GND
      let pinsUsed = 0;
      if (impl.ics) {
        impl.ics.forEach(ic => {
          pinsUsed += (ic.usedSlots * 3) + 2; // approximation (2 pins for power/gnd)
        });
      } else {
        pinsUsed = (totalGates * 3) + (totalICs * 2);
      }

      const wires = wiringComplexity;
      const vias = Math.floor(wires * 0.3); // 30% of trace lines require vias
      const routingComplexity = parseFloat((wires * 1.8).toFixed(1)); // average wire length factor

      // DFM Manufacturability Score formula
      const rawScore = 100 - (totalICs * 3) - (wires * 1.5) - (vias * 2);
      const manufacturabilityScore = Math.max(0, Math.min(100, Math.round(rawScore)));

      return {
        label: impl.label || `Strategy ${idx + 1}`,
        boardArea,
        totalICs,
        pinsUsed,
        wires,
        vias,
        routingComplexity,
        manufacturabilityScore,
        color: IMPL_COLORS[idx] || COLORS.cyan
      };
    });
  }, [impls]);

  if (impls.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📐</div>
        <h3 style={{ color: COLORS.text }}>No Resource Estimates</h3>
        <p style={{ color: COLORS.textDim }}>Generate circuit mappings to see physical PCB layout resource estimations.</p>
      </div>
    );
  }

  const selected = resourceData[selectedIdx] || resourceData[0];

  return (
    <div>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: COLORS.text }}>PCB Manufacturing Resource Estimates</h2>
        <span className="badge" style={{
          background: 'linear-gradient(135deg, #10b981, #a855f7)',
          color: '#fff', fontSize: 11,
        }}>DFM Analysis</span>
      </div>

      {/* Tabs */}
      <div className="tabs-header" style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        {resourceData.map((d, i) => (
          <button
            key={i}
            onClick={() => setSelectedIdx(i)}
            className="tab-btn"
            style={{
              padding: '8px 16px', borderRadius: 8, cursor: 'pointer',
              background: i === selectedIdx ? `${d.color}22` : 'transparent',
              color: i === selectedIdx ? d.color : COLORS.textDim,
              border: `1px solid ${i === selectedIdx ? d.color : 'rgba(255,255,255,0.06)'}`,
              fontWeight: i === selectedIdx ? 700 : 400,
              transition: 'all 0.2s'
            }}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* Side-by-Side Stats and Gauge */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 240px', gap: 16, marginBottom: 20 }}>
        {/* Resource Cards Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
          {[
            { label: 'Formulated Board Area', value: `${selected.boardArea.toFixed(1)} cm²`, desc: 'Total silicon & routing footprint' },
            { label: 'Assigned IC Packages', value: selected.totalICs, desc: 'DIP-14 chips required' },
            { label: 'Active Contact Pins', value: selected.pinsUsed, desc: 'VCC, GND, and logic pins used' },
            { label: 'Physical Copper Wires', value: selected.wires, desc: 'Signal traces needed' },
            { label: 'Estimated Inter-layer Vias', value: selected.vias, desc: 'Through-hole layer hops' },
            { label: 'Routing Complexity', value: selected.routingComplexity, desc: 'Index of board wire length' },
          ].map((item, idx) => (
            <div key={idx} className="glass-panel" style={{
              margin: 0, padding: '12px 14px', display: 'flex', flexDirection: 'column', gap: 4
            }}>
              <span style={{ fontSize: 10, color: COLORS.textDim }}>{item.label}</span>
              <span style={{ fontSize: 16, fontWeight: 700, color: selected.color, fontFamily: 'monospace' }}>
                {item.value}
              </span>
              <span style={{ fontSize: 9, color: COLORS.textDim, opacity: 0.7 }}>{item.desc}</span>
            </div>
          ))}
        </div>

        {/* Gauge card */}
        <div className="glass-panel" style={{
          margin: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
          background: 'rgba(2,6,23,0.3)', border: '1px solid rgba(255,255,255,0.04)'
        }}>
          <h4 style={{ color: COLORS.cyan, fontSize: 11, textTransform: 'uppercase', margin: '0 0 10px 0', letterSpacing: 0.5 }}>
            DFM Assessment
          </h4>
          <ManufacturabilityGauge score={selected.manufacturabilityScore} />
          <div style={{ fontSize: 10, color: COLORS.textDim, textAlign: 'center', padding: '0 10px', marginTop: 6 }}>
            {selected.manufacturabilityScore >= 80 
              ? '✅ Excellent manufacturability. Low component count and minimal layer vias.' 
              : selected.manufacturabilityScore >= 50 
              ? '⚡ Moderate manufacturability. Watch wire density.' 
              : '⚠️ Hard to manufacture. High trace density may require a 4-layer PCB.'}
          </div>
        </div>
      </div>

      {/* Comparison table */}
      <div className="glass-panel" style={{ margin: 0 }}>
        <h4 style={{ color: COLORS.cyan, fontSize: 12, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
          PCB Resource Allocation Matrix
        </h4>
        <table className="styled-table" style={{ fontSize: '0.85em' }}>
          <thead>
            <tr>
              <th style={{ textAlign: 'left' }}>Strategy</th>
              <th>ICs</th>
              <th>Area (cm²)</th>
              <th>Pins</th>
              <th>Wires</th>
              <th>Vias</th>
              <th>Mfg Score</th>
            </tr>
          </thead>
          <tbody>
            {resourceData.map((d, i) => (
              <tr key={i} style={{
                background: i === selectedIdx ? 'rgba(255,255,255,0.03)' : undefined
              }}>
                <td style={{ textAlign: 'left', fontWeight: 600, color: d.color }}>{d.label}</td>
                <td style={{ fontFamily: 'monospace' }}>{d.totalICs}</td>
                <td style={{ fontFamily: 'monospace' }}>{d.boardArea.toFixed(1)}</td>
                <td style={{ fontFamily: 'monospace' }}>{d.pinsUsed}</td>
                <td style={{ fontFamily: 'monospace' }}>{d.wires}</td>
                <td style={{ fontFamily: 'monospace' }}>{d.vias}</td>
                <td style={{
                  fontFamily: 'monospace', fontWeight: 700,
                  color: d.manufacturabilityScore >= 80 ? COLORS.green : d.manufacturabilityScore >= 50 ? COLORS.amber : COLORS.red
                }}>{d.manufacturabilityScore}/100</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default PCBResourcePanel;
