import { getICById, getICForGateType } from '../ic-library/icLibrary';

/**
 * PCB Area Constant (cm² per DIP-14 chip)
 */
const PCB_AREA_PER_IC = 2.5;

/**
 * Packs gates into ICs of their respective native types.
 * @param {Object} circuit - { nodes, edges }
 */
export function mapToBasicGates(circuit) {
  if (!circuit || !circuit.nodes) {
    return createEmptyMapping();
  }

  // Filter gate nodes (excluding input/output)
  const gates = circuit.nodes.filter(
    n => n.type !== 'INPUT' && n.type !== 'OUTPUT'
  );

  const ics = [];
  const gateToIcMap = new Map(); // original gate ID -> { icIndex, slot }

  // 1. Pack gates into ICs greedily
  gates.forEach(gate => {
    // Determine inputs for this gate to select the right size IC
    const incoming = circuit.edges.filter(e => e.target === gate.id);
    const inputCount = incoming.length || 2; // default to 2

    const matchingIC = getICForGateType(gate.type, inputCount);
    if (!matchingIC) {
      console.warn(`No matching IC found for type ${gate.type} with ${inputCount} inputs.`);
      return;
    }

    // Find an existing IC of this type with space
    let targetIC = ics.find(
      ic => ic.icId === matchingIC.id && ic.usedSlots < ic.totalSlots
    );

    if (!targetIC) {
      targetIC = {
        id: matchingIC.id,
        name: matchingIC.name,
        icId: matchingIC.id,
        icName: matchingIC.name,
        gates: Array(matchingIC.gatesPerChip).fill(null),
        usedSlots: 0,
        usedGates: 0,
        totalSlots: matchingIC.gatesPerChip,
        totalGates: matchingIC.gatesPerChip,
        cost: matchingIC.cost,
        powerPerGate: matchingIC.powerPerGate || matchingIC.power,
        propagationDelay: matchingIC.propagationDelay || matchingIC.delay
      };
      ics.push(targetIC);
    }

    // Place gate in the first empty slot
    const slotIndex = targetIC.gates.findIndex(g => g === null);
    targetIC.gates[slotIndex] = { gateId: gate.id, type: gate.type };
    targetIC.usedSlots++;
    targetIC.usedGates++;

    gateToIcMap.set(gate.id, {
      icIndex: ics.indexOf(targetIC),
      slot: slotIndex
    });
  });

  return finalizeMapping(circuit, ics, gateToIcMap, gates.length);
}

/**
 * Converts all gates to NAND equivalents and packs into 7400/7410/7420/7430 chips.
 */
export function mapToNANDOnly(circuit) {
  if (!circuit || !circuit.nodes) {
    return createEmptyMapping();
  }

  // Count NAND gates required for each type of gate
  // NOT = 1 NAND
  // AND = 2 NANDs
  // OR = 3 NANDs
  // NAND = 1 NAND
  // NOR = 4 NANDs
  // XOR = 4 NANDs
  // XNOR = 5 NANDs
  const gates = circuit.nodes.filter(
    n => n.type !== 'INPUT' && n.type !== 'OUTPUT'
  );

  const ics = [];
  const gateToIcMap = new Map();
  let totalNandGatesNeeded = 0;

  const nandIC = getICById('7400'); // Quad 2-Input NAND
  if (!nandIC) {
    return createEmptyMapping();
  }

  gates.forEach(gate => {
    let multiplier = 2; // Default (AND)
    if (gate.type === 'NOT') multiplier = 1;
    else if (gate.type === 'AND') multiplier = 2;
    else if (gate.type === 'OR') multiplier = 3;
    else if (gate.type === 'NAND') multiplier = 1;
    else if (gate.type === 'NOR') multiplier = 4;
    else if (gate.type === 'XOR') multiplier = 4;
    else if (gate.type === 'XNOR') multiplier = 5;

    // Pack 'multiplier' number of 2-input NAND gates into 7400 ICs
    for (let i = 0; i < multiplier; i++) {
      let targetIC = ics.find(
        ic => ic.icId === nandIC.id && ic.usedSlots < ic.totalSlots
      );

      if (!targetIC) {
        targetIC = {
          id: nandIC.id,
          name: nandIC.name,
          icId: nandIC.id,
          icName: nandIC.name,
          gates: Array(nandIC.gatesPerChip).fill(null),
          usedSlots: 0,
          usedGates: 0,
          totalSlots: nandIC.gatesPerChip,
          totalGates: nandIC.gatesPerChip,
          cost: nandIC.cost,
          powerPerGate: nandIC.powerPerGate || nandIC.power,
          propagationDelay: nandIC.propagationDelay || nandIC.delay
        };
        ics.push(targetIC);
      }

      const slotIndex = targetIC.gates.findIndex(g => g === null);
      targetIC.gates[slotIndex] = { gateId: `${gate.id}_nand_${i}`, type: 'NAND' };
      targetIC.usedSlots++;
      targetIC.usedGates++;
      totalNandGatesNeeded++;

      // Map the original gate to the first NAND subgate IC for wire calculations
      if (i === 0) {
        gateToIcMap.set(gate.id, {
          icIndex: ics.indexOf(targetIC),
          slot: slotIndex
        });
      }
    }
  });

  return finalizeMapping(circuit, ics, gateToIcMap, totalNandGatesNeeded);
}

