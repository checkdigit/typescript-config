// test/typescript/typescript-4.8.ts

import { strict as assert } from 'node:assert';

import { describe, it } from '../describe-it';

describe('typescript-4.8', () => {
  it('has typescript 4.8 features', () => {
    // improved intersection reduction, union compatibility, and narrowing
    // eslint-disable-next-line @typescript-eslint/no-empty-object-type
    function f48(x: unknown, y: {} | null | undefined) {
      // eslint-disable-next-line no-param-reassign
      x = y;
      // eslint-disable-next-line no-param-reassign
      y = x; // works in 4.8
      assert.equal(x, y);
    }
    f48(null, undefined);

    function foo48<T>(x: NonNullable<T>, y: NonNullable<NonNullable<T>>) {
      // eslint-disable-next-line no-param-reassign
      x = y;
      // eslint-disable-next-line no-param-reassign
      y = x; // works in 4.8
      assert.equal(x, y);
    }
    foo48<string>('hello', 'world');

    function throwIfNullable48<T>(value: T): NonNullable<T> {
      if (value === undefined || value === null) {
        throw Error('Nullable value!');
      }
      return value; // works in 4.8
    }
    assert.equal(throwIfNullable48(42), 42);
  });
});
