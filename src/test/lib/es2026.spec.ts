// test/lib/es2026.spec.ts

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

await (process.version < 'v24' ? describe.skip : describe)('es2026', () => {
  // https://github.com/tc39/proposal-is-error
  it('supports Error.isError', async () => {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error
    assert.ok(typeof Error.isError === 'function');
  });
});
