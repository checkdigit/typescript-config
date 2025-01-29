// compile.ts

import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import path from 'node:path';

import typescript from 'typescript';
import { build, type PluginBuild } from 'esbuild';

const commonJsCompatabilityBanner = `import { createRequire as __createRequire } from "node:module";
import { fileURLToPath as __fileURLToPath } from "node:url";
import { default as __path } from "node:path";
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __path.dirname(__filename);
const require = __createRequire(import.meta.url);`;

export type ImportKind =
  | 'entry-point'
  | 'import-statement'
  | 'require-call'
  | 'dynamic-import'
  | 'require-resolve'
  | 'import-rule'
  | 'composes-from'
  | 'url-token';

export interface Metafile {
  inputs: Record<
    string,
    {
      bytes: number;
      imports: {
        path: string;
        kind: ImportKind;
        external?: boolean;
        original?: string;
      }[];
      format?: 'cjs' | 'esm';
    }
  >;
  outputs: Record<
    string,
    {
      bytes: number;
      inputs: Record<
        string,
        {
          bytesInOutput: number;
        }
      >;
      imports: {
        path: string;
        kind: ImportKind | 'file-loader';
        external?: boolean;
      }[];
      exports: string[];
      entryPoint?: string;
      cssBundle?: string;
    }
  >;
}

export interface OutputFile {
  path: string;
  text: string;
}

export interface CompileResult {
  metafile?: Metafile | undefined;
  outputFiles: OutputFile[];
}

export interface CompileOptions {
  /**
   * whether to produce Typescript types or ESM code
   */
  type: 'module' | 'types';

  /**
   * the entry point for the bundle, relative to the inDir.  if not provided, the files in the inDir will be processed
   * as individual unbundled files
   */
  entryPoint?: string | undefined;

  /**
   * source code
   */
  inDir: string;

  /**
   * build directory
   */
  outDir: string;

  /**
   * build file, relative to the outDir
   */
  outFile?: string | undefined;

  /**
   * external modules to exclude from the bundle
   */
  external?: string[] | undefined;

  /**
   * whether to minify output
   */
  minify?: boolean | undefined;

  /**
   * whether to include sourcemap
   */
  sourceMap?: boolean | undefined;

  /**
   * working directory
   */
  workingDirectory?: string | undefined;
}

/**
 * Recursively obtains all files in a directory
 * @param {string} directory
 * @returns {Promise<string[]>}
 */
async function getFiles(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const result = path.resolve(directory, entry.name);
      return entry.isDirectory() ? getFiles(result) : result;
    }),
  );
  return files.flat();
}

function excludeSourceMaps(filter: RegExp) {
  return (pluginBuild: PluginBuild) => {
    // ignore source maps for any Javascript file that matches filter
    pluginBuild.onLoad({ filter }, async (args) => {
      if (args.path.endsWith('.js') || args.path.endsWith('.mjs')) {
        return {
          contents: `${await fs.readFile(
            args.path,
            'utf8',
          )}\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiJdLCJtYXBwaW5ncyI6IkEifQ==`,
          loader: 'default',
        };
      }
      return undefined;
    });
  };
}

function resolveTypescriptPaths() {
  return (pluginBuild: PluginBuild) => {
    // rewrite paths based on standard node resolution
    pluginBuild.onResolve({ filter: /.*/u }, async (resolved) => {
      if (
        resolved.kind === 'entry-point' ||
        !resolved.path.startsWith('.') ||
        resolved.path.endsWith('.js') ||
        resolved.path.endsWith('.json')
      ) {
        return { external: resolved.kind !== 'entry-point' };
      }
      let isDirectory = false;
      try {
        const stats = await fs.lstat(path.join(resolved.resolveDir, resolved.path));
        isDirectory = stats.isDirectory();
      } catch {
        // do nothing
      }
      let newPath = resolved.path;
      newPath += isDirectory ? `/index.mjs` : `.mjs`;
      // we need to trim the .ts out, now that "allowImportingTsExtensions": true
      if (newPath.endsWith('.ts.mjs')) {
        newPath = `${newPath.slice(0, -'.ts.mjs'.length)}.mjs`;
      }
      return { path: newPath, external: true };
    });
  };
}

