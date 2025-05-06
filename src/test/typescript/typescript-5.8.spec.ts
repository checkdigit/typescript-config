// test/typescript/typescript-5.8.spec.ts

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

describe('typescript-5.8', () => {
  it('granular checks for branches in return expressions', () => {
    const untypedCache = new Map();
    function getUrlObject(urlString: string): URL {
      return untypedCache.has(urlString)
        ? untypedCache.get(urlString)
        : // @ts-expect-error Type 'string' is not assignable to type 'URL'.
          urlString;
    }
    assert.equal(getUrlObject('hello'), 'hello');
  });
});
