// compile.spec.ts

import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { describe, it } from 'node:test';

import compile from './compile.ts';

const commonJsCompatabilityBanner = `import { createRequire as __createRequire } from "node:module";
const __filename = import.meta.filename;
const require = __createRequire(import.meta.url);`;

const dirnameInject = `var __dirname = import.meta.dirname;`;

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
  it('should require an entry point and output file together', async () => {
    const id = crypto.randomUUID();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`);
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`);
    for (const options of [
      { entryPoint: 'index.ts' },
      { outFile: 'index.mjs' },
    ]) {
      await assert.rejects(
        compile({ type: 'module', inDir, outDir, ...options }),
        { message: 'entryPoint and outFile must both be provided' },
      );
    }
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

  it('should include nested type errors in diagnostic messages', async () => {
    const id = crypto.randomUUID();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`);
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`);
    await writeInput(inDir, {
      'index.ts': `const value: { nested: { count: string } } = { nested: { count: 'wrong' } };
export const incompatible: { nested: { count: number } } = value;`,
    });
    await assert.rejects(compile({ type: 'module', inDir, outDir }), {
      message: `tsc failed ${JSON.stringify([
        `tsc: ${inDir}/index.ts (2,14): Type '{ nested: { count: string; }; }' is not assignable to type '{ nested: { count: number; }; }'.\n` +
          `  The types of 'nested.count' are incompatible between these types.\n` +
          `    Type 'string' is not assignable to type 'number'.`,
      ])}`,
    });
  });

  it('should report a missing entry point without a source location', async () => {
    const id = crypto.randomUUID();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`);
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`);
    await writeInput(inDir, {});
    await assert.rejects(
      compile({
        type: 'module',
        entryPoint: 'missing.ts',
        outFile: 'index.mjs',
        inDir,
        outDir,
      }),
      {
        message: `tsc failed ${JSON.stringify([
          `tsc: File '${inDir}/missing.ts' not found.\n` +
            `  The file is in the program because:\n` +
            `    Root file specified for compilation`,
        ])}`,
      },
    );
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

  it('should include an inline source map without source content', async () => {
    const id = crypto.randomUUID();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, singleModule);
    const { outputFiles } = await compile({
      type: 'module',
      inDir,
      outDir,
      sourceMap: true,
      workingDirectory: inDir,
    });
    assert.equal(outputFiles.length, 1);
    const inlineMap =
      /\/\/# sourceMappingURL=data:application\/json;base64,(?<sourceMap>[^\n]+)/u.exec(
        outputFiles[0]!.text,
      )?.groups?.['sourceMap'];
    assert.ok(inlineMap);
    const sourceMap = JSON.parse(
      Buffer.from(inlineMap, 'base64').toString('utf8'),
    );
    assert.equal(sourceMap.version, 3);
    assert.deepEqual(sourceMap.sources, [
      path.relative(outDir, await fs.realpath(path.join(inDir, 'index.ts'))),
    ]);
    assert.equal(sourceMap.sourcesContent, undefined);
    assert.notEqual(sourceMap.mappings, '');
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
        `${commonJsCompatabilityBanner}\n\n` +
        `${dirnameInject}\n\n` +
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

  it('should build nested modules and resolve directory and TypeScript imports', async () => {
    const id = crypto.randomUUID();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, {
      'index.ts': `export { nested } from './nested';
export { hello } from './thing.ts';`,
      'thing.ts': `export const hello = 'world';`,
      'README.md': 'This file is not TypeScript.',
    });
    await writeInput(path.join(inDir, 'nested'), {
      'index.ts': `export const nested = 'directory';`,
    });
    await writeOutput(await compile({ type: 'module', inDir, outDir }));
    const output = await import(path.join(outDir, 'index.mjs'));
    assert.equal(output.nested, 'directory');
    assert.equal(output.hello, 'world');
    await assert.rejects(fs.access(path.join(outDir, 'README.md')), {
      code: 'ENOENT',
    });
  });

  it('should preserve JavaScript and JSON import paths', async () => {
    const id = crypto.randomUUID();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, {
      'index.ts': `import { hello } from './thing.js';
import data from './data.json' with { type: 'json' };
export const message: string = hello + data.message;`,
      'thing.ts': `export const hello = 'hello ';`,
      'data.json': JSON.stringify({ message: 'world' }),
    });
    const result = await compile({ type: 'module', inDir, outDir });
    const output = convert(result.outputFiles);
    assert.match(output['index.mjs']!, /from "\.\/thing\.js"/u);
    assert.match(output['index.mjs']!, /from "\.\/data\.json"/u);
  });

  it('should bundle an ESM module that declares __dirname', async () => {
    const id = crypto.randomUUID();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, {
      'index.ts': `
const __dirname = 'declared in project';
export const localDirname: string = __dirname;
export { injectedDirname } from './dependency.ts';
`,
      'dependency.ts': `export const injectedDirname: string = __dirname;`,
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

    const output = await import(path.join(outDir, 'index.mjs'));
    assert.equal(output.injectedDirname, await fs.realpath(outDir));
    assert.equal(output.localDirname, 'declared in project');
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
        `${commonJsCompatabilityBanner}\n\n` +
        `${dirnameInject}\n\n` +
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

  it('should bundle .mjs dependencies and their JSON resources', async () => {
    const id = crypto.randomUUID();
    const moduleDir = path.join(os.tmpdir(), `in-dir-${id}`);
    const inDir = path.join(moduleDir, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, importExternalModule);
    await writeNodeModules(moduleDir, {
      'test-esm-module': {
        type: 'module',
        source: {
          'index.js': `export { hello } from './implementation.mjs';`,
          'index.d.ts': `export declare const hello: string;`,
          'implementation.mjs': `import data from './data.json' with { type: 'json' };
export const hello = data.message;`,
          'data.json': JSON.stringify({ message: 'world' }),
        },
      },
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
    const output = await import(path.join(outDir, 'index.mjs'));
    assert.deepEqual(output.hello, {
      message: 'hello world',
      test: 'world',
    });
  });

  it('should report a bundler error in a JavaScript dependency', async () => {
    const id = crypto.randomUUID();
    const moduleDir = path.join(os.tmpdir(), `in-dir-${id}`);
    const inDir = path.join(moduleDir, 'src');
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`, 'build');
    await writeInput(inDir, importExternalModule);
    await writeNodeModules(moduleDir, {
      'test-esm-module': {
        type: 'module',
        source: {
          'index.js': 'export const hello = ;',
          'index.d.ts': 'export declare const hello: string;',
        },
      },
    });
    await assert.rejects(
      compile({
        type: 'module',
        entryPoint: 'index.ts',
        outFile: 'index.mjs',
        inDir,
        outDir,
      }),
      /Build failed with 1 error:[\s\S]*Unexpected ";"/u,
    );
    await assert.rejects(fs.access(outDir), { code: 'ENOENT' });
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
        `${commonJsCompatabilityBanner}\n\n` +
        `${dirnameInject}\n\n` +
        `import { hello as test } from "test-esm-module";\n` +
        `import util from "node:util";\n` +
        `var hello = { test, message: util.format("hello %s", "world") };\n` +
        `export {\n` +
        `  hello\n` +
        `};\n`,
    });
  });
});
