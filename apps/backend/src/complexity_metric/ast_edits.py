from zss import simple_distance, Node, Operation
from build_ast import build_ast

class ASTEdits:
    def __init__(self, language):
        self.language = language

    def calculate_tree_edit_distance(self, tree1, tree2):
        return simple_distance(tree1, tree2, return_operations=True)

    def json_tree_to_zss_tree(self, json_tree, zss_root):
        zss_children = []
        for child in json_tree['children']:
            zss_children.append(self.json_tree_to_zss_tree(child, zss_root))
        if zss_root is None:
            text = json_tree['text'] if 'text' in json_tree else ''
            zss_root = Node(json_tree['kind'] + "(" + text + ")", zss_children)
        return zss_root

    def build_ast(self, script):
        return build_ast(script, self.language)

    def typescript_to_json_tree(self, before_script, after_script):
        before_tree = self.build_ast(before_script)
        after_tree = self.build_ast(after_script)
        return before_tree, after_tree

    def compute_complexity(self, before_script, after_script):
        before_tree, after_tree = self.typescript_to_json_tree(before_script, after_script)
        zss_tree_before = self.json_tree_to_zss_tree(before_tree, None)
        zss_tree_after = self.json_tree_to_zss_tree(after_tree, None)
        tree_operations = self.calculate_tree_edit_distance(zss_tree_before, zss_tree_after)
        edits = sum(1 for op in tree_operations[1] if op.type != Operation.match)
        return edits/len(tree_operations[1]), tree_operations[1]
