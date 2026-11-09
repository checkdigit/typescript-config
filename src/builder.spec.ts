// builder.spec.ts

import { strict as assert } from 'node:assert';
import { execFile } from 'node:child_process';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { describe, it, type TestContext } from 'node:test';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';

const execute = promisify(execFile);
const builder = fileURLToPath(new URL('./builder.ts', import.meta.url));

async function createProject(
  context: TestContext,
  files: Record<string, string>,
) {
  // Keep fixtures under the project so the compiler can resolve @types/node.
  const directory = await fs.mkdtemp(
    fileURLToPath(new URL('../.builder-test-', import.meta.url)),
  );
  context.after(() => fs.rm(directory, { recursive: true, force: true }));
  await Promise.all(
    Object.entries(files).map(async ([name, content]) => {
      const file = path.join(directory, name);
      await fs.mkdir(path.dirname(file), { recursive: true });
      await fs.writeFile(file, content);
    }),
  );
  return directory;
}

describe('builder', () => {
  it('should compile nested source files using the default options', async (context) => {
    const directory = await createProject(context, {
      'src/index.ts': `export const answer = 42;`,
      'src/nested/message.ts': `export const message = 'hello';`,
      'src/README.txt': 'This file is not TypeScript.',
    });

    const { stdout } = await execute(process.execPath, [builder], {
      cwd: directory,
    });

    assert.equal(stdout, '');
    assert.deepEqual(
      (
        await fs.readdir(path.join(directory, 'build'), { recursive: true })
      ).sort(),
      ['index.mjs', 'nested', 'nested/message.mjs'],
    );
    const index = await import(
      pathToFileURL(path.join(directory, 'build/index.mjs')).href
    );
    const message = await import(
      pathToFileURL(path.join(directory, 'build/nested/message.mjs')).href
    );
    assert.equal(index.answer, 42);
    assert.equal(message.message, 'hello');
  });

  it('should emit declarations with the short options', async (context) => {
    const directory = await createProject(context, {
      'input/index.ts': `export const answer = 42;`,
    });

    const { stdout } = await execute(
      process.execPath,
      [builder, '-t', 'types', '-i', 'input', '-o', 'declarations'],
      { cwd: directory },
    );

    assert.equal(stdout, '');
    assert.deepEqual(await fs.readdir(path.join(directory, 'declarations')), [
      'index.d.ts',
    ]);
    assert.equal(
      await fs.readFile(
        path.join(directory, 'declarations/index.d.ts'),
        'utf8',
      ),
      'export declare const answer = 42;\n',
    );
  });

  it('should bundle with external modules, minification and source maps', async (context) => {
    const directory = await createProject(context, {
      'input/index.ts': `
import { first } from 'first';
import { second } from 'second';
export const answer: number = first + second;
`,
      'node_modules/first/package.json': '{"type":"module","main":"index.js"}',
      'node_modules/first/index.js': 'export const first = 20;',
      'node_modules/first/index.d.ts': 'export declare const first: number;',
      'node_modules/second/package.json': '{"type":"module","main":"index.js"}',
      'node_modules/second/index.js': 'export const second = 22;',
      'node_modules/second/index.d.ts': 'export declare const second: number;',
    });

    const { stdout } = await execute(
      process.execPath,
      [
        builder,
        '--type=module',
        '--inDir=input',
        '--outDir=output',
        '--entryPoint=index.ts',
        '--outFile=bundle.mjs',
        '--external=first',
        '--external=second',
        '--minify',
        '--sourceMap',
      ],
      { cwd: directory },
    );

    const bundlePath = path.join(directory, 'output/bundle.mjs');
    const bundle = await fs.readFile(bundlePath, 'utf8');
    assert.match(bundle, /from"first"/u);
    assert.match(bundle, /from"second"/u);
    assert.match(bundle, /sourceMappingURL=data:application\/json;base64,/u);
    assert.equal((await import(pathToFileURL(bundlePath).href)).answer, 42);

    const metafile = JSON.parse(
      await fs.readFile(path.join(directory, 'output/metafile.json'), 'utf8'),
    );
    assert.ok(Object.hasOwn(metafile.inputs, 'input/index.ts'));
    assert.equal(
      metafile.outputs['output/bundle.mjs'].bytes,
      Buffer.byteLength(bundle),
    );
    assert.match(
      stdout,
      /^bundle\.mjs: src \d+, node_modules 0, total \d+\n$/u,
    );
  });

  it('should reject unsupported output types', async (context) => {
    const directory = await createProject(context, {});

    await assert.rejects(
      execute(process.execPath, [builder, '--type=invalid'], {
        cwd: directory,
      }),
      /type must be types or module/u,
    );
    assert.deepEqual(await fs.readdir(directory), []);
  });

  it('should fail without writing output when the source has type errors', async (context) => {
    const directory = await createProject(context, {
      'src/index.ts': `export const answer: number = 'incorrect';`,
    });

    await assert.rejects(
      execute(process.execPath, [builder], { cwd: directory }),
      /tsc failed.*Type 'string' is not assignable to type 'number'/u,
    );
    assert.deepEqual(await fs.readdir(directory), ['src']);
  });
});
