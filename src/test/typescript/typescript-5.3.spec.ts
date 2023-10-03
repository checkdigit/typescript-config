// typescript/typescript-5.3.spec.ts

import { strict as assert } from 'node:assert';

// import packageJson from '../../../package.json' with { type: 'json' };
import { describe, it } from '../../describe-it.test';

describe('typescript-5.3', () => {
  it.skip('supports import attributes', async () => {
    /*
     * Note: esbuild currently does not support import attributes
     * const dynamicPackageJson = await import('../../../package.json', { with: { type: 'json' } });
     * assert.deepEqual(dynamicPackageJson.default, packageJson);
     * assert.equal(dynamicPackageJson.name, '@checkdigit/typescript-config');
     */
  });

  it('supports switch (true) narrowing', () => {
    const x: unknown = 'hello world';
    switch (true) {
      case typeof x === 'string': {
        // pre 5.3: error TS18046: 'x' is of type 'unknown'
        assert.equal(x.toUpperCase(), 'HELLO WORLD');
      }

      case Array.isArray(x): {
        // pre 5.3: error TS18046: 'x' is of type 'unknown'
        assert.equal(x.length, 11);
      }

      default: {
        // 'x' is unknown
      }
    }
  });
});
