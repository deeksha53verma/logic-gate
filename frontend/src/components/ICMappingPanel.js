import React, { useState, useEffect, useMemo } from 'react';
import { generateAllImplementations } from '../mapping-engine/icMappingEngine';

const COLORS = {
  bg: 'rgba(15,23,42,0.92)',
  card: 'rgba(15,23,42,0.55)',
  border: 'rgba(255,255,255,0.08)',
  borderHover: 'rgba(6,182,212,0.4)',
  text: '#f8fafc',
  textDim: '#94a3b8',
  cyan: '#06b6d4',
  blue: '#3b82f6',
  green: '#10b981',
  amber: '#f59e0b',
  purple: '#a855f7',
  fuchsia: '#d946ef',
};

const IMPL_COLORS = {
  basic: '#3b82f6',
  nand: '#f59e0b',
  nor: '#10b981',
  mixed: '#d946ef',
};

const IMPL_GRADIENTS = {
  basic: 'linear-gradient(135deg, rgba(59,130,246,0.2), rgba(59,130,246,0.05))',
  nand: 'linear-gradient(135deg, rgba(245,158,11,0.2), rgba(245,158,11,0.05))',
  nor: 'linear-gradient(135deg, rgba(16,185,129,0.2), rgba(16,185,129,0.05))',
  mixed: 'linear-gradient(135deg, rgba(217,70,239,0.2), rgba(217,70,239,0.05))',
};

const IMPL_LABELS = ['Basic', 'NAND-Only', 'NOR-Only', 'Mixed'];
const IMPL_KEYS = ['basic', 'nand', 'nor', 'mixed'];
const IMPL_ICONS = ['📦', '⚡', '🔄', '🔀'];

/* Visual IC Block with gate slot indicators */
const ICBlock = ({ ic, color }) => {
  const total = ic.totalGates || 4;
  const used = ic.usedGates || 0;

  return (
    <div style={{
      display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
      background: 'rgba(2,6,23,0.6)', borderRadius: 8, padding: '8px 10px',
      border: `1px solid ${color}33`, minWidth: 60,
    }}>
      <div style={{
        fontSize: 11, fontWeight: 700, color, marginBottom: 6, fontFamily: 'monospace',
      }}>{ic.id || ic.name}</div>
      {/* Gate slots */}
      <div style={{ display: 'flex', gap: 3 }}>
        {Array.from({ length: total }).map((_, i) => (
          <div key={i} style={{
            width: 10, height: 10, borderRadius: 2,
            background: i < used ? color : 'rgba(255,255,255,0.06)',
            border: `1px solid ${i < used ? color : 'rgba(255,255,255,0.1)'}`,
            boxShadow: i < used ? `0 0 6px ${color}44` : 'none',
            transition: 'all 0.3s ease',
          }} />
        ))}
      </div>
      <div style={{ fontSize: 9, color: COLORS.textDim, marginTop: 4 }}>
        {used}/{total} used
      </div>
    </div>
  );
};

