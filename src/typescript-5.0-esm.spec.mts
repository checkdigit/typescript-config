// typescript-5.0-esm.spec.ts

import { strict as assert } from 'node:assert';

import getPort from 'get-port'; // ESM version of get-port

describe('typescript-5.0 ESM', () => {
  it('should work with ESM modules', async () => {
    assert.equal(typeof (await getPort()), 'number');
  });
});
