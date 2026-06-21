import React, { useMemo, useRef } from 'react';
import { exportAsJSON, exportAsPNG, exportAsPDF, generateCircuitReport } from '../utils/exportEngine';

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
  purple: '#a855f7'
};

const PipelineStage = ({ step, title, desc, value, isLast }) => (
  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', flex: 1, minWidth: 160 }}>
    <div className="glass-panel" style={{
      margin: 0, padding: '12px 14px', width: '100%', textAlign: 'center',
      background: 'rgba(15,23,42,0.6)', border: '1px solid rgba(255,255,255,0.05)',
      position: 'relative'
    }}>
      <div style={{
        position: 'absolute', top: -8, left: 10,
        background: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
        color: '#fff', fontSize: 9, fontWeight: 700,
        padding: '2px 6px', borderRadius: 4, fontFamily: 'monospace'
      }}>
        STAGE {step}
      </div>
      <h5 style={{ margin: '6px 0 2px 0', fontSize: 12, color: COLORS.cyan, textTransform: 'uppercase' }}>{title}</h5>
      <div style={{ fontSize: 13, fontWeight: 700, color: COLORS.text, whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden' }}>
        {value}
      </div>
      <div style={{ fontSize: 9, color: COLORS.textDim, marginTop: 2 }}>{desc}</div>
    </div>
    {!isLast && (
      <div style={{ fontSize: 18, color: COLORS.cyan, margin: '6px 0', userSelect: 'none' }}>
        🠗
      </div>
    )}
  </div>
);

/* SVG Circle Score Gauge */
const CircularScoreGauge = ({ score }) => {
  const r = 40;
  const circ = 2 * Math.PI * r; // 251.3
  const strokeDash = circ;
  const progressDash = (score / 100) * strokeDash;

  return (
    <svg width={100} height={100} viewBox="0 0 100 100">
      <circle cx={50} cy={50} r={r} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth={8} />
      <circle cx={50} cy={50} r={r} fill="none" stroke="url(#gaugeGradCircle)" strokeWidth={8}
        strokeDasharray={`${progressDash} ${strokeDash}`} strokeLinecap="round" transform="rotate(-90 50 50)"
        style={{ transition: 'stroke-dasharray 0.8s ease' }} />
      <defs>
        <linearGradient id="gaugeGradCircle" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="50%" stopColor="#a855f7" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
      </defs>
      <text x={50} y={54} textAnchor="middle" fill={COLORS.text} fontSize={18} fontWeight="bold" fontFamily="monospace">
        {score}
      </text>
    </svg>
  );
};

/* Main Component */
const EngineeringReport = ({ result, implementations, costs, heuristicScores, graphResult }) => {
  const reportRef = useRef(null);

  const impls = useMemo(() => {
    if (!implementations) return [];
    return Array.isArray(implementations) ? implementations : Object.values(implementations);
  }, [implementations]);

  // Determine winner mapping (lowest formulated cost)
  const winnerMapping = useMemo(() => {
    if (impls.length === 0) return null;
    let minCost = Infinity;
    let best = impls[0];
    impls.forEach(impl => {
      if (impl.totalCost < minCost && impl.totalCost > 0) {
        minCost = impl.totalCost;
        best = impl;
      }
    });
    return best;
  }, [impls]);

  // Compute Overall Optimization Score (0-100)
  const optimizationScore = useMemo(() => {
    if (impls.length === 0 || !winnerMapping) return 0;

    const costsArr = impls.map(i => i.totalCost || 0);
    const delays = impls.map(i => i.totalDelay || 0);
    const powers = impls.map(i => i.totalPower || 0);
    const areas = impls.map(i => i.estimatedPCBArea || 0);
    const ics = impls.map(i => i.totalICs || 0);

    const minC = Math.min(...costsArr), maxC = Math.max(...costsArr);
    const minD = Math.min(...delays), maxD = Math.max(...delays);
    const minP = Math.min(...powers), maxP = Math.max(...powers);
    const minA = Math.min(...areas), maxA = Math.max(...areas);
    const minI = Math.min(...ics), maxI = Math.max(...ics);

    const normC = maxC !== minC ? (winnerMapping.totalCost - minC) / (maxC - minC) : 0;
    const normD = maxD !== minD ? (winnerMapping.totalDelay - minD) / (maxD - minD) : 0;
    const normP = maxP !== minP ? (winnerMapping.totalPower - minP) / (maxP - minP) : 0;
    const normA = maxA !== minA ? (winnerMapping.estimatedPCBArea - minA) / (maxA - minA) : 0;
    const normI = maxI !== minI ? (winnerMapping.totalICs - minI) / (maxI - minI) : 0;

    // Weight formula: Total Cost (30%), Delay (25%), Power (20%), Area (15%), IC count (10%)
    const rawScore = 100 - (normC * 30 + normD * 25 + normP * 20 + normA * 15 + normI * 10);
    return Math.max(0, Math.min(100, Math.round(rawScore)));
  }, [impls, winnerMapping]);

  if (!winnerMapping) {
    return (
      <div className="glass-panel" style={{ textAlign: 'center', padding: 40 }}>
        <div style={{ fontSize: 48, marginBottom: 16 }}>📋</div>
        <h3 style={{ color: COLORS.text }}>No Engineering Report Data</h3>
        <p style={{ color: COLORS.textDim }}>Execute logical synthesis first to generate physical mapping and engineering summaries.</p>
      </div>
    );
  }

  const handleExportJSON = () => {
    exportAsJSON({
      expression: result?.expression,
      winner: winnerMapping,
      allImplementations: impls,
      heuristicScores
    }, 'eda_engineering_report.json');
  };

  const handleExportPNG = () => {
    exportAsPNG(reportRef, 'eda_engineering_report.png');
  };

  const handlePrintPDF = () => {
    const scoredList = heuristicScores || [];
    const reportHtml = generateCircuitReport(
      result?.expression || '',
      winnerMapping,
      impls,
      scoredList
    );
    exportAsPDF(reportHtml);
  };

  return (
    <div ref={reportRef}>
      {/* Title */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <h2 style={{ margin: 0, fontSize: 20, color: COLORS.text }}>EDA Pipeline Engineering Report</h2>
          <span className="badge" style={{
            background: 'linear-gradient(135deg, #a855f7, #ef4444)',
            color: '#fff', fontSize: 11,
          }}>Manufacturing Summary</span>
        </div>
        {/* Export buttons */}
        <div style={{ display: 'flex', gap: 8 }}>
          <button onClick={handleExportJSON} className="btn-secondary" style={{ fontSize: 11, padding: '6px 12px' }}>
            📥 Export JSON
          </button>
          <button onClick={handleExportPNG} className="btn-secondary" style={{ fontSize: 11, padding: '6px 12px' }}>
            📷 Capture PNG
          </button>
          <button onClick={handlePrintPDF} className="btn" style={{
            background: 'linear-gradient(90deg, #a855f7, #ef4444)',
            color: '#fff', border: 'none', fontSize: 11, padding: '6px 14px'
          }}>
            🖨 Print Report (PDF)
          </button>
        </div>
      </div>

      {/* Vertical Pipeline Flowchart */}
      <div style={{
        background: 'rgba(2,6,23,0.3)', borderRadius: 16, padding: '24px 20px',
        border: '1px solid rgba(255,255,255,0.04)', display: 'flex', flexDirection: 'column',
        alignItems: 'center', marginBottom: 24
      }}>
        <h4 style={{ color: COLORS.cyan, fontSize: 12, margin: '0 0 20px 0', textTransform: 'uppercase', letterSpacing: 1 }}>
          EDA physical design pipeline
        </h4>
        <div style={{ display: 'flex', flexDirection: 'column', width: '100%', maxWidth: 450 }}>
          <PipelineStage step={1} title="Boolean expression" value={result?.expression || 'N/A'} desc="User mathematical input" />
          <PipelineStage step={2} title="Logic minimization" value={result?.winner_name || 'Quine-McCluskey'} desc="Winner algorithm synthesis" />
          <PipelineStage step={3} title="Physical chip mapping" value={winnerMapping.label} desc="Packing gates to 7400 IC slots" />
          <PipelineStage step={4} title="Estimated Delay" value={`${winnerMapping.totalDelay} ns`} desc="Topological critical path timing" />
          <PipelineStage step={5} title="Power dissipation" value={`${winnerMapping.totalPower} mW`} desc="Quiescent & dynamic load draw" />
          <PipelineStage step={6} title="PCB board size" value={`${winnerMapping.estimatedPCBArea.toFixed(1)} cm²`} desc="Estimated copper routing footprint" isLast={true} />
        </div>
      </div>

      {/* Decision Engine Summary Card */}
      <div className="glass-panel" style={{
        margin: 0,
        background: 'linear-gradient(135deg, rgba(168,85,247,0.15), rgba(16,185,129,0.05))',
        border: '1px solid rgba(168,85,247,0.3)',
        display: 'grid', gridTemplateColumns: '1fr 140px', gap: 20, alignItems: 'center'
      }}>
        {/* Recommendation details */}
        <div>
          <h3 style={{ margin: '0 0 10px 0', fontSize: 16, color: COLORS.text }}>
            🤖 EDA Decision Engine Recommendation
          </h3>
          <div style={{ fontSize: 14, fontWeight: 700, color: COLORS.green, marginBottom: 8 }}>
            Recommended Layout: {winnerMapping.label} using {winnerMapping.totalICs} physical ICs
          </div>
          <ul style={{ margin: 0, paddingLeft: 18, fontSize: 12, color: COLORS.textDim, lineHeight: 1.6 }}>
            <li>Provides the absolute lowest manufactured formulated cost of <strong>${winnerMapping.totalCost.toFixed(2)}</strong>.</li>
            <li>Maintains a typical propagation delay of <strong>{winnerMapping.totalDelay} ns</strong>.</li>
            <li>Consumes <strong>{winnerMapping.totalPower} mW</strong> of power.</li>
            <li>Requires a compact PCB routing area of <strong>{winnerMapping.estimatedPCBArea.toFixed(1)} cm²</strong>.</li>
          </ul>
        </div>

        {/* Circular optimization gauge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
          <CircularScoreGauge score={optimizationScore} />
          <span style={{ fontSize: 9, color: COLORS.textDim, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Design Quality
          </span>
        </div>
      </div>
    </div>
  );
};

export default EngineeringReport;
