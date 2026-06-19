/**
 * Cost Engine — computes manufacturing, area, delay, and routing cost penalties
 */

/**
 * Calculates the total optimization/manufacturing cost for a given IC mapping.
 * @param {Object} mapping - Mapped IC results from icMappingEngine
 */
export function calculateTotalCost(mapping) {
  if (!mapping) {
    return {
      icCost: 0,
      unusedGatePenalty: 0,
      delayPenalty: 0,
      powerPenalty: 0,
      routingPenalty: 0,
      boardAreaCost: 0,
      manufacturingComplexity: 0,
      totalCost: 0,
      breakdown: []
    };
  }

  const unusedGates = mapping.unusedGates ?? 0;
  const totalICs = mapping.totalICs ?? 0;
  const delay = mapping.totalDelay ?? mapping.delay ?? 0;
  const power = mapping.powerConsumption ?? mapping.totalPower ?? 0;
  const wiringComplexity = mapping.wiringComplexity ?? 0;
  const area = mapping.estimatedPCBArea ?? 0;

  // Individual cost items
  const icCost = mapping.chipCost ?? mapping.cost ?? 0;
  const unusedGatePenalty = parseFloat((unusedGates * 0.05).toFixed(2));
  const delayPenalty = parseFloat(((delay / 10) * 0.10).toFixed(2));
  const powerPenalty = parseFloat(((power / 100) * 0.15).toFixed(2));
  const routingPenalty = parseFloat((wiringComplexity * 0.02).toFixed(2));
  const boardAreaCost = parseFloat((area * 0.10).toFixed(2));

  // Manufacturing complexity indicator (arbitrary complexity score)
  const manufacturingComplexity = parseFloat(((totalICs * 0.3) + (wiringComplexity * 0.1)).toFixed(2));

  // Sum total cost
  const totalCost = parseFloat(
    (icCost + unusedGatePenalty + delayPenalty + powerPenalty + routingPenalty + boardAreaCost).toFixed(2)
  );

  return {
    icCost,
    unusedGatePenalty,
    delayPenalty,
    powerPenalty,
    routingPenalty,
    boardAreaCost,
    manufacturingComplexity,
    totalCost,
    breakdown: [
      { name: 'IC Purchase Cost', value: icCost, color: '#3b82f6' },
      { name: 'Unused Silicon Penalty', value: unusedGatePenalty, color: '#ef4444' },
      { name: 'Propagation Delay Penalty', value: delayPenalty, color: '#f59e0b' },
      { name: 'Power Consumption Penalty', value: powerPenalty, color: '#10b981' },
      { name: 'Wiring Routing Penalty', value: routingPenalty, color: '#a855f7' },
      { name: 'Board Area Cost', value: boardAreaCost, color: '#06b6d4' }
    ]
  };
}

/**
 * Compares costs across multiple implementation strategies.
 * @param {Array} implementations - Array of mapping results
 */
export function compareCosts(implementations) {
  if (!implementations || implementations.length === 0) return [];
  
  return implementations.map(impl => {
    const costBreakdown = calculateTotalCost(impl);
    return {
      label: impl.label,
      ...costBreakdown
    };
  });
}
