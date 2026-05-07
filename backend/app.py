from flask import Flask, request, jsonify
from flask_cors import CORS
from sympy import symbols
from sympy.logic.boolalg import SOPform, POSform, simplify_logic
from visualization.circuit_generator import generate_circuit_from_expr, get_circuit_analytics

app = Flask(__name__)
CORS(app)

@app.route("/")
def home():
    return "Logic Gate Synthesizer Running!"

@app.route("/test", methods=["GET"])
def test():
    return jsonify({"message": "Backend working!"})

@app.route("/generate", methods=["POST"])
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
    
    # Get minterms where output is 1
    minterms = []
    for i, output in enumerate(table):
        if output == 1:
            binary = format(i, f'0{n}b')
            minterm = [int(b) for b in binary]
            minterms.append(minterm)

    if not minterms:
        return jsonify({"expression": "0"})

    # Generation using Sympy
    from sympy import And, Or, Not
    
    # Generate Naive SOP manually (since SOPform auto-simplifies)
    naive_terms = []
    for minterm in minterms:
        term_vars = []
        for j, bit in enumerate(minterm):
            if bit == 1:
                term_vars.append(syms[j])
            else:
                term_vars.append(Not(syms[j]))
        naive_terms.append(And(*term_vars))
        
    if naive_terms:
        sop_expr = Or(*naive_terms)
    else:
        sop_expr = False

    pos_expr = POSform(syms, minterms)
    simplified_expr = simplify_logic(sop_expr)

    # Circuit Generation
    naive_circuit = generate_circuit_from_expr(sop_expr)
    optimized_circuit = generate_circuit_from_expr(simplified_expr)

    # Analytics
    naive_analytics = get_circuit_analytics(naive_circuit)
    optimized_analytics = get_circuit_analytics(optimized_circuit)

    # Step-by-Step Logic
    step_by_step = [
        f"Step 1: Identify minterms from Truth Table: {minterms}",
        "Step 2: Apply Quine-McCluskey / K-Map grouping to find Prime Implicants.",
        "Step 3: Eliminate redundant implicants to find Essential Prime Implicants.",
        f"Step 4: Combine to form minimal expression: {str(simplified_expr)}"
    ]

    return jsonify({
        "original_sop": str(sop_expr),
        "original_pos": str(pos_expr),
        "simplified": str(simplified_expr),
        "naive_circuit": naive_circuit,
        "optimized_circuit": optimized_circuit,
        "step_by_step": step_by_step,
        "analytics": {
            "naive": naive_analytics,
            "optimized": optimized_analytics,
            "saved_gates": naive_analytics["gate_count"] - optimized_analytics["gate_count"]
        }
    })

@app.route("/reverse", methods=["POST"])
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