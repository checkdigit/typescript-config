// test/node/node-24.spec.ts

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

await (process.version < 'v24' ? describe.skip : describe)('node-24', () => {
  it('URLPattern exists as a global', async () => {
    // eslint-disable-next-line no-eval
    assert.equal(eval('typeof URLPattern'), 'function');
  });
});
