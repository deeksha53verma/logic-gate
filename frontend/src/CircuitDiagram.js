import React from "react";

const CircuitDiagram = ({ circuit }) => {
  if (!circuit) return null;

  return (
    <div style={{ padding: "20px" }}>
      <h3>Visual Circuit</h3>

      <div style={{ display: "flex", alignItems: "center" }}>
        {circuit.map((gate, index) => (
          <React.Fragment key={index}>
            
            {/* Gate Box */}
            <div
              style={{
                border: "2px solid blue",
                borderRadius: "10px",
                margin: "10px",
                padding: "15px",
                minWidth: "150px",
                textAlign: "center",
                background: "#f9f9ff",
                boxShadow: "2px 2px 8px rgba(0,0,0,0.1)",
              }}
            >
              <strong>{gate.type}</strong>

              <div style={{ marginTop: "10px" }}>
                {gate.input && <p>Input: {gate.input}</p>}
                {gate.inputs && <p>Inputs: {gate.inputs.join(", ")}</p>}
              </div>

              <div style={{ marginTop: "10px" }}>
                Output: {gate.output}
              </div>
            </div>

            {/* Arrow */}
            {index !== circuit.length - 1 && (
              <div style={{ fontSize: "30px" }}>→</div>
            )}
          </React.Fragment>
        ))}
      </div>
    </div>
  );
};

export default CircuitDiagram;