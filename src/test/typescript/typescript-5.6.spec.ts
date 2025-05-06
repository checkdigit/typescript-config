// typescript/typescript-5.6.spec.ts

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

describe('typescript-5.6', () => {
  it('disallowed nullish and truthy checks', () => {
    // @ts-expect-error now an error in 5.6
    if (/0x[0-9a-f]/u) {
      // this block always runs
    }

    function isValid(
      value: string | number,
      options: any,
      strictness: 'strict' | 'loose',
    ) {
      if (strictness === 'loose') {
        value = Number(value);
      }
      return value < (options.max ?? 100);
    }

    if (
      isValid(1, {}, 'strict') ||
      isValid(2, {}, 'strict') ||
      // @ts-expect-error now an error in 5.6
      isValid(1, {}, 'loose' || isValid(2, {}, 'loose'))
    ) {
      // did we forget a closing ')'?
    }
  });

  it('iterator helper methods', () => {
    function* positiveIntegers() {
      let i = 1;
      while (true) {
        yield i;
        i += 1;
      }
    }
    const evenNumbers = positiveIntegers().map((x) => x * 2);
    assert.deepEqual([...evenNumbers.take(5)], [2, 4, 6, 8, 10]);
  });

  it('strict built-in iterator checks', () => {
    function* uppercase(iter: Iterator<string, BuiltinIteratorReturn>) {
      while (true) {
        const { value, done } = iter.next();
        // @ts-expect-error now an error in 5.6
        yield value.toUppercase(); // method should be "toUpperCase", value is possibly undefined
        if (done) {
          return;
        }
      }
    }
    assert.throws(() => [...uppercase(['a', 'b', 'c'].values())]);
  });
});
