// typescript/typescript-5.6.spec.ts

import { strict as assert } from 'node:assert';

import { describe, it } from '../describe-it';

// file.only
describe('typescript-5.6', () => {
  it('disallowed nullish and truthy checks', () => {
    // @ts-expect-error
    // eslint-disable-next-line no-constant-condition
    if (/0x[0-9a-f]/u) {
      // this block always runs
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function isValid(value: string | number, options: any, strictness: 'strict' | 'loose') {
      if (strictness === 'loose') {
        value = Number(value);
      }
      return value < (options.max ?? 100);
    }

    // @ts-expect-error
    // eslint-disable-next-line no-constant-binary-expression
    if (isValid(1, {}, 'strict') || isValid(2, {}, 'strict') || isValid(1, {}, 'loose' || isValid(2, {}, 'loose'))) {
      // did we forget a closing ')'?
    }
  });

  (process.version < 'v22' ? it.skip : it)('iterator helper methods (node 22+)', () => {
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
        // @ts-expect-error
        // eslint-disable-next-line @typescript-eslint/no-unsafe-call
        yield value.toUppercase(); // method should be "toUpperCase", value is possibly undefined
        if (done) {
          return;
        }
      }
    }
    // eslint-disable-next-line @typescript-eslint/no-unsafe-return
    assert.throws(() => [...uppercase(['a', 'b', 'c'].values())]);
  });
});
