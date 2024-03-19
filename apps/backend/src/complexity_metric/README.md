# Complexity Finder (initial version)

## Requirements
- `node`, `tsc`
- Python modules: `scikit-learn`, `numpy`, `zss`

## How to run
- Compile `typescript.ts` into JavaScript. This script computes the AST for a given script.
```
tsc typescript.ts
```
- Place the before and after snippets in `before.ts` and `after.ts`, respectively, and run the `main.py` script.
```
python main.py
```
