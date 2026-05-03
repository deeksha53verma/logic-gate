def implicants_to_expression(prime_implicants, variables):
    terms = []

    for implicant in prime_implicants:
        term = []

        for i, bit in enumerate(implicant):
            if bit == '1':
                term.append(variables[i])
            elif bit == '0':
                term.append(variables[i] + "'")
            # '-' means ignore

        terms.append("".join(term))

    return " + ".join(terms) if terms else "0"