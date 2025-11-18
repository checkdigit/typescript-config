// test/node/node-24.spec.ts

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

describe('node-24', () => {
  it('URLPattern exists as a global', async () => {
    assert.equal(typeof URLPattern, 'function');
  });

  // 24.2+
  it('import.meta.main is available', async () => {
    assert.ok(typeof import.meta.main === 'boolean');
  });
});
