// test/typescript/typescript-7.1.spec.ts

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

describe('typescript-7.1', () => {
  it('checks constraints on distributed type parameters', () => {
    type Describe<A extends number, B extends A> = `${B} extends ${A}`;
    type Invalid<A extends number, B extends A> = A extends B
      ? never
      : // @ts-expect-error B is constrained to the original union, not each member.
        Describe<A, B>;
    const value: Invalid<0 | 1, 0> = '0 extends 1';
    assert.equal(value, '0 extends 1');
  });
});
