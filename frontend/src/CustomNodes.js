import React from "react";
import { Handle, Position } from "reactflow";

// Custom Input Node (Switch)
export const InputNode = ({ id, data }) => {
  const value = data.value !== undefined ? data.value : 0;
  const label = data.label || `In ${id.slice(-2)}`;

  return (
    <div className={`custom-node ${value === 1 ? "active-high" : "active-low"}`}>
      <button 
        className="node-delete-btn" 
        onClick={(e) => {
          e.stopPropagation();
          if (data.onDelete) data.onDelete(id);
        }}
      >
        ✕
      </button>
      <div className="node-title">{label}</div>
      <div className="node-content">
        <button 
          className={`switch-btn ${value === 1 ? "high" : ""}`}
          onClick={() => {
            if (data.onToggle) data.onToggle(id);
          }}
        >
          {value}
        </button>
      </div>
      <Handle 
        type="source" 
        position={Position.Right} 
        id="out" 
        style={{ background: value === 1 ? "#10b981" : "#475569" }}
      />
    </div>
  );
};

// Custom Output Node (LED Indicator)
export const OutputNode = ({ id, data }) => {
  const value = data.value !== undefined ? data.value : 0;
  const label = data.label || `Out ${id.slice(-2)}`;

  return (
    <div className={`custom-node ${value === 1 ? "active-high" : "active-low"}`}>
      <button 
        className="node-delete-btn" 
        onClick={(e) => {
          e.stopPropagation();
          if (data.onDelete) data.onDelete(id);
        }}
      >
        ✕
      </button>
      <div className="node-title">{label}</div>
      <div className="node-content" style={{ padding: "4px" }}>
        <div className={`led-indicator ${value === 1 ? "high" : ""}`} />
      </div>
      <Handle 
        type="target" 
        position={Position.Left} 
        id="in" 
        style={{ background: value === 1 ? "#10b981" : "#475569" }}
      />
    </div>
  );
};

