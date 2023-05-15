// builder/builder.mts

import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import typescript from 'typescript';

import { PluginBuild, build } from 'esbuild';

export interface BuilderOptions {
  type: 'module' | 'commonjs';
  inDir: string;
  outDir: string;
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

function setup(pluginBuild: PluginBuild) {
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
    newPath += isDirectory ? `/index.mjs` : `.mjs`;
    return { path: newPath, external: true };
  });
}

// eslint-disable-next-line func-names,max-lines-per-function,max-statements
export default async function ({ type, inDir, outDir }: BuilderOptions): Promise<string[]> {
  const messages: string[] = [];

  /**
   * Emit declarations using typescript compiler
   */
  const allSourceFiles = await getFiles(inDir);
  const productionSourceFiles = allSourceFiles.filter(
    //  && !file.endsWith('.test.ts') && !file.endsWith('.spec.ts')
    (file) => file.endsWith('.ts')
  );

  const configFile = typescript.readConfigFile('./tsconfig.json', (name) => typescript.sys.readFile(name));
  const compilerOptions = typescript.parseJsonConfigFileContent(configFile.config, typescript.sys, './');

  const program = typescript.createProgram(productionSourceFiles, {
    ...compilerOptions.options,
    noEmitOnError: true,
    emitDeclarationOnly: true,
    rootDir: inDir,
    outDir,
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
    platform: 'node',
    format: type === 'module' ? 'esm' : 'cjs',
    outdir: outDir,
    sourcemap: 'inline',
    sourcesContent: false,
    outExtension: { '.js': type === 'module' ? '.mjs' : '.cjs' },
    plugins: [
      {
        name: 'resolve-ts',
        setup,
      },
    ],
  });

  messages.push(...buildResult.errors.map((error) => `esbuild error: ${error.text}`));
  messages.push(...buildResult.warnings.map((warning) => `esbuild warning: ${warning.text}`));
  if (messages.length > 0) {
    throw new Error(`esbuild failed ${JSON.stringify(messages)}`);
  }
  return messages;
}
