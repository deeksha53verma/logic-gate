/**
 * Transform and Conquer Optimizer — factors Boolean expressions
 * to reduce overall logic gate count (e.g. AB + AC → A(B + C))
 */

export function transformExpression(expressionStr) {
  if (!expressionStr || typeof expressionStr !== 'string') {
    return {
      original: '',
      transformed: '',
      originalGates: 0,
      transformedGates: 0,
      gateReduction: 0,
      steps: [{ step: 1, action: 'No expression provided', result: 'no action' }],
      timeComplexity: 'O(1)',
      spaceComplexity: 'O(1)'
    };
  }

  const steps = [];
  let stepCounter = 1;

  // Cleanup spaces and standardise operators
  const original = expressionStr.trim();
  let cleanExpr = original.replace(/\s+/g, '');
  
  steps.push({
    step: stepCounter++,
    action: 'Pre-process expression',
    result: `Input: "${original}". Standardized: "${cleanExpr}"`
  });

  // 1. Parse expression into SOP terms (split by '+' or '|')
  const terms = cleanExpr.split(/[+|]/).map(t => t.trim()).filter(Boolean);

  steps.push({
    step: stepCounter++,
    action: 'Parse product terms',
    result: `Identified ${terms.length} product terms: [${terms.join(', ')}]`
  });

  if (terms.length <= 1) {
    steps.push({
      step: stepCounter++,
      action: 'Check factorability',
      result: `Cannot factor expression with fewer than 2 terms. Output remains unchanged.`
    });

    return {
      original,
      transformed: original,
      originalGates: estimateSOPGates(terms),
      transformedGates: estimateSOPGates(terms),
      gateReduction: 0,
      steps,
      timeComplexity: 'O(n × m)',
      spaceComplexity: 'O(n)'
    };
  }

  // Helper to count gates in standard SOP
  // E.g. ABC + DEF is 2 AND gates (3-inputs or cascaded) + 1 OR gate.
  function estimateSOPGates(termList) {
    if (termList.length === 0) return 0;
    let andGates = 0;
    termList.forEach(t => {
      // number of literals in term - 1
      andGates += Math.max(0, t.replace(/[^A-Z]/gi, '').length - 1);
    });
    const orGates = Math.max(0, termList.length - 1);
    return andGates + orGates;
  }

  const originalGates = estimateSOPGates(terms);

  // 2. Count literal frequencies across terms
  const freq = {};
  terms.forEach(t => {
    // Unique literals in this term
    const lits = new Set(t.replace(/[^A-Z]/gi, '').split(''));
    lits.forEach(lit => {
      freq[lit] = (freq[lit] || 0) + 1;
    });
  });

  // Find most frequent literal
  let bestLit = null;
  let maxFreq = 1;
  Object.entries(freq).forEach(([lit, count]) => {
    if (count > maxFreq) {
      maxFreq = count;
      bestLit = lit;
    }
  });

  steps.push({
    step: stepCounter++,
    action: 'Analyze literal frequencies',
    result: `Frequencies: ${Object.entries(freq).map(([l, f]) => `${l}:${f}`).join(', ')}. Most frequent factor: "${bestLit}" (in ${maxFreq} terms).`
  });

  let transformed = original;
  let transformedGates = originalGates;

  if (bestLit && maxFreq > 1) {
    // 3. Divide terms into those with the common factor and those without
    const withFactor = [];
    const withoutFactor = [];

    terms.forEach(t => {
      if (t.includes(bestLit)) {
        withFactor.push(t.replace(new RegExp(bestLit, 'g'), '')); // remove factor
      } else {
        withoutFactor.push(t);
      }
    });

    // Clean up empty terms (which means just the factor itself, e.g. A + AB -> A(1+B) -> A)
    const factorRemainder = withFactor.map(r => r === '' ? '1' : r);

    // Format factored expression
    const factoredPart = `${bestLit}(${factorRemainder.join(' + ')})`;
    const remainderPart = withoutFactor.length > 0 ? ` + ${withoutFactor.join(' + ')}` : '';
    transformed = factoredPart + remainderPart;

    steps.push({
      step: stepCounter++,
      action: `Factor out common term "${bestLit}"`,
      result: `Factored: "${factoredPart}". Remainder: "${withoutFactor.join(' + ') || 'None'}"`
    });

    // Recalculate gates for factored expression
    // E.g. A(B+C) is 1 OR (B+C) + 1 AND (A * OR_result)
    let extraGates = 0;
    // OR inside parenthesis
    extraGates += Math.max(0, factorRemainder.length - 1);
    // AND gates inside parenthesis
    factorRemainder.forEach(r => {
      if (r !== '1') {
        extraGates += Math.max(0, r.replace(/[^A-Z]/gi, '').length - 1);
      }
    });
    // AND with factored term
    extraGates += 1;
    // Remainder ORs
    if (withoutFactor.length > 0) {
      extraGates += withoutFactor.length;
      withoutFactor.forEach(w => {
        extraGates += Math.max(0, w.replace(/[^A-Z]/gi, '').length - 1);
      });
    }

    transformedGates = extraGates;

    steps.push({
      step: stepCounter++,
      action: 'Estimate factored gate count',
      result: `Factored Gates: ${transformedGates} (Original: ${originalGates}).`
    });
  } else {
    steps.push({
      step: stepCounter++,
      action: 'Factorization check',
      result: 'No common factors with frequency > 1 found. Output remains in standard SOP form.'
    });
  }

  const gateReduction = Math.max(0, originalGates - transformedGates);

  steps.push({
    step: stepCounter++,
    action: 'Transform and Conquer complete',
    result: `Total gate reduction: ${gateReduction} gates.`
  });

  return {
    original,
    transformed,
    originalGates,
    transformedGates,
    gateReduction,
    steps,
    timeComplexity: 'O(n × m) where n = terms, m = literals per term',
    spaceComplexity: 'O(n × m)'
  };
}
