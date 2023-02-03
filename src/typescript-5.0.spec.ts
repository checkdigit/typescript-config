// typescript-5.0.spec.ts

import { strict as assert } from 'node:assert';

import getPort from 'get-port'; // ESM version of get-port
import got from 'got'; // CJS version of got

import moduleDefault, { test } from './module';
import moduleDirectory from './module-directory';

describe('typescript-5.0 ESM', () => {
  it('should export default correctly', () => {
    assert.equal(moduleDefault(), 'export default function');
  });

  it('should export test function correctly', () => {
    assert.equal(test(), 'export function test');
  });

  it('should work with module directories', () => {
    assert.equal(moduleDirectory(), 'module-directory-index');
  });

  it('should work with ESM modules', async () => {
    assert.equal(typeof (await getPort()), 'number');
  });

  it('should work with CJS modules', async () => {
    assert.equal(typeof got.put, 'function');
  });
});
