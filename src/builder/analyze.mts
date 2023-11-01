// builder/analyze.mts

// import path from 'node:path';
import { strict as assert } from 'node:assert';

import type { Metafile } from 'esbuild';

export default function analyze(metafile: Metafile) {
  const source = new Set(Object.keys(metafile.inputs).filter((key) => !key.startsWith('node_modules')));
  const modules = new Set(Object.keys(metafile.inputs).filter((key) => key.startsWith('node_modules')));

  const [output] = Object.entries(metafile.outputs);
  assert.ok(output !== undefined);
  const [, bundle] = output;

  const sourceBytes = Object.entries(bundle.inputs).reduce((bytes, [file, value]) => {
    if (source.has(file)) {
      return bytes + value.bytesInOutput;
    }
    return bytes;
  }, 0);

  const moduleBytes = Object.entries(bundle.inputs).reduce((bytes, [file, value]) => {
    if (modules.has(file)) {
      return bytes + value.bytesInOutput;
    }
    return bytes;
  }, 0);

  return {
    sourceBytes,
    moduleBytes,
    totalBytes: bundle.bytes,
  };
}
