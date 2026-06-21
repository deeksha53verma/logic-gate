import { getICForGateType } from '../ic-library/icLibrary';

/**
 * Greedy first-fit bin packer for mapping gates to ICs.
 * @param {Array|Object} gatesInput - Array of gate objects or circuit object
 */
export function greedyPackGates(gatesInput) {
  let gates = [];
  
  if (gatesInput && gatesInput.nodes) {
    // Extract gates from circuit object
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

  const steps = [];
  let stepCounter = 1;
  const assignments = [];
  const ics = []; // list of open IC instances

  // 1. Sort gates: group by type, then by inputs descending
  const sortedGates = [...gates].sort((a, b) => {
    if (a.type !== b.type) return a.type.localeCompare(b.type);
    return b.inputs - a.inputs;
  });

  steps.push({
    step: stepCounter++,
    gate: 'All Gates',
    decision: `Sorted ${gates.length} gates by type and size (inputs descending).`,
    remainingGates: sortedGates.map(g => g.id),
    icCapacity: []
  });

  // 2. Pack gates one by one
  sortedGates.forEach(gate => {
    const matchingIC = getICForGateType(gate.type, gate.inputs);
    
    if (!matchingIC) {
      steps.push({
        step: stepCounter++,
        gate: gate.id,
        decision: `❌ FAILED: No matching IC in library for type ${gate.type} with ${gate.inputs} inputs.`,
        remainingGates: [],
        icCapacity: []
      });
      return;
    }

    // Find the first opened IC of this exact type that has room
    let icIndex = ics.findIndex(
      ic => ic.icId === matchingIC.id && ic.usedSlots < ic.totalSlots
    );

    let decisionText = '';

    if (icIndex !== -1) {
      // Fit into existing chip
      const targetIC = ics[icIndex];
      const slotIndex = targetIC.slots.findIndex(s => s.gateId === null);
      targetIC.slots[slotIndex] = { gateId: gate.id, slot: slotIndex };
      targetIC.usedSlots++;
      
      assignments.push({
        gateId: gate.id,
        icIndex,
        icType: matchingIC.id,
        slot: slotIndex
      });

      decisionText = `Placed in existing ${matchingIC.id} (Chip #${icIndex + 1}), Slot ${slotIndex}.`;
    } else {
      // Open new chip
      const newIC = {
        icId: matchingIC.id,
        icType: matchingIC.id,
        icName: matchingIC.name,
        slots: Array(matchingIC.gatesPerChip).fill(null).map((_, i) => ({ gateId: null, slot: i })),
        usedSlots: 1,
        totalSlots: matchingIC.gatesPerChip
      };
      
      newIC.slots[0] = { gateId: gate.id, slot: 0 };
      ics.push(newIC);
      icIndex = ics.length - 1;

      assignments.push({
        gateId: gate.id,
        icIndex,
        icType: matchingIC.id,
        slot: 0
      });

      decisionText = `Opened new ${matchingIC.id} (Chip #${ics.length}). Placed in Slot 0.`;
    }

    steps.push({
      step: stepCounter++,
      gate: `${gate.id} (${gate.type})`,
      decision: decisionText,
      remainingGates: sortedGates.slice(sortedGates.indexOf(gate) + 1).map(g => g.id),
      icCapacity: ics.map((ic, idx) => `Chip #${idx + 1} (${ic.icId}): ${ic.usedSlots}/${ic.totalSlots} slots used`)
    });
  });

  // Calculate unused gates
  let unusedGates = 0;
  ics.forEach(ic => {
    unusedGates += (ic.totalSlots - ic.usedSlots);
  });

  return {
    assignments,
    ics,
    totalICs: ics.length,
    unusedGates,
    steps
  };
}
