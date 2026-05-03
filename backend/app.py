from flask import Flask, request, jsonify
from flask_cors import CORS
# ✅ Correct imports
from simplifier.boolean_laws import simplify_expression
from simplifier.quine_mccluskey import quine_mccluskey
from simplifier.implicant_to_expression import implicants_to_expression
from visualization.circuit_generator import generate_circuit

app = Flask(__name__)
CORS(app)
@app.route("/")
def home():
    return "Logic Gate Synthesizer Running!"

@app.route("/test", methods=["GET"])
def test():
    return jsonify({"message": "Backend working!"})


# 🔥 Truth Table → SOP
@app.route("/generate", methods=["POST"])
def generate_expression():
    data = request.json
    variables = data["variables"]
    table = data["table"]

    n = len(variables)
    expression_terms = []

    for i, output in enumerate(table):
        if output == 1:
            binary = format(i, f'0{n}b')
            term = []

            for j, bit in enumerate(binary):
                if bit == '1':
                    term.append(variables[j])
                else:
                    term.append(variables[j] + "'")

            expression_terms.append("".join(term))

    if not expression_terms:
        return jsonify({"expression": "0"})

    expression = " + ".join(expression_terms)

    # ✅ Simplification
    simplified = simplify_expression(expression)

    # ✅ Quine–McCluskey
    prime_implicants = quine_mccluskey(table, variables)

    # ✅ Final expression
    final_expression = implicants_to_expression(prime_implicants, variables)

    # ✅ Generate circuit
    circuit = generate_circuit(final_expression)


    return jsonify({
        "original": expression,
        "simplified": simplified,
        "prime_implicants": prime_implicants,
        "final_expression": final_expression,
        "circuit": circuit
    })


if __name__ == "__main__":
    app.run(debug=True)