/* Implementation Card */
const ImplCard = ({ impl, label, icon, colorKey, isBest }) => {
  const color = IMPL_COLORS[colorKey];
  const icList = impl?.icList || impl?.ics || [];
  const totalICs = impl?.totalICs || icList.length || 0;
  const unusedGates = impl?.unusedGates || 0;
  const cost = impl?.totalCost || impl?.cost || 0;
  const power = impl?.totalPower || impl?.power || 0;
  const area = impl?.pcbArea || impl?.area || 0;

  return (
    <div className="glass-panel" style={{
      margin: 0, position: 'relative', overflow: 'hidden',
      background: IMPL_GRADIENTS[colorKey],
      border: isBest ? `2px solid ${COLORS.green}` : `1px solid ${COLORS.border}`,
      boxShadow: isBest ? `0 0 24px rgba(16,185,129,0.2)` : undefined,
      transition: 'all 0.3s ease',
    }}>
      {/* Best badge */}
      {isBest && (
        <div style={{
          position: 'absolute', top: 12, right: 12,
          background: 'linear-gradient(135deg, #10b981, #059669)',
          padding: '4px 12px', borderRadius: 14, fontSize: 11,
          fontWeight: 700, color: '#fff',
          boxShadow: '0 2px 10px rgba(16,185,129,0.4)',
        }}>🏆 BEST</div>
      )}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
        <span style={{
          fontSize: 24, width: 40, height: 40,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: `${color}22`, borderRadius: 10,
        }}>{icon}</span>
        <div>
          <h3 style={{ margin: 0, fontSize: 16, color: COLORS.text }}>{label}</h3>
          <div style={{ fontSize: 11, color: COLORS.textDim }}>Implementation Strategy</div>
        </div>
      </div>

      {/* IC List */}
      <div style={{
        background: 'rgba(2,6,23,0.4)', borderRadius: 10, padding: 12,
        marginBottom: 14, border: '1px solid rgba(255,255,255,0.04)',
      }}>
        <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          IC Requirements
        </div>
        {icList.length > 0 ? (
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
            {icList.map((ic, i) => (
              <span key={i} className="badge" style={{
                background: `${color}22`, border: `1px solid ${color}44`,
                color, fontSize: 12, padding: '3px 10px',
              }}>
                {ic.quantity ? `${ic.quantity}× ` : ''}{ic.id || ic.name || ic}
              </span>
            ))}
          </div>
        ) : (
          <span style={{ color: COLORS.textDim, fontSize: 12, fontStyle: 'italic' }}>No ICs mapped</span>
        )}
      </div>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginBottom: 14 }}>
        {[
          { label: 'Total ICs', value: totalICs, icon: '📦' },
          { label: 'Unused Gates', value: unusedGates, icon: '⬜' },
          { label: 'Est. Cost', value: `$${typeof cost === 'number' ? cost.toFixed(2) : cost}`, icon: '💰' },
          { label: 'Power', value: `${typeof power === 'number' ? power.toFixed(1) : power} mW`, icon: '⚡' },
        ].map(({ label: l, value: v, icon: ic }) => (
          <div key={l} style={{
            background: 'rgba(2,6,23,0.4)', borderRadius: 8, padding: '8px 10px',
            border: '1px solid rgba(255,255,255,0.04)',
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          }}>
            <span style={{ fontSize: 11, color: COLORS.textDim }}>{ic} {l}</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, fontFamily: 'monospace' }}>{v}</span>
          </div>
        ))}
      </div>

      {/* PCB Area */}
      <div style={{
        background: 'rgba(2,6,23,0.4)', borderRadius: 8, padding: '8px 12px',
        border: '1px solid rgba(255,255,255,0.04)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span style={{ fontSize: 11, color: COLORS.textDim }}>📐 PCB Area</span>
        <span style={{ fontSize: 13, fontWeight: 700, color, fontFamily: 'monospace' }}>
          {typeof area === 'number' ? area.toFixed(1) : area} mm²
        </span>
      </div>

      {/* Visual IC Blocks */}
      {icList.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div style={{ fontSize: 11, color: COLORS.textDim, marginBottom: 8, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Gate Utilization
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {icList.map((ic, i) => {
              const qty = ic.quantity || 1;
              return Array.from({ length: qty }).map((_, q) => (
                <ICBlock key={`${i}-${q}`} ic={ic} color={color} />
              ));
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/* ═══════════════════════════════════════════════════════════════
   IC Mapping Panel — Main Component
   ═══════════════════════════════════════════════════════════════ */
const ICMappingPanel = ({ circuit, result }) => {
  const [implementations, setImplementations] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!circuit) return;
    try {
      const impls = generateAllImplementations(circuit);
      setImplementations(impls);
      setError(null);
    } catch (e) {
      console.error('IC Mapping Error:', e);
      setError(e.message);
    }
  }, [circuit]);

  const bestIdx = useMemo(() => {
    if (!implementations) return -1;
    const arr = Array.isArray(implementations) ? implementations : Object.values(implementations);
    let minICs = Infinity;
    let bestI = 0;
    arr.forEach((impl, i) => {
      const total = impl?.totalICs || impl?.ics?.length || 0;
      if (total < minICs && total > 0) {
        minICs = total;
        bestI = i;
      }
    });
    return bestI;
  }, [implementations]);

  if (!circuit) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>🔌</div>
        <h3 style={{ color: COLORS.text }}>No Circuit Available</h3>
        <p style={{ color: COLORS.textDim }}>Run the synthesizer first to generate IC mappings.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="glass-panel" style={{ borderColor: 'rgba(239,68,68,0.3)' }}>
        <h3 style={{ color: '#f87171' }}>⚠️ Mapping Error</h3>
        <p style={{ color: COLORS.textDim }}>{error}</p>
      </div>
    );
  }

  if (!implementations) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{
          width: 40, height: 40, border: '3px solid rgba(6,182,212,0.3)',
          borderTop: '3px solid #06b6d4', borderRadius: '50%',
          animation: 'spin 1s linear infinite', margin: '0 auto 16px',
        }} />
        <p style={{ color: COLORS.textDim }}>Generating IC implementations...</p>
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  const implArr = Array.isArray(implementations) ? implementations : [
    implementations.basic, implementations.nand, implementations.nor, implementations.mixed,
  ].filter(Boolean);

  return (
    <div>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: COLORS.text }}>IC Implementation Strategies</h2>
        <span className="badge" style={{
          background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
          color: '#fff', fontSize: 11,
        }}>{implArr.length} Implementations</span>
      </div>

      {/* 2×2 Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {implArr.map((impl, i) => (
          <ImplCard
            key={i}
            impl={impl}
            label={IMPL_LABELS[i] || `Impl ${i + 1}`}
            icon={IMPL_ICONS[i] || '📦'}
            colorKey={IMPL_KEYS[i] || 'basic'}
            isBest={i === bestIdx}
          />
        ))}
      </div>
    </div>
  );
};

export default ICMappingPanel;
