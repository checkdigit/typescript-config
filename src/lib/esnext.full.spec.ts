// lib/esnext.full.spec.ts

import { strict as assert } from 'node:assert';

import { describe, it } from '../describe-it';

describe('supports esnext.full', () => {
  it('should allow Headers to be iterable (from dom.iterable)', async () => {
    for (const [key, value] of new Headers({ hello: 'world' })) {
      assert.equal(key, 'hello');
      assert.equal(value, 'world');
    }
  });
});
