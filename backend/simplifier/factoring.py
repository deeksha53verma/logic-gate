from sympy import And, Or, Not, symbols, simplify_logic, to_dnf

def get_literals_in_term(term):
    return set(term)

def factor_sop_terms(terms):
    """
    Recursively factors a set of terms (each term is a frozenset of sympy literals).
    Returns a factored Sympy expression.
    """
    if not terms:
        return False
    if len(terms) == 1:
        term = next(iter(terms))
        if not term:
            return True
        return And(*term)

    # Count literal frequencies
    literal_counts = {}
    for term in terms:
        for lit in term:
            literal_counts[lit] = literal_counts.get(lit, 0) + 1

    if not literal_counts:
        return False

    # Find the most frequent literal
    best_lit, max_count = max(literal_counts.items(), key=lambda item: item[1])

    # If the best literal appears in less than 2 terms, no factoring is possible
    if max_count < 2:
        # Just OR the terms together
        term_exprs = []
        for term in terms:
            if not term:
                term_exprs.append(True)
            else:
                term_exprs.append(And(*term))
        return Or(*term_exprs)

    # Partition terms
    terms_with_lit = set()
    terms_without_lit = set()

    for term in terms:
        if best_lit in term:
            # Remove best_lit from the term
            reduced_term = frozenset(term - {best_lit})
            terms_with_lit.add(reduced_term)
        else:
            terms_without_lit.add(term)

    # Recursive steps (Transform and Conquer)
    factored_with = factor_sop_terms(terms_with_lit)
    factored_without = factor_sop_terms(terms_without_lit)

    # Combine: L & (factored_with) | factored_without
    if factored_with is True or factored_with == True:
        term_with = best_lit
    else:
        term_with = And(best_lit, factored_with)

    if factored_without is False or factored_without == False:
        return term_with
    
    return Or(term_with, factored_without)

def factor_expression(expr):
    """
    Converts a Sympy expression to SOP, then factors it.
    """
    # Convert to DNF
    dnf_expr = to_dnf(expr)
    if dnf_expr in (True, False) or dnf_expr.is_Symbol or dnf_expr.is_Not:
        return dnf_expr

    # Extract terms
    terms = set()
    if dnf_expr.func.__name__ == "Or":
        args = dnf_expr.args
    else:
        args = [dnf_expr]

    for arg in args:
        if arg.func.__name__ == "And":
            terms.add(frozenset(arg.args))
        else:
            terms.add(frozenset([arg]))

    return factor_sop_terms(terms)
