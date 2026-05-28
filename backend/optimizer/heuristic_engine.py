from sympy import symbols, SOPform, POSform, simplify_logic, false, true
from simplifier.factoring import factor_expression
from simplifier.branch_and_bound import factor_expression_bb, count_gates
from visualization.circuit_generator import generate_circuit_from_expr, get_circuit_analytics

def evaluate_method(expr, name):
    circuit = generate_circuit_from_expr(expr)
    analytics = get_circuit_analytics(circuit)
    
    # Heuristic Cost Score: we prioritize fewer gates, then lower delay, then lower hardware cost
    score = (analytics["gate_count"] * 10) + (analytics["total_delay_ns"] * 5) + (analytics["cost"] * 2)
    
    return {
        "name": name,
        "expression": str(expr),
        "expr_obj": expr,
        "circuit": circuit,
        "gate_count": analytics["gate_count"],
        "cost": analytics["cost"],
        "depth": analytics["depth"],
        "total_delay_ns": analytics["total_delay_ns"],
        "score": score
    }

def select_best_circuit(table, variables):
    """
    Compares SOP, POS, Algebraic Factoring, and Branch & Bound Factoring.
    Selects the best circuit based on gate count, delay, and cost.
    Returns the winner details and comparative statistics.
    """
    syms = symbols(' '.join(variables))
    if len(variables) == 1:
        syms = [syms]
    else:
        syms = list(syms)

    n = len(syms)
    
    # 1. Get minterms
    minterms = [i for i, val in enumerate(table) if val == 1]
    if not minterms:
        # Trivial 0 circuit
        winner_expr = false
        winner_circuit = generate_circuit_from_expr(winner_expr)
        return {
            "winner_name": "Trivial Zero",
            "winner_expr": "0",
            "winner_expr_obj": winner_expr,
            "winner_circuit": winner_circuit,
            "reason": "The truth table output is always 0. No gates are needed.",
            "comparison": [],
            "bb_stats": {"states_explored": 0, "states_pruned": 0}
        }
    if len(minterms) == 2**n:
        # Trivial 1 circuit
        winner_expr = true
        winner_circuit = generate_circuit_from_expr(winner_expr)
        return {
            "winner_name": "Trivial One",
            "winner_expr": "1",
            "winner_expr_obj": winner_expr,
            "winner_circuit": winner_circuit,
            "reason": "The truth table output is always 1. No gates are needed.",
            "comparison": [],
            "bb_stats": {"states_explored": 0, "states_pruned": 0}
        }



    # Generate expressions
    # A. SOP
    sop_expr = SOPform(syms, minterms)
    
    # B. POS
    pos_expr = POSform(syms, minterms)
    
    # C. Algebraic Factoring (using SOP as starting point)
    alg_factored = factor_expression(sop_expr)
    
    # D. Branch & Bound Factoring (using SOP as starting point)
    bb_factored, states_explored, states_pruned = factor_expression_bb(sop_expr)

    # Evaluate each
    candidates = [
        evaluate_method(sop_expr, "K-map SOP (Quine-McCluskey)"),
        evaluate_method(pos_expr, "POS (Product of Sums)"),
        evaluate_method(alg_factored, "Algebraic Factoring (Transform & Conquer)"),
        evaluate_method(bb_factored, "Branch & Bound Factoring (State-space Optimal)")
    ]

    # Sort by score ascending (lower score is better)
    candidates.sort(key=lambda c: c["score"])
    winner = candidates[0]

    # Draft a detailed comparison reason
    reason_parts = [
        f"Selected '{winner['name']}' as it achieves the lowest heuristic complexity score of {winner['score']:.1f}."
    ]
    
    # Find if there are specific trade-offs
    gate_sorted = sorted(candidates, key=lambda c: c["gate_count"])
    delay_sorted = sorted(candidates, key=lambda c: c["total_delay_ns"])
    
    if gate_sorted[0]["name"] == winner["name"]:
        reason_parts.append(f"It minimizes gate count to {winner['gate_count']}.")
    else:
        reason_parts.append(f"It offers a balanced trade-off compared to '{gate_sorted[0]['name']}' (which has only {gate_sorted[0]['gate_count']} gates but higher delay).")

    if delay_sorted[0]["name"] == winner["name"]:
        reason_parts.append(f"It minimizes propagation delay to {winner['total_delay_ns']}ns.")
    else:
        reason_parts.append(f"It runs with {winner['total_delay_ns']}ns delay, which is optimized for cost-efficiency.")

    reason = " ".join(reason_parts)

    # Prepare comparison data for frontend charts
    comparison_data = []
    for c in candidates:
        comparison_data.append({
            "name": c["name"],
            "expression": c["expression"],
            "gate_count": c["gate_count"],
            "cost": c["cost"],
            "depth": c["depth"],
            "total_delay_ns": c["total_delay_ns"],
            "score": round(c["score"], 1)
        })

    return {
        "winner_name": winner["name"],
        "winner_expr": winner["expression"],
        "winner_expr_obj": winner["expr_obj"],
        "winner_circuit": winner["circuit"],
        "reason": reason,
        "comparison": comparison_data,
        "bb_stats": {
            "states_explored": states_explored,
            "states_pruned": states_pruned
        }
    }
