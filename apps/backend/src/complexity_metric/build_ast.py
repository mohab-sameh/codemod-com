import os
import json

def build_ast(source_code, language="typescript"):
	if language == "typescript":
		os.system(f"node typescript.js \"{source_code}\"")
	else:
		print(f"{language} not supported.")
		return None

	with open('.ast.json', 'r') as f:
		raw_ast = json.load(f)
	return raw_ast
