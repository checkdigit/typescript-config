// builder/index.mts

import { parseArgs } from 'node:util';

// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error
// eslint-disable-next-line sort-imports
import builder from './builder';

const {
  values: { inDir, outDir },
} = parseArgs({
  options: {
    inDir: { type: 'string', short: 'i', default: 'src' },
    outDir: { type: 'string', short: 'o', default: 'build' },
  },
});

// eslint-disable-next-line @typescript-eslint/no-unsafe-call,@typescript-eslint/non-nullable-type-assertion-style
await builder(inDir as string, outDir as string);
