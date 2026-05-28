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

def generate_expression_tree(expr):
    """
    Generates a pure Expression Tree from a Sympy expression.
    Unlike circuit diagrams, variable leaf nodes are not shared.
    """
    c = {"nodes": [], "edges": []}
    node_counter = {"count": 0}
    
    def expr_to_tree(e):
        current_id = f"treenode_{node_counter['count']}"
        node_counter["count"] += 1
        
        if e.is_Symbol:
            c["nodes"].append({"id": current_id, "type": "VARIABLE", "label": str(e)})
        elif e.is_Not:
            c["nodes"].append({"id": current_id, "type": "NOT", "label": "NOT"})
            child_id = expr_to_tree(e.args[0])
            c["edges"].append({"source": current_id, "target": child_id})
        else:
            op = "AND" if e.func.__name__ == "And" else "OR" if e.func.__name__ == "Or" else "UNKNOWN"
            c["nodes"].append({"id": current_id, "type": op, "label": op})
            for arg in e.args:
                child_id = expr_to_tree(arg)
                c["edges"].append({"source": current_id, "target": child_id})
                
        return current_id

    if expr in (True, False):
        c["nodes"].append({"id": "treenode_const", "type": "VARIABLE", "label": str(expr)})
        return c

    expr_to_tree(expr)
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
    critical_parent = {} # For critical path backtracking (Dynamic Programming)
    
    max_depth = 0
    max_delay = 0
    max_delay_node = None
    
    while queue:
        curr = queue.pop(0)
        
        if depth[curr] > max_depth:
            max_depth = depth[curr]
            
        if delay[curr] > max_delay:
            max_delay = delay[curr]
            max_delay_node = curr
            
        for neighbor in adj[curr]:
            in_degree[neighbor] -= 1
            
            # Update depth
            if depth[curr] + 1 > depth[neighbor]:
                depth[neighbor] = depth[curr] + 1
            
            # Update delay and record critical path parent
            gate_delay = delays.get(node_types[neighbor], 0)
            new_delay = delay[curr] + gate_delay
            if new_delay > delay[neighbor]:
                delay[neighbor] = new_delay
                critical_parent[neighbor] = curr
            
            if in_degree[neighbor] == 0:
                queue.append(neighbor)
                
    # Backtrack to find critical path nodes and edges
    critical_nodes = set()
    critical_edges = set()
    
    # Start backtracking from the node that achieved max delay (typically the output node)
    if max_delay_node:
        curr = max_delay_node
        # If output node is connected to something, trace it
        # If not, try searching for the 'output' node
        if 'output' in depth:
            curr = 'output'
            
        critical_nodes.add(curr)
        while curr in critical_parent:
            p = critical_parent[curr]
            critical_nodes.add(p)
            critical_edges.add((p, curr))
            curr = p
            
    # Mark nodes and edges in circuit as critical
    for n in circuit["nodes"]:
        n["critical"] = n["id"] in critical_nodes
        
    for e in circuit["edges"]:
        e["critical"] = (e["source"], e["target"]) in critical_edges

    # Max depth includes inputs and outputs, so gate depth is max_depth - 1 (or 0 if simple)
    circuit_depth = max(0, max_depth - 1) 
    
    return {
        "gate_count": gate_count,
        "cost": cost,
        "depth": circuit_depth,
        "total_delay_ns": max_delay,
        "critical_nodes": list(critical_nodes),
        "critical_edges": [{"source": s, "target": t} for (s, t) in critical_edges]
    }