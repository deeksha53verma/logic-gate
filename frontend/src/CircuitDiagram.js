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

const getBackgroundColor = (type, isHigh) => {
  if (type === "INPUT" || type === "OUTPUT") {
    return isHigh ? "#4CAF50" : "#f44336"; // Green for 1, Red for 0
  }
  return isHigh ? "#2e7d32" : "#2196F3"; // Glowing green for high logic gates, blue for low logic gates
};

const CircuitDiagram = ({ circuit, simulationState }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    if (!circuit || !circuit.nodes) return;

    const evalState = { ...simulationState };
    const tempNodes = [...circuit.nodes];
    const tempEdges = [...circuit.edges];

    // Compute topological value for each node
    const nodeValues = {};
    
    const evaluateNode = (nodeId) => {
      if (nodeId in nodeValues) return nodeValues[nodeId];
      
      const node = tempNodes.find(n => n.id === nodeId);
      if (!node) return 0;
      
      if (node.type === "INPUT") {
        let val = 0;
        if (node.label === "True" || node.label === "1") {
          val = 1;
        } else if (node.label === "False" || node.label === "0") {
          val = 0;
        } else {
          val = evalState[node.label] !== undefined ? evalState[node.label] : 0;
        }
        nodeValues[nodeId] = val;
        return val;
      }
      
      // Find incoming edges pointing to this node (its inputs)
      const incoming = tempEdges.filter(e => e.target === nodeId);
      const childValues = incoming.map(e => evaluateNode(e.source));
      
      let val = 0;
      if (node.type === "NOT") {
        val = childValues.length > 0 ? (childValues[0] === 1 ? 0 : 1) : 0;
      } else if (node.type === "AND") {
        val = childValues.length > 0 && childValues.every(v => v === 1) ? 1 : 0;
      } else if (node.type === "OR") {
        val = childValues.length > 0 && childValues.some(v => v === 1) ? 1 : 0;
      } else if (node.type === "OUTPUT") {
        val = childValues.length > 0 ? childValues[0] : 0;
      }
      
      nodeValues[nodeId] = val;
      return val;
    };

    // Evaluate all nodes in the circuit
    tempNodes.forEach(n => evaluateNode(n.id));

    const initialNodes = tempNodes.map((n) => {
      const val = nodeValues[n.id];
      const isHigh = val === 1;
      const isCritical = n.critical === true;
      
      let displayLabel = n.label;
      if (n.type === "INPUT") {
        displayLabel = `${n.label} (${val})`;
      } else if (n.type === "OUTPUT") {
        displayLabel = `OUT (${val})`;
      } else {
        displayLabel = `${n.label} (${val})`;
      }

      return {
        id: n.id,
        type: "default",
        data: { label: displayLabel },
        style: {
          background: isCritical 
            ? "linear-gradient(135deg, #e65100 0%, #ff5722 100%)" 
            : getBackgroundColor(n.type, isHigh),
          color: "white",
          fontWeight: "bold",
          borderRadius: "8px",
          border: isCritical ? "3px solid #ff9800" : "2px solid #222",
          boxShadow: isCritical 
            ? "0 0 15px rgba(255, 87, 34, 0.8)" 
            : isHigh 
              ? "0 0 12px rgba(76, 175, 80, 0.6)" 
              : "none",
          transition: "all 0.3s ease"
        }
      };
    });

    const initialEdges = tempEdges.map((e, idx) => {
      const isCritical = e.critical === true;
      const val = nodeValues[e.source];
      const isHigh = val === 1;

      return {
        id: `e${idx}`,
        source: e.source,
        target: e.target,
        animated: isHigh, // Animate only if the wire carries a high logic level
        style: { 
          stroke: isCritical 
            ? "#ff5722" 
            : isHigh 
              ? "#4CAF50" 
              : "#78909c", 
          strokeWidth: isCritical ? 3.5 : isHigh ? 2.5 : 1.5 
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isCritical 
            ? "#ff5722" 
            : isHigh 
              ? "#4CAF50" 
              : "#78909c",
        },
      };
    });


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