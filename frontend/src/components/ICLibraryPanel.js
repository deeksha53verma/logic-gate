import React, { useState, useMemo } from 'react';
import { IC_LIBRARY } from '../ic-library/icLibrary';

/* ─── Inline Style Constants ────────────────────────────────── */
const COLORS = {
  bg: 'rgba(15,23,42,0.92)',
  bgDeep: 'rgba(2,6,23,0.97)',
  card: 'rgba(15,23,42,0.6)',
  cardHover: 'rgba(30,41,59,0.75)',
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(6,182,212,0.45)',
  text: '#f8fafc',
  textDim: '#94a3b8',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  purple: '#a855f7',
  green: '#10b981',
  amber: '#f59e0b',
};

/* ─── SVG Chip Thumbnail ────────────────────────────────────── */
const ChipSVG = ({ ic, size = 120 }) => {
  const pinCount = ic.pinCount || 14;
  const pinsPerSide = pinCount / 2;
  const w = size;
  const h = size * 1.3;
  const bodyW = w * 0.48;
  const bodyH = h * 0.82;
  const bodyX = (w - bodyW) / 2;
  const bodyY = (h - bodyH) / 2;
  const pinLen = 14;
  const pinH = 4;
  const pinSpacing = bodyH / (pinsPerSide + 1);

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} style={{ display: 'block', margin: '0 auto' }}>
      {/* Chip body */}
      <rect x={bodyX} y={bodyY} width={bodyW} height={bodyH} rx={3}
        fill="#0f172a" stroke="#38bdf8" strokeWidth={1.5} />
      {/* Notch */}
      <path d={`M ${w/2 - 6} ${bodyY} A 6 6 0 0 1 ${w/2 + 6} ${bodyY}`}
        fill="none" stroke="#38bdf8" strokeWidth={1.5} />
      {/* Pin 1 dot */}
      <circle cx={bodyX + 8} cy={bodyY + pinSpacing} r={2.5} fill={COLORS.cyan} opacity={0.9} />

      {/* Left pins */}
      {Array.from({ length: pinsPerSide }).map((_, i) => {
        const y = bodyY + pinSpacing * (i + 1);
        return (
          <g key={`l${i}`}>
            <line x1={bodyX - pinLen} y1={y} x2={bodyX} y2={y}
              stroke="#64748b" strokeWidth={pinH} strokeLinecap="round" />
            <text x={bodyX - pinLen - 4} y={y + 3} textAnchor="end"
              fill={COLORS.textDim} fontSize={7} fontFamily="monospace">{i + 1}</text>
          </g>
        );
      })}

      {/* Right pins */}
      {Array.from({ length: pinsPerSide }).map((_, i) => {
        const y = bodyY + pinSpacing * (pinsPerSide - i);
        return (
          <g key={`r${i}`}>
            <line x1={bodyX + bodyW} y1={y} x2={bodyX + bodyW + pinLen} y2={y}
              stroke="#64748b" strokeWidth={pinH} strokeLinecap="round" />
            <text x={bodyX + bodyW + pinLen + 4} y={y + 3} textAnchor="start"
              fill={COLORS.textDim} fontSize={7} fontFamily="monospace">{pinsPerSide + i + 1}</text>
          </g>
        );
      })}

      {/* IC Name */}
      <text x={w / 2} y={h / 2 + 1} textAnchor="middle" dominantBaseline="middle"
        fill={COLORS.cyan} fontSize={12} fontWeight="bold" fontFamily="monospace">
        {ic.id || ic.name}
      </text>
    </svg>
  );
};

