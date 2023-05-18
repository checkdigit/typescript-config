// builder/builder.mts

import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import typescript from 'typescript';

import { PluginBuild, build } from 'esbuild';

export interface BuilderOptions {
  /**
   * whether to produce ESM or CommonJS code
   */
  type: 'module' | 'commonjs';

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
    })
  );
  return files.flat();
}

function excludeSourceMaps(filter: RegExp) {
  return (pluginBuild: PluginBuild) => {
    // ignore source maps for any Javascript file that matches filter
    pluginBuild.onLoad({ filter }, async (args) => {
      if (args.path.endsWith('.js') || args.path.endsWith('.mjs') || args.path.endsWith('.cjs')) {
        return {
          contents: `${await fs.readFile(
            args.path,
            'utf8'
          )}\n//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIiJdLCJtYXBwaW5ncyI6IkEifQ==`,
          loader: 'default',
        };
      }
      return undefined;
    });
  };
}

function resolveTypescriptPaths(type: 'module' | 'commonjs') {
  const extension = type === 'module' ? 'mjs' : 'cjs';
  return (pluginBuild: PluginBuild) => {
    // rewrite paths based on standard node resolution
    pluginBuild.onResolve({ filter: /.*/u }, async (resolved) => {
      if (resolved.kind === 'entry-point' || !resolved.path.startsWith('.') || resolved.path.endsWith('.js')) {
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
      newPath += isDirectory ? `/index.${extension}` : `.${extension}`;
      return { path: newPath, external: true };
    });
  };
}

// eslint-disable-next-line func-names,max-lines-per-function,max-statements
export default async function ({
  type,
  entryPoint,
  inDir,
  outDir,
  outFile,
  external = [],
  minify = false,
}: BuilderOptions): Promise<string[]> {
  const messages: string[] = [];

  assert.ok(
    (entryPoint === undefined && outFile === undefined) || (entryPoint !== undefined && outFile !== undefined),
    'entryPoint and outFile must both be provided'
  );

  /**
   * Emit declarations using typescript compiler
   */
  const allSourceFiles = await getFiles(inDir);
  const productionSourceFiles =
    entryPoint === undefined ? allSourceFiles.filter((file) => file.endsWith('.ts')) : [path.join(inDir, entryPoint)];

  const program = typescript.createProgram(productionSourceFiles, {
    module: typescript.ModuleKind.ESNext,
    moduleResolution: typescript.ModuleResolutionKind.Bundler,
    target: typescript.ScriptTarget.ESNext,
    declaration: true,
    noEmitOnError: true,
    emitDeclarationOnly: true,
    rootDir: inDir,
    outDir,
    noLib: false,
    skipLibCheck: true,
    strict: true,
    preserveConstEnums: true,
    noImplicitReturns: true,
    noUnusedLocals: true,
    noUnusedParameters: true,
    alwaysStrict: true,
    verbatimModuleSyntax: false,
    noFallthroughCasesInSwitch: true,
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
  });
  const emitResult = program.emit();
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
      // eslint-disable-next-line no-console
      messages.push(`tsc: ${typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
    }
  }
  if (emitResult.emitSkipped) {
    throw new Error(`TypeScript compilation failed ${JSON.stringify(messages)}`);
  }

  /**
   * Emit ESM javascript using esbuild
   */
  const buildResult = await build({
    entryPoints: productionSourceFiles,
    bundle: true,
    minify,
    platform: 'node',
    format: type === 'module' ? 'esm' : 'cjs',
    sourcemap: 'inline',
    sourcesContent: false,
    ...(outFile === undefined
      ? {
          outdir: outDir,
          outExtension: { '.js': type === 'module' ? '.mjs' : '.cjs' },
          plugins: [
            {
              name: 'resolve-typescript-paths',
              setup: resolveTypescriptPaths(type),
            },
          ],
        }
      : {
          outfile: path.join(outDir, outFile),
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
  messages.push(...buildResult.warnings.map((warning) => `esbuild warning: ${warning.text}`));
  if (messages.length > 0) {
    throw new Error(`esbuild failed ${JSON.stringify(messages)}`);
  }
  return messages;
}
