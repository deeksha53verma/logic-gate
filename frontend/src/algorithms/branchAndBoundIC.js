import { getICForGateType } from '../ic-library/icLibrary';
import { greedyPackGates } from './greedyICPacker';

/**
 * Branch and Bound search for optimal gate-to-IC mapping.
 * @param {Array|Object} gatesInput - Array of gate objects or circuit
 */
export function branchAndBoundICSearch(gatesInput) {
  let gates = [];
  
  if (gatesInput && gatesInput.nodes) {
    gates = gatesInput.nodes.filter(
      n => n.type !== 'INPUT' && n.type !== 'OUTPUT'
    ).map(n => {
      const incoming = gatesInput.edges.filter(e => e.target === n.id);
      return {
        id: n.id,
        type: n.type,
        inputs: incoming.length || 2
      };
    });
  } else if (Array.isArray(gatesInput)) {
    gates = [...gatesInput];
  }

  // Base case: no gates
  if (gates.length === 0) {
    return {
      bestSolution: { ics: [], totalICs: 0, cost: 0 },
      nodesExplored: 0,
      nodesPruned: 0,
      bestCost: 0,
      pruningReasons: [],
      searchTree: []
    };
  }

  // 1. Get initial upper bound from Greedy packer
  const greedySolution = greedyPackGates(gates);
  let bestCost = greedySolution.totalICs;
  let bestSolutionICs = JSON.parse(JSON.stringify(greedySolution.ics));

  // Search statistics
  let nodesExplored = 0;
  let nodesPruned = 0;
  const pruningReasons = [];
  const searchTree = [];
  let nodeIdCounter = 0;

  // Add root node to tree
  searchTree.push({
    id: 0,
    parentId: null,
    depth: 0,
    bound: bestCost,
    pruned: false,
    action: 'Root: Initialized with Greedy cost = ' + bestCost
  });

  // Calculate lower bound for a given set of remaining gates
  function calculateLowerBound(currentICCount, remainingGates) {
    const typeCounts = {};
    remainingGates.forEach(g => {
      typeCounts[g.type] = (typeCounts[g.type] || 0) + 1;
    });

    let extraICsNeeded = 0;
    Object.entries(typeCounts).forEach(([type, count]) => {
      const matchingIC = getICForGateType(type, 2); // approximate inputs as 2
      const capacity = matchingIC ? matchingIC.gatesPerChip : 4;
      extraICsNeeded += Math.ceil(count / capacity);
    });

    return currentICCount + extraICsNeeded;
  }

  // DFS search function
  function search(gateIndex, currentICs, parentNodeId) {
    nodesExplored++;
    
    // Safety limit to keep search fast in the browser
    if (nodesExplored > 800) return;

    const currentNodeId = ++nodeIdCounter;

    // Base case: all gates assigned
    if (gateIndex >= gates.length) {
      const currentCost = currentICs.length;
      searchTree.push({
        id: currentNodeId,
        parentId: parentNodeId,
        depth: gateIndex,
        bound: currentCost,
        pruned: false,
        action: `Leaf: All gates placed. Cost = ${currentCost}`
      });

      if (currentCost < bestCost) {
        bestCost = currentCost;
        bestSolutionICs = JSON.parse(JSON.stringify(currentICs));
      }
      return;
    }

    const currentGate = gates[gateIndex];

    // Calculate lower bound
    const lb = calculateLowerBound(currentICs.length, gates.slice(gateIndex));

    // Bound check (Pruning)
    if (lb >= bestCost) {
      nodesPruned++;
      const reason = `Node ${currentNodeId} (depth ${gateIndex}): LB=${lb} ≥ best=${bestCost}. Pruned.`;
      if (pruningReasons.length < 20) {
        pruningReasons.push(reason);
      }
      
      searchTree.push({
        id: currentNodeId,
        parentId: parentNodeId,
        depth: gateIndex,
        bound: lb,
        pruned: true,
        action: `Prune: Gate ${currentGate.id} (${currentGate.type}). LB=${lb} >= best=${bestCost}`
      });
      return;
    }

    searchTree.push({
      id: currentNodeId,
      parentId: parentNodeId,
      depth: gateIndex,
      bound: lb,
      pruned: false,
      action: `Branch: Placing gate ${currentGate.id} (${currentGate.type})`
    });

    const matchingIC = getICForGateType(currentGate.type, currentGate.inputs);
    if (!matchingIC) return;

    // Option A: Try placing in existing compatible ICs that have space
    for (let i = 0; i < currentICs.length; i++) {
      const ic = currentICs[i];
      if (ic.icId === matchingIC.id && ic.usedSlots < ic.totalSlots) {
        // Place gate
        const backupSlots = [...ic.slots];
        const slotIdx = ic.slots.findIndex(s => s.gateId === null);
        
        ic.slots[slotIdx] = { gateId: currentGate.id, slot: slotIdx };
        ic.usedSlots++;

        search(gateIndex + 1, currentICs, currentNodeId);

        // Backtrack
        ic.slots = backupSlots;
        ic.usedSlots--;
      }
    }

    // Option B: Try placing in a brand new IC
    const newIC = {
      icId: matchingIC.id,
      icType: matchingIC.id,
      icName: matchingIC.name,
      slots: Array(matchingIC.gatesPerChip).fill(null).map((_, i) => ({ gateId: null, slot: i })),
      usedSlots: 1,
      totalSlots: matchingIC.gatesPerChip,
      cost: matchingIC.cost
    };
    newIC.slots[0] = { gateId: currentGate.id, slot: 0 };

    currentICs.push(newIC);
    search(gateIndex + 1, currentICs, currentNodeId);
    currentICs.pop(); // Backtrack
  }

  // Run Branch & Bound
  search(0, [], 0);

  // Total cost calculation for winner ICs
  let totalCost = 0;
  bestSolutionICs.forEach(ic => {
    const matchingIC = getICForGateType(ic.icId, 2);
    totalCost += matchingIC ? matchingIC.cost : 0.35;
  });

  return {
    bestSolution: {
      ics: bestSolutionICs,
      totalICs: bestCost,
      cost: parseFloat(totalCost.toFixed(2))
    },
    nodesExplored,
    nodesPruned,
    bestCost,
    pruningReasons,
    searchTree: searchTree.slice(0, 100) // limit search tree nodes for UI render limits
  };
}