/* ─── Large Detail Pin Layout ───────────────────────────────── */
const DetailPinSVG = ({ ic }) => {
  const pinCount = ic.pinCount || 14;
  const pinsPerSide = pinCount / 2;
  const w = 320;
  const h = 340;
  const bodyW = 140;
  const bodyH = 260;
  const bodyX = (w - bodyW) / 2;
  const bodyY = (h - bodyH) / 2;
  const pinLen = 35;
  const pinH = 5;
  const pinSpacing = bodyH / (pinsPerSide + 1);
  const pinLabels = ic.pinLabels || [];

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      <defs>
        <linearGradient id="chipGrad" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#1e293b" />
          <stop offset="100%" stopColor="#0f172a" />
        </linearGradient>
      </defs>
      <rect x={bodyX} y={bodyY} width={bodyW} height={bodyH} rx={5}
        fill="url(#chipGrad)" stroke="#06b6d4" strokeWidth={2} />
      <path d={`M ${w/2 - 10} ${bodyY} A 10 10 0 0 1 ${w/2 + 10} ${bodyY}`}
        fill="none" stroke="#06b6d4" strokeWidth={2} />
      <circle cx={bodyX + 12} cy={bodyY + pinSpacing} r={4} fill={COLORS.cyan} opacity={0.8} />

      {/* Left pins with labels */}
      {Array.from({ length: pinsPerSide }).map((_, i) => {
        const y = bodyY + pinSpacing * (i + 1);
        const label = pinLabels[i] || `P${i + 1}`;
        return (
          <g key={`dl${i}`}>
            <rect x={bodyX - pinLen} y={y - pinH/2} width={pinLen} height={pinH}
              fill="#475569" rx={1} />
            <text x={bodyX - pinLen - 6} y={y + 4} textAnchor="end"
              fill={COLORS.text} fontSize={9} fontFamily="monospace">
              {i + 1} — {label}
            </text>
          </g>
        );
      })}

      {/* Right pins with labels */}
      {Array.from({ length: pinsPerSide }).map((_, i) => {
        const pinNum = pinCount - i;
        const y = bodyY + pinSpacing * (i + 1);
        const label = pinLabels[pinNum - 1] || `P${pinNum}`;
        return (
          <g key={`dr${i}`}>
            <rect x={bodyX + bodyW} y={y - pinH/2} width={pinLen} height={pinH}
              fill="#475569" rx={1} />
            <text x={bodyX + bodyW + pinLen + 6} y={y + 4} textAnchor="start"
              fill={COLORS.text} fontSize={9} fontFamily="monospace">
              {label} — {pinNum}
            </text>
          </g>
        );
      })}

      {/* IC Name Center */}
      <text x={w / 2} y={h / 2 - 8} textAnchor="middle" fill={COLORS.cyan}
        fontSize={18} fontWeight="bold" fontFamily="monospace">{ic.id}</text>
      <text x={w / 2} y={h / 2 + 12} textAnchor="middle" fill={COLORS.textDim}
        fontSize={10}>{ic.gateType} × {ic.gatesPerChip || '?'}</text>
    </svg>
  );
};

