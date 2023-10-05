// builder/index.mts

import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import builder from './builder.mts';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import analyze from './analyze.mts';

const {
  values: { type, inDir, outDir, entryPoint, outFile, external, minify, sourceMap },
} = parseArgs({
  options: {
    type: { type: 'string', short: 't', default: 'module' },
    inDir: { type: 'string', short: 'i', default: 'src' },
    outDir: { type: 'string', short: 'o', default: 'build' },
    entryPoint: { type: 'string', short: 'e', default: undefined },
    outFile: { type: 'string', short: 'f', default: undefined },
    external: { type: 'string', short: 'x', multiple: true, default: [] },
    minify: { type: 'boolean', short: 'm', default: false },
    sourceMap: { type: 'boolean', short: 's', default: false },
  },
});

assert.ok(type === 'module' || type === 'commonjs' || type === 'types', 'type must be types, module or commonjs');
assert.ok(inDir !== undefined, 'inDir is required');
assert.ok(outDir !== undefined, 'outDir is required');

const buildResult = await builder({
  type,
  inDir: path.join(process.cwd(), inDir),
  outDir: path.join(process.cwd(), outDir),
  entryPoint,
  outFile,
  external,
  minify,
  sourceMap,
});

// write output files
await Promise.all(
  buildResult.outputFiles.map(async (file) => {
    await fs.mkdir(path.join(path.dirname(file.path)), { recursive: true });
    await fs.writeFile(file.path, file.text);
  }),
);

// write metafile.json
if (buildResult.metafile !== undefined) {
  analyze(buildResult.metafile);
  await fs.writeFile(path.join(outDir, 'metafile.json'), JSON.stringify(buildResult.metafile, undefined, 2));
}
