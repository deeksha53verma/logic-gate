def get_minterms(table):
    return [i for i, val in enumerate(table) if val == 1]


def to_binary(num, bits):
    return format(num, f'0{bits}b')


def group_minterms(minterms, bits):
    groups = {}
    for m in minterms:
        binary = to_binary(m, bits)
        ones = binary.count('1')
        groups.setdefault(ones, []).append(binary)
    return groups


def combine_terms(a, b):
    diff = 0
    result = ""
    for x, y in zip(a, b):
        if x != y:
            diff += 1
            result += '-'
        else:
            result += x
    return result if diff == 1 else None


def quine_mccluskey(table, variables):
    bits = len(variables)
    minterms = get_minterms(table)

    groups = group_minterms(minterms, bits)

    new_groups = {}
    used = set()

    keys = sorted(groups.keys())

    for i in range(len(keys)-1):
        for a in groups[keys[i]]:
            for b in groups[keys[i+1]]:
                combined = combine_terms(a, b)
                if combined:
                    new_groups.setdefault(keys[i], []).append(combined)
                    used.add(a)
                    used.add(b)

    # Prime implicants
    prime = []
    for group in groups.values():
        for term in group:
            if term not in used:
                prime.append(term)

    return prime