/**
 * Converts all gates to NOR equivalents and packs into 7402 NOR chips.
 */
export function mapToNOROnly(circuit) {
  if (!circuit || !circuit.nodes) {
    return createEmptyMapping();
  }

  const gates = circuit.nodes.filter(
    n => n.type !== 'INPUT' && n.type !== 'OUTPUT'
  );

  const ics = [];
  const gateToIcMap = new Map();
  let totalNorGatesNeeded = 0;

  const norIC = getICById('7402'); // Quad 2-Input NOR
  if (!norIC) {
    return createEmptyMapping();
  }

  gates.forEach(gate => {
    let multiplier = 3; // Default (AND equivalent is 3 NORs)
    if (gate.type === 'NOT') multiplier = 1;
    else if (gate.type === 'OR') multiplier = 2;
    else if (gate.type === 'AND') multiplier = 3;
    else if (gate.type === 'NOR') multiplier = 1;
    else if (gate.type === 'NAND') multiplier = 4;
    else if (gate.type === 'XOR') multiplier = 5;
    else if (gate.type === 'XNOR') multiplier = 4;

    for (let i = 0; i < multiplier; i++) {
      let targetIC = ics.find(
        ic => ic.icId === norIC.id && ic.usedSlots < ic.totalSlots
      );

      if (!targetIC) {
        targetIC = {
          id: norIC.id,
          name: norIC.name,
          icId: norIC.id,
          icName: norIC.name,
          gates: Array(norIC.gatesPerChip).fill(null),
          usedSlots: 0,
          usedGates: 0,
          totalSlots: norIC.gatesPerChip,
          totalGates: norIC.gatesPerChip,
          cost: norIC.cost,
          powerPerGate: norIC.powerPerGate || norIC.power,
          propagationDelay: norIC.propagationDelay || norIC.delay
        };
        ics.push(targetIC);
      }

      const slotIndex = targetIC.gates.findIndex(g => g === null);
      targetIC.gates[slotIndex] = { gateId: `${gate.id}_nor_${i}`, type: 'NOR' };
      targetIC.usedSlots++;
      targetIC.usedGates++;
      totalNorGatesNeeded++;

      if (i === 0) {
        gateToIcMap.set(gate.id, {
          icIndex: ics.indexOf(targetIC),
          slot: slotIndex
        });
      }
    }
  });

  return finalizeMapping(circuit, ics, gateToIcMap, totalNorGatesNeeded);
}

/**
 * Optimizes IC count by finding opportunities to share chips.
 * E.g., if NAND-only or NOR-only yields fewer chips, or if cascading logic fits better.
 */
export function mapToMixedOptimal(circuit) {
  const basic = mapToBasicGates(circuit);
  const nand = mapToNANDOnly(circuit);
  const nor = mapToNOROnly(circuit);

  // Find the implementation with the minimum number of ICs
  let best = basic;

  if (nand.totalICs < best.totalICs || (nand.totalICs === best.totalICs && nand.chipCost < best.chipCost)) {
    best = nand;
  }
  if (nor.totalICs < best.totalICs || (nor.totalICs === best.totalICs && nor.chipCost < best.chipCost)) {
    best = nor;
  }

  // Return a copy marked as Mixed Optimal
  return {
    ...best,
    label: 'Mixed Optimal'
  };
}

/**
 * Runs all mapping engines and returns an array of implementations.
 */
export function generateAllImplementations(circuit) {
  const basic = { ...mapToBasicGates(circuit), label: 'Basic Gates' };
  const nand = { ...mapToNANDOnly(circuit), label: 'NAND-Only' };
  const nor = { ...mapToNOROnly(circuit), label: 'NOR-Only' };
  const mixed = { ...mapToMixedOptimal(circuit), label: 'Mixed Optimal' };

  return [basic, nand, nor, mixed];
}

/* ─── Helper Functions ──────────────────────────────────────── */

