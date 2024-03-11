// test/lib/es2023.spec.ts

import { strict as assert } from 'node:assert';

import { describe, it } from '../describe-it';

describe('supports es2023', () => {
  it('supports Array.findLastIndex (from es2023.array)', async () => {
    assert.equal(
      ['a', 'b', 'c'].findLastIndex((value) => value === 'b'),
      1,
    );
  });
});
