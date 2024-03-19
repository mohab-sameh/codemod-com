import math
from build_ast import build_ast

class HalsteadMetrics:
    def __init__(self, language):
        self.language = language

    def build_ast(self, script):
        return build_ast(script, self.language)

    # collect operators and operands in json ast tree:
    def collect_operators_operands(self, tree, operators, operands):
        if tree['kind'] == 'Identifier' or tree['kind'].endswith('Literal'):
            operands.append(tree['text'])
        else:
            operators.append(tree['kind'])
        for child in tree['children']:
            self.collect_operators_operands(child, operators, operands)

    # compute the Halstead metrics of a given typescript ast tree
    def compute_metrics(self, source):
        tree = self.build_ast(source)
        operators, operands = [], []
        self.collect_operators_operands(tree, operators, operands)
        N1, N2 = len(operators), len(operands)
        N = N1 + N2
        n1, n2 = len(set(operators)), len(set(operands))
        n = n1 + n2
        V = N * math.log2(n)
        D = (n1/2) * (N2/n2)
        L = (2/n1) * (n2/N2)
        E = V * D
        return N, n, V, D, L, E
