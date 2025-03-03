// typescript/typescript-5.4.spec.ts

import { strict as assert } from 'node:assert';
import { describe, it } from 'node:test';

describe('typescript-5.4', () => {
  it('preserved narrowing in closures following last assignments', () => {
    function getUrls(url: string | URL, names: string[]) {
      if (typeof url === 'string') {
        url = new URL(url);
      }
      return names.map((name) => {
        url.searchParams.set('name', name); // this is an error pre-5.4
        return url.toString();
      });
    }
    assert.deepEqual(getUrls('https://example.com', ['foo', 'bar']), [
      'https://example.com/?name=foo',
      'https://example.com/?name=bar',
    ]);
  });

  it('NoInfer utility type', () => {
    function createStreetLight<C extends string>(colors: C[], defaultColor?: NoInfer<C>) {
      return defaultColor === undefined ? undefined : colors.indexOf(defaultColor);
    }
    // @ts-expect-error now an error in 5.4
    assert.equal(createStreetLight(['red', 'yellow', 'green'], 'blue'), -1);
  });

  it('more accurate conditional type constraints', () => {
    type IsArray<T> = T extends unknown[] ? true : false;
    function foo<U extends object>(x: IsArray<U>) {
      // @ts-expect-error now an error in 5.4
      const first: true = x;
      // @ts-expect-error now an error in 5.4
      const second: false = x;
      assert.equal(first, second);
    }
    foo(false);
  });

  it('improved checking against template strings with interpolations', () => {
    function a<T extends { id: string }>() {
      const x: `-${keyof T & string}` = '-id'; // this was an error pre-5.4
      return x;
    }
    assert.equal(a(), '-id');
  });
});
