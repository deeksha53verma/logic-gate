from flask import Flask, request, jsonify
from flask_cors import CORS
from sympy import symbols, Or, And, Not, false, true
from sympy.logic.boolalg import SOPform, POSform, simplify_logic
from visualization.circuit_generator import generate_circuit_from_expr, get_circuit_analytics, generate_expression_tree

# Import new DAA Optimization components
from simplifier.memoized_simplifier import MemoizedSimplifier
from simplifier.greedy_kmap import solve_greedy_kmap
from simulator.equivalence_verifier import verify_equivalence
from optimizer.heuristic_engine import select_best_circuit

app = Flask(__name__)
CORS(app)

@app.route("/")
@app.route("/api/")
def home():
    return "Logic Gate Synthesizer Running!"

@app.route("/test", methods=["GET"])
@app.route("/api/test", methods=["GET"])
def test():
    return jsonify({"message": "Backend working!"})

@app.route("/generate", methods=["POST"])
@app.route("/api/generate", methods=["POST"])
def generate_expression():
    data = request.json
    variable_names = data["variables"]
    table = data["table"]

    # Sympy symbols
    syms = symbols(' '.join(variable_names))
    if len(variable_names) == 1:
        syms = [syms]
    else:
        syms = list(syms)

    n = len(syms)
    
    # 1. Get minterms where output is 1
    minterms = []
    for i, output in enumerate(table):
        if int(output) == 1:
            binary = format(i, f'0{n}b')
            minterm = [int(b) for b in binary]
            minterms.append(minterm)

    if not minterms:
        # Trivial Zero
        naive_circuit = generate_circuit_from_expr(false)

        return jsonify({
            "original_sop": "0",
            "original_pos": "0",
            "simplified": "0",
            "factored_expr": "0",
            "winner_name": "Trivial Zero",
            "winner_expr": "0",
            "naive_circuit": naive_circuit,
            "optimized_circuit": naive_circuit,
            "factored_circuit": naive_circuit,
            "step_by_step": ["Step 1: The truth table output is always 0. No gates required."],
            "analytics": {
                "naive": {"gate_count": 0, "cost": 0, "depth": 0, "total_delay_ns": 0},
                "optimized": {"gate_count": 0, "cost": 0, "depth": 0, "total_delay_ns": 0},
                "winner": {"gate_count": 0, "cost": 0, "depth": 0, "total_delay_ns": 0},
                "saved_gates": 0
            },
            "greedy_kmap_steps": [],
            "equivalence": {"is_equivalent": True, "total_cases": 2**n, "mismatches": []},
            "memoization_report": {"lookups": 0, "cache_hits": 0, "saved_operations": 0, "reduction_percentage": 0},
            "bb_report": {"states_explored": 0, "states_pruned": 0},
            "expression_tree": {"nodes": [{"id": "treenode_const", "type": "VARIABLE", "label": "0"}], "edges": []},
            "heuristic_report": {
                "winner_name": "Trivial Zero",
                "winner_expr": "0",
                "reason": "The truth table output is always 0. No gates are needed.",
                "comparison": []
            }
        })


    # 2. Build Naive SOP
    naive_terms = []
    for minterm in minterms:
        term_vars = []
        for j, bit in enumerate(minterm):
            if bit == 1:
                term_vars.append(syms[j])
            else:
                term_vars.append(Not(syms[j]))
        naive_terms.append(And(*term_vars))
        
    sop_expr = Or(*naive_terms)

    # 3. Simplify with Dynamic Programming/Memoization
    memo_simplifier = MemoizedSimplifier()
    simplified_expr = memo_simplifier.simplify(sop_expr)
    memo_stats = memo_simplifier.get_stats()

    # 4. Generate SOP and POS using K-map (for analysis comparison)
    pos_expr = POSform(syms, minterms)

    # 5. Run Heuristic Selection Engine (runs Algebraic, Branch & Bound, SOP, POS)
    heuristic_results = select_best_circuit(table, variable_names)
    
    winner_expr_obj = heuristic_results["winner_expr_obj"]
    winner_name = heuristic_results["winner_name"]
    winner_expr_str = heuristic_results["winner_expr"]
    
    # 6. Circuits Generation
    naive_circuit = generate_circuit_from_expr(sop_expr)
    optimized_circuit = generate_circuit_from_expr(simplified_expr)
    winner_circuit = heuristic_results["winner_circuit"]

    # 7. Analytics
    naive_analytics = get_circuit_analytics(naive_circuit)
    optimized_analytics = get_circuit_analytics(optimized_circuit)
    winner_analytics = get_circuit_analytics(winner_circuit)

    # 8. Expression Tree Generation (optimized or winner tree)
    tree_layout = generate_expression_tree(winner_expr_obj)

    # 9. Equivalence Verification (Naive SOP vs Winner)
    equiv_results = verify_equivalence(sop_expr, winner_expr_obj, variable_names)

    # 10. Greedy K-map groupings
    kmap_steps = solve_greedy_kmap(table, variable_names)

    # Step-by-Step Logic description
    step_by_step = [
        f"Step 1: Identify minterms from Truth Table: {minterms}",
        f"Step 2: Apply Memoized Boolean Simplifier (DP) lookup. Lookups: {memo_stats['lookups']}, Hits: {memo_stats['cache_hits']}.",
        f"Step 3: Run Heuristic Optimization Engine (SOP vs POS vs Factored).",
        f"Step 4: Selected winner algorithm: '{winner_name}' based on Cost Score.",
        f"Step 5: Perform exhaustive verification for equivalence: {equiv_results['is_equivalent']}."
    ]

    return jsonify({
        "original_sop": str(sop_expr),
        "original_pos": str(pos_expr),
        "simplified": str(simplified_expr),
        "factored_expr": winner_expr_str,
        "winner_name": winner_name,
        "winner_expr": winner_expr_str,
        "naive_circuit": naive_circuit,
        "optimized_circuit": optimized_circuit,
        "factored_circuit": winner_circuit,
        "step_by_step": step_by_step,
        "analytics": {
            "naive": naive_analytics,
            "optimized": optimized_analytics,
            "winner": winner_analytics,
            "saved_gates": naive_analytics["gate_count"] - winner_analytics["gate_count"]
        },
        "greedy_kmap_steps": kmap_steps,
        "equivalence": equiv_results,
        "memoization_report": memo_stats,
        "bb_report": heuristic_results["bb_stats"],
        "expression_tree": tree_layout,
        "heuristic_report": {
            "winner_name": winner_name,
            "winner_expr": winner_expr_str,
            "reason": heuristic_results["reason"],
            "comparison": heuristic_results["comparison"]
        }
    })


@app.route("/reverse", methods=["POST"])
@app.route("/api/reverse", methods=["POST"])
def reverse_expression():
    try:
        from sympy.parsing.sympy_parser import parse_expr
        data = request.json
        expr_str = data["expression"]
        variables = data.get("variables", ["A", "B", "C"])
        
        syms = symbols(' '.join(variables))
        if len(variables) == 1:
            syms = [syms]
        else:
            syms = list(syms)
            
        expr = parse_expr(expr_str)
        
        table = []
        n = len(syms)
        for i in range(2**n):
            binary = format(i, f'0{n}b')
            eval_dict = {syms[j]: int(binary[j]) for j in range(n)}
            val = expr.subs(eval_dict)
            table.append(1 if val else 0)
            
        return jsonify({"table": table, "variables": variables})
    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True)