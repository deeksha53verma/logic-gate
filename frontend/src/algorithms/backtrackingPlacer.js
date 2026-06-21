import { getICForGateType } from '../ic-library/icLibrary';

/**
 * Backtracking search to find all valid gate-to-IC mappings.
 * @param {Array|Object} gatesInput - Array of gate objects or circuit
 */
export function backtrackingPlace(gatesInput) {
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

  if (gates.length === 0) {
    return {
      solutions: [],
      totalSolutions: 0,
      bestSolution: null,
      worstSolution: null,
      steps: [{ step: 1, action: 'No gates provided', result: 'no action' }]
    };
  }

  const steps = [];
  let stepCounter = 1;
  const solutions = [];
  
  steps.push({
    step: stepCounter++,
    action: 'Initialize Backtracking Placer',
    result: `Will explore valid packing combinations for ${gates.length} gates.`
  });

  // DFS search for all valid solutions (capped at 10 to keep it highly responsive)
  function explore(gateIdx, currentICs) {
    // Capping solutions list for UI responsiveness
    if (solutions.length >= 10) return;

    // Base case: all gates placed
    if (gateIdx >= gates.length) {
      const clonedICs = JSON.parse(JSON.stringify(currentICs));
      
      // Calculate score (total cost)
      let cost = 0;
      clonedICs.forEach(ic => {
        const matchingIC = getICForGateType(ic.icId, 2);
        cost += matchingIC ? matchingIC.cost : 0.35;
      });

      solutions.push({
        id: solutions.length + 1,
        ics: clonedICs,
        totalICs: clonedICs.length,
        cost: parseFloat(cost.toFixed(2)),
        isOptimal: false // will flag later
      });

      steps.push({
        step: stepCounter++,
        action: 'Found complete valid mapping!',
        result: `Solution #${solutions.length}: uses ${clonedICs.length} ICs (Cost: $${cost.toFixed(2)})`
      });
      return;
    }

    const gate = gates[gateIdx];
    const matchingIC = getICForGateType(gate.type, gate.inputs);
    if (!matchingIC) return;

    // Branch 1: Try placing in existing ICs of this type that have slots open
    for (let i = 0; i < currentICs.length; i++) {
      const ic = currentICs[i];
      if (ic.icId === matchingIC.id && ic.usedSlots < ic.totalSlots) {
        // Place in this IC
        const slotIdx = ic.slots.findIndex(s => s === null);
        ic.slots[slotIdx] = gate.id;
        ic.usedSlots++;

        if (stepCounter < 100) {
          steps.push({
            step: stepCounter++,
            action: `Try placing ${gate.id} in Chip #${i + 1} (${ic.icId})`,
            result: `Valid. Occupied Slot ${slotIdx}.`
          });
        }

        explore(gateIdx + 1, currentICs);

        // Backtrack
        ic.slots[slotIdx] = null;
        ic.usedSlots--;

        if (stepCounter < 100) {
          steps.push({
            step: stepCounter++,
            action: `Backtrack from Chip #${i + 1} for gate ${gate.id}`,
            result: 'Removed gate from slot, exploring next branch.'
          });
        }
      }
    }

    // Branch 2: Always try opening a new IC for this gate
    const newIC = {
      icId: matchingIC.id,
      icName: matchingIC.name,
      slots: Array(matchingIC.gatesPerChip).fill(null),
      usedSlots: 1,
      totalSlots: matchingIC.gatesPerChip
    };
    newIC.slots[0] = gate.id;

    currentICs.push(newIC);
    
    if (stepCounter < 100) {
      steps.push({
        step: stepCounter++,
        action: `Try placing ${gate.id} in a new ${matchingIC.id} chip`,
        result: `Valid. Opened Chip #${currentICs.length}.`
      });
    }

    explore(gateIdx + 1, currentICs);

    // Backtrack
    currentICs.pop();
  }

  // Start backtracking DFS
  explore(0, []);

  // Determine best, worst, and mark optimal
  let bestSolution = null;
  let worstSolution = null;

  if (solutions.length > 0) {
    // Sort by total IC count ascending, then cost ascending
    solutions.sort((a, b) => {
      if (a.totalICs !== b.totalICs) return a.totalICs - b.totalICs;
      return a.cost - b.cost;
    });

    // Mark the best ones as optimal
    const minICs = solutions[0].totalICs;
    solutions.forEach(sol => {
      if (sol.totalICs === minICs) {
        sol.isOptimal = true;
      }
    });

    bestSolution = solutions[0];
    worstSolution = solutions[solutions.length - 1];

    steps.push({
      step: stepCounter++,
      action: 'Backtracking analysis finished',
      result: `Found ${solutions.length} valid configurations. Best: ${bestSolution.totalICs} ICs. Worst: ${worstSolution.totalICs} ICs.`
    });
  }

  return {
    solutions,
    totalSolutions: solutions.length,
    bestSolution,
    worstSolution,
    steps
  };
}
