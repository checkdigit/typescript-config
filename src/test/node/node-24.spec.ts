// test/node/node-24.spec.ts

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

await (process.version < 'v24' ? describe.skip : describe)('node-24', () => {
  it('URLPattern exists as a global', async () => {
    // eslint-disable-next-line no-eval
    assert.equal(eval('typeof URLPattern'), 'function');
  });

  // 24.2+
  it('import.meta.main is available', async () => {
    const importMeta: object = import.meta;
    assert.ok('main' in importMeta);
    assert.ok(typeof importMeta.main === 'boolean');
  });
});
