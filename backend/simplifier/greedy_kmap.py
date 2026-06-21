def get_kmap_dimensions(num_vars):
    if num_vars == 2:
        return 2, 2, [0, 1], [0, 1]
    elif num_vars == 3:
        return 2, 4, [0, 1], [0, 1, 3, 2]
    elif num_vars == 4:
        return 4, 4, [0, 1, 3, 2], [0, 1, 3, 2]
    return 0, 0, [], []

def cell_to_index(r_idx, c_idx, num_vars, rows, cols):
    r_val = rows[r_idx]
    c_val = cols[c_idx]
    if num_vars == 2:
        bin_str = bin(r_val)[2:] + bin(c_val)[2:]
    elif num_vars == 3:
        bin_str = bin(r_val)[2:] + bin(c_val)[2:].zfill(2)
    elif num_vars == 4:
        bin_str = bin(r_val)[2:].zfill(2) + bin(c_val)[2:].zfill(2)
    else:
        bin_str = "0"
    return int(bin_str, 2)

def index_to_binary(idx, num_vars):
    return bin(idx)[2:].zfill(num_vars)

def get_term_for_cells(cells, num_vars, rows, cols, variables):
    """
    Given a set of cells, returns a boolean expression term representing them.
    E.g. A & ~B
    """
    if not cells:
        return "0"
        
    bin_strings = []
    for (r, c) in cells:
        idx = cell_to_index(r, c, num_vars, rows, cols)
        bin_strings.append(index_to_binary(idx, num_vars))

    term_parts = []
    for v_idx in range(num_vars):
        bits = {s[v_idx] for s in bin_strings}
        if len(bits) == 1:
            bit = next(iter(bits))
            var_name = variables[v_idx]
            if bit == '1':
                term_parts.append(var_name)
            else:
                term_parts.append(f"~{var_name}")

    return " & ".join(term_parts) if term_parts else "1"

def solve_greedy_kmap(table, variables):
    num_vars = len(variables)
    if num_vars not in (2, 3, 4):
        return []

    R, C, rows, cols = get_kmap_dimensions(num_vars)
    minterms = [i for i, val in enumerate(table) if int(val) == 1]
    
    if not minterms:
        return []

    # Map indices to coordinates for easy lookup
    idx_to_coord = {}
    for r in range(R):
        for c in range(C):
            idx = cell_to_index(r, c, num_vars, rows, cols)
            idx_to_coord[idx] = (r, c)

    # Generate all potential power-of-2 rectangular groups in toroidal grid
    potential_groups = []
    valid_spans = [1, 2, 4]
    
    for r_start in range(R):
        for c_start in range(C):
            for wr in valid_spans:
                if wr > R: continue
                for wc in valid_spans:
                    if wc > C: continue
                    
                    size = wr * wc
                    if size not in (1, 2, 4, 8, 16): continue
                    
                    # Generate cells in group
                    g_cells = []
                    for dr in range(wr):
                        for dc in range(wc):
                            g_cells.append(((r_start + dr) % R, (c_start + dc) % C))
                            
                    # Sort and convert to tuple of tuples to represent uniquely
                    g_cells = tuple(sorted(g_cells))
                    potential_groups.append(g_cells)

    # Keep unique groups
    potential_groups = list(set(potential_groups))

    # Filter valid groups (all cells must be 1)
    valid_groups = []
    for g in potential_groups:
        all_ones = True
        g_indices = []
        for (r, c) in g:
            idx = cell_to_index(r, c, num_vars, rows, cols)
            g_indices.append(idx)
            if int(table[idx]) != 1:
                all_ones = False
                break
        if all_ones:
            valid_groups.append((g, g_indices))

    # Sort groups by size descending
    valid_groups.sort(key=lambda item: len(item[0]), reverse=True)

    # Greedy cover algorithm
    covered = set()
    steps = []
    
    while len(covered) < len(minterms):
        best_group = None
        best_indices = None
        max_newly_covered = 0

        # Find the group that covers the most UNCOVERED minterms (greedy choice)
        for g, g_indices in valid_groups:
            uncovered_in_group = [idx for idx in g_indices if idx not in covered]
            if len(uncovered_in_group) > max_newly_covered:
                max_newly_covered = len(uncovered_in_group)
                best_group = g
                best_indices = g_indices

        # If no group covers any new minterms, break
        if not best_group or max_newly_covered == 0:
            break

        # Record step
        newly_cov = [idx for idx in best_indices if idx not in covered]
        for idx in best_indices:
            covered.add(idx)

        term_str = get_term_for_cells(best_group, num_vars, rows, cols, variables)
        
        steps.append({
            "cells": [{"r": r, "c": c} for (r, c) in best_group],
            "term": term_str,
            "newly_covered": newly_cov,
            "size": len(best_group)
        })

    return steps
