// builder/index.mts

import { strict as assert } from 'node:assert';
import { parseArgs } from 'node:util';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
import builder from './builder.mts';

const {
  values: { inDir, outDir },
} = parseArgs({
  options: {
    inDir: { type: 'string', short: 'i', default: 'src' },
    outDir: { type: 'string', short: 'o', default: 'build' },
  },
});

assert.ok(inDir !== undefined, 'inDir is required');
assert.ok(outDir !== undefined, 'outDir is required');

await builder(inDir, outDir);
