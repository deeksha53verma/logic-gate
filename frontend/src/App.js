import React, { useState, useRef, useCallback, useEffect } from "react";
import * as htmlToImage from "html-to-image";
import CircuitDiagram from "./CircuitDiagram";
import KMap from "./KMap";
import ExpressionTree from "./ExpressionTree";
import DragDropCircuit from "./DragDropCircuit";
import "./App.css";

// Engines & Algorithms
import { generateAllImplementations } from "./mapping-engine/icMappingEngine";
import { compareCosts } from "./cost-engine/costEngine";
import { calculateTransparentScore } from "./heuristics/heuristicScorer";
import { optimizeWithDP } from "./algorithms/dpSubcircuitOptimizer";
import { greedyPackGates } from "./algorithms/greedyICPacker";
import { branchAndBoundICSearch } from "./algorithms/branchAndBoundIC";
import { transformExpression } from "./algorithms/transformAndConquer";
import { backtrackingPlace } from "./algorithms/backtrackingPlacer";
import { analyzeCircuitDAG } from "./algorithms/graphOptimizer";
import { optimizePlacement } from "./algorithms/placementOptimizer";

// React UI Panels
import ICLibraryPanel from "./components/ICLibraryPanel";
import ICMappingPanel from "./components/ICMappingPanel";
import ImplementationComparison from "./components/ImplementationComparison";
import CostAnalysisPanel from "./components/CostAnalysisPanel";
import HeuristicBreakdownPanel from "./components/HeuristicBreakdownPanel";
import AlgorithmExplainerPanel from "./components/AlgorithmExplainerPanel";
import PCBPlacementPanel from "./components/PCBPlacementPanel";
import PropagationDelayPanel from "./components/PropagationDelayPanel";
import FanInFanOutPanel from "./components/FanInFanOutPanel";
import PowerEstimationPanel from "./components/PowerEstimationPanel";
import PCBResourcePanel from "./components/PCBResourcePanel";
import BenchmarkPanel from "./components/BenchmarkPanel";
import EngineeringReport from "./components/EngineeringReport";
import EnhancedDashboard from "./components/EnhancedDashboard";

const getApiUrl = (endpoint) => {
  if (process.env.NODE_ENV === "production") {
    return `/_/backend/${endpoint}`;
  }
  return `http://127.0.0.1:5000/${endpoint}`;
};

