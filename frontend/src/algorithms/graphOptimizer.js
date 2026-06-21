/**
 * Graph Optimizer — Analyzes the logic circuit DAG (Directed Acyclic Graph)
 * to perform topological sorting, critical path analysis, and fan-out checking.
 */

export function analyzeCircuitDAG(circuit) {
  if (!circuit || !circuit.nodes || circuit.nodes.length === 0) {
    return {
      topologicalOrder: [],
      logicDepth: 0,
      criticalPath: { nodes: [], edges: [], totalDelay: 0 },
      shortestPath: { nodes: [], totalDelay: 0 },
      maxFrequency: 0,
      fanAnalysis: [],
      depthMap: {},
      steps: [{ step: 1, action: 'Empty circuit provided', result: 'no action' }]
    };
  }

  const nodes = circuit.nodes;
  const edges = circuit.edges;
  const steps = [];
  let stepCounter = 1;

  // 1. Build adjacency list for forward traversal and backward traversal
  const adj = {}; // nodeId -> childNodeIds
  const revAdj = {}; // nodeId -> parentNodeIds
  
  nodes.forEach(n => {
    adj[n.id] = [];
    revAdj[n.id] = [];
  });

  edges.forEach(e => {
    if (adj[e.source]) adj[e.source].push(e.target);
    if (revAdj[e.target]) revAdj[e.target].push(e.source);
  });

  steps.push({
    step: stepCounter++,
    action: 'Build graph adjacency list',
    result: `Initialized directed graph with ${nodes.length} vertices and ${edges.length} edges.`
  });

  // 2. Topological sort using DFS
  const visited = new Set();
  const temp = new Set();
  const topologicalOrder = [];

  function visit(nodeId) {
    if (temp.has(nodeId)) return; // Cycle guard
    if (visited.has(nodeId)) return;

    temp.add(nodeId);
    (adj[nodeId] || []).forEach(childId => visit(childId));
    temp.delete(nodeId);
    visited.add(nodeId);
    topologicalOrder.unshift(nodeId); // prepend
  }

  // Visit nodes from inputs to outputs
  nodes.forEach(n => visit(n.id));

  steps.push({
    step: stepCounter++,
    action: 'Topological sort',
    result: `Successfully sorted nodes topologically: [${topologicalOrder.join(', ')}]`
  });

  // 3. Compute logic depth for each node (longest path from any input)
  const depthMap = {};
  
  // Initialize inputs at depth 0
  topologicalOrder.forEach(nodeId => {
    const parents = revAdj[nodeId] || [];
    if (parents.length === 0) {
      depthMap[nodeId] = 0;
    } else {
      const parentDepths = parents.map(pId => depthMap[pId] ?? 0);
      depthMap[nodeId] = 1 + Math.max(...parentDepths);
    }
  });

  const maxDepth = Math.max(...Object.values(depthMap), 0);

  steps.push({
    step: stepCounter++,
    action: 'Compute logic depths',
    result: `Maximum logic depth calculated as: ${maxDepth} gate levels.`
  });

  // 4. Compute critical path delay and shortest path delay
  // We associate typical delay values with gate types (9ns for AND/OR, 6ns for NOT)
  function getGateDelay(nodeId) {
    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.type === 'INPUT' || node.type === 'OUTPUT') return 0;
    if (node.type === 'NOT') return 6; // ns
    if (node.type === 'XOR') return 11; // ns
    return 9; // ns average (AND, OR, NAND, NOR)
  }

  // Find longest path (Critical Path) from inputs to outputs
  const delayToNode = {}; // nodeId -> max cumulative delay to this node
  const criticalParent = {}; // nodeId -> parentNodeId on critical path

  // Forward pass
  topologicalOrder.forEach(nodeId => {
    const parents = revAdj[nodeId] || [];
    const selfDelay = getGateDelay(nodeId);

    if (parents.length === 0) {
      delayToNode[nodeId] = selfDelay;
      criticalParent[nodeId] = null;
    } else {
      let maxParentDelay = -1;
      let bestParent = null;

      parents.forEach(pId => {
        const parentDelay = delayToNode[pId] ?? 0;
        if (parentDelay > maxParentDelay) {
          maxParentDelay = parentDelay;
          bestParent = pId;
        }
      });

      delayToNode[nodeId] = selfDelay + maxParentDelay;
      criticalParent[nodeId] = bestParent;
    }
  });

  // Find output node with maximum delay
  const outputs = nodes.filter(n => n.type === 'OUTPUT');
  let criticalOutputId = null;
  let maxDelay = 0;

  outputs.forEach(n => {
    const delay = delayToNode[n.id] ?? 0;
    if (delay > maxDelay) {
      maxDelay = delay;
      criticalOutputId = n.id;
    }
  });

  // Backtrack critical path
  const criticalPathNodes = [];
  let curr = criticalOutputId;
  while (curr !== null && curr !== undefined) {
    criticalPathNodes.unshift(curr);
    curr = criticalParent[curr];
  }

  // Find critical path edges
  const criticalPathEdges = [];
  for (let i = 0; i < criticalPathNodes.length - 1; i++) {
    const source = criticalPathNodes[i];
    const target = criticalPathNodes[i + 1];
    const edge = edges.find(e => e.source === source && e.target === target);
    if (edge) {
      criticalPathEdges.push(edge);
    }
  }

  // 5. Shortest path (BFS style)
  const shortestPathNodes = [];
  if (outputs.length > 0) {
    // Find output with minimum delay
    let minOutputId = outputs[0].id;
    let minDelay = delayToNode[minOutputId] ?? 0;
    outputs.forEach(n => {
      const delay = delayToNode[n.id] ?? 0;
      if (delay < minDelay) {
        minDelay = delay;
        minOutputId = n.id;
      }
    });

    let shortestCurr = minOutputId;
    while (shortestCurr !== null && shortestCurr !== undefined) {
      shortestPathNodes.unshift(shortestCurr);
      shortestCurr = revAdj[shortestCurr]?.[0] || null; // simple greedy parent
    }
  }

  const maxFrequency = maxDelay > 0 ? parseFloat((1000 / maxDelay).toFixed(1)) : 0; // in MHz

  steps.push({
    step: stepCounter++,
    action: 'Critical path analysis',
    result: `Critical path: [${criticalPathNodes.join(' → ')}]. Total delay: ${maxDelay} ns. Max clock freq: ${maxFrequency} MHz.`
  });

  // 6. Fan-in/fan-out load analysis
  const fanAnalysis = nodes.map(node => {
    const fanIn = revAdj[node.id]?.length || 0;
    const fanOut = adj[node.id]?.length || 0;
    
    // Load score (combination of fan-in and fan-out)
    const load = fanIn + fanOut;

    let warning = null;
    if (fanOut > 10) {
      warning = `Exceeded max fan-out of 10 (Current: ${fanOut})`;
    } else if (fanIn > 8) {
      warning = `Exceeded max fan-in of 8 (Current: ${fanIn})`;
    }

    return {
      nodeId: node.id,
      nodeType: node.type,
      fanIn,
      fanOut,
      load,
      warning
    };
  });

  // Identify bottleneck node
  let bottleneckNode = null;
  let maxFanOut = -1;
  fanAnalysis.forEach(item => {
    if (item.nodeType !== 'INPUT' && item.nodeType !== 'OUTPUT' && item.fanOut > maxFanOut) {
      maxFanOut = item.fanOut;
      bottleneckNode = item.nodeId;
    }
  });

  steps.push({
    step: stepCounter++,
    action: 'Load & fanout analysis completed',
    result: bottleneckNode 
      ? `Bottleneck node identified: "${bottleneckNode}" with a fan-out of ${maxFanOut}.`
      : 'All nodes within standard fan-out limits.'
  });

  return {
    topologicalOrder,
    logicDepth: maxDepth,
    criticalPath: {
      nodes: criticalPathNodes,
      edges: criticalPathEdges,
      totalDelay: maxDelay
    },
    shortestPath: {
      nodes: shortestPathNodes,
      totalDelay: Math.min(...outputs.map(o => delayToNode[o.id] || 0))
    },
    maxFrequency,
    fanAnalysis,
    depthMap,
    steps
  };
}
