import React, { useState, useRef, useCallback, useEffect } from "react";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  addEdge,
  applyNodeChanges,
  applyEdgeChanges,
  MarkerType
} from "reactflow";
import * as htmlToImage from "html-to-image";
import "reactflow/dist/style.css";
import { InputNode, GateNode, OutputNode } from "./CustomNodes";

const nodeTypes = {
  inputNode: InputNode,
  gateNode: GateNode,
  outputNode: OutputNode,
};

// Simulation engine logic to evaluate signal values across the entire canvas topologically
const runSimulation = (nodes, edges) => {
  const clonedNodes = nodes.map((n) => ({
    ...n,
    data: { ...n.data },
  }));

  const nodeValues = {};

  const evaluateNode = (nodeId, localVisited = new Set()) => {
    if (nodeId in nodeValues) return nodeValues[nodeId];
    
    // Cycle safety
    if (localVisited.has(nodeId)) {
      return 0; 
    }

    localVisited.add(nodeId);
    const node = clonedNodes.find((n) => n.id === nodeId);
    if (!node) return 0;

    let computedVal = 0;

    if (node.type === "inputNode") {
      computedVal = node.data.value !== undefined ? node.data.value : 0;
    } else if (node.type === "gateNode") {
      const gateType = node.data.gateType || "AND";
      const edgeA = edges.find((e) => e.target === nodeId && e.targetHandle === "in-a");
      const edgeB = edges.find((e) => e.target === nodeId && e.targetHandle === "in-b");

      const valA = edgeA ? evaluateNode(edgeA.source, new Set(localVisited)) : 0;
      const valB = edgeB ? evaluateNode(edgeB.source, new Set(localVisited)) : 0;

      node.data.inputAVal = valA;
      node.data.inputAConnected = !!edgeA;
      node.data.inputBVal = valB;
      node.data.inputBConnected = !!edgeB;

      if (gateType === "AND") {
        computedVal = valA === 1 && valB === 1 ? 1 : 0;
      } else if (gateType === "NAND") {
        computedVal = !(valA === 1 && valB === 1) ? 1 : 0;
      } else if (gateType === "OR") {
        computedVal = valA === 1 || valB === 1 ? 1 : 0;
      } else if (gateType === "NOR") {
        computedVal = !(valA === 1 || valB === 1) ? 1 : 0;
      } else if (gateType === "XOR") {
        computedVal = valA !== valB ? 1 : 0;
      } else if (gateType === "XNOR") {
        computedVal = valA === valB ? 1 : 0;
      } else if (gateType === "NOT") {
        computedVal = valA === 1 ? 0 : 1;
      }
    } else if (node.type === "outputNode") {
      const edgeIn = edges.find((e) => e.target === nodeId && e.targetHandle === "in");
      const valIn = edgeIn ? evaluateNode(edgeIn.source, new Set(localVisited)) : 0;

      node.data.value = valIn;
      computedVal = valIn;
    }

    node.data.value = computedVal;
    nodeValues[nodeId] = computedVal;
    return computedVal;
  };

  // Evaluate all nodes to resolve state propagate
  clonedNodes.forEach((n) => evaluateNode(n.id));

  // Style edges dynamically by looking up source value
  const clonedEdges = edges.map((e, idx) => {
    const sourceVal = nodeValues[e.source] !== undefined ? nodeValues[e.source] : 0;
    const isHigh = sourceVal === 1;

    return {
      ...e,
      animated: isHigh,
      style: {
        stroke: isHigh ? "#10b981" : "#475569",
        strokeWidth: isHigh ? 3 : 1.5,
        transition: "all 0.25s ease",
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
        color: isHigh ? "#10b981" : "#475569",
      },
    };
  });

  return { nodes: clonedNodes, edges: clonedEdges };
};

