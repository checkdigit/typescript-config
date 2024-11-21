// typescript/typescript-5.3.spec.ts

import { strict as assert } from 'node:assert';

import { describe, it } from '../describe-it.ts';

import packageJson from '../../../package.json' with { type: 'json' };

describe('typescript-5.3', () => {
  it('supports import attributes', async () => {
    const dynamicPackageJson = await import('../../../package.json', { with: { type: 'json' } });
    assert.deepEqual(dynamicPackageJson.default, packageJson);
    assert.equal(dynamicPackageJson.default.description, 'Check Digit standard Typescript configuration');
    assert.equal(dynamicPackageJson.default.name, '@checkdigit/typescript-config');
  });

  it('supports switch (true) narrowing', () => {
    const x: unknown = 'hello world';
    switch (true) {
      case typeof x === 'string': {
        // pre 5.3: error TS18046: 'x' is of type 'unknown'
        assert.equal(x.toUpperCase(), 'HELLO WORLD');
        break;
      }

      case Array.isArray(x): {
        // pre 5.3: error TS18046: 'x' is of type 'unknown'
        assert.equal(x.length, 11);
        break;
      }

      default: {
        // 'x' is unknown
      }
    }
  });

  it('supports narrowing on comparisons to booleans', () => {
    interface A {
      a: string;
    }

    interface B {
      b: string;
    }

    type MyType = A | B;

    function isA(x: MyType): x is A {
      return 'a' in x;
    }

    function test(x: MyType) {
      if (isA(x)) {
        // pre 5.3: error TS2339: Property 'a' does not exist on type 'MyType'
        assert.equal(x.a, 'hello');
      }
    }

    test({ a: 'hello' });
  });
});
