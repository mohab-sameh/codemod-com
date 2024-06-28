import type {
  ASTPath,
  ArrowFunctionExpression,
  ClassDeclaration,
  Collection,
  FunctionDeclaration,
  FunctionExpression,
  JSCodeshift,
  ReturnStatement,
} from "jscodeshift";
import { analyzeImport } from "./import.js";

export const getClassComponents = (
  j: JSCodeshift,
  root: Collection<any>,
): Collection<ClassDeclaration> => {
  const {
    importNamespaceSpecifierName,
    importDefaultSpecifierName,
    importSpecifierLocalNames,
  } = analyzeImport(j, root, "react");

  const REACT_CLASS_COMPONENT_SUPERCLASS_NAMES = ["PureComponent", "Component"];

  const importedComponentSuperclassNames =
    REACT_CLASS_COMPONENT_SUPERCLASS_NAMES.map((name) =>
      importSpecifierLocalNames.get(name),
    ).filter(Boolean);

  const importedModuleName =
    importNamespaceSpecifierName ?? importDefaultSpecifierName;

  return root.find(j.ClassDeclaration).filter((path) => {
    const superClass = path.value.superClass;

    if (
      j.Identifier.check(superClass) &&
      importedComponentSuperclassNames.includes(superClass.name)
    ) {
      return true;
    }

    if (
      j.MemberExpression.check(superClass) &&
      j.Identifier.check(superClass.object) &&
      superClass.object.name === importedModuleName &&
      j.Identifier.check(superClass.property) &&
      REACT_CLASS_COMPONENT_SUPERCLASS_NAMES.includes(superClass.property.name)
    ) {
      return true;
    }

    return false;
  });
};

type FunctionLike =
  | FunctionDeclaration
  | FunctionExpression
  | ArrowFunctionExpression;

export const getFunctionComponents = (j: JSCodeshift, root: Collection) => {
  const functionLikePaths: ASTPath<FunctionLike>[] = [
    ...root.find(j.FunctionDeclaration).paths(),
    ...root.find(j.FunctionExpression).paths(),
    ...root.find(j.ArrowFunctionExpression).paths(),
  ];

  return functionLikePaths.filter((path) =>
    j(path)
      .find(j.ReturnStatement)
      .every((path) => isReactElement(j, path.value.argument)),
  );
};

export const getFunctionComponentName = (
  j: JSCodeshift,
  path: ASTPath<FunctionLike>,
): string | null =>
  j.ArrowFunctionExpression.check(path.value) &&
  j.VariableDeclarator.check(path.parent.value) &&
  j.Identifier.check(path.parent.value.id)
    ? path.parent.value.id.name
    : path.value.id?.name ?? null;

export const isReactElement = (
  j: JSCodeshift,
  maybeJsx: ReturnStatement["argument"],
) =>
  j.BooleanLiteral.check(maybeJsx) ||
  j.StringLiteral.check(maybeJsx) ||
  j.NullLiteral.check(maybeJsx) ||
  j.NumericLiteral.check(maybeJsx) ||
  j.JSXElement.check(maybeJsx) ||
  j.JSXFragment.check(maybeJsx);

export const getDefaultExport = (
  j: JSCodeshift,
  root: Collection<any>,
): ASTPath<unknown> | null =>
  root.find(j.ExportDefaultDeclaration).paths()?.at(0) ?? null;

/**
 * checks if the given function is the part of default export
 */
export const isFunctionDefaultExport = (
  j: JSCodeshift,
  root: Collection<any>,
  path: ASTPath<FunctionLike>,
) => {
  const defaultExport = getDefaultExport(j, root);

  const defaultExportDeclaration = defaultExport?.value.declaration;

  if (j.FunctionDeclaration.check(defaultExportDeclaration)) {
    return path.value === defaultExportDeclaration;
  }

  if (j.Identifier.check(defaultExportDeclaration)) {
    return getFunctionComponentName(j, path) === defaultExportDeclaration.name;
  }

  return false;
};