/* ─── Internal Gate Diagram ─────────────────────────────────── */
const InternalGateSVG = ({ ic }) => {
  const gatesPerChip = ic.gatesPerChip || 4;
  const gateType = (ic.gateType || 'AND').toUpperCase();
  const w = 300;
  const h = 60 + gatesPerChip * 50;

  const gateSymbol = (cx, cy, type) => {
    const gw = 36;
    const gh = 28;
    const shapes = {
      AND: `M ${cx - gw/2} ${cy - gh/2} L ${cx} ${cy - gh/2} A ${gh/2} ${gh/2} 0 0 1 ${cx} ${cy + gh/2} L ${cx - gw/2} ${cy + gh/2} Z`,
      OR: `M ${cx - gw/2} ${cy - gh/2} Q ${cx} ${cy - gh/4} ${cx + gw/2} ${cy} Q ${cx} ${cy + gh/4} ${cx - gw/2} ${cy + gh/2} Q ${cx - gw/4} ${cy} ${cx - gw/2} ${cy - gh/2}`,
      NAND: `M ${cx - gw/2} ${cy - gh/2} L ${cx - 2} ${cy - gh/2} A ${gh/2} ${gh/2} 0 0 1 ${cx - 2} ${cy + gh/2} L ${cx - gw/2} ${cy + gh/2} Z`,
      NOR: `M ${cx - gw/2} ${cy - gh/2} Q ${cx} ${cy - gh/4} ${cx + gw/2 - 6} ${cy} Q ${cx} ${cy + gh/4} ${cx - gw/2} ${cy + gh/2} Q ${cx - gw/4} ${cy} ${cx - gw/2} ${cy - gh/2}`,
      NOT: `M ${cx - gw/2} ${cy - gh/2} L ${cx + gw/4} ${cy} L ${cx - gw/2} ${cy + gh/2} Z`,
      XOR: `M ${cx - gw/2} ${cy - gh/2} Q ${cx} ${cy - gh/4} ${cx + gw/2} ${cy} Q ${cx} ${cy + gh/4} ${cx - gw/2} ${cy + gh/2} Q ${cx - gw/4} ${cy} ${cx - gw/2} ${cy - gh/2}`,
    };
    const isInverted = type === 'NAND' || type === 'NOR' || type === 'NOT' || type === 'XNOR';
    return (
      <g>
        <path d={shapes[type] || shapes.AND} fill="rgba(6,182,212,0.15)" stroke={COLORS.cyan} strokeWidth={1.5} />
        {isInverted && <circle cx={cx + gw/2 + 4} cy={cy} r={4} fill="none" stroke={COLORS.cyan} strokeWidth={1.5} />}
        {/* Input lines */}
        <line x1={cx - gw/2 - 18} y1={cy - 8} x2={cx - gw/2} y2={cy - 8} stroke="#64748b" strokeWidth={1.5} />
        {type !== 'NOT' && <line x1={cx - gw/2 - 18} y1={cy + 8} x2={cx - gw/2} y2={cy + 8} stroke="#64748b" strokeWidth={1.5} />}
        {/* Output line */}
        <line x1={cx + gw/2 + (isInverted ? 8 : 0)} y1={cy} x2={cx + gw/2 + 22} y2={cy} stroke="#64748b" strokeWidth={1.5} />
      </g>
    );
  };

  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`}>
      {/* Chip outline */}
      <rect x={20} y={10} width={w - 40} height={h - 20} rx={6}
        fill="rgba(15,23,42,0.4)" stroke="rgba(255,255,255,0.1)" strokeWidth={1} strokeDasharray="4 2" />
      <text x={w / 2} y={28} textAnchor="middle" fill={COLORS.textDim} fontSize={10}>Internal Logic</text>
      {Array.from({ length: gatesPerChip }).map((_, i) => {
        const cy = 55 + i * 50;
        return (
          <g key={i}>
            {gateSymbol(w / 2, cy, gateType)}
            <text x={w / 2} y={cy + 24} textAnchor="middle" fill={COLORS.textDim} fontSize={8}>
              Gate {i + 1}
            </text>
          </g>
        );
      })}
    </svg>
  );
};

/* ─── Detail Modal ──────────────────────────────────────────── */
const DetailModal = ({ ic, onClose }) => {
  if (!ic) return null;

  const truthTable = ic.truthTable || [];
  const specs = [
    { label: 'Gate Type', value: ic.gateType },
    { label: 'Gates / Chip', value: ic.gatesPerChip },
    { label: 'Propagation Delay', value: `${ic.delay || '?'} ns` },
    { label: 'Power (per gate)', value: `${ic.power || '?'} mW` },
    { label: 'Unit Cost', value: `$${ic.cost || '?'}` },
    { label: 'Technology', value: ic.technology || 'TTL' },
    { label: 'Package', value: ic.package || 'DIP-14' },
    { label: 'Availability', value: ic.availability || 'Common' },
  ];

  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.2s ease',
    }} onClick={onClose}>
      <div onClick={e => e.stopPropagation()} style={{
        background: COLORS.bg, border: `1px solid ${COLORS.borderHover}`,
        borderRadius: 20, padding: 32, width: '90%', maxWidth: 900, maxHeight: '90vh',
        overflowY: 'auto', boxShadow: '0 25px 80px rgba(6,182,212,0.2)',
        position: 'relative',
      }}>
        {/* Close button */}
        <button onClick={onClose} style={{
          position: 'absolute', top: 16, right: 16,
          background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171', borderRadius: '50%', width: 36, height: 36,
          cursor: 'pointer', fontSize: 18, fontWeight: 'bold',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          transition: 'all 0.2s',
        }}
          onMouseEnter={e => { e.target.style.background = '#ef4444'; e.target.style.color = '#fff'; }}
          onMouseLeave={e => { e.target.style.background = 'rgba(239,68,68,0.15)'; e.target.style.color = '#f87171'; }}
        >✕</button>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 24 }}>
          <span style={{
            background: 'linear-gradient(135deg, #06b6d4, #3b82f6)', padding: '6px 16px',
            borderRadius: 20, fontSize: 14, fontWeight: 700, color: '#fff',
          }}>{ic.id}</span>
          <h2 style={{ margin: 0, fontSize: 22, color: COLORS.text }}>{ic.name || ic.gateType + ' Gate IC'}</h2>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Pin Layout */}
          <div style={{
            background: 'rgba(2,6,23,0.5)', borderRadius: 12, padding: 16,
            border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center',
          }}>
            <h4 style={{ color: COLORS.cyan, margin: '0 0 10px 0', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>
              Pin Layout ({ic.package || 'DIP-14'})
            </h4>
            <DetailPinSVG ic={ic} />
          </div>

          {/* Internal Gate Diagram */}
          <div style={{
            background: 'rgba(2,6,23,0.5)', borderRadius: 12, padding: 16,
            border: '1px solid rgba(255,255,255,0.05)', textAlign: 'center',
          }}>
            <h4 style={{ color: COLORS.cyan, margin: '0 0 10px 0', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>
              Internal Gate Diagram
            </h4>
            <InternalGateSVG ic={ic} />
          </div>
        </div>

        {/* Truth Table + Specs Row */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginTop: 24 }}>
          {/* Truth Table */}
          <div>
            <h4 style={{ color: COLORS.cyan, margin: '0 0 10px 0', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>
              Truth Table
            </h4>
            {truthTable.length > 0 ? (
              <table className="styled-table" style={{ fontSize: '0.85em' }}>
                <thead>
                  <tr>
                    {Object.keys(truthTable[0]).map(k => (
                      <th key={k} style={{ padding: '8px 12px' }}>{k}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {truthTable.map((row, i) => (
                    <tr key={i}>
                      {Object.values(row).map((v, j) => (
                        <td key={j} style={{
                          padding: '8px 12px', fontFamily: 'monospace', fontWeight: 600,
                          color: v === 1 ? COLORS.green : v === 0 ? '#f87171' : COLORS.text,
                        }}>{v}</td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : (
              <div style={{ color: COLORS.textDim, fontStyle: 'italic', padding: 16 }}>
                Truth table data not available for this IC.
              </div>
            )}
          </div>

          {/* Specifications */}
          <div>
            <h4 style={{ color: COLORS.cyan, margin: '0 0 10px 0', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>
              Specifications
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {specs.map(({ label, value }) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '8px 14px', background: 'rgba(15,23,42,0.5)', borderRadius: 8,
                  border: '1px solid rgba(255,255,255,0.04)',
                }}>
                  <span style={{ color: COLORS.textDim, fontSize: 13 }}>{label}</span>
                  <span style={{ color: COLORS.text, fontWeight: 600, fontSize: 13, fontFamily: 'monospace' }}>{value}</span>
                </div>
              ))}
            </div>

            {/* Applications */}
            {ic.applications && ic.applications.length > 0 && (
              <div style={{ marginTop: 16 }}>
                <h4 style={{ color: COLORS.cyan, margin: '0 0 10px 0', fontSize: 13, textTransform: 'uppercase', letterSpacing: 1 }}>
                  Applications
                </h4>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {ic.applications.map((app, i) => (
                    <span key={i} className="badge" style={{
                      background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)',
                      color: COLORS.cyan, fontSize: 11, padding: '4px 10px',
                    }}>{app}</span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   IC Library Panel — Main Component
   ═══════════════════════════════════════════════════════════════ */
const ICLibraryPanel = () => {
  const [search, setSearch] = useState('');
  const [selectedIC, setSelectedIC] = useState(null);

  const allICs = useMemo(() => {
    try {
      return IC_LIBRARY || [];
    } catch {
      return [];
    }
  }, []);

  const filtered = useMemo(() => {
    if (!search.trim()) return allICs;
    const q = search.toLowerCase();
    return allICs.filter(ic =>
      (ic.id && ic.id.toLowerCase().includes(q)) ||
      (ic.name && ic.name.toLowerCase().includes(q)) ||
      (ic.gateType && ic.gateType.toLowerCase().includes(q))
    );
  }, [allICs, search]);

  return (
    <div style={{ padding: 8 }}>
      {/* Search Bar */}
      <div style={{
        display: 'flex', gap: 12, marginBottom: 20, alignItems: 'center',
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <span style={{
            position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
            color: COLORS.textDim, fontSize: 16, pointerEvents: 'none',
          }}>🔍</span>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search ICs by name, type, or gate..."
            style={{
              width: '100%', padding: '12px 16px 12px 42px',
              background: 'rgba(15,23,42,0.8)', color: COLORS.text,
              border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
              fontSize: 14, outline: 'none', transition: 'border-color 0.2s',
              boxSizing: 'border-box',
            }}
          />
        </div>
        <span className="badge" style={{
          background: 'rgba(6,182,212,0.15)', border: '1px solid rgba(6,182,212,0.3)',
          color: COLORS.cyan, whiteSpace: 'nowrap',
        }}>
          {filtered.length} IC{filtered.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* IC Grid */}
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16,
      }}>
        {filtered.map(ic => (
          <div key={ic.id} onClick={() => setSelectedIC(ic)} className="dashboard-card" style={{
            background: COLORS.card, cursor: 'pointer',
            border: `1px solid ${COLORS.border}`, borderRadius: 14,
            transition: 'all 0.25s ease', position: 'relative', overflow: 'hidden',
          }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = COLORS.borderHover;
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(6,182,212,0.15)';
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = COLORS.border;
              e.currentTarget.style.boxShadow = 'none';
            }}
          >
            {/* Glow accent */}
            <div style={{
              position: 'absolute', top: 0, left: 0, right: 0, height: 3,
              background: 'linear-gradient(90deg, #06b6d4, #3b82f6, #a855f7)',
              borderRadius: '14px 14px 0 0',
            }} />

            <ChipSVG ic={ic} size={110} />

            <div style={{ marginTop: 10, textAlign: 'center' }}>
              <div style={{
                fontWeight: 700, fontSize: 15, color: COLORS.text, marginBottom: 4,
              }}>{ic.id}</div>
              <div style={{
                fontSize: 12, color: COLORS.textDim, marginBottom: 8,
              }}>{ic.name || `${ic.gateType} Gate`}</div>

              <div style={{
                display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4, fontSize: 11,
              }}>
                <div style={{
                  background: 'rgba(6,182,212,0.1)', borderRadius: 6, padding: '4px 6px',
                  color: COLORS.cyan,
                }}>
                  <span style={{ opacity: 0.7 }}>Type </span>
                  <strong>{ic.gateType}</strong>
                </div>
                <div style={{
                  background: 'rgba(59,130,246,0.1)', borderRadius: 6, padding: '4px 6px',
                  color: COLORS.blue,
                }}>
                  <span style={{ opacity: 0.7 }}>Gates </span>
                  <strong>{ic.gatesPerChip || '?'}</strong>
                </div>
                <div style={{
                  background: 'rgba(245,158,11,0.1)', borderRadius: 6, padding: '4px 6px',
                  color: COLORS.amber,
                }}>
                  <span style={{ opacity: 0.7 }}>Delay </span>
                  <strong>{ic.delay || '?'}ns</strong>
                </div>
                <div style={{
                  background: 'rgba(16,185,129,0.1)', borderRadius: 6, padding: '4px 6px',
                  color: COLORS.green,
                }}>
                  <span style={{ opacity: 0.7 }}>Cost </span>
                  <strong>${ic.cost || '?'}</strong>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div style={{
          textAlign: 'center', padding: 40, color: COLORS.textDim,
          fontSize: 14, fontStyle: 'italic',
        }}>
          No ICs found matching "{search}"
        </div>
      )}

      {/* Detail Modal */}
      {selectedIC && <DetailModal ic={selectedIC} onClose={() => setSelectedIC(null)} />}
    </div>
  );
};

export default ICLibraryPanel;
