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

async function write(dir: string, files: Record<string, string>): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
  await Promise.all(Object.entries(files).map(([name, content]) => fs.writeFile(path.join(dir, name), content)));
}

async function read(dir: string): Promise<Record<string, string>> {
  const files = await fs.readdir(dir);
  return Object.fromEntries(
    await Promise.all(
      files.map(async (name) => [
        name,
        (
          await fs.readFile(path.join(dir, name), 'utf-8')
        )
          .split('\n')
          .filter((line) => !line.startsWith('//'))
          .join('\n'),
      ])
    )
  ) as Record<string, string>;
}

describe('test builder', () => {
  it('should not build bad code', async () => {
    const id = uuid();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`);
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`);
    await write(inDir, { 'index.ts': 'bad code' });
    await assert.rejects(builder({ type: 'module', inDir, outDir }), {
      message: `TypeScript compilation failed ${JSON.stringify([
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
    await write(inDir, {});
    assert.deepEqual(await builder({ type: 'module', inDir, outDir }), []);
    await assert.rejects(read(outDir), {
      message: `ENOENT: no such file or directory, scandir '${outDir}'`,
    });
  });

  it('should build a single ESM module', async () => {
    const id = uuid();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await write(inDir, singleModule);
    assert.deepEqual(await builder({ type: 'module', inDir, outDir }), []);
    assert.deepEqual(await read(outDir), {
      'index.d.ts': 'export declare const hello = "world";\n',
      'index.mjs': 'var hello = "world";\nexport {\n  hello\n};\n',
    });

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const output = await import(path.join(outDir, 'index.mjs'));
    assert.equal(output.hello, 'world');
  });

  it('should build a single ESM module that exports function as default', async () => {
    const id = uuid();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await write(inDir, exportDefaultFunctionModule);
    assert.deepEqual(await builder({ type: 'module', inDir, outDir }), []);
    assert.deepEqual(await read(outDir), {
      'index.d.ts': 'export default function (): string;\n',
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
    await write(inDir, exportDefaultFunctionModule);
    assert.deepEqual(await builder({ type: 'commonjs', inDir, outDir }), []);
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
      'index.d.ts': 'export default function (): string;\n',
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
    await write(inDir, twoModules);
    assert.deepEqual(await builder({ type: 'module', inDir, outDir }), []);
    assert.deepEqual(await read(outDir), {
      'index.d.ts': 'declare const _default: string;\nexport default _default;\n',
      'index.mjs':
        'import { hello } from "./thing.mjs";\n' +
        'var src_default = hello + "world";\n' +
        'export {\n' +
        '  src_default as default\n' +
        '};\n',
      'thing.d.ts': 'export declare const hello = "world";\n',
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
    await write(inDir, singleModule);
    assert.deepEqual(await builder({ type: 'commonjs', inDir, outDir }), []);
    assert.deepEqual(await read(outDir), {
      'index.d.ts': 'export declare const hello = "world";\n',
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
    await write(inDir, twoModules);
    assert.deepEqual(await builder({ type: 'commonjs', inDir, outDir }), []);
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
      'index.d.ts': 'declare const _default: string;\nexport default _default;\n',
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
      'thing.d.ts': 'export declare const hello = "world";\n',
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
    await write(inDir, twoModules);
    assert.deepEqual(
      await builder({ type: 'module', entryPoint: 'index.ts', outFile: 'index.mjs', inDir, outDir }),
      []
    );
    assert.deepEqual(await read(outDir), {
      'index.d.ts': 'declare const _default: string;\nexport default _default;\n',
      'index.mjs':
        'var hello = "world";\n' +
        '\n' +
        'var src_default = hello + "world";\n' +
        'export {\n' +
        '  src_default as default\n' +
        '};\n',
      'thing.d.ts': 'export declare const hello = "world";\n',
    });
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const output = await import(path.join(outDir, 'index.mjs'));
    assert.equal(output.default, 'worldworld');
  });
});
