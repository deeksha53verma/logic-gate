from sympy import symbols

def verify_equivalence(expr_naive, expr_opt, variables):
    """
    Exhaustively checks if the naive expression and the optimized expression
    produce identical outputs for all 2^n input combinations.
    """
    syms = symbols(' '.join(variables))
    if len(variables) == 1:
        syms = [syms]
    else:
        syms = list(syms)
        
    n = len(syms)
    mismatches = []
    success = True
    
    # Exhaustive evaluation of all states (State Traversal)
    for i in range(2**n):
        binary = format(i, f'0{n}b')
        eval_dict = {syms[j]: int(binary[j]) for j in range(n)}
        
        # Evaluate naive
        val_naive = bool(expr_naive.subs(eval_dict))
        # Evaluate optimized
        val_opt = bool(expr_opt.subs(eval_dict))
        
        if val_naive != val_opt:
            success = False
            mismatches.append({
                "inputs": {variables[j]: int(binary[j]) for j in range(n)},
                "naive_val": int(val_naive),
                "opt_val": int(val_opt)
            })
            
    return {
        "is_equivalent": success,
        "total_cases": 2**n,
        "mismatches": mismatches
    }
