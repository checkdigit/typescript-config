// test/lib/es2026.spec.ts

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

await (process.version < 'v24' ? describe.skip : describe)('es2026', () => {
  // https://github.com/tc39/proposal-is-error
  it('supports Error.isError', async () => {
    // @ts-expect-error an error in TypeScript 5.8/7, but valid in 5.9
    assert.ok(typeof Error.isError === 'function');
  });
});
