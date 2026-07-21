// commonjs-compatibility.ts

import { promises as fs } from 'node:fs';
import path from 'node:path';

import typescript from 'typescript';
import type { Loader, OnLoadArgs, PluginBuild } from 'esbuild';

export const commonJsCompatibilityInject =
  '@checkdigit/typescript-config/commonjs-compatibility-inject';
export const emptySourceMap =
  '//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiJdLCJtYXBwaW5ncyI6IkEifQ==';

export function isNodeModulePath(fileName: string): boolean {
  return fileName.replaceAll('\\', '/').split('/').includes('node_modules');
}

const commonJsCompatibilityNamespace = 'commonjs-compatibility-inject';
const base36Radix = 36;
const commonJsRequireAliases = Array.from(
  { length: 100 },
  (_, index) => `$cjsR${index.toString(base36Radix).padStart(2, '0')}`,
);
const commonJsCompatibilityFilter =
  // eslint-disable-next-line require-unicode-regexp
  /^@checkdigit\/typescript-config\/commonjs-compatibility-inject$/;
// eslint-disable-next-line require-unicode-regexp
const javascriptFileFilter = /\.[cm]?[jt]sx?$/;

function scriptKind(fileName: string): typescript.ScriptKind {
  if (fileName.endsWith('.tsx')) {
    return typescript.ScriptKind.TSX;
  }
  if (
    fileName.endsWith('.ts') ||
    fileName.endsWith('.mts') ||
    fileName.endsWith('.cts')
  ) {
    return typescript.ScriptKind.TS;
  }
  if (fileName.endsWith('.jsx')) {
    return typescript.ScriptKind.JSX;
  }
  return typescript.ScriptKind.JS;
}

function loader(fileName: string): Loader {
  switch (scriptKind(fileName)) {
    case typescript.ScriptKind.JSX:
      return 'jsx';
    case typescript.ScriptKind.TS:
      return 'ts';
    case typescript.ScriptKind.TSX:
      return 'tsx';
    default:
      return 'js';
  }
}

function isNonReferenceIdentifier(identifier: typescript.Identifier): boolean {
  const { parent } = identifier;
  if (typescript.isShorthandPropertyAssignment(parent)) {
    return false;
  }
  return (
    (Reflect.get(parent, 'name') as typescript.Node | undefined) ===
      identifier ||
    (typescript.isBindingElement(parent) &&
      parent.propertyName === identifier) ||
    (typescript.isImportSpecifier(parent) &&
      parent.propertyName === identifier) ||
    (typescript.isExportSpecifier(parent) &&
      parent.propertyName === identifier) ||
    (typescript.isQualifiedName(parent) && parent.right === identifier) ||
    (typescript.isLabeledStatement(parent) && parent.label === identifier) ||
    (typescript.isBreakOrContinueStatement(parent) &&
      parent.label === identifier) ||
    (typescript.isJsxAttribute(parent) && parent.name === identifier)
  );
}

function isAmbientDeclaration(declaration: typescript.Declaration): boolean {
  let current: typescript.Node = declaration;
  while (!typescript.isSourceFile(current)) {
    if (
      typescript.canHaveModifiers(current) &&
      typescript
        .getModifiers(current)
        ?.some(
          (modifier) => modifier.kind === typescript.SyntaxKind.DeclareKeyword,
        ) === true
    ) {
      return true;
    }
    current = current.parent;
  }
  return current.isDeclarationFile;
}

function isRuntimeDeclaration(declaration: typescript.Declaration): boolean {
  if (
    isAmbientDeclaration(declaration) ||
    typescript.isTypeOnlyImportOrExportDeclaration(declaration)
  ) {
    return false;
  }
  return (
    typescript.isBindingElement(declaration) ||
    typescript.isClassDeclaration(declaration) ||
    typescript.isClassExpression(declaration) ||
    typescript.isEnumDeclaration(declaration) ||
    typescript.isFunctionDeclaration(declaration) ||
    typescript.isFunctionExpression(declaration) ||
    typescript.isImportClause(declaration) ||
    typescript.isImportEqualsDeclaration(declaration) ||
    typescript.isImportSpecifier(declaration) ||
    typescript.isModuleDeclaration(declaration) ||
    typescript.isNamespaceImport(declaration) ||
    typescript.isParameter(declaration) ||
    typescript.isVariableDeclaration(declaration)
  );
}

