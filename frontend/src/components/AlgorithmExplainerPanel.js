import React, { useState, useEffect } from 'react';

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
  blue: '#3b82f6',
  purple: '#a855f7',
};

const PSEUDOCODES = {
  dp: `function DP_OPTIMIZE(circuit):
  cache = {}
  for each node in topological_order:
    hash = computeHash(node.type, children_hashes)
    if hash in cache:
      REUSE existing node  // cache hit
    else:
      cache[hash] = node
  return optimized_circuit`,
  
  greedy: `function GREEDY_PACK(gates):
  sort gates by size descending
  ics = []
  for each gate in gates:
    placed = false
    for each ic in ics:
      if ic.type matches AND ic.hasRoom:
        place gate in ic
        placed = true; break
    if not placed:
      open new IC, place gate
  return ics`,
  
  bb: `function BB_SEARCH(gates, current, best):
  if no gates remaining:
    update best if current < best
    return
  LB = lowerBound(remaining)
  if current + LB >= best:
    PRUNE  // bound exceeded
    return
  for each placement option:
    BB_SEARCH(remaining, current+1, best)`,
  
  transform: `function FACTOR(terms):
  if |terms| <= 1: return terms
  lit = mostFrequentLiteral(terms)
  with = terms containing lit (remove lit)
  without = terms not containing lit  
  return lit·FACTOR(with) + FACTOR(without)`,
  
  backtrack: `function BACKTRACK(gates, assignment, solutions):
  if all gates assigned:
    solutions.add(assignment)
    return
  gate = next unassigned gate
  for each valid IC placement:
    assignment[gate] = placement
    if isValid(assignment):
      BACKTRACK(remaining, assignment, solutions)
    unassign(gate)  // backtrack`,
  
  graph: `function ANALYZE_DAG(circuit):
  adj = buildAdjacencyList(circuit)
  order = topologicalSort(adj)
  for node in order:
    depth[node] = max(depth[parent]+1)
  criticalPath = backtrack from maxDepth
  return {depth, criticalPath, fanout}`
};

const COMPLEXITIES = {
  dp: { time: 'O(V + E)', space: 'O(V)' },
  greedy: { time: 'O(N log N + N × M)', space: 'O(N + M)' },
  bb: { time: 'O(M^N) Worst-case', space: 'O(N)' },
  transform: { time: 'O(T × L)', space: 'O(T × L)' },
  backtrack: { time: 'O(M^N) Explorer', space: 'O(N)' },
  graph: { time: 'O(V + E)', space: 'O(V + E)' }
};

/* Helper for syntax highlighting */
const highlightCode = (code) => {
  const keywords = ['function', 'for', 'each', 'in', 'if', 'else', 'return', 'and', 'or', 'not', 'matches', 'matches AND', 'matches OR', 'matches NOT', 'matches XOR', 'matches NOR'];
  let html = code;
  keywords.forEach(kw => {
    const reg = new RegExp(`\\b${kw}\\b`, 'g');
    html = html.replace(reg, `<span style="color: ${COLORS.cyan}; font-weight: bold;">${kw}</span>`);
  });
  // comment highlighting
  html = html.replace(/(\/\/.*)/g, `<span style="color: #64748b; font-style: italic;">$1</span>`);
  return (
    <pre style={{
      margin: 0, padding: 12, background: 'rgba(2,6,23,0.5)',
      borderRadius: 8, border: '1px solid rgba(255,255,255,0.04)',
      fontFamily: 'monospace', fontSize: 12, color: COLORS.text,
      lineHeight: 1.5, overflowX: 'auto'
    }} dangerouslySetInnerHTML={{ __html: html }} />
  );
};

