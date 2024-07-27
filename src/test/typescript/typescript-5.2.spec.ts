// test/typescript/typescript-5.2.ts

import { strict as assert } from 'node:assert';

import { describe, it } from '../describe-it';

describe('typescript-5.2', () => {
  it('has explicit resource management (but not testing "using" keyword)', () => {
    let disposed = false;

    // currently Node.js does not support "using", but the compiler will still fail pre-5.2 on the Symbol.dispose
    function maybeThrowAnError(error: boolean) {
      const /* using */ disposable = {
          [Symbol.dispose]() {
            disposed = true;
          },
        };
      assert.ok(typeof disposable === 'object');
      try {
        if (error) {
          throw new Error('oops');
        }
      } finally {
        // once we can use "using", we can remove the try/finally
        disposable[Symbol.dispose]();
      }
    }

    maybeThrowAnError(false);
    assert.equal(disposed, true);
    disposed = false;
    assert.throws(() => maybeThrowAnError(true));
    assert.equal(disposed, true);
  });

  it('supports named and anonymous tuple elements', () => {
    // pre 5.2, couldn't mix named and unnamed tuple elements
    type TwoOrMore<T> = [first: T, second: T, ...T[]];
    const thing: TwoOrMore<boolean> = [true, false, true];
    assert.equal(thing[0], true);
  });

  it('has easier method usage for unions of arrays', () => {
    const arrayOfStringOrNumberThings: string[] | number[] = [];
    // use of the filter method here would have been an "expression not callable" error before 5.2
    const result = arrayOfStringOrNumberThings.filter((item) => typeof item === 'string');
    assert.deepEqual(result, []);
  });
});
