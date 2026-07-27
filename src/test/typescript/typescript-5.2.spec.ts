// test/typescript/typescript-5.2.ts

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

describe('typescript-5.2', () => {
  it('supports named and anonymous tuple elements', () => {
    // pre 5.2, couldn't mix named and unnamed tuple elements
    type TwoOrMore<T> = [first: T, second: T, ...T[]];
    const thing: TwoOrMore<boolean> = [true, false, true];
    assert.equal(thing[0], true);
  });

  it('has easier method usage for unions of arrays', () => {
    const arrayOfStringOrNumberThings: string[] | number[] = [];
    // use of the filter method here would have been an "expression not callable" error before 5.2
    const result = arrayOfStringOrNumberThings.filter(
      (item) => typeof item === 'string',
    );
    assert.deepEqual(result, []);
  });
});
