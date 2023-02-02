// typescript-5.0.spec.ts

import { strict as assert } from 'node:assert';

import { port } from './typescript-5.0';
import moduleDirectory from './module-directory';

describe('typescript-5.0', () => {
  it('should work with module directories', () => {
    assert.equal(moduleDirectory(), 'module-directory');
  });

  it('should work with ESM modules', async () => {
    assert.equal(typeof (await port()), 'number');
  });
});
