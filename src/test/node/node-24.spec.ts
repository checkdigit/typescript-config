// test/node/node-24.spec.ts

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

await (process.version < 'v24' ? describe.skip : describe)('node-24', () => {
  it('URLPattern exists as a global', async () => {
    assert.equal(typeof URLPattern, 'function');
  });

  // 24.2+
  it('import.meta.main is available', async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    assert.ok(typeof import.meta.main === 'boolean');
  });
});
