import React, { useState } from 'react';

const COLORS = {
  text: '#f8fafc',
  textDim: '#94a3b8',
  cyan: '#06b6d4',
  green: '#10b981',
  amber: '#f59e0b',
  border: 'rgba(255,255,255,0.08)',
  pcbBg: '#1b381e',       // Dark green PCB color
  pcbTrace: '#274e2b',    // Copper trace green
  chipBg: '#1e1e1e',      // Matte black IC package
  pinColor: '#d1d5db',    // Metallic silver pins
  wireColor: '#f59e0b'    // Gold trace wiring
};

/* SVG Board Component */
const PCBBoard = ({ placement, wires, title }) => {
  const scale = 25; // Scale cm to pixels for SVG drawing
  
  // Calculate size in pixels
  const w = 11 * scale;
  const h = 8 * scale;

  return (
    <div style={{ textAlign: 'center' }}>
      <h5 style={{ color: COLORS.cyan, margin: '0 0 10px 0', fontSize: 13, textTransform: 'uppercase', letterSpacing: 0.5 }}>
        {title}
      </h5>
      <div style={{
        padding: 10, background: 'rgba(2,6,23,0.5)', borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.05)', display: 'inline-block'
      }}>
        <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ borderRadius: 6, display: 'block' }}>
          {/* Green Soldermask Board Background */}
          <rect x={0} y={0} width={w} height={h} fill={COLORS.pcbBg} rx={8} />

          {/* Copper grid background traces for visual realism */}
          {Array.from({ length: 15 }).map((_, i) => (
            <line key={`lh${i}`} x1={0} y1={i * 20} x2={w} y2={i * 20} stroke={COLORS.pcbTrace} strokeWidth={0.5} opacity={0.6} />
          ))}
          {Array.from({ length: 20 }).map((_, i) => (
            <line key={`lv${i}`} x1={i * 20} y1={0} x2={i * 20} y2={h} stroke={COLORS.pcbTrace} strokeWidth={0.5} opacity={0.6} />
          ))}

          {/* Gold Wires/Traces */}
          {wires.map((wire, idx) => {
            const x1 = wire.from.x * scale;
            const y1 = wire.from.y * scale;
            const x2 = wire.to.x * scale;
            const y2 = wire.to.y * scale;
            
            // Draw nice right-angled Manhattan trace or straight line
            return (
              <g key={idx}>
                {/* Copper trace glow */}
                <path d={`M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2}`}
                  fill="none" stroke={COLORS.wireColor} strokeWidth={2.5} opacity={0.3} />
                {/* Copper trace core */}
                <path d={`M ${x1} ${y1} L ${x2} ${y1} L ${x2} ${y2}`}
                  fill="none" stroke={COLORS.wireColor} strokeWidth={1} />
                {/* Vias (pin contact pads) */}
                <circle cx={x1} cy={y1} r={3} fill="#ffd700" stroke="#000" strokeWidth={0.5} />
                <circle cx={x2} cy={y2} r={3} fill="#ffd700" stroke="#000" strokeWidth={0.5} />
              </g>
            );
          })}

          {/* IC Chip Packages */}
          {placement.map((ic, idx) => {
            const ix = ic.x * scale;
            const iy = ic.y * scale;
            const iw = ic.width * scale;
            const ih = ic.height * scale;
            const pins = 14;
            const pinsPerSide = pins / 2;
            const pinW = 4;
            const pinH = 6;
            const pinSpacing = iw / (pinsPerSide + 1);

            return (
              <g key={idx}>
                {/* Silver Pins (Top & Bottom edges) */}
                {Array.from({ length: pinsPerSide }).map((_, p) => {
                  const px = ix + pinSpacing * (p + 1) - pinW / 2;
                  return (
                    <g key={p}>
                      {/* Top Pin */}
                      <rect x={px} y={iy - pinH} width={pinW} height={pinH} fill={COLORS.pinColor} rx={1} />
                      {/* Bottom Pin */}
                      <rect x={px} y={iy + ih} width={pinW} height={pinH} fill={COLORS.pinColor} rx={1} />
                    </g>
                  );
                })}

                {/* Chip Body */}
                <rect x={ix} y={iy} width={iw} height={ih} rx={3} fill={COLORS.chipBg} stroke="#111" strokeWidth={1} />
                
                {/* Notch on the left side of chip */}
                <path d={`M ${ix} ${iy + ih/2 - 5} A 5 5 0 0 0 ${ix} ${iy + ih/2 + 5}`} fill={COLORS.pcbBg} stroke="#111" strokeWidth={1} />

                {/* Chip Identifier Label */}
                <text x={ix + iw / 2} y={iy + ih / 2 + 3} textAnchor="middle" fill="#e2e8f0" fontSize={8} fontWeight="bold" fontFamily="monospace">
                  {ic.icId}
                </text>
              </g>
            );
          })}
        </svg>
      </div>
    </div>
  );
};

