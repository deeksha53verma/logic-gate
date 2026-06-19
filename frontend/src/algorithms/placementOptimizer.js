/**
 * Placement Optimizer — Simulates IC placement on a PCB board
 * and runs a heuristic pairwise swap (refinement) to minimize Manhattan wire length.
 */

export function optimizePlacement(ics, connections = []) {
  if (!ics || ics.length === 0) {
    return {
      initialPlacement: [],
      optimizedPlacement: [],
      initialWireLength: 0,
      optimizedWireLength: 0,
      wireReduction: 0,
      boardWidth: 10,
      boardHeight: 8,
      wires: [],
      steps: [{ step: 1, action: 'No ICs to place', wireLength: 0 }]
    };
  }

  const steps = [];
  let stepCounter = 1;

  // Standard IC dimensions (in cm)
  const icW = 2.5;
  const icH = 1.5;

  steps.push({
    step: stepCounter++,
    action: 'Initialize Placement Engine',
    wireLength: 0,
    result: `Input: ${ics.length} ICs and ${connections.length} pin connections.`
  });

  // If no connections are passed, generate some dummy connections based on IC indices
  // so the PCB board visualization has actual wires drawing between chips
  let actualConnections = [...connections];
  if (actualConnections.length === 0 && ics.length > 1) {
    for (let i = 0; i < ics.length - 1; i++) {
      actualConnections.push({
        from: { ic: ics[i].icId || ics[i].id || `ic_${i}`, pin: 3 },
        to: { ic: ics[i+1].icId || ics[i+1].id || `ic_${i+1}`, pin: 1 }
      });
    }
  }

  // 1. Initial grid placement
  // Let's place ICs in a grid. Grid columns = Math.ceil(Math.sqrt(N))
  const cols = Math.ceil(Math.sqrt(ics.length));
  const spacingX = 3.5; // cm (horizontal pitch)
  const spacingY = 2.5; // cm (vertical pitch)

  const initialPlacement = ics.map((ic, idx) => {
    const r = Math.floor(idx / cols);
    const c = idx % cols;
    return {
      icId: ic.icId || ic.id || `ic_${idx}`,
      icName: ic.icName || ic.name || `Chip ${idx + 1}`,
      x: 1.5 + c * spacingX,
      y: 1.5 + r * spacingY,
      width: icW,
      height: icH
    };
  });

  // Calculate Manhattan wire length
  function calculateTotalWireLength(positions) {
    let length = 0;
    actualConnections.forEach(conn => {
      const pFrom = positions.find(p => p.icId === conn.from.ic);
      const pTo = positions.find(p => p.icId === conn.to.ic);
      
      if (pFrom && pTo) {
        // Manhattan distance between centers
        const dx = Math.abs(pFrom.x - pTo.x);
        const dy = Math.abs(pFrom.y - pTo.y);
        length += dx + dy;
      }
    });
    return parseFloat(length.toFixed(2));
  }

  const initialWireLength = calculateTotalWireLength(initialPlacement);

  steps.push({
    step: stepCounter++,
    action: 'Initial grid placement',
    wireLength: initialWireLength,
    result: `Placed ICs in a ${cols}-column grid. Wire length: ${initialWireLength} cm.`
  });

  // 2. Refinement loop (Pairwise Swap / Hill Climbing)
  // Try swapping positions of all pairs. Keep swap if total wire length decreases.
  let currentPlacement = JSON.parse(JSON.stringify(initialPlacement));
  let currentWireLength = initialWireLength;
  let improved = true;
  let iterations = 0;

  while (improved && iterations < 5) {
    improved = false;
    iterations++;

    for (let i = 0; i < currentPlacement.length; i++) {
      for (let j = i + 1; j < currentPlacement.length; j++) {
        // Try swap
        const tempX = currentPlacement[i].x;
        const tempY = currentPlacement[i].y;
        
        currentPlacement[i].x = currentPlacement[j].x;
        currentPlacement[i].y = currentPlacement[j].y;
        
        currentPlacement[j].x = tempX;
        currentPlacement[j].y = tempY;

        const newLength = calculateTotalWireLength(currentPlacement);
        
        if (newLength < currentWireLength) {
          currentWireLength = newLength;
          improved = true;
          steps.push({
            step: stepCounter++,
            action: `Swap ${currentPlacement[i].icId} and ${currentPlacement[j].icId}`,
            wireLength: currentWireLength,
            result: `Swap improved layout. Wire length reduced to ${currentWireLength} cm.`
          });
        } else {
          // Backtrack
          currentPlacement[j].x = currentPlacement[i].x;
          currentPlacement[j].y = currentPlacement[i].y;
          
          currentPlacement[i].x = tempX;
          currentPlacement[i].y = tempY;
        }
      }
    }
  }

  const optimizedWireLength = currentWireLength;
  const wireReduction = initialWireLength > 0 
    ? parseFloat(((initialWireLength - optimizedWireLength) / initialWireLength * 100).toFixed(1))
    : 0;

  // Board dimensions estimation based on max coordinates
  const maxX = Math.max(...currentPlacement.map(p => p.x + p.width), 5);
  const maxY = Math.max(...currentPlacement.map(p => p.y + p.height), 4);
  const boardWidth = parseFloat((maxX + 1.5).toFixed(1));
  const boardHeight = parseFloat((maxY + 1.5).toFixed(1));

  // Construct coordinates for drawing wires in UI
  const wires = actualConnections.map(conn => {
    const pFrom = currentPlacement.find(p => p.icId === conn.from.ic);
    const pTo = currentPlacement.find(p => p.icId === conn.to.ic);
    return {
      from: pFrom ? { x: pFrom.x + icW / 2, y: pFrom.y + icH / 2 } : { x: 0, y: 0 },
      to: pTo ? { x: pTo.x + icW / 2, y: pTo.y + icH / 2 } : { x: 0, y: 0 },
      icFrom: conn.from.ic,
      icTo: conn.to.ic
    };
  });

  steps.push({
    step: stepCounter++,
    action: 'Placement optimization complete',
    wireLength: optimizedWireLength,
    result: `Optimization finished in ${iterations} passes. Final reduction: ${wireReduction}%. Board size: ${boardWidth}×${boardHeight} cm.`
  });

  return {
    initialPlacement,
    optimizedPlacement: currentPlacement,
    initialWireLength,
    optimizedWireLength,
    wireReduction,
    boardWidth,
    boardHeight,
    wires,
    steps
  };
}