// Custom Gate Node
export const GateNode = ({ id, data }) => {
  const gateType = data.gateType || "AND";
  const value = data.value !== undefined ? data.value : 0;
  
  // Choose SVG Path and width based on logic gate
  const renderGateSVG = () => {
    const color = value === 1 ? "#10b981" : "#38bdf8";
    const fill = "rgba(30, 41, 59, 0.85)";

    switch (gateType) {
      case "AND":
        return (
          <svg viewBox="0 0 50 40" width="55" height="40" style={{ overflow: "visible" }}>
            <path 
              d="M10,5 H25 C33,5 39,11 39,20 C39,29 33,35 25,35 H10 Z" 
              fill={fill} 
              stroke={color} 
              strokeWidth="2.5" 
            />
            <line x1="0" y1="13" x2="10" y2="13" stroke={color} strokeWidth="2" />
            <line x1="0" y1="27" x2="10" y2="27" stroke={color} strokeWidth="2" />
            <line x1="39" y1="20" x2="50" y2="20" stroke={color} strokeWidth="2" />
          </svg>
        );
      case "NAND":
        return (
          <svg viewBox="0 0 55 40" width="60" height="40" style={{ overflow: "visible" }}>
            <path 
              d="M10,5 H25 C33,5 39,11 39,20 C39,29 33,35 25,35 H10 Z" 
              fill={fill} 
              stroke={color} 
              strokeWidth="2.5" 
            />
            <circle cx="43.5" cy="20" r="3.5" fill={fill} stroke={color} strokeWidth="2" />
            <line x1="0" y1="13" x2="10" y2="13" stroke={color} strokeWidth="2" />
            <line x1="0" y1="27" x2="10" y2="27" stroke={color} strokeWidth="2" />
            <line x1="47" y1="20" x2="57" y2="20" stroke={color} strokeWidth="2" />
          </svg>
        );
      case "OR":
        return (
          <svg viewBox="0 0 50 40" width="55" height="40" style={{ overflow: "visible" }}>
            <path 
              d="M10,5 C16,5 21,11 23,20 C21,29 16,35 10,35 C17,35 27,33 37,20 C27,7 17,5 10,5 Z" 
              fill={fill} 
              stroke={color} 
              strokeWidth="2.5" 
            />
            <line x1="0" y1="13" x2="13" y2="13" stroke={color} strokeWidth="2" />
            <line x1="0" y1="27" x2="13" y2="27" stroke={color} strokeWidth="2" />
            <line x1="37" y1="20" x2="50" y2="20" stroke={color} strokeWidth="2" />
          </svg>
        );
      case "NOR":
        return (
          <svg viewBox="0 0 55 40" width="60" height="40" style={{ overflow: "visible" }}>
            <path 
              d="M10,5 C16,5 21,11 23,20 C21,29 16,35 10,35 C17,35 27,33 37,20 C27,7 17,5 10,5 Z" 
              fill={fill} 
              stroke={color} 
              strokeWidth="2.5" 
            />
            <circle cx="41" cy="20" r="3.5" fill={fill} stroke={color} strokeWidth="2" />
            <line x1="0" y1="13" x2="13" y2="13" stroke={color} strokeWidth="2" />
            <line x1="0" y1="27" x2="13" y2="27" stroke={color} strokeWidth="2" />
            <line x1="44.5" y1="20" x2="55" y2="20" stroke={color} strokeWidth="2" />
          </svg>
        );
      case "XOR":
        return (
          <svg viewBox="0 0 50 40" width="55" height="40" style={{ overflow: "visible" }}>
            <path 
              d="M6,5 C12,5 17,11 19,20 C17,29 12,35 6,35" 
              fill="none" 
              stroke={color} 
              strokeWidth="2" 
            />
            <path 
              d="M11,5 C17,5 22,11 24,20 C22,29 17,35 11,35 C18,35 28,33 38,20 C28,7 18,5 11,5 Z" 
              fill={fill} 
              stroke={color} 
              strokeWidth="2.5" 
            />
            <line x1="0" y1="13" x2="14" y2="13" stroke={color} strokeWidth="2" />
            <line x1="0" y1="27" x2="14" y2="27" stroke={color} strokeWidth="2" />
            <line x1="38" y1="20" x2="50" y2="20" stroke={color} strokeWidth="2" />
          </svg>
        );
      case "XNOR":
        return (
          <svg viewBox="0 0 55 40" width="60" height="40" style={{ overflow: "visible" }}>
            <path 
              d="M6,5 C12,5 17,11 19,20 C17,29 12,35 6,35" 
              fill="none" 
              stroke={color} 
              strokeWidth="2" 
            />
            <path 
              d="M11,5 C17,5 22,11 24,20 C22,29 17,35 11,35 C18,35 28,33 38,20 C28,7 18,5 11,5 Z" 
              fill={fill} 
              stroke={color} 
              strokeWidth="2.5" 
            />
            <circle cx="42" cy="20" r="3.5" fill={fill} stroke={color} strokeWidth="2" />
            <line x1="0" y1="13" x2="14" y2="13" stroke={color} strokeWidth="2" />
            <line x1="0" y1="27" x2="14" y2="27" stroke={color} strokeWidth="2" />
            <line x1="45.5" y1="20" x2="55" y2="20" stroke={color} strokeWidth="2" />
          </svg>
        );
      case "NOT":
        return (
          <svg viewBox="0 0 50 40" width="55" height="40" style={{ overflow: "visible" }}>
            <path 
              d="M10,5 L30,20 L10,35 Z" 
              fill={fill} 
              stroke={color} 
              strokeWidth="2.5" 
            />
            <circle cx="34" cy="20" r="3.5" fill={fill} stroke={color} strokeWidth="2" />
            <line x1="0" y1="20" x2="10" y2="20" stroke={color} strokeWidth="2" />
            <line x1="37.5" y1="20" x2="50" y2="20" stroke={color} strokeWidth="2" />
          </svg>
        );
      default:
        return <span>{gateType}</span>;
    }
  };

  const isNotGate = gateType === "NOT";

  return (
    <div className={`custom-node ${value === 1 ? "active-high" : ""}`}>
      <button 
        className="node-delete-btn" 
        onClick={(e) => {
          e.stopPropagation();
          if (data.onDelete) data.onDelete(id);
        }}
      >
        ✕
      </button>
      <div className="node-title">{gateType}</div>
      <div className="node-content">
        {renderGateSVG()}
      </div>

      {/* Inputs */}
      {isNotGate ? (
        <Handle 
          type="target" 
          position={Position.Left} 
          id="in-a" 
          style={{ top: "50%", background: data.inputAConnected ? (data.inputAVal === 1 ? "#10b981" : "#38bdf8") : "#475569" }}
        />
      ) : (
        <>
          <Handle 
            type="target" 
            position={Position.Left} 
            id="in-a" 
            style={{ top: "33%", background: data.inputAConnected ? (data.inputAVal === 1 ? "#10b981" : "#38bdf8") : "#475569" }}
          />
          <Handle 
            type="target" 
            position={Position.Left} 
            id="in-b" 
            style={{ top: "67%", background: data.inputBConnected ? (data.inputBVal === 1 ? "#10b981" : "#38bdf8") : "#475569" }}
          />
        </>
      )}

      {/* Output */}
      <Handle 
        type="source" 
        position={Position.Right} 
        id="out" 
        style={{ top: "50%", background: value === 1 ? "#10b981" : "#475569" }}
      />
    </div>
  );
};