/* Individual Algorithm Playback Controller */
const AlgorithmSection = ({ title, code, complexity, result, metricsSummary }) => {
  const steps = result?.steps || [];
  const [currentStep, setCurrentStep] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [speed, setSpeed] = useState(1); // 1x, 2x, 0.5x
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isPlaying || steps.length === 0) return;
    
    const intervalTime = (1500 / speed);
    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev >= steps.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalTime);

    return () => clearInterval(timer);
  }, [isPlaying, steps.length, speed]);

  const handlePrev = () => {
    setCurrentStep(prev => Math.max(0, prev - 1));
    setIsPlaying(false);
  };

  const handleNext = () => {
    setCurrentStep(prev => Math.min(steps.length - 1, prev + 1));
    setIsPlaying(false);
  };

  const handlePlayPause = () => {
    if (currentStep >= steps.length - 1) {
      setCurrentStep(0);
    }
    setIsPlaying(!isPlaying);
  };

  return (
    <div className="glass-panel" style={{
      margin: '0 0 16px 0', padding: 16,
      borderColor: isOpen ? COLORS.cyan : COLORS.border,
      transition: 'all 0.3s ease'
    }}>
      {/* Header */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          cursor: 'pointer', userSelect: 'none'
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <span style={{ fontSize: 16 }}>{isOpen ? '▼' : '▶'}</span>
          <h3 style={{ margin: 0, fontSize: 16, color: COLORS.text }}>{title}</h3>
          <span className="badge" style={{ background: 'rgba(59,130,246,0.15)', color: COLORS.blue, fontSize: 10 }}>
            Time: {complexity.time}
          </span>
          <span className="badge" style={{ background: 'rgba(168,85,247,0.15)', color: COLORS.purple, fontSize: 10 }}>
            Space: {complexity.space}
          </span>
        </div>
        {metricsSummary && (
          <div style={{ fontSize: 12, color: COLORS.green, fontWeight: 600 }}>
            {metricsSummary}
          </div>
        )}
      </div>

      {isOpen && (
        <div style={{ marginTop: 16, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          {/* Left Column: Pseudocode & Control Panel */}
          <div>
            <h4 style={{ color: COLORS.cyan, fontSize: 12, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Algorithm Pseudocode
            </h4>
            {highlightCode(code)}

            {/* Playback Controls */}
            {steps.length > 0 && (
              <div style={{
                marginTop: 16, padding: 12, background: 'rgba(2,6,23,0.4)',
                borderRadius: 8, border: '1px solid rgba(255,255,255,0.03)',
                display: 'flex', alignItems: 'center', justifyContent: 'space-between'
              }}>
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={handlePrev} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
                    ⏮ Prev
                  </button>
                  <button onClick={handlePlayPause} className="btn" style={{
                    padding: '6px 16px', fontSize: 12,
                    background: isPlaying ? COLORS.amber : COLORS.green,
                    color: '#fff', border: 'none'
                  }}>
                    {isPlaying ? '⏸ Pause' : '▶ Play'}
                  </button>
                  <button onClick={handleNext} className="btn-secondary" style={{ padding: '6px 12px', fontSize: 12 }}>
                    Next ⏭
                  </button>
                </div>
                
                {/* Speed Slider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span style={{ fontSize: 10, color: COLORS.textDim }}>Speed:</span>
                  <select
                    value={speed}
                    onChange={e => setSpeed(Number(e.target.value))}
                    style={{
                      background: 'rgba(15,23,42,0.8)', color: COLORS.text,
                      border: '1px solid rgba(255,255,255,0.1)', borderRadius: 4,
                      fontSize: 11, padding: '4px 6px'
                    }}
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={1}>1.0x</option>
                    <option value={2}>2.0x</option>
                  </select>
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Execution Log & Output */}
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <h4 style={{ color: COLORS.cyan, fontSize: 12, margin: '0 0 8px 0', textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Step-by-Step Execution Log
            </h4>
            <div style={{
              flex: 1, maxHeight: 220, overflowY: 'auto',
              background: 'rgba(2,6,23,0.3)', borderRadius: 8,
              border: '1px solid rgba(255,255,255,0.03)', padding: 10
            }}>
              {steps.map((s, idx) => {
                const isCurrent = idx === currentStep;
                const isPast = idx < currentStep;
                
                return (
                  <div
                    key={idx}
                    style={{
                      padding: '8px 10px',
                      borderRadius: 6,
                      marginBottom: 6,
                      background: isCurrent ? 'rgba(6,182,212,0.1)' : 'transparent',
                      border: isCurrent ? `1px solid ${COLORS.cyan}88` : '1px solid transparent',
                      boxShadow: isCurrent ? `0 0 8px ${COLORS.cyan}33` : 'none',
                      opacity: isCurrent ? 1 : isPast ? 0.75 : 0.4,
                      transition: 'all 0.25s ease'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 2 }}>
                      <span style={{ fontWeight: 700, color: isCurrent ? COLORS.cyan : isPast ? COLORS.green : COLORS.textDim }}>
                        Step {s.step ?? idx + 1}: {s.action || s.gate}
                      </span>
                      {s.hash && s.hash !== 'N/A' && (
                        <span style={{ fontFamily: 'monospace', color: COLORS.purple }}>{s.hash}</span>
                      )}
                    </div>
                    <div style={{ fontSize: 12, color: COLORS.text }}>
                      {s.result || s.decision}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* Main explainer component */
const AlgorithmExplainerPanel = ({
  dpResult,
  greedyResult,
  bbResult,
  transformResult,
  backtrackResult,
  graphResult
}) => {
  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
        <h2 style={{ margin: 0, fontSize: 20, color: COLORS.text }}>DAA Algorithm Execution Explainer</h2>
        <span className="badge" style={{
          background: 'linear-gradient(135deg, #3b82f6, #a855f7)',
          color: '#fff', fontSize: 11,
        }}>Interactive Playback</span>
      </div>

      <AlgorithmSection
        title="1. Dynamic Programming Subcircuit Reuse"
        code={PSEUDOCODES.dp}
        complexity={COMPLEXITIES.dp}
        result={dpResult}
        metricsSummary={dpResult ? `Hits: ${dpResult.cacheHits} | Saved: ${dpResult.savedGates} gates` : null}
      />

      <AlgorithmSection
        title="2. Greedy IC first-fit Gate Packing"
        code={PSEUDOCODES.greedy}
        complexity={COMPLEXITIES.greedy}
        result={greedyResult}
        metricsSummary={greedyResult ? `Chips: ${greedyResult.totalICs} | Wasted Slots: ${greedyResult.unusedGates}` : null}
      />

      <AlgorithmSection
        title="3. Branch & Bound Space Search"
        code={PSEUDOCODES.bb}
        complexity={COMPLEXITIES.bb}
        result={bbResult}
        metricsSummary={bbResult ? `Pruned: ${bbResult.nodesPruned} | Best Cost: ${bbResult.bestCost}` : null}
      />

      <AlgorithmSection
        title="4. Transform & Conquer algebraic factoring"
        code={PSEUDOCODES.transform}
        complexity={COMPLEXITIES.transform}
        result={transformResult}
        metricsSummary={transformResult ? `Saved: ${transformResult.gateReduction} gates` : null}
      />

      <AlgorithmSection
        title="5. Backtracking full combinations explorer"
        code={PSEUDOCODES.backtrack}
        complexity={COMPLEXITIES.backtrack}
        result={backtrackResult}
        metricsSummary={backtrackResult ? `Solutions found: ${backtrackResult.totalSolutions}` : null}
      />

      <AlgorithmSection
        title="6. Graph Critical Path & topological DAG Analysis"
        code={PSEUDOCODES.graph}
        complexity={COMPLEXITIES.graph}
        result={graphResult}
        metricsSummary={graphResult ? `Depth: ${graphResult.logicDepth} | Delay: ${graphResult.criticalPath?.totalDelay} ns` : null}
      />
    </div>
  );
};

export default AlgorithmExplainerPanel;
