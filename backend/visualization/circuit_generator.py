def generate_circuit(expression):
    gates = []
    connections = []

    terms = expression.split(" + ")

    for i, term in enumerate(terms):
        inputs = []
        for char in term:
            if char == "'":
                continue
            if char.isalpha():
                if char + "'" in term:
                    gates.append({"type": "NOT", "input": char, "output": char + "_not"})
                    inputs.append(char + "_not")
                else:
                    inputs.append(char)

        and_gate = f"AND_{i}"
        gates.append({"type": "AND", "inputs": inputs, "output": and_gate})
        connections.append(and_gate)

    if len(connections) > 1:
        gates.append({"type": "OR", "inputs": connections, "output": "F"})
    else:
        gates.append({"type": "WIRE", "input": connections[0], "output": "F"})

    return gates