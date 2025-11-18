// test/lib/es2026.spec.ts

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

describe('es2026', () => {
  // https://github.com/tc39/proposal-is-error
  it('supports Error.isError', async () => {
    assert.ok(typeof Error.isError === 'function');
  });
});
