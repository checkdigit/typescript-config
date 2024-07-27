// test/typescript/typescript-5.1.ts

import { strict as assert } from 'node:assert';

import { describe, it } from '../describe-it';

describe('typescript-5.1', () => {
  it('has easier implicit returns', () => {
    // pre 5.1, this would be a "not all code paths return a value" error
    function test(): undefined {
      if (Math.random()) {
        // eslint-disable-next-line no-useless-return
        return;
      }
    }
    assert.ok(test() === undefined);
  });
});