// eslint-disable-next-line max-lines-per-function
export default async function ({
  type,
  entryPoint,
  inDir,
  outDir,
  outFile,
  external = [],
  minify = false,
  sourceMap,
  workingDirectory = process.cwd(),
}: CompileOptions): Promise<CompileResult> {
  const messages: string[] = [];

  assert.ok(
    (entryPoint === undefined && outFile === undefined) || (entryPoint !== undefined && outFile !== undefined),
    'entryPoint and outFile must both be provided',
  );

  const allSourceFiles = await getFiles(inDir);
  const productionSourceFiles =
    entryPoint === undefined ? allSourceFiles.filter((file) => file.endsWith('.ts')) : [path.join(inDir, entryPoint)];

  /**
   * Emit declarations using typescript compiler if the type is 'types'.  Otherwise, compile to ensure the build is good.
   */
  const program = typescript.createProgram(productionSourceFiles, {
    module: typescript.ModuleKind.ESNext,
    target: typescript.ScriptTarget.ESNext,
    moduleResolution: typescript.ModuleResolutionKind.Bundler,
    sourceMap: true,
    inlineSources: true,
    declaration: true,
    removeComments: false,
    noLib: false,
    noEmitOnError: true,
    skipLibCheck: true,
    strict: true,
    preserveConstEnums: true,
    noImplicitReturns: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    alwaysStrict: true,
    verbatimModuleSyntax: true,
    forceConsistentCasingInFileNames: true,
    emitDecoratorMetadata: true,
    experimentalDecorators: true,
    resolveJsonModule: true,
    esModuleInterop: true,
    noUncheckedIndexedAccess: true,
    noPropertyAccessFromIndexSignature: true,
    allowUnusedLabels: false,
    allowUnreachableCode: false,
    noImplicitOverride: true,
    useUnknownInCatchVariables: true,
    exactOptionalPropertyTypes: true,
    isolatedDeclarations: false,
    allowImportingTsExtensions: true,
    noUncheckedSideEffectImports: true,
    erasableSyntaxOnly: true,
    libReplacement: false,
    noEmit: type !== 'types',
    emitDeclarationOnly: type === 'types',
    rootDir: inDir,
    outDir,
  });
  const declarationFiles: OutputFile[] = [];
  const emitResult = program.emit(undefined, (fileName, data) => {
    declarationFiles.push({ path: fileName, text: data });
  });
  const allDiagnostics = typescript.sortAndDeduplicateDiagnostics([
    ...typescript.getPreEmitDiagnostics(program),
    ...emitResult.diagnostics,
  ]);
  for (const diagnostic of allDiagnostics) {
    if (diagnostic.file) {
      assert.ok(diagnostic.start !== undefined);
      const { line, character } = typescript.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
      const message = typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
      messages.push(`tsc: ${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
    } else {
      messages.push(`tsc: ${typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
    }
  }

  if (messages.length > 0) {
    throw new Error(`tsc failed ${JSON.stringify(messages)}`);
  }

  if (type === 'types') {
    return {
      outputFiles: declarationFiles,
    };
  }

  /**
   * Emit ESM javascript using esbuild
   */
  const buildResult = await build({
    entryPoints: productionSourceFiles,
    bundle: true,
    minify,
    absWorkingDir: workingDirectory,
    platform: 'node',
    format: 'esm',
    treeShaking: true,
    write: false,
    metafile: outFile !== undefined,
    sourcesContent: false,
    logLevel: 'error',
    banner:
      outFile === undefined
        ? {}
        : {
            js: commonJsCompatabilityBanner,
          },
    sourcemap: sourceMap === true ? 'inline' : false,
    ...(outFile === undefined
      ? {
          // individual files
          outdir: outDir,
          outExtension: { '.js': '.mjs' },
          plugins: [
            {
              name: 'resolve-typescript-paths',
              setup: resolveTypescriptPaths(),
            },
          ],
        }
      : {
          // bundling
          outfile: path.join(outDir, outFile),
          legalComments: 'none',
          external,
          plugins: [
            {
              name: 'exclude-source-maps',
              setup: excludeSourceMaps(/node_modules/u),
            },
          ],
        }),
  });

  messages.push(...buildResult.errors.map((error) => `esbuild error: ${error.text}`));
  if (messages.length > 0) {
    throw new Error(`esbuild failed ${JSON.stringify(messages)}`);
  }

  return buildResult;
}
