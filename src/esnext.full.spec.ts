// esnext.full.spec.ts

import { strict as assert } from 'node:assert';

describe('esnext.full.d.ts library', () => {
  it('should allow Headers to be iterable (from dom.iterable)', async () => {
    for (const [key, value] of new Headers({ hello: 'world' })) {
      assert.equal(key, 'hello');
      assert.equal(value, 'world');
    }
  });

  it('supports String.findLastIndex (from es2023.array)', async () => {
    assert.equal(
      ['a', 'b', 'c'].findLastIndex((value) => value === 'b'),
      1
    );
  });
});
