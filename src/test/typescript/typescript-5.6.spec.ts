// typescript/typescript-5.6.spec.ts

// import { strict as assert } from 'node:assert';

import { describe, it } from '../describe-it';

// file.only
describe('typescript-5.6', () => {
  it('disallowed nullish and truthy checks', () => {
    // @ts-expect-error
    // eslint-disable-next-line no-constant-condition
    if (/0x[0-9a-f]/u) {
      // this block always runs
    }

    // @ts-expect-error
    // eslint-disable-next-line no-constant-condition
    if ((x) => 0) {
      // this block always runs
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    function isValid(value: string | number, options: any, strictness: 'strict' | 'loose') {
      if (strictness === 'loose') {
        value = Number(value);
      }
      // @ts-ignore
      // eslint-disable-next-line no-constant-binary-expression
      return value < options.max ?? 100;
      // this is parsed as (value < options.max) ?? 100
    }

    // @ts-expect-error
    // eslint-disable-next-line no-constant-binary-expression
    if (isValid(1, {}, 'strict') || isValid(2, {}, 'strict') || isValid(1, {}, 'loose' || isValid(2, {}, 'loose'))) {
      // did we forget a closing ')'?
    }
  });
});
