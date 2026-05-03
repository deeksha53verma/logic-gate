def simplify_expression(expression):
    """
    Basic Boolean simplification rules
    """

    # Rule 1: A + A = A
    terms = expression.split(" + ")
    unique_terms = []
    for t in terms:
        if t not in unique_terms:
            unique_terms.append(t)

    simplified = " + ".join(unique_terms)

    # Rule 2: A + AB = A (absorption law)
    final_terms = []

    for term in unique_terms:
        absorbed = False
        for other in unique_terms:
            if term != other and term in other:
                absorbed = True
        if not absorbed:
            final_terms.append(term)

    return " + ".join(final_terms)