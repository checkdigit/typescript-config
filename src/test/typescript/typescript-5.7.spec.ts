// typescript/typescript-5.7.spec.ts

import { strict as assert } from 'node:assert';

import { describe, it } from '../describe-it';

describe('typescript-5.7', () => {
  it('checks for never-initialized variables', () => {
    let result: number;
    function foo() {
      // @ts-expect-error Variable 'result' is used before being assigned.
      return result;
    }
    assert.equal(foo(), undefined);
  });
});