function createEmptyMapping() {
  return {
    ics: [],
    totalICs: 0,
    totalGates: 0,
    unusedGates: 0,
    estimatedPCBArea: 0,
    wiringComplexity: 0,
    powerConsumption: 0,
    chipCost: 0
  };
}

function calculateCircuitDelay(circuit, mappingType) {
  if (!circuit || !circuit.nodes || circuit.nodes.length === 0) return 0;
  
  const nodes = circuit.nodes;
  const edges = circuit.edges;
  
  // Build adjacency list (incoming edges)
  const incoming = {};
  nodes.forEach(n => {
    incoming[n.id] = [];
  });
  edges.forEach(e => {
    if (incoming[e.target]) {
      incoming[e.target].push(e.source);
    }
  });
  
  const depthMemo = {};
  
  function getDepth(nodeId) {
    if (nodeId in depthMemo) return depthMemo[nodeId];
    
    const node = nodes.find(n => n.id === nodeId);
    if (!node || node.type === 'INPUT') {
      return 0;
    }
    
    const parents = incoming[nodeId] || [];
    if (parents.length === 0) {
      return 0;
    }
    
    const parentDepths = parents.map(pId => getDepth(pId));
    const depth = 1 + Math.max(...parentDepths);
    depthMemo[nodeId] = depth;
    return depth;
  }
  
  // Find max depth among all nodes
  let maxDepth = 0;
  nodes.forEach(n => {
    maxDepth = Math.max(maxDepth, getDepth(n.id));
  });
  
  // Estimate delay based on mapping type
  if (mappingType === 'NAND') {
    return maxDepth * 14; // roughly 2 NAND delays per level (14ns)
  } else if (mappingType === 'NOR') {
    return maxDepth * 16; // roughly 2 NOR delays per level (16ns)
  } else {
    return maxDepth * 9; // average 9ns per basic gate level
  }
}

function finalizeMapping(circuit, ics, gateToIcMap, gateCount) {
  const totalICs = ics.length;
  
  // Calculate unused gates
  let unusedGates = 0;
  ics.forEach(ic => {
    unusedGates += (ic.totalSlots - ic.usedSlots);
  });

  // PCB Area: 2.5 cm² per chip
  const estimatedPCBArea = parseFloat((totalICs * PCB_AREA_PER_IC).toFixed(2));

  // Wiring complexity: number of edges where source and target are on different ICs,
  // plus connections from INPUT nodes or to OUTPUT nodes.
  let wiringComplexity = 0;
  circuit.edges.forEach(edge => {
    const sourceNode = circuit.nodes.find(n => n.id === edge.source);
    const targetNode = circuit.nodes.find(n => n.id === edge.target);
    
    if (!sourceNode || !targetNode) return;

    const sourceMapped = gateToIcMap.get(edge.source);
    const targetMapped = gateToIcMap.get(edge.target);

    if (sourceNode.type === 'INPUT' || targetNode.type === 'OUTPUT') {
      wiringComplexity++;
    } else if (sourceMapped && targetMapped) {
      if (sourceMapped.icIndex !== targetMapped.icIndex) {
        wiringComplexity++;
      }
    } else {
      wiringComplexity++; // default fallback
    }
  });

  // Power consumption (mW) = sum of (power per active gate) for each IC
  // Standard TTL gates consume ~2-5mW per active gate
  let powerConsumption = 0;
  ics.forEach(ic => {
    powerConsumption += ic.usedSlots * ic.powerPerGate;
  });
  powerConsumption = parseFloat(powerConsumption.toFixed(2));

  // Cost calculation ($)
  let chipCost = 0;
  ics.forEach(ic => {
    chipCost += ic.cost;
  });
  chipCost = parseFloat(chipCost.toFixed(2));

  // Estimate delay based on IC types present
  let mappingType = 'BASIC';
  if (ics.length > 0) {
    const firstIc = getICById(ics[0].icId);
    if (firstIc) {
      if (firstIc.gateType === 'NAND') mappingType = 'NAND';
      else if (firstIc.gateType === 'NOR') mappingType = 'NOR';
    }
  }
  const estimatedDelay = calculateCircuitDelay(circuit, mappingType);

  return {
    ics,
    totalICs,
    icCount: totalICs,
    totalGates: gateCount,
    gateCount: gateCount,
    gates: gateCount,
    unusedGates,
    unused: unusedGates,
    estimatedPCBArea,
    pcbArea: estimatedPCBArea,
    area: estimatedPCBArea,
    wiringComplexity,
    powerConsumption,
    totalPower: powerConsumption,
    power: powerConsumption,
    chipCost,
    totalCost: chipCost,
    cost: chipCost,
    totalDelay: estimatedDelay,
    delay: estimatedDelay,
    propagationDelay: estimatedDelay
  };
}

