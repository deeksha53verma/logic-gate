import React from 'react';

const KMap = ({ numVars, table, variables }) => {
  // Mapping truth table index to K-Map cell index (Gray Code)
  // For 2 vars: AB
  // For 3 vars: A \ BC
  // For 4 vars: AB \ CD

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
    // Reconstruct index from gray code
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

  return (
    <div style={{ padding: '10px', background: 'rgba(255, 255, 255, 0.7)', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '1.2rem', color: '#333' }}>Karnaugh Map Visualization</h3>
      <div style={{ display: 'flex' }}>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', paddingRight: '10px', fontWeight: 'bold' }}>
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
                  return (
                    <td key={j} style={{ 
                      ...cellStyle, 
                      width: '40px', height: '40px', 
                      background: isOne ? 'rgba(76, 175, 80, 0.3)' : 'transparent',
                      fontWeight: isOne ? 'bold' : 'normal',
                      border: '2px solid #ccc'
                    }}>
                      {val}
                    </td>
                  );
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const cellStyle = {
  border: '1px solid #ccc',
  padding: '8px',
  minWidth: '30px'
};

export default KMap;