/* Main Component */
const PCBPlacementPanel = ({ placementResult }) => {
  const [showSteps, setShowSteps] = useState(false);

  if (!placementResult || !placementResult.initialPlacement || placementResult.initialPlacement.length === 0) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📐</div>
        <h3 style={{ color: COLORS.text }}>No Placement Analysis Data</h3>
        <p style={{ color: COLORS.textDim }}>Execute the IC mapping engine first to enable automatic PCB physical layout simulation.</p>
      </div>
    );
  }

  const {
    initialPlacement,
    optimizedPlacement,
    initialWireLength,
    optimizedWireLength,
    wireReduction,
    boardWidth,
    boardHeight,
    wires,
    steps
  } = placementResult;

  return (
    <div>
      {/* Section Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: COLORS.text }}>PCB Physical Placement Simulation</h2>
        <span className="badge" style={{
          background: 'linear-gradient(135deg, #10b981, #06b6d4)',
          color: '#fff', fontSize: 11,
        }}>Pairwise Swap Refinement</span>
      </div>

      {/* Metrics Row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        {[
          { label: 'Initial Trace Length', value: `${initialWireLength} cm`, color: COLORS.amber },
          { label: 'Optimized Trace Length', value: `${optimizedWireLength} cm`, color: COLORS.green },
          { label: 'Total Trace Reduction', value: `-${wireReduction}%`, color: COLORS.cyan },
          { label: 'Formulated PCB Size', value: `${boardWidth} × ${boardHeight} cm`, color: '#a855f7' }
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

      {/* Side-by-side Boards */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        <PCBBoard placement={initialPlacement} wires={wires} title="Initial Layout (Unoptimized Grid)" />
        <PCBBoard placement={optimizedPlacement} wires={wires} title="Refined Layout (Min-Wire Placement)" />
      </div>

      {/* Decision steps log */}
      <div style={{ marginTop: 20 }}>
        <button
          onClick={() => setShowSteps(!showSteps)}
          className="btn-secondary"
          style={{ fontSize: 12, padding: '8px 16px' }}
        >
          {showSteps ? 'Hide Placement Decision Steps' : 'Show Placement Decision Steps'}
        </button>

        {showSteps && (
          <div className="glass-panel" style={{ marginTop: 12, maxHeight: 180, overflowY: 'auto' }}>
            <h4 style={{ color: COLORS.cyan, fontSize: 12, margin: '0 0 10px 0', textTransform: 'uppercase' }}>
              Hill-Climbing Layout Decision Log
            </h4>
            {steps.map((s, idx) => (
              <div key={idx} style={{
                fontSize: 12, padding: '6px 8px', borderBottom: '1px solid rgba(255,255,255,0.03)',
                display: 'flex', justifyContent: 'space-between'
              }}>
                <span style={{ color: COLORS.textDim }}>
                  Step {s.step}: <strong>{s.action}</strong>
                </span>
                <span style={{ fontFamily: 'monospace', color: COLORS.cyan }}>
                  {s.wireLength > 0 ? `${s.wireLength} cm` : s.result}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default PCBPlacementPanel;