const DragDropCircuit = () => {
  const reactFlowWrapper = useRef(null);
  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // Helper to trigger simulation synchronously with fresh arrays
  const triggerSimulation = useCallback((currentNodes, currentEdges) => {
    const { nodes: simNodes, edges: simEdges } = runSimulation(currentNodes, currentEdges);
    setNodes(simNodes);
    setEdges(simEdges);
  }, []);

  // Handler to toggle switch inputs on the canvas
  const handleNodeToggle = useCallback((nodeId) => {
    setNodes((nds) => {
      const nextNodes = nds.map((n) => {
        if (n.id === nodeId) {
          const nextVal = n.data.value === 1 ? 0 : 1;
          return {
            ...n,
            data: { ...n.data, value: nextVal },
          };
        }
        return n;
      });
      // Defer simulation running to next tick to let react state commit or run synchronously on local arrays
      setTimeout(() => {
        setEdges((eds) => {
          const { nodes: simNodes, edges: simEdges } = runSimulation(nextNodes, eds);
          setNodes(simNodes);
          return simEdges;
        });
      }, 0);
      return nextNodes;
    });
  }, []);

  // Handler to delete nodes
  const handleNodeDelete = useCallback((nodeId) => {
    setNodes((nds) => {
      const nextNodes = nds.filter((n) => n.id !== nodeId);
      setEdges((eds) => {
        const nextEdges = eds.filter((e) => e.source !== nodeId && e.target !== nodeId);
        setTimeout(() => triggerSimulation(nextNodes, nextEdges), 0);
        return nextEdges;
      });
      return nextNodes;
    });
  }, [triggerSimulation]);

  // Nodes / Edges change hooks required by React Flow
  const onNodesChange = useCallback((changes) => {
    setNodes((nds) => {
      const nextNodes = applyNodeChanges(changes, nds);
      
      // If node deletion occurs through keys/etc
      const hasRemove = changes.some((c) => c.type === "remove");
      if (hasRemove) {
        setEdges((eds) => {
          const activeNodeIds = new Set(nextNodes.map((n) => n.id));
          const nextEdges = eds.filter((e) => activeNodeIds.has(e.source) && activeNodeIds.has(e.target));
          setTimeout(() => triggerSimulation(nextNodes, nextEdges), 0);
          return nextEdges;
        });
      }
      return nextNodes;
    });
  }, [triggerSimulation]);

  const onEdgesChange = useCallback((changes) => {
    setEdges((eds) => {
      const nextEdges = applyEdgeChanges(changes, eds);
      
      const hasRemove = changes.some((c) => c.type === "remove");
      if (hasRemove) {
        setTimeout(() => {
          setNodes((nds) => {
            const { nodes: simNodes, edges: simEdges } = runSimulation(nds, nextEdges);
            setEdges(simEdges);
            return simNodes;
          });
        }, 0);
      }
      return nextEdges;
    });
  }, []);

  // Draw wire connection handler
  const onConnect = useCallback((params) => {
    setEdges((eds) => {
      const nextEdges = addEdge({ ...params, type: "default" }, eds);
      setTimeout(() => {
        setNodes((nds) => {
          const { nodes: simNodes, edges: simEdges } = runSimulation(nds, nextEdges);
          setEdges(simEdges);
          return simNodes;
        });
      }, 0);
      return nextEdges;
    });
  }, []);

  // Drag-and-drop bindings
  const onDragStart = (event, nodeType, gateType = null) => {
    event.dataTransfer.setData("application/reactflow/type", nodeType);
    if (gateType) {
      event.dataTransfer.setData("application/reactflow/gateType", gateType);
    }
    event.dataTransfer.effectAllowed = "move";
  };

  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      if (!reactFlowInstance || !reactFlowWrapper.current) return;

      const reactFlowBounds = reactFlowWrapper.current.getBoundingClientRect();
      const type = event.dataTransfer.getData("application/reactflow/type");
      const gateType = event.dataTransfer.getData("application/reactflow/gateType");

      if (!type) return;

      // Project mouse screen coords to reactflow scene coords
      const position = reactFlowInstance.project({
        x: event.clientX - reactFlowBounds.left,
        y: event.clientY - reactFlowBounds.top,
      });

      const nodeId = `node_${Date.now()}`;
      const newNode = {
        id: nodeId,
        type,
        position,
        data: {
          label: gateType ? `${gateType}` : type === "inputNode" ? "INPUT" : "OUTPUT",
          gateType,
          value: 0,
          onToggle: handleNodeToggle,
          onDelete: handleNodeDelete,
        },
      };

      setNodes((nds) => {
        const nextNodes = [...nds, newNode];
        setTimeout(() => triggerSimulation(nextNodes, edges), 0);
        return nextNodes;
      });
    },
    [reactFlowInstance, edges, handleNodeToggle, handleNodeDelete, triggerSimulation]
  );

  // Clear workspace
  const clearCanvas = () => {
    setNodes([]);
    setEdges([]);
  };

  // Fit camera view
  const fitView = () => {
    if (reactFlowInstance) {
      reactFlowInstance.fitView({ padding: 0.2 });
    }
  };

  // Save schematic to image
  const exportSchematic = () => {
    if (reactFlowWrapper.current === null) return;
    htmlToImage.toPng(reactFlowWrapper.current, { backgroundColor: "#020617" })
      .then((dataUrl) => {
        const link = document.createElement("a");
        link.download = "custom-circuit.png";
        link.href = dataUrl;
        link.click();
      })
      .catch((err) => console.error("Could not export schematic:", err));
  };

  // Load Presets
  const loadPreset = (presetName) => {
    let presetNodes = [];
    let presetEdges = [];

    if (presetName === "HALF_ADDER") {
      presetNodes = [
        { id: "in-a", type: "inputNode", position: { x: 80, y: 100 }, data: { label: "Input A", value: 0, onToggle: handleNodeToggle, onDelete: handleNodeDelete } },
        { id: "in-b", type: "inputNode", position: { x: 80, y: 260 }, data: { label: "Input B", value: 0, onToggle: handleNodeToggle, onDelete: handleNodeDelete } },
        { id: "gate-xor", type: "gateNode", position: { x: 260, y: 100 }, data: { gateType: "XOR", value: 0, onDelete: handleNodeDelete } },
        { id: "gate-and", type: "gateNode", position: { x: 260, y: 240 }, data: { gateType: "AND", value: 0, onDelete: handleNodeDelete } },
        { id: "out-sum", type: "outputNode", position: { x: 480, y: 100 }, data: { label: "Sum (S)", value: 0, onDelete: handleNodeDelete } },
        { id: "out-carry", type: "outputNode", position: { x: 480, y: 240 }, data: { label: "Carry (C)", value: 0, onDelete: handleNodeDelete } },
      ];
      presetEdges = [
        { id: "e1", source: "in-a", target: "gate-xor", targetHandle: "in-a" },
        { id: "e2", source: "in-b", target: "gate-xor", targetHandle: "in-b" },
        { id: "e3", source: "in-a", target: "gate-and", targetHandle: "in-a" },
        { id: "e4", source: "in-b", target: "gate-and", targetHandle: "in-b" },
        { id: "e5", source: "gate-xor", target: "out-sum", targetHandle: "in" },
        { id: "e6", source: "gate-and", target: "out-carry", targetHandle: "in" },
      ];
    } else if (presetName === "FULL_ADDER") {
      presetNodes = [
        { id: "fa-a", type: "inputNode", position: { x: 50, y: 70 }, data: { label: "Input A", value: 0, onToggle: handleNodeToggle, onDelete: handleNodeDelete } },
        { id: "fa-b", type: "inputNode", position: { x: 50, y: 190 }, data: { label: "Input B", value: 0, onToggle: handleNodeToggle, onDelete: handleNodeDelete } },
        { id: "fa-cin", type: "inputNode", position: { x: 50, y: 310 }, data: { label: "Carry In (Cin)", value: 0, onToggle: handleNodeToggle, onDelete: handleNodeDelete } },
        { id: "fa-xor1", type: "gateNode", position: { x: 200, y: 90 }, data: { gateType: "XOR", value: 0, onDelete: handleNodeDelete } },
        { id: "fa-xor2", type: "gateNode", position: { x: 370, y: 130 }, data: { gateType: "XOR", value: 0, onDelete: handleNodeDelete } },
        { id: "fa-and1", type: "gateNode", position: { x: 200, y: 230 }, data: { gateType: "AND", value: 0, onDelete: handleNodeDelete } },
        { id: "fa-and2", type: "gateNode", position: { x: 370, y: 270 }, data: { gateType: "AND", value: 0, onDelete: handleNodeDelete } },
        { id: "fa-or", type: "gateNode", position: { x: 510, y: 250 }, data: { gateType: "OR", value: 0, onDelete: handleNodeDelete } },
        { id: "fa-sum", type: "outputNode", position: { x: 650, y: 130 }, data: { label: "Sum (S)", value: 0, onDelete: handleNodeDelete } },
        { id: "fa-cout", type: "outputNode", position: { x: 650, y: 250 }, data: { label: "Carry Out (Cout)", value: 0, onDelete: handleNodeDelete } },
      ];
      presetEdges = [
        { id: "fa-e1", source: "fa-a", target: "fa-xor1", targetHandle: "in-a" },
        { id: "fa-e2", source: "fa-b", target: "fa-xor1", targetHandle: "in-b" },
        { id: "fa-e3", source: "fa-xor1", target: "fa-xor2", targetHandle: "in-a" },
        { id: "fa-e4", source: "fa-cin", target: "fa-xor2", targetHandle: "in-b" },
        { id: "fa-e5", source: "fa-a", target: "fa-and1", targetHandle: "in-a" },
        { id: "fa-e6", source: "fa-b", target: "fa-and1", targetHandle: "in-b" },
        { id: "fa-e7", source: "fa-xor1", target: "fa-and2", targetHandle: "in-a" },
        { id: "fa-e8", source: "fa-cin", target: "fa-and2", targetHandle: "in-b" },
        { id: "fa-e9", source: "fa-and1", target: "fa-or", targetHandle: "in-a" },
        { id: "fa-e10", source: "fa-and2", target: "fa-or", targetHandle: "in-b" },
        { id: "fa-e11", source: "fa-xor2", target: "fa-sum", targetHandle: "in" },
        { id: "fa-e12", source: "fa-or", target: "fa-cout", targetHandle: "in" },
      ];
    } else if (presetName === "MUX_2TO1") {
      presetNodes = [
        { id: "mux-d0", type: "inputNode", position: { x: 80, y: 60 }, data: { label: "Data D0", value: 0, onToggle: handleNodeToggle, onDelete: handleNodeDelete } },
        { id: "mux-d1", type: "inputNode", position: { x: 80, y: 180 }, data: { label: "Data D1", value: 0, onToggle: handleNodeToggle, onDelete: handleNodeDelete } },
        { id: "mux-s", type: "inputNode", position: { x: 80, y: 300 }, data: { label: "Select S", value: 0, onToggle: handleNodeToggle, onDelete: handleNodeDelete } },
        { id: "mux-not", type: "gateNode", position: { x: 220, y: 300 }, data: { gateType: "NOT", value: 0, onDelete: handleNodeDelete } },
        { id: "mux-and1", type: "gateNode", position: { x: 360, y: 80 }, data: { gateType: "AND", value: 0, onDelete: handleNodeDelete } },
        { id: "mux-and2", type: "gateNode", position: { x: 360, y: 200 }, data: { gateType: "AND", value: 0, onDelete: handleNodeDelete } },
        { id: "mux-or", type: "gateNode", position: { x: 500, y: 140 }, data: { gateType: "OR", value: 0, onDelete: handleNodeDelete } },
        { id: "mux-out", type: "outputNode", position: { x: 640, y: 140 }, data: { label: "Output Y", value: 0, onDelete: handleNodeDelete } },
      ];
      presetEdges = [
        { id: "mux-e1", source: "mux-d0", target: "mux-and1", targetHandle: "in-a" },
        { id: "mux-e2", source: "mux-s", target: "mux-not", targetHandle: "in-a" },
        { id: "mux-e3", source: "mux-not", target: "mux-and1", targetHandle: "in-b" },
        { id: "mux-e4", source: "mux-d1", target: "mux-and2", targetHandle: "in-a" },
        { id: "mux-e5", source: "mux-s", target: "mux-and2", targetHandle: "in-b" },
        { id: "mux-e6", source: "mux-and1", target: "mux-or", targetHandle: "in-a" },
        { id: "mux-e7", source: "mux-and2", target: "mux-or", targetHandle: "in-b" },
        { id: "mux-e8", source: "mux-or", target: "mux-out", targetHandle: "in" },
      ];
    }

    triggerSimulation(presetNodes, presetEdges);
  };

  // Run initial simulator layout fit view on preset load
  useEffect(() => {
    if (reactFlowInstance && nodes.length > 0) {
      reactFlowInstance.fitView({ padding: 0.1 });
    }
  }, [reactFlowInstance, nodes.length]);

  return (
    <div className="sandbox-container">
      {/* PALETTE SIDEBAR */}
      <div className="sandbox-sidebar">
        <h3>🔌 Components</h3>
        
        <div 
          className="palette-item" 
          onDragStart={(event) => onDragStart(event, "inputNode")} 
          draggable
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="12" cy="12" r="4" fill="#10b981" />
          </svg>
          <span>Toggle Switch</span>
        </div>

        <div 
          className="palette-item" 
          onDragStart={(event) => onDragStart(event, "outputNode")} 
          draggable
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2">
            <circle cx="12" cy="12" r="8" />
            <circle cx="12" cy="12" r="3" fill="#ef4444" />
          </svg>
          <span>LED Indicator</span>
        </div>

        <h3>💾 Basic Gates</h3>
        
        <div 
          className="palette-item" 
          onDragStart={(event) => onDragStart(event, "gateNode", "NOT")} 
          draggable
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
            <polygon points="6,4 18,12 6,20" />
            <circle cx="20" cy="12" r="1.5" />
          </svg>
          <span>NOT Gate</span>
        </div>

        <div 
          className="palette-item" 
          onDragStart={(event) => onDragStart(event, "gateNode", "AND")} 
          draggable
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
            <path d="M4,4 H12 C16.5,4 20,7.5 20,12 C20,16.5 16.5,20 12,20 H4 Z" />
          </svg>
          <span>AND Gate</span>
        </div>

        <div 
          className="palette-item" 
          onDragStart={(event) => onDragStart(event, "gateNode", "OR")} 
          draggable
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
            <path d="M4,4 C9,4 12,9 13,12 C12,15 9,20 4,20 C9,20 15,19 19,12 C15,5 9,4 4,4 Z" />
          </svg>
          <span>OR Gate</span>
        </div>

        <h3>💾 Derived Gates</h3>

        <div 
          className="palette-item" 
          onDragStart={(event) => onDragStart(event, "gateNode", "NAND")} 
          draggable
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
            <path d="M3,4 H10 C14.5,4 18,7.5 18,12 C18,16.5 14.5,20 10,20 H3 Z" />
            <circle cx="20.5" cy="12" r="1.5" />
          </svg>
          <span>NAND Gate</span>
        </div>

        <div 
          className="palette-item" 
          onDragStart={(event) => onDragStart(event, "gateNode", "NOR")} 
          draggable
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
            <path d="M3,4 C8,4 11,9 12,12 C11,15 8,20 3,20 C8,20 14,19 18,12 C14,5 8,4 3,4 Z" />
            <circle cx="20.5" cy="12" r="1.5" />
          </svg>
          <span>NOR Gate</span>
        </div>

        <div 
          className="palette-item" 
          onDragStart={(event) => onDragStart(event, "gateNode", "XOR")} 
          draggable
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
            <path d="M2,4 C5,9 5,15 2,20" />
            <path d="M5,4 C10,4 13,9 14,12 C13,15 10,20 5,20 C10,20 16,19 20,12 C16,5 10,4 5,4 Z" />
          </svg>
          <span>XOR Gate</span>
        </div>

        <div 
          className="palette-item" 
          onDragStart={(event) => onDragStart(event, "gateNode", "XNOR")} 
          draggable
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="#38bdf8" strokeWidth="2">
            <path d="M2,4 C5,9 5,15 2,20" />
            <path d="M5,4 C10,4 13,9 14,12 C13,15 10,20 5,20 C10,20 16,19 20,12 C16,5 10,4 5,4 Z" />
            <circle cx="22.5" cy="12" r="1.5" />
          </svg>
          <span>XNOR Gate</span>
        </div>
      </div>

      {/* CANVAS SECTION */}
      <div className="sandbox-canvas" ref={reactFlowWrapper}>
        
        {/* TOOLBAR */}
        <div className="sandbox-toolbar">
          <select 
            onChange={(e) => {
              if (e.target.value) {
                loadPreset(e.target.value);
                e.target.value = ""; // Reset dropdown
              }
            }}
            defaultValue=""
            style={{ 
              background: "rgba(30, 41, 59, 0.95)",
              color: "#38bdf8",
              fontSize: "0.8rem",
              padding: "4px 8px",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              cursor: "pointer",
              fontWeight: "600",
              marginRight: "6px"
            }}
          >
            <option value="" disabled>📐 Preset Circuits</option>
            <option value="HALF_ADDER">Half Adder (Sum & Carry)</option>
            <option value="FULL_ADDER">Full Adder (3 inputs)</option>
            <option value="MUX_2TO1">2-to-1 Multiplexer</option>
          </select>

          <button className="toolbar-btn" onClick={fitView}>🔎 Fit View</button>
          <button className="toolbar-btn" onClick={exportSchematic}>📸 Export PNG</button>
          <button className="toolbar-btn" style={{ background: "rgba(239, 68, 68, 0.2)", color: "#ef4444", border: "1px solid rgba(239, 68, 68, 0.4)" }} onClick={clearCanvas}>🗑️ Clear Canvas</button>
        </div>

        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onInit={setReactFlowInstance}
          onDrop={onDrop}
          onDragOver={onDragOver}
          nodeTypes={nodeTypes}
          fitView
          deleteKeyCode={["Backspace", "Delete"]}
        >
          <Background color="#334155" gap={20} />
          <Controls />
          <MiniMap 
            nodeColor={(n) => {
              if (n.type === "inputNode") return "#10b981";
              if (n.type === "outputNode") return "#ef4444";
              return "#1e293b";
            }}
            maskColor="rgba(15, 23, 42, 0.7)"
            style={{ background: "#0f172a", border: "1px solid rgba(255, 255, 255, 0.1)", borderRadius: "8px" }}
          />
        </ReactFlow>
      </div>
    </div>
  );
};

export default DragDropCircuit;
