import React, { useEffect, useState } from "react";
import ReactFlow, { Background, Controls } from "reactflow";
import dagre from "dagre";
import "reactflow/dist/style.css";

const dagreGraph = new dagre.graphlib.Graph();
dagreGraph.setDefaultEdgeLabel(() => ({}));

const nodeWidth = 90;
const nodeHeight = 40;

const getLayoutedElements = (nodes, edges, direction = "TB") => {
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
    node.targetPosition = "top";
    node.sourcePosition = "bottom";
    node.position = {
      x: nodeWithPosition.x - nodeWidth / 2,
      y: nodeWithPosition.y - nodeHeight / 2,
    };
    return node;
  });

  return { nodes, edges };
};

const getBackgroundColor = (type, label, isHigh) => {
  if (type === "VARIABLE") return isHigh ? "#4CAF50" : "#f44336"; // Green for 1, Red for 0
  if (label === "NOT") return isHigh ? "#8e24aa" : "#9c27b0"; // Purple hues
  if (label === "AND") return isHigh ? "#1565c0" : "#1976d2"; // Blue hues
  if (label === "OR") return isHigh ? "#ef6c00" : "#ff9800"; // Orange hues
  return "#607d8b";
};

const ExpressionTree = ({ treeData, simulationState }) => {
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  useEffect(() => {
    if (!treeData || !treeData.nodes) return;

    const evalState = { ...simulationState };
    const tempNodes = [...treeData.nodes];
    const tempEdges = [...treeData.edges];

    const nodeValues = {};

    const evaluateNode = (nodeId) => {
      if (nodeId in nodeValues) return nodeValues[nodeId];
      
      const node = tempNodes.find(n => n.id === nodeId);
      if (!node) return 0;
      
      if (node.type === "VARIABLE") {
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
      
      // Operators: Find outgoing edges pointing to children
      const outgoing = tempEdges.filter(e => e.source === nodeId);
      const childValues = outgoing.map(e => evaluateNode(e.target));
      
      let val = 0;
      if (node.label === "NOT") {
        val = childValues.length > 0 ? (childValues[0] === 1 ? 0 : 1) : 0;
      } else if (node.label === "AND") {
        val = childValues.length > 0 && childValues.every(v => v === 1) ? 1 : 0;
      } else if (node.label === "OR") {
        val = childValues.length > 0 && childValues.some(v => v === 1) ? 1 : 0;
      }
      
      nodeValues[nodeId] = val;
      return val;
    };

    // Evaluate all AST nodes
    tempNodes.forEach(n => evaluateNode(n.id));

    const initialNodes = tempNodes.map((n) => {
      const val = nodeValues[n.id];
      const isHigh = val === 1;

      return {
        id: n.id,
        type: "default",
        data: { label: `${n.label} (${val})` },
        style: {
          background: getBackgroundColor(n.type, n.label, isHigh),
          color: "white",
          fontWeight: "bold",
          borderRadius: "6px",
          border: isHigh ? "2px solid #2e7d32" : "2px solid #333",
          fontSize: "12px",
          padding: "5px",
          width: `${nodeWidth}px`,
          height: `${nodeHeight}px`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: isHigh 
            ? "0 0 10px rgba(76, 175, 80, 0.6)" 
            : "0 4px 6px rgba(0,0,0,0.15)",
          transition: "all 0.3s ease"
        }
      };
    });

    const initialEdges = tempEdges.map((e, idx) => {
      const val = nodeValues[e.target]; // style by child value
      const isHigh = val === 1;

      return {
        id: `te${idx}`,
        source: e.source,
        target: e.target,
        style: { 
          stroke: isHigh ? "#4CAF50" : "#78909c", 
          strokeWidth: isHigh ? 2.5 : 1.5,
          transition: "all 0.3s ease"
        },
      };
    });

    const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
      initialNodes,
      initialEdges
    );

    setNodes(layoutedNodes);
    setEdges(layoutedEdges);
  }, [treeData, simulationState]);

  if (!treeData || !treeData.nodes || treeData.nodes.length === 0) {
    return <p style={{ textAlign: "center", padding: "20px" }}>No expression tree available.</p>;
  }

  return (
    <div style={{ height: "450px", border: "1px solid #ccc", borderRadius: "12px", background: "#f9f9f9" }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        fitView
      >
        <Background color="#ccc" gap={16} />
        <Controls />
      </ReactFlow>
    </div>
  );
};

export default ExpressionTree;
