#!/usr/bin/env node

import { promises as fs } from 'node:fs';
import path from 'node:path';
import url from 'node:url';
import { parseArgs } from 'node:util';

// eslint-disable-next-line import/no-extraneous-dependencies
import { build } from 'esbuild';
// eslint-disable-next-line import/no-extraneous-dependencies
import typescript from 'typescript';

/**
 * Recursively obtains all files in a directory
 * @param {string} directory
 * @returns {Promise<string[]>}
 */
async function getFiles(directory) {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map((entry) => {
      const result = path.resolve(directory, entry.name);
      return entry.isDirectory() ? getFiles(result) : result;
    })
  );
  return files.flat();
}

/**
 * @param {import('esbuild').PluginBuild} pluginBuild
 */
function setup(pluginBuild) {
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

const {
  values: { inDir, outDir },
} = parseArgs({
  options: {
    inDir: { type: 'string', short: 'i', default: 'src' },
    outDir: { type: 'string', short: 'o', default: 'build' },
  },
});

/**
 * Emit declarations using typescript compiler
 */
const sourceDirectory = path.join(process.cwd(), inDir);
const allSourceFiles = await getFiles(sourceDirectory);
const productionSourceFiles = allSourceFiles.filter(
  (file) => file.endsWith('.ts') //  && !file.endsWith('.test.ts') && !file.endsWith('.spec.ts')
);

const configFile = typescript.readConfigFile('./tsconfig.json', typescript.sys.readFile);
const compilerOptions = typescript.parseJsonConfigFileContent(configFile.config, typescript.sys, './');

const program = typescript.createProgram(productionSourceFiles, {
  ...compilerOptions.options,
  noEmitOnError: true,
  emitDeclarationOnly: true,
  rootDir: inDir,
  outDir,
});
const emitResult = program.emit();
const allDiagnostics = [...typescript.getPreEmitDiagnostics(program), ...emitResult.diagnostics];
for (const diagnostic of allDiagnostics) {
  if (diagnostic.file) {
    const { line, character } = typescript.getLineAndCharacterOfPosition(diagnostic.file, diagnostic.start);
    const message = typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
    // eslint-disable-next-line no-console
    console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
  } else {
    // eslint-disable-next-line no-console
    console.log(typescript.flattenDiagnosticMessageText(diagnostic.messageText, '\n'));
  }
}
if (emitResult.emitSkipped) {
  throw new Error('TypeScript compilation failed');
}

/**
 * Emit ESM javascript using esbuild
 */
await build({
  entryPoints: productionSourceFiles,
  bundle: true,
  platform: 'node',
  format: 'esm',
  outdir: outDir,
  sourcemap: 'inline',
  sourcesContent: false,
  outExtension: { '.js': '.mjs' },
  plugins: [
    {
      name: 'resolve-ts',
      setup,
    },
  ],
});