function hasRuntimeBinding(symbol: typescript.Symbol | undefined): boolean {
  return symbol?.declarations?.some(isRuntimeDeclaration) === true;
}

interface RequireIdentifier {
  identifier: typescript.Identifier;
  sourceFile: typescript.SourceFile;
}

function freeRequireIdentifiers(
  contents: string,
  fileName: string,
): RequireIdentifier[] {
  const sourceFile = typescript.createSourceFile(
    fileName,
    contents,
    typescript.ScriptTarget.Latest,
    true,
    scriptKind(fileName),
  );
  const compilerOptions = {
    allowJs: true,
    noLib: true,
    noResolve: true,
  } satisfies typescript.CompilerOptions;
  const compilerHost = typescript.createCompilerHost(compilerOptions, true);
  compilerHost.fileExists = (candidate) => candidate === fileName;
  compilerHost.getSourceFile = (candidate) =>
    candidate === fileName ? sourceFile : undefined;
  compilerHost.readFile = (candidate) =>
    candidate === fileName ? contents : undefined;

  const checker = typescript
    .createProgram([fileName], compilerOptions, compilerHost)
    .getTypeChecker();
  const identifiers: typescript.Identifier[] = [];
  const visit = (node: typescript.Node): void => {
    if (
      typescript.isIdentifier(node) &&
      node.text === 'require' &&
      !isNonReferenceIdentifier(node) &&
      !hasRuntimeBinding(checker.getSymbolAtLocation(node))
    ) {
      identifiers.push(node);
    }
    typescript.forEachChild(node, visit);
  };
  visit(sourceFile);
  return identifiers.map((identifier) => ({ identifier, sourceFile }));
}

function directRequireCall(
  identifier: typescript.Identifier,
): typescript.CallExpression | undefined {
  if (
    typescript.isCallExpression(identifier.parent) &&
    identifier.parent.expression === identifier
  ) {
    return identifier.parent;
  }
  return undefined;
}

function isRequireResolveCall(identifier: typescript.Identifier): boolean {
  return (
    typescript.isPropertyAccessExpression(identifier.parent) &&
    identifier.parent.expression === identifier &&
    identifier.parent.name.text === 'resolve' &&
    typescript.isCallExpression(identifier.parent.parent) &&
    identifier.parent.parent.expression === identifier.parent
  );
}

function literalRequireSpecifier(
  call: typescript.CallExpression,
): string | undefined {
  const argument = call.arguments[0];
  if (call.arguments.length !== 1 || argument === undefined) {
    return undefined;
  }
  if (!typescript.isStringLiteralLike(argument)) {
    return undefined;
  }
  return argument.text;
}

function isRelativePath(value: string): boolean {
  return value.startsWith('./') || value.startsWith('../');
}

function globPrefix(expression: typescript.Expression): string | undefined {
  if (typescript.isStringLiteralLike(expression)) {
    return expression.text;
  }
  if (typescript.isTemplateExpression(expression)) {
    return expression.head.text;
  }
  if (
    typescript.isBinaryExpression(expression) &&
    expression.operatorToken.kind === typescript.SyntaxKind.PlusToken
  ) {
    return globPrefix(expression.left);
  }
  return undefined;
}

function isRelativeGlobRequire(call: typescript.CallExpression): boolean {
  const argument = call.arguments[0];
  if (call.arguments.length !== 1 || argument === undefined) {
    return false;
  }
  return (
    (typescript.isTemplateExpression(argument) ||
      (typescript.isBinaryExpression(argument) &&
        argument.operatorToken.kind === typescript.SyntaxKind.PlusToken)) &&
    isRelativePath(globPrefix(argument) ?? '')
  );
}

function commonJsCompatibilitySource(): string {
  return `
import { createRequire } from 'node:module';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);
const commonJsRequire = createRequire(import.meta.url);
export {
  dirname as __dirname,
  filename as __filename,
  commonJsRequire as 'import.meta.require',
  ${commonJsRequireAliases.map((alias) => `commonJsRequire as ${alias}`).join(',\n  ')}
};`;
}

