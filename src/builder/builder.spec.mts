// builder/builder.spec.mts

import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { v4 as uuid } from 'uuid';

// @ts-expect-error
import builder from './builder.mts';

const singleModule = {
  [`index.ts`]: `export const hello = 'world';`,
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
  it('should build a single ESM module', async () => {
    const id = uuid();
    const inDir = path.join(os.tmpdir(), `in-dir-${id}`);
    const outDir = path.join(os.tmpdir(), `out-dir-${id}`);
    await write(inDir, singleModule);
    await builder({ inDir, outDir });
    assert.deepEqual(await read(outDir), {
      'index.d.ts': 'export declare const hello = "world";\n',
      'index.mjs': 'var hello = "world";\nexport {\n  hello\n};\n',
    });
  });
});
