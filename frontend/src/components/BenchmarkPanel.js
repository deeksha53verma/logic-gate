import React, { useState, useMemo } from 'react';
import { optimizeWithDP } from '../algorithms/dpSubcircuitOptimizer';
import { greedyPackGates } from '../algorithms/greedyICPacker';
import { branchAndBoundICSearch } from '../algorithms/branchAndBoundIC';
import { transformExpression } from '../algorithms/transformAndConquer';
import { backtrackingPlace } from '../algorithms/backtrackingPlacer';
import { analyzeCircuitDAG } from '../algorithms/graphOptimizer';

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
  purple: '#a855f7'
};

const ALG_COLORS = ['#3b82f6', '#f59e0b', '#10b981', '#06b6d4', '#a855f7', '#d946ef'];

/* SVG Execution Time Bar Chart */
const ExecutionTimeChart = ({ results }) => {
  const chartW = 700;
  const chartH = 160;
  const baseY = 130;
  const maxBarH = 100;

  const maxVal = Math.max(...results.map(r => r.time), 0.1);
  const barW = 32;
  const gap = (chartW - 80 - barW * results.length) / (results.length + 1 || 1);

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
                {(maxVal * frac).toFixed(2)} ms
              </text>
            </g>
          );
        })}
        {/* Baseline */}
        <line x1={40} y1={baseY} x2={chartW - 20} y2={baseY} stroke="rgba(255,255,255,0.15)" strokeWidth={1} />

        {/* Bars */}
        {results.map((r, i) => {
          const h = maxVal > 0 ? (r.time / maxVal) * maxBarH : 0;
          const x = 50 + gap + i * (barW + gap);
          const y = baseY - h;

          return (
            <g key={i}>
              <rect x={x} y={y} width={barW} height={h} rx={3} fill={ALG_COLORS[i]} opacity={0.8} />
              
              {/* Value Label */}
              <text x={x + barW / 2} y={y - 6} textAnchor="middle" fill={ALG_COLORS[i]} fontSize={9} fontWeight="bold" fontFamily="monospace">
                {r.time.toFixed(2)}ms
              </text>

              {/* X-axis labels */}
              <text x={x + barW / 2} y={baseY + 16} textAnchor="middle" fill={COLORS.textDim} fontSize={8}>
                {r.shortName}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
};

/* Main Component */
const BenchmarkPanel = ({ result, circuit }) => {
  const [benchmarked, setBenchmarked] = useState(false);
  const [benchResults, setBenchResults] = useState([]);
  const [isRunning, setIsRunning] = useState(false);

  const expression = result?.expression || 'A*B + A*C';

  const runBenchmark = () => {
    setIsRunning(true);
    setBenchmarked(false);

    // Run sequentially with setTimeout to allow browser rendering updates
    setTimeout(() => {
      const results = [];

      // 1. DP Subcircuit
      let t0 = performance.now();
      const dp = optimizeWithDP(circuit);
      let t1 = performance.now();
      results.push({
        name: 'DP Subcircuit Optimizer',
        shortName: 'DP Reuse',
        time: t1 - t0,
        gateSaving: dp.savedGates || 0,
        efficiencyMetric: `${dp.cacheHits} Cache Hits`,
        memoryBytes: JSON.stringify(dp).length,
        task: 'Sub-expression Dedup'
      });

      // 2. Greedy IC Packer
      t0 = performance.now();
      const greedy = greedyPackGates(circuit);
      t1 = performance.now();
      results.push({
        name: 'Greedy IC Packer',
        shortName: 'Greedy Pack',
        time: t1 - t0,
        gateSaving: 0,
        efficiencyMetric: `${greedy.totalICs} ICs packed`,
        memoryBytes: JSON.stringify(greedy).length,
        task: 'Gate Placement'
      });

      // 3. Branch & Bound
      t0 = performance.now();
      const bb = branchAndBoundICSearch(circuit);
      t1 = performance.now();
      results.push({
        name: 'Branch & Bound IC Pack',
        shortName: 'B&B Search',
        time: t1 - t0,
        gateSaving: 0,
        efficiencyMetric: `${bb.nodesPruned} Nodes Pruned`,
        memoryBytes: JSON.stringify(bb).length,
        task: 'Optimal IC Mapping'
      });

      // 4. Transform & Conquer
      t0 = performance.now();
      const transform = transformExpression(expression);
      t1 = performance.now();
      results.push({
        name: 'Transform & Conquer Factoring',
        shortName: 'T&C Factoring',
        time: t1 - t0,
        gateSaving: transform.gateReduction || 0,
        efficiencyMetric: `${transform.gateReduction} Gates saved`,
        memoryBytes: JSON.stringify(transform).length,
        task: 'Algebraic Optimization'
      });

      // 5. Backtracking Placer
      t0 = performance.now();
      const backtrack = backtrackingPlace(circuit);
      t1 = performance.now();
      results.push({
        name: 'Backtracking Placer',
        shortName: 'Backtracking',
        time: t1 - t0,
        gateSaving: 0,
        efficiencyMetric: `${backtrack.totalSolutions} Solns found`,
        memoryBytes: JSON.stringify(backtrack).length,
        task: 'Full Layout Search'
      });

      // 6. DAG Graph Analysis
      t0 = performance.now();
      const graph = analyzeCircuitDAG(circuit);
      t1 = performance.now();
      results.push({
        name: 'Graph Critical Path DAG',
        shortName: 'Graph DAG',
        time: t1 - t0,
        gateSaving: 0,
        efficiencyMetric: `${graph.logicDepth} Logic levels`,
        memoryBytes: JSON.stringify(graph).length,
        task: 'Timing Optimization'
      });

      setBenchResults(results);
      setBenchmarked(true);
      setIsRunning(false);
    }, 100);
  };

  // Find the fastest execution speed
  const fastestAlg = useMemo(() => {
    if (benchResults.length === 0) return null;
    let minTime = Infinity;
    let winner = null;
    benchResults.forEach(r => {
      if (r.time < minTime) {
        minTime = r.time;
        winner = r;
      }
    });
    return winner;
  }, [benchResults]);

  return (
    <div>
      {/* Title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: COLORS.text }}>Course Project Algorithm Benchmark Panel</h2>
        <span className="badge" style={{
          background: 'linear-gradient(135deg, #a855f7, #06b6d4)',
          color: '#fff', fontSize: 11,
        }}>DAA Performance Matrix</span>
      </div>

      {/* Control Card */}
      <div className="glass-panel" style={{
        margin: '0 0 20px 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'linear-gradient(135deg, rgba(168,85,247,0.1), rgba(6,182,212,0.05))',
        border: '1px solid rgba(168,85,247,0.2)'
      }}>
        <div>
          <h3 style={{ margin: '0 0 4px 0', fontSize: 16, color: COLORS.text }}>Execute Performance Benchmarks</h3>
          <p style={{ margin: 0, fontSize: 12, color: COLORS.textDim }}>
            This trigger runs all 6 frontend optimization algorithms concurrently in the browser to profile their time and space complexity.
          </p>
        </div>
        <button
          onClick={runBenchmark}
          disabled={isRunning || !circuit}
          className="btn"
          style={{
            background: isRunning ? 'rgba(255,255,255,0.05)' : 'linear-gradient(90deg, #a855f7, #06b6d4)',
            color: '#fff', border: 'none', padding: '10px 24px', cursor: 'pointer',
            fontWeight: 700, borderRadius: 8, whiteSpace: 'nowrap'
          }}
        >
          {isRunning ? 'Running Profiler...' : '⚡ Run DAA Benchmark'}
        </button>
      </div>

      {/* Winner Announcement Card */}
      {benchmarked && fastestAlg && (
        <div className="glass-panel" style={{
          margin: '0 0 20px 0', background: 'rgba(16,185,129,0.03)', border: `1px solid ${COLORS.green}`
        }}>
          <h4 style={{ color: COLORS.green, margin: '0 0 4px 0', fontSize: 14 }}>
            🏆 SPEED WINNER: {fastestAlg.name}
          </h4>
          <p style={{ margin: 0, fontSize: 12, color: COLORS.textDim }}>
            This algorithm completed in just <strong>{fastestAlg.time.toFixed(3)} ms</strong>, utilizing an estimated 
            heap memory footprint of <strong>{fastestAlg.memoryBytes} bytes</strong> for result storage.
          </p>
        </div>
      )}

      {/* SVG execution time bar chart */}
      {benchmarked && (
        <div style={{ marginBottom: 20 }}>
          <h4 style={{ color: COLORS.cyan, fontSize: 12, margin: '0 0 10px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Execution Speed Comparison (Lower is Better)
          </h4>
          <ExecutionTimeChart results={benchResults} />
        </div>
      )}

      {/* Comparison table */}
      {benchmarked && (
        <div className="glass-panel" style={{ margin: 0 }}>
          <h4 style={{ color: COLORS.cyan, fontSize: 12, margin: '0 0 12px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Algorithmic Performance Comparison Matrix
          </h4>
          <table className="styled-table" style={{ fontSize: '0.85em' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left' }}>Algorithm Name</th>
                <th>Task / Purpose</th>
                <th>Execution Time</th>
                <th>Efficiency Output</th>
                <th>Heap Allocation</th>
                <th>Speed Winner</th>
              </tr>
            </thead>
            <tbody>
              {benchResults.map((r, i) => {
                const isWinner = r.name === fastestAlg?.name;
                return (
                  <tr key={i} style={{
                    background: isWinner ? 'rgba(16,185,129,0.04)' : undefined
                  }}>
                    <td style={{ textAlign: 'left', fontWeight: 600, color: ALG_COLORS[i] }}>{r.name}</td>
                    <td>{r.task}</td>
                    <td style={{ fontFamily: 'monospace', fontWeight: 700 }}>{r.time.toFixed(3)} ms</td>
                    <td>{r.efficiencyMetric}</td>
                    <td style={{ fontFamily: 'monospace' }}>{r.memoryBytes} B</td>
                    <td>
                      {isWinner ? (
                        <span style={{ color: COLORS.green, fontWeight: 700 }}>⚡ FASTEST</span>
                      ) : (
                        <span style={{ color: COLORS.textDim }}>-</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default BenchmarkPanel;
