// lib/es2023.spec.ts

import { strict as assert } from 'node:assert';

describe('supports es2023', () => {
  it('supports String.findLastIndex (from es2023.array)', async () => {
    assert.equal(
      ['a', 'b', 'c'].findLastIndex((value) => value === 'b'),
      1
    );
  });
});
