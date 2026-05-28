from sympy import And, Or, Not, symbols, to_dnf

def count_gates(expr):
    if expr in (True, False) or expr.is_Symbol:
        return 0
    if expr.is_Not:
        return 1 + count_gates(expr.args[0])
    return len(expr.args) - 1 + sum(count_gates(arg) for arg in expr.args)

class BranchAndBoundFactorer:
    def __init__(self):
        self.states_explored = 0
        self.states_pruned = 0
        self.memo = {}

    def solve(self, terms):
        self.states_explored = 0
        self.states_pruned = 0
        self.memo = {}
        
        # Convert terms list of sets to frozenset of frozensets
        frozen_terms = frozenset(frozenset(t) for t in terms)
        cost, expr = self._bb_factor(frozen_terms, float('inf'))
        return expr

    def _bb_factor(self, terms, best_limit):
        self.states_explored += 1
        
        if not terms:
            return 0, False
        if len(terms) == 1:
            term = next(iter(terms))
            if not term:
                return 0, True
            expr = And(*term)
            return count_gates(expr), expr

        # Check memo
        if terms in self.memo:
            return self.memo[terms]

        # Calculate lower bound:
        # A term of size k requires (k-1) AND gates.
        # N terms require (N-1) OR gates.
        lb = sum(max(0, len(t) - 1) for t in terms) + max(0, len(terms) - 1)
        if lb >= best_limit:
            self.states_pruned += 1
            return lb, None

        # Count literal frequencies
        literal_counts = {}
        for term in terms:
            for lit in term:
                literal_counts[lit] = literal_counts.get(lit, 0) + 1

        candidates = [lit for lit, count in literal_counts.items() if count >= 2]

        if not candidates:
            # Cannot factor any further, just OR the terms
            term_exprs = []
            for t in terms:
                if not t:
                    term_exprs.append(True)
                else:
                    term_exprs.append(And(*t))
            expr = Or(*term_exprs)
            c = count_gates(expr)
            self.memo[terms] = (c, expr)
            return c, expr

        # Sort candidates to find the most promising ones first (greedy heuristic)
        candidates.sort(key=lambda lit: literal_counts[lit], reverse=True)

        best_cost = float('inf')
        best_expr = None

        for lit in candidates:
            # Partition
            terms_with_lit = set()
            terms_without_lit = set()
            for term in terms:
                if lit in term:
                    terms_with_lit.add(frozenset(term - {lit}))
                else:
                    terms_without_lit.add(term)

            terms_with_lit = frozenset(terms_with_lit)
            terms_without_lit = frozenset(terms_without_lit)

            # Estimate cost to decide early skip
            lb_with = sum(max(0, len(t) - 1) for t in terms_with_lit) + max(0, len(terms_with_lit) - 1)
            lb_without = sum(max(0, len(t) - 1) for t in terms_without_lit) + max(0, len(terms_without_lit) - 1)
            est_cost = lb_with + lb_without + 1 # +1 for Anding lit
            
            if est_cost >= best_cost or est_cost >= best_limit:
                self.states_pruned += 1
                continue

            # Solve left subproblem
            cost_with, expr_with = self._bb_factor(terms_with_lit, min(best_cost, best_limit))
            if expr_with is None:
                continue

            # Solve right subproblem
            cost_without, expr_without = self._bb_factor(terms_without_lit, min(best_cost - cost_with, best_limit - cost_with))
            if expr_without is None:
                continue

            # Construct expr
            if expr_with is True or expr_with == True:
                term_with = lit
            else:
                term_with = And(lit, expr_with)

            if expr_without is False or expr_without == False:
                full_expr = term_with
            else:
                full_expr = Or(term_with, expr_without)

            total_cost = count_gates(full_expr)
            if total_cost < best_cost:
                best_cost = total_cost
                best_expr = full_expr

        if best_expr is None:
            # If all branches pruned or invalid, use default flat Or
            term_exprs = []
            for t in terms:
                if not t:
                    term_exprs.append(True)
                else:
                    term_exprs.append(And(*t))
            expr = Or(*term_exprs)
            c = count_gates(expr)
            self.memo[terms] = (c, expr)
            return c, expr

        self.memo[terms] = (best_cost, best_expr)
        return best_cost, best_expr

def factor_expression_bb(expr):
    """
    Converts a Sympy expression to SOP, then factors it using Branch and Bound.
    Returns (factored_expr, states_explored, states_pruned)
    """
    dnf_expr = to_dnf(expr)
    if dnf_expr in (True, False) or dnf_expr.is_Symbol or dnf_expr.is_Not:
        return dnf_expr, 0, 0

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

    bb = BranchAndBoundFactorer()
    factored = bb.solve(terms)
    return factored, bb.states_explored, bb.states_pruned
