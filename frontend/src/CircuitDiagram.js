import React, { useEffect, useState } from "react";
import ReactFlow, { Background, Controls, MarkerType } from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 100;
const nodeHeight = 50;

const getLayoutedElements = (nodes, edges, direction = "LR") => {
  const isHorizontal = direction === "LR";
  dagreGraph.setGraph({ rankdir: direction });

  nodes.forEach((node) => {
    dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
  });

  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target);
  });

  dagre.layout(dagreGraph);

  nodes.forEach((node) => {
    const nodeWithPosition = dagreGraph.node(node.id);
    node.targetPosition = isHorizontal ? "left" : "top";
    node.sourcePosition = isHorizontal ? "right" : "bottom";
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return node;
  });

  return { nodes, edges };
};

const getBackgroundColor = (type, state) => {
  if (type === "INPUT" || type === "OUTPUT") return state ? "#4CAF50" : "#f44336"; // Green for 1, Red for 0
  return "#2196F3"; // Blue for logic gates
};

const CircuitDiagram = ({ circuit, simulationState }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    if (!circuit || !circuit.nodes) return;

    // Evaluate circuit state based on simulation inputs
    const evalState = { ...simulationState };
    
    // Simple topological evaluation simulator
    const tempNodes = [...circuit.nodes];
    const tempEdges = [...circuit.edges];
    
    // Sort logic gates roughly by edges to simulate
    // In a real robust simulator, we'd do a proper topological sort.
    // For visual simplicity, we assume we can just colorize the inputs and pass them.

    const initialNodes = tempNodes.map((n) => {
      const isHigh = evalState[n.label] === 1;
      return {
        id: n.id,
        type: "default",
        data: { label: `${n.label} ${n.type === "INPUT" ? (isHigh ? "(1)" : "(0)") : ""}` },
        style: {
          background: getBackgroundColor(n.type, isHigh),
          color: "white",
          fontWeight: "bold",
          borderRadius: "8px",
          border: "2px solid #222"
        }
      };
    });

    const initialEdges = tempEdges.map((e, idx) => ({
      id: `e${idx}`,
      source: e.source,
      target: e.target,
      animated: true,
      style: { stroke: "#333", strokeWidth: 2 },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: "#333",
      },
    }));

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [circuit, simulationState]);

  if (!circuit || !circuit.nodes || circuit.nodes.length === 0) {
    return <p>No circuit generated.</p>;
  }

  return (
    <div style={{ height: "400px", border: "1px solid #ccc", borderRadius: "8px" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
      >
        <Background />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default CircuitDiagram;