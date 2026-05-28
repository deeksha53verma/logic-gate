from sympy import simplify_logic, And, Or, Not

class MemoizedSimplifier:
    def __init__(self):
        self.cache = {}
        self.cache_hits = 0
        self.lookups = 0

    def simplify(self, expr):
        """
        Recursively simplifies a Sympy expression with memoization.
        """
        # String key for caching
        expr_key = str(expr)
        
        self.lookups += 1
        if expr_key in self.cache:
            self.cache_hits += 1
            return self.cache[expr_key]

        # Base case
        if expr in (True, False) or expr.is_Symbol:
            self.cache[expr_key] = expr
            return expr

        if expr.is_Not:
            arg = self.simplify(expr.args[0])
            simplified = Not(arg)
            # Call Sympy's logical simplification on the small sub-problem
            simplified = simplify_logic(simplified)
            self.cache[expr_key] = simplified
            return simplified

        # And/Or operators
        simplified_args = [self.simplify(arg) for arg in expr.args]
        
        if expr.func.__name__ == "And":
            new_expr = And(*simplified_args)
        elif expr.func.__name__ == "Or":
            new_expr = Or(*simplified_args)
        else:
            new_expr = expr

        simplified = simplify_logic(new_expr)
        self.cache[expr_key] = simplified
        return simplified

    def get_stats(self):
        saved = self.cache_hits
        redundancy_reduction_pct = 0
        if self.lookups > 0:
            redundancy_reduction_pct = round((self.cache_hits / self.lookups) * 100, 1)
            
        return {
            "lookups": self.lookups,
            "cache_hits": self.cache_hits,
            "saved_operations": saved,
            "reduction_percentage": redundancy_reduction_pct
        }
