import React, { useState } from 'react';

const KMap = ({ numVars, table, variables, greedyKmapSteps = [] }) => {
  const [activeStep, setActiveStep] = useState(null);

  const getGrayCode2 = () => [0, 1];
  const getGrayCode4 = () => [0, 1, 3, 2];

  let rows, cols, rowLabels, colLabels, rowVar, colVar;

  if (numVars === 2) {
    rows = getGrayCode2();
    cols = getGrayCode2();
    rowLabels = ['0', '1'];
    colLabels = ['0', '1'];
    rowVar = variables[0];
    colVar = variables[1];
  } else if (numVars === 3) {
    rows = getGrayCode2();
    cols = getGrayCode4();
    rowLabels = ['0', '1'];
    colLabels = ['00', '01', '11', '10'];
    rowVar = variables[0];
    colVar = variables[1] + variables[2];
  } else if (numVars === 4) {
    rows = getGrayCode4();
    cols = getGrayCode4();
    rowLabels = ['00', '01', '11', '10'];
    colLabels = ['00', '01', '11', '10'];
    rowVar = variables[0] + variables[1];
    colVar = variables[2] + variables[3];
  } else {
    return <p>K-Map visualization only supports 2-4 variables.</p>;
  }

  const getVal = (r, c) => {
    let binStr = "";
    if (numVars === 2) {
      binStr = r.toString(2) + c.toString(2);
    } else if (numVars === 3) {
      binStr = r.toString(2) + c.toString(2).padStart(2, '0');
    } else {
      binStr = r.toString(2).padStart(2, '0') + c.toString(2).padStart(2, '0');
    }
    const idx = parseInt(binStr, 2);
    return table[idx];
  };

  // Check if a cell coordinate is in the active highlighted group
  const isCellInActiveGroup = (r_idx, c_idx) => {
    if (activeStep === null || !greedyKmapSteps[activeStep]) return false;
    const cells = greedyKmapSteps[activeStep].cells;
    // Map r and c values back to grid row/col index
    // Note that in getVal we map r = rows[i], c = cols[j]
    // The cells in greedy_kmap have "r" as the row index i and "c" as the col index j
    return cells.some(cell => cell.r === r_idx && cell.c === c_idx);
  };

  const getStepColor = (idx) => {
    const colors = ["#ff5722", "#4caf50", "#9c27b0", "#ffeb3b", "#00bcd4", "#e91e63"];
    return colors[idx % colors.length];
  };

  return (
    <div style={{ padding: '15px', background: 'rgba(255, 255, 255, 0.8)', borderRadius: '12px', boxShadow: '0 4px 10px rgba(0,0,0,0.1)', border: "1px solid rgba(255,255,255,0.4)" }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '1.2rem', color: '#333', fontWeight: "bold" }}>
        🟩 Greedy K-Map Simplification Visualizer
      </h3>
      
      <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
        
        {/* K-MAP GRID */}
        <div style={{ flex: "1 1 auto", display: "flex", flexDirection: "column", alignItems: "center" }}>
          <div style={{ display: 'flex', position: "relative" }}>
            <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingRight: '15px', fontWeight: 'bold', fontSize: "0.95rem" }}>
              {rowVar} \ {colVar}
            </div>
            <table style={{ borderCollapse: 'collapse', textAlign: 'center' }}>
              <thead>
                <tr>
                  <th style={cellStyle}></th>
                  {colLabels.map(lbl => <th key={lbl} style={cellStyle}>{lbl}</th>)}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={i}>
                    <td style={{ ...cellStyle, fontWeight: 'bold' }}>{rowLabels[i]}</td>
                    {cols.map((c, j) => {
                      const val = getVal(r, c);
                      const isOne = val === 1;
                      const active = isCellInActiveGroup(i, j);
                      
                      return (
                        <td key={j} style={{ 
                          ...cellStyle, 
                          width: '45px', height: '45px', 
                          background: active 
                            ? 'rgba(255, 87, 34, 0.25)' 
                            : isOne ? 'rgba(76, 175, 80, 0.12)' : 'transparent',
                          fontWeight: isOne ? 'bold' : 'normal',
                          border: active 
                            ? '3px solid #ff5722' 
                            : '2px solid #ccc',
                          boxShadow: active ? '0 0 10px rgba(255, 87, 34, 0.6)' : 'none',
                          transition: 'all 0.25s ease',
                          position: 'relative'
                        }}>
                          {val}
                          {active && (
                            <span style={{
                              position: "absolute",
                              top: "2px",
                              right: "2px",
                              width: "6px",
                              height: "6px",
                              borderRadius: "50%",
                              background: "#ff5722"
                            }}/>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* GREEDY STEPS LIST */}
        <div style={{ flex: "1 1 250px", borderLeft: "2px solid #eee", paddingLeft: "15px" }}>
          <h4 style={{ margin: "0 0 10px 0", fontSize: "0.95rem", color: "#666" }}>
            Greedy Selection Steps (Hover to Highlight):
          </h4>
          {greedyKmapSteps.length === 0 ? (
            <p style={{ fontSize: "0.85rem", color: "#888", fontStyle: "italic" }}>No active groupings required.</p>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxHeight: "180px", overflowY: "auto", paddingRight: "5px" }}>
              {greedyKmapSteps.map((step, idx) => {
                const isHovered = activeStep === idx;
                return (
                  <div 
                    key={idx}
                    onMouseEnter={() => setActiveStep(idx)}
                    onMouseLeave={() => setActiveStep(null)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "6px",
                      background: isHovered ? "rgba(255, 87, 34, 0.08)" : "#f5f5f5",
                      borderLeft: `4px solid ${getStepColor(idx)}`,
                      cursor: "pointer",
                      fontSize: "0.85rem",
                      transition: "all 0.2s ease",
                      boxShadow: isHovered ? "0 2px 4px rgba(0,0,0,0.05)" : "none"
                    }}
                  >
                    <strong>Step {idx + 1}:</strong> Group of {step.size} cells <br/>
                    Term: <code style={{ color: "#d32f2f", fontWeight: "bold" }}>{step.term}</code>
                  </div>
                );
              })}
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

const cellStyle = {
  border: '1px solid #ccc',
  padding: '6px',
  minWidth: '35px',
  fontSize: '0.9rem'
};

export default KMap;

