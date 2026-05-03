import { useState } from "react";
import CircuitDiagram from "./CircuitDiagram";

function App() {
  const [result, setResult] = useState(null);

  const generate = async () => {
    try {
      const res = await fetch("http://127.0.0.1:5000/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          variables: ["A", "B"],
          table: [0, 1, 1, 0],
        }),
      });

      const data = await res.json();
      setResult(data);
    } catch (err) {
      console.error(err);
      alert("Backend not reachable!");
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h1>⚡ Logic Gate Synthesizer</h1>

      <button onClick={generate}>Generate Circuit</button>

      {result && (
        <div>
          <h3>Final Expression:</h3>
          <p>{result.final_expression}</p>

          <h3>Circuit Diagram:</h3>
          <CircuitDiagram circuit={result.circuit} />
        </div>
      )}
    </div>
  );
}

export default App;