import React, { useState, useRef, useCallback } from "react";
import * as htmlToImage from "html-to-image";
import CircuitDiagram from "./CircuitDiagram";
import KMap from "./KMap";
import ExpressionTree from "./ExpressionTree";
import ComplexityDashboard from "./ComplexityDashboard";
import "./App.css";

const getApiUrl = (endpoint) => {
  if (process.env.NODE_ENV === "production") {
    return `/api/${endpoint}`;
  }
  return `http://127.0.0.1:5000/${endpoint}`;
};

function App() {
  const [mode, setMode] = useState("TRUTH_TABLE"); // TRUTH_TABLE or REVERSE
  const [numVars, setNumVars] = useState(2);
  const [table, setTable] = useState([0, 1, 1, 0]);
  const [expressionInput, setExpressionInput] = useState("");
  const [activeTab, setActiveTab] = useState("DASHBOARD"); // DASHBOARD, CIRCUIT, TREE, KMAP
  
  const [result, setResult] = useState(null);
  const [simulationState, setSimulationState] = useState({});
  const [loading, setLoading] = useState(false);

  const circuitRef = useRef(null);

  const getVarNames = (n) => {
    return Array.from({ length: n }, (_, i) => String.fromCharCode(65 + i));
  };

  const vars = getVarNames(numVars);

  const handleNumVarsChange = (e) => {
    const n = parseInt(e.target.value);
    setNumVars(n);
    setTable(new Array(Math.pow(2, n)).fill(0));
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
      {result && (
        <div className="glass-panel" style={{ marginTop: "30px", padding: "20px" }}>
          
          {/* TABS HEADER */}
          <div className="tabs-header">
            <button 
              className={`tab-btn ${activeTab === "DASHBOARD" ? "active" : ""}`}
              onClick={() => setActiveTab("DASHBOARD")}
            >
              📊 Complexity Dashboard
            </button>
            <button 
              className={`tab-btn ${activeTab === "CIRCUIT" ? "active" : ""}`}
              onClick={() => setActiveTab("CIRCUIT")}
            >
              🔌 Interactive Circuit Sim
            </button>
            <button 
              className={`tab-btn ${activeTab === "TREE" ? "active" : ""}`}
              onClick={() => setActiveTab("TREE")}
            >
              🌳 Expression Tree View
            </button>
            <button 
              className={`tab-btn ${activeTab === "KMAP" ? "active" : ""}`}
              onClick={() => setActiveTab("KMAP")}
            >
              🗺️ Greedy K-Map Steps
            </button>
          </div>

          {/* TAB CONTENT */}
          <div style={{ marginTop: "20px" }}>
            
            {activeTab === "DASHBOARD" && (
              <ComplexityDashboard result={result} />
            )}

            {activeTab === "CIRCUIT" && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "15px" }}>
                  <div>
                    <h3 style={{ margin: 0 }}>Interactive Circuit Simulation (with Critical Path Highlight)</h3>
                    <p style={{ margin: "3px 0 0 0", fontSize: "0.85rem", color: "#666" }}>
                      Toggle inputs to simulate behavior. Glowing orange path shows the critical path (longest delay path).
                    </p>
                  </div>
                  <button className="btn btn-success" onClick={exportCircuit}>📸 Export Schematics</button>
                </div>
                
                <div style={{ marginBottom: "20px", background: "rgba(0,0,0,0.03)", padding: "12px", borderRadius: "8px", display: "inline-block" }}>
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

                <div ref={circuitRef} style={{ display: "flex", gap: "25px", flexWrap: "wrap", background: "#fff", padding: "20px", borderRadius: "10px", border: "1px solid #ddd" }}>
                  <div style={{ flex: 1, minWidth: "300px" }}>
                    <h3 style={{ textAlign: "center", color: "#d32f2f", margin: "0 0 15px 0" }}>Naive SOP Circuit</h3>
                    <CircuitDiagram circuit={result.naive_circuit} simulationState={simulationState} />
                  </div>
                  <div style={{ flex: 1, minWidth: "300px" }}>
                    <h3 style={{ textAlign: "center", color: "#2e7d32", margin: "0 0 15px 0" }}>Heuristic Winner ({result.winner_name})</h3>
                    <CircuitDiagram circuit={result.factored_circuit} simulationState={simulationState} />
                  </div>
                </div>
              </div>
            )}

            {activeTab === "TREE" && (
              <div>
                <h3>Logical Expression AST Structure</h3>
                <p style={{ fontSize: "0.85rem", color: "#666", marginBottom: "15px" }}>
                  A pure expression tree layout. Sub-operations represent subtrees, and leaves represent literal variables.
                </p>
                <ExpressionTree treeData={result.expression_tree} simulationState={simulationState} />
              </div>
            )}

            {activeTab === "KMAP" && (
              <div>
                <KMap 
                  numVars={numVars} 
                  table={table} 
                  variables={vars} 
                  greedyKmapSteps={result.greedy_kmap_steps} 
                />
              </div>
            )}

          </div>

        </div>
      )}

    </div>
  );
}

export default App;