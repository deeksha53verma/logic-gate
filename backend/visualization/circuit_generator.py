def generate_circuit_from_expr(expr):
    c = {"nodes": [], "edges": []}
    node_counter = {"count": 0}
    
    def expr_to_circuit(e, parent_id=None, circuit=None, counter=None):
        current_id = f"node_{counter['count']}"
        counter["count"] += 1

        if e.is_Symbol:
            circuit["nodes"].append({"id": current_id, "type": "INPUT", "label": str(e)})
        elif e.is_Not:
            circuit["nodes"].append({"id": current_id, "type": "NOT", "label": "NOT"})
            child_id = expr_to_circuit(e.args[0], current_id, circuit, counter)
            circuit["edges"].append({"source": child_id, "target": current_id})
        else:
            op = "AND" if e.func.__name__ == "And" else "OR" if e.func.__name__ == "Or" else "UNKNOWN"
            circuit["nodes"].append({"id": current_id, "type": op, "label": op})
            for arg in e.args:
                child_id = expr_to_circuit(arg, current_id, circuit, counter)
                circuit["edges"].append({"source": child_id, "target": current_id})

        return current_id

    # Check if expr is just True or False
    if expr in (True, False):
        c["nodes"].append({"id": "output", "type": "OUTPUT", "label": "OUT"})
        c["nodes"].append({"id": "const", "type": "INPUT", "label": str(expr)})
        c["edges"].append({"source": "const", "target": "output"})
        return c

    root_id = expr_to_circuit(expr, circuit=c, counter=node_counter)
    c["nodes"].append({"id": "output", "type": "OUTPUT", "label": "OUT"})
    c["edges"].append({"source": root_id, "target": "output"})
    return c

def get_circuit_analytics(circuit):
    # Gate count and Cost
    # Cost = (#AND * 2) + (#OR * 2) + (#NOT * 1)
    gate_count = 0
    cost = 0
    delays = {"AND": 2, "OR": 2, "NOT": 1, "INPUT": 0, "OUTPUT": 0, "UNKNOWN": 0}
    
    for n in circuit["nodes"]:
        if n["type"] not in ["INPUT", "OUTPUT"]:
            gate_count += 1
            if n["type"] == "AND":
                cost += 2
            elif n["type"] == "OR":
                cost += 2
            elif n["type"] == "NOT":
                cost += 1
    
    # Calculate depth and delay using topological sort / longest path
    edges = circuit["edges"]
    nodes = circuit["nodes"]
    
    adj = {n["id"]: [] for n in nodes}
    in_degree = {n["id"]: 0 for n in nodes}
    node_types = {n["id"]: n["type"] for n in nodes}
    
    for e in edges:
        adj[e["source"]].append(e["target"])
        in_degree[e["target"]] += 1
        
    queue = [n["id"] for n in nodes if in_degree[n["id"]] == 0]
    depth = {n["id"]: 0 for n in nodes}
    delay = {n["id"]: 0 for n in nodes}
    
    max_depth = 0
    max_delay = 0
    while queue:
        curr = queue.pop(0)
        max_depth = max(max_depth, depth[curr])
        max_delay = max(max_delay, delay[curr])
        for neighbor in adj[curr]:
            in_degree[neighbor] -= 1
            depth[neighbor] = max(depth[neighbor], depth[curr] + 1)
            
            gate_delay = delays.get(node_types[neighbor], 0)
            delay[neighbor] = max(delay[neighbor], delay[curr] + gate_delay)
            
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
                
    # Max depth includes inputs and outputs, so gate depth is max_depth - 1 (or 0 if simple)
    circuit_depth = max(0, max_depth - 1) 
    
    return {
        "gate_count": gate_count,
        "cost": cost,
        "depth": circuit_depth,
        "total_delay_ns": max_delay
    }