// builder.ts

import { strict as assert } from 'node:assert';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { parseArgs } from 'node:util';

import { analyze, compile } from './index.ts';

const {
  values: {
    type,
    inDir,
    outDir,
    entryPoint,
    outFile,
    external,
    minify,
    sourceMap,
  },
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

assert.ok(
  type === 'module' || type === 'types',
  'type must be types or module',
);

const compileResult = await compile({
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
  compileResult.outputFiles.map(async (file) => {
    await fs.mkdir(path.join(path.dirname(file.path)), { recursive: true });
    await fs.writeFile(file.path, file.text);
  }),
);

// write metafile.json
if (compileResult.metafile !== undefined) {
  const analysis = analyze(compileResult.metafile);
  await fs.writeFile(
    path.join(outDir, 'metafile.json'),
    JSON.stringify(compileResult.metafile, undefined, 2),
  );

  // eslint-disable-next-line no-console
  console.log(
    `${outFile}: src ${analysis.sourceBytes}, node_modules ${analysis.moduleBytes}, total ${analysis.totalBytes}`,
  );
}
