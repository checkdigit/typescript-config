// typescript/typescript-5.7.spec.ts

import { strict as assert } from 'node:assert';

import { describe, it } from '../describe-it';

describe.only('typescript-5.7', () => {
  it('checks for never-initialized variables', () => {
    // eslint-disable-next-line init-declarations
    let result: number;
    function foo() {
      // @ts-expect-error
      return result; // error: Variable 'result' is used before being assigned.
    }
    assert.equal(foo(), undefined);
  });
});
