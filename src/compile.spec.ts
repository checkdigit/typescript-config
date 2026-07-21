// compile.spec.ts

import { strict as assert } from 'node:assert';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';
import { pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

import compile from './compile.ts';
import { isNodeModulePath } from './commonjs-compatibility.ts';

const execFileAsync = promisify(execFile);

const commonJsCompatibilityInject = `import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
var filename = fileURLToPath(import.meta.url);
var dirname = path.dirname(filename);
var commonJsRequire = createRequire(import.meta.url);`;

const singleModule = {
  [`index.ts`]: `export const hello = 'world';`,
};

const twoModules = {
  [`two-modules.ts`]: `import { hello } from './thing';\nexport default hello + 'world' as string;\n`,
  [`thing.ts`]: `export const hello = 'world';`,
};

const exportDefaultFunctionModule = {
  [`export-default-function-module.ts`]: `export default function () { return 'hello world' }\n`,
};

const importExternalModule = {
  [`index.ts`]: `
import { hello as test } from 'test-esm-module';
import util from 'node:util';
export const hello: {test: string, message: string} = { test, message: util.format('hello %s', 'world') };
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

type NodeModule = Record<
  string,
  {
    type?: 'module' | 'commonjs';
    source: Record<string, string>;
  }
>;

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

async function writeInput(
  directory: string,
  files: Record<string, string>,
): Promise<void> {
  await fs.mkdir(directory, { recursive: true });
  await Promise.all(
    Object.entries(files).map(([name, content]) =>
      fs.writeFile(path.join(directory, name), content),
    ),
  );
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

async function writeOutput({
  outputFiles,
}: {
  outputFiles: { path: string; text: string }[];
}) {
  return Promise.all(
    outputFiles.map(async (file) => {
      await fs.mkdir(path.join(path.dirname(file.path)), { recursive: true });
      await fs.writeFile(file.path, file.text);
    }),
  );
}

async function writeRequireFixture(
  inDir: string,
  outDir: string,
  value: string,
): Promise<void> {
  await writeInput(inDir, {
    'index.ts': `
declare const require: NodeJS.Require;
const runtimeModule: string = './runtime.cjs';
const bundledModule = require('./bundled.cjs') as { value: string };
const concatName: string = 'first';
const templateName: string = 'second';
const indirectRequire = { require }.require;
export const bundledValue: string = bundledModule.value;
export const globValues: string[] = [
  (require('./glob-concat-' + concatName + '.cjs') as { value: string }).value,
  (require(\`./glob-template-\${templateName}.cjs\`) as { value: string }).value,
];
export const propertyValues: string[] = [
  ({ require: () => 'property' }).require(),
  ({ require: () => 'explicit' }).require(),
];
export function loadRuntime(): { value: string } {
  return require(runtimeModule) as { value: string };
}
export function loadIndirect(): { value: string } {
  return indirectRequire(runtimeModule) as { value: string };
}
export function loadExternal(): { value: string } {
  return require('./external.cjs') as { value: string };
}
const resolveDynamic: string = './resolve-dynamic.cjs';
export function resolveTargets(): string[] {
  return [
    require.resolve('./resolve-internal.cjs'),
    require.resolve('./resolve-external.cjs'),
    require.resolve(resolveDynamic),
    require.resolve('./resolve-options.cjs', { paths: [__dirname] }),
  ];
}
interface Dependency { external(): { value: string }; load(): { value: string } }
const cjsDependency = require('./dependency.cjs') as Dependency;
const jsDependency = require('./dependency.js') as Dependency;
const mjsDependency = require('./dependency.mjs') as Dependency;
export function dependencyValues(): string[] {
  return [
    cjsDependency.load().value, cjsDependency.external().value,
    jsDependency.load().value, jsDependency.external().value,
    mjsDependency.load().value, mjsDependency.external().value,
  ];
}
`,
    'bundled.cjs': `module.exports = { value: '${value} bundled' };`,
    'glob-concat-first.cjs': `module.exports = { value: '${value} concat glob' };`,
    'glob-template-second.cjs': `module.exports = { value: '${value} template glob' };`,
    'dependency.cjs': `const name = './dependency-cjs-runtime.cjs'; module.exports = { load: () => require(name), external: () => require('./dependency-cjs-external.cjs') };`,
    'dependency.js': `const name = './dependency-js-runtime.cjs'; module.exports = { load: () => require(name), external: () => require('./dependency-js-external.cjs') };`,
    'dependency.mjs': `const name = './dependency-mjs-runtime.cjs'; export const load = () => require(name); export const external = () => require('./dependency-mjs-external.cjs');`,
  });
  await writeOutput(
    await compile({
      type: 'module',
      entryPoint: 'index.ts',
      outFile: 'index.mjs',
      inDir,
      outDir,
      external: [
        './external.cjs',
        './resolve-external.cjs',
        './dependency-cjs-external.cjs',
        './dependency-js-external.cjs',
        './dependency-mjs-external.cjs',
      ],
    }),
  );
  await writeInput(outDir, {
    'runtime.cjs': `module.exports = { value: '${value} runtime' };`,
    'external.cjs': `module.exports = { value: '${value} external' };`,
    'resolve-internal.cjs': `module.exports = {};`,
    'resolve-external.cjs': `module.exports = {};`,
    'resolve-dynamic.cjs': `module.exports = {};`,
    'resolve-options.cjs': `module.exports = {};`,
    'dependency-cjs-runtime.cjs': `module.exports = { value: '${value} cjs dependency' };`,
    'dependency-js-runtime.cjs': `module.exports = { value: '${value} js dependency' };`,
    'dependency-mjs-runtime.cjs': `module.exports = { value: '${value} mjs dependency' };`,
    'dependency-cjs-external.cjs': `module.exports = { value: '${value} cjs external' };`,
    'dependency-js-external.cjs': `module.exports = { value: '${value} js external' };`,
    'dependency-mjs-external.cjs': `module.exports = { value: '${value} mjs external' };`,
  });
}

function convert(outputFiles: { path: string; text: string }[]) {
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

describe('compile', () => {
  it('should identify node_modules path segments on all platforms', () => {
    assert.equal(isNodeModulePath('/repo/node_modules/package/index.js'), true);
    assert.equal(
      isNodeModulePath('C:\\repo\\node_modules\\package\\index.js'),
      true,
    );
    assert.equal(isNodeModulePath('/repo/node_modules-cache/index.js'), false);
  });

  it('should not build bad code', async () => {
    const id = crypto.randomUUID();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`);
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`);
    await writeInput(inDir, { 'index.ts': 'bad code' });
    await assert.rejects(compile({ type: 'module', inDir, outDir }), {
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
    const id = crypto.randomUUID();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`);
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`);
    await assert.rejects(compile({ type: 'module', inDir, outDir }), {
      message: `ENOENT: no such file or directory, scandir '${inDir}'`,
    });
    await assert.rejects(read(outDir), {
      message: `ENOENT: no such file or directory, scandir '${outDir}'`,
    });
  });

  it('should build from empty directory, but not create output directory', async () => {
    const id = crypto.randomUUID();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`);
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`);
    await writeInput(inDir, {});
    await writeOutput(await compile({ type: 'module', inDir, outDir }));
    await assert.rejects(read(outDir), {
      message: `ENOENT: no such file or directory, scandir '${outDir}'`,
    });
  });

  it('should build types', async () => {
    const id = crypto.randomUUID();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, singleModule);
    const result = await compile({ type: 'types', inDir, outDir });
    assert.deepEqual(convert(result.outputFiles), {
      'index.d.ts': 'export declare const hello = "world";\n',
    });
  });

  it('should build a single ESM module', async () => {
    const id = crypto.randomUUID();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, singleModule);
    await writeOutput(await compile({ type: 'module', inDir, outDir }));
    assert.deepEqual(await read(outDir), {
      'index.mjs': 'var hello = "world";\nexport {\n  hello\n};\n',
    });

    const output = await import(path.join(outDir, 'index.mjs'));
    assert.equal(output.hello, 'world');
  });

  it('should minify a single ESM module', async () => {
    const id = crypto.randomUUID();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, singleModule);
    await writeOutput(
      await compile({ type: 'module', inDir, outDir, minify: true }),
    );
    assert.deepEqual(await read(outDir), {
      'index.mjs': 'var o="world";export{o as hello};\n',
    });

    const output = await import(path.join(outDir, 'index.mjs'));
    assert.equal(output.hello, 'world');
  });

  it('should build a single ESM module that exports function as default', async () => {
    const id = crypto.randomUUID();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, exportDefaultFunctionModule);
    await writeOutput(await compile({ type: 'module', inDir, outDir }));
    assert.deepEqual(await read(outDir), {
      'export-default-function-module.mjs':
        'function export_default_function_module_default() {\n' +
        '  return "hello world";\n' +
        '}\n' +
        'export {\n' +
        '  export_default_function_module_default as default\n' +
        '};\n',
    });

    const output = await import(
      path.join(outDir, 'export-default-function-module.mjs')
    );
    assert.equal(output.default(), 'hello world');
  });

  it('should build an ESM module that imports a second ESM module', async () => {
    const id = crypto.randomUUID();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, twoModules);
    await writeOutput(await compile({ type: 'module', inDir, outDir }));
    assert.deepEqual(await read(outDir), {
      'two-modules.mjs':
        'import { hello } from "./thing.mjs";\n' +
        'var two_modules_default = hello + "world";\n' +
        'export {\n' +
        '  two_modules_default as default\n' +
        '};\n',
      'thing.mjs': 'var hello = "world";\nexport {\n  hello\n};\n',
    });
    const output = await import(path.join(outDir, 'two-modules.mjs'));
    assert.equal(output.default, 'worldworld');
  });

  it('should bundle an ESM module that imports a second ESM module', async () => {
    const id = crypto.randomUUID();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, twoModules);
    await writeOutput(
      await compile({
        type: 'module',
        entryPoint: 'two-modules.ts',
        outFile: 'two-modules.mjs',
        inDir,
        outDir,
      }),
    );
    assert.deepEqual(await read(outDir), {
      'two-modules.mjs':
        `${commonJsCompatibilityInject}\n\n` +
        `var hello = "world";\n` +
        `\n` +
        `var two_modules_default = hello + "world";\n` +
        `export {\n` +
        `  two_modules_default as default\n` +
        `};\n`,
    });
    const output = await import(path.join(outDir, 'two-modules.mjs'));
    assert.equal(output.default, 'worldworld');
  });

  it('should bundle an ESM module that imports external modules', async () => {
    const id = crypto.randomUUID();
    const moduleDir = path.join(os.tmpdir(), `in-dir-${id}`);
    const inDir = path.join(moduleDir, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, importExternalModule);
    await writeNodeModules(moduleDir, testNodeModules);
    await writeOutput(
      await compile({
        type: 'module',
        entryPoint: 'index.ts',
        outFile: 'index.mjs',
        inDir,
        outDir,
      }),
    );
    assert.deepEqual(await read(outDir), {
      'index.mjs':
        `${commonJsCompatibilityInject}\n\n` +
        `var hello = "world";\n` +
        `\n` +
        `import util from "node:util";\n` +
        `var hello2 = { test: hello, message: util.format("hello %s", "world") };\n` +
        `export {\n` +
        `  hello2 as hello\n` +
        `};\n`,
    });
    const output = await import(path.join(outDir, 'index.mjs'));
    assert.deepEqual(output.hello, {
      message: 'hello world',
      test: 'world',
    });
  });

  it('should bundle an ESM module that imports external modules, but excludes them', async () => {
    const id = crypto.randomUUID();
    const moduleDir = path.join(os.tmpdir(), `in-dir-${id}`);
    const inDir = path.join(moduleDir, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, importExternalModule);
    await writeNodeModules(moduleDir, testNodeModules);
    const result = await compile({
      type: 'module',
      entryPoint: 'index.ts',
      outFile: 'index.mjs',
      inDir,
      outDir,
      external: ['*'],
    });
    assert.deepEqual(convert(result.outputFiles), {
      'index.mjs':
        `${commonJsCompatibilityInject}\n\n` +
        `import { hello as test } from "test-esm-module";\n` +
        `import util from "node:util";\n` +
        `var hello = { test, message: util.format("hello %s", "world") };\n` +
        `export {\n` +
        `  hello\n` +
        `};\n`,
    });
  });

  it('should inject CommonJS globals without conflicting with a local __dirname', async () => {
    const id = crypto.randomUUID();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, {
      'index.ts': `
const __dirname = 'declared in project';
const __filename = 'declared filename';
const require = () => 'declared require';
export const declaredDirname: string = __dirname;
export const declaredFilename: string = __filename;
export const declaredRequire: string = require();
export { compatibility } from './compatibility.ts';
`,
      'compatibility.ts': `
const requiredModule = './required.cjs';
export const compatibility: {
  dirname: string;
  filename: string;
  required: { value: string };
} = {
  dirname: __dirname,
  filename: __filename,
  required: require(requiredModule) as { value: string },
};
`,
    });
    await writeOutput(
      await compile({
        type: 'module',
        entryPoint: 'index.ts',
        outFile: 'index.mjs',
        inDir,
        outDir,
      }),
    );
    await fs.writeFile(
      path.join(outDir, 'required.cjs'),
      `module.exports = { value: 'required value' };`,
    );

    const moduleUrl = pathToFileURL(path.join(outDir, 'index.mjs')).href;
    const realOutDir = await fs.realpath(outDir);
    const { stdout } = await execFileAsync(process.execPath, [
      '--input-type=module',
      '--eval',
      `const output = await import(${JSON.stringify(moduleUrl)}); console.log(JSON.stringify({ compatibility: output.compatibility, declaredDirname: output.declaredDirname, declaredFilename: output.declaredFilename, declaredRequire: output.declaredRequire }));`,
    ]);

    assert.deepEqual(JSON.parse(stdout) as unknown, {
      compatibility: {
        dirname: realOutDir,
        filename: path.join(realOutDir, 'index.mjs'),
        required: { value: 'required value' },
      },
      declaredDirname: 'declared in project',
      declaredFilename: 'declared filename',
      declaredRequire: 'declared require',
    });
  });

  it('should isolate runtime require resolution between bundles', async () => {
    const id = crypto.randomUUID();
    const firstInDir = path.join(os.tmpdir(), `first-in-dir-${id}`, 'src');
    const firstOutDir = path.join(os.tmpdir(), `first-out-dir-${id}`, 'build');
    const secondInDir = path.join(os.tmpdir(), `second-in-dir-${id}`, 'src');
    const secondOutDir = path.join(
      os.tmpdir(),
      `second-out-dir-${id}`,
      'build',
    );
    await writeRequireFixture(firstInDir, firstOutDir, 'first');
    await writeRequireFixture(secondInDir, secondOutDir, 'second');

    const firstUrl = pathToFileURL(path.join(firstOutDir, 'index.mjs')).href;
    const secondUrl = pathToFileURL(path.join(secondOutDir, 'index.mjs')).href;
    const { stdout } = await execFileAsync(process.execPath, [
      '--input-type=module',
      '--eval',
      `
const originalRequire = globalThis.require;
const existingRequire = () => ({ value: 'existing global' });
globalThis.require = existingRequire;
const first = await import(${JSON.stringify(firstUrl)});
const second = await import(${JSON.stringify(secondUrl)});
console.log(JSON.stringify({
  firstBundled: first.bundledValue,
  firstDependencies: first.dependencyValues(),
  firstExternal: first.loadExternal().value,
  firstGlobValues: first.globValues,
  firstIndirect: first.loadIndirect().value,
  firstProperties: first.propertyValues,
  firstResolved: first.resolveTargets(),
  firstRuntime: first.loadRuntime().value,
  globalRequireUnchanged: globalThis.require === existingRequire,
  secondBundled: second.bundledValue,
  secondDependencies: second.dependencyValues(),
  secondExternal: second.loadExternal().value,
  secondGlobValues: second.globValues,
  secondIndirect: second.loadIndirect().value,
  secondProperties: second.propertyValues,
  secondResolved: second.resolveTargets(),
  secondRuntime: second.loadRuntime().value,
}));
globalThis.require = originalRequire;
`,
    ]);

    const firstRealOutDir = await fs.realpath(firstOutDir);
    const secondRealOutDir = await fs.realpath(secondOutDir);
    assert.deepEqual(JSON.parse(stdout) as unknown, {
      firstBundled: 'first bundled',
      firstDependencies: [
        'first cjs dependency',
        'first cjs external',
        'first js dependency',
        'first js external',
        'first mjs dependency',
        'first mjs external',
      ],
      firstExternal: 'first external',
      firstGlobValues: ['first concat glob', 'first template glob'],
      firstIndirect: 'first runtime',
      firstProperties: ['property', 'explicit'],
      firstResolved: [
        path.join(firstRealOutDir, 'resolve-internal.cjs'),
        path.join(firstRealOutDir, 'resolve-external.cjs'),
        path.join(firstRealOutDir, 'resolve-dynamic.cjs'),
        path.join(firstRealOutDir, 'resolve-options.cjs'),
      ],
      firstRuntime: 'first runtime',
      globalRequireUnchanged: true,
      secondBundled: 'second bundled',
      secondDependencies: [
        'second cjs dependency',
        'second cjs external',
        'second js dependency',
        'second js external',
        'second mjs dependency',
        'second mjs external',
      ],
      secondExternal: 'second external',
      secondGlobValues: ['second concat glob', 'second template glob'],
      secondIndirect: 'second runtime',
      secondProperties: ['property', 'explicit'],
      secondResolved: [
        path.join(secondRealOutDir, 'resolve-internal.cjs'),
        path.join(secondRealOutDir, 'resolve-external.cjs'),
        path.join(secondRealOutDir, 'resolve-dynamic.cjs'),
        path.join(secondRealOutDir, 'resolve-options.cjs'),
      ],
      secondRuntime: 'second runtime',
    });
  });
});