function App() {
  const [mode, setMode] = useState("TRUTH_TABLE"); // TRUTH_TABLE or REVERSE
  const [numVars, setNumVars] = useState(2);
  const [table, setTable] = useState([0, 1, 1, 0]);
  const [expressionInput, setExpressionInput] = useState("");
  const [activeTab, setActiveTab] = useState("SANDBOX"); // SANDBOX, DASHBOARD, CIRCUIT, TREE, KMAP
  
  const [result, setResult] = useState(null);
  const [simulationState, setSimulationState] = useState({});
  const [loading, setLoading] = useState(false);

  const circuitRef = useRef(null);

  // EDA Engine State variables
  const [implementations, setImplementations] = useState([]);
  const [costs, setCosts] = useState([]);
  const [heuristicScores, setHeuristicScores] = useState([]);
  const [graphResult, setGraphResult] = useState(null);
  const [placementResult, setPlacementResult] = useState(null);

  // Playback Step States for DAA explainer
  const [dpResult, setDpResult] = useState(null);
  const [greedyResult, setGreedyResult] = useState(null);
  const [bbResult, setBbResult] = useState(null);
  const [transformResult, setTransformResult] = useState(null);
  const [backtrackResult, setBacktrackResult] = useState(null);

  // EDA simulation engine effect hook
  useEffect(() => {
    if (!result || !result.factored_circuit) return;

    try {
      const circuit = result.factored_circuit;

      // 1. Map gates to physical 7400 ICs
      const impls = generateAllImplementations(circuit);
      setImplementations(impls);

      // 2. Compute cost breakdowns
      const costComps = compareCosts(impls);
      setCosts(costComps);

      // 3. Analyze graph DAG structures
      const graph = analyzeCircuitDAG(circuit);
      setGraphResult(graph);

      // 4. Place IC packages on simulated PCB board
      const bestImpl = impls.find(i => i.label === 'Mixed Optimal') || impls[0];
      if (bestImpl && bestImpl.ics) {
        const placement = optimizePlacement(bestImpl.ics);
        setPlacementResult(placement);
      }

      // 5. Run DAA algorithms to extract step-by-step logs
      const dp = optimizeWithDP(circuit);
      setDpResult(dp);

      const greedy = greedyPackGates(circuit);
      setGreedyResult(greedy);

      const bb = branchAndBoundICSearch(circuit);
      setBbResult(bb);

      const transform = transformExpression(result.expression || 'A*B + A*C');
      setTransformResult(transform);

      const backtrack = backtrackingPlace(circuit);
      setBacktrackResult(backtrack);

      // 6. Multi-criteria heuristic scoring
      const candidates = impls.map(impl => {
        return {
          name: impl.label,
          gateCount: impl.totalGates,
          delay: impl.totalDelay,
          icCost: impl.chipCost,
          power: impl.totalPower,
          routingComplexity: impl.wiringComplexity
        };
      });
      const scoredCandidates = calculateTransparentScore(candidates);
      setHeuristicScores(scoredCandidates);

    } catch (err) {
      console.error("Error executing simulation engines:", err);
    }
  }, [result]);

  const getVarNames = (n) => {
    return Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));
  };

  const vars = getVarNames(numVars);

  const getDefaultTable = (n) => {
    if (n === 2) return [0, 1, 1, 0];
    if (n === 3) return [0, 1, 1, 0, 1, 0, 0, 1];
    if (n === 4) return [0, 1, 1, 0, 1, 0, 0, 1, 1, 0, 0, 1, 0, 1, 1, 0];
    return new Array(Math.pow(2, n)).fill(0);
  };

  const handleNumVarsChange = (e) => {
    const n = parseInt(e.target.value);
    setNumVars(n);
    setTable(getDefaultTable(n));
    setResult(null);
    setSimulationState({});
  };

  const handleTableChange = (index) => {
    const newTable = [...table];
    newTable[index] = newTable[index] === 0 ? 1 : 0;
    setTable(newTable);
  };

  const handleSimToggle = (v) => {
    setSimulationState(prev => ({
      ...prev,
      [v]: prev[v] === 1 ? 0 : 1
    }));
  };

  const generateFromTable = async () => {
    setLoading(true);
    try {
      const res = await fetch(getApiUrl("generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variables: vars, table: table }),
      });
      const data = await res.json();
      setResult(data);
      setActiveTab("DASHBOARD");
      
      const initState = {};
      vars.forEach(v => initState[v] = 0);
      setSimulationState(initState);
    } catch (err) {
      alert("Backend not reachable!");
    }
    setLoading(false);
  };

  const generateFromExpression = async () => {
    setLoading(true);
    try {
      const res1 = await fetch(getApiUrl("reverse"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ expression: expressionInput, variables: vars }),
      });
      const data1 = await res1.json();
      
      if (data1.error) {
        alert("Invalid Expression: " + data1.error);
        setLoading(false);
        return;
      }

      setTable(data1.table);
      
      // Auto-generate circuit
      const res2 = await fetch(getApiUrl("generate"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ variables: vars, table: data1.table }),
      });
      const data2 = await res2.json();
      setResult(data2);
      setActiveTab("DASHBOARD");
      
      const initState = {};
      vars.forEach(v => initState[v] = 0);
      setSimulationState(initState);
    } catch (err) {
      alert("Backend not reachable!");
    }
    setLoading(false);
  };

  const exportCircuit = useCallback(() => {
    if (circuitRef.current === null) return;
    htmlToImage.toPng(circuitRef.current, { backgroundColor: '#fff' })
      .then((dataUrl) => {
        const link = document.createElement('a');
        link.download = 'circuit.png';
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => console.log(err));
  }, [circuitRef]);

  const getComplexityBadge = () => {
    if (!result) return null;
    const count = result.analytics.winner.gate_count;
    if (count <= 2) return <span className="badge badge-simple">Ultra Simple</span>;
    if (count <= 5) return <span className="badge badge-moderate">Optimized</span>;
    return <span className="badge badge-complex">Highly factored</span>;
  };

  return (
    <div style={{ padding: "30px", maxWidth: "1280px", margin: "0 auto", fontFamily: "'Outfit', 'Inter', sans-serif" }}>
      
      {/* HEADER SECTION */}
      <div style={{ textAlign: "center", marginBottom: "35px" }}>
        <h1 style={{ margin: "0 0 10px 0", fontSize: "2.8em", fontWeight: "800", background: "linear-gradient(90deg, #1565c0 0%, #009688 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
          Logic Gate Synthesizer
        </h1>
        <p style={{ margin: 0, fontSize: "1.1rem", color: "#666" }}>
          Demonstrating Transform & Conquer, Greedy, Dynamic Programming, and Branch & Bound in Logic Design
        </p>
      </div>

      <div style={{ display: "flex", gap: "25px", flexWrap: "wrap", alignItems: "flex-start" }}>
        
        {/* LEFT COLUMN: CONFIGURATION MODULE */}
        <div className="glass-panel" style={{ flex: "1 1 380px" }}>
          <h2>⚙️ 1. Configuration</h2>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ fontWeight: "bold", fontSize: "0.9rem", color: "#555" }}>Input Method: </label>
            <select value={mode} onChange={(e) => { setMode(e.target.value); setResult(null); }} style={{ padding: "8px 12px", marginLeft: "10px", borderRadius: "8px", border: "1px solid #ccc", width: "calc(100% - 110px)", boxSizing: "border-box" }}>
              <option value="TRUTH_TABLE">Truth Table Input</option>
              <option value="REVERSE">Boolean Expression Input</option>
            </select>
          </div>

          <div style={{ marginBottom: "20px" }}>
            <label style={{ fontWeight: "bold", fontSize: "0.9rem", color: "#555" }}>Variables: </label>
            <select value={numVars} onChange={handleNumVarsChange} style={{ padding: "8px 12px", marginLeft: "10px", borderRadius: "8px", border: "1px solid #ccc", width: "calc(100% - 110px)", boxSizing: "border-box" }}>
              <option value={2}>2 variables (A, B)</option>
              <option value={3}>3 variables (A, B, C)</option>
              <option value={4}>4 variables (A, B, C, D)</option>
            </select>
          </div>

          {mode === "REVERSE" && (
            <div style={{ marginBottom: "15px" }}>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "8px", fontSize: "0.9rem", color: "#555" }}>
                Enter Boolean Expression (Sympy syntax: ~, &, |):
              </label>
              <input 
                type="text" 
                value={expressionInput} 
                onChange={(e) => setExpressionInput(e.target.value)}
                placeholder="e.g. (A & B) | (~A & C)"
                style={{ width: "100%", padding: "12px", borderRadius: "8px", border: "1px solid #ccc", boxSizing: "border-box" }}
              />
              <button className="btn btn-secondary" onClick={generateFromExpression} disabled={loading} style={{ marginTop: "12px", width: "100%", padding: "12px" }}>
                {loading ? "Generating..." : "Generate Truth Table & Run Solvers"}
              </button>
            </div>
          )}

          {mode === "TRUTH_TABLE" && (
            <>
              <div style={{ maxHeight: "250px", overflowY: "auto", border: "1px solid #eee", borderRadius: "8px", marginBottom: "15px" }}>
                <table className="styled-table" style={{ margin: 0, width: "100%" }}>
                  <thead>
                    <tr>
                      {vars.map(v => <th key={v}>{v}</th>)}
                      <th>Output (Click)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {table.map((out, idx) => {
                      const bin = idx.toString(2).padStart(numVars, '0');
                      return (
                        <tr key={idx}>
                          {bin.split('').map((b, i) => <td key={i}>{b}</td>)}
                          <td 
                            style={{ cursor: "pointer", background: out ? "rgba(76, 175, 80, 0.15)" : "rgba(244, 67, 54, 0.15)", fontWeight: "bold", textAlign: "center" }}
                            onClick={() => handleTableChange(idx)}
                          >
                            {out}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              <button className="btn btn-secondary" onClick={generateFromTable} disabled={loading} style={{ width: "100%", padding: "12px" }}>
                {loading ? "Optimizing Circuits..." : "Run Optimization Engines"}
              </button>
            </>
          )}

        </div>

        {/* RIGHT COLUMN: HEURISTIC SUMMARY MODULE */}
        <div className="glass-panel" style={{ flex: "1.5 1 500px", minHeight: "330px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
            <h2>🧠 2. Heuristic Optimization Winner</h2>
            {getComplexityBadge()}
          </div>
          
          {result ? (
            <div style={{ display: "flex", flexDirection: "column", gap: "15px" }}>
              <div style={{ background: "rgba(255,255,255,0.75)", padding: "18px", borderRadius: "10px", border: "1px solid rgba(0,0,0,0.05)" }}>
                <div style={{ marginBottom: "8px" }}>
                  <strong style={{ color: "#d32f2f" }}>Naive SOP: </strong> 
                  <code style={{ fontSize: "1.05rem" }}>{result.original_sop}</code>
                </div>
                <div style={{ marginBottom: "8px" }}>
                  <strong style={{ color: "#1976d2" }}>Optimized SOP: </strong> 
                  <code style={{ fontSize: "1.05rem" }}>{result.simplified}</code>
                </div>
                <div style={{ borderTop: "1px solid #ddd", paddingTop: "8px", marginTop: "8px" }}>
                  <strong style={{ color: "#2e7d32" }}>Heuristic Choice ({result.winner_name}): </strong> 
                  <code style={{ fontSize: "1.15rem", fontWeight: "bold" }}>{result.winner_expr}</code>
                </div>
              </div>

              <div style={{ padding: "12px 15px", background: "rgba(76, 175, 80, 0.1)", borderRadius: "8px", borderLeft: "4px solid #4caf50", fontSize: "0.95rem" }}>
                <strong>Decision Reasoning:</strong> {result.heuristic_report?.reason}
              </div>

              <div>
                <h3 style={{ margin: "10px 0 8px 0" }}>Step-by-Step Logic Optimization Flow:</h3>
                <ul className="timeline">
                  {result.step_by_step.map((step, idx) => (
                    <li key={idx} style={{ fontSize: "0.9rem" }}>{step}</li>
                  ))}
                </ul>
              </div>
            </div>
          ) : (
            <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", border: "2px dashed #ccc", borderRadius: "10px", color: "#888" }}>
              Run the solvers to view the heuristic winner details.
            </div>
          )}
        </div>

      </div>

      {/* BOTTOM TABBED AREA: COMPREHENSIVE VIEWERS */}
      <div className="glass-panel" style={{ marginTop: "30px", padding: "20px" }}>
           {/* TABS HEADER */}
        <div style={{ marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "12px" }}>
          <div style={{ fontSize: "11px", color: "#06b6d4", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", fontWeight: 700 }}>
            ⚡ 1. Core Synthesizer & AST
          </div>
          <div className="tabs-header" style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
            <button className={`tab-btn ${activeTab === "SANDBOX" ? "active" : ""}`} onClick={() => setActiveTab("SANDBOX")}>
              🛠️ Drag & Drop Sandbox
            </button>
            <button className={`tab-btn ${activeTab === "DASHBOARD" ? "active" : ""}`} onClick={() => { if (result) setActiveTab("DASHBOARD"); }} style={{ opacity: result ? 1 : 0.5, cursor: result ? "pointer" : "not-allowed" }}>
              📊 Complexity Dashboard
            </button>
            <button className={`tab-btn ${activeTab === "CIRCUIT" ? "active" : ""}`} onClick={() => { if (result) setActiveTab("CIRCUIT"); }} style={{ opacity: result ? 1 : 0.5, cursor: result ? "pointer" : "not-allowed" }}>
              🔌 Auto-Generated Circuit
            </button>
            <button className={`tab-btn ${activeTab === "TREE" ? "active" : ""}`} onClick={() => { if (result) setActiveTab("TREE"); }} style={{ opacity: result ? 1 : 0.5, cursor: result ? "pointer" : "not-allowed" }}>
              🌳 Expression Tree View
            </button>
            <button className={`tab-btn ${activeTab === "KMAP" ? "active" : ""}`} onClick={() => { if (result) setActiveTab("KMAP"); }} style={{ opacity: result ? 1 : 0.5, cursor: result ? "pointer" : "not-allowed" }}>
              🗺️ Greedy K-Map Steps
            </button>
          </div>

          <div style={{ fontSize: "11px", color: "#a855f7", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", fontWeight: 700 }}>
            🎛️ 2. IC Mapping & Cost Optimization
          </div>
          <div className="tabs-header" style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
            <button className={`tab-btn ${activeTab === "LIBRARY" ? "active" : ""}`} onClick={() => setActiveTab("LIBRARY")}>
              📚 IC Library (7400 Series)
            </button>
            <button className={`tab-btn ${activeTab === "MAPPING" ? "active" : ""}`} onClick={() => { if (result) setActiveTab("MAPPING"); }} style={{ opacity: result ? 1 : 0.5, cursor: result ? "pointer" : "not-allowed" }}>
              📦 Physical IC Mapping
            </button>
            <button className={`tab-btn ${activeTab === "COMPARISON" ? "active" : ""}`} onClick={() => { if (result) setActiveTab("COMPARISON"); }} style={{ opacity: result ? 1 : 0.5, cursor: result ? "pointer" : "not-allowed" }}>
              📊 Strategy Comparison
            </button>
            <button className={`tab-btn ${activeTab === "COST" ? "active" : ""}`} onClick={() => { if (result) setActiveTab("COST"); }} style={{ opacity: result ? 1 : 0.5, cursor: result ? "pointer" : "not-allowed" }}>
              💰 Cost Breakdown
            </button>
            <button className={`tab-btn ${activeTab === "HEURISTIC" ? "active" : ""}`} onClick={() => { if (result) setActiveTab("HEURISTIC"); }} style={{ opacity: result ? 1 : 0.5, cursor: result ? "pointer" : "not-allowed" }}>
              🧠 Decision Scorecard
            </button>
          </div>

          <div style={{ fontSize: "11px", color: "#10b981", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", fontWeight: 700 }}>
            📐 3. Timing, Power & PCB Layout
          </div>
          <div className="tabs-header" style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginBottom: "14px" }}>
            <button className={`tab-btn ${activeTab === "ALGORITHMS" ? "active" : ""}`} onClick={() => { if (result) setActiveTab("ALGORITHMS"); }} style={{ opacity: result ? 1 : 0.5, cursor: result ? "pointer" : "not-allowed" }}>
              🎛️ Playback Explainer
            </button>
            <button className={`tab-btn ${activeTab === "TIMING" ? "active" : ""}`} onClick={() => { if (result) setActiveTab("TIMING"); }} style={{ opacity: result ? 1 : 0.5, cursor: result ? "pointer" : "not-allowed" }}>
              ⚡ Timing & Critical Path
            </button>
            <button className={`tab-btn ${activeTab === "LOAD" ? "active" : ""}`} onClick={() => { if (result) setActiveTab("LOAD"); }} style={{ opacity: result ? 1 : 0.5, cursor: result ? "pointer" : "not-allowed" }}>
              📈 Fan-In / Fan-Out
            </button>
            <button className={`tab-btn ${activeTab === "PCB" ? "active" : ""}`} onClick={() => { if (result) setActiveTab("PCB"); }} style={{ opacity: result ? 1 : 0.5, cursor: result ? "pointer" : "not-allowed" }}>
              📐 PCB Placement Sim
            </button>
            <button className={`tab-btn ${activeTab === "POWER" ? "active" : ""}`} onClick={() => { if (result) setActiveTab("POWER"); }} style={{ opacity: result ? 1 : 0.5, cursor: result ? "pointer" : "not-allowed" }}>
              🔋 Power Estimation
            </button>
            <button className={`tab-btn ${activeTab === "RESOURCES" ? "active" : ""}`} onClick={() => { if (result) setActiveTab("RESOURCES"); }} style={{ opacity: result ? 1 : 0.5, cursor: result ? "pointer" : "not-allowed" }}>
              🔌 PCB Resources
            </button>
          </div>

          <div style={{ fontSize: "11px", color: "#f59e0b", textTransform: "uppercase", letterSpacing: "1px", marginBottom: "6px", fontWeight: 700 }}>
            🏆 4. Performance Profiler & Report
          </div>
          <div className="tabs-header" style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
            <button className={`tab-btn ${activeTab === "BENCHMARK" ? "active" : ""}`} onClick={() => { if (result) setActiveTab("BENCHMARK"); }} style={{ opacity: result ? 1 : 0.5, cursor: result ? "pointer" : "not-allowed" }}>
              ⏱️ DAA Benchmarks
            </button>
            <button className={`tab-btn ${activeTab === "REPORT" ? "active" : ""}`} onClick={() => { if (result) setActiveTab("REPORT"); }} style={{ opacity: result ? 1 : 0.5, cursor: result ? "pointer" : "not-allowed" }}>
              📋 EDA Engineering Report
            </button>
          </div>
        </div>

        {/* TAB CONTENT */}
        <div style={{ marginTop: "20px" }}>
          
          {activeTab === "SANDBOX" && (
            <DragDropCircuit />
          )}

          {activeTab === "DASHBOARD" && (
            result ? (
              <EnhancedDashboard
                result={result}
                implementations={implementations}
                costs={costs}
                heuristicScores={heuristicScores}
              />
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                Please configure and run the optimization engine above to unlock the complexity dashboard.
              </div>
            )
          )}

          {activeTab === "CIRCUIT" && (
            result ? (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Interactive Circuit Simulation (with Critical Path Highlight)</h3>
                    <p style={{ margin: "3px 0 0 0", fontSize: "0.85rem", color: "#94a3b8" }}>
                      Toggle inputs to simulate behavior. Glowing orange path shows the critical path (longest delay path).
                    </p>
                  </div>
                  <button className="btn btn-success" onClick={exportCircuit}>📸 Export Schematics</button>
                </div>
                
                <div style={{ marginBottom: "20px", background: "rgba(255,255,255,0.03)", padding: "12px", borderRadius: "8px", display: "inline-block", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <strong>Toggle Inputs: </strong>
                  {vars.map(v => (
                    <button 
                      key={v} 
                      onClick={() => handleSimToggle(v)}
                      className={`btn ${simulationState[v] ? 'btn-success' : 'btn-danger'}`}
                      style={{ margin: "0 6px", padding: "6px 16px", borderRadius: "6px", fontWeight: "bold" }}
                    >
                      {v} = {simulationState[v]}
                    </button>
                  ))}
                </div>

                <div ref={circuitRef} style={{ display: "flex", gap: "25px", flexWrap: "wrap", background: "#020617", padding: "20px", borderRadius: "10px", border: "1px solid rgba(255,255,255,0.1)" }}>
                  <div style={{ flex: 1, minWidth: "300px" }}>
                    <h3 style={{ textAlign: "center", color: "#f43f5e", margin: "0 0 15px 0" }}>Naive SOP Circuit</h3>
                    <CircuitDiagram circuit={result.naive_circuit} simulationState={simulationState} />
                  </div>
                  <div style={{ flex: 1, minWidth: "300px" }}>
                    <h3 style={{ textAlign: "center", color: "#10b981", margin: "0 0 15px 0" }}>Heuristic Winner ({result.winner_name})</h3>
                    <CircuitDiagram circuit={result.factored_circuit} simulationState={simulationState} />
                  </div>
                </div>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                Please configure and run the optimization engine above to auto-generate interactive circuits.
              </div>
            )
          )}

          {activeTab === "TREE" && (
            result ? (
              <div>
                <h3>Logical Expression AST Structure</h3>
                <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "15px" }}>
                  A pure expression tree layout. Sub-operations represent subtrees, and leaves represent literal variables.
                </p>
                <ExpressionTree treeData={result.expression_tree} simulationState={simulationState} />
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                Please configure and run the optimization engine above to view the expression tree structure.
              </div>
            )
          )}

          {activeTab === "KMAP" && (
            result ? (
              <div>
                <KMap 
                  numVars={numVars} 
                  table={table} 
                  variables={vars} 
                  greedyKmapSteps={result.greedy_kmap_steps} 
                />
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                Please configure and run the optimization engine above to view greedy K-Map groupings.
              </div>
            )
          )}

          {activeTab === "LIBRARY" && (
            <ICLibraryPanel />
          )}

          {activeTab === "MAPPING" && (
            result ? (
              <ICMappingPanel circuit={result.factored_circuit} result={result} />
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                Please configure and run the optimization engine above to view physical IC mappings.
              </div>
            )
          )}

          {activeTab === "COMPARISON" && (
            result ? (
              <ImplementationComparison implementations={implementations} />
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                Please configure and run the optimization engine above to view implementation strategy comparisons.
              </div>
            )
          )}

          {activeTab === "COST" && (
            result ? (
              <CostAnalysisPanel implementations={implementations} />
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                Please configure and run the optimization engine above to view manufacturing cost breakdowns.
              </div>
            )
          )}

          {activeTab === "HEURISTIC" && (
            result ? (
              <HeuristicBreakdownPanel candidates={heuristicScores} />
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                Please configure and run the optimization engine above to view heuristic ranking details.
              </div>
            )
          )}

          {activeTab === "ALGORITHMS" && (
            result ? (
              <AlgorithmExplainerPanel
                dpResult={dpResult}
                greedyResult={greedyResult}
                bbResult={bbResult}
                transformResult={transformResult}
                backtrackResult={backtrackResult}
                graphResult={graphResult}
              />
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                Please configure and run the optimization engine above to view algorithm execution playbacks.
              </div>
            )
          )}

          {activeTab === "TIMING" && (
            result ? (
              <PropagationDelayPanel graphResult={graphResult} />
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                Please configure and run the optimization engine above to view critical path delays.
              </div>
            )
          )}

          {activeTab === "LOAD" && (
            graphResult ? (
              <FanInFanOutPanel fanAnalysis={graphResult.fanAnalysis} />
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                Please configure and run the optimization engine above to view logic node fan-out loads.
              </div>
            )
          )}

          {activeTab === "PCB" && (
            result ? (
              <PCBPlacementPanel placementResult={placementResult} />
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                Please configure and run the optimization engine above to view simulated PCB chip placement.
              </div>
            )
          )}

          {activeTab === "POWER" && (
            result ? (
              <PowerEstimationPanel implementations={implementations} />
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                Please configure and run the optimization engine above to view power dissipation estimates.
              </div>
            )
          )}

          {activeTab === "RESOURCES" && (
            result ? (
              <PCBResourcePanel implementations={implementations} />
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                Please configure and run the optimization engine above to view PCB resource estimates.
              </div>
            )
          )}

          {activeTab === "BENCHMARK" && (
            result ? (
              <BenchmarkPanel result={result} circuit={result.factored_circuit} />
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                Please configure and run the optimization engine above to unlock the performance benchmark profiler.
              </div>
            )
          )}

          {activeTab === "REPORT" && (
            result ? (
              <EngineeringReport
                result={result}
                implementations={implementations}
                costs={costs}
                heuristicScores={heuristicScores}
                graphResult={graphResult}
              />
            ) : (
              <div style={{ textAlign: "center", padding: "40px", color: "#94a3b8" }}>
                Please configure and run the optimization engine above to view the complete EDA engineering report.
              </div>
            )
          )}

        </div>
      </div>
    </div>
  );
}

export default App;