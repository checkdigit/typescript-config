// builder/analyze.spec.mts

import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { v4 as uuid } from 'uuid';

/*
 * The below imports work, but tsc complains:
 * TS5097: An import path can only end with a .mts extension when allowImportingTsExtensions is enabled
 *
 * This will be fixed once this library can be 100% ESM and all the .mts files are converted to .ts.
 */

// @ts-expect-error
import builder from './builder.mts';

// @ts-expect-error
import analyze from './analyze.mts';

const twoModules = {
  [`index.ts`]: `import { hello } from './thing';\nexport default hello + 'world';\n`,
  [`thing.ts`]: `export const hello = 'world';`,
};

const importExternalModule = {
  [`index.ts`]: `
import { hello as test } from 'test-esm-module';
import util from 'node:util';
export const hello = { test, message: util.format('hello %s', 'world') };
`,
};

const testNodeModules = {
  [`test-cjs-module`]: {
    source: {
      [`index.js`]: `module.exports.goodbye = 'world';`,
      [`index.d.ts`]: `export declare const goodbye = "world";\n`,
    },
  },
  [`test-esm-module`]: {
    type: 'module',
    source: {
      [`index.js`]: `export const hello = 'world';`,
      [`index.d.ts`]: `export declare const hello = "world";\n`,
    },
  },
} as const;

interface NodeModule {
  [name: string]: {
    type?: 'module' | 'commonjs';
    source: {
      [file: string]: string;
    };
  };
}

async function writeNodeModules(directory: string, nodeModules: NodeModule) {
  const nodeModulesDirectory = path.join(directory, 'node_modules');
  for (const [name, nodeModule] of Object.entries(nodeModules)) {
    const nodeModuleDirectory = path.join(nodeModulesDirectory, name);
    await fs.mkdir(nodeModuleDirectory, { recursive: true });
    await fs.writeFile(
      path.join(nodeModuleDirectory, 'package.json'),
      JSON.stringify({
        type: nodeModule.type ?? 'commonjs',
      }),
    );
    for (const [file, content] of Object.entries(nodeModule.source)) {
      await fs.writeFile(path.join(nodeModuleDirectory, file), content);
    }
  }
}

async function writeInput(directory: string, files: Record<string, string>): Promise<void> {
  await fs.mkdir(directory, { recursive: true });
  await Promise.all(Object.entries(files).map(([name, content]) => fs.writeFile(path.join(directory, name), content)));
}

describe('analyze', () => {
  it('should bundle an ESM module that imports a second ESM module', async () => {
    const id = uuid();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, twoModules);
    const result = await builder({ type: 'module', entryPoint: 'index.ts', outFile: 'index.mjs', inDir, outDir });
    assert.ok(result.metafile !== undefined);
    const analysis = analyze(result.metafile);
    assert.ok(analysis.moduleBytes === 0);
    assert.ok(analysis.sourceBytes > 0);
    assert.ok(analysis.totalBytes > analysis.sourceBytes + analysis.moduleBytes);
  });

  it('should bundle an ESM module that imports external modules', async () => {
    const id = uuid();
    const moduleDir = path.join(os.tmpdir(), `in-dir-${id}`);
    const inDir = path.join(moduleDir, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, importExternalModule);
    await writeNodeModules(moduleDir, testNodeModules);
    const result = await builder({
      type: 'module',
      entryPoint: 'index.ts',
      outFile: 'index.mjs',
      workingDirectory: moduleDir,
      inDir,
      outDir,
    });
    assert.ok(result.metafile !== undefined);
    const analysis = analyze(result.metafile);
    assert.ok(analysis.sourceBytes > 0);
    assert.ok(analysis.moduleBytes > 0);
    assert.ok(analysis.totalBytes > analysis.sourceBytes + analysis.moduleBytes);
  });

  it('should bundle an ESM module that imports external modules, but excludes them', async () => {
    const id = uuid();
    const moduleDir = path.join(os.tmpdir(), `in-dir-${id}`);
    const inDir = path.join(moduleDir, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, importExternalModule);
    await writeNodeModules(moduleDir, testNodeModules);
    const result = await builder({
      type: 'module',
      entryPoint: 'index.ts',
      outFile: 'index.mjs',
      inDir,
      outDir,
      external: ['*'],
    });
    assert.ok(result.metafile !== undefined);
    const analysis = analyze(result.metafile);
    assert.ok(analysis.moduleBytes === 0);
    assert.ok(analysis.sourceBytes > 0);
    assert.ok(analysis.totalBytes > analysis.sourceBytes + analysis.moduleBytes);
  });
});
