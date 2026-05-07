import React, { useState, useRef, useCallback } from "react";
import * as htmlToImage from "html-to-image";
import CircuitDiagram from "./CircuitDiagram";
import KMap from "./KMap";
import "./App.css";

function App() {
  const [mode, setMode] = useState("TRUTH_TABLE"); // TRUTH_TABLE or REVERSE
  const [numVars, setNumVars] = useState(2);
  const [table, setTable] = useState([0, 1, 1, 0]);
  const [expressionInput, setExpressionInput] = useState("");
  
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
      const res = await fetch("http://127.0.0.1:5000/generate", {
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
      const res1 = await fetch("http://127.0.0.1:5000/reverse", {
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
      const res2 = await fetch("http://127.0.0.1:5000/generate", {
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
    const count = result.analytics.optimized.gate_count;
    if (count <= 3) return <span className="badge badge-simple">Simple Circuit</span>;
    if (count <= 8) return <span className="badge badge-moderate">Moderate Circuit</span>;
    return <span className="badge badge-complex">Complex Circuit</span>;
  };

  return (
    <div style={{ padding: "30px", maxWidth: "1200px", margin: "0 auto" }}>
      <h1 style={{ textAlign: "center", marginBottom: "40px", fontSize: "2.5em", textShadow: "2px 2px 4px rgba(0,0,0,0.2)" }}>
        ⚡ Logical Logic-Gate Synthesizer V2
      </h1>

      <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
        
        {/* INPUT MODULE */}
        <div className="glass-panel" style={{ flex: "1 1 400px" }}>
          <h2>1. Configuration</h2>
          <div style={{ marginBottom: "15px" }}>
            <label style={{ fontWeight: "bold" }}>Mode: </label>
            <select value={mode} onChange={(e) => { setMode(e.target.value); setResult(null); }} style={{ padding: "5px", marginLeft: "10px", borderRadius: "5px" }}>
              <option value="TRUTH_TABLE">Truth Table to Circuit</option>
              <option value="REVERSE">Expression to Truth Table</option>
            </select>
          </div>

          <div style={{ marginBottom: "15px" }}>
            <label style={{ fontWeight: "bold" }}>Variables: </label>
            <select value={numVars} onChange={handleNumVarsChange} style={{ padding: "5px", marginLeft: "10px", borderRadius: "5px" }}>
              <option value={2}>2 (A, B)</option>
              <option value={3}>3 (A, B, C)</option>
              <option value={4}>4 (A, B, C, D)</option>
            </select>
          </div>

          {mode === "REVERSE" && (
            <div style={{ marginBottom: "15px" }}>
              <label style={{ fontWeight: "bold", display: "block", marginBottom: "5px" }}>Enter Boolean Expression (Sympy syntax: ~, &, |):</label>
              <input 
                type="text" 
                value={expressionInput} 
                onChange={(e) => setExpressionInput(e.target.value)}
                placeholder="e.g. (A & B) | (~C)"
                style={{ width: "100%", padding: "10px", borderRadius: "5px", border: "1px solid #ccc" }}
              />
              <button className="btn btn-secondary" onClick={generateFromExpression} disabled={loading} style={{ marginTop: "10px", width: "100%" }}>
                {loading ? "Generating..." : "Generate Truth Table & Circuit"}
              </button>
            </div>
          )}

          {mode === "TRUTH_TABLE" && (
            <>
              <table className="styled-table">
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
                          style={{ cursor: "pointer", background: out ? "#d4edda" : "#f8d7da", fontWeight: "bold" }}
                          onClick={() => handleTableChange(idx)}
                        >
                          {out}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
              <button className="btn btn-secondary" onClick={generateFromTable} disabled={loading} style={{ width: "100%" }}>
                {loading ? "Synthesizing..." : "Synthesize Circuit"}
              </button>
            </>
          )}

          {/* K-MAP */}
          {result && (
            <div style={{ marginTop: "20px" }}>
              <KMap numVars={numVars} table={table} variables={vars} />
            </div>
          )}

        </div>

        {/* ANALYTICS & EXPRESSIONS */}
        {result && (
          <div className="glass-panel" style={{ flex: "1 1 500px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <h2>2. Analysis & Optimization</h2>
              {getComplexityBadge()}
            </div>
            
            <div style={{ background: "rgba(255,255,255,0.7)", padding: "15px", borderRadius: "8px", marginBottom: "15px" }}>
              <strong>Naive SOP: </strong> <code style={{color: "#d32f2f"}}>{result.original_sop}</code><br/>
              <strong>Optimized: </strong> <code style={{color: "#2e7d32", fontSize: "1.1em"}}>{result.simplified}</code>
            </div>

            <table className="styled-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  <th>Naive</th>
                  <th>Optimized</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td><strong>Gate Count</strong></td>
                  <td>{result.analytics.naive.gate_count}</td>
                  <td style={{ color: "#2e7d32", fontWeight: "bold" }}>{result.analytics.optimized.gate_count}</td>
                </tr>
                <tr>
                  <td><strong>Hardware Cost</strong></td>
                  <td>{result.analytics.naive.cost}</td>
                  <td style={{ color: "#2e7d32", fontWeight: "bold" }}>{result.analytics.optimized.cost}</td>
                </tr>
                <tr>
                  <td><strong>Circuit Delay (ns)</strong></td>
                  <td>{result.analytics.naive.total_delay_ns} ns</td>
                  <td style={{ color: "#2e7d32", fontWeight: "bold" }}>{result.analytics.optimized.total_delay_ns} ns</td>
                </tr>
              </tbody>
            </table>

            <h3 style={{ marginTop: "20px" }}>Step-by-Step Minimization:</h3>
            <ul className="timeline">
              {result.step_by_step.map((step, idx) => (
                <li key={idx}>{step}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* VISUALIZATION & SIMULATION */}
      {result && (
        <div className="glass-panel" style={{ marginTop: "30px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <h2>3. Interactive Circuit Simulation</h2>
            <button className="btn btn-success" onClick={exportCircuit}>📸 Export Image</button>
          </div>
          
          <div style={{ marginBottom: "15px", background: "rgba(255,255,255,0.5)", padding: "10px", borderRadius: "8px", display: "inline-block" }}>
            <strong>Toggle Simulation Inputs: </strong>
            {vars.map(v => (
              <button 
                key={v} 
                onClick={() => handleSimToggle(v)}
                className={`btn ${simulationState[v] ? 'btn-success' : 'btn-danger'}`}
                style={{ margin: "0 5px", padding: "5px 15px" }}
              >
                {v} = {simulationState[v]}
              </button>
            ))}
          </div>

          <div ref={circuitRef} style={{ display: "flex", gap: "20px", flexWrap: "wrap", background: "#fff", padding: "20px", borderRadius: "10px" }}>
            <div style={{ flex: 1, minWidth: "300px" }}>
              <h3 style={{ textAlign: "center", color: "#d32f2f" }}>Naive Circuit</h3>
              <CircuitDiagram circuit={result.naive_circuit} simulationState={simulationState} />
            </div>
            <div style={{ flex: 1, minWidth: "300px" }}>
              <h3 style={{ textAlign: "center", color: "#2e7d32" }}>Optimized Circuit</h3>
              <CircuitDiagram circuit={result.optimized_circuit} simulationState={simulationState} />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

export default App;