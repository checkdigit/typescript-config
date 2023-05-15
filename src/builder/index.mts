// builder/index.mts

import { strict as assert } from 'node:assert';
import path from 'node:path';
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

const messages = await builder({ inDir: path.join(process.cwd(), inDir), outDir: path.join(process.cwd(), outDir) });
if (messages.length > 0) {
  // eslint-disable-next-line no-console
  console.warn(JSON.stringify(messages, undefined, 2));
  process.exit(1);
}
