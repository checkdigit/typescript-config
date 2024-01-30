// typescript/typescript-5.4.spec.ts

import { strict as assert } from 'node:assert';

import { describe, it } from '../describe-it';

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
    // @ts-expect-error
    assert.equal(createStreetLight(['red', 'yellow', 'green'], 'blue'), -1);
  });
});