interface Replacement {
  end: number;
  start: number;
  text: string;
}

type ResolutionCache = Map<string, Promise<boolean>>;

function isExternalRequire(
  specifier: string,
  args: OnLoadArgs,
  pluginBuild: PluginBuild,
  resolutionCache: ResolutionCache,
): Promise<boolean> {
  const key = `${args.namespace}\0${args.path}\0${specifier}`;
  const cached = resolutionCache.get(key);
  if (cached !== undefined) {
    return cached;
  }
  const resolution = pluginBuild
    .resolve(specifier, {
      importer: args.path,
      kind: 'require-call',
      namespace: args.namespace,
      resolveDir: path.dirname(args.path),
    })
    .then((result) => result.external);
  resolutionCache.set(key, resolution);
  return resolution;
}

async function runtimeRequireReplacement(
  identifier: typescript.Identifier,
  sourceFile: typescript.SourceFile,
  args: OnLoadArgs,
  pluginBuild: PluginBuild,
  requireAlias: string,
  resolutionCache: ResolutionCache,
): Promise<Replacement | undefined> {
  if (!isRequireResolveCall(identifier)) {
    const call = directRequireCall(identifier);
    if (call !== undefined && isRelativeGlobRequire(call)) {
      return undefined;
    }
    const literal =
      call === undefined ? undefined : literalRequireSpecifier(call);
    if (
      literal !== undefined &&
      !(await isExternalRequire(literal, args, pluginBuild, resolutionCache))
    ) {
      return undefined;
    }
  }
  return {
    start: identifier.getStart(sourceFile),
    end: identifier.getEnd(),
    text: typescript.isShorthandPropertyAssignment(identifier.parent)
      ? `require: ${requireAlias}`
      : requireAlias,
  };
}

function isReplacement(value: Replacement | undefined): value is Replacement {
  return value !== undefined;
}

async function rewriteRuntimeRequires(
  args: OnLoadArgs,
  pluginBuild: PluginBuild,
  resolutionCache: ResolutionCache,
) {
  const contents = await fs.readFile(args.path, 'utf8');
  if (!contents.includes('require')) {
    return undefined;
  }
  const requireAlias =
    commonJsRequireAliases.find((alias) => !contents.includes(alias)) ??
    'import.meta.require';
  const replacements = (
    await Promise.all(
      freeRequireIdentifiers(contents, args.path).map(
        async ({ identifier, sourceFile }) =>
          runtimeRequireReplacement(
            identifier,
            sourceFile,
            args,
            pluginBuild,
            requireAlias,
            resolutionCache,
          ),
      ),
    )
  ).filter(isReplacement);
  if (replacements.length === 0) {
    return undefined;
  }
  let rewritten = contents;
  for (const { start, end, text } of replacements.reverse()) {
    rewritten = `${rewritten.slice(0, start)}${text}${rewritten.slice(end)}`;
  }
  if (
    isNodeModulePath(args.path) &&
    (args.path.endsWith('.js') || args.path.endsWith('.mjs'))
  ) {
    rewritten += `\n${emptySourceMap}`;
  }
  return { contents: rewritten, loader: loader(args.path) };
}

export default function commonJsCompatibility(): (
  pluginBuild: PluginBuild,
) => void {
  return (pluginBuild: PluginBuild) => {
    const resolutionCache: ResolutionCache = new Map();
    pluginBuild.onResolve({ filter: commonJsCompatibilityFilter }, (args) =>
      args.kind === 'entry-point'
        ? {
            path: commonJsCompatibilityInject,
            namespace: commonJsCompatibilityNamespace,
          }
        : undefined,
    );
    pluginBuild.onLoad(
      {
        filter: commonJsCompatibilityFilter,
        namespace: commonJsCompatibilityNamespace,
      },
      () => ({ contents: commonJsCompatibilitySource(), loader: 'js' }),
    );
    pluginBuild.onLoad(
      { filter: javascriptFileFilter, namespace: 'file' },
      async (args) =>
        rewriteRuntimeRequires(args, pluginBuild, resolutionCache),
    );
  };
}
