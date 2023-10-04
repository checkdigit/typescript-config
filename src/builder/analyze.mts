// builder/analyze.mts

import type { Metafile } from 'esbuild';

export default function analyze(metafile: Metafile) {
  // eslint-disable-next-line no-console
  console.log('analyze', Object.keys(metafile));
}
