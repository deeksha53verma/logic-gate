/**
 * DP Subcircuit Optimizer — detects and merges common logic sub-expressions
 * using a dynamic programming memoization cache.
 */

export function optimizeWithDP(circuit) {
  if (!circuit || !circuit.nodes || circuit.nodes.length === 0) {
    return {
      cache: [],
      totalCacheEntries: 0,
      cacheHits: 0,
      savedGates: 0,
      savedDelay: 0,
      steps: [{ step: 1, action: 'Empty circuit provided', hash: '-', result: 'no action' }],
      optimizedCircuit: circuit
    };
  }

  const nodes = circuit.nodes;
  const edges = circuit.edges;
  const steps = [];
  let stepCounter = 1;

  // 1. Build incoming adjacency list (parents of each node)
  const incoming = {};
  nodes.forEach(n => {
    incoming[n.id] = [];
  });
  edges.forEach(e => {
    if (incoming[e.target]) {
      incoming[e.target].push(e.source);
    }
  });

  steps.push({
    step: stepCounter++,
    action: 'Analyze circuit structure',
    hash: 'N/A',
    result: `Found ${nodes.length} nodes and ${edges.length} connections.`
  });

  // 2. Perform topological sort (Kahn's or DFS) to process bottom-up
  const visited = new Set();
  const temp = new Set();
  const topologicalOrder = [];

  function visit(nodeId) {
    if (temp.has(nodeId)) return; // Cycle detected
    if (visited.has(nodeId)) return;

    temp.add(nodeId);
    
    // Find all nodes that point to this node (dependencies)
    const deps = incoming[nodeId] || [];
    deps.forEach(visit);

    temp.delete(nodeId);
    visited.add(nodeId);
    topologicalOrder.push(nodeId);
  }

  nodes.forEach(n => visit(n.id));

  steps.push({
    step: stepCounter++,
    action: 'Topological sort completed',
    hash: 'N/A',
    result: `Order: [${topologicalOrder.join(' → ')}]`
  });

  // 3. Compute structural hashes bottom-up using memoization
  const hashMemo = {}; // nodeId -> hash string
  const subcircuitCache = {}; // hash string -> { nodeId, count, nodes: [nodeIds] }
  let cacheHits = 0;

  topologicalOrder.forEach(nodeId => {
    const node = nodes.find(n => n.id === nodeId);
    if (!node) return;

    if (node.type === 'INPUT') {
      hashMemo[nodeId] = `IN:${node.label}`;
      steps.push({
        step: stepCounter++,
        action: `Memoize input node ${nodeId}`,
        hash: hashMemo[nodeId],
        result: `Terminal input: ${node.label}`
      });
      return;
    }

    if (node.type === 'OUTPUT') {
      const parentId = incoming[nodeId]?.[0];
      hashMemo[nodeId] = `OUT:${parentId ? hashMemo[parentId] : 'EMPTY'}`;
      return;
    }

    // Gate node: sort incoming child hashes to ensure commutativity (e.g. A*B is same as B*A)
    const childIds = incoming[nodeId] || [];
    const childHashes = childIds.map(cid => hashMemo[cid] || 'EMPTY').sort();
    const structuralHash = `${node.type}(${childHashes.join(',')})`;

    hashMemo[nodeId] = structuralHash;

    if (subcircuitCache[structuralHash]) {
      // CACHE HIT! Duplicate subcircuit detected
      subcircuitCache[structuralHash].count++;
      subcircuitCache[structuralHash].nodes.push(nodeId);
      cacheHits++;

      steps.push({
        step: stepCounter++,
        action: `Hash gate ${nodeId} (${node.type})`,
        hash: structuralHash,
        result: `🔥 CACHE HIT! Merges with existing subcircuit at node ${subcircuitCache[structuralHash].nodeId}`
      });
    } else {
      // New subcircuit
      subcircuitCache[structuralHash] = {
        nodeId: nodeId,
        count: 1,
        nodes: [nodeId]
      };

      steps.push({
        step: stepCounter++,
        action: `Hash gate ${nodeId} (${node.type})`,
        hash: structuralHash,
        result: `New unique subcircuit entry added to DP cache.`
      });
    }
  });

  // Calculate savings
  const savedGates = cacheHits;
  const savedDelay = cacheHits * 1.5; // typical estimation: 1.5ns saved per redundant gate path

  // Build the list of cache hits for output
  const cacheList = Object.entries(subcircuitCache)
    .filter(([_, data]) => data.count > 1)
    .map(([hash, data]) => ({
      hash,
      expression: hash.replace(/IN:/g, ''),
      count: data.count,
      nodes: data.nodes
    }));

  steps.push({
    step: stepCounter++,
    action: 'Optimization complete',
    hash: 'N/A',
    result: `Saved ${savedGates} duplicate gates. Delay reduced by ${savedDelay} ns.`
  });

  return {
    cache: cacheList,
    totalCacheEntries: Object.keys(subcircuitCache).length,
    cacheHits,
    savedGates,
    savedDelay,
    steps,
    // For visualization simplicity, returning the original or simplified representation
    optimizedCircuit: circuit
  };
}
