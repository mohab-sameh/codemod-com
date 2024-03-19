import * as ts from "typescript";
import * as fs from "fs";

// Get the code string from the command line arguments
const codeString = process.argv[2];

if (!codeString) {
  console.error("Please provide TypeScript code as the first argument!");
  process.exit(1);
}

// Create a SourceFile in memory
const sourceFile = ts.createSourceFile(
  "input.ts", // A placeholder filename 
  codeString,
  ts.ScriptTarget.Latest
);

// Recursive function to traverse and generate the AST 
function generateAST(node: ts.Node): any {
    const nodeKind = ts.SyntaxKind[node.kind];
    let result: any = { kind: nodeKind };

    if (node.getChildCount(sourceFile) === 0) {
        result.text = node.getText(sourceFile); 
    }

    result.children = []; 
    ts.forEachChild(node, (childNode) => {
        result.children.push(generateAST(childNode));
    });

    return result;
}

// Generate the full AST
const ast = generateAST(sourceFile);

// Serialize the AST as JSON
const astJSON = JSON.stringify(ast, null, 2);

// Write the JSON to a file
const outputFileName = ".ast.json";
fs.writeFileSync(outputFileName, astJSON);