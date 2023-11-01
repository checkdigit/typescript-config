// builder/builder.spec.mts

import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import { createRequire } from 'node:module';
import os from 'node:os';
import path from 'node:path';

import { v4 as uuid } from 'uuid';

// @ts-expect-error
import builder from './builder.mts';

const require = createRequire(import.meta.url);

const commonJsCompatabilityBanner = `import { createRequire as __createRequire } from "node:module";
import { fileURLToPath as __fileURLToPath } from "node:url";
import { default as __path } from "node:path";
const __filename = __fileURLToPath(import.meta.url);
const __dirname = __path.dirname(__filename);
const require = __createRequire(import.meta.url);`;

const singleModule = {
  [`index.ts`]: `export const hello = 'world';`,
};

const twoModules = {
  [`index.ts`]: `import { hello } from './thing';\nexport default hello + 'world';\n`,
  [`thing.ts`]: `export const hello = 'world';`,
};

const exportDefaultFunctionModule = {
  [`index.ts`]: `export default function () { return 'hello world' }\n`,
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

async function read(dir: string): Promise<Record<string, string>> {
  const files = await fs.readdir(dir);
  return Object.fromEntries(
    await Promise.all(
      files
        .filter((name) => name !== 'metafile.json')
        .map(async (name) => [
          name,
          (await fs.readFile(path.join(dir, name), 'utf-8'))
            .split('\n')
            .filter((line) => !line.startsWith('//'))
            .join('\n'),
        ]),
    ),
  ) as Record<string, string>;
}

async function writeOutput({ outputFiles }: { outputFiles: Array<{ path: string; text: string }> }) {
  return Promise.all(
    outputFiles.map(async (file) => {
      await fs.mkdir(path.join(path.dirname(file.path)), { recursive: true });
      await fs.writeFile(file.path, file.text);
    }),
  );
}

function convert(outputFiles: Array<{ path: string; text: string }>) {
  return Object.fromEntries(
    outputFiles.map((file) => [
      path.basename(file.path),
      file.text
        .split('\n')
        .filter((line) => !line.startsWith('//'))
        .join('\n'),
    ]),
  );
}

describe('test builder', () => {
  it('should not build bad code', async () => {
    const id = uuid();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`);
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`);
    await writeInput(inDir, { 'index.ts': 'bad code' });
    await assert.rejects(builder({ type: 'module', inDir, outDir }), {
      message: `tsc failed ${JSON.stringify([
        `tsc: ${inDir}/index.ts (1,1): Unexpected keyword or identifier.`,
        `tsc: ${inDir}/index.ts (1,1): Cannot find name 'bad'.`,
        `tsc: ${inDir}/index.ts (1,5): Cannot find name 'code'.`,
      ])}`,
    });
    await assert.rejects(read(outDir), {
      message: `ENOENT: no such file or directory, scandir '${outDir}'`,
    });
  });

  it('should not build from bad directory', async () => {
    const id = uuid();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`);
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`);
    await assert.rejects(builder({ type: 'module', inDir, outDir }), {
      message: `ENOENT: no such file or directory, scandir '${inDir}'`,
    });
    await assert.rejects(read(outDir), {
      message: `ENOENT: no such file or directory, scandir '${outDir}'`,
    });
  });

  it('should build from empty directory, but not create output directory', async () => {
    const id = uuid();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`);
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`);
    await writeInput(inDir, {});
    await writeOutput(await builder({ type: 'module', inDir, outDir }));
    await assert.rejects(read(outDir), {
      message: `ENOENT: no such file or directory, scandir '${outDir}'`,
    });
  });

  it('should build types', async () => {
    const id = uuid();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, singleModule);
    const result = await builder({ type: 'types', inDir, outDir });
    assert.deepEqual(convert(result.outputFiles), {
      'index.d.ts': 'export declare const hello = "world";\n',
    });
  });

  it('should build a single ESM module', async () => {
    const id = uuid();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, singleModule);
    await writeOutput(await builder({ type: 'module', inDir, outDir }));
    assert.deepEqual(await read(outDir), {
      'index.mjs': 'var hello = "world";\nexport {\n  hello\n};\n',
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const output = await import(path.join(outDir, 'index.mjs'));
    assert.equal(output.hello, 'world');
  });

  it('should minify a single ESM module', async () => {
    const id = uuid();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, singleModule);
    await writeOutput(await builder({ type: 'module', inDir, outDir, minify: true }));
    assert.deepEqual(await read(outDir), {
      'index.mjs': 'var o="world";export{o as hello};\n',
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const output = await import(path.join(outDir, 'index.mjs'));
    assert.equal(output.hello, 'world');
  });

  it('should build a single ESM module that exports function as default', async () => {
    const id = uuid();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, exportDefaultFunctionModule);
    await writeOutput(await builder({ type: 'module', inDir, outDir }));
    assert.deepEqual(await read(outDir), {
      'index.mjs':
        'function src_default() {\n' +
        '  return "hello world";\n' +
        '}\n' +
        'export {\n' +
        '  src_default as default\n' +
        '};\n',
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const output = await import(path.join(outDir, 'index.mjs'));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    assert.equal(output.default(), 'hello world');
  });

  it('should build a single CJS module that exports function as default', async () => {
    const id = uuid();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, exportDefaultFunctionModule);
    await writeOutput(await builder({ type: 'commonjs', inDir, outDir }));
    assert.deepEqual(await read(outDir), {
      'index.cjs':
        'var __defProp = Object.defineProperty;\n' +
        'var __getOwnPropDesc = Object.getOwnPropertyDescriptor;\n' +
        'var __getOwnPropNames = Object.getOwnPropertyNames;\n' +
        'var __hasOwnProp = Object.prototype.hasOwnProperty;\n' +
        'var __export = (target, all) => {\n' +
        '  for (var name in all)\n' +
        '    __defProp(target, name, { get: all[name], enumerable: true });\n' +
        '};\n' +
        'var __copyProps = (to, from, except, desc) => {\n' +
        '  if (from && typeof from === "object" || typeof from === "function") {\n' +
        '    for (let key of __getOwnPropNames(from))\n' +
        '      if (!__hasOwnProp.call(to, key) && key !== except)\n' +
        '        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });\n' +
        '  }\n' +
        '  return to;\n' +
        '};\n' +
        'var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);\n' +
        '\n' +
        'var src_exports = {};\n' +
        '__export(src_exports, {\n' +
        '  default: () => src_default\n' +
        '});\n' +
        'module.exports = __toCommonJS(src_exports);\n' +
        'function src_default() {\n' +
        '  return "hello world";\n' +
        '}\n',
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const output = require(path.join(outDir, 'index.cjs'));
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call
    assert.equal(output.default(), 'hello world');
  });

  it('should build an ESM module that imports a second ESM module', async () => {
    const id = uuid();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, twoModules);
    await writeOutput(await builder({ type: 'module', inDir, outDir }));
    assert.deepEqual(await read(outDir), {
      'index.mjs':
        'import { hello } from "./thing.mjs";\n' +
        'var src_default = hello + "world";\n' +
        'export {\n' +
        '  src_default as default\n' +
        '};\n',
      'thing.mjs': 'var hello = "world";\nexport {\n  hello\n};\n',
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const output = await import(path.join(outDir, 'index.mjs'));
    assert.equal(output.default, 'worldworld');
  });

  it('should build a single CJS module', async () => {
    const id = uuid();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, singleModule);
    const result = await builder({ type: 'commonjs', inDir, outDir });
    assert.deepEqual(convert(result.outputFiles), {
      'index.cjs':
        'var __defProp = Object.defineProperty;\n' +
        'var __getOwnPropDesc = Object.getOwnPropertyDescriptor;\n' +
        'var __getOwnPropNames = Object.getOwnPropertyNames;\n' +
        'var __hasOwnProp = Object.prototype.hasOwnProperty;\n' +
        'var __export = (target, all) => {\n' +
        '  for (var name in all)\n' +
        '    __defProp(target, name, { get: all[name], enumerable: true });\n' +
        '};\n' +
        'var __copyProps = (to, from, except, desc) => {\n' +
        '  if (from && typeof from === "object" || typeof from === "function") {\n' +
        '    for (let key of __getOwnPropNames(from))\n' +
        '      if (!__hasOwnProp.call(to, key) && key !== except)\n' +
        '        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });\n' +
        '  }\n' +
        '  return to;\n' +
        '};\n' +
        'var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);\n' +
        '\n' +
        'var src_exports = {};\n' +
        '__export(src_exports, {\n' +
        '  hello: () => hello\n' +
        '});\n' +
        'module.exports = __toCommonJS(src_exports);\n' +
        'var hello = "world";\n' +
        '0 && (module.exports = {\n' +
        '  hello\n' +
        '});\n',
    });
  });

  it('should build a CJS module that requires a second CJS module', async () => {
    const id = uuid();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, twoModules);
    await writeOutput(await builder({ type: 'commonjs', inDir, outDir }));
    assert.deepEqual(await read(outDir), {
      'index.cjs':
        'var __defProp = Object.defineProperty;\n' +
        'var __getOwnPropDesc = Object.getOwnPropertyDescriptor;\n' +
        'var __getOwnPropNames = Object.getOwnPropertyNames;\n' +
        'var __hasOwnProp = Object.prototype.hasOwnProperty;\n' +
        'var __export = (target, all) => {\n' +
        '  for (var name in all)\n' +
        '    __defProp(target, name, { get: all[name], enumerable: true });\n' +
        '};\n' +
        'var __copyProps = (to, from, except, desc) => {\n' +
        '  if (from && typeof from === "object" || typeof from === "function") {\n' +
        '    for (let key of __getOwnPropNames(from))\n' +
        '      if (!__hasOwnProp.call(to, key) && key !== except)\n' +
        '        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });\n' +
        '  }\n' +
        '  return to;\n' +
        '};\n' +
        'var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);\n' +
        '\n' +
        'var src_exports = {};\n' +
        '__export(src_exports, {\n' +
        '  default: () => src_default\n' +
        '});\n' +
        'module.exports = __toCommonJS(src_exports);\n' +
        'var import_thing = require("./thing.cjs");\n' +
        'var src_default = import_thing.hello + "world";\n',
      'thing.cjs':
        'var __defProp = Object.defineProperty;\n' +
        'var __getOwnPropDesc = Object.getOwnPropertyDescriptor;\n' +
        'var __getOwnPropNames = Object.getOwnPropertyNames;\n' +
        'var __hasOwnProp = Object.prototype.hasOwnProperty;\n' +
        'var __export = (target, all) => {\n' +
        '  for (var name in all)\n' +
        '    __defProp(target, name, { get: all[name], enumerable: true });\n' +
        '};\n' +
        'var __copyProps = (to, from, except, desc) => {\n' +
        '  if (from && typeof from === "object" || typeof from === "function") {\n' +
        '    for (let key of __getOwnPropNames(from))\n' +
        '      if (!__hasOwnProp.call(to, key) && key !== except)\n' +
        '        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });\n' +
        '  }\n' +
        '  return to;\n' +
        '};\n' +
        'var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);\n' +
        '\n' +
        'var thing_exports = {};\n' +
        '__export(thing_exports, {\n' +
        '  hello: () => hello\n' +
        '});\n' +
        'module.exports = __toCommonJS(thing_exports);\n' +
        'var hello = "world";\n' +
        '0 && (module.exports = {\n' +
        '  hello\n' +
        '});\n',
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const output1 = require(path.join(outDir, 'index.cjs'));
    assert.equal(output1.default, 'worldworld');

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const output2 = await import(path.join(outDir, 'index.cjs'));
    assert.equal(output2.default.default, 'worldworld');
  });

  it('should bundle an ESM module that imports a second ESM module', async () => {
    const id = uuid();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, twoModules);
    await writeOutput(await builder({ type: 'module', entryPoint: 'index.ts', outFile: 'index.mjs', inDir, outDir }));
    assert.deepEqual(await read(outDir), {
      'index.mjs':
        `${commonJsCompatabilityBanner}\n\n` +
        `var hello = "world";\n` +
        `\n` +
        `var src_default = hello + "world";\n` +
        `export {\n` +
        `  src_default as default\n` +
        `};\n`,
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const output = await import(path.join(outDir, 'index.mjs'));
    assert.equal(output.default, 'worldworld');
  });

  it('should bundle an ESM module that imports external modules', async () => {
    const id = uuid();
    const moduleDir = path.join(os.tmpdir(), `in-dir-${id}`);
    const inDir = path.join(moduleDir, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, importExternalModule);
    await writeNodeModules(moduleDir, testNodeModules);
    await writeOutput(await builder({ type: 'module', entryPoint: 'index.ts', outFile: 'index.mjs', inDir, outDir }));
    assert.deepEqual(await read(outDir), {
      'index.mjs':
        `${commonJsCompatabilityBanner}\n\n` +
        `var hello = "world";\n` +
        `\n` +
        `import util from "node:util";\n` +
        `var hello2 = { test: hello, message: util.format("hello %s", "world") };\n` +
        `export {\n` +
        `  hello2 as hello\n` +
        `};\n`,
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const output = await import(path.join(outDir, 'index.mjs'));
    assert.deepEqual(output.hello, {
      message: 'hello world',
      test: 'world',
    });
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
    assert.deepEqual(convert(result.outputFiles), {
      'index.mjs':
        `${commonJsCompatabilityBanner}\n\n` +
        `import { hello as test } from "test-esm-module";\n` +
        `import util from "node:util";\n` +
        `var hello = { test, message: util.format("hello %s", "world") };\n` +
        `export {\n` +
        `  hello\n` +
        `};\n`,
    });
  });

  it('should bundle a commonjs module that imports external ESM modules', async () => {
    const id = uuid();
    const moduleDir = path.join(os.tmpdir(), `in-dir-${id}`);
    const inDir = path.join(moduleDir, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, importExternalModule);
    await writeNodeModules(moduleDir, testNodeModules);
    await writeOutput(
      await builder({
        type: 'commonjs',
        entryPoint: 'index.ts',
        outFile: 'index.cjs',
        inDir,
        outDir,
      }),
    );
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const output = require(path.join(outDir, 'index.cjs'));
    assert.deepEqual(output.hello, {
      message: 'hello world',
      test: 'world',
    });
  });
});
